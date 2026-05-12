'use server'

import { askGemini } from '@/lib/ai/gemini';
import { getStockQuote, getCompanyProfile, getNews } from '@/lib/actions/finnhub.action';
import { headers } from 'next/headers';
import { auth } from '@/lib/better-auth/auth';

const MAX_QUESTION_LENGTH = 1000;
const MAX_HISTORY_ITEMS = 20;
const MAX_NEWS_ARTICLES = 5;

async function getCurrentUserId(): Promise<string | null> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        return session?.user?.id ?? null;
    } catch {
        return null;
    }
}

const fmtUSD = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;

type QuoteContext = {
    price?: number;
    dayChange?: number;
    dayChangePct?: number;
    previousClose?: number;
};

type NewsContext = {
    headline: string;
    source: string;
    datetime: number;
    summary?: string;
};

function buildSystemPrompt(opts: {
    symbol: string;
    company: string;
    industry?: string;
    quote: QuoteContext;
    news: NewsContext[];
}): string {
    const { symbol, company, industry, quote, news } = opts;

    const newsLines = news.length
        ? news
              .map((a, i) => {
                  const dt = new Date(a.datetime * 1000).toISOString().slice(0, 10);
                  const summary = a.summary ? ` — ${a.summary.slice(0, 220)}` : '';
                  return `${i + 1}. (${dt}, ${a.source}) ${a.headline}${summary}`;
              })
              .join('\n')
        : '(no recent articles available)';

    const priceLine =
        quote.price && quote.price > 0
            ? `Current price: ${fmtUSD(quote.price)}${
                  quote.dayChange != null
                      ? ` (today ${quote.dayChange >= 0 ? '+' : ''}${fmtUSD(quote.dayChange)}${
                            quote.dayChangePct != null ? `, ${fmtPct(quote.dayChangePct)}` : ''
                        })`
                      : ''
              }`
            : 'Current price: unavailable';

    const previousLine = quote.previousClose
        ? `\n- Previous close: ${fmtUSD(quote.previousClose)}`
        : '';

    return `You are a stock-research assistant focused on a single ticker: ${symbol} (${company}).

CONTEXT (do not echo back unless asked):
- Industry: ${industry ?? 'Unknown'}
- ${priceLine}${previousLine}

RECENT NEWS (most relevant articles for this ticker):
${newsLines}

RULES:
- Stay on-topic for ${symbol}. If the user asks about another ticker, briefly note you're focused on ${symbol} but answer if it's a quick comparative question.
- Be concise — usually 1-3 short paragraphs. Use bullet points for lists.
- Ground claims in the provided context where possible. If you don't know something or it isn't in context, say so plainly.
- DO NOT give personalized buy/sell/hold recommendations. You can discuss factors that might inform a decision, but the final call is the user's.
- Use plain language. Skip boilerplate disclaimers.`;
}

export async function askStockQuestion(input: {
    symbol: string;
    question: string;
    history?: ChatMessage[];
}): Promise<AskStockQuestionResult> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) return { success: false, error: 'Not authenticated' };

        const symbol = input.symbol?.trim().toUpperCase();
        const question = input.question?.trim();
        if (!symbol) return { success: false, error: 'Missing symbol' };
        if (!question) return { success: false, error: 'Question is empty' };
        if (question.length > MAX_QUESTION_LENGTH) {
            return { success: false, error: `Question too long (max ${MAX_QUESTION_LENGTH} chars)` };
        }

        const history = (input.history ?? [])
            .slice(-MAX_HISTORY_ITEMS)
            .map((h) => ({
                role: h.role,
                text: typeof h.text === 'string' ? h.text.slice(0, 4000) : '',
            }))
            .filter((h) => h.text.length > 0);

        // Fetch live context in parallel. allSettled means a single Finnhub timeout
        // doesn't block the answer — we just send less context to Gemini.
        const [quoteRes, profileRes, newsRes] = await Promise.allSettled([
            getStockQuote(symbol),
            getCompanyProfile(symbol),
            getNews([symbol]),
        ]);

        const quote = quoteRes.status === 'fulfilled' ? quoteRes.value : {};
        const profile = profileRes.status === 'fulfilled' ? profileRes.value : {};
        const newsAll = newsRes.status === 'fulfilled' ? newsRes.value : [];
        const news = newsAll.slice(0, MAX_NEWS_ARTICLES);

        const company = (profile?.name && String(profile.name)) || symbol;

        const systemPrompt = buildSystemPrompt({
            symbol,
            company,
            industry: profile?.finnhubIndustry,
            quote: {
                price: typeof quote?.c === 'number' ? quote.c : undefined,
                dayChange: typeof quote?.d === 'number' ? quote.d : undefined,
                dayChangePct: typeof quote?.dp === 'number' ? quote.dp : undefined,
                previousClose: typeof quote?.pc === 'number' ? quote.pc : undefined,
            },
            news: news.map((a) => ({
                headline: a.headline,
                source: a.source,
                datetime: a.datetime,
                summary: a.summary,
            })),
        });

        const answer = await askGemini({
            prompt: question,
            system: systemPrompt,
            history,
            temperature: 0.4,
            maxTokens: 1024,
            timeoutMs: 25000,
        });

        return { success: true, answer };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'AI request failed';
        console.error('askStockQuestion error:', message);
        return { success: false, error: message };
    }
}
