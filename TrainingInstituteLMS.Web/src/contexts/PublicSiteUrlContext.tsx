import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { publicEnrollmentWizardService } from '../services/publicEnrollmentWizard.service';
import { API_CONFIG } from '../config/api.config';

interface PublicSiteUrlContextType {
  /** Canonical enrollment base URL from API (SiteSettings). Fallback until loaded. */
  publicSiteUrl: string;
  isLoading: boolean;
}

const PublicSiteUrlContext = createContext<PublicSiteUrlContextType | undefined>(undefined);

const FALLBACK_URL = (import.meta.env.VITE_PUBLIC_SITE_URL as string)?.trim() || API_CONFIG.PUBLIC_SITE_URL;

interface PublicSiteUrlProviderProps {
  children: ReactNode;
}

export function PublicSiteUrlProvider({ children }: PublicSiteUrlProviderProps) {
  const [publicSiteUrl, setPublicSiteUrl] = useState<string>(FALLBACK_URL);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    publicEnrollmentWizardService
      .getEnrollmentBaseUrl()
      .then((res) => {
        if (cancelled || !res?.data?.enrollmentBaseUrl) return;
        const url = (res.data.enrollmentBaseUrl || '').trim().replace(/\/+$/, '') || FALLBACK_URL;
        setPublicSiteUrl(url);
      })
      .catch(() => {
        // Keep fallback on error
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PublicSiteUrlContext.Provider value={{ publicSiteUrl, isLoading }}>
      {children}
    </PublicSiteUrlContext.Provider>
  );
}

export function usePublicSiteUrl() {
  const context = useContext(PublicSiteUrlContext);
  if (context === undefined) {
    throw new Error('usePublicSiteUrl must be used within a PublicSiteUrlProvider');
  }
  return context;
}
