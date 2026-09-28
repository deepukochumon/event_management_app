import { format, parseISO } from 'date-fns';

export function formatDate(value) {
  if (!value) return '—';
  const date = typeof value === 'string' ? parseISO(value) : value;
  return format(date, 'MMM dd, yyyy');
}

export function formatDateTime(value) {
  if (!value) return '—';
  const date = typeof value === 'string' ? parseISO(value) : value;
  return format(date, 'MMM dd, yyyy h:mm a');
}

export function formatCurrency(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '0';
  return new Intl.NumberFormat('en-US').format(Number(value));
}

export function truncate(text, length = 80) {
  if (!text) return '';
  return text.length > length ? `${text.slice(0, length).trim()}…` : text;
}
