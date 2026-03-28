/**
 * Validates an email address broadly, accepting:
 *  - Standard addresses (gmail.com, outlook.com, yahoo.com)
 *  - iCloud / Apple    (.icloud.com, .me.com)
 *  - Australian TLDs   (.com.au, .edu.au, .net.au, .org.au, .gov.au)
 *  - Chinese providers (qq.com, 163.com, 126.com, sina.com, foxmail.com)
 *  - Any other provider using multi-level or country-code TLDs
 *
 * Rules enforced:
 *  - Must have a local part (before @)
 *  - Must have exactly one @
 *  - TLD must be letters ONLY (a-z), 2–24 characters — rejects .coo, .con, .ocm etc.
 *  - No spaces allowed anywhere
 *  - Common TLD typos are explicitly blocked (.coo, .con, .ocm, .comm, etc.)
 */

/** Known TLD typos / nonsense endings that must be rejected. */
const BLOCKED_TLDS = new Set([
  'coo', 'con', 'ocm', 'comm', 'corm', 'cpm', 'oom', 'coml', 'comn',
  'cmo', 'coim', 'comau', 'couk', 'col', 'cop', 'cot', 'xom', 'vom',
  'dom', 'fom', 'gom', 'hom', 'jom', 'kom', 'lom', 'mom', 'nom',
  'pom', 'rom', 'som', 'tom', 'uom', 'wom', 'yom', 'zom',
  'nte', 'nte', 'ner', 'ney', 'nett',
  'ogr', 'orgg', 'rog',
]);

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim().toLowerCase();

  // Must not have spaces
  if (/\s/.test(trimmed)) return false;

  // Must have exactly one @
  const atIndex = trimmed.indexOf('@');
  if (atIndex < 1 || trimmed.indexOf('@', atIndex + 1) !== -1) return false;

  const local = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1);

  // Local part: non-empty, no consecutive dots, no leading/trailing dot
  if (!local || local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false;

  // Domain: must have at least one dot
  if (!domain.includes('.')) return false;

  const labels = domain.split('.');

  // Every label must be non-empty
  if (labels.some(l => !l)) return false;

  // TLD = last label: letters only, 2–24 chars
  const tld = labels[labels.length - 1];
  if (!/^[a-z]{2,24}$/.test(tld)) return false;

  // Reject known typo TLDs
  if (BLOCKED_TLDS.has(tld)) return false;

  // Second-to-last label (e.g. "com" in "com.au"): letters or digits, at least 1 char
  const sld = labels[labels.length - 2];
  if (!/^[a-z0-9-]{1,63}$/.test(sld)) return false;

  return true;
}

/**
 * Returns an error message if invalid, or empty string if valid.
 */
export function emailValidationError(email: string): string {
  if (!email || !email.trim()) return 'Email is required';
  if (!isValidEmail(email)) return 'Please enter a valid email address';
  return '';
}
