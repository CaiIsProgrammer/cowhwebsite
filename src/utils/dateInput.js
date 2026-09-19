// Normalizes a stored Date/Time value back into the format <input type="date">
// / <input type="time"> expect. New rows are stored as plain "YYYY-MM-DD" /
// "HH:MM" text (see Code.gs TEXT_COLUMNS), but rows created before that fix
// may still come back as full ISO timestamps — handle both.
export function toDateInputValue(value) {
  if (!value) return '';
  return value.slice(0, 10);
}

export function toTimeInputValue(value) {
  if (!value) return '';
  return value.includes('T') ? value.slice(11, 16) : value.slice(0, 5);
}
