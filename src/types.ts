export interface Trade {
  id: number;
  date: string;
  asset: string;
  direction: 'Long' | 'Short';
  entryPrice: number;
  exitPrice: number;
  size: number;
  pnl: number;
  emotion: string;
  notes: string;
  createdAt: string;
}

export interface CalendarEvent {
  title: string;
  country: string;
  date: string;
  time: string;
  impact: string;
  forecast: string;
  previous: string;
}
