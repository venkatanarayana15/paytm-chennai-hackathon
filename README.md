# HarvestWise — Paytm × Build for India AI Hackathon (Track 1: Merchant Growth AI)

A Paytm-style landing page in React 19 that opens **HarvestWise**, a voice-first
restocking copilot for a vegetable vendor in Basavanagudi. The copilot is a separate core
page at `/copilot` with its own sidebar workspace — the landing page is the front door and
the investor model lives at `/investors`. The copilot watches rain,
shelf-life, UPI velocity and mandi rates, then **speaks the risk in Tamil or English**
and gates every money action behind her voice.

## Run

```bash
npm install
cp .env.example .env        # then paste your SARVAM_API_KEY
npm start                   # UI on http://localhost:3000
node server.js              # Sarvam proxy on http://localhost:8765
```

`npm run build` produces the production bundle; `server.js` also serves `build/`
when it exists, so a single process can serve the whole demo on port 8765.

Pages: `/` Paytm landing · `/copilot` the HarvestWise copilot (the separate core feature)
· `/investors` investor model. The older `?view=harvest|metrics|landing` query works too, and
browser back/forward moves between pages.

### Without an API key

The app still runs. Chat answers fall back to the deterministic local rule engine,
speech output uses the browser's `speechSynthesis`, and speech input uses
`webkitSpeechRecognition` (Chrome/Edge). The sidebar AI chip shows **Local mode**
instead of **Sarvam live**.

## Deploy on Render

The repo ships a `render.yaml` blueprint. In Render: **New → Blueprint** and select
this repository — the service is created with the right build/start commands.

- Build: `npm install && npm run build` (React bundle)
- Start: `node server.js` (zero-dependency proxy serves `build/` + APIs)
- Health check: `/api/health`
- Set the **SARVAM_API_KEY** secret (from https://dashboard.sarvam.ai) — without it the
  app still runs in local mode. Optional secrets: `COGNEE_BASE_URL`, `COGNEE_API_KEY`
  for the Cognee memory service; model overrides already default in `server.js`.

## Demo path (2 minutes)

1. **Landing** — Paytm nav, hero, quick actions, 11 service tiles, HarvestWise spotlight.
2. **Sign in with a name, a language and your area** (Basavanagudi, Whitefield, …).
   The language becomes the default for UI copy, copilot replies, ASR and TTS, and the
   area drives the Open-Meteo pin and the mandi she quotes; both change anytime in Settings.
3. **Today** — the sidebar-first workspace: morning voice briefing with live rain
   probability, Soundbox player, buy-order with shelf-life risk, and the copilot panel.
4. Tap **⚡ Recalculate with AI** → coriander/palak trimmed by rain risk → approval card.
5. Tap **✓ Yes, send it** → dispatch to Ravi anna, WhatsApp deep link, memory event logged.
6. Ask the copilot anything: *"will it rain today?"*, *"coriander shelf life?"*,
   *"best mandi rate"*, *"what's in my order?"* — or hold the mic and say it in Tamil.
   You can also **change the order by voice**: *"add 2 kg beans"*, *"remove palak"*,
   *"set coriander to 8"* — every edit is confirmed with the exact new total.
7. **"A day with HarvestWise"** — tap 6:30 AM / 9:14 AM / 11:02 AM / 8:30 PM to run the
   Observe → Predict → Act → Learn loop.
8. **Sidebar → Orders / Memory / Settings** for dispatches, the Cognee-style graph and
   consent toggles; **Investor insights** opens the spoilage → take-home model.

## Sidebar (copilot workspace)

| Group | Item | What it does |
| --- | --- | --- |
| Copilot workspace | Today | Briefing, order, approval gate, chat |
| | Orders | Dispatch history, WhatsApp handoffs, ₹149 plan |
| | Memory | Cognee-style knowledge graph and event log |
| | Settings | Consent toggles, language, voice test, reset |
| Copilot capabilities | Morning voice briefing | Plays the day's plan out loud |
| | Smart restock | Runs the rain-aware recalc |
| | Voice approvals | Jumps to the gate before money moves |
| | Investor insights | Spoilage → take-home metrics page |

On mobile the sidebar becomes an off-canvas drawer behind a hamburger, and the copilot
panel moves above the order table so the voice loop is one tap away.

## Copilot skills

The copilot is a deterministic commerce agent first and an LLM second, so a demo can never
show an invented number:

- **Live answers from state** — weather (always naming her area), per-item mandi rate,
  per-item shelf life and risk, the full order with line totals, profit, memory lessons, and
  “why did you trim?” explaining the pending change line by line.
- **Order editing by voice or text** — add / remove / set / increase / reduce on any line,
  including a catalog item that is not in the order yet (real price, real unit). The reply
  carries the new total, and any edit clears a stale pending approval.
- **Numbers guard** — Sarvam answers open questions, then every ₹ figure and % is checked
  against the live state: an invented number, or a weather answer that omits her area, is
  replaced by the deterministic answer. Replies are trimmed to three sentences for TTS.
- **Approval discipline** — only an explicit yes dispatches; “no” restores the exact
  pre-recalculation order, not the seed order.

## Command palette (⌘K / Ctrl+K)

The sidebar search row or ⌘K/Ctrl+K opens a palette that runs the whole workspace from the
keyboard: jump to Today/Orders/Memory/Settings, play the voice briefing, run the rain-aware
restock, open approvals, open investor insights, toggle the rain scenario, switch language,
start the product tour, or hit the mic to ask by voice. Typing free text that matches no
command adds an **Ask copilot: …** row at the end, so a question becomes a chat message.
Arrow keys move, Enter runs, Esc closes.

## Approval inbox

Orders is a live inbox rather than a static list:

- **Filters** with counts — All · Needs approval · Dispatched · Delivered.
- **Pending approvals** appear as an actionable card: Approve & dispatch, or Decline, which
  restores the exact quantities from before the recalculation (not the seed order).
- **Per-dispatch status updates** — Dispatched → In transit → Delivered, one tap each.
- WhatsApp handoff links are kept per dispatch.

## Product tour

Landing has **▶ 60-second tour** in the hero and **▶ Take the tour** in the HarvestWise
spotlight (also `/copilot?tour=1`). It opens the copilot page with a five-step spotlight tour:
sidebar capabilities → voice briefing → copilot → approval inbox → the ₹149 business case.
Skip, Back and Next work, and the tour is also a palette command.

## Honest weather behaviour

The core loop is rain-aware, so it stays truthful in clear weather:

- Rain < 30% → a recalculation changes nothing and creates **no approval gate**; the copilot
  says the order already matches demand and manual quantities stand.
- Rain ≥ 30% → leafy items are trimmed from their base quantity (80%+ halves shelf-life),
  a pending approval is created, and no money moves without an explicit yes.
- A labelled **Simulate 80% rain** chip in the briefing pins the rainy scenario for demos;
  it clears any stale pending approval and can return to the live forecast at any time.

## What actually runs

| Real in the demo | Notes |
| --- | --- |
| Sarvam **saaras:v4** speech-to-text (`/api/stt`) | MediaRecorder clip → transcript → auto-send |
| Sarvam **sarvam-105b-conversations** chat (`/api/chat`) | Only open questions; money actions stay deterministic |
| Sarvam **bulbul:v3** text-to-speech (`/api/tts`) | Base64 WAV played in an `Audio` element; browser voice as fallback |
| Live weather via Open-Meteo | No key required; falls back to a labelled simulated reading |
| Spoilage math: perishability × rain × quantity | Same numbers as the pitch deck |
| Approval gate + WhatsApp `wa.me` handoff | Dispatch text is the real order |
| State in `localStorage` | Name/language, settings, messages, dispatches, memory |

Simulated and labelled as such in the pitch: mandi rate feed, 90-day sales history,
Cognee graph storage and the n8n orchestrator (the UI shows the exact payloads they
would receive).

## Sarvam proxy

`server.js` is dependency-free Node. It loads `.env` manually and exposes:

| Endpoint | Body | Returns |
| --- | --- | --- |
| `GET /api/health` | — | `{ok, sarvam, chat, tts, stt, models, keyHint}` |
| `POST /api/chat` | `{messages, system, temperature}` | `{reply, model}` |
| `POST /api/tts` | `{text, language}` | `{audio: base64 wav, mime, model}` |
| `POST /api/stt` | raw audio, `?language=ta-IN\|en-IN` | `{transcript, model}` |

The key never reaches the browser. Chat retries with `sarvam-105b-conversations` when a
reasoning model returns empty content, and `sarvam-30b` / `sarvam-m` are retired.

## Structure

```
src/
  App.js          Paytm landing page, sign-in modal (name, language, area), view switch
  HarvestWise.jsx Copilot app: sidebar shell, briefing, order, chat, voice, memory
  Metrics.jsx     Investor model: spoilage, take-home, unit economics
  copilot.js      Domain model, spoilage math, reply engine, order edits, guard, Sarvam clients
  i18n.js         English/Tamil strings + voice codes
  styles.css      Design system for landing, app, metrics
server.js         Zero-dependency Sarvam proxy + static build server
legacy/           Original static HTML/CSS/JS prototype (reference only)
.opencode/agent/  Agent playbooks used while building the demo
```

## Verified

- Sarvam chat, TTS and STT round-trips in both languages (English + Tamil).
- Full voice loop in Chrome: mic → MediaRecorder → `/api/stt` → transcript → reply → `/api/tts` playback.
- 25-check workspace run + 22-check copilot run: sign-in area drives weather and replies,
  Settings location switch, voice order edits persist and recompute the total, decline
  restores the order, Tamil shelf answer, no console errors.
- 19-check browser run: sidebar navigation, language switch, chat, TTS, approval gate,
  dispatch, settings voice sample, investor page, no console errors.
- Command palette: ⌘K open, filtered command execution, free-text fallback to the copilot,
  Escape close, sidebar trigger, mic button.
- Approval inbox: pending approve → dispatch count +1, filters, Dispatched → In transit →
  Delivered, decline restores the pre-recalc quantities.
- Core math: at 80% rain coriander 12→6, palak 6→4, tomatoes/beans untouched, preserved
  ₹172 and total ₹836 reconcile with prices; at 0% rain no trim and no approval gate.
- Product tour: opens from the landing hero, steps 1–5 including the inbox switch, skip closes.
- Mobile at 390 px: no horizontal overflow, drawer open/close, copilot-first ordering,
  palette fits the viewport.

## Team

Sairam · Venkata Narayana G V · Malaravan P
