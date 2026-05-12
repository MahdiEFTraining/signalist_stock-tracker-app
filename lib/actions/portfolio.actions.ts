'use server'

import mongoose from "mongoose";
import { connectToDatabase } from "@/DATABASE/mongoose";
import { PortfolioModel } from "@/DATABASE/models/portfolio.model";
import { TransactionModel } from "@/DATABASE/models/transaction.model";
import { HoldingModel } from "@/DATABASE/models/holding.model";
import { PortfolioSnapshotModel } from "@/DATABASE/models/portfolio-snapshot.model";
import { headers } from "next/headers";
import { auth } from "@/lib/better-auth/auth";
import { revalidatePath } from "next/cache";
import { getStockQuote, getCompanyProfile } from "@/lib/actions/finnhub.action";

const STARTING_CASH = 100000;

async function getCurrentUserId(): Promise<string | null> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        return session?.user?.id ?? null;
    } catch {
        return null;
    }
}

export async function getOrCreatePortfolio(): Promise<Portfolio | null> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) return null;

        await connectToDatabase();

        const existing = await PortfolioModel.findOne({ userId }).lean();
        if (existing) {
            return {
                userId: String(existing.userId),
                cashBalance: Number(existing.cashBalance),
                initialCash: Number(existing.initialCash),
                currency: String(existing.currency),
                createdAt: existing.createdAt as Date,
            };
        }

        const created = await PortfolioModel.create({
            userId,
            cashBalance: STARTING_CASH,
            initialCash: STARTING_CASH,
            currency: 'USD',
        });

        return {
            userId: String(created.userId),
            cashBalance: Number(created.cashBalance),
            initialCash: Number(created.initialCash),
            currency: String(created.currency),
            createdAt: created.createdAt,
        };
    } catch (err) {
        console.error('getOrCreatePortfolio error:', err);
        return null;
    }
}

export async function getHoldingsWithLivePrices(): Promise<HoldingWithLivePrice[]> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) return [];

        await connectToDatabase();
        const rows = await HoldingModel.find({ userId, quantity: { $gt: 0 } }).lean();
        if (rows.length === 0) return [];

        const enriched = await Promise.all(
            rows.map(async (h) => {
                let currentPrice = 0;
                try {
                    const q = await getStockQuote(String(h.symbol));
                    if (Number.isFinite(Number(q?.c))) currentPrice = Number(q.c);
                } catch (e) {
                    const msg = e instanceof Error ? e.message : String(e);
                    console.warn(`Finnhub quote unavailable for ${h.symbol}: ${msg}`);
                }
                const quantity = Number(h.quantity);
                const avgCostBasis = Number(h.avgCostBasis);
                const marketValue = currentPrice * quantity;
                const costBasis = avgCostBasis * quantity;
                const unrealizedPnL = marketValue - costBasis;
                const unrealizedPnLPercent =
                    costBasis > 0 ? (unrealizedPnL / costBasis) * 100 : 0;

                return {
                    symbol: String(h.symbol),
                    company: String(h.company),
                    quantity,
                    avgCostBasis,
                    realizedPnL: Number(h.realizedPnL),
                    updatedAt: h.updatedAt as Date,
                    currentPrice,
                    marketValue,
                    unrealizedPnL,
                    unrealizedPnLPercent,
                };
            })
        );

        return enriched;
    } catch (err) {
        console.error('getHoldingsWithLivePrices error:', err);
        return [];
    }
}

export async function getPortfolioPageData(): Promise<{
    summary: PortfolioSummary;
    holdings: HoldingWithLivePrice[];
    sectors: SectorAllocation[];
} | null> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) return null;

        await connectToDatabase();

        // Ensure portfolio exists
        const portfolio = await getOrCreatePortfolio();
        if (!portfolio) return null;

        const rows = await HoldingModel.find({ userId, quantity: { $gt: 0 } }).lean();

        const holdings: HoldingWithLivePrice[] = [];
        let holdingsValue = 0;
        let todayPnL = 0;

        await Promise.all(
            rows.map(async (h) => {
                let currentPrice = 0;
                let dayChange = 0;
                let sector: string | undefined;
                try {
                    const [q, profile] = await Promise.all([
                        getStockQuote(String(h.symbol)),
                        getCompanyProfile(String(h.symbol)).catch(() => null),
                    ]);
                    if (Number.isFinite(Number(q?.c))) currentPrice = Number(q.c);
                    if (Number.isFinite(Number(q?.d))) dayChange = Number(q.d);
                    if (profile?.finnhubIndustry) sector = profile.finnhubIndustry;
                } catch (e) {
                    const msg = e instanceof Error ? e.message : String(e);
                    console.warn(`Finnhub quote unavailable for ${h.symbol}: ${msg}`);
                }
                const quantity = Number(h.quantity);
                const avgCostBasis = Number(h.avgCostBasis);
                const marketValue = currentPrice * quantity;
                const costBasis = avgCostBasis * quantity;
                const unrealizedPnL = marketValue - costBasis;
                const unrealizedPnLPercent =
                    costBasis > 0 ? (unrealizedPnL / costBasis) * 100 : 0;

                holdings.push({
                    symbol: String(h.symbol),
                    company: String(h.company),
                    quantity,
                    avgCostBasis,
                    realizedPnL: Number(h.realizedPnL),
                    updatedAt: h.updatedAt as Date,
                    currentPrice,
                    marketValue,
                    unrealizedPnL,
                    unrealizedPnLPercent,
                    sector,
                });

                holdingsValue += marketValue;
                todayPnL += dayChange * quantity;
            })
        );

        // Sort by market value desc for stable ordering
        holdings.sort((a, b) => b.marketValue - a.marketValue);

        // Aggregate sector allocation by market value
        const sectorMap = new Map<string, number>();
        for (const h of holdings) {
            const key = h.sector || 'Other';
            sectorMap.set(key, (sectorMap.get(key) || 0) + h.marketValue);
        }
        const sectors: SectorAllocation[] = Array.from(sectorMap.entries())
            .map(([sector, value]) => ({
                sector,
                value,
                percent: holdingsValue > 0 ? (value / holdingsValue) * 100 : 0,
            }))
            .sort((a, b) => b.value - a.value);

        const totalValue = portfolio.cashBalance + holdingsValue;
        const totalReturn = totalValue - portfolio.initialCash;
        const totalReturnPercent =
            portfolio.initialCash > 0 ? (totalReturn / portfolio.initialCash) * 100 : 0;
        const yesterdayTotalValue = totalValue - todayPnL;
        const todayPnLPercent =
            yesterdayTotalValue > 0 ? (todayPnL / yesterdayTotalValue) * 100 : 0;

        const summary: PortfolioSummary = {
            totalValue,
            cashBalance: portfolio.cashBalance,
            holdingsValue,
            initialCash: portfolio.initialCash,
            totalReturn,
            totalReturnPercent,
            todayPnL,
            todayPnLPercent,
        };

        return { summary, holdings, sectors };
    } catch (err) {
        console.error('getPortfolioPageData error:', err);
        return null;
    }
}

export async function getEquityCurve(days = 30): Promise<PortfolioSnapshot[]> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) return [];

        await connectToDatabase();

        const since = new Date();
        since.setUTCDate(since.getUTCDate() - days);
        const sinceStr = since.toISOString().slice(0, 10);

        const rows = await PortfolioSnapshotModel.find({
            userId,
            date: { $gte: sinceStr },
        })
            .sort({ date: 1 })
            .lean();

        return rows.map((s) => ({
            date: String(s.date),
            totalValue: Number(s.totalValue),
            cashBalance: Number(s.cashBalance),
            holdingsValue: Number(s.holdingsValue),
        }));
    } catch (err) {
        console.error('getEquityCurve error:', err);
        return [];
    }
}

export async function getLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
    try {
        await connectToDatabase();
        const currentUserId = await getCurrentUserId();

        const portfolios = await PortfolioModel.find({}).lean();
        if (portfolios.length === 0) return [];

        const userIds = portfolios.map((p) => String(p.userId));

        const [holdings, mongooseInstance] = await Promise.all([
            HoldingModel.find({
                userId: { $in: userIds },
                quantity: { $gt: 0 },
            }).lean(),
            connectToDatabase(),
        ]);

        const db = mongooseInstance.connection.db;
        if (!db) throw new Error('MongoDB connection not found');
        const users = await db
            .collection('user')
            .find(
                { id: { $in: userIds } },
                { projection: { id: 1, name: 1, email: 1 } }
            )
            .toArray();

        const nameMap = new Map<string, string>();
        for (const u of users) {
            const id = String(u.id || u._id || '');
            if (!id) continue;
            const display =
                (u.name && String(u.name).trim()) ||
                (u.email ? String(u.email).split('@')[0] : '') ||
                'Anonymous';
            nameMap.set(id, display);
        }

        // Dedupe symbols across all users → one Finnhub call per symbol
        const uniqueSymbols = [...new Set(holdings.map((h) => String(h.symbol)))];
        const priceMap = new Map<string, number>();
        await Promise.all(
            uniqueSymbols.map(async (sym) => {
                try {
                    const q = await getStockQuote(sym);
                    if (Number.isFinite(Number(q?.c))) priceMap.set(sym, Number(q.c));
                } catch (e) {
                    const msg = e instanceof Error ? e.message : String(e);
                    console.warn(`getLeaderboard: quote unavailable for ${sym}: ${msg}`);
                }
            })
        );

        const holdingsByUser = new Map<string, typeof holdings>();
        for (const h of holdings) {
            const uid = String(h.userId);
            if (!holdingsByUser.has(uid)) holdingsByUser.set(uid, []);
            holdingsByUser.get(uid)!.push(h);
        }

        const ranked = portfolios
            .map((p) => {
                const userId = String(p.userId);
                const userHoldings = holdingsByUser.get(userId) || [];
                let holdingsValue = 0;
                for (const h of userHoldings) {
                    const price = priceMap.get(String(h.symbol)) ?? 0;
                    holdingsValue += price * Number(h.quantity);
                }
                const totalValue = Number(p.cashBalance) + holdingsValue;
                const initialCash = Number(p.initialCash);
                const totalReturn = totalValue - initialCash;
                const totalReturnPercent =
                    initialCash > 0 ? (totalReturn / initialCash) * 100 : 0;

                return {
                    userId,
                    userName: nameMap.get(userId) || 'Anonymous',
                    totalValue,
                    totalReturn,
                    totalReturnPercent,
                };
            })
            .sort((a, b) => b.totalReturnPercent - a.totalReturnPercent)
            .slice(0, limit);

        return ranked.map((r, i) => ({
            rank: i + 1,
            userName: r.userName,
            totalValue: r.totalValue,
            totalReturn: r.totalReturn,
            totalReturnPercent: r.totalReturnPercent,
            isCurrentUser: currentUserId === r.userId,
        }));
    } catch (err) {
        console.error('getLeaderboard error:', err);
        return [];
    }
}

// Used by Inngest cron — no auth context.
// Per-user week-over-week portfolio stats. Today's value is computed live;
// the 7-days-ago value is the closest PortfolioSnapshot ≤ that date, falling back to initialCash.
export async function getPortfolioWeeklyStats(userId: string): Promise<{
    totalValue: number;
    weekAgoValue: number;
    weekChange: number;
    weekChangePercent: number;
    cashBalance: number;
    holdingsValue: number;
    initialCash: number;
} | null> {
    try {
        await connectToDatabase();

        const portfolio = await PortfolioModel.findOne({ userId }).lean();
        if (!portfolio) return null;

        const holdings = await HoldingModel.find({ userId, quantity: { $gt: 0 } }).lean();

        let holdingsValue = 0;
        await Promise.all(
            holdings.map(async (h) => {
                try {
                    const q = await getStockQuote(String(h.symbol));
                    const price = Number(q?.c);
                    if (Number.isFinite(price) && price > 0) {
                        holdingsValue += price * Number(h.quantity);
                    }
                } catch (e) {
                    const msg = e instanceof Error ? e.message : String(e);
                    console.warn(`getPortfolioWeeklyStats quote unavailable for ${h.symbol}: ${msg}`);
                }
            })
        );

        const cashBalance = Number(portfolio.cashBalance);
        const initialCash = Number(portfolio.initialCash);
        const totalValue = cashBalance + holdingsValue;

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
        const cutoff = sevenDaysAgo.toISOString().slice(0, 10);

        const snapshot = await PortfolioSnapshotModel.findOne(
            { userId, date: { $lte: cutoff } },
            null,
            { sort: { date: -1 } }
        ).lean();

        const weekAgoValue = snapshot ? Number(snapshot.totalValue) : initialCash;
        const weekChange = totalValue - weekAgoValue;
        const weekChangePercent = weekAgoValue > 0 ? (weekChange / weekAgoValue) * 100 : 0;

        return {
            totalValue,
            weekAgoValue,
            weekChange,
            weekChangePercent,
            cashBalance,
            holdingsValue,
            initialCash,
        };
    } catch (err) {
        console.warn(`getPortfolioWeeklyStats ${userId} failed: ${err instanceof Error ? err.message : String(err)}`);
        return null;
    }
}

// Used by Inngest cron — no auth context.
// Iterates every portfolio, fetches quotes (deduped across users),
// and upserts a daily snapshot keyed on (userId, today's UTC date).
export async function snapshotAllPortfolios(): Promise<{
    snapshotted: number;
    skipped: number;
}> {
    await connectToDatabase();

    const today = new Date().toISOString().slice(0, 10);
    const portfolios = await PortfolioModel.find({}).lean();
    if (portfolios.length === 0) return { snapshotted: 0, skipped: 0 };

    // Collect every userId → list of holdings
    const userIds = portfolios.map((p) => String(p.userId));
    const holdings = await HoldingModel.find({
        userId: { $in: userIds },
        quantity: { $gt: 0 },
    }).lean();

    // Dedupe symbols across all users so we hit Finnhub once per symbol
    const uniqueSymbols = [...new Set(holdings.map((h) => String(h.symbol)))];
    const priceMap = new Map<string, number>();
    await Promise.all(
        uniqueSymbols.map(async (sym) => {
            try {
                const q = await getStockQuote(sym);
                if (Number.isFinite(Number(q?.c))) priceMap.set(sym, Number(q.c));
            } catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                console.warn(`snapshotAllPortfolios: quote unavailable for ${sym}: ${msg}`);
            }
        })
    );

    // Group holdings by userId
    const holdingsByUser = new Map<string, typeof holdings>();
    for (const h of holdings) {
        const uid = String(h.userId);
        if (!holdingsByUser.has(uid)) holdingsByUser.set(uid, []);
        holdingsByUser.get(uid)!.push(h);
    }

    let snapshotted = 0;
    let skipped = 0;

    await Promise.all(
        portfolios.map(async (p) => {
            const userId = String(p.userId);
            const userHoldings = holdingsByUser.get(userId) || [];
            let holdingsValue = 0;
            for (const h of userHoldings) {
                const price = priceMap.get(String(h.symbol)) ?? 0;
                holdingsValue += price * Number(h.quantity);
            }
            const cashBalance = Number(p.cashBalance);
            const totalValue = cashBalance + holdingsValue;

            try {
                await PortfolioSnapshotModel.updateOne(
                    { userId, date: today },
                    {
                        $set: {
                            userId,
                            date: today,
                            totalValue,
                            cashBalance,
                            holdingsValue,
                        },
                        $setOnInsert: { createdAt: new Date() },
                    },
                    { upsert: true }
                );
                snapshotted++;
            } catch (e) {
                console.error('snapshotAllPortfolios: upsert failed for', userId, e);
                skipped++;
            }
        })
    );

    return { snapshotted, skipped };
}

export async function getTransactionHistory(limit = 25): Promise<Transaction[]> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) return [];

        await connectToDatabase();
        const rows = await TransactionModel.find({ userId })
            .sort({ executedAt: -1 })
            .limit(limit)
            .lean();

        return rows.map((t) => ({
            id: String(t._id),
            symbol: String(t.symbol),
            company: String(t.company),
            side: t.side as 'buy' | 'sell',
            quantity: Number(t.quantity),
            price: Number(t.price),
            totalValue: Number(t.totalValue),
            executedAt: t.executedAt as Date,
        }));
    } catch (err) {
        console.error('getTransactionHistory error:', err);
        return [];
    }
}

export async function getTradeContext(symbol: string): Promise<{
    cashBalance: number;
    sharesOwned: number;
    avgCostBasis: number;
    livePrice: number;
}> {
    const fallback = { cashBalance: 0, sharesOwned: 0, avgCostBasis: 0, livePrice: 0 };
    try {
        const userId = await getCurrentUserId();
        if (!userId) return fallback;

        await connectToDatabase();
        const upper = symbol.toUpperCase();

        const [portfolio, holding, quote] = await Promise.all([
            PortfolioModel.findOne({ userId }).lean(),
            HoldingModel.findOne({ userId, symbol: upper }).lean(),
            getStockQuote(symbol).catch(() => null),
        ]);

        return {
            cashBalance: portfolio ? Number(portfolio.cashBalance) : STARTING_CASH,
            sharesOwned: holding ? Number(holding.quantity) : 0,
            avgCostBasis: holding ? Number(holding.avgCostBasis) : 0,
            livePrice: quote && Number.isFinite(Number(quote.c)) ? Number(quote.c) : 0,
        };
    } catch (err) {
        console.error('getTradeContext error:', err);
        return fallback;
    }
}

export async function executeTrade(data: TradeData): Promise<TradeResult> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) return { success: false, error: 'Not authenticated' };

        const { symbol, company, side, quantity } = data;
        if (!symbol || !company) return { success: false, error: 'Missing stock information' };
        if (!Number.isFinite(quantity) || quantity <= 0) {
            return { success: false, error: 'Quantity must be positive' };
        }
        if (!Number.isInteger(quantity)) {
            return { success: false, error: 'Quantity must be a whole number' };
        }

        const quote = await getStockQuote(symbol);
        const price = Number(quote?.c);
        if (!Number.isFinite(price) || price <= 0) {
            return { success: false, error: 'Could not fetch live price' };
        }

        const totalValue = price * quantity;
        const upperSymbol = symbol.toUpperCase();

        await connectToDatabase();

        const session = await mongoose.startSession();
        try {
            await session.withTransaction(async () => {
                let portfolio = await PortfolioModel.findOne({ userId }).session(session);
                if (!portfolio) {
                    const created = await PortfolioModel.create([{
                        userId,
                        cashBalance: STARTING_CASH,
                        initialCash: STARTING_CASH,
                        currency: 'USD',
                    }], { session });
                    portfolio = created[0];
                }

                if (side === 'buy') {
                    if (portfolio.cashBalance < totalValue) {
                        throw new Error(`Insufficient cash: need $${totalValue.toFixed(2)}, have $${portfolio.cashBalance.toFixed(2)}`);
                    }

                    portfolio.cashBalance -= totalValue;
                    await portfolio.save({ session });

                    const existing = await HoldingModel.findOne({ userId, symbol: upperSymbol }).session(session);
                    if (existing && existing.quantity > 0) {
                        const newQty = existing.quantity + quantity;
                        existing.avgCostBasis = (existing.quantity * existing.avgCostBasis + quantity * price) / newQty;
                        existing.quantity = newQty;
                        existing.company = company;
                        existing.updatedAt = new Date();
                        await existing.save({ session });
                    } else if (existing) {
                        existing.quantity = quantity;
                        existing.avgCostBasis = price;
                        existing.company = company;
                        existing.updatedAt = new Date();
                        await existing.save({ session });
                    } else {
                        await HoldingModel.create([{
                            userId,
                            symbol: upperSymbol,
                            company,
                            quantity,
                            avgCostBasis: price,
                            realizedPnL: 0,
                            updatedAt: new Date(),
                        }], { session });
                    }
                } else {
                    const existing = await HoldingModel.findOne({ userId, symbol: upperSymbol }).session(session);
                    if (!existing || existing.quantity < quantity) {
                        const have = existing?.quantity ?? 0;
                        throw new Error(`Insufficient shares: trying to sell ${quantity}, have ${have}`);
                    }

                    portfolio.cashBalance += totalValue;
                    await portfolio.save({ session });

                    existing.realizedPnL += (price - existing.avgCostBasis) * quantity;
                    existing.quantity -= quantity;
                    existing.updatedAt = new Date();
                    await existing.save({ session });
                }

                await TransactionModel.create([{
                    userId,
                    symbol: upperSymbol,
                    company,
                    side,
                    quantity,
                    price,
                    totalValue,
                    executedAt: new Date(),
                }], { session });
            });
        } finally {
            await session.endSession();
        }

        revalidatePath('/portfolio');
        revalidatePath(`/stocks/${upperSymbol}`);

        return { success: true, executedPrice: price, totalValue };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Trade failed';
        console.error('executeTrade error:', err);
        return { success: false, error: message };
    }
}
