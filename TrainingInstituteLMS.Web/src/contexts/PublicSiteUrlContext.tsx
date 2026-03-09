import { createContext, useContext, type ReactNode } from 'react';
import { ENROLLMENT_BASE_URL } from '../config/api.config';

interface PublicSiteUrlContextType {
  /** Manual enrollment base URL used everywhere for enrollment links. */
  publicSiteUrl: string;
  isLoading: boolean;
}

const PublicSiteUrlContext = createContext<PublicSiteUrlContextType | undefined>(undefined);

interface PublicSiteUrlProviderProps {
  children: ReactNode;
}

export function PublicSiteUrlProvider({ children }: PublicSiteUrlProviderProps) {
  // Manually use the fixed enrollment link everywhere (no API fetch).
  const publicSiteUrl = ENROLLMENT_BASE_URL;

  return (
    <PublicSiteUrlContext.Provider value={{ publicSiteUrl, isLoading: false }}>
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
