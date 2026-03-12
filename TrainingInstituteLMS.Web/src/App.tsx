import { useState, useEffect, useRef } from 'react';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { StudentPortal } from './components/StudentPortal';
import { TeacherPortal } from './components/TeacherPortal';
import { AdminPortal } from './components/AdminPortal';
import { SuperAdminPortal } from './components/SuperAdminPortal';
import { CompanyPortal } from './components/CompanyPortal';
import { CourseDetailsPage } from './components/CourseDetails';
import { HandbookViewerPage } from './components/HandbookViewerPage';
import { CourseBooking } from './components/CourseBooking';
import { AboutUsPage } from './components/AboutUsPage';
import { ContactPage } from './components/ContactPage';
import { BookNowPage } from './components/BookNowPage';
import { FormsPage } from './components/FormsPage';
import { FeesRefundPage } from './components/FeesRefundPage';
import { GalleryPage } from './components/GalleryPage';
import { PublicQuiz } from './components/student/PublicQuiz';
import { PublicEnrollmentForm } from './components/student/PublicEnrollmentForm';
import { PublicEnrollmentWizard } from './components/student/PublicEnrollmentWizard';
import { PublicVOCForm } from './components/student/PublicVOCForm';
import { useAuth } from './contexts/AuthContext';
import type { AuthUser } from './contexts/AuthContext';
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

  const handleLogout = () => {
    logout();
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
    setTimeout(() => {
      const coursesSection = document.getElementById('courses');
      if (coursesSection) {
        coursesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
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

  const handlePublicEnrollmentWizardComplete = (result: { userId: string; studentId: string; email: string; fullName: string }) => {
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

  const handleBookingSuccess = (data: { userId: string; studentId: string; email: string }) => {
    let fullName = '';
    try {
      const tempUserData = localStorage.getItem('tempUserData');
      if (tempUserData) {
        const parsed = JSON.parse(tempUserData);
        fullName = parsed.fullName || '';
        localStorage.removeItem('tempUserData');
      }
    } catch (error) {
      console.error('Error retrieving temp user data:', error);
    }
    
    const authUser: AuthUser = {
      userId: data.userId,
      fullName: fullName,
      email: data.email,
      userType: 'Student',
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

  if (currentPage === 'landing') {
    return (
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
      />
    );
  }

  if (currentPage === 'forms') {
    return (
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
      />
    );
  }

  if (currentPage === 'feesRefund') {
    return (
      <FeesRefundPage
        onBack={handleBackToLanding}
        onLogin={handleGoToLogin}
        onRegister={handleGoToLogin}
        onAbout={handleGoToAbout}
        onContact={handleGoToContact}
        onBookNow={handleGoToBookNow}
        onCourseDetails={handleCourseDetails}
        onGallery={handleGoToGallery}
      />
    );
  }

  if (currentPage === 'gallery') {
    return (
      <GalleryPage
        onBack={handleBackToLanding}
        onLogin={handleGoToLogin}
        onRegister={handleGoToLogin}
        onAbout={handleGoToAbout}
        onContact={handleGoToContact}
        onBookNow={handleGoToBookNow}
        onForms={handleGoToForms}
        onFeesRefund={handleGoToFeesRefund}
      />
    );
  }

  if (currentPage === 'publicQuiz') {
    return (
      <PublicQuiz
        onComplete={handlePublicQuizComplete}
        onCancel={handleBackToLanding}
      />
    );
  }

  if (currentPage === 'publicEnrollment') {
    return (
      <PublicEnrollmentForm
        onComplete={handlePublicEnrollmentComplete}
        onCancel={handleBackToLanding}
      />
    );
  }

  if (currentPage === 'publicEnrollmentWizard') {
    return (
      <PublicEnrollmentWizard
        onComplete={handlePublicEnrollmentWizardComplete}
        onCancel={handleBackToLanding}
        preSelectedCourseId={enrollmentLinkData?.courseId ?? selectedCourseId ?? undefined}
        preSelectedCourseDateId={enrollmentLinkData?.courseDateId ?? selectedCourseDateId ?? undefined}
        preSelectedCoursePrice={selectedCourseData.coursePrice}
        isOneTimeLink={enrollmentLinkData?.isOneTimeLink}
        allowPayLater={enrollmentLinkData?.allowPayLater}
        enrollCode={enrollCode ?? ''}
      />
    );
  }

  if (currentPage === 'publicVOCForm') {
    return (
      <PublicVOCForm
        onBack={handleBackToLanding}
      />
    );
  }

  if (currentPage === 'bookNow') {
    return (
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
      />
    );
  }

  if (currentPage === 'about') {
    return (
      <AboutUsPage 
        onBack={handleBackToLanding}
        onLogin={handleGoToLogin}
        onRegister={handleGoToLogin}
        onContact={handleGoToContact}
        onViewCourses={handleViewCourses}
        onBookNow={handleGoToBookNow}
        onCourseDetails={handleCourseDetails}
        onGallery={handleGoToGallery}
        onForms={handleGoToForms}
        onFeesRefund={handleGoToFeesRefund}
      />
    );
  }

  if (currentPage === 'contact') {
    return (
      <ContactPage
        onBack={handleBackToLanding}
        onLogin={handleGoToLogin}
        onRegister={handleGoToLogin}
        onAbout={handleGoToAbout}
        onViewCourses={handleViewCourses}
        onBookNow={handleGoToBookNow}
        onCourseDetails={handleCourseDetails}
        onForms={handleGoToForms}
        onFeesRefund={handleGoToFeesRefund}
        onGallery={handleGoToGallery}
      />
    );
  }

  if (currentPage === 'handbookViewer' && handbookViewerState) {
    return (
      <HandbookViewerPage
        pdfUrl={handbookViewerState.pdfUrl}
        title={handbookViewerState.title}
        courseName={handbookViewerState.courseName}
        onBack={handleBackFromHandbookViewer}
      />
    );
  }

  const handleCourseUrlReady = (courseId: string, courseName: string) => {
    const slug = courseNameToSlug(courseName);
    updateUrl(PATHS.course(courseId, slug), true);
  };

  if (currentPage === 'courseDetails' && selectedCourseId) {
    return (
      <CourseDetailsPage
        courseId={selectedCourseId}
        onBack={handleBackToLanding}
        onEnroll={handleCourseBooking}
        onLogin={handleGoToLogin}
        onRegister={handleGoToLogin}
        onContact={handleGoToContact}
        onViewCourses={handleViewCourses}
        onBookNow={handleGoToBookNow}
        onCourseDetails={handleCourseDetails}
        onAbout={handleGoToAbout}
        onForms={handleGoToForms}
        onFeesRefund={handleGoToFeesRefund}
        onGallery={handleGoToGallery}
        onViewHandbook={handleViewHandbook}
        onCourseUrlReady={handleCourseUrlReady}
      />
    );
  }

  if (currentPage === 'courseBooking') {
    return (
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
      />
    );
  }

  if (currentPage === 'login') {
    return (
      <LoginPage
        onLogin={handleLogin}
        onBack={handleBackToLanding}
        onNavigateToEnroll={handleGoToPublicEnrollmentWizard}
      />
    );
  }

  if (isAuthenticated && user) {
    switch (user.role) {
      case 'company':
        return <CompanyPortal user={user} onLogout={handleLogout} onNavigateToLanding={handleBackToLanding} />;
      case 'student':
        return <StudentPortal user={user} onLogout={handleLogout} onNavigateToLanding={handleBackToLanding} />;
      case 'teacher':
        return <TeacherPortal user={user} onLogout={handleLogout} />;
      case 'admin':
        return <AdminPortal user={user} onLogout={handleLogout} onNavigateToLanding={handleBackToLanding} />;
      case 'superadmin':
        return <SuperAdminPortal user={user} onLogout={handleLogout} />;
      default:
        return <StudentPortal user={user} onLogout={handleLogout} onNavigateToLanding={handleBackToLanding} />;
    }
  }

  return null;
}