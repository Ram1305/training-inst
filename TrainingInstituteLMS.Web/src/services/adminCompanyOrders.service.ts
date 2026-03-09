import { apiService } from './api.service';
import { API_CONFIG } from '../config/api.config';

export interface AdminCompanyOrderListItem {
  orderId: string;
  companyName: string;
  companyEmail: string;
  companyMobile?: string;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  courseCount: number;
}

export interface AdminCompanyOrderLinkItem {
  linkId: string;
  courseName: string;
  fullUrl: string;
  usedCount: number;
  maxUses?: number;
  isActive: boolean;
}

export interface AdminCompanyOrderDetail extends AdminCompanyOrderListItem {
  links: AdminCompanyOrderLinkItem[];
}

export interface AdminCompanyOrderListResponse {
  items: AdminCompanyOrderListItem[];
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

class AdminCompanyOrdersService {
  async getCompanyOrders(params: {
    page?: number;
    pageSize?: number;
    status?: string;
    search?: string;
  } = {}): Promise<ApiResponse<AdminCompanyOrderListResponse>> {
    const searchParams = new URLSearchParams();
    if (params.page != null) searchParams.set('page', String(params.page));
    if (params.pageSize != null) searchParams.set('pageSize', String(params.pageSize));
    if (params.status) searchParams.set('status', params.status);
    if (params.search) searchParams.set('search', params.search);
    const query = searchParams.toString();
    const url = query
      ? `${PUBLIC_ENROLLMENT.ADMIN_COMPANY_ORDERS}?${query}`
      : PUBLIC_ENROLLMENT.ADMIN_COMPANY_ORDERS;
    return apiService.get<ApiResponse<AdminCompanyOrderListResponse>>(url);
  }

  async getCompanyOrderById(orderId: string): Promise<ApiResponse<AdminCompanyOrderDetail>> {
    return apiService.get<ApiResponse<AdminCompanyOrderDetail>>(
      PUBLIC_ENROLLMENT.ADMIN_COMPANY_ORDER_BY_ID(orderId)
    );
  }

  async updateCompanyOrderStatus(
    orderId: string,
    status: string
  ): Promise<ApiResponse<null>> {
    return apiService.patch<ApiResponse<null>>(
      PUBLIC_ENROLLMENT.ADMIN_COMPANY_ORDER_STATUS(orderId),
      { status }
    );
  }

  async getCompanyOrderCount(): Promise<ApiResponse<{ companyOrderCount: number }>> {
    return apiService.get<ApiResponse<{ companyOrderCount: number }>>(
      PUBLIC_ENROLLMENT.ADMIN_COMPANY_ORDERS_COUNT
    );
  }
}

export const adminCompanyOrdersService = new AdminCompanyOrdersService();
