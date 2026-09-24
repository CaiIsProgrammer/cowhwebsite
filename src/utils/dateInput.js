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

// The viewer's own IANA timezone, e.g. "America/New_York".
export function getBrowserTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

// How far `timeZone` is ahead of UTC, in minutes, at the moment `date`
// represents. Used to convert a wall-clock time that was entered *in that
// zone* into the correct UTC instant, since JS has no built-in way to parse
// "2026-09-18 19:00 America/New_York" directly.
function getTimeZoneOffsetMinutes(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
    .formatToParts(date)
    .reduce((acc, p) => {
      acc[p.type] = p.value;
      return acc;
    }, {});
  const asIfUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  return (asIfUtc - date.getTime()) / 60000;
}

// Converts a class's stored "2026-09-18" + "19:00" wall-clock time, entered
// in `timeZone`, into the real instant it represents (a JS Date). Returns
// null if the date/time are missing or unparseable — callers should treat
// that as "unknown," not "now."
export function zonedDateTimeToInstant(dateStr, timeStr, timeZone) {
  if (!dateStr || !timeStr) return null;
  const naiveUtc = new Date(`${dateStr}T${timeStr}:00Z`);
  if (Number.isNaN(naiveUtc.getTime())) return null;
  if (!timeZone) return naiveUtc; // no zone recorded — best effort, treat as UTC
  // One correction pass is enough outside the rare case of a class scheduled
  // in the minute a DST transition happens.
  const offsetMinutes = getTimeZoneOffsetMinutes(naiveUtc, timeZone);
  return new Date(naiveUtc.getTime() - offsetMinutes * 60000);
}

// Formats a class's date/time in the *viewer's* local timezone (browser
// default), for display. Returns null if the source values are missing.
export function formatInViewerTimeZone(dateStr, timeStr, timeZone) {
  const instant = zonedDateTimeToInstant(dateStr, timeStr, timeZone);
  if (!instant) return null;
  return instant.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
