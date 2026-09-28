import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { formatDateLong, formatDateTime, getStatusBadgeClass } from '../utils/formatters';

export default function EventDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const eventQuery = useQuery({
    queryKey: ['event', id],
    queryFn: () => api.get(`/events/${id}/`).then((res) => res.data),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/events/${id}/`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['events'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigate('/events');
    },
  });

  if (eventQuery.isLoading) return <div className="card">Loading event details...</div>;
  if (eventQuery.isError) return <div className="notice error">Unable to load event details.</div>;

  const event = eventQuery.data;

  return (
    <div className="stack">
      <div className="card">
        <div className="row space-between">
          <div>
            <h2 style={{ marginBottom: 8 }}>{event.title}</h2>
            <span className={`badge ${getStatusBadgeClass(event.status)}`}>{event.status}</span>
          </div>
          <div className="row">
            <Link className="btn secondary" to={`/events/${id}/edit`}>Edit</Link>
            <button className="btn danger" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
        <p className="muted" style={{ marginTop: 14 }}>{event.description || 'No description provided.'}</p>
        <div className="grid cols-3" style={{ marginTop: 16 }}>
          <div className="panel"><div className="metric-label">Starts</div><div><strong>{formatDateTime(event.start_date)}</strong></div></div>
          <div className="panel"><div className="metric-label">Ends</div><div><strong>{event.end_date ? formatDateTime(event.end_date) : '—'}</strong></div></div>
          <div className="panel"><div className="metric-label">Venue</div><div><strong>{event.venue_name || '—'}</strong></div></div>
        </div>
      </div>

      <div className="grid cols-2">
        <div className="card">
          <h3>Attendees / Registrations</h3>
          {event.registrations?.length ? event.registrations.map((reg) => (
            <div key={reg.id} className="panel" style={{ marginTop: 12 }}>
              <div className="row space-between">
                <div>
                  <strong>{reg.attendee_name}</strong>
                  <div className="muted">{reg.attendee_email}</div>
                </div>
                <span className="badge primary">{reg.status}</span>
              </div>
              <div className="muted" style={{ marginTop: 8 }}>Registered on {formatDateLong(reg.registered_at)}</div>
            </div>
          )) : <div className="notice empty">No registrations yet.</div>}
        </div>
        <div className="card">
          <h3>Event Summary</h3>
          <div className="panel">
            <div className="metric-label">Capacity</div>
            <div className="metric" style={{ fontSize: '1.6rem' }}>{event.capacity ?? '—'}</div>
          </div>
          <div className="panel" style={{ marginTop: 12 }}>
            <div className="metric-label">Registrations</div>
            <div className="metric" style={{ fontSize: '1.6rem' }}>{event.registrations?.length || 0}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
