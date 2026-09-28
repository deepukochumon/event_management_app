import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { formatDateLong, formatDateTime, getStatusBadgeClass } from '../utils/formatters';

function fetchDashboard() {
  return api.get('/dashboard/').then((res) => res.data);
}

export default function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['dashboard'], queryFn: fetchDashboard });

  const upcoming = useMemo(() => data?.upcoming_events ?? [], [data]);
  const stats = data?.stats ?? {};

  if (isLoading) {
    return <div className="card">Loading dashboard...</div>;
  }

  if (isError) {
    return (
      <div className="notice error">
        Failed to load dashboard: {error?.message || 'Unknown error'}
        <div className="form-actions"><button className="btn primary" onClick={() => refetch()}>Retry</button></div>
      </div>
    );
  }

  return (
    <div className="stack">
      <section className="grid cols-4">
        <div className="card"><div className="metric-label">Total Events</div><div className="metric">{stats.total_events ?? 0}</div></div>
        <div className="card"><div className="metric-label">Upcoming Events</div><div className="metric">{stats.upcoming_events ?? 0}</div></div>
        <div className="card"><div className="metric-label">Registrations</div><div className="metric">{stats.total_registrations ?? 0}</div></div>
        <div className="card"><div className="metric-label">Venues</div><div className="metric">{stats.total_venues ?? 0}</div></div>
      </section>

      <section className="grid cols-2">
        <div className="card">
          <div className="row space-between">
            <div>
              <h2>Upcoming Events</h2>
              <div className="muted">A quick glance at your next events.</div>
            </div>
            <Link className="btn secondary" to="/events">View all</Link>
          </div>
          <div className="stack" style={{ marginTop: 16 }}>
            {upcoming.length ? upcoming.map((event) => (
              <div key={event.id} className="panel">
                <div className="row space-between">
                  <div>
                    <strong>{event.title}</strong>
                    <div className="muted">{formatDateTime(event.start_date)}</div>
                  </div>
                  <span className={`badge ${getStatusBadgeClass(event.status)}`}>{event.status}</span>
                </div>
                <div className="muted" style={{ marginTop: 8 }}>{event.venue_name || 'No venue assigned'}</div>
                <div className="row" style={{ marginTop: 10 }}>
                  <Link className="btn ghost" to={`/events/${event.id}`}>Details</Link>
                  <span className="badge primary">{event.registrations_count || 0} registrations</span>
                </div>
              </div>
            )) : <div className="notice empty">No upcoming events found.</div>}
          </div>
        </div>

        <div className="card">
          <h2>Quick Stats</h2>
          <div className="grid cols-2" style={{ marginTop: 16 }}>
            <div className="panel"><div className="metric-label">Checked-in Attendees</div><div className="metric">{stats.checked_in_attendees ?? 0}</div></div>
            <div className="panel"><div className="metric-label">Pending Registrations</div><div className="metric">{stats.pending_registrations ?? 0}</div></div>
          </div>
          <h3 style={{ marginTop: 20 }}>Calendar Snapshot</h3>
          <div className="notice">Use the Events page to switch between list and calendar views. Upcoming dates are sourced directly from the API.</div>
          <h3 style={{ marginTop: 20 }}>Next Milestone</h3>
          <div className="panel">
            <div><strong>{upcoming[0]?.title || 'No upcoming event'}</strong></div>
            <div className="muted">{upcoming[0] ? formatDateLong(upcoming[0].start_date) : 'Create an event to populate the dashboard.'}</div>
          </div>
        </div>
      </section>
    </div>
  );
}
