import { inngest } from "@/lib/inngest/client";
import {NEWS_SUMMARY_EMAIL_PROMPT, PERSONALIZED_WELCOME_EMAIL_PROMPT, WEEKLY_RECAP_EMAIL_PROMPT} from "@/lib/inngest/prompts";
import {sendNewsSummaryEmail, sendPriceAlertEmail, sendSentimentAlertEmail, sendWeeklyRecapEmail, sendWelcomeEmail} from "@/lib/nodemailer";
import {buildWeeklyRecapContext} from "@/lib/actions/recap.actions";
import {getAllUsersForNewsEmail} from "@/lib/actions/user.actions";
import {getWatchlistSymbolsByEmail} from "@/lib/actions/watchlist.actions";
import {getAllAlertsWithUserEmails, deleteAlertById} from "@/lib/actions/alert.actions";
import {snapshotAllPortfolios} from "@/lib/actions/portfolio.actions";
import {processWatchlistSentiment, getSentimentSummary} from "@/lib/actions/sentiment.actions";
import {getNews, getStockQuote} from "@/lib/actions/finnhub.action";
import {UserForNewsEmail} from "@/app/types";
import {formatDateToday} from "@/lib/utils";
import {getFormattedTodayDate} from "@/lib/utils";


export const sendSignUpEmail = inngest.createFunction(
    {
        id: 'sign-up-email',
        triggers:[{ event: 'app/user.created' }]
    },
    async ({ event, step }) => {
        const userProfile = `
        - Country: ${event.data.country}
        - Investment goals: ${event.data.investmentGoals}
        - Risk tolerance: ${event.data.riskTolerance}
        - Preferred industry: ${event.data.preferredIndustry}
        `;

        const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace('{{userProfile}}', userProfile)

        const response = await step.ai.infer('generate-welcome-intro', {
            model:step.ai.models.gemini({ model: 'gemini-3-flash-preview'}),
                body: {
                    contents: [
                        {
                            role: 'user',
                            parts: [
                                { text: prompt }
                            ]
                        }]
                }
        })

        await step.run('send-welcome-email', async () => {
            const part = response.candidates?.[0]?.content?.parts?.[0];
            const introText = (part && 'text' in part ? part.text : null) || 'Thanks for joining WealthFlow. You now have the tools to track markets and smarter moves.'

            const { data: {email, name} } = event;

            return await sendWelcomeEmail({ email, name, intro: introText});
        })

        return {
            success: true,
            message: 'Welcome email sent successfully!'

        }

    }
);

export const sendDailyNewsSummary = inngest.createFunction(
    {
        id: 'daily-news-summary',
        triggers: [{ event: 'app/send.daily.news' }, { cron: '0 12 * * *' }]
    },
    async ({ step }: { step: any }) => {
        // Step #1: Get all users for news delivery
        const users = await step.run('get-all-users', () => getAllUsersForNewsEmail())

        if(!users || users.length == 0) return { success: false, message: 'No users found for news email' };
        // Step #2: Fetch personnalized news for each user
        const results = await step.run('fetch-user-news', async() => {
            const perUser: Array<{ user: UserForNewsEmail; articles: MarketNewsArticle[] }> = [];
            for (const user of users as UserForNewsEmail[]) {
                try {
                    const symbols = await getWatchlistSymbolsByEmail(user.email);
                    let articles = await getNews(symbols);
                    // Enfore max 6 articles per user
                    articles = (articles || []).slice(0, 6);
                    // If still empty, fallback to general
                    if (!articles || articles.length == 0) {
                        articles = await getNews();
                        articles = (articles || []).slice(0, 6);
                    }
                    perUser.push({ user, articles});
                } catch (e) {
                    console.error('daily-news: error preparing user news', user.email, e);
                    perUser.push({ user, articles: []});
                }
            }
            return perUser;
        })


        // Step #3: Summarize news via AI for each user
        const userNewsSummaries: { user: User; newsContent: string | null}[] = [];

        for (const { user, articles } of results) {
            try {
                const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace('{{newsData}}', JSON.stringify(articles, null, 2));

                const response = await step.ai.infer(`summarize-news-${user.email}`, {
                    model: step.ai.models.gemini({ model: 'gemini-3-flash-preview'}),
                    body: {
                        contents: [{ role: 'user', parts: [{ text:prompt }]}],
                    }
                });

                const part = response.candidates?.[0]?.content?.parts?.[0];
                const newsContent = (part && 'text' in part ? part.text : null) || 'No market news';

                userNewsSummaries.push({ user, newsContent });
            } catch(e) {
                console.error('Failed to summarize news for : ', user.email);
                userNewsSummaries.push({ user, newsContent: articles });
            }
        }
        // Step #4: Send emails
        await step.run('send-news-emails', async () => {
            await Promise.all(
                userNewsSummaries.map(async({ user, newsContent }) => {
                    if(!newsContent) return false;

                    return await sendNewsSummaryEmail({ email: user.email, date:getFormattedTodayDate(), newsContent })

                })
            )
        })
        return { success: true, message: 'Daily news summary emails sent successfully' } as const;
    }
)

export const processNewsSentiment = inngest.createFunction(
    {
        id: 'process-news-sentiment',
        // 13:00 UTC = mid-morning ET, after most overnight news has dropped.
        triggers: [{ event: 'app/process.sentiment' }, { cron: '0 13 * * *' }],
    },
    async ({ step }: { step: any }) => {
        const result = await step.run('score-watchlist-sentiment', () => processWatchlistSentiment());

        return {
            success: true,
            message: `Processed ${result.symbols} symbol(s): scored ${result.totalScored} new article(s), skipped ${result.totalSkipped} already-scored, ${result.failures} failure(s)`,
        } as const;
    }
)

export const recordPortfolioSnapshots = inngest.createFunction(
    {
        id: 'record-portfolio-snapshots',
        // 22:00 UTC = ~1h after US market close. Manual trigger also supported.
        triggers: [{ event: 'app/record.portfolio.snapshots' }, { cron: '0 22 * * *' }],
    },
    async ({ step }: { step: any }) => {
        const result = await step.run('snapshot-all-portfolios', () => snapshotAllPortfolios());

        return {
            success: true,
            message: `Snapshotted ${result.snapshotted} portfolio(s), ${result.skipped} skipped`,
        } as const;
    }
)

const SENTIMENT_WINDOW_DAYS = 7;

export const sendWeeklyRecap = inngest.createFunction(
    {
        id: 'send-weekly-recap',
        // Mondays 14:00 UTC = ~9 AM ET. Manual trigger also supported.
        triggers: [{ event: 'app/send.weekly.recap' }, { cron: '0 14 * * 1' }],
    },
    async ({ step }: { step: any }) => {
        const users = await step.run('get-all-users', () => getAllUsersForNewsEmail());
        if (!users || users.length === 0) {
            return { success: false, message: 'No users for weekly recap' };
        }

        // Build per-user context (portfolio + watchlist + profile)
        const contexts = await step.run('build-recap-contexts', async () => {
            const out: Array<{ user: UserForNewsEmail; ctx: any }> = [];
            for (const user of users as UserForNewsEmail[]) {
                try {
                    const ctx = await buildWeeklyRecapContext({
                        userId: user.id,
                        email:  user.email,
                        name:   user.name,
                    });
                    out.push({ user, ctx });
                } catch (e) {
                    console.error('weekly recap: context build failed for', user.email, e);
                }
            }
            return out;
        });

        // AI step per user
        const recaps: Array<{ user: UserForNewsEmail; html: string | null }> = [];
        for (const { user, ctx } of contexts) {
            try {
                const prompt = WEEKLY_RECAP_EMAIL_PROMPT.replace(
                    '{{userContext}}',
                    JSON.stringify(ctx, null, 2)
                );

                const response = await step.ai.infer(`weekly-recap-${user.email}`, {
                    model: step.ai.models.gemini({ model: 'gemini-3-flash-preview' }),
                    body: {
                        contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    },
                });

                const part = response.candidates?.[0]?.content?.parts?.[0];
                const html = (part && 'text' in part ? part.text : null) || null;
                recaps.push({ user, html });
            } catch (e) {
                console.error('weekly recap: AI failed for', user.email, e);
                recaps.push({ user, html: null });
            }
        }

        // Send emails in parallel
        await step.run('send-recap-emails', async () => {
            await Promise.all(
                recaps.map(async ({ user, html }) => {
                    if (!html) return;
                    try {
                        await sendWeeklyRecapEmail({
                            email:        user.email,
                            date:         getFormattedTodayDate(),
                            recapContent: html,
                        });
                    } catch (e) {
                        console.error('weekly recap: send email failed for', user.email, e);
                    }
                })
            );
        });

        const sent = recaps.filter((r) => r.html).length;
        return { success: true, message: `Weekly recap sent to ${sent}/${users.length} user(s)` } as const;
    }
)

export const checkSentimentAlerts = inngest.createFunction(
    {
        id: 'check-sentiment-alerts',
        // Hourly, mirrors the price alert cadence.
        triggers: [{ event: 'app/check.sentiment.alerts' }, { cron: '0 * * * *' }],
    },
    async ({ step }: { step: any }) => {
        const allAlerts = await step.run('get-all-alerts', () => getAllAlertsWithUserEmails());
        const alerts = (allAlerts || []).filter((a: any) => a.alertCategory === 'sentiment');

        if (alerts.length === 0) {
            return { success: true, message: 'No active sentiment alerts to check' };
        }

        const uniqueSymbols: string[] = [...new Set<string>(alerts.map((a: any) => String(a.symbol)))];

        const summaries = await step.run('fetch-sentiment-summaries', async () => {
            const result: Record<string, { avg: number; count: number } | null> = {};
            await Promise.all(
                uniqueSymbols.map(async (sym: string) => {
                    const s = await getSentimentSummary(sym, SENTIMENT_WINDOW_DAYS);
                    result[sym] = s ? { avg: s.avgSentiment, count: s.articleCount } : null;
                })
            );
            return result;
        });

        const triggered = alerts.filter((a: any) => {
            const summary = summaries[a.symbol];
            if (!summary) return false;
            return a.alertType === 'upper'
                ? summary.avg >= a.threshold
                : summary.avg <= a.threshold;
        });

        if (triggered.length === 0) {
            return { success: true, message: 'No sentiment alerts triggered this run' };
        }

        await step.run('send-sentiment-alert-emails', async () => {
            const timestamp = new Date().toLocaleString('en-US', {
                timeZone: 'America/New_York',
                dateStyle: 'medium',
                timeStyle: 'short',
            });

            await Promise.all(
                triggered.map(async (alert: any) => {
                    const summary = summaries[alert.symbol];
                    if (!summary) return;
                    try {
                        await sendSentimentAlertEmail({
                            email:            alert.userEmail,
                            symbol:           alert.symbol,
                            company:          alert.company,
                            currentSentiment: summary.avg,
                            threshold:        alert.threshold,
                            alertType:        alert.alertType,
                            articleCount:     summary.count,
                            windowDays:       SENTIMENT_WINDOW_DAYS,
                            timestamp,
                        });
                    } catch (e) {
                        console.error('checkSentimentAlerts: failed to send email for', alert.symbol, e);
                    }
                    await deleteAlertById(alert.id);
                })
            );
        });

        return {
            success: true,
            message: `${triggered.length} sentiment alert(s) triggered and emails sent`,
        } as const;
    }
)

export const checkPriceAlerts = inngest.createFunction(
    {
        id: 'check-price-alerts',
        triggers: [{ event: 'app/check.price.alerts' }, { cron: '0 * * * *' }],
    },
    async ({ step }: { step: any }) => {
        // Step 1: Load all active price alerts with their owner's email
        const allAlerts = await step.run('get-all-alerts', () => getAllAlertsWithUserEmails());
        const alerts = (allAlerts || []).filter((a: any) => (a.alertCategory ?? 'price') === 'price');

        if (alerts.length === 0) {
            return { success: true, message: 'No active price alerts to check' };
        }

        // Step 2: Fetch current quotes — one request per unique symbol
        const uniqueSymbols: string[] = [...new Set<string>(alerts.map((a: any) => String(a.symbol)))];

        const quotes = await step.run('fetch-quotes', async () => {
            const result: Record<string, number> = {};
            await Promise.all(
                uniqueSymbols.map(async (sym: string) => {
                    try {
                        const quote = await getStockQuote(sym);
                        if (quote.c) result[sym] = quote.c;
                    } catch (e) {
                        console.error('checkPriceAlerts: failed to fetch quote for', sym, e);
                    }
                })
            );
            return result;
        });

        // Step 3: Identify triggered alerts
        const triggered = alerts.filter((alert: any) => {
            const price = quotes[alert.symbol];
            if (!price) return false;
            return alert.alertType === 'upper' ? price >= alert.threshold : price <= alert.threshold;
        });

        if (triggered.length === 0) {
            return { success: true, message: 'No alerts triggered this run' };
        }

        // Step 4: Send emails and delete triggered alerts
        await step.run('send-alert-emails', async () => {
            const timestamp = new Date().toLocaleString('en-US', {
                timeZone: 'America/New_York',
                dateStyle: 'medium',
                timeStyle: 'short',
            });

            await Promise.all(
                triggered.map(async (alert: any) => {
                    const currentPrice = quotes[alert.symbol];
                    try {
                        await sendPriceAlertEmail({
                            email:        alert.userEmail,
                            symbol:       alert.symbol,
                            company:      alert.company,
                            currentPrice: `$${currentPrice.toFixed(2)}`,
                            targetPrice:  `$${alert.threshold.toFixed(2)}`,
                            alertType:    alert.alertType,
                            timestamp,
                        });
                    } catch (e) {
                        console.error('checkPriceAlerts: failed to send email for', alert.symbol, e);
                    }
                    // Remove the alert so it only fires once
                    await deleteAlertById(alert.id);
                })
            );
        });

        return {
            success: true,
            message: `${triggered.length} alert(s) triggered and emails sent`,
        } as const;
    }
)