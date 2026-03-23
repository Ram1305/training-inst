import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  DollarSign,
  LogOut,
  Menu,
  X,
  Home,
} from 'lucide-react';
import { Button } from './ui/button';
import type { User as UserType } from '../App';
import { CompanyDashboard } from './company/CompanyDashboard';
import { CompanyCourses } from './company/CompanyCourses';
import { CompanyPayments } from './company/CompanyPayments';
import { CompanyStudentsEnrolled } from './company/CompanyStudentsEnrolled';
import { companyManagementService } from '../services/companyManagement.service';
import type { CompanyResponse } from '../services/companyManagement.service';

interface CompanyPortalProps {
  user: UserType;
  onLogout: () => void;
  onNavigateToLanding?: () => void;
}

type CompanyPage = 'dashboard' | 'courses' | 'payments' | 'students-enrolled';

const VALID_COMPANY_PAGES: CompanyPage[] = ['dashboard', 'courses', 'payments', 'students-enrolled'];

function getInitialTabFromUrl(): CompanyPage {
  if (typeof window === 'undefined') return 'dashboard';
  const tab = new URLSearchParams(window.location.search).get('tab');
  if (tab && (VALID_COMPANY_PAGES as string[]).includes(tab)) return tab as CompanyPage;
  return 'dashboard';
}

export function CompanyPortal({ user, onLogout, onNavigateToLanding }: CompanyPortalProps) {
  const [currentPage, setCurrentPage] = useState<CompanyPage>(getInitialTabFromUrl);
  const [navbarHidden, setNavbarHidden] = useState(false);
  const [company, setCompany] = useState<CompanyResponse | null>(null);
  const [companyLoading, setCompanyLoading] = useState(true);

  const navigation = [
    { id: 'dashboard' as const, name: 'Dashboard', icon: LayoutDashboard },
    { id: 'courses' as const, name: 'Courses', icon: BookOpen },
    { id: 'payments' as const, name: 'Payments', icon: DollarSign },
    { id: 'students-enrolled' as const, name: 'Student Enrolled', icon: Users },
  ];

  useEffect(() => {
    let cancelled = false;
    async function fetchCompany() {
      setCompanyLoading(true);
      try {
        const response = await companyManagementService.getCompanyByUserId(user.id);
        if (!cancelled && response.success && response.data) {
          setCompany(response.data);
        }
      } catch {
        if (!cancelled) setCompany(null);
      } finally {
        if (!cancelled) setCompanyLoading(false);
      }
    }
    fetchCompany();
    return () => { cancelled = true; };
  }, [user.id]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('tab', currentPage);
    const next = `${window.location.pathname}?${params.toString()}`;
    const current = window.location.pathname + (window.location.search || '');
    if (current !== next) {
      window.history.replaceState(null, '', next);
    }
  }, [currentPage]);

  const renderPage = () => {
    if (companyLoading) {
      return (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto" />
            <p className="mt-4 text-gray-600">Loading company dashboard...</p>
          </div>
        </div>
      );
    }

    switch (currentPage) {
      case 'dashboard':
        return <CompanyDashboard company={company} userName={user.name} />;
      case 'courses':
        return <CompanyCourses />;
      case 'payments':
        return (
          <CompanyPayments
            companyId={company?.companyId}
            company={company}
            onCompanyUpdated={(c) => setCompany(c)}
          />
        );
      case 'students-enrolled':
        return (
          <CompanyStudentsEnrolled
            companyId={company?.companyId}
            company={company}
            onCompanyUpdated={(c) => setCompany(c)}
          />
        );
      default:
        return <CompanyDashboard company={company} userName={user.name} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-fuchsia-50">
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-violet-100">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newState = !navbarHidden;
                  setNavbarHidden(newState);
                }}
                className="gap-2"
                title={navbarHidden ? 'Show Navigation' : 'Hide Navigation'}
              >
                {navbarHidden ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                <span className="hidden sm:inline">
                  {navbarHidden ? 'Show Nav' : 'Hide Nav'}
                </span>
              </Button>
              <div className="tracking-tight">Company Portal</div>
              {onNavigateToLanding && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onNavigateToLanding}
                  className="gap-2 ml-4"
                >
                  <Home className="w-4 h-4" />
                  <span>Go to Home Page</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
        <aside
          className={`
          fixed lg:sticky top-16 left-0 z-30 h-[calc(100vh-4rem)]
          w-64 bg-white border-r border-violet-100 overflow-y-auto
          transform transition-transform duration-300 ease-in-out
          flex-shrink-0
          ${navbarHidden ? '-translate-x-full' : 'translate-x-0'}
        `}
        >
          <div className="p-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    currentPage === item.id
                      ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-violet-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </button>
              );
            })}

            <div className="pt-4 mt-4 border-t border-violet-100">
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
