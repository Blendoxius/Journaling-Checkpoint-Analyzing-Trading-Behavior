import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trade } from '../types';
import { format, parseISO } from 'date-fns';
import { Plus, Trash2, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function Journal() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form State
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

  const fetchTrades = async () => {
    try {
      const res = await axios.get('/api/trades');
      setTrades(res.data);
    } catch (error) {
      console.error('Failed to fetch trades', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/trades', {
        ...formData,
        entryPrice: Number(formData.entryPrice),
        exitPrice: Number(formData.exitPrice),
        size: Number(formData.size),
        pnl: Number(formData.pnl)
      });
      setIsModalOpen(false);
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

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this trade?')) return;
    try {
      await axios.delete(`/api/trades/${id}`);
      fetchTrades();
    } catch (error) {
      console.error('Failed to delete trade', error);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <header>
          <h1 className="text-3xl font-bold text-white tracking-tight">Trading Journal</h1>
          <p className="text-[var(--color-tv-text-muted)] mt-1">Log your trades, emotions, and notes.</p>
        </header>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[var(--color-tv-accent)] hover:bg-[var(--color-tv-accent)]/80 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors shadow-[0_0_15px_rgba(41,98,255,0.3)]"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Trade
        </button>
      </div>

      {/* Trades Table */}
      <div className="neon-wrapper overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--color-tv-dark)]/50 text-[var(--color-tv-text-muted)] border-b border-[var(--color-tv-border-solid)]">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Asset</th>
                <th className="px-6 py-4 font-medium">Direction</th>
                <th className="px-6 py-4 font-medium">Entry / Exit</th>
                <th className="px-6 py-4 font-medium">PnL</th>
                <th className="px-6 py-4 font-medium">Emotion</th>
                <th className="px-6 py-4 font-medium">Notes</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-tv-border-solid)]/50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-[var(--color-tv-text-muted)]">Loading trades...</td>
                </tr>
              ) : trades.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-[var(--color-tv-text-muted)]">No trades logged yet.</td>
                </tr>
              ) : (
                trades.map((trade) => (
                  <tr key={trade.id} className="hover:bg-[var(--color-tv-border-solid)]/30 transition-colors">
                    <td className="px-6 py-4 text-[var(--color-tv-text)] whitespace-nowrap">
                      {format(parseISO(trade.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 font-medium text-white">{trade.asset}</td>
                    <td className="px-6 py-4">
                      <span className={"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium " + (
                        trade.direction === 'Long' 
                          ? 'bg-[var(--color-tv-green)]/10 text-[var(--color-tv-green)]' 
                          : 'bg-[var(--color-tv-red)]/10 text-[var(--color-tv-red)]'
                      )}>
                        {trade.direction === 'Long' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                        {trade.direction}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[var(--color-tv-text-muted)] font-mono text-xs">
                      {trade.entryPrice} &rarr; {trade.exitPrice}
                    </td>
                    <td className={"px-6 py-4 font-medium " + (trade.pnl >= 0 ? 'text-[var(--color-tv-green)]' : 'text-[var(--color-tv-red)]')}>
                      ${trade.pnl > 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-[var(--color-tv-border-solid)] text-[var(--color-tv-text)]">
                        {trade.emotion}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[var(--color-tv-text-muted)] max-w-xs truncate" title={trade.notes}>
                      {trade.notes || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(trade.id)}
                        className="text-[var(--color-tv-text-muted)] hover:text-[var(--color-tv-red)] transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Trade Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="neon-wrapper w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-[var(--color-tv-border-solid)] flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">Log New Trade</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-[var(--color-tv-text-muted)] hover:text-white">
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                  onClick={() => setIsModalOpen(false)}
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
