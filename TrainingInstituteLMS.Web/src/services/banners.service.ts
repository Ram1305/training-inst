import { apiService } from './api.service';
import { API_CONFIG } from '../config/api.config';

export interface Banner {
  bannerId: string;
  title: string;
  imageUrl: string;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface CreateBannerRequest {
  title: string;
  imagePath: string;
  isActive: boolean;
  sortOrder: number;
}

export interface UpdateBannerRequest {
  title?: string;
  imagePath?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

class BannersService {
  async getAdminBanners(): Promise<ApiResponse<Banner[]>> {
    return apiService.get<ApiResponse<Banner[]>>(API_CONFIG.ENDPOINTS.BANNERS.ADMIN_BASE);
  }

  async createBanner(request: CreateBannerRequest): Promise<ApiResponse<Banner>> {
    return apiService.post<ApiResponse<Banner>>(API_CONFIG.ENDPOINTS.BANNERS.ADMIN_BASE, request);
  }

  async updateBanner(id: string, request: UpdateBannerRequest): Promise<ApiResponse<Banner>> {
    return apiService.patch<ApiResponse<Banner>>(API_CONFIG.ENDPOINTS.BANNERS.ADMIN_BY_ID(id), request);
  }

  async toggleBanner(id: string): Promise<ApiResponse<Banner>> {
    return apiService.patch<ApiResponse<Banner>>(API_CONFIG.ENDPOINTS.BANNERS.ADMIN_TOGGLE(id), {});
  }

  async deleteBanner(id: string): Promise<ApiResponse<null>> {
    return apiService.delete<ApiResponse<null>>(API_CONFIG.ENDPOINTS.BANNERS.ADMIN_BY_ID(id));
  }

  async getActivePublicBanners(): Promise<ApiResponse<Banner[]>> {
    return apiService.get<ApiResponse<Banner[]>>(API_CONFIG.ENDPOINTS.BANNERS.PUBLIC_ACTIVE);
  }
}

export const bannersService = new BannersService();

