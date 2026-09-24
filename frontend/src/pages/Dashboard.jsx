import React from 'react';
import { CalendarDays, Users, Ticket, MapPin, TrendingUp } from 'lucide-react';

function StatCard({ title, value, subtitle, icon: Icon }) {
  return (
    <div className="card stat">
      <div>
        <h3>{title}</h3>
        <strong>{value}</strong>
        <p style={{ color: 'var(--muted)', margin: '10px 0 0' }}>{subtitle}</p>
      </div>
      <div className="icon"><Icon size={22} /></div>
    </div>
  );
}

export default function Dashboard({ dashboard, events, registrations, venues, loading, error, onNavigate }) {
  if (loading) return <div className="loading">Loading dashboard data…</div>;
  if (error) return <div className="error">{error}</div>;

  const upcoming = events.slice(0, 5);
  const recentRegs = registrations.slice(0, 5);

  return (
    <div className="content">
      <div className="grid-4" style={{ marginBottom: 16 }}>
        <StatCard title="Upcoming Events" value={dashboard?.upcoming_events ?? upcoming.length} subtitle="Scheduled and active" icon={CalendarDays} />
        <StatCard title="Registrations" value={dashboard?.total_registrations ?? registrations.length} subtitle="All confirmed attendees" icon={Ticket} />
        <StatCard title="Attendees" value={dashboard?.total_attendees ?? 0} subtitle="Unique attendee records" icon={Users} />
        <StatCard title="Venues" value={dashboard?.total_venues ?? venues.length} subtitle="Available event locations" icon={MapPin} />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="section-head">
            <div>
              <h3>Upcoming events</h3>
              <p>Your nearest live events and deadlines.</p>
            </div>
            <button className="btn ghost" onClick={() => onNavigate('events')}>View all</button>
          </div>
          {upcoming.length === 0 ? <div className="empty">No upcoming events found.</div> : upcoming.map((event) => (
            <div key={event.id} className="card" style={{ marginBottom: 12, background: 'rgba(255,255,255,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <strong>{event.title}</strong>
                  <div style={{ color: 'var(--muted)', marginTop: 6 }}>{event.date} · {event.venue_name || 'TBA'}</div>
                </div>
                <span className={`badge ${event.is_past ? 'warning' : 'success'}`}>{event.is_past ? 'Past' : 'Upcoming'}</span>
              </div>
              <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <span className="badge info">{event.category || 'General'}</span>
                <span className="badge">Capacity: {event.capacity}</span>
                <span className="badge">Registrations: {event.registration_count ?? 0}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="section-head">
            <div>
              <h3>Recent registrations</h3>
              <p>Latest attendee activity across events.</p>
            </div>
            <TrendingUp size={18} color="#93c5fd" />
          </div>
          {recentRegs.length === 0 ? <div className="empty">No registrations yet.</div> : recentRegs.map((reg) => (
            <div key={reg.id} className="card" style={{ marginBottom: 12, background: 'rgba(255,255,255,0.03)' }}>
              <strong>{reg.attendee_name}</strong>
              <div style={{ color: 'var(--muted)', marginTop: 6 }}>{reg.event_title}</div>
              <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <span className="badge success">{reg.status}</span>
                <span className="badge">{reg.registered_at}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}