import { useState, useEffect } from "react";
import {
  CheckCircle,
  AlertCircle,
  Mail,
  Phone,
  User,
  MapPin,
  Calendar,
  Clock,
  Shield,
  CreditCard,
  Building,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Check,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Card, CardContent } from "../ui/card";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { PublicLayout } from "../layout/PublicLayout";
import { vocManagementService } from "../../services/vocManagement.service";
import { publicEnrollmentWizardService, type CourseDropdownItem, type CourseDateDropdownItem } from "../../services/publicEnrollmentWizard.service";

type Step = 'details' | 'courses' | 'payment' | 'success';

interface SelectedCourse {
  courseId: string;
  courseName: string;
  price: number;
  courseDateId?: string;
  courseDateDisplay?: string;
}

interface PublicVOCFormProps {
  onBack: () => void;
  onLogin?: () => void;
  onAbout?: () => void;
  onContact?: () => void;
  onBookNow?: () => void;
  onForms?: () => void;
  onFeesRefund?: () => void;
  onGallery?: () => void;
  onCourseDetails?: (courseId: string) => void;
  onVOC?: () => void;
}

export function PublicVOCForm({ onBack, onLogin, onAbout, onContact, onBookNow, onForms, onFeesRefund, onGallery, onCourseDetails, onVOC }: PublicVOCFormProps) {
  const [currentStep, setCurrentStep] = useState<Step>('details');
  const [loading, setLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    australianStudentId: "",
    streetAddress: "",
    city: "",
    state: "",
    postcode: "",
    comments: "",
  });

  // Course Data State
  const [availableCourses, setAvailableCourses] = useState<CourseDropdownItem[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<SelectedCourse[]>([]);
  const [courseDates, setCourseDates] = useState<Record<string, CourseDateDropdownItem[]>>({});
  const [currentSelectedCourseId, setCurrentSelectedCourseId] = useState<string>("");

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'CreditCard' | 'BankTransfer'>('CreditCard');
  const [cardData, setCardData] = useState({
    cardName: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await publicEnrollmentWizardService.getCoursesForDropdown();
      if (res.success) {
        setAvailableCourses(res.data);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const fetchDates = async (courseId: string) => {
    if (courseDates[courseId]) return;
    try {
      const res = await publicEnrollmentWizardService.getCourseDates(courseId);
      if (res.success) {
        setCourseDates(prev => ({ ...prev, [courseId]: res.data }));
      }
    } catch (error) {
      console.error("Error fetching dates:", error);
    }
  };

  const handleSendOTP = async () => {
    if (!formData.email) {
      toast.error("Please enter your email first");
      return;
    }
    setOtpLoading(true);
    try {
      const res = await vocManagementService.sendOTP(formData.email);
      if (res.success) {
        setOtpSent(true);
        toast.success("OTP sent to your email");
      } else {
        toast.error("Failed to send OTP. Please try again.");
      }
    } catch (error) {
      toast.error("Error sending OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      toast.error("Please enter the OTP");
      return;
    }
    setOtpLoading(true);
    try {
      const res = await vocManagementService.verifyOTP(formData.email, otp);
      if (res.success) {
        setEmailVerified(true);
        toast.success("Email verified successfully");
      } else {
        toast.error("Invalid OTP. Please check and try again.");
      }
    } catch (error) {
      toast.error("Error verifying OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleAddCourse = () => {
    const course = availableCourses.find(c => c.courseId === currentSelectedCourseId);
    if (course) {
      if (selectedCourses.some(sc => sc.courseId === course.courseId)) {
        toast.error("Course already added");
        return;
      }
      setSelectedCourses([...selectedCourses, {
        courseId: course.courseId,
        courseName: course.courseName,
        price: course.price
      }]);
      fetchDates(course.courseId);
      setCurrentSelectedCourseId("");
    }
  };

  const handleRemoveCourse = (courseId: string) => {
    setSelectedCourses(selectedCourses.filter(c => c.courseId !== courseId));
  };

  const handleDateSelect = (courseId: string, dateId: string) => {
    const dates = courseDates[courseId] || [];
    const date = dates.find(d => d.courseDateId === dateId);
    if (date) {
      const display = `${new Date(date.startDate).toLocaleDateString()} - ${new Date(date.endDate).toLocaleDateString()}`;
      setSelectedCourses(selectedCourses.map(c =>
        c.courseId === courseId ? { ...c, courseDateId: dateId, courseDateDisplay: display } : c
      ));
    }
  };

  const totalPrice = selectedCourses.reduce((sum, c) => sum + c.price, 0);

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await vocManagementService.submitVOC({
        ...formData,
        selectedCourses: selectedCourses.map(c => ({ courseId: c.courseId, courseDateId: c.courseDateId })),
        paymentMethod,
        totalAmount: totalPrice,
        transactionId: paymentMethod === 'CreditCard' ? "TRX_" + Math.random().toString(36).substring(7).toUpperCase() : undefined
      });

      if (res.success) {
        setCurrentStep('success');
        toast.success("VOC Submission Successful!");
      } else {
        toast.error(res.message || "Failed to submit VOC");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderStepIcon = (step: Step, label: string, index: number) => {
    const stepOrder: Step[] = ['details', 'courses', 'payment', 'success'];
    const currentIndex = stepOrder.indexOf(currentStep);
    const active = currentStep === step;
    const completed = currentIndex > index;

    return (
      <div className="flex flex-col items-center relative z-10">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${active ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30' :
            completed ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'
          }`}>
          {completed ? <Check className="w-5 h-5" /> : <span>{index + 1}</span>}
        </div>
        <span className={`text-[10px] uppercase font-bold mt-2 ${active ? 'text-cyan-600' : 'text-slate-400'}`}>
          {label}
        </span>
      </div>
    );
  };

  return (
    <PublicLayout
      onBack={onBack}
      onLogin={onLogin}
      onAbout={onAbout}
      onContact={onContact}
      onBookNow={onBookNow}
      onForms={onForms}
      onFeesRefund={onFeesRefund}
      onGallery={onGallery}
      onCourseDetails={onCourseDetails}
      onVOC={onVOC}
    >
      <div className="py-12 px-4 max-w-4xl mx-auto">
        {/* Progress Header */}
        <div className="relative mb-12">
          <div className="absolute top-5 left-0 w-full h-0.5 bg-slate-200 -z-0"></div>
          <div className="flex justify-between">
            {renderStepIcon('details', 'Your Details', 0)}
            {renderStepIcon('courses', 'Courses', 1)}
            {renderStepIcon('payment', 'Payment', 2)}
            {renderStepIcon('success', 'Done', 3)}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {currentStep === 'details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="bg-slate-900 p-6 text-white text-center">
                  <h1 className="text-2xl font-bold">VOC Renewal Form</h1>
                  <p className="text-slate-400 text-sm mt-2">Personal & Contact Information</p>
                </div>
                <CardContent className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">First Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          placeholder="John"
                          className="pl-10 h-11 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500/20"
                          value={formData.firstName}
                          onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Last Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          placeholder="Doe"
                          className="pl-10 h-11 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500/20"
                          value={formData.lastName}
                          onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-grow">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          type="email"
                          placeholder="john@example.com"
                          className={`pl-10 h-11 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500/20 ${emailVerified ? 'border-green-500 bg-green-50' : ''}`}
                          value={formData.email}
                          onChange={e => {
                            setFormData({ ...formData, email: e.target.value });
                            setEmailVerified(false);
                            setOtpSent(false);
                          }}
                          disabled={emailVerified}
                        />
                        {emailVerified && (
                          <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                        )}
                      </div>
                      {!emailVerified && (
                        <Button
                          onClick={handleSendOTP}
                          disabled={otpLoading || !formData.email}
                          className="h-11 bg-slate-900 hover:bg-slate-800 text-xs font-bold"
                        >
                          {otpSent ? 'Resend' : 'Send OTP'}
                        </Button>
                      )}
                    </div>
                  </div>

                  {otpSent && !emailVerified && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4"
                    >
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <Shield className="w-4 h-4 text-cyan-500" />
                        PLEASE ENTER THE 6-DIGIT CODE SENT TO YOUR EMAIL
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="123456"
                          className="h-11 text-center text-lg tracking-[1em] font-bold"
                          maxLength={6}
                          value={otp}
                          onChange={e => setOtp(e.target.value)}
                        />
                        <Button
                          onClick={handleVerifyOTP}
                          disabled={otpLoading || otp.length < 6}
                          className="h-11 bg-cyan-500 hover:bg-cyan-600 font-bold"
                        >
                          VERIFY
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          placeholder="0400 000 000"
                          className="pl-10 h-11 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500/20"
                          value={formData.phone}
                          onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Student ID / License #</Label>
                      <div className="relative">
                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          placeholder="AUS-123456"
                          className="pl-10 h-11 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500/20"
                          value={formData.australianStudentId}
                          onChange={e => setFormData({ ...formData, australianStudentId: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Street Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        placeholder="123 Example St"
                        className="pl-10 h-11 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500/20"
                        value={formData.streetAddress}
                        onChange={e => setFormData({ ...formData, streetAddress: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">City/Suburb</Label>
                      <Input
                        className="h-11 border-slate-200"
                        value={formData.city}
                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">State</Label>
                      <Select
                        value={formData.state}
                        onValueChange={v => setFormData({ ...formData, state: v })}
                      >
                        <SelectTrigger className="h-11 border-slate-200">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'].map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Postcode</Label>
                      <Input
                        className="h-11 border-slate-200"
                        maxLength={4}
                        value={formData.postcode}
                        onChange={e => setFormData({ ...formData, postcode: e.target.value })}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={() => setCurrentStep('courses')}
                    disabled={!emailVerified || !formData.firstName || !formData.lastName || !formData.phone}
                    className="w-full h-12 bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-sm uppercase tracking-widest rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    SELECT COURSES <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {currentStep === 'courses' && (
            <motion.div
              key="courses"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card className="border-none shadow-xl overflow-hidden">
                <div className="bg-slate-900 p-6 text-white text-center">
                  <h1 className="text-2xl font-bold">Course Selection</h1>
                  <p className="text-slate-400 text-sm mt-2">Select the courses you wish to renew</p>
                </div>
                <CardContent className="p-8 space-y-8">
                  {/* Select Course Dropdown */}
                  <div className="flex gap-4">
                    <div className="flex-grow space-y-2">
                      <Label className="text-xs font-bold text-slate-500">CHOOSE A COURSE</Label>
                      <Select value={currentSelectedCourseId} onValueChange={setCurrentSelectedCourseId}>
                        <SelectTrigger className="h-12 border-slate-200 text-base">
                          <SelectValue placeholder="Select a course to add..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {availableCourses.map(course => (
                            <SelectItem key={course.courseId} value={course.courseId}>
                              {course.courseName} - ${course.price}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={handleAddCourse}
                      disabled={!currentSelectedCourseId}
                      className="mt-8 h-12 w-12 rounded-xl bg-cyan-500"
                    >
                      <Plus className="w-6 h-6" />
                    </Button>
                  </div>

                  {/* Selected Courses List */}
                  <div className="space-y-4">
                    {selectedCourses.length === 0 ? (
                      <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                        <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">No courses selected yet</p>
                      </div>
                    ) : (
                      selectedCourses.map((course, idx) => (
                        <motion.div
                          key={course.courseId}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all group"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <h3 className="font-bold text-slate-800">{course.courseName}</h3>
                              </div>
                              <p className="text-cyan-600 font-bold text-sm">${course.price}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveCourse(course.courseId)}
                              className="text-slate-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </Button>
                          </div>

                          <div className="mt-4 space-y-2">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Course Date</Label>
                            <Select
                              value={course.courseDateId || ""}
                              onValueChange={(v) => handleDateSelect(course.courseId, v)}
                            >
                              <SelectTrigger className="h-10 border-slate-100 bg-slate-50 text-xs">
                                <SelectValue placeholder="Choose an available date..." />
                              </SelectTrigger>
                              <SelectContent>
                                {courseDates[course.courseId]?.map(date => (
                                  <SelectItem key={date.courseDateId} value={date.courseDateId}>
                                    {new Date(date.startDate).toLocaleDateString()} - {new Date(date.endDate).toLocaleDateString()} ({date.availableSlots} slots left)
                                  </SelectItem>
                                ))}
                                {(!courseDates[course.courseId] || courseDates[course.courseId].length === 0) && (
                                  <SelectItem value="NO_DATES" disabled>No dates available</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center bg-slate-50 -mx-8 px-8 py-6">
                    <div>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Total Investment</p>
                      <p className="text-3xl font-black text-slate-900">${totalPrice}</p>
                    </div>
                    <div className="flex gap-4">
                      <Button variant="outline" onClick={() => setCurrentStep('details')} className="h-12 px-6 font-bold text-slate-600">
                        <ChevronLeft className="w-5 h-5 mr-2" /> BACK
                      </Button>
                      <Button
                        onClick={() => setCurrentStep('payment')}
                        disabled={selectedCourses.length === 0 || selectedCourses.some(c => !c.courseDateId)}
                        className="h-12 px-8 bg-cyan-500 hover:bg-cyan-600 font-bold"
                      >
                        CONTINUE TO PAYMENT <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {currentStep === 'payment' && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card className="border-none shadow-xl overflow-hidden">
                <div className="bg-slate-900 p-6 text-white text-center">
                  <h1 className="text-2xl font-bold">Secure Payment</h1>
                  <p className="text-slate-400 text-sm mt-2">Choose your preferred payment method</p>
                </div>
                <CardContent className="p-8 space-y-8">
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setPaymentMethod('CreditCard')}
                      className={`p-6 rounded-2xl border-2 transition-all text-left ${paymentMethod === 'CreditCard' ? 'border-cyan-500 bg-cyan-50 ring-4 ring-cyan-500/10' : 'border-slate-100 hover:border-slate-200'
                        }`}
                    >
                      <CreditCard className={`w-8 h-8 mb-4 ${paymentMethod === 'CreditCard' ? 'text-cyan-500' : 'text-slate-400'}`} />
                      <p className="font-bold text-slate-800">Credit / Debit Card</p>
                      <p className="text-xs text-slate-500 mt-1">Stripe Secure Payment</p>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('BankTransfer')}
                      className={`p-6 rounded-2xl border-2 transition-all text-left ${paymentMethod === 'BankTransfer' ? 'border-indigo-500 bg-indigo-50 ring-4 ring-indigo-500/10' : 'border-slate-100 hover:border-slate-200'
                        }`}
                    >
                      <Building className={`w-8 h-8 mb-4 ${paymentMethod === 'BankTransfer' ? 'text-indigo-500' : 'text-slate-400'}`} />
                      <p className="font-bold text-slate-800">Bank Transfer</p>
                      <p className="text-xs text-slate-500 mt-1">Manual Transfer Details</p>
                    </button>
                  </div>

                  <AnimatePresence mode="wait">
                    {paymentMethod === 'CreditCard' ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-200"
                      >
                        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                          <Shield className="w-4 h-4 text-green-500" /> CARD DETAILS
                        </h3>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cardholder Name</Label>
                            <Input
                              placeholder="FULL NAME AS ON CARD"
                              className="h-11 border-slate-200"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Card Number</Label>
                            <Input
                              placeholder="0000 0000 0000 0000"
                              className="h-11 border-slate-200"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expiry</Label>
                              <Input placeholder="MM / YY" className="h-11 border-slate-200" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CVV</Label>
                              <Input placeholder="123" className="h-11 border-slate-200" />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-4"
                      >
                        <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
                          <AlertCircle className="w-5 h-5" /> BANK TRANSFER INSTRUCTIONS
                        </div>
                        <p className="text-sm text-indigo-600 leading-relaxed">
                          Please transfer the total amount to the following account. Use your <strong>First Name + Phone Number</strong> as reference.
                        </p>
                        <div className="bg-white p-4 rounded-xl border border-indigo-100 space-y-3 shadow-sm">
                          <div className="flex justify-between border-b pb-2">
                            <span className="text-slate-500 text-xs">Account Name:</span>
                            <span className="text-slate-800 font-bold text-xs uppercase">Safety Training Academy PTY LTD</span>
                          </div>
                          <div className="flex justify-between border-b pb-2">
                            <span className="text-slate-500 text-xs">BSB:</span>
                            <span className="text-slate-800 font-bold">123-456</span>
                          </div>
                          <div className="flex justify-between pt-1">
                            <span className="text-slate-500 text-xs">Account Number:</span>
                            <span className="text-slate-800 font-bold">987654321</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-indigo-500 italic mt-2">
                          * Note: Your submission will be processed once we confirm receipt of funds (usually 1-2 business days).
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="bg-slate-900 -mx-8 p-8 flex justify-between items-center text-white">
                    <div>
                      <p className="text-slate-400 text-xs font-bold uppercase">Payable Now</p>
                      <p className="text-3xl font-black text-cyan-400">${totalPrice}</p>
                    </div>
                    <div className="flex gap-4">
                      <Button variant="ghost" onClick={() => setCurrentStep('courses')} className="text-white hover:bg-slate-800 border border-slate-700 h-12 px-6 font-bold">
                        <ChevronLeft className="w-5 h-5 mr-1" /> BACK
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="h-12 px-10 bg-cyan-500 hover:bg-cyan-600 font-black text-xs uppercase tracking-[2px] shadow-lg shadow-cyan-500/20"
                      >
                        {loading ? 'PROCESSING...' : 'COMPLETE REGISTRATION'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {currentStep === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <Card className="border-none shadow-2xl py-16 px-8 rounded-3xl overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-cyan-500"></div>
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
                <h1 className="text-3xl font-black text-slate-800 mb-4">Submission Successful!</h1>
                <p className="text-slate-500 mb-10 max-w-md mx-auto leading-relaxed">
                  Thank you for your VOC renewal request. We've sent a confirmation email to <strong>{formData.email}</strong> with your order details and next steps.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button onClick={onBack} className="h-12 px-10 bg-slate-900 font-bold rounded-xl">
                    Back to Home
                  </Button>
                  <Button variant="outline" onClick={() => window.location.reload()} className="h-12 border-slate-200 font-bold rounded-xl">
                    Submit Another
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PublicLayout>
  );
}
