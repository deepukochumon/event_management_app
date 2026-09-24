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
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { addDays, format, isAfter, isBefore, startOfDay } from 'date-fns';
import {
  BarChart3,
  CalendarDays,
  CalendarPlus,
  CalendarRange,
  Clock3,
  Edit,
  LayoutDashboard,
  MapPin,
  Menu,
  RefreshCcw,
  Search,
  Trash2,
  Users,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const api = axios.create({ baseURL: API_BASE, withCredentials: false });

const STAT_COLORS = ['#2f6fed', '#10b981', '#f59e0b', '#7c3aed'];
const emptyEvent = {
  title: '',
  description: '',
  date: '',
  time: '',
  venue: '',
  capacity: 100,
  status: 'scheduled',
};

async function fetcher(url) {
  const { data } = await api.get(url);
  return data;
}

function useDashboard(filters) {
  return useQuery({
    queryKey: ['dashboard', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.status !== 'all') params.set('status', filters.status);
      if (filters.sort) params.set('ordering', filters.sort);
      if (filters.from) params.set('date_after', filters.from);
      if (filters.to) params.set('date_before', filters.to);
      const [events, stats, venues] = await Promise.all([
        fetcher(`/events/?${params.toString()}`),
        fetcher('/dashboard/'),
        fetcher('/venues/'),
      ]);
      return { events, stats, venues };
    },
  });
}

function StatCard({ title, value, helper, icon, color }) {
  return (
    <Card sx={{ height: '100%', border: `1px solid ${alpha(color, 0.16)}` }}>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="body2" color="text.secondary">{title}</Typography>
            <Typography variant="h4" sx={{ mt: 0.5 }}>{value}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{helper}</Typography>
          </Box>
          <Box sx={{ width: 48, height: 48, borderRadius: 3, display: 'grid', placeItems: 'center', bgcolor: alpha(color, 0.12), color }}>
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function EventDialog({ open, onClose, onSave, initial, venues, saving }) {
  const [form, setForm] = useState(initial || emptyEvent);
  React.useEffect(() => setForm(initial || emptyEvent), [initial, open]);
  const update = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = () => {
    onSave({
      ...form,
      capacity: Number(form.capacity || 0),
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{initial?.id ? 'Edit event' : 'Create event'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Title" value={form.title} onChange={update('title')} fullWidth required />
          <TextField label="Description" value={form.description} onChange={update('description')} multiline minRows={3} fullWidth />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="Date" type="date" value={form.date} onChange={update('date')} fullWidth InputLabelProps={{ shrink: true }} />
            <TextField label="Time" type="time" value={form.time} onChange={update('time')} fullWidth InputLabelProps={{ shrink: true }} />
          </Stack>
          <TextField select label="Venue" value={form.venue} onChange={update('venue')} fullWidth>
            <MenuItem value="">Select venue</MenuItem>
            {venues.map((v) => <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>)}
          </TextField>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="Capacity" type="number" value={form.capacity} onChange={update('capacity')} fullWidth />
            <TextField select label="Status" value={form.status} onChange={update('status')} fullWidth>
              <MenuItem value="scheduled">Scheduled</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </TextField>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={saving || !form.title || !form.date}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}

function AppShell({ children, onRefresh, title = 'Event Management' }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(false);
  const drawer = (
    <Box sx={{ p: 2, width: 280 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h6">EventFlow</Typography>
          <Typography variant="body2" color="text.secondary">Plan, track and grow events</Typography>
        </Box>
        <Divider />
        <List>
          {[
            ['Dashboard', LayoutDashboard], ['Events', CalendarDays], ['Calendar', CalendarRange], ['Registrations', Users],
          ].map(([label, Icon]) => (
            <ListItemButton key={label} selected={label === 'Dashboard'} sx={{ borderRadius: 2 }}>
              <ListItemIcon sx={{ minWidth: 36 }}><Icon size={18} /></ListItemIcon>
              <ListItemText primary={label} />
            </ListItemButton>
          ))}
        </List>
        <Button startIcon={<RefreshCcw size={16} />} onClick={onRefresh} variant="outlined">Refresh</Button>
      </Stack>
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" elevation={0} color="transparent" sx={{ backdropFilter: 'blur(8px)', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Toolbar>
          {isMobile && <IconButton onClick={() => setOpen(true)}><Menu /></IconButton>}
          <Typography variant="h6" sx={{ flexGrow: 1 }}>{title}</Typography>
          <Button variant="contained" startIcon={<CalendarPlus size={16} />}>New Event</Button>
        </Toolbar>
      </AppBar>
      <Drawer open={open} onClose={() => setOpen(false)} variant={isMobile ? 'temporary' : 'permanent'} sx={{ '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 280 } }}>
        {drawer}
      </Drawer>
      <Box sx={{ ml: { md: '280px' }, p: 3 }}>{children}</Box>
    </Box>
  );
}

export default function App() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ search: '', status: 'all', sort: '-date', from: '', to: '' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const { data, isLoading, error } = useDashboard(filters);

  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/events/', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => api.put(`/events/${id}/`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/events/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
  });

  const events = data?.events?.results || [];
  const stats = data?.stats || {};
  const venues = data?.venues?.results || data?.venues || [];
  const upcoming = useMemo(() => events.filter((e) => isAfter(new Date(`${e.date}T00:00:00`), startOfDay(new Date()))), [events]);

  const save = async (payload) => {
    const body = { ...payload, venue: payload.venue || null };
    if (editing?.id) await updateMutation.mutateAsync({ id: editing.id, payload: body });
    else await createMutation.mutateAsync(body);
    setDialogOpen(false);
    setEditing(null);
  };

  return (
    <AppShell onRefresh={() => queryClient.invalidateQueries({ queryKey: ['dashboard'] })}>
      <Container maxWidth="xl" disableGutters>
        <Stack spacing={3}>
          <Paper sx={{ p: 2, borderRadius: 4 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
              <TextField
                placeholder="Search events"
                value={filters.search}
                onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
                InputProps={{ startAdornment: <Search size={16} style={{ marginRight: 8, opacity: 0.7 }} /> }}
                fullWidth
              />
              <TextField select value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))} sx={{ minWidth: 160 }}>
                <MenuItem value="all">All statuses</MenuItem>
                <MenuItem value="scheduled">Scheduled</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </TextField>
              <TextField select value={filters.sort} onChange={(e) => setFilters((p) => ({ ...p, sort: e.target.value }))} sx={{ minWidth: 180 }}>
                <MenuItem value="-date">Newest</MenuItem>
                <MenuItem value="date">Oldest</MenuItem>
                <MenuItem value="title">Title A-Z</MenuItem>
                <MenuItem value="-registration_count">Most registrations</MenuItem>
              </TextField>
              <Button variant="contained" startIcon={<CalendarPlus size={16} />} onClick={() => { setEditing(null); setDialogOpen(true); }}>Create Event</Button>
            </Stack>
          </Paper>

          {isLoading ? <Box sx={{ py: 10, display: 'grid', placeItems: 'center' }}><CircularProgress /></Box> : error ? <Alert severity="error">Unable to load dashboard. Please check the API server.</Alert> : null}

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(4,1fr)' } }}>
            <StatCard title="Upcoming Events" value={stats.upcoming_events ?? upcoming.length} helper="Next 30 days" icon={<CalendarDays size={22} />} color={STAT_COLORS[0]} />
            <StatCard title="Registrations" value={stats.total_registrations ?? 0} helper="All active registrations" icon={<Users size={22} />} color={STAT_COLORS[1]} />
            <StatCard title="Venues" value={stats.total_venues ?? venues.length} helper="Managed locations" icon={<MapPin size={22} />} color={STAT_COLORS[2]} />
            <StatCard title="Revenue" value={`$${Number(stats.revenue || 0).toLocaleString()}`} helper="Estimated ticket sales" icon={<BarChart3 size={22} />} color={STAT_COLORS[3]} />
          </Box>

          <Paper sx={{ p: 2.5, borderRadius: 4 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Box>
                <Typography variant="h6">Upcoming & managed events</Typography>
                <Typography variant="body2" color="text.secondary">Search, filter, sort, and maintain events from one place.</Typography>
              </Box>
              <Chip label={`${events.length} results`} color="primary" variant="outlined" />
            </Stack>
            <Stack spacing={2}>
              {events.length === 0 ? (
                <Alert severity="info">No events found for the current filters.</Alert>
              ) : events.map((event) => (
                <Card key={event.id} variant="outlined">
                  <CardContent>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between">
                      <Box sx={{ flex: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <Typography variant="h6">{event.title}</Typography>
                          <Chip size="small" label={event.status} />
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{event.description || 'No description provided.'}</Typography>
                        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                          <Chip icon={<CalendarRange size={14} />} label={format(new Date(event.date), 'MMM d, yyyy')} />
                          <Chip icon={<Clock3 size={14} />} label={event.time || 'Time TBD'} />
                          <Chip icon={<MapPin size={14} />} label={event.venue_name || 'Venue TBD'} />
                          <Chip icon={<Users size={14} />} label={`${event.registration_count || 0} registrations`} />
                        </Stack>
                      </Box>
                      <Stack direction="row" spacing={1} alignSelf={{ md: 'flex-start' }}>
                        <Tooltip title="Edit"><IconButton onClick={() => { setEditing(event); setDialogOpen(true); }}><Edit size={18} /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton color="error" onClick={() => deleteMutation.mutate(event.id)}><Trash2 size={18} /></IconButton></Tooltip>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Paper>
        </Stack>
      </Container>
      <EventDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSave={save} initial={editing} venues={venues} saving={createMutation.isPending || updateMutation.isPending} />
    </AppShell>
  );
}
