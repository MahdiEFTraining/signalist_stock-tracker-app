# PFA Project Log — WealthFlow

Running log of decisions, plans, and progress as we evolve this project from a tutorial-derived stocks app into an original, PFA-worthy submission. Updated every turn.

---

## 2026-05-10 — Session 1

### Initial assessment
Project (Next.js 16 + MongoDB + better-auth + Inngest + Finnhub + Gemini + Nodemailer) was reviewed for PFA suitability.

**Verdict:** Technically PFA-grade in scope (full-stack, multiple integrations, background jobs, AI), **but** tracks closely to the JSM "Signalist" tutorial — git log reads like tutorial steps and a `signalist_watchlist_dashboard.html` artifact exists in `/screenshots/`. Two gaps to address before submission:
1. **Originality** — needs features beyond the tutorial.
2. **Academic deliverables** — no README/architecture doc/UML/methodology.

### Three originality directions proposed
- **Option A — Paper Trading & Portfolio Analytics:** virtual portfolio, transactions ledger, P&L, equity curve, sector allocation, leaderboard.
- **Option B — AI Investment Assistant:** Gemini-powered Q&A chatbot grounded in stock data, news sentiment pipeline, sentiment-shift smart alerts, weekly AI recap email.
- **Option C — Backtesting & Strategy Builder:** indicator-based strategy UI, historical data pipeline, backtest engine (return %, max drawdown, Sharpe), equity curve vs. buy-and-hold.

### Decision
**Build all three.** Start with **Option A**.

### Option A — implementation plan (locked in)

**New Mongoose models** (`DATABASE/models/`):
- `portfolio.model.ts` — one per user. `userId` (unique), `cashBalance`, `initialCash` ($100k), `currency`.
- `transaction.model.ts` — immutable trade ledger. `userId`, `symbol`, `company`, `side` (buy/sell), `quantity`, `price`, `totalValue`, `executedAt`. Compound index `(userId, executedAt desc)`.
- `holding.model.ts` — derived current positions. `userId`, `symbol`, `company`, `quantity`, `avgCostBasis`, `realizedPnL`, `updatedAt`. Unique `(userId, symbol)`.
- `portfolio-snapshot.model.ts` — daily equity-curve points. `userId`, `date` (YYYY-MM-DD), `totalValue`, `cashBalance`, `holdingsValue`. Unique `(userId, date)`.

**New server actions** (`lib/actions/portfolio.actions.ts`):
- `getOrCreatePortfolio()` — auto-init with $100k cash on first access.
- `executeTrade({ symbol, company, side, quantity })` — fetches live quote, validates, atomically writes Transaction + updates Holding + updates Portfolio cash.
- `getHoldingsWithLivePrices()` — joins holdings with live Finnhub quotes for unrealized P&L.
- `getPortfolioSummary()` — total value, today's P&L, all-time return %, sector allocation.
- `getTransactionHistory(limit?)`.
- `getEquityCurve(days)` — reads `PortfolioSnapshot`.
- `getLeaderboard(limit)` — top users by % return.

**New Inngest job** (`lib/inngest/functions.ts`):
- `recordPortfolioSnapshots` — daily cron `0 22 * * *` (after US market close); idempotent upsert keyed on `(userId, date)`.

**New UI:**
- `app/(root)/portfolio/page.tsx` — summary cards, equity curve, holdings table (with sell), sector allocation pie, recent transactions.
- `app/(root)/leaderboard/page.tsx` — users ranked by return %.
- `components/TradeModal.tsx` — buy/sell modal, wired into stock detail page and Holdings table.
- `components/NavItems.tsx` — add "Portfolio" + "Leaderboard" links.

**Types** (`types/global.d.ts`): `Portfolio`, `Transaction`, `Holding`, `PortfolioSnapshot`, `PortfolioSummary`, `LeaderboardEntry`, `TradeData`.

**Build order:**
1. Models + types
2. `getOrCreatePortfolio` + `executeTrade` (core logic)
3. `TradeModal` + wire into stock page
4. Holdings table + summary cards on `/portfolio`
5. Transactions history table
6. Inngest snapshot job + equity curve chart
7. Sector allocation pie chart
8. Leaderboard page
9. Nav update + polish

### Open decisions (pending user)
- **Charting library:** recommended **Recharts** (~100KB, React-native, simple API). Alternatives: TradingView's `lightweight-charts`, or roll our own SVG.
- **Starting cash:** proposed **$100,000**. Confirm or override.

### Workflow
- This file (`PFA_LOG.md`) is the running project log. Updated every turn going forward.

---

## 2026-05-10 — Session 1, turn 4

### Decisions confirmed
- **Charting library:** Recharts.
- **Starting cash:** $100,000 USD.

### Step 1 complete — Models + types

**Files created:**
- `DATABASE/models/portfolio.model.ts` — `PortfolioModel` (one per user, unique `userId`, `cashBalance` default 100000, `initialCash`, `currency` default 'USD').
- `DATABASE/models/transaction.model.ts` — `TransactionModel` (immutable trade ledger). Indexes: `userId` + compound `(userId, executedAt desc)`.
- `DATABASE/models/holding.model.ts` — `HoldingModel` (current positions). Unique compound index `(userId, symbol)`. Tracks `quantity`, `avgCostBasis`, `realizedPnL`.
- `DATABASE/models/portfolio-snapshot.model.ts` — `PortfolioSnapshotModel` (daily equity-curve points). `date` stored as `YYYY-MM-DD` string for idempotent upserts. Unique `(userId, date)` + sort index `(userId, date desc)`.

**File updated:**
- `types/global.d.ts` — added `Portfolio`, `Transaction`, `Holding`, `HoldingWithLivePrice`, `PortfolioSnapshot`, `PortfolioSummary`, `SectorAllocation`, `LeaderboardEntry`, `TradeData`, `TradeResult`, `TradeModalProps`.

### Design notes
- All models follow the existing project pattern (capitalized `DATABASE/` folder, `models?.X || model<X>(...)` HMR-safe registration, lowercase singular collection names).
- `HoldingWithLivePrice` extends the persisted `Holding` shape with computed fields (`currentPrice`, `marketValue`, `unrealizedPnL`, `unrealizedPnLPercent`, optional `sector`) — this lets server actions return enriched data without polluting the DB schema.
- Snapshot `date` deliberately a `YYYY-MM-DD` string (not `Date`) so the daily Inngest cron is naturally idempotent via unique upserts.

### Next
Step 2 — `getOrCreatePortfolio()` and `executeTrade()` server actions in `lib/actions/portfolio.actions.ts`.

---

## 2026-05-10 — Session 1, turn 5

### Step 2 complete — Core portfolio server actions

**File created:** `lib/actions/portfolio.actions.ts`

**`getOrCreatePortfolio()`:**
- Returns existing `Portfolio` for the authenticated user, or creates one with $100,000 starting cash.
- Uses `.lean()` for the read path, full Mongoose doc only when creating.

**`executeTrade(data: TradeData)`:**
- Auth check, then validates: positive integer quantity, symbol/company present.
- Fetches live price via existing `getStockQuote()` (Finnhub).
- Wraps the multi-collection write in a **MongoDB transaction** (`mongoose.startSession()` + `session.withTransaction()`) so cash, holding, and ledger updates either all succeed or all roll back.
- **Buy logic:**
  - Insufficient cash → throws (transaction aborts, error returned).
  - New holding → insert with `avgCostBasis = price`.
  - Existing holding (qty > 0) → weighted-avg cost basis: `(oldQty * oldCost + newQty * price) / totalQty`.
  - Existing holding (qty == 0, re-buy after sell-out) → reset cost basis to current price; `realizedPnL` from prior trades preserved.
- **Sell logic:**
  - Insufficient shares → throws.
  - `realizedPnL += (price - avgCostBasis) * quantity`.
  - `avgCostBasis` deliberately unchanged on sells (only buys move it; standard weighted-avg accounting).
  - Holding row kept on `quantity == 0` so realized P&L history isn't lost; UI will filter `quantity > 0`.
- Always inserts a `Transaction` row for the audit ledger.
- `revalidatePath('/portfolio')` and `revalidatePath('/stocks/[symbol]')` after a successful trade.

### Design notes
- **Atomicity:** chose MongoDB transactions over a "best-effort + cleanup" approach. Atlas (which this project uses) supports them by default. Without a transaction, a crash between deducting cash and writing the holding could silently lose money — unacceptable even for paper trading from a code-quality standpoint.
- **Cost basis accounting:** went with **weighted average** rather than FIFO lots. Simpler model, sufficient for the academic narrative. FIFO would require a separate `tax_lots` collection.
- **Whole-share quantities only.** Real brokers offer fractional shares; we don't, to keep the math clean for the report.
- **Race condition note:** two concurrent buys reading the same `cashBalance` could theoretically both pass the check before either deducts. The transaction provides snapshot isolation but not write-write conflict detection at app level — Atlas will retry/abort on document conflict, which is acceptable here.

### Testing — your turn
Nothing testable in the UI yet (TradeModal lands in step 3). Two ways to verify now:

**Option 1 — Direct DB inspection (recommended):**
1. Run `npm run dev`.
2. Sign in to the app to ensure a user session exists.
3. Open MongoDB Compass / Atlas UI and watch the database. After step 3 lands, you'll see `portfolios`, `transactions`, `holdings` collections populate as you trade.

**Option 2 — Quick sanity script (optional, if you want to test now):**
- I can add `scripts/test-portfolio.mjs` next to your existing `scripts/test-db.mjs` that imports the actions and runs a buy → buy → sell → over-sell sequence, printing results and asserting cash math.
- Says yes if you want this; otherwise we move to step 3 and test through the UI there.

**Critical environment check:**
- `executeTrade` uses MongoDB transactions, which require a **replica set**. Atlas clusters are replica sets by default, so you're fine. If you ever switch to a local standalone `mongod`, transactions will throw `Transaction numbers are only allowed on a replica set member or mongos`.

### Next
Step 3 — `components/TradeModal.tsx` + wire into `app/(root)/stocks/[symbol]/page.tsx`. After step 3, you'll be able to test the full buy/sell flow through the UI.

---

## 2026-05-10 — Session 1, turn 6

### Step 3 complete — Trade UI wired into stock page

**Files created:**
- `components/TradeModal.tsx` — controlled dialog (open/setOpen as props), built around the existing `Dialog` shadcn primitive and the project's `alert-dialog` / `form-input` CSS classes for visual consistency with `AlertModal`.
- `components/TradeStockButton.tsx` — small client wrapper that owns its own open state and renders a yellow "Trade" button. Used on the stock page (server component → client trigger pattern).

**File updated:**
- `lib/actions/portfolio.actions.ts` — added `getTradeContext(symbol)` returning `{ cashBalance, sharesOwned, avgCostBasis, livePrice }` in one round trip (parallel `Promise.all` over portfolio + holding + Finnhub quote). Used by the modal on open to populate live context.
- `app/(root)/stocks/[symbol]/page.tsx` — imported `TradeStockButton`, placed it next to `WatchlistButton` in a 2-column grid in the right-hand column.
- `types/global.d.ts` — `TradeModalProps` already added in step 1, no change.

### TradeModal UX
- Buy / Sell segmented toggle (green / red).
- Live price card (with spinner while `getTradeContext` resolves).
- Quantity input (whole shares only, mirrors server-side validation).
- Live "Total cost" / "Proceeds" preview.
- Account context cards: cash balance + shares owned (with avg cost and unrealized P&L if held).
- Inline validation: insufficient cash / insufficient shares / invalid quantity.
- Submit button disabled until valid; toast on success/failure; `router.refresh()` after success.

### Testing — your turn (now actually possible)

Start dev server and verify the full flow:

1. `npm run dev`, sign in.
2. Navigate to any stock (e.g. `/stocks/AAPL`).
3. **Open Trade modal:** click the yellow "Trade" button in the right column. Live price should appear within ~1s. Cash should show `$100,000.00`, shares owned `0`.
4. **First buy:** Enter quantity `5`, click "Buy 5 AAPL". Toast confirms. Open Atlas → check `portfolios` (cash decreased), `holdings` (qty=5, avgCostBasis=executed price), `transactions` (1 row, side=buy).
5. **Second buy (cost-basis blend):** Open modal again, buy `5` more. Holding qty should be `10`, avgCostBasis should be the weighted average of the two executed prices. Modal should now show "shares owned: 10" with a live unrealized P&L line.
6. **Sell:** Toggle to Sell, enter `3`, click "Sell 3 AAPL". Cash up, holding qty=7, transactions has a sell row, holding's `realizedPnL` updated to `(sellPrice - avgCostBasis) * 3`.
7. **Validation paths to confirm:**
   - Try buying with quantity `999999` → modal shows `Need $X, have $Y` and disables submit.
   - Try selling more shares than you own → modal shows `Trying to sell N, own M`.
   - Try quantity `1.5` or `0` → modal shows "Enter a positive whole number".
   - Try quantity `-3` → same message.

If the live price ever shows "unavailable", that's a Finnhub rate-limit / API-key issue (60 req/min on free tier), not a bug in the trade logic — wait a minute and retry.

### Next
Step 4 — `app/(root)/portfolio/page.tsx` with summary cards + holdings table (sell button per row reuses TradeModal in `defaultSide="sell"` mode).

---

## 2026-05-10 — Session 1, turn 8

### Step 4 complete — `/portfolio` dashboard

**Files created:**
- `app/(root)/portfolio/page.tsx` — server component, single `getPortfolioPageData()` call, renders header + summary cards + holdings table.
- `components/PortfolioSummaryCards.tsx` — server-renderable 4-card grid: Total Value, Cash, Holdings, Today's P&L. All-time return rendered in the Total Value card sub-line; today's % in the P&L card.
- `components/HoldingsTable.tsx` — client component (needs state for the per-row Sell modal). Shadcn `Table` primitive. Empty state with link to `/`. Each row links to `/stocks/[symbol]`. Sell button opens `TradeModal` with `defaultSide="sell"`.

**File updated:**
- `lib/actions/portfolio.actions.ts` — added two actions:
  - `getHoldingsWithLivePrices()` — standalone version, will be reused by leaderboard / sector chart later.
  - `getPortfolioPageData()` — composed in one pass: fetches portfolio + holdings + Finnhub quotes in parallel, computes summary (totalValue, totalReturn %, todayPnL, todayPnL %), returns sorted holdings + summary together. Avoids the duplicate Finnhub round-trip you'd get if the page called both actions separately.
- `types/global.d.ts` — extended `QuoteData` with `d` (today's price change) and `pc` (previous close), needed for Today's P&L math.

### Design notes
- **Today's P&L formula:** `Σ(quantity × dayChange)` per holding, where `dayChange` is Finnhub's `d` field (today's change vs. previous close). Cash isn't affected by today, so the % is taken against `totalValue - todayPnL` (yesterday's portfolio value). This works even before the snapshot job lands in step 6 — derives entirely from live quotes.
- **Sort order:** holdings sorted by `marketValue desc` so biggest positions surface first.
- **Empty state:** when no holdings, table swaps for a CTA pointing back to the home/search page.
- **Sell modal reuse:** rather than building a second sell-specific modal, the Sell button renders `TradeModal` with `defaultSide="sell"` — same component, same validation, same atomic transaction path.
- **Rate-limit caveat:** each portfolio page load fires N Finnhub `/quote` calls (one per holding). Free tier is 60 req/min. Fine for PFA-scale demo; production would batch or cache server-side.

### Testing — your turn
1. With dev server running, navigate to `http://localhost:3000/portfolio`.
2. **Empty state:** if you've never traded, you should see the "No positions yet" panel with a Browse stocks link. Summary cards should show Total $100k, Cash $100k, Holdings $0.
3. **After trading:** go buy a few stocks via `/stocks/AAPL` etc. Refresh `/portfolio`.
   - Summary cards should reflect the math (total = cash + holdings; all-time return = total - $100k).
   - Holdings table should list each position with avg cost, live price, market value, unrealized P&L (colored green/red), and a Sell button.
   - Symbol cells link back to the stock detail page.
4. **Sell from the table:** click "Sell" on any row → TradeModal opens pre-set to Sell side for that symbol → execute → page refreshes with updated row (or row disappears if you sold the entire position).
5. **Today's P&L:** depends on whether the market is open and `d` is non-zero. If markets are closed, it'll likely show 0.00 — that's expected, not a bug.

There's no nav link to `/portfolio` yet (that's step 9). For now type the URL or bookmark it.

### Next
Step 5 — transactions history table on the portfolio page. Adds `getTransactionHistory()` action and a small table below holdings. Quick step.

---

## 2026-05-10 — Session 1, turn 9

### Step 5 complete — Transactions history

**File created:**
- `components/TransactionsTable.tsx` — server-renderable table. Columns: Date, Side (colored Buy/Sell badge), Symbol (links to stock page), Qty, Price, Total. Empty state message when no transactions.

**Files updated:**
- `lib/actions/portfolio.actions.ts` — added `getTransactionHistory(limit = 25)` returning newest-first transactions for the authenticated user.
- `app/(root)/portfolio/page.tsx` — fetches `getPortfolioPageData()` + `getTransactionHistory(25)` in parallel `Promise.all`; renders new "Recent Transactions" section below the holdings table.

### Design notes
- Default limit 25 — enough to feel substantive without scrolling forever. Pagination not added; can be slotted in later if needed.
- Component is intentionally a server component (no client-only hooks needed). Reuses the same shadcn `Table` primitive as `HoldingsTable` for visual consistency.
- Side rendered as a small pill badge (green for buy, red for sell) — fast to scan.
- Date format: `Jan 15, 2026, 2:34 PM` — dropdown precision (minute level) helps distinguish multiple trades made in the same session.

### Testing — your turn
1. Reload `/portfolio`.
2. Below the holdings table, the "Recent Transactions" section should list every buy/sell you've executed, newest first.
3. Each row shows the executed price (frozen at trade time) — distinct from the *current* price column in the holdings table. That's the audit trail working.
4. Clicking a symbol in any row should navigate to `/stocks/[symbol]`.
5. Empty state: if you nuke your transactions in Atlas, the section should swap for the "No trades yet" message.

### Next
Step 6 — Inngest snapshot job (daily cron) + equity curve chart on `/portfolio`. This requires installing **Recharts** (~100KB).

---

## 2026-05-10 — Session 1, turn 10

### Step 6 complete — Snapshot cron + equity curve chart

**Dependency added:**
- `recharts` (charting library, ~100KB).

**Files created:**
- `components/EquityCurveChart.tsx` — client component, Recharts `AreaChart` with gradient fill (green if up, red if down). Displays last N days of snapshots plus today's live value as the right edge. Custom dark-theme tooltip + axes.

**Files updated:**
- `lib/actions/portfolio.actions.ts`:
  - `getEquityCurve(days = 30)` — fetches snapshots for the authenticated user where `date >= today - days`, sorted ascending.
  - `snapshotAllPortfolios()` — non-auth helper called by Inngest. Iterates all portfolios, dedupes symbols across users, fetches each Finnhub quote once, computes `totalValue` per portfolio, upserts `PortfolioSnapshot` keyed on `(userId, today's UTC date)`. Returns `{ snapshotted, skipped }`.
- `lib/inngest/functions.ts` — registered `recordPortfolioSnapshots` Inngest function:
  - `id: 'record-portfolio-snapshots'`
  - Triggers: cron `0 22 * * *` (22:00 UTC, ~1h after US market close) and manual event `app/record.portfolio.snapshots`.
  - Single `step.run('snapshot-all-portfolios', …)` step.
- `app/api/inngest/route.ts` — added `recordPortfolioSnapshots` to the `serve()` functions array so Inngest can discover it.
- `app/(root)/portfolio/page.tsx` — fetches `getEquityCurve(30)` + `getOrCreatePortfolio()` in parallel with the existing data, renders `EquityCurveChart` between the summary cards and the holdings table.

### Design notes
- **Cron timing:** 22:00 UTC chosen deliberately — US market closes 21:00 UTC (4 PM ET, ignoring DST). 1h buffer lets after-hours volatility settle and avoids racing with the closing-bell quote update on Finnhub.
- **Idempotency:** `(userId, date)` is a unique compound index on the snapshot collection. The cron uses `updateOne(..., { upsert: true })` so re-running on the same day overwrites cleanly — important if Inngest retries.
- **Cross-user symbol dedupe:** if 50 users all hold AAPL, we hit Finnhub once for AAPL, not 50 times. Big rate-limit win on free tier.
- **Chart "synthetic endpoints":** the chart prepends a baseline point at `portfolio.createdAt` with `initialCash` (so day-0 users see a flat $100k line instead of an empty chart) and appends today's *live* total to the right edge (so the curve always reflects current state, even before today's cron fires). If today's snapshot already exists, we replace it with the live value for max accuracy.
- **Color logic:** stroke + gradient go green when current value ≥ initial cash, red otherwise. Quick visual signal.
- **Y-axis padding:** 10% headroom above/below to avoid the curve hugging the chart edges.

### Testing — your turn

**Chart (immediate):**
1. Reload `/portfolio`. The equity curve should render between summary cards and holdings table.
2. **Day-0 case (no snapshots yet):** chart shows a baseline point at your portfolio creation date and today's live value. Slope reflects all-time return.
3. Hover the curve — tooltip should show date + USD value.
4. Color: green if you're up vs $100k, red if down.

**Cron (manual trigger via Inngest dev UI):**
- Inngest's local dev UI is usually at `http://localhost:8288` once `npx inngest-cli@latest dev` is running alongside `npm run dev`. Sometimes it's auto-launched by the project setup — check.
- In the Inngest UI → Functions tab → `record-portfolio-snapshots` → "Invoke" or send the event `app/record.portfolio.snapshots`.
- After it runs, check the `portfoliosnapshots` collection in Atlas — there should be one doc per portfolio with `date: "2026-05-10"`, `totalValue`, `cashBalance`, `holdingsValue`.
- Re-invoke → no duplicates appear (upsert overwrites the same doc).
- Reload `/portfolio` → today's data point now comes from the snapshot (with live value still overlaid for accuracy).

**Cron (auto):**
- Will fire every day at 22:00 UTC in production once deployed. Locally, only manual triggers work unless you keep the Inngest dev server running 24/7.

### Next
Step 7 — sector allocation pie chart on `/portfolio`. Pulls `finnhubIndustry` from `profile2`, aggregates by sector, renders as a Recharts pie next to the equity curve.

---

## 2026-05-10 — Session 1, turn 11

### Step 7 complete — Sector allocation pie chart

**Files updated:**
- `lib/actions/finnhub.action.ts` — added `getCompanyProfile(symbol)` returning `{ name, finnhubIndustry, logo, exchange }` from Finnhub `profile2`. Cached **24h** (`fetchJSON(url, 86400)`) since sector data is essentially static.
- `lib/actions/portfolio.actions.ts` — `getPortfolioPageData()`:
  - Now also fetches `getCompanyProfile()` in parallel with `getStockQuote()` per holding (single `Promise.all` per row, no extra round trips beyond what was already there).
  - Attaches `sector` to each `HoldingWithLivePrice`.
  - Aggregates a new `sectors: SectorAllocation[]` by summing `marketValue` per `finnhubIndustry`, computing `percent` against `holdingsValue`, and sorting by value desc.
  - Return type extended to `{ summary, holdings, sectors }`.
- `app/(root)/portfolio/page.tsx`:
  - Destructures `sectors` from the data.
  - Equity curve and sector pie now sit side-by-side in a `lg:grid-cols-3` row (curve takes 2/3, pie takes 1/3). Stacks vertically on smaller screens.

**File created:**
- `components/SectorAllocationChart.tsx` — client component, Recharts donut (`PieChart` with `innerRadius=45`). Custom 10-color dark-theme palette. Tooltip shows `$amount (X%)` and the sector name. Below the chart: a compact legend listing each sector with its color swatch and percentage.

### Design notes
- **Why a donut, not a full pie:** the inner radius gives space for visual breathing room and matches modern dashboard conventions. Easier to read at small sizes too.
- **"Other" bucket:** if Finnhub doesn't return `finnhubIndustry` for a holding (rare, but happens for ETFs/crypto/foreign tickers), it lands in "Other" rather than being silently dropped.
- **Profile cache (24h):** sectors don't churn. Caching avoids hammering Finnhub on every page load — important since each holding now triggers two Finnhub calls (quote + profile) per refresh. With caching, only quotes hit the wire repeatedly.
- **No new server actions for sectors:** consciously avoided creating a `getSectorAllocation()` standalone action because it would have re-fetched holdings + quotes (everything already fetched by `getPortfolioPageData`). Keeping it inline gives one round trip per holding total.
- **Legend placement:** beneath the chart rather than to the right — works better in the narrow 1/3 column layout.

### Testing — your turn
1. Reload `/portfolio`. The right column on `lg+` screens should show the sector donut. On smaller screens, it stacks below the equity curve.
2. **With holdings:** pie shows colored slices, hover shows `$value (percent)`, legend below lists sectors with matching color swatches and percentages summing to ~100%.
3. **With no holdings:** placeholder text "Buy stocks to see your sector mix." (the empty state).
4. **Mixed sectors test:** buy AAPL (Technology), JPM (Financial Services), XOM (Energy) → you should see at least 3 distinct slices.
5. **First load may be slow** if cache is cold — Finnhub `profile2` calls happen in parallel with quotes, but it's still N+1 calls. Subsequent loads in the next 24h hit the cache and are fast.

### Next
Step 8 — `/leaderboard` page ranking users by all-time return %. Adds `getLeaderboard()` action and a new page.

---

## 2026-05-10 — Session 1, turn 12

### Hotfix — TypeScript errors in Recharts Tooltip formatters

**Symptom:** `npx tsc --noEmit` reported two errors:
- `components/EquityCurveChart.tsx:113` — formatter typed `value` as `number` but Recharts types it as `ValueType | undefined`.
- `components/SectorAllocationChart.tsx:74` — same issue + tighter typing of `_name` and `item`.

**Root cause:** I had typed the formatter parameters too narrowly. Recharts' `Tooltip.formatter` signature is generic over `ValueType`/`NameType` and allows undefined.

**Fix:**
- `EquityCurveChart.tsx` — dropped the `: number` annotation, coerce inside: `formatter={(value) => [fmtUSDFull(Number(value)), "Total Value"]}`.
- `SectorAllocationChart.tsx` — dropped the parameter annotations, defensively cast `item.payload` to `SectorAllocation | undefined`, fell back to safe defaults if absent. Coerce `value` via `Number()`.

**Verified:** `npx tsc --noEmit` now exits clean (no errors).

---

## 2026-05-10 — Session 1, turn 13

### Polish — Finnhub fetch timeout shortened

**Problem:** When Finnhub is unreachable from the user's network, every fetch waited for the undici default 10s connect timeout. With N holdings on `/portfolio`, that meant up to 10s of dead waiting per page load before falling through to empty data.

**Fix:** `lib/actions/finnhub.action.ts` — added a 5000 ms abort signal to every `fetch` call inside `fetchJSON()`:
- `signal: AbortSignal.timeout(FINNHUB_TIMEOUT_MS)` added to both branches (cached and uncached).
- Wrapped the call in try/catch to convert `TimeoutError` / `AbortError` into a clearer `Finnhub request timed out after 5000ms: <url>` message — easier to grep in logs.

**Effect:** when Finnhub is down/unreachable, page loads now fail-fast in 5s instead of 10s. All existing callers (`searchStocks`, `getNews`, `getStockQuote`, `getCompanyProfile`, `getCompanyLogos`) already wrap in try/catch and degrade gracefully — no other change needed.

**Verified:** typecheck clean.

---

## 2026-05-10 — Session 1, turn 14

### Step 8 complete — `/leaderboard` page

**File created:**
- `app/(root)/leaderboard/page.tsx` — server component. Header + leaderboard table. Trophy/Medal/Award icons for top 3 ranks, numeric badges below. Current user's row highlighted with subtle yellow tint and a "You" pill.

**Files updated:**
- `lib/actions/portfolio.actions.ts` — added `getLeaderboard(limit = 20)`:
  - Iterates every portfolio.
  - Joins to the better-auth `user` collection (raw mongo driver) for display names — same pattern as `getAllAlertsWithUserEmails` in `alert.actions.ts`. Falls back to email-prefix or "Anonymous" if no name.
  - Dedupes symbols across all users → one Finnhub call per unique symbol (same optimization as `snapshotAllPortfolios`).
  - Computes `totalValue`, `totalReturn`, `totalReturnPercent` per portfolio.
  - Sorts by `totalReturnPercent desc`, slices to limit, assigns ranks.
  - Marks the current authenticated user's row with `isCurrentUser: true` (used by the page to highlight).
- `types/global.d.ts` — extended `LeaderboardEntry` with `isCurrentUser?: boolean`.

### Design notes
- **Ranking metric:** % return, not absolute return. Levels the playing field — a user who started yesterday and is +5% beats one who's been at +$2k for months. Standard for trading-game leaderboards.
- **Privacy:** showing display name (or email prefix) feels OK for a paper-trading sandbox. If the project goes public, easy to swap for an opt-in nickname field on the user model — noted for later.
- **Performance:** fetches all portfolios + all holdings in two queries, then deduped quotes. For N users with avg M holdings, it's `2 + uniqueSymbols` Finnhub calls — manageable up to ~100 users on free tier.
- **No caching yet:** each page load recomputes live. Could memoize for ~60s if traffic grows; keeping it real-time for the demo.
- **Top-3 visual treatment:** Trophy (gold), Medal (silver), Award (bronze). Numeric badges from rank 4 onward. Quick visual hierarchy.

### Testing — your turn
1. Navigate to `http://localhost:3000/leaderboard` (no nav link until step 9 — type the URL).
2. With just one user (you), you should see yourself at rank 1 with a Trophy icon, your row highlighted yellow with a "You" pill.
3. **Multi-user test (optional):** sign up a second account in an incognito window, run a few losing trades on it, then reload the leaderboard from your main account. Your rank should reflect your higher % return.
4. **Empty case:** if you nuke the `portfolios` collection in Atlas, the page shows "No portfolios yet — be the first to trade!".
5. **Network failure:** if Finnhub times out for any symbol, that holding's value contributes 0 to its owner's total — they'll appear lower-ranked than reality. Acceptable degradation.

### Next
Step 9 — final step. Add Portfolio + Leaderboard links to `components/NavItems.tsx` and any small polish across the new pages. Then we can ship Option A and move to Option B (AI Investment Assistant).

---

## 2026-05-10 — Session 1, turn 15

### Step 9 complete — Nav links wired

**File updated:**
- `lib/constants.ts` — extended `NAV_ITEMS` with `Portfolio` (`/portfolio`) and `Leaderboard` (`/leaderboard`).

That single change covers both desktop nav (rendered by `NavItems` directly in the header) and mobile nav (rendered by `UserDropdown` which embeds `NavItems` for screens < sm). The `isActive` logic in `NavItems` handles highlighting the active route automatically because it uses `pathname.startsWith(href)`.

**Verified:** `npx tsc --noEmit` clean.

---

## ✅ Option A complete — Paper Trading & Portfolio Analytics

**Recap of what shipped (across 9 steps):**

- **Models (4):** `Portfolio`, `Transaction`, `Holding`, `PortfolioSnapshot` — proper indexes, unique constraints.
- **Server actions (8):** `getOrCreatePortfolio`, `executeTrade` (atomic, MongoDB transactions), `getTradeContext`, `getPortfolioPageData`, `getHoldingsWithLivePrices`, `getEquityCurve`, `getTransactionHistory`, `getLeaderboard`, plus internal `snapshotAllPortfolios`.
- **Pages (2):** `/portfolio` (summary cards + equity curve + sector pie + holdings + transactions), `/leaderboard`.
- **Components (6):** `TradeModal`, `TradeStockButton`, `PortfolioSummaryCards`, `HoldingsTable`, `TransactionsTable`, `EquityCurveChart`, `SectorAllocationChart`.
- **Cron (1):** `recordPortfolioSnapshots` (Inngest, daily 22:00 UTC, idempotent upserts).
- **Deps added (1):** `recharts`.
- **Polish:** Finnhub fetch timeout shortened to 5s with clear error message; nav links wired across desktop + mobile.

**Original feature delta vs. tutorial:** every file above is net-new — the tutorial had watchlist + alerts + daily news; paper trading, P&L, equity curve, sector allocation, leaderboard are all original additions. Solid material for the PFA report's "Original Contributions" section.

**Known limitations to document in the report (transparency, not bugs):**
- Cost basis: weighted-average (not FIFO tax lots).
- Whole-share quantities only (no fractional).
- No dividends, no splits, no corporate actions.
- Today's P&L derived from Finnhub's `d` field — reads $0 when markets are closed.
- Leaderboard recomputes live on each load (no caching) — fine up to ~100 users on free tier.

### Next
**Option B — AI Investment Assistant.** Recap of what's planned:
1. Stock Q&A chatbot per stock page (Gemini, streaming, grounded in profile + news + quote).
2. News sentiment pipeline (Inngest job scoring articles -1..+1, aggregated per symbol, sentiment timeline).
3. Smart alerts on sentiment shifts (extends existing alert system).
4. Personalized weekly recap email (extends existing news email infrastructure).

Want to scope and start it now, or pause to test Option A end-to-end first?

---

## 2026-05-10 — Session 1, turn 16

### Hotfix — log noise + Recharts width warning

**Issue 1: noisy stack traces on Finnhub timeouts.**
With your network intermittently failing to reach Finnhub, every per-symbol fetch failure was logging a full stack trace via `console.error('quote fetch failed for', sym, e)`. The Error object made Next.js dev print the formatted stack with code context, drowning out other logs.

**Fix:** changed all four catch blocks in `lib/actions/portfolio.actions.ts` to one-line `console.warn` with just the symbol and message string:
- In `getPortfolioPageData()`, `getHoldingsWithLivePrices()` (both used `h.symbol`).
- In `getLeaderboard()` and `snapshotAllPortfolios()` (both used `sym`).

Now a timeout produces a single line like `Finnhub quote unavailable for JPM: Finnhub request timed out after 5000ms: ...` — easy to grep, no stack noise.

**Issue 2: Recharts `width(-1) and height(-1)` warning.**
`ResponsiveContainer` was being measured before the grid items had settled their dimensions on first render. Two contributing factors fixed:
- **Grid items lacked `min-w-0`.** CSS grid items default to `min-width: auto` (= `min-content`) which can resist shrinking and confuse Recharts' measurement. Added `min-w-0` to both `lg:col-span-2` and `lg:col-span-1` divs in `app/(root)/portfolio/page.tsx`, and to the chart wrapper divs themselves.
- **`ResponsiveContainer` used `height="100%"`.** Switched to numeric heights (`256` for equity curve, `192` for sector pie). Numeric height eliminates the dependency on parent height being measured before child renders.

**Files updated:**
- `lib/actions/portfolio.actions.ts` — 4 catch blocks downgraded.
- `components/EquityCurveChart.tsx` — wrapper `min-w-0`, ResponsiveContainer `height={256}`.
- `components/SectorAllocationChart.tsx` — wrapper `min-w-0`, ResponsiveContainer `height={192}`.
- `app/(root)/portfolio/page.tsx` — grid items `min-w-0`.

**Note on the underlying network issue:** the Finnhub timeouts themselves are still happening (likely your ISP/Cloudflare path). The page render time of ~5-6s when Finnhub is unreachable is the parallel batch waiting on the slowest timeout. We could add a short-lived in-memory negative cache (don't retry a symbol that timed out within the last N seconds) if the problem persists, but that's an optimization to layer on if needed — not a correctness bug.

---

# Option B — AI Investment Assistant (in progress)

**Plan locked in (4 sub-features, 9 steps):**

1. **Direct Gemini helper** — `lib/ai/gemini.ts`, REST-based, no new deps.
2. **`askStockQuestion` server action** — assembles quote + profile + news context, calls Gemini.
3. **`StockChatPanel` component** — wired into stock page right column.
4. **News sentiment model + types**.
5. **Sentiment scoring + Inngest cron** — `processWatchlistSentiment`, daily.
6. **Sentiment timeline action + Recharts chart** on stock page.
7. **Sentiment alerts** — extend `AlertModel` with `alertCategory`, mirror `checkPriceAlerts` cron.
8. **Weekly AI recap email** — `sendWeeklyRecap` cron, Mondays 14:00 UTC.
9. **Polish + final typecheck**.

**Decisions confirmed:**
- Alert schema: **extend** `AlertModel` (less duplication, same UI surface).
- Chatbot: **awaited** response v1 (no streaming complexity).

---

## 2026-05-10 — Session 1, turn 18

### Step 1 (Option B) complete — Direct Gemini REST helper

**File created:** `lib/ai/gemini.ts`.

**Exports:**
- Type `GeminiHistoryItem = { role: 'user' | 'model'; text: string }`.
- Type `AskGeminiOptions = { prompt, system?, history?, model?, temperature?, maxTokens?, timeoutMs? }`.
- Function `askGemini(opts) → Promise<string>` returning the model's text response.

**Behavior:**
- Posts to `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`.
- Reads `GEMINI_API_KEY` (already set in `.env`, same key Inngest's `step.ai.gemini` uses).
- Default model `gemini-3-flash-preview` (matches existing Inngest jobs for consistency).
- Default temperature 0.7, maxOutputTokens 2048, timeout 30s — all overridable per call.
- Wraps fetch in `AbortSignal.timeout()` and converts timeouts to clear messages: `Gemini request timed out after Xms`.
- Surfaces upstream errors verbatim (truncated to 500 chars to keep logs sane).
- Detects safety/policy blocks via `promptFeedback.blockReason` and throws a descriptive error.
- Detects empty completions (rare) via `finishReason` for easier debugging.

### Design notes
- **Why direct REST, not the official `@google/generative-ai` SDK:** zero new deps, matches the project's existing pattern of using `fetch` directly (Finnhub, Inngest events). Easy to swap for the SDK later if streaming/grounding tools become needed.
- **Why a separate helper from Inngest's `step.ai.gemini`:** Inngest steps are designed for background jobs (retries, idempotent steps, durable state). The chatbot is request-scoped — a user types, expects a response in seconds. Calling `step.ai` from a request handler defeats its purpose and adds latency. We use `step.ai` for the sentiment cron (step 5) where retries matter, and `askGemini` for the chatbot (step 2-3) where direct latency matters.
- **No `'use server'` directive on this file:** it's a utility, not a server action. Server actions that consume it (chat.actions.ts in step 2) keep the directive at their level.
- **Server-only enforcement:** the file is server-only by virtue of `process.env.GEMINI_API_KEY` reads — Next.js will not bundle this into the client. Adding an explicit `import 'server-only'` would be belt-and-suspenders; left out for now to avoid the package dep.

**Verified:** `npx tsc --noEmit` clean.

### Next
Step 2 (Option B) — `lib/actions/chat.actions.ts` with `askStockQuestion({ symbol, question, history })` that fetches live context (quote + profile + news) and calls `askGemini` with a grounded prompt.

---

## 2026-05-10 — Session 1, turn 19

### Step 2 (Option B) complete — `askStockQuestion` server action

**File created:** `lib/actions/chat.actions.ts`

**Public API:** `askStockQuestion({ symbol, question, history? })` returning `AskStockQuestionResult` (`{ success, answer?, error? }`). Both types added to `types/global.d.ts` along with `ChatMessage` (`{ role: 'user' | 'model'; text: string }`).

**Behavior:**
1. Auth check (`getCurrentUserId`).
2. Validation: trims/uppercases symbol, trims question, rejects empty or > 1000 chars.
3. Sanitises history: caps at 20 turns, truncates each text to 4000 chars (prevents prompt bloat from a misbehaving client).
4. Fetches **live context in parallel** via `Promise.allSettled([getStockQuote, getCompanyProfile, getNews([symbol])])` — a single Finnhub timeout doesn't block the answer; we just send less context.
5. Builds a grounded system prompt via `buildSystemPrompt()` containing:
   - Symbol, company name, industry.
   - Current price + today's change (USD + %), previous close.
   - Top 5 news articles (date, source, headline, 220-char summary).
   - **Behavior rules:** stay on-topic, be concise, ground claims in context, **no personalized buy/sell/hold recommendations** (regulatory CYA).
6. Calls `askGemini` with `temperature: 0.4` (research-y, not creative), `maxTokens: 1024`, 25s timeout.
7. Returns `{ success, answer }` or `{ success: false, error }`.

### Design notes
- **`allSettled`, not `all`:** if Finnhub is unreachable for the quote but news works, the user still gets a useful (if less precise) answer. Total robustness > all-or-nothing context.
- **No streaming:** confirmed in plan. Simpler client too — just `useTransition` + a single fetch.
- **Temperature 0.4:** lower than the 0.7 default. The chatbot is doing research-grounded Q&A, not creative writing — we want it to stick close to the context.
- **History role uses `'model'` (not `'assistant'`):** matches Gemini's API convention and the existing Inngest `step.ai.gemini` calls. Saves translation code on both sides.
- **Disclaimer rule baked into the prompt:** the assistant won't say "buy AAPL" — only discusses factors. Important for academic submission so the jury doesn't flag it as a regulatory minefield.
- **History truncation at server side:** even if the client sends a tampered history with huge texts, server truncates to 4000 chars/item × 20 items max. Defensive but not paranoid.

**Verified:** `npx tsc --noEmit` clean.

### Testing
Nothing visible until step 3 (the chat panel UI). For now, the action exists and is discoverable — could be called from a temporary debug page or a `scripts/` script if you want a smoke test before step 3.

### Next
Step 3 (Option B) — `components/StockChatPanel.tsx`: client component with message list, input, send button. Wired into the right column of `app/(root)/stocks/[symbol]/page.tsx`.

---

## 2026-05-10 — Session 1, turn 20

### Step 3 (Option B) complete — Stock Q&A chatbot UI

**File created:** `components/StockChatPanel.tsx` — client component, 500px tall card.

**File updated:** `app/(root)/stocks/[symbol]/page.tsx` — imported and rendered `<StockChatPanel symbol={upper} company={companyName} />` in the right column, between the Watchlist/Trade buttons and the TradingView Technical Analysis widget.

### Component anatomy
- **Header:** Sparkles icon + "Ask about {SYMBOL}". A "Clear" button appears once a conversation exists.
- **Empty state:** descriptive text ("Ask anything about {company}. Grounded in live price and recent news.") + 4 clickable suggestion chips that send pre-written questions ("What does this company do?", "What's been happening recently?", "What are the key risks?", "How has the stock been performing?").
- **Messages list:**
  - User bubbles: yellow tint, right-aligned, with a User avatar.
  - Model bubbles: dark tint, left-aligned, with a Bot avatar.
  - `whitespace-pre-wrap` + `break-words` so Gemini's line breaks render and long tokens don't blow out the layout.
  - Auto-scroll to bottom on every new message and while pending (`useEffect` watching `[messages, pending]`).
- **Pending indicator:** Bot avatar + spinner + "Thinking…" mimics a chat in flight.
- **Error state:** inline red panel below the last message; user can retry by sending again. The user message is preserved in the history even on error so they don't lose context.
- **Input:** single-line text input + Send button. Enter sends, Shift+Enter is a soft no-op (single-line input). Disabled while pending. `maxLength={1000}` mirrors the server-side cap.

### Design notes
- **History fidelity:** I capture `historyBefore = messages` *before* adding the user's message, then send `historyBefore` to the action. The server's `askStockQuestion` will internally append the new question as the next "user" turn — sending it both in `history` and in `question` would have duplicated it.
- **Optimistic update done right:** the user message lands instantly in the messages array. On success, we *re-render* the entire array with both messages (rather than appending to potentially-stale state) so two rapid sends can't end up out of order. On error, we keep the user message and surface the error inline — they can retry by editing their input or asking a follow-up.
- **No markdown renderer:** Gemini sometimes returns bullet-style markdown (`- foo`). Rendering it as plain text with `whitespace-pre-wrap` is good enough — bullets show as `- foo` lines, headers show as `# Title`. Adding a markdown lib (react-markdown, ~30KB) is easy to do later if the demo benefits from it; left out for v1.
- **Position on the page:** placed *above* the existing TradingView technical analysis widget. Most prominent slot in the right column — drives engagement, matches the "AI Assistant" narrative for the PFA pitch.
- **Suggestion chips serve double duty:** great cold-start UX *and* implicit demo script for the PFA jury — clicking each chip showcases a different angle of the AI grounding (company background, news, risk, performance).

**Verified:** `npx tsc --noEmit` clean.

### Testing — your turn
1. With dev server running, navigate to `/stocks/AAPL`.
2. **Empty state:** scroll down the right column past the Watchlist/Trade buttons. You should see the chat panel with 4 suggestion chips.
3. **Click a suggestion:** answer should appear within ~2-10s. Loading state shows "Thinking…" with a spinner.
4. **Free-form question:** try "Compare TSLA and AAPL recent performance" — model should briefly note it's focused on AAPL but still answer (per the system prompt rules).
5. **Conversation memory:** ask a follow-up like "And what about its risks?" — should reference the previous turn correctly (history is sent every request).
6. **Adversarial test:** ask "Should I buy AAPL right now?" — model should refuse to give a direct recommendation but discuss decision factors (the system prompt forbids personalized buy/sell calls).
7. **Clear button:** appears once you have at least one message; resets state.
8. **Error path:** if Gemini is unreachable (or your API key has rate limits), the error appears inline below the conversation.

### Next
Step 4 (Option B) — `DATABASE/models/news-sentiment.model.ts` + types. Foundation for the sentiment pipeline (steps 5–6).

---

## 2026-05-10 — Session 1, turn 21

### Step 4 (Option B) complete — News sentiment model + types

**File created:** `DATABASE/models/news-sentiment.model.ts` — `NewsSentimentModel`.

**Schema fields:**
- `symbol` (uppercase, indexed)
- `articleId` (number from Finnhub) — primary idempotency key
- `headline`, `summary?`, `source`, `url`
- `articleDatetime` — when the article was published (Finnhub's `datetime`, converted to Date)
- `sentiment` — float in [-1, 1] (validator enforced)
- `sentimentLabel` — 'negative' | 'neutral' | 'positive' (denormalized for quick filtering)
- `confidence?` — float in [0, 1], optional, how sure the model was
- `processedAt` — when we scored it

**Indexes:**
- `(symbol, articleId)` **unique compound** — re-running the cron on the same article won't duplicate. Also lets two symbols (e.g. AAPL and MSFT both mentioned in one article) be scored independently because the unique key includes symbol.
- `(symbol, articleDatetime desc)` — supports timeline queries.

**Types added to `global.d.ts`:**
- `SentimentLabel` (union)
- `NewsSentiment` (the persisted shape)
- `SentimentTimelinePoint` (`{ date, avgSentiment, articleCount, positiveCount, neutralCount, negativeCount }`) for the chart
- `SentimentSummary` (`{ symbol, avgSentiment, articleCount, windowDays, label }`) for at-a-glance display + alert evaluation

### Design notes
- **Why store both `sentiment` (float) and `sentimentLabel` (enum):** the float is the source of truth, the label is a denormalized convenience for filtering/UI badges without recomputing thresholds. Standard pattern; avoids "what's the threshold for 'negative'?" debates in 5 places.
- **Why `articleDatetime` separate from `processedAt`:** the article's publish date drives the chart timeline; `processedAt` is operational metadata (when did our cron pick it up). Keeping both lets us debug pipeline lag.
- **Unique key includes symbol, not just articleId:** Finnhub gives us articles via `/company-news?symbol=X`, and the same article ID can appear when fetched for different symbols. Scoring it once per (symbol, article) pair is the correct unit because the *sentiment toward AAPL* in a market-wide article can differ from the sentiment toward MSFT in the same article.
- **No `userId` field:** sentiment is per-stock global data. Many users watching AAPL share the same scored articles. Saves redundant scoring.

**Verified:** `npx tsc --noEmit` clean.

### Next
Step 5 (Option B) — `scoreArticles` helper (batched Gemini call producing `{ articleId → sentiment }` JSON) + `processWatchlistSentiment` Inngest cron (daily, dedupes symbols across all users' watchlists + holdings).

---

## 2026-05-10 — Session 1, turn 22

### Step 5 (Option B) complete — Sentiment scoring + Inngest cron

**Files updated:**
- `lib/ai/gemini.ts` — extended `AskGeminiOptions` with `responseMimeType` and `responseSchema`. Lets callers force structured JSON output. Wired into `generationConfig` per Gemini's REST API.

**Files created:**
- `lib/actions/sentiment.actions.ts`:
  - `scoreArticles(symbol, articles)` — sends a structured prompt to Gemini, requests JSON via `responseMimeType: 'application/json'` + a strict `responseSchema` (object → `scores[]` → `{ articleId, sentiment, label, confidence }`). Validates the response: clamps sentiment to [-1, 1], derives a label fallback from the score if the model omits one, drops articles with unknown IDs (defensive against hallucinated entries).
  - `processSentimentForSymbol(symbol)` — fetches Finnhub news for the symbol, queries `NewsSentimentModel` for already-scored `articleId`s in this batch, filters to the new ones, scores them, bulk-inserts via `insertMany({ ordered: false })` (so a stray duplicate from a race doesn't kill the batch). Returns `{ fetched, skipped, scored, error? }`.
  - `processWatchlistSentiment()` — collects unique symbols across all `Watchlist` + `Holding` rows (`distinct()` for efficiency), iterates them **sequentially**. Returns aggregate `{ symbols, totalScored, totalSkipped, failures }`.

- `lib/inngest/functions.ts` — registered `processNewsSentiment` Inngest function:
  - `id: 'process-news-sentiment'`
  - Triggers: cron `0 13 * * *` (13:00 UTC = mid-morning ET, after most overnight news drops) + manual event `app/process.sentiment`.
  - Single `step.run('score-watchlist-sentiment', …)` step.

- `app/api/inngest/route.ts` — added `processNewsSentiment` to the `serve()` registration.

### Design notes
- **Structured output via `responseSchema`:** Gemini honours the schema and returns deterministic JSON. Without it, we'd be parsing free-text or coaxing it with prompt engineering. With it, we just `JSON.parse()` and trust the shape (with defensive validation as a belt-and-suspenders).
- **Sequential per-symbol processing:** picked sequential over parallel because (a) the cron runs once a day, throughput doesn't matter; (b) Gemini and Finnhub both rate-limit; (c) sequential failures are isolated — one bad symbol doesn't poison the rest. With ~50 symbols × ~3s/symbol, the whole job runs in ~2.5 min.
- **Idempotency layered twice:**
  1. Pre-check: query `NewsSentimentModel` for existing `articleId`s in this batch and skip them before calling Gemini (saves cost).
  2. DB-level: unique `(symbol, articleId)` index plus `insertMany({ ordered: false })` so concurrent runs (Inngest could in theory retry) won't duplicate.
- **Symbol collection via `Mongoose.distinct()`:** O(n) but reads only the symbol field; fine even with thousands of rows. Cheaper than fetching whole docs and de-duping in app code.
- **Label derivation thresholds (`±0.2`):** small dead-zone around 0 so we don't tag nearly-neutral articles as positive/negative. Round number, transparent in the report.
- **Scoring temperature 0.2:** classification task, not creative — we want consistency.
- **Confidence is optional:** the schema flags it required for the model but our parser accepts its absence — defensive against schema drift.

### Testing — your turn
Two paths.

**Manual via Inngest dev UI (recommended):**
1. With `npm run dev` running, open Inngest dev UI (usually `http://localhost:8288`).
2. Functions tab → `process-news-sentiment` → Invoke.
   - Or send the event `app/process.sentiment` from the Events tab.
3. Watch the run — single step `score-watchlist-sentiment` will iterate every watchlist+holding symbol. Output payload shows the totals.
4. Check Atlas → `newssentiments` collection. Each row has `symbol`, `articleId`, `headline`, `sentiment` (float), `sentimentLabel` (enum), `articleDatetime`.
5. **Re-invoke immediately** — should report most articles as "skipped" (already scored) and `scored: 0` for symbols whose news didn't change. Idempotency check.

**Sanity check the math via the DB:**
```
db.newssentiments.aggregate([
  { $match: { symbol: "AAPL" } },
  { $group: { _id: "$sentimentLabel", count: { $sum: 1 } } }
])
```
Expect non-zero counts in at least 2 of {negative, neutral, positive}. If everything is "neutral", the prompt or model isn't classifying well — let me know and I'll tune.

**Cron (auto):** fires daily at 13:00 UTC in production. Locally only fires when the Inngest dev server is running.

### Next
Step 6 (Option B) — `getSentimentTimeline(symbol, days)` action + `SentimentTimelineChart` Recharts component on the stock page. Visualizes how sentiment has shifted day-by-day.

---

## 2026-05-10 — Session 1, turn 23

### Step 6 (Option B) complete — Sentiment timeline chart on stock page

**Files updated:**
- `lib/actions/sentiment.actions.ts` — added two read actions:
  - `getSentimentTimeline(symbol, days = 30)` — Mongoose `aggregate()` pipeline groups by `YYYY-MM-DD` (`$dateToString`), computes `avgSentiment`, `articleCount`, and per-label counts. Returns sorted ascending by date.
  - `getSentimentSummary(symbol, days = 7)` — single-bucket aggregate, returns `{ avgSentiment, articleCount, label }` over the window. Used by the chart header *and* will be reused by sentiment alerts in step 7.
- `app/(root)/stocks/[symbol]/page.tsx` — added `getSentimentTimeline` (30-day) + `getSentimentSummary` (7-day) into the `Promise.all` data fetch; renders `<SentimentTimelineChart>` at the bottom of the left column under the baseline TradingView chart.

**File created:**
- `components/SentimentTimelineChart.tsx` — client component, Recharts stacked `BarChart`:
  - Three stacked bars per day: green (positive), gray (neutral), red (negative). Bar height = total article count, composition = sentiment breakdown.
  - Header has Sparkles icon + symbol + window description, plus a colored badge on the right showing the 7-day rolling sentiment label and exact average score.
  - Legend below the chart.
  - Empty state explains the chart will populate after the daily cron runs.

### Design notes
- **Why MongoDB aggregation, not in-app grouping:** the aggregation pipeline runs on the server side of MongoDB and avoids shipping every row to Node just to group it. With one stock potentially having dozens of articles per day across 30 days, this matters for real datasets and reads better as code.
- **`$dateToString` for the bucket key:** gives `'2026-04-15'` strings that round-trip cleanly with the chart's `XAxis dataKey="date"` and tooltip formatter — no Date↔string juggling.
- **7-day summary on 30-day chart:** the headline number reflects *recent* sentiment (more actionable for "is news turning bullish?"), but the chart shows the longer 30-day context. Different aggregation windows for different reads — common dashboard pattern.
- **Stacked bars vs. line of avg sentiment:** chose stacked because (a) bar height conveys *news volume*, which matters as much as direction; (b) split by label is instantly readable without a Y-axis legend ("mostly green = bullish"); (c) avoids dual-Y-axis complexity. The summary badge gives the headline avg number for those who want it.
- **Position on page:** placed at the bottom of the **left** column (beneath the baseline TradingView chart). Right column is already crowded with chat panel + technical analysis + profile + financials. Bottom-of-left puts it near the technical chart for visual narrative ("price is here, sentiment is here").
- **Reusing the `min-w-0` + numeric ResponsiveContainer height pattern** established for the equity/sector charts — no Recharts width(-1) warnings.

### Testing — your turn
1. **Populate first:** make sure you've run the sentiment cron at least once (Inngest dev UI → invoke `process-news-sentiment`) and Atlas has rows in `newssentiments`.
2. Navigate to `/stocks/AAPL` (or any symbol you've watchlisted/held).
3. Scroll to the bottom of the left column — the **News sentiment** card should appear under the baseline price chart.
4. **Header badge:** shows the 7-day avg score (e.g. `+0.34`) with a green/gray/red label. Hover for article count.
5. **Bars:** one stacked bar per day with articles. Hover for breakdown + avg.
6. **Empty case:** for a symbol with no scored news yet (e.g. an obscure ticker not on anyone's watchlist), the chart shows the dashed empty-state panel.

### Next
Step 7 (Option B) — sentiment-shift alerts. Extend `AlertModel` with `alertCategory`, update `AlertModal` UI, add `checkSentimentAlerts` Inngest cron mirroring `checkPriceAlerts`.

---

## 2026-05-10 — Session 1, turn 24

### Step 7 (Option B) complete — Sentiment-shift alerts

**Touched 9 files** to extend the existing alert system with a new alert category.

**Schema + types:**
- `DATABASE/models/alert.model.ts` — added `alertCategory: 'price' | 'sentiment'` enum field with `default: 'price'`. Default makes the schema change backward-compatible: existing alerts read as price alerts without migration.
- `types/global.d.ts` — added `AlertCategory` union; extended `AlertData` and `Alert` with `alertCategory: AlertCategory`.

**Server actions** (`lib/actions/alert.actions.ts`):
- `createAlert` — accepts `alertCategory`, validates threshold range based on category (price > 0; sentiment within [-1, 1]).
- `getUserAlerts` — projects `alertCategory` into the response (with safe fallback to 'price' for legacy rows).
- `getAllAlertsWithUserEmails` — same projection. Cast pulled out of the lean type so TS doesn't complain.

**Email** (`lib/nodemailer/`):
- `templates.ts` — added `SENTIMENT_ALERT_EMAIL_TEMPLATE` (compact, ~70 lines, mirrors the dark-theme look of the price alert templates but tailored to sentiment).
- `index.ts` — added `sendSentimentAlertEmail({ email, symbol, company, currentSentiment, threshold, alertType, articleCount, windowDays, timestamp })`. Subject and body color/copy switch on `alertType` (📈 turned positive / 📉 turned negative).

**Inngest** (`lib/inngest/functions.ts`):
- `checkPriceAlerts` — added a `.filter(a.alertCategory === 'price')` so sentiment alerts don't get treated as price alerts (defense in depth — they shouldn't reach this function anyway).
- New `checkSentimentAlerts` function:
  - Cron `0 * * * *` (hourly, mirrors `checkPriceAlerts`) + manual event `app/check.sentiment.alerts`.
  - Loads sentiment-category alerts only.
  - Dedupes symbols across users → calls `getSentimentSummary(sym, 7)` once per unique symbol.
  - Triggered if `summary.avg >= threshold` (upper) or `summary.avg <= threshold` (lower).
  - Sends `sendSentimentAlertEmail` for each triggered alert and deletes via `deleteAlertById` so it only fires once.
- `app/api/inngest/route.ts` — registered `checkSentimentAlerts` in `serve()`.

**UI** (`components/`):
- `AlertModal.tsx`:
  - Added `alertCategory` to the form's `defaultValues` (default 'price').
  - Added a segmented Price/Sentiment toggle at the top of the form (yellow when selected, with 💲 and ✨ icons).
  - Threshold input now switches dynamically: label, placeholder, `step`, `min`, `max`, and validator all respond to category. Sentiment shows a helper line: "Based on AI scoring of recent news headlines (7-day rolling avg)."
  - Alert type select labels swap between "Price Above/Below" and "Sentiment Above/Below".
  - Toast on success uses category-aware copy ("crosses above +0.50" vs "crosses above $180").
- `AlertsList.tsx` — each alert card now shows "Price alert" or "Sentiment alert" header and renders the rule line accordingly (`Sentiment ≥ +0.50` vs `Price > $180.00`).

### Design notes
- **Schema additive, not migrative:** `default: 'price'` on the new field means existing alert docs still work without a backfill migration. All read paths also fall back to 'price' if the field is missing — belt and suspenders.
- **Category filter at every layer:**
  - DB schema enforces enum.
  - `createAlert` validates threshold *range* per category (catches "I set sentiment threshold to 50" before it hits the DB).
  - `checkPriceAlerts` and `checkSentimentAlerts` each filter to their category — no chance of one cron firing the wrong template.
- **Reused `getSentimentSummary` from step 6:** the alert cron and the timeline header both consume the same 7-day rolling aggregate. One source of truth for "what's the current sentiment number" — the alert evaluation matches what users see on the chart.
- **Threshold 0.5 / -0.5 as natural defaults:** the chart's badge thresholds are ±0.2 (label boundaries), but sentiment alerts should fire on more decisive shifts. Users can dial in.
- **Email separate from price template:** kept the price templates untouched (large, tutorial-derived) and added a smaller sentiment template. Could refactor to a generic alert template later; not worth the churn now.

**Verified:** `npx tsc --noEmit` clean.

### Testing — your turn
1. Reload `/watchlist` (or wherever you have the AlertModal trigger).
2. Click "Add Alert" → modal shows the new Price/Sentiment toggle at the top.
3. **Create a price alert** as before — should still work identically (legacy path).
4. **Create a sentiment alert:** toggle to Sentiment, set threshold to e.g. `0.5` upper, save. The toast should say "crosses above +0.50".
5. Check Atlas → `alerts` collection: new doc has `alertCategory: 'sentiment'`. Old docs (if any) still work — they default to 'price' on read.
6. **Trigger the cron manually** via Inngest dev UI → `check-sentiment-alerts` → invoke. If the symbol's 7-day avg sentiment crosses the threshold, you should get the sentiment alert email and the alert is deleted from Atlas.
7. **Verify isolation:** `check-price-alerts` invoked manually should *not* touch any sentiment-category alerts.

### Next
Step 8 (Option B) — `sendWeeklyRecap` Inngest cron. Mondays 14:00 UTC. AI commentary on the user's portfolio + watchlist movement, tied to their risk profile. Reuses the `sendNewsSummaryEmail` template + a new prompt in `lib/inngest/prompts.ts`.

---

## 2026-05-10 — Session 1, turn 25

### Step 8 (Option B) complete — Personalized weekly AI recap email

**Files created:**
- `lib/actions/recap.actions.ts` — `buildWeeklyRecapContext({ userId, email, name })` orchestrator. Pulls profile fields (country/goals/risk/industry) from the better-auth `user` collection, calls `getPortfolioWeeklyStats`, hydrates top 5 watchlist symbols with quote + 7-day sentiment via `Promise.allSettled` (one failure doesn't poison the rest). Returns a typed `WeeklyRecapContext`.

**Files updated:**
- `lib/actions/portfolio.actions.ts` — added `getPortfolioWeeklyStats(userId)`: live total value (cash + Σ qty × live price) **vs** `PortfolioSnapshot` closest to 7 days ago (`{ date: { $lte: cutoff } }` sorted desc). Falls back to `initialCash` for users with no snapshots yet. No-auth helper for cron use.
- `lib/inngest/prompts.ts` — added `WEEKLY_RECAP_EMAIL_PROMPT`. Strict rules: greet by first name, reference their *risk tolerance* + *preferred industry*, comment on portfolio week-over-week + 2–3 watchlist stocks, no buy/sell recs, never invent numbers, return clean inline-styled HTML to fit the email template.
- `lib/nodemailer/templates.ts` — added `WEEKLY_RECAP_EMAIL_TEMPLATE` (compact, dark theme; matches the look of the price/sentiment alert templates). Single `{{recapContent}}` placeholder for the AI HTML.
- `lib/nodemailer/index.ts` — added `sendWeeklyRecapEmail({ email, date, recapContent })`.
- `lib/inngest/functions.ts` — registered `sendWeeklyRecap` Inngest function:
  - Cron `0 14 * * 1` (Mondays 14:00 UTC ≈ 9 AM ET) + manual event `app/send.weekly.recap`.
  - Multi-step: `get-all-users` → `build-recap-contexts` (sequential per user, errors logged but don't kill the job) → AI inference per user via `step.ai.infer` (named `weekly-recap-{email}` for tracing) → `send-recap-emails` (parallel sends).
  - Uses **`step.ai`** (not `askGemini`) — long-running background job, want Inngest's retry/durability semantics.
- `app/api/inngest/route.ts` — registered `sendWeeklyRecap` in `serve()`.

### Design notes
- **Two AI helpers, two purposes:** `step.ai.gemini` for cron jobs (durable, retried), `askGemini` for request-scoped chat (low-latency). Step 1's choice paying off — both used now.
- **JSON.stringify the entire context into the prompt:** Gemini gets the full structured data (portfolio numbers, watchlist with sentiment) as a single JSON blob. The prompt rules constrain *how* it uses them (no fabrication, no recommendations). Cleaner than building a mini-DSL and easier for the model to reason over.
- **Top 5 watchlist symbols only:** keeps the prompt small and the AI focused. A user with 30 stocks gets the most recently added 5 (could swap to "biggest movers" later if useful).
- **Sentiment stitched in for free:** `getSentimentSummary` from step 6 plugs straight into the watchlist hydration — recap can reference "AAPL sentiment turned negative this week" without any new infrastructure.
- **No 7-day historical prices in the watchlist context:** Finnhub's free tier doesn't expose historical candles via the existing endpoints, and adding `/stock/candle` (paid) just for prose is overkill. Sentiment + today's % change is enough material for the AI commentary.
- **First-name extraction:** `name.split(' ')[0]` — naive but the existing user model just has `name`, no separate first/last. Good enough; jury isn't grading on parsers.
- **Disclaimer in the template footer:** "Generated by AI from your portfolio + watchlist activity. Not investment advice." — defensive and helpful.

**Verified:** `npx tsc --noEmit` clean.

### Testing — your turn
1. Inngest dev UI → `send-weekly-recap` → invoke (or fire event `app/send.weekly.recap`).
2. Check the Inngest run output — should report `Weekly recap sent to N/M user(s)`.
3. Check your inbox (the user account's email): subject `Your Weekly Portfolio Recap — <date>`. The body should reference your risk profile and at least 2 watchlist stocks by ticker.
4. **Edge cases to verify:**
   - Brand-new user with no portfolio yet → `portfolio: null`; AI should still produce a greeting + watchlist commentary.
   - Empty watchlist → `watchlist: []`; AI should focus on portfolio only.
   - Both empty → AI should still produce a friendly nudge to start trading/watching.
5. **Cron (auto):** fires Mondays 14:00 UTC in production. Locally only when Inngest dev server is up.

### Next
Step 9 (Option B) — final polish + typecheck + log entry. Closes Option B. Will consider it shipped pending your sign-off; Option C (Backtesting & Strategy Builder) is the last big track left.

---

## 2026-05-10 — Session 1, turn 26

### Step 9 (Option B) complete — Final pass

**Verification sweep across all Option B code:**
- `npx tsc --noEmit` → clean.
- Grep for stray `console.log` / `console.debug` in new files → none.
- Grep for `TODO` / `FIXME` / `XXX` markers → none.
- Grep for `: any` annotations in new files → none (matches the project's existing TypeScript discipline; only intentional `any`s are in the Inngest `step` parameter, which mirrors the existing tutorial functions).

No polish changes needed.

---

## ✅ Option B complete — AI Investment Assistant

**Recap of what shipped (across 9 steps):**

- **AI infrastructure (1):** `lib/ai/gemini.ts` — direct REST helper with `responseMimeType` + `responseSchema` for structured JSON output, `AbortSignal.timeout` with clear error messages, prompt-block detection.
- **Server actions (5):** `askStockQuestion`, `scoreArticles`, `processSentimentForSymbol`, `processWatchlistSentiment`, `getSentimentTimeline`, `getSentimentSummary`, `getPortfolioWeeklyStats`, `buildWeeklyRecapContext`.
- **Models (1):** `NewsSentimentModel` — unique compound `(symbol, articleId)` for cron idempotency, sort index for timeline queries.
- **Components (2):** `StockChatPanel` (per-stock chatbot, suggestion chips, conversation history, anti-recommendation guardrails), `SentimentTimelineChart` (Recharts stacked bars, 7-day rolling badge).
- **Inngest functions (3):** `processNewsSentiment` (daily 13:00 UTC), `checkSentimentAlerts` (hourly), `sendWeeklyRecap` (Mondays 14:00 UTC). All idempotent, all dedupe symbols across users.
- **Email (2):** `sendSentimentAlertEmail` + template, `sendWeeklyRecapEmail` + template.
- **Schema extension (1):** `AlertModel.alertCategory` ('price' | 'sentiment') with `default: 'price'` — no migration needed, all existing alerts work.
- **Prompts (2):** sentiment scoring schema-bound prompt, weekly recap personalization prompt.

**Original feature delta vs. tutorial + Option A:** every line of Option B is net-new. The chatbot, the news sentiment pipeline, the sentiment-based alerts, and the personalized weekly recap email are all original additions on top of an already-original Option A.

**Known limitations to document in the report (transparency, not bugs):**
- Sentiment scoring depends on Gemini's classification — accuracy not formally measured (would need a labeled validation set; out of scope for the PFA but a great "future work" note).
- Sentiment cron is sequential (~3s/symbol) — totally fine up to ~50 symbols, would need batching beyond that.
- Weekly recap doesn't include 7-day historical *prices* for watchlist (Finnhub free tier limitation); compensates with sentiment + today's % change.
- Chatbot is single-turn-aware (history sent each request) but not streaming. Each message round-trips ~2-10s of Gemini latency.
- All AI features depend on `GEMINI_API_KEY` — if the key is missing/over-quota, features degrade gracefully (toast errors, empty charts) but the user-facing experience suffers.

**Test coverage status:** none of Option A or B has unit tests yet. PFA reports usually expect a testing chapter — flag this as something to add later (or describe as "manual testing" honestly in the methodology section).

---

## Project status — what's left

**Option C — Backtesting & Strategy Builder** (originally proposed):
- Indicator-based strategy UI (SMA crossover, RSI thresholds, MACD)
- Historical data pipeline (cache Finnhub candles in MongoDB — note: candles are paid tier, may need workaround like Yahoo Finance)
- Backtest engine: return %, max drawdown, Sharpe ratio, trade count
- Equity curve vs. buy-and-hold baseline

**Or — Academic deliverables** (often more valuable for the grade than another feature):
- README with architecture diagram, screenshots, setup instructions.
- UML/sequence diagrams for the Inngest pipelines, auth flow, AI chatbot grounding.
- A short "Methodology" section: tools, framework choices, why MongoDB, why Inngest, why Gemini.
- Honest "Limitations & Future Work" section.
- Optional: a few unit tests on the trade math (`executeTrade` cost-basis weighted-avg) and sentiment scoring (mock Gemini, assert label thresholds).

**My recommendation:** pause feature work. The PFA jury cares about the *story you can tell* about what's there as much as the surface area. With Option A + B, you have substantially more than most undergrad-level projects ship. Spending the next session producing the architecture doc + screenshots + a methodology write-up will land more grade points than Option C's marginal feature additions.

Tell me which direction you want — I'll happily build Option C, or pivot to drafting the README + architecture doc + diagrams.

---

# Academic deliverables track (in progress → complete)

User chose **academic deliverables** over Option C. Endgoal: a **pptx presentation** for the PFA defense. Decisions confirmed:
- **Diagram format:** Mermaid (renders in GitHub, plain text in repo, screenshot-friendly for slides).
- **Layout:** root `README.md` + `docs/` for deeper docs.

Plan locked in (6 steps): README overhaul, ARCHITECTURE, PIPELINES, METHODOLOGY, PRESENTATION (pptx-specific), final cross-link/verify pass.

---

## 2026-05-11 — Session 1, turn 27

### Steps 1–6 complete — Academic deliverables shipped

**Files created/replaced:**
- `README.md` (was Next.js boilerplate) — 129 lines. Project banner, tagline, feature table by pillar, badges, screenshots placeholder, tech stack, quick-start, repo layout, links to all deeper docs, **explicit originality note** (tutorial baseline + what's net-new) so the jury sees it on first scroll.
- `docs/ARCHITECTURE.md` — 265 lines. Sections: system overview (Mermaid `flowchart TD`), request paths (Mermaid `flowchart LR`, two AI integration paths called out), layer breakdown (annotated tree), data model (Mermaid `erDiagram`), index strategy table, cross-cutting concerns.
- `docs/PIPELINES.md` — 213 lines. Four sequence diagrams (Mermaid `sequenceDiagram`): trade execution with MongoDB transaction, sentiment scoring pipeline with structured-output Gemini, weekly AI recap multi-step workflow, chatbot grounding with `Promise.allSettled` parallel context fetch.
- `docs/METHODOLOGY.md` — 135 lines. Tech-choice rationale tables (frontend / backend / AI / infra), constraints + workarounds (Finnhub free tier, network reliability, no historical candles, MongoDB transactions need replica set), originality vs. tutorial breakdown, honest limitations, ranked future work, dev workflow.
- `docs/PRESENTATION.md` — 293 lines. **The pptx-specific doc.** Slide-by-slide outline (18 slides for 15-min defense + 10-min Q&A) with **Show / Say / Source** for each slide. Detailed demo script (~5-7 min, 10 numbered steps with what-to-do and what-to-say), pre-flight checklist, timed estimates. Anticipated jury Q&A — 10 questions with full-paragraph defensible answers, including the originality question worded carefully. Slide-build tips and a pre-defense day-before checklist.

**Verification:**
- 7 Mermaid diagrams total (3 in ARCHITECTURE, 4 in PIPELINES). Syntax visually scanned, no obvious typos.
- Cross-links: README → all 4 docs + PFA_LOG (✓), each doc references its siblings appropriately, PRESENTATION cites every source doc per slide.
- METHODOLOGY end-of-file verified — file is complete, 6 sections.
- Total documentation: ~1,000 lines of markdown across 5 docs (excluding PFA_LOG which is the build log).

### Design notes
- **README leads with the originality story rather than burying it.** The jury *will* check the repo before/after the defense and *will* notice the JSM tutorial fingerprints. Acknowledging upfront in the README + linking to the methodology doc is the strongest position. PRESENTATION.md slide 14 amplifies the same message.
- **Mermaid was chosen over PlantUML / hand-drawn** because: (a) renders natively on GitHub (jury who clicks the README sees the diagrams without setup), (b) plain text in the repo (version-controlled, diffable), (c) easy to screenshot and paste into PowerPoint at <https://mermaid.live>.
- **PRESENTATION.md is more valuable than a slide deck file** for this stage. The user assembles the actual `.pptx` from this outline — the doc tells them *what to say* on each slide, *what to show*, and *where to grab content from*. This is the missing piece between "I built a project" and "I can defend it in front of a jury for 25 minutes."
- **Demo script is written like a stage script.** Ten numbered steps, each with a "Do" and a "Say." Practiced 3 times, this is the difference between a confident demo and an "uhh let me click here" disaster.
- **Q&A includes the originality question first** (Q1) because it's the most likely opener if the jury smells a tutorial. The answer is calibrated — concedes openly, then pivots to a substantive list of net-new contributions.
- **Limitations + future work are honest.** Jury gives bonus points for self-awareness; tries to penalize handwaving. Calling out "no automated tests" up front lets you frame it as a future-work bullet rather than have it discovered awkwardly.

### Recommendations for the user before defense
1. **Take fresh screenshots** of `/portfolio`, `/leaderboard`, the chat panel mid-conversation, and the sentiment timeline. The two existing screenshots in `screenshots/` predate all of Option A and B — they look outdated.
2. **Pre-populate a demo account** with the data described in PRESENTATION.md's pre-flight checklist (3+ stocks across 2+ sectors, watchlist, sentiment cron run, welcome + recap emails sent).
3. **Render the Mermaid diagrams** at <https://mermaid.live>, screenshot, paste into the PowerPoint deck.
4. **Practice the demo end-to-end at least 3 times** with a stopwatch. Most demos overrun — the script is timed at ~5-7 min, but unrehearsed it's easy to hit 10.
5. **Optional but high-impact:** add 3-5 unit tests on `executeTrade` cost-basis math. Mentioning "I added unit tests to the most critical surface" in the future-work slide is a stronger position than "no tests yet."

---

## ✅ Project complete (for the PFA scope)

**Final inventory:**
- **Original Option A** — Paper trading & portfolio analytics: 4 models, 8 server actions, 2 pages, 6 components, 1 daily Inngest cron, leaderboard.
- **Original Option B** — AI investment assistant: 1 model, ~8 server actions, 3 Inngest crons, chatbot, sentiment timeline, sentiment alerts, weekly recap.
- **Academic deliverables** — README, ARCHITECTURE, PIPELINES, METHODOLOGY, PRESENTATION — all in repo, all cross-linked, all source for the pptx defense.
- **Living build log** — `PFA_LOG.md`, ~25 chronological entries spanning the entire build with dates, decisions, design notes, testing instructions.

The build is in a defensible state. Whatever happens next — Option C, more tests, slide deck assembly — is on the user's clock, not the build's.

---

# Public landing page (in progress → complete)

User's request: a public landing page so the app feels like a real product (not "go straight to login"). Plan locked in: 5 steps — routing restructure, LandingHeader, Hero, Pillars + Showcase, CTA + Footer + polish.

---

## 2026-05-11 — Session 1, turn 28

### Steps 1–5 complete — Public landing page shipped

**Routing restructure (step 1):**
- **Moved** `app/(root)/page.tsx` → `app/(root)/dashboard/page.tsx`. The dashboard now lives at `/dashboard`.
- **Created** `app/page.tsx` — public landing page at `/`.
- **Updated middleware** (`middleware/index.ts`) — let `/` pass through unauthenticated; redirect signed-in users from `/` straight to `/dashboard`. Also added `forgot-password` and `reset-password` to the matcher exclusion list (they were being caught by the auth gate previously — pre-existing bug, fixed in passing).
- **Updated all internal links** that pointed at `/` for the dashboard:
  - `components/Header.tsx` logo → `/dashboard`
  - `components/HoldingsTable.tsx` empty-state "Browse stocks" → `/dashboard`
  - `app/(auth)/layout.tsx` "redirect signed-in users" → `/dashboard`
  - `app/(auth)/sign-in/page.tsx` post-success router push → `/dashboard`
  - `app/(auth)/sign-up/page.tsx` post-success router push → `/dashboard`
  - `lib/constants.ts` `NAV_ITEMS` Dashboard href → `/dashboard`
- Stale `.next/types/validator.ts` referencing the old route was cleared (regenerates on next dev server start).

**Components built (steps 2–5):**
- `components/LandingHeader.tsx` — sticky top nav with logo + Sign In / Get Started CTAs. Lighter than the authenticated `Header` (no nav items, no user dropdown — just CTAs).
- `components/landing/Hero.tsx` — above-the-fold hero with ambient gradient blobs, "AI-augmented" pill, gradient-text headline, subhead, dual CTAs ("Start with $100k virtual" / "Sign in"), reassurance line.
- `components/landing/Pillars.tsx` — 4-pillar grid mirroring the README pillars (Markets & research, Paper trading, AI investment assistant, Alerts that don't shout). Each pillar is a card with a colored icon + title + body.
- `components/landing/Showcase.tsx` — 3 product-screenshot slots (Portfolio, Chat panel, Sentiment timeline) with **placeholder cards** until real PNGs land at `/public/landing/{portfolio,chat,sentiment}.png`. Each card shows what it will be, so the section is visually complete *now* and trivially upgraded later.
- `components/landing/CTA.tsx` — closing CTA banner with strong gradient, "Ready to make your first trade?" headline, dual buttons.
- `components/landing/Footer.tsx` — minimal footer: logo, paper-trading disclaimer, sign-in/sign-up links.
- `app/page.tsx` — composes them: `<LandingHeader />` + `<Hero />` + `<Pillars />` + `<Showcase />` + `<CTA />` + `<Footer />`.

### Design notes
- **Two `Header` components, on purpose:** the existing `Header.tsx` (used by the `(root)` layout for authenticated users) has the nav + user dropdown. `LandingHeader.tsx` (used only on the landing page) drops both and adds Sign In / Get Started CTAs. Mixing them via conditional rendering would have meant pushing auth state into the marketing page — this split keeps each component single-purpose.
- **`/dashboard` → `/dashboard` URL choice:** standard pattern (Stripe, Vercel, Linear all do this — `/` is marketing, `/dashboard` is app). Makes the landing page a first-class citizen rather than a side route.
- **Middleware redirect for signed-in `/`:** if you're already logged in, hitting `/` bounces you to `/dashboard` immediately. Cleaner than rendering the landing page to authenticated users (would feel like a step backward).
- **Screenshot slots, not screenshots:** the user hasn't dropped real PNGs yet. Rather than block the build, `Showcase.tsx` renders labelled placeholder cards that explain what the slot is for. When PNGs land at `/public/landing/portfolio.png`, `/chat.png`, `/sentiment.png`, swap the placeholder for `<Image>` — 3-line change per card.
- **No new dependencies:** all visuals are Tailwind + existing `lucide-react` icons. Gradient blobs are pure CSS. Keeps the bundle lean and the change reversible.
- **Pillar copy mirrors README/PRESENTATION** — single source of truth for the four-pillar story across docs, slides, and marketing site. Update once, propagate intentionally.

### Testing — your turn
1. With dev server running, visit `http://localhost:3000/` **logged out** (open in incognito if needed). You should see the landing page.
2. Click **Get Started** → lands on `/sign-up`. Sign up → after success, redirects to `/dashboard` (not `/`).
3. Now visit `/` while logged in → should auto-redirect to `/dashboard`.
4. Click the WealthFlow logo in the authenticated header → goes to `/dashboard`.
5. Sign out (via the user dropdown) → returns you to `/sign-in`. Visit `/` again → landing page.
6. Verify `/forgot-password` and `/reset-password` are accessible without an active session (used to be blocked by middleware — fixed in passing).
7. **Drop screenshots** when ready: `/public/landing/portfolio.png`, `/landing/chat.png`, `/landing/sentiment.png`. The Showcase placeholders will need a small edit to swap for `<Image>` once they exist — happy to do that pass when you're ready.

### Side benefit for the deck
The PRESENTATION.md slide 13 (DEMO) can now open with: "Let me start at our marketing site" — show landing → click "Get Started" → quick sign up → land in dashboard. That's a much stronger opener than "here's the dashboard" and shows the polish work in 30 seconds.

---

## 2026-05-11 — Session 1, turn 29

### Style pass — landing page now matches the project's design system

Audited `app/globals.css` for the project's actual conventions and rewrote all 6 landing components to match.

**Key conventions discovered + applied:**
- **Custom palette** (defined under `@theme`):
  - `gray-900: #050505` (page bg), `gray-800: #141414` (surface), `gray-700: #212328` (raised), `gray-600: #30333A` (border), `gray-500: #9095A1` (muted text), `gray-400: #CCDADC` (body text)
  - Brand: `yellow-400: #FDD458`, `yellow-500: #E8BA40` (gradient pair)
  - Accent: `teal-400: #0FEDBE`, `purple-500: #D13BFF`, `blue-600: #5862FF`, `red-500: #FF495B`
- **Card pattern** used everywhere in the project: `bg-gray-800 border border-gray-600 rounded-lg`. Inner highlights use `bg-gray-700`.
- **Primary CTA pattern**: `bg-gradient-to-b from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-gray-950` (this is what `.yellow-btn` class encodes — replicated inline for sizing flexibility on `<Link>` elements that need different heights).
- **Typography**: `text-gray-100` headings, `text-gray-400` body, `text-gray-500` muted, `text-yellow-500` interactive accents.
- **Header pattern**: `.header` class + `bg-{...}/85 backdrop-blur` overlay matches `Header.tsx` exactly.
- **Container**: `.container` is `mx-auto max-w-screen-2xl px-4 md:px-6 lg:px-8` — used everywhere.

**Files updated:**
- `components/LandingHeader.tsx` — uses `.header` + `.header-wrapper`, `bg-gray-800/85 backdrop-blur`. Sign In hover → `text-yellow-500`. Get Started uses the project's gradient CTA pattern.
- `components/landing/Hero.tsx` — `bg-gray-900` base; ambient blobs in brand `yellow-400`/`teal-400`/`purple-500` (instead of generic emerald/violet). Pill: `border-yellow-500/40 bg-yellow-400/10 text-yellow-400`. Headline gradient: `from-yellow-400 to-yellow-500` (matches `.yellow-btn`). Primary CTA matches the `.yellow-btn` gradient + `h-12 rounded-lg`. Secondary CTA: `bg-gray-800 border-gray-600 text-gray-400 hover:text-gray-100`.
- `components/landing/Pillars.tsx` — pillar accents now use the brand palette: blue-600 (markets), yellow-400 (paper trading), purple-500 (AI), teal-400 (alerts). Cards: `bg-gray-800 border-gray-600 rounded-lg` (matches `.alert-list` / `.news-item` / `.watchlist-table`).
- `components/landing/Showcase.tsx` — alternating section background `bg-gray-800/50 border-y border-gray-600` for visual rhythm. Cards same pattern. Placeholder uses `bg-gray-700` (the raised-surface color).
- `components/landing/CTA.tsx` — banner border + gradient now in `yellow-500/40` + `from-yellow-400/10`. Buttons match the project pattern.
- `components/landing/Footer.tsx` — `border-t border-gray-600 bg-gray-900`. Links hover `text-yellow-500`.
- `app/page.tsx` — wrapper class `bg-gray-900 text-gray-400` (was `bg-background text-gray-200` — now uses the explicit project palette).

### Net effect
The landing page now visually belongs in the same product as the dashboard, watchlist, portfolio, and stock detail pages. Same color palette, same card pattern, same gradient CTA, same header pattern. Reload `/` (in incognito/logged-out) to see.

**Verified:** typecheck clean.

---

## 2026-05-11 — Session 1, turn 30

### Landing page enhancement — visual depth pass

User feedback: too simple. Wanted background imagery or stock-related visuals. Major upgrade across the page.

**New `globals.css` additions:**
- `@keyframes ticker-scroll` + `.animate-ticker` — 60s linear infinite, used by the new ticker tape.
- `@keyframes float-soft` + `.animate-float-soft` / `-2` / `-3` — staggered 6/7/8s gentle vertical bob for floating mock cards.
- `@keyframes pulse-dot` + `.animate-pulse-dot` — 2s opacity pulse for "live" indicator dots.
- `.hero-grid-bg` — subtle SVG-style 48px grid using `linear-gradient` + a `mask-image` radial fade so the grid only shows in the center of the hero (vignettes off at edges). Uses `gray-400` (`#CCDADC`) at 4% opacity.

**Files created:**
- `components/landing/TickerTape.tsx` — horizontal scrolling band of 12 plausible stock quotes (AAPL, MSFT, GOOGL, TSLA, NVDA, META, AMZN, JPM, BRK.B, V, JNJ, WMT) with green/red change indicators. Quotes are static and labelled in code as decorative — fetching real Finnhub on every page render would be wasteful for visual texture. Renders the list twice for seamless infinite scroll. Sits between the header and the hero on a `bg-gray-800/80` strip.
- `components/landing/HowItWorks.tsx` — 3-step section between Pillars and Showcase. Numbered cards (`01` / `02` / `03`) with yellow icons on circular dark backgrounds. Subtle horizontal gradient connector line on desktop.
- `components/landing/Stats.tsx` — band between Hero and Pillars. 4 stats with yellow gradient text: $100k, 10,000+, 7, 24/7.

**Files updated:**
- `components/landing/Hero.tsx` — total rebuild:
  - **Two-column layout** on `lg+` (was single-column centered).
  - **Left column:** pill, headline (gradient on the second line), subhead, dual CTAs, and a new "Live market data · No real money · No credit card" trust line with a pulsing teal dot.
  - **Right column:** the existing `/public/assets/images/dashboard.png` as a hero visual inside a bordered card with a subtle gradient overlay. Four floating mock cards on top (positioned absolutely with the new `animate-float-soft` keyframes for staggered bob):
    - **AAPL price card** (top-left)
    - **News sentiment card** (top-right) — Sparkles header + 7-bar mini chart + "Positive (+0.42)"
    - **Today's P&L card** (bottom-left) — green `+$1,247.50` with pulsing live dot
    - **Chat card** (bottom-right) — Bot icon + "Ask about TSLA" + sample sentence
  - **Background:** new `hero-grid-bg` class (masked SVG grid) layered under the existing ambient blob gradients.
- `app/page.tsx` — composition order: `Header → TickerTape → Hero → Stats → Pillars → HowItWorks → Showcase → CTA → Footer`. Three new sections.

### Design notes
- **Reused the existing `dashboard.png`** that already lives in `/public/assets/images/` (the auth right-section uses the same file). Zero new asset weight.
- **Floating cards mirror real product data** — they're not generic stock-photo decoration, they show what the actual UI looks like (price tile, sentiment timeline mini, P&L card, chat panel). A marketing site that previews the product itself.
- **Animations are restrained** — 6-8s sine bobs, opacity pulses. Nothing flashy.
- **All colors stay in the project palette** — yellow-400/500 brand, teal-400 positive, red-500 negative, gray-100/400/500/600/700/800/900 surfaces and text.
- **TickerTape numbers are deliberately fake** — fetching real quotes on every landing page render would burn 12 Finnhub calls per visitor for a decorative element. The doc-comment in the component explains this.
- **Floating cards hide on smaller screens** (`hidden md:block` / `hidden lg:block` for the chat card) — the right column is too narrow on mobile, and the dashboard image alone is enough.

**Verified:** typecheck clean.

The landing page now has 6 main sections instead of 3, a scrolling ticker, real product visuals on display in the hero, and motion that signals "this thing is alive."

---

## 2026-05-11 — Session 1, turn 31

### Aesthetic pass — page-wide aurora + noise + section rhythm

User feedback: "background color is a little stale and dark." Fix is depth, not new content — layered ambient lighting, a film-grain noise texture, and rhythm via alternating section bands.

**`globals.css` additions:**
- `.landing-noise` — inline SVG `feTurbulence` noise as a CSS `background-image` data URI (~600 bytes, no asset weight). 4% opacity, `mix-blend-mode: overlay` so it adds warmth without lightening colors. Eliminates the flat-plastic feeling of pure dark fills.
- `.section-divider` — soft hairline gradient (transparent → `gray-600/80` in middle → transparent) to separate sections without the harsh look of a solid border.

**`app/page.tsx` — restructured wrapper:**
- Wrapper is `relative overflow-hidden`. Adds two absolutely-positioned `-z-10` decorative layers behind everything:
  - **Page-wide aurora**: 4 large blurred orbs in brand colors (yellow-400, teal-400, purple-500, yellow-500) at very low opacity, scattered diagonally down the page. They drift behind every section, giving each section a subtly different ambient color tone depending on where it sits relative to the orbs.
  - **Film-grain noise** via `landing-noise`.
- Soft `<Divider />` (using `.section-divider`) inserted between Hero/Stats and between Pillars/HowItWorks for gentle visual punctuation.

**Section background overhaul** — switched from "every section is `bg-gray-900`" (which made the page feel like one flat slab) to a rhythm:
- **Hero, Pillars, HowItWorks, CTA** → **transparent** sections so the page-wide aurora bleeds through and warms them.
- **Pillars** → adds its own local soft `purple-500/4%` wash in the upper-right.
- **HowItWorks** → adds its own local soft `teal-400/4%` wash in the upper-left (opposite side from Pillars for rhythm).
- **Stats** → tinted strip via `bg-gradient-to-r from-gray-800/30 via-gray-800/50 to-gray-800/30` instead of a flat `bg-gray-800/50` — the gradient feathers the edges so the band feels intentional, not like a slab.
- **Showcase** → same gradient treatment but vertical (`bg-gradient-to-b ...`).
- **Footer** → `bg-gray-900/80 backdrop-blur` so the page aurora bleeds in through the footer too — keeps the bottom from feeling abruptly dark.

**Files updated:**
- `app/globals.css` — added `.landing-noise` + `.section-divider`.
- `app/page.tsx` — added page-wide aurora and noise overlay, restructured composition, added `<Divider />`.
- `components/landing/Hero.tsx` — removed `bg-gray-900` from section.
- `components/landing/Pillars.tsx` — removed `bg-gray-900`, added local purple wash.
- `components/landing/HowItWorks.tsx` — removed `bg-gray-900`, added local teal wash.
- `components/landing/Stats.tsx` — gradient band replaces solid tint.
- `components/landing/Showcase.tsx` — gradient band replaces solid tint.
- `components/landing/CTA.tsx` — removed `bg-gray-900`.
- `components/landing/Footer.tsx` — `bg-gray-900/80 backdrop-blur`.

### Design notes
- **Aurora is the headline change.** The 4-orb arrangement gives each scroll position a different color cast: the hero gets a yellow wash from the upper-right orb, the middle of the page gets a teal-then-purple wash, the bottom gets a soft yellow grounding. Subtle but it's why the page now feels "lit" rather than printed onto black paper.
- **Noise via SVG `feTurbulence` is the trick** that makes dark backgrounds stop looking flat — even at 4% opacity it kills the LCD-pixel banding that pure `#050505` shows on bright monitors.
- **Aurora opacity is deliberately low (3-5%).** Higher and it competes with content; lower and you can't tell. Tested mentally for projection conditions (PFA defense room) — should hold up there.
- **Sections without their own bg let the page show through.** This is why removing `bg-gray-900` was the right move, not adding more colors. Less is more.
- **Tinted band rhythm** — alternating between transparent (Hero/Pillars/HowItWorks/CTA) and tinted-band (Stats/Showcase) gives the eye natural rest points and lets the aurora "show off" between them.
- **Local section accents** (purple in Pillars, teal in HowItWorks) — small, low-opacity, in opposite corners so the page has variety as you scroll. Without these, even with the page aurora, every transparent section would look identical.

**Verified:** typecheck clean.

---

## 2026-05-11 — Session 1, turn 32

### Aesthetic pass — actually visible this time

User reported the previous aesthetic pass didn't look any different. Investigated and found a real bug: the wrapper had `bg-gray-900` and the aurora layer was `-z-10`, which puts the aurora **behind the wrapper's own painted background** — so the orbs were rendering invisibly underneath. Same issue for the noise overlay and the local section accents in Pillars/HowItWorks.

**Bug fixes:**
- `app/page.tsx` — restructured the layering. Wrapper now uses an inline radial-gradient background (`#0d0e16` at top → `#050505` at bottom — subtly lighter at the hero, darker as you scroll). Aurora and noise divs no longer use `-z-10`; they're absolutely positioned inside the wrapper and naturally render on top of the wrapper's bg. Content wrapped in `<div className="relative">` to sit above the decorative layers.
- `components/landing/Pillars.tsx` and `HowItWorks.tsx` — same `-z-10` bug fix on their local accent washes. Wrapped in `overflow-hidden` so the orb doesn't bleed past the section.

**Visibility dialed up** (in addition to the bug fix):
- Page-wide aurora opacity: **3-5% → 8-12%** (yellow 12%, teal 10%, purple 10%, bottom yellow-500 8%).
- Aurora orbs now use the existing `animate-float-soft` / `-2` / `-3` animations — they slowly drift with staggered timing.
- Noise opacity: **4% → 8%**, and bumped the SVG noise alpha from 0.4 to 0.6 — makes the grain noticeable on dark surfaces.
- Local section accents (Pillars purple, HowItWorks teal): **4% → 8%**.

### Why it'll be visible now
Before: aurora at 4% opacity, then hidden by `-z-10` behind the wrapper's solid `#050505`. Net visible aurora: 0%.

After: aurora at 8-12% opacity, sitting on top of a radial gradient that's already slightly lighter at the top. Plus 8% noise grain blending on top. Plus drift animation. Visible color casts (yellow upper-right, teal mid-left, purple mid-right, yellow grounding at bottom) and a tactile film-grain feel.

**Hard reload required** — Next.js hot-reload sometimes misses CSS changes when keyframes get added. `Cmd+Shift+R` (or `Ctrl+Shift+R`) on the landing page if changes don't appear immediately.

**Verified:** typecheck clean.

---

## 2026-05-11 — Session: turning `wealthflow-defense.pptx` into a defense-ready deck

### User question
*"So I have the wealthflow-defense.pptx — what do I do to make it a PFA-worth presentation?"* — a `~$wealthflow-defense.pptx` lock file is present, meaning the deck is currently open in PowerPoint.

### Advice given (not yet executed by Claude — user-side TODOs)
The slide-by-slide plan already exists in `docs/PRESENTATION.md` (18 slides, demo script, 10 anticipated Q&A). The remaining work is **execution**, in this order:

1. **Audit deck vs. plan** — open each slide, verify the Show/Say content from `docs/PRESENTATION.md` is actually in the pptx.
2. **Produce visual assets** (the deck is empty without these):
   - 6 Mermaid diagrams from `docs/ARCHITECTURE.md` §§ 1+4 and `docs/PIPELINES.md` §§ 1–4 → render at mermaid.live → screenshot → paste into slides 7–12.
   - Screenshots: `/portfolio` full page, `/stocks/AAPL` mid-chat, optionally Inngest dashboard.
   - One code snippet worth showing: the `executeTrade` MongoDB transaction block on slide 9.
3. **Defense-proof the demo**: seed the demo account per `docs/PRESENTATION.md § Pre-flight checklist`, time the demo end-to-end ≥3× targeting 5–7 min, and capture backup screenshots of every demo step in a hidden-slides section so a Wi-Fi drop or crash does not kill the live demo.
4. **Originality framing (slide 14 is the political one)** — make sure the JSM Signalist tutorial baseline vs. original-work split is unambiguous, and rehearse Q1 until reflex.
5. **Rehearse Q&A** — all 10 in `docs/PRESENTATION.md § Anticipated jury Q&A`, especially Q1 (tutorial), Q2 (atomicity), Q4 (sentiment accuracy), Q8 (no tests).

### Offered next steps (awaiting user pick)
- (a) Generate Mermaid PNGs locally to skip the mermaid.live round-trip.
- (b) Write speaker-notes scripts for the slide notes pane.
- (c) Draft slide 14 originality table with concrete file/line counts pulled from the repo.

### Open
User has not yet picked a follow-up; pptx not edited by Claude this turn.

---

## 2026-05-11 — Session: UML diagrams for PFA defense

### User asked
Create use case, class, and sequence diagrams for the project (to be included in the PFA defense deck).

### Delivered
New file: `docs/UML.md` — single consolidated doc with three diagram families, all in Mermaid (with a PlantUML alternative for the use case diagram if strict UML notation is required).

**§ 1 — Use case diagram** (Mermaid flowchart + PlantUML alternative)
- Three actors: Visitor, Authenticated User, Inngest Scheduler — plus three external systems (Finnhub, Gemini, Gmail) drawn as secondary actors.
- 28 use cases: 4 for Visitor (auth), 17 for User (search, watchlist, alerts, trade, portfolio, leaderboard, chatbot, sentiment, sign out), 7 for Scheduler (the 7 Inngest crons).
- Includes the `Sign up → Send welcome email` event-driven include.

**§ 2 — Class diagram** (Mermaid classDiagram)
- 8 domain entities matching the Mongoose models, with attributes and key indexes annotated.
- Service layer: 7 `<<service>>` classes (one per `lib/actions/*.ts` file) with their public methods listed.
- 3 `<<adapter>>` classes for external boundaries (Finnhub, Gemini, Mailer) + 1 `<<scheduler>>` class (InngestFunctions).
- Solid arrows for entity associations + multiplicities, dashed for uses-a relationships service→entity and service→adapter.

**§ 3 — Sequence diagrams**
- 3 new diagrams in this file: sign-up + welcome email (event-driven), add to watchlist (toggle pattern), create alert (price + sentiment validation), hourly price-alert check cron.
- 4 referenced from existing `docs/PIPELINES.md`: trade execution, news sentiment cron, weekly AI recap, chatbot grounding.
- Index table at the top lists all 8 with the source location.

**§ 4 — Rendering for slides**
- Two paths to PNG: mermaid.live (paste + export) or `@mermaid-js/mermaid-cli` (`mmdc -i docs/UML.md -o screenshots/uml/uml.png -t dark -b transparent`).
- Suggested deck placement: new slides 7b (use cases) and 8b (class diagram) inserted between existing architecture and data-model slides; the 4 extra sequence diagrams kept as hidden appendix slides for Q&A backup.

### Files touched
- `docs/UML.md` (new)
- `PFA_LOG.md` (this entry)

### Open
- User has not yet picked up the earlier (a)/(b)/(c) offers: local Mermaid PNG rendering, speaker notes script, slide 14 originality table with file/line counts. UML diagrams happen to satisfy part of (a) if rendered via `mmdc`.
