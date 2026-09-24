import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppBar, Box, Button, Container, IconButton, Toolbar, Typography } from '@mui/material';
import { CalendarDays, LayoutDashboard, ListChecks, Plus } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import EventsPage from './pages/EventsPage';
import EventFormPage from './pages/EventFormPage';
import EventDetailsPage from './pages/EventDetailsPage';
import CalendarPage from './pages/CalendarPage';
import LayoutShell from './components/LayoutShell';

const navItems = [
  { label: 'Dashboard', path: '/', icon: <LayoutDashboard size={18} /> },
  { label: 'Events', path: '/events', icon: <ListChecks size={18} /> },
  { label: 'Calendar', path: '/calendar', icon: <CalendarDays size={18} /> },
];

export default function App() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" elevation={0} color="transparent" sx={{ backdropFilter: 'blur(10px)', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Toolbar sx={{ gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, flexGrow: 1 }}>
            EventFlow
          </Typography>
          {navItems.map((item) => (
            <Button key={item.path} href={item.path} startIcon={item.icon} sx={{ color: 'text.primary' }}>
              {item.label}
            </Button>
          ))}
          <IconButton color="primary" href="/events/new" aria-label="Create event">
            <Plus />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <LayoutShell>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/new" element={<EventFormPage />} />
            <Route path="/events/:eventId" element={<EventDetailsPage />} />
            <Route path="/events/:eventId/edit" element={<EventFormPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </LayoutShell>
      </Container>
    </Box>
  );
}
