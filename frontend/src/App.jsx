import React, { useMemo, useState } from 'react';
import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Toolbar,
  Typography,
  Alert,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import { Add, CalendarMonth, Edit, Delete, Search, FilterList, Event, People, TrendingUp, Place } from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { format, isAfter, isBefore, parseISO } from 'date-fns';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const api = axios.create({ baseURL: API_BASE });

const emptyForm = {
  title: '',
  description: '',
  venue: '',
  start_date: '',
  end_date: '',
  capacity: 100,
  status: 'published',
};

function StatCard({ title, value, icon, subtitle, color = 'primary.main' }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ width: 48, height: 48, borderRadius: 3, bgcolor: `${color}15`, display: 'grid', placeItems: 'center', color }}>
            {icon}
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">{title}</Typography>
            <Typography variant="h5">{value}</Typography>
            {subtitle ? <Typography variant="caption" color="text.secondary">{subtitle}</Typography> : null}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

async function getDashboard() {
  const { data } = await api.get('/dashboard/');
  return data;
}

async function getEvents(params) {
  const { data } = await api.get('/events/', { params });
  return data;
}

function EventFormDialog({ open, onClose, initialValue, onSubmit, loading }) {
  const [form, setForm] = useState(initialValue || emptyForm);
  React.useEffect(() => setForm(initialValue || emptyForm), [initialValue, open]);

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{initialValue?.id ? 'Edit Event' : 'Create Event'}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} md={6}><TextField fullWidth label="Title" value={form.title} onChange={handleChange('title')} /></Grid>
          <Grid item xs={12} md={6}><TextField fullWidth label="Venue" value={form.venue} onChange={handleChange('venue')} /></Grid>
          <Grid item xs={12}><TextField fullWidth multiline minRows={3} label="Description" value={form.description} onChange={handleChange('description')} /></Grid>
          <Grid item xs={12} md={4}><TextField fullWidth type="datetime-local" label="Start" InputLabelProps={{ shrink: true }} value={form.start_date} onChange={handleChange('start_date')} /></Grid>
          <Grid item xs={12} md={4}><TextField fullWidth type="datetime-local" label="End" InputLabelProps={{ shrink: true }} value={form.end_date} onChange={handleChange('end_date')} /></Grid>
          <Grid item xs={12} md={2}><TextField fullWidth type="number" label="Capacity" value={form.capacity} onChange={handleChange('capacity')} /></Grid>
          <Grid item xs={12} md={2}>
            <TextField select fullWidth label="Status" value={form.status} onChange={handleChange('status')}>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="published">Published</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => onSubmit(form)} disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function App() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('-start_date');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const dashboard = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard });
  const events = useQuery({
    queryKey: ['events', { search, status, sort, dateFrom, dateTo }],
    queryFn: () => getEvents({ search, status, ordering: sort, date_from: dateFrom, date_to: dateTo, page_size: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/events/', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => api.put(`/events/${id}/`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/events/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  });

  const rows = events.data?.results || events.data || [];

  const upcoming = useMemo(() => rows.filter((e) => e.status !== 'cancelled' && isAfter(parseISO(e.start_date), new Date())), [rows]);
  const calendarItems = useMemo(() => rows.slice().sort((a, b) => a.start_date.localeCompare(b.start_date)), [rows]);
  const chartData = useMemo(() => {
    const byStatus = rows.reduce((acc, e) => { acc[e.status] = (acc[e.status] || 0) + 1; return acc; }, {});
    return Object.entries(byStatus).map(([name, value]) => ({ name, value }));
  }, [rows]);

  const handleSave = async (payload) => {
    const body = {
      ...payload,
      capacity: Number(payload.capacity || 0),
    };
    if (editing?.id) await updateMutation.mutateAsync({ id: editing.id, payload: body });
    else await createMutation.mutateAsync(body);
    setDialogOpen(false);
    setEditing(null);
  };

  return (
    <Box>
      <AppBar position="sticky" elevation={0} color="inherit">
        <Toolbar sx={{ gap: 2 }}>
          <CalendarMonth color="primary" />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6">EventFlow</Typography>
            <Typography variant="caption" color="text.secondary">Event management dashboard</Typography>
          </Box>
          <Button variant="contained" startIcon={<Add />} onClick={() => { setEditing(null); setDialogOpen(true); }}>Create Event</Button>
        </Toolbar>
      </AppBar>
      <Container sx={{ py: 4 }}>
        {(dashboard.isLoading || events.isLoading) && <LinearProgress sx={{ mb: 2 }} />}
        {(dashboard.isError || events.isError) && <Alert severity="error" sx={{ mb: 2 }}>Failed to load data from the API.</Alert>}

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={3}><StatCard title="Upcoming Events" value={dashboard.data?.upcoming_events ?? upcoming.length} icon={<Event />} subtitle="Scheduled ahead" /></Grid>
          <Grid item xs={12} md={3}><StatCard title="Registrations" value={dashboard.data?.registrations_total ?? 0} icon={<People />} subtitle="All-time signups" color="success.main" /></Grid>
          <Grid item xs={12} md={3}><StatCard title="Venues" value={dashboard.data?.venues_total ?? 0} icon={<Place />} subtitle="Active locations" color="secondary.main" /></Grid>
          <Grid item xs={12} md={3}><StatCard title="Growth" value={`${dashboard.data?.registration_growth ?? 0}%`} icon={<TrendingUp />} subtitle="Compared to last month" color="warning.main" /></Grid>
        </Grid>

        <Paper sx={{ p: 2, mb: 3 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            <TextField fullWidth placeholder="Search events" value={search} onChange={(e) => setSearch(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} />
            <TextField select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 160 }}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="published">Published</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </TextField>
            <TextField select label="Sort" value={sort} onChange={(e) => setSort(e.target.value)} sx={{ minWidth: 180 }}>
              <MenuItem value="-start_date">Newest first</MenuItem>
              <MenuItem value="start_date">Oldest first</MenuItem>
              <MenuItem value="title">Title A-Z</MenuItem>
            </TextField>
            <TextField type="date" label="From" InputLabelProps={{ shrink: true }} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <TextField type="date" label="To" InputLabelProps={{ shrink: true }} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </Stack>
        </Paper>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="Events" />
          <Tab label="Calendar" />
          <Tab label="Analytics" />
        </Tabs>

        {tab === 0 && (
          <Paper>
            {events.isLoading ? <Box p={2}><Skeleton height={60} /><Skeleton height={60} /><Skeleton height={60} /></Box> : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Event</TableCell><TableCell>Venue</TableCell><TableCell>Start</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.length === 0 ? <TableRow><TableCell colSpan={5}><Box py={4} textAlign="center"><Typography color="text.secondary">No events found.</Typography></Box></TableCell></TableRow> : rows.map((event) => (
                    <TableRow key={event.id} hover>
                      <TableCell>
                        <Typography fontWeight={700}>{event.title}</Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>{event.description}</Typography>
                      </TableCell>
                      <TableCell>{event.venue_name || event.venue}</TableCell>
                      <TableCell>{format(parseISO(event.start_date), 'PP p')}</TableCell>
                      <TableCell><Chip size="small" label={event.status} color={event.status === 'published' ? 'success' : event.status === 'draft' ? 'default' : 'error'} /></TableCell>
                      <TableCell align="right">
                        <IconButton onClick={() => { setEditing(event); setDialogOpen(true); }}><Edit /></IconButton>
                        <IconButton onClick={() => deleteMutation.mutate(event.id)}><Delete /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>
        )}

        {tab === 1 && (
          <Grid container spacing={2}>
            {calendarItems.map((event) => (
              <Grid key={event.id} item xs={12} md={6} lg={4}>
                <Card>
                  <CardContent>
                    <Stack spacing={1}>
                      <Chip size="small" label={event.status} sx={{ alignSelf: 'flex-start' }} />
                      <Typography variant="h6">{event.title}</Typography>
                      <Typography color="text.secondary">{event.venue_name || event.venue}</Typography>
                      <Typography variant="body2">{format(parseISO(event.start_date), 'PPP p')}</Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {tab === 2 && (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: 380 }}><CardContent sx={{ height: '100%' }}><Typography variant="h6" gutterBottom>Status Distribution</Typography><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={110} label>{chartData.map((entry, index) => <Cell key={entry.name} fill={["#2563eb", "#059669", "#dc2626", "#f59e0b"][index % 4]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></CardContent></Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: 380 }}><CardContent sx={{ height: '100%' }}><Typography variant="h6" gutterBottom>Events by Day</Typography><ResponsiveContainer width="100%" height="100%"><BarChart data={rows.map((e) => ({ name: format(parseISO(e.start_date), 'MMM d'), value: 1 }))}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#2563eb" /></BarChart></ResponsiveContainer></CardContent></Card>
            </Grid>
          </Grid>
        )}
      </Container>
      <EventFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} initialValue={editing} onSubmit={handleSave} loading={createMutation.isPending || updateMutation.isPending} />
    </Box>
  );
}
