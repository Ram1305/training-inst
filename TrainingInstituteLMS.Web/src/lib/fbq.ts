export type FbqCompleteRegistrationParams = {
  currency: string;
  value: number;
};

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

export function trackCompleteRegistration(params: FbqCompleteRegistrationParams = { currency: "AUD", value: 0 }): void {
  if (!isBrowser()) return;
  const fbq = window.fbq;
  if (typeof fbq !== "function") return;
  fbq("track", "CompleteRegistration", params);
}

