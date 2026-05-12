// Server-only direct Gemini REST helper.
// Used for synchronous AI calls (chat, sentiment scoring) where we don't want
// the Inngest job overhead. Background AI work still goes through `step.ai.infer()`
// in lib/inngest/functions.ts.

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-3-flash-preview';
const DEFAULT_TIMEOUT_MS = 30000;

export type GeminiHistoryItem = {
    role: 'user' | 'model';
    text: string;
};

export type AskGeminiOptions = {
    prompt: string;
    system?: string;
    history?: GeminiHistoryItem[];
    model?: string;
    temperature?: number;
    maxTokens?: number;
    timeoutMs?: number;
    responseMimeType?: string;
    responseSchema?: Record<string, unknown>;
};

export async function askGemini(opts: AskGeminiOptions): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

    const model = opts.model ?? DEFAULT_MODEL;
    const url = `${GEMINI_BASE_URL}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const contents = [
        ...(opts.history ?? []).map((h) => ({
            role: h.role,
            parts: [{ text: h.text }],
        })),
        {
            role: 'user' as const,
            parts: [{ text: opts.prompt }],
        },
    ];

    const generationConfig: Record<string, unknown> = {
        temperature: opts.temperature ?? 0.7,
        maxOutputTokens: opts.maxTokens ?? 2048,
    };
    if (opts.responseMimeType) generationConfig.responseMimeType = opts.responseMimeType;
    if (opts.responseSchema) generationConfig.responseSchema = opts.responseSchema;

    const body: Record<string, unknown> = { contents, generationConfig };
    if (opts.system) {
        body.systemInstruction = { parts: [{ text: opts.system }] };
    }

    const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    let res: Response;
    try {
        res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(timeoutMs),
            cache: 'no-store',
        });
    } catch (err) {
        if (err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
            throw new Error(`Gemini request timed out after ${timeoutMs}ms`);
        }
        throw err;
    }

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Gemini request failed ${res.status}: ${text.slice(0, 500)}`);
    }

    const data = (await res.json()) as {
        candidates?: Array<{
            content?: { parts?: Array<{ text?: string }> };
            finishReason?: string;
        }>;
        promptFeedback?: { blockReason?: string };
    };

    if (data.promptFeedback?.blockReason) {
        throw new Error(`Gemini blocked the prompt: ${data.promptFeedback.blockReason}`);
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== 'string' || text.length === 0) {
        const finish = data.candidates?.[0]?.finishReason ?? 'unknown';
        throw new Error(`Gemini returned an empty response (finishReason: ${finish})`);
    }
    return text;
}
