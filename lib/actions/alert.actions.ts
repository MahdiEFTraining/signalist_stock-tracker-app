'use server'

import { connectToDatabase } from "@/DATABASE/mongoose";
import { AlertModel } from "@/DATABASE/models/alert.model";
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

export async function createAlert(
    data: AlertData
): Promise<{ success: boolean; error?: string }> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) return { success: false, error: 'Not authenticated' };

        const category: AlertCategory = data.alertCategory === 'sentiment' ? 'sentiment' : 'price';
        const threshold = parseFloat(data.threshold);
        if (isNaN(threshold)) {
            return { success: false, error: 'Invalid threshold' };
        }
        if (category === 'price' && threshold <= 0) {
            return { success: false, error: 'Price threshold must be positive' };
        }
        if (category === 'sentiment' && (threshold < -1 || threshold > 1)) {
            return { success: false, error: 'Sentiment threshold must be between -1 and 1' };
        }

        await connectToDatabase();
        await AlertModel.create({
            userId,
            symbol:        data.symbol.toUpperCase(),
            company:       data.company,
            alertName:     data.alertName,
            alertCategory: category,
            alertType:     data.alertType,
            threshold,
        });
        revalidatePath('/watchlist');
        return { success: true };
    } catch (err) {
        console.error('createAlert error:', err);
        return { success: false, error: 'Failed to create alert' };
    }
}

export async function getUserAlerts(): Promise<Alert[]> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) return [];

        await connectToDatabase();
        const items = await AlertModel.find({ userId }).sort({ createdAt: -1 }).lean();
        return items.map((i) => ({
            id:            String(i._id),
            symbol:        String(i.symbol),
            company:       String(i.company),
            alertName:     String(i.alertName),
            alertCategory: (i.alertCategory as AlertCategory) ?? 'price',
            alertType:     i.alertType as 'upper' | 'lower',
            threshold:     Number(i.threshold),
            currentPrice:  0,
        }));
    } catch (err) {
        console.error('getUserAlerts error:', err);
        return [];
    }
}

export async function deleteAlert(
    alertId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) return { success: false, error: 'Not authenticated' };

        await connectToDatabase();
        await AlertModel.deleteOne({ _id: alertId, userId });
        revalidatePath('/watchlist');
        return { success: true };
    } catch (err) {
        console.error('deleteAlert error:', err);
        return { success: false, error: 'Failed to delete alert' };
    }
}

// Used by Inngest cron — no auth context needed
export async function getAllAlertsWithUserEmails() {
    try {
        await connectToDatabase();
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        if (!db) throw new Error('MongoDB connection not found');

        const alerts = await AlertModel.find({}).lean();
        if (!alerts.length) return [];

        const userIds = [...new Set(alerts.map((a) => String(a.userId)))];
        const users = await db
            .collection('user')
            .find(
                { id: { $in: userIds } },
                { projection: { id: 1, email: 1 } }
            )
            .toArray();

        const emailMap = new Map<string, string>();
        for (const u of users) {
            if (u.id && u.email) emailMap.set(String(u.id), String(u.email));
        }

        return alerts
            .map((a) => ({
                id:            String(a._id),
                userId:        String(a.userId),
                userEmail:     emailMap.get(String(a.userId)) ?? '',
                symbol:        String(a.symbol),
                company:       String(a.company),
                alertName:     String(a.alertName),
                alertCategory: ((a as { alertCategory?: AlertCategory }).alertCategory ?? 'price') as AlertCategory,
                alertType:     a.alertType as 'upper' | 'lower',
                threshold:     Number(a.threshold),
            }))
            .filter((a) => a.userEmail);
    } catch (err) {
        console.error('getAllAlertsWithUserEmails error:', err);
        return [];
    }
}

// Used internally by Inngest after an alert fires
export async function deleteAlertById(alertId: string): Promise<void> {
    try {
        await connectToDatabase();
        await AlertModel.deleteOne({ _id: alertId });
    } catch (err) {
        console.error('deleteAlertById error:', err);
    }
}