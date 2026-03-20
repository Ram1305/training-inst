import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import App from "./App.tsx";
import { GTAG_MEASUREMENT_ID } from "./config/analytics.config";
import { API_CONFIG } from "./config/api.config";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import { PublicSiteUrlProvider } from "./contexts/PublicSiteUrlContext.tsx";
import { initGtag } from "./lib/gtag";
import "./index.css";
import "react-day-picker/dist/style.css";

type GtagConfigApi = { success?: boolean; data?: { gtagMeasurementId?: string | null } };

async function resolveGtagMeasurementId(): Promise<string | undefined> {
  const fromFrontendConfig = GTAG_MEASUREMENT_ID?.trim();
  if (fromFrontendConfig) return fromFrontendConfig;

  const fromEnv = import.meta.env.VITE_GTAG_ID?.trim();
  if (fromEnv) return fromEnv;

  try {
    const url = `${API_CONFIG.BASE_URL}/PublicEnrollment/gtag-config`;
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) return undefined;
    const json = (await res.json()) as GtagConfigApi;
    const id = json.data?.gtagMeasurementId?.trim();
    return id || undefined;
  } catch {
    return undefined;
  }
}

void resolveGtagMeasurementId().then((id) => {
  initGtag(id);
  createRoot(document.getElementById("root")!).render(
    <AuthProvider>
      <PublicSiteUrlProvider>
        <App />
        <Toaster position="top-right" richColors closeButton />
      </PublicSiteUrlProvider>
    </AuthProvider>
  );
});