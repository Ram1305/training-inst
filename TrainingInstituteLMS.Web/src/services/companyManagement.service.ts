import { apiService } from './api.service';
import { API_CONFIG } from '../config/api.config';
import type { CompanyBillingListResponse } from './adminCompanyBilling.service';

export interface CreateCompanyRequest {
  companyName: string;
  email: string;
  password: string;
  mobileNumber?: string;
}

export interface UpdateCompanyRequest {
  companyName: string;
  email: string;
  password?: string;
  mobileNumber?: string;
}

export interface CompanyResponse {
  companyId: string;
  userId: string;
  companyName: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
  mobileNumber?: string;
  portalEnrollmentUrl?: string;
}

export interface CompanyListResponse {
  companies: CompanyResponse[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface CompanyFilterRequest {
  searchQuery?: string;
  status?: 'active' | 'inactive';
  pageNumber?: number;
  pageSize?: number;
}

export interface CompanyPortalEnrollmentRow {
  enrollmentId: string;
  studentName: string;
  studentEmail?: string;
  courseName: string;
  courseId: string;
  enrolledAt: string;
  completedAt?: string;
  status: string;
  paymentStatus: string;
  hasCompanyBill: boolean;
  companyBillStatus?: string;
}

export interface CompanyPortalEnrollmentsResponse {
  items: CompanyPortalEnrollmentRow[];
}

export interface CompanyBillingBankTransferSubmissionResponse {
  submissionId: string;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

class CompanyManagementService {
  async getAllCompanies(filter: CompanyFilterRequest = {}): Promise<ApiResponse<CompanyListResponse>> {
    const params = new URLSearchParams();

    if (filter.searchQuery) params.append('searchQuery', filter.searchQuery);
    if (filter.status) params.append('status', filter.status);
    if (filter.pageNumber) params.append('pageNumber', filter.pageNumber.toString());
    if (filter.pageSize) params.append('pageSize', filter.pageSize.toString());

    const queryString = params.toString();
    const endpoint = queryString
      ? `${API_CONFIG.ENDPOINTS.COMPANY_MANAGEMENT.BASE}?${queryString}`
      : API_CONFIG.ENDPOINTS.COMPANY_MANAGEMENT.BASE;

    return apiService.get<ApiResponse<CompanyListResponse>>(endpoint);
  }

  async getCompanyById(companyId: string): Promise<ApiResponse<CompanyResponse>> {
    return apiService.get<ApiResponse<CompanyResponse>>(
      API_CONFIG.ENDPOINTS.COMPANY_MANAGEMENT.BY_ID(companyId)
    );
  }

  async getCompanyByUserId(userId: string): Promise<ApiResponse<CompanyResponse>> {
    return apiService.get<ApiResponse<CompanyResponse>>(
      API_CONFIG.ENDPOINTS.COMPANY_MANAGEMENT.BY_USER_ID(userId)
    );
  }

  async createCompany(data: CreateCompanyRequest): Promise<ApiResponse<CompanyResponse>> {
    return apiService.post<ApiResponse<CompanyResponse>>(
      API_CONFIG.ENDPOINTS.COMPANY_MANAGEMENT.BASE,
      data
    );
  }

  async updateCompany(companyId: string, data: UpdateCompanyRequest): Promise<ApiResponse<CompanyResponse>> {
    return apiService.put<ApiResponse<CompanyResponse>>(
      API_CONFIG.ENDPOINTS.COMPANY_MANAGEMENT.BY_ID(companyId),
      data
    );
  }

  async deleteCompany(companyId: string): Promise<ApiResponse<boolean>> {
    return apiService.delete<ApiResponse<boolean>>(
      API_CONFIG.ENDPOINTS.COMPANY_MANAGEMENT.BY_ID(companyId)
    );
  }

  async toggleCompanyStatus(companyId: string): Promise<ApiResponse<boolean>> {
    return apiService.patch<ApiResponse<boolean>>(
      API_CONFIG.ENDPOINTS.COMPANY_MANAGEMENT.TOGGLE_STATUS(companyId)
    );
  }

  async submitBillingBankTransfer(
    companyId: string,
    formData: FormData
  ): Promise<ApiResponse<CompanyBillingBankTransferSubmissionResponse>> {
    return apiService.post<ApiResponse<CompanyBillingBankTransferSubmissionResponse>>(
      API_CONFIG.ENDPOINTS.COMPANY_MANAGEMENT.BILLING_BANK_TRANSFER(companyId),
      formData
    );
  }

  async getPortalEnrollments(
    companyId: string
  ): Promise<ApiResponse<CompanyPortalEnrollmentsResponse>> {
    return apiService.get<ApiResponse<CompanyPortalEnrollmentsResponse>>(
      API_CONFIG.ENDPOINTS.COMPANY_MANAGEMENT.PORTAL_ENROLLMENTS(companyId)
    );
  }

  async getBillingStatements(
    companyId: string,
    params: { page?: number; pageSize?: number } = {}
  ): Promise<ApiResponse<CompanyBillingListResponse>> {
    const searchParams = new URLSearchParams();
    if (params.page != null) searchParams.set('page', String(params.page));
    if (params.pageSize != null) searchParams.set('pageSize', String(params.pageSize));
    const q = searchParams.toString();
    const base = API_CONFIG.ENDPOINTS.COMPANY_MANAGEMENT.BILLING_STATEMENTS(companyId);
    const url = q ? `${base}?${q}` : base;
    return apiService.get<ApiResponse<CompanyBillingListResponse>>(url);
  }
}

export const companyManagementService = new CompanyManagementService();
