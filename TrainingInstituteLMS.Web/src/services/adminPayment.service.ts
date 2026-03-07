import { apiService } from './api.service';
import { API_CONFIG } from '../config/api.config';

export interface AdminPaymentProof {
  paymentProofId: string;
  enrollmentId: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  courseId: string;
  courseName: string;
  amountPaid: number;
  paymentDate: string;
  status: string;
  transactionId?: string;
  accountType?: 'Individual' | 'Company';
  companyId?: string;
  companyName?: string;
}

export interface AdminPaymentListResponse {
  paymentProofs: AdminPaymentProof[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminPaymentStatsResponse {
  totalCount: number;
  verifiedCount: number;
  pendingCount: number;
  companyPaymentCount?: number;
}

export interface AdminPaymentFilterRequest {
  studentId?: string;
  accountType?: 'Individual' | 'Company';
  status?: string;
  pageNumber?: number;
  pageSize?: number;
  searchQuery?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  timestamp?: string;
}

class AdminPaymentService {
  async getPaymentProofs(filter: AdminPaymentFilterRequest = {}): Promise<ApiResponse<AdminPaymentListResponse>> {
    const params = new URLSearchParams();
    if (filter.studentId) params.append('studentId', filter.studentId);
    if (filter.accountType) params.append('accountType', filter.accountType);
    if (filter.status) params.append('status', filter.status);
    if (filter.pageNumber) params.append('pageNumber', filter.pageNumber.toString());
    if (filter.pageSize) params.append('pageSize', filter.pageSize.toString());
    if (filter.searchQuery) params.append('searchQuery', filter.searchQuery);

    const queryString = params.toString();
    const endpoint = queryString
      ? `${API_CONFIG.ENDPOINTS.ADMIN_PAYMENTS.BASE}?${queryString}`
      : API_CONFIG.ENDPOINTS.ADMIN_PAYMENTS.BASE;

    return apiService.get<ApiResponse<AdminPaymentListResponse>>(endpoint);
  }

  async getPaymentStats(): Promise<ApiResponse<AdminPaymentStatsResponse>> {
    return apiService.get<ApiResponse<AdminPaymentStatsResponse>>(
      API_CONFIG.ENDPOINTS.ADMIN_PAYMENTS.STATS
    );
  }

  async verifyPayment(paymentProofId: string): Promise<ApiResponse<boolean>> {
    return apiService.post<ApiResponse<boolean>>(
      API_CONFIG.ENDPOINTS.ADMIN_PAYMENTS.VERIFY(paymentProofId),
      {}
    );
  }

  getReceiptDownloadUrl(paymentProofId: string): string {
    return `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ADMIN_PAYMENTS.DOWNLOAD(paymentProofId)}`;
  }

  /**
   * Fetch payments made by company accounts.
   * Tries accountType=Company filter; filters client-side if backend does not support it.
   */
  async getCompanyPayments(filter: {
    pageNumber?: number;
    pageSize?: number;
    searchQuery?: string;
    companyId?: string;
  } = {}): Promise<ApiResponse<AdminPaymentListResponse>> {
    const response = await this.getPaymentProofs({
      accountType: 'Company',
      pageNumber: filter.pageNumber ?? 1,
      pageSize: filter.pageSize ?? 50,
      searchQuery: filter.searchQuery,
    });

    if (!response.success || !response.data) return response;

    let proofs = response.data.paymentProofs;
    const companyOnly = proofs.filter(
      (p) =>
        p.accountType === 'Company' ||
        !!p.companyId ||
        !!p.companyName
    );
    if (companyOnly.length < proofs.length) {
      proofs = companyOnly;
    }
    if (filter.companyId) {
      proofs = proofs.filter((p) => p.companyId === filter.companyId);
    }
    return {
      ...response,
      data: {
        ...response.data,
        paymentProofs: proofs,
        totalCount: proofs.length,
      },
    };
  }
}

export const adminPaymentService = new AdminPaymentService();
