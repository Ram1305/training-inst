import { apiService } from './api.service';
import { API_CONFIG } from '../config/api.config';

export interface CompanyBillingStatementListItem {
  statementId: string;
  companyId: string;
  companyName: string;
  sydneyBillingDate: string;
  status: string;
  totalAmount: number;
  paymentMethod?: string;
  paidAt?: string;
  paymentReference?: string;
  approvedAt?: string;
  lineCount: number;
}

export interface CompanyBillingLineItem {
  lineId: string;
  enrollmentId: string;
  amount: number;
  courseName?: string;
  studentName?: string;
  studentEmail?: string;
  enrolledAt: string;
}

export interface CompanyBillingStatementDetail extends CompanyBillingStatementListItem {
  lines: CompanyBillingLineItem[];
}

export interface CompanyBillingListResponse {
  items: CompanyBillingStatementListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  timestamp?: string;
}

const { PUBLIC_ENROLLMENT } = API_CONFIG.ENDPOINTS;

class AdminCompanyBillingService {
  async getStatements(params: {
    page?: number;
    pageSize?: number;
    status?: string;
    search?: string;
    companyId?: string;
  } = {}): Promise<ApiResponse<CompanyBillingListResponse>> {
    const searchParams = new URLSearchParams();
    if (params.page != null) searchParams.set('page', String(params.page));
    if (params.pageSize != null) searchParams.set('pageSize', String(params.pageSize));
    if (params.status) searchParams.set('status', params.status);
    if (params.search) searchParams.set('search', params.search);
    if (params.companyId) searchParams.set('companyId', params.companyId);
    const q = searchParams.toString();
    const url = q
      ? `${PUBLIC_ENROLLMENT.ADMIN_COMPANY_BILLING}?${q}`
      : PUBLIC_ENROLLMENT.ADMIN_COMPANY_BILLING;
    return apiService.get<ApiResponse<CompanyBillingListResponse>>(url);
  }

  async getStatementById(statementId: string): Promise<ApiResponse<CompanyBillingStatementDetail>> {
    return apiService.get<ApiResponse<CompanyBillingStatementDetail>>(
      PUBLIC_ENROLLMENT.ADMIN_COMPANY_BILLING_BY_ID(statementId)
    );
  }

  async updateStatement(
    statementId: string,
    body: { status: string; paymentMethod?: string; paymentReference?: string }
  ): Promise<ApiResponse<null>> {
    return apiService.patch<ApiResponse<null>>(
      PUBLIC_ENROLLMENT.ADMIN_COMPANY_BILLING_BY_ID(statementId),
      body
    );
  }
}

export const adminCompanyBillingService = new AdminCompanyBillingService();
