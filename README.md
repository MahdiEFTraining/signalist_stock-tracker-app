# WealthFlow

> AI-augmented paper-trading and stock-research platform. Track real markets, simulate trades with $100k of virtual cash, get AI-grounded answers about any stock, and let an AI watch the news for you.

[![Next.js 16](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/) [![React 19](https://img.shields.io/badge/React-19-61dafb)](https://react.dev/) [![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)](https://www.typescriptlang.org/) [![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248)](https://www.mongodb.com/atlas) [![Inngest](https://img.shields.io/badge/Inngest-cron%20%2B%20jobs-7c3aed)](https://www.inngest.com/) [![Gemini](https://img.shields.io/badge/Google-Gemini-FDD458)](https://ai.google.dev/)

---

## What it does

| Pillar | Features |
|---|---|
| **Markets & research** | Live quotes (Finnhub), embedded TradingView widgets, fuzzy stock search (`Cmd+K`), watchlist, daily AI-summarized news email |
| **Paper trading** | $100k virtual portfolio · atomic trades (MongoDB transactions) · weighted-average cost basis · holdings table with unrealized P&L · 30-day equity curve · sector allocation donut · transaction history · multi-user leaderboard |
| **AI investment assistant** | Per-stock chatbot grounded in live quote + recent news (Gemini) · daily news-sentiment pipeline (AI-scored articles, stacked-bar timeline) · sentiment-shift alerts · personalized weekly recap email tied to user's risk profile |
| **Auth & alerts** | Email/password sign-up with investment profile · forgot/reset password flow · price alerts (hourly cron) · sentiment alerts (hourly cron) |

---

## Screenshots

> 📸 Screenshots in `screenshots/` reflect an earlier baseline. Fresh captures of `/portfolio`, `/leaderboard`, the chat panel and the sentiment timeline are recommended before the defense.

---

## Tech stack

- **Frontend** — Next.js 16 (App Router, React Server Components, Server Actions), React 19, Tailwind CSS 4, shadcn/ui (Radix), Recharts.
- **Backend** — Next.js Route Handlers, server actions with `'use server'` boundary.
- **Auth** — better-auth (MongoDB adapter, session cookies, password reset).
- **Database** — MongoDB Atlas (replica set → enables transactions). Mongoose 9 ODM.
- **Background jobs** — [Inngest](https://www.inngest.com/) for crons and durable AI workflows (welcome email, daily news, hourly price/sentiment alert checks, daily portfolio snapshots, daily news sentiment scoring, weekly recap).
- **AI** — Google Gemini (`gemini-3-flash-preview`). Two integration paths:
  - `lib/ai/gemini.ts` — direct REST helper for **request-scoped** chat (low latency, structured JSON via `responseSchema`).
  - `step.ai.gemini` — Inngest's durable AI for **background jobs** (retries, idempotent steps).
- **External APIs** — Finnhub (quotes, profiles, company news), TradingView embedded widgets.
- **Email** — Nodemailer + Gmail SMTP.

---

## Quick start

**Prerequisites:** Node 20+, a MongoDB Atlas cluster, Finnhub API key, Gemini API key, Gmail app password.

```bash
git clone <repo-url>
cd stocks_app
npm install
cp .env.example .env  # then fill in the keys
npm run dev
```

Required `.env` keys:

```
MONGODB_URI=...
NEXT_PUBLIC_API_KEY=...      # Finnhub
FINNHUB_API_KEY=...          # same as above (used server-side)
GEMINI_API_KEY=...
NODEMAILER_EMAIL=...
NODEMAILER_PASSWORD=...      # Gmail app password
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=http://localhost:3000
```

To run the cron jobs locally, also start the Inngest dev server (separate terminal):

```bash
npx inngest-cli@latest dev
```

Then open the Inngest dashboard at <http://localhost:8288> to invoke functions manually.

---

## Repository layout

```
app/
  (auth)/             — sign-in, sign-up, forgot/reset password
  (root)/             — dashboard, /stocks/[symbol], /watchlist, /portfolio, /leaderboard
  api/
    auth/             — better-auth route handlers
    inngest/          — Inngest serve()
components/           — UI (TradeModal, StockChatPanel, EquityCurveChart, …)
lib/
  actions/            — server actions (portfolio, watchlist, alert, chat, sentiment, recap, …)
  ai/                 — direct Gemini helper
  inngest/            — client, prompts, function definitions
  better-auth/        — auth config
  nodemailer/         — email transport + HTML templates
DATABASE/
  models/             — Mongoose schemas (Portfolio, Transaction, Holding,
                        PortfolioSnapshot, Watchlist, Alert, NewsSentiment)
  mongoose.ts         — connection cache (IPv4-forced)
docs/                 — architecture, pipelines, methodology, presentation
PFA_LOG.md            — full development log (decisions, design notes, testing)
```

---

## Deeper documentation

| Doc | What's in it |
|---|---|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | High-level system diagram, component layers, MongoDB ER diagram |
| [`docs/PIPELINES.md`](docs/PIPELINES.md) | Sequence diagrams for trade execution, sentiment pipeline, weekly recap, chatbot grounding |
| [`docs/METHODOLOGY.md`](docs/METHODOLOGY.md) | Tech-choice rationale, constraints encountered, limitations, future work |
| [`docs/PRESENTATION.md`](docs/PRESENTATION.md) | Slide-by-slide outline for the PFA defense, demo script, anticipated jury Q&A |
| [`PFA_LOG.md`](PFA_LOG.md) | Chronological log of every decision and design note across the build |

---

## Origin & originality

This project started from the JavaScript Mastery "Signalist" tutorial (auth + watchlist + alerts + daily news email + TradingView widgets). All net-new work is documented in `PFA_LOG.md` and explicitly labelled in the presentation deck. Net-new contributions on top of the tutorial baseline:

- Complete **paper-trading & portfolio analytics** track (4 models, 8 server actions, 2 pages, 6 components, 1 daily snapshot cron, leaderboard).
- Complete **AI investment assistant** track (per-stock chatbot, news sentiment pipeline + cron + chart, sentiment-shift alerts extending the alert system, personalized weekly AI recap).
- Direct Gemini REST helper with structured JSON output (`responseSchema`).
- 5s `AbortSignal.timeout` on all Finnhub fetches with clear error messages.

See [`docs/METHODOLOGY.md`](docs/METHODOLOGY.md) for the full delta.

---

## License

Educational project — no license attached. Not for production use.
