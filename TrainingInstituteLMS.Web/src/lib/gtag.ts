export type GtagEventParams = Record<string, unknown>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function createScriptTag(src: string): HTMLScriptElement {
  const script = document.createElement("script");
  script.async = true;
  script.src = src;
  return script;
}

function ensureDataLayerAndGtag(): void {
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = (...args: unknown[]) => {
      window.dataLayer!.push(args);
    };
  }
}

/**
 * Initialize Google tag (gtag.js) globally.
 *
 * Configure via Vite env:
 * - VITE_GTAG_ID: GA4 Measurement ID (G-XXXX) OR Ads ID (AW-XXXX)
 */
export function initGtag(): void {
  if (!isBrowser()) return;

  const id = (import.meta as any).env?.VITE_GTAG_ID as string | undefined;
  if (!id) return;

  // Avoid double-initializing
  if (document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${id}"]`)) {
    ensureDataLayerAndGtag();
    window.gtag?.("config", id);
    return;
  }

  const external = createScriptTag(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`);
  document.head.appendChild(external);

  ensureDataLayerAndGtag();
  window.gtag?.("js", new Date());
  window.gtag?.("config", id);
}

export function gtagEvent(eventName: string, params?: GtagEventParams): void {
  if (!isBrowser()) return;
  const fn = window.gtag;
  if (typeof fn !== "function") return;
  if (params) fn("event", eventName, params);
  else fn("event", eventName);
}

