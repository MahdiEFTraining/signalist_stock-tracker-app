'use server'

import { connectToDatabase } from "@/DATABASE/mongoose";
import { getPortfolioWeeklyStats } from "@/lib/actions/portfolio.actions";
import { getWatchlistSymbolsByEmail } from "@/lib/actions/watchlist.actions";
import { getStockQuote, getCompanyProfile } from "@/lib/actions/finnhub.action";
import { getSentimentSummary } from "@/lib/actions/sentiment.actions";

const MAX_WATCHLIST_FOR_RECAP = 5;
const SENTIMENT_WINDOW = 7;

export type WeeklyRecapContext = {
    user: {
        firstName: string;
        country?: string;
        investmentGoals?: string;
        riskTolerance?: string;
        preferredIndustry?: string;
    };
    portfolio: {
        totalValue: number;
        weekAgoValue: number;
        weekChange: number;
        weekChangePercent: number;
        cashBalance: number;
        holdingsValue: number;
        initialCash: number;
    } | null;
    watchlist: Array<{
        symbol: string;
        company?: string;
        currentPrice: number;
        dayChangePercent: number;
        sentiment7d?: { avg: number; label: SentimentLabel; articleCount: number };
    }>;
};

export async function buildWeeklyRecapContext(input: {
    userId: string;
    email: string;
    name: string;
}): Promise<WeeklyRecapContext> {
    const firstName = (input.name || '').split(' ')[0] || input.name || 'there';

    // Pull profile fields directly from the better-auth user collection
    let country: string | undefined;
    let investmentGoals: string | undefined;
    let riskTolerance: string | undefined;
    let preferredIndustry: string | undefined;

    try {
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        if (db) {
            const profile = await db.collection('user').findOne(
                { id: input.userId },
                { projection: { country: 1, investmentGoals: 1, riskTolerance: 1, preferredIndustry: 1 } }
            );
            if (profile) {
                country           = profile.country ?? undefined;
                investmentGoals   = profile.investmentGoals ?? undefined;
                riskTolerance     = profile.riskTolerance ?? undefined;
                preferredIndustry = profile.preferredIndustry ?? undefined;
            }
        }
    } catch (e) {
        console.warn(`buildWeeklyRecapContext: failed to load profile for ${input.email}: ${e instanceof Error ? e.message : String(e)}`);
    }

    // Portfolio stats and watchlist symbols in parallel
    const [portfolio, watchlistSymbols] = await Promise.all([
        getPortfolioWeeklyStats(input.userId),
        getWatchlistSymbolsByEmail(input.email),
    ]);

    // Hydrate top N watchlist symbols with quote + sentiment in parallel
    const limited = watchlistSymbols.slice(0, MAX_WATCHLIST_FOR_RECAP);
    const watchlist = await Promise.all(
        limited.map(async (sym) => {
            const upper = String(sym).toUpperCase();
            const [quoteRes, profileRes, sentimentRes] = await Promise.allSettled([
                getStockQuote(upper),
                getCompanyProfile(upper),
                getSentimentSummary(upper, SENTIMENT_WINDOW),
            ]);
            const quote     = quoteRes.status === 'fulfilled' ? quoteRes.value : {};
            const profile   = profileRes.status === 'fulfilled' ? profileRes.value : {};
            const sentiment = sentimentRes.status === 'fulfilled' ? sentimentRes.value : null;

            return {
                symbol: upper,
                company: profile?.name ? String(profile.name) : undefined,
                currentPrice: Number.isFinite(Number(quote?.c)) ? Number(quote.c) : 0,
                dayChangePercent: Number.isFinite(Number(quote?.dp)) ? Number(quote.dp) : 0,
                sentiment7d: sentiment
                    ? { avg: sentiment.avgSentiment, label: sentiment.label, articleCount: sentiment.articleCount }
                    : undefined,
            };
        })
    );

    return {
        user: { firstName, country, investmentGoals, riskTolerance, preferredIndustry },
        portfolio,
        watchlist,
    };
}
