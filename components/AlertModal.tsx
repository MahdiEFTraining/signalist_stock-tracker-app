"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createAlert } from "@/lib/actions/alert.actions";
import { Controller } from "react-hook-form";
import { DollarSign, Sparkles } from "lucide-react";

type FormValues = {
    alertName: string;
    alertCategory: 'price' | 'sentiment';
    alertType: 'upper' | 'lower';
    threshold: string;
};

export default function AlertModal({ symbol, company }: { symbol: string; company: string }) {
    const [open, setOpen] = useState(false);
    const [pending, startTransition] = useTransition();
    const router = useRouter();

    const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm<FormValues>({
        defaultValues: {
            alertName: `${symbol} Alert`,
            alertCategory: 'price',
            alertType: 'upper',
            threshold: '',
        },
    });

    const category = watch('alertCategory');
    const isSentiment = category === 'sentiment';

    const onSubmit = (values: FormValues) => {
        startTransition(async () => {
            const result = await createAlert({
                symbol,
                company,
                alertName:     values.alertName,
                alertCategory: values.alertCategory,
                alertType:     values.alertType,
                threshold:     values.threshold,
            });

            if (result.success) {
                const display = isSentiment
                    ? `${parseFloat(values.threshold) >= 0 ? '+' : ''}${parseFloat(values.threshold).toFixed(2)}`
                    : `$${values.threshold}`;
                toast.success('Alert created', {
                    description: `You'll be notified when ${symbol} ${isSentiment ? 'sentiment' : 'price'} ${values.alertType === 'upper' ? 'crosses above' : 'crosses below'} ${display}`,
                });
                reset();
                setOpen(false);
                router.refresh();
            } else {
                toast.error('Failed to create alert', {
                    description: result.error,
                });
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button className="add-alert">+ Add Alert</button>
            </DialogTrigger>

            <DialogContent className="alert-dialog sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="alert-title">
                        Price Alert — {symbol}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-2">
                    {/* Category toggle */}
                    <div className="flex flex-col gap-1.5">
                        <Label className="form-label">Alert On</Label>
                        <Controller
                            control={control}
                            name="alertCategory"
                            render={({ field }) => (
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => field.onChange('price')}
                                        className={`flex items-center justify-center gap-2 py-2 rounded-md border transition-colors cursor-pointer ${
                                            field.value === 'price'
                                                ? 'bg-yellow-500/15 border-yellow-500/40 text-yellow-300'
                                                : 'border-gray-600 text-gray-400 hover:bg-gray-800'
                                        }`}
                                    >
                                        <DollarSign className="w-4 h-4" />
                                        Price
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => field.onChange('sentiment')}
                                        className={`flex items-center justify-center gap-2 py-2 rounded-md border transition-colors cursor-pointer ${
                                            field.value === 'sentiment'
                                                ? 'bg-yellow-500/15 border-yellow-500/40 text-yellow-300'
                                                : 'border-gray-600 text-gray-400 hover:bg-gray-800'
                                        }`}
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        Sentiment
                                    </button>
                                </div>
                            )}
                        />
                    </div>

                    {/* Alert name */}
                    <div className="flex flex-col gap-1.5">
                        <Label className="form-label">Alert Name</Label>
                        <Input
                            {...register('alertName', { required: 'Alert name is required' })}
                            placeholder="e.g. AAPL Buy Target"
                            className="form-input"
                        />
                        {errors.alertName && (
                            <p className="text-red-500 text-sm">{errors.alertName.message}</p>
                        )}
                    </div>

                    {/* Alert type */}
                    <div className="flex flex-col gap-1.5">
                        <Label className="form-label">Alert Type</Label>
                        <Controller
                            control={control}
                            name="alertType"
                            rules={{ required: true }}
                            render={({ field }) => (
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger className="select-trigger">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-800 border-gray-600 text-gray-400">
                                        <SelectItem value="upper" className="cursor-pointer hover:bg-gray-700 focus:bg-gray-700">
                                            📈 {isSentiment ? 'Sentiment Above' : 'Price Above'} (upper)
                                        </SelectItem>
                                        <SelectItem value="lower" className="cursor-pointer hover:bg-gray-700 focus:bg-gray-700">
                                            📉 {isSentiment ? 'Sentiment Below' : 'Price Below'} (lower)
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>

                    {/* Threshold */}
                    <div className="flex flex-col gap-1.5">
                        <Label className="form-label">
                            {isSentiment ? 'Sentiment Threshold (-1 to +1)' : 'Target Price (USD)'}
                        </Label>
                        <Input
                            {...register('threshold', {
                                required: isSentiment ? 'Threshold is required' : 'Target price is required',
                                validate: (v) => {
                                    const n = parseFloat(v);
                                    if (isNaN(n)) return 'Must be a number';
                                    if (isSentiment) {
                                        return (n >= -1 && n <= 1) || 'Must be between -1 and 1';
                                    }
                                    return n > 0 || 'Must be a positive number';
                                },
                            })}
                            type="number"
                            step={isSentiment ? '0.1' : '0.01'}
                            min={isSentiment ? '-1' : '0.01'}
                            max={isSentiment ? '1' : undefined}
                            placeholder={isSentiment ? 'e.g. 0.5 (positive) or -0.3 (negative)' : 'e.g. 180.00'}
                            className="form-input"
                        />
                        {errors.threshold && (
                            <p className="text-red-500 text-sm">{errors.threshold.message}</p>
                        )}
                        {isSentiment && (
                            <p className="text-xs text-gray-500">
                                Based on AI scoring of recent news headlines (7-day rolling avg).
                            </p>
                        )}
                    </div>

                    <DialogFooter className="mt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            className="border-gray-600 text-gray-400 hover:bg-gray-700"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={pending}
                            className="yellow-btn px-6"
                        >
                            {pending ? 'Saving…' : 'Set Alert'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
