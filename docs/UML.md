# UML Diagrams — WealthFlow

UML modeling of WealthFlow at three levels of abstraction:

1. **[Use case diagram](#1-use-case-diagram)** — who uses the system and for what.
2. **[Class diagram](#2-class-diagram)** — domain entities + service layer.
3. **[Sequence diagrams](#3-sequence-diagrams)** — how the eight most important flows execute over time.

All diagrams are written in **Mermaid** so they render natively on GitHub *and* can be exported to PNG via <https://mermaid.live> for inclusion in `wealthflow-defense.pptx`. See [§ 4 — Rendering for slides](#4-rendering-for-slides) at the bottom.

> Mermaid does not natively support UML use case notation (the stick figure + ellipse style). The use case diagram below uses a `flowchart`-based convention that conveys the same semantics and renders cleanly. If your PFA jury requires *strict* UML notation, regenerate that one diagram in PlantUML (a `.puml` source is provided as an alternative in [§ 1.1](#11-strict-uml-use-case-plantuml-alternative)).

---

## 1. Use case diagram

Actors (left and right) interact with the use cases (centre, rounded rectangles). Dashed `<<include>>` arrows show mandatory inclusion; the **Inngest Scheduler** is a *time-driven* (non-human) actor that triggers cron-based use cases.

```mermaid
flowchart LR
    classDef actor fill:#FDD458,stroke:#000,stroke-width:2px,color:#000,font-weight:bold
    classDef uc fill:#1f2937,stroke:#FDD458,color:#fff,rx:30,ry:30
    classDef ext fill:#6b7280,stroke:#000,color:#fff,font-weight:bold

    %% Actors
    Visitor((Visitor)):::actor
    User((Authenticated<br/>User)):::actor
    Scheduler((Inngest<br/>Scheduler)):::actor
    Finnhub[Finnhub API]:::ext
    Gemini[Google Gemini]:::ext
    Gmail[Gmail SMTP]:::ext

    %% Visitor use cases
    UC1(Sign up):::uc
    UC2(Sign in):::uc
    UC3(Request password reset):::uc
    UC4(Reset password):::uc

    Visitor --- UC1
    Visitor --- UC2
    Visitor --- UC3
    Visitor --- UC4

    %% Authenticated user use cases
    UC5(Search stocks):::uc
    UC6(View dashboard):::uc
    UC7(View stock detail):::uc
    UC8(Add to watchlist):::uc
    UC9(Remove from watchlist):::uc
    UC10(Create price alert):::uc
    UC11(Create sentiment alert):::uc
    UC12(Delete alert):::uc
    UC13(Execute trade<br/>buy / sell):::uc
    UC14(View portfolio):::uc
    UC15(View equity curve):::uc
    UC16(View sector allocation):::uc
    UC17(View transactions):::uc
    UC18(View leaderboard):::uc
    UC19(Ask AI chatbot):::uc
    UC20(View sentiment timeline):::uc
    UC21(Sign out):::uc

    User --- UC5
    User --- UC6
    User --- UC7
    User --- UC8
    User --- UC9
    User --- UC10
    User --- UC11
    User --- UC12
    User --- UC13
    User --- UC14
    User --- UC15
    User --- UC16
    User --- UC17
    User --- UC18
    User --- UC19
    User --- UC20
    User --- UC21

    %% Scheduler-driven use cases (cron)
    UC22(Send welcome email):::uc
    UC23(Send daily news summary<br/>cron 12:00 UTC):::uc
    UC24(Score news sentiment<br/>cron 13:00 UTC):::uc
    UC25(Snapshot portfolios<br/>cron 22:00 UTC):::uc
    UC26(Check price alerts<br/>cron hourly):::uc
    UC27(Check sentiment alerts<br/>cron hourly):::uc
    UC28(Send weekly AI recap<br/>cron Mon 14:00 UTC):::uc

    Scheduler --- UC22
    Scheduler --- UC23
    Scheduler --- UC24
    Scheduler --- UC25
    Scheduler --- UC26
    Scheduler --- UC27
    Scheduler --- UC28

    %% Includes / external integrations
    UC5 -.->|uses| Finnhub
    UC7 -.->|uses| Finnhub
    UC13 -.->|live quote| Finnhub
    UC14 -.->|live prices| Finnhub
    UC19 -.->|grounded LLM call| Gemini
    UC19 -.->|context| Finnhub
    UC23 -.-> Finnhub
    UC23 -.-> Gemini
    UC23 -.-> Gmail
    UC24 -.-> Finnhub
    UC24 -.-> Gemini
    UC25 -.-> Finnhub
    UC26 -.-> Finnhub
    UC26 -.-> Gmail
    UC27 -.-> Gmail
    UC28 -.-> Finnhub
    UC28 -.-> Gemini
    UC28 -.-> Gmail
    UC22 -.-> Gmail
    UC1 -.->|triggers| UC22
```

**Reading the diagram:**

- **Three actors:**
  - *Visitor* — unauthenticated, can only do the auth-related use cases.
  - *Authenticated User* — the post-sign-in surface (17 use cases).
  - *Inngest Scheduler* — system actor representing the time-driven background jobs (7 cron-triggered use cases).
- **External systems** are drawn as rectangles on the right. Dashed arrows are "uses" relations (a use case calls into the external service).
- The *Sign up → Send welcome email* dependency is shown as an event-driven include (`app/user.created` event in Inngest).

### 1.1 Strict UML use case (PlantUML alternative)

If your defense requires canonical UML notation (stick figures, ovals), use this PlantUML source instead. Render at <https://www.plantuml.com/plantuml> or via the PlantUML CLI.

```plantuml
@startuml
left to right direction
skinparam packageStyle rectangle

actor "Visitor"             as Visitor
actor "Authenticated User"  as User
actor "Inngest Scheduler"   as Cron
actor "Finnhub"             as Finnhub
actor "Google Gemini"       as Gemini
actor "Gmail SMTP"          as Gmail

rectangle WealthFlow {
  usecase "Sign up"                  as UC1
  usecase "Sign in"                  as UC2
  usecase "Request password reset"   as UC3
  usecase "Reset password"           as UC4

  usecase "Search stocks"            as UC5
  usecase "View dashboard"           as UC6
  usecase "View stock detail"        as UC7
  usecase "Add to watchlist"         as UC8
  usecase "Remove from watchlist"    as UC9
  usecase "Create price alert"       as UC10
  usecase "Create sentiment alert"   as UC11
  usecase "Delete alert"             as UC12
  usecase "Execute trade"            as UC13
  usecase "View portfolio"           as UC14
  usecase "View equity curve"        as UC15
  usecase "View sector allocation"   as UC16
  usecase "View transactions"        as UC17
  usecase "View leaderboard"         as UC18
  usecase "Ask AI chatbot"           as UC19
  usecase "View sentiment timeline"  as UC20
  usecase "Sign out"                 as UC21

  usecase "Send welcome email"       as UC22
  usecase "Send daily news summary"  as UC23
  usecase "Score news sentiment"     as UC24
  usecase "Snapshot portfolios"      as UC25
  usecase "Check price alerts"       as UC26
  usecase "Check sentiment alerts"   as UC27
  usecase "Send weekly AI recap"     as UC28
}

Visitor --> UC1
Visitor --> UC2
Visitor --> UC3
Visitor --> UC4

User --> UC5
User --> UC6
User --> UC7
User --> UC8
User --> UC9
User --> UC10
User --> UC11
User --> UC12
User --> UC13
User --> UC14
User --> UC15
User --> UC16
User --> UC17
User --> UC18
User --> UC19
User --> UC20
User --> UC21

Cron --> UC22
Cron --> UC23
Cron --> UC24
Cron --> UC25
Cron --> UC26
Cron --> UC27
Cron --> UC28

UC1  ..> UC22 : <<triggers>>
UC5  ..> Finnhub
UC7  ..> Finnhub
UC13 ..> Finnhub
UC14 ..> Finnhub
UC19 ..> Gemini
UC19 ..> Finnhub
UC23 ..> Finnhub
UC23 ..> Gemini
UC23 ..> Gmail
UC24 ..> Finnhub
UC24 ..> Gemini
UC25 ..> Finnhub
UC26 ..> Finnhub
UC26 ..> Gmail
UC27 ..> Gmail
UC28 ..> Finnhub
UC28 ..> Gemini
UC28 ..> Gmail
UC22 ..> Gmail
@enduml
```

---

## 2. Class diagram

Two layers shown together: **domain entities** (Mongoose models, top) and the **service layer** (server-action modules, bottom). Service classes are stereotyped `<<service>>` and external adapters `<<adapter>>`.

```mermaid
classDiagram
    direction LR

    %% =====================
    %% Domain entities (DB)
    %% =====================
    class User {
        +string id
        +string email
        +string name
        +string country
        +string investmentGoals
        +string riskTolerance
        +string preferredIndustry
    }

    class Portfolio {
        +string userId «unique»
        +number cashBalance
        +number initialCash
        +string currency
        +Date createdAt
    }

    class Holding {
        +string userId
        +string symbol
        +string company
        +number quantity
        +number avgCostBasis
        +number realizedPnL
        +Date updatedAt
        --
        index (userId, symbol) unique
    }

    class Transaction {
        +string userId
        +string symbol
        +string company
        +Side side «buy|sell»
        +number quantity
        +number price
        +number totalValue
        +Date executedAt
        --
        index (userId, executedAt desc)
    }

    class PortfolioSnapshot {
        +string userId
        +string date «YYYY-MM-DD»
        +number totalValue
        +number cashBalance
        +number holdingsValue
        +Date createdAt
        --
        index (userId, date) unique
    }

    class Watchlist {
        +string userId
        +string symbol
        +string company
        +Date addedAt
        --
        index (userId, symbol) unique
    }

    class Alert {
        +string userId
        +string symbol
        +string company
        +string alertName
        +AlertCategory alertCategory «price|sentiment»
        +AlertType alertType «upper|lower»
        +number threshold
        +Date createdAt
    }

    class NewsSentiment {
        +string symbol
        +number articleId
        +string headline
        +string source
        +string url
        +Date articleDatetime
        +number sentiment «-1..1»
        +SentimentLabel label «negative|neutral|positive»
        +number confidence
        +Date processedAt
        --
        index (symbol, articleId) unique
    }

    %% Relationships
    User "1" --> "0..1" Portfolio          : owns
    User "1" --> "*" Holding               : holds
    User "1" --> "*" Transaction           : executes
    User "1" --> "*" PortfolioSnapshot     : snapshotted daily
    User "1" --> "*" Watchlist             : watches
    User "1" --> "*" Alert                 : configures
    Watchlist "*" ..> "*" NewsSentiment    : scored per symbol

    %% =====================
    %% Service layer
    %% =====================
    class AuthService {
        <<service>>
        +signUpWithEmail(data) Promise
        +signInWithEmail(data) Promise
        +forgotPassword(email) Promise
        +resetPassword(token, pwd) Promise
        +signOut() Promise
    }

    class WatchlistService {
        <<service>>
        +toggleWatchlist(symbol, company) Promise
        +getWatchlistForUser() WatchlistStock[]
        +getWatchlistSymbols() string[]
        +getWatchlistSymbolsByEmail(email) string[]
    }

    class AlertService {
        <<service>>
        +createAlert(data) Promise
        +getUserAlerts() Alert[]
        +deleteAlert(id) Promise
        +deleteAlertById(id) Promise
        +getAllAlertsWithUserEmails() Alert[]
    }

    class PortfolioService {
        <<service>>
        +getOrCreatePortfolio() Portfolio
        +executeTrade(data) TradeResult
        +getHoldingsWithLivePrices() HoldingWithLivePrice[]
        +getPortfolioPageData() PageData
        +getEquityCurve(days) PortfolioSnapshot[]
        +getLeaderboard(limit) LeaderboardEntry[]
        +getTransactionHistory(limit) Transaction[]
        +getTradeContext(symbol) TradeContext
        +getPortfolioWeeklyStats(userId) WeeklyStats
        +snapshotAllPortfolios() SnapshotResult
    }

    class SentimentService {
        <<service>>
        +scoreArticles(symbol, articles) ScoreResult
        +processSentimentForSymbol(symbol) Result
        +processWatchlistSentiment() BatchResult
        +getSentimentTimeline(symbol, days) Point[]
        +getSentimentSummary(symbol, days) Summary
    }

    class ChatService {
        <<service>>
        +askStockQuestion(input) Answer
    }

    class RecapService {
        <<service>>
        +buildWeeklyRecapContext(input) WeeklyRecapContext
    }

    class FinnhubAdapter {
        <<adapter>>
        +getStockQuote(symbol) QuoteData
        +getCompanyProfile(symbol) Profile
        +getNews(symbols?) Article[]
        +getCompanyLogos(symbols) Map
        +searchStocks(query) Match[]
    }

    class GeminiAdapter {
        <<adapter>>
        +askGemini(req) string
        +scoreSentiment(prompt, schema) JSON
    }

    class MailerAdapter {
        <<adapter>>
        +sendWelcomeEmail(...)
        +sendNewsSummaryEmail(...)
        +sendPriceAlertEmail(...)
        +sendSentimentAlertEmail(...)
        +sendWeeklyRecapEmail(...)
    }

    class InngestFunctions {
        <<scheduler>>
        +sendSignUpEmail (event: user.created)
        +sendDailyNewsSummary (cron 0 12 * * *)
        +processNewsSentiment (cron 0 13 * * *)
        +recordPortfolioSnapshots (cron 0 22 * * *)
        +checkPriceAlerts (cron 0 * * * *)
        +checkSentimentAlerts (cron 0 * * * *)
        +sendWeeklyRecap (cron 0 14 * * 1)
    }

    %% Service → entity usage (uses-a)
    AuthService ..> User                     : creates / authenticates
    WatchlistService ..> Watchlist           : CRUD
    AlertService ..> Alert                   : CRUD
    PortfolioService ..> Portfolio           : reads/updates
    PortfolioService ..> Holding             : upserts (tx)
    PortfolioService ..> Transaction         : inserts (tx)
    PortfolioService ..> PortfolioSnapshot   : daily upsert
    SentimentService ..> NewsSentiment       : insertMany
    ChatService ..> Watchlist                : context only

    %% Service → adapter usage
    PortfolioService ..> FinnhubAdapter
    SentimentService ..> FinnhubAdapter
    SentimentService ..> GeminiAdapter
    ChatService ..> FinnhubAdapter
    ChatService ..> GeminiAdapter
    RecapService ..> FinnhubAdapter
    RecapService ..> SentimentService

    %% Scheduler → services
    InngestFunctions ..> SentimentService    : processWatchlistSentiment
    InngestFunctions ..> PortfolioService    : snapshotAllPortfolios
    InngestFunctions ..> AlertService        : getAllAlertsWithUserEmails
    InngestFunctions ..> RecapService        : buildWeeklyRecapContext
    InngestFunctions ..> MailerAdapter
    InngestFunctions ..> GeminiAdapter
```

**Reading the diagram:**

- **Solid arrows with multiplicities** are persistent associations from the data model (e.g., `User 1 → 0..1 Portfolio`).
- **Dashed arrows (`..>`)** are *uses* relationships: a service depends on a class to do its job, but doesn't *own* the lifecycle.
- **`<<service>>`** classes are the server-action modules in `lib/actions/`. Each maps 1-1 to a file:
  - `AuthService` → `auth.actions.ts`
  - `WatchlistService` → `watchlist.actions.ts`
  - `AlertService` → `alert.actions.ts`
  - `PortfolioService` → `portfolio.actions.ts`
  - `SentimentService` → `sentiment.actions.ts`
  - `ChatService` → `chat.actions.ts`
  - `RecapService` → `recap.actions.ts`
- **`<<adapter>>`** classes wrap external APIs and present a domain-friendly interface (Hexagonal/Ports-and-Adapters style).
- **`<<scheduler>>`** `InngestFunctions` is the orchestrator for all background work — it composes services and adapters but contains minimal business logic itself.

---

## 3. Sequence diagrams

Eight flows total. Four are already in [`PIPELINES.md`](PIPELINES.md) (the most technically deep ones — referenced below to avoid duplication). Three new ones cover the everyday user flows, and one covers the price-alert cron.

### Index

| # | Flow | Source |
|---|---|---|
| 3.1 | Sign-up → welcome email (event-driven) | this file |
| 3.2 | Add to watchlist | this file |
| 3.3 | Create alert (price or sentiment) | this file |
| 3.4 | Trade execution (atomic MongoDB transaction) | [`PIPELINES.md` § 1](PIPELINES.md#1-trade-execution--atomic-with-mongodb-transaction) |
| 3.5 | News sentiment cron + Gemini structured output | [`PIPELINES.md` § 2](PIPELINES.md#2-news-sentiment-pipeline--daily-cron--ai-scoring) |
| 3.6 | Weekly AI recap email | [`PIPELINES.md` § 3](PIPELINES.md#3-weekly-ai-recap-email--multi-step-inngest-workflow) |
| 3.7 | Stock chatbot grounding (request-scoped AI) | [`PIPELINES.md` § 4](PIPELINES.md#4-stock-chatbot-grounding--request-scoped-ai) |
| 3.8 | Hourly price-alert check | this file |

---

### 3.1 Sign-up → welcome email (event-driven)

User signs up. Better-auth creates the user, then the server action fires an `app/user.created` Inngest event. Inngest picks up the event asynchronously, generates a personalized welcome email via Gemini, and sends it via Gmail SMTP. The user is **not** kept waiting on the email.

```mermaid
sequenceDiagram
    autonumber
    actor Visitor
    participant Form as SignUpForm<br/>(client)
    participant Action as signUpWithEmail<br/>(server action)
    participant Auth as better-auth<br/>(MongoDB adapter)
    participant Mongo as MongoDB
    participant Inngest as Inngest
    participant Gemini as step.ai.gemini
    participant Mail as Gmail SMTP

    Visitor->>Form: Fill form + submit
    Form->>Action: { email, password, fullName, country, ... }
    Action->>Auth: auth.api.signUpEmail(...)
    Auth->>Mongo: insert User
    Mongo-->>Auth: { id, email, ... }
    Auth-->>Action: { success, user }

    Action->>Inngest: send("app/user.created", { user })
    Note over Inngest: returns immediately —<br/>email is async
    Action-->>Form: redirect to /

    rect rgb(35, 50, 75)
        Note over Inngest,Mail: Inngest worker (separate process)
        Inngest->>Gemini: step.ai.infer("welcome-email", {<br/>  user profile,<br/>  prompt: personalized welcome<br/>})
        Gemini-->>Inngest: HTML body
        Inngest->>Mail: sendWelcomeEmail(user, html)
        Mail-->>Inngest: 250 OK
    end
```

**Why event-driven and not synchronous:**
A signed-up user doesn't care when the welcome email lands — they care about getting into the app fast. Decoupling shaves ~3s off the perceived sign-up latency and means a flaky Gemini API can never block account creation.

---

### 3.2 Add to watchlist

Simplest mutation in the system, but illustrative because it shows the **toggle** pattern — the same action both adds and removes, deciding from the current DB state.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Button as WatchlistButton<br/>(client)
    participant Action as toggleWatchlist<br/>(server action)
    participant Auth as auth.getSession
    participant Mongo as MongoDB

    User->>Button: Click star icon on AAPL card
    Button->>Action: { symbol: "AAPL", company: "Apple Inc." }
    Action->>Auth: get current session
    Auth-->>Action: { user: { id, email } }

    Action->>Mongo: findOne(Watchlist, { userId, symbol })
    Mongo-->>Action: result

    alt already in watchlist
        Action->>Mongo: deleteOne({ userId, symbol })
        Action-->>Button: { added: false }
        Button->>User: Empty star, toast "Removed"
    else not in watchlist
        Action->>Mongo: insertOne({ userId, symbol, company, addedAt })
        Note over Mongo: unique (userId, symbol)<br/>prevents duplicates on race
        Action-->>Button: { added: true }
        Button->>User: Filled star, toast "Added"
    end

    Action->>Action: revalidatePath('/watchlist')
```

---

### 3.3 Create alert (price or sentiment)

Same flow shape, two categories. Validation rejects nonsense thresholds (negative price, sentiment outside `[-1, 1]`).

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Modal as AlertModal<br/>(client)
    participant Action as createAlert<br/>(server action)
    participant Mongo as MongoDB

    User->>Modal: Open modal on stock page
    User->>Modal: Pick category (price/sentiment),<br/>direction (upper/lower), threshold
    Modal->>Action: { symbol, company, alertName,<br/>  alertCategory, alertType, threshold }

    Action->>Action: Auth check
    Action->>Action: Validate threshold per category
    Note over Action: price → threshold > 0<br/>sentiment → -1 ≤ threshold ≤ 1

    alt validation fails
        Action-->>Modal: { success: false, error }
        Modal->>User: Inline error
    else valid
        Action->>Mongo: insertOne(Alert, { ... })
        Mongo-->>Action: { _id }
        Action->>Action: revalidatePath('/watchlist')
        Action-->>Modal: { success: true }
        Modal->>User: Toast "Alert created"
    end
```

---

### 3.4 – 3.7 (referenced)

These four are the headline pipelines and already documented in detail in [`PIPELINES.md`](PIPELINES.md). Copy them into the deck as-is.

- **3.4** — Trade execution (atomic MongoDB transaction): [`PIPELINES.md` § 1](PIPELINES.md#1-trade-execution--atomic-with-mongodb-transaction)
- **3.5** — News sentiment pipeline (daily cron + Gemini structured output): [`PIPELINES.md` § 2](PIPELINES.md#2-news-sentiment-pipeline--daily-cron--ai-scoring)
- **3.6** — Weekly AI recap email (multi-step Inngest workflow): [`PIPELINES.md` § 3](PIPELINES.md#3-weekly-ai-recap-email--multi-step-inngest-workflow)
- **3.7** — Stock chatbot grounding (request-scoped AI): [`PIPELINES.md` § 4](PIPELINES.md#4-stock-chatbot-grounding--request-scoped-ai)

---

### 3.8 Hourly price-alert check

Cron fires every hour. Symbols are deduplicated across all users before hitting Finnhub. Triggered alerts fire emails *and* delete themselves so they never fire twice.

```mermaid
sequenceDiagram
    autonumber
    participant Cron as Inngest Cron<br/>0 * * * *
    participant Job as checkPriceAlerts
    participant Mongo as MongoDB
    participant Finnhub as Finnhub /quote
    participant Mail as Gmail SMTP

    Cron->>Job: trigger
    Job->>Mongo: getAllAlertsWithUserEmails<br/>where alertCategory='price'
    Mongo-->>Job: [{ alertId, userId, email, symbol,<br/>  alertType, threshold }, ...]

    Job->>Job: Set of unique symbols across all users

    loop for each unique symbol
        Job->>Finnhub: GET /quote?symbol=X
        Finnhub-->>Job: { c: currentPrice, ... }
    end

    loop for each alert
        Job->>Job: matches = (upper && price ≥ threshold)<br/>            || (lower && price ≤ threshold)
        alt alert triggered
            Job->>Mail: sendPriceAlertEmail(user, symbol,<br/>  threshold, currentPrice)
            Mail-->>Job: 250 OK
            Job->>Mongo: deleteAlertById(alertId)
            Note over Mongo: Alert is one-shot —<br/>deletion guarantees no double-send
        else no trigger
            Note over Job: skip
        end
    end

    Job-->>Cron: { checked: N, fired: M }
```

**Why delete instead of "fired" flag:**
Cheaper read path on subsequent cron runs (only live alerts in the query), no migration when we add a 3rd alert category, and the email is the audit trail. Users who want a recurring alert can simply re-create it after firing — a deliberate UX choice that mirrors how phone-app stock alerts behave.

---

## 4. Rendering for slides

To get crisp PNGs for `wealthflow-defense.pptx`, two options.

### Option A — mermaid.live (no install)

1. Open <https://mermaid.live>.
2. Paste a single Mermaid block (one of the seven Mermaid diagrams above, including the inner content between the triple backticks).
3. *Actions* → *PNG* (or SVG). Save to `screenshots/uml/<name>.png`.
4. Insert into PowerPoint (`Insert → Pictures`).

### Option B — local CLI (Mermaid CLI)

```bash
npm i -g @mermaid-js/mermaid-cli
# Render every Mermaid block in this doc to PNG
mmdc -i docs/UML.md -o screenshots/uml/uml.png -t dark -b transparent
```

`-t dark` matches the WealthFlow dark theme; `-b transparent` lets the PowerPoint slide background show through.

### Suggested slide placement

| Slide | Diagram |
|---|---|
| 7 — Architecture | system flowchart (`ARCHITECTURE.md § 1`) |
| 7b *(new)* — Use cases | **§ 1 above** |
| 8 — Data model | ER (`ARCHITECTURE.md § 4`) |
| 8b *(new)* — Class diagram | **§ 2 above** |
| 9 — Trade execution | `PIPELINES.md § 1` |
| 10 — News sentiment | `PIPELINES.md § 2` |
| 11 — Weekly recap | `PIPELINES.md § 3` |
| 12 — Chatbot | `PIPELINES.md § 4` |
| (appendix slides) | **§ 3.1, 3.2, 3.3, 3.8** for Q&A backup |

If the jury asks "show me X" during Q&A, having the four extra sequence diagrams ready as hidden slides is cheap insurance.
