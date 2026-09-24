import React from 'react';
import { CalendarCheck2, LayoutDashboard, PlusCircle, ListChecks, CalendarDays } from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'events', label: 'Events', icon: ListChecks },
  { id: 'create', label: 'Create Event', icon: PlusCircle },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'stats', label: 'Reports', icon: CalendarCheck2 },
];

export default function LayoutShell({ activePage, title, subtitle, onNavigate, actions, children }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-badge">EM</div>
          <div>
            <h1>Event Manager</h1>
            <p>End-to-end event operations</p>
          </div>
        </div>
        <nav className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activePage === item.id;
            return (
              <button key={item.id} className={`nav-item ${active ? 'active' : ''}`} onClick={() => onNavigate(item.id)}>
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="sidebar-card">
          <strong>Production-ready stack</strong>
          <p style={{ color: 'var(--muted)', margin: '8px 0 0' }}>React frontend with a Django REST backend and PostgreSQL data layer.</p>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
          <div className="topbar-actions">{actions}</div>
        </header>
        {children}
      </main>
    </div>
  );
}