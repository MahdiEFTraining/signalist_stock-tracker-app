# Presentation Plan

Slide-by-slide outline for the PFA defense. Optimized for a **15-minute presentation + 10-minute Q&A**, ~18 slides.

Each slide entry contains:
- **Title** — what's on the slide.
- **Show** — what's visible (text, diagram, screenshot).
- **Say** — the talking points (1–3 bullets you say out loud).
- **Source** — which doc to copy content/diagrams from.

End of doc has the **demo script** (~5-7 min) and **anticipated Q&A**.

---

## Slide deck outline (~18 slides)

### Slide 1 — Title

- **Show:** Project name **WealthFlow**, your name, supervisor's name, school + program, defense date.
- **Say:** "Good morning. I'm presenting WealthFlow, an AI-augmented stock research and paper trading platform built over the past few months."

---

### Slide 2 — Agenda

- **Show:** 5 bullets — Problem · Approach · Architecture · Live demo · Limitations & next steps.
- **Say:** Read it. ~15 seconds.

---

### Slide 3 — The problem

- **Show:** 3 short rows.
  - *Real brokers* (Robinhood, eToro, …) → real money, scary for beginners.
  - *Data sites* (Yahoo Finance, Bloomberg) → information without practice or AI assistance.
  - *Tutorials* → static, no live data, no learning loop.
- **Say:** "There's a gap between *learning about markets* and *risking real money*. Beginners need a low-stakes environment that combines real market data with AI guidance and immediate feedback."

---

### Slide 4 — WealthFlow: the pitch

- **Show:** One line — *Paper-trade real markets with $100k of virtual cash, with an AI that explains what's happening and watches the news for you.*
- **Show below:** small icons / labels for the four pillars (next slide).
- **Say:** "WealthFlow combines three things that usually live in three different products: a brokerage simulator, a research terminal, and an AI assistant."

---

### Slide 5 — Feature overview (the four pillars)

- **Show:** 2×2 grid of pillars with bullet features under each:
  1. **Markets & research** — live quotes, TradingView charts, search, watchlist, daily AI news email.
  2. **Paper trading** — $100k virtual cash, atomic trades, equity curve, sector allocation, leaderboard.
  3. **AI investment assistant** — per-stock chatbot, news sentiment timeline, sentiment alerts, weekly AI recap.
  4. **Auth & alerts** — sign-up with investment profile, password reset, hourly price + sentiment alert checks.
- **Say:** "These four pillars are what the user touches. Behind them is a single Next.js application with seven background jobs running on Inngest."
- **Source:** `README.md` § *What it does*.

---

### Slide 6 — Tech stack

- **Show:** layered diagram — Frontend (Next.js 16, React 19, Tailwind, shadcn, Recharts) · Backend (Server Actions, Route Handlers) · Auth (better-auth) · Data (MongoDB Atlas + Mongoose) · Background (Inngest) · AI (Google Gemini, two paths) · External (Finnhub, TradingView, Gmail).
- **Say:** "Modern Next.js app — server-first with React Server Components and Server Actions. MongoDB Atlas for storage. Inngest for cron and durable AI workflows. Google Gemini for AI."
- **Source:** `README.md` § *Tech stack*.

---

### Slide 7 — Architecture (system diagram)

- **Show:** the `flowchart TD` from `ARCHITECTURE.md` § 1, screenshotted from a Mermaid renderer (e.g. <https://mermaid.live>).
- **Say:** Walk it left-to-right: "Client only renders. Next.js does the work — pages, server actions, middleware. Inngest hosts background jobs. MongoDB is our state. Gemini and Finnhub are our two main external dependencies."
- **Source:** `docs/ARCHITECTURE.md` § 1.

---

### Slide 8 — Data model (ER diagram)

- **Show:** the `erDiagram` from `ARCHITECTURE.md` § 4.
- **Say:** "Seven collections. Five are per-user. `NewsSentiment` is shared globally — sentiment for AAPL is the same whether you watch it or I do, so we score each article once. `PortfolioSnapshot` powers the equity curve."
- **Highlight (optional callout):** the unique compound indexes that enforce idempotency for the daily crons.
- **Source:** `docs/ARCHITECTURE.md` § 4.

---

### Slide 9 — Pipeline #1: Trade execution (atomic)

- **Show:** the trade-execution sequence diagram from `PIPELINES.md` § 1.
- **Say:** "When the user clicks Buy, we run three writes in a single MongoDB transaction — debit cash, upsert the holding with weighted-average cost basis, insert a transaction row. All-or-nothing. A crash mid-flight can't lose money. This is why MongoDB Atlas matters — its replica set is what makes transactions possible."
- **Source:** `docs/PIPELINES.md` § 1.

---

### Slide 10 — Pipeline #2: News sentiment (daily AI cron)

- **Show:** sequence diagram from `PIPELINES.md` § 2.
- **Say:** "Daily at 13:00 UTC, Inngest collects every symbol anyone is watching or holding, deduplicates, fetches news from Finnhub, and asks Gemini to score each article on a -1 to +1 scale. We use Gemini's `responseSchema` for guaranteed JSON output. Idempotency is layered twice — pre-check existing IDs *and* a unique index — so retries are safe."
- **Source:** `docs/PIPELINES.md` § 2.

---

### Slide 11 — Pipeline #3: Weekly AI recap

- **Show:** sequence diagram from `PIPELINES.md` § 3.
- **Say:** "Mondays at 14:00 UTC, every user gets a personalized email. We pull their portfolio's week-over-week change, top 5 watchlist stocks with sentiment, and their stated risk profile. All of that becomes the context for a Gemini prompt — and the prompt forbids inventing numbers or giving buy/sell advice."
- **Source:** `docs/PIPELINES.md` § 3.

---

### Slide 12 — Pipeline #4: Chatbot grounding

- **Show:** sequence diagram from `PIPELINES.md` § 4.
- **Say:** "The per-stock chatbot is a mini-RAG pattern. The user asks a question, we fetch live quote + profile + recent news in parallel, build a grounded system prompt, and call Gemini directly — not via Inngest, because the user is waiting. The system prompt explicitly bans personalized buy/sell recommendations — important regulatory framing."
- **Source:** `docs/PIPELINES.md` § 4.

---

### Slide 13 — DEMO (placeholder slide)

- **Show:** *"Live demo — switch to browser"* + URL (`http://localhost:3000`).
- **Say:** *(see demo script below)*.

> **TIP** — *bring this slide back up briefly between switches if needed for orientation*.

---

### Slide 14 — Originality vs. tutorial baseline

- **Show:** 3-row table.
  - *Tutorial baseline* → auth, watchlist, price alerts, daily news, TradingView widgets.
  - *Paper trading & analytics (mine)* → 4 models, 8 actions, 2 pages, 6 components, daily snapshot cron, leaderboard.
  - *AI investment assistant (mine)* → 1 model, ~8 actions, 3 Inngest jobs, chatbot, sentiment timeline, sentiment alerts, weekly recap.
- **Say:** "I want to be transparent up front: this project started from a public tutorial that gave me the auth + watchlist + alerts skeleton. Everything in the next two rows — paper trading, portfolio analytics, the AI assistant, the sentiment pipeline — is original work. About 90% of the lines committed are mine."
- **Source:** `docs/METHODOLOGY.md` § 3.

---

### Slide 15 — Tradeoffs we made

- **Show:** 3 bullets.
  - *Cost-basis* → weighted-average, not FIFO tax lots.
  - *Cron throughput* → sequential per symbol — fine up to ~50 symbols.
  - *Sentiment accuracy* → not formally measured (next slide).
- **Say:** "These were conscious cuts. The report has the full list."
- **Source:** `docs/METHODOLOGY.md` § 4.

---

### Slide 16 — Future work

- **Show:** top 4 from `METHODOLOGY.md` § 5.
  1. **Tests** (Jest/Vitest on trade math + sentiment parsing).
  2. **Backtesting & strategy builder** (originally planned).
  3. **Sentiment accuracy study** (labeled validation set, precision/recall).
  4. **Streaming chatbot responses** (SSE).
- **Say:** "If I had another month, this is what I'd add — in this order."
- **Source:** `docs/METHODOLOGY.md` § 5.

---

### Slide 17 — Conclusion

- **Show:** 3 sentences.
  - WealthFlow ships ~3 months of original full-stack work on top of a tutorial baseline.
  - The technical depth is in the **atomic trade engine**, the **AI sentiment pipeline**, and the **two-path Gemini integration**.
  - Documentation is in the repo: `README.md`, `docs/ARCHITECTURE.md`, `docs/PIPELINES.md`, `docs/METHODOLOGY.md`, `PFA_LOG.md`.
- **Say:** Close cleanly. Thank the jury.

---

### Slide 18 — Thank you / Q&A

- **Show:** *Thank you. Questions?* — your contact, repo link.

---

## Demo script (~5–7 minutes)

Practice this 3 times before the defense. Each step has a **what** + **say**.

> **Pre-flight checklist** *(do these before walking on stage)*:
> - `npm run dev` running, port 3000.
> - `npx inngest-cli@latest dev` running, port 8288.
> - Browser logged in, **demo account** loaded with: a portfolio with ≥3 stocks across 2+ sectors, ≥1 watchlist item, the news sentiment cron has been invoked at least once for AAPL/TSLA/JPM, the welcome email was triggered, and the weekly recap was triggered (open the inbox tab in advance).
> - Clear browser console.
> - Zoom to 110% so the back row can read.

### Step 1 — Dashboard (15s)
- **Do:** land on `/`. Briefly point at the TradingView widgets.
- **Say:** "Authenticated user lands here — market overview, heatmap, top stories. All driven by embedded TradingView widgets to save reinventing finance charts."

### Step 2 — Search (15s)
- **Do:** press `Cmd+K`, type `AAPL`, press Enter.
- **Say:** "Search is global — Cmd+K from anywhere. Results come from Finnhub, cached at the action level."

### Step 3 — Stock detail page + chatbot (~75s) ⭐ key demo moment
- **Do:** on `/stocks/AAPL`, scroll the right column to the chat panel. Click the suggestion *"What's been happening recently?"*.
- **Say:** "The chatbot is grounded — it has the live quote, the company profile, and the latest news as context. Notice it cites sources from the news instead of inventing them. It also won't give buy/sell recommendations — that's enforced in the system prompt."
- **Wait for the answer**, then read the first sentence of the response out loud.

### Step 4 — News sentiment chart (~30s) ⭐ key demo moment
- **Do:** scroll the left column to the bottom. Point at the sentiment timeline + the colored badge.
- **Say:** "Each bar is one day's news. Green is positive, red negative, gray neutral. The badge in the corner is the rolling 7-day average — that's also what triggers sentiment alerts. All scored by Gemini and cached in MongoDB."

### Step 5 — Trade execution (~45s) ⭐ key demo moment
- **Do:** click the yellow **Trade** button. In the modal: side = Buy, quantity = `5`, click **Buy 5 AAPL**.
- **Say:** "Live price preview, validation against my cash, and on submit it runs as a single MongoDB transaction. If anything in the chain fails, nothing commits — important even for paper trading."
- **Wait for toast**, then close modal.

### Step 6 — Portfolio dashboard (~75s) ⭐ key demo moment
- **Do:** navigate to **Portfolio** in the nav. Point at:
  - Summary cards (Total Value, Cash, Holdings, Today's P&L).
  - Equity curve (should show your historical snapshots + today's live value).
  - Sector allocation donut.
  - Holdings table — point at the Sell button.
  - Recent transactions table.
- **Say:** "Equity curve is fed by a daily Inngest snapshot job that runs after US market close. The sector breakdown comes from Finnhub's industry tag, cached for 24 hours. Every row in the holdings table has a Sell button that reuses the same TradeModal."

### Step 7 — Sentiment alert (~30s)
- **Do:** go to the watchlist or any stock. Open Add Alert. Switch the toggle to **Sentiment**. Set threshold to `0.5` upper. Save.
- **Say:** "Alerts work for both price *and* AI sentiment. Hourly Inngest cron checks both."

### Step 8 — Leaderboard (~20s)
- **Do:** click **Leaderboard** in the nav. Point at the trophy + your "You" pill.
- **Say:** "Multi-user leaderboard ranks by all-time return percent. Yours obviously shows up highlighted."

### Step 9 — Email proof (~30s)
- **Do:** switch to your email tab (pre-opened). Show the **welcome email** + **weekly recap email**.
- **Say:** "Welcome email is AI-personalized off the sign-up profile. Weekly recap is the same idea but recurring — it pulls portfolio + watchlist + sentiment context and asks Gemini to write commentary tied to the user's risk profile."

### Step 10 — Inngest dashboard (optional, ~30s)
- **Do:** open `http://localhost:8288`. Show the seven registered functions and a recent run trace.
- **Say:** "All background work is here. Each step is observable, idempotent, and retried on failure."

**Total: ~5-7 min depending on pace.** Cut step 10 if running long.

---

## Anticipated jury Q&A

Practice the answer for each. **The first one is the most likely.**

### Q1. "Isn't this just the JavaScript Mastery Signalist tutorial?"
**A.** "Yes — the auth, watchlist, daily-news email, and the TradingView widget integration came from that tutorial. I credit it openly in the README. Everything beyond that is original: the entire paper-trading and portfolio-analytics track — four database models, the atomic trade engine, the equity curve, sector allocation, leaderboard — and the entire AI investment assistant — the per-stock chatbot, the daily news-sentiment pipeline with Gemini structured output, sentiment-based alerts, and the weekly AI recap email. About 90% of the committed lines are mine, and `PFA_LOG.md` documents every decision chronologically."

### Q2. "How do you guarantee a trade is atomic?"
**A.** "MongoDB transactions. The `executeTrade` server action wraps three writes — cash debit, holding upsert with weighted-average cost basis, transaction row insert — in a single `withTransaction` block. Atlas runs as a replica set by default, which is the prerequisite. If any of the three fails, nothing commits — no money is silently lost."

### Q3. "Why MongoDB and not PostgreSQL?"
**A.** "Two reasons. First, the schema evolved a lot during the build — adding `alertCategory`, `realizedPnL`, snapshots — and Mongoose's schema-on-write made that fast. Second, Atlas's free tier is a replica set, which gives me transactions for the trade engine. With Postgres I would have had similar correctness guarantees but slower iteration on schema. For a real product, either would work."

### Q4. "How do you score sentiment? How accurate is it?"
**A.** "Each article goes to Gemini with a structured-output schema demanding `{ articleId, sentiment in [-1, 1], label, confidence }`. Threshold is ±0.2 — outside that, label flips to positive or negative. Accuracy is **not** formally measured — that would need a labeled validation set of a few hundred articles, which is in my future-work section. Anecdotally, spot-checks on AAPL and TSLA looked sensible."

### Q5. "What if Gemini is rate-limited or down?"
**A.** "All AI features degrade gracefully. The chatbot surfaces an inline error in the panel. The sentiment cron logs the failure per symbol and continues. The weekly recap skips users whose AI step failed. None of these crash the app — only the AI feature is unavailable until the API recovers."

### Q6. "Why two AI integration paths?"
**A.** "Different SLAs. The chatbot is request-scoped — the user is staring at a spinner, latency matters more than retries. So it uses a direct REST helper at `lib/ai/gemini.ts`. The cron jobs — sentiment scoring, weekly recap — are background work where durability matters more than latency. So they use Inngest's `step.ai.gemini`, which gives me retries, idempotent steps, and a trace of every call. One pattern wouldn't fit both."

### Q7. "How would you scale this to 10,000 users?"
**A.** "Three things. First, the cross-user symbol dedupe in every cron means external API cost stays sub-linear. Second, I'd add a Redis-backed cache for hot reads — leaderboard especially. Third, the Inngest jobs already run in isolated steps, so they parallelize across machines without code changes. The bottleneck would be Finnhub's free tier — I'd upgrade that or move to a streaming WebSocket connection."

### Q8. "Why didn't you write tests?"
**A.** "Honest answer — time. The build was front-loaded on features. I'd start with three things if I had another day: cost-basis math in `executeTrade` (weighted-avg + realized P&L on partial sells), `scoreArticles` parsing the Gemini JSON, and the sentiment threshold logic in `checkSentimentAlerts`. Those three cover the highest-risk surfaces."

### Q9. "Security?"
**A.** "Better-auth handles password hashing and session cookies — I didn't roll my own. All secrets are in `.env`, never committed. Middleware gates every protected route. Server actions check authentication before doing anything. There's no SQL so no injection surface. The chatbot prompt is constrained to one ticker and refuses to give buy/sell advice — which is regulatory hygiene as much as security."

### Q10. "What was the hardest part?"
**A.** "Two things. First, getting the MongoDB transaction working correctly inside a server action — Mongoose's session API has gotchas around `.create([...], { session })` vs `.create({...})`. Second, designing the sentiment pipeline to be idempotent — I learned the hard way that Inngest's automatic retries mean every step needs to handle being called twice. Hence the layered idempotency: pre-check existing IDs, plus a unique index, plus `insertMany({ ordered: false })`."

---

## Slide-build tips

- **Mermaid diagrams** — render at <https://mermaid.live>, screenshot, paste into PowerPoint. The white background is fine; if you need transparent, render with `theme: dark` and screenshot, then drop into a dark slide.
- **Code snippets** — only include if you can read them from the back row. Usually a sentence describing what the code does is better than the code itself. Exception: the `executeTrade` transaction block is *worth* showing — it's the most distinctive ~20 lines in the project.
- **Colors** — match the WealthFlow yellow (`#FDD458`) for accent — looks branded and ties slides to the live demo.
- **Demo first, slides second** — if you're tight on time, skip slides 14-17 and let the demo + Q&A close it. The jury remembers the demo more than the slides.

---

## Pre-defense checklist (the day before)

- [ ] All `npm run dev` + `npx inngest-cli dev` startup steps verified.
- [ ] Demo account: portfolio populated, watchlist populated, sentiment cron run for at least 3 symbols, welcome + weekly recap emails sent and visible in inbox.
- [ ] Mermaid diagrams exported and pasted into the deck.
- [ ] Two screenshots: `/portfolio` (full page) and `/stocks/AAPL` showing the chat panel mid-conversation.
- [ ] Practice the demo script end-to-end, timed.
- [ ] Print a paper backup of the demo script (in case the laptop slips).
- [ ] Test the projector resolution if you can get into the room.
- [ ] Coffee. ☕
