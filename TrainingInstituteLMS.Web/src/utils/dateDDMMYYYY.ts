export type DDMMYYYYValidationResult =
  | { valid: true }
  | { valid: false; reason: 'format' | 'invalid_date' | 'year_range' };

export function sanitizeDateInput(value: string): string {
  const digitsOnly = value.replace(/\D/g, '').slice(0, 8);

  if (digitsOnly.length <= 2) return digitsOnly;
  if (digitsOnly.length <= 4) return `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2)}`;

  return `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2, 4)}/${digitsOnly.slice(4)}`;
}

export function isValidDDMMYYYY(
  value: string,
  minYear: number,
  maxYear: number
): DDMMYYYYValidationResult {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return { valid: false, reason: 'format' };

  const [ddStr, mmStr, yyyyStr] = value.split('/');
  const dd = Number(ddStr);
  const mm = Number(mmStr);
  const yyyy = Number(yyyyStr);

  if (!Number.isInteger(dd) || !Number.isInteger(mm) || !Number.isInteger(yyyy)) {
    return { valid: false, reason: 'format' };
  }

  if (yyyy < minYear || yyyy > maxYear) return { valid: false, reason: 'year_range' };
  if (mm < 1 || mm > 12) return { valid: false, reason: 'invalid_date' };
  if (dd < 1 || dd > 31) return { valid: false, reason: 'invalid_date' };

  // Validate actual calendar date by round-tripping.
  // Note: months are 0-based in JS Date.
  const d = new Date(yyyy, mm - 1, dd);
  if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd) {
    return { valid: false, reason: 'invalid_date' };
  }

  return { valid: true };
}

export function toISODate(value: string): string | null {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return null;
  const [dd, mm, yyyy] = value.split('/');
  return `${yyyy}-${mm}-${dd}`;
}

