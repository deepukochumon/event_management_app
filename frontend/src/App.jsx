import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import EventsPage from './pages/EventsPage';
import EventFormPage from './pages/EventFormPage';
import EventDetailsPage from './pages/EventDetailsPage';
import CalendarPage from './pages/CalendarPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/new" element={<EventFormPage mode="create" />} />
        <Route path="/events/:id" element={<EventDetailsPage />} />
        <Route path="/events/:id/edit" element={<EventFormPage mode="edit" />} />
        <Route path="/calendar" element={<CalendarPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
