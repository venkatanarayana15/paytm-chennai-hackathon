import React, { useEffect, useRef, useState } from "react";
import {
  MERCHANT,
  defaultState,
  recalculate,
  buildReply,
  guardReply,
  seedOrder,
  briefingScript,
  effectiveShelfHours,
  shelfLabel,
  riskFor,
  orderTotal,
  rainProb,
  predictPurchases,
  suggestionEmailBody,
  velocityFor,
  orderHistoryFromLedger,
  checkAi,
  askSarvam,
  synthesizeSpeech,
  transcribeAudio,
  suggestionsFor,
  checkCognee,
  recallCognee,
  rememberCognee,
  greetingText,
  newSessionId,
  LOCATIONS,
  locationById,
} from "./copilot";
import { LANGUAGES, tr, fmt, voiceCode } from "./i18n";

const STORAGE_KEY = "harvestwise_react_v2";
const inr = (n) => "₹" + Math.round(n).toLocaleString("en-IN");

const TAMIL_SAMPLE =
  "வணக்கம்! இன்று மதியம் மூன்று மணிக்கு எண்பது சதவீதம் மழை வாய்ப்பு. சொப்புக் கீரையைக் குறைவாக வாங்குங்கள்.";
const ENGLISH_SAMPLE =
  "Vanakkam! There is an eighty percent chance of rain at three this afternoon. Buy fewer greens today.";

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    const base = defaultState();
    const merged = {
      ...base,
      ...parsed,
      settings: { ...base.settings, ...(parsed.settings || {}) },
      order: Array.isArray(parsed.order) && parsed.order.length ? parsed.order : base.order,
    };
    /* Migrate orders saved before stock/salesAvg existed: fill the new fields
       from the seed so stock management and the prediction stay consistent. */
    merged.order = merged.order.map((item) => {
      const seedItem = base.order.find((x) => x.id === item.id);
      return {
        ...item,
        stock: Math.max(0, Number(item.stock) || 0) || (seedItem ? seedItem.stock : 0),
        salesAvg: Math.max(0, Number(item.salesAvg) || 0) || (seedItem ? seedItem.salesAvg : item.baseQty || 1),
        category: ["veg", "fruit", "leafy", "other"].includes(item.category) ? item.category : seedItem ? seedItem.category : "other",
      };
    });
    /* The 30-day ledger arrives with this build; older saves get the demo history. */
    if (!Array.isArray(merged.salesHistory) || !merged.salesHistory.length) {
      merged.salesHistory = base.salesHistory;
    }
    /* Ledgers saved before the order-history enrichment lack bought/price/unit/
       total — rebuild them so history totals and spend figures stay correct. */
    merged.salesHistory = merged.salesHistory.map((day) => {
      const items = (day.items || []).map((it) => {
        const prod = merged.order.find((p) => p.id === it.id);
        return {
          ...it,
          bought: typeof it.bought === "number" ? it.bought : (it.sold || 0) + (it.stocked || 0),
          price: typeof it.price === "number" ? it.price : prod?.price || 0,
          unit: it.unit || prod?.unit || "",
        };
      });
      return {
        ...day,
        items,
        total:
          typeof day.total === "number"
            ? day.total
            : items.reduce((sum, it) => sum + it.bought * it.price, 0),
      };
    });
    /* Migrate the pre-sessions single chat into a session. */
    if (!Array.isArray(merged.sessions) || !merged.sessions.length) {
      merged.sessions = [
        {
          id: "s-seed",
          title: "Today's chat",
          when: "Today",
          messages:
            Array.isArray(parsed.messages) && parsed.messages.length ? parsed.messages : base.sessions[0].messages,
        },
      ];
    }
    if (!merged.sessions.some((s) => s.id === merged.activeSession)) {
      merged.activeSession = merged.sessions[0].id;
    }
    delete merged.messages; /* legacy flat chat — now lives in sessions */
    return merged;
  } catch {
    return defaultState();
  }
}

let seq = 0;
const uid = () => `id-${Date.now()}-${seq++}`;

/* Append a message to the ACTIVE chat session. Returns ONLY the sessions
   slice — callers spread their own state around it so fields set earlier in
   the same update (settings, location, …) are never overwritten. */
const pushMsg = (prev, role, text) => ({
  sessions: prev.sessions.map((session) =>
    session.id === prev.activeSession
      ? { ...session, messages: [...session.messages, { id: uid(), role, text }] }
      : session
  ),
});

/* A session gets its title from the first thing the merchant asks. */
const titleFrom = (text) => {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (!clean) return "New session";
  return clean.length > 30 ? `${clean.slice(0, 30).trimEnd()}…` : clean;
};

const TABS = [
  { id: "today", icon: "🏠", key: "tabToday" },
  { id: "orders", icon: "📦", key: "tabOrders" },
  { id: "data", icon: "📊", key: "tabData" },
  { id: "memory", icon: "🧠", key: "tabMemory" },
  { id: "settings", icon: "⚙️", key: "tabSettings" },
];

const GRAPH_NODES = [
  "Shelf-life",
  "Rain probability",
  "UPI velocity",
  "Mandi rate",
  "Festival calendar",
  "Humidity",
  "Her history",
  "Spoilage rate",
  "Working capital",
  "Demand curve",
];

export default function HarvestWise({
  onBack,
  onMetrics,
  merchantName,
  merchantEmail = "",
  language = "en",
  startTour = false,
  location = "",
  onLocationChange,
  onLanguageChange,
}) {
  const [S, setS] = useState(loadState);
  const [tab, setTab] = useState("today");
  const [navOpen, setNavOpen] = useState(false);
  const [inboxFilter, setInboxFilter] = useState("all");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");
  const [paletteIndex, setPaletteIndex] = useState(0);
  const [tourStep, setTourStep] = useState(-1);
  const [tourRect, setTourRect] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [draftProduct, setDraftProduct] = useState({ name: "", unit: "kg", price: "", qty: "1", stock: "0", category: "veg", perishable: true });
  const [stockReminder, setStockReminder] = useState(false);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [dataSel, setDataSel] = useState(null);
  const [locOpen, setLocOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [draft, setDraft] = useState("");
  const [toast, setToast] = useState(null);
  const [ai, setAi] = useState({ sarvam: false, chat: false, tts: false, stt: false, checked: false });
  const [cognee, setCognee] = useState({ cognee: false, checked: false });
  const [graphQuery, setGraphQuery] = useState("");
  const [graphAnswer, setGraphAnswer] = useState(null);
  const [graphLoading, setGraphLoading] = useState(false);

  const SRef = useRef(S);
  SRef.current = S;
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const paletteInputRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const audioUrlRef = useRef(null);
  const speechTimer = useRef(null);

  const lang = S.settings.lang === "ta" ? "ta" : "en";
  const t = (key) => tr(lang, key);
  const voiceLang = voiceCode(lang);
  const name = S.name || merchantName || MERCHANT.name;
  const place = locationById(S.location);
  const upi = `${name.split(" ")[0].toLowerCase()}@paytm`;

  const rain = rainProb(S);
  const total = orderTotal(S.order);
  const pending = S.pending;
  const prediction = predictPurchases(S);
  const orderHistory = orderHistoryFromLedger(S);
  const bestRateItem = [...S.order].sort((a, b) => b.price - a.price)[0];
  const rateTa = (item) =>
    item
      ? `${item.name} ₹${item.price}/${item.unit === "crates" ? "கிரேட்" : item.unit === "bundles" ? "கட்டு" : item.unit === "dozen" ? "டஜன்" : item.unit === "pieces" ? "துண்டு" : "கிலோ"}`
      : "";
  const rateEn = (item) => (item ? `₹${item.price}/${item.unit} (${item.name})` : "");
  /* 30-day stats for one product, computed from the demo ledger. */
  const dataStats = (item) => {
    const hist = S.salesHistory || [];
    const days = hist.map((day) => ({ day, it: day.items.find((x) => x.id === item.id) }));
    const solds = days.map((d) => d.it?.sold || 0);
    const totalSold = solds.reduce((a, b) => a + b, 0);
    const peak = Math.max(1, ...solds);
    const rainDays = days.filter((d) => d.day.rain >= 60);
    const clearDays = days.filter((d) => d.day.rain < 60);
    const rainAvg = rainDays.length ? Math.round(rainDays.reduce((a, d) => a + (d.it?.sold || 0), 0) / rainDays.length) : null;
    const clearAvg = clearDays.length ? Math.round(clearDays.reduce((a, d) => a + (d.it?.sold || 0), 0) / clearDays.length) : null;
    const byDow = {};
    days.forEach((d) => {
      const k = d.day.dow;
      (byDow[k] = byDow[k] || []).push(d.it?.sold || 0);
    });
    let bestDow = null;
    let bestAvg = -1;
    Object.entries(byDow).forEach(([k, v]) => {
      const avg = v.reduce((a, b) => a + b, 0) / v.length;
      if (avg > bestAvg) {
        bestAvg = avg;
        bestDow = k;
      }
    });
    return { totalSold, peak, rainAvg, clearAvg, bestDow };
  };
  const activeSession = S.sessions.find((session) => session.id === S.activeSession) || S.sessions[0];
  const activeMessages = activeSession ? activeSession.messages : [];

  /* ---------- chat sessions ---------- */
  const switchSession = (id) =>
    setS((prev) => (prev.activeSession === id ? prev : { ...prev, activeSession: id }));

  const freshGreeting = (prev) => ({
    id: uid(),
    role: "bot",
    text: greetingText(prev.name, prev.settings.lang === "ta" ? "ta" : "en"),
  });

  const newSession = () => {
    const id = newSessionId();
    setS((prev) => ({
      ...prev,
      sessions: [
        {
          id,
          title: t("sessionNew"),
          when: `Today · ${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`,
          messages: [freshGreeting(prev)],
        },
        ...prev.sessions,
      ],
      activeSession: id,
    }));
    notify(t("toastNewSession"));
  };

  const clearChat = () => {
    setS((prev) => ({
      ...prev,
      sessions: prev.sessions.map((session) =>
        session.id === prev.activeSession ? { ...session, messages: [freshGreeting(prev)] } : session
      ),
    }));
    notify(t("toastChatCleared"));
  };

  /* ---------- persistence ---------- */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(S));
    } catch {
      /* private mode — the demo still runs in memory */
    }
  }, [S]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [activeMessages.length, typing, S.activeSession]);

  useEffect(
    () => () => {
      if (speechTimer.current) window.clearTimeout(speechTimer.current);
      try {
        window.speechSynthesis?.cancel();
      } catch {
        /* ignore */
      }
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    },
    []
  );

  /* ---------- language + identity from sign-in (seed once; the in-app
     pickers own these afterwards) ---------- */
  useEffect(() => {
    if (language !== "en" && language !== "ta") return;
    setS((prev) => (prev.settings.lang === language ? prev : { ...prev, settings: { ...prev.settings, lang: language } }));
  }, [language]);

  useEffect(() => {
    if (!merchantName) return;
    setS((prev) => {
      if (prev.name === merchantName) return prev;
      const pinned = locationById(location || prev.location);
      return {
        ...prev,
        name: merchantName,
        sessions: prev.sessions.map((session) =>
          session.id === prev.activeSession
            ? {
                ...session,
                messages: [
                  ...session.messages,
                  {
                    id: uid(),
                    role: "bot",
                    text:
                      prev.settings.lang === "ta"
                        ? `வணக்கம் ${merchantName}! உங்கள் கோபைலட் ${pinned.name} பகுதிக்குத் தயார்.`
                        : `Namaskara ${merchantName}! Your copilot is ready for ${pinned.name}.`,
                  },
                ],
              }
            : session
        ),
      };
    });
  }, []);

  /* ---------- email from sign-in (purchase list is emailed here) ---------- */
  useEffect(() => {
    if (!merchantEmail) return;
    setS((prev) => (prev.email === merchantEmail ? prev : { ...prev, email: merchantEmail }));
  }, [merchantEmail]);

  /* ---------- Sarvam availability ---------- */
  useEffect(() => {
    let alive = true;
    checkAi().then((status) => {
      if (alive) setAi(status);
    });
    checkCognee().then((status) => {
      if (alive) setCognee(status);
    });
    return () => {
      alive = false;
    };
  }, []);

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  };

  /* ---------- live weather for whichever pin she has chosen ---------- */
  useEffect(() => {
    let cancelled = false;
    const pins = locationById(SRef.current.location);
    setWeatherLoading(true);
    (async () => {
      try {
        const url =
          `https://api.open-meteo.com/v1/forecast?latitude=${pins.lat}&longitude=${pins.lon}` +
          "&hourly=precipitation_probability,temperature_2m,relative_humidity_2m&current=relative_humidity_2m&forecast_days=2&timezone=Asia%2FKolkata";
        const res = await fetch(url);
        if (!res.ok) throw new Error("weather " + res.status);
        const json = await res.json();
        const probs = json.hourly?.precipitation_probability || [];
        const temps = json.hourly?.temperature_2m || [];
        /* Rain risk = the worst hour of the afternoon selling window (12–6 PM). */
        const window = probs.slice(12, 19).filter((p) => typeof p === "number");
        const prob = window.length ? Math.max(...window) : probs[15] ?? 0;
        const temp = Math.round(temps[15] ?? temps[12] ?? 27);
        const humidity =
          typeof json.current?.relative_humidity_2m === "number"
            ? Math.round(json.current.relative_humidity_2m)
            : Math.round(json.hourly?.relative_humidity_2m?.[15] ?? 70);
        /* Tomorrow's afternoon window sits in the second 24-hour block. */
        const tomorrowWindow = probs.slice(36, 43).filter((p) => typeof p === "number");
        const probTomorrow = tomorrowWindow.length ? Math.max(...tomorrowWindow) : probs[39] ?? null;
        if (cancelled) return;
        setS((prev) => ({
          ...prev,
          weather: { prob, temp, humidity, probTomorrow, simulated: false, place: pins.id },
        }));
      } catch {
        if (cancelled) return;
        setS((prev) =>
          prev.weather && prev.weather.place === pins.id
            ? prev
            : { ...prev, weather: { prob: 80, temp: 27, humidity: 74, probTomorrow: 60, simulated: true, place: pins.id } }
        );
      } finally {
        if (!cancelled) setWeatherLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [S.location]);

  /* ---------- voice ---------- */
  const browserSpeak = (text) => {
    try {
      const synth = window.speechSynthesis;
      if (!synth) return;
      synth.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      const match = (synth.getVoices() || []).find((v) =>
        lang === "ta" ? /ta[-_]IN|ta/i.test(v.lang) : /en[-_]IN|en/i.test(v.lang)
      );
      if (match) utter.voice = match;
      utter.lang = voiceLang;
      utter.rate = lang === "ta" ? 0.9 : 0.95;
      utter.onstart = () => setSpeaking(true);
      utter.onend = () => setSpeaking(false);
      utter.onerror = () => setSpeaking(false);
      synth.speak(utter);
      if (speechTimer.current) window.clearTimeout(speechTimer.current);
      speechTimer.current = window.setTimeout(() => setSpeaking(false), 9000);
    } catch {
      /* unsupported */
    }
  };

  const playClip = async (text, languageCode) => {
    const url = await synthesizeSpeech(text, languageCode);
    if (!url) return false;
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = url;
    const audio = new Audio(url);
    audio.onplay = () => setSpeaking(true);
    audio.onended = () => setSpeaking(false);
    audio.onerror = () => setSpeaking(false);
    try {
      await audio.play();
      return true;
    } catch {
      return false;
    }
  };

  const speak = async (text) => {
    if (!SRef.current.settings.voiceout) return;
    const clean = (text || "").replace(/<[^>]*>/g, "").slice(0, 320);
    if (!clean) return;
    if (ai.tts && (await playClip(clean, voiceCode(SRef.current.settings.lang)))) return;
    browserSpeak(clean);
  };

  const playVoiceSample = async () => {
    notify(t("toastSample"));
    const sample = lang === "ta" ? TAMIL_SAMPLE : ENGLISH_SAMPLE;
    if (ai.tts && (await playClip(sample, voiceCode(lang)))) return;
    browserSpeak(sample);
  };

  const changeLanguage = (code) => {
    if (code === lang) return;
    setS((prev) => ({
      ...prev,
      settings: { ...prev.settings, lang: code },
      ...pushMsg(
        prev,
        "bot",
        code === "ta"
          ? "மொழி தமிழுக்கு மாற்றப்பட்டது ✅ இனி தமிழில் பதில் சொல்வேன். என்ன செய்யட்டும்?"
          : "Language switched to English ✅ I'll reply in English from now on. What shall we do?"
      ),
    }));
    speak(code === "ta" ? "தமிழில் பேசுகிறேன்." : "Switching to English.");
    onLanguageChange?.(code);
  };

  /* ---------- order actions ---------- */
  const recalcOrder = () => {
    const result = recalculate(SRef.current);

    /* Nothing to trim means nothing to approve — never fake an approval gate. */
    if (!result.changes.length) {
      setS((prev) => ({
        ...prev,
        ...pushMsg(
          prev,
          "bot",
          prev.settings.lang === "ta"
            ? `மழை வாய்ப்பு ${result.rain}% — இன்று கீரை வகைகளைக் குறைக்க வேண்டியதில்லை. உங்கள் ₹${Math.round(
                result.amount
              ).toLocaleString("en-IN")} ஆர்டர் அப்படியே இருக்கும்.`
            : `Rain risk is ${result.rain}% — no leafy trim needed today. Your ₹${Math.round(
                result.amount
              ).toLocaleString("en-IN")} buy-order stands unchanged.`
        ),
      }));
      notify(t("toastNoTrim"));
      return;
    }

    setS((prev) => {
      const summary = result.changes.map((c) => `${c.name} ${c.from}→${c.to} ${c.unit}`).join(", ");
      const isTa = prev.settings.lang === "ta";
      return {
        ...prev,
        order: result.nextOrder,
        pending: {
          rain: result.rain,
          changes: result.changes,
          preserved: result.preserved,
          amount: result.amount,
          previous: prev.order,
        },
        memory: [
          {
            id: uid(),
            when: `${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} · rain recalc`,
            text: `Rain ${result.rain}% → ${summary}. Preserves ${inr(result.preserved)}. Awaiting voice approval.`,
            outcome: "pending",
          },
          ...prev.memory,
        ].slice(0, 20),
        ...pushMsg(
          prev,
          "bot",
          isTa
            ? `மீண்டும் கணக்கிட்டேன் (${result.rain}% மழை): ${result.nextOrder
                .map((o) => `${o.name} ${o.qty} ${o.unit}`)
                .join(", ")}. இதனால் ${inr(result.preserved)} வீணாவது தவிர்க்கப்படும் — மொத்தம் ${inr(
                result.amount
              )}. ${MERCHANT.wholesaler}க்கு அனுப்பவா?`
            : `Revised for ${result.rain}% rain: ${result.nextOrder
                .map((o) => `${o.name} ${o.qty} ${o.unit}`)
                .join(", ")}. That keeps ${inr(result.preserved)} off the bin — total ${inr(
                result.amount
              )}. Wholesaler ${MERCHANT.wholesaler}. Approve?`
        ),
      };
    });
    notify(t("toastRecalc"));
    speak(lang === "ta" ? "ஆர்டர் மீண்டும் கணக்கிடப்பட்டது. ஒப்புதல் தேவை." : "Order recalculated. Nothing moves until you approve.");
  };

  const dispatchOrder = () => {
    const s = SRef.current;
    const amount = orderTotal(s.order);
    const items = s.order.map((o) => `${o.name} ${o.qty} ${o.unit}`).join(" · ");
    const kept = s.pending?.preserved || 0;
    const isTa = s.settings.lang === "ta";
    const waText = encodeURIComponent(
      `HarvestWise buy-order · ${name} (${place.name})\n${items}\nTotal ${inr(amount)}.\nPlease confirm and deliver by 5 AM.`
    );
    const waUrl = `https://wa.me/${MERCHANT.wholesalerPhone}?text=${waText}`;

    setS((prev) => ({
      ...prev,
      pending: null,
      preserved: prev.preserved + kept,
      takeHome: prev.takeHome + Math.round(amount * 0.05),
      dispatches: [
        {
          id: uid(),
          when: `Today · ${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`,
          to: MERCHANT.wholesaler,
          items,
          amount,
          status: "Dispatched",
          waUrl,
        },
        ...prev.dispatches,
      ].slice(0, 8),
      memory: [
        {
          id: uid(),
          when: "Today · dispatch",
          text: `Sent to ${MERCHANT.wholesaler}: ${items} (${inr(amount)}). Approval gate: voice.`,
          outcome: "worked",
        },
        ...prev.memory,
      ].slice(0, 20),
      ...pushMsg(
        prev,
        "bot",
        isTa
          ? `அனுப்பப்பட்டது ✅ ${items} · ${inr(amount)} ${MERCHANT.wholesaler}க்கு வாட்ஸ்அப்பில். நினைவில் பதிவு செய்துவிட்டேன்.`
          : `Dispatched ✅ ${items} · ${inr(amount)} sent to ${MERCHANT.wholesaler} on WhatsApp. Stock sheet updated and the outcome is logged to memory.`
      ),
    }));
    notify(`${t("toastDispatch")} · ${MERCHANT.wholesaler}`);
    speak(isTa ? "ஆர்டர் மொத்த வியாபாரிக்கு அனுப்பப்பட்டது." : "Order dispatched to the wholesaler.");
    /* Learn step: write the real observation to the Cognee graph (fire-and-forget). */
    rememberCognee(
      `Dispatch observation for ${name} (${place.name}): rain ${rainProb(s)}%, order ${items}, total ₹${amount}, spoilage preserved ₹${Math.round(
        kept
      )}. Approved by voice and sent to ${MERCHANT.wholesaler} on WhatsApp.`
    );
    return waUrl;
  };

  const playBriefing = () => {
    const text = briefingScript(SRef.current);
    speak(text);
    setS((prev) => ({ ...prev, ...pushMsg(prev, "bot", `🔊 ${text}`) }));
  };

  const dayWrap = () => {
    const kept = SRef.current.pending?.preserved || 240;
    const earned = 1500 + Math.round(Math.random() * 900);
    setS((prev) => {
      const isTa = prev.settings.lang === "ta";
      return {
        ...prev,
        takeHome: prev.takeHome + earned,
        pending: null,
        memory: [
          {
            id: uid(),
            when: "Today · 8:30 PM",
            text: `Sold out by 7:15 PM, zero leafy waste. Kept ${inr(kept)}. Logged: rain recalc — worked.`,
            outcome: "worked",
          },
          ...prev.memory,
        ].slice(0, 20),
        ...pushMsg(
          prev,
          "bot",
          isTa
            ? `நாள் முடிந்தது 🌙 7:15க்கே விற்றுத் தீர்ந்தது, கீரை வீணாகவில்லை. ${inr(kept)} சேமித்தீர்கள், ${inr(
                earned
              )} வருவாய். இந்த வாரம் +${inr(prev.weeklyDelta)}. நினைவில் பதிவு செய்துவிட்டேன்.`
            : `Day wrapped 🌙 Sold out by 7:15 PM, zero leafy waste. You kept ${inr(
                kept
              )} you'd have discounted away, and earned ${inr(earned)}. This week: +${inr(
                prev.weeklyDelta
              )} vs last week. I've remembered what worked.`
        ),
      };
    });
    speak(lang === "ta" ? "நாள் முடிந்தது. நன்றாக வேலை செய்தீர்கள்." : "Day wrapped. Good work today.");
    /* Learn step: the day's outcome becomes causal memory in the Cognee graph. */
    rememberCognee(
      `Day-wrap observation for ${name} (${place.name}): sold out by 7:15 PM, zero leafy waste, kept ₹${Math.round(
        kept
      )}, earned ₹${earned}. Outcome: rain recalc worked.`
    );
  };

  /* ---------- Cognee graph Q&A (real recall, local fallback) ---------- */
  const askGraph = async (raw) => {
    const query = (raw ?? graphQuery).trim();
    if (!query || graphLoading) return;
    setGraphQuery("");
    setGraphLoading(true);
    setGraphAnswer(null);
    const remote = await recallCognee(query);
    if (remote) {
      setGraphAnswer({ text: remote, source: "cognee" });
      setGraphLoading(false);
      return;
    }
    /* Cognee unreachable — keyword search over her own memory log instead. */
    const words = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    const hits = SRef.current.memory.filter((entry) => {
      const hay = `${entry.when} ${entry.text}`.toLowerCase();
      return words.some((w) => hay.includes(w));
    });
    setGraphAnswer({
      text: hits.length ? hits.slice(0, 3).map((h) => `${h.when} — ${h.text}`).join("\n") : "",
      source: "local",
    });
    setGraphLoading(false);
  };

  /* ---------- chat ---------- */
  const sendMessage = (raw) => {
    const text = (raw ?? draft).trim();
    if (!text) return;
    const activeNow =
      SRef.current.sessions.find((session) => session.id === SRef.current.activeSession) || SRef.current.sessions[0];
    const history = activeNow ? activeNow.messages : [];
    setDraft("");
    setS((prev) => ({
      ...prev,
      sessions: prev.sessions.map((session) =>
        session.id === prev.activeSession
          ? {
              ...session,
              /* first user message names the session */
              title: session.messages.some((m) => m.role === "user") ? session.title : titleFrom(text),
              messages: [...session.messages, { id: uid(), role: "user", text }],
            }
          : session
      ),
    }));
    setTyping(true);

    window.setTimeout(async () => {
      try {
        const local = buildReply(text, SRef.current);
        const action = local.action;
        let reply = local.reply;

        // Money actions stay deterministic; open questions go to Sarvam's Indic LLM.
        if (!action && ai.chat && !local.authoritative) {
          const aiReply = await askSarvam(text, SRef.current, history);
          if (aiReply) reply = guardReply(aiReply, local.reply, SRef.current);
        }

        setTyping(false);
        setS((prev) => ({ ...prev, ...pushMsg(prev, "bot", reply) }));
        speak(reply);

        if (action === "recalc") window.setTimeout(recalcOrder, 500);
        if (action === "dispatch") window.setTimeout(() => dispatchOrder(), 700);
        if (action === "briefing") window.setTimeout(playBriefing, 500);
        if (action === "cancel") declinePending();
        if (action === "orderEdit" && local.edit) window.setTimeout(() => applyOrderEdit(local.edit), 300);
      } catch (err) {
        /* Never leave the merchant with a silent copilot — fall back to a
           safe, grounded answer and surface the fault for debugging. */
        console.error("sendMessage crashed:", err);
        if (window.__debugSend) window.__lastSendError = String((err && err.stack) || err);
        setTyping(false);
        setS((prev) => ({
          ...prev,
          ...pushMsg(
            prev,
            "bot",
            lang === "ta"
              ? "மன்னிக்கவும், அதைச் செயலாக்குவதில் தடுமாற்றம். உங்கள் ஆர்டரையோ வானிலையையோ கேளுங்கள்."
              : "Sorry — I stumbled on that one. Try asking about your order or the weather."
          ),
        }));
      }
    }, 620);
  };

  /* ---------- microphone: Sarvam STT with browser fallback ---------- */
  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
    setListening(false);
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") return false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (event) => {
        if (event.data?.size) chunksRef.current.push(event.data);
      };
      rec.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setListening(false);
        const blob = new Blob(chunksRef.current, { type: mime });
        if (blob.size < 1500) {
          notify(t("toastShort"));
          return;
        }
        notify(t("toastTranscribing"));
        const transcript = await transcribeAudio(blob, voiceCode(SRef.current.settings.lang));
        if (transcript) sendMessage(transcript);
        else notify(t("toastTranscribeFail"));
      };
      recorderRef.current = rec;
      rec.start();
      setListening(true);
      return true;
    } catch {
      setListening(false);
      notify(t("toastMicBlocked"));
      return true;
    }
  };

  const startWebSpeech = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      notify(t("toastMicUnsupported"));
      return;
    }
    try {
      const rec = new SR();
      rec.lang = voiceLang;
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (event) => {
        const said = event.results?.[0]?.[0]?.transcript || "";
        if (said) sendMessage(said);
        setListening(false);
      };
      rec.onerror = () => {
        setListening(false);
        notify(t("toastMicUnsupported"));
      };
      rec.onend = () => setListening(false);
      recognitionRef.current = rec;
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
      notify(t("toastMicUnsupported"));
    }
  };

  const toggleMic = async () => {
    if (listening) {
      if (recorderRef.current) stopRecording();
      else recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    if (ai.stt) {
      const started = await startRecording();
      if (started) return;
    }
    startWebSpeech();
  };

  /* ---------- misc ---------- */
  const setQty = (id, delta) =>
    setS((prev) => ({
      ...prev,
      order: prev.order.map((o) => (o.id === id ? { ...o, qty: Math.max(0, o.qty + delta) } : o)),
    }));

  const resetDemo = () => {
    const fresh = defaultState();
    setS({ ...fresh, settings: { ...fresh.settings, lang } });
    notify(t("toastReset"));
  };

  const toggleSetting = (field) =>
    setS((prev) => ({ ...prev, settings: { ...prev.settings, [field]: !prev.settings[field] } }));

  const stats = [
    {
      icon: "🛡️",
      label: t("statPreserved"),
      value: inr(S.preserved),
      delta: t("statPreservedDelta"),
      tone: "green",
      run: () => onMetrics?.(),
    },
    {
      icon: "📈",
      label: t("statGmv"),
      value: "+8%",
      delta: t("statGmvDelta"),
      tone: "blue",
      run: () => setTab("orders"),
    },
    {
      icon: "📦",
      label: t("statOrders"),
      value: String(S.dispatches.length + 140),
      delta: t("statOrdersDelta"),
      tone: "plain",
      run: () => setTab("orders"),
    },
    {
      icon: "🧠",
      label: t("statMemory"),
      value: String(S.memory.length + 82),
      delta: t("statMemoryDelta"),
      tone: "plain",
      run: () => setTab("memory"),
    },
  ];

  /* Dashboard KPIs are shortcuts: the number and the place it explains stay together. */
  const openStat = (stat) => {
    if (!stat.run) return;
    stat.run();
  };

  const demoSteps = [
    {
      time: "6:30 AM",
      title: t("demo1Title"),
      text: fmt(t("demo1Text"), { rain }),
      action: playBriefing,
      cta: t("demo1Cta"),
    },
    {
      time: "9:14 AM",
      title: t("demo2Title"),
      text: t("demo2Text"),
      action: () => sendMessage(t("demoTomatoes")),
      cta: t("demo2Cta"),
    },
    {
      time: "11:02 AM",
      title: t("demo3Title"),
      text: t("demo3Text"),
      action: recalcOrder,
      cta: t("demo3Cta"),
    },
    {
      time: "8:30 PM",
      title: t("demo4Title"),
      text: t("demo4Text"),
      action: dayWrap,
      cta: t("demo4Cta"),
    },
  ];

  const suggestions = suggestionsFor(lang);

  /* ---------- scenario / inbox / palette / tour ---------- */
  const toggleScenario = () => {
    const next = SRef.current.scenario === "rain" ? "live" : "rain";
    /* A pending approval computed under the old forecast is stale. */
    setS((prev) => ({ ...prev, scenario: next, pending: null }));
    notify(next === "rain" ? t("scenarioOn") : t("scenarioOff"));
  };

  const declinePending = () => {
    setS((prev) => ({
      ...prev,
      pending: null,
      /* Put back exactly what she had before the recalculation, not the seed order. */
      order: prev.pending?.previous || prev.order,
    }));
    notify(t("toastDeclined"));
  };

  const advanceDispatch = (id) => {
    let nextStatus = "In transit";
    setS((prev) => ({
      ...prev,
      dispatches: prev.dispatches.map((dispatch) => {
        if (dispatch.id !== id) return dispatch;
        nextStatus = dispatch.status === "Dispatched" ? "In transit" : "Delivered";
        return { ...dispatch, status: nextStatus };
      }),
    }));
    notify(nextStatus === "Delivered" ? t("toastDelivered") : t("toastTransit"));
  };

  const focusCopilot = () => {
    setTab("today");
    window.setTimeout(() => {
      document.getElementById("copilot")?.scrollIntoView({ block: "center", behavior: "smooth" });
      document.querySelector(".hw-composer input")?.focus({ preventScroll: true });
    }, 180);
  };

  /* ---------- product management ---------- */
  const updateProduct = (id, patch) =>
    setS((prev) => ({
      ...prev,
      pending: null,
      order: prev.order.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));

  /* The copilot edits the order itself when she speaks a change. */
  const applyOrderEdit = (edit) => {
    if (!edit) return;
    setS((prev) => {
      const base = { ...prev, pending: null };
      if (edit.kind === "remove") {
        if (prev.order.length <= 1) return prev;
        return { ...base, order: prev.order.filter((item) => item.id !== edit.id) };
      }
      const row = prev.order.find((item) => item.id === edit.id);
      if (row) {
        return {
          ...base,
          order: prev.order.map((item) => (item.id === edit.id ? { ...item, qty: Math.max(1, Math.round(edit.qty)) } : item)),
        };
      }
      const catalog = seedOrder().find((item) => item.id === edit.id);
      if (!catalog) return prev;
      return {
        ...base,
        order: [...prev.order, { ...catalog, qty: Math.max(1, Math.round(edit.qty)), baseQty: Math.max(1, Math.round(edit.qty)), stock: 0 }],
      };
    });
  };

  const removeProduct = (id) => {
    if (SRef.current.order.length <= 1) {
      notify(t("toastLastProduct"));
      return;
    }
    setS((prev) => ({ ...prev, pending: null, order: prev.order.filter((item) => item.id !== id) }));
    notify(t("toastProductRemoved"));
  };

  const addProduct = (event) => {
    event.preventDefault();
    const name = draftProduct.name.trim();
    const price = Number(draftProduct.price);
    const qty = Math.max(1, Math.round(Number(draftProduct.qty) || 1));
    if (name.length < 2 || !Number.isFinite(price) || price <= 0) {
      notify(t("toastProductInvalid"));
      return;
    }
    setS((prev) => ({
      ...prev,
      pending: null,
      order: [
        ...prev.order,
        {
          id: uid(),
          name,
          emoji: "🧺",
          unit: draftProduct.unit,
          price,
          baseShelfHours: draftProduct.perishable ? 24 : 72,
          qty,
          baseQty: qty,
          stock: Math.max(0, Math.round(Number(draftProduct.stock) || 0)),
          category: ["veg", "fruit", "leafy", "other"].includes(draftProduct.category) ? draftProduct.category : "other",
          perishable: draftProduct.perishable,
        },
      ],
    }));
    setDraftProduct({ name: "", unit: draftProduct.unit, price: "", qty: "1", stock: "0", category: "veg", perishable: true });
    notify(fmt(t("toastProductAdded"), { name }));
  };

  /* ---------- nightly stock update (9 PM ritual) ---------- */
  const todayKey = () => new Date().toDateString();
  const stockUpdatedToday = () => {
    const when = SRef.current.lastStockUpdate;
    return !!when && new Date(when).toDateString() === todayKey();
  };
  const stockUpdateLabel = () => {
    const when = SRef.current.lastStockUpdate;
    if (!when) return null;
    const d = new Date(when);
    return `${d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  };

  const markStockUpdated = () => {
    setS((prev) => ({ ...prev, lastStockUpdate: new Date().toISOString() }));
    setStockReminder(false);
    notify(t("toastStockUpdated"));
  };

  const updateStock = (id, delta) => {
    setS((prev) => ({
      ...prev,
      lastStockUpdate: new Date().toISOString(),
      order: prev.order.map((item) =>
        item.id === id ? { ...item, stock: Math.max(0, (Number(item.stock) || 0) + delta) } : item
      ),
    }));
    setStockReminder(false);
  };

  /* Nudge once it's 9 PM and today's stock hasn't been logged yet. */
  useEffect(() => {
    const check = () => {
      const now = new Date();
      const when = SRef.current.lastStockUpdate;
      const updatedToday = !!when && new Date(when).toDateString() === now.toDateString();
      if (now.getHours() >= 21 && !updatedToday) {
        setStockReminder(true);
      }
    };
    check();
    const timer = window.setInterval(check, 30000);
    return () => window.clearInterval(timer);
  }, []);

  const openStockUpdate = () => {
    setStockReminder(false);
    setTab("orders");
    window.setTimeout(() => {
      document.querySelector(".hw-products")?.scrollIntoView({ block: "start", behavior: "smooth" });
      setStockModalOpen(true);
    }, 240);
  };

  const emailSuggestions = () => {
    const to = S.email || merchantEmail;
    if (!to) {
      notify(t("toastNoEmail"));
      return;
    }
    const subject = encodeURIComponent(`HarvestWise — what to buy today (${place.name})`);
    const body = encodeURIComponent(suggestionEmailBody(SRef.current, prediction));
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
    notify(fmt(t("toastEmailReady"), { email: to }));
  };

  /* One-tap close of the loop: prediction → order → approve → dispatch. */
  const applySuggestions = () => {
    const p = predictPurchases(SRef.current);
    setS((prev) => ({
      ...prev,
      order: prev.order.map((item) => {
        const target = p.buy.find((x) => x.id === item.id);
        return target ? { ...item, qty: Math.max(1, target.toBuy) } : item;
      }),
      ...pushMsg(
        prev,
        "bot",
        lang === "ta"
          ? `பரிந்துரைக்கப்பட்ட அளவுகளை ஆர்டரில் பொருத்தினேன் ✅ மொத்தம் ₹${p.total}. அனுப்பவா?`
          : `Applied the suggested quantities to your order ✅ Total ₹${p.total}. Approve to dispatch?`
      ),
    }));
    notify(fmt(t("toastApplied"), { total: inr(p.total) }));
  };

  const changeLocation = (id) => {
    const next = locationById(id);
    if (next.id === SRef.current.location) return;
    setS((prev) => ({
      ...prev,
      location: next.id,
      ...pushMsg(prev, "bot", fmt(t("locationPinned"), { place: next.name, mandi: next.mandi })),
    }));
    onLocationChange?.(next.id);
    notify(fmt(t("toastLocation"), { place: next.name }));
  };

  const statusLabel = (status) =>
    status === "Delivered" ? t("statusDelivered") : status === "In transit" ? t("statusTransit") : t("statusDispatched");

  const inboxCounts = {
    all: S.dispatches.length + (pending ? 1 : 0),
    pending: pending ? 1 : 0,
    dispatched: S.dispatches.filter((d) => d.status !== "Delivered").length,
    delivered: S.dispatches.filter((d) => d.status === "Delivered").length,
  };
  const inboxDispatches = S.dispatches.filter((dispatch) => {
    if (inboxFilter === "dispatched") return dispatch.status !== "Delivered";
    if (inboxFilter === "delivered") return dispatch.status === "Delivered";
    return inboxFilter === "all";
  });
  const showPendingCard = Boolean(pending) && (inboxFilter === "all" || inboxFilter === "pending");
  const orderSpend = S.dispatches.reduce((sum, dispatch) => sum + dispatch.amount, 0);
  const orderAvg = S.dispatches.length ? Math.round(orderSpend / S.dispatches.length) : 0;
  const ordersActive = S.dispatches.filter((dispatch) => dispatch.status !== "Delivered").length;

  const paletteCommands = [
    { group: "go", icon: "🏠", label: t("tabToday"), hint: t("sideCopilot"), run: () => setTab("today") },
    { group: "go", icon: "📦", label: t("tabOrders"), hint: t("inboxTitle"), run: () => setTab("orders") },
    { group: "go", icon: "🧠", label: t("tabMemory"), hint: t("memoryTitle"), run: () => setTab("memory") },
    { group: "go", icon: "⚙️", label: t("tabSettings"), hint: t("setVoice"), run: () => setTab("settings") },
    {
      group: "act",
      icon: "🔊",
      label: t("sideBriefing"),
      hint: t("sideBriefingHint"),
      run: () => {
        setTab("today");
        window.setTimeout(playBriefing, 140);
      },
    },
    {
      group: "act",
      icon: "⚡",
      label: t("sideRestock"),
      hint: t("sideRestockHint"),
      run: () => {
        setTab("today");
        window.setTimeout(recalcOrder, 140);
      },
    },
    { group: "act", icon: "💬", label: t("sideCopilotChat"), hint: t("sideCopilotChatHint"), run: focusCopilot },
    { group: "act", icon: "🛡️", label: t("sideApprovals"), hint: t("sideApprovalsHint"), run: () => setTab("orders") },
    {
      group: "act",
      icon: "📈",
      label: t("sideInsights"),
      hint: t("sideInsightsHint"),
      run: () => {
        if (onMetrics) onMetrics();
      },
    },
    {
      group: "act",
      icon: "🧪",
      label: S.scenario === "rain" ? t("scenarioLive") : t("scenarioRain"),
      hint: t("scenarioOn"),
      run: toggleScenario,
    },
    { group: "act", icon: "🎙️", label: t("paletteVoice"), hint: t("listening"), run: () => toggleMic() },
    {
      group: "act",
      icon: "🌐",
      label: lang === "ta" ? "English" : "Tamil",
      hint: t("language"),
      run: () => changeLanguage(lang === "ta" ? "en" : "ta"),
    },
    { group: "act", icon: "🗺️", label: t("paletteTour"), hint: t("tourTitle"), run: () => setTourStep(0) },
  ];
  const paletteNeedle = paletteQuery.trim().toLowerCase();
  const paletteResults = paletteNeedle
    ? paletteCommands.filter((command) => `${command.label} ${command.hint}`.toLowerCase().includes(paletteNeedle))
    : paletteCommands;
  const paletteAskRow = paletteNeedle.length > 1;
  const askRow = { group: "ask", icon: "💬", label: paletteQuery.trim(), hint: t("paletteAsk") };
  /* Commands keep priority; “ask the copilot” is the last resort, not the default Enter. */
  const paletteRows = paletteResults.length
    ? [...paletteResults, ...(paletteAskRow ? [askRow] : [])]
    : paletteAskRow
    ? [askRow]
    : [];

  const closePalette = () => {
    setPaletteOpen(false);
    setPaletteQuery("");
    setPaletteIndex(0);
  };

  const runPaletteRow = (row) => {
    if (!row) return;
    closePalette();
    if (row.group === "ask") {
      setTab("today");
      sendMessage(row.label);
      return;
    }
    row.run();
  };

  const onPaletteKey = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setPaletteIndex((i) => Math.min(paletteRows.length - 1, i + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setPaletteIndex((i) => Math.max(0, i - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      runPaletteRow(paletteRows[paletteIndex]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      closePalette();
    }
  };

  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      } else if (event.key === "Escape") {
        setPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!paletteOpen) return undefined;
    setPaletteQuery("");
    setPaletteIndex(0);
    const id = window.setTimeout(() => paletteInputRef.current?.focus(), 40);
    return () => window.clearTimeout(id);
  }, [paletteOpen]);

  useEffect(() => {
    setPaletteIndex(0);
  }, [paletteQuery]);

  /* Switching workspace should land at the top; the tour does its own scrolling. */
  useEffect(() => {
    if (tourStep < 0) window.scrollTo({ top: 0, behavior: "auto" });
  }, [tab]);

  const TOUR_STEPS = [
    { target: ".hw-sidebar", tab: "today", title: t("tourStep1Title"), body: t("tourStep1Body") },
    { target: ".hw-brief", tab: "today", title: t("tourStep2Title"), body: t("tourStep2Body") },
    { target: "#copilot", tab: "today", title: t("tourStep3Title"), body: t("tourStep3Body") },
    { target: ".hw-inbox", tab: "orders", title: t("tourStep4Title"), body: t("tourStep4Body") },
    { target: ".hw-side-plan", tab: "today", title: t("tourStep5Title"), body: t("tourStep5Body") },
  ];

  useEffect(() => {
    if (tourStep < 0) return undefined;
    const step = TOUR_STEPS[tourStep];
    if (!step) return undefined;
    if (step.tab !== tab) {
      setTab(step.tab);
      return undefined;
    }
    const place = () => {
      const el = document.querySelector(step.target);
      if (el) setTourRect(el.getBoundingClientRect());
    };
    document.querySelector(step.target)?.scrollIntoView({ block: "center", behavior: "smooth" });
    place();
    window.addEventListener("resize", place);
    const id = window.setTimeout(place, 420);
    return () => {
      window.removeEventListener("resize", place);
      window.clearTimeout(id);
    };
  }, [tourStep, tab]);

  useEffect(() => {
    if (startTour) setTourStep(0);
  }, [startTour]);

  /* A sign-in can set her name and default pin; the in-app picker owns the pin afterwards. */
  useEffect(() => {
    if (!location) return;
    setS((prev) => (prev.location === location ? prev : { ...prev, location }));
  }, [location]);

  useEffect(() => {
    if (tourStep < 0) return undefined;
    const onEscape = (event) => {
      if (event.key === "Escape") setTourStep(-1);
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [tourStep]);

  return (
    <div className={"hw" + (navOpen ? " is-nav-open" : "")}>
      <div className="hw-scrim" onClick={() => setNavOpen(false)} aria-hidden="true" />

      <aside className="hw-sidebar" aria-label="HarvestWise workspace">
        <div className="hw-side-brand">
          <button className="hw-back" onClick={onBack} aria-label="Back to Paytm">
            <span aria-hidden="true">←</span> Paytm
          </button>
          <div className="hw-brand">
            <div className="hw-brand-mark">🌾</div>
            <div>
              <div className="hw-brand-name">HarvestWise</div>
              <div className="hw-brand-sub">Merchant copilot · Track 1</div>
            </div>
          </div>
        </div>

        <button className="hw-side-search" onClick={() => setPaletteOpen(true)} aria-label={t("paletteOpen")}>
          <span aria-hidden="true">⌘</span>
          <span className="hw-side-search-text">{t("palettePlaceholder")}</span>
          <kbd>K</kbd>
        </button>

        <nav className="hw-side-nav">
          <div className="hw-side-label">{t("sideCopilot")}</div>
          {TABS.map((item) => (
            <button
              key={item.id}
              className={"hw-tab" + (tab === item.id ? " is-active" : "")}
              onClick={() => {
                setTab(item.id);
                setNavOpen(false);
              }}
            >
              <span className="hw-tab-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="hw-tab-label">{t(item.key)}</span>
              {item.id === "orders" && pending && <span className="hw-nav-badge">1</span>}
              {item.id === "data" && <span className="hw-nav-count">{(S.salesHistory || []).length}</span>}
              {item.id === "memory" && <span className="hw-nav-count">{S.memory.length}</span>}
            </button>
          ))}

          <div className="hw-side-label">{t("sideCapabilities")}</div>
          <button
            className="hw-cap"
            onClick={() => {
              setNavOpen(false);
              focusCopilot();
            }}
          >
            <span className="hw-cap-icon" aria-hidden="true">
              💬
            </span>
            <span className="hw-cap-text">
              <b>{t("sideCopilotChat")}</b>
              <small>{t("sideCopilotChatHint")}</small>
            </span>
          </button>
          <button
            className="hw-cap"
            onClick={() => {
              setNavOpen(false);
              setTab("today");
              window.setTimeout(playBriefing, 80);
            }}
          >
            <span className="hw-cap-icon" aria-hidden="true">🔊</span>
            <span className="hw-cap-text">
              <b>{t("sideBriefing")}</b>
              <small>{t("sideBriefingHint")}</small>
            </span>
          </button>
          <button
            className="hw-cap"
            onClick={() => {
              setNavOpen(false);
              setTab("today");
              window.setTimeout(recalcOrder, 120);
            }}
          >
            <span className="hw-cap-icon" aria-hidden="true">⚡</span>
            <span className="hw-cap-text">
              <b>{t("sideRestock")}</b>
              <small>{t("sideRestockHint")}</small>
            </span>
          </button>
          <button
            className="hw-cap"
            onClick={() => {
              setNavOpen(false);
              setTab("orders");
            }}
          >
            <span className="hw-cap-icon" aria-hidden="true">🛡️</span>
            <span className="hw-cap-text">
              <b>{t("sideApprovals")}</b>
              <small>{t("sideApprovalsHint")}</small>
            </span>
          </button>
          <button
            className="hw-cap"
            onClick={() => {
              setNavOpen(false);
              if (onMetrics) onMetrics();
            }}
          >
            <span className="hw-cap-icon" aria-hidden="true">📈</span>
            <span className="hw-cap-text">
              <b>{t("sideInsights")}</b>
              <small>{t("sideInsightsHint")}</small>
            </span>
          </button>
        </nav>

        <div className="hw-side-foot">
          <div className="hw-side-plan">
            <span className="hw-side-plan-badge">{t("sidePlan")}</span>
            <strong>₹149 / month</strong>
            <small>{t("sidePlanSub")}</small>
          </div>
          <div className="hw-side-ai">
            <span className={"dot" + (ai.chat ? " live" : "")} />
            <div>
              <strong>{t("sideAi")}</strong>
              <small>{ai.models?.chat || ai.models?.tts || "sarvam"}</small>
            </div>
          </div>
          <div className="hw-side-user">
            <div className="hw-avatar">{name.trim().charAt(0).toUpperCase()}</div>
            <div className="hw-merchant-meta">
              <strong>{name}</strong>
              <span>{upi}</span>
            </div>
            <button
              className="hw-lang-pill"
              onClick={() => changeLanguage(lang === "ta" ? "en" : "ta")}
              title={t("language")}
              aria-label={t("language")}
            >
              {lang === "ta" ? "த" : "EN"}
            </button>
          </div>
        </div>
      </aside>

      <div className="hw-content">
        <header className="hw-top">
          <div className="hw-top-inner">
            <button
              className="hw-menu-btn"
              onClick={() => setNavOpen((open) => !open)}
              aria-label={t("sideMenu")}
              aria-expanded={navOpen}
            >
              <span />
              <span />
              <span />
            </button>
            <div className="hw-crumbs">
              <strong>{t(TABS.find((item) => item.id === tab)?.key || "tabToday")}</strong>
              <span>
                {place.name} · {name}
              </span>
            </div>
            <div className="hw-top-actions">
              <button
                className="hw-cmd-btn"
                onClick={() => setPaletteOpen(true)}
                aria-label={t("paletteOpen")}
                title={t("paletteOpen")}
              >
                ⌘K
              </button>
              <span className={"hw-status-pill" + (ai.chat ? " is-live" : "")}>
                <span className="dot" />
                {ai.checked ? (ai.chat ? t("sideAiLive") : t("sideAiOff")) : "· · ·"}
              </span>
              <button
                className="hw-lang-pill hw-lang-pill-light"
                onClick={() => changeLanguage(lang === "ta" ? "en" : "ta")}
                title={t("language")}
                aria-label={t("language")}
              >
                {lang === "ta" ? "த" : "EN"}
              </button>
              <div className="hw-avatar hw-avatar-top" title={name}>
                {name.trim().charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="hw-main">
        {tab === "today" && (
          <>
            {stockReminder && (
              <div className="hw-reminder" role="alert">
                <span className="hw-reminder-icon" aria-hidden="true">
                  🌙
                </span>
                <div className="hw-reminder-copy">
                  <strong>{t("stockUpdateTitle")}</strong>
                  <p>{t("stockUpdateBody")}</p>
                </div>
                <button className="hw-btn hw-btn-primary hw-btn-sm" onClick={openStockUpdate}>
                  {t("stockUpdateCta")}
                </button>
                <button className="hw-reminder-close" onClick={() => setStockReminder(false)} aria-label={t("dismiss")}>
                  ✕
                </button>
              </div>
            )}

            {/* The copilot is the main dashboard panel — chat sessions rail on the side. */}
            <section className="hw-card hw-chat hw-chat-main" id="copilot">
              <div className="hw-card-head">
                <div>
                  <h2>💬 {t("copilot")}</h2>
                  <p className="hw-card-sub">{t("copilotSub")}</p>
                </div>
                <div className="hw-chat-actions">
                  <div className="hw-loc-wrap">
                    <button
                      className="hw-loc-btn"
                      onClick={() => setLocOpen((o) => !o)}
                      aria-haspopup="listbox"
                      aria-expanded={locOpen}
                      title={t("setLocation")}
                    >
                      📍 {place.name} <span className="hw-loc-caret">▾</span>
                    </button>
                    {locOpen && (
                      <div className="hw-loc-menu" role="listbox">
                        <div className="hw-loc-group-label">{t("locGroupBlr")}</div>
                        {LOCATIONS.filter((l) => l.region === "blr").map((l) => (
                          <button
                            key={l.id}
                            role="option"
                            aria-selected={l.id === S.location}
                            className={"hw-loc-option" + (l.id === S.location ? " is-on" : "")}
                            onClick={() => {
                              changeLocation(l.id);
                              setLocOpen(false);
                            }}
                          >
                            {l.name} <small>· {l.mandi}</small>
                          </button>
                        ))}
                        <div className="hw-loc-group-label">{t("locGroupTn")}</div>
                        {LOCATIONS.filter((l) => l.region === "tn").map((l) => (
                          <button
                            key={l.id}
                            role="option"
                            aria-selected={l.id === S.location}
                            className={"hw-loc-option" + (l.id === S.location ? " is-on" : "")}
                            onClick={() => {
                              changeLocation(l.id);
                              setLocOpen(false);
                            }}
                          >
                            {l.name} <small>· {l.mandi}</small>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button className="hw-btn hw-btn-outline hw-btn-sm" onClick={newSession}>
                    ＋ {t("newSession")}
                  </button>
                  <button className="hw-btn hw-btn-outline hw-btn-sm" onClick={clearChat}>
                    🧹 {t("clearChat")}
                  </button>
                  <span className="hw-live">
                    <span className="dot" /> {t("liveBadge")}
                  </span>
                </div>
              </div>

              <div className="hw-copilot-shell">
                <aside className="hw-sessions" aria-label={t("sessionsLabel")}>
                  <div className="hw-sessions-label">{t("sessionsLabel")}</div>
                  <div className="hw-sessions-list">
                    {S.sessions.map((session) => (
                      <button
                        key={session.id}
                        className={"hw-session" + (session.id === S.activeSession ? " is-active" : "")}
                        onClick={() => switchSession(session.id)}
                        aria-current={session.id === S.activeSession ? "true" : undefined}
                      >
                        <strong>{session.title}</strong>
                        <small>
                          {session.when} · {session.messages.length}
                        </small>
                      </button>
                    ))}
                  </div>

                  {/* Today's stock: a scheduled reminder, not a data-entry list.
                      One glance at the status; one tap to open the update modal. */}
                  <div className="hw-reminder-card">
                    <div className={"hw-reminder-status" + (stockUpdatedToday() ? " is-done" : "")}>
                      <span className="hw-reminder-icon">{stockUpdatedToday() ? "✅" : "🌙"}</span>
                      <div className="hw-reminder-copy">
                        <strong>{stockUpdatedToday() ? t("stockDoneTitle") : t("stockDueTitle")}</strong>
                        <small>
                          {stockUpdatedToday()
                            ? fmt(t("stockDoneAt"), { when: stockUpdateLabel() })
                            : t("stockDueBody")}
                        </small>
                      </div>
                    </div>
                    <div className="hw-reminder-schedule">
                      <span>🕘</span> {t("stockSchedule")}
                    </div>
                    <button
                      className="hw-btn hw-btn-primary hw-btn-sm hw-reminder-cta"
                      onClick={openStockUpdate}
                    >
                      {stockUpdatedToday() ? t("stockEditBtn") : t("stockUpdateCta")}
                    </button>
                  </div>
                </aside>

                <div className="hw-chat-pane">
                  <div className="hw-chat-body">
                    {activeMessages.map((message) => (
                      <div className={"hw-msg " + message.role} key={message.id}>
                        <p>{message.text}</p>
                        <span className="hw-msg-meta">
                          {message.role === "user" ? (lang === "ta" ? "நீங்கள்" : "You") : "HarvestWise"}
                        </span>
                      </div>
                    ))}
                    {typing && (
                      <div className="hw-msg bot hw-typing" aria-label="HarvestWise is typing">
                        <span />
                        <span />
                        <span />
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  <div className="hw-chips">
                    {suggestions.map((suggestion) => (
                      <button key={suggestion} className="hw-chip" onClick={() => sendMessage(suggestion)}>
                        {suggestion}
                      </button>
                    ))}
                  </div>

                  <form
                    className="hw-composer"
                    onSubmit={(event) => {
                      event.preventDefault();
                      sendMessage();
                    }}
                  >
                    <button
                      type="button"
                      className={"hw-mic" + (listening ? " is-listening" : "")}
                      onClick={toggleMic}
                      aria-label="Speak to HarvestWise"
                      title={t("placeholder")}
                    >
                      {listening ? "🔴" : "🎤"}
                    </button>
                    <input
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder={listening ? t("listening") : t("placeholder")}
                      aria-label={t("placeholder")}
                    />
                    <button type="submit" className="hw-send" aria-label={t("send")}>
                      ➤
                    </button>
                  </form>
                  <div className="hw-chat-status">
                    <span>
                      {listening
                        ? t("listening")
                        : ai.sarvam
                        ? fmt(t("statusAi"), { model: ai.models?.stt || "saaras:v4" })
                        : t("statusBrowser")}
                    </span>
                    <span>{t("approvalRule")}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Today at a glance — your three numbers, one tap each to the view that explains them. */}
            <section className="hw-hero">
              {stats.map((stat) => (
                <button
                  type="button"
                  className="hw-hero-tile"
                  key={stat.label}
                  onClick={() => openStat(stat)}
                  aria-label={stat.label}
                >
                  <span className={"hw-hero-icon tone-" + stat.tone} aria-hidden="true">
                    {stat.icon}
                  </span>
                  <span className="hw-hero-copy">
                    <span className="hw-hero-label">{stat.label}</span>
                    <strong className={"tone-" + stat.tone}>{stat.value}</strong>
                    <small>{stat.delta}</small>
                  </span>
                </button>
              ))}
            </section>

            {/* Agent prediction: what to buy / skip today, from last night's stock + live weather. */}
            <section className="hw-card hw-suggest" aria-label={t("suggestTitle")}>
              <div className="hw-card-head">
                <div>
                  <h2>🧮 {t("suggestTitle")}</h2>
                  <p className="hw-card-sub">{t("suggestSub")}</p>
                </div>
                <div className="hw-suggest-actions">
                  <span className="hw-badge blue">{inr(prediction.total)}</span>
                  <button
                    className="hw-btn hw-btn-primary hw-btn-sm"
                    onClick={applySuggestions}
                    disabled={prediction.buy.length === 0}
                  >
                    ⚡ {t("suggestApplyBtn")}
                  </button>
                  <button className="hw-btn hw-btn-outline hw-btn-sm" onClick={emailSuggestions}>
                    📧 {t("suggestEmailBtn")}
                  </button>
                </div>
              </div>

              <div className="hw-suggest-weather">
                <span className="hw-wchip">☔ {t("wchipRain")}: <b>{prediction.rain}%</b></span>
                <span className="hw-wchip">🌡 {t("wchipTemp")}: <b>{prediction.temp}°C</b></span>
                {prediction.humidity != null && (
                  <span className="hw-wchip">💧 {t("wchipHumidity")}: <b>{prediction.humidity}%</b></span>
                )}
                {prediction.tomorrow != null && (
                  <span className="hw-wchip">🔮 {t("wchipTomorrow")}: <b>{prediction.tomorrow}%</b></span>
                )}
                <span className="hw-wchip hw-wchip-note">{t("suggestBasis")}</span>
              </div>

              <div className="hw-suggest-grid">
                <div className="hw-suggest-col">
                  <div className="hw-suggest-label green">✅ {t("suggestBuy")}</div>
                  {prediction.buy.length === 0 && <p className="hw-suggest-none">{t("suggestBuyNone")}</p>}
                  {prediction.buy.map((b) => (
                    <div className="hw-suggest-row" key={b.id}>
                      <span className="hw-suggest-name">
                        <span aria-hidden="true">{b.emoji}</span> {b.name}
                      </span>
                      <span className="hw-suggest-vel" title={t("velocityTitle")}>
                        ~{b.salesAvg || b.need}/{t("dayShort")}
                      </span>
                      <span className="hw-suggest-qty">
                        <b>{b.toBuy}</b> {b.unit}
                      </span>
                      <span className="hw-suggest-cost">{inr(b.cost)}</span>
                      <span className={"hw-chip-reason " + (b.reason === "topup" ? "amber" : "green")}>
                        {b.reason === "topup"
                          ? fmt(t("reasonTopUp"), { stock: b.stock })
                          : fmt(t("reasonBuy"), { need: b.need })}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="hw-suggest-col">
                  <div className="hw-suggest-label red">🚫 {t("suggestSkip")}</div>
                  {prediction.skip.length === 0 && <p className="hw-suggest-none">{t("suggestSkipNone")}</p>}
                  {prediction.skip.map((s) => (
                    <div className="hw-suggest-row" key={s.id}>
                      <span className="hw-suggest-name">
                        <span aria-hidden="true">{s.emoji}</span> {s.name}
                      </span>
                      <span className="hw-suggest-vel" title={t("velocityTitle")}>
                        ~{s.salesAvg || s.need}/{t("dayShort")}
                      </span>
                      <span className="hw-suggest-qty">
                        <b>{s.stock}</b> {s.unit}
                      </span>
                      <span className="hw-suggest-cost muted">—</span>
                      <span className="hw-chip-reason green">
                        {s.reason === "stock-covers"
                          ? fmt(t("reasonStockCovers"), { stock: s.stock })
                          : fmt(t("reasonWeatherCovers"), { stock: s.stock, need: s.need })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="hw-brief">
              <div className="hw-brief-copy">
                <div className="hw-brief-eyebrow">
                  <span className="dot" /> {t("briefingEyebrow")} ·{" "}
                  {new Date().toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", {
                    weekday: "long",
                    day: "numeric",
                    month: "short",
                  })}
                </div>
                <div className="hw-brief-headline">
                  <h1>
                    {lang === "ta" ? "வணக்கம்" : "Namaskara"} {name}! 🌅
                  </h1>
                  <span className="hw-wx">
                    ☔ {weatherLoading ? "…" : `${rain}%`} · {S.weather?.temp ?? 27}°C · {place.name}
                  </span>
                  <button
                    className={"hw-scenario" + (S.scenario === "rain" ? " is-on" : "")}
                    onClick={toggleScenario}
                    title={S.scenario === "rain" ? t("scenarioOff") : t("scenarioOn")}
                  >
                    💧 {S.scenario === "rain" ? t("scenarioLive") : t("scenarioRain")}
                  </button>
                </div>
                <p>
                  {lang === "ta"
                    ? rain >= 60
                      ? `மதியம் 3 மணிக்கு அதிக மழை வாய்ப்பு — கீரை வகைகளைக் குறைத்துவிடுங்கள், காய்கறிகளை நிலையாக வையுங்கள். இன்றைய சிறந்த சந்தை விலை: ${rateTa(bestRateItem)}.`
                      : rain >= 30
                      ? `மதியம் அவ்வப்போது மழை — கீரையைச் சற்று குறைத்து வையுங்கள். சிறந்த விலை: ${rateTa(bestRateItem)}.`
                      : `வறண்ட மதியம் — கீரை வேகமாக விற்பனையாகும். கொத்தமல்லியை மதியத்துக்கு முன் விற்றுவிடுங்கள். சிறந்த விலை: ${rateTa(bestRateItem)}.`
                    : rain >= 60
                    ? `High rain risk at 3 PM — trim the leafy greens and keep the vegetables steady. Best mandi rate today: ${rateEn(bestRateItem)}.`
                    : rain >= 30
                    ? `Patchy rain this afternoon — trim leafy greens slightly. Best mandi rate: ${rateEn(bestRateItem)}.`
                    : `Clear afternoon, so greens will sell fast — keep leafy stock steady and sell coriander early. Best mandi rate: ${rateEn(bestRateItem)}.`}
                </p>
                <div className="hw-brief-actions">
                  <button className="hw-btn hw-btn-light" onClick={playBriefing}>
                    <span aria-hidden="true">▶</span> {t("playBriefing")}
                  </button>
                  <button className="hw-btn hw-btn-ghost" onClick={() => setTab("orders")}>
                    {t("viewOrder")}
                  </button>
                </div>
              </div>

              <div className="hw-brief-side">
                <div className="hw-soundbox">
                  <div className="hw-soundbox-speaker" aria-hidden="true">
                    🔊
                  </div>
                  <div className="hw-soundbox-body">
                    <div className="hw-soundbox-title">{t("soundbox")}</div>
                    <div className={"hw-wave" + (speaking ? " is-live" : "")} aria-hidden="true">
                      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                        <span key={i} style={{ animationDelay: `${i * 0.11}s` }} />
                      ))}
                    </div>
                    <div className="hw-soundbox-sub">{speaking ? t("soundboxLive") : t("soundboxIdle")}</div>
                  </div>
                </div>
                <div className="hw-money">
                  <div>
                    <span className="hw-money-label">{t("workingCapital")}</span>
                    <strong>{inr(MERCHANT.workingCapital)}</strong>
                  </div>
                  <div>
                    <span className="hw-money-label">{t("takeHome")}</span>
                    <strong>
                      {inr(S.takeHome)} <em>+34%</em>
                    </strong>
                  </div>
                </div>
              </div>
            </section>

            <div className="hw-dash-grid">
              <section className="hw-card">
                <div className="hw-card-head">
                  <h2>🛒 {t("todaysOrder")}</h2>
                  {pending ? (
                    <span className="hw-badge amber">{t("pending")}</span>
                  ) : (
                    <span className="hw-badge green">{t("ready")}</span>
                  )}
                </div>

                <div className="hw-table">
                  <div className="hw-tr hw-tr-head">
                    <span>{t("colCommodity")}</span>
                    <span>{t("colQty")}</span>
                    <span>{t("colShelf")}</span>
                    <span>{t("colRisk")}</span>
                  </div>
                  {S.order.map((item) => {
                    const hours = effectiveShelfHours(item, rain);
                    const risk = riskFor(hours, rain);
                    const riskLabel =
                      risk.label === "High" ? t("riskHigh") : risk.label === "Medium" ? t("riskMedium") : t("riskLow");
                    return (
                      <div className="hw-tr" key={item.id}>
                        <span className="hw-commodity">
                          <span className="hw-emoji" aria-hidden="true">
                            {item.emoji}
                          </span>
                          <span>
                            <strong>{item.name}</strong>
                            <small>
                              ₹{item.price}/{item.unit === "kg" ? "kg" : item.unit.replace(/s$/, "")}
                            </small>
                          </span>
                        </span>
                        <span className="hw-qty">
                          <button onClick={() => setQty(item.id, -1)} aria-label={`Reduce ${item.name}`}>
                            −
                          </button>
                          <b>{item.qty}</b>
                          <button onClick={() => setQty(item.id, +1)} aria-label={`Increase ${item.name}`}>
                            +
                          </button>
                        </span>
                        <span className="hw-shelf">{shelfLabel(hours)}</span>
                        <span>
                          <span className={"hw-pill " + risk.tone}>{riskLabel}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="hw-card-foot">
                  <div className="hw-total">
                    <span>{t("total")}</span>
                    <strong>{inr(total)}</strong>
                  </div>
                  <div className="hw-foot-actions">
                    <button className="hw-btn hw-btn-primary" onClick={recalcOrder}>
                      ⚡ {t("recalcBtn")}
                    </button>
                    <button className="hw-btn hw-btn-outline" onClick={dispatchOrder}>
                      📤 {t("dispatchBtn")} {MERCHANT.wholesaler}
                    </button>
                  </div>
                </div>

                {pending && (
                  <div className="hw-approve">
                    <div className="hw-approve-head">
                      <strong>⚡ {t("approvalTitle")}</strong>
                      <span className="hw-badge green">
                        {t("approvalPreserves")} {inr(pending.preserved)}
                      </span>
                    </div>
                    <p>
                      {pending.rain >= 30
                        ? fmt(t("approvalBody"), { rain: pending.rain, amount: inr(pending.amount) })
                        : fmt(t("approvalBodyDry"), { amount: inr(pending.amount) })}
                    </p>
                    <ul>
                      {pending.changes.length ? (
                        pending.changes.map((change) => (
                          <li key={change.name}>
                            {change.name}: <s>{change.from}</s> → <b>{change.to}</b> {change.unit}
                          </li>
                        ))
                      ) : (
                        <li>{t("approvalNone")}</li>
                      )}
                    </ul>
                    <div className="hw-approve-actions">
                      <button className="hw-btn hw-btn-primary" onClick={dispatchOrder}>
                        ✓ {t("approveYes")}
                      </button>
                      <button className="hw-btn hw-btn-outline" onClick={declinePending}>
                        {t("cancel")}
                      </button>
                      <span className="hw-gate">{t("gateNote")}</span>
                    </div>
                  </div>
                )}
              </section>
            </div>

            <section className="hw-card hw-demo">
              <button
                className="hw-card-head hw-accordion-head"
                onClick={() => setDemoOpen((o) => !o)}
                aria-expanded={demoOpen}
              >
                <div>
                  <h2>🎬 {t("demoTitle")}</h2>
                  <span className="hw-muted">{t("demoHint")}</span>
                </div>
                <span className={"hw-chevron" + (demoOpen ? " is-open" : "")} aria-hidden="true">
                  ▾
                </span>
              </button>
              {demoOpen && (
                <div className="hw-demo-grid">
                  {demoSteps.map((step) => (
                    <button className="hw-demo-step" key={step.time} onClick={step.action}>
                      <span className="hw-demo-time">{step.time}</span>
                      <strong>{step.title}</strong>
                      <p>{step.text}</p>
                      <span className="hw-demo-cta">{step.cta} →</span>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="hw-card hw-memory-strip">
              <div className="hw-card-head">
                <h2>🧠 {t("memoryTitle")}</h2>
                <button className="hw-link" onClick={() => setTab("memory")}>
                  {t("openMemory")}
                </button>
              </div>
              <div className="hw-timeline">
                {S.memory.slice(0, 3).map((entry) => (
                  <div className="hw-tl-item" key={entry.id}>
                    <span className="hw-tl-dot" />
                    <span className="hw-tl-when">{entry.when}</span>
                    <span className="hw-tl-text">{entry.text}</span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {tab === "orders" && (
          <>
            <div className="hw-page-head">
              <h1>{t("ordersTitle")}</h1>
              <p>{t("ordersSub")}</p>
            </div>

            <section className="hw-summary">
              <div>
                <span>{t("ordersSpend")}</span>
                <strong>{inr(orderSpend)}</strong>
              </div>
              <div>
                <span>{t("ordersAvg")}</span>
                <strong>{inr(orderAvg)}</strong>
              </div>
              <div>
                <span>{t("ordersActive")}</span>
                <strong>{ordersActive}</strong>
              </div>
            </section>

            <div className="hw-columns">
              <section className="hw-card hw-inbox" id="inbox">
                <div className="hw-card-head">
                  <div>
                    <h2>📥 {t("inboxTitle")}</h2>
                    <p className="hw-card-sub">{t("inboxSub")}</p>
                  </div>
                  <span className="hw-badge green">{inboxCounts.all}</span>
                </div>

                <div className="hw-inbox-filters" role="tablist" aria-label={t("inboxTitle")}>
                  {[
                    { id: "all", label: t("inboxAll") },
                    { id: "pending", label: t("inboxPending") },
                    { id: "dispatched", label: t("inboxDispatched") },
                    { id: "delivered", label: t("inboxDelivered") },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      role="tab"
                      aria-selected={inboxFilter === filter.id}
                      className={"hw-inbox-filter" + (inboxFilter === filter.id ? " is-active" : "")}
                      onClick={() => setInboxFilter(filter.id)}
                    >
                      {filter.label}
                      <span>{inboxCounts[filter.id]}</span>
                    </button>
                  ))}
                </div>

                <div className="hw-inbox-list">
                  {showPendingCard && (
                    <article className="hw-inbox-item is-pending">
                      <div className="hw-inbox-top">
                        <strong>⚡ {t("approvalTitle")}</strong>
                        <span className="hw-dispatch-amt">{inr(pending.amount)}</span>
                      </div>
                      <div className="hw-inbox-meta">
                        {pending.rain >= 30
                          ? fmt(t("approvalBody"), { rain: pending.rain, amount: inr(pending.amount) })
                          : fmt(t("approvalBodyDry"), { amount: inr(pending.amount) })}
                      </div>
                      <div className="hw-inbox-meta">
                        {pending.changes.length
                          ? pending.changes.map((c) => `${c.name} ${c.from}→${c.to}`).join(" · ")
                          : t("approvalNone")}
                      </div>
                      <div className="hw-inbox-bottom">
                        <span className="hw-pill amber">{t("inboxPending")}</span>
                        <div className="hw-inbox-actions">
                          <button className="hw-btn hw-btn-outline" onClick={declinePending}>
                            {t("inboxDecline")}
                          </button>
                          <button className="hw-btn hw-btn-primary" onClick={dispatchOrder}>
                            ✓ {t("inboxApprove")}
                          </button>
                        </div>
                      </div>
                    </article>
                  )}

                  {inboxDispatches.map((dispatch) => (
                    <article className="hw-inbox-item" key={dispatch.id}>
                      <div className="hw-inbox-top">
                        <strong>{dispatch.to}</strong>
                        <span className="hw-dispatch-amt">{inr(dispatch.amount)}</span>
                      </div>
                      <div className="hw-inbox-meta">
                        {dispatch.when} · {dispatch.items}
                      </div>
                      <div className="hw-track" aria-label={t("tracking")}>
                        {["Dispatched", "In transit", "Delivered"].map((stage) => {
                          const stages = ["Dispatched", "In transit", "Delivered"];
                          const current = stages.indexOf(dispatch.status);
                          const index = stages.indexOf(stage);
                          return (
                            <span
                              key={stage}
                              className={
                                "hw-track-step" +
                                (index <= current ? " is-done" : "") +
                                (index === current ? " is-current" : "")
                              }
                            >
                              <span className="hw-track-dot" />
                              {statusLabel(stage)}
                            </span>
                          );
                        })}
                      </div>
                      <div className="hw-inbox-bottom is-tracked">
                        <div className="hw-inbox-actions">
                          {dispatch.waUrl && (
                            <a className="hw-link" href={dispatch.waUrl} target="_blank" rel="noreferrer">
                              WhatsApp →
                            </a>
                          )}
                          {dispatch.status !== "Delivered" && (
                            <button className="hw-btn hw-btn-outline" onClick={() => advanceDispatch(dispatch.id)}>
                              {dispatch.status === "Dispatched" ? t("inboxTransit") : t("inboxDeliver")}
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}

                  {!showPendingCard && !inboxDispatches.length && (
                    <p className="hw-inbox-empty">{t("inboxEmpty")}</p>
                  )}
                </div>
              </section>

              <section className="hw-card">
                <div className="hw-card-head">
                  <h2>💰 {t("proTitle")}</h2>
                  <span className="hw-badge blue">₹149 / month</span>
                </div>
                <p className="hw-copy">{t("proCopy")}</p>
                <ul className="hw-checklist">
                  <li>{t("pro1")}</li>
                  <li>{t("pro2")}</li>
                  <li>{t("pro3")}</li>
                  <li>{t("pro4")}</li>
                </ul>
                <button className="hw-btn hw-btn-primary" onClick={() => notify(t("toastSimulate"))}>
                  {t("simulate")}
                </button>
                <button className="hw-btn hw-btn-outline" onClick={dispatchOrder}>
                  {t("dispatchCurrent")}
                </button>
              </section>
            </div>

            <section className="hw-card hw-products">
              <div className="hw-card-head">
                <div>
                  <h2>🧺 {t("productsTitle")}</h2>
                  <p className="hw-card-sub">{t("productsSub")}</p>
                </div>
                <span className="hw-badge blue">{inr(total)}</span>
              </div>

              <div className="hw-product-table">
                <div className="hw-product-row hw-product-head">
                  <span>{t("productName")}</span>
                  <span>{t("productPrice")}</span>
                  <span>{t("productQty")}</span>
                  <span>{t("stockHeader")}</span>
                  <span>{t("productUnit")}</span>
                  <span>{t("productPerishable")}</span>
                  <span />
                </div>
                {S.order.map((item) => (
                  <div className="hw-product-row" key={item.id}>
                    <span className="hw-product-name">
                      <span aria-hidden="true">{item.emoji}</span> {item.name}
                    </span>
                    <span className="hw-product-price">
                      ₹
                      <input
                        type="number"
                        min="1"
                        value={item.price}
                        onChange={(event) =>
                          updateProduct(item.id, { price: Math.max(1, Number(event.target.value) || 1) })
                        }
                        aria-label={`${item.name} ${t("productPrice")}`}
                      />
                    </span>
                    <span className="hw-qty">
                      <button
                        onClick={() => updateProduct(item.id, { qty: Math.max(1, item.qty - 1) })}
                        aria-label={`Reduce ${item.name}`}
                      >
                        −
                      </button>
                      <b>{item.qty}</b>
                      <button
                        onClick={() => updateProduct(item.id, { qty: item.qty + 1 })}
                        aria-label={`Increase ${item.name}`}
                      >
                        +
                      </button>
                    </span>
                    <span className="hw-qty hw-stock">
                      <button
                        onClick={() => updateStock(item.id, -1)}
                        aria-label={`Reduce ${item.name} stock`}
                      >
                        −
                      </button>
                      <b>{Math.max(0, Number(item.stock) || 0)}</b>
                      <button
                        onClick={() => updateStock(item.id, 1)}
                        aria-label={`Increase ${item.name} stock`}
                      >
                        +
                      </button>
                      {(() => {
                        const vel = velocityFor(S, item.id, item.salesAvg || item.baseQty);
                        const stock = Math.max(0, Number(item.stock) || 0);
                        const cover = stock / Math.max(1, vel);
                        const low = cover < 0.5;
                        return (
                          <small
                            className={"hw-cover" + (low ? " is-low" : "")}
                            title={t("coverTitle")}
                          >
                            {cover >= 1 ? "≈" : ""}
                            {cover.toFixed(1)}d{low ? " ⚠" : ""}
                          </small>
                        );
                      })()}
                    </span>
                    <span>
                      <select
                        className="hw-unit"
                        value={item.unit}
                        onChange={(event) => updateProduct(item.id, { unit: event.target.value })}
                        aria-label={`${item.name} ${t("productUnit")}`}
                      >
                        {["kg", "crates", "bundles", "pieces"].map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </span>
                    <span>
                      <label className="hw-check">
                        <input
                          type="checkbox"
                          checked={item.perishable}
                          onChange={(event) =>
                            updateProduct(item.id, {
                              perishable: event.target.checked,
                              baseShelfHours: event.target.checked ? 24 : 72,
                            })
                          }
                          aria-label={`${item.name} ${t("productPerishable")}`}
                        />
                        <span aria-hidden="true">{item.perishable ? "🌿" : "📦"}</span>
                      </label>
                    </span>
                    <span>
                      <button
                        className="hw-product-remove"
                        onClick={() => removeProduct(item.id)}
                        title={t("removeProduct")}
                        aria-label={`${t("removeProduct")} ${item.name}`}
                      >
                        ✕
                      </button>
                    </span>
                  </div>
                ))}
              </div>

              <form className="hw-product-add" onSubmit={addProduct}>
                <input
                  value={draftProduct.name}
                  onChange={(event) => setDraftProduct((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder={t("newProduct")}
                  aria-label={t("newProduct")}
                  maxLength={28}
                />
                <input
                  type="number"
                  min="1"
                  value={draftProduct.price}
                  onChange={(event) => setDraftProduct((prev) => ({ ...prev, price: event.target.value }))}
                  placeholder={t("productPrice")}
                  aria-label={t("productPrice")}
                />
                <input
                  type="number"
                  min="1"
                  value={draftProduct.qty}
                  onChange={(event) => setDraftProduct((prev) => ({ ...prev, qty: event.target.value }))}
                  aria-label={t("productQty")}
                />
                <input
                  type="number"
                  min="0"
                  value={draftProduct.stock}
                  onChange={(event) => setDraftProduct((prev) => ({ ...prev, stock: event.target.value }))}
                  aria-label={t("stockHeader")}
                  placeholder="0"
                />
                <select
                  className="hw-unit"
                  value={draftProduct.unit}
                  onChange={(event) => setDraftProduct((prev) => ({ ...prev, unit: event.target.value }))}
                  aria-label={t("productUnit")}
                >
                  {["kg", "crates", "bundles", "pieces"].map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
                <select
                  className="hw-unit hw-cat-select"
                  value={draftProduct.category}
                  onChange={(event) => setDraftProduct((prev) => ({ ...prev, category: event.target.value }))}
                  aria-label={t("productCategory")}
                >
                  {["veg", "fruit", "leafy", "other"].map((cat) => (
                    <option key={cat} value={cat}>
                      {t("cat" + cat[0].toUpperCase() + cat.slice(1))}
                    </option>
                  ))}
                </select>
                <label className="hw-check">
                  <input
                    type="checkbox"
                    checked={draftProduct.perishable}
                    onChange={(event) => setDraftProduct((prev) => ({ ...prev, perishable: event.target.checked }))}
                    aria-label={t("productPerishable")}
                  />
                  <span aria-hidden="true">🌿</span>
                </label>
                <button type="submit" className="hw-btn hw-btn-primary">
                  ＋ {t("addProduct")}
                </button>
              </form>
              <p className="hw-stock-note">
                🌙 {t("stockNote")} {stockUpdateLabel() ? fmt(t("stockNoteLast"), { when: stockUpdateLabel() }) : t("stockNoteNever")}
              </p>
            </section>

            {/* 30-day order history — the evidence the prediction is built on */}
            <section className="hw-card hw-history">
              <div className="hw-card-head">
                <div>
                  <h2>🧾 {t("orderHistoryTitle")}</h2>
                  <p className="hw-card-sub">{t("orderHistorySub")}</p>
                </div>
                <span className="hw-badge blue">{orderHistory.length} {t("dataDays")}</span>
              </div>
              <div className="hw-history-list">
                {orderHistory.map((h) => (
                  <div className="hw-history-row" key={h.date}>
                    <span className="hw-history-date">
                      <b>{h.label}</b> <small>{h.dow}</small>
                    </span>
                    <span className={"hw-history-wx" + (h.rain >= 60 ? " is-rain" : "")}>
                      ☔ {h.rain}%
                    </span>
                    <span className="hw-history-total">₹{h.total.toLocaleString("en-IN")}</span>
                    <span className="hw-history-items">
                      {h.items.slice(0, 4).map((it) => `${it.emoji} ${it.name} ${it.qty} ${it.unit}`).join(" · ")}
                      {h.items.length > 4 ? " …" : ""}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {tab === "data" && (
          <>
            <section className="hw-card hw-data">
              <div className="hw-card-head">
                <div>
                  <h2>📊 {t("dataTitle")}</h2>
                  <p className="hw-card-sub">{t("dataSub")}</p>
                </div>
                <span className="hw-badge blue">{(S.salesHistory || []).length} {t("dataDays")}</span>
              </div>

              {/* Per-product cards: category, learned velocity, totals, sparkline. Tap a card for its 30-day story. */}
              <div className="hw-data-summary">
                {S.order.map((item) => {
                  const hist = S.salesHistory || [];
                  const recent = hist.slice(-14);
                  const st = dataStats(item);
                  const vel = velocityFor(S, item.id, item.salesAvg || item.baseQty);
                  const maxSold = Math.max(1, ...recent.map((day) => day.items.find((x) => x.id === item.id)?.sold || 0));
                  const isSel = dataSel === item.id;
                  return (
                    <button
                      key={item.id}
                      className={"hw-data-card" + (isSel ? " is-sel" : "")}
                      onClick={() => setDataSel(isSel ? null : item.id)}
                      aria-pressed={isSel}
                    >
                      <div className="hw-data-card-head">
                        <span className="hw-data-name">
                          <span aria-hidden="true">{item.emoji}</span> {item.name}
                        </span>
                        <span className={"hw-cat hw-cat-" + (item.category || "other")}>
                          {t("cat" + ((item.category || "other"))[0].toUpperCase() + (item.category || "other").slice(1))}
                        </span>
                      </div>
                      <div className="hw-data-bars" aria-hidden="true">
                        {recent.map((day) => {
                          const sold = day.items.find((x) => x.id === item.id)?.sold || 0;
                          const rainy = day.rain >= 60;
                          const stockVal = day.items.find((x) => x.id === item.id)?.stocked || 0;
                          return (
                            <span
                              key={day.date}
                              className="hw-bar-col"
                              title={`${day.label}: ${sold} sold · ${stockVal} stocked${rainy ? " · rain" : ""}`}
                            >
                              <span
                                className={"hw-bar" + (rainy ? " is-rain" : "")}
                                style={{ height: `${Math.max(8, Math.round((sold / maxSold) * 100))}%` }}
                              />
                              <span
                                className="hw-bar-stock"
                                style={{ height: `${Math.max(4, Math.round((stockVal / maxSold) * 100))}%` }}
                              />
                            </span>
                          );
                        })}
                      </div>
                      <div className="hw-data-card-meta">
                        <span>
                          <b>{st.totalSold}</b> {t("dataSold30")}
                        </span>
                        <span className="hw-data-vel">~{vel}/{t("dayShort")}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Detail: the selected product's stats + full 30-day timeline */}
              {(() => {
                const item = S.order.find((x) => x.id === dataSel);
                if (!item) return null;
                const hist = S.salesHistory || [];
                const st = dataStats(item);
                const days = hist.slice().reverse();
                const peak = Math.max(1, ...hist.flatMap((day) => [day.items.find((x) => x.id === item.id)?.sold || 0]));
                return (
                  <div className="hw-data-detail">
                    <div className="hw-data-detail-head">
                      <div className="hw-data-detail-title">
                        <span className="hw-data-name">
                          <span aria-hidden="true">{item.emoji}</span> {item.name}
                        </span>
                        <span className={"hw-cat hw-cat-" + (item.category || "other")}>
                          {t("cat" + ((item.category || "other"))[0].toUpperCase() + (item.category || "other").slice(1))}
                        </span>
                      </div>
                      <button className="hw-btn hw-btn-outline hw-btn-sm" onClick={() => setDataSel(null)}>
                        ← {t("dataBack")}
                      </button>
                    </div>
                    <div className="hw-chips-row">
                      <span className="hw-stat-chip">
                        {t("statTotal")}: <b>{st.totalSold}</b> {item.unit}
                      </span>
                      <span className="hw-stat-chip">
                        {t("statPeak")}: <b>{st.peak}</b> {item.unit}
                      </span>
                      <span className="hw-stat-chip">
                        {t("statBestDow")}: <b>{st.bestDow}</b>
                      </span>
                      {st.rainAvg != null && (
                        <span className="hw-stat-chip is-rain">
                          {t("statRainAvg")}: <b>{st.rainAvg}</b> vs {st.clearAvg}
                        </span>
                      )}
                    </div>
                    <div className="hw-timeline">
                      {days.map((day) => {
                        const it = day.items.find((x) => x.id === item.id);
                        const sold = it?.sold || 0;
                        const stocked = it?.stocked || 0;
                        const rainy = day.rain >= 60;
                        return (
                          <div className={"hw-day-row" + (rainy ? " is-rain" : "")} key={day.date}>
                            <span className="hw-day-date">
                              <b>{day.label}</b> <small>{day.dow}</small>
                            </span>
                            <span className="hw-day-wx">
                              ☔ {day.rain}% · 🌡 {day.temp}°
                            </span>
                            <span className="hw-day-bar-wrap">
                              <span
                                className="hw-day-bar"
                                style={{ width: `${Math.max(4, Math.round((sold / peak) * 100))}%` }}
                              />
                              <span className="hw-day-sold">
                                <b>{sold}</b> {item.unit}
                              </span>
                            </span>
                            <span className="hw-day-stocked">🌙 {stocked} {item.unit}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
              <p className="hw-data-note">{t("dataNote")}</p>
            </section>
          </>
        )}

        {tab === "memory" && (
          <>
            <div className="hw-page-head">
              <h1>{t("memoryPageTitle")}</h1>
              <p>{t("memoryPageSub")}</p>
            </div>

            <section className="hw-card hw-graph-ask">
              <div className="hw-card-head">
                <div>
                  <h2>🔎 {t("graphAskTitle")}</h2>
                  <p className="hw-card-sub">{t("graphAskSub")}</p>
                </div>
                <span className={"hw-live" + (cognee.cognee ? "" : " is-off")}>
                  <span className="dot" />
                  {cognee.checked ? (cognee.cognee ? t("graphAskLive") : t("graphAskOff")) : "· · ·"}
                </span>
              </div>
              <form
                className="hw-graph-ask-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  askGraph();
                }}
              >
                <input
                  value={graphQuery}
                  onChange={(event) => setGraphQuery(event.target.value)}
                  placeholder={t("graphAskPlaceholder")}
                  aria-label={t("graphAskPlaceholder")}
                />
                <button type="submit" className="hw-btn hw-btn-primary" disabled={graphLoading}>
                  {graphLoading ? t("graphAskThinking") : t("graphAskBtn")}
                </button>
              </form>
              {graphAnswer && (
                <div className={"hw-graph-answer" + (graphAnswer.source === "local" ? " is-local" : "")}>
                  <span className="hw-graph-answer-src">
                    {graphAnswer.source === "cognee" ? t("graphAskLive") : t("graphAskLocal")}
                  </span>
                  <p>
                    {graphAnswer.text
                      ? graphAnswer.text.split("\n").map((line, index) => (
                          <span key={index}>
                            {line}
                            <br />
                          </span>
                        ))
                      : t("graphAskEmpty")}
                  </p>
                </div>
              )}
            </section>

            <div className="hw-columns">
              <section className="hw-card">
                <div className="hw-card-head">
                  <h2>🕸️ {t("causalFactors")}</h2>
                  <span className="hw-muted">{t("liveEdges")}</span>
                </div>
                <div className="hw-graph">
                  <div className="hw-graph-core">
                    {name} · {place.name}
                  </div>
                  <div className="hw-graph-nodes">
                    {GRAPH_NODES.map((node) => (
                      <span className="hw-node" key={node}>
                        {node}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="hw-graph-note">{t("graphNote")}</div>
              </section>

              <section className="hw-card">
                <div className="hw-card-head">
                  <h2>📜 {t("auditTrail")}</h2>
                  <span className="hw-badge blue">
                    {S.memory.length} {lang === "ta" ? "பதிவுகள்" : "events"}
                  </span>
                </div>
                <div className="hw-timeline">
                  {S.memory.map((entry) => (
                    <div className="hw-tl-item" key={entry.id}>
                      <span className="hw-tl-dot" />
                      <span className="hw-tl-when">{entry.when}</span>
                      <span className="hw-tl-text">{entry.text}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}

        {tab === "settings" && (
          <>
            <div className="hw-page-head">
              <h1>{t("settingsTitle")}</h1>
              <p>{t("settingsSub")}</p>
            </div>

            <section className="hw-card hw-settings">
              <div className="hw-setting">
                <div>
                  <strong>📍 {t("setLocation")}</strong>
                  <span>{t("setLocationDesc")}</span>
                </div>
                <select
                  className="hw-select"
                  value={S.location}
                  onChange={(event) => changeLocation(event.target.value)}
                  aria-label={t("setLocation")}
                >
                  {LOCATIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name} · {option.mandi}
                    </option>
                  ))}
                </select>
              </div>

              <div className="hw-setting">
                <div>
                  <strong>{t("language")}</strong>
                  <span>{t("languageDesc")}</span>
                </div>
                <div className="hw-lang">
                  {LANGUAGES.map((option) => (
                    <button
                      key={option.code}
                      className={"hw-lang-btn" + (lang === option.code ? " is-on" : "")}
                      onClick={() => changeLanguage(option.code)}
                    >
                      {option.native}
                    </button>
                  ))}
                </div>
              </div>

              {[
                { field: "upi", title: t("setUpi"), desc: t("setUpiDesc") },
                { field: "weather", title: t("setWeather"), desc: t("setWeatherDesc") },
                { field: "mandi", title: t("setMandi"), desc: t("setMandiDesc") },
                { field: "soundbox", title: t("setSoundbox"), desc: t("setSoundboxDesc") },
                { field: "autodispatch", title: t("setAuto"), desc: t("setAutoDesc") },
                { field: "voiceout", title: t("setVoice"), desc: t("setVoiceDesc") },
              ].map((row) => (
                <div className="hw-setting" key={row.field}>
                  <div>
                    <strong>{row.title}</strong>
                    <span>{row.desc}</span>
                  </div>
                  <button
                    className={"hw-switch" + (S.settings[row.field] ? " on" : "")}
                    onClick={() => toggleSetting(row.field)}
                    aria-pressed={S.settings[row.field]}
                    aria-label={row.title}
                  >
                    <span />
                  </button>
                </div>
              ))}

              <div className="hw-setting">
                <div>
                  <strong>{t("testVoice")}</strong>
                  <span>{ai.tts ? fmt(t("testVoiceOn"), { model: ai.models?.tts || "bulbul" }) : t("testVoiceOff")}</span>
                </div>
                <button className="hw-btn hw-btn-outline" onClick={playVoiceSample}>
                  {t("playSample")}
                </button>
              </div>

              <div className="hw-setting">
                <div>
                  <strong>{t("resetDemo")}</strong>
                  <span>{t("resetDemoDesc")}</span>
                </div>
                <button className="hw-btn hw-btn-outline" onClick={resetDemo}>
                  {t("reset")}
                </button>
              </div>
            </section>

            <section className="hw-card hw-consent">
              <h2>{t("consentTitle")}</h2>
              <p>{t("consentBody")}</p>
            </section>
          </>
        )}
      </main>

        <footer className="hw-footer">
          {t("footer")}
          <div className="hw-footer-team">{t("footerTeam")}</div>
        </footer>
      </div>

      {paletteOpen && (
        <div className="hw-cmdk-scrim" onClick={closePalette}>
          <div
            className="hw-cmdk"
            role="dialog"
            aria-modal="true"
            aria-label={t("paletteOpen")}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="hw-cmdk-search">
              <span aria-hidden="true">⌘</span>
              <input
                ref={paletteInputRef}
                value={paletteQuery}
                onChange={(event) => setPaletteQuery(event.target.value)}
                onKeyDown={onPaletteKey}
                placeholder={t("palettePlaceholder")}
                aria-label={t("palettePlaceholder")}
              />
              <button
                className="hw-cmdk-mic"
                onClick={() => {
                  closePalette();
                  setTab("today");
                  toggleMic();
                }}
                title={t("paletteVoice")}
                aria-label={t("paletteVoice")}
              >
                🎙️
              </button>
              <kbd>Esc</kbd>
            </div>

            <div className="hw-cmdk-list">
              {paletteRows.map((row, index) => {
                const previous = paletteRows[index - 1];
                const header = !previous || previous.group !== row.group;
                return (
                  <React.Fragment key={row.label + index}>
                    {header && (
                      <div className="hw-cmdk-group">
                        {row.group === "go"
                          ? t("paletteGroupGo")
                          : row.group === "ask"
                          ? t("paletteAsk")
                          : t("paletteGroupAct")}
                      </div>
                    )}
                    <button
                      className={"hw-cmdk-item" + (index === paletteIndex ? " is-active" : "")}
                      onMouseEnter={() => setPaletteIndex(index)}
                      onClick={() => runPaletteRow(row)}
                    >
                      <span className="hw-cmdk-icon" aria-hidden="true">
                        {row.icon}
                      </span>
                      <span className="hw-cmdk-text">
                        <b>{row.group === "ask" ? `${t("paletteAsk")}: ${row.label}` : row.label}</b>
                        <small>{row.hint}</small>
                      </span>
                      {index === paletteIndex && <kbd>↵</kbd>}
                    </button>
                  </React.Fragment>
                );
              })}
              {!paletteRows.length && <p className="hw-cmdk-empty">{t("paletteEmpty")}</p>}
            </div>

            <div className="hw-cmdk-foot">
              <span>{t("paletteHint")}</span>
              <span>⌘K</span>
            </div>
          </div>
        </div>
      )}

      {tourStep >= 0 && TOUR_STEPS[tourStep] && (
        <div className="hw-tour" role="dialog" aria-modal="true" aria-label={t("tourTitle")}>
          {tourRect && (
            <div
              className="hw-tour-ring"
              style={{
                top: Math.max(4, tourRect.top - 6),
                left: Math.max(4, tourRect.left - 6),
                width: tourRect.width + 12,
                height: tourRect.height + 12,
              }}
            />
          )}
          <div className="hw-tour-card">
            <span className="hw-tour-step">
              {t("tourTitle")} · {tourStep + 1}/{TOUR_STEPS.length}
            </span>
            <strong>{TOUR_STEPS[tourStep].title}</strong>
            <p>{TOUR_STEPS[tourStep].body}</p>
            <div className="hw-tour-actions">
              <button className="hw-link" onClick={() => setTourStep(-1)}>
                {t("tourSkip")}
              </button>
              <div className="hw-tour-nav">
                {tourStep > 0 && (
                  <button className="hw-btn hw-btn-outline" onClick={() => setTourStep((step) => step - 1)}>
                    {t("tourBack")}
                  </button>
                )}
                <button
                  className="hw-btn hw-btn-primary"
                  onClick={() => {
                    if (tourStep === TOUR_STEPS.length - 1) {
                      setTourStep(-1);
                      setTab("today");
                    } else {
                      setTourStep((step) => step + 1);
                    }
                  }}
                >
                  {tourStep === TOUR_STEPS.length - 1 ? t("tourDone") : t("tourNext")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {stockModalOpen && (
        <div className="hw-modal-overlay" onClick={() => setStockModalOpen(false)}>
          <div
            className="hw-modal"
            role="dialog"
            aria-modal="true"
            aria-label={t("stockWidgetTitle")}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="hw-modal-head">
              <h3>🌙 {t("stockModalTitle")}</h3>
              <p className="hw-modal-sub">{t("stockModalSub")}</p>
              <button
                className="hw-modal-close"
                onClick={() => setStockModalOpen(false)}
                aria-label={t("dismiss")}
              >
                ✕
              </button>
            </div>
            <div className="hw-modal-body">
              {["veg", "fruit", "leafy", "other"].map((cat) => {
                const items = S.order.filter((item) => (item.category || "other") === cat);
                if (!items.length) return null;
                return (
                  <div key={cat} className="hw-stock-group">
                    <div className="hw-stock-group-label">
                      {t("cat" + cat[0].toUpperCase() + cat.slice(1))}
                    </div>
                    {items.map((item) => (
                      <div className="hw-stock-line" key={item.id}>
                        <span className="hw-stock-name">
                          <span aria-hidden="true">{item.emoji}</span> {item.name}
                        </span>
                        <span className="hw-qty hw-stock">
                          <button
                            onClick={() => updateStock(item.id, -1)}
                            aria-label={`Reduce ${item.name} stock`}
                          >
                            −
                          </button>
                          <b>{Math.max(0, Number(item.stock) || 0)}</b>
                          <button
                            onClick={() => updateStock(item.id, 1)}
                            aria-label={`Increase ${item.name} stock`}
                          >
                            +
                          </button>
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
            <div className="hw-modal-foot">
              <button className="hw-btn hw-btn-ghost" onClick={() => setStockModalOpen(false)}>
                {t("cancel")}
              </button>
              <button
                className="hw-btn hw-btn-primary"
                onClick={() => {
                  markStockUpdated();
                  setStockModalOpen(false);
                }}
              >
                {t("stockModalDone")}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="hw-toast">{toast}</div>}
    </div>
  );
}
