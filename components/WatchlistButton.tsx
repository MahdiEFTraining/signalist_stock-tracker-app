"use client";

import { useState, useTransition } from "react";
import { Star, Trash2 } from "lucide-react";
import { toggleWatchlist } from "@/lib/actions/watchlist.actions";

const WatchlistButton = ({
    symbol,
    company,
    isInWatchlist,
    showTrashIcon = false,
    type = "button",
    onWatchlistChange,
}: WatchlistButtonProps) => {
    const [added, setAdded] = useState(isInWatchlist);
    const [pending, startTransition] = useTransition();

    const handleClick = (e?: React.MouseEvent) => {
        e?.preventDefault();
        e?.stopPropagation();

        const next = !added;
        setAdded(next);
        onWatchlistChange?.(symbol, next);

        startTransition(async () => {
            const result = await toggleWatchlist(symbol, company);
            if (result.error) {
                setAdded(!next);
                onWatchlistChange?.(symbol, !next);
            }
        });
    };

    if (type === "icon") {
        if (showTrashIcon && added) {
            return (
                <button
                    type="button"
                    onClick={handleClick}
                    disabled={pending}
                    className="watchlist-icon-btn p-1.5"
                    title={`Remove ${symbol} from watchlist`}
                >
                    <Trash2 className="trash-icon" />
                </button>
            );
        }

        return (
            <button
                type="button"
                onClick={handleClick}
                disabled={pending}
                className={`p-1.5 rounded-full shrink-0 transition-colors duration-150 cursor-pointer ${
                    added ? "watchlist-icon-added" : "text-gray-600 hover:text-gray-400"
                }`}
                title={added ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`}
            >
                <Star className="w-4 h-4" fill={added ? "currentColor" : "none"} />
            </button>
        );
    }

    return (
        <button
            type="button"
            className={`watchlist-btn flex items-center justify-center ${added ? "watchlist-remove" : ""}`}
            onClick={handleClick}
            disabled={pending}
        >
            <Star className="w-4 h-4 mr-2" fill={added ? "currentColor" : "none"} />
            {added ? "Remove from Watchlist" : "Add to Watchlist"}
        </button>
    );
};

export default WatchlistButton;
