/* ============================================================
   HarvestWise — domain model, spoilage math and copilot brain
   Everything runs client-side so the demo never depends on a key.
   ============================================================ */

export const MERCHANT = {
  name: "Lakshmi",
  stall: "Basavanagudi",
  city: "Bengaluru",
  mandi: "Kalasipalya",
  wholesaler: "Ravi anna",
  wholesalerPhone: "919999999999",
  upi: "lakshmi@paytm",
  workingCapital: 3500,
};

export const CITY = { name: "Bengaluru", lat: 12.9716, lon: 77.5946 };

/* Real Bengaluru neighbourhood pins — weather and mandi follow the chosen one. */
export const LOCATIONS = [
  { id: "basavanagudi", name: "Basavanagudi", lat: 12.9422, lon: 77.5738, mandi: "Kalasipalya", region: "blr" },
  { id: "jayanagar", name: "Jayanagar", lat: 12.9308, lon: 77.5838, mandi: "Kalasipalya", region: "blr" },
  { id: "malleshwaram", name: "Malleshwaram", lat: 13.0035, lon: 77.5647, mandi: "Yeshwanthpur", region: "blr" },
  { id: "indiranagar", name: "Indiranagar", lat: 12.9719, lon: 77.6412, mandi: "KR Market", region: "blr" },
  { id: "koramangala", name: "Koramangala", lat: 12.9352, lon: 77.6245, mandi: "KR Market", region: "blr" },
  { id: "hsr", name: "HSR Layout", lat: 12.9121, lon: 77.6446, mandi: "KR Market", region: "blr" },
  { id: "yeshwanthpur", name: "Yeshwanthpur", lat: 13.0284, lon: 77.554, mandi: "Yeshwanthpur", region: "blr" },
  { id: "whitefield", name: "Whitefield", lat: 12.9698, lon: 77.75, mandi: "KR Market", region: "blr" },
  /* Tamil Nadu main cities */
  { id: "chennai", name: "Chennai", lat: 13.0827, lon: 80.2707, mandi: "Koyambedu", region: "tn" },
  { id: "coimbatore", name: "Coimbatore", lat: 11.0168, lon: 76.9558, mandi: "Gandhipuram", region: "tn" },
  { id: "madurai", name: "Madurai", lat: 9.9252, lon: 78.1198, mandi: "Mattuthavani", region: "tn" },
  { id: "tiruchirappalli", name: "Tiruchirappalli", lat: 10.7905, lon: 78.7047, mandi: "Chathiram", region: "tn" },
  { id: "salem", name: "Salem", lat: 11.6643, lon: 78.146, mandi: "Salem Main Market", region: "tn" },
  { id: "erode", name: "Erode", lat: 11.341, lon: 77.7172, mandi: "Erode Veg Market", region: "tn" },
  { id: "thoothukudi", name: "Thoothukudi", lat: 8.7642, lon: 78.1348, mandi: "Tuticorin Market", region: "tn" },
  { id: "thanjavur", name: "Thanjavur", lat: 10.787, lon: 79.1378, mandi: "Thanjavur Market", region: "tn" },
];

export const DEFAULT_LOCATION = "basavanagudi";

export function locationById(id) {
  return LOCATIONS.find((place) => place.id === id) || LOCATIONS[0];
}

/* ---------- commodities ---------- */
export function seedOrder() {
  return [
    /* vegetables */
    {
      id: "tomatoes",
      name: "Tomatoes",
      emoji: "🍅",
      category: "veg",
      unit: "crates",
      price: 138,
      baseShelfHours: 48,
      qty: 3,
      baseQty: 3,
      stock: 1,
      salesAvg: 4,
      perishable: false,
    },
    {
      id: "beans",
      name: "Beans",
      emoji: "🫛",
      category: "veg",
      unit: "kg",
      price: 42,
      baseShelfHours: 72,
      qty: 5,
      baseQty: 5,
      stock: 2,
      salesAvg: 5,
      perishable: false,
    },
    {
      id: "potatoes",
      name: "Potatoes",
      emoji: "🥔",
      category: "veg",
      unit: "kg",
      price: 32,
      baseShelfHours: 120,
      qty: 8,
      baseQty: 8,
      stock: 4,
      salesAvg: 6,
      perishable: false,
    },
    {
      id: "onions",
      name: "Onions",
      emoji: "🧅",
      category: "veg",
      unit: "kg",
      price: 38,
      baseShelfHours: 168,
      qty: 6,
      baseQty: 6,
      stock: 3,
      salesAvg: 5,
      perishable: false,
    },
    {
      id: "brinjal",
      name: "Brinjal",
      emoji: "🍆",
      category: "veg",
      unit: "kg",
      price: 45,
      baseShelfHours: 48,
      qty: 4,
      baseQty: 4,
      stock: 2,
      salesAvg: 4,
      perishable: false,
    },
    {
      id: "capsicum",
      name: "Capsicum",
      emoji: "🫑",
      category: "veg",
      unit: "kg",
      price: 60,
      baseShelfHours: 72,
      qty: 3,
      baseQty: 3,
      stock: 1,
      salesAvg: 3,
      perishable: false,
    },
    {
      id: "carrot",
      name: "Carrot",
      emoji: "🥕",
      category: "veg",
      unit: "kg",
      price: 40,
      baseShelfHours: 96,
      qty: 5,
      baseQty: 5,
      stock: 2,
      salesAvg: 4,
      perishable: false,
    },
    /* leafy */
    {
      id: "coriander",
      name: "Coriander",
      emoji: "🌿",
      category: "leafy",
      unit: "bundles",
      price: 22,
      baseShelfHours: 8,
      qty: 10,
      baseQty: 10,
      stock: 2,
      salesAvg: 10,
      perishable: true,
    },
    {
      id: "palak",
      name: "Palak (greens)",
      emoji: "🥬",
      category: "leafy",
      unit: "bundles",
      price: 20,
      baseShelfHours: 24,
      qty: 6,
      baseQty: 6,
      stock: 0,
      salesAvg: 8,
      perishable: true,
    },
    {
      id: "methi",
      name: "Methi",
      emoji: "🌱",
      category: "leafy",
      unit: "bundles",
      price: 25,
      baseShelfHours: 12,
      qty: 4,
      baseQty: 4,
      stock: 1,
      salesAvg: 5,
      perishable: true,
    },
    /* fruits */
    {
      id: "banana",
      name: "Banana",
      emoji: "🍌",
      category: "fruit",
      unit: "dozen",
      price: 48,
      baseShelfHours: 72,
      qty: 5,
      baseQty: 5,
      stock: 2,
      salesAvg: 6,
      perishable: false,
    },
    {
      id: "apple",
      name: "Apple",
      emoji: "🍎",
      category: "fruit",
      unit: "kg",
      price: 120,
      baseShelfHours: 240,
      qty: 3,
      baseQty: 3,
      stock: 1,
      salesAvg: 3,
      perishable: false,
    },
    {
      id: "mosambi",
      name: "Mosambi",
      emoji: "🍊",
      category: "fruit",
      unit: "kg",
      price: 55,
      baseShelfHours: 120,
      qty: 4,
      baseQty: 4,
      stock: 2,
      salesAvg: 4,
      perishable: false,
    },
    /* others */
    {
      id: "eggs",
      name: "Eggs",
      emoji: "🥚",
      category: "other",
      unit: "pieces",
      price: 7,
      baseShelfHours: 336,
      qty: 30,
      baseQty: 30,
      stock: 12,
      salesAvg: 24,
      perishable: false,
    },
    {
      id: "coconut",
      name: "Coconut",
      emoji: "🥥",
      category: "other",
      unit: "pieces",
      price: 28,
      baseShelfHours: 360,
      qty: 8,
      baseQty: 8,
      stock: 3,
      salesAvg: 8,
      perishable: false,
    },
  ];
}

export function seedDispatches() {
  return [
    {
      id: "d1",
      when: "Yesterday · 11:04 AM",
      to: MERCHANT.wholesaler,
      items: "Tomatoes 4 crates · Palak 8 bundles",
      amount: 712,
      status: "Delivered",
    },
    {
      id: "d2",
      when: "2 days ago · 11:20 AM",
      to: "Kalasipalya mandi",
      items: "Beans 6 kg · Tomatoes 2 crates",
      amount: 528,
      status: "Delivered",
    },
  ];
}

export function seedMemory() {
  return [
    {
      id: "m1",
      when: "Mon · rain recalc",
      text: "Rain 80% → coriander 10→6, palak 6→4. Kept ₹1,940. ✓ Worked.",
      outcome: "worked",
    },
    {
      id: "m2",
      when: "Wed · Ganesh Chaturthi",
      text: "Festival demand spike — greens +40%. Pre-stocked. ✓ Worked.",
      outcome: "worked",
    },
    {
      id: "m3",
      when: "Fri · heatwave",
      text: "Leafy shelf-life cut to 3h. Reduced order 30%. ✓ Worked.",
      outcome: "worked",
    },
  ];
}

/* The copilot greeting, reused for the seed session, new sessions and cleared chats. */
export function greetingText(name, lang = "en") {
  const who = name || MERCHANT.name;
  return lang === "ta"
    ? `வணக்கம் ${who}! 🙏 நான் உங்கள் HarvestWise கோபைலட். இன்றைய ஆர்டர், கெட்டுப்போகும் ஆபத்து, சந்தை விலை — எதையும் கேளுங்கள், அல்லது “ஆர்டரை மீண்டும் கணக்கிடு” என்று சொல்லுங்கள்.`
    : `Namaskara ${who}! 🙏 I'm your HarvestWise copilot. Ask me about today's order, spoilage risk or mandi rates — or say “recalculate my order”.`;
}

export function newSessionId() {
  return `s-${Date.now()}-${Math.round(Math.random() * 1e5)}`;
}

export function defaultState() {
  const seedSession = {
    id: "s-seed",
    title: "Today's chat",
    when: "Today",
    messages: [{ id: "hello", role: "bot", text: greetingText(MERCHANT.name, "en") }],
  };
  /* Current shelf stock = what the merchant logged at 9 PM last night (the
     newest day of the 30-day ledger), so stock management and the prediction
     start from the same number. */
  const ledger = seedSalesHistory();
  const lastNight = ledger[ledger.length - 1];
  const order = seedOrder().map((item) => {
    const logged = lastNight?.items.find((x) => x.id === item.id);
    return { ...item, stock: logged ? logged.stocked : item.stock };
  });
  return {
    name: MERCHANT.name,
    location: DEFAULT_LOCATION,
    scenario: "live",
    order,
    dispatches: seedDispatches(),
    memory: seedMemory(),
    settings: {
      upi: true,
      weather: true,
      mandi: true,
      soundbox: true,
      autodispatch: false,
      voiceout: true,
      voiceLang: "en-IN",
    },
    takeHome: 28200,
    preserved: 7200,
    weeklyDelta: 4100,
    weather: null,
    pending: null,
    email: "",
    lastStockUpdate: null,
    salesHistory: ledger,
    sessions: [seedSession],
    activeSession: seedSession.id,
  };
}

/* ---------- demo ledger: 30 days of sales + nightly stock ----------
   Deterministic (seeded) so the demo story is stable: weekday/weekend lift,
   a few rain days that suppress leafy sales, heat and humidity effects.
   The copilot's "regular sales count" is learned from this ledger. */
export function seedSalesHistory() {
  const products = seedOrder();
  let seed = 42;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const dows = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const out = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dow = d.getDay();
    const weekend = dow === 0 || dow === 6;
    const rainDay = [3, 10, 17, 24].includes(i); /* four rain days in the month */
    const rain = rainDay ? 65 + Math.round(rnd() * 25) : Math.round(rnd() * 35);
    const temp = rainDay ? 24 + Math.round(rnd() * 3) : 27 + Math.round(rnd() * 8);
    const humidity = rainDay ? 82 + Math.round(rnd() * 10) : 55 + Math.round(rnd() * 20);
    const items = products.map((p) => {
      let sold = (Number(p.salesAvg) || p.baseQty) * (weekend ? 1.2 : 1);
      if (p.perishable) {
        if (rain >= 60) sold *= 0.6;
        else if (rain >= 30) sold *= 0.8;
        if (temp >= 33) sold *= 0.85;
        if (humidity >= 80) sold *= 0.9;
      }
      sold = Math.max(1, Math.round(sold * (0.85 + rnd() * 0.3)));
      const stocked = Math.max(0, Math.round(sold * (0.15 + rnd() * 0.45)));
      /* what she bought that morning ≈ sold + what was left at 9 PM */
      const bought = sold + stocked;
      return { id: p.id, sold, stocked, bought, price: p.price, unit: p.unit };
    });
    out.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      dow: dows[dow],
      rain,
      temp,
      humidity,
      items,
      total: items.reduce((sum, it) => sum + it.bought * it.price, 0),
    });
  }
  return out;
}

/* Regular sales count for a product = average daily sold over the last 7
   days of the ledger, falling back to the seeded salesAvg. Products not
   present in the ledger (newly added) use the fallback rate too. */
export function velocityFor(state, productId, fallback) {
  const hist = state.salesHistory || [];
  if (!hist.length) return fallback;
  const recent = hist.slice(-7);
  let found = false;
  const sum = recent.reduce((acc, day) => {
    const it = day.items.find((x) => x.id === productId);
    if (it) found = true;
    return acc + (it ? it.sold : 0);
  }, 0);
  if (!found) return fallback;
  return Math.max(1, Math.round(sum / recent.length));
}

/* The 30-day buy-order history, rebuilt from the ledger (what she bought
   each morning ≈ sold + 9 PM leftover). Newest first. */
export function orderHistoryFromLedger(state) {
  const hist = state.salesHistory || [];
  return hist.slice().reverse().map((day) => ({
    date: day.date,
    label: day.label,
    dow: day.dow,
    rain: day.rain,
    total: day.total || 0,
    items: day.items.map((it) => {
      const prod = state.order.find((p) => p.id === it.id);
      return {
        id: it.id,
        name: prod?.name || it.id,
        emoji: prod?.emoji || "🧺",
        qty: it.bought ?? it.sold + it.stocked,
        unit: it.unit || prod?.unit || "",
        price: it.price || prod?.price || 0,
      };
    }),
  }));
}

/* ---------- perishability math ---------- */
export function rainProb(state) {
  /* The demo can pin the rainy scenario so the trim loop is always showable; it is labelled simulated. */
  if (state.scenario === "rain") return 80;
  if (state.scenario === "clear") return 0;
  return state.weather && typeof state.weather.prob === "number" ? state.weather.prob : 80;
}

export function effectiveShelfHours(item, rain) {
  if (!item.perishable) return item.baseShelfHours;
  if (rain >= 60) return Math.max(3, Math.round(item.baseShelfHours * 0.5));
  if (rain >= 30) return Math.max(3, Math.round(item.baseShelfHours * 0.75));
  return item.baseShelfHours;
}

export function shelfLabel(hours) {
  if (hours <= 8) return `${hours} hrs`;
  if (hours < 48) return `${Math.round(hours / 24)} day`;
  return `${Math.round(hours / 24)} days`;
}

export function riskFor(hours, rain) {
  if (hours <= 6) return { label: rain >= 60 ? "High" : "Medium", tone: rain >= 60 ? "red" : "amber" };
  if (hours <= 12) return { label: "Medium", tone: "amber" };
  if (hours <= 24) return { label: rain >= 60 ? "Medium" : "Low", tone: rain >= 60 ? "amber" : "green" };
  return { label: "Low", tone: "green" };
}

/* The briefing must never contradict the live forecast. */
export function adviceFor(rain) {
  if (rain >= 60) {
    return "High rain risk at 3 PM — order fewer tomatoes and trim the leafy greens; they spoil before the evening rush.";
  }
  if (rain >= 30) {
    return "Patchy rain this afternoon — trim leafy greens slightly and keep tomatoes steady.";
  }
  return "Clear afternoon, so greens will sell fast — keep the leafy stock steady and sell coriander early.";
}

export function orderTotal(order) {
  return order.reduce((sum, o) => sum + o.qty * o.price, 0);
}

/* Recalculation: trim perishables only, exactly as the pilot deck describes. */
export function recalculate(state) {
  const rain = rainProb(state);
  const factor = rain >= 60 ? 0.6 : rain >= 30 ? 0.8 : 1;

  const changes = [];
  const nextOrder = state.order.map((item) => {
    /* Clear weather means no artificial trim — a manual quantity stands. */
    if (!item.perishable || factor === 1) return item;
    const target = Math.max(1, Math.round(item.baseQty * factor));
    if (target < item.qty) {
      changes.push({ name: item.name, from: item.qty, to: target, unit: item.unit });
    }
    return { ...item, qty: target };
  });

  const preserved = changes.reduce((sum, c) => {
    const item = state.order.find((o) => o.name === c.name);
    return sum + (c.from - c.to) * (item ? item.price : 0);
  }, 0);

  return {
    rain,
    changes,
    nextOrder,
    preserved,
    amount: orderTotal(nextOrder),
    ts: Date.now(),
  };
}

/* ---------- daily purchase prediction ----------
   The merchant updates her shelf stock every night at 9 PM. From that stock,
   each product's regular sales count (salesAvg) and the full live weather —
   rain probability, temperature and humidity — the agent predicts what to
   buy (and what NOT to buy) for the current day, with quantities. */
export function weatherFactors(state) {
  const rain = rainProb(state);
  const temp = typeof state.weather?.temp === "number" ? state.weather.temp : 27;
  const humidity = typeof state.weather?.humidity === "number" ? state.weather.humidity : null;

  /* Rain: the classic trim curve. */
  let rainFactor = rain >= 60 ? 0.6 : rain >= 30 ? 0.8 : 1;
  /* Heat: above 33°C leafy wilts before the evening rush — trim perishables a bit more. */
  let heatFactor = temp >= 33 ? 0.85 : 1;
  /* Cool days sell a little better across the board. */
  let coolFactor = temp <= 20 ? 1.1 : 1;
  /* Humidity: 80%+ halves leafy shelf life — trim the leafy line again. */
  let humidityFactor = humidity != null && humidity >= 80 ? 0.9 : 1;

  return { rain, temp, humidity, rainFactor, heatFactor, coolFactor, humidityFactor };
}

export function predictPurchases(state) {
  const f = weatherFactors(state);

  const buy = [];
  const skip = [];
  state.order.forEach((item) => {
    const fallback = Math.max(0, Math.round(Number(item.salesAvg) || 0) || item.baseQty);
    const velocity = velocityFor(state, item.id, fallback);
    let need = velocity;
    if (item.perishable) {
      need = need * f.rainFactor * f.heatFactor * f.humidityFactor;
    } else {
      need = need * f.coolFactor;
    }
    need = Math.max(1, Math.round(need));
    const stock = Math.max(0, Number(item.stock) || 0);
    const toBuy = Math.max(0, need - stock);
    if (toBuy > 0) {
      buy.push({
        ...item,
        need,
        stock,
        toBuy,
        cost: toBuy * item.price,
        velocity,
        reason: stock > 0 ? "topup" : "buy",
      });
    } else {
      skip.push({
        ...item,
        need,
        stock,
        velocity,
        reason: stock >= velocity ? "stock-covers" : "weather-covers",
      });
    }
  });

  return {
    rain: f.rain,
    temp: f.temp,
    humidity: f.humidity,
    tomorrow: typeof state.weather?.probTomorrow === "number" ? state.weather.probTomorrow : null,
    factors: f,
    buy,
    skip,
    total: buy.reduce((sum, b) => sum + b.cost, 0),
  };
}

/* Plain-text version of the prediction, used for the "email me this list" action. */
export function suggestionEmailBody(state, prediction) {
  const place = locationById(state.location);
  const lines = [];
  lines.push(`HarvestWise — purchase suggestions for ${place.name} (${new Date().toLocaleDateString("en-IN")})`);
  lines.push(
    `Weather: ${prediction.rain}% rain at 3 PM, about ${prediction.temp}°C${prediction.humidity != null ? `, humidity ${prediction.humidity}%` : ""}${prediction.tomorrow != null ? `; tomorrow ${prediction.tomorrow}% rain` : ""}`
  );
  lines.push(`Based on your 30-day order history and tonight's shelf stock.`);
  lines.push("");
  lines.push("BUY TODAY (from your regular sales + tonight's shelf stock):");
  if (prediction.buy.length === 0) lines.push("  Nothing — your shelf stock covers today's demand.");
  prediction.buy.forEach((b) => {
    lines.push(
      `  • ${b.name}: ${b.toBuy} ${b.unit} (₹${b.cost}) — sells ~${b.salesAvg || b.need}/day, need ${b.need} today, in stock ${b.stock}`
    );
  });
  lines.push("");
  lines.push("DO NOT BUY:");
  if (prediction.skip.length === 0) lines.push("  Nothing skipped — every item needs a top-up.");
  prediction.skip.forEach((s) => {
    lines.push(
      `  • ${s.name}: already ${s.stock} ${s.unit} in stock${s.reason === "weather-covers" ? `; today's weather trims the need to ${s.need}` : ", covers today's need"}`
    );
  });
  lines.push("");
  lines.push(`Buy-order total: ₹${prediction.total}`);
  lines.push("— HarvestWise copilot on Paytm");
  return lines.join("\n");
}

/* ---------- copilot (English + Tamil) ---------- */
const has = (text, words) => {
  if (!Array.isArray(words)) {
    /* Defensive: never let a missing keyword list crash a reply. */
    if (typeof window !== "undefined") {
      window.__kMiss = window.__kMiss || [];
      window.__kMiss.push(String(words));
    }
    return false;
  }
  return words.some((w) => text.includes(w));
};

export function langOf(state) {
  return state?.settings?.lang === "ta" ? "ta" : "en";
}

/* Keywords in both languages — speech arrives as Tamil text when ta-IN is selected. */
const K = {
  yes: ["yes", "approve", "send it", "sari", "seri", "haan", "ok", "okay", "do it", "ஆம்", "சரி", "அனுப்பு", "ஒப்புக்கொள்"],
  no: ["no ", "cancel", "not now", "beda", "வேண்டாம்", "ரத்து", "வேண்டா"],
  recalc: ["recalc", "recalculate", "adjust", "reduce", "trim", "shrink", "மீண்டும் கணக்கிடு", "கணக்கிடு", "குறைத்து", "சரிசெய்"],
  dispatch: ["dispatch", "send order", "send the order", "wholesaler", "ravi", "அனுப்பு", "ஆர்டர் அனுப்பு", "ரவி"],
  speak: ["rain", "weather", "storm", "mausam", "மழை", "வானிலை"],
  stock: ["stock", "left", "in stock", "shelf", "balance", "leftover", "ஸ்டாக்", "மீதம்", "கையிருப்பு", "இருக்கு"],
  history: ["order history", "history", "last 30 days", "this month", "what did i order", "orders", "purchases", "வரலாறு", "கடந்த 30", "ஆர்டர் வரலாறு", "வாங்கினேன்"],
  spoil: ["coriander", "shelf", "spoil", "humidity", "waste", "கொத்தமல்லி", "கெட்டுப்போ", "அடுக்கு", "வீண்"],
  mandi: ["mandi", "rate", "price", "how much", "cost", "விலை", "சந்தை", "கூலி", "எவ்வளவு"],
  memory: ["memory", "learn", "history", "last week", "remember", "நினைவு", "கடந்த", "பாடம்"],
  profit: ["profit", "take home", "take-home", "earn", "margin", "லாபம்", "வருமானம்", "சம்பாத"],
  soundbox: ["soundbox", "briefing", "audio", "speak", "அறிக்கை", "கேட்க"],
  hello: ["hello", "hi ", "hey", "namaskara", "namaste", "வணக்கம்", "ஹலோ"],
  help: ["help", "what can you", "how do you", "உதவி", "என்ன செய்வாய்"],
  predict: ["predict", "suggest", "what should i buy", "buy today", "purchase", "shopping list", "what to buy", "recommend", "what should i stock", "what do i need", "suggest purchase", "வாங்க", "கொள்வனவு", "பரிந்துரை", "என்ன வாங்க", "என்ன வேண்டும்", "வாங்கலாம்"],
  howmuch: ["how much", "how many", "kitna", "எவ்வளவு", "எத்தனை", "என்ன அளவு", "எத்தனை வேண்டும்"],
  sellers: ["top seller", "best seller", "which item sells", "what sells most", "most sold", "sales rank", "அதிகம் விற்கும்", "சிறந்த விற்பனை", "முதல் மூன்று", "எது அதிகம் விற்கும்"],
  summary: ["what's in my order", "what is in my order", "my order", "order total", "current order", "how many items", "என் ஆர்டர்", "ஆர்டரில் என்ன"],
  edit: ["add ", "add", "remove", "delete", "increase", "reduce", "set ", "take out", "சேர்", "நீக்கு", "குறை", "கூட்டு"],
  why: ["why did you", "why trim", "why reduce", "why not", "explain", "ஏன்"],
  thanks: ["thank", "நன்றி", "super", "nice"],
};

/* Mandi rates are generated from the catalog so the copilot always matches the shop. */
export function mandiLine(state, max = 6) {
  const items = state.order.slice(0, max);
  const en = items.map((o) => `${o.name} ₹${o.price}/${o.unit}`).join(", ");
  const ta = items
    .map((o) => `${o.name} ₹${o.price}/${o.unit === "crates" ? "கிரேட்" : o.unit === "bundles" ? "கட்டு" : o.unit === "dozen" ? "டஜன்" : o.unit === "pieces" ? "துண்டு" : "கிலோ"}`)
    .join(", ");
  return { en, ta };
}

/* Tamil market words, so a Tamil answer never reads half-English. */
const UNIT_TA = { crates: "கிரேட்", bundles: "கட்டு", kg: "கிலோ", dozen: "டஜன்", pieces: "துண்டு" };
const RISK_TA = { High: "அதிகம்", Medium: "நடுத்தரம்", Low: "குறைவு" };

export function nameIn(item, lang) {
  if (lang !== "ta") return item.name;
  const ta = (ITEM_ALIASES[item.id] || []).find((alias) => /[\u0B80-\u0BFF]/.test(alias));
  return ta || item.name;
}

export function unitIn(unit, lang) {
  return lang === "ta" ? UNIT_TA[unit] || unit : unit;
}

/* ---------- spoken item lookup, order edits and reply guardrails ---------- */
/* Speech arrives in English or Tamil, so every catalog item carries both names. */
const ITEM_ALIASES = {
  tomatoes: ["tomato", "தக்காளி"],
  beans: ["பீன்ஸ்"],
  potatoes: ["potato", "உருளைக்கிழங்கு", "உருளை"],
  onions: ["onion", "வெங்காயம்"],
  brinjal: ["eggplant", "கத்தரிக்காய்"],
  capsicum: ["குடைமிளகாய்"],
  carrot: ["கேரட்"],
  coriander: ["கொத்தமல்லி", "கோத்துமல்லி"],
  palak: ["spinach", "பசலைக்கீரை", "கீரை"],
  methi: ["fenugreek", "வெந்தயக்கீரை"],
  banana: ["வாழைப்பழம்", "வாழை"],
  apple: ["ஆப்பிள்"],
  mosambi: ["sweet lime", "மொசாம்பி"],
  eggs: ["egg", "முட்டை"],
  coconut: ["தேங்காய்"],
};

const NUM_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };

const UNIT_WORDS = [
  ["crates", ["crate", "crates", "box", "boxes", "கிரேட்"]],
  ["bundles", ["bundle", "bundles", "கட்டு"]],
  ["dozen", ["dozen", "டஜன்"]],
  ["pieces", ["piece", "pieces", "துண்டு"]],
  ["kg", ["kg", "kgs", "kilo", "kilos", "கிலோ"]],
];

function matchAlone(text, item) {
  return [item.name.toLowerCase(), ...(ITEM_ALIASES[item.id] || [])].some((alias) => alias && text.includes(alias));
}

/* Longest alias wins so "palak" is not swallowed by a shorter name. */
export function itemFromText(raw, order = []) {
  const text = String(raw || "").toLowerCase().trim();
  if (!text) return null;
  const pool = order.length ? order : seedOrder();
  let best = null;
  pool.forEach((item) => {
    [item.name.toLowerCase(), ...(ITEM_ALIASES[item.id] || [])].forEach((alias) => {
      if (alias && text.includes(alias) && (!best || alias.length > best.alias.length)) best = { item, alias };
    });
  });
  return best ? best.item : null;
}

export function catalogItem(raw) {
  const text = String(raw || "").toLowerCase().trim();
  if (!text) return null;
  return seedOrder().find((item) => matchAlone(text, item)) || null;
}

function quantityIn(text) {
  const digits = text.match(/(\d+(?:\.\d+)?)/);
  if (digits) {
    const value = Number(digits[1]);
    return Number.isFinite(value) ? value : null;
  }
  const word = Object.keys(NUM_WORDS).find((w) => new RegExp(`\\b${w}\\b`).test(text));
  return word ? NUM_WORDS[word] : null;
}

function unitFromText(text, fallback) {
  const hit = UNIT_WORDS.find(([, words]) => words.some((w) => new RegExp(`(^|\\s)${w}(\\s|$)`).test(text)));
  return hit ? hit[0] : fallback;
}

/* "add 2 kg beans", "remove palak", "set coriander to 8", "reduce tomatoes by 2" */
export function parseOrderEdit(raw, state) {
  const text = String(raw || "").toLowerCase();
  if (!text) return null;
  const item = itemFromText(text, state.order) || catalogItem(text);
  if (!item) return null;
  const row = state.order.find((i) => i.id === item.id) || null;
  const price = row ? row.price : item.price;
  const unit = unitFromText(text, row ? row.unit : item.unit);
  const byMatch = text.match(/\bby\s+(\d+(?:\.\d+)?)/);
  const by = byMatch ? Math.max(1, Math.round(Number(byMatch[1]))) : null;
  const qty = quantityIn(text);
  const hasAdd = /\b(add|include|put|சேர்|சேர்க்க)\b/.test(text);
  const hasRemove = /\b(remove|delete|take out|நீக்கு)\b/.test(text);
  const hasReduce = /\b(reduce|drop|cut|decrease|less|குறை)\b/.test(text);
  const hasIncrease = /\b(increase|raise|more|கூட்டு)\b/.test(text);
  const hasSet = /\b(set|make|change|வை)\b/.test(text);

  if (!row) {
    if (hasRemove) return { kind: "missing", name: item.name, price: item.price, unit };
    if (!hasAdd) return null;
    return { kind: "add", id: item.id, name: item.name, qty: Math.max(1, Math.round(qty || by || 1)), unit, price, fromCatalog: true };
  }
  if (hasRemove) return { kind: "remove", id: row.id, name: row.name, unit: row.unit, price: row.price };
  if (hasReduce) {
    const next = row.qty - (by || qty || 1);
    if (next < 1) return { kind: "remove", id: row.id, name: row.name, unit: row.unit, price: row.price };
    return { kind: "set", id: row.id, name: row.name, qty: next, unit: row.unit, price: row.price };
  }
  if (hasIncrease) return { kind: "set", id: row.id, name: row.name, qty: row.qty + (by || qty || 1), unit: row.unit, price: row.price };
  if (hasSet && qty) return { kind: "set", id: row.id, name: row.name, qty: Math.max(1, Math.round(qty)), unit: row.unit, price: row.price };
  if (hasAdd) return { kind: "set", id: row.id, name: row.name, qty: row.qty + (qty || by || 1), unit: row.unit, price: row.price };
  return null;
}

/* Deterministic confirmation with the exact new total — never delegated to the LLM. */
export function describeEdit(edit, state) {
  const total = orderTotal(state.order);
  const row = state.order.find((i) => i.id === edit.id);
  const money = (n) => Math.round(n).toLocaleString("en-IN");
  const ta = langOf(state) === "ta";
  if (edit.kind === "remove") {
    const after = total - (row ? row.qty * row.price : 0);
    return {
      reply: ta
        ? `${edit.name} ஆர்டரிலிருந்து நீக்கப்பட்டது. புதிய மொத்தம் ₹${money(after)}. வேறு ஏதாவது மாற்றவா?`
        : `Removed ${edit.name} from the buy-order. New total ₹${money(after)}. Anything else to adjust?`,
      authoritative: true,
    };
  }
  const nextRowQty = edit.kind === "add" ? edit.qty : edit.qty;
  const after = edit.kind === "add" ? total + nextRowQty * edit.price : total + (nextRowQty - (row ? row.qty : 0)) * edit.price;
  return {
    reply: ta
      ? `புதுப்பிப்பு: ${nameIn(edit, "ta")} ${nextRowQty} ${unitIn(edit.unit, "ta")}. புதிய மொத்தம் ₹${money(after)}. “அனுப்பு” என்றால் ${MERCHANT.wholesaler}க்கு அனுப்புகிறேன்.`
      : `Updated: ${edit.name} ${nextRowQty} ${edit.unit}. New total ₹${money(after)}. Say “dispatch” when you want it sent to ${MERCHANT.wholesaler}.`,
    authoritative: true,
  };
}

/* Every number the copilot is allowed to quote, derived from live state. */
export function allowedNumbers(state) {
  const money = new Set([149, 7200, 3500]);
  const pct = new Set([rainProb(state)]);
  const addMoney = (n) => {
    if (Number.isFinite(Number(n))) money.add(Math.round(Number(n)));
  };
  addMoney(orderTotal(state.order));
  state.order.forEach((item) => {
    addMoney(item.price);
    addMoney(item.price * item.qty);
  });
  addMoney(state.takeHome);
  addMoney(state.preserved);
  orderHistoryFromLedger(state)
    .slice(0, 5)
    .forEach((h) => addMoney(h.total));
  if (state.pending) {
    addMoney(state.pending.amount);
    (state.pending.previous || []).forEach((item) => addMoney(item.price * item.qty));
  }
  if (typeof state.weather?.prob === "number") pct.add(state.weather.prob);
  if (typeof state.weather?.probTomorrow === "number") pct.add(state.weather.probTomorrow);
  if (state.pending) pct.add(state.pending.rain);
  return { money, pct };
}

/* If Sarvam invents a rupee figure or percentage, we answer from state instead. */
export function guardReply(aiText, fallback, state) {
  if (!aiText) return fallback;
  const text = String(aiText)
    .replace(/\*\*/g, "")
    .replace(/^#+\s*/gm, "")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length < 3) return fallback;
  const allowed = allowedNumbers(state);
  const rupees = [...text.matchAll(/₹\s?([\d,]+)/g)].map((m) => Number(m[1].replace(/,/g, "")));
  const percents = [...text.matchAll(/([\d.]+)\s?%/g)].map((m) => Number(m[1]));
  if (rupees.some((n) => !allowed.money.has(Math.round(n)))) return fallback;
  if (percents.some((n) => !allowed.pct.has(Math.round(n)) && !allowed.pct.has(n))) return fallback;
  const place = locationById(state.location);
  if (/\b(rain|weather|மழை|வானிலை)\b/i.test(text) && !text.includes(place.name)) return fallback;
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  return sentences.length > 4 ? sentences.slice(0, 3).join(" ") : text;
}

function shelfAnswer(item, state) {
  const rain = rainProb(state);
  const place = locationById(state.location);
  const hours = effectiveShelfHours(item, rain);
  const risk = riskFor(hours, rain).label;
  const ta = langOf(state) === "ta";
  return {
    reply: ta
      ? `இன்று ${nameIn(item, "ta")} சுமார் ${hours} மணி நேரம் இருக்கும் (மழை ${rain}%, ${place.name}) — ஆபத்து ${RISK_TA[risk] || risk}. ஆர்டரில் ${item.qty} ${unitIn(item.unit, "ta")} உள்ளது.`
      : `${item.name} keeps about ${hours} hours today (rain ${rain}%, ${place.name}) — ${risk.toLowerCase()} risk. You have ${item.qty} ${item.unit} in the order.`,
    action: null,
    authoritative: true,
  };
}

export function buildReply(raw, state) {
  const text = (raw || "").toLowerCase().trim();
  const lang = langOf(state);
  const ta = lang === "ta";
  const rain = rainProb(state);
  const place = locationById(state.location);
  const total = orderTotal(state.order);
  const pending = state.pending;
  const who = state.name || MERCHANT.name;
  const pick = (en, taText) => (ta ? taText : en);

  if (!text) {
    return { reply: pick("Tell me what you need — order, weather or rates.", "என்ன வேண்டும் — ஆர்டரா, வானிலையா, விலையா?"), action: null };
  }

  /* approval gate */
  if (pending && has(text, K.yes)) {
    return {
      reply: pick(
        `Approved ✅ Sending the revised buy-order to ${MERCHANT.wholesaler} now.`,
        `சரி ✅ திருத்திய ஆர்டரை இப்போது ${MERCHANT.wholesaler}க்கு அனுப்புகிறேன்.`
      ),
      action: "dispatch",
    };
  }
  if (pending && (text === "no" || text === "no." || has(text, K.no))) {
    return {
      reply: pick("Cancelled — nothing was sent. Your original order stands.", "ரத்து செய்துவிட்டேன் — எதுவும் அனுப்பப்படவில்லை. பழைய ஆர்டரே இருக்கும்."),
      action: "cancel",
    };
  }

  /* ---------- deterministic order editing (voice or typed) ---------- */
  if (has(text, K.edit)) {
    const edit = parseOrderEdit(text, state);
    if (edit && edit.kind === "missing") {
      return {
        reply: pick(
          `${edit.name} is not in your order right now — say “add ${edit.name}” and I will put it in at ₹${edit.price}/${edit.unit}.`,
          `${edit.name} இப்போது ஆர்டரில் இல்லை — “${edit.name} சேர்” என்று சொன்னால் ₹${edit.price}/${edit.unit}க்கு சேர்க்கிறேன்.`
        ),
        action: null,
        authoritative: true,
      };
    }
    if (edit) {
      if (edit.kind === "remove" && state.order.length <= 1) {
        return {
          reply: pick(
            "That's your only line — add something else before removing it.",
            "இது மட்டுமே ஆர்டரில் உள்ளது — வேறு ஒன்றைச் சேர்த்த பிறகு நீக்கலாம்."
          ),
          action: null,
          authoritative: true,
        };
      }
      const described = describeEdit(edit, state);
      return { reply: described.reply, action: "orderEdit", edit, authoritative: true };
    }
  }

  if (has(text, K.why) && !has(text, K.edit)) {
    if (!pending) {
      return {
        reply: pick(
          rain >= 30
            ? `Nothing is waiting for approval right now. At ${rain}% rain the leafy lines lose shelf life, so I trim only perishables and never the vegetables. Your order is ₹${total}.`
            : `Nothing is waiting for approval right now — rain risk is only ${rain}%, so no trimming is due. Your ₹${total} order stands.`,
          `இப்போது ஒப்புதலுக்கு எதுவும் இல்லை. விதி எளிது: ${rain}% மழையில் கீரையின் ஆயுள் குறையும், அதனால் கெடும் பொருட்களை மட்டும் குறைப்பேன், காய்கறிகளைத் தொடமாட்டேன். ஆர்டர் ₹${total}.`
        ),
        action: null,
        authoritative: true,
      };
    }
    const before = (pending.previous || []).reduce((sum, o) => sum + o.qty * o.price, 0);
    const changed = state.order
      .map((o) => {
        const old = (pending.previous || []).find((prevRow) => prevRow.id === o.id);
        return old && old.qty !== o.qty ? `${o.name} ${old.qty}→${o.qty} ${o.unit}` : null;
      })
      .filter(Boolean)
      .join(", ");
    return {
      reply: pick(
        `Because rain is ${pending.rain}% at 3 PM, leafy stock wilts before evening — so I trimmed ${changed || "the leafy lines"}. That keeps ₹${Math.max(0, before - pending.amount)} out of the bin, and nothing is sent until you approve.`,
        `மதியம் 3 மணிக்கு ${pending.rain}% மழை என்பதால் கீரை மாலைக்குள் வாடிவிடும் — அதனால் ${changed || "கீரை வரிசைகளை"} குறைத்தேன். இதனால் ₹${Math.max(
          0,
          before - pending.amount
        )} இழப்பு தவிர்க்கப்படும், ஒப்புதல் இல்லாமல் எதுவும் அனுப்பப்படாது.`
      ),
      action: null,
      authoritative: true,
    };
  }

  if (has(text, K.recalc)) {
    if (rain < 30) {
      return {
        reply: pick(
          `Rain risk is only ${rain}% today, so nothing needs trimming — your ₹${total} buy-order already matches demand. I'll keep it as is.`,
          `இன்று மழை வாய்ப்பு ${rain}% மட்டுமே — குறைக்க வேண்டியதில்லை. உங்கள் ₹${total} ஆர்டர் தேவைக்கு ஏற்றதே. அப்படியே வைத்துக்கொள்கிறேன்.`
        ),
        action: null,
        authoritative: true,
      };
    }
    return {
      reply: pick(
        `Recalculating for ${rain}% rain at 3 PM — trimming only the leafy stock, never the tomatoes. One moment…`,
        `மதியம் 3 மணிக்கு ${rain}% மழை வாய்ப்புக்கு மீண்டும் கணக்கிடுகிறேன் — கீரை வகைகளை மட்டும் குறைக்கிறேன், தக்காளியைத் தொடமாட்டேன். ஒரு நிமிடம்…`
      ),
      action: "recalc",
    };
  }

  if (has(text, K.dispatch)) {
    return {
      reply: pick(
        `Sending your current buy-order (₹${total}) to ${MERCHANT.wholesaler} on WhatsApp.`,
        `இப்போதைய ஆர்டரை (₹${total}) வாட்ஸ்அப்பில் ${MERCHANT.wholesaler}க்கு அனுப்புகிறேன்.`
      ),
      action: "dispatch",
    };
  }

  if (has(text, K.sellers)) {
    const hist = orderHistoryFromLedger(state);
    const totals = {};
    hist.forEach((day) => day.items.forEach((it) => { totals[it.id] = (totals[it.id] || 0) + (it.sold || 0); }));
    const top = Object.entries(totals)
      .map(([id, total]) => ({ id, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);
    const lines = top.map((t) => {
      const p = state.order.find((o) => o.id === t.id);
      return `• ${p?.emoji || ""} ${p?.name || t.id} — ${t.total.toLocaleString("en-IN")} sold`;
    });
    return {
      reply: pick(
        `Top sellers in the last 30 days 📈\n${lines.join("\n")}`,
        `கடந்த 30 நாளில் அதிகம் விற்றவை 📈\n${lines.join("\n")}`
      ),
      action: null,
      authoritative: true,
      list: true,
    };
  }

  if (has(text, K.history)) {
    const hist = orderHistoryFromLedger(state);
    const days = hist.length;
    const spent = hist.reduce((s, h) => s + h.total, 0);
    const avg = days ? Math.round(spent / days) : 0;
    const peak = hist.reduce((b, h) => (h.total > (b?.total || 0) ? h : b), hist[0] || null);
    const peakLine = peak
      ? pick(
          ` Biggest day: ${peak.label} (${peak.dow}) at ₹${peak.total.toLocaleString("en-IN")}.`,
          ` அதிகபட்ச நாள்: ${peak.label} (${peak.dow}) ₹${peak.total.toLocaleString("en-IN")}.`
        )
      : "";
    const summary = hist
      .slice(0, 5)
      .map((h) => `${h.label}: ₹${h.total.toLocaleString("en-IN")}`)
      .join(" · ");
    return {
      reply: pick(
        `You placed ${days} orders this month — ₹${spent.toLocaleString("en-IN")} total, about ₹${avg} a day.${peakLine} Latest: ${summary}.`,
        `இந்த மாதம் ${days} ஆர்டர்கள் — மொத்தம் ₹${spent.toLocaleString("en-IN")}, சராசரியாக ₹${avg}/நாள்.${peakLine} சமீபத்தியவை: ${summary}.`
      ),
      action: null,
      authoritative: true,
    };
  }

  if (has(text, K.summary)) {
    const lines = state.order.map((o) => `${o.name} ${o.qty} ${o.unit} (₹${o.qty * o.price})`).join(", ");
    const pendingLine = pending
      ? pick(` A revised order of ₹${pending.amount} is waiting for your approval.`, ` ₹${pending.amount} திருத்திய ஆர்டர் ஒப்புதலுக்காகக் காத்திருக்கிறது.`)
      : "";
    return {
      reply: pick(
        `Your buy-order: ${lines}. Total ₹${total}.${pendingLine}`,
        `உங்கள் ஆர்டர்: ${lines}. மொத்தம் ₹${total}.${pendingLine}`
      ),
      action: null,
      authoritative: true,
    };
  }

  if (has(text, K.speak)) {
    const outlook = pick(
      rain >= 60
        ? "Coriander shelf-life drops to about 4 hours in that humidity and rainy-day coriander sales fall ~40%, so hold the leafy order."
        : rain >= 30
        ? "That's patchy — coriander keeps roughly 6 hours and I'd trim the leafy order a little."
        : "It's a dry afternoon, so coriander keeps its full ~8 hours. No rain-driven trim needed today.",
      rain >= 60
        ? "ஈரப்பதத்தில் கொத்தமல்லி 4 மணி நேரம் மட்டுமே இருக்கும், மழை நாளில் அதன் விற்பனை 40% குறையும் — கீரை ஆர்டரை நிறுத்துங்கள்."
        : rain >= 30
        ? "மழை அவ்வப்போது — கொத்தமல்லி 6 மணி நேரம் இருக்கும், கீரையைச் சற்று குறைக்கலாம்."
        : "இன்று வறண்ட மதியம் — கொத்தமல்லி முழு 8 மணி நேரம் இருக்கும். மழைக்காகக் குறைக்க வேண்டியதில்லை."
    );
    const tomorrow = typeof state.weather?.probTomorrow === "number" ? state.weather.probTomorrow : null;
    const tomorrowLine = pick(
      tomorrow != null
        ? ` Tomorrow: ${tomorrow}% rain chance.`
        : "",
      tomorrow != null
        ? ` நாளை: ${tomorrow}% மழை வாய்ப்பு.`
        : ""
    );
    return {
      reply: pick(
        `Open-Meteo for ${place.name}: ${rain}% chance of rain around 3 PM.${tomorrowLine} ${outlook} Want me to recalculate?`,
        `${place.name} வானிலை: மதியம் 3 மணிக்கு ${rain}% மழை வாய்ப்பு.${tomorrowLine} ${outlook} மீண்டும் கணக்கிடவா?`
      ),
      action: null,
      authoritative: true,
    };
  }

  /* A named product + a quantity/purchase question → one-item advice.
     Must run before the broader mandi/history intents so “how much banana”
     doesn't get answered as a market-rate question. */
  const namedItem = itemFromText(text, state.order) || catalogItem(text);
  const asksAboutItem =
    namedItem &&
    (has(text, K.howmuch) ||
      has(text, K.predict) ||
      /\b(buy|need|should|sell|order|stock)\b/.test(text) ||
      /(வாங்க|தேவை|வேண்டும்|விற்க|கொள்வனவு)/.test(text));
  if (asksAboutItem) {
    const prediction = predictPurchases(state);
    const buy = prediction.buy.find((b) => b.id === namedItem.id);
    const skip = prediction.skip.find((s) => s.id === namedItem.id);
    if (buy) {
      return {
        reply: pick(
          `For ${buy.name} in ${place.name}: buy ${buy.toBuy} ${buy.unit} today (₹${buy.cost.toLocaleString("en-IN")}) — you sell ~${buy.velocity || buy.salesAvg || buy.need} a day and have ${buy.stock} on hand.`,
          `${place.name} இல் ${nameIn(buy, "ta")}: இன்று ${buy.toBuy} ${unitIn(buy.unit, "ta")} வாங்குங்கள் (₹${buy.cost.toLocaleString("en-IN")}) — ஒரு நாளுக்கு ~${buy.velocity || buy.salesAvg || buy.need} விற்கிறீர்கள், கையிருப்பு ${buy.stock}.`
        ),
        action: null,
        authoritative: true,
      };
    }
    if (skip) {
      return {
        reply: pick(
          `No need to buy ${skip.name} today — you have ${skip.stock} ${skip.unit} on hand, which covers the ~${skip.velocity || skip.salesAvg || skip.need} a day you sell.`,
          `இன்று ${nameIn(skip, "ta")} வாங்கத் தேவையில்லை — கையிருப்பு ${skip.stock} ${unitIn(skip.unit, "ta")}, ஒரு நாளுக்கு ~${skip.velocity || skip.salesAvg || skip.need} விற்கிறீர்கள்.`
        ),
        action: null,
        authoritative: true,
      };
    }
  }

  if (has(text, K.mandi)) {
    const picked = itemFromText(text, state.order);
    if (picked) {
      return {
        reply: pick(
          `${picked.name} at ${place.mandi}: ₹${picked.price} per ${picked.unit.replace(/s$/, "")}. Your ${picked.qty} ${picked.unit} come to ₹${picked.qty * picked.price} of the ₹${total} order.`,
          `${nameIn(picked, "ta")} இன்று காலை ${place.mandi} சந்தையில் ₹${picked.price}/${unitIn(picked.unit, "ta")}. ஆர்டரில் ${picked.qty} ${unitIn(picked.unit, "ta")} உள்ளது — மொத்தம் ₹${total}இல் ₹${picked.qty * picked.price}.`
        ),
        action: null,
        authoritative: true,
      };
    }
    const line = mandiLine(state);
    return {
      reply: pick(
        `${place.mandi} rates this morning: ${line.en}. Your current order totals ₹${total}.`,
        `இன்று காலை ${place.mandi} விலைகள்: ${line.ta}. இப்போதைய ஆர்டர் மொத்தம் ₹${total}.`
      ),
      action: null,
      authoritative: true,
    };
  }

  if (has(text, K.stock)) {
    const shelfItem = itemFromText(text, state.order) || catalogItem(text);
    if (shelfItem && /shelf|life|spoil|ஆயுள்|கெட்டுப்போ/.test(text)) return shelfAnswer(shelfItem, state);
    const low = state.order.filter((o) => (Math.max(0, Number(o.stock) || 0) / Math.max(1, o.salesAvg || o.baseQty)) < 0.5);
    const stockLines = state.order.map(
      (o) => `• ${o.name} — ${Math.max(0, Number(o.stock) || 0)} ${o.unit}`
    );
    const lowLines = low.map((o) => `• ${o.name} — ${Math.max(0, Number(o.stock) || 0)} ${o.unit}`);
    const reply = pick(
      `Your shelves 📦\n${stockLines.join("\n")}\n\n${
        low.length ? `RUNNING LOW:\n${lowLines.join("\n")}` : "All items have solid cover."
      }`,
      `உங்கள் ஸ்டாக் 📦\n${stockLines.join("\n")}\n\n${
        low.length ? `குறைவாக உள்ளவை:\n${lowLines.join("\n")}` : "அனைத்துப் பொருட்களுக்கும் போதுமான கையிருப்பு."
      }`
    );
    return {
      reply,
      action: null,
      authoritative: true,
      list: true,
    };
  }

  if (has(text, K.spoil)) {
    const named = itemFromText(text, state.order) || catalogItem(text);
    if (named) return shelfAnswer(named, state);
    const advice = pick(
      rain >= 60
        ? `At ${rain}% rain it drops to ~4 hours, so I'd buy 6 bundles instead of 10 — about ₹88 of stock kept off the bin.`
        : rain >= 30
        ? `With ${rain}% rain it keeps ~6 hours, so 8 bundles instead of 10 is the safer buy.`
        : `At ${rain}% rain it keeps the full ~8 hours, so your 10 bundles are fine — just sell them before noon.`,
      rain >= 60
        ? `${rain}% மழையில் 4 மணி நேரம் மட்டுமே — 10 கட்டுக்கு பதிலாக 6 கட்டு வாங்குங்கள். சுமார் ₹88 வீணாவது தவிர்க்கப்படும்.`
        : rain >= 30
        ? `${rain}% மழையில் 6 மணி நேரம் இருக்கும் — 10க்கு பதிலாக 8 கட்டு பாதுகாப்பானது.`
        : `${rain}% மழையில் முழு 8 மணி நேரம் இருக்கும் — 10 கட்டு பரவாயில்லை, மதியத்துக்கு முன் விற்றுவிடுங்கள்.`
    );
    return {
      reply: pick(`Coriander lasts ~8 hours dry. ${advice}`, `கொத்தமல்லி உலர்வாக 8 மணி நேரம் இருக்கும். ${advice}`),
      action: null,
      authoritative: true,
    };
  }

  if (has(text, K.memory)) {
    const wins = state.memory.filter((entry) => entry.outcome === "worked").length;
    const kept = state.preserved.toLocaleString("en-IN");
    return {
      reply: pick(
        `I remember ${state.memory.length} outcomes for you, ${wins} of them worked. Spoilage kept out of the bin so far: ₹${kept}. I'll start today's order from that evidence instead of zero.`,
        `உங்கள் ${state.memory.length} முடிவுகளை நினைவில் வைத்திருக்கிறேன், அவற்றில் ${wins} வெற்றி. இதுவரை தவிர்க்கப்பட்ட இழப்பு ₹${kept}. இன்றைய ஆர்டரை அதே அனுபவத்தில் இருந்து தொடங்குகிறேன்.`
      ),
      action: null,
      authoritative: true,
    };
  }

  if (has(text, K.profit)) {
    return {
      reply: pick(
        `Take-home this month is ₹${state.takeHome.toLocaleString("en-IN")} (+34% vs baseline). Spoilage preserved so far: ₹${state.preserved.toLocaleString("en-IN")} — that's money you'd otherwise have discounted away at 9 PM.`,
        `இந்த மாத வருமானம் ₹${state.takeHome.toLocaleString("en-IN")} (அடிப்படையை விட +34%). இதுவரை சேமித்த இழப்பு ₹${state.preserved.toLocaleString("en-IN")} — இரவு 9 மணிக்கு தள்ளுபடியில் போயிருக்கும் பணம்.`
      ),
      action: null,
      authoritative: true,
    };
  }

  if (has(text, K.soundbox)) {
    return {
      reply: pick(
        "Your 6:30 AM briefing plays on the Paytm Soundbox in Tamil — 30 seconds, zero taps. Want me to play it now?",
        "காலை 6:30 அறிக்கை பேட்ம் சவுண்ட்பாக்ஸில் தமிழில் ஒலிக்கும் — 30 வினாடிகள், ஒரு தட்டல் கூட இல்லை. இப்போது போடவா?"
      ),
      action: "briefing",
    };
  }

  if (has(text, K.predict)) {
    const prediction = predictPurchases(state);
    const buyLines = prediction.buy.map(
      (b) => `• ${b.name} — ${b.toBuy} ${b.unit} (₹${(b.cost || 0).toLocaleString("en-IN")})`
    );
    const skipLines = prediction.skip.map(
      (s) => `• ${s.name} — ${s.stock} ${s.unit} already on hand`
    );
    const weatherLine = pick(
      `${prediction.rain}% rain · ${prediction.temp}°C${prediction.humidity != null ? ` · ${prediction.humidity}% humidity` : ""}`,
      `${prediction.rain}% மழை · ${prediction.temp}°C${prediction.humidity != null ? ` · ${prediction.humidity}% ஈரப்பதம்` : ""}`
    );
    const reply = pick(
      `Here's today's plan for ${place.name} 🌤\nWeather: ${weatherLine}\n\nBUY:\n${
        buyLines.length ? buyLines.join("\n") : "• nothing — your shelves cover today"
      }\n\nSKIP:\n${
        skipLines.length ? skipLines.join("\n") : "• nothing skipped"
      }\n\nTap Apply or say “dispatch” when ready.`,
      `${place.name} க்கான இன்றைய திட்டம் 🌤\nவானிலை: ${weatherLine}\n\nவாங்கவேண்டியவை:\n${
        buyLines.length ? buyLines.join("\n") : "• எதுவும் இல்லை — அலமாரி போதும்"
      }\n\nதவிர்க்க:\n${
        skipLines.length ? skipLines.join("\n") : "• எதுவும் இல்லை"
      }\n\nபொருத்தவா அல்லது “அனுப்பு” என்று சொல்லுங்கள்.`
    );
    return {
      reply,
      action: null,
      authoritative: true,
      list: true,
    };
  }

  if (has(text, K.thanks)) {
    return {
      reply: pick(
        `Anytime, ${who}. Rain is ${rain}% at 3 PM and your order is ₹${total} — say the word if you want it trimmed.`,
        `எப்போதும் உதவ ${who}. மதியம் 3 மணிக்கு ${rain}% மழை, ஆர்டர் ₹${total} — குறைக்க வேண்டுமா என்று சொல்லுங்கள்.`
      ),
      action: null,
    };
  }

  if (has(text, K.hello) || text === "hi") {
    return {
      reply: pick(
        `Namaskara ${who}! ☀️ Rain is at ${rain}% for 3 PM and your order is ready. Shall I run the recalculation?`,
        `வணக்கம் ${who}! ☀️ மதியம் 3 மணிக்கு ${rain}% மழை வாய்ப்பு, உங்கள் ஆர்டர் தயார். மீண்டும் கணக்கிடவா?`
      ),
      action: null,
    };
  }

  if (has(text, K.help)) {
    return {
      reply: pick(
        "I can check today's spoilage risk, recalculate your buy-order, dispatch it to Ravi anna, replay your Soundbox briefing, or show what I've learned from your last weeks. Just talk normally — Tamil or English.",
        "இன்றைய கெட்டுப்போகும் ஆபத்தைச் சொல்லலாம், ஆர்டரை மீண்டும் கணக்கிடலாம், ரவி அண்ணாவுக்கு அனுப்பலாம், சவுண்ட்பாக்ஸ் அறிக்கையை ஒலிக்கச் செய்யலாம், கடந்த வாரங்களில் கற்றதைக் காட்டலாம். தமிழிலோ ஆங்கிலத்திலோ பேசுங்கள்."
      ),
      action: null,
    };
  }

  return {
    reply: pick(
      `I've got your order at ₹${total} with rain at ${rain}%. Try “recalculate my order”, “coriander shelf life?”, “best mandi rate” or “dispatch to Ravi anna”.`,
      `உங்கள் ஆர்டர் ₹${total}, மழை வாய்ப்பு ${rain}%. “ஆர்டரை மீண்டும் கணக்கிடு”, “கொத்தமல்லி அடுக்கு ஆயுள்?”, “இன்றைய சந்தை விலை” அல்லது “ரவி அண்ணாவுக்கு அனுப்பு” என்று சொல்லுங்கள்.`
    ),
    action: null,
  };
}

export function suggestionsFor(lang = "en") {
  return lang === "ta"
    ? ["இன்று என்ன வாங்கவேண்டும்?", "மூன்று மணிக்கு மழை — ஆர்டரை மாற்றவா?", "கொத்தமல்லி அடுக்கு ஆயுள்?", "இன்றைய சந்தை விலை"]
    : ["What should I buy today?", "Rain at 3 PM — adjust order?", "Coriander shelf life?", "Best mandi rate today"];
}

export const SUGGESTIONS = suggestionsFor("en");

export function briefingScript(state) {
  const rain = rainProb(state);
  const who = state.name || MERCHANT.name;
  const best = [...state.order].sort((a, b) => b.price - a.price)[0];
  const bestTa = best
    ? `சிறந்த சந்தை விலை: ${best.name} ₹${best.price}/${best.unit === "crates" ? "கிரேட்" : best.unit === "bundles" ? "கட்டு" : best.unit === "dozen" ? "டஜன்" : best.unit === "pieces" ? "துண்டு" : "கிலோ"}`
    : "";
  if (langOf(state) === "ta") {
    return `வணக்கம் ${who}! இன்று மதியம் மூன்று மணிக்கு ${rain} சதவீதம் மழை வாய்ப்பு. கீரை வகைகளைக் குறைவாகவும், காய்கறிகளை நிலையாகவும் வாங்குங்கள். ${bestTa}`;
  }
  return `Namaskara ${who}! Today ${rain} percent chance of rain at 3 PM. Buy fewer leafy greens and keep the vegetables steady. Best mandi rate: ${best ? `${best.name} ${best.price} rupees per ${best.unit}` : "-"}.`;
}

/* ============================================================
   Sarvam AI via the local proxy (see server.js)
   Every call degrades to the in-browser engine when the key is absent.
   ============================================================ */
/* The proxy runs on :8765. When the UI is served by that same server
   (production build) the paths stay relative; in `npm start` (port 3000)
   they point at the proxy origin, which allows CORS for localhost. */
const API_BASE = (() => {
  if (typeof window === "undefined") return "";
  if (process.env.REACT_APP_API_BASE) return process.env.REACT_APP_API_BASE.replace(/\/$/, "");
  const { protocol, hostname, port } = window.location;
  if (port === "8765") return "";
  if (port === "3000") return `${protocol}//${hostname}:8765`;
  return "";
})();

export const SARVAM_API = {
  health: `${API_BASE}/api/health`,
  chat: `${API_BASE}/api/chat`,
  tts: `${API_BASE}/api/tts`,
  stt: `${API_BASE}/api/stt`,
};

export const COGNEE_API = {
  health: `${API_BASE}/api/cognee/health`,
  recall: `${API_BASE}/api/cognee/recall`,
  add: `${API_BASE}/api/cognee/add`,
};

export const AI_OFFLINE = { sarvam: false, chat: false, tts: false, stt: false, checked: true };

export async function checkAi() {
  try {
    const res = await fetch(SARVAM_API.health, { headers: { Accept: "application/json" } });
    if (!res.ok) return AI_OFFLINE;
    const data = await res.json();
    return {
      sarvam: Boolean(data.sarvam),
      chat: Boolean(data.chat),
      tts: Boolean(data.tts),
      stt: Boolean(data.stt),
      models: data.models || null,
      checked: true,
    };
  } catch {
    return AI_OFFLINE;
  }
}

export function systemPrompt(state) {
  const rain = rainProb(state);
  const place = locationById(state.location);
  const temp = state.weather?.temp;
  const weatherNote = state.scenario === "rain"
    ? "The merchant pinned the rainy demo scenario (80%)."
    : state.weather?.simulated
    ? "Live weather is unavailable; this reading is simulated and must be described as approximate."
    : "Live Open-Meteo forecast for her exact pin.";
  const order = state.order.map((o) => `${o.name} ${o.qty} ${o.unit}`).join(", ");
  const pendingNote = state.pending
    ? `A recalculation is waiting for approval (rain ${state.pending.rain}%, total ₹${state.pending.amount}). Nothing has been sent yet.`
    : "No approval is pending right now.";
  const tamil = langOf(state) === "ta";
  const languageRule = tamil
    ? "ALWAYS reply in Tamil (தமிழ் script), even if the user writes or speaks English. Keep market words like 'mandi' and rupee amounts as they are."
    : "ALWAYS reply in simple, warm Indian English. Do not use Tamil script unless the user does.";
  return `You are HarvestWise, the voice-first restocking copilot on Paytm for ${
    state.name || MERCHANT.name
  }, a vegetable cart vendor in ${place.name}, Bengaluru.
Her name is ${state.name || MERCHANT.name} — never address her by any other name.
Numbers are strict: only quote figures that appear in LIVE CONTEXT (₹ amounts, quantities, rain %, hours, mandi rates). Never estimate, round, convert or invent one. If a figure is missing, say you do not have it and offer to recalculate.
When you talk about weather or rates, name her area (${place.name}) so she knows the reading is hers. She edits the order by voice (“add 2 kg beans”, “remove palak”, “set coriander to 8”) — confirm the exact line and new total, and never claim you already sent anything.
Speak simply and warmly, like a trusted neighbour. ${languageRule} Never invent prices, weather or numbers beyond this context. Finish with one clear next step. Keep every reply to at most 3 short sentences so it can be read aloud.

LIVE CONTEXT
- Rain probability at 3 PM: ${rain}%${temp ? `, about ${temp}°C` : ""}${state.weather?.humidity != null ? `, humidity ${state.weather.humidity}%` : ""} (${weatherNote})
${state.weather?.probTomorrow != null ? `- Tomorrow: ${state.weather.probTomorrow}% rain chance\n` : ""}- Her location: ${place.name}, Bengaluru (${place.lat}, ${place.lon}); nearest mandi: ${place.mandi}
- Today's buy-order: ${order}
- Shelf stock she logged at 9 PM last night: ${state.order.map((o) => `${o.name} ${Math.max(0, Number(o.stock) || 0)} ${o.unit}`).join(", ")}
- Regular sales count per day: ${state.order.map((o) => `${o.name} ~${Math.max(0, Number(o.salesAvg) || o.baseQty)} ${o.unit}`).join(", ")}
- 30-day order history: ${orderHistoryFromLedger(state).slice(0, 3).map((h) => `${h.label} ₹${h.total}`).join(", ")} (…${orderHistoryFromLedger(state).length} days total)
- Buy-order total: ₹${orderTotal(state.order)}
- Mandi (${place.mandi}): ${mandiLine(state).en}
- Wholesaler: ${MERCHANT.wholesaler}
- Shelf life today: ${
    state.order
      .filter((o) => o.perishable)
      .map((o) => `${o.name} ~${effectiveShelfHours(o, rain)}h (${riskFor(effectiveShelfHours(o, rain), rain).label.toLowerCase()})`)
      .join(", ") || "no perishables in the order"
  }
- Stock she counted last night: ${state.order.map((o) => `${o.name} ${Math.max(0, Number(o.stock) || 0)} ${o.unit}`).join(", ")}
- Lessons she has taught you: ${state.memory
    .slice(0, 3)
    .map((m) => m.text)
    .join(" | ")}
- Plan: HarvestWise Pro ₹149/month, billed on her Paytm settlement.
- Take-home this month: ₹${state.takeHome}; spoilage preserved: ₹${state.preserved}
- Approval state: ${pendingNote} Only she can approve; you never dispatch, never claim a dispatch already happened, and never invent a new total.`;
}

export async function askSarvam(text, state, history = []) {
  const messages = [
    ...history
      .filter((m) => m && typeof m.text === "string")
      .slice(-6)
      .map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.text })),
    { role: "user", content: text },
  ];
  try {
    const res = await fetch(SARVAM_API.chat, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, system: systemPrompt(state), temperature: 0.3 }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const reply = (data.reply || "").trim();
    return reply.length > 1 ? reply : null;
  } catch {
    return null;
  }
}

/* Returns a playable object URL, or null so the caller can fall back. */
export async function synthesizeSpeech(text, language = "en-IN") {
  try {
    const res = await fetch(SARVAM_API.tts, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.slice(0, 2200), language }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.audio) return null;
    const binary = atob(data.audio);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return URL.createObjectURL(new Blob([bytes], { type: data.mime || "audio/wav" }));
  } catch {
    return null;
  }
}

export async function transcribeAudio(blob, language = "kn-IN") {
  try {
    const res = await fetch(`${SARVAM_API.stt}?language=${encodeURIComponent(language)}`, {
      method: "POST",
      headers: { "Content-Type": blob.type || "audio/webm" },
      body: blob,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data.transcript || "").trim() || null;
  } catch {
    return null;
  }
}

/* ============================================================
   Cognee knowledge graph — real cloud tenant via the local proxy.
   Every function degrades to null so the UI can fall back to the
   local memory log without breaking the demo.
   ============================================================ */
export async function checkCognee() {
  try {
    const res = await fetch(COGNEE_API.health, { headers: { Accept: "application/json" } });
    if (!res.ok) return { cognee: false, checked: true };
    const data = await res.json();
    return { cognee: Boolean(data.cognee && data.reachable), dataset: data.dataset || null, checked: true };
  } catch {
    return { cognee: false, checked: true };
  }
}

/* Ask the graph a causal question ("Why 20kg?"). Returns the graph
   completion text, or null when Cognee is unreachable. */
export async function recallCognee(query) {
  const clean = (query || "").trim();
  if (!clean) return null;
  try {
    const res = await fetch(COGNEE_API.recall, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: clean }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = (data.text || "").trim();
    return text.length > 1 ? text : null;
  } catch {
    return null;
  }
}

/* Learn step: store an observation (never invented numbers — the caller
   passes the real dispatch/recalc facts). Fire-and-forget friendly. */
export async function rememberCognee(text) {
  const clean = (text || "").trim();
  if (!clean) return false;
  try {
    const res = await fetch(COGNEE_API.add, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: clean }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
