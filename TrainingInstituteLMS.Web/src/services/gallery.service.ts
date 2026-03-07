import { apiService } from './api.service';
import { API_CONFIG } from '../config/api.config';

/**
 * Convert image URL to full absolute URL for display.
 * Handles both full URLs (from API) and relative paths (when BaseUrl not configured).
 */
export function getFullImageUrl(imageUrl: string | undefined | null): string {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
  const base = API_CONFIG.BASE_URL.replace(/\/api$/, '').replace(/\/$/, '');
  const path = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  return `${base}/api/files${path.startsWith('/') ? path : '/' + path}`;
}

export interface GalleryImage {
  galleryImageId: string;
  imageUrl: string;
  title: string;
  displayOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface GalleryImageListResponse {
  images: GalleryImage[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface GalleryImageFilter {
  searchQuery?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDescending?: boolean;
}

export interface CreateGalleryImageRequest {
  title: string;
  imageUrl?: string | null;
  displayOrder?: number;
}

export interface UpdateGalleryImageRequest {
  title?: string;
  isActive?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

class GalleryService {
  async getPublicGallery(): Promise<ApiResponse<GalleryImage[]>> {
    return apiService.get<ApiResponse<GalleryImage[]>>(API_CONFIG.ENDPOINTS.GALLERY.BASE);
  }

  async getAdminGallery(filter?: GalleryImageFilter): Promise<ApiResponse<GalleryImageListResponse>> {
    const params = new URLSearchParams();
    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const queryString = params.toString();
    const endpoint = queryString
      ? `${API_CONFIG.ENDPOINTS.GALLERY.ADMIN}?${queryString}`
      : API_CONFIG.ENDPOINTS.GALLERY.ADMIN;
    return apiService.get<ApiResponse<GalleryImageListResponse>>(endpoint);
  }

  async createGalleryImage(request: CreateGalleryImageRequest): Promise<ApiResponse<GalleryImage>> {
    return apiService.post<ApiResponse<GalleryImage>>(API_CONFIG.ENDPOINTS.GALLERY.BASE, request);
  }

  async updateGalleryImage(id: string, request: UpdateGalleryImageRequest): Promise<ApiResponse<GalleryImage>> {
    return apiService.put<ApiResponse<GalleryImage>>(API_CONFIG.ENDPOINTS.GALLERY.BY_ID(id), request);
  }

  async deleteGalleryImage(id: string): Promise<ApiResponse<null>> {
    return apiService.delete<ApiResponse<null>>(API_CONFIG.ENDPOINTS.GALLERY.BY_ID(id));
  }
}

export const galleryService = new GalleryService();
