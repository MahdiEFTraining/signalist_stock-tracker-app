import { getAuth } from "../lib/better-auth/auth.ts";
import dotenv from "dotenv";
dotenv.config();

async function check() {
    try {
        console.log("Getting auth instance...");
        const auth = await getAuth();
        console.log("Auth instance created successfully");
        console.log("Auth keys:", Object.keys(auth));
    } catch (error) {
        console.error("Error creating auth instance:", error);
    }
}

check();
