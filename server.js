/* ============================================================
   HarvestWise API proxy — Sarvam AI (Indic chat, TTS, STT)
   + Cognee knowledge graph (per-merchant causal memory)
   Zero dependencies: Node 18+ (global fetch / FormData / Blob).

     node server.js        # http://localhost:8765

   Endpoints
     GET  /api/health          -> { sarvam, chat, tts, stt, cognee, models }
     POST /api/chat            -> { messages[], system?, temperature? } -> { reply }
     POST /api/tts             -> { text, language?, speaker? } -> { audio (base64 wav), mime }
     POST /api/stt             -> raw audio body + ?language=kn-IN -> { transcript }
     GET  /api/cognee/health   -> { cognee, reachable, dataset, base }
     POST /api/cognee/recall   -> { query } -> { text, kind, matches }
     POST /api/cognee/add      -> { text } -> { added, cognified }

   Keys never reach the browser: SARVAM_API_KEY lives in .env,
   COGNEE_BASE_URL / COGNEE_API_KEY live in ~/.cognee/.env.
   ============================================================ */
const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 8765);

/* ---------- tiny .env loader (no dependency) ---------- */
function loadEnv(envPath) {
  const target = envPath || path.join(ROOT, ".env");
  if (!fs.existsSync(target)) return;
  for (const line of fs.readFileSync(target, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(m[1] in process.env)) process.env[m[1]] = val;
  }
}
loadEnv();
/* Cognee tenant credentials live in ~/.cognee/.env (never committed). */
loadEnv(path.join(os.homedir(), ".cognee", ".env"));

const CONFIG = {
  key: process.env.SARVAM_API_KEY || process.env.SARVAM_KEY || "",
  chatUrl: "https://api.sarvam.ai/v1/chat/completions",
  ttsUrl: "https://api.sarvam.ai/text-to-speech",
  sttUrl: "https://api.sarvam.ai/speech-to-text",
  // sarvam-105b is a reasoning model (homework/planning). The conversations
  // variant answers chat turns directly, so it is the right default here.
  chatModel: process.env.SARVAM_CHAT_MODEL || "sarvam-105b-conversations",
  ttsModel: process.env.SARVAM_TTS_MODEL || "bulbul:v3",
  ttsSpeaker: process.env.SARVAM_TTS_SPEAKER || "anushka",
  sttModel: process.env.SARVAM_STT_MODEL || "saaras:v4",
  // Cognee knowledge graph (per-merchant causal memory)
  cogneeBase: (process.env.COGNEE_BASE_URL || "").replace(/\/$/, ""),
  cogneeKey: process.env.COGNEE_API_KEY || "",
  cogneeDataset: process.env.COGNEE_DATASET || "harvestwise",
};

const MAX_JSON = 512 * 1024;
const MAX_AUDIO = 12 * 1024 * 1024;

/* ---------- helpers ---------- */
function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(payload);
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(Object.assign(new Error("payload_too_large"), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

async function readJson(req) {
  const raw = await readBody(req, MAX_JSON);
  if (!raw.length) return {};
  try {
    return JSON.parse(raw.toString("utf8"));
  } catch {
    throw Object.assign(new Error("bad_json"), { status: 400 });
  }
}

function sarvamHeaders(extra = {}) {
  return { "api-subscription-key": CONFIG.key, ...extra };
}

async function readSarvamError(response) {
  try {
    const text = await response.text();
    const parsed = JSON.parse(text);
    return parsed?.error?.message || parsed?.detail || parsed?.message || text.slice(0, 400);
  } catch {
    return `upstream ${response.status}`;
  }
}

function requireKey(res) {
  if (CONFIG.key) return true;
  json(res, 503, {
    error: "no_key",
    message: "SARVAM_API_KEY is not set. Add it to .env and restart `npm run server`.",
  });
  return false;
}

/* ---------- chat ---------- */
const DEFAULT_SYSTEM = `You are HarvestWise, a voice-first restocking copilot for Lakshmi, a vegetable cart vendor in Basavanagudi, Bengaluru.
Speak simply and warmly, like a trusted neighbour. Use English with an occasional Kannada word (Namaskara, sari, anna).
Never invent prices, weather or stock numbers beyond the context you are given.
Keep every reply to at most 3 short sentences, and speak them the way they should be read aloud.`;

async function handleChat(req, res) {
  if (!requireKey(res)) return;
  let body;
  try {
    body = await readJson(req);
  } catch (e) {
    return json(res, e.status || 400, { error: e.message });
  }

  const history = Array.isArray(body.messages) ? body.messages : [];
  const messages = [
    { role: "system", content: body.system || DEFAULT_SYSTEM },
    ...history
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-8)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) })),
  ];

  if (!messages.some((m) => m.role === "user")) {
    return json(res, 400, { error: "no_user_message" });
  }

  const temperature = typeof body.temperature === "number" ? body.temperature : 0.3;
  const requested = body.model || CONFIG.chatModel;
  // A reasoning model can spend the whole budget on reasoning and return
  // null content, so retry once on the conversation model.
  const models = requested === "sarvam-105b-conversations" ? [requested] : [requested, "sarvam-105b-conversations"];

  let lastError = null;
  for (const model of models) {
    try {
      const upstream = await fetch(CONFIG.chatUrl, {
        method: "POST",
        headers: sarvamHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ model, messages, temperature, max_tokens: 500 }),
      });

      if (!upstream.ok) {
        lastError = await readSarvamError(upstream);
        continue;
      }

      const data = await upstream.json();
      const reply = (data?.choices?.[0]?.message?.content || "").trim();
      if (reply) return json(res, 200, { reply, model: data.model || model });
      lastError = "empty_reply";
    } catch (e) {
      lastError = String(e.message || e);
    }
  }

  json(res, 502, { error: "chat_failed", message: lastError || "unknown" });
}

/* ---------- text to speech ---------- */
async function handleTts(req, res) {
  if (!requireKey(res)) return;
  let body;
  try {
    body = await readJson(req);
  } catch (e) {
    return json(res, e.status || 400, { error: e.message });
  }

  const text = String(body.text || "").replace(/\s+/g, " ").trim().slice(0, 2400);
  if (!text) return json(res, 400, { error: "no_text" });

  const language = body.language || "en-IN";
  const attempts = [
    { model: body.model || CONFIG.ttsModel, speaker: body.speaker || CONFIG.ttsSpeaker },
    // some voices are model-specific — retry without a speaker id, then with the stable model
    { model: body.model || CONFIG.ttsModel },
    { model: "bulbul:v3" },
  ];

  let lastError = null;
  for (const attempt of attempts) {
    try {
      const payload = {
        text,
        target_language_code: language,
        model: attempt.model,
        speech_sample_rate: 22050,
      };
      if (attempt.speaker) payload.speaker = attempt.speaker;

      const upstream = await fetch(CONFIG.ttsUrl, {
        method: "POST",
        headers: sarvamHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      });

      if (!upstream.ok) {
        lastError = await readSarvamError(upstream);
        continue;
      }

      const data = await upstream.json();
      const audio = data?.audios?.[0];
      if (!audio) {
        lastError = "no_audio_returned";
        continue;
      }
      return json(res, 200, {
        audio,
        mime: "audio/wav",
        language,
        model: attempt.model,
        speaker: attempt.speaker || null,
      });
    } catch (e) {
      lastError = String(e.message || e);
    }
  }

  json(res, 502, { error: "tts_failed", message: lastError || "unknown" });
}

/* ---------- speech to text ---------- */
async function handleStt(req, res) {
  if (!requireKey(res)) return;

  let audio;
  try {
    audio = await readBody(req, MAX_AUDIO);
  } catch (e) {
    return json(res, e.status || 400, { error: e.message });
  }
  if (!audio.length) return json(res, 400, { error: "no_audio" });

  const url = new URL(req.url, "http://localhost");
  const language = url.searchParams.get("language") || "kn-IN";
  const mode = url.searchParams.get("mode") || "transcribe";

  const mime = (req.headers["content-type"] || "audio/webm").split(";")[0];
  const ext = mime.includes("wav")
    ? "wav"
    : mime.includes("mp4") || mime.includes("m4a")
    ? "m4a"
    : mime.includes("ogg")
    ? "ogg"
    : mime.includes("mpeg")
    ? "mp3"
    : "webm";

  const form = new FormData();
  form.append("file", new Blob([audio], { type: mime }), `speech.${ext}`);
  form.append("model", CONFIG.sttModel);
  form.append("mode", mode);
  if (language && language !== "auto") form.append("language_code", language);

  try {
    const upstream = await fetch(CONFIG.sttUrl, {
      method: "POST",
      headers: sarvamHeaders(),
      body: form,
    });

    if (!upstream.ok) {
      return json(res, upstream.status, {
        error: "sarvam_error",
        message: await readSarvamError(upstream),
      });
    }

    const data = await upstream.json();
    json(res, 200, {
      transcript: (data.transcript || "").trim(),
      language: data.language_code || language,
      model: CONFIG.sttModel,
    });
  } catch (e) {
    json(res, 502, { error: "upstream_unreachable", message: String(e.message || e) });
  }
}

/* ---------- health ---------- */
function handleHealth(res) {
  json(res, 200, {
    ok: true,
    sarvam: Boolean(CONFIG.key),
    chat: Boolean(CONFIG.key),
    tts: Boolean(CONFIG.key),
    stt: Boolean(CONFIG.key),
    cognee: Boolean(CONFIG.cogneeBase && CONFIG.cogneeKey),
    models: { chat: CONFIG.chatModel, tts: CONFIG.ttsModel, stt: CONFIG.sttModel },
    keyHint: CONFIG.key ? CONFIG.key.slice(0, 5) + "…" : null,
  });
}

/* ---------- cognee knowledge graph ----------
   Real Cognee cloud tenant (see ~/.cognee/.env). The key never reaches the
   browser. Flow per the cognee skill: add_text -> cognify -> recall.
   Recall is measured ~12s upstream, so the budget here is generous (60s). */
function requireCognee(res) {
  if (CONFIG.cogneeBase && CONFIG.cogneeKey) return true;
  json(res, 503, {
    error: "no_cognee",
    message: "COGNEE_BASE_URL / COGNEE_API_KEY are not set. Add them to ~/.cognee/.env and restart `npm run server`.",
  });
  return false;
}

function cogneeHeaders(extra = {}) {
  /* Cognee cloud authenticates with X-API-Key (Bearer is rejected as "Malformed token"). */
  return { "X-API-Key": CONFIG.cogneeKey, ...extra };
}

async function cogneeFetch(pathname, body, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs || 30000);
  try {
    const upstream = await fetch(`${CONFIG.cogneeBase}${pathname}`, {
      method: "POST",
      headers: cogneeHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await upstream.text();
    let data = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text.slice(0, 400) };
    }
    return { ok: upstream.ok, status: upstream.status, data };
  } catch (e) {
    return { ok: false, status: 0, data: { error: String((e && e.name) === "AbortError" ? "cognee_timeout" : e.message || e) } };
  } finally {
    clearTimeout(timer);
  }
}

async function handleCogneeHealth(res) {
  if (!requireCognee(res)) return;
  const probe = await cogneeFetch("/api/v1/recall", { query: "health check", datasets: [CONFIG.cogneeDataset] }, 20000);
  json(res, 200, {
    ok: true,
    cognee: true,
    reachable: probe.ok || probe.status === 400 || probe.status === 404,
    dataset: CONFIG.cogneeDataset,
    base: new URL(CONFIG.cogneeBase).host,
  });
}

async function handleCogneeRecall(req, res) {
  if (!requireCognee(res)) return;
  let body;
  try {
    body = await readJson(req);
  } catch (e) {
    return json(res, e.status || 400, { error: e.message });
  }
  const query = String(body.query || "").trim().slice(0, 500);
  if (!query) return json(res, 400, { error: "no_query" });

  const result = await cogneeFetch(
    "/api/v1/recall",
    { query, datasets: [CONFIG.cogneeDataset] },
    60000
  );
  if (!result.ok) {
    return json(res, result.status === 0 ? 504 : 502, {
      error: "cognee_recall_failed",
      message: (result.data && (result.data.error || result.data.detail || result.data.message)) || `upstream ${result.status}`,
    });
  }
  /* Cognee returns an array of graph_completion / chunk objects. */
  const list = Array.isArray(result.data) ? result.data : result.data?.completions || [];
  const best =
    list.find((c) => c && typeof c.text === "string" && c.text.trim()) ||
    (result.data && typeof result.data.text === "string" ? result.data : null);
  json(res, 200, {
    text: best ? best.text : "",
    kind: best ? best.kind || best.search_type || null : null,
    dataset: CONFIG.cogneeDataset,
    matches: list.length,
  });
}

async function handleCogneeAdd(req, res) {
  if (!requireCognee(res)) return;
  let body;
  try {
    body = await readJson(req);
  } catch (e) {
    return json(res, e.status || 400, { error: e.message });
  }
  const text = String(body.text || "").trim().slice(0, 4000);
  if (!text) return json(res, 400, { error: "no_text" });

  const added = await cogneeFetch(
    "/api/v1/add_text",
    { datasetName: CONFIG.cogneeDataset, textData: [text] },
    30000
  );
  if (!added.ok) {
    return json(res, added.status === 0 ? 504 : 502, {
      error: "cognee_add_failed",
      message: (added.data && (added.data.error || added.data.detail || added.data.message)) || `upstream ${added.status}`,
    });
  }
  /* Cognify turns the raw observation into graph nodes/edges. Non-fatal if it fails. */
  const cognified = await cogneeFetch("/api/v1/cognify", { datasets: [CONFIG.cogneeDataset] }, 60000);
  json(res, 200, {
    added: true,
    cognified: Boolean(cognified.ok),
    dataset: CONFIG.cogneeDataset,
  });
}

/* ---------- static: production build (optional) ---------- */
const BUILD = path.join(ROOT, "build");
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".map": "application/json; charset=utf-8",
};

function serveStatic(pathname, res) {
  if (!fs.existsSync(BUILD)) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("No build/ yet — run `npm run build` first, or use `npm start` (CRA dev server proxies /api here).");
    return;
  }
  const rel = pathname === "/" ? "index.html" : decodeURIComponent(pathname).replace(/^\/+/, "");
  let filePath = path.join(BUILD, rel);
  if (!filePath.startsWith(BUILD)) {
    res.writeHead(403).end("forbidden");
    return;
  }
  // SPA fallback
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(BUILD, "index.html");
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" }).end("not found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
}

/* ---------- router ---------- */
const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, "http://localhost");

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204).end();
    return;
  }

  if (pathname === "/api/health" && req.method === "GET") return handleHealth(res);
  if (pathname === "/api/chat" && req.method === "POST") return handleChat(req, res);
  if (pathname === "/api/tts" && req.method === "POST") return handleTts(req, res);
  if (pathname === "/api/stt" && req.method === "POST") return handleStt(req, res);
  if (pathname === "/api/cognee/health" && req.method === "GET") return handleCogneeHealth(res);
  if (pathname === "/api/cognee/recall" && req.method === "POST") return handleCogneeRecall(req, res);
  if (pathname === "/api/cognee/add" && req.method === "POST") return handleCogneeAdd(req, res);

  if (pathname.startsWith("/api/")) {
    return json(res, 404, { error: "not_found", path: pathname });
  }

  serveStatic(pathname, res);
});

server.listen(PORT, () => {
  const on = (flag, label) => console.log(`  ${flag ? "✓" : "–"} ${label}`);
  console.log(`\nHarvestWise API proxy → http://localhost:${PORT}`);
  console.log(`  SARVAM_API_KEY: ${CONFIG.key ? CONFIG.key.slice(0, 5) + "… (configured)" : "NOT SET — add it to .env"}`);
  on(Boolean(CONFIG.key), `chat   · ${CONFIG.chatModel} (+ reasoning fallback)`);
  on(Boolean(CONFIG.key), `tts    · ${CONFIG.ttsModel} / ${CONFIG.ttsSpeaker}`);
  on(Boolean(CONFIG.key), `stt    · ${CONFIG.sttModel}`);
  on(Boolean(CONFIG.cogneeBase && CONFIG.cogneeKey), `cognee · ${CONFIG.cogneeDataset} graph (${CONFIG.cogneeBase ? new URL(CONFIG.cogneeBase).host : "not configured"})`);
  console.log(`  static: ${fs.existsSync(BUILD) ? "build/ (production)" : "none — CRA dev server serves the UI"}\n`);
});
