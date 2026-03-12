import { useEffect, useRef } from 'react';

export default function MarketCalendar() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    // Clear previous script if any
    containerRef.current.innerHTML = '';
    
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      "colorTheme": "dark",
      "isTransparent": true,
      "width": "100%",
      "height": "100%",
      "locale": "en",
      "importanceFilter": "-1,0,1",
      "currencyFilter": "USD,EUR,ITL,NZD,CHF,AUD,FRF,JPY,ZAR,TRL,CAD,BAM,DEM,MXN,ESP,GBP"
    });
    
    containerRef.current.appendChild(script);
  }, []);

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 space-y-6">
      <header className="shrink-0">
        <h1 className="text-3xl font-bold text-white tracking-tight">Global Market Calendar</h1>
        <p className="text-[var(--color-tv-text-muted)] mt-1">Official TradingView Economic Calendar. Full historical and future data.</p>
      </header>
      <div className="flex-1 neon-wrapper overflow-hidden shadow-2xl rounded-2xl bg-[var(--color-tv-card-solid)]" ref={containerRef}>
      </div>
    </div>
  );
}
