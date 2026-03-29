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
 *  - Domain must have at least one dot and a TLD of 2+ characters
 *  - No spaces allowed anywhere
 *  - Local part can contain letters, digits and: . _ + - '
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();

  // Reject if there are spaces
  if (/\s/.test(trimmed)) return false;

  // RFC-5321 inspired but intentionally permissive for international domains:
  // local part: printable, no @ or space
  // domain: labels separated by dots, last label ≥ 2 chars
  const emailRegex =
    /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[^\s@.]{2,}$/;

  return emailRegex.test(trimmed);
}

/**
 * Returns an error message if invalid, or empty string if valid.
 */
export function emailValidationError(email: string): string {
  if (!email || !email.trim()) return 'Email is required';
  if (!isValidEmail(email)) return 'Please enter a valid email address';
  return '';
}
