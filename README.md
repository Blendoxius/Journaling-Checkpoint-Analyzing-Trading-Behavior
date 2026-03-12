# Market Checkpoint

A professional, standalone trading journal and market calendar application. 

This application is built to run entirely locally on your machine. It uses a local SQLite database to store your trades, ensuring your financial data remains 100% private and never leaves your computer.

## Features

- **Trading Journal:** Log your trades, entry/exit prices, PnL, position sizing, and emotional state.
- **Interactive Trade Calendar:** Visualize your trades on a calendar alongside high-impact macroeconomic news.
- **Global Market Calendar:** Full integration with the TradingView Economic Calendar for historical and future macro events.
- **Advanced Charting:** Integrated TradingView Advanced Charts for technical analysis.
- **Playbooks:** Document your trading strategies and setups.
- **Dashboard:** High-level overview of your trading performance.

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons
- **Backend:** Node.js, Express
- **Database:** SQLite (Local file-based database `trades.db`)

## How to Run Locally

You do **not** need any cloud services, AI APIs, or external databases to run this application.

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)

### Installation & Setup

1. **Install dependencies:**
   Open your terminal in the project folder and run:
   ```bash
   npm install
   ```

2. **Start the application:**
   Run the development server:
   ```bash
   npm run dev
   ```

3. **Open in Browser:**
   The terminal will show a local URL (usually `http://localhost:3000`). Open this in your web browser.

## Data Privacy
All your trades and journal entries are saved to a local file named `trades.db` inside the project folder. No data is sent to any external servers.
