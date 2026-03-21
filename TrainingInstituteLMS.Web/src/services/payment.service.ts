// src/services/payment.service.ts
import { apiService } from './api.service';
import { API_CONFIG } from '../config/api.config';

export interface ProcessCompanyBillingCardRequest {
  companyId: string;
  statementIds: string[];
  amountCents: number;
  currency?: string;
  cardName: string;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
}

export interface ProcessCardPaymentRequest {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  courseId: string;
  selectedCourseDateId: string;
  enrollmentCode?: string;
  amountCents: number;
  currency?: string;
  cardName: string;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
}

export interface ProcessCardPaymentExistingStudentRequest {
  studentId: string;
  courseId: string;
  selectedCourseDateId: string;
  amountCents: number;
  currency?: string;
  cardName: string;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
}

export interface CardPaymentResult {
  success: boolean;
  transactionId: number;
  responseCode?: string;
  responseMessage?: string;
  authorisationCode?: string;
  errorMessages?: string;
  amountPaidCents: number;
  amountPaid: number;
  invoiceNumber?: string;
  userId?: string;
  studentId?: string;
  enrollmentId?: string;
  studentName?: string;
  email?: string;
  courseName?: string;
  courseCode?: string;
  selectedDate?: string;
  paymentStatus?: string;
  enrollmentStatus?: string;
  bookedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

class PaymentService {
  /**
   * Process a credit card payment and create enrollment
   */
  async processCardPayment(
    request: ProcessCardPaymentRequest
  ): Promise<ApiResponse<CardPaymentResult>> {
    try {
      const result = await apiService.post<ApiResponse<CardPaymentResult>>(
        "/payment/process-card",
        {
          ...request,
          currency: request.currency || "AUD",
        }
      );
      return result;
    } catch (error: unknown) {
      const err = error as Error & { responseBody?: { message?: string; errors?: string[] } };
      const body = err?.responseBody;
      const message = body?.message ?? (error instanceof Error ? error.message : "Unknown error occurred");
      const errors = body?.errors?.length ? body.errors : [message];
      // Log so you can see the real reason for 400 in the console
      console.error("[Payment] process-card 400/error:", { message, errors, responseBody: body });
      return {
        success: false,
        message,
        errors,
      };
    }
  }

  /**
   * Process a credit card payment for an existing logged-in student and create enrollment
   */
  async processCompanyBillingCard(
    request: ProcessCompanyBillingCardRequest
  ): Promise<ApiResponse<CardPaymentResult>> {
    try {
      return await apiService.post<ApiResponse<CardPaymentResult>>(
        API_CONFIG.ENDPOINTS.PAYMENT.PROCESS_CARD_COMPANY_BILLING,
        {
          companyId: request.companyId,
          statementIds: request.statementIds.map((id) => id),
          amountCents: request.amountCents,
          currency: request.currency || 'AUD',
          cardName: request.cardName,
          cardNumber: request.cardNumber,
          expiryMonth: request.expiryMonth,
          expiryYear: request.expiryYear,
          cvv: request.cvv,
        }
      );
    } catch (error: unknown) {
      const err = error as Error & { responseBody?: { message?: string; errors?: string[] } };
      const body = err?.responseBody;
      const message = body?.message ?? (error instanceof Error ? error.message : 'Unknown error occurred');
      const errors = body?.errors?.length ? body.errors : [message];
      console.error('[Payment] company-billing card:', { message, errors, responseBody: body });
      return { success: false, message, errors };
    }
  }

  async processCardPaymentExistingStudent(
    request: ProcessCardPaymentExistingStudentRequest
  ): Promise<ApiResponse<CardPaymentResult>> {
    try {
      const result = await apiService.post<ApiResponse<CardPaymentResult>>(
        "/payment/process-card-existing-student",
        {
          ...request,
          currency: request.currency || "AUD",
        }
      );
      return result;
    } catch (error: unknown) {
      const err = error as Error & { responseBody?: { message?: string; errors?: string[] } };
      const body = err?.responseBody;
      const message = body?.message ?? (error instanceof Error ? error.message : "Unknown error occurred");
      const errors = body?.errors?.length ? body.errors : [message];
      console.error("[Payment] process-card-existing-student 400/error:", { message, errors, responseBody: body });
      return {
        success: false,
        message,
        errors,
      };
    }
  }

  /**
   * Health check for payment gateway
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return apiService.get<{ status: string; timestamp: string }>(
      "/payment/health"
    );
  }

  /**
   * Format card number with spaces for display (e.g., "4111 1111 1111 1111")
   */
  formatCardNumber(value: string): string {
    const cleaned = value.replace(/\D/g, "");
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(" ") : cleaned;
  }

  /**
   * Get the raw card number without spaces
   */
  getCleanCardNumber(value: string): string {
    return value.replace(/\D/g, "");
  }

  /**
   * Validate card number using Luhn algorithm
   */
  validateCardNumber(cardNumber: string): boolean {
    const cleaned = cardNumber.replace(/\D/g, "");
    if (cleaned.length < 13 || cleaned.length > 19) return false;

    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Detect card type from number
   */
  detectCardType(
    cardNumber: string
  ): "visa" | "mastercard" | "amex" | "unknown" {
    const cleaned = cardNumber.replace(/\D/g, "");

    if (/^4/.test(cleaned)) return "visa";
    if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) return "mastercard";
    if (/^3[47]/.test(cleaned)) return "amex";

    return "unknown";
  }

  /**
   * Get CVV length based on card type
   */
  getCvvLength(cardType: string): number {
    return cardType === "amex" ? 4 : 3;
  }

  /**
   * Validate expiry date
   */
  validateExpiry(month: string, year: string): boolean {
    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;

    const expMonth = parseInt(month, 10);
    const expYear = parseInt(year, 10);

    if (expMonth < 1 || expMonth > 12) return false;
    if (expYear < currentYear) return false;
    if (expYear === currentYear && expMonth < currentMonth) return false;

    return true;
  }
}

export const paymentService = new PaymentService();

export default paymentService;
