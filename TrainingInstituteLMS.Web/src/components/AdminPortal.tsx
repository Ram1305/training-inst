import { useState, useEffect } from 'react';
import {
  Users,
  Building2,
  DollarSign,
  LogOut,
  Menu,
  X,
  Home,
} from 'lucide-react';
import { Button } from './ui/button';
import type { User as UserType } from '../App';
import { AdminStudents } from './admin/AdminStudents';
import { AdminCompanies } from './admin/AdminCompanies';
import { AdminCompanyPayments } from './admin/AdminCompanyPayments';
import { adminPaymentService } from '../services/adminPayment.service';

interface AdminPortalProps {
  user: UserType;
  onLogout: () => void;
  onNavigateToLanding?: () => void;
}

type AdminPage = 'students' | 'companies' | 'company-payments';

const VALID_ADMIN_PAGES: AdminPage[] = ['students', 'companies', 'company-payments'];

function getInitialPageFromUrl(): AdminPage {
  if (typeof window === 'undefined') return 'students';
  const tab = new URLSearchParams(window.location.search).get('tab');
  if (tab && (VALID_ADMIN_PAGES as string[]).includes(tab)) return tab as AdminPage;
  return 'students';
}

export function AdminPortal({ user, onLogout, onNavigateToLanding }: AdminPortalProps) {
  const [currentPage, setCurrentPage] = useState<AdminPage>(getInitialPageFromUrl);
  const [navbarHidden, setNavbarHidden] = useState(false);
  const [companyPaymentCount, setCompanyPaymentCount] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadStats() {
      setStatsLoading(true);
      try {
        const statsRes = await adminPaymentService.getPaymentStats();
        if (!cancelled && statsRes.success && statsRes.data) {
          const count = statsRes.data.companyPaymentCount ?? 0;
          setCompanyPaymentCount(count);
        }
      } catch {
        try {
          const payRes = await adminPaymentService.getCompanyPayments({ pageSize: 50 });
          if (!cancelled && payRes.success && payRes.data) {
            const list = payRes.data.paymentProofs ?? [];
            const total = payRes.data.totalCount ?? list.length;
            setCompanyPaymentCount(Math.max(total, list.length));
          }
        } catch {
          if (!cancelled) setCompanyPaymentCount(0);
        }
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    }
    loadStats();
    return () => { cancelled = true; };
  }, []);

  const showCompanyPayment = !statsLoading && companyPaymentCount > 0;

  useEffect(() => {
    if (!statsLoading && !showCompanyPayment && currentPage === 'company-payments') {
      setCurrentPage('students');
    }
  }, [statsLoading, showCompanyPayment, currentPage]);

  const baseNavigation: { id: AdminPage; name: string; icon: typeof Users }[] = [
    { id: 'students', name: 'Students', icon: Users },
    { id: 'companies', name: 'Companies', icon: Building2 },
  ];

  const companyPaymentNav = showCompanyPayment
    ? [{ id: 'company-payments' as const, name: 'Company Payment', icon: DollarSign }]
    : [];

  const navigation = [...baseNavigation, ...companyPaymentNav];

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
    switch (currentPage) {
      case 'students':
        return <AdminStudents />;
      case 'companies':
        return <AdminCompanies />;
      case 'company-payments':
        return <AdminCompanyPayments />;
      default:
        return <AdminStudents />;
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
                onClick={() => setNavbarHidden(!navbarHidden)}
                className="gap-2"
                title={navbarHidden ? 'Show Navigation' : 'Hide Navigation'}
              >
                {navbarHidden ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                <span className="hidden sm:inline">
                  {navbarHidden ? 'Show Nav' : 'Hide Nav'}
                </span>
              </Button>
              <div className="tracking-tight">Admin Portal</div>
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
