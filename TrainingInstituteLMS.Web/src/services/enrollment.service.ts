import { apiService } from './api.service';
import { API_CONFIG } from '../config/api.config';

// Browse (available) course - for student to enroll
export interface StudentBrowseCourse {
  courseId: string;
  courseName: string;
  courseCode?: string;
  price?: number;
  nextBatchDate?: string;
  availableDates?: {
    courseDateId: string;
    scheduledDate: string;
    isAvailable?: boolean;
    sessionCount?: number;
    availableSpots?: number;
  }[];
  imageUrl?: string;
  categoryName?: string;
  duration?: string;
  enrolledStudentsCount?: number;
  hasTheory?: boolean;
  hasPractical?: boolean;
  validityPeriod?: string;
}

// Booking (public book course) - response
export interface BookCourseResponse {
  userId: string;
  studentId: string;
  email: string;
}

// Admin booking details
export interface BookingDetailsCourseDto {
  courseId: string;
  courseCode: string;
  courseName: string;
  enrollmentCount: number;
}

export interface BookingDetailsEnrollmentDto {
  enrollmentId: string;
  studentName: string;
  studentEmail: string;
  courseCode: string;
  courseName: string;
  sessionTime?: string;
  sessionType?: string;
  location?: string;
  paymentStatus: string;
  status: string;
}

export interface BookingDetailsResponseDto {
  courses: BookingDetailsCourseDto[];
  enrollments: BookingDetailsEnrollmentDto[];
}

// Weekly booking stats for admin dashboard (based on selected course date)
export interface DailyBookingStat {
  date: string;
  /** Number of enrollments whose selected course/session date falls on this day */
  totalCount: number;
}

export interface WeeklyBookingStatsDto {
  weekStart?: string;
  dailyStats: DailyBookingStat[];
  totalBookings?: number;
}

// Enrolled course - student's current enrollments
export interface StudentEnrolledCourse {
  enrollmentId: string;
  courseId: string;
  courseName: string;
  courseCode?: string;
  imageUrl?: string;
  batchCode?: string;
  instructor?: string;
  enrolledAt: string;
  /** Course session date the student selected when enrolling (ISO string). */
  selectedCourseDate?: string;
  selectedTheoryDate?: string;
  selectedExamDate?: string;
  status: string;
  paymentStatus: string;
  quizCompleted: boolean;
  progress: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

class EnrollmentService {
  async getAvailableCourses(
    studentId: string,
    searchQuery?: string
  ): Promise<ApiResponse<StudentBrowseCourse[]>> {
    const params = new URLSearchParams();
    if (searchQuery) params.append('searchQuery', searchQuery);
    const qs = params.toString();
    const endpoint = qs
      ? `${API_CONFIG.ENDPOINTS.ENROLLMENT.BROWSE(studentId)}?${qs}`
      : API_CONFIG.ENDPOINTS.ENROLLMENT.BROWSE(studentId);
    return apiService.get<ApiResponse<StudentBrowseCourse[]>>(endpoint);
  }

  async getStudentEnrollments(
    studentId: string
  ): Promise<ApiResponse<StudentEnrolledCourse[]>> {
    return apiService.get<ApiResponse<StudentEnrolledCourse[]>>(
      API_CONFIG.ENDPOINTS.ENROLLMENT.STUDENT(studentId)
    );
  }

  async createEnrollment(
    studentId: string,
    data: { courseId: string; selectedTheoryDateId?: string }
  ): Promise<ApiResponse<{ enrollmentId: string }>> {
    return apiService.post<ApiResponse<{ enrollmentId: string }>>(
      API_CONFIG.ENDPOINTS.ENROLLMENT.CREATE(studentId),
      data
    );
  }

  async submitPaymentProof(
    enrollmentId: string,
    studentId: string,
    data: { transactionId: string; amountPaid: number; receiptFile: File }
  ): Promise<ApiResponse<unknown>> {
    const formData = new FormData();
    formData.append('transactionId', data.transactionId);
    formData.append('amountPaid', String(data.amountPaid));
    formData.append('receiptFile', data.receiptFile);

    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ENROLLMENT.PAYMENT(enrollmentId, studentId)}`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    const text = await response.text();
    if (!response.ok) {
      let body: { message?: string } = {};
      try {
        body = text ? JSON.parse(text) : {};
      } catch {
        //
      }
      throw new Error(body.message || text || 'Failed to submit payment proof');
    }
    const result = text ? JSON.parse(text) : { success: true };
    return { ...result, success: result.success ?? true } as ApiResponse<unknown>;
  }

  async cancelEnrollment(
    enrollmentId: string,
    studentId: string
  ): Promise<ApiResponse<unknown>> {
    return apiService.delete<ApiResponse<unknown>>(
      API_CONFIG.ENDPOINTS.ENROLLMENT.CANCEL(enrollmentId, studentId)
    );
  }

  async bookCourse(data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    courseId: string;
    selectedCourseDateId: string;
    transactionId: string;
    amountPaid: number;
    receiptFile: File;
    paymentMethod: string;
    bankName: string;
  }): Promise<ApiResponse<BookCourseResponse>> {
    const formData = new FormData();
    formData.append('fullName', data.fullName);
    formData.append('email', data.email);
    formData.append('phone', data.phone);
    formData.append('password', data.password);
    formData.append('courseId', data.courseId);
    formData.append('selectedCourseDateId', data.selectedCourseDateId);
    formData.append('transactionId', data.transactionId);
    formData.append('amountPaid', String(data.amountPaid));
    formData.append('receiptFile', data.receiptFile);
    formData.append('paymentMethod', data.paymentMethod);
    formData.append('bankName', data.bankName);

    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ENROLLMENT.BOOK}`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    const text = await response.text();
    if (!response.ok) {
      let body: { message?: string } = {};
      try {
        body = text ? JSON.parse(text) : {};
      } catch {
        //
      }
      throw new Error(body.message || text || 'Failed to book course');
    }
    const result = text ? JSON.parse(text) : {};
    return {
      success: result.success ?? true,
      data: result.data ?? result,
      message: result.message,
    } as ApiResponse<BookCourseResponse>;
  }

  async getBookingDetailsByDate(
    date: string,
    courseId?: string,
    plan?: string
  ): Promise<ApiResponse<BookingDetailsResponseDto>> {
    const params = new URLSearchParams();
    params.append('date', date);
    if (courseId) params.append('courseId', courseId);
    if (plan) params.append('plan', plan);
    const qs = params.toString();
    const endpoint = `${API_CONFIG.ENDPOINTS.ENROLLMENT.BOOKING_DETAILS}?${qs}`;
    return apiService.get<ApiResponse<BookingDetailsResponseDto>>(endpoint);
  }

  async getWeeklyBookingStats(weekStart: string): Promise<ApiResponse<WeeklyBookingStatsDto>> {
    const endpoint = `${API_CONFIG.ENDPOINTS.ENROLLMENT.BOOKING_STATS_WEEKLY}?weekStart=${encodeURIComponent(weekStart)}`;
    return apiService.get<ApiResponse<WeeklyBookingStatsDto>>(endpoint);
  }
}

export const enrollmentService = new EnrollmentService();
