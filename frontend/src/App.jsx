import React, { useMemo, useState } from 'react';
import {
  Alert,
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { Add, CalendarDays, Edit3, Trash2, Users, MapPin, BarChart3, Search } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, isAfter, parseISO } from 'date-fns';
import axios from 'axios';

const API = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api' });

const emptyEvent = {
  title: '',
  description: '',
  start_datetime: '',
  end_datetime: '',
  venue: '',
  status: 'scheduled',
  capacity: 100,
  price: '0.00',
};

async function apiGet(path, params = {}) { return (await API.get(path, { params })).data; }
async function apiSend(method, path, data) { return (await API.request({ method, url: path, data })).data; }

function StatCard({ label, value, icon, helper }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="start">
          <Box>
            <Typography variant="body2" color="text.secondary">{label}</Typography>
            <Typography variant="h4" sx={{ mt: 1 }}>{value}</Typography>
            {helper ? <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{helper}</Typography> : null}
          </Box>
          <Box sx={{ p: 1.2, borderRadius: 3, bgcolor: 'primary.main', color: 'white' }}>{icon}</Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function EventForm({ open, onClose, initialValue, onSubmit, loading }) {
  const [form, setForm] = useState(initialValue || emptyEvent);
  React.useEffect(() => setForm(initialValue || emptyEvent), [initialValue, open]);
  const update = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));
  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{initialValue?.id ? 'Edit Event' : 'Create Event'}</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Title" value={form.title} onChange={update('title')} required fullWidth />
          <TextField label="Description" value={form.description} onChange={update('description')} multiline minRows={3} fullWidth />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}><TextField label="Start" type="datetime-local" value={form.start_datetime} onChange={update('start_datetime')} InputLabelProps={{ shrink: true }} fullWidth /></Grid>
            <Grid item xs={12} sm={6}><TextField label="End" type="datetime-local" value={form.end_datetime} onChange={update('end_datetime')} InputLabelProps={{ shrink: true }} fullWidth /></Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}><TextField label="Venue" value={form.venue} onChange={update('venue')} fullWidth /></Grid>
            <Grid item xs={12} sm={3}><TextField label="Capacity" type="number" value={form.capacity} onChange={update('capacity')} fullWidth /></Grid>
            <Grid item xs={12} sm={3}><TextField label="Price" type="number" value={form.price} onChange={update('price')} fullWidth /></Grid>
          </Grid>
          <TextField select label="Status" value={form.status} onChange={update('status')} fullWidth>
            <MenuItem value="scheduled">Scheduled</MenuItem>
            <MenuItem value="draft">Draft</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={() => onSubmit(form)} variant="contained" disabled={loading}>{loading ? 'Saving…' : 'Save'}</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function App() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('dashboard');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('-start_datetime');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selected, setSelected] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  const params = useMemo(() => ({ search, status, ordering: sort, date_from: dateFrom, date_to: dateTo }), [search, status, sort, dateFrom, dateTo]);
  const eventsQ = useQuery({ queryKey: ['events', params], queryFn: () => apiGet('/events/', params) });
  const dashboardQ = useQuery({ queryKey: ['dashboard'], queryFn: () => apiGet('/dashboard/') });
  const registrationsQ = useQuery({ queryKey: ['registrations'], queryFn: () => apiGet('/registrations/', { page_size: 20 }) });

  const saveMutation = useMutation({
    mutationFn: (payload) => selected?.id ? apiSend('put', `/events/${selected.id}/`, payload) : apiSend('post', '/events/', payload),
    onSuccess: async () => { setFormOpen(false); setSelected(null); await qc.invalidateQueries({ queryKey: ['events'] }); await qc.invalidateQueries({ queryKey: ['dashboard'] }); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => apiSend('delete', `/events/${id}/`),
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ['events'] }); await qc.invalidateQueries({ queryKey: ['dashboard'] }); },
  });

  const events = eventsQ.data?.results || eventsQ.data || [];
  const upcoming = events.filter((e) => isAfter(parseISO(e.start_datetime), new Date()));
  const stats = dashboardQ.data || {};

  const header = (
    <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'white', color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider' }}>
      <Container maxWidth="xl"><Toolbar sx={{ px: { xs: 0 } }}><Stack direction="row" alignItems="center" spacing={1} sx={{ flexGrow: 1 }}><CalendarDays size={22} /><Typography variant="h6">EventFlow</Typography></Stack><Button variant="contained" startIcon={<Add />} onClick={() => { setSelected(null); setFormOpen(true); }}>New Event</Button></Toolbar></Container>
    </AppBar>
  );

  return (
    <Box>
      {header}
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Stack spacing={3}>
          <Paper sx={{ p: 2.5, borderRadius: 4 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} alignItems={{ md: 'center' }}>
              <Box><Typography variant="h4">Dashboard</Typography><Typography color="text.secondary">Manage events, registrations, venues, and attendees from one place.</Typography></Box>
              <Tabs value={tab} onChange={(_, v) => setTab(v)}>
                <Tab value="dashboard" label="Dashboard" /><Tab value="events" label="Events" /><Tab value="calendar" label="Calendar" />
              </Tabs>
            </Stack>
          </Paper>

          {dashboardQ.isError ? <Alert severity="error">Failed to load dashboard.</Alert> : null}
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}><StatCard label="Upcoming Events" value={stats.upcoming_events ?? upcoming.length} icon={<CalendarDays size={18} />} /></Grid>
            <Grid item xs={12} md={3}><StatCard label="Registrations" value={stats.total_registrations ?? 0} icon={<Users size={18} />} /></Grid>
            <Grid item xs={12} md={3}><StatCard label="Venues" value={stats.total_venues ?? 0} icon={<MapPin size={18} />} /></Grid>
            <Grid item xs={12} md={3}><StatCard label="Revenue" value={`$${Number(stats.total_revenue || 0).toLocaleString()}`} icon={<BarChart3 size={18} />} /></Grid>
          </Grid>

          {tab !== 'dashboard' && (
            <Paper sx={{ p: 2, borderRadius: 4 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}><TextField fullWidth placeholder="Search events" value={search} onChange={(e) => setSearch(e.target.value)} InputProps={{ startAdornment: <Search size={18} style={{ marginRight: 8 }} /> }} /></Grid>
                <Grid item xs={12} md={2}><TextField select fullWidth label="Status" value={status} onChange={(e) => setStatus(e.target.value)}><MenuItem value="">All</MenuItem><MenuItem value="scheduled">Scheduled</MenuItem><MenuItem value="draft">Draft</MenuItem><MenuItem value="cancelled">Cancelled</MenuItem><MenuItem value="completed">Completed</MenuItem></TextField></Grid>
                <Grid item xs={12} md={2}><TextField select fullWidth label="Sort" value={sort} onChange={(e) => setSort(e.target.value)}><MenuItem value="-start_datetime">Newest</MenuItem><MenuItem value="start_datetime">Oldest</MenuItem><MenuItem value="title">Title</MenuItem></TextField></Grid>
                <Grid item xs={6} md={2}><TextField type="date" label="From" fullWidth InputLabelProps={{ shrink: true }} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></Grid>
                <Grid item xs={6} md={2}><TextField type="date" label="To" fullWidth InputLabelProps={{ shrink: true }} value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></Grid>
              </Grid>
            </Paper>
          )}

          {eventsQ.isLoading ? <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box> : null}
          {eventsQ.isError ? <Alert severity="error">Failed to load events.</Alert> : null}

          {tab === 'events' && !eventsQ.isLoading && events.length === 0 ? <Paper sx={{ p: 5, textAlign: 'center' }}><Typography variant="h6">No events found</Typography><Typography color="text.secondary">Try changing filters or create a new event.</Typography></Paper> : null}

          {tab === 'events' && events.length > 0 && (
            <Grid container spacing={2}>
              {events.map((event) => (
                <Grid item xs={12} md={6} lg={4} key={event.id}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" spacing={2}>
                        <Box>
                          <Typography variant="h6">{event.title}</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{format(parseISO(event.start_datetime), 'PPp')}</Typography>
                        </Box>
                        <Chip label={event.status} size="small" />
                      </Stack>
                      <Typography sx={{ mt: 2 }} color="text.secondary" noWrap>{event.description || 'No description provided.'}</Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap' }}>
                        <Chip size="small" label={`Venue: ${event.venue_name || event.venue || 'N/A'}`} />
                        <Chip size="small" label={`Regs: ${event.registration_count ?? 0}`} />
                        <Chip size="small" label={`Capacity: ${event.capacity}`} />
                      </Stack>
                      <Divider sx={{ my: 2 }} />
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Button size="small" onClick={() => { setSelected(event); setFormOpen(true); }}>Open</Button>
                        <Stack direction="row">
                          <Tooltip title="Edit"><IconButton onClick={() => { setSelected(event); setFormOpen(true); }}><Edit3 size={18} /></IconButton></Tooltip>
                          <Tooltip title="Delete"><IconButton color="error" onClick={() => deleteMutation.mutate(event.id)}><Trash2 size={18} /></IconButton></Tooltip>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {tab === 'dashboard' && (
            <Grid container spacing={2}>
              <Grid item xs={12} lg={7}>
                <Paper sx={{ p: 2.5, borderRadius: 4 }}>
                  <Typography variant="h6">Upcoming Events</Typography>
                  <Stack spacing={1.5} sx={{ mt: 2 }}>
                    {upcoming.slice(0, 6).map((event) => (
                      <Box key={event.id} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                        <Stack direction="row" justifyContent="space-between"><Box><Typography fontWeight={700}>{event.title}</Typography><Typography variant="body2" color="text.secondary">{format(parseISO(event.start_datetime), 'PPp')} • {event.venue_name || event.venue || 'Venue TBD'}</Typography></Box><Chip size="small" label={event.status} /></Stack>
                      </Box>
                    ))}
                    {upcoming.length === 0 ? <Typography color="text.secondary">No upcoming events.</Typography> : null}
                  </Stack>
                </Paper>
              </Grid>
              <Grid item xs={12} lg={5}>
                <Paper sx={{ p: 2.5, borderRadius: 4 }}>
                  <Typography variant="h6">Recent Registrations</Typography>
                  <Stack spacing={1.5} sx={{ mt: 2 }}>
                    {(registrationsQ.data?.results || []).map((reg) => (
                      <Box key={reg.id} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                        <Typography fontWeight={700}>{reg.attendee_name}</Typography>
                        <Typography variant="body2" color="text.secondary">{reg.event_title} • {reg.status}</Typography>
                      </Box>
                    ))}
                    {registrationsQ.isLoading ? <CircularProgress size={20} /> : null}
                    {(registrationsQ.data?.results || []).length === 0 && !registrationsQ.isLoading ? <Typography color="text.secondary">No registrations yet.</Typography> : null}
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          )}

          {tab === 'calendar' && (
            <Paper sx={{ p: 2.5, borderRadius: 4 }}>
              <Typography variant="h6">Calendar Overview</Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {events.slice(0, 12).map((event) => (
                  <Grid item xs={12} sm={6} md={4} key={event.id}>
                    <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                      <Typography fontWeight={700}>{format(parseISO(event.start_datetime), 'MMM d')}</Typography>
                      <Typography variant="body2" color="text.secondary">{event.title}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}
        </Stack>
      </Container>

      <EventForm
        open={formOpen}
        initialValue={selected}
        loading={saveMutation.isPending}
        onClose={() => { setFormOpen(false); setSelected(null); }}
        onSubmit={(payload) => saveMutation.mutate(payload)}
      />
    </Box>
  );
}
