import React, { useEffect, useRef, useState } from "react";
import HarvestWise from "./HarvestWise";
import Metrics from "./Metrics";
import { LANGUAGES } from "./i18n";
import { LOCATIONS, DEFAULT_LOCATION } from "./copilot";

const USER_KEY = "harvestwise_user_v1";

const SERVICES = [
  { icon: "📱", label: "Mobile Recharge" },
  { icon: "💡", label: "Electricity Bill" },
  { icon: "📺", label: "DTH Recharge" },
  { icon: "💧", label: "Water Bill" },
  { icon: "🔥", label: "Gas Bill" },
  { icon: "🌐", label: "Broadband" },
  { icon: "🚇", label: "Metro Recharge" },
  { icon: "🛣️", label: "FASTag" },
  { icon: "🏥", label: "Insurance" },
  { icon: "💳", label: "Credit Card" },
  { icon: "🎬", label: "Movie Tickets" },
  { icon: "🚕", label: "Book a Cab" },
];

const QUICK = [
  { icon: "📷", label: "Scan & Pay" },
  { icon: "💸", label: "Send Money" },
  { icon: "🧾", label: "Pay Bills" },
  { icon: "🔁", label: "Autopay" },
  { icon: "🌾", label: "HarvestWise", highlight: true },
];

const LOOP = [
  {
    step: "1 · Observe",
    title: "Watches her world",
    text: "Hourly UPI sales velocity (with consent), IMD rain probability, festival calendar, mandi rates and per-commodity decay tables.",
  },
  {
    step: "2 · Predict",
    title: "Speaks the risk",
    text: "“Rain at 3 PM — coriander shelf-life drops to 4 hours; your rainy-day coriander sales fall 40%.” In her language, out loud.",
  },
  {
    step: "3 · Act",
    title: "Resizes and dispatches",
    text: "Recalculates the buy-order (10 → 6 bundles), confirms by voice, sends the revised order to her mandi wholesaler on WhatsApp.",
  },
  {
    step: "4 · Learn",
    title: "Remembers what worked",
    text: "Writes the outcome to her Cognee graph. Next week's order starts from this week's evidence, not from zero.",
  },
];

const NAV_LINKS = [
  { label: "Recharge & Bills", href: "#recharge" },
  { label: "HarvestWise", href: "#harvestwise" },
  { label: "Copilot", view: "harvest" },
  { label: "Paytm for Business", href: "#business" },
  { label: "How it works", href: "#loop" },
  { label: "Investor view", view: "metrics" },
];

/* The copilot is a separate core product page with its own URL; the Paytm landing stays the front door. */
const ROUTES = {
  "/": "landing",
  "/paytm": "landing",
  "/landing": "landing",
  "/copilot": "harvest",
  "/harvestwise": "harvest",
  "/investors": "metrics",
  "/metrics": "metrics",
};
const VIEW_PATHS = { harvest: "/copilot", landing: "/", metrics: "/investors" };

function readRoute() {
  const param = new URLSearchParams(window.location.search).get("view");
  if (param === "harvest" || param === "landing" || param === "metrics") return param;
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  return ROUTES[path] || "landing";
}

export default function App() {
  const [view, setView] = useState(readRoute);
  const [toast, setToast] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [tourRequested, setTourRequested] = useState(
    () => new URLSearchParams(window.location.search).get("tour") === "1"
  );
  const goTo = (next, { replace = false } = {}) => {
    const path = VIEW_PATHS[next] || "/";
    if (window.location.pathname !== path) {
      window.history[replace ? "replaceState" : "pushState"]({}, "", path);
    }
    setView(next);
  };
  const openHarvest = (withTour = false) => {
    setTourRequested(withTour);
    goTo("harvest");
  };
  const openSignIn = () => {
    setSignInLang(user?.lang || "en");
    setSignInLocation(user?.location || DEFAULT_LOCATION);
    setSignInEmail(user?.email || "");
    setSignInOpen(true);
  };
  const [signInName, setSignInName] = useState("");
  const [signInEmail, setSignInEmail] = useState("");
  const [signInLang, setSignInLang] = useState("en");
  const [signInLocation, setSignInLocation] = useState(DEFAULT_LOCATION);
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && parsed.name) {
        return {
          name: parsed.name,
          email: typeof parsed.email === "string" ? parsed.email : "",
          lang: parsed.lang === "ta" ? "ta" : "en",
          location: LOCATIONS.some((place) => place.id === parsed.location) ? parsed.location : DEFAULT_LOCATION,
        };
      }
      return { name: String(raw), email: "", lang: "en", location: DEFAULT_LOCATION };
    } catch {
      return null;
    }
  });
  const nameInputRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    setMenuOpen(false);
  }, [view]);

  /* Browser back/forward moves between the copilot and the landing page. */
  useEffect(() => {
    const onPop = () => setView(readRoute());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  /* Gate: HarvestWise requires sign-in. Unsigned visits bounce to the landing
     page with the sign-in modal open — nothing of the copilot is shown. */
  useEffect(() => {
    if (view === "harvest" && !user) {
      setView("landing");
      setSignInOpen(true);
    }
  }, [view, user]);

  useEffect(() => {
    if (!signInOpen) return;
    const timer = window.setTimeout(() => nameInputRef.current?.focus(), 60);
    const onKey = (event) => {
      if (event.key === "Escape") setSignInOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [signInOpen]);

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  };

  const signIn = (event) => {
    event?.preventDefault();
    const clean = signInName.trim().split(/\s+/).slice(0, 3).join(" ");
    if (clean.length < 2) {
      notify("Please enter your name");
      return;
    }
    const email = signInEmail.trim().toLowerCase();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      notify("That email doesn't look right — check it once");
      return;
    }
    const profile = { name: clean, email, lang: signInLang, location: signInLocation };
    setUser(profile);
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(profile));
    } catch {
      /* private mode */
    }
    setSignInOpen(false);
    setSignInName("");
    notify(
      signInLang === "ta"
        ? `வணக்கம் ${clean}! தமிழில் உங்களை வரவேற்கிறோம்.`
        : `Namaskara ${clean}! You're signed in.`
    );
    goTo("harvest");
  };

  const signOut = () => {
    setUser(null);
    try {
      localStorage.removeItem(USER_KEY);
    } catch {
      /* private mode */
    }
    notify("Signed out");
  };

  if (view === "harvest") {
    if (!user) return null; /* redirected to landing + sign-in by the gate effect */
    return (
      <HarvestWise
        merchantName={user?.name || ""}
        merchantEmail={user?.email || ""}
        language={user?.lang || "en"}
        location={user?.location || ""}
        onLocationChange={(next) => {
          setUser((prev) => {
            if (!prev) return prev;
            const updated = { ...prev, location: next };
            try {
              localStorage.setItem(USER_KEY, JSON.stringify(updated));
            } catch {
              /* private mode */
            }
            return updated;
          });
        }}
        onLanguageChange={(code) => {
          setUser((prev) => {
            if (!prev) return prev;
            const updated = { ...prev, lang: code === "ta" ? "ta" : "en" };
            try {
              localStorage.setItem(USER_KEY, JSON.stringify(updated));
            } catch {
              /* private mode */
            }
            return updated;
          });
        }}
        startTour={tourRequested}
        onBack={() => goTo("landing")}
        onMetrics={() => goTo("metrics")}
      />
    );
  }

  if (view === "metrics") {
    return <Metrics onBack={() => goTo("landing")} onOpenApp={() => goTo("harvest")} />;
  }

  return (
    <div className="pt">
      {/* thin utility strip */}
      <div className="pt-strip">
        <div className="container pt-strip-inner">
          <span>Build for India AI Hackathon · Track 1 — Merchant Growth AI</span>
          <div className="pt-strip-links">
            <a href="#harvestwise">HarvestWise demo</a>
            <span>24×7 Support</span>
          </div>
        </div>
      </div>

      {/* nav */}
      <nav className="pt-nav">
        <div className="container pt-nav-inner">
          <button className="pt-menu-btn" onClick={() => setMenuOpen((open) => !open)} aria-label="Menu" aria-expanded={menuOpen}>
            <span />
            <span />
            <span />
          </button>

          <a href="#top" className="pt-logo" aria-label="Paytm home">
            paytm<span>.</span>
          </a>

          <div className="pt-nav-links">
            {NAV_LINKS.map((link) =>
              link.view ? (
                <button key={link.label} className="pt-nav-link" onClick={() => goTo(link.view)}>
                  {link.label}
                </button>
              ) : (
                <a key={link.label} href={link.href}>
                  {link.label}
                </a>
              )
            )}
          </div>

          <div className="pt-nav-actions">
            {user ? (
              <div className="pt-user">
                <span className="pt-user-avatar">{user.name.charAt(0).toUpperCase()}</span>
                <span className="pt-user-name">{user.name}</span>
                <span className="pt-user-lang">{user.lang === "ta" ? "தமிழ்" : "EN"}</span>
                <button className="pt-user-out" onClick={signOut}>
                  Sign out
                </button>
              </div>
            ) : (
              <button className="pt-btn pt-btn-outline" onClick={openSignIn}>
                Sign In
              </button>
            )}
            <button className="pt-btn pt-btn-dark" onClick={() => goTo("harvest")}>
              Open HarvestWise
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="pt-mobile-menu">
            {NAV_LINKS.map((link) =>
              link.view ? (
                <button key={link.label} onClick={() => goTo(link.view)}>
                  {link.label}
                </button>
              ) : (
                <a key={link.label} href={link.href} onClick={() => setMenuOpen(false)}>
                  {link.label}
                </a>
              )
            )}
            <div className="pt-mobile-menu-foot">
              {user ? (
                <>
                  <span className="pt-user">
                    <span className="pt-user-avatar">{user.name.charAt(0).toUpperCase()}</span>
                    <span className="pt-user-name">{user.name}</span>
                  </span>
                  <button className="pt-btn pt-btn-outline" onClick={signOut}>
                    Sign out
                  </button>
                </>
              ) : (
                <button
                  className="pt-btn pt-btn-outline"
                  onClick={() => {
                    setMenuOpen(false);
                    openSignIn();
                  }}
                >
                  Sign In
                </button>
              )}
              <button className="pt-btn pt-btn-dark" onClick={() => goTo("harvest")}>
                Open HarvestWise
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* hero */}
      <section className="pt-hero" id="top">
        <div className="container pt-hero-grid">
          <div className="pt-hero-copy">
            <span className="pt-hero-tag">
              {user
                ? user.lang === "ta"
                  ? `வணக்கம், ${user.name} · Track 1`
                  : `Namaskara, ${user.name} · Track 1`
                : "Paytm Soundbox × Sarvam × Cognee × n8n"}
            </span>
            <h1>
              India's most-loved payments app.
              <br />
              <em>Now restocks her shop too.</em>
            </h1>
            <p>
              Recharge, pay bills, book travel — and for 30M+ merchants, a voice-first restocking copilot that predicts
              spoilage, recalculates the buy-order and dispatches it to the mandi before the gate opens.
            </p>
            <div className="pt-hero-cta">
              <button className="pt-btn pt-btn-white" onClick={() => openHarvest(false)}>
                Try HarvestWise →
              </button>
              <button className="pt-btn pt-btn-ghost" onClick={() => openHarvest(true)}>
                ▶ 60-second tour
              </button>
            </div>
            <div className="pt-hero-proof">
              <div>
                <strong>30M+</strong>
                <span>merchants</span>
              </div>
              <div>
                <strong>1.57 Cr</strong>
                <span>Soundbox / POS</span>
              </div>
              <div>
                <strong>₹175 Cr</strong>
                <span>spoilage / yr (BLR est.)</span>
              </div>
            </div>
          </div>

          <div className="pt-phone">
            <div className="pt-phone-notch" />
            <div className="pt-phone-screen">
              <div className="pt-phone-status">
                <span>9:41</span>
                <span>paytm</span>
              </div>

              <div className="pt-phone-balance">
                <span>Total balance</span>
                <strong>₹12,480</strong>
                <small>{user ? `${user.name.split(" ")[0].toLowerCase()}@paytm` : "lakshmi@paytm"}</small>
              </div>

              <div className="pt-phone-actions">
                {QUICK.map((q) => (
                  <button
                    key={q.label}
                    className={"pt-phone-action" + (q.highlight ? " is-hw" : "")}
                    onClick={() => (q.highlight ? goTo("harvest") : notify(`${q.label} — demo shortcut`))}
                  >
                    <span>{q.icon}</span>
                    {q.label}
                  </button>
                ))}
              </div>

              <button className="pt-phone-hwcard" onClick={() => goTo("harvest")}>
                <div className="pt-phone-hwcard-head">
                  <span>🌾 HarvestWise</span>
                  <small>NEW</small>
                </div>
                <p>80% rain at 3 PM — coriander shelf-life drops to 4 hrs. Recalculated order ready · ₹546</p>
                <span className="pt-phone-hwcard-cta">Review & approve →</span>
              </button>

              <div className="pt-phone-activity">
                <div className="pt-phone-activity-row">
                  <span className="pt-phone-activity-ico">🧺</span>
                  <div>
                    <strong>Customer · UPI</strong>
                    <small>12:41 PM</small>
                  </div>
                  <b>+₹240</b>
                </div>
                <div className="pt-phone-activity-row">
                  <span className="pt-phone-activity-ico">🌾</span>
                  <div>
                    <strong>HarvestWise memo</strong>
                    <small>Coriander sell by 12 PM</small>
                  </div>
                  <b className="is-memo">note</b>
                </div>
              </div>

              <div className="pt-phone-sales">
                <div className="pt-phone-sales-top">
                  <span>Today's sales</span>
                  <b>₹6,240</b>
                </div>
                <div className="pt-phone-bar">
                  <i style={{ width: "83%" }} />
                </div>
                <small>83% of ₹7,500 goal · UPI share 74%</small>
              </div>

              <div className="pt-phone-tx">
                <div>
                  <span>Paid to Ravi anna</span>
                  <small>Today · 5:02 AM</small>
                </div>
                <b>−₹546</b>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* quick actions strip */}
      <section className="pt-quick">
        <div className="container pt-quick-inner">
          {QUICK.map((q) => (
            <button
              key={q.label}
              className={"pt-quick-item" + (q.highlight ? " is-hw" : "")}
              onClick={() => (q.highlight ? goTo("harvest") : notify(`${q.label} — demo shortcut`))}
            >
              <span className="pt-quick-icon">{q.icon}</span>
              <span className="pt-quick-label">{q.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* recharge & bills */}
      <section className="pt-section" id="recharge">
        <div className="container">
          <div className="pt-section-head">
            <h2>Recharges & Bill Payments</h2>
            <p>Pay your bills in seconds — all in one place.</p>
          </div>

          <div className="pt-services">
            {SERVICES.map((s) => (
              <button
                key={s.label}
                className="pt-service"
                onClick={() => notify(`${s.label} is a placeholder in this demo`)}
              >
                <span className="pt-service-icon">{s.icon}</span>
                <span className="pt-service-label">{s.label}</span>
              </button>
            ))}

            <button className="pt-service pt-service-hw" onClick={() => goTo("harvest")}>
              <span className="pt-service-icon">
                🌾<i className="pt-service-new">NEW</i>
              </span>
              <span className="pt-service-label">HarvestWise</span>
            </button>
          </div>
        </div>
      </section>

      {/* HarvestWise spotlight */}
      <section className="pt-section pt-section-tint" id="harvestwise">
        <div className="container">
          <div className="pt-spotcard">
            <div className="pt-spotcopy">
              <span className="pt-spot-tag">Track 1 · Merchant Growth AI</span>
              <h2>Paytm made them merchants. Nobody made them restockers.</h2>
              <p>
                Lakshmi buys at 4:30 AM on one heuristic — what sold yesterday. An unpredicted storm at 3 PM empties the
                street and 25–35% of her stock rots by 9 PM. HarvestWise closes that loop with voice, not dashboards.
              </p>
              <ul className="pt-spotlist">
                <li>
                  <b>No new app, no login, no typing</b> — voice notes on WhatsApp, briefing on her existing Soundbox
                </li>
                <li>
                  <b>Not another chatbot</b> — it dispatches the revised buy-order to her wholesaler
                </li>
                <li>
                  <b>Human gate</b> — nothing that touches money moves without her “yes”
                </li>
              </ul>
              <div className="pt-hero-cta">
                <button className="pt-btn pt-btn-white" onClick={() => openHarvest(false)}>
                  Open the live demo →
                </button>
                <button className="pt-btn pt-btn-ghostlight" onClick={() => openHarvest(true)}>
                  ▶ Take the tour
                </button>
              </div>
            </div>

            <div className="pt-spotpanel">
              <div className="pt-spot-row">
                <span className="pt-spot-ico">🎙️</span>
                <div>
                  <strong>“3 crates tomatoes, 10 bundles coriander”</strong>
                  <small>Sarvam ASR · Kannada → intent + entities</small>
                </div>
              </div>
              <div className="pt-spot-row">
                <span className="pt-spot-ico">⚡</span>
                <div>
                  <strong>Coriander 10 → 6 bundles</strong>
                  <small>4-hour shelf-life at 80% rain · keeps ₹88 off the bin</small>
                </div>
              </div>
              <div className="pt-spot-row">
                <span className="pt-spot-ico">📤</span>
                <div>
                  <strong>Buy-order sent to Ravi anna · ₹546</strong>
                  <small>n8n dispatch gate · approved by voice</small>
                </div>
              </div>
              <div className="pt-spot-row">
                <span className="pt-spot-ico">🧠</span>
                <div>
                  <strong>“Rain recalc — worked, ₹1,940 kept”</strong>
                  <small>Written to her Cognee memory graph</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* the loop */}
      <section className="pt-section" id="loop">
        <div className="container">
          <div className="pt-section-head">
            <h2>One loop, every morning</h2>
            <p>Observe → Predict → Act → Learn. Advice is cheap; closed loops are rare.</p>
          </div>
          <div className="pt-loop">
            {LOOP.map((l) => (
              <div className="pt-loop-card" key={l.step}>
                <span className="pt-loop-step">{l.step}</span>
                <h3>{l.title}</h3>
                <p>{l.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* UPI banner */}
      <section className="pt-section pt-section-tint">
        <div className="container">
          <div className="pt-banner">
            <div>
              <h3>Pay anyone directly from your bank account</h3>
              <p>Contactless, instant and secure — Paytm UPI powers the merchant, HarvestWise powers the margin.</p>
              <button className="pt-btn pt-btn-white" onClick={() => notify("UPI demo shortcut")}>
                Learn more →
              </button>
            </div>
            <div className="pt-banner-art" aria-hidden="true">
              💸
            </div>
          </div>
        </div>
      </section>

      {/* impact */}
      <section className="pt-section" id="impact">
        <div className="container">
          <div className="pt-section-head">
            <h2>Waste is her biggest expense. We give 60% of it back.</h2>
            <p>Illustrative model · 3,500 daily capital · 30 selling days · pilot metric, not a claim.</p>
          </div>
          <div className="pt-impact">
            <div className="pt-impact-card">
              <span>Base take-home</span>
              <strong>₹21,000</strong>
              <small>~20% gross margin</small>
            </div>
            <div className="pt-impact-card is-up">
              <span>Spoilage preserved</span>
              <strong>₹7,200</strong>
              <small>60% reduction target</small>
            </div>
            <div className="pt-impact-card is-up">
              <span>New take-home</span>
              <strong>₹28,200</strong>
              <small>+34% per merchant</small>
            </div>
            <div className="pt-impact-card">
              <span>City-wide loss today</span>
              <strong>₹175 Cr</strong>
              <small>12,000 vendors · per year</small>
            </div>
          </div>

          <div className="pt-cards">
            <div className="pt-card">
              <span className="pt-card-ico">💳</span>
              <h3>Credit Cards</h3>
              <p>Paytm HDFC, SBI Card & Axis Bank Credit Card with assured cashback.</p>
              <button className="pt-link" onClick={() => notify("Credit cards — demo placeholder")}>
                Apply now →
              </button>
            </div>
            <div className="pt-card">
              <span className="pt-card-ico">🛡️</span>
              <h3>Insurance ka Super Market</h3>
              <p>A smart, simple and transparent platform to explore and purchase insurance.</p>
              <button className="pt-link" onClick={() => notify("Insurance — demo placeholder")}>
                Get it now →
              </button>
            </div>
            <div className="pt-card is-hw">
              <span className="pt-card-ico">🌾</span>
              <h3>HarvestWise for Merchants</h3>
              <p>Voice-first autonomous restocking. Speak. We recalculate and dispatch.</p>
              <button className="pt-link" onClick={() => goTo("harvest")}>
                Open app →
              </button>
            </div>
          </div>

          <div className="pt-impact-cta">
            <button className="pt-btn pt-btn-dark" onClick={() => goTo("metrics")}>
              Open the investor model →
            </button>
          </div>
        </div>
      </section>

      {/* business / growth */}
      <section className="pt-growth" id="business">
        <div className="container pt-growth-inner">
          <h2>Payments that power your growth</h2>
          <p>
            Accept every payment your business needs — UPI, cards, EMI, Soundbox, QR — and now the restocking layer on
            top of it.
          </p>
          <div className="pt-growth-cta">
            <button className="pt-btn pt-btn-white" onClick={() => goTo("harvest")}>
              Open HarvestWise
            </button>
            <button className="pt-btn pt-btn-ghost" onClick={() => goTo("metrics")}>
              Investor view
            </button>
          </div>
        </div>
      </section>

      <footer className="pt-footer">
        <div className="container">
          <div className="pt-footer-grid">
            <div>
              <div className="pt-footer-logo">paytm.</div>
              <p>
                Paytm-style merchant experience · HarvestWise build for the Build for India AI Hackathon, Bengaluru
                Edition.
              </p>
            </div>
            <div>
              <h4>Products</h4>
              <a href="#recharge">Mobile Recharge</a>
              <a href="#recharge">Electricity</a>
              <a href="#recharge">Insurance</a>
              <a href="#harvestwise">HarvestWise</a>
            </div>
            <div>
              <h4>Business</h4>
              <a href="#business">Paytm for Business</a>
              <a href="#business">Soundbox</a>
              <a href="#business">QR Code</a>
              <a href="#business">Merchant Loans</a>
            </div>
            <div>
              <h4>Hackathon</h4>
              <a href="#loop">How it works</a>
              <button className="pt-footer-link" onClick={() => goTo("metrics")}>
                Investor model
              </button>
              <a href="#harvestwise">Live demo</a>
              <a href="#top">Back to top</a>
            </div>
          </div>
          <div className="pt-footer-bottom">
            <span>© 2026 Paytm-style demo · Not affiliated with Paytm</span>
            <span>Team Sairam · Venkata Narayana G V · Malaravan P</span>
          </div>
        </div>
      </footer>

      {signInOpen && (
        <div className="pt-modal-backdrop" onClick={() => setSignInOpen(false)}>
          <div
            className="pt-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="signin-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="pt-modal-head">
              <div className="pt-modal-mark">paytm<span>.</span></div>
              <button className="pt-modal-close" onClick={() => setSignInOpen(false)} aria-label="Close">
                ✕
              </button>
            </div>
            <h2 id="signin-title">Sign in with your name</h2>
            <p>No OTP, no password — this demo remembers your name, email, area and language on this device.</p>
            <form onSubmit={signIn}>
              <label className="pt-field">
                <span>Your name</span>
                <input
                  ref={nameInputRef}
                  value={signInName}
                  onChange={(event) => setSignInName(event.target.value)}
                  placeholder="e.g. Lakshmi"
                  maxLength={40}
                  autoComplete="name"
                />
              </label>

              <label className="pt-field">
                <span>Your email</span>
                <input
                  type="email"
                  value={signInEmail}
                  onChange={(event) => setSignInEmail(event.target.value)}
                  placeholder="lakshmi@example.com"
                  maxLength={60}
                  autoComplete="email"
                />
                <small className="pt-field-hint">
                  Every morning the copilot emails your purchase list here — what to buy, what to skip, with quantities.
                </small>
              </label>

              <label className="pt-field">
                <span>Your area</span>
                <select
                  className="pt-select"
                  value={signInLocation}
                  onChange={(event) => setSignInLocation(event.target.value)}
                >
                  {LOCATIONS.map((place) => (
                    <option key={place.id} value={place.id}>
                      {place.name} · {place.mandi} mandi
                    </option>
                  ))}
                </select>
                <small className="pt-field-hint">
                  Live rain and mandi rates follow this pin — change it anytime in HarvestWise → Settings.
                </small>
              </label>

              <div className="pt-field">
                <span>Preferred language</span>
                <div className="pt-lang-options">
                  {LANGUAGES.map((option) => (
                    <button
                      type="button"
                      key={option.code}
                      className={"pt-lang-option" + (signInLang === option.code ? " is-on" : "")}
                      onClick={() => setSignInLang(option.code)}
                      aria-pressed={signInLang === option.code}
                    >
                      <strong>{option.native}</strong>
                      <small>{option.code === "ta" ? "Copilot speaks & listens in Tamil" : "Copilot speaks & listens in English"}</small>
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="pt-btn pt-btn-dark pt-modal-submit">
                Continue to HarvestWise
              </button>
            </form>
            <div className="pt-modal-foot">
              You can change your area and language anytime in HarvestWise → Settings.
            </div>
          </div>
        </div>
      )}

      {toast && <div className="pt-toast">{toast}</div>}
    </div>
  );
}
