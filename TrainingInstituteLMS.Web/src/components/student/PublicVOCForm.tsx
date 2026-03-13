import { useState, useEffect, useRef, useMemo } from "react";
import {
  CheckCircle,
  AlertCircle,
  Mail,
  Phone,
  User,
  MapPin,
  Calendar,
  Shield,
  CreditCard,
  Building,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Check,
  Upload,
  FileCheck,
  Lock,
  Loader2,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Card, CardContent } from "../ui/card";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { PublicLayout } from "../layout/PublicLayout";
import { vocManagementService } from "../../services/vocManagement.service";
import { publicEnrollmentWizardService, type CourseDropdownItem, type CourseDateDropdownItem } from "../../services/publicEnrollmentWizard.service";
import { paymentService } from "../../services/payment.service";
import { COURSE_CATEGORY_ORDER, CATEGORY_OTHER } from '../../config/courseCategories.config';

type Step = 'details' | 'courses' | 'payment' | 'success';

// Fixed price per VOC course
const VOC_COURSE_PRICE = 150;

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

const yearOptions = Array.from({ length: 11 }, (_, i) => {
  const y = new Date().getFullYear() % 100;
  return (y + i).toString().padStart(2, '0');
});

export function PublicVOCForm({ onBack, onLogin, onAbout, onContact, onBookNow, onForms, onFeesRefund, onGallery, onCourseDetails, onVOC }: PublicVOCFormProps) {
  const [currentStep, setCurrentStep] = useState<Step>('details');
  const [loading, setLoading] = useState(false);

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
  });

  // Course Data State
  const [availableCourses, setAvailableCourses] = useState<CourseDropdownItem[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<SelectedCourse[]>([]);
  const [currentSelectedCourseId, setCurrentSelectedCourseId] = useState<string>("");

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'CreditCard' | 'BankTransfer'>('CreditCard');

  // Credit Card State
  const [cardData, setCardData] = useState({
    cardName: "",
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
  });
  const [cardType, setCardType] = useState<'visa' | 'mastercard' | 'amex' | 'unknown'>('unknown');
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});

  // Bank Transfer State
  const [bankFile, setBankFile] = useState<File | null>(null);
  const [bankPreviewUrl, setBankPreviewUrl] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [bankFileError, setBankFileError] = useState<string | null>(null);
  const [bankUploading, setBankUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate and group items
  const groupedCourseItems = useMemo(() => {
    const groups: Record<string, typeof availableCourses> = {};
    availableCourses.forEach(item => {
      const catName = item.categoryName?.trim() || CATEGORY_OTHER;
      if (!groups[catName]) groups[catName] = [];
      groups[catName].push(item);
    });

    const orderedGroups: { category: string, items: typeof availableCourses }[] = [];
    COURSE_CATEGORY_ORDER.forEach(cat => {
      if (groups[cat] && groups[cat].length > 0) {
        orderedGroups.push({ category: cat, items: groups[cat] });
        delete groups[cat];
      }
    });

    Object.keys(groups).sort().forEach(cat => {
      if (cat !== CATEGORY_OTHER && groups[cat] && groups[cat].length > 0) {
        orderedGroups.push({ category: cat, items: groups[cat] });
      }
    });

    if (groups[CATEGORY_OTHER] && groups[CATEGORY_OTHER].length > 0) {
      orderedGroups.push({ category: CATEGORY_OTHER, items: groups[CATEGORY_OTHER] });
    }

    return orderedGroups;
  }, [availableCourses]);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (cardData.cardNumber) {
      setCardType(paymentService.detectCardType(cardData.cardNumber));
    } else {
      setCardType('unknown');
    }
  }, [cardData.cardNumber]);

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




  const handleAddCourse = () => {
    const course = availableCourses.find(c => c.courseId === currentSelectedCourseId);
    if (course) {
      if (selectedCourses.some(sc => sc.courseId === course.courseId)) {
        toast.error("Course already added"); return;
      }
      setSelectedCourses([...selectedCourses, {
        courseId: course.courseId,
        courseName: course.courseName,
        price: VOC_COURSE_PRICE  // Always $150
      }]);
      setCurrentSelectedCourseId("");
    }
  };

  const handleRemoveCourse = (courseId: string) => {
    setSelectedCourses(selectedCourses.filter(c => c.courseId !== courseId));
  };

  const handleDateSelect = (courseId: string, dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const display = d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    setSelectedCourses(selectedCourses.map(c =>
      c.courseId === courseId ? { ...c, courseDateId: dateStr, courseDateDisplay: display } : c
    ));
  };

  /**
   * Generates the next 30 non-Sunday calendar days starting from today (inclusive).
   * Returns array of { value: 'YYYY-MM-DD', label: 'Mon, 13 Mar 2026' }
   */
  const next6NonSundayDates = useMemo(() => {
    const result: { value: string; label: string }[] = [];
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    while (result.length < 30) {
      if (d.getDay() !== 0) { // skip Sunday
        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const label = d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
        result.push({ value: iso, label });
      }
      d.setDate(d.getDate() + 1);
    }
    return result;
  }, []);

  const totalPrice = selectedCourses.length * VOC_COURSE_PRICE;

  // Bank file handler
  const handleBankFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setBankFileError(null);
    if (file) {
      const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowed.includes(file.type)) { setBankFileError("Please upload JPG, PNG, or PDF"); return; }
      if (file.size > 5 * 1024 * 1024) { setBankFileError("File must be less than 5MB"); return; }
      setBankFile(file);
      if (file.type.startsWith('image/')) {
        setBankPreviewUrl(URL.createObjectURL(file));
      } else {
        setBankPreviewUrl(null);
      }
    }
  };

  // Card number formatter
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = paymentService.formatCardNumber(e.target.value);
    if (formatted.replace(/\s/g, '').length <= 19) {
      setCardData({ ...cardData, cardNumber: formatted });
    }
  };

  const validateCard = (): boolean => {
    const errors: Record<string, string> = {};
    if (!cardData.cardName.trim()) errors.cardName = "Name on card is required";
    const clean = paymentService.getCleanCardNumber(cardData.cardNumber);
    if (!clean) errors.cardNumber = "Card number is required";
    else if (!paymentService.validateCardNumber(clean)) errors.cardNumber = "Invalid card number";
    if (!cardData.expiryMonth) errors.expiryMonth = "Required";
    if (!cardData.expiryYear) errors.expiryYear = "Required";
    if (cardData.expiryMonth && cardData.expiryYear && !paymentService.validateExpiry(cardData.expiryMonth, cardData.expiryYear)) {
      errors.expiryMonth = "Card has expired";
    }
    const cvvLen = paymentService.getCvvLength(cardType);
    if (!cardData.cvv) errors.cvv = "CVV required";
    else if (cardData.cvv.length !== cvvLen) errors.cvv = `Must be ${cvvLen} digits`;
    setCardErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (loading) return;
    if (paymentMethod === 'CreditCard' && !validateCard()) return;
    if (paymentMethod === 'BankTransfer' && (!bankFile || !transactionId.trim())) {
      toast.error("Please upload payment receipt and enter transaction ID");
      return;
    }
    setLoading(true);
    try {
      const res = await vocManagementService.submitVOC({
        ...formData,
        selectedCourses: selectedCourses.map(c => ({ 
          courseId: c.courseId, 
          courseDateId: c.courseDateId,
          courseName: c.courseName,
          courseDateDisplay: c.courseDateDisplay,
          price: c.price
        })),
        paymentMethod,
        totalAmount: totalPrice,
        transactionId: paymentMethod === 'CreditCard'
          ? "CC_" + Math.random().toString(36).substring(2, 9).toUpperCase()
          : transactionId,
        paymentProof: bankFile || undefined,
      });
      if (res.success) {
        setCurrentStep('success');
        toast.success("VOC Submission Successful!");
      } else {
        toast.error((res as any).message || "Failed to submit VOC");
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
        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${active ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30' : completed ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
          {completed ? <Check className="w-5 h-5" /> : <span>{index + 1}</span>}
        </div>
        <span className={`text-[10px] uppercase font-bold mt-2 ${active ? 'text-cyan-600' : 'text-slate-400'}`}>{label}</span>
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
          {/* ─── STEP 1: DETAILS ─── */}
          {currentStep === 'details' && (
            <motion.div key="details" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
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
                        <Input placeholder="John" className="pl-10 h-11" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Last Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input placeholder="Smith" className="pl-10 h-11" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        placeholder="you@example.com"
                        type="email"
                        className="pl-10 h-11"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input placeholder="0400 000 000" className="pl-10 h-11" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Student ID / License #</Label>
                      <div className="relative">
                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input placeholder="AUS-123456" className="pl-10 h-11" value={formData.australianStudentId} onChange={e => setFormData({ ...formData, australianStudentId: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Street Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input placeholder="123 Example St" className="pl-10 h-11" value={formData.streetAddress} onChange={e => setFormData({ ...formData, streetAddress: e.target.value })} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">City/Suburb</Label>
                      <Input className="h-11" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">State</Label>
                      <Select value={formData.state} onValueChange={v => setFormData({ ...formData, state: v })}>
                        <SelectTrigger className="h-11"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'].map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Postcode</Label>
                      <Input className="h-11" maxLength={4} value={formData.postcode} onChange={e => setFormData({ ...formData, postcode: e.target.value })} />
                    </div>
                  </div>


                  <Button
                    onClick={() => setCurrentStep('courses')}
                    disabled={!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.australianStudentId || !formData.streetAddress || !formData.city || !formData.state || !formData.postcode}
                    className="w-full h-12 bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-sm uppercase tracking-widest rounded-xl"
                  >
                    SELECT COURSES <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ─── STEP 2: COURSES ─── */}
          {currentStep === 'courses' && (
            <motion.div key="courses" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <Card className="border-none shadow-xl overflow-hidden">
                <div className="bg-slate-900 p-6 text-white text-center">
                  <h1 className="text-2xl font-bold">Course Selection</h1>
                  <p className="text-slate-400 text-sm mt-2">Select the courses you wish to renew — <span className="text-cyan-400 font-bold">${VOC_COURSE_PRICE} per course</span></p>
                </div>
                <CardContent className="p-8 space-y-8">
                  {/* Add Course Row */}
                  <div className="flex gap-4 items-end w-full">
                    <div className="flex-grow min-w-0 space-y-2">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Choose a Course</Label>
                      <Select value={currentSelectedCourseId} onValueChange={setCurrentSelectedCourseId}>
                        <SelectTrigger className="h-12 border-slate-200 text-base w-full overflow-hidden">
                          <SelectValue placeholder="Select a course to add..." className="truncate" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {groupedCourseItems.map(group => (
                            <SelectGroup key={group.category}>
                              <SelectLabel className="font-bold text-cyan-800 bg-cyan-50">{group.category}</SelectLabel>
                              {group.items.map(course => (
                                <SelectItem key={course.courseId} value={course.courseId} className="max-w-full">
                                  <div className="flex items-center justify-between w-full gap-2">
                                    <span className="truncate flex-1">{course.courseName}</span>
                                    <span className="font-bold text-cyan-600 shrink-0">${VOC_COURSE_PRICE}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          ))}
                          {availableCourses.length === 0 && (
                            <SelectItem value="_none" disabled>
                              No courses available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={handleAddCourse}
                      disabled={!currentSelectedCourseId}
                      className="h-12 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-bold flex items-center gap-2 shrink-0"
                    >
                      <Plus className="w-5 h-5" /> Add Course
                    </Button>
                  </div>

                  {/* Selected Courses */}
                  <div className="space-y-4">
                    {selectedCourses.length === 0 ? (
                      <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                        <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">No courses selected yet</p>
                        <p className="text-slate-400 text-sm mt-1">Add courses from the dropdown above</p>
                      </div>
                    ) : (
                      selectedCourses.map((course) => (
                        <motion.div
                          key={course.courseId}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all"
                        >
                          <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-cyan-100 rounded-xl flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-cyan-600" />
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-bold text-slate-800 truncate" title={course.courseName}>{course.courseName}</h3>
                                <p className="text-cyan-600 font-bold text-sm">${course.price}.00</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveCourse(course.courseId)} className="text-slate-300 hover:text-red-500 transition-colors">
                              <Trash2 className="w-5 h-5" />
                            </Button>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Course Date *</Label>
                            <Select value={course.courseDateId || ""} onValueChange={(v) => handleDateSelect(course.courseId, v)}>
                              <SelectTrigger className={`h-11 text-sm ${!course.courseDateId ? 'border-amber-300 bg-amber-50' : 'border-green-200 bg-green-50'}`}>
                                <SelectValue placeholder="Choose an available date..." />
                              </SelectTrigger>
                              <SelectContent>
                                {next6NonSundayDates.map(({ value, label }) => (
                                  <SelectItem key={value} value={value}>
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {!course.courseDateId && <p className="text-amber-600 text-xs mt-1">⚠ Please select a date to continue</p>}
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>

                  {/* Total & Navigation */}
                  <div className="flex justify-between items-center bg-slate-50 -mx-8 px-8 py-6 border-t border-slate-100">
                    <div>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Total ({selectedCourses.length} course{selectedCourses.length !== 1 ? 's' : ''})</p>
                      <p className="text-3xl font-black text-slate-900">${totalPrice}.00</p>
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

          {/* ─── STEP 3: PAYMENT ─── */}
          {currentStep === 'payment' && (
            <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <Card className="border-none shadow-xl overflow-hidden">
                <div className="bg-slate-900 p-6 text-white text-center">
                  <h1 className="text-2xl font-bold">Secure Payment</h1>
                  <p className="text-slate-400 text-sm mt-2">Choose your preferred payment method</p>
                </div>
                <CardContent className="p-8 space-y-8">
                  {/* Method Tabs */}
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setPaymentMethod('CreditCard')}
                      className={`p-6 rounded-2xl border-2 transition-all text-left ${paymentMethod === 'CreditCard' ? 'border-cyan-500 bg-cyan-50 ring-4 ring-cyan-500/10' : 'border-slate-100 hover:border-slate-200'}`}
                    >
                      <CreditCard className={`w-8 h-8 mb-3 ${paymentMethod === 'CreditCard' ? 'text-cyan-500' : 'text-slate-400'}`} />
                      <p className="font-bold text-slate-800">Credit / Debit Card</p>
                      <p className="text-xs text-slate-500 mt-1">Secure card payment</p>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('BankTransfer')}
                      className={`p-6 rounded-2xl border-2 transition-all text-left ${paymentMethod === 'BankTransfer' ? 'border-indigo-500 bg-indigo-50 ring-4 ring-indigo-500/10' : 'border-slate-100 hover:border-slate-200'}`}
                    >
                      <Building className={`w-8 h-8 mb-3 ${paymentMethod === 'BankTransfer' ? 'text-indigo-500' : 'text-slate-400'}`} />
                      <p className="font-bold text-slate-800">Bank Transfer</p>
                      <p className="text-xs text-slate-500 mt-1">Upload proof of payment</p>
                    </button>
                  </div>

                  <AnimatePresence mode="wait">
                    {/* ── CREDIT CARD FORM ── */}
                    {paymentMethod === 'CreditCard' && (
                      <motion.div key="cc" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                        <div className="flex items-center gap-3 text-sm font-bold text-slate-700 mb-2">
                          <Lock className="w-4 h-4 text-green-500" /> CARD DETAILS — Encrypted & Secure
                        </div>

                        {/* Cardholder Name */}
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Name on Card *</Label>
                          <Input
                            placeholder="FULL NAME AS ON CARD"
                            className={`h-11 ${cardErrors.cardName ? 'border-red-400' : ''}`}
                            value={cardData.cardName}
                            onChange={e => setCardData({ ...cardData, cardName: e.target.value.toUpperCase() })}
                          />
                          {cardErrors.cardName && <p className="text-red-500 text-xs">{cardErrors.cardName}</p>}
                        </div>

                        {/* Card Number */}
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Card Number *</Label>
                          <div className="relative">
                            <Input
                              placeholder="4111 1111 1111 1111"
                              className={`h-11 pr-16 ${cardErrors.cardNumber ? 'border-red-400' : ''}`}
                              value={cardData.cardNumber}
                              onChange={handleCardNumberChange}
                              maxLength={23}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              {cardType === 'visa' && <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-[8px] font-bold">VISA</div>}
                              {cardType === 'mastercard' && <div className="w-10 h-6 bg-gradient-to-r from-red-500 to-yellow-500 rounded flex items-center justify-center gap-0"><div className="w-3 h-3 bg-red-500 rounded-full opacity-80"></div><div className="w-3 h-3 bg-yellow-500 rounded-full opacity-80 -ml-1"></div></div>}
                              {cardType === 'amex' && <div className="w-10 h-6 bg-blue-400 rounded flex items-center justify-center text-white text-[7px] font-bold">AMEX</div>}
                            </div>
                          </div>
                          {cardErrors.cardNumber && <p className="text-red-500 text-xs">{cardErrors.cardNumber}</p>}
                        </div>

                        {/* Expiry + CVV */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Month *</Label>
                            <Select value={cardData.expiryMonth} onValueChange={v => setCardData({ ...cardData, expiryMonth: v })}>
                              <SelectTrigger className={`h-11 ${cardErrors.expiryMonth ? 'border-red-400' : ''}`}><SelectValue placeholder="MM" /></SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(m => (
                                  <SelectItem key={m} value={m}>{m}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {cardErrors.expiryMonth && <p className="text-red-500 text-xs">{cardErrors.expiryMonth}</p>}
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Year *</Label>
                            <Select value={cardData.expiryYear} onValueChange={v => setCardData({ ...cardData, expiryYear: v })}>
                              <SelectTrigger className={`h-11 ${cardErrors.expiryYear ? 'border-red-400' : ''}`}><SelectValue placeholder="YY" /></SelectTrigger>
                              <SelectContent>
                                {yearOptions.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            {cardErrors.expiryYear && <p className="text-red-500 text-xs">{cardErrors.expiryYear}</p>}
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CVV *</Label>
                            <div className="relative">
                              <Input
                                type="password"
                                placeholder={cardType === 'amex' ? '••••' : '•••'}
                                className={`h-11 ${cardErrors.cvv ? 'border-red-400' : ''}`}
                                value={cardData.cvv}
                                onChange={e => {
                                  const v = e.target.value.replace(/\D/g, '');
                                  if (v.length <= paymentService.getCvvLength(cardType)) setCardData({ ...cardData, cvv: v });
                                }}
                                maxLength={cardType === 'amex' ? 4 : 3}
                              />
                              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            </div>
                            {cardErrors.cvv && <p className="text-red-500 text-xs">{cardErrors.cvv}</p>}
                          </div>
                        </div>

                        {/* Card logos */}
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-xs text-slate-400">We accept:</span>
                          <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-[8px] font-bold">VISA</div>
                          <div className="w-10 h-6 bg-gradient-to-r from-red-500 to-yellow-500 rounded flex items-center justify-center"><div className="w-3 h-3 bg-red-500 rounded-full opacity-80"></div><div className="w-3 h-3 bg-yellow-500 rounded-full opacity-80 -ml-1"></div></div>
                          <div className="w-10 h-6 bg-blue-400 rounded flex items-center justify-center text-white text-[7px] font-bold">AMEX</div>
                        </div>
                      </motion.div>
                    )}

                    {/* ── BANK TRANSFER FORM ── */}
                    {paymentMethod === 'BankTransfer' && (
                      <motion.div key="bank" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5 p-6 bg-indigo-50 border border-indigo-100 rounded-2xl">
                        <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
                          <AlertCircle className="w-5 h-5" /> BANK TRANSFER INSTRUCTIONS
                        </div>

                        {/* Bank Details */}
                        <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm space-y-3">
                          <p className="text-xs font-bold text-indigo-700 uppercase tracking-widest mb-3">Transfer ${totalPrice}.00 to:</p>
                          <div className="flex justify-between border-b pb-2">
                            <span className="text-slate-500 text-xs">Account Name:</span>
                            <span className="text-slate-800 font-bold text-xs">Safety Training Academy PTY LTD</span>
                          </div>
                          <div className="flex justify-between border-b pb-2">
                            <span className="text-slate-500 text-xs">BSB:</span>
                            <span className="text-slate-800 font-bold">123-456</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 text-xs">Account Number:</span>
                            <span className="text-slate-800 font-bold">987654321</span>
                          </div>
                        </div>
                        <p className="text-xs text-indigo-600">Use <strong>{formData.firstName} {formData.lastName} {formData.phone}</strong> as your payment reference.</p>

                        {/* Steps */}
                        <div className="bg-white p-4 rounded-xl border border-indigo-100 text-sm text-indigo-800 space-y-1">
                          <p className="font-bold text-xs uppercase tracking-wider mb-2">Steps:</p>
                          <ol className="list-decimal list-inside space-y-1 text-xs text-slate-600">
                            <li>Make the bank transfer using the details above</li>
                            <li>Save your receipt/screenshot</li>
                            <li>Enter your transaction/reference ID below</li>
                            <li>Upload your payment proof</li>
                          </ol>
                        </div>

                        {/* Transaction ID */}
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Transaction / Reference ID *</Label>
                          <Input
                            placeholder="e.g. TXN12345678"
                            className="h-11 bg-white"
                            value={transactionId}
                            onChange={e => setTransactionId(e.target.value)}
                          />
                          <p className="text-xs text-slate-400">Found on your bank receipt or online banking confirmation</p>
                        </div>

                        {/* File Upload */}
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Payment Receipt / Proof *</Label>
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${bankFile ? 'border-green-400 bg-green-50' : 'border-indigo-200 bg-white hover:border-indigo-400'}`}
                          >
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,application/pdf"
                              className="hidden"
                              onChange={handleBankFileChange}
                            />
                            {bankFile ? (
                              <div className="space-y-2">
                                <FileCheck className="w-10 h-10 mx-auto text-green-500" />
                                <p className="text-green-700 font-semibold text-sm">{bankFile.name}</p>
                                <p className="text-xs text-slate-500">{(bankFile.size / 1024).toFixed(1)} KB</p>
                                {bankPreviewUrl && <img src={bankPreviewUrl} alt="Receipt" className="max-h-40 mx-auto rounded border mt-2" />}
                                <Button variant="outline" size="sm" className="mt-2 text-xs" onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}>Change File</Button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <Upload className="w-10 h-10 mx-auto text-indigo-300" />
                                <p className="text-slate-500 text-sm">Click to upload payment receipt</p>
                                <p className="text-xs text-slate-400">JPG, PNG or PDF — max 5MB</p>
                              </div>
                            )}
                          </div>
                          {bankFileError && <p className="text-red-500 text-xs">{bankFileError}</p>}
                        </div>

                        <p className="text-[10px] text-indigo-500 italic">* Your submission will be processed once we confirm receipt of funds (usually 1–2 business days).</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Pay Bar */}
                  <div className="bg-slate-900 -mx-8 px-8 py-6 flex justify-between items-center text-white">
                    <div>
                      <p className="text-slate-400 text-xs font-bold uppercase">Total Payable</p>
                      <p className="text-3xl font-black text-cyan-400">${totalPrice}.00</p>
                      <p className="text-slate-500 text-xs">{selectedCourses.length} course{selectedCourses.length !== 1 ? 's' : ''} × $150</p>
                    </div>
                    <div className="flex gap-4">
                      <Button variant="ghost" onClick={() => setCurrentStep('courses')} className="text-white hover:bg-slate-800 border border-slate-700 h-12 px-6 font-bold">
                        <ChevronLeft className="w-5 h-5 mr-1" /> BACK
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={loading || (paymentMethod === 'BankTransfer' && (!bankFile || !transactionId.trim()))}
                        className="h-12 px-10 bg-cyan-500 hover:bg-cyan-600 font-black text-xs uppercase tracking-[2px] shadow-lg shadow-cyan-500/20"
                      >
                        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> PROCESSING...</> : 'COMPLETE REGISTRATION'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ─── STEP 4: SUCCESS ─── */}
          {currentStep === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <Card className="border-none shadow-2xl py-16 px-8 rounded-3xl overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-cyan-500"></div>
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
                <h1 className="text-3xl font-black text-slate-800 mb-4">Submission Successful!</h1>
                <p className="text-slate-500 mb-6 max-w-md mx-auto leading-relaxed">
                  Thank you for your VOC renewal request. We've sent a confirmation email to <strong>{formData.email}</strong>.
                </p>
                {paymentMethod === 'BankTransfer' && (
                  <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 max-w-md mx-auto">
                    <p className="font-bold mb-1">⏳ Bank Transfer Pending</p>
                    <p>Once we confirm receipt of your payment (1–2 business days), your VOC renewal will be processed.</p>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-4">
                  <Button onClick={onBack} className="h-12 px-10 bg-slate-900 font-bold rounded-xl">Back to Home</Button>
                  <Button variant="outline" onClick={() => window.location.reload()} className="h-12 border-slate-200 font-bold rounded-xl">Submit Another</Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PublicLayout>
  );
}
