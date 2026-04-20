import { format, parseISO } from 'date-fns';

export const formatCurrency = (amount, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

export const formatDate = (date, fmt = 'MMM d, yyyy') => {
  if (!date) return '-';
  try { return format(typeof date === 'string' ? parseISO(date) : date, fmt); }
  catch { return '-'; }
};

export const formatShortDate = (date) => formatDate(date, 'MMM d');

export const TYPE_COLORS = {
  business: '#3b82f6',
  personal: '#10b981',
  mixed: '#f59e0b',
};

export const TYPE_LABELS = {
  business: 'Business',
  personal: 'Personal',
  mixed: 'Mixed',
};

export const CHART_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#a78bfa',
];

export const cn = (...classes) => classes.filter(Boolean).join(' ');
