import { apiService } from './api.service';
import { API_CONFIG } from '../config/api.config';

export interface VOCSubmissionRequest {
  firstName: string;
  lastName: string;
  australianStudentId: string;
  email: string;
  phone: string;
  streetAddress: string;
  city: string;
  state: string;
  postcode: string;
  preferredStartDate?: string;
  preferredTime?: string;
  comments?: string;
}

export interface VOCSubmissionResponse {
  submissionId: string;
  firstName: string;
  lastName: string;
  australianStudentId: string;
  email: string;
  phone: string;
  streetAddress: string;
  city: string;
  state: string;
  postcode: string;
  preferredStartDate?: string;
  preferredTime?: string;
  comments?: string;
  status: string;
  createdAt: string;
}

export interface VOCListResponse {
  submissions: VOCSubmissionResponse[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface VOCStatsResponse {
  totalSubmissions: number;
  pendingSubmissions: number;
  verifiedSubmissions: number;
  completedSubmissions: number;
  rejectedSubmissions: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

class VOCManagementService {
  async submitVOC(data: VOCSubmissionRequest): Promise<ApiResponse<VOCSubmissionResponse>> {
    return apiService.post<ApiResponse<VOCSubmissionResponse>>(
      API_CONFIG.ENDPOINTS.VOC.SUBMIT,
      data
    );
  }

  async getAllSubmissions(params: {
    pageNumber?: number;
    pageSize?: number;
    searchQuery?: string;
    status?: string;
  } = {}): Promise<ApiResponse<VOCListResponse>> {
    const queryParams = new URLSearchParams();
    if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params.searchQuery) queryParams.append('searchQuery', params.searchQuery);
    if (params.status) queryParams.append('status', params.status);

    const endpoint = `${API_CONFIG.ENDPOINTS.VOC.ADMIN_LIST}?${queryParams.toString()}`;
    return apiService.get<ApiResponse<VOCListResponse>>(endpoint);
  }

  async getSubmissionById(id: string): Promise<ApiResponse<VOCSubmissionResponse>> {
    return apiService.get<ApiResponse<VOCSubmissionResponse>>(
      API_CONFIG.ENDPOINTS.VOC.ADMIN_BY_ID(id)
    );
  }

  async updateStatus(id: string, status: string): Promise<ApiResponse<VOCSubmissionResponse>> {
    return apiService.patch<ApiResponse<VOCSubmissionResponse>>(
      API_CONFIG.ENDPOINTS.VOC.ADMIN_UPDATE_STATUS(id),
      { status }
    );
  }

  async deleteSubmission(id: string): Promise<ApiResponse<boolean>> {
    return apiService.delete<ApiResponse<boolean>>(
      API_CONFIG.ENDPOINTS.VOC.ADMIN_DELETE(id)
    );
  }

  async getStats(): Promise<ApiResponse<VOCStatsResponse>> {
    return apiService.get<ApiResponse<VOCStatsResponse>>(
      API_CONFIG.ENDPOINTS.VOC.ADMIN_STATS
    );
  }
}

export const vocManagementService = new VOCManagementService();
