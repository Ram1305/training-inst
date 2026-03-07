// src/services/review.service.ts
import { apiService } from './api.service';
import { API_CONFIG } from '../config/api.config';

// Types (for public landing page)
export interface GoogleReview {
  googleReviewId: string;
  author: string;
  rating: number;
  reviewText: string;
  timeText?: string | null;
  isMainReview: boolean;
  displayOrder: number;
  isActive: boolean;
}

// Admin list response
export interface GoogleReviewListResponse {
  reviews: GoogleReview[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Filter for admin list
export interface GoogleReviewFilter {
  searchQuery?: string;
  isActive?: boolean;
  isMainReview?: boolean;
  rating?: number;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDescending?: boolean;
}

// Create/Update requests
export interface CreateGoogleReviewRequest {
  author: string;
  rating: number;
  reviewText: string;
  timeText?: string | null;
  isMainReview?: boolean;
  displayOrder?: number;
}

export interface UpdateGoogleReviewRequest {
  author?: string;
  rating?: number;
  reviewText?: string;
  timeText?: string | null;
  isMainReview?: boolean;
  displayOrder?: number;
  isActive?: boolean;
}

export interface GoogleReviewStats {
  totalCount: number;
  featuredCount: number;
  averageRating: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

class ReviewService {
  /**
   * Get public reviews for the landing page (active only)
   */
  async getPublicReviews(): Promise<ApiResponse<GoogleReview[]>> {
    return apiService.get<ApiResponse<GoogleReview[]>>(API_CONFIG.ENDPOINTS.GOOGLE_REVIEW.BASE);
  }

  /**
   * Get review statistics (admin)
   */
  async getAdminStats(): Promise<ApiResponse<GoogleReviewStats>> {
    return apiService.get<ApiResponse<GoogleReviewStats>>(API_CONFIG.ENDPOINTS.GOOGLE_REVIEW.ADMIN_STATS);
  }

  /**
   * Get all reviews for admin with filtering
   */
  async getAdminReviews(filter?: GoogleReviewFilter): Promise<ApiResponse<GoogleReviewListResponse>> {
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
      ? `${API_CONFIG.ENDPOINTS.GOOGLE_REVIEW.ADMIN}?${queryString}`
      : API_CONFIG.ENDPOINTS.GOOGLE_REVIEW.ADMIN;
    return apiService.get<ApiResponse<GoogleReviewListResponse>>(endpoint);
  }

  /**
   * Get a single review by ID (admin)
   */
  async getReviewById(id: string): Promise<ApiResponse<GoogleReview>> {
    return apiService.get<ApiResponse<GoogleReview>>(API_CONFIG.ENDPOINTS.GOOGLE_REVIEW.ADMIN_BY_ID(id));
  }

  /**
   * Create a new review (admin)
   */
  async createReview(request: CreateGoogleReviewRequest): Promise<ApiResponse<GoogleReview>> {
    return apiService.post<ApiResponse<GoogleReview>>(API_CONFIG.ENDPOINTS.GOOGLE_REVIEW.BASE, request);
  }

  /**
   * Update a review (admin)
   */
  async updateReview(id: string, request: UpdateGoogleReviewRequest): Promise<ApiResponse<GoogleReview>> {
    return apiService.put<ApiResponse<GoogleReview>>(API_CONFIG.ENDPOINTS.GOOGLE_REVIEW.BY_ID(id), request);
  }

  /**
   * Delete a review (admin)
   */
  async deleteReview(id: string): Promise<ApiResponse<null>> {
    return apiService.delete<ApiResponse<null>>(API_CONFIG.ENDPOINTS.GOOGLE_REVIEW.BY_ID(id));
  }

  /**
   * Reorder reviews (admin)
   */
  async reorderReviews(ids: string[]): Promise<ApiResponse<null>> {
    return apiService.post<ApiResponse<null>>(API_CONFIG.ENDPOINTS.GOOGLE_REVIEW.REORDER, ids);
  }

  /**
   * Toggle review active status (admin)
   */
  async toggleStatus(id: string): Promise<ApiResponse<null>> {
    return apiService.patch<ApiResponse<null>>(API_CONFIG.ENDPOINTS.GOOGLE_REVIEW.TOGGLE_STATUS(id), {});
  }
}

export const reviewService = new ReviewService();
