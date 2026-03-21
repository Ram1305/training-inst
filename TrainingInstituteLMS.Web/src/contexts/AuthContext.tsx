import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authService, type AuthResponse } from '../services/auth.service';

// Export the AuthUser interface so it can be used in other files
export interface AuthUser {
  userId: string;
  fullName: string;
  email: string;
  userType: string;
  phoneNumber?: string;
  lastLoginAt?: string;
  isActive: boolean;
  studentId?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapAuthResponseToUser(data: AuthResponse): AuthUser {
  return {
    userId: String(data.userId),
    fullName: data.fullName,
    email: data.email,
    userType: data.userType,
    phoneNumber: data.phoneNumber,
    lastLoginAt: data.lastLoginAt,
    isActive: data.isActive,
    studentId: data.studentId != null && data.studentId !== '' ? String(data.studentId) : undefined,
  };
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function syncSession() {
      try {
        const res = await authService.getCurrentUser();
        if (cancelled) return;
        if (res.success && res.data) {
          const next = mapAuthResponseToUser(res.data);
          setUser(next);
          try {
            localStorage.setItem('user', JSON.stringify(next));
          } catch {
            // ignore quota / private mode
          }
        } else {
          setUser(null);
          localStorage.removeItem('user');
        }
      } catch (e) {
        if (cancelled) return;
        const status = (e as Error & { status?: number }).status;
        if (status === 401) {
          setUser(null);
          localStorage.removeItem('user');
        } else {
          const stored = localStorage.getItem('user');
          if (stored) {
            try {
              setUser(JSON.parse(stored) as AuthUser);
            } catch {
              localStorage.removeItem('user');
              setUser(null);
            }
          } else {
            setUser(null);
          }
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void syncSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSetUser = (userData: AuthUser | null) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    } else {
      localStorage.removeItem('user');
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser: handleSetUser,
        isAuthenticated: !!user,
        isLoading,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}