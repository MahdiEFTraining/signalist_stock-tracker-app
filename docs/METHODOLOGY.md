# Methodology

Why each piece of the stack was chosen, what it cost us, and what's deliberately not in scope. Companion to [`ARCHITECTURE.md`](ARCHITECTURE.md) (the *what*) and [`PIPELINES.md`](PIPELINES.md) (the *how*).

---

## 1. Tech choices & rationale

### Frontend

| Choice | Why | Alternatives considered |
|---|---|---|
| **Next.js 16 (App Router, RSC, Server Actions)** | Server-first by default → less client JS shipped. Server Actions give a type-safe mutation surface without writing a parallel REST layer. Built-in caching + revalidation. | SvelteKit (smaller community for this stack), Remix (similar but smaller ecosystem), pure SPA + REST (more boilerplate, two languages of mutation). |
| **React 19** | Comes with Next 16. Suspense + concurrent rendering work cleanly with RSC. | n/a — paired with Next. |
| **TypeScript 5 (strict)** | Catches bugs at the schema/type boundary that would otherwise leak into runtime. Critical when actions move between client and server. | Plain JS (rejected — too easy to mismatch action input/output types). |
| **Tailwind CSS 4 + shadcn/ui** | Utility-first lets us iterate UI fast; shadcn gives accessible Radix primitives (Dialog, Popover, Select, Dropdown, Table) that we own and can restyle. | MUI / Chakra (heavier, harder to match a custom dark theme), pure CSS (slow). |
| **Recharts** | React-native, SVG, simple declarative API. Used for the equity curve, sector donut, sentiment timeline. ~100 KB. | TradingView lightweight-charts (lower-level, finance-focused but more code), Chart.js (canvas, less React-friendly), D3 (overkill). |
| **TradingView embedded widgets** | Saves us from building/maintaining candlestick + technical-analysis + heatmap visuals — they're free, polished, and well-known to investors. | Building from scratch (months of work, no benefit), Highcharts (paid). |

### Backend / data

| Choice | Why | Alternatives considered |
|---|---|---|
| **MongoDB Atlas** | Flexible schema fits evolving features (alert categories, snapshot fields). Atlas is a replica set by default → enables MongoDB transactions, which we need for atomic trade execution. Free tier sufficient for the PFA. | Postgres + Prisma (more rigid for schema iteration; perfectly viable, would be the choice for a "real" product). |
| **Mongoose 9** | Schema validation, indexes, lean queries, well-documented. Models read like the data, hides driver boilerplate. | Native MongoDB driver (more verbose, no schema enforcement). |
| **better-auth** | Modern auth library, MongoDB adapter built-in, session cookies (no JWT footguns), customizable callback for password reset → email. | NextAuth (heavier, less ergonomic with Mongo), roll-our-own (out of scope for a PFA). |
| **Inngest** | Durable cron + AI workflows without standing up a separate scheduler. `step.ai.gemini` integrates AI as a first-class retried step. Local dev UI shows traces of every run. Free tier is generous. | BullMQ + Redis (more infra), Vercel Cron + custom retries (we'd reinvent durability), n8n (too visual-tool-y for in-repo definitions). |

### AI

| Choice | Why | Alternatives considered |
|---|---|---|
| **Google Gemini (`gemini-3-flash-preview`)** | Generous free tier, fast inference, strong instruction-following, native **structured output** via `responseSchema`. Cheaper than GPT-4-class models for the volumes we generate. | OpenAI GPT-4o (better but pricier), Anthropic Claude (stricter rate limits on free tier), open-source via Ollama (latency + ops cost not worth it for PFA). |
| **Two integration paths** | Direct REST helper for **request-scoped** chat (low latency); `step.ai.gemini` for **background workflows** (durable retries). | Single path (rejected — would force latency tradeoff one way or the other). |
| **Structured output via `responseSchema`** | Guarantees JSON shape for sentiment scoring. Cheaper and more reliable than prompt-and-pray-then-parse. | Free-text responses + regex parsing (brittle, costs more retries). |

### Infrastructure

| Choice | Why |
|---|---|
| **Nodemailer + Gmail SMTP** | Simplest path to transactional email. Gmail app password is enough for PFA scale (thousands of emails/day). |
| **`AbortSignal.timeout(5000)` on Finnhub** | Without it, undici's 10s default doubles every page-load wait when Finnhub is unreachable. 5s = perceivably faster + clearer error message. |
| **`family: 4` on the Mongoose connection** | Forces IPv4. Some networks (and Cloudflare for Atlas) misbehave with IPv6 first. Resolves intermittent DNS issues. |

---

## 2. Constraints & how we worked around them

### Finnhub free tier (60 req/min)

- **Cache `/stock/profile2` for 24h** (`fetchJSON(url, 86400)`) — sectors and company names rarely change. Massive saving on portfolio page loads.
- **Cache stock search for 30 min**; popular-stock fallback for 1 hour.
- **Dedupe symbols across all users in every cron** — if 50 users all hold AAPL, we hit Finnhub once for AAPL, not 50 times. Applied in `snapshotAllPortfolios`, `processWatchlistSentiment`, `getLeaderboard`, `checkPriceAlerts`, `checkSentimentAlerts`.

### Finnhub network reliability

- **5s `AbortSignal.timeout`** on every fetch.
- **`Promise.allSettled` for chatbot context** — one failed Finnhub call doesn't block the answer; we send less context to Gemini and the user still gets a useful response.
- **Per-symbol catches with `console.warn`** (one-liner, no stack) so logs stay scannable.

### No historical candles on Finnhub free tier

- **Equity curve uses our own daily snapshots** (`recordPortfolioSnapshots` cron at 22:00 UTC) — the data is *generated*, not fetched.
- **Weekly recap context skips 7-day historical prices for watchlist stocks**. Compensates with current price + today's % change + 7-day **sentiment** summary — enough material for the AI to write meaningful commentary without making numbers up.

### Gemini latency for the chatbot

- Chatbot uses `lib/ai/gemini.ts` directly (not Inngest) so the user gets a response in 2–10s instead of waiting on Inngest's eventual delivery.
- Prompt-engineered for brevity (`maxTokens: 1024`, "Be concise — usually 1-3 short paragraphs").
- 25s timeout — generous enough for slow responses, short enough that errors don't leave the UI hung.

### MongoDB transactions require a replica set

- Atlas is a replica set by default → ✓ works out of the box.
- Documented in README and METHODOLOGY: switching to a local standalone `mongod` will throw `Transaction numbers are only allowed on a replica set member or mongos`.

---

## 3. Originality vs. tutorial baseline

WealthFlow started from the JavaScript Mastery "Signalist" tutorial. The tutorial provided: auth, watchlist, price alerts, daily news email, TradingView widget integration, the email templates and Inngest scaffolding.

**Net-new on top of the baseline (everything below is mine):**

| Track | Net-new |
|---|---|
| **Paper trading & portfolio analytics** | 4 Mongoose models (Portfolio, Transaction, Holding, PortfolioSnapshot), 8 server actions, 2 pages (`/portfolio`, `/leaderboard`), 6 components (TradeModal, TradeStockButton, PortfolioSummaryCards, HoldingsTable, TransactionsTable, EquityCurveChart, SectorAllocationChart), 1 daily Inngest cron (snapshots), Recharts integration. |
| **AI investment assistant** | 1 model (NewsSentiment), 5 server actions (askStockQuestion, scoreArticles, processSentimentForSymbol, processWatchlistSentiment, getSentimentTimeline, getSentimentSummary, getPortfolioWeeklyStats, buildWeeklyRecapContext), 2 components (StockChatPanel, SentimentTimelineChart), 3 Inngest functions (processNewsSentiment, checkSentimentAlerts, sendWeeklyRecap), direct Gemini REST helper, 2 new email templates + senders, 2 new prompts. Extended AlertModel with `alertCategory`. |
| **Reliability & polish** | 5s `AbortSignal.timeout` across all Finnhub calls + clear error message; `console.warn` one-liners replacing noisy `console.error` stacks; Recharts `min-w-0` + numeric heights to silence the `width(-1)` warning; full TypeScript types throughout. |

Every commit on the `implement-search` branch and downstream is documented in `PFA_LOG.md` with rationale and design notes.

---

## 4. Limitations (honest)

These aren't bugs — they're conscious scope cuts. Disclose them up front; they make excellent "future work" talking points.

| Limitation | Why it's there |
|---|---|
| **No automated tests** | Manual testing only via dev server + Inngest dev UI. A few targeted unit tests on `executeTrade` cost-basis math and `scoreArticles` parsing would be the obvious next step. |
| **Cost basis is weighted-average** | Tax-lot accounting (FIFO/LIFO/specific) needs a separate `tax_lots` collection. Fine for a paper trading sim; non-trivial for a real product. |
| **Whole-share quantities only** | Real brokers offer fractional shares. We don't. Keeps the math clean for the report. |
| **No dividends, splits, or corporate actions** | Out of scope. Would require historical event data and complex adjustment logic. |
| **Today's P&L = $0 when markets are closed** | Derived from Finnhub's `d` field (today's price change). When markets are closed, `d == 0`. Not a bug. |
| **Leaderboard recomputed on every page load** | Fine up to ~100 users on the free tier. Caching for ~60s would be a 5-line change if traffic grew. |
| **Chatbot is awaited, not streaming** | Streaming would need SSE or RSC streaming + a redesign of `StockChatPanel`. The 2–10s wait is acceptable for v1 and trivial to upgrade later. |
| **Sentiment cron is sequential** | ~3s per symbol. Fine up to ~50 symbols. Above that, batch into groups of 3-5 in parallel. |
| **AI features depend on a valid `GEMINI_API_KEY`** | If the key is missing or rate-limited, chatbot/sentiment/recap degrade gracefully (toast errors, empty charts) but the user-facing experience suffers. |
| **Sentiment classification accuracy not measured** | Would need a labeled validation set of ~200 articles scored by humans + reviewers. Out of scope for the PFA but the obvious next academic step. |

---

## 5. Future work

In rough priority order:

1. **Tests** — Jest or Vitest. Targeted: trade math, sentiment parsing, threshold logic for both alert categories. ~1 day's work for meaningful coverage.
2. **Backtesting & Strategy Builder** — the originally-planned Option C. Indicator-based strategies (SMA crossover, RSI, MACD), backtest engine producing return %, max drawdown, Sharpe ratio. Caveat: needs historical price data, which Finnhub free tier doesn't expose — would pivot to Yahoo Finance or pay for the upgrade.
3. **Streaming chatbot responses** — SSE + `ReadableStream` from server action. Better perceived latency.
4. **Sentiment accuracy study** — label ~200 articles, compute precision/recall vs. Gemini's predictions, write up the methodology. Excellent academic chapter.
5. **i18n (FR / EN / AR)** — `next-intl` or `next-i18next`. Three languages would map well to a Moroccan PFA context.
6. **Real-time prices via WebSocket** — Finnhub has a WS endpoint on paid tiers. Replace the per-page-load polling with a single WS connection.
7. **Fractional shares + tax lots** — only worth it if the project goes beyond academic.
8. **Mobile-first redesign** — current layout works on mobile but isn't optimized.

---

## 6. Development workflow

- **Git** — feature branches → pull requests → main. Branches like `auth-ui`, `homepage`, `database`, `daily-summary`, `implement-search` reflect the tutorial cadence; downstream work lived on `implement-search` then merged.
- **TypeScript strict mode** — no `any` in any new code (verified by grep in step 9 of Option B).
- **ESLint** — `eslint-config-next` defaults.
- **Manual testing** — dev server (`npm run dev`) + Inngest dev UI (`npx inngest-cli@latest dev` → http://localhost:8288) + MongoDB Atlas browser for DB inspection.
- **Logging** — every decision and design note went into [`PFA_LOG.md`](../PFA_LOG.md) at the repo root, dated and chronological. ~25 entries by the end of the build.
