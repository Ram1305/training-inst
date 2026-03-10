import { useState, useEffect } from 'react';
import {
  Users,
  Building2,
  DollarSign,
  LogOut,
  Menu,
  X,
  Home,
  LayoutDashboard,
  BookOpen,
  Calendar,
  FileQuestion,
  FileEdit,
  Link2,
  FileCheck,
  Award,
  CreditCard,
  BarChart3,
  Star,
  Image,
} from 'lucide-react';
import { Button } from './ui/button';
import type { User as UserType } from '../App';
import { AdminDashboard } from './admin/AdminDashboard';
import { AdminCourses } from './admin/AdminCourses';
import { AdminStudents } from './admin/AdminStudents';
import { AdminCompanies } from './admin/AdminCompanies';
import { AdminScheduling } from './admin/AdminScheduling';
import { AdminQuizResults } from './admin/AdminQuizResults';
import { AdminStudentEnrollments } from './admin/AdminStudentEnrollments';
import { AdminEnrollmentLinks } from './admin/AdminEnrollmentLinks';
import { AdminExams } from './admin/AdminExams';
import { AdminCertificates } from './admin/AdminCertificates';
import { AdminPayments } from './admin/AdminPayments';
import { AdminCompanyPayments } from './admin/AdminCompanyPayments';
import { AdminReports } from './admin/AdminReports';
import { AdminReviews } from './admin/AdminReviews';
import { AdminGallery } from './admin/AdminGallery';
import { AdminBookingDetails } from './admin/AdminBookingDetails';
import { adminCompanyOrdersService } from '../services/adminCompanyOrders.service';

interface AdminPortalProps {
  user: UserType;
  onLogout: () => void;
  onNavigateToLanding?: () => void;
}

type AdminPage =
  | 'dashboard'
  | 'courses'
  | 'students'
  | 'companies'
  | 'schedule'
  | 'lln-assessment'
  | 'enrollment-form'
  | 'enrollment-links'
  | 'exam'
  | 'certificates'
  | 'payments'
  | 'company-payments'
  | 'reports'
  | 'google-reviews'
  | 'gallery'
  | 'booking-details';

const VALID_ADMIN_PAGES: AdminPage[] = [
  'dashboard',
  'courses',
  'students',
  'companies',
  'schedule',
  'lln-assessment',
  'enrollment-form',
  'enrollment-links',
  'exam',
  'certificates',
  'payments',
  'company-payments',
  'reports',
  'google-reviews',
  'gallery',
  'booking-details',
];

function getInitialPageFromUrl(): AdminPage {
  if (typeof window === 'undefined') return 'dashboard';
  const tab = new URLSearchParams(window.location.search).get('tab');
  if (tab && (VALID_ADMIN_PAGES as string[]).includes(tab)) return tab as AdminPage;
  return 'dashboard';
}

function getInitialBookingDetailsDate(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  if (params.get('tab') !== 'booking-details') return null;
  return params.get('date');
}

export function AdminPortal({ user, onLogout, onNavigateToLanding }: AdminPortalProps) {
  const [currentPage, setCurrentPage] = useState<AdminPage>(getInitialPageFromUrl);
  const [bookingDetailsDate, setBookingDetailsDate] = useState<string | null>(getInitialBookingDetailsDate);
  const [navbarHidden, setNavbarHidden] = useState(false);
  const [companyPaymentCount, setCompanyPaymentCount] = useState(0);
  const [pendingEnrollmentFormEmail, setPendingEnrollmentFormEmail] = useState<string | null>(null);
  const [pendingLlnEmail, setPendingLlnEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadStats() {
      try {
        const countRes = await adminCompanyOrdersService.getCompanyOrderCount();
        if (!cancelled && countRes.success && countRes.data?.companyOrderCount != null) {
          setCompanyPaymentCount(countRes.data.companyOrderCount);
        }
      } catch {
        // Ignore - Company Payment nav is always shown
      }
    }
    loadStats();
    return () => { cancelled = true; };
  }, []);

  // Company Payment nav is always visible so admins can access it (including when companies register via enrollment)

  const handleDashboardNavigate = (page: string, extra?: string) => {
    if (page === 'booking-details' && extra) {
      setBookingDetailsDate(extra);
      setCurrentPage('booking-details');
    } else if (page === 'enrollment-form' && extra) {
      setPendingEnrollmentFormEmail(extra);
      setCurrentPage('enrollment-form');
    } else if (page === 'lln-assessment' && extra) {
      setPendingLlnEmail(extra);
      setCurrentPage('lln-assessment');
    } else if (page === 'students') {
      setCurrentPage('students');
    } else if (page === 'courses') {
      setCurrentPage('courses');
    } else if (page === 'reports') {
      setCurrentPage('reports');
    } else if ((VALID_ADMIN_PAGES as string[]).includes(page)) {
      setCurrentPage(page as AdminPage);
    }
  };

  const baseNavigation: { id: AdminPage; name: string; icon: typeof Users }[] = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'courses', name: 'Courses', icon: BookOpen },
    { id: 'students', name: 'Students', icon: Users },
    { id: 'companies', name: 'Companies', icon: Building2 },
    { id: 'schedule', name: 'Schedule', icon: Calendar },
    { id: 'lln-assessment', name: 'LLN Assessment', icon: FileQuestion },
    { id: 'enrollment-form', name: 'Enrollment Form', icon: FileEdit },
    { id: 'enrollment-links', name: 'Enrollment Links', icon: Link2 },
    { id: 'exam', name: 'Exam', icon: FileCheck },
    { id: 'certificates', name: 'Certificates', icon: Award },
    { id: 'payments', name: 'Payments', icon: CreditCard },
    { id: 'reports', name: 'Reports', icon: BarChart3 },
    { id: 'google-reviews', name: 'Google Reviews', icon: Star },
    { id: 'gallery', name: 'Gallery', icon: Image },
  ];

  const companyPaymentNav = [{ id: 'company-payments' as const, name: 'Company Payment', icon: DollarSign }];

  const navigation = [
    ...baseNavigation.slice(0, baseNavigation.findIndex((n) => n.id === 'reports')),
    ...companyPaymentNav,
    ...baseNavigation.slice(baseNavigation.findIndex((n) => n.id === 'reports')),
  ];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('tab', currentPage);
    if (currentPage === 'booking-details' && bookingDetailsDate) {
      params.set('date', bookingDetailsDate);
    } else {
      params.delete('date');
    }
    const next = `${window.location.pathname}?${params.toString()}`;
    const current = window.location.pathname + (window.location.search || '');
    if (current !== next) {
      window.history.replaceState(null, '', next);
    }
  }, [currentPage, bookingDetailsDate]);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <AdminDashboard
            onNavigate={handleDashboardNavigate}
            onNavigateToLanding={onNavigateToLanding}
          />
        );
      case 'courses':
        return <AdminCourses />;
      case 'students':
        return <AdminStudents onNavigate={handleDashboardNavigate} />;
      case 'companies':
        return <AdminCompanies />;
      case 'schedule':
        return <AdminScheduling />;
      case 'lln-assessment':
        return (
          <AdminQuizResults
            initialEmailToView={pendingLlnEmail ?? undefined}
            onClearInitialView={() => setPendingLlnEmail(null)}
          />
        );
      case 'enrollment-form':
        return (
          <AdminStudentEnrollments
            initialEmailToView={pendingEnrollmentFormEmail ?? undefined}
            onClearInitialView={() => setPendingEnrollmentFormEmail(null)}
          />
        );
      case 'enrollment-links':
        return <AdminEnrollmentLinks />;
      case 'exam':
        return <AdminExams />;
      case 'certificates':
        return <AdminCertificates />;
      case 'payments':
        return <AdminPayments />;
      case 'company-payments':
        return <AdminCompanyPayments />;
      case 'reports':
        return <AdminReports />;
      case 'google-reviews':
        return <AdminReviews />;
      case 'gallery':
        return <AdminGallery />;
      case 'booking-details':
        return bookingDetailsDate ? (
          <AdminBookingDetails
            selectedDate={bookingDetailsDate}
            onBack={() => {
              setBookingDetailsDate(null);
              setCurrentPage('dashboard');
            }}
          />
        ) : (
          <AdminDashboard
            onNavigate={handleDashboardNavigate}
            onNavigateToLanding={onNavigateToLanding}
          />
        );
      default:
        return (
          <AdminDashboard
            onNavigate={handleDashboardNavigate}
            onNavigateToLanding={onNavigateToLanding}
          />
        );
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
              const isActive =
                currentPage === item.id ||
                (item.id === 'dashboard' && currentPage === 'booking-details');
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (currentPage === 'booking-details') setBookingDetailsDate(null);
                    setCurrentPage(item.id);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
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
