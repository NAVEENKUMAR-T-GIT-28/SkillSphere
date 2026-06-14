/**
 * Date formatting utilities with consistent locale (en-IN for Indian academic context).
 * Always import these instead of calling new Date().toLocaleDateString() directly.
 */

const LOCALE = 'en-IN';

/** e.g. "15 Jan 2025" */
export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(LOCALE, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/** e.g. "15 Jan 2025, 10:30 AM" */
export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString(LOCALE, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/** Returns positive days remaining, or null if expired/no date. */
export const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : null;
};

/** Returns true if the date is in the past. */
export const isExpired = (dateStr) => {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
};