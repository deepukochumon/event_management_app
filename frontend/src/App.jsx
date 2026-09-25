import React from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AppBar, Box, Button, Card, CardContent, Chip, Container, Dialog, DialogActions, DialogContent, DialogTitle, Divider,
  Drawer, Grid, IconButton, InputAdornment, List, ListItemButton, ListItemIcon, ListItemText, MenuItem, Paper,
  Skeleton, Stack, TextField, Toolbar, Typography, Alert, Tabs, Tab, CircularProgress, Table, TableBody, TableCell,
  TableHead, TableRow, Tooltip, LinearProgress, useMediaQuery
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { Bar, Doughnut } from 'react-chartjs-2';
import 'chart.js/auto';
import axios from 'axios';
import { format, parseISO, startOfDay, endOfDay, isAfter, isBefore } from 'date-fns';
import { CalendarDays, Clock3, MapPin, Search, Plus, Users, LayoutDashboard, CalendarRange, ListFilter, Trash2, Pencil, BadgeCheck, Ticket, TrendingUp } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api' });
const statusColor = { scheduled: 'primary', cancelled: 'error', completed: 'success', draft: 'default' };
const eventStatusLabels = { scheduled: 'Scheduled', cancelled: 'Cancelled', completed: 'Completed', draft: 'Draft' };

async function fetchJson(url, params) { const { data } = await api.get(url, { params }); return data; }
async function postJson(url, body) { const { data } = await api.post(url, body); return data; }
async function putJson(url, body) { const { data } = await api.put(url, body); return data; }
async function delJson(url) { const { data } = await api.delete(url); return data; }

function useDashboard() { return useQuery({ queryKey: ['dashboard'], queryFn: () => fetchJson('/dashboard/') }); }
function useEvents(params) { return useQuery({ queryKey: ['events', params], queryFn: () => fetchJson('/events/', params) }); }
function useEvent(id) { return useQuery({ queryKey: ['event', id], queryFn: () => fetchJson(`/events/${id}/`), enabled: !!id }); }
function useVenues() { return useQuery({ queryKey: ['venues'], queryFn: () => fetchJson('/venues/') }); }
function useAttendees(eventId) { return useQuery({ queryKey: ['attendees', eventId], queryFn: () => fetchJson(`/events/${eventId}/attendees/`), enabled: !!eventId }); }

function AppShell({ children }) {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const nav = [
    { to: '/', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { to: '/events', icon: <CalendarRange size={18} />, label: 'Events' },
    { to: '/calendar', icon: <CalendarDays size={18} />, label: 'Calendar' },
  ];
  return <Box sx={{ display: 'flex', minHeight: '100vh' }}>
    <AppBar position="fixed" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', color: 'text.primary' }}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 800 }}>EventFlow</Typography>
        <Button component={Link} to="/events/new" variant="contained" startIcon={<Plus size={18} />}>New Event</Button>
      </Toolbar>
    </AppBar>
    <Drawer variant={isMdUp ? 'permanent' : 'temporary'} open={false} sx={{ width: 260, flexShrink: 0, '& .MuiDrawer-paper': { width: 260, boxSizing: 'border-box', mt: 8 } }}>
      <Toolbar />
      <Box sx={{ p: 2 }}>
        <Stack spacing={1}>{nav.map(item => <Button key={item.to} component={Link} to={item.to} startIcon={item.icon} sx={{ justifyContent: 'flex-start' }}>{item.label}</Button>)}</Stack>
      </Box>
    </Drawer>
    <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>{children}</Box>
  </Box>;
}

function StatCard({ title, value, icon, helper, color = 'primary' }) { return <Card sx={{ height: '100%' }}><CardContent><Stack direction="row" justifyContent="space-between" alignItems="flex-start"><Box><Typography variant="body2" color="text.secondary">{title}</Typography><Typography variant="h4" sx={{ mt: .5 }}>{value}</Typography><Typography variant="caption" color="text.secondary">{helper}</Typography></Box><Box sx={{ p: 1.3, borderRadius: 3, bgcolor: alpha(useTheme().palette[color].main, .12), color: `${color}.main` }}>{icon}</Box></Stack></CardContent></Card> }

function DashboardPage() {
  const { data, isLoading, error } = useDashboard();
  const theme = useTheme();
  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  const stats = data?.stats || {};
  return <Stack spacing={3}><Box><Typography variant="h4">Dashboard</Typography><Typography color="text.secondary">Overview of upcoming events, registrations, and performance.</Typography></Box>
    <Grid container spacing={2}>{[
      { title: 'Upcoming Events', value: stats.upcoming_events ?? 0, icon: <CalendarDays size={24} />, helper: 'Scheduled soon' },
      { title: 'Total Registrations', value: stats.total_registrations ?? 0, icon: <Ticket size={24} />, helper: 'All active registrations', color: 'secondary' },
      { title: 'Attendees', value: stats.total_attendees ?? 0, icon: <Users size={24} />, helper: 'Unique attendees', color: 'success' },
      { title: 'Capacity Utilization', value: `${stats.capacity_utilization ?? 0}%`, icon: <TrendingUp size={24} />, helper: 'Across all events', color: 'warning' },
    ].map(s => <Grid item xs={12} sm={6} lg={3} key={s.title}><StatCard {...s} /></Grid>)}</Grid>
    <Grid container spacing={2}><Grid item xs={12} md={8}><Card><CardContent><Typography variant="h6" gutterBottom>Registration Trend</Typography><Bar data={{ labels: stats.registration_trend?.labels || [], datasets: [{ label: 'Registrations', data: stats.registration_trend?.data || [], backgroundColor: theme.palette.primary.main }] }} options={{ responsive: true, plugins: { legend: { display: false } } }} /></CardContent></Card></Grid><Grid item xs={12} md={4}><Card><CardContent><Typography variant="h6" gutterBottom>Event Status</Typography><Doughnut data={{ labels: stats.status_breakdown?.labels || [], datasets: [{ data: stats.status_breakdown?.data || [], backgroundColor: ['#2563eb', '#22c55e', '#f59e0b', '#ef4444'] }] }} /></CardContent></Card></Grid></Grid>
    <Card><CardContent><Typography variant="h6" gutterBottom>Upcoming Events</Typography><Stack spacing={1}>{(data?.upcoming_events || []).slice(0, 5).map(ev => <EventRow key={ev.id} event={ev} />)}</Stack></CardContent></Card></Stack>;
}

function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = React.useState({ q: searchParams.get('q') || '', status: searchParams.get('status') || '', sort: searchParams.get('sort') || '-starts_at', start_date: searchParams.get('start_date') || '', end_date: searchParams.get('end_date') || '' });
  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
  const { data, isLoading, error } = useEvents(params);
  React.useEffect(() => { setSearchParams(params, { replace: true }); }, [JSON.stringify(params)]);
  return <Stack spacing={3}><Box><Typography variant="h4">Events</Typography><Typography color="text.secondary">Search, filter, sort, and manage events.</Typography></Box>
    <Paper sx={{ p: 2 }}><Stack spacing={2}><Grid container spacing={2}>{['q','status','sort','start_date','end_date'].map(() => null)}</Grid>
      <Grid container spacing={2}><Grid item xs={12} md={4}><TextField fullWidth label="Search" value={filters.q} onChange={e => setFilters(f => ({ ...f, q: e.target.value }))} InputProps={{ startAdornment: <InputAdornment position="start"><Search size={18} /></InputAdornment> }} /></Grid><Grid item xs={12} md={2}><TextField select fullWidth label="Status" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}><MenuItem value="">All</MenuItem><MenuItem value="scheduled">Scheduled</MenuItem><MenuItem value="draft">Draft</MenuItem><MenuItem value="completed">Completed</MenuItem><MenuItem value="cancelled">Cancelled</MenuItem></TextField></Grid><Grid item xs={12} md={2}><TextField select fullWidth label="Sort" value={filters.sort} onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))}><MenuItem value="-starts_at">Start Desc</MenuItem><MenuItem value="starts_at">Start Asc</MenuItem><MenuItem value="name">Name</MenuItem></TextField></Grid><Grid item xs={12} md={2}><TextField type="date" fullWidth label="From" InputLabelProps={{ shrink: true }} value={filters.start_date} onChange={e => setFilters(f => ({ ...f, start_date: e.target.value }))} /></Grid><Grid item xs={12} md={2}><TextField type="date" fullWidth label="To" InputLabelProps={{ shrink: true }} value={filters.end_date} onChange={e => setFilters(f => ({ ...f, end_date: e.target.value }))} /></Grid></Grid></Stack></Paper>
    {isLoading && <LoadingState />}{error && <ErrorState error={error} />}
    <Grid container spacing={2}>{(data?.results || []).map(event => <Grid item xs={12} md={6} lg={4} key={event.id}><EventCard event={event} /></Grid>)}</Grid>
    {!isLoading && data?.results?.length === 0 && <EmptyState title="No events found" description="Try adjusting filters or create a new event." action={<Button component={Link} to="/events/new" variant="contained">Create event</Button>} />}
  </Stack>;
}

function EventCard({ event }) { return <Card sx={{ height: '100%' }}><CardContent><Stack spacing={1.2}><Stack direction="row" justifyContent="space-between" alignItems="flex-start"><Chip size="small" label={eventStatusLabels[event.status] || event.status} color={statusColor[event.status] || 'default'} /><Typography variant="caption" color="text.secondary">{format(parseISO(event.starts_at), 'PPP p')}</Typography></Stack><Typography variant="h6">{event.name}</Typography><Stack direction="row" spacing={1} alignItems="center" color="text.secondary"><MapPin size={16} /><Typography variant="body2">{event.venue_name || 'Venue TBD'}</Typography></Stack><Typography variant="body2" color="text.secondary" sx={{ minHeight: 42 }}>{event.description || 'No description provided.'}</Typography><Stack direction="row" spacing={1}><Button component={Link} to={`/events/${event.id}`} size="small">Details</Button><Button component={Link} to={`/events/${event.id}/edit`} size="small">Edit</Button></Stack></Stack></CardContent></Card>; }
function EventRow({ event }) { return <Paper variant="outlined" sx={{ p: 1.5 }}><Stack direction="row" justifyContent="space-between" alignItems="center"><Box><Typography fontWeight={700}>{event.name}</Typography><Typography variant="body2" color="text.secondary">{format(parseISO(event.starts_at), 'PP p')} · {event.venue_name || 'Venue TBD'}</Typography></Box><Chip size="small" label={eventStatusLabels[event.status] || event.status} color={statusColor[event.status] || 'default'} /></Stack></Paper>; }

function EventFormPage() { const { id } = useParams(); const editing = Boolean(id); const { data, isLoading } = useEvent(id); const venuesQuery = useVenues(); const queryClient = useQueryClient(); const navigate = useNavigate(); const [form, setForm] = React.useState({ name: '', description: '', venue: '', starts_at: '', ends_at: '', capacity: '', status: 'scheduled' }); React.useEffect(() => { if (data) setForm({ name: data.name || '', description: data.description || '', venue: data.venue?.id?.toString() || '', starts_at: data.starts_at ? data.starts_at.slice(0,16) : '', ends_at: data.ends_at ? data.ends_at.slice(0,16) : '', capacity: data.capacity || '', status: data.status || 'scheduled' }); }, [data]); const mutation = useMutation({ mutationFn: payload => editing ? putJson(`/events/${id}/`, payload) : postJson('/events/', payload), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['events'] }); await queryClient.invalidateQueries({ queryKey: ['dashboard'] }); navigate('/events'); } }); const save = e => { e.preventDefault(); mutation.mutate({ ...form, venue: form.venue ? Number(form.venue) : null, capacity: form.capacity ? Number(form.capacity) : null }); }; if (isLoading && editing) return <LoadingState />; return <Stack spacing={3}><Box><Typography variant="h4">{editing ? 'Edit Event' : 'Create Event'}</Typography></Box><Paper sx={{ p: 3 }}><Box component="form" onSubmit={save}><Grid container spacing={2}><Grid item xs={12}><TextField fullWidth required label="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Grid><Grid item xs={12} md={6}><TextField fullWidth label="Venue" select value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))}>{(venuesQuery.data?.results || []).map(v => <MenuItem value={v.id} key={v.id}>{v.name}</MenuItem>)}</TextField></Grid><Grid item xs={12} md={3}><TextField fullWidth type="datetime-local" label="Starts At" InputLabelProps={{ shrink: true }} value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))} /></Grid><Grid item xs={12} md={3}><TextField fullWidth type="datetime-local" label="Ends At" InputLabelProps={{ shrink: true }} value={form.ends_at} onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))} /></Grid><Grid item xs={12} md={3}><TextField fullWidth label="Capacity" type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} /></Grid><Grid item xs={12} md={3}><TextField fullWidth select label="Status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}><MenuItem value="draft">Draft</MenuItem><MenuItem value="scheduled">Scheduled</MenuItem><MenuItem value="completed">Completed</MenuItem><MenuItem value="cancelled">Cancelled</MenuItem></TextField></Grid><Grid item xs={12}><TextField fullWidth multiline minRows={4} label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></Grid></Grid><Stack direction="row" spacing={2} sx={{ mt: 3 }}><Button type="submit" variant="contained" disabled={mutation.isPending}>{mutation.isPending ? 'Saving…' : 'Save Event'}</Button><Button component={Link} to="/events">Cancel</Button></Stack></Box></Paper></Stack>; }

function EventDetailsPage() { const { id } = useParams(); const navigate = useNavigate(); const qc = useQueryClient(); const { data, isLoading, error } = useEvent(id); const attendees = useAttendees(id); const delMutation = useMutation({ mutationFn: () => delJson(`/events/${id}/`), onSuccess: async () => { await qc.invalidateQueries({ queryKey: ['events'] }); navigate('/events'); } }); if (isLoading) return <LoadingState />; if (error) return <ErrorState error={error} />; const event = data; return <Stack spacing={3}><Stack direction="row" justifyContent="space-between" alignItems="flex-start"><Box><Typography variant="h4">{event.name}</Typography><Typography color="text.secondary">{format(parseISO(event.starts_at), 'PPP p')} · {event.venue?.name || 'Venue TBD'}</Typography></Box><Stack direction="row" spacing={1}><Button component={Link} to={`/events/${id}/edit`} variant="outlined" startIcon={<Pencil size={18} />}>Edit</Button><Button color="error" variant="outlined" startIcon={<Trash2 size={18} />} onClick={() => delMutation.mutate()} disabled={delMutation.isPending}>Delete</Button></Stack></Stack><Grid container spacing={2}><Grid item xs={12} md={8}><Card><CardContent><Typography variant="h6" gutterBottom>Event Details</Typography><Typography paragraph>{event.description || 'No description available.'}</Typography><Divider sx={{ my: 2 }} /><Stack spacing={1}><InfoRow label="Capacity" value={event.capacity || '—'} /><InfoRow label="Status" value={eventStatusLabels[event.status] || event.status} /><InfoRow label="Venue" value={event.venue?.name || 'TBD'} /><InfoRow label="Registrations" value={event.registration_count ?? 0} /></Stack></CardContent></Card></Grid><Grid item xs={12} md={4}><Card><CardContent><Typography variant="h6" gutterBottom>Attendees</Typography>{attendees.isLoading ? <LinearProgress /> : <Stack spacing={1}>{(attendees.data?.results || []).map(a => <Paper variant="outlined" sx={{ p: 1.2 }} key={a.id}><Typography fontWeight={700}>{a.name}</Typography><Typography variant="body2" color="text.secondary">{a.email}</Typography></Paper>)}{(attendees.data?.results || []).length === 0 && <Typography color="text.secondary">No attendees yet.</Typography>}</Stack>}</CardContent></Card></Grid></Grid></Stack>; }

function CalendarPage() { const { data, isLoading, error } = useEvents({ ordering: 'starts_at' }); if (isLoading) return <LoadingState />; if (error) return <ErrorState error={error} />; const events = data?.results || []; return <Stack spacing={3}><Box><Typography variant="h4">Calendar</Typography><Typography color="text.secondary">A lightweight schedule view of upcoming events.</Typography></Box><Grid container spacing={2}>{events.map(event => <Grid item xs={12} md={6} key={event.id}><Paper sx={{ p: 2 }}><Stack direction="row" justifyContent="space-between"><Box><Typography fontWeight={700}>{event.name}</Typography><Typography variant="body2" color="text.secondary">{format(parseISO(event.starts_at), 'PP p')}</Typography></Box><Chip size="small" label={eventStatusLabels[event.status] || event.status} /></Stack></Paper></Grid>)}</Grid></Stack>; }

function InfoRow({ label, value }) { return <Stack direction="row" justifyContent="space-between"><Typography color="text.secondary">{label}</Typography><Typography fontWeight={600}>{value}</Typography></Stack>; }
function LoadingState() { return <Stack spacing={2}>{[1,2,3].map(i => <Skeleton key={i} variant="rounded" height={120} />)}</Stack>; }
function EmptyState({ title, description, action }) { return <Paper sx={{ p: 4, textAlign: 'center' }}><Typography variant="h6">{title}</Typography><Typography color="text.secondary" sx={{ mb: 2 }}>{description}</Typography>{action}</Paper>; }
function ErrorState({ error }) { return <Alert severity="error">{error?.response?.data?.detail || error?.message || 'Something went wrong.'}</Alert>; }

export default function App() { return <AppShell><Routes><Route path="/" element={<DashboardPage />} /><Route path="/events" element={<EventsPage />} /><Route path="/events/new" element={<EventFormPage />} /><Route path="/events/:id" element={<EventDetailsPage />} /><Route path="/events/:id/edit" element={<EventFormPage />} /><Route path="/calendar" element={<CalendarPage />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></AppShell>; }