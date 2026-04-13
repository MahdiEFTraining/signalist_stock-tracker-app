'use client'

// TradingViewWidget.jsx
import React, { useEffect, useRef, memo } from 'react';
import useTradingViewWidget  from "@/hooks/useTradingViewWidget";
import {cn} from "@/lib/utils";

interface TradingViewWidgetProps {
    title?: string;
    scriptUrl: string;
    config: Record<string, unknown>;
    height?: number;
    className?: string;
}

const TradingViewWidget = ({title, scriptUrl, config, height = 600, className}:TradingViewWidgetProps)=> {
    const containerRef = useTradingViewWidget(scriptUrl, config, height);

    return (
        <div className= "w-full">
            {title && <h3 className="font-semibold text-2x1 text-gray-100 mb-5">{title}</h3>}
        <div className={cn('tradingview-widget-container', className)} ref={containerRef}>
            <div className="tradingview-widget-container__widget" style={{ height: "calc(100% - 32px)", width: "100%" }}></div>
            <div className="tradingview-widget-copyright"><a href="https://www.tradingview.com/symbols/NASDAQ-AAPL/" rel="noopener nofollow" target="_blank"><span className="blue-text">AAPL stock chart</span></a><span className="trademark"> by TradingView</span></div>
        </div>
        </div>
    );
}

export default memo(TradingViewWidget);
