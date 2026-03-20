/**
 * Frontend GA4 / gtag measurement ID (G-XXXX).
 *
 * Resolution order in `main.tsx`: this value → `VITE_GTAG_ID` → GET `/PublicEnrollment/gtag-config`.
 * Leave empty to use env or API instead.
 */
export const GTAG_MEASUREMENT_ID = "";
