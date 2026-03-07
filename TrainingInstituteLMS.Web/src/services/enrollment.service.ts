import { apiService } from './api.service';
import { API_CONFIG } from '../config/api.config';

// Browse (available) course - for student to enroll
export interface StudentBrowseCourse {
  courseId: string;
  courseName: string;
  courseCode?: string;
  price?: number;
  nextBatchDate?: string;
  availableDates?: { courseDateId: string; scheduledDate: string }[];
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
}

export const enrollmentService = new EnrollmentService();
