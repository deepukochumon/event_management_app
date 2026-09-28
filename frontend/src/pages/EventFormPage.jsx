import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

const initialState = {
  title: '',
  description: '',
  status: 'draft',
  start_date: '',
  end_date: '',
  venue: '',
  capacity: '',
};

export default function EventFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialState);
  const [formError, setFormError] = useState('');

  const eventQuery = useQuery({
    queryKey: ['event', id],
    queryFn: () => api.get(`/events/${id}/`).then((res) => res.data),
    enabled: isEdit,
  });

  useEffect(() => {
    if (eventQuery.data) {
      const e = eventQuery.data;
      setForm({
        title: e.title || '',
        description: e.description || '',
        status: e.status || 'draft',
        start_date: e.start_date ? e.start_date.slice(0, 16) : '',
        end_date: e.end_date ? e.end_date.slice(0, 16) : '',
        venue: e.venue || '',
        capacity: e.capacity ?? '',
      });
    }
  }, [eventQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, capacity: form.capacity === '' ? null : Number(form.capacity) };
      return isEdit ? api.put(`/events/${id}/`, payload) : api.post('/events/', payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['events'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigate('/events');
    },
    onError: (err) => setFormError(err?.response?.data?.detail || err.message || 'Unable to save event.'),
  });

  const submit = (e) => { e.preventDefault(); setFormError(''); saveMutation.mutate(); };

  return (
    <div className="card">
      <h2>{isEdit ? 'Edit Event' : 'Create Event'}</h2>
      {eventQuery.isLoading && <div className="notice">Loading event...</div>}
      {eventQuery.isError && <div className="notice error">Unable to load event.</div>}
      {formError && <div className="notice error">{formError}</div>}
      <form onSubmit={submit} className="stack" style={{ marginTop: 16 }}>
        <div className="form-grid">
          <input className="input" required placeholder="Event title" value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} />
          <select className="select" value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))}>
            <option value="draft">Draft</option><option value="published">Published</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
          </select>
          <input className="input" type="datetime-local" required value={form.start_date} onChange={(e) => setForm((s) => ({ ...s, start_date: e.target.value }))} />
          <input className="input" type="datetime-local" value={form.end_date} onChange={(e) => setForm((s) => ({ ...s, end_date: e.target.value }))} />
          <input className="input" placeholder="Venue ID or name" value={form.venue} onChange={(e) => setForm((s) => ({ ...s, venue: e.target.value }))} />
          <input className="input" type="number" min="1" placeholder="Capacity" value={form.capacity} onChange={(e) => setForm((s) => ({ ...s, capacity: e.target.value }))} />
        </div>
        <textarea className="textarea" placeholder="Description" value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
        <div className="form-actions">
          <button className="btn primary" type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving...' : 'Save Event'}</button>
          <button className="btn secondary" type="button" onClick={() => navigate('/events')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
