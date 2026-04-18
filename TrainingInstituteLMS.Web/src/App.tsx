import { useState, useEffect, useRef, lazy, Suspense } from 'react';
const LandingPage = lazy(() => import('./components/LandingPage').then(m => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('./components/LoginPage').then(m => ({ default: m.LoginPage })));
const StudentPortal = lazy(() => import('./components/StudentPortal').then(m => ({ default: m.StudentPortal })));
const TeacherPortal = lazy(() => import('./components/TeacherPortal').then(m => ({ default: m.TeacherPortal })));
const AdminPortal = lazy(() => import('./components/AdminPortal').then(m => ({ default: m.AdminPortal })));
const SuperAdminPortal = lazy(() => import('./components/SuperAdminPortal').then(m => ({ default: m.SuperAdminPortal })));
const CompanyPortal = lazy(() => import('./components/CompanyPortal').then(m => ({ default: m.CompanyPortal })));
const CourseDetailsPage = lazy(() => import('./components/CourseDetails').then(m => ({ default: m.CourseDetailsPage })));
const HandbookViewerPage = lazy(() => import('./components/HandbookViewerPage').then(m => ({ default: m.HandbookViewerPage })));
const CourseBooking = lazy(() => import('./components/CourseBooking').then(m => ({ default: m.CourseBooking })));
const AboutUsPage = lazy(() => import('./components/AboutUsPage').then(m => ({ default: m.AboutUsPage })));
const ContactPage = lazy(() => import('./components/ContactPage').then(m => ({ default: m.ContactPage })));
const BookNowPage = lazy(() => import('./components/BookNowPage').then(m => ({ default: m.BookNowPage })));
const FormsPage = lazy(() => import('./components/FormsPage').then(m => ({ default: m.FormsPage })));
const FeesRefundPage = lazy(() => import('./components/FeesRefundPage').then(m => ({ default: m.FeesRefundPage })));
const GalleryPage = lazy(() => import('./components/GalleryPage').then(m => ({ default: m.GalleryPage })));
const PublicQuiz = lazy(() => import('./components/student/PublicQuiz').then(m => ({ default: m.PublicQuiz })));
const PublicEnrollmentForm = lazy(() => import('./components/student/PublicEnrollmentForm').then(m => ({ default: m.PublicEnrollmentWizard })));
const PublicEnrollmentWizard = lazy(() => import('./components/student/PublicEnrollmentWizard').then(m => ({ default: m.PublicEnrollmentWizard })));
const PublicVOCForm = lazy(() => import('./components/student/PublicVOCForm').then(m => ({ default: m.PublicVOCForm })));
import { useAuth } from './contexts/AuthContext';
import type { AuthUser } from './contexts/AuthContext';
import { authService } from './services/auth.service';
import { publicEnrollmentWizardService } from './services/publicEnrollmentWizard.service';
import { toast } from 'sonner';

export type UserRole = 'student' | 'teacher' | 'admin' | 'superadmin' | 'company' | null;

// Legacy User interface for portal components
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  studentId?: string;
}

// Helper function to map AuthUser to legacy User format
const mapAuthUserToUser = (authUser: AuthUser): User => {
  const userTypeLower = authUser.userType?.toLowerCase() || '';
  
  let role: UserRole = 'student';
  
  if (userTypeLower === 'superadmin' || userTypeLower === 'super_admin' || userTypeLower === 'super admin') {
    role = 'superadmin';
  } else if (userTypeLower === 'admin') {
    role = 'admin';
  } else if (userTypeLower === 'teacher') {
    role = 'teacher';
  } else if (userTypeLower === 'student') {
    role = 'student';
  } else if (userTypeLower === 'company') {
    role = 'company';
  }

  console.log('Auth User Type:', authUser.userType, '-> Mapped Role:', role);

  return {
    id: authUser.userId,
    name: authUser.fullName,
    email: authUser.email,
    role: role,
    studentId: authUser.studentId,
  };
};

// URL path constants for shareable links
const PATHS = {
  landing: '/',
  about: '/about',
  contact: '/contact',
  bookNow: '/book-now',
  enroll: '/enroll',
  register: '/register',
  forms: '/forms',
  feesRefund: '/fees-refund',
  gallery: '/gallery',
  quiz: '/quiz',
  login: '/login',
  course: (id: string, slug?: string) => slug ? `/course/${id}/${slug}` : `/course/${id}`,
  enrollWithCode: (code: string) => `/enroll/${code}`,
  voc: '/voc',
} as const;

// Create URL-safe slug from course name (e.g. "White Card Training" -> "white-card-training")
const courseNameToSlug = (name: string): string =>
  name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'course';

// Map pathname to page (for parsing URLs)
type PublicPage = 'landing' | 'about' | 'contact' | 'bookNow' | 'publicEnrollmentWizard' | 'publicEnrollment' | 'forms' | 'feesRefund' | 'gallery' | 'publicQuiz' | 'login' | 'publicVOCForm';
const PATHNAME_TO_PAGE: Record<string, PublicPage> = {
  '/': 'landing',
  '/home': 'landing',
  '/about': 'about',
  '/contact': 'contact',
  '/book-now': 'bookNow',
  '/enroll': 'publicEnrollmentWizard',
  '/register': 'publicEnrollment',
  '/forms': 'forms',
  '/fees-refund': 'feesRefund',
  '/gallery': 'gallery',
  '/quiz': 'publicQuiz',
  '/login': 'login',
  '/voc': 'publicVOCForm',
};

// Helper function to parse URL path
const parseUrlPath = (): { path: string; page?: PublicPage; enrollCode?: string; courseId?: string } => {
  const pathname = window.location.pathname;
  
  // Check for /enroll/:code pattern (enrollment link - must be before /enroll)
  const enrollCodeMatch = pathname.match(/^\/enroll\/([a-zA-Z0-9]+)$/);
  if (enrollCodeMatch) {
    return { path: 'enroll', enrollCode: enrollCodeMatch[1] };
  }
  
  // Check for /course/:id or /course/:id/:slug pattern (slug = course name for readable URLs)
  const courseMatch = pathname.match(/^\/course\/([a-zA-Z0-9\-]+)(?:\/([a-zA-Z0-9\-]+))?$/);
  if (courseMatch) {
    return { path: 'course', courseId: courseMatch[1] };
  }
  
  // Check known pathnames
  const page = PATHNAME_TO_PAGE[pathname];
  if (page) {
    return { path: page, page };
  }
  
  return { path: 'landing', page: 'landing' };
};

// Helper to update URL when navigating (use replace: true to replace history entry)
const updateUrl = (path: string, replace = false) => {
  if (window.location.pathname !== path) {
    if (replace) {
      window.history.replaceState({}, '', path);
    } else {
      window.history.pushState({}, '', path);
    }
  }
};

export default function App() {
  const { user: authUser, setUser, isLoading, logout, isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState<'landing' | 'login' | 'portal' | 'courseDetails' | 'handbookViewer' | 'courseBooking' | 'about' | 'contact' | 'bookNow' | 'publicQuiz' | 'publicEnrollment' | 'publicEnrollmentWizard' | 'forms' | 'feesRefund' | 'gallery' | 'publicVOCForm'>('landing');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [handbookViewerState, setHandbookViewerState] = useState<{ pdfUrl: string; title?: string; courseName?: string } | null>(null);
  const [selectedCourseData, setSelectedCourseData] = useState<{
    courseName?: string;
    courseCode?: string;
    coursePrice?: number;
    experienceType?: 'with' | 'without';
  }>({});
  
  // Enrollment link data from URL
  const [enrollmentLinkData, setEnrollmentLinkData] = useState<{
    courseId?: string;
    courseDateId?: string;
    linkId?: string;
    isOneTimeLink?: boolean;
    allowPayLater?: boolean;
    isCompanyPortalLink?: boolean;
    companyName?: string;
    isAgentLink?: boolean;
  } | null>(null);
  const [enrollCode, setEnrollCode] = useState<string | null>(null);
  const [isLoadingEnrollmentLink, setIsLoadingEnrollmentLink] = useState(false);
  const [selectedCourseDateId, setSelectedCourseDateId] = useState<string | null>(null);

  // When true, authenticated user explicitly chose "Go to Landing Page" — don't redirect back to portal
  const allowLandingViewRef = useRef(false);

  const user: User | null = authUser ? mapAuthUserToUser(authUser) : null;

  // Check URL path on mount for enrollment links and shareable URLs
  useEffect(() => {
    const checkUrlPath = async () => {
      const { path, page, enrollCode, courseId } = parseUrlPath();
      
      if (path === 'enroll' && enrollCode) {
        setIsLoadingEnrollmentLink(true);
        try {
          // Fetch enrollment link data from API
          const response = await publicEnrollmentWizardService.getWizardDataByCode(enrollCode);
          if (response.success && response.data) {
            setEnrollCode(enrollCode);
            setEnrollmentLinkData({
              courseId: response.data.courseId,
              courseDateId: response.data.courseDateId,
              linkId: response.data.linkId,
              isOneTimeLink: response.data.isOneTimeLink,
              allowPayLater: response.data.allowPayLater,
              isCompanyPortalLink: response.data.isCompanyPortalLink,
              companyName: response.data.companyName,
              isAgentLink: response.data.isAgentLink,
            });
            setCurrentPage('publicEnrollmentWizard');
            // Update URL to clean state (optional)
            window.history.replaceState({}, '', '/');
          } else {
            toast.error('Invalid or expired enrollment link');
            setCurrentPage('landing');
            window.history.replaceState({}, '', '/');
          }
        } catch (error) {
          console.error('Error fetching enrollment link:', error);
          toast.error('Failed to load enrollment link. Please try again.');
          setCurrentPage('landing');
          window.history.replaceState({}, '', '/');
        } finally {
          setIsLoadingEnrollmentLink(false);
        }
      } else if (path === 'course' && courseId) {
        setSelectedCourseId(courseId);
        setCurrentPage('courseDetails');
      } else if (page) {
        // Direct link to any public page
        setCurrentPage(page);
        if (page === 'landing') {
          setSelectedCourseId(null);
        }
      }
    };
    
    if (!isLoading) {
      checkUrlPath();
    }
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading && !isLoadingEnrollmentLink) {
      // Redirect authenticated users to portal when on landing/login, unless they explicitly chose to view landing
      if (isAuthenticated && (currentPage === 'login' || currentPage === 'landing') && !allowLandingViewRef.current) {
        setCurrentPage('portal');
      }
    }
  }, [isAuthenticated, isLoading, currentPage, isLoadingEnrollmentLink]);

  // Handle browser back/forward - sync state with URL
  useEffect(() => {
    const handlePopState = () => {
      const { path, page, courseId } = parseUrlPath();
      if (path === 'course' && courseId) {
        setSelectedCourseId(courseId);
        setCurrentPage('courseDetails');
      } else if (page) {
        setCurrentPage(page);
        if (page === 'landing') {
          setSelectedCourseId(null);
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleLogin = (userData: User) => {
    const authUser: AuthUser = {
      userId: userData.id,
      fullName: userData.name,
      email: userData.email,
      userType: userData.role ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1) : 'Student',
      isActive: true,
      studentId: userData.studentId,
    };
    setUser(authUser);
    setCurrentPage('portal');
  };

  const handleLogout = async () => {
    await logout();
    allowLandingViewRef.current = false;
    setCurrentPage('landing');
    setSelectedCourseId(null);
    updateUrl(PATHS.landing, true);
  };

  const handleGoToLogin = () => {
    allowLandingViewRef.current = false;
    setCurrentPage('login');
    updateUrl(PATHS.login);
  };

  const handleBackToLanding = () => {
    allowLandingViewRef.current = true;
    setCurrentPage('landing');
    setSelectedCourseId(null);
    setEnrollmentLinkData(null);
    setEnrollCode(null);
    updateUrl(PATHS.landing, true);
  };

  const handleViewCourses = () => {
    setCurrentPage('landing');
    setSelectedCourseId(null);
    updateUrl(PATHS.landing);
    const scrollToCourses = () => {
      document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    // Mobile: wait for layout after state update so scroll target isn't wrong or "stuck"
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToCourses();
        setTimeout(scrollToCourses, 280);
      });
    });
  };

  const handleViewComboCourses = () => {
    setCurrentPage('landing');
    setSelectedCourseId(null);
    updateUrl(PATHS.landing);
    const scrollToCombo = () => {
      document.getElementById('combo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    // Mobile: wait for layout after state update so scroll target isn't wrong or "stuck"
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToCombo();
        setTimeout(scrollToCombo, 280);
      });
    });
  };

  const handleGoToAbout = () => {
    setCurrentPage('about');
    updateUrl(PATHS.about);
  };

  const handleGoToContact = () => {
    setCurrentPage('contact');
    updateUrl(PATHS.contact);
  };

  const handleGoToBookNow = () => {
    setSelectedCourseId(null);
    setEnrollmentLinkData(null);
    setEnrollCode(null);
    setCurrentPage('publicEnrollmentWizard');
    updateUrl(PATHS.enroll);
  };

  const handleGoToPublicQuiz = () => {
    setCurrentPage('publicQuiz');
    updateUrl(PATHS.quiz);
  };

  const handleGoToPublicEnrollment = () => {
    setCurrentPage('publicEnrollment');
    updateUrl(PATHS.register);
  };

  const handleGoToPublicEnrollmentWizard = () => {
    setEnrollmentLinkData(null);
    setEnrollCode(null);
    setCurrentPage('publicEnrollmentWizard');
    updateUrl(PATHS.enroll);
  };

  const handleGoToForms = () => {
    setCurrentPage('forms');
    updateUrl(PATHS.forms);
  };

  const handleGoToVOCForm = () => {
    setCurrentPage('publicVOCForm');
    updateUrl(PATHS.voc);
  };

  const handleGoToFeesRefund = () => {
    setCurrentPage('feesRefund');
    updateUrl(PATHS.feesRefund);
  };

  const handleGoToGallery = () => {
    setCurrentPage('gallery');
    updateUrl(PATHS.gallery);
  };

  const handlePublicQuizComplete = (result: { userId: string; studentId: string; email: string; fullName: string; isPassed: boolean }) => {
    const authUser: AuthUser = {
      userId: result.userId,
      fullName: result.fullName,
      email: result.email,
      userType: 'Student',
      isActive: true,
      studentId: result.studentId,
    };
    
    setUser(authUser);
    setCurrentPage('portal');
  };

  const handlePublicEnrollmentComplete = (result: { userId: string; studentId: string; email: string; fullName: string }) => {
    const authUser: AuthUser = {
      userId: result.userId,
      fullName: result.fullName,
      email: result.email,
      userType: 'Student',
      isActive: true,
      studentId: result.studentId,
    };
    
    setUser(authUser);
    setCurrentPage('portal');
  };

  const handlePublicEnrollmentWizardComplete = async (result: { userId: string; studentId: string; email: string; fullName: string }) => {
    // Perform auto-login for individuals (using default password '123456' which is currently used in the wizard for individual registrations)
    try {
      const loginResponse = await authService.login({
        email: result.email,
        password: '123456'
      });
      
      if (loginResponse.success && loginResponse.data) {
        const authUser: AuthUser = {
          userId: loginResponse.data.userId,
          fullName: loginResponse.data.fullName,
          email: loginResponse.data.email,
          userType: loginResponse.data.userType,
          phoneNumber: loginResponse.data.phoneNumber,
          isActive: true,
          studentId: loginResponse.data.studentId,
        };
        
        setUser(authUser);
        setEnrollmentLinkData(null);
        setCurrentPage('portal');
        updateUrl(PATHS.enroll, true);
        return;
      }
    } catch (loginError) {
      console.error('Wizard auto-login failed:', loginError);
      // Fallback to manual session setting
    }

    const authUser: AuthUser = {
      userId: result.userId,
      fullName: result.fullName,
      email: result.email,
      userType: 'Student',
      isActive: true,
      studentId: result.studentId,
    };
    
    setUser(authUser);
    setEnrollmentLinkData(null);
    setCurrentPage('portal');
    updateUrl(PATHS.enroll, true);
  };

  const handleCourseDetails = (courseId: string) => {
    setSelectedCourseId(courseId);
    setCurrentPage('courseDetails');
    updateUrl(PATHS.course(courseId));
  };

  const handleViewHandbook = (url: string, title?: string, courseName?: string) => {
    setHandbookViewerState({ pdfUrl: url, title, courseName });
    setCurrentPage('handbookViewer');
  };

  const handleBackFromHandbookViewer = () => {
    setHandbookViewerState(null);
    setCurrentPage('courseDetails');
    if (selectedCourseId) {
      updateUrl(PATHS.course(selectedCourseId));
    }
  };

  const handleCourseBooking = (courseData?: { courseId?: string; courseName?: string; courseCode?: string; coursePrice?: number; experienceType?: 'with' | 'without' }) => {
    if (courseData) {
      if (courseData.courseId) {
        setSelectedCourseId(courseData.courseId);
      }
      setSelectedCourseData(courseData);
    }
    setEnrollmentLinkData(null);
    setCurrentPage('publicEnrollmentWizard');
    updateUrl(PATHS.enroll);
  };

  const handleBookCourse = (courseId: string, courseCode: string, courseName: string, price: number, experienceType?: 'with' | 'without') => {
    setSelectedCourseId(courseId);
    setSelectedCourseData({
      courseName,
      courseCode,
      coursePrice: price,
      experienceType
    });
    setEnrollmentLinkData(null);
    setEnrollCode(null);
    setCurrentPage('publicEnrollmentWizard');
    updateUrl(PATHS.enroll);
  };

  const handleNavigateToEnrollFromPortal = (courseData?: {
    courseId: string;
    courseDateId?: string;
    courseName?: string;
    courseCode?: string;
    coursePrice?: number;
    experienceType?: 'with' | 'without';
  }) => {
    if (!courseData) return;
    setSelectedCourseId(courseData.courseId);
    setSelectedCourseData({
      courseName: courseData.courseName,
      courseCode: courseData.courseCode,
      coursePrice: courseData.coursePrice,
      experienceType: courseData.experienceType
    });
    setSelectedCourseDateId(courseData.courseDateId ?? null);
    setEnrollmentLinkData(null);
    setEnrollCode(null);
    setCurrentPage('publicEnrollmentWizard');
    updateUrl(PATHS.enroll);
  };

  const handleBackFromBooking = () => {
    if (selectedCourseId) {
      setCurrentPage('courseDetails');
      updateUrl(PATHS.course(selectedCourseId));
    } else {
      setCurrentPage('landing');
      updateUrl(PATHS.landing);
    }
  };

  const handleBookingSuccess = async (data: { userId: string; studentId: string; email: string; password?: string }) => {
    let fullName = '';
    let phone = '';
    try {
      const tempUserData = localStorage.getItem('tempUserData');
      if (tempUserData) {
        const parsed = JSON.parse(tempUserData);
        fullName = parsed.fullName || '';
        phone = parsed.phone || '';
        localStorage.removeItem('tempUserData');
      }
    } catch (error) {
      console.error('Error retrieving temp user data:', error);
    }
    
    // Perform actual login to establish session if password is provided
    if (data.password) {
      try {
        const loginResponse = await authService.login({
          email: data.email,
          password: data.password
        });
        
        if (loginResponse.success && loginResponse.data) {
          const authUser: AuthUser = {
            userId: loginResponse.data.userId,
            fullName: loginResponse.data.fullName,
            email: loginResponse.data.email,
            userType: loginResponse.data.userType,
            phoneNumber: loginResponse.data.phoneNumber || phone,
            isActive: true,
            studentId: loginResponse.data.studentId,
          };
          
          setUser(authUser);
          setCurrentPage('portal');
          return;
        }
      } catch (loginError) {
        console.error('Auto-login failed after booking:', loginError);
        // Fallback to manual session setting if login fails
      }
    }
    
    const authUser: AuthUser = {
      userId: data.userId,
      fullName: fullName,
      email: data.email,
      userType: 'Student',
      phoneNumber: phone,
      isActive: true,
      studentId: data.studentId,
    };
    
    setUser(authUser);
    setCurrentPage('portal');
  };

  // Show loading while checking enrollment link
  if (isLoading || isLoadingEnrollmentLink) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {isLoadingEnrollmentLink ? 'Loading enrollment...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  const handleCourseUrlReady = (courseId: string, courseName: string) => {
    const slug = courseNameToSlug(courseName);
    updateUrl(PATHS.course(courseId, slug), true);
  };

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    }>
      <main id="main-content">
        {currentPage === 'landing' && (
          <LandingPage 
            onLogin={handleGoToLogin} 
            onRegister={handleGoToLogin} 
            onCourseDetails={handleCourseDetails}
            onAbout={handleGoToAbout}
            onContact={handleGoToContact}
            onBookNow={handleGoToBookNow}
            onEnrollNow={handleGoToPublicEnrollmentWizard}
            onForms={handleGoToForms}
            onFeesRefund={handleGoToFeesRefund}
            onGallery={handleGoToGallery}
            onBookCourse={handleBookCourse}
            onVOC={handleGoToVOCForm}
            onViewCourses={handleViewCourses}
            onViewComboCourses={handleViewComboCourses}
          />
        )}
        {currentPage === 'forms' && (
          <FormsPage
            onBack={handleBackToLanding}
            onLogin={handleGoToLogin}
            onRegister={handleGoToLogin}
            onAbout={handleGoToAbout}
            onContact={handleGoToContact}
            onBookNow={handleGoToBookNow}
            onCourseDetails={handleCourseDetails}
            onFeesRefund={handleGoToFeesRefund}
            onGallery={handleGoToGallery}
            onVOC={handleGoToVOCForm}
            onViewCourses={handleViewCourses}
            onViewComboCourses={handleViewComboCourses}
          />
        )}
        {currentPage === 'feesRefund' && (
          <FeesRefundPage
            onBack={handleBackToLanding}
            onLogin={handleGoToLogin}
            onRegister={handleGoToLogin}
            onAbout={handleGoToAbout}
            onContact={handleGoToContact}
            onBookNow={handleGoToBookNow}
            onCourseDetails={handleCourseDetails}
            onGallery={handleGoToGallery}
            onVOC={handleGoToVOCForm}
            onViewCourses={handleViewCourses}
            onViewComboCourses={handleViewComboCourses}
          />
        )}
        {currentPage === 'gallery' && (
          <GalleryPage
            onBack={handleBackToLanding}
            onLogin={handleGoToLogin}
            onRegister={handleGoToLogin}
            onAbout={handleGoToAbout}
            onContact={handleGoToContact}
            onBookNow={handleGoToBookNow}
            onForms={handleGoToForms}
            onFeesRefund={handleGoToFeesRefund}
            onVOC={handleGoToVOCForm}
            onViewCourses={handleViewCourses}
            onViewComboCourses={handleViewComboCourses}
          />
        )}
        {currentPage === 'publicQuiz' && (
          <PublicQuiz
            onComplete={handlePublicQuizComplete}
            onCancel={handleBackToLanding}
          />
        )}
        {currentPage === 'publicEnrollment' && (
          <PublicEnrollmentForm
            onComplete={handlePublicEnrollmentComplete}
            onCancel={handleBackToLanding}
          />
        )}
        {currentPage === 'publicEnrollmentWizard' && (
          <PublicEnrollmentWizard
            onComplete={handlePublicEnrollmentWizardComplete}
            onCancel={handleBackToLanding}
            preSelectedCourseId={enrollmentLinkData?.courseId ?? selectedCourseId ?? undefined}
            preSelectedCourseDateId={enrollmentLinkData?.courseDateId ?? selectedCourseDateId ?? undefined}
            preSelectedCoursePrice={selectedCourseData.coursePrice}
            preSelectedExperienceType={selectedCourseData.experienceType}
            isOneTimeLink={enrollmentLinkData?.isOneTimeLink}
            allowPayLater={enrollmentLinkData?.allowPayLater}
            enrollCode={enrollCode ?? ''}
            isCompanyPortalLink={enrollmentLinkData?.isCompanyPortalLink}
            hideEnrollmentTypeSelector={enrollmentLinkData != null}
            isAgentLink={enrollmentLinkData?.isAgentLink}
          />
        )}
        {currentPage === 'publicVOCForm' && (
          <PublicVOCForm
            onBack={handleBackToLanding}
            onLogin={handleGoToLogin}
            onAbout={handleGoToAbout}
            onContact={handleGoToContact}
            onBookNow={handleGoToBookNow}
            onForms={handleGoToForms}
            onFeesRefund={handleGoToFeesRefund}
            onGallery={handleGoToGallery}
            onCourseDetails={handleCourseDetails}
            onVOC={handleGoToVOCForm}
            onViewCourses={handleViewCourses}
            onViewComboCourses={handleViewComboCourses}
          />
        )}
        {currentPage === 'bookNow' && (
          <BookNowPage 
            onBack={handleBackToLanding}
            onLogin={handleGoToLogin}
            onRegister={handleGoToLogin}
            onCourseDetails={handleCourseDetails}
            onAbout={handleGoToAbout}
            onContact={handleGoToContact}
            onForms={handleGoToForms}
            onFeesRefund={handleGoToFeesRefund}
            onGallery={handleGoToGallery}
            onVOC={handleGoToVOCForm}
            onViewCourses={handleViewCourses}
            onViewComboCourses={handleViewComboCourses}
          />
        )}
        {currentPage === 'about' && (
          <AboutUsPage 
            onBack={handleBackToLanding}
            onLogin={handleGoToLogin}
            onRegister={handleGoToLogin}
            onContact={handleGoToContact}
            onViewCourses={handleViewCourses}
            onViewComboCourses={handleViewComboCourses}
            onBookNow={handleGoToBookNow}
            onCourseDetails={handleCourseDetails}
            onGallery={handleGoToGallery}
            onForms={handleGoToForms}
            onFeesRefund={handleGoToFeesRefund}
            onVOC={handleGoToVOCForm}
          />
        )}
        {currentPage === 'contact' && (
          <ContactPage
            onBack={handleBackToLanding}
            onLogin={handleGoToLogin}
            onRegister={handleGoToLogin}
            onAbout={handleGoToAbout}
            onViewCourses={handleViewCourses}
            onViewComboCourses={handleViewComboCourses}
            onBookNow={handleGoToBookNow}
            onCourseDetails={handleCourseDetails}
            onForms={handleGoToForms}
            onFeesRefund={handleGoToFeesRefund}
            onGallery={handleGoToGallery}
            onVOC={handleGoToVOCForm}
          />
        )}
        {currentPage === 'handbookViewer' && handbookViewerState && (
          <HandbookViewerPage
            pdfUrl={handbookViewerState.pdfUrl}
            title={handbookViewerState.title}
            courseName={handbookViewerState.courseName}
            onBack={handleBackFromHandbookViewer}
          />
        )}
        {currentPage === 'courseDetails' && selectedCourseId && (
          <CourseDetailsPage
            courseId={selectedCourseId}
            onBack={handleBackToLanding}
            onEnroll={handleCourseBooking}
            onLogin={handleGoToLogin}
            onRegister={handleGoToLogin}
            onContact={handleGoToContact}
            onViewCourses={handleViewCourses}
            onViewComboCourses={handleViewComboCourses}
            onBookNow={handleGoToBookNow}
            onCourseDetails={handleCourseDetails}
            onAbout={handleGoToAbout}
            onForms={handleGoToForms}
            onFeesRefund={handleGoToFeesRefund}
            onGallery={handleGoToGallery}
            onViewHandbook={handleViewHandbook}
            onCourseUrlReady={handleCourseUrlReady}
            onVOC={handleGoToVOCForm}
          />
        )}
        {currentPage === 'courseBooking' && (
          <CourseBooking
            courseId={selectedCourseId || undefined}
            courseName={selectedCourseData.courseName}
            courseCode={selectedCourseData.courseCode}
            coursePrice={selectedCourseData.coursePrice}
            experienceType={selectedCourseData.experienceType}
            onBack={handleBackFromBooking}
            onBookingSuccess={handleBookingSuccess}
            onAbout={handleGoToAbout}
            onContact={handleGoToContact}
            onBookNow={handleGoToBookNow}
            onForms={handleGoToForms}
            onFeesRefund={handleGoToFeesRefund}
            onGallery={handleGoToGallery}
            onLogin={handleGoToLogin}
            onRegister={handleGoToLogin}
            onVOC={handleGoToVOCForm}
            onViewCourses={handleViewCourses}
            onViewComboCourses={handleViewComboCourses}
          />
        )}
        {currentPage === 'login' && (
          <LoginPage
            onLogin={handleLogin}
            onBack={handleBackToLanding}
            onNavigateToEnroll={handleGoToPublicEnrollmentWizard}
          />
        )}
        {currentPage === 'portal' && isAuthenticated && user && (
          <>
            {user.role === 'company' && <CompanyPortal user={user} onLogout={handleLogout} onNavigateToLanding={handleBackToLanding} />}
            {user.role === 'student' && <StudentPortal user={user} onLogout={handleLogout} onNavigateToLanding={handleBackToLanding} />}
            {user.role === 'teacher' && <TeacherPortal user={user} onLogout={handleLogout} />}
            {user.role === 'admin' && <AdminPortal user={user} onLogout={handleLogout} onNavigateToLanding={handleBackToLanding} />}
            {user.role === 'superadmin' && <SuperAdminPortal user={user} onLogout={handleLogout} />}
            {!['company', 'student', 'teacher', 'admin', 'superadmin'].includes(user.role || '') && 
              <StudentPortal user={user} onLogout={handleLogout} onNavigateToLanding={handleBackToLanding} />
            }
          </>
        )}
      </main>
    </Suspense>
  );
}