import { useEffect, useState } from 'react';
import axios from 'axios';
import { Trade, CalendarEvent } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Activity, Target, AlertCircle, BookOpen } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function Dashboard() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [news, setNews] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch trades
        const tradesRes = await axios.get('/api/trades');
        setTrades(tradesRes.data);

        // Fetch news with cache
        const cacheKey = 'market_checkpoint_news_cache';
        const cachedData = sessionStorage.getItem(cacheKey);
        
        if (cachedData) {
          try {
            const parsed = JSON.parse(cachedData);
            if (parsed && parsed.length > 0) {
              setNews(parsed);
            }
            // Fetch in background to update cache
            axios.get('/api/calendar').then(newsRes => {
              if (newsRes.data && newsRes.data.length > 0) {
                setNews(newsRes.data);
                sessionStorage.setItem(cacheKey, JSON.stringify(newsRes.data));
              }
            }).catch(e => console.error('Background news fetch failed', e));
          } catch (e) {
            const newsRes = await axios.get('/api/calendar');
            if (newsRes.data && newsRes.data.length > 0) {
              setNews(newsRes.data);
              sessionStorage.setItem(cacheKey, JSON.stringify(newsRes.data));
            }
          }
        } else {
          const newsRes = await axios.get('/api/calendar');
          if (newsRes.data && newsRes.data.length > 0) {
            setNews(newsRes.data);
            sessionStorage.setItem(cacheKey, JSON.stringify(newsRes.data));
          }
        }
      } catch (error) {
        console.error('Failed to fetch data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
  const winRate = trades.length > 0 
    ? (trades.filter(t => t.pnl > 0).length / trades.length) * 100 
    : 0;
  const totalTrades = trades.length;

  const chartData = trades.slice().reverse().map((t, index) => {
    const cumulativePnL = trades.slice().reverse().slice(0, index + 1).reduce((sum, tr) => sum + tr.pnl, 0);
    return {
      name: format(parseISO(t.date), 'MMM dd'),
      pnl: cumulativePnL
    };
  });

  const highImpactNews = news.filter(n => n.impact === 'High').slice(0, 5);

  if (loading) {
    return <div className="p-8 text-slate-400">Loading dashboard...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
        <p className="text-[var(--color-tv-text-muted)] mt-1">Overview of your trading performance and upcoming events.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="neon-wrapper p-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-[var(--color-tv-text-muted)]">Total Net PnL</h3>
            <Activity className="w-5 h-5 text-[var(--color-tv-text-muted)]" />
          </div>
          <div className="mt-4 flex items-baseline">
            <span className={"text-4xl font-light tracking-tight " + (totalPnL >= 0 ? 'text-[var(--color-tv-green)]' : 'text-[var(--color-tv-red)]')}>
              ${totalPnL.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="neon-wrapper p-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-[var(--color-tv-text-muted)]">Win Rate</h3>
            <Target className="w-5 h-5 text-[var(--color-tv-text-muted)]" />
          </div>
          <div className="mt-4 flex items-baseline">
            <span className="text-4xl font-light tracking-tight text-white">
              {winRate.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="neon-wrapper p-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-[var(--color-tv-text-muted)]">Total Trades</h3>
            <BookOpen className="w-5 h-5 text-[var(--color-tv-text-muted)]" />
          </div>
          <div className="mt-4 flex items-baseline">
            <span className="text-4xl font-light tracking-tight text-white">
              {totalTrades}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 neon-wrapper p-6 shadow-2xl">
          <h3 className="text-lg font-medium text-white mb-6">Equity Curve</h3>
          <div className="h-80">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-tv-accent)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--color-tv-accent)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-tv-border-solid)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--color-tv-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-tv-text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--color-tv-card-solid)', borderColor: 'var(--color-tv-border-solid)', color: '#fff' }}
                    itemStyle={{ color: 'var(--color-tv-accent)' }}
                  />
                  <Area type="monotone" dataKey="pnl" stroke="var(--color-tv-accent)" strokeWidth={2} fillOpacity={1} fill="url(#colorPnL)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                No trades logged yet.
              </div>
            )}
          </div>
        </div>

        {/* High Impact News */}
        <div className="neon-wrapper p-6 shadow-2xl flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-white">High Impact News</h3>
            <AlertCircle className="w-5 h-5 text-[var(--color-tv-red)]" />
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
            {highImpactNews.length > 0 ? (
              highImpactNews.map((item, i) => (
                <div key={i} className="p-4 rounded-xl bg-[var(--color-tv-dark)]/50 border border-[var(--color-tv-border-solid)]">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-[var(--color-tv-red)]/20 text-[var(--color-tv-red)]">
                      {item.country}
                    </span>
                    <span className="text-xs text-[var(--color-tv-text-muted)] font-mono">
                      {item.date} {item.time}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <div className="mt-3 flex gap-4 text-xs text-[var(--color-tv-text-muted)]">
                    <div>Forecast: <span className="text-[var(--color-tv-text)]">{item.forecast || '-'}</span></div>
                    <div>Prev: <span className="text-[var(--color-tv-text)]">{item.previous || '-'}</span></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-[var(--color-tv-text-muted)] text-sm py-4 text-center">No high impact news this week.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
