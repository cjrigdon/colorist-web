/** Calendar day (YYYY-MM-DD) in the user's timezone, not UTC. */
export const getLocalDateString = (date = new Date()) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '';
  }
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

const parseDateOnly = (dateValue) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dateValue || ''));
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
};

const parseTimestamp = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatLogDate = (dateValue) => {
  const date = parseDateOnly(dateValue);
  if (!date) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatLogTime = (value) => {
  const date = parseTimestamp(value);
  if (!date) return '';
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
};

export const formatProjectDateRange = (start, end) => {
  const startLabel = formatLogDate(start);
  const endLabel = formatLogDate(end);
  if (startLabel && endLabel && String(start).slice(0, 10) !== String(end).slice(0, 10)) {
    return `${startLabel} – ${endLabel}`;
  }
  return startLabel || endLabel || '';
};

/**
 * Calendar day for a session note in the user's timezone.
 * If the stored date matches the UTC day the note was saved, prefer the local day.
 */
export const getSessionNoteLocalDate = (note) => {
  const storedDate = String(note?.date || '').slice(0, 10);
  const created = parseTimestamp(note?.created_at);
  if (created) {
    const localDate = getLocalDateString(created);
    const utcDate = created.toISOString().slice(0, 10);
    if (!storedDate || storedDate === utcDate || storedDate === localDate) {
      return localDate;
    }
  }
  return storedDate;
};

export const getEntryNoteDates = (entry) => {
  const fromNotes = (entry?.session_notes || []).map((note) => getSessionNoteLocalDate(note));
  const dates = fromNotes.filter(Boolean).map((date) => String(date).slice(0, 10));
  if (dates.length > 0) {
    return [...new Set(dates)];
  }
  const fallback = (entry?.note_dates || []).filter(Boolean).map((date) => String(date).slice(0, 10));
  if (fallback.length > 0) {
    return [...new Set(fallback)];
  }
  return [entry?.date, entry?.end_date].filter(Boolean).map((date) => String(date).slice(0, 10));
};

export const getEntryLocalDateRange = (entry) => {
  const dates = getEntryNoteDates(entry).slice().sort();
  if (dates.length > 0) {
    return { start: dates[0], end: dates[dates.length - 1] };
  }
  return { start: entry?.date, end: entry?.end_date || entry?.date };
};

export const formatEntryProjectDates = (entry) => {
  const { start, end } = getEntryLocalDateRange(entry);
  return formatProjectDateRange(start, end);
};

/** Session date plus saved time, both in the user's timezone. */
export const formatSessionNoteStamp = (note) => {
  const created = parseTimestamp(note?.created_at);
  const dateLabel = formatLogDate(getSessionNoteLocalDate(note) || note?.date);
  const timeLabel = formatLogTime(created);
  if (dateLabel && timeLabel) {
    return `${dateLabel} · ${timeLabel}`;
  }
  if (timeLabel) {
    return created.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }
  return dateLabel;
};
