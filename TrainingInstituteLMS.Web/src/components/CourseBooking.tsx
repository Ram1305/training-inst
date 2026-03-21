// src/components/CourseBooking.tsx
import { useState, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  CreditCard,
  Building2,
  Eye,
  EyeOff,
  Search,
  Menu,
  X,
  CheckCircle,
  Loader2,
  Phone,
  Mail,
  Shield,
  MapPin,
  Users,
  Award,
  Lock,
  AlertCircle,
  Calendar,
  Clock,
  Check,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ResourcesDropdown } from "./ui/ResourcesDropdown";
import { PublicHeader } from "./layout/PublicHeader";
import { PaymentSuccessCard } from "./PaymentSuccessCard";
import { PaymentFailureCard } from "./PaymentFailureCard";
import { getCalendarDateKeyInAustralia, formatAustraliaCivilDateHeading } from "../utils/australiaTime";
import { courseDateService } from "../services/courseDate.service";
import { enrollmentService } from "../services/enrollment.service";
import { paymentService } from "../services/payment.service";
import { gtagEvent } from "../lib/gtag";
import type { CourseDateSimple } from "../services/courseDate.service";
import logoImage from '/assets/SafetyTrainingAcademylogo.png';

interface CourseBookingProps {
  courseId?: string;
  courseName?: string;
  courseCode?: string;
  coursePrice?: number;
  experienceType?: 'with' | 'without';
  onBack: () => void;
  onBookingSuccess?: (data: { userId: string; studentId: string; email: string }) => void;
  onAbout?: () => void;
  onContact?: () => void;
  onBookNow?: () => void;
  onForms?: () => void;
  onFeesRefund?: () => void;
  onGallery?: () => void;
  onLogin?: () => void;
  onRegister?: () => void;
  onVOC?: () => void;
  onViewCourses?: () => void;
}

type PaymentMethod = "bank" | "card";

export function CourseBooking({
  courseId = "1",
  courseName = "C0 Licence to operate a Slewing Mobile Crane (over 100 tonnes) + CT Licence to operate a Tower Crane",
  courseCode = "TLILIC0002, CPCCTC4001",
  coursePrice = 500.0,
  experienceType,
  onBack,
  onBookingSuccess,
  onAbout,
  onContact,
  onForms,
  onFeesRefund,
  onGallery,
  onBookNow,
  onLogin,
  onRegister,
  onVOC,
  onViewCourses,
}: CourseBookingProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank");
  const [showPassword, setShowPassword] = useState(false);
  const [paymentSlip, setPaymentSlip] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [courseDates, setCourseDates] = useState<CourseDateSimple[]>([]);
  const [selectedCourseDate, setSelectedCourseDate] = useState<string>("");
  const [loadingDates, setLoadingDates] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    transactionId: "",
  });
  
  // Credit card form data
  const [cardData, setCardData] = useState({
    cardName: "",
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
  });
  const [cardType, setCardType] = useState<"visa" | "mastercard" | "amex" | "unknown">("unknown");
  
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showAllCourseDates, setShowAllCourseDates] = useState(false);

  // Group course dates by calendar date; multiple slots per day sort by start/end time.
  const courseDatesByDate = useMemo(() => {
    const slotSortMs = (d: CourseDateSimple) => {
      const day = getCalendarDateKeyInAustralia(d.scheduledDate) || d.scheduledDate.split("T")[0];
      if (d.startTime?.trim()) {
        const t = d.startTime.length <= 5 ? `${d.startTime}:00` : d.startTime;
        const ms = new Date(`${day}T${t}`).getTime();
        if (!Number.isNaN(ms)) return ms;
      }
      const ms = new Date(d.scheduledDate).getTime();
      return Number.isNaN(ms) ? 0 : ms;
    };
    const slotEndSortMs = (d: CourseDateSimple) => {
      const day = getCalendarDateKeyInAustralia(d.scheduledDate) || d.scheduledDate.split("T")[0];
      if (d.endTime?.trim()) {
        const t = d.endTime.length <= 5 ? `${d.endTime}:00` : d.endTime;
        const ms = new Date(`${day}T${t}`).getTime();
        if (!Number.isNaN(ms)) return ms;
      }
      return slotSortMs(d);
    };
    const byDate = courseDates.reduce<Record<string, CourseDateSimple[]>>((acc, d) => {
      const datePart = getCalendarDateKeyInAustralia(d.scheduledDate);
      if (!datePart) return acc;
      if (!acc[datePart]) acc[datePart] = [];
      acc[datePart].push(d);
      return acc;
    }, {});
    return Object.keys(byDate)
      .sort()
      .map((dateKey) => ({
        dateKey,
        dates: [...byDate[dateKey]].sort((a, b) => {
          const byStart = slotSortMs(a) - slotSortMs(b);
          if (byStart !== 0) return byStart;
          return slotEndSortMs(a) - slotEndSortMs(b);
        }),
      }));
  }, [courseDates]);

  // Fetch available course dates
  useEffect(() => {
    const fetchCourseDates = async () => {
      if (!courseId) return;
      
      setLoadingDates(true);
      try {
        const response = await courseDateService.getCourseDatesForCourse(courseId, true);
        if (response.success && response.data) {
          setCourseDates(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch course dates:", error);
      } finally {
        setLoadingDates(false);
      }
    };

    fetchCourseDates();
  }, [courseId]);

  // Detect card type when card number changes
  useEffect(() => {
    if (cardData.cardNumber) {
      const detected = paymentService.detectCardType(cardData.cardNumber);
      setCardType(detected);
    } else {
      setCardType("unknown");
    }
  }, [cardData.cardNumber]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (file.size > maxSize) {
        setError("File size must be less than 10MB");
        return;
      }
      
      setPaymentSlip(file);
      setError(null);
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = paymentService.formatCardNumber(e.target.value);
    if (formatted.replace(/\s/g, "").length <= 19) {
      setCardData({ ...cardData, cardNumber: formatted });
      if (validationErrors.cardNumber) {
        setValidationErrors({ ...validationErrors, cardNumber: "" });
      }
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      errors.fullName = "Full name is required";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (!selectedCourseDate) {
      errors.courseDate = "Please select a course date";
    }

    if (paymentMethod === "bank") {
      if (!formData.transactionId.trim()) {
        errors.transactionId = "Transaction ID is required";
      }

      if (!paymentSlip) {
        errors.paymentSlip = "Payment slip is required";
      }
    }

    if (paymentMethod === "card") {
      if (!cardData.cardName.trim()) {
        errors.cardName = "Name on card is required";
      }

      const cleanCardNumber = paymentService.getCleanCardNumber(cardData.cardNumber);
      if (!cleanCardNumber) {
        errors.cardNumber = "Card number is required";
      } else if (!paymentService.validateCardNumber(cleanCardNumber)) {
        errors.cardNumber = "Please enter a valid card number";
      }

      if (!cardData.expiryMonth) {
        errors.expiryMonth = "Expiry month is required";
      }

      if (!cardData.expiryYear) {
        errors.expiryYear = "Expiry year is required";
      }

      if (cardData.expiryMonth && cardData.expiryYear) {
        if (!paymentService.validateExpiry(cardData.expiryMonth, cardData.expiryYear)) {
          errors.expiryMonth = "Card has expired";
        }
      }

      const cvvLength = paymentService.getCvvLength(cardType);
      if (!cardData.cvv) {
        errors.cvv = "CVV is required";
      } else if (cardData.cvv.length !== cvvLength) {
        errors.cvv = `CVV must be ${cvvLength} digits`;
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (paymentMethod === "card") {
        // Process credit card payment
        const result = await paymentService.processCardPayment({
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          password: formData.password,
          courseId: courseId,
          selectedCourseDateId: selectedCourseDate,
          amountCents: Math.round(coursePrice * 100), // Convert to cents
          currency: "AUD",
          cardName: cardData.cardName.trim(),
          cardNumber: paymentService.getCleanCardNumber(cardData.cardNumber),
          expiryMonth: cardData.expiryMonth,
          expiryYear: cardData.expiryYear,
          cvv: cardData.cvv,
        });

        if (result.success && result.data) {
          setSuccess("Payment successful! Course booked. Redirecting to your student portal...");
          
          const bookingData = result.data;

          gtagEvent("ads_conversion_purchase_New_web", {
            method: "card",
            course_id: courseId,
            value: coursePrice,
            currency: "AUD",
            transaction_id: bookingData.transactionId,
          });
          
          // Store full name temporarily for the auth context
          const tempUserData = {
            fullName: formData.fullName.trim(),
            userId: bookingData.userId,
            studentId: bookingData.studentId,
            email: bookingData.email,
          };
          localStorage.setItem('tempUserData', JSON.stringify(tempUserData));
          
          // Wait a moment to show success message, then redirect
          setTimeout(() => {
            // Clear form
            setFormData({
              fullName: "",
              email: "",
              phone: "",
              password: "",
              transactionId: "",
            });
            setCardData({
              cardName: "",
              cardNumber: "",
              expiryMonth: "",
              expiryYear: "",
              cvv: "",
            });
            setSelectedCourseDate("");

            // Callback for parent component to redirect to portal
            if (onBookingSuccess && bookingData.userId && bookingData.studentId && bookingData.email) {
              onBookingSuccess({
                userId: bookingData.userId,
                studentId: bookingData.studentId,
                email: bookingData.email,
              });
            }
          }, 1500);
        } else {
          // Use errorMessages or message from the API response
          const errorMsg = result.data?.errorMessages || result.message || result.errors?.join(", ") || "Payment failed. Please try again.";
          setError(errorMsg);
        }
      } else {
        // Bank transfer payment (existing logic)
        const result = await enrollmentService.bookCourse({
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          password: formData.password,
          courseId: courseId,
          selectedCourseDateId: selectedCourseDate,
          transactionId: formData.transactionId.trim(),
          amountPaid: coursePrice,
          receiptFile: paymentSlip!,
          paymentMethod: "Bank Transfer",
          bankName: "Commonwealth Bank Australia",
        });

        if (result.success && result.data) {
          setSuccess("Course booked successfully! Redirecting to your student portal...");
          
          const bookingData = result.data;
          
          // Store full name temporarily for the auth context
          const tempUserData = {
            fullName: formData.fullName.trim(),
            userId: bookingData.userId,
            studentId: bookingData.studentId,
            email: bookingData.email,
          };
          localStorage.setItem('tempUserData', JSON.stringify(tempUserData));
          
          // Wait a moment to show success message, then redirect
          setTimeout(() => {
            // Clear form
            setFormData({
              fullName: "",
              email: "",
              phone: "",
              password: "",
              transactionId: "",
            });
            setSelectedCourseDate("");
            setPaymentSlip(null);

            // Callback for parent component to redirect to portal
            if (onBookingSuccess) {
              onBookingSuccess({
                userId: bookingData.userId,
                studentId: bookingData.studentId,
                email: bookingData.email,
              });
            }
          }, 1500);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate year options for expiry (current year + 10 years)
  const currentYear = new Date().getFullYear() % 100;
  const yearOptions = Array.from({ length: 11 }, (_, i) => {
    const year = currentYear + i;
    return year.toString().padStart(2, "0");
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader
        onBack={onBack}
        onLogin={onLogin}
        onRegister={onRegister}
        onAbout={onAbout}
        onContact={onContact}
        onBookNow={onBookNow}
        onForms={onForms}
        onFeesRefund={onFeesRefund}
        onGallery={onGallery}
        onVOC={onVOC}
        onViewCourses={onViewCourses}
      />

      {/* Hero Section with Search */}
      <div className="relative bg-gradient-to-r from-cyan-500 to-blue-600 py-16 px-4">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=1920')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="relative max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">Book Online</h1>
          <div className="flex gap-3 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search Courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 rounded-full text-lg border-0 shadow-xl"
              />
            </div>
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-white h-14 px-8 rounded-full shadow-xl font-semibold">
              Search Courses
            </Button>
          </div>
        </div>
      </div>

      {/* Booking Form Section */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-cyan-500 mb-2">Booking Form</h2>
          <div className="w-20 h-1 bg-cyan-500 mx-auto"></div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {/* Success Message */}
          {success && (
            <PaymentSuccessCard
              title="Booking Successful!"
              message="Payment successful! Course booked. Redirecting to your student portal..."
              isRedirecting={true}
              redirectLabel="Taking you to your student portal..."
              className="mb-6"
            />
          )}

          {/* Payment error - single instance for both bank and card */}
          {error && (
            <PaymentFailureCard
              message={error}
              onDismiss={() => setError(null)}
              onRetry={() => setError(null)}
              retryLabel="Try again"
              className="mb-6"
            />
          )}

          {!success && (
            <>
          <p className="text-sm text-gray-600 mb-8">
            <span className="text-red-500">*</span> indicates required fields
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Course Information Display */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Course Name: {courseName}
              </h3>
              <p className="text-gray-600">Code: {courseCode}</p>
              {experienceType && (
                <div className="mt-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                    experienceType === 'with' 
                      ? 'bg-green-100 text-green-800 border border-green-300' 
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}>
                    {experienceType === 'with' ? '✓ With Experience' : '✗ Without Experience'}
                  </span>
                </div>
              )}
            </div>

            {/* Total Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Total</label>
              <div className="bg-gray-100 rounded-lg p-4 text-xl font-bold text-gray-900">
                $ {coursePrice.toFixed(2)}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <Input
                type="text"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(e) => {
                  setFormData({ ...formData, fullName: e.target.value });
                  if (validationErrors.fullName) {
                    setValidationErrors({ ...validationErrors, fullName: "" });
                  }
                }}
                className={`h-12 bg-gray-50 border-gray-300 rounded-lg ${validationErrors.fullName ? 'border-red-500' : ''}`}
                disabled={isSubmitting}
              />
              {validationErrors.fullName && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.fullName}</p>
              )}
            </div>

            {/* Email and Phone */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email<span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (validationErrors.email) {
                      setValidationErrors({ ...validationErrors, email: "" });
                    }
                  }}
                  className={`h-12 bg-gray-50 border-gray-300 rounded-lg ${validationErrors.email ? 'border-red-500' : ''}`}
                  disabled={isSubmitting}
                />
                {validationErrors.email && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone<span className="text-red-500">*</span>
                </label>
                <Input
                  type="tel"
                  placeholder="+61 xxx xxx xxx"
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData({ ...formData, phone: e.target.value });
                    if (validationErrors.phone) {
                      setValidationErrors({ ...validationErrors, phone: "" });
                    }
                  }}
                  className={`h-12 bg-gray-50 border-gray-300 rounded-lg ${validationErrors.phone ? 'border-red-500' : ''}`}
                  disabled={isSubmitting}
                />
                {validationErrors.phone && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.phone}</p>
                )}
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a secure password"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    if (validationErrors.password) {
                      setValidationErrors({ ...validationErrors, password: "" });
                    }
                  }}
                  className={`h-12 bg-gray-50 border-gray-300 rounded-lg pr-12 ${validationErrors.password ? 'border-red-500' : ''}`}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {validationErrors.password && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.password}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
            </div>

            {/* Course Date Selection - Grid view */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Course Date<span className="text-red-500">*</span>
              </label>
              {loadingDates ? (
                <div className="w-full min-h-[140px] bg-gray-50 border border-gray-200 rounded-xl px-6 flex items-center justify-center text-gray-500">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  Loading available dates...
                </div>
              ) : courseDates.length === 0 ? (
                <div className="w-full min-h-[120px] bg-amber-50 border border-amber-200 rounded-xl px-6 flex items-center text-amber-700 text-sm">
                  No available dates for this course at the moment. Please contact us for more information.
                </div>
              ) : (
                <div
                  className={`space-y-4 p-4 rounded-xl border-2 transition-colors ${
                    validationErrors.courseDate ? "border-red-400 bg-red-50/30" : "border-gray-200 bg-gray-50/50"
                  }`}
                >
                  {(showAllCourseDates ? courseDatesByDate : courseDatesByDate.slice(0, 4)).map(({ dateKey, dates }) => (
                    <div key={dateKey} className="flex flex-col items-center w-full">
                      <p className="text-sm font-semibold text-gray-700 mb-2 text-center">
                        {formatAustraliaCivilDateHeading(dateKey)}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 justify-items-center w-full max-w-4xl mx-auto">
                        {dates.map((date) => {
                          const isSelected = selectedCourseDate === date.courseDateId;
                          const isDisabled = isSubmitting || !date.isAvailable;
                          return (
                            <button
                                key={date.courseDateId}
                                type="button"
                                disabled={isDisabled}
                                onClick={() => {
                                  if (isDisabled) return;
                                  setSelectedCourseDate(date.courseDateId);
                                  if (validationErrors.courseDate) {
                                    setValidationErrors({ ...validationErrors, courseDate: "" });
                                  }
                                }}
                                className={`
                                  relative text-left rounded-xl border-2 p-4 transition-all duration-200 w-full max-w-sm
                                  focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2
                                  ${isSelected
                                    ? "border-cyan-500 bg-cyan-50 shadow-md shadow-cyan-100/50"
                                    : "border-gray-200 bg-white hover:border-cyan-300 hover:bg-cyan-50/50 hover:shadow-sm"
                                  }
                                  ${isDisabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
                                `}
                              >
                              {isSelected && (
                                <span className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-white border-2 border-slate-800 text-black">
                                  <Check className="h-3.5 w-3.5 text-black" strokeWidth={2.5} />
                                </span>
                              )}
                              <div className="flex items-start gap-3 pr-8">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-100 text-cyan-600">
                                  <Calendar className="h-5 w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="min-h-8 flex items-center">
                                    {(date.startTime || date.endTime) ? (
                                      <p className="flex items-center gap-1 text-sm font-medium text-gray-900">
                                        <Clock className="h-3.5 w-3.5 shrink-0" />
                                        {date.startTime && date.endTime
                                          ? `${date.startTime} – ${date.endTime}`
                                          : date.startTime || date.endTime || ""}
                                      </p>
                                    ) : (
                                      <p className="text-sm font-medium text-gray-500">All day</p>
                                    )}
                                  </div>
                                  <div className="min-h-6 mt-1 flex items-center">
                                    {date.location && date.location.toLowerCase() !== "face to face" && (
                                      <p className="flex items-center gap-1 text-sm text-gray-500 truncate" title={date.location}>
                                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                                        {date.location}
                                      </p>
                                    )}
                                  </div>
                                  <div className="min-h-6 flex items-center mt-1.5">
                                    {date.availableSpots !== undefined && (
                                      <p className="text-xs font-medium text-cyan-600">
                                        {date.availableSpots > 0 ? `${date.availableSpots} spot${date.availableSpots === 1 ? "" : "s"} left` : "Fully booked"}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {courseDatesByDate.length > 4 && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAllCourseDates((prev) => !prev)}
                        className="text-sm font-medium text-cyan-600 hover:text-cyan-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 rounded px-1"
                      >
                        {showAllCourseDates
                          ? "Show less"
                          : `Show more dates (${courseDatesByDate.length - 4} more)`}
                      </button>
                    </div>
                  )}
                </div>
              )}
              {validationErrors.courseDate && (
                <p className="text-red-500 text-sm mt-2">{validationErrors.courseDate}</p>
              )}
            </div>

            {/* Payment Methods */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Payment methods <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="bank"
                    checked={paymentMethod === "bank"}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-5 h-5 text-cyan-500 focus:ring-cyan-500"
                    disabled={isSubmitting}
                  />
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-700">Bank Transfer</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === "card"}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-5 h-5 text-cyan-500 focus:ring-cyan-500"
                    disabled={isSubmitting}
                  />
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-700">Credit Card</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Bank Details - Show only for Bank Transfer */}
            <AnimatePresence>
              {paymentMethod === "bank" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <h4 className="font-bold text-gray-900 mb-5 underline text-base">
                      Details for Deposit:
                    </h4>
                    <div className="space-y-3.5 text-base">
                      <div className="flex">
                        <span className="font-semibold text-gray-700 w-44">Bank Name:</span>
                        <span className="text-gray-900 ml-2">Commonwealth Bank</span>
                      </div>
                      <div className="flex">
                        <span className="font-semibold text-gray-700 w-44">Account Name:</span>
                        <span className="text-gray-900 ml-2">AIET College</span>
                      </div>
                      <div className="flex">
                        <span className="font-semibold text-gray-700 w-44">Account Number:</span>
                        <span className="text-gray-900 font-mono ml-2">10490235</span>
                      </div>
                      <div className="flex">
                        <span className="font-semibold text-gray-700 w-44">Bank BSB:</span>
                        <span className="text-gray-900 font-mono ml-2">062 141</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Transaction ID - Show only for Bank Transfer */}
            <AnimatePresence>
              {paymentMethod === "bank" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transaction ID / Reference<span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter your bank transaction ID"
                    value={formData.transactionId}
                    onChange={(e) => {
                      setFormData({ ...formData, transactionId: e.target.value });
                      if (validationErrors.transactionId) {
                        setValidationErrors({ ...validationErrors, transactionId: "" });
                      }
                    }}
                    className={`h-12 bg-gray-50 border-gray-300 rounded-lg ${validationErrors.transactionId ? 'border-red-500' : ''}`}
                    disabled={isSubmitting}
                  />
                  {validationErrors.transactionId && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.transactionId}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Payment Slip Upload - Show only for Bank Transfer */}
            <AnimatePresence>
              {paymentMethod === "bank" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attach the payment slip <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf,.gif"
                      onChange={handleFileChange}
                      className="hidden"
                      id="payment-slip"
                      disabled={isSubmitting}
                    />
                    <label
                      htmlFor="payment-slip"
                      className={`flex items-center justify-between w-full h-14 border-2 rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition-all px-4 ${validationErrors.paymentSlip ? 'border-red-500' : 'border-gray-300'}`}
                    >
                      <span className="text-gray-500">
                        {paymentSlip ? paymentSlip.name : "No file chosen"}
                      </span>
                      <span className="bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm font-medium">
                        Choose File
                      </span>
                    </label>
                  </div>
                  {validationErrors.paymentSlip && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.paymentSlip}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Accepted file types: jpg, gif, png, pdf, jpeg. Max. file size: 10 MB.
                  </p>

                </motion.div>
              )}
            </AnimatePresence>

            {/* Credit Card Form - Show only for Card Payment */}
            <AnimatePresence>
              {paymentMethod === "card" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name on Card<span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="JOHN SMITH"
                      value={cardData.cardName}
                      onChange={(e) => {
                        setCardData({ ...cardData, cardName: e.target.value.toUpperCase() });
                        if (validationErrors.cardName) {
                          setValidationErrors({ ...validationErrors, cardName: "" });
                        }
                      }}
                      className={`h-12 bg-gray-50 border-gray-300 rounded-lg ${validationErrors.cardName ? 'border-red-500' : ''}`}
                      disabled={isSubmitting}
                    />
                    {validationErrors.cardName && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.cardName}</p>
                    )}
                  </div>

                  {/* Card Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Card Number<span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="4111 1111 1111 1111"
                        value={cardData.cardNumber}
                        onChange={handleCardNumberChange}
                        className={`h-12 bg-gray-50 border-gray-300 rounded-lg pr-16 ${validationErrors.cardNumber ? 'border-red-500' : ''}`}
                        disabled={isSubmitting}
                        maxLength={23}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {cardType === "visa" && (
                          <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-[8px] font-bold">VISA</div>
                        )}
                        {cardType === "mastercard" && (
                          <div className="w-10 h-6 bg-gradient-to-r from-red-500 to-yellow-500 rounded flex items-center justify-center">
                            <div className="w-3 h-3 bg-red-500 rounded-full opacity-80"></div>
                            <div className="w-3 h-3 bg-yellow-500 rounded-full opacity-80 -ml-1"></div>
                          </div>
                        )}
                        {cardType === "amex" && (
                          <div className="w-10 h-6 bg-blue-400 rounded flex items-center justify-center text-white text-[7px] font-bold">AMEX</div>
                        )}
                        {cardType === "unknown" && cardData.cardNumber && (
                          <CreditCard className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                    {validationErrors.cardNumber && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.cardNumber}</p>
                    )}
                  </div>

                  {/* Expiry and CVV */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expiry Month<span className="text-red-500">*</span>
                      </label>
                      <select
                        value={cardData.expiryMonth}
                        onChange={(e) => {
                          setCardData({ ...cardData, expiryMonth: e.target.value });
                          if (validationErrors.expiryMonth) {
                            setValidationErrors({ ...validationErrors, expiryMonth: "" });
                          }
                        }}
                        className={`w-full h-12 bg-gray-50 border border-gray-300 rounded-lg px-4 text-gray-700 ${validationErrors.expiryMonth ? 'border-red-500' : ''}`}
                        disabled={isSubmitting}
                      >
                        <option value="">MM</option>
                        {Array.from({ length: 12 }, (_, i) => {
                          const month = (i + 1).toString().padStart(2, "0");
                          return (
                            <option key={month} value={month}>
                              {month}
                            </option>
                          );
                        })}
                      </select>
                      {validationErrors.expiryMonth && (
                        <p className="text-red-500 text-sm mt-1">{validationErrors.expiryMonth}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expiry Year<span className="text-red-500">*</span>
                      </label>
                      <select
                        value={cardData.expiryYear}
                        onChange={(e) => {
                          setCardData({ ...cardData, expiryYear: e.target.value });
                          if (validationErrors.expiryYear) {
                            setValidationErrors({ ...validationErrors, expiryYear: "" });
                          }
                        }}
                        className={`w-full h-12 bg-gray-50 border border-gray-300 rounded-lg px-4 text-gray-700 ${validationErrors.expiryYear ? 'border-red-500' : ''}`}
                        disabled={isSubmitting}
                      >
                        <option value="">YY</option>
                        {yearOptions.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                      {validationErrors.expiryYear && (
                        <p className="text-red-500 text-sm mt-1">{validationErrors.expiryYear}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CVV<span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Input
                          type="password"
                          placeholder={cardType === "amex" ? "••••" : "•••"}
                          value={cardData.cvv}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "");
                            const maxLength = paymentService.getCvvLength(cardType);
                            if (value.length <= maxLength) {
                              setCardData({ ...cardData, cvv: value });
                              if (validationErrors.cvv) {
                                setValidationErrors({ ...validationErrors, cvv: "" });
                              }
                            }
                          }}
                          className={`h-12 bg-gray-50 border-gray-300 rounded-lg ${validationErrors.cvv ? 'border-red-500' : ''}`}
                          disabled={isSubmitting}
                          maxLength={cardType === "amex" ? 4 : 3}
                        />
                        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </div>
                      {validationErrors.cvv && (
                        <p className="text-red-500 text-sm mt-1">{validationErrors.cvv}</p>
                      )}
                    </div>
                  </div>

                  {/* Accepted Cards */}
                  <div className="flex items-center gap-3 pt-2">
                    <span className="text-xs text-gray-500">We accept:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-[8px] font-bold">VISA</div>
                      <div className="w-10 h-6 bg-gradient-to-r from-red-500 to-yellow-500 rounded flex items-center justify-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full opacity-80"></div>
                        <div className="w-3 h-3 bg-yellow-500 rounded-full opacity-80 -ml-1"></div>
                      </div>
                      <div className="w-10 h-6 bg-blue-400 rounded flex items-center justify-center text-white text-[7px] font-bold">AMEX</div>
                    </div>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <div className="pt-6">
              <Button
                type="submit"
                className="w-full md:w-auto bg-cyan-500 hover:bg-cyan-600 text-white h-14 px-12 rounded-full text-lg font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting || (courseDates.length === 0 && !loadingDates)}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {paymentMethod === "card" ? "Processing Payment..." : "Processing..."}
                  </>
                ) : paymentMethod === "card" ? (
                  <>
                    <Lock className="w-5 h-5 mr-2" />
                    Pay ${coursePrice.toFixed(2)} & Book Now
                  </>
                ) : (
                  "Book Now"
                )}
              </Button>
            </div>
          </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
