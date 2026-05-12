import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { connectToDatabase } from "@/DATABASE/mongoose";
import { nextCookies } from "better-auth/next-js";
import { sendPasswordResetEmail } from "@/lib/nodemailer";

let authInstance: any = null;

export const getAuth = async () => {
    if (authInstance) return authInstance; 
    
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;

    if (!db) throw new Error('MongoDB connection not found');
    if (!process.env.BETTER_AUTH_SECRET) throw new Error('BETTER_AUTH_SECRET is not set');
    if (!process.env.BETTER_AUTH_URL) throw new Error('BETTER_AUTH_URL is not set');

    authInstance = betterAuth({
        database: mongodbAdapter(db as any),
        secret: process.env.BETTER_AUTH_SECRET,
        baseURL: process.env.BETTER_AUTH_URL,
        emailAndPassword: {
            enabled: true,
            disableSignUp: false,
            requireEmailVerification: false,
            minPasswordLength: 8,
            maxPasswordLength: 128,
            autoSignIn: true,
            sendResetPassword: async ({ user, url }: { user: { email: string; name?: string }; url: string }) => {
                console.log('[sendResetPassword] callback fired for', user.email, '→', url);
                try {
                    await sendPasswordResetEmail({
                        email: user.email,
                        name: user.name ?? 'there',
                        resetUrl: url,
                    });
                    console.log('[sendResetPassword] email sent OK');
                } catch (e) {
                    console.error('[sendResetPassword] email send FAILED', e);
                    throw e;
                }
            },
        },
        plugins: [nextCookies()],
    });

    return authInstance;
};

export const auth = await getAuth();