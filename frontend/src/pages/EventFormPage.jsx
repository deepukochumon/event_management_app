import React, { useEffect, useState } from 'react';

const initial = { title: '', description: '', date: '', venue: '', capacity: '', category: '', status: 'draft' };

export default function EventFormPage({ event, venues, onSubmit, onCancel, loading, error }) {
  const [form, setForm] = useState(initial);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (event) {
      setForm({
        title: event.title || '',
        description: event.description || '',
        date: event.date || '',
        venue: event.venue || event.venue_id || '',
        capacity: event.capacity || '',
        category: event.category || '',
        status: event.status || 'draft',
      });
    } else {
      setForm(initial);
    }
  }, [event]);

  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return setFormError('Title is required.');
    if (!form.date) return setFormError('Date is required.');
    if (!form.venue) return setFormError('Venue is required.');
    setFormError('');
    onSubmit({ ...form, capacity: Number(form.capacity || 0), venue_id: Number(form.venue) });
  };

  return (
    <div className="content">
      <div className="card">
        <div className="section-head">
          <div>
            <h3>{event ? 'Edit event' : 'Create event'}</h3>
            <p>Manage event metadata, venue assignment, and attendance limits.</p>
          </div>
        </div>
        {error && <div className="error" style={{ marginBottom: 16 }}>{error}</div>}
        {formError && <div className="error" style={{ marginBottom: 16 }}>{formError}</div>}
        {loading ? <div className="loading">Saving event…</div> : (
          <form onSubmit={submit}>
            <div className="form-grid">
              <input className="input" placeholder="Event title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <select className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="draft">Draft</option><option value="published">Published</option><option value="cancelled">Cancelled</option>
              </select>
              <input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              <select className="select" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })}>
                <option value="">Select venue</option>
                {venues.map((venue) => <option key={venue.id} value={venue.id}>{venue.name}</option>)}
              </select>
              <input className="input" type="number" min="1" placeholder="Capacity" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
              <input className="input" placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <div style={{ marginTop: 14 }}>
              <textarea className="textarea" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="form-actions">
              <button type="button" className="btn secondary" onClick={onCancel}>Cancel</button>
              <button type="submit" className="btn">{event ? 'Update event' : 'Create event'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}