import { NextResponse } from "next/server";
import { connectToDatabase } from "@/DATABASE/mongoose";

export async function GET() {
    try {
        await connectToDatabase();
        return NextResponse.json({
            success: true,
            message: "Connected to MongoDB successfully!",
        });
    } catch (error: any) {
        console.error("Database connection error:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Failed to connect to MongoDB",
                error: error.message,
            },
            { status: 500 }
        );
    }
}
