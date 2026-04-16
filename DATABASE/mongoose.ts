import mongoose from "mongoose";
import dns from "dns";

// Add this to handle potential SRV resolution issues in local/development environments
if (dns.setServers) {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
}

const MONGODB_URI = process.env.MONGODB_URI;

declare global {
    var mongooseCache: {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
    }
}

let cached = global.mongooseCache;

if(!cached) {
    cached = global.mongooseCache = { conn: null , promise: null };
}

export const connectToDatabase = async () => {
    if(!MONGODB_URI) throw new Error("MongoDB URI must be set within .env");

    if(cached.conn) return cached.conn;

    if(!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, { 
            bufferCommands: false,
            serverSelectionTimeoutMS: 10000, // 10 seconds timeout for server selection
        });
    }

    try {
        cached.conn = await cached.promise;
    }catch(err) {
        cached.promise = null;
        throw err;
    }

    console.log(`Connected to database ${process.env.NODE_ENV} - ${MONGODB_URI}`);
    return cached.conn;
}