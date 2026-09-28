import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const eventApi = {
  list: (params) => api.get('/events/', { params }),
  get: (id) => api.get(`/events/${id}/`),
  create: (payload) => api.post('/events/', payload),
  update: (id, payload) => api.put(`/events/${id}/`, payload),
  remove: (id) => api.delete(`/events/${id}/`),
};

export const dashboardApi = {
  stats: () => api.get('/dashboard/stats/'),
};

export const venueApi = {
  list: (params) => api.get('/venues/', { params }),
};

export const attendeeApi = {
  list: (params) => api.get('/attendees/', { params }),
  create: (payload) => api.post('/attendees/', payload),
};

export const registrationApi = {
  list: (params) => api.get('/registrations/', { params }),
  create: (payload) => api.post('/registrations/', payload),
  update: (id, payload) => api.put(`/registrations/${id}/`, payload),
  remove: (id) => api.delete(`/registrations/${id}/`),
};
