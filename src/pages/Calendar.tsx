import { useState, useEffect } from 'react';
import axios from 'axios';
import { CalendarEvent, Trade } from '../types';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Filter, Plus, X, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { 
  format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday,
  addWeeks, subWeeks, startOfYear, endOfYear, eachMonthOfInterval, addYears, subYears
} from 'date-fns';
import { clsx } from 'clsx';

type ViewMode = 'month' | 'week' | 'year';

export default function Calendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  
  // Filters
  const [showNews, setShowNews] = useState(true);
  const [showTrades, setShowTrades] = useState(true);
  const [selectedImpacts, setSelectedImpacts] = useState<string[]>(['High', 'Medium', 'Low']);

  // Modals
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [isAddTradeOpen, setIsAddTradeOpen] = useState(false);

  // Form State (Matches Journal)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    asset: '',
    direction: 'Long',
    entryPrice: '',
    exitPrice: '',
    size: '',
    pnl: '',
    emotion: 'Neutral',
    notes: ''
  });

  useEffect(() => {
    const fetchCalendar = async () => {
      const cacheKey = 'market_checkpoint_news_cache';
      const cachedData = sessionStorage.getItem(cacheKey);
      
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          if (parsed && parsed.length > 0) {
            setEvents(parsed);
          }
          setLoadingNews(false);
          fetchNewsFromApi(true);
        } catch (e) {
          fetchNewsFromApi(false);
        }
      } else {
        fetchNewsFromApi(false);
      }
    };

    const fetchNewsFromApi = async (isBackground: boolean) => {
      try {
        const res = await axios.get('/api/calendar');
        if (res.data && res.data.length > 0) {
          setEvents(res.data);
          sessionStorage.setItem('market_checkpoint_news_cache', JSON.stringify(res.data));
        }
      } catch (error) {
        console.error('Failed to fetch calendar', error);
      } finally {
        if (!isBackground) setLoadingNews(false);
      }
    };

    fetchTrades();
    fetchCalendar();
  }, []);

  const fetchTrades = async () => {
    try {
      const res = await axios.get('/api/trades');
      setTrades(res.data);
    } catch (error) {
      console.error('Failed to fetch trades', error);
    }
  };

  const handleToggleImpact = (impact: string) => {
    if (impact === 'All') {
      setSelectedImpacts(['High', 'Medium', 'Low']);
      return;
    }
    
    setSelectedImpacts(prev => {
      if (prev.includes(impact)) {
        return prev.filter(i => i !== impact);
      } else {
        const newImpacts = [...prev, impact];
        return newImpacts;
      }
    });
  };

  const handleAddTradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/trades', {
        ...formData,
        entryPrice: Number(formData.entryPrice),
        exitPrice: Number(formData.exitPrice),
        size: Number(formData.size),
        pnl: Number(formData.pnl)
      });
      setIsAddTradeOpen(false);
      fetchTrades();
      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        asset: '',
        direction: 'Long',
        entryPrice: '',
        exitPrice: '',
        size: '',
        pnl: '',
        emotion: 'Neutral',
        notes: ''
      });
    } catch (error) {
      console.error('Failed to add trade', error);
    }
  };

  const openAddTradeModal = (date: Date) => {
    setFormData(prev => ({ ...prev, date: format(date, 'yyyy-MM-dd') }));
    setIsAddTradeOpen(true);
  };

  const nextPeriod = () => {
    if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else if (viewMode === 'year') setCurrentDate(addYears(currentDate, 1));
  };

  const prevPeriod = () => {
    if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else if (viewMode === 'year') setCurrentDate(subYears(currentDate, 1));
  };

  const getDaysToRender = () => {
    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(monthStart);
      const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
      const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: startDate, end: endDate });
    } else if (viewMode === 'week') {
      const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
      const endDate = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: startDate, end: endDate });
    }
    return [];
  };

  const getMonthsToRender = () => {
    const yearStart = startOfYear(currentDate);
    const yearEnd = endOfYear(currentDate);
    return eachMonthOfInterval({ start: yearStart, end: yearEnd });
  };

  const getTradeColor = (pnl: number) => pnl >= 0 ? 'bg-[var(--color-tv-green)] text-black' : 'bg-[var(--color-tv-red)] text-white';

  const renderDayCell = (day: Date) => {
    const isCurrentMonth = isSameMonth(day, currentDate);
    const isDayToday = isToday(day);
    
    const dayTrades = showTrades ? trades.filter(t => isSameDay(parseISO(t.date), day)) : [];
    const dayNews = showNews ? events.filter(e => {
      try {
        const eDate = new Date(e.date);
        return isSameDay(eDate, day) && selectedImpacts.includes(e.impact);
      } catch { return false; }
    }) : [];

    return (
      <div 
        key={day.toISOString()} 
        onClick={() => setSelectedDay(day)}
        className={clsx(
          "p-2 border-r border-b border-[var(--color-tv-border-solid)]/50 transition-colors cursor-pointer",
          !isCurrentMonth && viewMode === 'month' ? 'bg-[var(--color-tv-dark)]/50 opacity-50' : 'hover:bg-[var(--color-tv-border-solid)]/30',
          viewMode === 'week' ? 'min-h-[400px]' : 'min-h-[120px]'
        )}
      >
        <div className="flex justify-between items-start mb-2">
          <span className={clsx(
            "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
            isDayToday ? 'bg-[var(--color-tv-accent)] text-white' : 'text-[var(--color-tv-text)]'
          )}>
            {format(day, 'd')}
          </span>
          {dayTrades.length > 0 && <span className="text-[10px] text-[var(--color-tv-text-muted)]">{dayTrades.length} Trades</span>}
        </div>
        
        <div className={clsx("space-y-1.5 overflow-y-auto custom-scrollbar pr-1", viewMode === 'week' ? 'max-h-[350px]' : 'max-h-[100px]')}>
          {dayTrades.map(trade => (
            <div key={trade.id} className={clsx("text-xs px-2 py-1 rounded flex justify-between items-center", getTradeColor(trade.pnl))}>
              <span className="font-semibold truncate">{trade.asset}</span>
              <span>{trade.pnl > 0 ? '+' : ''}{trade.pnl}</span>
            </div>
          ))}

          {dayNews.map((news, i) => (
            <div 
              key={i} 
              className="text-xs px-2 py-1 rounded bg-[var(--color-tv-border-solid)] text-[var(--color-tv-text)] flex flex-col gap-0.5 border-l-2"
              style={{ borderLeftColor: news.impact === 'High' ? 'var(--color-tv-red)' : news.impact === 'Medium' ? '#f59e0b' : 'var(--color-tv-green)' }}
            >
              <div className="flex items-center gap-1.5 opacity-70">
                <Clock className="w-3 h-3" />
                <span className="font-mono text-[10px]">{news.time}</span>
                <span className="font-semibold text-[10px] ml-auto">{news.country}</span>
              </div>
              <span className="truncate" title={news.title}>{news.title}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderYearMonthGrid = (month: Date) => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="mt-2">
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <div key={i} className="text-[8px] text-center font-bold text-[var(--color-tv-text-muted)]">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {days.map((day, idx) => {
            const isCurrentMonth = isSameMonth(day, month);
            const isDayToday = isToday(day);
            const hasTrades = trades.some(t => isSameDay(parseISO(t.date), day));
            
            return (
              <div 
                key={idx}
                title={format(day, 'MMM d, yyyy')}
                className={clsx(
                  "w-full aspect-square rounded-[2px] flex items-center justify-center text-[7px] font-medium",
                  !isCurrentMonth ? 'opacity-0' : 
                  isDayToday ? 'bg-[var(--color-neon-cyan)] text-black font-bold' :
                  hasTrades ? 'bg-[var(--color-tv-accent)]/80 text-white' :
                  'bg-[var(--color-tv-border-solid)] text-[var(--color-tv-text-muted)]'
                )}
              >
                {isCurrentMonth ? format(day, 'd') : ''}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const isAllImpactsSelected = selectedImpacts.length === 3;

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 shrink-0">
        <header>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center">
            <CalendarIcon className="w-8 h-8 mr-3 text-[var(--color-neon-cyan)]" />
            Interactive Calendar
          </h1>
          <p className="text-[var(--color-tv-text-muted)] mt-1">
            Manage trades and track market events.
          </p>
        </header>

        <div className="flex flex-wrap items-center gap-3 neon-wrapper p-2">
          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 px-2 border-r border-[var(--color-tv-border-solid)]">
            {(['week', 'month', 'year'] as ViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={clsx(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize",
                  viewMode === mode ? 'bg-[var(--color-neon-blue)]/20 text-[var(--color-neon-blue)]' : 'text-[var(--color-tv-text-muted)] hover:text-white'
                )}
              >
                {mode}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 px-2 border-r border-[var(--color-tv-border-solid)]">
            <Filter className="w-4 h-4 text-[var(--color-tv-text-muted)]" />
            <button
              onClick={() => setShowTrades(!showTrades)}
              className={clsx("px-3 py-1.5 rounded-md text-sm font-medium transition-colors", showTrades ? 'bg-[var(--color-tv-accent)]/20 text-[var(--color-tv-accent)]' : 'text-[var(--color-tv-text-muted)] hover:text-white')}
            >
              Trades
            </button>
            <button
              onClick={() => setShowNews(!showNews)}
              className={clsx("px-3 py-1.5 rounded-md text-sm font-medium transition-colors", showNews ? 'bg-[var(--color-tv-accent)]/20 text-[var(--color-tv-accent)]' : 'text-[var(--color-tv-text-muted)] hover:text-white')}
            >
              News
            </button>
          </div>
          
          {showNews && (
            <div className="flex items-center gap-1 px-2">
              <button
                onClick={() => handleToggleImpact('All')}
                className={clsx("px-3 py-1.5 rounded-md text-xs font-medium transition-colors", isAllImpactsSelected ? 'bg-[var(--color-tv-border-solid)] text-white' : 'text-[var(--color-tv-text-muted)] hover:text-white')}
              >
                All
              </button>
              {['High', 'Medium', 'Low'].map(impact => (
                <button
                  key={impact}
                  onClick={() => handleToggleImpact(impact)}
                  className={clsx("px-3 py-1.5 rounded-md text-xs font-medium transition-colors", selectedImpacts.includes(impact) && !isAllImpactsSelected ? 'bg-[var(--color-tv-border-solid)] text-white' : 'text-[var(--color-tv-text-muted)] hover:text-white')}
                >
                  {impact}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 neon-wrapper overflow-hidden shadow-2xl flex flex-col">
        {/* Calendar Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-tv-border-solid)] shrink-0">
          <h2 className="text-xl font-bold text-white">
            {viewMode === 'year' ? format(currentDate, 'yyyy') : format(currentDate, 'MMMM yyyy')}
            {viewMode === 'week' && <span className="text-sm text-[var(--color-tv-text-muted)] ml-2">(Week {format(currentDate, 'w')})</span>}
          </h2>
          <div className="flex gap-2">
            <button onClick={prevPeriod} className="p-2 rounded-lg hover:bg-[var(--color-tv-border-solid)] text-[var(--color-tv-text-muted)] hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--color-tv-border-solid)] text-[var(--color-tv-text-muted)] hover:text-white transition-colors">
              Today
            </button>
            <button onClick={nextPeriod} className="p-2 rounded-lg hover:bg-[var(--color-tv-border-solid)] text-[var(--color-tv-text-muted)] hover:text-white transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar">
          {viewMode === 'year' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
              {getMonthsToRender().map(month => (
                <div key={month.toISOString()} className="bg-[var(--color-tv-dark)]/50 border border-[var(--color-tv-border-solid)] rounded-lg p-4">
                  <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-wider">{format(month, 'MMMM')}</h3>
                  {renderYearMonthGrid(month)}
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-7 border-b border-[var(--color-tv-border-solid)] shrink-0 sticky top-0 bg-[var(--color-tv-card-solid)] z-10">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <div key={day} className="py-3 text-center text-xs font-semibold text-[var(--color-tv-text-muted)] uppercase tracking-wider">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 auto-rows-fr">
                {getDaysToRender().map(day => renderDayCell(day))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Day Detail Modal */}
      {selectedDay && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm">
          <div className="bg-[var(--color-tv-card-solid)] border border-[var(--color-tv-border-solid)] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden neon-wrapper">
            <div className="flex items-center justify-between p-6 border-b border-[var(--color-tv-border-solid)]">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <span className="bg-[var(--color-neon-cyan)]/20 text-[var(--color-neon-cyan)] px-3 py-1 rounded-lg">
                  {format(selectedDay, 'd')}
                </span>
                {format(selectedDay, 'MMMM yyyy')}
              </h2>
              <button onClick={() => setSelectedDay(null)} className="p-2 text-[var(--color-tv-text-muted)] hover:text-white hover:bg-[var(--color-tv-border-solid)] rounded-lg transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">
              {/* Trades Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Trades</h3>
                  <button 
                    onClick={() => openAddTradeModal(selectedDay)}
                    className="text-xs flex items-center gap-1 text-[var(--color-neon-cyan)] hover:underline"
                  >
                    <Plus className="w-3 h-3" /> Add Trade
                  </button>
                </div>
                <div className="space-y-2">
                  {trades.filter(t => isSameDay(parseISO(t.date), selectedDay)).length === 0 ? (
                    <p className="text-[var(--color-tv-text-muted)] text-sm">No trades recorded for this day.</p>
                  ) : (
                    trades.filter(t => isSameDay(parseISO(t.date), selectedDay)).map(trade => (
                      <div key={trade.id} className="p-4 rounded-lg bg-[var(--color-tv-dark)] border border-[var(--color-tv-border-solid)] flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-white text-lg">{trade.asset}</span>
                            <span className={clsx(
                              "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                              trade.direction === 'Long' ? 'bg-[var(--color-tv-green)]/10 text-[var(--color-tv-green)]' : 'bg-[var(--color-tv-red)]/10 text-[var(--color-tv-red)]'
                            )}>
                              {trade.direction === 'Long' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                              {trade.direction}
                            </span>
                          </div>
                          <span className={clsx("font-bold text-lg", trade.pnl >= 0 ? 'text-[var(--color-tv-green)]' : 'text-[var(--color-tv-red)]')}>
                            {trade.pnl >= 0 ? '+' : ''}{trade.pnl}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-[var(--color-tv-text-muted)] font-mono">
                          <span>Entry: {trade.entryPrice}</span>
                          <span>Exit: {trade.exitPrice}</span>
                          <span>Size: {trade.size}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[var(--color-tv-border-solid)] text-[var(--color-tv-text)]">
                            {trade.emotion}
                          </span>
                          {trade.notes && <span className="text-xs text-[var(--color-tv-text-muted)] truncate">{trade.notes}</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* News Section */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4">Market Events</h3>
                <div className="space-y-3">
                  {events.filter(e => {
                    try { return isSameDay(new Date(e.date), selectedDay); } catch { return false; }
                  }).length === 0 ? (
                    <p className="text-[var(--color-tv-text-muted)] text-sm">No significant events scheduled.</p>
                  ) : (
                    events.filter(e => {
                      try { return isSameDay(new Date(e.date), selectedDay); } catch { return false; }
                    }).map((news, i) => (
                      <div key={i} className="p-4 rounded-lg bg-[var(--color-tv-dark)] border border-[var(--color-tv-border-solid)] flex gap-4">
                        <div className="shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-lg bg-[var(--color-tv-card-solid)] border border-[var(--color-tv-border-solid)]">
                          <span className="text-sm font-mono font-bold text-white">{news.time}</span>
                          <span className="text-[10px] text-[var(--color-tv-text-muted)]">{news.country}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={clsx(
                              "text-[10px] uppercase font-bold px-2 py-0.5 rounded",
                              news.impact === 'High' ? 'bg-[var(--color-tv-red)]/20 text-[var(--color-tv-red)]' : 
                              news.impact === 'Medium' ? 'bg-amber-500/20 text-amber-500' : 
                              'bg-[var(--color-tv-green)]/20 text-[var(--color-tv-green)]'
                            )}>
                              {news.impact} Impact
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white">{news.title}</h4>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Trade Modal (Matches Journal) */}
      {isAddTradeOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm">
          <div className="bg-[var(--color-tv-card-solid)] border border-[var(--color-tv-border-solid)] rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden neon-wrapper">
            <div className="flex items-center justify-between p-6 border-b border-[var(--color-tv-border-solid)]">
              <h2 className="text-xl font-bold text-white">Log New Trade</h2>
              <button onClick={() => setIsAddTradeOpen(false)} className="p-2 text-[var(--color-tv-text-muted)] hover:text-white hover:bg-[var(--color-tv-border-solid)] rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddTradeSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-tv-text-muted)] mb-2">Date</label>
                  <input 
                    type="date" 
                    required
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    className="w-full bg-[var(--color-tv-dark)] border border-[var(--color-tv-border-solid)] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-tv-accent)]/50 focus:border-[var(--color-tv-accent)]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-tv-text-muted)] mb-2">Asset (e.g., EUR/USD)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="EUR/USD"
                    value={formData.asset}
                    onChange={e => setFormData({...formData, asset: e.target.value})}
                    className="w-full bg-[var(--color-tv-dark)] border border-[var(--color-tv-border-solid)] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-tv-accent)]/50 focus:border-[var(--color-tv-accent)]/50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[var(--color-tv-text-muted)] mb-2">Direction</label>
                  <select 
                    value={formData.direction}
                    onChange={e => setFormData({...formData, direction: e.target.value})}
                    className="w-full bg-[var(--color-tv-dark)] border border-[var(--color-tv-border-solid)] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-tv-accent)]/50 focus:border-[var(--color-tv-accent)]/50"
                  >
                    <option value="Long">Long</option>
                    <option value="Short">Short</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-tv-text-muted)] mb-2">Position Size</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    placeholder="1.0"
                    value={formData.size}
                    onChange={e => setFormData({...formData, size: e.target.value})}
                    className="w-full bg-[var(--color-tv-dark)] border border-[var(--color-tv-border-solid)] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-tv-accent)]/50 focus:border-[var(--color-tv-accent)]/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-tv-text-muted)] mb-2">Entry Price</label>
                  <input 
                    type="number" 
                    step="0.00001"
                    required
                    placeholder="1.0500"
                    value={formData.entryPrice}
                    onChange={e => setFormData({...formData, entryPrice: e.target.value})}
                    className="w-full bg-[var(--color-tv-dark)] border border-[var(--color-tv-border-solid)] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-tv-accent)]/50 focus:border-[var(--color-tv-accent)]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-tv-text-muted)] mb-2">Exit Price</label>
                  <input 
                    type="number" 
                    step="0.00001"
                    required
                    placeholder="1.0550"
                    value={formData.exitPrice}
                    onChange={e => setFormData({...formData, exitPrice: e.target.value})}
                    className="w-full bg-[var(--color-tv-dark)] border border-[var(--color-tv-border-solid)] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-tv-accent)]/50 focus:border-[var(--color-tv-accent)]/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-tv-text-muted)] mb-2">Net PnL ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    placeholder="50.00"
                    value={formData.pnl}
                    onChange={e => setFormData({...formData, pnl: e.target.value})}
                    className="w-full bg-[var(--color-tv-dark)] border border-[var(--color-tv-border-solid)] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-tv-accent)]/50 focus:border-[var(--color-tv-accent)]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-tv-text-muted)] mb-2">Emotion</label>
                  <input 
                    list="emotions-list"
                    value={formData.emotion}
                    onChange={e => setFormData({...formData, emotion: e.target.value})}
                    placeholder="e.g., Neutral, Confident, Anxious..."
                    className="w-full bg-[var(--color-tv-dark)] border border-[var(--color-tv-border-solid)] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-tv-accent)]/50 focus:border-[var(--color-tv-accent)]/50"
                  />
                  <datalist id="emotions-list">
                    <option value="Neutral" />
                    <option value="Confident" />
                    <option value="Anxious" />
                    <option value="FOMO" />
                    <option value="Greedy" />
                    <option value="Revenge Trading" />
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-tv-text-muted)] mb-2">Notes & Mistakes</label>
                <textarea 
                  rows={3}
                  placeholder="What went well? What went wrong?"
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  className="w-full bg-[var(--color-tv-dark)] border border-[var(--color-tv-border-solid)] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-tv-accent)]/50 focus:border-[var(--color-tv-accent)]/50 resize-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-tv-border-solid)]">
                <button 
                  type="button"
                  onClick={() => setIsAddTradeOpen(false)}
                  className="px-5 py-2.5 rounded-lg text-sm font-medium text-[var(--color-tv-text-muted)] hover:text-white hover:bg-[var(--color-tv-border-solid)] transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 rounded-lg text-sm font-medium bg-[var(--color-tv-accent)] hover:bg-[var(--color-tv-accent)]/80 text-white transition-colors shadow-[0_0_15px_rgba(41,98,255,0.3)]"
                >
                  Save Trade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
