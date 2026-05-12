import nodemailer from "nodemailer";
import {
    WELCOME_EMAIL_TEMPLATE,
    NEWS_SUMMARY_EMAIL_TEMPLATE,
    STOCK_ALERT_UPPER_EMAIL_TEMPLATE,
    STOCK_ALERT_LOWER_EMAIL_TEMPLATE,
    SENTIMENT_ALERT_EMAIL_TEMPLATE,
    WEEKLY_RECAP_EMAIL_TEMPLATE,
    PASSWORD_RESET_EMAIL_TEMPLATE,
} from "@/lib/nodemailer/templates";

export const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.NODEMAILER_EMAIL!,
        pass: process.env.NODEMAILER_PASSWORD!,
    }
})

export const sendWelcomeEmail = async ({ email, name, intro }: WelcomeEmailData) => {
   const htmlTemplate = WELCOME_EMAIL_TEMPLATE
       .replace('{{name}}', name)
       .replace('{{intro}}', intro);

   const mailOptions = {
       from: '"Wealthflow <wealthflow@gmail.com>"',
       to: email,
       subject: `Welcome to Signalist - your stock market toolkit is ready!`,
       text: 'Thanks for joining Wealthflow ',
       html: htmlTemplate,
   }

   await transporter.sendMail(mailOptions);
}

export const sendNewsSummaryEmail = async ({ email, date, newsContent }: { email: string; date: string; newsContent: string}):Promise<void> => {
    const htmlTemplate = NEWS_SUMMARY_EMAIL_TEMPLATE
        .replace('{{date}}', date)
        .replace('{{newsContent}}', newsContent);

    const mailOptions = {
        from: `"Wealthflow News" <wealthflow@gmail.com>`,
        to: email,
        subject: `Market News Summary Today - ${date}`,
        text: `Today's market news summary from WealthFlow`,
        html: htmlTemplate,
    }

    await transporter.sendMail(mailOptions);
}

export const sendPasswordResetEmail = async ({
    email,
    name,
    resetUrl,
}: {
    email: string;
    name: string;
    resetUrl: string;
}): Promise<void> => {
    const htmlTemplate = PASSWORD_RESET_EMAIL_TEMPLATE
        .replace('{{name}}', name)
        .replace(/\{\{resetUrl\}\}/g, resetUrl);

    const info = await transporter.sendMail({
        from: `"Signalist Account" <${process.env.NODEMAILER_EMAIL}>`,
        to: email,
        subject: 'Reset your Signalist password',
        text: `Reset your Signalist password: ${resetUrl}`,
        html: htmlTemplate,
    });

    console.log('[sendPasswordResetEmail] sendMail result', {
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
        response: info.response,
    });
};

export const sendPriceAlertEmail = async ({
    email,
    symbol,
    company,
    currentPrice,
    targetPrice,
    alertType,
    timestamp,
}: {
    email: string;
    symbol: string;
    company: string;
    currentPrice: string;
    targetPrice: string;
    alertType: 'upper' | 'lower';
    timestamp: string;
}): Promise<void> => {
    const template = alertType === 'upper'
        ? STOCK_ALERT_UPPER_EMAIL_TEMPLATE
        : STOCK_ALERT_LOWER_EMAIL_TEMPLATE;

    const htmlTemplate = template
        .replace(/\{\{symbol\}\}/g, symbol)
        .replace(/\{\{company\}\}/g, company)
        .replace(/\{\{currentPrice\}\}/g, currentPrice)
        .replace(/\{\{targetPrice\}\}/g, targetPrice)
        .replace(/\{\{timestamp\}\}/g, timestamp);

    const subject = alertType === 'upper'
        ? `📈 Price Alert: ${symbol} hit your upper target of ${targetPrice}`
        : `📉 Price Alert: ${symbol} dropped to your lower target of ${targetPrice}`;

    const mailOptions = {
        from: `"Signalist Alerts" <wealthflow@gmail.com>`,
        to: email,
        subject,
        text: `Price alert triggered for ${symbol}: current price is ${currentPrice}`,
        html: htmlTemplate,
    };

    await transporter.sendMail(mailOptions);
}

export const sendWeeklyRecapEmail = async ({
    email,
    date,
    recapContent,
}: {
    email: string;
    date: string;
    recapContent: string;
}): Promise<void> => {
    const htmlTemplate = WEEKLY_RECAP_EMAIL_TEMPLATE
        .replace('{{date}}', date)
        .replace('{{recapContent}}', recapContent);

    await transporter.sendMail({
        from: `"Wealthflow Recap" <wealthflow@gmail.com>`,
        to: email,
        subject: `Your Weekly Portfolio Recap — ${date}`,
        text: 'Your personalized weekly portfolio recap from Wealthflow.',
        html: htmlTemplate,
    });
}

export const sendSentimentAlertEmail = async ({
    email,
    symbol,
    company,
    currentSentiment,
    threshold,
    alertType,
    articleCount,
    windowDays,
    timestamp,
}: {
    email: string;
    symbol: string;
    company: string;
    currentSentiment: number;
    threshold: number;
    alertType: 'upper' | 'lower';
    articleCount: number;
    windowDays: number;
    timestamp: string;
}): Promise<void> => {
    const fmt = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}`;
    const isUp = alertType === 'upper';

    const headerBg = isUp ? '#059669' : '#dc2626';
    const headerEmoji = isUp ? '📈' : '📉';
    const directionVerb = isUp ? 'Turned Positive' : 'Turned Negative';
    const sentimentColor = currentSentiment >= 0 ? '#10b981' : '#ef4444';
    const triggerDescription = isUp
        ? `${windowDays}-day average sentiment (${fmt(currentSentiment)}) crossed above your threshold of ${fmt(threshold)}.`
        : `${windowDays}-day average sentiment (${fmt(currentSentiment)}) crossed below your threshold of ${fmt(threshold)}.`;

    const htmlTemplate = SENTIMENT_ALERT_EMAIL_TEMPLATE
        .replace(/\{\{symbol\}\}/g, symbol)
        .replace(/\{\{company\}\}/g, company)
        .replace(/\{\{currentSentiment\}\}/g, fmt(currentSentiment))
        .replace(/\{\{threshold\}\}/g, fmt(threshold))
        .replace(/\{\{articleCount\}\}/g, String(articleCount))
        .replace(/\{\{windowDays\}\}/g, String(windowDays))
        .replace(/\{\{timestamp\}\}/g, timestamp)
        .replace(/\{\{headerBg\}\}/g, headerBg)
        .replace(/\{\{headerEmoji\}\}/g, headerEmoji)
        .replace(/\{\{directionVerb\}\}/g, directionVerb)
        .replace(/\{\{sentimentColor\}\}/g, sentimentColor)
        .replace(/\{\{triggerDescription\}\}/g, triggerDescription);

    const subject = isUp
        ? `${headerEmoji} Sentiment Alert: ${symbol} turned positive (${fmt(currentSentiment)})`
        : `${headerEmoji} Sentiment Alert: ${symbol} turned negative (${fmt(currentSentiment)})`;

    await transporter.sendMail({
        from: `"Signalist Alerts" <wealthflow@gmail.com>`,
        to: email,
        subject,
        text: `Sentiment alert for ${symbol}: ${windowDays}-day avg is ${fmt(currentSentiment)} (threshold ${fmt(threshold)})`,
        html: htmlTemplate,
    });
}