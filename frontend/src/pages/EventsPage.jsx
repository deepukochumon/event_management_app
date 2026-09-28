import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { formatDateLong, getStatusBadgeClass } from '../utils/formatters';

function fetchEvents(params) {
  return api.get('/events/', { params }).then((res) => res.data);
}

export default function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [draft, setDraft] = useState({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    sort: searchParams.get('sort') || '-start_date',
    start_date: searchParams.get('start_date') || '',
    end_date: searchParams.get('end_date') || '',
  });

  const queryParams = useMemo(() => ({
    search: searchParams.get('search') || undefined,
    status: searchParams.get('status') || undefined,
    ordering: searchParams.get('sort') || '-start_date',
    start_date: searchParams.get('start_date') || undefined,
    end_date: searchParams.get('end_date') || undefined,
  }), [searchParams]);

  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['events', queryParams], queryFn: () => fetchEvents(queryParams) });

  const events = data?.results ?? [];

  const applyFilters = (e) => {
    e.preventDefault();
    const next = new URLSearchParams();
    Object.entries(draft).forEach(([k, v]) => v && next.set(k, v));
    setSearchParams(next);
  };

  const clearFilters = () => {
    setDraft({ search: '', status: '', sort: '-start_date', start_date: '', end_date: '' });
    setSearchParams({});
  };

  return (
    <div className="stack">
      <div className="card">
        <div className="row space-between">
          <div>
            <h2>Events</h2>
            <div className="muted">Search, filter, sort, and manage your event portfolio.</div>
          </div>
          <Link className="btn primary" to="/events/new">Create Event</Link>
        </div>
        <form className="toolbar" onSubmit={applyFilters} style={{ marginTop: 16 }}>
          <input className="input" placeholder="Search title, description..." value={draft.search} onChange={(e) => setDraft((s) => ({ ...s, search: e.target.value }))} />
          <select className="select" value={draft.status} onChange={(e) => setDraft((s) => ({ ...s, status: e.target.value }))}>
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select className="select" value={draft.sort} onChange={(e) => setDraft((s) => ({ ...s, sort: e.target.value }))}>
            <option value="-start_date">Start Date (Newest)</option>
            <option value="start_date">Start Date (Oldest)</option>
            <option value="title">Title A-Z</option>
            <option value="-registrations_count">Most Registrations</option>
          </select>
          <input className="input" type="date" value={draft.start_date} onChange={(e) => setDraft((s) => ({ ...s, start_date: e.target.value }))} />
          <input className="input" type="date" value={draft.end_date} onChange={(e) => setDraft((s) => ({ ...s, end_date: e.target.value }))} />
          <div className="row"><button className="btn primary" type="submit">Apply</button><button className="btn secondary" type="button" onClick={clearFilters}>Reset</button></div>
        </form>
      </div>

      {isLoading && <div className="card">Loading events...</div>}
      {isError && <div className="notice error">Could not load events: {error?.message || 'Unknown error'} <button className="btn primary" onClick={() => refetch()}>Retry</button></div>}

      {!isLoading && !isError && (
        events.length ? (
          <div className="card" style={{ padding: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Event</th><th>Date</th><th>Venue</th><th>Status</th><th>Registrations</th><th />
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td>
                      <strong>{event.title}</strong>
                      <div className="muted">{event.description?.slice(0, 100) || 'No description'}</div>
                    </td>
                    <td>{formatDateLong(event.start_date)}</td>
                    <td>{event.venue_name || '—'}</td>
                    <td><span className={`badge ${getStatusBadgeClass(event.status)}`}>{event.status}</span></td>
                    <td>{event.registrations_count || 0}</td>
                    <td><Link className="btn ghost" to={`/events/${event.id}`}>Open</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="notice empty">No events match your filters.</div>
      )}
    </div>
  );
}
