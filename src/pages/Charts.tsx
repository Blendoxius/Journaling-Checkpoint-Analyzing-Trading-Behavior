import { AdvancedRealTimeChart } from 'react-ts-tradingview-widgets';

export default function Charts() {
  return (
    <div className="h-full flex flex-col p-4 sm:p-6 space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center shrink-0 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Charts</h1>
          <p className="text-[var(--color-tv-text-muted)] mt-1">Analyze markets with TradingView. Use the top toolbar to search symbols and brokers.</p>
        </div>
      </header>

      <div className="flex-1 neon-wrapper overflow-hidden shadow-2xl rounded-2xl">
        <AdvancedRealTimeChart 
          theme="dark"
          symbol="OANDA:XAUUSD"
          autosize
          allow_symbol_change={true}
          hide_side_toolbar={false}
          toolbar_bg="rgba(10, 10, 10, 1)"
        />
      </div>
    </div>
  );
}
