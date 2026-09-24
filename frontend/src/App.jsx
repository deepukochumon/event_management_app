import React, { useMemo, useState, useEffect } from 'react'
import { Routes, Route, Link, NavLink, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { addDays, format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns'
import { Calendar, Users, MapPin, BarChart3, Search, Plus, Edit, Trash2, ArrowLeft, Filter, ChevronDown, Loader2, AlertCircle, CheckCircle2, X, CalendarDays, Ticket, TrendingUp } from 'lucide-react'
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell, LineChart, Line } from 'recharts'

const api = axios.create({ baseURL: '/api' })

const formatDateTime = (value) => {
  if (!value) return '—'
  try { return format(parseISO(value), 'PP p') } catch { return value }
}

const formatDate = (value) => {
  if (!value) return '—'
  try { return format(parseISO(value), 'PP') } catch { return value }
}

function useDashboardData() {
  const [state, setState] = useState({ loading: true, error: '', data: null })
  useEffect(() => {
    let mounted = true
    api.get('/dashboard/')
      .then((res) => mounted && setState({ loading: false, error: '', data: res.data }))
      .catch((err) => mounted && setState({ loading: false, error: err.response?.data?.detail || 'Unable to load dashboard', data: null }))
    return () => { mounted = false }
  }, [])
  return state
}

function Layout({ children }) {
  return <div className="app-shell"><aside className="sidebar"><div className="brand"><CalendarDays size={24} /><div><strong>EventFlow</strong><span>Management Suite</span></div></div><nav><NavLink to="/" end>Dashboard</NavLink><NavLink to="/events">Events</NavLink><NavLink to="/calendar">Calendar</NavLink></nav></aside><main className="main"><header className="topbar"><div><p className="eyebrow">Professional Event Management</p><h1>Plan, track, and grow your events</h1></div><Link className="btn primary" to="/events/new"><Plus size={18} /> New Event</Link></header>{children}</main></div>
}

function StatCard({ icon, label, value, hint }) {
  return <div className="card stat"><div className="stat-icon">{icon}</div><div><p>{label}</p><h3>{value}</h3><small>{hint}</small></div></div>
}

function DashboardPage() {
  const { loading, error, data } = useDashboardData()
  const upcoming = data?.upcoming_events || []
  const stats = data?.stats || {}
  const chartData = data?.event_trends || []
  const regData = data?.registration_distribution || []
  if (loading) return <div className="center"><Loader2 className="spin" /><p>Loading dashboard…</p></div>
  if (error) return <div className="state error"><AlertCircle /><div><h3>Dashboard unavailable</h3><p>{error}</p></div></div>
  return <div className="stack">
    <section className="grid stats-grid">
      <StatCard icon={<Calendar />} label="Upcoming Events" value={stats.upcoming_events ?? upcoming.length} hint="Next 30 days" />
      <StatCard icon={<Ticket />} label="Registrations" value={stats.total_registrations ?? 0} hint="All active registrations" />
      <StatCard icon={<Users />} label="Attendees" value={stats.total_attendees ?? 0} hint="Confirmed attendees" />
      <StatCard icon={<TrendingUp />} label="Occupancy" value={`${stats.avg_occupancy ?? 0}%`} hint="Average capacity fill" />
    </section>
    <section className="grid two-col">
      <div className="card"><div className="card-head"><h2>Upcoming Events</h2><Link to="/events">View all</Link></div><div className="table-list">{upcoming.length ? upcoming.map((e) => <Link key={e.id} to={`/events/${e.id}`} className="list-row"><div><strong>{e.title}</strong><p>{e.venue_name || 'TBA'} • {formatDateTime(e.start_at)}</p></div><span>{e.registration_count ?? 0} regs</span></Link>) : <EmptyState title="No upcoming events" description="Create your first event to get started." action={<Link className="btn primary" to="/events/new">Create event</Link>} />}</div></div>
      <div className="card"><div className="card-head"><h2>Registrations</h2></div><ResponsiveContainer width="100%" height={260}><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="label" /><YAxis /><Tooltip /><Bar dataKey="count" fill="#4f46e5" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div>
    </section>
    <section className="grid two-col">
      <div className="card"><div className="card-head"><h2>Event Trends</h2></div><ResponsiveContainer width="100%" height={260}><LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="label" /><YAxis /><Tooltip /><Line type="monotone" dataKey="count" stroke="#16a34a" strokeWidth={3} /></LineChart></ResponsiveContainer></div>
      <div className="card"><div className="card-head"><h2>Status Distribution</h2></div><ResponsiveContainer width="100%" height={260}><PieChart><Pie data={regData} dataKey="value" nameKey="name" innerRadius={64} outerRadius={92} paddingAngle={4}>{regData.map((entry, idx) => <Cell key={entry.name} fill={['#4f46e5', '#16a34a', '#f59e0b', '#ef4444'][idx % 4]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
    </section>
  </div>
}

function EmptyState({ title, description, action }) { return <div className="empty"><h3>{title}</h3><p>{description}</p>{action}</div> }

function EventsPage() {
  const [params, setParams] = useState({ search: '', status: '', sort: '-start_at', date_from: '', date_to: '' })
  const [data, setData] = useState({ loading: true, error: '', results: [] })
  const fetchEvents = async () => {
    setData((s) => ({ ...s, loading: true, error: '' }))
    try {
      const res = await api.get('/events/', { params: { ...params, page_size: 100 } })
      setData({ loading: false, error: '', results: res.data.results || [] })
    } catch (err) {
      setData({ loading: false, error: err.response?.data?.detail || 'Failed to load events', results: [] })
    }
  }
  useEffect(() => { fetchEvents() }, [params.sort])
  const filtered = useMemo(() => data.results.filter((e) => {
    const matchesSearch = [e.title, e.description, e.venue_name].join(' ').toLowerCase().includes(params.search.toLowerCase())
    const matchesStatus = !params.status || e.status === params.status
    const start = e.start_at ? parseISO(e.start_at) : null
    const fromOk = !params.date_from || (start && start >= startOfDay(parseISO(params.date_from)))
    const toOk = !params.date_to || (start && start <= endOfDay(parseISO(params.date_to)))
    return matchesSearch && matchesStatus && fromOk && toOk
  }).sort((a, b) => params.sort === 'start_at' ? new Date(a.start_at) - new Date(b.start_at) : new Date(b.start_at) - new Date(a.start_at)), [data.results, params])
  return <div className="stack"><div className="toolbar"><div className="search"><Search size={18} /><input placeholder="Search events..." value={params.search} onChange={(e) => setParams((p) => ({ ...p, search: e.target.value }))} /></div><select value={params.status} onChange={(e) => setParams((p) => ({ ...p, status: e.target.value }))}><option value="">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="cancelled">Cancelled</option></select><select value={params.sort} onChange={(e) => setParams((p) => ({ ...p, sort: e.target.value }))}><option value="-start_at">Newest first</option><option value="start_at">Oldest first</option></select><input type="date" value={params.date_from} onChange={(e) => setParams((p) => ({ ...p, date_from: e.target.value }))} /><input type="date" value={params.date_to} onChange={(e) => setParams((p) => ({ ...p, date_to: e.target.value }))} /><Link className="btn primary" to="/events/new"><Plus size={18} /> Create</Link></div>{data.loading ? <div className="center"><Loader2 className="spin" /><p>Loading events…</p></div> : data.error ? <div className="state error"><AlertCircle /><p>{data.error}</p></div> : filtered.length ? <div className="grid cards">{filtered.map((event) => <Link key={event.id} className="card event-card" to={`/events/${event.id}`}><div className="event-top"><span className={`badge ${event.status}`}>{event.status}</span><div className="icon-btns"><Link className="icon-btn" to={`/events/${event.id}/edit`} onClick={(e) => e.stopPropagation()}><Edit size={16} /></Link></div></div><h3>{event.title}</h3><p>{event.description}</p><div className="meta"><span><MapPin size={14} /> {event.venue_name || 'TBA'}</span><span><Calendar size={14} /> {formatDateTime(event.start_at)}</span></div><div className="meta"><span><Users size={14} /> {event.registration_count ?? 0}</span><span>{event.capacity ?? '—'} capacity</span></div></Link>)}</div> : <EmptyState title="No events found" description="Try adjusting your filters or create a new event." action={<Link className="btn primary" to="/events/new">Create event</Link>} />}</div>
}

function EventFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const editing = Boolean(id)
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(editing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ title: '', description: '', venue: '', start_at: '', end_at: '', capacity: 100, status: 'draft' })
  useEffect(() => { api.get('/venues/').then((r) => setVenues(r.data.results || r.data)).catch(() => setVenues([])) }, [])
  useEffect(() => {
    if (!editing) return
    api.get(`/events/${id}/`).then((r) => { const e = r.data; setForm({ title: e.title || '', description: e.description || '', venue: e.venue?.id || '', start_at: e.start_at ? e.start_at.slice(0,16) : '', end_at: e.end_at ? e.end_at.slice(0,16) : '', capacity: e.capacity ?? 100, status: e.status || 'draft' }); setLoading(false) }).catch((err) => { setError(err.response?.data?.detail || 'Unable to load event'); setLoading(false) })
  }, [editing, id])
  const submit = async (e) => { e.preventDefault(); setSaving(true); setError(''); try { const payload = { ...form, venue: form.venue ? Number(form.venue) : null, capacity: Number(form.capacity) }; if (editing) await api.put(`/events/${id}/`, payload); else await api.post('/events/', payload); navigate('/events') } catch (err) { setError(JSON.stringify(err.response?.data || { detail: 'Validation failed' })) } finally { setSaving(false) } }
  if (loading) return <div className="center"><Loader2 className="spin" /><p>Loading form…</p></div>
  return <form className="card form" onSubmit={submit}><div className="card-head"><h2>{editing ? 'Edit Event' : 'Create Event'}</h2><Link to="/events" className="btn ghost"><ArrowLeft size={18} /> Back</Link></div>{error && <div className="state error"><AlertCircle /><p>{error}</p></div>}<div className="grid form-grid"><label>Title<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label><label>Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="draft">Draft</option><option value="published">Published</option><option value="cancelled">Cancelled</option></select></label><label>Description<textarea rows="5" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label><label>Venue<select value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })}><option value="">Select venue</option>{venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select></label><label>Start<input type="datetime-local" required value={form.start_at} onChange={(e) => setForm({ ...form, start_at: e.target.value })} /></label><label>End<input type="datetime-local" required value={form.end_at} onChange={(e) => setForm({ ...form, end_at: e.target.value })} /></label><label>Capacity<input type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></label></div><div className="actions"><button className="btn primary" disabled={saving}>{saving ? <Loader2 className="spin" /> : 'Save Event'}</button></div></form>
}

function EventDetailPage() {
  const { id } = useParams(); const navigate = useNavigate(); const [state, setState] = useState({ loading: true, error: '', data: null })
  useEffect(() => { api.get(`/events/${id}/`).then((r) => setState({ loading: false, error: '', data: r.data })).catch((err) => setState({ loading: false, error: err.response?.data?.detail || 'Failed to load event', data: null })) }, [id])
  const deleteEvent = async () => { if (!confirm('Delete this event?')) return; await api.delete(`/events/${id}/`); navigate('/events') }
  if (state.loading) return <div className="center"><Loader2 className="spin" /><p>Loading event…</p></div>
  if (state.error) return <div className="state error"><AlertCircle /><p>{state.error}</p></div>
  const e = state.data
  return <div className="stack"><div className="card detail-hero"><div><span className={`badge ${e.status}`}>{e.status}</span><h2>{e.title}</h2><p>{e.description}</p><div className="meta"><span><MapPin size={14} /> {e.venue_name || 'TBA'}</span><span><Calendar size={14} /> {formatDateTime(e.start_at)} — {formatDateTime(e.end_at)}</span><span><Users size={14} /> {e.registration_count ?? 0}/{e.capacity}</span></div></div><div className="actions"><Link className="btn ghost" to={`/events/${e.id}/edit`}><Edit size={16} /> Edit</Link><button className="btn danger" onClick={deleteEvent}><Trash2 size={16} /> Delete</button></div></div><div className="grid two-col"><div className="card"><div className="card-head"><h3>Attendees / Registrations</h3></div>{e.registrations?.length ? <div className="table-list">{e.registrations.map((r) => <div className="list-row" key={r.id}><div><strong>{r.attendee_name}</strong><p>{r.attendee_email}</p></div><span>{r.status}</span></div>)}</div> : <EmptyState title="No registrations" description="Registrations will appear here once attendees sign up." />}</div><div className="card"><div className="card-head"><h3>Venue</h3></div><p><strong>{e.venue_name || 'No venue assigned'}</strong></p><p>{e.venue_address || '—'}</p><p>Created {formatDate(e.created_at)}</p></div></div></div>
}

function CalendarPage() {
  const [events, setEvents] = useState([])
  useEffect(() => { api.get('/events/', { params: { page_size: 200, sort: 'start_at' } }).then((r) => setEvents(r.data.results || [])) }, [])
  const days = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i))
  return <div className="card"><div className="card-head"><h2>Calendar</h2></div><div className="calendar-grid">{days.map((day) => { const eventsOnDay = events.filter((e) => e.start_at && isWithinInterval(parseISO(e.start_at), { start: startOfDay(day), end: endOfDay(day) })) ; return <div className="calendar-day" key={day.toISOString()}><div className="calendar-date">{format(day, 'EEE d')}</div>{eventsOnDay.map((e) => <Link key={e.id} to={`/events/${e.id}`} className="calendar-event">{e.title}</Link>)}</div> })}</div></div>
}

function App() {
  return <Layout><Routes><Route path="/" element={<DashboardPage />} /><Route path="/events" element={<EventsPage />} /><Route path="/events/new" element={<EventFormPage />} /><Route path="/events/:id" element={<EventDetailPage />} /><Route path="/events/:id/edit" element={<EventFormPage />} /><Route path="/calendar" element={<CalendarPage />} /></Routes></Layout>
}

export default App
