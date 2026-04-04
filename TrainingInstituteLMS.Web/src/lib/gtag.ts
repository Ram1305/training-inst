export type GtagEventParams = Record<string, unknown>;

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

/**
 * Push a custom event to `dataLayer` for Google Tag Manager (GA4 / Ads tags configured in GTM).
 */
export function gtagEvent(eventName: string, params?: GtagEventParams): void {
  if (!isBrowser()) return;
  window.dataLayer = window.dataLayer || [];
  const payload: Record<string, unknown> = { event: eventName };
  if (params && Object.keys(params).length > 0) {
    Object.assign(payload, params);
  }
  window.dataLayer.push(payload);
}
