"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Bot, Loader2, Send, Sparkles, Trash2, User } from "lucide-react";
import { askStockQuestion } from "@/lib/actions/chat.actions";

const SUGGESTIONS = [
    "What does this company do?",
    "What's been happening recently?",
    "What are the key risks?",
    "How has the stock been performing?",
];

export default function StockChatPanel({
    symbol,
    company,
}: {
    symbol: string;
    company: string;
}) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, pending]);

    const send = (text: string) => {
        const question = text.trim();
        if (!question || pending) return;
        setError(null);

        const historyBefore = messages;
        const userMsg: ChatMessage = { role: "user", text: question };
        setMessages([...historyBefore, userMsg]);
        setInput("");

        startTransition(async () => {
            const result = await askStockQuestion({
                symbol,
                question,
                history: historyBefore,
            });
            if (result.success && result.answer) {
                setMessages([
                    ...historyBefore,
                    userMsg,
                    { role: "model", text: result.answer },
                ]);
            } else {
                setError(result.error || "Something went wrong");
            }
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send(input);
        }
    };

    return (
        <div className="rounded-xl border border-gray-700 bg-gray-800/40 flex flex-col h-[500px]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    <h3 className="text-gray-100 font-medium">Ask about {symbol}</h3>
                </div>
                {messages.length > 0 && (
                    <button
                        type="button"
                        onClick={() => {
                            setMessages([]);
                            setError(null);
                        }}
                        className="text-gray-500 hover:text-gray-300 text-xs flex items-center gap-1 cursor-pointer"
                        title="Clear conversation"
                    >
                        <Trash2 className="w-3 h-3" />
                        Clear
                    </button>
                )}
            </div>

            {/* Messages */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
            >
                {messages.length === 0 && !pending && (
                    <div className="flex flex-col gap-3">
                        <p className="text-gray-400 text-sm">
                            Ask anything about {company}. Grounded in live price and recent news.
                        </p>
                        <div className="flex flex-col gap-2">
                            {SUGGESTIONS.map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => send(s)}
                                    className="text-left text-sm text-gray-300 px-3 py-2 rounded-md border border-gray-700 hover:border-yellow-500/40 hover:bg-yellow-500/5 cursor-pointer transition-colors"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((m, i) => (
                    <div
                        key={i}
                        className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        {m.role === "model" && (
                            <span className="shrink-0 w-7 h-7 rounded-full bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center">
                                <Bot className="w-3.5 h-3.5 text-yellow-400" />
                            </span>
                        )}
                        <div
                            className={`max-w-[80%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap break-words ${
                                m.role === "user"
                                    ? "bg-yellow-500/15 border border-yellow-500/30 text-gray-100"
                                    : "bg-gray-800/80 border border-gray-700 text-gray-200"
                            }`}
                        >
                            {m.text}
                        </div>
                        {m.role === "user" && (
                            <span className="shrink-0 w-7 h-7 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center">
                                <User className="w-3.5 h-3.5 text-gray-300" />
                            </span>
                        )}
                    </div>
                ))}

                {pending && (
                    <div className="flex gap-2 justify-start">
                        <span className="shrink-0 w-7 h-7 rounded-full bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center">
                            <Bot className="w-3.5 h-3.5 text-yellow-400" />
                        </span>
                        <div className="px-3 py-2 rounded-lg bg-gray-800/80 border border-gray-700 text-gray-400 text-sm flex items-center gap-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Thinking…
                        </div>
                    </div>
                )}

                {error && (
                    <div className="px-3 py-2 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                        {error}
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="border-t border-gray-700 p-3">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={`Ask about ${symbol}…`}
                        disabled={pending}
                        maxLength={1000}
                        className="flex-1 px-3 py-2 rounded-md bg-gray-900 border border-gray-700 text-gray-100 text-sm placeholder:text-gray-600 focus:outline-none focus:border-yellow-500/50 disabled:opacity-50"
                    />
                    <button
                        type="button"
                        onClick={() => send(input)}
                        disabled={pending || !input.trim()}
                        className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-md bg-yellow-500 text-yellow-950 hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        title="Send"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
