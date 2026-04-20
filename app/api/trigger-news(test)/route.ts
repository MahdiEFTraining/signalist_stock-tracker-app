import { inngest } from "@/lib/inngest/client";
import { NextResponse } from "next/server";

export async function GET() {
    await inngest.send({
        name: 'app/send.daily.news',
        data: {},
        ts: Date.now() + 2 * 60 * 1000, // 2 minutes from now
    });

    return NextResponse.json({ success: true, message: 'Daily news triggered in 2 minutes' });
}