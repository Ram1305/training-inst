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

/** Sydney calendar YYYY-MM-DD for the current instant (same basis as API `AustraliaSydneyTime.TodayDate`). */
export function getTodayCalendarDateKeyInAustralia(): string {
  return getCalendarDateKeyInAustralia(new Date());
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

/** YYYY-MM-DD prefix from an ISO-like string without applying the viewer's local time zone. */
export function isoCalendarDateKey(iso: string): string | null {
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(iso?.trim() ?? '');
  return m ? m[1] : null;
}

/**
 * Short calendar label from a YYYY-MM-DD key (Sydney-oriented display, same style as AU_LOCALE_DATE_SHORT).
 */
export function formatAustraliaShortDateFromDateKey(dateKey: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return dateKey;
  const anchor = new Date(`${dateKey}T00:00:00.000Z`);
  return anchor.toLocaleDateString('en-AU', AU_LOCALE_DATE_SHORT);
}

/** Parse .NET System.Text.Json TimeSpan strings: "hh:mm:ss", "d.hh:mm:ss", optional fractional seconds. */
export function parseApiTimeSpanToHourMinute(ts: string | undefined | null): { hour: number; minute: number } | null {
  if (ts == null) return null;
  const s = String(ts).trim();
  if (!s) return null;

  const withDays = /^(\d+)\.(\d{1,2}):(\d{2}):(\d{2})(?:\.\d+)?$/.exec(s);
  if (withDays) {
    const days = parseInt(withDays[1], 10);
    const hh = parseInt(withDays[2], 10);
    const mm = parseInt(withDays[3], 10);
    if (Number.isNaN(days) || Number.isNaN(hh) || Number.isNaN(mm)) return null;
    return { hour: days * 24 + hh, minute: mm };
  }

  const plain = /^(\d{1,2}):(\d{2}):(\d{2})(?:\.\d+)?$/.exec(s);
  if (plain) {
    const hh = parseInt(plain[1], 10);
    const mm = parseInt(plain[2], 10);
    if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
    return { hour: hh, minute: mm };
  }

  return null;
}

/**
 * Format hour/minute as en-AU time using a fixed UTC anchor so the label does not depend on the browser zone.
 */
export function formatWallClockHourMinuteAu(hour: number, minute: number): string {
  const d = new Date(Date.UTC(2000, 0, 1, hour, minute, 0));
  return d.toLocaleTimeString('en-AU', { timeZone: 'UTC', hour: 'numeric', minute: '2-digit' });
}

export function formatApiTimeSpanAu(ts: string | undefined | null): string | null {
  const p = parseApiTimeSpanToHourMinute(ts);
  if (!p) return null;
  return formatWallClockHourMinuteAu(p.hour, p.minute);
}

function extractCivilClockFromIso(iso: string): { hour: number; minute: number } | null {
  const m = /T(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?/.exec(iso?.trim() ?? '');
  if (!m) return null;
  const hour = parseInt(m[1], 10);
  const minute = parseInt(m[2], 10);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  return { hour, minute };
}

/**
 * Public enrollment slot line: Sydney calendar date + wall-clock times from API (StartTime/EndTime) or civil time in ISO strings.
 * Avoids `new Date(isoWithoutZ)` which ECMAScript treats as the viewer's local time zone.
 */
export function formatEnrollmentSlotScheduleText(opts: {
  dateKey: string;
  startDateIso: string;
  endDateIso: string;
  startTime?: string | null;
  endTime?: string | null;
}): string {
  const d1 = isoCalendarDateKey(opts.startDateIso) || opts.dateKey;
  const d2 = isoCalendarDateKey(opts.endDateIso) || opts.dateKey;
  const ds1 = formatAustraliaShortDateFromDateKey(d1);
  const ds2 = formatAustraliaShortDateFromDateKey(d2);

  let t1 = formatApiTimeSpanAu(opts.startTime ?? null);
  let t2 = formatApiTimeSpanAu(opts.endTime ?? null);
  if (!t1) {
    const c = extractCivilClockFromIso(opts.startDateIso);
    if (c) t1 = formatWallClockHourMinuteAu(c.hour, c.minute);
  }
  if (!t2) {
    const c = extractCivilClockFromIso(opts.endDateIso);
    if (c) t2 = formatWallClockHourMinuteAu(c.hour, c.minute);
  }

  if (t1 && t2 && t1 !== t2) {
    if (d1 === d2) return `${ds1} ${t1} – ${t2}`;
    return `${ds1} ${t1} – ${ds2} ${t2}`;
  }
  if (t1) return `${ds1} ${t1}`;

  const a = new Date(opts.startDateIso);
  const b = new Date(opts.endDateIso);
  if (!Number.isNaN(a.getTime())) {
    const ta = a.toLocaleTimeString('en-AU', AU_LOCALE_TIME);
    if (!Number.isNaN(b.getTime()) && opts.startDateIso !== opts.endDateIso) {
      return `${a.toLocaleDateString('en-AU', AU_LOCALE_DATE_SHORT)} ${ta} – ${b.toLocaleDateString('en-AU', AU_LOCALE_DATE_SHORT)} ${b.toLocaleTimeString('en-AU', AU_LOCALE_TIME)}`;
    }
    return `${a.toLocaleDateString('en-AU', AU_LOCALE_DATE_SHORT)} ${ta}`;
  }
  return ds1;
}
