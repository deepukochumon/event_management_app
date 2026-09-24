import React from 'react';
import { eachDayOfInterval, endOfMonth, format, getDay, isSameMonth, startOfMonth, startOfWeek, addDays } from 'date-fns';

export default function CalendarPage({ events, loading, error }) {
  if (loading) return <div className="loading">Loading calendar…</div>;
  if (error) return <div className="error">{error}</div>;

  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: startDate, end: addDays(startOfWeek(monthEnd, { weekStartsOn: 0 }), 41) });

  return (
    <div className="content">
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="section-head">
          <div>
            <h3>Calendar view</h3>
            <p>Monthly event overview with day-by-day scheduling.</p>
          </div>
          <span className="badge info">{format(today, 'MMMM yyyy')}</span>
        </div>
        <div className="calendar">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => <div key={d} className="badge" style={{ justifyContent: 'center' }}>{d}</div>)}
          {days.map((day) => {
            const dayEvents = events.filter((e) => e.date === format(day, 'yyyy-MM-dd'));
            return (
              <div key={day.toISOString()} className={`day ${!isSameMonth(day, today) ? 'muted' : ''}`}>
                <strong>{format(day, 'd')}</strong>
                {dayEvents.map((event) => <span key={event.id} className="event-chip">{event.title}</span>)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}