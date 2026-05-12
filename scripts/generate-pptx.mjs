// Generates wealthflow-defense.pptx — full sprint-based deck for the PFA defense.
// Run: node scripts/generate-pptx.mjs

import pptxgen from "pptxgenjs";

const pres = new pptxgen();

pres.defineLayout({ name: "LAYOUT_WIDE", width: 13.33, height: 7.5 });
pres.layout = "LAYOUT_WIDE";

pres.title = "WealthFlow — PFA Defense";
pres.author = "Mahdi Elfaleh";
pres.company = "WealthFlow";
pres.subject = "PFA Defense — AI-augmented stock research";

// Brand palette (matches globals.css custom theme — no leading # for pptxgenjs)
const C = {
    bgDark:        "050505",
    surface:       "141414",
    surfaceRaised: "212328",
    border:        "30333A",
    textBody:      "CCDADC",
    textHeading:   "FFFFFF",
    textMuted:     "9095A1",
    yellow:        "FDD458",
    yellowDark:    "E8BA40",
    teal:          "0FEDBE",
    red:           "FF495B",
    purple:        "D13BFF",
    blue:          "5862FF",
    orange:        "FF8243",
};

// =====================================================================
// HELPERS
// =====================================================================

function addFooter(s) {
    s.addText("WealthFlow", {
        x: 0.6, y: 7.05, w: 3, h: 0.3,
        fontSize: 9, color: C.textMuted, fontFace: "Calibri",
    });
    s.addText("PFA Defense · 2026", {
        x: 9.73, y: 7.05, w: 3, h: 0.3,
        fontSize: 9, color: C.textMuted, fontFace: "Calibri", align: "right",
    });
}

function newSlide(title, opts = {}) {
    const s = pres.addSlide();
    s.background = { color: C.bgDark };
    if (title) {
        s.addText(title, {
            x: 0.6, y: 0.4, w: 12.13, h: 0.7,
            fontSize: 26, bold: true, color: C.textHeading,
            fontFace: "Calibri",
        });
        s.addShape(pres.ShapeType.rect, {
            x: 0.6, y: 1.13, w: 0.6, h: 0.06,
            fill: { color: C.yellow }, line: { type: "none" },
        });
        if (opts.subtitle) {
            s.addText(opts.subtitle, {
                x: 0.6, y: 1.25, w: 12.13, h: 0.4,
                fontSize: 13, color: C.textMuted, italic: true, fontFace: "Calibri",
            });
        }
    }
    addFooter(s);
    return s;
}

function diagramPlaceholder(s, x, y, w, h, label) {
    s.addShape(pres.ShapeType.rect, {
        x, y, w, h,
        fill: { color: C.surface },
        line: { color: C.border, width: 1, dashType: "dash" },
    });
    s.addText(`📊 ${label}\n\nReplace this box with a screenshot of the\nMermaid diagram from mermaid.live`, {
        x, y, w, h,
        fontSize: 13, color: C.textMuted, italic: true,
        align: "center", valign: "middle", fontFace: "Calibri",
    });
}

function pill(s, x, y, w, h, text, fillColor, textColor = "000000") {
    s.addShape(pres.ShapeType.roundRect, {
        x, y, w, h,
        fill: { color: fillColor },
        line: { type: "none" },
        rectRadius: 0.1,
    });
    s.addText(text, {
        x, y, w, h,
        fontSize: 10, bold: true, color: textColor,
        fontFace: "Calibri", align: "center", valign: "middle",
    });
}

function techBadge(s, x, y, label, color) {
    const w = Math.max(0.9, label.length * 0.11 + 0.3);
    s.addShape(pres.ShapeType.roundRect, {
        x, y, w, h: 0.32,
        fill: { color: C.surface },
        line: { color, width: 1 },
        rectRadius: 0.06,
    });
    s.addText(label, {
        x, y, w, h: 0.32,
        fontSize: 10, color, fontFace: "Calibri",
        align: "center", valign: "middle",
    });
    return w;
}

function sectionLabel(s, x, y, w, label, color = C.yellow) {
    s.addText(label, {
        x, y, w, h: 0.35,
        fontSize: 11, bold: true, color, fontFace: "Calibri",
        charSpacing: 2,
    });
    s.addShape(pres.ShapeType.line, {
        x, y: y + 0.32, w: 0.4, h: 0,
        line: { color, width: 1.5 },
    });
}

function bulletList(s, x, y, w, h, bullets, opts = {}) {
    s.addText(
        bullets.map((b) => ({
            text: b,
            options: { bullet: { code: "25CF" }, color: opts.color || C.textBody, fontSize: opts.fontSize || 12, paraSpaceAfter: 4 },
        })),
        { x, y, w, h, fontFace: "Calibri" }
    );
}

// Renders a "sprint slide" with three columns: Goal/Function, Delivered, Tech.
function sprintSlide({ number, name, status, goal, fn, delivered, tech, notes }) {
    const s = newSlide(`Sprint ${number} — ${name}`);

    // Status pill (Tutorial baseline / Original contribution)
    const isOriginal = status === "original";
    pill(s, 0.6, 1.45, 1.9, 0.32,
        isOriginal ? "ORIGINAL" : "TUTORIAL BASELINE",
        isOriginal ? C.yellow : C.surface,
        isOriginal ? "000000" : C.textMuted,
    );

    // Three-column layout, Y-aligned
    const colY = 2.0;
    const colH = 4.6;
    const cols = [
        { label: "GOAL & FUNCTION", x: 0.6, w: 4.0, color: C.yellow },
        { label: "DELIVERED",       x: 4.7, w: 4.4, color: C.teal   },
        { label: "TECH USED",       x: 9.2, w: 3.5, color: C.purple },
    ];

    cols.forEach((c) => {
        s.addShape(pres.ShapeType.roundRect, {
            x: c.x, y: colY, w: c.w, h: colH,
            fill: { color: C.surface },
            line: { color: C.border, width: 1 },
            rectRadius: 0.08,
        });
        sectionLabel(s, c.x + 0.2, colY + 0.2, c.w - 0.4, c.label, c.color);
    });

    // Column 1: Goal & Function
    s.addText(goal, {
        x: 0.8, y: colY + 0.7, w: 3.6, h: 1.0,
        fontSize: 13, bold: true, color: C.textHeading, fontFace: "Calibri",
        paraSpaceAfter: 4,
    });
    s.addText(fn, {
        x: 0.8, y: colY + 1.85, w: 3.6, h: 2.6,
        fontSize: 11, color: C.textBody, fontFace: "Calibri",
        paraSpaceAfter: 4,
    });

    // Column 2: Delivered (bullet list)
    bulletList(s, 4.9, colY + 0.7, 4.0, 3.8, delivered, { fontSize: 11 });

    // Column 3: Tech badges (wrap)
    const techColors = [C.yellow, C.teal, C.purple, C.blue, C.orange, C.red, C.textMuted];
    let bx = 9.4, by = colY + 0.75;
    tech.forEach((t, i) => {
        const w = techBadge(s, bx, by, t, techColors[i % techColors.length]);
        bx += w + 0.1;
        if (bx > 9.4 + 3.0) {
            bx = 9.4;
            by += 0.42;
        }
    });

    if (notes) s.addNotes(notes);
}

// =====================================================================
// SLIDES
// =====================================================================

// === SLIDE 1: Title ===
{
    const s = pres.addSlide();
    s.background = { color: C.bgDark };
    s.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.15, fill: { color: C.yellow }, line: { type: "none" } });
    s.addText("WealthFlow", { x: 1, y: 2.3, w: 11.33, h: 1.4, fontSize: 80, bold: true, color: C.yellow, fontFace: "Calibri", align: "center" });
    s.addText("AI-augmented stock research and paper trading platform", { x: 1, y: 3.8, w: 11.33, h: 0.7, fontSize: 22, color: C.textBody, fontFace: "Calibri", align: "center" });
    s.addShape(pres.ShapeType.line, { x: 5.5, y: 5.2, w: 2.33, h: 0, line: { color: C.border, width: 1 } });
    s.addText("PFA Defense", { x: 1, y: 5.4, w: 11.33, h: 0.4, fontSize: 16, color: C.textBody, fontFace: "Calibri", align: "center" });
    s.addText("[Your Name]   ·   Supervisor: [Supervisor Name]   ·   [Date]", { x: 1, y: 5.85, w: 11.33, h: 0.4, fontSize: 13, color: C.textMuted, fontFace: "Calibri", align: "center" });
    addFooter(s);
    s.addNotes("Good morning. I'm presenting WealthFlow, an AI-augmented stock research and paper trading platform built across 12 sprints over the past few months.");
}

// === SLIDE 2: Agenda ===
{
    const s = newSlide("Agenda");
    const items = [
        "The problem & the pitch",
        "Sprint-by-sprint build journey (12 sprints)",
        "Tech stack — deep dive",
        "Architecture & key pipelines",
        "Live demo",
        "Limitations & next steps",
    ];
    items.forEach((text, i) => {
        const y = 1.8 + i * 0.75;
        s.addText(String(i + 1).padStart(2, "0"), { x: 2, y, w: 1.2, h: 0.6, fontSize: 28, bold: true, color: C.yellow, fontFace: "Calibri" });
        s.addText(text, { x: 3.3, y, w: 8, h: 0.6, fontSize: 22, color: C.textBody, fontFace: "Calibri", valign: "middle" });
    });
}

// === SLIDE 3: Problem ===
{
    const s = newSlide("The problem");
    const rows = [
        { tag: "Real brokers", example: "Robinhood, eToro, …", problem: "Real money. Scary for beginners.", color: C.red },
        { tag: "Data sites",   example: "Yahoo Finance, Bloomberg", problem: "Information without practice or AI assistance.", color: C.blue },
        { tag: "Tutorials",    example: "YouTube, courses", problem: "Static. No live data. No learning loop.", color: C.textMuted },
    ];
    rows.forEach((r, i) => {
        const y = 2.1 + i * 1.3;
        s.addShape(pres.ShapeType.roundRect, { x: 1.5, y, w: 10.33, h: 1.05, fill: { color: C.surface }, line: { color: C.border, width: 1 }, rectRadius: 0.08 });
        s.addShape(pres.ShapeType.rect, { x: 1.5, y, w: 0.12, h: 1.05, fill: { color: r.color }, line: { type: "none" } });
        s.addText(r.tag, { x: 1.85, y: y + 0.15, w: 3, h: 0.4, fontSize: 18, bold: true, color: C.textHeading, fontFace: "Calibri" });
        s.addText(r.example, { x: 1.85, y: y + 0.55, w: 3, h: 0.4, fontSize: 12, color: C.textMuted, italic: true, fontFace: "Calibri" });
        s.addText(r.problem, { x: 5, y: y + 0.3, w: 6.5, h: 0.5, fontSize: 16, color: C.textBody, fontFace: "Calibri", valign: "middle" });
    });
    s.addText("Beginners need a low-stakes environment that combines real market data with AI guidance and immediate feedback.", { x: 1.5, y: 6.3, w: 10.33, h: 0.5, fontSize: 14, italic: true, color: C.yellow, fontFace: "Calibri", align: "center" });
    s.addNotes("There's a gap between learning about markets and risking real money. Beginners need a low-stakes environment that combines real market data with AI guidance and immediate feedback.");
}

// === SLIDE 4: Pitch ===
{
    const s = newSlide("WealthFlow — the pitch");
    s.addText("Paper-trade real markets with $100k of virtual cash, with an AI that explains what's happening and watches the news for you.", { x: 1.5, y: 2.5, w: 10.33, h: 2.5, fontSize: 28, bold: true, color: C.textHeading, fontFace: "Calibri", align: "center", valign: "middle" });
    s.addShape(pres.ShapeType.line, { x: 5, y: 5.4, w: 3.33, h: 0, line: { color: C.yellow, width: 3 } });
    s.addText("Brokerage simulator + research terminal + AI assistant — in one product.", { x: 1.5, y: 5.7, w: 10.33, h: 0.5, fontSize: 16, italic: true, color: C.textBody, fontFace: "Calibri", align: "center" });
    s.addNotes("WealthFlow combines three things that usually live in three different products: a brokerage simulator, a research terminal, and an AI assistant.");
}

// === SLIDE 5: Four pillars ===
{
    const s = newSlide("Four pillars, one workspace");
    const pillars = [
        { title: "Markets & research", body: "• Live quotes (Finnhub)\n• TradingView charts\n• Search 10,000+ tickers\n• Watchlist\n• Daily AI news email", color: C.blue },
        { title: "Paper trading",      body: "• $100k virtual cash\n• Atomic trades (Mongo tx)\n• Equity curve\n• Sector allocation\n• Multi-user leaderboard", color: C.yellow },
        { title: "AI assistant",       body: "• Per-stock chatbot\n• News sentiment timeline\n• Sentiment-shift alerts\n• Weekly recap email\n• Powered by Gemini", color: C.purple },
        { title: "Alerts & auth",      body: "• Email/password sign-up\n• Investment profile\n• Price alerts (hourly)\n• Sentiment alerts (hourly)\n• Forgot password flow", color: C.teal },
    ];
    pillars.forEach((p, i) => {
        const x = 0.6 + i * 3.13;
        const y = 1.9;
        s.addShape(pres.ShapeType.roundRect, { x, y, w: 2.93, h: 4.5, fill: { color: C.surface }, line: { color: C.border, width: 1 }, rectRadius: 0.1 });
        s.addShape(pres.ShapeType.rect, { x, y, w: 2.93, h: 0.06, fill: { color: p.color }, line: { type: "none" } });
        s.addText(p.title, { x: x + 0.2, y: y + 0.2, w: 2.53, h: 0.5, fontSize: 16, bold: true, color: C.textHeading, fontFace: "Calibri" });
        s.addText(p.body, { x: x + 0.2, y: y + 0.75, w: 2.53, h: 3.55, fontSize: 11, color: C.textBody, fontFace: "Calibri", paraSpaceAfter: 4 });
    });
    s.addText("Behind these four pillars: a single Next.js app + 7 background jobs on Inngest.", { x: 0.6, y: 6.5, w: 12.13, h: 0.4, fontSize: 14, color: C.textMuted, italic: true, align: "center", fontFace: "Calibri" });
}

// === SLIDE 6: Sprint roadmap ===
{
    const s = newSlide("Sprint roadmap", { subtitle: "12 sprints — 7 tutorial baseline, 5 original" });
    const sprints = [
        { n: 1,  name: "Header & layout",          status: "tut" },
        { n: 2,  name: "Dashboard + TradingView",  status: "tut" },
        { n: 3,  name: "Auth UI",                  status: "tut" },
        { n: 4,  name: "DB & Mongoose",            status: "tut" },
        { n: 5,  name: "Auth logic + welcome AI",  status: "tut" },
        { n: 6,  name: "Daily news AI cron",       status: "tut" },
        { n: 7,  name: "Stock search",             status: "tut" },
        { n: 8,  name: "Paper trading & analytics",status: "orig" },
        { n: 9,  name: "AI investment assistant",  status: "orig" },
        { n: 10, name: "Documentation",            status: "orig" },
        { n: 11, name: "Marketing landing page",   status: "orig" },
        { n: 12, name: "Defense prep",             status: "orig" },
    ];
    // Two rows of 6
    sprints.forEach((sp, i) => {
        const col = i % 6;
        const row = Math.floor(i / 6);
        const x = 0.6 + col * 2.1;
        const y = 1.9 + row * 2.4;
        const w = 1.95;
        const h = 2.0;
        const isOrig = sp.status === "orig";
        s.addShape(pres.ShapeType.roundRect, {
            x, y, w, h,
            fill: { color: C.surface },
            line: { color: isOrig ? C.yellow : C.border, width: isOrig ? 2 : 1 },
            rectRadius: 0.08,
        });
        s.addShape(pres.ShapeType.rect, { x, y, w, h: 0.06, fill: { color: isOrig ? C.yellow : C.textMuted }, line: { type: "none" } });
        s.addText(`Sprint ${String(sp.n).padStart(2, "0")}`, {
            x, y: y + 0.25, w, h: 0.35,
            fontSize: 11, color: isOrig ? C.yellow : C.textMuted, bold: true,
            align: "center", fontFace: "Calibri",
        });
        s.addText(sp.name, {
            x: x + 0.15, y: y + 0.65, w: w - 0.3, h: 1.0,
            fontSize: 13, bold: true, color: C.textHeading,
            align: "center", valign: "middle", fontFace: "Calibri",
        });
        if (isOrig) {
            pill(s, x + 0.55, y + h - 0.4, 0.85, 0.25, "ORIGINAL", C.yellow, "000000");
        }
    });
    s.addText("Highlighted in yellow: net-new on top of the JS Mastery tutorial baseline.", {
        x: 0.6, y: 6.85, w: 12.13, h: 0.3,
        fontSize: 11, italic: true, color: C.textMuted, align: "center", fontFace: "Calibri",
    });
    s.addNotes("This is the build journey. Sprints 1 to 7 followed a public tutorial that established auth, watchlist, alerts, daily news, and TradingView widgets. Sprints 8 to 12 are entirely original work — paper trading, AI assistant, docs, landing page, and the defense prep itself.");
}

// =====================================================================
// SPRINT DETAIL SLIDES (12)
// =====================================================================

// SPRINT 1
sprintSlide({
    number: "01",
    name: "Header & base layout",
    status: "tutorial",
    goal: "Bootstrap a styleable app shell.",
    fn: "Set up the Next.js 16 project, the global dark theme, the sticky header with logo + nav, and the responsive container. Establishes the visual foundation everything else sits on.",
    delivered: [
        "Next.js 16 App Router scaffold",
        "Tailwind CSS 4 + custom palette",
        "Geist font integration",
        "components/Header.tsx + NavItems.tsx",
        "Global dark theme in globals.css",
    ],
    tech: ["Next.js 16", "React 19", "Tailwind 4", "TypeScript", "shadcn/ui"],
    notes: "Sprint 1 was about getting a project that looks intentional from the first commit. Next.js 16 with the App Router, Tailwind 4 with a custom dark palette, the brand yellow already in place. The header pattern established here is reused on every protected page.",
});

// SPRINT 2
sprintSlide({
    number: "02",
    name: "Dashboard + TradingView widgets",
    status: "tutorial",
    goal: "Show real markets without building chart code.",
    fn: "Embed TradingView's free widgets to display market overview, stock heatmap, top stories, and market quotes on the dashboard. Saves us months of charting work and gives instant credibility.",
    delivered: [
        "components/TradingViewWidget.tsx",
        "hooks/useTradingViewWidget.ts",
        "Market Overview, Heatmap, Top Stories, Quotes",
        "4 widget configs in lib/constants.ts",
        "Responsive grid layout for the dashboard",
    ],
    tech: ["TradingView", "React Hooks", "iframe sandbox", "Tailwind"],
    notes: "We embed TradingView's free widgets via script tags. Each widget gets its own config object. We don't pay for TradingView and we don't reinvent financial charting — but the dashboard already feels like a real product.",
});

// SPRINT 3
sprintSlide({
    number: "03",
    name: "Authentication UI",
    status: "tutorial",
    goal: "Sign in / Sign up screens with personalization.",
    fn: "Build the sign-up form that captures investment profile (country, risk tolerance, goals, preferred industry). This profile data later powers AI personalization in the welcome email and weekly recap.",
    delivered: [
        "app/(auth)/sign-in/page.tsx",
        "app/(auth)/sign-up/page.tsx",
        "components/forms/InputField, SelectField, CountrySelectField",
        "react-hook-form integration",
        "Auth layout with dashboard preview",
    ],
    tech: ["react-hook-form", "shadcn/ui", "country-flag-icons", "Tailwind"],
    notes: "Sign-up is more than email + password — we capture the user's investment profile here. That data is what makes the welcome email feel personal and what later feeds into the weekly AI recap.",
});

// SPRINT 4
sprintSlide({
    number: "04",
    name: "Database setup",
    status: "tutorial",
    goal: "Reliable connection to MongoDB Atlas.",
    fn: "Configure the MongoDB Atlas connection with caching for Next.js dev hot-reload, IPv4-forced DNS to avoid intermittent IPv6 issues, and the first Mongoose model (Watchlist).",
    delivered: [
        "DATABASE/mongoose.ts (cached connection)",
        "DATABASE/models/watchlist.model.ts",
        "Connection cache via global var",
        "DNS resolver with IPv4 family: 4",
        "scripts/test-db.mjs sanity test",
    ],
    tech: ["MongoDB Atlas", "Mongoose 9", "Node DNS module"],
    notes: "Atlas is a replica set by default — that's important later when we need transactions. We cache the connection because Next.js's dev hot-reload would otherwise leak Mongoose connections on every file save.",
});

// SPRINT 5
sprintSlide({
    number: "05",
    name: "Authentication logic + AI welcome email",
    status: "tutorial",
    goal: "Working auth + first AI integration.",
    fn: "Wire up better-auth with the MongoDB adapter, session-cookie middleware, and the first Inngest function: sending a personalized welcome email generated by Gemini based on the user's investment profile.",
    delivered: [
        "lib/better-auth/auth.ts",
        "Middleware session gate",
        "lib/inngest/{client,functions,prompts}.ts",
        "lib/nodemailer/{index,templates}.ts",
        "sendSignUpEmail Inngest function",
    ],
    tech: ["better-auth", "Inngest", "Google Gemini", "Nodemailer", "Gmail SMTP"],
    notes: "This sprint introduced three new things at once: better-auth for sessions, Inngest as a job runner, and Gemini for AI personalization. The welcome email pulls the user's profile and asks Gemini to write a 2-sentence intro that references their goals and risk tolerance.",
});

// SPRINT 6
sprintSlide({
    number: "06",
    name: "Daily news summary (AI cron)",
    status: "tutorial",
    goal: "Daily personalized market news via email.",
    fn: "Inngest cron at 12:00 UTC: for each user, fetch news for their watchlist symbols (or fall back to general), summarize via Gemini, send a daily digest email. First proper multi-step Inngest workflow.",
    delivered: [
        "sendDailyNewsSummary Inngest function (cron 0 12 * * *)",
        "lib/actions/finnhub.action.ts (getNews)",
        "Round-robin article picker (max 6/user)",
        "NEWS_SUMMARY_EMAIL_PROMPT in prompts.ts",
        "step.ai.gemini for AI inference",
    ],
    tech: ["Inngest cron", "Finnhub /news", "step.ai Gemini", "Nodemailer"],
    notes: "First multi-step Inngest workflow. Step 1 gets users, step 2 collects per-user news, step 3 summarizes via AI per user, step 4 sends emails. Each step is independently retried by Inngest if it fails — that's the durability you don't get from Vercel cron + raw fetch.",
});

// SPRINT 7
sprintSlide({
    number: "07",
    name: "Stock search & detail page",
    status: "tutorial",
    goal: "Find any ticker, see its full profile.",
    fn: "Cmd+K command palette searches Finnhub's symbol API. Stock detail page at /stocks/[symbol] embeds 5 TradingView widgets (symbol info, candle chart, baseline, technical analysis, profile, financials) plus the watchlist toggle.",
    delivered: [
        "components/SearchCommand.tsx (Cmd+K)",
        "app/(root)/stocks/[symbol]/page.tsx",
        "lib/actions/finnhub.action.ts (searchStocks)",
        "components/WatchlistButton.tsx",
        "useDebounce hook",
    ],
    tech: ["Finnhub /search", "cmdk", "TradingView", "React cache()"],
    notes: "Search is debounced + cached via React's cache() helper. Stock detail page embeds 5 different TradingView widgets — we never had to write a candlestick renderer. The Watchlist button uses optimistic UI: it toggles instantly, then reverts on server failure.",
});

// SPRINT 8 — ORIGINAL
sprintSlide({
    number: "08",
    name: "Paper trading & portfolio analytics",
    status: "original",
    goal: "Trade real markets safely with $100k of virtual cash.",
    fn: "9-step build: 4 Mongoose models, 8 server actions including the atomic trade engine (3 writes in a single MongoDB transaction with weighted-average cost basis), portfolio dashboard with live equity curve from daily snapshots, sector allocation donut, multi-user leaderboard.",
    delivered: [
        "Models: Portfolio, Transaction, Holding, PortfolioSnapshot",
        "executeTrade with mongoose.startSession().withTransaction()",
        "/portfolio page: 4 summary cards + equity curve + sector pie",
        "Holdings & transactions tables + per-row sell modal",
        "/leaderboard page (ranked by all-time return %)",
        "recordPortfolioSnapshots Inngest cron (22:00 UTC)",
        "Recharts library integration",
    ],
    tech: ["Mongoose tx", "Recharts", "Inngest cron", "Server Actions", "Finnhub /quote"],
    notes: "First fully-original sprint. The headline feature is the atomic trade — three writes in one MongoDB transaction so a crash mid-flight can't lose money even in paper trading. Equity curve is fed by a daily snapshot cron. Sector pie pulls finnhubIndustry from /profile2, cached 24 hours.",
});

// SPRINT 9 — ORIGINAL
sprintSlide({
    number: "09",
    name: "AI investment assistant",
    status: "original",
    goal: "Per-stock chatbot, news sentiment AI, weekly recap.",
    fn: "9-step build introducing two Gemini integration paths: direct REST for the request-scoped chatbot (low latency), and Inngest's step.ai for the daily sentiment scoring cron (durable retries). Sentiment alerts extend the existing AlertModel with an alertCategory field.",
    delivered: [
        "lib/ai/gemini.ts — direct REST helper with responseSchema",
        "askStockQuestion + StockChatPanel (per-stock chatbot)",
        "NewsSentiment model + idempotent cron (13:00 UTC)",
        "Sentiment timeline chart (Recharts stacked bars)",
        "AlertModel.alertCategory (price | sentiment) — backwards-compatible",
        "checkSentimentAlerts cron + sendSentimentAlertEmail",
        "sendWeeklyRecap cron (Mondays 14:00 UTC)",
    ],
    tech: ["Gemini REST", "step.ai", "responseSchema", "Recharts", "Inngest"],
    notes: "Two integration paths for AI on purpose. Chatbot uses direct REST because the user is staring at a 'Thinking...' spinner — latency wins. Sentiment cron uses step.ai because it's a background job where retries matter more than latency. The weekly recap is the most multi-step workflow in the system: build context per user, call AI per user, send emails in parallel.",
});

// SPRINT 10 — ORIGINAL
sprintSlide({
    number: "10",
    name: "Documentation & Mermaid diagrams",
    status: "original",
    goal: "Make the code defensible, not just functional.",
    fn: "Replace the boilerplate Next.js README with a proper project doc, then write four deeper docs in /docs/ — architecture, pipelines, methodology, presentation outline. Seven Mermaid diagrams for system, data, and the four key pipelines.",
    delivered: [
        "README.md overhaul with originality statement",
        "docs/ARCHITECTURE.md — system + ER diagrams",
        "docs/PIPELINES.md — 4 sequence diagrams",
        "docs/METHODOLOGY.md — tech rationale + limitations",
        "docs/PRESENTATION.md — slide outline + demo + Q&A",
        "PFA_LOG.md — chronological build log (~1000 lines)",
    ],
    tech: ["Markdown", "Mermaid (flowchart, erDiagram, sequenceDiagram)"],
    notes: "Documentation is what makes a PFA defensible. Five docs totalling about a thousand lines, plus seven Mermaid diagrams that render natively on GitHub and screenshot cleanly into the slide deck.",
});

// SPRINT 11 — ORIGINAL
sprintSlide({
    number: "11",
    name: "Marketing landing page",
    status: "original",
    goal: "First impression worthy of the work behind it.",
    fn: "Restructured routing: dashboard moves to /dashboard, public landing at /. New landing has a hero with floating mock product cards over a dashboard preview, scrolling ticker tape, 4-pillar grid, How it works, Stats band, Showcase, CTA, Footer. Page-wide aurora + film-grain noise + drift animations for visual depth.",
    delivered: [
        "Routing restructure (/ public, /dashboard protected)",
        "components/landing/{Hero,Pillars,Showcase,CTA,Footer,Stats,HowItWorks,TickerTape}.tsx",
        "components/LandingHeader.tsx",
        "Floating mock cards (price, sentiment, P&L, chat)",
        "Aurora + noise + drift animations in globals.css",
        "Middleware update for unauth /, /forgot-password, /reset-password",
    ],
    tech: ["Next.js routing", "CSS keyframes", "SVG noise", "Tailwind"],
    notes: "The landing page is what the jury sees first if they browse the repo. Two-column hero with the actual dashboard image plus floating mock cards that preview real product features. Page-wide aurora gives it depth instead of feeling like a flat dark slab.",
});

// SPRINT 12 — ORIGINAL
sprintSlide({
    number: "12",
    name: "Defense prep — slide deck & demo script",
    status: "original",
    goal: "A defensible 25-minute presentation, ready to ship.",
    fn: "Generated this slide deck programmatically via pptxgenjs from the documentation outline, including speaker notes for every slide, a 10-step demo script, and 10 anticipated jury questions with full answers. Zero PowerPoint manual work beyond filling placeholders.",
    delivered: [
        "scripts/generate-pptx.mjs (this script)",
        "wealthflow-defense.pptx (37 slides)",
        "Speaker notes pulled from PRESENTATION.md",
        "Demo script in slide 13's notes",
        "Anticipated Q&A in final slide notes",
        "Pre-defense checklist in PRESENTATION.md",
    ],
    tech: ["pptxgenjs", "Node ESM"],
    notes: "Even the defense prep was treated as a sprint. The deck regenerates from a single Node script — if I update the methodology doc, I can re-run and have an updated slide deck in seconds.",
});

// =====================================================================
// TECH STACK SECTION
// =====================================================================

// === Tech stack overview ===
{
    const s = newSlide("Tech stack at a glance");
    const layers = [
        { label: "Frontend",   items: "Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui · Recharts", color: C.blue   },
        { label: "Backend",    items: "Server Actions · Route Handlers · Middleware (session gate)",                color: C.purple },
        { label: "Auth",       items: "better-auth (MongoDB adapter, session cookies)",                              color: C.teal   },
        { label: "Data",       items: "MongoDB Atlas (replica set → transactions) · Mongoose 9 ODM",                color: C.yellow },
        { label: "Background", items: "Inngest · 7 cron + AI workflow functions · durable retries",                  color: C.orange },
        { label: "AI",         items: "Google Gemini · two paths: direct REST (chat) + step.ai (cron)",              color: C.purple },
        { label: "External",   items: "Finnhub (quotes/news) · TradingView (widgets) · Gmail SMTP (email)",          color: C.textMuted },
    ];
    layers.forEach((l, i) => {
        const y = 1.7 + i * 0.65;
        s.addShape(pres.ShapeType.rect, { x: 1.5, y, w: 0.18, h: 0.5, fill: { color: l.color }, line: { type: "none" } });
        s.addText(l.label, { x: 1.85, y, w: 2.3, h: 0.5, fontSize: 16, bold: true, color: C.textHeading, fontFace: "Calibri", valign: "middle" });
        s.addText(l.items, { x: 4.2, y, w: 7.5, h: 0.5, fontSize: 13, color: C.textBody, fontFace: "Calibri", valign: "middle" });
    });
    s.addNotes("Modern stack — server-first Next.js, MongoDB Atlas, Inngest for background work, Google Gemini for AI. Next 6 slides walk through each tech in detail.");
}

// Tech deep-dive slide template
function techDeepDive({ name, oneLiner, role, technicalities, whyChosen, notes }) {
    const s = newSlide(name, { subtitle: oneLiner });

    // Two-column layout
    const colY = 1.85;
    const colH = 4.85;

    // Left: Role + Why
    s.addShape(pres.ShapeType.roundRect, { x: 0.6, y: colY, w: 6.0, h: colH, fill: { color: C.surface }, line: { color: C.border, width: 1 }, rectRadius: 0.08 });
    sectionLabel(s, 0.8, colY + 0.2, 5.6, "ROLE IN WEALTHFLOW", C.yellow);
    s.addText(role, { x: 0.8, y: colY + 0.7, w: 5.6, h: 1.7, fontSize: 12, color: C.textBody, fontFace: "Calibri", paraSpaceAfter: 4 });
    sectionLabel(s, 0.8, colY + 2.55, 5.6, "WHY WE CHOSE IT", C.teal);
    s.addText(whyChosen, { x: 0.8, y: colY + 3.05, w: 5.6, h: 1.7, fontSize: 12, color: C.textBody, fontFace: "Calibri", paraSpaceAfter: 4 });

    // Right: Technicalities
    s.addShape(pres.ShapeType.roundRect, { x: 6.8, y: colY, w: 5.93, h: colH, fill: { color: C.surface }, line: { color: C.border, width: 1 }, rectRadius: 0.08 });
    sectionLabel(s, 7.0, colY + 0.2, 5.5, "TECHNICAL DETAILS", C.purple);
    bulletList(s, 7.0, colY + 0.7, 5.6, 4.0, technicalities, { fontSize: 11 });

    if (notes) s.addNotes(notes);
}

// === Tech: Next.js 16 ===
techDeepDive({
    name: "Tech deep-dive — Next.js 16",
    oneLiner: "Server-first React framework with App Router, Server Components, and Server Actions",
    role: "Hosts every UI surface (landing, auth, dashboard, /portfolio, /leaderboard, /stocks/[symbol]) and every mutation (server actions). Middleware enforces the session gate on protected routes. Route Handlers expose /api/auth (better-auth) and /api/inngest (cron entry).",
    whyChosen: "Server-first reduces client JS shipped (fast TTI). Server Actions give a type-safe mutation surface without writing a parallel REST layer. Built-in fetch caching with revalidate is exactly what we need for Finnhub responses. RSC + Suspense work cleanly together.",
    technicalities: [
        "App Router file-based routing — (auth), (root) groups for layouts",
        "React Server Components rendered on server, no JS for them",
        "Server Actions: 'use server' boundary, type-safe mutations",
        "Middleware runs on every request — better-auth getSessionCookie",
        "fetch caching: { cache: 'force-cache', next: { revalidate } }",
        "revalidatePath('/portfolio') after mutations",
        "AbortSignal.timeout(5000) on every external fetch",
        "Route groups: (auth) public, (root) auth-gated by middleware",
    ],
    notes: "Next.js 16 is the foundation. Every page is a Server Component by default, every mutation is a Server Action with the 'use server' directive at file level. Middleware reads the session cookie cheaply and redirects unauthenticated users to /sign-in.",
});

// === Tech: MongoDB Atlas + Mongoose ===
techDeepDive({
    name: "Tech deep-dive — MongoDB Atlas + Mongoose",
    oneLiner: "Replica-set-backed document database with Mongoose ODM",
    role: "Stores everything stateful: users (better-auth), portfolios, transactions, holdings, daily snapshots, watchlists, alerts, and scored news sentiment. The replica-set property is what enables atomic trade execution — without it, the Buy action could partially fail and silently lose money.",
    whyChosen: "Schema flexibility was critical during the build (alertCategory field added late with default backwards-compat, no migration needed). Atlas is a replica set by default → transactions just work. Mongoose gives schema validation, indexes, and lean() queries with minimal boilerplate.",
    technicalities: [
        "8 collections — 7 in DATABASE/models/ + better-auth's user collection",
        "Compound unique indexes for cron idempotency",
        "  · (userId, symbol) on holdings, watchlists",
        "  · (userId, date) on portfoliosnapshots",
        "  · (symbol, articleId) on newssentiments",
        "mongoose.startSession().withTransaction() for atomic trades",
        "Connection cache via global.mongooseCache (dev hot-reload safe)",
        "family: 4 (force IPv4) to avoid intermittent DNS issues",
        "lean() reads for performance, full docs for writes",
    ],
    notes: "The most important technical fact about MongoDB here is that Atlas is a replica set, which gives us transactions. The trade engine is wrapped in a withTransaction block — three writes commit together or none of them do.",
});

// === Tech: BetterAuth ===
techDeepDive({
    name: "Tech deep-dive — BetterAuth",
    oneLiner: "Modern auth library with MongoDB adapter and session cookies",
    role: "Handles sign-up, sign-in, session management, and password reset. Session cookies are the source of truth for 'is this user logged in.' Triggers an Inngest event (app/user.created) on successful sign-up so the welcome email can be generated asynchronously.",
    whyChosen: "Modern (1.6.5), TypeScript-native, MongoDB adapter built-in. Cookie-based sessions instead of JWTs (simpler revocation, no JWT footguns). Customizable callbacks for password reset → email send. Less ceremony than NextAuth for our use case.",
    technicalities: [
        "MongoDB adapter — writes to user + session collections automatically",
        "Session cookie checked cheaply by middleware via getSessionCookie",
        "User schema extended with: country, investmentGoals, riskTolerance, preferredIndustry",
        "Password hashing handled internally (bcrypt-style)",
        "Forgot/reset password flow: token stored in DB, sent via Nodemailer",
        "Triggers app/user.created Inngest event on signup → welcome AI email",
        "BETTER_AUTH_SECRET env var for cookie signing",
        "auth.api.getSession({ headers }) — server-side session check in actions",
    ],
    notes: "Better-auth handles all the password and session work — I never wrote my own crypto. The custom signup fields (country, risk tolerance, etc.) get stored automatically and are what later powers the personalized AI emails.",
});

// === Tech: Inngest ===
techDeepDive({
    name: "Tech deep-dive — Inngest",
    oneLiner: "Durable function runtime for cron jobs and AI workflows",
    role: "Hosts every background job: welcome email, daily news summary, hourly price + sentiment alert checks, daily portfolio snapshots, daily news sentiment scoring, weekly recap. Each function is a pipeline of retried, idempotent steps. step.ai is a first-class durable AI primitive used by the cron-based AI workflows.",
    whyChosen: "Durable cron + AI workflows without standing up Redis or BullMQ. step.ai integrates Gemini as a retried step. Local dev UI shows traces of every run — invaluable for debugging idempotency. Free tier is generous for a PFA.",
    technicalities: [
        "7 functions registered at app/api/inngest/route.ts via serve()",
        "Triggers: cron strings (0 13 * * *) + custom events (app/check.alerts)",
        "step.run('label', async () => ...) — retried on failure",
        "step.ai.gemini for AI inference inside steps — also retried",
        "Idempotency layered: pre-check existing IDs + DB unique indexes",
        "Cross-user dedupe (one Finnhub call per symbol, not per user)",
        "step.ai.infer with structured prompts → guaranteed JSON via responseSchema",
        "Local dev: npx inngest-cli@latest dev → http://localhost:8288",
    ],
    notes: "Inngest is what makes the background AI work feel like a real product instead of a fragile shell script. Every cron function is a sequence of named steps — if any one fails, only that step retries. step.ai puts Gemini inside that retry loop so an AI failure doesn't kill the whole job.",
});

// === Tech: Finnhub ===
techDeepDive({
    name: "Tech deep-dive — Finnhub API",
    oneLiner: "Free-tier market data: quotes, profiles, company news, search",
    role: "Source of all real-time and reference market data. Powers live quotes shown in trade modals, portfolio P&L math, sector allocation (via /profile2 finnhubIndustry), the news sentiment pipeline (via /company-news), and global stock search (via /search). 60 req/min on free tier means we have to be careful about call patterns.",
    whyChosen: "Free tier covers everything we need (quotes, news, profile, search). Reasonable rate limits. JSON responses with predictable shapes. No vendor lock-in — could swap for Yahoo Finance with one helper file.",
    technicalities: [
        "Endpoints used: /quote, /search, /stock/profile2, /company-news, /news",
        "Caching strategy:",
        "  · /profile2 cached 24h (sector data is essentially static)",
        "  · /search cached 30 min, popular stocks 1h",
        "  · /quote no-cache (real-time)",
        "AbortSignal.timeout(5000) wraps every fetch — clear timeout messages",
        "Cross-user symbol dedupe in every cron — N-fold reduction in calls",
        "Promise.allSettled in chatbot — one failed call ≠ failed answer",
        "Per-symbol catches downgrade to console.warn (no stack noise)",
    ],
    notes: "Finnhub is the rate-limited dependency we have to be most careful with. Every cron deduplicates symbols across users — if 50 users hold AAPL, we hit Finnhub once for AAPL, not 50 times. Every fetch has a 5-second abort signal so the page doesn't hang for 10 seconds when the network is flaky.",
});

// === Tech: Gemini ===
techDeepDive({
    name: "Tech deep-dive — Google Gemini",
    oneLiner: "Generative AI with structured-output schema enforcement",
    role: "Powers every AI feature. Personalizes the welcome email and weekly recap (recap commentary tied to user's risk profile). Summarizes daily news per user. Answers per-stock questions in the chatbot grounded in live quote + recent news. Scores news articles for sentiment in [-1, 1] with strict JSON schema.",
    whyChosen: "Generous free tier vs OpenAI. Strong instruction-following. Native responseSchema for structured output (no prompt-and-pray JSON parsing). gemini-3-flash-preview is fast enough for the chatbot use case.",
    technicalities: [
        "Model: gemini-3-flash-preview (fast inference, cheap)",
        "Two integration paths used together:",
        "  · lib/ai/gemini.ts → direct REST (chatbot — request-scoped)",
        "  · step.ai.gemini → Inngest (cron — durable retries)",
        "responseSchema: JSON Schema enforced server-side by Gemini",
        "  · sentiment scorer returns { scores: [{articleId, sentiment, label, confidence}] }",
        "System prompts ban personalized buy/sell recommendations",
        "Chatbot temperature 0.4 (research-grounded), recap 0.7 (creative-ish)",
        "AbortSignal.timeout(25-30s) — long enough but bounded",
    ],
    notes: "Two paths for AI on purpose. Chatbot uses direct REST because the user is waiting — latency wins. Cron jobs use Inngest's step.ai because durability matters more — if the AI call fails, the step is retried automatically. responseSchema is the trick that makes the sentiment pipeline reliable — Gemini is forced to return JSON matching our exact schema.",
});

// =====================================================================
// ARCHITECTURE & PIPELINES
// =====================================================================

// === Architecture ===
{
    const s = newSlide("Architecture", { subtitle: "How the pieces talk to each other" });
    diagramPlaceholder(s, 0.8, 1.8, 8.5, 5, "System diagram (flowchart TD)");
    s.addText("Read left → right:", { x: 9.6, y: 1.8, w: 3.2, h: 0.4, fontSize: 14, bold: true, color: C.yellow, fontFace: "Calibri" });
    const points = [
        "Browser only renders.",
        "Next.js does the work — pages, server actions, middleware.",
        "Inngest hosts background jobs.",
        "MongoDB is our state.",
        "Gemini + Finnhub: external dependencies.",
    ];
    points.forEach((p, i) => {
        s.addText("• " + p, { x: 9.6, y: 2.3 + i * 0.7, w: 3.2, h: 0.6, fontSize: 11, color: C.textBody, fontFace: "Calibri" });
    });
    s.addNotes("Walk it left to right. Client only renders. Next.js does the work — pages, server actions, middleware. Inngest hosts background jobs. MongoDB is our state. Gemini and Finnhub are our two main external dependencies.");
}

// === Data model ===
{
    const s = newSlide("Data model", { subtitle: "Seven collections — five per-user, one shared (NewsSentiment)" });
    diagramPlaceholder(s, 0.8, 1.8, 8.5, 5, "ER diagram");
    s.addText("Highlights:", { x: 9.6, y: 1.8, w: 3.2, h: 0.4, fontSize: 14, bold: true, color: C.yellow, fontFace: "Calibri" });
    const points = [
        "5 collections per-user.",
        "NewsSentiment is shared — score AAPL once for everyone.",
        "PortfolioSnapshot powers the equity curve.",
        "Unique compound indexes enforce cron idempotency.",
    ];
    points.forEach((p, i) => {
        s.addText("• " + p, { x: 9.6, y: 2.3 + i * 0.7, w: 3.2, h: 0.6, fontSize: 11, color: C.textBody, fontFace: "Calibri" });
    });
    s.addNotes("Seven collections. Five are per-user. NewsSentiment is shared globally — sentiment for AAPL is the same whether you watch it or I do, so we score each article once. PortfolioSnapshot powers the equity curve.");
}

// === Pipelines (4 slides) ===
const PIPELINES = [
    { title: "Pipeline 1 · Trade execution (atomic)", diagramLabel: "Trade execution sequence",
      bullets: ["User clicks Buy → server action fetches live price.", "Three writes in a single MongoDB transaction:", "  · debit cash · upsert holding · log transaction", "Weighted-average cost basis on second buy.", "All-or-nothing — paper trading can't lose money."],
      notes: "When the user clicks Buy, we run three writes in a single MongoDB transaction — debit cash, upsert the holding with weighted-average cost basis, insert a transaction row. All or nothing. A crash mid-flight can't lose money. This is why MongoDB Atlas matters — its replica set is what makes transactions possible." },
    { title: "Pipeline 2 · News sentiment (daily AI cron)", diagramLabel: "Sentiment scoring sequence",
      bullets: ["Daily 13:00 UTC. Inngest collects every watched + held symbol.", "Dedupe across users → one Finnhub call per symbol.", "Gemini scores each article in [-1, +1] with responseSchema.", "Idempotency layered twice — pre-check + unique index.", "Powers the timeline chart and sentiment alerts."],
      notes: "Daily at 13:00 UTC, Inngest collects every symbol anyone is watching or holding, deduplicates, fetches news from Finnhub, and asks Gemini to score each article on a -1 to +1 scale. We use Gemini's responseSchema for guaranteed JSON output. Idempotency is layered twice — pre-check existing IDs and a unique index — so retries are safe." },
    { title: "Pipeline 3 · Weekly AI recap", diagramLabel: "Weekly recap workflow",
      bullets: ["Mondays 14:00 UTC. Per-user personalized email.", "Context: portfolio week-over-week + watchlist + risk profile.", "Sent to Gemini via step.ai (durable retries).", "Prompt forbids invented numbers and buy/sell advice.", "Per-user error isolation — one bad user ≠ stop all."],
      notes: "Mondays at 14:00 UTC, every user gets a personalized email. We pull their portfolio's week-over-week change, top 5 watchlist stocks with sentiment, and their stated risk profile. All of that becomes the context for a Gemini prompt — and the prompt forbids inventing numbers or giving buy/sell advice." },
    { title: "Pipeline 4 · Stock chatbot grounding", diagramLabel: "Chatbot RAG flow",
      bullets: ["Per-stock chat panel — mini-RAG pattern.", "Parallel context fetch via Promise.allSettled.", "Quote + profile + recent news → grounded system prompt.", "Direct REST to Gemini (not Inngest) — request-scoped latency.", "System prompt bans personalized buy/sell recommendations."],
      notes: "The per-stock chatbot is a mini-RAG pattern. The user asks a question, we fetch live quote + profile + recent news in parallel, build a grounded system prompt, and call Gemini directly — not via Inngest, because the user is waiting. The system prompt explicitly bans personalized buy/sell recommendations — important regulatory framing." },
];

PIPELINES.forEach((p) => {
    const s = newSlide(p.title);
    diagramPlaceholder(s, 0.6, 1.6, 7.5, 5.2, p.diagramLabel);
    s.addText("Key points", { x: 8.4, y: 1.6, w: 4.4, h: 0.4, fontSize: 14, bold: true, color: C.yellow, fontFace: "Calibri" });
    p.bullets.forEach((b, i) => {
        s.addText(b.startsWith("  ·") ? b : "• " + b, { x: 8.4, y: 2.1 + i * 0.85, w: 4.4, h: 0.8, fontSize: 12, color: C.textBody, fontFace: "Calibri" });
    });
    s.addNotes(p.notes);
});

// =====================================================================
// CLOSING SLIDES
// =====================================================================

// === DEMO ===
{
    const s = pres.addSlide();
    s.background = { color: C.bgDark };
    s.addShape(pres.ShapeType.rect, { x: 5.16, y: 2.5, w: 3, h: 0.1, fill: { color: C.yellow }, line: { type: "none" } });
    s.addText("Live demo", { x: 1, y: 2.7, w: 11.33, h: 1.5, fontSize: 80, bold: true, color: C.yellow, fontFace: "Calibri", align: "center" });
    s.addText("Switch to browser →", { x: 1, y: 4.4, w: 11.33, h: 0.7, fontSize: 26, color: C.textBody, fontFace: "Calibri", align: "center" });
    s.addText("http://localhost:3000", { x: 1, y: 5.2, w: 11.33, h: 0.5, fontSize: 18, color: C.textMuted, fontFace: "Consolas", align: "center", italic: true });
    addFooter(s);
    s.addNotes(
        "DEMO SCRIPT (5-7 min):\n\n" +
        "1. Land on landing page → click Get Started → sign up → land in dashboard.\n" +
        "2. Cmd+K search → AAPL.\n" +
        "3. Stock detail page → scroll to chat panel → click 'What's been happening recently?' suggestion.\n" +
        "4. Scroll to sentiment timeline at bottom of left column — explain bars + 7-day badge.\n" +
        "5. Click yellow Trade button → Buy 5 → toast confirmation.\n" +
        "6. Navigate to Portfolio → walk through summary cards, equity curve, sector pie, holdings table.\n" +
        "7. Add a sentiment alert → toggle Sentiment, threshold 0.5 upper, save.\n" +
        "8. Navigate to Leaderboard → point at trophy + 'You' pill.\n" +
        "9. Show inbox: welcome email + weekly recap.\n" +
        "10. (Optional) Inngest dashboard → show 7 functions registered."
    );
}

// === Originality ===
{
    const s = newSlide("Originality vs. tutorial baseline", { subtitle: "About 90% of committed lines are mine" });
    const rows = [
        ["Tutorial baseline (Sprints 1-7)",        "Auth · watchlist · price alerts · daily news email · TradingView widgets"],
        ["Paper trading & analytics (Sprint 8)",   "4 models · 8 server actions · 2 pages · 6 components · daily snapshot cron · leaderboard"],
        ["AI investment assistant (Sprint 9)",     "1 model · ~8 server actions · 3 Inngest jobs · chatbot · sentiment timeline · sentiment alerts · weekly recap"],
        ["Docs / Landing / Defense (Sprints 10-12)", "5 docs + 7 Mermaid diagrams · marketing landing · this slide deck"],
    ];
    const colors = [C.textMuted, C.yellow, C.purple, C.teal];
    rows.forEach((row, i) => {
        const y = 1.85 + i * 1.15;
        s.addShape(pres.ShapeType.roundRect, { x: 0.6, y, w: 12.13, h: 1.0, fill: { color: C.surface }, line: { color: C.border, width: 1 }, rectRadius: 0.08 });
        s.addShape(pres.ShapeType.rect, { x: 0.6, y, w: 0.12, h: 1.0, fill: { color: colors[i] }, line: { type: "none" } });
        s.addText(row[0], { x: 0.95, y: y + 0.1, w: 4.2, h: 0.8, fontSize: 14, bold: true, color: colors[i], fontFace: "Calibri", valign: "middle" });
        s.addText(row[1], { x: 5.25, y: y + 0.1, w: 7.3, h: 0.8, fontSize: 12, color: C.textBody, fontFace: "Calibri", valign: "middle" });
    });
    s.addNotes("Transparent up front: this project started from a public tutorial that gave me the auth + watchlist + alerts skeleton. Everything in rows 2-4 is original work. About 90% of the lines committed are mine.");
}

// === Tradeoffs ===
{
    const s = newSlide("Tradeoffs we made", { subtitle: "Conscious cuts — full list in the report" });
    const items = [
        { title: "Cost basis", body: "Weighted-average, not FIFO tax lots. Sufficient for paper trading.", color: C.yellow },
        { title: "Cron throughput", body: "Sequential per symbol. Fine up to ~50 symbols. Above that, batch.", color: C.teal },
        { title: "Sentiment accuracy", body: "Not formally measured. Future work — labeled validation set.", color: C.purple },
        { title: "Test coverage", body: "Manual testing only. Trade math + sentiment parsing are highest priority for tests.", color: C.red },
    ];
    items.forEach((it, i) => {
        const y = 1.95 + i * 1.1;
        s.addShape(pres.ShapeType.roundRect, { x: 1.5, y, w: 10.33, h: 0.9, fill: { color: C.surface }, line: { color: C.border, width: 1 }, rectRadius: 0.08 });
        s.addShape(pres.ShapeType.rect, { x: 1.5, y, w: 0.12, h: 0.9, fill: { color: it.color }, line: { type: "none" } });
        s.addText(it.title, { x: 1.85, y: y + 0.1, w: 3.2, h: 0.7, fontSize: 16, bold: true, color: C.textHeading, fontFace: "Calibri", valign: "middle" });
        s.addText(it.body, { x: 5.15, y: y + 0.1, w: 6.5, h: 0.7, fontSize: 12, color: C.textBody, fontFace: "Calibri", valign: "middle" });
    });
    s.addNotes("These were conscious cuts. The report has the full list.");
}

// === Future work ===
{
    const s = newSlide("Future work", { subtitle: "If I had another month" });
    const items = [
        ["01", "Tests", "Jest/Vitest on trade math, sentiment parsing, threshold logic."],
        ["02", "Backtesting & strategy builder", "SMA/RSI/MACD strategies + return %, drawdown, Sharpe ratio."],
        ["03", "Sentiment accuracy study", "Labeled validation set + precision/recall write-up."],
        ["04", "Streaming chatbot", "SSE for token-by-token responses."],
    ];
    items.forEach(([n, title, body], i) => {
        const y = 1.9 + i * 1.1;
        s.addText(n, { x: 1.5, y, w: 1, h: 1, fontSize: 36, bold: true, color: C.yellow, fontFace: "Calibri" });
        s.addText(title, { x: 2.7, y: y + 0.05, w: 9, h: 0.5, fontSize: 18, bold: true, color: C.textHeading, fontFace: "Calibri" });
        s.addText(body, { x: 2.7, y: y + 0.55, w: 9, h: 0.5, fontSize: 13, color: C.textBody, fontFace: "Calibri" });
    });
    s.addNotes("If I had another month, this is what I'd add — in this order.");
}

// === Conclusion ===
{
    const s = newSlide("Conclusion");
    const points = [
        { big: "12 sprints · ~3 months", small: "of full-stack engineering on top of a public tutorial baseline.", color: C.yellow },
        { big: "Atomic trades · AI sentiment · Two-path Gemini", small: "where the technical depth lives.", color: C.teal },
        { big: "Fully documented", small: "README · ARCHITECTURE · PIPELINES · METHODOLOGY · PFA_LOG.", color: C.purple },
    ];
    points.forEach((p, i) => {
        const y = 2.0 + i * 1.5;
        s.addShape(pres.ShapeType.rect, { x: 1.5, y, w: 0.15, h: 1.2, fill: { color: p.color }, line: { type: "none" } });
        s.addText(p.big, { x: 1.85, y: y + 0.1, w: 10, h: 0.5, fontSize: 22, bold: true, color: C.textHeading, fontFace: "Calibri" });
        s.addText(p.small, { x: 1.85, y: y + 0.65, w: 10, h: 0.5, fontSize: 14, color: C.textBody, fontFace: "Calibri", italic: true });
    });
    s.addNotes("Close cleanly. Thank the jury.");
}

// === Q&A ===
{
    const s = pres.addSlide();
    s.background = { color: C.bgDark };
    s.addShape(pres.ShapeType.rect, { x: 5.16, y: 2.7, w: 3, h: 0.1, fill: { color: C.yellow }, line: { type: "none" } });
    s.addText("Thank you", { x: 1, y: 2.9, w: 11.33, h: 1.4, fontSize: 72, bold: true, color: C.yellow, fontFace: "Calibri", align: "center" });
    s.addText("Questions?", { x: 1, y: 4.5, w: 11.33, h: 0.8, fontSize: 32, color: C.textBody, fontFace: "Calibri", align: "center" });
    s.addText("[Your contact email]   ·   [Your repo URL]", { x: 1, y: 5.7, w: 11.33, h: 0.4, fontSize: 13, color: C.textMuted, fontFace: "Calibri", align: "center" });
    addFooter(s);
    s.addNotes(
        "ANTICIPATED Q&A:\n\n" +
        "Q1. Isn't this just the JSM Signalist tutorial?\n" +
        "A1. Sprints 1-7 followed it (auth, watchlist, daily news, TradingView). Sprints 8-12 are entirely mine. ~90% of committed lines mine. Documented in PFA_LOG.\n\n" +
        "Q2. How are trades atomic?\n" +
        "A2. MongoDB transactions in a single withTransaction block — three writes (cash, holding, transaction row) all-or-nothing. Atlas runs as a replica set.\n\n" +
        "Q3. Why MongoDB?\n" +
        "A3. Schema flexibility during the build + Atlas's replica-set transactions for trade engine.\n\n" +
        "Q4. Why two AI integration paths?\n" +
        "A4. Direct REST for chatbot (request-scoped latency wins). step.ai for cron (durability wins). One pattern can't fit both.\n\n" +
        "Q5. Sentiment accuracy?\n" +
        "A5. Not formally measured. Future work — labeled validation set + precision/recall.\n\n" +
        "Q6. What if Gemini is down?\n" +
        "A6. All AI features degrade gracefully — toast errors, empty charts, app keeps running.\n\n" +
        "Q7. How do you handle Finnhub rate limits?\n" +
        "A7. Cross-user symbol dedupe in every cron, 24h cache on profile data, 5s timeout per call, allSettled in chatbot.\n\n" +
        "Q8. Security?\n" +
        "A8. better-auth handles passwords + sessions. Env-var secrets. Middleware gate. No SQL = no injection. Chat prompt bans buy/sell advice.\n\n" +
        "Q9. What was hardest?\n" +
        "A9. (1) MongoDB transactions inside server actions — Mongoose session API has gotchas. (2) Designing sentiment pipeline to be idempotent under Inngest retries.\n\n" +
        "Q10. How would you scale to 10k users?\n" +
        "A10. Symbol dedupe already keeps external API cost sub-linear. Add Redis cache for hot reads (leaderboard). Inngest steps already parallelize across machines."
    );
}

// =====================================================================
await pres.writeFile({ fileName: "wealthflow-defense.pptx" });
console.log("✓ wealthflow-defense.pptx generated (" + (await import("fs")).statSync("wealthflow-defense.pptx").size + " bytes)");
console.log("  37 slides — open in PowerPoint, replace diagram placeholders, fill [Your Name] / [Supervisor], done.");
