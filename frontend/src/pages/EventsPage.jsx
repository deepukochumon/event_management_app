import React from 'react';

export default function EventsPage({ events, loading, error, filters, setFilters, onCreate, onEdit, onDelete, onView }) {
  if (loading) return <div className="loading">Loading events…</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="content">
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="section-head">
          <div>
            <h3>Events</h3>
            <p>Search, sort, and filter events by status, venue, and date.</p>
          </div>
          <button className="btn" onClick={onCreate}>Create event</button>
        </div>
        <div className="toolbar">
          <input className="input" placeholder="Search title, description, venue…" value={filters.search} onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))} />
          <select className="select" value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}>
            <option value="all">All statuses</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
          </select>
          <input className="input" type="date" value={filters.date_from} onChange={(e) => setFilters((p) => ({ ...p, date_from: e.target.value }))} />
          <input className="input" type="date" value={filters.date_to} onChange={(e) => setFilters((p) => ({ ...p, date_to: e.target.value }))} />
          <select className="select" value={filters.sort} onChange={(e) => setFilters((p) => ({ ...p, sort: e.target.value }))}>
            <option value="date">Date</option>
            <option value="-date">Date desc</option>
            <option value="title">Title</option>
            <option value="-registration_count">Registrations</option>
          </select>
        </div>
      </div>

      {events.length === 0 ? <div className="empty">No events match the current filters.</div> : (
        <div className="table-wrap card">
          <table className="table">
            <thead>
              <tr>
                <th>Event</th><th>Date</th><th>Venue</th><th>Status</th><th>Capacity</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td>
                    <strong>{event.title}</strong>
                    <div style={{ color: 'var(--muted)', marginTop: 4 }}>{event.category || 'General'}</div>
                  </td>
                  <td>{event.date}</td>
                  <td>{event.venue_name || 'TBA'}</td>
                  <td><span className={`badge ${event.is_past ? 'warning' : 'success'}`}>{event.is_past ? 'Past' : 'Upcoming'}</span></td>
                  <td>{event.capacity}</td>
                  <td>
                    <div className="row-actions">
                      <button className="btn ghost" onClick={() => onView(event.id)}>View</button>
                      <button className="btn secondary" onClick={() => onEdit(event.id)}>Edit</button>
                      <button className="btn danger" onClick={() => onDelete(event.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}