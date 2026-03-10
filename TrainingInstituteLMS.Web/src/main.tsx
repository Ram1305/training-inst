import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import App from "./App.tsx";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import { PublicSiteUrlProvider } from "./contexts/PublicSiteUrlContext.tsx";
import "./index.css";
import "react-day-picker/dist/style.css";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <PublicSiteUrlProvider>
      <App />
      <Toaster position="top-center" richColors closeButton />
    </PublicSiteUrlProvider>
  </AuthProvider>
);