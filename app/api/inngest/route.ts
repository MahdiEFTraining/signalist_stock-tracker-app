import {serve} from "inngest/next";
import {inngest} from "@/lib/inngest/client";
import {sendDailyNewsSummary, sendSignUpEmail, checkPriceAlerts, checkSentimentAlerts, recordPortfolioSnapshots, processNewsSentiment, sendWeeklyRecap} from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [sendSignUpEmail, sendDailyNewsSummary, checkPriceAlerts, checkSentimentAlerts, recordPortfolioSnapshots, processNewsSentiment, sendWeeklyRecap],
})