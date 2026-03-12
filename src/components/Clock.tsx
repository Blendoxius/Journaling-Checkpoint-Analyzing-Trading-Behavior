import { useState, useEffect } from 'react';

const TIMEZONES = [
  { label: 'Local', value: 'local' },
  { label: 'UTC', value: 'UTC' },
  { label: 'New York (EST)', value: 'America/New_York' },
  { label: 'London (GMT)', value: 'Europe/London' },
  { label: 'Tokyo (JST)', value: 'Asia/Tokyo' },
  { label: 'Sydney (AEDT)', value: 'Australia/Sydney' },
];

export default function Clock() {
  const [time, setTime] = useState(new Date());
  const [timezone, setTimezone] = useState('local');

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getActiveSessions = (date: Date) => {
    const day = date.getUTCDay();
    const hour = date.getUTCHours();

    // Forex weekend (approx Friday 22:00 UTC to Sunday 22:00 UTC)
    if ((day === 5 && hour >= 22) || day === 6 || (day === 0 && hour < 22)) {
      return 'Weekend (Closed)';
    }

    const sessions = [];
    if (hour >= 22 || hour < 7) sessions.push('Sydney');
    if (hour >= 0 && hour < 9) sessions.push('Tokyo');
    if (hour >= 8 && hour < 17) sessions.push('London');
    if (hour >= 13 && hour < 22) sessions.push('New York');
    
    return sessions.length > 0 ? sessions.join(' & ') : 'Transition';
  };

  const formatTime = (date: Date, tz: string) => {
    try {
      if (tz === 'local') {
        return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }
      return date.toLocaleTimeString('de-DE', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (e) {
      return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
  };

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 bg-[var(--color-tv-dark)] border border-[var(--color-tv-border-solid)] rounded-lg shadow-inner">
      <div className="font-mono text-lg font-bold text-[var(--color-neon-cyan)] flare shrink-0">
        {formatTime(time, timezone)}
      </div>
      
      <div className="h-4 w-px bg-[var(--color-tv-border-solid)]"></div>
      
      <select 
        value={timezone}
        onChange={(e) => setTimezone(e.target.value)}
        className="bg-transparent text-xs font-medium text-[var(--color-tv-text-muted)] hover:text-white outline-none cursor-pointer transition-colors"
      >
        {TIMEZONES.map(tz => (
          <option key={tz.value} value={tz.value} className="bg-[var(--color-tv-card-solid)] text-white">
            {tz.label}
          </option>
        ))}
      </select>

      <div className="h-4 w-px bg-[var(--color-tv-border-solid)] hidden sm:block"></div>

      <div className="hidden sm:block text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded bg-[var(--color-tv-accent)]/10 text-[var(--color-tv-accent)] border border-[var(--color-tv-accent)]/20 whitespace-nowrap">
        {getActiveSessions(time)}
      </div>
    </div>
  );
}
