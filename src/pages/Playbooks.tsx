import { useState, useEffect } from 'react';
import { Plus, Trash2, Image as ImageIcon, BookOpen } from 'lucide-react';

interface Playbook {
  id: string;
  title: string;
  setup: string;
  description: string;
  image: string | null;
  createdAt: string;
}

export default function Playbooks() {
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    setup: '',
    description: '',
    image: null as string | null
  });

  useEffect(() => {
    const saved = localStorage.getItem('market_checkpoint_playbooks');
    if (saved) {
      try {
        setPlaybooks(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse playbooks', e);
      }
    }
  }, []);

  const savePlaybooks = (newPlaybooks: Playbook[]) => {
    setPlaybooks(newPlaybooks);
    localStorage.setItem('market_checkpoint_playbooks', JSON.stringify(newPlaybooks));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPlaybook: Playbook = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date().toISOString()
    };
    savePlaybooks([newPlaybook, ...playbooks]);
    setIsModalOpen(false);
    setFormData({ title: '', setup: '', description: '', image: null });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this playbook?')) {
      savePlaybooks(playbooks.filter(p => p.id !== id));
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <header>
          <h1 className="text-3xl font-bold text-white tracking-tight">Playbooks</h1>
          <p className="text-[var(--color-tv-text-muted)] mt-1">Document your trading setups and strategies.</p>
        </header>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[var(--color-tv-accent)] hover:bg-[var(--color-tv-accent)]/80 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors shadow-[0_0_15px_rgba(0,136,255,0.3)] shrink-0"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Playbook
        </button>
      </div>

      {playbooks.length === 0 ? (
        <div className="neon-wrapper p-12 text-center rounded-2xl shadow-2xl">
          <BookOpen className="w-12 h-12 text-[var(--color-tv-text-muted)] mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">No Playbooks Yet</h3>
          <p className="text-[var(--color-tv-text-muted)]">Create your first playbook to document your setups.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playbooks.map(playbook => (
            <div key={playbook.id} className="neon-wrapper rounded-2xl overflow-hidden shadow-2xl flex flex-col">
              {playbook.image ? (
                <div className="h-48 w-full bg-[var(--color-tv-dark)] border-b border-[var(--color-tv-border-solid)]">
                  <img src={playbook.image} alt={playbook.title} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="h-48 w-full bg-[var(--color-tv-dark)] border-b border-[var(--color-tv-border-solid)] flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-[var(--color-tv-text-muted)] opacity-50" />
                </div>
              )}
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-white">{playbook.title}</h3>
                  <button 
                    onClick={() => handleDelete(playbook.id)}
                    className="text-[var(--color-tv-text-muted)] hover:text-[var(--color-tv-red)] transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="mb-4">
                  <span className="text-xs font-semibold px-2 py-1 rounded bg-[var(--color-tv-accent)]/20 text-[var(--color-tv-accent)]">
                    {playbook.setup}
                  </span>
                </div>
                <p className="text-sm text-[var(--color-tv-text-muted)] flex-1 overflow-y-auto custom-scrollbar">
                  {playbook.description}
                </p>
                <div className="mt-4 pt-4 border-t border-[var(--color-tv-border-solid)] text-xs text-[var(--color-tv-text-muted)]">
                  Created: {new Date(playbook.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Playbook Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="neon-wrapper w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-[var(--color-tv-border-solid)] flex justify-between items-center shrink-0">
              <h2 className="text-xl font-semibold text-white">New Playbook</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-[var(--color-tv-text-muted)] hover:text-white">
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-tv-text-muted)] mb-2">Title</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Bull Flag Breakout"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-[var(--color-tv-dark)] border border-[var(--color-tv-border-solid)] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-tv-accent)]/50 focus:border-[var(--color-tv-accent)]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-tv-text-muted)] mb-2">Setup Type</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Trend Continuation"
                    value={formData.setup}
                    onChange={e => setFormData({...formData, setup: e.target.value})}
                    className="w-full bg-[var(--color-tv-dark)] border border-[var(--color-tv-border-solid)] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-tv-accent)]/50 focus:border-[var(--color-tv-accent)]/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-tv-text-muted)] mb-2">Description & Rules</label>
                <textarea 
                  rows={5}
                  required
                  placeholder="Describe the setup, entry criteria, stop loss, and take profit rules..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-[var(--color-tv-dark)] border border-[var(--color-tv-border-solid)] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-tv-accent)]/50 focus:border-[var(--color-tv-accent)]/50 resize-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-tv-text-muted)] mb-2">Example Image (Optional)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full text-sm text-[var(--color-tv-text-muted)] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[var(--color-tv-dark)] file:text-white hover:file:bg-[var(--color-tv-border-solid)] transition-colors"
                />
                {formData.image && (
                  <div className="mt-4 h-32 w-full rounded-lg overflow-hidden border border-[var(--color-tv-border-solid)]">
                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
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
                  className="px-5 py-2.5 rounded-lg text-sm font-medium bg-[var(--color-tv-accent)] hover:bg-[var(--color-tv-accent)]/80 text-white transition-colors shadow-[0_0_15px_rgba(0,136,255,0.3)]"
                >
                  Save Playbook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
