import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle, Loader2, CreditCard, Building2, Lock, Shield } from 'lucide-react';
import { PaymentUpload } from './PaymentUpload';
import { paymentService, type ProcessCardPaymentExistingStudentRequest } from '../../services/payment.service';
import type { StudentBrowseCourse } from '../../services/enrollment.service';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface EnrollmentPaymentModalProps {
  course: StudentBrowseCourse;
  selectedDateId: string | undefined;
  studentId: string;
  onBankTransferSubmit: (file: File, transactionId: string) => Promise<void>;
  onCreditCardSuccess: () => void;
  onCancel: () => void;
}

const yearOptions = Array.from({ length: 11 }, (_, i) => {
  const y = new Date().getFullYear() % 100;
  return (y + i).toString().padStart(2, '0');
});

export function EnrollmentPaymentModal({
  course,
  selectedDateId,
  studentId,
  onBankTransferSubmit,
  onCreditCardSuccess,
  onCancel,
}: EnrollmentPaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'card'>('bank_transfer');
  const [cardData, setCardData] = useState({
    cardName: '',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
  });
  const [cardType, setCardType] = useState<'visa' | 'mastercard' | 'amex' | 'unknown'>('unknown');
  const [cardValidationErrors, setCardValidationErrors] = useState<Record<string, string>>({});
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  useEffect(() => {
    if (cardData.cardNumber) {
      const detected = paymentService.detectCardType(cardData.cardNumber);
      setCardType(detected);
    } else {
      setCardType('unknown');
    }
  }, [cardData.cardNumber]);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = paymentService.formatCardNumber(e.target.value);
    if (formatted.replace(/\s/g, '').length <= 19) {
      setCardData({ ...cardData, cardNumber: formatted });
      if (cardValidationErrors.cardNumber) {
        setCardValidationErrors({ ...cardValidationErrors, cardNumber: '' });
      }
    }
  };

  const validateCardPayment = (): boolean => {
    const errors: Record<string, string> = {};

    if (!selectedDateId) {
      errors.date = 'Please select a course date before paying by credit card';
    }

    if (!cardData.cardName.trim()) {
      errors.cardName = 'Name on card is required';
    }

    const cleanCardNumber = paymentService.getCleanCardNumber(cardData.cardNumber);
    if (!cleanCardNumber) {
      errors.cardNumber = 'Card number is required';
    } else if (!paymentService.validateCardNumber(cleanCardNumber)) {
      errors.cardNumber = 'Please enter a valid card number';
    }

    if (!cardData.expiryMonth) {
      errors.expiryMonth = 'Expiry month is required';
    }

    if (!cardData.expiryYear) {
      errors.expiryYear = 'Expiry year is required';
    }

    if (cardData.expiryMonth && cardData.expiryYear) {
      if (!paymentService.validateExpiry(cardData.expiryMonth, cardData.expiryYear)) {
        errors.expiryMonth = 'Card has expired';
      }
    }

    const cvvLength = paymentService.getCvvLength(cardType);
    if (!cardData.cvv) {
      errors.cvv = 'CVV is required';
    } else if (cardData.cvv.length !== cvvLength) {
      errors.cvv = `CVV must be ${cvvLength} digits`;
    }

    setCardValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreditCardSubmit = async () => {
    if (!validateCardPayment() || !selectedDateId) return;

    setPaymentProcessing(true);
    setPaymentError(null);

    try {
      const request: ProcessCardPaymentExistingStudentRequest = {
        studentId,
        courseId: course.courseId,
        selectedCourseDateId: selectedDateId,
        amountCents: Math.round((course.price ?? 0) * 100),
        currency: 'AUD',
        cardName: cardData.cardName.trim(),
        cardNumber: paymentService.getCleanCardNumber(cardData.cardNumber),
        expiryMonth: cardData.expiryMonth,
        expiryYear: cardData.expiryYear,
        cvv: cardData.cvv,
      };

      const result = await paymentService.processCardPaymentExistingStudent(request);

      if (result.success && result.data) {
        onCreditCardSuccess();
      } else {
        const errorMsg =
          result.data?.errorMessages ||
          result.message ||
          result.errors?.join(', ') ||
          'Payment failed. Please try again.';
        setPaymentError(errorMsg);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Payment failed. Please try again.';
      setPaymentError(errorMsg);
    } finally {
      setPaymentProcessing(false);
    }
  };

  // Bank Transfer: show PaymentUpload
  if (paymentMethod === 'bank_transfer') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Back to Courses
          </Button>
          <div className="flex gap-2">
            <Button variant="default" size="sm" onClick={() => setPaymentMethod('bank_transfer')}>
              <Building2 className="w-4 h-4 mr-1" />
              Bank Transfer
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPaymentMethod('card')}>
              <CreditCard className="w-4 h-4 mr-1" />
              Credit Card
            </Button>
          </div>
        </div>
        <PaymentUpload
          courseName={course.courseName}
          coursePrice={course.price ?? 0}
          onUpload={onBankTransferSubmit}
          onCancel={onCancel}
        />
      </div>
    );
  }

  // Credit Card: show card form
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Back to Courses
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPaymentMethod('bank_transfer');
              setPaymentError(null);
            }}
          >
            <Building2 className="w-4 h-4 mr-1" />
            Bank Transfer
          </Button>
          <Button variant="default" size="sm" onClick={() => setPaymentMethod('card')}>
            <CreditCard className="w-4 h-4 mr-1" />
            Credit Card
          </Button>
        </div>
      </div>

      <div>
        <h1 className="mb-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
          Payment Verification
        </h1>
        <p className="text-gray-600">Pay with credit card to complete enrollment</p>
      </div>

      {!selectedDateId && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Date Required</AlertTitle>
          <AlertDescription>
            Please go back and select a course date before paying by credit card.
          </AlertDescription>
        </Alert>
      )}

      {paymentError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Payment Failed</AlertTitle>
          <AlertDescription>{paymentError}</AlertDescription>
        </Alert>
      )}

      <Card className="border-violet-100">
        <CardHeader>
          <CardTitle>Course Enrollment Payment</CardTitle>
          <CardDescription>
            Complete payment for {course.courseName} - ${course.price}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gradient-to-r from-violet-50 to-fuchsia-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Course Name:</span>
              <span>{course.courseName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Course Fee:</span>
              <span className="text-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                ${course.price}
              </span>
            </div>
            {selectedDateId && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Payment:</span>
                <span className="text-green-600 font-medium">Credit Card - Instant verification</span>
              </div>
            )}
          </div>

          {/* Secure Payment Notice */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
              <Lock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-blue-800 font-semibold text-sm">Secure Payment</p>
              <p className="text-blue-600 text-xs">Your card details are encrypted and secure</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              <span className="text-xs text-gray-600 font-medium">PCI Compliant</span>
            </div>
          </div>

          {/* Card Name */}
          <div>
            <Label htmlFor="cardName">
              Name on Card <span className="text-red-500">*</span>
            </Label>
            <Input
              id="cardName"
              type="text"
              placeholder="JOHN SMITH"
              value={cardData.cardName}
              onChange={(e) => {
                setCardData({ ...cardData, cardName: e.target.value.toUpperCase() });
                if (cardValidationErrors.cardName) {
                  setCardValidationErrors({ ...cardValidationErrors, cardName: '' });
                }
              }}
              className={`mt-1 ${cardValidationErrors.cardName ? 'border-red-500' : ''}`}
              disabled={paymentProcessing || !selectedDateId}
            />
            {cardValidationErrors.cardName && (
              <p className="text-red-500 text-sm mt-1">{cardValidationErrors.cardName}</p>
            )}
          </div>

          {/* Card Number */}
          <div>
            <Label htmlFor="cardNumber">
              Card Number <span className="text-red-500">*</span>
            </Label>
            <div className="relative mt-1">
              <Input
                id="cardNumber"
                type="text"
                placeholder="4111 1111 1111 1111"
                value={cardData.cardNumber}
                onChange={handleCardNumberChange}
                className={`pr-16 ${cardValidationErrors.cardNumber ? 'border-red-500' : ''}`}
                disabled={paymentProcessing || !selectedDateId}
                maxLength={23}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {cardType === 'visa' && (
                  <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-[8px] font-bold">
                    VISA
                  </div>
                )}
                {cardType === 'mastercard' && (
                  <div className="w-10 h-6 bg-gradient-to-r from-red-500 to-yellow-500 rounded flex items-center justify-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full opacity-80"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full opacity-80 -ml-1"></div>
                  </div>
                )}
                {cardType === 'amex' && (
                  <div className="w-10 h-6 bg-blue-400 rounded flex items-center justify-center text-white text-[7px] font-bold">
                    AMEX
                  </div>
                )}
                {cardType === 'unknown' && cardData.cardNumber && (
                  <CreditCard className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>
            {cardValidationErrors.cardNumber && (
              <p className="text-red-500 text-sm mt-1">{cardValidationErrors.cardNumber}</p>
            )}
          </div>

          {/* Expiry and CVV */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="expiryMonth">
                Expiry Month <span className="text-red-500">*</span>
              </Label>
              <Select
                value={cardData.expiryMonth}
                onValueChange={(value) => {
                  setCardData({ ...cardData, expiryMonth: value });
                  if (cardValidationErrors.expiryMonth) {
                    setCardValidationErrors({ ...cardValidationErrors, expiryMonth: '' });
                  }
                }}
                disabled={paymentProcessing || !selectedDateId}
              >
                <SelectTrigger className={`mt-1 ${cardValidationErrors.expiryMonth ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="MM" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => {
                    const month = (i + 1).toString().padStart(2, '0');
                    return (
                      <SelectItem key={month} value={month}>
                        {month}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {cardValidationErrors.expiryMonth && (
                <p className="text-red-500 text-sm mt-1">{cardValidationErrors.expiryMonth}</p>
              )}
            </div>

            <div>
              <Label htmlFor="expiryYear">
                Expiry Year <span className="text-red-500">*</span>
              </Label>
              <Select
                value={cardData.expiryYear}
                onValueChange={(value) => {
                  setCardData({ ...cardData, expiryYear: value });
                  if (cardValidationErrors.expiryYear) {
                    setCardValidationErrors({ ...cardValidationErrors, expiryYear: '' });
                  }
                }}
                disabled={paymentProcessing || !selectedDateId}
              >
                <SelectTrigger className={`mt-1 ${cardValidationErrors.expiryYear ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="YY" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {cardValidationErrors.expiryYear && (
                <p className="text-red-500 text-sm mt-1">{cardValidationErrors.expiryYear}</p>
              )}
            </div>

            <div>
              <Label htmlFor="cvv">
                CVV <span className="text-red-500">*</span>
              </Label>
              <div className="relative mt-1">
                <Input
                  id="cvv"
                  type="password"
                  placeholder={cardType === 'amex' ? '????' : '???'}
                  value={cardData.cvv}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    const maxLength = paymentService.getCvvLength(cardType);
                    if (value.length <= maxLength) {
                      setCardData({ ...cardData, cvv: value });
                      if (cardValidationErrors.cvv) {
                        setCardValidationErrors({ ...cardValidationErrors, cvv: '' });
                      }
                    }
                  }}
                  className={cardValidationErrors.cvv ? 'border-red-500' : ''}
                  disabled={paymentProcessing || !selectedDateId}
                  maxLength={cardType === 'amex' ? 4 : 3}
                />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              {cardValidationErrors.cvv && (
                <p className="text-red-500 text-sm mt-1">{cardValidationErrors.cvv}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <span className="text-xs text-gray-500">We accept:</span>
            <div className="flex items-center gap-2">
              <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-[8px] font-bold">
                VISA
              </div>
              <div className="w-10 h-6 bg-gradient-to-r from-red-500 to-yellow-500 rounded flex items-center justify-center">
                <div className="w-3 h-3 bg-red-500 rounded-full opacity-80"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full opacity-80 -ml-1"></div>
              </div>
              <div className="w-10 h-6 bg-blue-400 rounded flex items-center justify-center text-white text-[7px] font-bold">
                AMEX
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onCancel} disabled={paymentProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleCreditCardSubmit}
            disabled={paymentProcessing || !selectedDateId}
            className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
          >
            {paymentProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Pay Now'
            )}
          </Button>
        </CardFooter>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> Your payment will be verified instantly. After payment, complete the LLND
          Assessment in your enrolled courses section.
        </AlertDescription>
      </Alert>
    </div>
  );
}
