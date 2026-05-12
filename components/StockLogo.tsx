"use client";

import { useState } from "react";

const AVATAR_COLORS = [
    "#1877f2", "#e31937", "#059669", "#7c3aed",
    "#d97706", "#0891b2", "#be185d", "#6366f1",
];

function avatarColor(symbol: string): string {
    return AVATAR_COLORS[symbol.charCodeAt(0) % AVATAR_COLORS.length];
}

export function StockLogo({
    symbol,
    logo,
    size = 32,
}: {
    symbol: string;
    logo?: string;
    size?: number;
}) {
    const [failed, setFailed] = useState(false);
    const style = { width: size, height: size };

    if (logo && !failed) {
        return (
            <img
                src={logo}
                alt={symbol}
                style={style}
                className="rounded object-contain bg-white/5 shrink-0"
                onError={() => setFailed(true)}
            />
        );
    }

    return (
        <div
            style={{ ...style, backgroundColor: avatarColor(symbol) }}
            className="rounded shrink-0 flex items-center justify-center text-white font-bold"
        >
            <span style={{ fontSize: size * 0.4 }}>{symbol.slice(0, 1)}</span>
        </div>
    );
}
