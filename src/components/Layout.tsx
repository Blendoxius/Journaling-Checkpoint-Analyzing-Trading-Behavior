import { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Calendar as CalendarIcon, LineChart, Library, Columns, Rows, X, Globe } from 'lucide-react';
import Split from 'react-split';
import { clsx } from 'clsx';
import Clock from './Clock';

import Dashboard from '../pages/Dashboard';
import Journal from '../pages/Journal';
import Calendar from '../pages/Calendar';
import MarketCalendar from '../pages/MarketCalendar';
import Charts from '../pages/Charts';
import Playbooks from '../pages/Playbooks';

const componentMap: Record<string, React.ElementType> = {
  '/dashboard': Dashboard,
  '/journal': Journal,
  '/calendar': Calendar,
  '/market-calendar': MarketCalendar,
  '/charts': Charts,
  '/playbooks': Playbooks,
};

export default function Layout() {
  const location = useLocation();
  const [isSplit, setIsSplit] = useState(false);
  const [secondaryView, setSecondaryView] = useState('/playbooks');
  const [splitLayout, setSplitLayout] = useState<'horizontal' | 'vertical'>('horizontal');
  const [showSplitMenu, setShowSplitMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowSplitMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isSplit && location.pathname === secondaryView) {
      setIsSplit(false);
    }
  }, [location.pathname, secondaryView, isSplit]);

  const navItems = [
    { to: '/charts', icon: LineChart, label: 'Charts' },
    { to: '/playbooks', icon: Library, label: 'Playbooks' },
    { to: '/calendar', icon: CalendarIcon, label: 'Trade Calendar' },
    { to: '/market-calendar', icon: Globe, label: 'Market Calendar' },
    { to: '/journal', icon: BookOpen, label: 'Journal' },
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  ];

  const SecondaryComponent = componentMap[secondaryView];

  return (
    <div className="flex h-screen text-[var(--color-tv-text)] bg-transparent">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[var(--color-tv-border-solid)] bg-[var(--color-tv-card)] backdrop-blur-xl flex flex-col z-20 shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-[var(--color-tv-border-solid)]">
          <span className="text-lg font-bold tracking-tight text-white">Market Checkpoint</span>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-1">
          {navItems.map((item) => {
            const isPrimaryActive = location.pathname === item.to;
            const isSecondaryActive = isSplit && secondaryView === item.to;
            const isActive = isPrimaryActive || isSecondaryActive;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={clsx(
                  'flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-[var(--color-tv-accent)]/20 text-[var(--color-tv-accent)] shadow-[0_0_15px_rgba(0,136,255,0.15)]'
                    : 'text-[var(--color-tv-text-muted)] hover:bg-[var(--color-tv-border-solid)] hover:text-white'
                )}
              >
                <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                {item.label}
                {isSecondaryActive && !isPrimaryActive && (
                  <span className="ml-auto text-[10px] uppercase tracking-wider opacity-70">Split</span>
                )}
              </NavLink>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-[var(--color-tv-border-solid)] text-xs text-[var(--color-tv-text-muted)]">
          &copy; 2026 Market Checkpoint
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        <header className="h-16 flex items-center justify-end px-4 sm:px-8 border-b border-[var(--color-tv-border-solid)] bg-[var(--color-tv-card)] backdrop-blur-xl shrink-0 gap-4">
          
          {/* Split View Controls */}
          <div>
            <button
              onClick={() => setShowSplitMenu(true)}
              className={clsx(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors text-sm font-medium",
                isSplit
                  ? "bg-[var(--color-tv-accent)]/20 border-[var(--color-tv-accent)] text-[var(--color-tv-accent)] shadow-[0_0_10px_rgba(0,136,255,0.2)]"
                  : "bg-[var(--color-tv-dark)] border-[var(--color-tv-border-solid)] text-[var(--color-tv-text-muted)] hover:text-white"
              )}
            >
              <Columns className="w-4 h-4" />
              <span className="hidden sm:inline">Split View</span>
            </button>
          </div>

          <Clock />
        </header>
        
        <div className="flex-1 overflow-hidden">
          {isSplit && SecondaryComponent ? (
            <Split
              className={clsx(
                "w-full h-full flex",
                splitLayout === 'horizontal' ? 'flex-row' : 'flex-col'
              )}
              direction={splitLayout}
              sizes={[50, 50]}
              minSize={200}
              gutterSize={6}
              gutterAlign="center"
              snapOffset={30}
              dragInterval={1}
              cursor={splitLayout === 'horizontal' ? 'col-resize' : 'row-resize'}
            >
              {/* Primary View */}
              <div className="h-full w-full overflow-auto relative min-h-0 min-w-0">
                <Outlet />
              </div>

              {/* Secondary View */}
              <div className="h-full w-full overflow-auto relative min-h-0 min-w-0 bg-[var(--color-tv-dark)]/50">
                <SecondaryComponent />
              </div>
            </Split>
          ) : (
            <div className="h-full w-full overflow-auto relative min-h-0 min-w-0">
              <Outlet />
            </div>
          )}
        </div>
      </main>

      {/* Split View Modal - Moved to root level to avoid z-index trapping by backdrop-blur */}
      {showSplitMenu && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="neon-wrapper w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-[var(--color-tv-border-solid)] flex justify-between items-center bg-[var(--color-tv-card)] relative z-10 shrink-0">
              <span className="font-semibold text-white text-lg">Split Configuration</span>
              <button onClick={() => setShowSplitMenu(false)} className="text-[var(--color-tv-text-muted)] hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6 relative z-10 bg-[var(--color-tv-card-solid)] overflow-y-auto">
              <div>
                <label className="text-xs text-[var(--color-tv-text-muted)] uppercase tracking-wider mb-3 block font-semibold">Secondary Widget</label>
                <div className="space-y-2">
                  {navItems.map(item => (
                    <button
                      key={item.to}
                      onClick={() => setSecondaryView(item.to)}
                      disabled={location.pathname === item.to}
                      className={clsx(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors border",
                        secondaryView === item.to
                          ? "bg-[var(--color-tv-accent)]/20 border-[var(--color-tv-accent)] text-[var(--color-tv-accent)]"
                          : location.pathname === item.to
                          ? "opacity-40 cursor-not-allowed border-transparent text-[var(--color-tv-text-muted)]"
                          : "bg-[var(--color-tv-dark)] border-[var(--color-tv-border-solid)] text-[var(--color-tv-text-muted)] hover:border-[var(--color-tv-text-muted)] hover:text-white"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                      {location.pathname === item.to && <span className="ml-auto text-xs">(Active)</span>}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-[var(--color-tv-text-muted)] uppercase tracking-wider mb-3 block font-semibold">Layout</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSplitLayout('horizontal')}
                    className={clsx(
                      "flex-1 flex flex-col items-center justify-center gap-2 py-4 rounded-lg text-sm transition-colors border",
                      splitLayout === 'horizontal'
                        ? "bg-[var(--color-tv-accent)]/20 border-[var(--color-tv-accent)] text-[var(--color-tv-accent)]"
                        : "bg-[var(--color-tv-dark)] border-[var(--color-tv-border-solid)] text-[var(--color-tv-text-muted)] hover:border-[var(--color-tv-text-muted)] hover:text-white"
                    )}
                  >
                    <Columns className="w-6 h-6" />
                    Side-by-side
                  </button>
                  <button
                    onClick={() => setSplitLayout('vertical')}
                    className={clsx(
                      "flex-1 flex flex-col items-center justify-center gap-2 py-4 rounded-lg text-sm transition-colors border",
                      splitLayout === 'vertical'
                        ? "bg-[var(--color-tv-accent)]/20 border-[var(--color-tv-accent)] text-[var(--color-tv-accent)]"
                        : "bg-[var(--color-tv-dark)] border-[var(--color-tv-border-solid)] text-[var(--color-tv-text-muted)] hover:border-[var(--color-tv-text-muted)] hover:text-white"
                    )}
                  >
                    <Rows className="w-6 h-6" />
                    Stacked
                  </button>
                </div>
              </div>
              
              <div className="pt-4 border-t border-[var(--color-tv-border-solid)] flex flex-col gap-3">
                <button
                  onClick={() => { setIsSplit(true); setShowSplitMenu(false); }}
                  className="w-full py-3 bg-[var(--color-tv-accent)] hover:bg-[var(--color-tv-accent)]/80 text-white text-sm font-medium rounded-lg transition-colors shadow-[0_0_15px_rgba(0,136,255,0.3)]"
                >
                  Apply Split View
                </button>
                {isSplit && (
                  <button
                    onClick={() => { setIsSplit(false); setShowSplitMenu(false); }}
                    className="w-full py-3 bg-transparent border border-[var(--color-tv-red)] text-[var(--color-tv-red)] hover:bg-[var(--color-tv-red)]/10 text-sm font-medium rounded-lg transition-colors"
                  >
                    Close Split View
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
