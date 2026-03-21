import { apiService } from './api.service';

// Types for the public enrollment wizard flow
export interface CourseDropdownItem {
  courseId: string;
  courseCode: string;
  courseName: string;
  price: number;
  duration?: string;
  categoryName?: string;
  imageUrl?: string;
}

export interface CourseDateDropdownItem {
  courseDateId: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  dateType?: string;
  location?: string;
  availableSlots: number;
  maxCapacity: number;
  isAvailable: boolean;
}

export interface PublicRegistrationRequest {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  enrollmentCode?: string;
}

export interface PublicRegistrationResponse {
  userId: string;
  studentId: string;
  email: string;
  fullName: string;
  token: string;
}

export interface CourseEnrollmentRequest {
  studentId: string;
  courseId: string;
  courseDateId: string;
  enrollmentCode?: string;
  paymentMethod: string; // 'online' | 'cash' | 'bank_transfer'
}

export interface CourseEnrollmentResponse {
  enrollmentId: string;
  courseId: string;
  courseDateId: string;
  status: string;
}

export interface EnrollmentLinkRequest {
  name: string;
  description?: string;
  courseId?: string; // Optional - if set, pre-selects the course
  courseDateId?: string; // Optional - if set, pre-selects the date
  expiresAt?: string;
  maxUses?: number;
  allowPayLater?: boolean;
}

export interface EnrollmentLinkResponse {
  linkId: string;
  name: string;
  description?: string;
  courseId?: string;
  courseName?: string;
  courseDateId?: string;
  courseDateRange?: string;
  uniqueCode: string;
  fullUrl: string;
  qrCodeDataUrl: string;
  createdAt: string;
  expiresAt?: string;
  maxUses?: number;
  usedCount: number;
  isActive: boolean;
  allowPayLater?: boolean;
}

export interface EnrollmentLinkListResponse {
  links: EnrollmentLinkResponse[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface CompanyOrderRequest {
  companyEmail: string;
  companyName: string;
  companyMobile?: string;
  /** When provided, creates a company account (User + Company) so they can log in. */
  password?: string;
  /** One item per course line: price is unit price, quantity is number of seats. Total = sum(price * quantity). */
  items: { courseId: string; courseDateId?: string; price: number; quantity: number }[];
  paymentMethod: string; // pay_later | bank_transfer | card
  transactionId?: string;
  paymentProofDataUrl?: string;
  paymentProofFileName?: string;
  paymentProofContentType?: string;
}

export interface CompanyOrderResponse {
  orderId: string;
  companyEmail: string;
  totalAmount: number;
  links: { linkId: string; fullUrl: string; courseName: string }[];
}

export interface OneTimeLinkCompleteRequest {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

export interface OneTimeLinkCompleteResponse {
  userId: string;
  studentId: string;
  email: string;
  fullName: string;
}

export interface EnrollmentLinkStudent {
  enrollmentId?: string;
  studentId: string;
  fullName: string;
  email: string;
  phone?: string;
  courseName?: string;
  enrolledAt: string;
  status?: string;
  paymentStatus?: string;
  amountPaid?: number;
  llnAssessmentCompleted?: boolean;
  enrollmentFormCompleted?: boolean;
}

export interface EnrollmentLinkStudentsResponse {
  linkId: string;
  linkName: string;
  students: EnrollmentLinkStudent[];
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Public Enrollment Wizard Service
export const publicEnrollmentWizardService = {
  // Get all active courses for dropdown
  async getCoursesForDropdown(): Promise<ApiResponse<CourseDropdownItem[]>> {
    return apiService.get<ApiResponse<CourseDropdownItem[]>>('/PublicEnrollment/courses');
  },

  // Get available dates for a specific course
  async getCourseDates(courseId: string): Promise<ApiResponse<CourseDateDropdownItem[]>> {
    return apiService.get<ApiResponse<CourseDateDropdownItem[]>>(`/PublicEnrollment/courses/${courseId}/dates`);
  },

  // Step 1: Register user (creates User + Student)
  async registerUser(request: PublicRegistrationRequest): Promise<ApiResponse<PublicRegistrationResponse>> {
    return apiService.post<ApiResponse<PublicRegistrationResponse>>('/PublicEnrollment/register', request);
  },

  // Step 2: Enroll in course with selected date
  async enrollInCourse(request: CourseEnrollmentRequest): Promise<ApiResponse<CourseEnrollmentResponse>> {
    return apiService.post<ApiResponse<CourseEnrollmentResponse>>('/PublicEnrollment/enroll', request);
  },

  // Get canonical enrollment base URL from API (from SiteSettings collection)
  async getEnrollmentBaseUrl(): Promise<ApiResponse<{ enrollmentBaseUrl: string }>> {
    return apiService.get<ApiResponse<{ enrollmentBaseUrl: string }>>('/PublicEnrollment/site-url');
  },

  // Get enrollment wizard data by link code
  async getWizardDataByCode(code: string): Promise<ApiResponse<{
    linkId: string;
    courseId?: string;
    courseName?: string;
    courseDateId?: string;
    courseDateRange?: string;
    isOneTimeLink?: boolean;
    allowPayLater?: boolean;
    isCompanyPortalLink?: boolean;
    companyName?: string;
  }>> {
    return apiService.get<ApiResponse<{
      linkId: string;
      courseId?: string;
      courseName?: string;
      courseDateId?: string;
      courseDateRange?: string;
      isOneTimeLink?: boolean;
      allowPayLater?: boolean;
      isCompanyPortalLink?: boolean;
      companyName?: string;
    }>>(`/PublicEnrollment/link/${code}`);
  },

  async getPortalPrerequisites(
    code: string,
    email: string
  ): Promise<
    ApiResponse<{
      isCompanyPortalLink: boolean;
      hasCompletedLln: boolean;
      hasCompletedEnrolmentForm: boolean;
    }>
  > {
    const params = new URLSearchParams({ code, email });
    return apiService.get<
      ApiResponse<{
        isCompanyPortalLink: boolean;
        hasCompletedLln: boolean;
        hasCompletedEnrolmentForm: boolean;
      }>
    >(`/PublicEnrollment/portal-prerequisites?${params.toString()}`);
  },

  // Process company card payment (returns transactionId to use with createCompanyOrder)
  async processCompanyCardPayment(request: {
    companyName: string;
    companyEmail: string;
    companyMobile?: string;
    totalAmountCents: number;
    cardName: string;
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
  }): Promise<ApiResponse<{ transactionId: string }>> {
    return apiService.post<ApiResponse<{ transactionId: string }>>('/PublicEnrollment/company/process-card', request);
  },

  // Create company order (multi-course, one-time links)
  async createCompanyOrder(request: CompanyOrderRequest): Promise<ApiResponse<CompanyOrderResponse>> {
    return apiService.post<ApiResponse<CompanyOrderResponse>>('/PublicEnrollment/company/order', request);
  },

  // Complete enrollment via one-time link (name, email, phone, password only)
  async completeEnrollmentViaLink(code: string, request: OneTimeLinkCompleteRequest): Promise<ApiResponse<OneTimeLinkCompleteResponse>> {
    return apiService.post<ApiResponse<OneTimeLinkCompleteResponse>>(`/PublicEnrollment/link/${code}/complete`, request);
  },

  // Admin: Create enrollment link
  async createEnrollmentLink(request: EnrollmentLinkRequest): Promise<ApiResponse<EnrollmentLinkResponse>> {
    return apiService.post<ApiResponse<EnrollmentLinkResponse>>('/PublicEnrollment/admin/links', request);
  },

  // Admin: Get all enrollment links
  async getEnrollmentLinks(
    page: number = 1,
    pageSize: number = 10,
    linkType?: 'created' | 'company'
  ): Promise<ApiResponse<EnrollmentLinkListResponse>> {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (linkType) params.set('linkType', linkType);
    return apiService.get<ApiResponse<EnrollmentLinkListResponse>>(`/PublicEnrollment/admin/links?${params.toString()}`);
  },

  // Admin: Get single enrollment link
  async getEnrollmentLink(linkId: string): Promise<ApiResponse<EnrollmentLinkResponse>> {
    return apiService.get<ApiResponse<EnrollmentLinkResponse>>(`/PublicEnrollment/admin/links/${linkId}`);
  },

  // Admin: Toggle link status
  async toggleLinkStatus(linkId: string): Promise<ApiResponse<null>> {
    return apiService.patch<ApiResponse<null>>(`/PublicEnrollment/admin/links/${linkId}/toggle`, {});
  },

  // Admin: Delete link
  async deleteEnrollmentLink(linkId: string): Promise<ApiResponse<null>> {
    return apiService.delete<ApiResponse<null>>(`/PublicEnrollment/admin/links/${linkId}`);
  },

  // Admin: Regenerate QR code
  async regenerateQRCode(linkId: string): Promise<ApiResponse<{ qrCodeDataUrl: string }>> {
    return apiService.post<ApiResponse<{ qrCodeDataUrl: string }>>(`/PublicEnrollment/admin/links/${linkId}/regenerate-qr`, {});
  },

  // Admin: Get students who joined via a specific enrollment link
  async getLinkStudents(linkId: string): Promise<ApiResponse<EnrollmentLinkStudentsResponse>> {
    return apiService.get<ApiResponse<EnrollmentLinkStudentsResponse>>(`/PublicEnrollment/admin/links/${linkId}/students`);
  },
};
