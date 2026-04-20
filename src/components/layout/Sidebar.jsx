import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { FileText, NotebookPen, Sparkles, Search, LayoutGrid, Moon, Sun, Command, Network, BarChart2, Table2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/themeContext';

const navItems = [
  { to: '/', label: 'Workspace', icon: LayoutGrid, end: true },
  { to: '/files', label: 'Files', icon: FileText },
  { to: '/notes', label: 'Notes', icon: NotebookPen },
  { to: '/chat', label: 'Ask ARI', icon: Sparkles },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/graph', label: 'Knowledge Graph', icon: Network },
  { to: '/analytics', label: 'Insights', icon: BarChart2 },
  { to: '/data-sources', label: 'Data Sources', icon: Table2 },
];

export default function Sidebar() {
  const { theme, toggle } = useTheme();
  return (
    <aside className="w-60 shrink-0 border-r border-border bg-sidebar flex flex-col h-screen sticky top-0">
      <Link to="/" className="px-6 pt-7 pb-6 block">
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-2xl font-semibold tracking-tight text-foreground">ARI</span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">v0.1</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1 font-serif italic">your second brain</p>
      </Link>

      <nav className="px-3 flex-1">
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground px-3 mb-2">
          Navigate
        </div>
        <ul className="space-y-0.5">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200',
                    isActive
                      ? 'bg-sidebar-accent text-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={cn('w-4 h-4 transition-colors', isActive && 'text-accent')} strokeWidth={1.75} />
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="px-4 py-4 border-t border-border flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground font-serif italic">"Think. Ask. Learn."</p>
        <div className="flex items-center gap-1">
          <button
            onClick={toggle}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-all"
            title="Toggle dark mode"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-all"
            title="Command palette (⌘K)"
          >
            <Command className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}