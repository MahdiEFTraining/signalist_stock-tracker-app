'use server'

import { connectToDatabase } from "@/DATABASE/mongoose";
import { Watchlist } from "@/DATABASE/models/watchlist.model";
import { headers } from "next/headers";
import { auth } from "@/lib/better-auth/auth";
import { revalidatePath } from "next/cache";

async function getCurrentUserId(): Promise<string | null> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        return session?.user?.id ?? null;
    } catch {
        return null;
    }
}

export async function toggleWatchlist(
    symbol: string,
    company: string
): Promise<{ isInWatchlist: boolean; error?: string }> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) return { isInWatchlist: false, error: 'Not authenticated' };

        await connectToDatabase();

        const existing = await Watchlist.findOne({ userId, symbol: symbol.toUpperCase() });

        if (existing) {
            await Watchlist.deleteOne({ userId, symbol: symbol.toUpperCase() });
            revalidatePath('/watchlist');
            return { isInWatchlist: false };
        } else {
            await Watchlist.create({ userId, symbol: symbol.toUpperCase(), company });
            revalidatePath('/watchlist');
            return { isInWatchlist: true };
        }
    } catch (err) {
        console.error('toggleWatchlist error:', err);
        return { isInWatchlist: false, error: 'Failed to update watchlist' };
    }
}

export async function getWatchlistForUser(): Promise<WatchlistStock[]> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) return [];

        await connectToDatabase();

        const items = await Watchlist.find({ userId }).sort({ addedAt: -1 }).lean();
        return items.map((i) => ({
            symbol: String(i.symbol),
            company: String(i.company),
            addedAt: i.addedAt as Date,
        }));
    } catch (err) {
        console.error('getWatchlistForUser error:', err);
        return [];
    }
}

export async function getWatchlistSymbols(): Promise<string[]> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) return [];

        await connectToDatabase();

        const items = await Watchlist.find({ userId }, { symbol: 1 }).lean();
        return items.map((i) => String(i.symbol));
    } catch (err) {
        console.error('getWatchlistSymbols error:', err);
        return [];
    }
}

export async function getWatchlistSymbolsByEmail(email: string): Promise<string[]> {
    if (!email) return [];
    try {
        const conn = await connectToDatabase();
        const db = conn.connection.db;
        if (!db) throw new Error('MongoDB connection not found');

        const user = await db.collection('user').findOne<{ _id?: unknown; id?: string; email?: string }>({ email });
        if (!user) return [];

        const userId = (user.id as string) || String(user._id || '');
        if (!userId) return [];

        const items = await Watchlist.find({ userId }, { symbol: 1 }).lean();
        return items.map((i) => String(i.symbol));
    } catch (err) {
        console.error('getWatchlistSymbolsByEmail error:', err);
        return [];
    }
}