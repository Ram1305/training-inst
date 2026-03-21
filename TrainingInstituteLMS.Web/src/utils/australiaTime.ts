/** IANA zone for NSW public enrollment (Sydney / AEDT–AEST). */
export const AUSTRALIA_ENROLLMENT_TZ = 'Australia/Sydney';

/**
 * Calendar YYYY-MM-DD for an instant, interpreted in Australia/Sydney.
 * Uses en-CA parts so the result is a stable sortable key.
 */
export function getCalendarDateKeyInAustralia(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(d.getTime())) return '';
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: AUSTRALIA_ENROLLMENT_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = fmt.formatToParts(d);
  const y = parts.find((p) => p.type === 'year')?.value;
  const m = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  if (!y || !m || !day) return '';
  return `${y}-${m}-${day}`;
}

/**
 * Heading for a Sydney civil date key (weekday + day month year).
 * `dateKey` must be YYYY-MM-DD as produced by getCalendarDateKeyInAustralia.
 */
export function formatAustraliaCivilDateHeading(dateKey: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return dateKey;
  const anchor = new Date(`${dateKey}T00:00:00.000Z`);
  return anchor.toLocaleDateString('en-AU', {
    timeZone: AUSTRALIA_ENROLLMENT_TZ,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export const AU_LOCALE_DATE_SHORT: Intl.DateTimeFormatOptions = {
  timeZone: AUSTRALIA_ENROLLMENT_TZ,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
};

export const AU_LOCALE_TIME: Intl.DateTimeFormatOptions = {
  timeZone: AUSTRALIA_ENROLLMENT_TZ,
  hour: 'numeric',
  minute: '2-digit',
};
