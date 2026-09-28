import React, { useMemo, useState } from 'react';
import { format, isSameDay, parseISO } from 'date-fns';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { ChevronLeft, ChevronRight, CalendarDays, ListChecks } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { formatDate } from '../utils/formatters';

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function startOfMonthGrid(date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return start;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function monthLabel(date) {
  return format(date, 'MMMM yyyy');
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['calendar-events', currentMonth.getFullYear(), currentMonth.getMonth()],
    queryFn: async () => {
      const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      const response = await api.get('/events/', {
        params: {
          start_date: format(start, 'yyyy-MM-dd'),
          end_date: format(end, 'yyyy-MM-dd'),
          page_size: 100,
        },
      });
      return response.data;
    },
  });

  const events = data?.results || data || [];
  const eventMap = useMemo(() => {
    const map = new Map();
    events.forEach((event) => {
      const key = event.date.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(event);
    });
    return map;
  }, [events]);

  const gridStart = startOfMonthGrid(currentMonth);
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3} gap={2} flexWrap="wrap">
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Calendar
          </Typography>
          <Typography color="text.secondary">
            View events by date and quickly jump between upcoming schedules.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Button variant="outlined" startIcon={<ChevronLeft size={16} />} onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>
            Prev
          </Button>
          <Typography variant="h6" fontWeight={700} minWidth={160} textAlign="center">
            {monthLabel(currentMonth)}
          </Typography>
          <Button variant="outlined" endIcon={<ChevronRight size={16} />} onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>
            Next
          </Button>
        </Stack>
      </Stack>

      {isError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error?.response?.data?.detail || 'Failed to load calendar events.'}
        </Alert>
      ) : null}

      <Grid container spacing={2}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ borderRadius: 4 }}>
            <CardContent>
              <Grid container spacing={1} sx={{ mb: 1 }}>
                {weekdays.map((day) => (
                  <Grid item xs={12 / 7} key={day}>
                    <Typography variant="subtitle2" align="center" color="text.secondary" fontWeight={700}>
                      {day}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
              {isLoading ? (
                <Box display="flex" justifyContent="center" py={8}>
                  <CircularProgress />
                </Box>
              ) : (
                <Grid container spacing={1}>
                  {days.map((day) => {
                    const key = format(day, 'yyyy-MM-dd');
                    const dayEvents = eventMap.get(key) || [];
                    const inMonth = day.getMonth() === currentMonth.getMonth();
                    return (
                      <Grid item xs={12 / 7} key={key}>
                        <Paper
                          variant="outlined"
                          sx={{
                            minHeight: 120,
                            p: 1,
                            borderRadius: 3,
                            bgcolor: inMonth ? 'background.paper' : 'action.hover',
                            opacity: inMonth ? 1 : 0.55,
                          }}
                        >
                          <Typography variant="caption" fontWeight={700} color={isSameDay(day, new Date()) ? 'primary.main' : 'text.secondary'}>
                            {day.getDate()}
                          </Typography>
                          <Stack spacing={0.75} mt={1}>
                            {dayEvents.slice(0, 3).map((event) => (
                              <Chip
                                key={event.id}
                                size="small"
                                label={event.title}
                                color="primary"
                                variant="outlined"
                                sx={{ justifyContent: 'flex-start', width: '100%' }}
                              />
                            ))}
                            {dayEvents.length > 3 ? (
                              <Typography variant="caption" color="text.secondary">
                                +{dayEvents.length - 3} more
                              </Typography>
                            ) : null}
                          </Stack>
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Stack spacing={2}>
            <Card sx={{ borderRadius: 4 }}>
              <CardContent>
                <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                  <CalendarDays size={18} />
                  <Typography variant="h6" fontWeight={700}>
                    Month overview
                  </Typography>
                </Stack>
                <Typography color="text.secondary" gutterBottom>
                  {events.length} event{events.length === 1 ? '' : 's'} scheduled in this month.
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip icon={<ListChecks size={14} />} label="Event dates synced" />
                  <Chip label="Responsive calendar" />
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 4 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Upcoming dates
                </Typography>
                <Stack spacing={1.25}>
                  {events.slice(0, 5).map((event) => (
                    <Box key={event.id} sx={{ p: 1.25, borderRadius: 2, bgcolor: 'action.hover' }}>
                      <Typography fontWeight={700}>{event.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(parseISO(event.date))} • {event.venue_name || event.venue?.name || 'Venue TBD'}
                      </Typography>
                    </Box>
                  ))}
                  {!events.length ? <Typography color="text.secondary">No events found for this month.</Typography> : null}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
