import React, { useMemo, useState } from "react";

const inr = (n) => "₹" + Math.round(n).toLocaleString("en-IN");
const crore = (n) => `₹${(n / 1e7).toFixed(1)} Cr`;
const lakh = (n) => `₹${(n / 1e5).toFixed(1)} L`;

const KPIS = [
  { label: "Merchants in Paytm's ecosystem", value: "30M+" },
  { label: "Soundbox / POS subscriptions", value: "1.57 Cr" },
  { label: "Monthly transacting users", value: "8 Cr" },
  { label: "Spoilage lost in Bengaluru / yr", value: "₹175 Cr" },
];

const SLIDERS = [
  { key: "vendors", label: "Vendors in pilot city", min: 1000, max: 30000, step: 1000, suffix: "" },
  { key: "capital", label: "Daily working capital", min: 1500, max: 8000, step: 250, prefix: "₹" },
  { key: "spoilage", label: "Unsold stock lost per day", min: 100, max: 900, step: 50, prefix: "₹" },
  { key: "reduction", label: "Spoilage reduction target", min: 30, max: 80, step: 5, suffix: "%" },
  { key: "days", label: "Selling days / month", min: 20, max: 31, step: 1, suffix: "" },
  { key: "conversion", label: "Merchants on Pro", min: 10, max: 80, step: 5, suffix: "%" },
];

const PAYTM_WINS = [
  {
    icon: "🔊",
    title: "Soundbox upgraded",
    text: "From passive payment-confirmation speaker to active operational assistant — a deeper, stickier device relationship on 1.57 Cr subscriptions.",
  },
  {
    icon: "📈",
    title: "GMV up",
    text: "Better-stocked merchants capture demand they currently miss. Target +8% GMV per merchant, with zero new acquisition cost.",
  },
  {
    icon: "🏦",
    title: "Underwriting data moat",
    text: "Inventory and procurement telemetry de-risks Paytm Merchant Loans — replacing informal meter-baddi credit with formal credit.",
  },
  {
    icon: "🇮🇳",
    title: "Mission delivered",
    text: "Financial inclusion that shows up as a healthier family P&L — the story of Build for India, measured as money preserved.",
  },
];

const ROADMAP = [
  {
    when: "Now · finale",
    title: "MVP on partner stack",
    text: "Seeded 90-day sales data, three n8n workflows (briefing, recalc + dispatch, day-wrap), Sarvam voice loop, Cognee memory.",
  },
  {
    when: "Months 1–3",
    title: "500-merchant pilot",
    text: "KR Market, Russell Market and Madivala with vendor associations. Validate the 60% spoilage-reduction metric.",
  },
  {
    when: "Months 4–6",
    title: "Paytm-native integration",
    text: "API partnership with Paytm for Business, Soundbox briefing rail, mandi logistics wired into n8n dispatch.",
  },
  {
    when: "Beyond",
    title: "The restocking layer",
    text: "Perishables → kirana fresh → all categories. Procurement telemetry → merchant credit. Every merchant, a copilot.",
  },
];

export default function Metrics({ onBack, onOpenApp }) {
  const [m, setM] = useState({
    vendors: 12000,
    capital: 3500,
    spoilage: 400,
    reduction: 60,
    days: 30,
    conversion: 35,
  });

  const model = useMemo(() => {
    const spoilageMonthly = m.spoilage * m.days;
    const preserved = spoilageMonthly * (m.reduction / 100);
    const baseTake = m.capital * 0.2 * m.days; // ~20% gross margin in the pilot model
    const newTake = baseTake + preserved;
    const uplift = ((newTake - baseTake) / baseTake) * 100;
    const cityLoss = m.spoilage * m.vendors * 365;
    const cityPreserved = cityLoss * (m.reduction / 100);
    const proMrr = (m.vendors * m.conversion) / 100 * 149;
    const maxBar = Math.max(baseTake, newTake) || 1;
    return {
      spoilageMonthly,
      preserved,
      baseTake,
      newTake,
      uplift,
      cityLoss,
      cityPreserved,
      proMrr,
      proArr: proMrr * 12,
      basePct: (baseTake / maxBar) * 100,
      newPct: (newTake / maxBar) * 100,
    };
  }, [m]);

  const set = (key) => (event) => setM((prev) => ({ ...prev, [key]: Number(event.target.value) }));

  return (
    <div className="mx">
      <header className="mx-top">
        <div className="mx-top-inner">
          <button className="mx-back" onClick={onBack}>
            ← Paytm
          </button>
          <div className="mx-brand">
            <div className="mx-mark">🌾</div>
            <div>
              <strong>HarvestWise · Investor view</strong>
              <span>Track 1 — Merchant Growth AI</span>
            </div>
          </div>
          <button className="mx-cta" onClick={onOpenApp}>
            Open the demo →
          </button>
        </div>
      </header>

      <main className="mx-main">
        <section className="mx-hero">
          <span className="mx-eyebrow">Impact & unit economics</span>
          <h1>Waste is her biggest expense. We give 60% of it back.</h1>
          <p>
            ₹400 of leafy stock is dumped every evening at 9 PM. HarvestWise moves that loss before the mandi gate opens —
            and gets paid out of the money it saves.
          </p>

          <div className="mx-kpis">
            {KPIS.map((k) => (
              <div className="mx-kpi" key={k.label}>
                <strong>{k.value}</strong>
                <span>{k.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-card mx-model">
          <div className="mx-model-head">
            <div>
              <h2>Model the city</h2>
              <p>Drag the assumptions — every number below recomputes from the pilot model in the deck.</p>
            </div>
            <span className="mx-tag">Illustrative · validated in pilot</span>
          </div>

          <div className="mx-model-grid">
            <div className="mx-controls">
              {SLIDERS.map((s) => (
                <label className="mx-control" key={s.key}>
                  <span className="mx-control-top">
                    <span>{s.label}</span>
                    <b>
                      {s.prefix || ""}
                      {m[s.key].toLocaleString("en-IN")}
                      {s.suffix || ""}
                    </b>
                  </span>
                  <input
                    type="range"
                    min={s.min}
                    max={s.max}
                    step={s.step}
                    value={m[s.key]}
                    onChange={set(s.key)}
                    aria-label={s.label}
                  />
                </label>
              ))}
            </div>

            <div className="mx-results">
              <div className="mx-result-row">
                <div>
                  <span>Unsold stock lost / month</span>
                  <strong>{inr(model.spoilageMonthly)}</strong>
                </div>
                <div className="is-up">
                  <span>Preserved / month</span>
                  <strong>{inr(model.preserved)}</strong>
                </div>
              </div>

              <div className="mx-bars">
                <div className="mx-bar-row">
                  <span className="mx-bar-label">Base take-home</span>
                  <div className="mx-bar">
                    <i className="is-base" style={{ width: `${model.basePct}%` }} />
                  </div>
                  <b>{inr(model.baseTake)}</b>
                </div>
                <div className="mx-bar-row">
                  <span className="mx-bar-label">With HarvestWise</span>
                  <div className="mx-bar">
                    <i className="is-new" style={{ width: `${model.newPct}%` }} />
                  </div>
                  <b>{inr(model.newTake)}</b>
                </div>
              </div>

              <div className="mx-uplift">
                <strong>+{model.uplift.toFixed(0)}%</strong>
                <span>take-home uplift per vendor per month</span>
              </div>

              <div className="mx-result-row is-quiet">
                <div>
                  <span>City-wide spoilage / year</span>
                  <strong>{crore(model.cityLoss)}</strong>
                </div>
                <div>
                  <span>Working capital preserved</span>
                  <strong>{crore(model.cityPreserved)}</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-split">
          <div className="mx-card">
            <h2>Billed where she already pays</h2>
            <p className="mx-copy">
              Settlement-linked micro-deduction on the Paytm rail — no invoice, no friction, no literacy barrier. Free
              forever for the habit, paid only when we create value.
            </p>
            <div className="mx-plans">
              <div className="mx-plan">
                <span className="mx-plan-name">Seed</span>
                <strong>₹0</strong>
                <small>forever</small>
                <ul>
                  <li>Daily demand alerts</li>
                  <li>Weather + spoilage risk</li>
                  <li>Soundbox briefing</li>
                </ul>
              </div>
              <div className="mx-plan is-pro">
                <span className="mx-plan-name">Pro</span>
                <strong>₹149</strong>
                <small>per month</small>
                <ul>
                  <li>Autonomous restocking + dispatch</li>
                  <li>Price-drop supplier alerts</li>
                  <li>End-of-day P&L voice audit</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mx-card mx-revenue">
            <h2>Pro revenue at these assumptions</h2>
            <div className="mx-revenue-big">
              <strong>{lakh(model.proMrr)}</strong>
              <span>monthly · {m.conversion}% of {m.vendors.toLocaleString("en-IN")} vendors</span>
            </div>
            <div className="mx-revenue-row">
              <div>
                <span>Annual run-rate</span>
                <strong>{crore(model.proArr)}</strong>
              </div>
              <div>
                <span>Payback for merchant</span>
                <strong>one evening</strong>
              </div>
            </div>
            <div className="mx-quote">
              “₹149/mo against {inr(model.preserved)} preserved — it pays for itself in one saved evening of stock.”
            </div>
            <div className="mx-stack">
              <span>Supplier marketplace take-rate</span>
              <span>Credit distribution via telemetry</span>
              <span>Anonymised demand curves (DPDP)</span>
            </div>
          </div>
        </section>

        <section className="mx-card">
          <h2>What Paytm wins</h2>
          <div className="mx-wins">
            {PAYTM_WINS.map((w) => (
              <div className="mx-win" key={w.title}>
                <span className="mx-win-ico">{w.icon}</span>
                <strong>{w.title}</strong>
                <p>{w.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-card">
          <h2>From this deck to a pilot</h2>
          <div className="mx-roadmap">
            {ROADMAP.map((r) => (
              <div className="mx-step" key={r.when}>
                <span className="mx-step-when">{r.when}</span>
                <strong>{r.title}</strong>
                <p>{r.text}</p>
              </div>
            ))}
          </div>
        </section>

        <p className="mx-footnote">
          Assumptions: ~20% gross margin, 30 selling days, {inr(m.spoilage)} of net spoilage per day after evening
          salvage. The {m.reduction}% reduction is the pilot metric we commit to validating — not a claim. City-wide
          figures scale the per-vendor model across {m.vendors.toLocaleString("en-IN")} vendors.
        </p>
      </main>
    </div>
  );
}
