"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, Trash2 } from "lucide-react";
import { deleteAlert } from "@/lib/actions/alert.actions";
import { toast } from "sonner";
import { StockLogo } from "@/components/StockLogo";

export default function AlertsList({ alertData, logos }: AlertsListProps) {
    const [pending, startTransition] = useTransition();
    const router = useRouter();
    const alerts = alertData ?? [];

    const handleDelete = (alertId: string, symbol: string) => {
        startTransition(async () => {
            const result = await deleteAlert(alertId);
            if (result.success) {
                toast.success(`Alert for ${symbol} removed`);
                router.refresh();
            } else {
                toast.error("Could not remove alert");
            }
        });
    };

    if (alerts.length === 0) {
        return (
            <div className="bg-[#141414] rounded-lg p-10 flex flex-col items-center justify-center text-center">
                <Bell className="w-10 h-10 mb-4 text-gray-600" />
                <p className="text-[15px] font-medium text-gray-500">No active alerts</p>
                <p className="text-sm mt-1.5 text-gray-600">
                    Click <span className="text-yellow-500">Add Alert</span> next to any stock
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {alerts.map((alert) => (
                <div key={alert.id} className="bg-[#141414] rounded-lg p-5">

                    {/* Top row: logo + name + symbol */}
                    <div className="flex items-center gap-3 mb-3">
                        <StockLogo symbol={alert.symbol} logo={logos?.[alert.symbol]} size={36} />
                        <span className="text-[15px] font-medium text-white flex-1 truncate">
                            {alert.company}
                        </span>
                        <span className="text-[13px] text-gray-400 shrink-0">{alert.symbol}</span>
                    </div>

                    {/* Divider + rule + actions */}
                    <div className="border-t border-white/[0.08] pt-3 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                            <div className="text-xs text-gray-500 mb-1 flex items-center gap-1.5">
                                {alert.alertCategory === 'sentiment' ? 'Sentiment alert' : 'Price alert'}
                            </div>
                            <div className="text-[14px] font-medium text-white">
                                {alert.alertCategory === 'sentiment'
                                    ? `Sentiment ${alert.alertType === 'upper' ? '≥' : '≤'} ${alert.threshold >= 0 ? '+' : ''}${alert.threshold.toFixed(2)}`
                                    : `Price ${alert.alertType === 'upper' ? '>' : '<'} $${alert.threshold.toFixed(2)}`}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <span className="bg-[#3a3520] text-yellow-400 text-[11px] px-2.5 py-1 rounded font-medium">
                                Once
                            </span>
                            <button
                                className="text-gray-500 hover:text-red-400 transition-colors p-1"
                                title="Remove alert"
                                onClick={() => handleDelete(alert.id, alert.symbol)}
                                disabled={pending}
                            >
                                <Trash2 className="w-[18px] h-[18px]" />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
