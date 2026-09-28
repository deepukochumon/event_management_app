import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/events', label: 'Events' },
  { to: '/events/new', label: 'Create Event' },
];

export default function Layout({ children }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <h1>Event Management Platform</h1>
            <span>Plan events, manage attendees, track registrations.</span>
          </div>
          <nav className="nav" aria-label="Primary">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="main">{children}</main>
    </div>
  );
}
