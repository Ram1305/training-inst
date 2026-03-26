// API base URL resolution:
// - VITE_USE_HTTP=true → local Aspire HTTP API
// - VITE_API_URL → use as-is (e.g. https://....azurewebsites.net/api OR /api when SWA proxies /api to App Service)
// - VITE_API_BASE_URL → that host + /api
// - default → local HTTPS API
//
// Production: use full App Service URL unless Azure Static Web App is linked to that API and you set VITE_API_URL=/api.
// See TrainingInstituteLMS.Web/DEPLOYMENT.md (405 on POST /api/* = no proxy on the SPA host).
function getBaseUrl(): string {
  const useHttp = import.meta.env.VITE_USE_HTTP === 'true';
  if (useHttp) {
    return 'http://localhost:5576/api';
  }
  const explicit = import.meta.env.VITE_API_URL as string | undefined;
  if (explicit != null && explicit !== '') {
    return explicit;
  }
  const base = import.meta.env.VITE_API_BASE_URL;
  if (base) return base.endsWith('/api') ? base : `${base}/api`;
  return 'https://localhost:7419/api';
}

// Manual enrollment link: always use this URL for enrollment links everywhere.
export const ENROLLMENT_BASE_URL = 'https://safetytrainingacademy.edu.au';
export const PUBLIC_SITE_URL = ENROLLMENT_BASE_URL;

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  /** Base URL for public site (manual enrollment link). Enrollment links: ${url}/enroll/{code} */
  PUBLIC_SITE_URL,  
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      LOGOUT: '/auth/logout',
      ME: '/auth/me',
      CHECK_EMAIL: '/auth/check-email',
      GET_USER: '/auth/user',
    },
    SUPER_ADMIN: {
      ADMIN_MANAGEMENT: '/AdminManagement',
    },
    STUDENT_MANAGEMENT: {
      BASE: '/StudentManagement',
      BY_ID: (studentId: string) => `/StudentManagement/${studentId}`,
      BY_USER_ID: (userId: string) => `/StudentManagement/user/${userId}`,
      TOGGLE_STATUS: (studentId: string) => `/StudentManagement/${studentId}/toggle-status`,
      STATS: '/StudentManagement/stats',
    },
    COMPANY_MANAGEMENT: {
      BASE: '/CompanyManagement',
      BY_ID: (companyId: string) => `/CompanyManagement/${companyId}`,
      BY_USER_ID: (userId: string) => `/CompanyManagement/user/${userId}`,
      TOGGLE_STATUS: (companyId: string) => `/CompanyManagement/${companyId}/toggle-status`,
      BILLING_STATEMENTS: (companyId: string) => `/CompanyManagement/${companyId}/billing-statements`,
      PORTAL_ENROLLMENTS: (companyId: string) => `/CompanyManagement/${companyId}/portal-enrollments`,
      BILLING_BANK_TRANSFER: (companyId: string) => `/CompanyManagement/${companyId}/billing/bank-transfer`,
    },
    QUIZ: {
      SUBMIT: '/quiz/submit',
      SUBMIT_GUEST: '/quiz/submit-guest',
      GET_BY_ID: '/quiz',
      GET_ALL: '/quiz',
      STUDENT_STATUS: '/quiz/student',
      STUDENT_LATEST: '/quiz/student',
      HAS_PASSED: '/quiz/student',
      CAN_ENROLL: '/quiz/student',
    },
    ADMIN_QUIZ: {
      RESULTS: '/admin/quiz/results',
      STATISTICS: '/admin/quiz/statistics',
      BYPASS: '/admin/quiz/bypass',
      REJECT: '/admin/quiz/reject',
      BYPASSES: '/admin/quiz/bypasses',
    },
    PAYMENT: {
      PROCESS_CARD_COMPANY_BILLING: '/payment/process-card-company-billing',
    },
    COURSE: {
      BASE: '/course',
      ACTIVE: '/course/active',
      FEATURED: '/course/featured',
      STATS: '/course/stats',
      REORDER: (categoryId: string) => `/course/reorder?categoryId=${categoryId}`,
      CHECK_CODE: (code: string) => `/course/check-code/${code}`,
      BY_ID: (id: string) => `/course/${id}`,
      BY_CODE: (code: string) => `/course/code/${code}`,
      TOGGLE_STATUS: (id: string) => `/course/${id}/toggle-status`,
    },
    CATEGORY: {
      BASE: '/category',
      DROPDOWN: '/category/dropdown',
      REORDER: '/category/reorder',
      CHECK_NAME: (name: string) => `/category/check-name/${encodeURIComponent(name)}`,
      BY_ID: (id: string) => `/category/${id}`,
      TOGGLE_STATUS: (id: string) => `/category/${id}/toggle-status`,
    },
    COURSE_DATE: {
      BASE: '/coursedate',
      BY_ID: (id: string) => `/coursedate/${id}`,
      FOR_COURSE: (courseId: string) => `/coursedate/course/${courseId}`,
      BULK: '/coursedate/bulk',
      BULK_DELETE: '/coursedate/bulk',
      TOGGLE_STATUS: (id: string) => `/coursedate/${id}/toggle-status`,
    },
    ENROLLMENT: {
      BASE: '/enrollment',
      BOOK: '/enrollment/book',  // NEW: Book course endpoint
      BOOKING_STATS_WEEKLY: '/enrollment/booking-stats/weekly',
      BOOKING_DETAILS: '/enrollment/booking-details',
      BROWSE: (studentId: string) => `/enrollment/browse/${studentId}`,
      STUDENT: (studentId: string) => `/enrollment/student/${studentId}`,
      CREATE: (studentId: string) => `/enrollment/${studentId}`,
      BY_ID: (enrollmentId: string) => `/enrollment/${enrollmentId}`,
      CANCEL: (enrollmentId: string, studentId: string) => `/enrollment/${enrollmentId}/student/${studentId}`,
      PAYMENT: (enrollmentId: string, studentId: string) => `/enrollment/${enrollmentId}/payment/${studentId}`,
      GET_PAYMENT: (enrollmentId: string) => `/enrollment/${enrollmentId}/payment`,
      VERIFY_PAYMENT: (paymentProofId: string) => `/enrollment/payment/${paymentProofId}/verify`,
      CAN_ENROLL: (studentId: string, courseId: string) => `/enrollment/can-enroll/${studentId}/${courseId}`,
    },
    ADMIN_PAYMENTS: {
      BASE: '/enrollment/admin/payments',
      STATS: '/enrollment/admin/payments/stats',
      BY_ID: (paymentProofId: string) => `/enrollment/admin/payments/${paymentProofId}`,
      DOWNLOAD: (paymentProofId: string) => `/enrollment/admin/payments/${paymentProofId}/download`,
      VERIFY: (paymentProofId: string, adminId?: string) =>
        `/enrollment/payment/${paymentProofId}/verify${adminId ? `?adminId=${encodeURIComponent(adminId)}` : ''}`,
    },
    SCHEDULE: {
      BASE: '/schedule',
      CALENDAR: '/schedule/calendar',
      BY_ID: (id: string) => `/schedule/${id}`,
      OLD: '/schedule/old',
      UPDATE_STATUS: (id: string) => `/schedule/${id}/status`,
      STUDENT_CALENDAR: (studentId: string) => `/schedule/student/${studentId}/calendar`,
      TEACHER_CALENDAR: (teacherId: string) => `/schedule/teacher/${teacherId}/calendar`,
    },
    FILES: {
      UPLOAD: (folder: string) => `/files/upload/${folder}`,
      UPLOAD_MULTIPLE: (folder: string) => `/files/upload-multiple/${folder}`,
      GET: (filePath: string) => `/files/${filePath}`,
      DELETE: (filePath: string) => `/files/${filePath}`,
    },
    STUDENT_ENROLLMENT_FORM: {
      // Public
      PUBLIC_SUBMIT: '/studentenrollmentform/public/submit',
      // Student
      MY_FORM: '/studentenrollmentform/my-form',
      BY_STUDENT_ID: (studentId: string) => `/studentenrollmentform/student/${studentId}`,
      SUBMIT: '/studentenrollmentform/submit',
      SUBMIT_FOR_STUDENT: (studentId: string) => `/studentenrollmentform/submit/${studentId}`,
      UPDATE: '/studentenrollmentform/update',
      UPDATE_FOR_STUDENT: (studentId: string) => `/studentenrollmentform/update/${studentId}`,
      UPLOAD_DOCUMENT: '/studentenrollmentform/upload-document',
      UPLOAD_DOCUMENT_FOR_STUDENT: (studentId: string) => `/studentenrollmentform/upload-document/${studentId}`,
      // Admin
      ADMIN_LIST: '/studentenrollmentform/admin/list',
      ADMIN_BY_ID: (studentId: string) => `/studentenrollmentform/admin/${studentId}`,
      ADMIN_REVIEW: (studentId: string) => `/studentenrollmentform/admin/${studentId}/review`,
      ADMIN_UPDATE: (studentId: string) => `/studentenrollmentform/admin/${studentId}`,
      ADMIN_STATS: '/studentenrollmentform/admin/stats',
      ADMIN_UPLOAD_DOCUMENT: (studentId: string) => `/studentenrollmentform/admin/${studentId}/upload-document`,
      // PDF
      PDF_HTML: (studentId: string) => `/studentenrollmentform/admin/${studentId}/pdf/html`,
      PDF_DOWNLOAD: (studentId: string) => `/studentenrollmentform/admin/${studentId}/pdf/download`,
    },
    GALLERY: {
      BASE: '/gallery',
      ADMIN: '/gallery/admin',
      ADMIN_BY_ID: (id: string) => `/gallery/admin/${id}`,
      BY_ID: (id: string) => `/gallery/${id}`,
    },
    GOOGLE_REVIEW: {
      BASE: '/googlereview',
      ADMIN: '/googlereview/admin',
      ADMIN_STATS: '/googlereview/admin/stats',
      ADMIN_BY_ID: (id: string) => `/googlereview/admin/${id}`,
      BY_ID: (id: string) => `/googlereview/${id}`,
      REORDER: '/googlereview/reorder',
      TOGGLE_STATUS: (id: string) => `/googlereview/${id}/toggle-status`,
    },
    BANNERS: {
      ADMIN_BASE: '/admin/banners',
      ADMIN_BY_ID: (id: string) => `/admin/banners/${id}`,
      ADMIN_TOGGLE: (id: string) => `/admin/banners/${id}/toggle`,
      PUBLIC_ACTIVE: '/public/banners/active',
    },
    PUBLIC_ENROLLMENT: {
      // Dropdowns
      COURSES: '/publicenrollment/courses',
      COURSE_DATES: (courseId: string) => `/publicenrollment/courses/${courseId}/dates`,
      // Registration & Enrollment
      REGISTER: '/publicenrollment/register',
      ENROLL: '/publicenrollment/enroll',
      LINK_BY_CODE: (code: string) => `/publicenrollment/link/${code}`,
      // Admin - Enrollment Links
      ADMIN_LINKS: '/publicenrollment/admin/links',
      ADMIN_LINK_BY_ID: (linkId: string) => `/publicenrollment/admin/links/${linkId}`,
      ADMIN_LINK_TOGGLE: (linkId: string) => `/publicenrollment/admin/links/${linkId}/toggle`,
      ADMIN_LINK_REGENERATE_QR: (linkId: string) => `/publicenrollment/admin/links/${linkId}/regenerate-qr`,
      ADMIN_LINK_STUDENTS: (linkId: string) => `/publicenrollment/admin/links/${linkId}/students`,
      // Admin company orders (list, detail, status, count)
      ADMIN_COMPANY_ORDERS: '/PublicEnrollment/admin/company-orders',
      ADMIN_COMPANY_ORDER_BY_ID: (orderId: string) => `/PublicEnrollment/admin/company-orders/${orderId}`,
      ADMIN_COMPANY_ORDER_STATUS: (orderId: string) => `/PublicEnrollment/admin/company-orders/${orderId}/status`,
      ADMIN_COMPANY_ORDERS_COUNT: '/PublicEnrollment/admin/company-orders/count',
      ADMIN_COMPANY_BILLING: '/PublicEnrollment/admin/company-billing',
      ADMIN_COMPANY_BILLING_BY_ID: (statementId: string) =>
        `/PublicEnrollment/admin/company-billing/${statementId}`,
      ADMIN_COMPANY_PORTAL_COMPLETE_TRAINING: (enrollmentId: string) =>
        `/PublicEnrollment/admin/company-billing/complete-training/${enrollmentId}`,
    },
    VOC: {
      SUBMIT: '/VOC/submit',
      ADMIN_LIST: '/VOC/admin/list',
      ADMIN_BY_ID: (id: string) => `/VOC/admin/${id}`,
      ADMIN_UPDATE_STATUS: (id: string) => `/VOC/admin/${id}/status`,
      ADMIN_DELETE: (id: string) => `/VOC/admin/${id}`,
      ADMIN_STATS: '/VOC/admin/stats',
      SEND_OTP: '/VOC/send-otp',
      VERIFY_OTP: '/VOC/verify-otp',
    },
  },
};