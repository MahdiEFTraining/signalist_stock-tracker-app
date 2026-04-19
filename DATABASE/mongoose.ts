import mongoose from "mongoose";
import { setDefaultResultOrder } from 'dns'; // ❌ had `= from` - remove the `=`
import { Resolver } from 'dns/promises';

const resolver = new Resolver();
resolver.setServers(['8.8.8.8', '8.8.4.4']);
setDefaultResultOrder('ipv4first');

// Remove the `dns.setServers` block - you already handle it with Resolver above

const MONGODB_URI = process.env.MONGODB_URI;

declare global {
    var mongooseCache: {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
    }
}

let cached = global.mongooseCache;

if (!cached) {
    cached = global.mongooseCache = { conn: null, promise: null };
}

export const connectToDatabase = async () => {
    if (!MONGODB_URI) throw new Error("MongoDB URI must be set within .env");

    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, {
            bufferCommands: false,
            serverSelectionTimeoutMS: 10000,
            family: 4, // 👈 add this - forces IPv4, avoids IPv6 DNS issues
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (err) {
        cached.promise = null;
        throw err;
    }

    console.log(`Connected to database ${process.env.NODE_ENV} - ${MONGODB_URI}`);
    return cached.conn;
}