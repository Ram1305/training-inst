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
  courseCode?: string;
  amountPaid: number;
  paymentDate: string;
  status: string;
  transactionId?: string;
  accountType?: 'Individual' | 'Company';
  companyId?: string;
  companyName?: string;
  /** Optional fields from API when available */
  uploadedAt?: string;
  receiptFileName?: string;
  receiptFileUrl?: string;
  coursePrice?: number;
  paymentMethod?: string;
  bankName?: string;
  referenceNumber?: string;
  verifiedAt?: string;
  rejectionReason?: string;
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
  rejectedCount?: number;
  totalVerifiedAmount?: number;
}

/** Alias for AdminPaymentStatsResponse for component usage */
export type AdminPaymentStats = AdminPaymentStatsResponse;

export interface AdminPaymentFilterRequest {
  studentId?: string;
  accountType?: 'Individual' | 'Company';
  status?: string;
  pageNumber?: number;
  pageSize?: number;
  page?: number; // alias: mapped to pageNumber when building params
  searchQuery?: string;
  sortBy?: string;
  sortDescending?: boolean;
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
    const pageNum = filter.pageNumber ?? filter.page;
    if (pageNum != null) params.append('pageNumber', pageNum.toString());
    if (filter.pageSize) params.append('pageSize', filter.pageSize.toString());
    if (filter.searchQuery) params.append('searchQuery', filter.searchQuery);
    if (filter.sortBy) params.append('sortBy', filter.sortBy);
    if (filter.sortDescending != null) params.append('sortDescending', String(filter.sortDescending));

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

  async verifyPayment(
    paymentProofId: string,
    _userId?: string,
    options?: { approve?: boolean; rejectionReason?: string }
  ): Promise<ApiResponse<boolean>> {
    const body = options
      ? { approve: options.approve ?? true, rejectionReason: options.rejectionReason }
      : {};
    return apiService.post<ApiResponse<boolean>>(
      API_CONFIG.ENDPOINTS.ADMIN_PAYMENTS.VERIFY(paymentProofId),
      body
    );
  }

  async downloadReceipt(paymentProofId: string): Promise<Blob> {
    const url = this.getReceiptDownloadUrl(paymentProofId);
    const response = await fetch(url, { credentials: 'include' });
    if (!response.ok) throw new Error('Failed to download receipt');
    return response.blob();
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
