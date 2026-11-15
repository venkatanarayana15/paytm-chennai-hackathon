# HarvestWise — Hackathon Submission

## 1. Project description & problem

Fresh-produce merchants (like Lakshmi, a vegetable cart vendor in Bengaluru/Madurai)
lose 25–35% of their stock to spoilage every day. They buy on guesswork, have no
sales history, cannot read the weather forecast, and talk to the mandi at 6 AM —
when the decision is already made. Waste destroys both their income and their
working capital.

**HarvestWise** is a voice-first restocking copilot that closes the loop:

- **Observe** — a 30-day sales & stock ledger is built every night at 9 PM (stock ritual).
- **Predict** — the agent predicts today's purchase list from the 30-day history,
  *this* city's live weather (rain, temperature, humidity), each product's regular
  sales velocity, and what is already on the shelf.
- **Act** — one tap applies the suggested quantities to the order; the approval
  gate stays on for every money action; dispatch is logged and remembered.
- **Learn** — outcomes are written to a Cognee knowledge graph, so the copilot
  answers from what it actually remembers about the merchant.

What the merchant gets: a "buy today / do not buy" list with quantities and ₹,
a morning voice briefing, a nightly stock reminder, growth KPIs (take-home,
spoilage saved), and a copilot that speaks Tamil or English — typed or spoken.

## 2. Technology Stack

- **Frontend:** React 18 (create-react-app), custom CSS design system, fully responsive
- **Backend:** Node.js (zero-dependency API proxy, serves the build + APIs)
- **Deployment/Cloud:** Render (web service via `render.yaml` Blueprint), health-checked
- **APIs:**
  - Open-Meteo (live forecast — precipitation probability, temperature, humidity, today + tomorrow)
  - Sarvam AI (Indic LLM chat, TTS, STT)
  - Cognee (hosted knowledge-graph / causal memory, dataset `harvestwise`)
- **Data:** client-side deterministic demo ledger (30 days × 15 products) in
  localStorage; no separate database — the product is a browser-first demo.

## 3. AI/ML tools, models, pre-trained models

**In-product AI**
- **Sarvam AI** — Indic LLM (`sarvam-105b-conversations`) for open-ended bilingual chat;
  TTS (`bulbul:v3`) and STT (`saaras:v4`) for voice in Tamil/English.
- **Cognee** — graph-based memory/RAG: merchant outcomes (dispatches, rain recalc)
  are written as observations and recalled as grounded answers.
- **Deterministic rule engine** — money-affecting actions (recalc, dispatch, approval,
  order edits, quantity invites) never go to the LLM; they run on exact state,
  so totals are always true.
- **Open-Meteo** — weather intelligence feeding the prediction factors.

**Development tooling**
- Built with an agentic AI coding harness (OpenCode + Mercury-3 / Claude-class models),
  including automated end-to-end browser testing (Chrome DevTools MCP) used to verify
  every flow before each push.

## 4. Working Demo URL / Deployment Link

**https://paytm-chennai-hackathon.onrender.com/copilot**

(Also serves `/` Paytm landing and `/investors` investor model.)

## 5. Working Demo Video Recording URL

*Pending — a walkthrough video will be recorded and linked here (Loom/Drive/YouTube).*

Suggested 2–3 minute script: sign-in → morning briefing → “what should I buy today”
(chat list) → Apply quantities → approve dispatch → 9 PM stock reminder → memory ask.

## 6. GitHub / Code Repository URL

**https://github.com/venkatanarayana15/paytm-chennai-hackathon**

## 7. Pitch Deck

`HarvestWise_Round1_PaytmHackathon.pdf` (in the repo root) — upload directly to the
submission platform. A 2-minute demo flow is also documented in `README.md`.
