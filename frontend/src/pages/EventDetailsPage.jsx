import React from 'react';

export default function EventDetailsPage({ event, registrations, attendees, loading, error, onBack, onEdit, onRegister, onDeleteRegistration, onMarkAttended }) {
  if (loading) return <div className="loading">Loading event details…</div>;
  if (error) return <div className="error">{error}</div>;
  if (!event) return <div className="empty">Event not found.</div>;

  return (
    <div className="content">
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="section-head">
          <div>
            <h3>{event.title}</h3>
            <p>{event.description || 'No description provided.'}</p>
          </div>
          <div className="row-actions">
            <button className="btn ghost" onClick={onBack}>Back</button>
            <button className="btn secondary" onClick={() => onEdit(event.id)}>Edit</button>
            <button className="btn" onClick={() => onRegister(event.id)}>Register attendee</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <span className="badge info">{event.date}</span>
          <span className="badge">Venue: {event.venue_name || 'TBA'}</span>
          <span className="badge">Capacity: {event.capacity}</span>
          <span className={`badge ${event.is_past ? 'warning' : 'success'}`}>{event.is_past ? 'Past event' : 'Upcoming event'}</span>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="section-head"><div><h3>Registrations</h3><p>Manage attendee assignments and attendance.</p></div></div>
          {registrations.length === 0 ? <div className="empty">No registrations for this event.</div> : registrations.map((reg) => (
            <div key={reg.id} className="card" style={{ marginBottom: 10, background: 'rgba(255,255,255,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <strong>{reg.attendee_name}</strong>
                  <div style={{ color: 'var(--muted)', marginTop: 6 }}>{reg.attendee_email}</div>
                </div>
                <span className={`badge ${reg.status === 'attended' ? 'success' : reg.status === 'cancelled' ? 'danger' : 'info'}`}>{reg.status}</span>
              </div>
              <div className="row-actions" style={{ marginTop: 12 }}>
                <button className="btn secondary" onClick={() => onMarkAttended(reg.id)}>Mark attended</button>
                <button className="btn danger" onClick={() => onDeleteRegistration(reg.id)}>Remove</button>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="section-head"><div><h3>Attendees</h3><p>Available attendee records linked to the system.</p></div></div>
          {attendees.length === 0 ? <div className="empty">No attendees available.</div> : attendees.map((attendee) => (
            <div key={attendee.id} className="card" style={{ marginBottom: 10, background: 'rgba(255,255,255,0.03)' }}>
              <strong>{attendee.name}</strong>
              <div style={{ color: 'var(--muted)', marginTop: 6 }}>{attendee.email}</div>
              <div style={{ color: 'var(--muted)', marginTop: 4 }}>{attendee.company || 'Independent'} · {attendee.phone || 'No phone'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}