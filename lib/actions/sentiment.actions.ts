'use server'

import { connectToDatabase } from "@/DATABASE/mongoose";
import { NewsSentimentModel } from "@/DATABASE/models/news-sentiment.model";
import { Watchlist } from "@/DATABASE/models/watchlist.model";
import { HoldingModel } from "@/DATABASE/models/holding.model";
import { getNews } from "@/lib/actions/finnhub.action";
import { askGemini } from "@/lib/ai/gemini";

const MAX_ARTICLES_PER_SYMBOL = 6;
const MAX_SUMMARY_CHARS = 400;

const SENTIMENT_RESPONSE_SCHEMA = {
    type: "object",
    properties: {
        scores: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    articleId:  { type: "integer" },
                    sentiment:  { type: "number" },
                    label:      { type: "string", enum: ["negative", "neutral", "positive"] },
                    confidence: { type: "number" },
                },
                required: ["articleId", "sentiment", "label"],
            },
        },
    },
    required: ["scores"],
} as const;

type ScoredArticle = {
    articleId: number;
    sentiment: number;
    label: SentimentLabel;
    confidence?: number;
};

type ScoreableArticle = {
    id: number;
    headline: string;
    summary?: string;
    source: string;
    datetime: number;
    url: string;
};

function clampSentiment(n: unknown): number {
    const x = Number(n);
    if (!Number.isFinite(x)) return 0;
    if (x < -1) return -1;
    if (x > 1) return 1;
    return x;
}

function deriveLabel(score: number): SentimentLabel {
    if (score >= 0.2) return 'positive';
    if (score <= -0.2) return 'negative';
    return 'neutral';
}

export async function scoreArticles(
    symbol: string,
    articles: ScoreableArticle[]
): Promise<ScoredArticle[]> {
    if (articles.length === 0) return [];

    const upper = symbol.toUpperCase();

    const articleLines = articles
        .map((a, i) => {
            const date = new Date(a.datetime * 1000).toISOString().slice(0, 10);
            const summary = a.summary
                ? a.summary.slice(0, MAX_SUMMARY_CHARS).replace(/\s+/g, ' ').trim()
                : '';
            return `${i + 1}. articleId=${a.id} | ${date} | ${a.source}
   Headline: ${a.headline}
   Summary: ${summary || '(none)'}`;
        })
        .join('\n\n');

    const prompt = `You are a financial-sentiment classifier focused on ticker ${upper}.

For each article below, score sentiment toward ${upper} in the range [-1, 1]:
- -1 strongly negative (bearish: losses, downgrades, scandals, missed estimates, regulatory risk)
-  0 neutral (informational, no clear bias)
- +1 strongly positive (bullish: beats, growth, upgrades, new products, partnerships)

Also assign:
- label: "negative" if sentiment <= -0.2, "neutral" if -0.2 < sentiment < 0.2, "positive" if sentiment >= 0.2.
- confidence: 0..1, how sure you are.

Return JSON matching the response schema. Score every article exactly once, using its articleId.

Articles:
${articleLines}`;

    const raw = await askGemini({
        prompt,
        temperature: 0.2,
        maxTokens: 2048,
        timeoutMs: 30000,
        responseMimeType: 'application/json',
        responseSchema: SENTIMENT_RESPONSE_SCHEMA as Record<string, unknown>,
    });

    let parsed: { scores?: Array<{ articleId?: number; sentiment?: number; label?: string; confidence?: number }> };
    try {
        parsed = JSON.parse(raw);
    } catch (err) {
        throw new Error(`Failed to parse Gemini JSON: ${err instanceof Error ? err.message : String(err)}`);
    }

    const out: ScoredArticle[] = [];
    const knownIds = new Set(articles.map((a) => a.id));
    for (const s of parsed.scores ?? []) {
        const id = Number(s.articleId);
        if (!Number.isInteger(id) || !knownIds.has(id)) continue;
        const sentiment = clampSentiment(s.sentiment);
        const label: SentimentLabel =
            s.label === 'negative' || s.label === 'neutral' || s.label === 'positive'
                ? s.label
                : deriveLabel(sentiment);
        const confidence =
            typeof s.confidence === 'number' && s.confidence >= 0 && s.confidence <= 1
                ? s.confidence
                : undefined;
        out.push({ articleId: id, sentiment, label, confidence });
    }
    return out;
}

// Processes a single symbol: fetches news, filters out already-scored articles,
// scores the rest via Gemini, persists the new rows. Idempotent.
export async function processSentimentForSymbol(symbol: string): Promise<{
    symbol: string;
    fetched: number;
    skipped: number;
    scored: number;
    error?: string;
}> {
    const upper = symbol.toUpperCase();
    try {
        await connectToDatabase();

        const articles = await getNews([upper]);
        if (!articles || articles.length === 0) {
            return { symbol: upper, fetched: 0, skipped: 0, scored: 0 };
        }
        const limited = articles.slice(0, MAX_ARTICLES_PER_SYMBOL);
        const ids = limited.map((a) => Number(a.id)).filter(Number.isFinite);

        const existing = await NewsSentimentModel.find(
            { symbol: upper, articleId: { $in: ids } },
            { articleId: 1 }
        ).lean();
        const existingIds = new Set(existing.map((e) => Number(e.articleId)));

        const fresh = limited.filter((a) => !existingIds.has(Number(a.id)));
        if (fresh.length === 0) {
            return { symbol: upper, fetched: limited.length, skipped: limited.length, scored: 0 };
        }

        const scored = await scoreArticles(upper, fresh.map((a) => ({
            id: Number(a.id),
            headline: a.headline,
            summary: a.summary,
            source: a.source,
            datetime: Number(a.datetime),
            url: a.url,
        })));

        const byId = new Map(fresh.map((a) => [Number(a.id), a]));
        const docs = scored
            .map((s) => {
                const a = byId.get(s.articleId);
                if (!a) return null;
                return {
                    symbol: upper,
                    articleId: s.articleId,
                    headline: a.headline,
                    summary: a.summary,
                    source: a.source,
                    url: a.url,
                    articleDatetime: new Date(Number(a.datetime) * 1000),
                    sentiment: s.sentiment,
                    sentimentLabel: s.label,
                    confidence: s.confidence,
                    processedAt: new Date(),
                };
            })
            .filter((d): d is NonNullable<typeof d> => d !== null);

        if (docs.length > 0) {
            // ordered:false → if one duplicate slips through (race), the rest still insert
            await NewsSentimentModel.insertMany(docs, { ordered: false }).catch((err) => {
                if (err?.code === 11000 || err?.writeErrors) return; // duplicate key, fine
                throw err;
            });
        }

        return {
            symbol: upper,
            fetched: limited.length,
            skipped: existingIds.size,
            scored: docs.length,
        };
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`processSentimentForSymbol: ${upper} failed: ${msg}`);
        return { symbol: upper, fetched: 0, skipped: 0, scored: 0, error: msg };
    }
}

export async function getSentimentTimeline(
    symbol: string,
    days = 30
): Promise<SentimentTimelinePoint[]> {
    try {
        await connectToDatabase();
        const upper = symbol.toUpperCase();
        const since = new Date();
        since.setUTCDate(since.getUTCDate() - days);

        const rows = await NewsSentimentModel.aggregate([
            { $match: { symbol: upper, articleDatetime: { $gte: since } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$articleDatetime' } },
                    avgSentiment: { $avg: '$sentiment' },
                    articleCount: { $sum: 1 },
                    positiveCount: { $sum: { $cond: [{ $eq: ['$sentimentLabel', 'positive'] }, 1, 0] } },
                    neutralCount:  { $sum: { $cond: [{ $eq: ['$sentimentLabel', 'neutral']  }, 1, 0] } },
                    negativeCount: { $sum: { $cond: [{ $eq: ['$sentimentLabel', 'negative'] }, 1, 0] } },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        return rows.map((r) => ({
            date: String(r._id),
            avgSentiment: Number(r.avgSentiment),
            articleCount: Number(r.articleCount),
            positiveCount: Number(r.positiveCount),
            neutralCount: Number(r.neutralCount),
            negativeCount: Number(r.negativeCount),
        }));
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`getSentimentTimeline ${symbol}: ${msg}`);
        return [];
    }
}

export async function getSentimentSummary(
    symbol: string,
    days = 7
): Promise<SentimentSummary | null> {
    try {
        await connectToDatabase();
        const upper = symbol.toUpperCase();
        const since = new Date();
        since.setUTCDate(since.getUTCDate() - days);

        const rows = await NewsSentimentModel.aggregate([
            { $match: { symbol: upper, articleDatetime: { $gte: since } } },
            {
                $group: {
                    _id: null,
                    avgSentiment: { $avg: '$sentiment' },
                    articleCount: { $sum: 1 },
                },
            },
        ]);

        if (rows.length === 0 || !Number.isFinite(Number(rows[0].avgSentiment))) {
            return null;
        }

        const avg = Number(rows[0].avgSentiment);
        const label: SentimentLabel = avg >= 0.2 ? 'positive' : avg <= -0.2 ? 'negative' : 'neutral';

        return {
            symbol: upper,
            avgSentiment: avg,
            articleCount: Number(rows[0].articleCount),
            windowDays: days,
            label,
        };
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`getSentimentSummary ${symbol}: ${msg}`);
        return null;
    }
}

// Used by Inngest cron — no auth context.
// Collects every symbol across watchlists + holdings, scores news for each (sequential
// to avoid Gemini/Finnhub rate limits), returns a per-symbol summary.
export async function processWatchlistSentiment(): Promise<{
    symbols: number;
    totalScored: number;
    totalSkipped: number;
    failures: number;
}> {
    await connectToDatabase();

    const [watchlistSymbols, holdingSymbols] = await Promise.all([
        Watchlist.distinct('symbol'),
        HoldingModel.distinct('symbol', { quantity: { $gt: 0 } }),
    ]);

    const allSymbols = [
        ...new Set(
            [...watchlistSymbols, ...holdingSymbols]
                .map((s) => String(s).toUpperCase())
                .filter((s) => s.length > 0)
        ),
    ];

    if (allSymbols.length === 0) {
        return { symbols: 0, totalScored: 0, totalSkipped: 0, failures: 0 };
    }

    let totalScored = 0;
    let totalSkipped = 0;
    let failures = 0;

    // Sequential — one Gemini call per symbol. Throttles naturally and avoids
    // hammering Finnhub from multiple concurrent calls.
    for (const sym of allSymbols) {
        const result = await processSentimentForSymbol(sym);
        if (result.error) failures++;
        totalScored += result.scored;
        totalSkipped += result.skipped;
    }

    return { symbols: allSymbols.length, totalScored, totalSkipped, failures };
}
