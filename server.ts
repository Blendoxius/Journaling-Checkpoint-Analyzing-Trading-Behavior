import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import cors from 'cors';
import axios from 'axios';
import path from 'path';
import Parser from 'rss-parser';

const db = new Database('trades.db');
const rssParser = new Parser();

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    asset TEXT NOT NULL,
    direction TEXT NOT NULL,
    entryPrice REAL NOT NULL,
    exitPrice REAL NOT NULL,
    size REAL NOT NULL,
    pnl REAL NOT NULL,
    emotion TEXT,
    notes TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Get all trades
  app.get('/api/trades', (req, res) => {
    try {
      const trades = db.prepare('SELECT * FROM trades ORDER BY date DESC, createdAt DESC').all();
      res.json(trades);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch trades' });
    }
  });

  // Add a trade
  app.post('/api/trades', (req, res) => {
    try {
      const { date, asset, direction, entryPrice, exitPrice, size, pnl, emotion, notes } = req.body;
      const stmt = db.prepare(`
        INSERT INTO trades (date, asset, direction, entryPrice, exitPrice, size, pnl, emotion, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const info = stmt.run(date, asset, direction, entryPrice, exitPrice, size, pnl, emotion, notes);
      res.json({ id: info.lastInsertRowid });
    } catch (error) {
      res.status(500).json({ error: 'Failed to add trade' });
    }
  });

  // Delete a trade
  app.delete('/api/trades/:id', (req, res) => {
    try {
      const { id } = req.params;
      db.prepare('DELETE FROM trades WHERE id = ?').run(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete trade' });
    }
  });

let calendarCache: any = null;
let lastFetchTime = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

// Generate recurring macro events for the current year
function generateMacroEvents() {
  const year = new Date().getFullYear();
  const events: any[] = [];
  
  // NFP: First Friday of every month
  for (let month = 0; month < 12; month++) {
    const date = new Date(year, month, 1);
    while (date.getDay() !== 5) { // 5 is Friday
      date.setDate(date.getDate() + 1);
    }
    events.push({
      title: 'Non-Farm Employment Change (NFP)',
      country: 'USD',
      date: date.toISOString(),
      impact: 'High',
      forecast: '',
      previous: ''
    });
  }

  // FOMC: 8 times a year (Approximate dates for 2024/2025/2026 - usually Wednesdays)
  // We'll use a simplified approximation: last Wednesday of Jan, Mar, Apr, Jun, Jul, Sep, Oct, Dec
  const fomcMonths = [0, 2, 3, 5, 6, 8, 9, 11];
  fomcMonths.forEach(month => {
    const date = new Date(year, month + 1, 0); // Last day of month
    while (date.getDay() !== 3) { // 3 is Wednesday
      date.setDate(date.getDate() - 1);
    }
    events.push({
      title: 'FOMC Economic Projections & Rate Decision',
      country: 'USD',
      date: date.toISOString(),
      impact: 'High',
      forecast: '',
      previous: ''
    });
  });

  // US CPI: Usually around the 13th of the month
  for (let month = 0; month < 12; month++) {
    const date = new Date(year, month, 13);
    // If weekend, move to next Tuesday/Wednesday
    if (date.getDay() === 0) date.setDate(date.getDate() + 2); // Sunday -> Tuesday
    if (date.getDay() === 6) date.setDate(date.getDate() + 3); // Saturday -> Tuesday
    
    events.push({
      title: 'Core CPI m/m',
      country: 'USD',
      date: date.toISOString(),
      impact: 'High',
      forecast: '',
      previous: ''
    });
  }

  return events;
}

// Fetch Economic Calendar (Proxy to avoid CORS and provide a unified API)
app.get('/api/calendar', async (req, res) => {
  try {
    const now = Date.now();
    
    // Return cached data if valid
    if (calendarCache && (now - lastFetchTime < CACHE_DURATION)) {
      return res.json(calendarCache);
    }

    // Using Forex Factory's public JSON feed for the current week
    const ffResponse = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
      }
    });
    
    let ffData: any[] = [];
    if (ffResponse.ok) {
      ffData = await ffResponse.json();
    } else if (ffResponse.status === 429 && calendarCache) {
      // If rate limited but we have cache, return stale cache
      return res.json(calendarCache);
    } else {
      console.warn(`Forex Factory HTTP error! status: ${ffResponse.status}`);
    }

    // Fetch ForexLive RSS Feed
    let rssData: any[] = [];
    try {
      const feed = await rssParser.parseURL('https://www.forexlive.com/feed/news');
      rssData = feed.items.map(item => ({
        title: item.title || 'Market News',
        country: 'GLB',
        date: item.isoDate || new Date().toISOString(),
        impact: 'Medium',
        forecast: '',
        previous: ''
      }));
    } catch (rssError: any) {
      console.error('Error fetching RSS feed:', rssError.message);
    }

    // Generate recurring macro events for the whole year
    const macroEvents = generateMacroEvents();

    // Merge and remove duplicates (by title and date roughly)
    const combinedData = [...ffData, ...rssData, ...macroEvents];
    
    // Deduplicate by title + date string (first 10 chars YYYY-MM-DD)
    const uniqueDataMap = new Map();
    combinedData.forEach(item => {
      const dateStr = item.date ? item.date.substring(0, 10) : '';
      const key = `${item.title}-${dateStr}`;
      if (!uniqueDataMap.has(key)) {
        uniqueDataMap.set(key, item);
      }
    });
    
    const uniqueData = Array.from(uniqueDataMap.values());

    calendarCache = uniqueData;
    lastFetchTime = now;
    
    res.json(uniqueData);
  } catch (error: any) {
    console.error('Error fetching calendar:', error.message);
    
    // Fallback to cache if available even if expired
    if (calendarCache) {
      return res.json(calendarCache);
    }
    
    // If no cache and fetch failed, return empty array to prevent frontend crash
    res.json([]);
  }
});

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
