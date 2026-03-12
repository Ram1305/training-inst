import { API_CONFIG } from '../config/api.config.ts';

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseURL}${normalizedEndpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      credentials: 'include',
    };

    try {
      const response = await fetch(url, config);
      const text = await response.text();

      if (!response.ok) {
        let message = 'An error occurred';
        let body: {
          message?: string;
          Message?: string;
          detail?: string;
          Detail?: string;
          title?: string;
          Title?: string;
          errors?: string[] | Record<string, string[]>;
        } = {};
        try {
          body = text ? JSON.parse(text) : {};
          // Prefer our API shape (message/Message), then ProblemDetails (detail/title), then errors array
          const apiMessage = body.message ?? body.Message;
          const problemDetail = body.detail ?? body.Detail;
          const problemTitle = body.title ?? body.Title;
          const errorsArr = Array.isArray(body.errors)
            ? body.errors
            : body.errors && typeof body.errors === 'object'
              ? (Object.values(body.errors).flat() as string[])
              : [];
          const errorsStr = errorsArr.length > 0 ? errorsArr.join(', ') : '';
          message =
            apiMessage ??
            problemDetail ??
            problemTitle ??
            (errorsStr || (text || response.statusText || message));
        } catch {
          message = text || response.statusText || message;
        }
        const err = new Error(message) as Error & { responseBody?: typeof body };
        err.responseBody = body;
        throw err;
      }

      if (text.trim() === '') {
        return {} as T;
      }
      try {
        return JSON.parse(text) as T;
      } catch {
        throw new Error('Invalid JSON in response');
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
    });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

export const apiService = new ApiService();