import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  CheckCircle,
  Loader2,
  Eye,
  EyeOff,
  User,
  BookOpen,
  CreditCard,
  ClipboardCheck,
  FileEdit,
  Calendar,
  Clock,
  Check,
  DollarSign,
  Upload,
  X,
  FileText,
  Lock,
  Shield,
  AlertCircle,
  Building2,
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '../ui/select';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { COURSE_CATEGORY_ORDER, CATEGORY_OTHER } from '../../config/courseCategories.config';
import {
  publicEnrollmentWizardService,
  type CourseDropdownItem,
  type CourseDateDropdownItem
} from '../../services/publicEnrollmentWizard.service';
import { studentEnrollmentFormService, type SubmitEnrollmentFormRequest } from '../../services/studentEnrollmentForm.service';
import { quizService, type SubmitGuestQuizRequest, type SubmitQuizSectionResult } from '../../services/quiz.service';
import { authService } from '../../services/auth.service';
import { QuizSection } from './QuizSection';
import type { QuizSectionData } from './Quiz';
import {
  ApplicantSection,
  USISection,
  EducationSection,
  AdditionalInfoSection,
  PrivacyTermsSection,
  PhotoIdSection,
} from './enrolment';
import { collectMissingFields } from './enrolment/enrolmentValidation';
import { REQUIRED_FIELD_DEFINITIONS } from './enrolment/enrolmentValidation';
import type {
  ApplicantDetails,
  USIDetails,
  EducationDetails,
  AdditionalInfo,
  PrivacyTerms,
  StudentEnrolmentFormData,
} from '../../types/studentEnrolment';
import {
  initialApplicantDetails,
  initialUSIDetails,
  initialEducationDetails,
  initialAdditionalInfo,
  initialPrivacyTerms,
} from '../../types/studentEnrolment';
import { paymentService } from '../../services/payment.service';
import { PaymentSuccessCard } from '../PaymentSuccessCard';
import { PaymentFailureCard } from '../PaymentFailureCard';
import { gtagEvent } from '../../lib/gtag';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { API_CONFIG } from '../../config/api.config';
import { usePublicSiteUrl } from '../../contexts/PublicSiteUrlContext';
import {
  AU_LOCALE_DATE_SHORT,
  AU_LOCALE_TIME,
  formatAustraliaCivilDateHeading,
  getCalendarDateKeyInAustralia,
} from '../../utils/australiaTime';

interface PublicEnrollmentWizardProps {
  onComplete: (result: { userId: string; studentId: string; email: string; fullName: string }) => void;
  onCancel: () => void;
  preSelectedCourseId?: string;
  preSelectedCourseDateId?: string;
  /** Optional override for the selected course price (e.g., promo/offer price from Course Details). */
  preSelectedCoursePrice?: number;
  /** When true, show only name/email/phone/password and complete via one-time link (no payment, no LLN). */
  isOneTimeLink?: boolean;
  /** When true, users complete full flow without payment (name, email, mobile, LLN, enrollment form only). */
  allowPayLater?: boolean;
  /** Link code for one-time link completion API. */
  enrollCode?: string;
}

// Full quiz sections data (same as in PublicQuiz.tsx)
const quizSections: QuizSectionData[] = [
  {
    id: 'numeracy',
    title: 'Section 1: Numeracy',
    description: 'Test your numerical skills and problem-solving abilities',
    passingPercentage: 66,
    questions: [
      {
        id: 'n1',
        question: 'A hard hat costs $32. How much will three hard hats cost?',
        type: 'dropdown',
        options: ['$64', '$96', '$128', '$160'],
        correctAnswer: '$96|$4.00',
        image: 'hardhat',
        multiPart: true,
        parts: [
          { label: '(a) Total cost', options: ['$64', '$96', '$128', '$160'], correctAnswer: '$96' },
          { label: '(b) If you pay with $100 how much change will you get?', options: ['$2.00', '$4.00', '$6.00', '$8.00'], correctAnswer: '$4.00' }
        ]
      },
      {
        id: 'n2',
        question: 'A safety barrier is 2.4 metres long.',
        type: 'dropdown' as const,
        options: ['3 barriers', '4 barriers', '5 barriers', '6 barriers'],
        correctAnswer: '5 barriers|75 kg',
        image: 'barrier',
        multiPart: true,
        parts: [
          { label: '(a) How many barriers are needed to cover 12 metres?', options: ['3 barriers', '4 barriers', '5 barriers', '6 barriers'], correctAnswer: '5 barriers' },
          { label: '(b) If each barrier weighs 15 kg, what is the total weight of 5 barriers?', options: ['60 kg', '65 kg', '70 kg', '75 kg'], correctAnswer: '75 kg' }
        ]
      },
      {
        id: 'n3',
        question: '"A scaffold has a maximum load of 300 kg.\n\nWorker A weighs 84 kg and carries 10 kg of tools.\nWorker B weighs 92 kg and carries 15 kg of tools."',
        type: 'dropdown' as const,
        options: ['176 kg', '186 kg', '196 kg', '201 kg'],
        correctAnswer: '201 kg|99 kg',
        image: 'scaffold',
        multiPart: true,
        parts: [
          { label: '(a) What is the combined total load of Worker A and B?', options: ['176 kg', '186 kg', '196 kg', '201 kg'], correctAnswer: '201 kg' },
          { label: '(b) How much load is left before the scaffold reaches its limit?', options: ['89 kg', '94 kg', '99 kg', '104 kg'], correctAnswer: '99 kg' }
        ]
      }
    ]
  },
  {
    id: 'literacy',
    title: 'Section 2: Literacy (Reading & Writing)',
    description: 'Assess your reading comprehension and written communication skills',
    passingPercentage: 66,
    questions: [
      {
        id: 'l1',
        question: '1. Read the email',
        type: 'dropdown',
        options: ['Silvia', 'Mike', 'Bridgestone', 'Port Melbourne'],
        correctAnswer: 'Silvia|Mike|Tyres needed - Order no 2457|Bridgestone',
        image: 'email',
        multiPart: true,
        parts: [
          { label: 'a. Who is the email from?', options: ['Silvia', 'Mike', 'Bridgestone', 'Port Melbourne'], correctAnswer: 'Silvia' },
          { label: 'b. Who is the email to?', options: ['Silvia', 'Mike', 'Bridgestone', 'Silvia Chinoto'], correctAnswer: 'Mike' },
          { label: 'c. What is the subject?', options: ['Tyres needed - Order no 2457', 'Quote Number 2457', 'Bridgestone Order', 'Port Melbourne Warehouse'], correctAnswer: 'Tyres needed - Order no 2457' },
          { label: 'd. What company does Mike work for?', options: ['Silvia Commercial', 'Port Melbourne', 'Bridgestone', 'Taranza Serenity'], correctAnswer: 'Bridgestone' }
        ]
      },
      {
        id: 'l2',
        question: '1. Read the poster on Infection control',
        type: 'dropdown',
        options: ["Everyone's", "Doctor's", "Nurse's", "Patient's"],
        correctAnswer: "Everyone's|9|1|Before and after providing care",
        image: 'infection-poster',
        multiPart: true,
        parts: [
          { label: "(a) Whose responsibility is it to keep patients safe from infection?", options: ["Everyone's", "Doctor's", "Nurse's", "Patient's"], correctAnswer: "Everyone's" },
          { label: '(b) How many ways does the poster tell you to keep patients safe from infection?', options: ['5', '7', '9', '11'], correctAnswer: '9' },
          { label: '(c) How many times should you use a needle and syringe?', options: ['1', '2', '3', 'As many as needed'], correctAnswer: '1' },
          { label: '(d) When should you clean your hands?', options: ['Before providing care', 'After providing care', 'Before and after providing care', 'Only when dirty'], correctAnswer: 'Before and after providing care' }
        ]
      },
      {
        id: 'l3',
        question: '1. Read the scenario and then fill out the Incident Report Form.',
        type: 'dropdown',
        options: ['Jenny', 'JEN-123', 'Moulding', 'Full Time'],
        correctAnswer: 'hand|forklift|ground|ice pack|First Aid',
        image: 'incident-form',
        multiPart: true,
        parts: [
          { label: 'a) Jenny only used one _____ getting onto the', options: ['hand', 'foot', 'arm', 'leg'], correctAnswer: 'hand' },
          { label: 'b) getting onto the _____', options: ['forklift', 'truck', 'ladder', 'platform'], correctAnswer: 'forklift' },
          { label: 'c) She bruised her right hip falling onto the _____', options: ['ground', 'floor', 'concrete', 'surface'], correctAnswer: 'ground' },
          { label: 'd) An _____ was put on Jenny\'s hip', options: ['ice pack', 'bandage', 'ointment', 'compress'], correctAnswer: 'ice pack' },
          { label: 'e) Medical Treatment:', options: ['None', 'First Aid', 'Doctor Only', 'Hospital'], correctAnswer: 'First Aid' }
        ]
      },
      {
        id: 'l4',
        question: '"All workers must wear hard hats, steel-capped boots and high-visibility vests while on a construction site. Personal protective equipment (PPE) must be checked daily. Report any damaged PPE or equipment immediately to the site supervisor. Workers must follow all safety signs and instructions at all times."\n\nWhich three items of PPE must workers wear on site?',
        type: 'multiple-choice',
        options: [
          'Steel-capped boots, safety glasses, high-visibility vests',
          'Hard hats, steel-capped boots, high-visibility vests',
          'Safety glasses, gloves, ear plugs',
          'Safety glasses, hard hats, gloves'
        ],
        correctAnswer: 'Hard hats, steel-capped boots, high-visibility vests',
        image: 'ppe-reading'
      },
      {
        id: 'l5',
        question: 'Who should workers report damaged PPE or equipment to?',
        type: 'multiple-choice',
        options: [
          'The safety sign',
          'A co-worker',
          'The equipment supplier',
          'The site supervisor'
        ],
        correctAnswer: 'The site supervisor'
      },
      {
        id: 'l6',
        question: 'Which instruction must workers follow according to the notice?',
        type: 'multiple-choice',
        options: [
          'Follow all safety signs and instructions',
          'Report to work before 6:00 am',
          'Take breaks every two hours',
          'Only wear PPE when using tools'
        ],
        correctAnswer: 'Follow all safety signs and instructions',
        image: 'ppe-notice'
      }
    ]
  },
  {
    id: 'language',
    title: 'Section 3: Language',
    description: 'Test your listening and comprehension skills',
    passingPercentage: 66,
    questions: [
      {
        id: 'lang1',
        question: 'Listen to the story about Carlos',
        type: 'dropdown',
        options: [],
        correctAnswer: 'May 2020|2@|Skilled Migration Visa|Computer Programmer|Evening|Local TAFE',
        image: 'audio-carlos',
        multiPart: true,
        parts: [
          { label: '(a) When did Carlos and Marina emigrate to Australia?', options: ['January 2020', 'May 2020', 'September 2020', 'December 2020'], correctAnswer: 'May 2020' },
          { label: '(b) How many children do they have?', options: ['1@', '2@', '3@', '4@'], correctAnswer: '2@' },
          { label: '(c) What type of visa did they enter Australia on?', options: ['Tourist Visa', 'Work Visa', 'Skilled Migration Visa', 'Student Visa'], correctAnswer: 'Skilled Migration Visa' },
          { label: '(d) What job does Marina do?', options: ['Teacher', 'Nurse', 'Computer Programmer', 'Engineer'], correctAnswer: 'Computer Programmer' },
          { label: '(e) Are they doing their English class in the evening or during the day?', options: ['Morning', 'Afternoon', 'Evening', 'Night'], correctAnswer: 'Evening' },
          { label: '(f) Where are they doing their English course?', options: ['Online', 'University', 'Local TAFE', 'Community Center'], correctAnswer: 'Local TAFE' }
        ]
      }
    ]
  },
  {
    id: 'digital',
    title: 'Section 4: Digital Literacy',
    description: 'Evaluate your digital skills and online safety knowledge',
    passingPercentage: 66,
    questions: [
      {
        id: 'd1',
        question: '"1. Drag and drop the two PDF checklist files into the Checklist Book folder located on the desktop. 2. Drag and drop the image file into the Images folder located on the desktop."',
        type: 'drag-drop',
        options: [],
        correctAnswer: 'file-organization',
        image: 'desktop-files'
      },
      {
        id: 'd2',
        question: 'Drag and drop each word onto the correct digital device.',
        type: 'drag-drop',
        options: [],
        correctAnswer: 'device-matching',
        image: 'digital-devices'
      },
      {
        id: 'd3',
        question: '"Your trainer asks you to find information about Safety training academy on the website.\n\nSteps:\n1. Open Search Engine (e.g Google) and search for: "Safety training academy".\n2. Go to the official website with this information.\n3. Write down the URL (web address) of the page:"',
        type: 'text',
        options: [],
        correctAnswer: `${API_CONFIG.PUBLIC_SITE_URL}/`,
        image: 'url-search'
      }
    ]
  }
];

// Helper function to extract clean section name
const extractSectionName = (sectionTitle: string): string => {
  const match = sectionTitle.match(/^Section \d+:\s*(.+)$/);
  if (match) {
    return match[1];
  }
  return sectionTitle;
};

const WIZARD_STEPS = [
  { id: 1, title: 'Course Selection', shortTitle: 'Course', icon: BookOpen },
  { id: 2, title: 'Payment', shortTitle: 'Payment', icon: CreditCard },
  { id: 3, title: 'LLND Assessment', shortTitle: 'LLND', icon: ClipboardCheck },
  { id: 4, title: 'Enrollment Form', shortTitle: 'Form', icon: FileEdit },
];

const MAX_REATTEMPTS = 3;
const AUTO_PASS_ATTEMPT = 4;

type EnrollmentType = 'individual' | 'company';

/** One line in company order: course + date + quantity. */
interface CompanyCourseItem {
  courseId: string;
  courseDateId?: string;
  courseDateLabel?: string;
  price: number;
  courseName?: string;
  quantity: number;
}

export function PublicEnrollmentWizard({
  onComplete,
  onCancel,
  preSelectedCourseId,
  preSelectedCourseDateId,
  preSelectedCoursePrice,
  isOneTimeLink = false,
  allowPayLater = false,
  enrollCode = ''
}: PublicEnrollmentWizardProps) {
  const { publicSiteUrl } = usePublicSiteUrl();
  // Wizard step state
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Enrollment type: Individual (default) or Company
  const [enrollmentType, setEnrollmentType] = useState<EnrollmentType>('individual');
  // Company: multiple courses, each with date + quantity
  const [selectedCompanyCourses, setSelectedCompanyCourses] = useState<CompanyCourseItem[]>([]);
  const [pendingCompanyCourse, setPendingCompanyCourse] = useState<{ courseId: string; courseName: string; price: number } | null>(null);
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyMobile, setCompanyMobile] = useState('');
  const [companyPassword, setCompanyPassword] = useState('');
  const [companyConfirmPassword, setCompanyConfirmPassword] = useState('');
  const [companyOrderSuccess, setCompanyOrderSuccess] = useState(false);
  const [companyOrderLinks, setCompanyOrderLinks] = useState<{ fullUrl: string; courseName: string }[]>([]);
  const [individualEnrollmentSuccess, setIndividualEnrollmentSuccess] = useState(false);
  const [individualEnrollmentResult, setIndividualEnrollmentResult] = useState<{ userId: string; studentId: string; email: string; fullName: string } | null>(null);
  const [oneTimeLinkSubmitting, setOneTimeLinkSubmitting] = useState(false);
  const [oneTimeLinkSuccess, setOneTimeLinkSuccess] = useState(false);
  const [oneTimeLinkError, setOneTimeLinkError] = useState<string | null>(null);

  // Personal details (collected on Payment step)
  const [registrationData, setRegistrationData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '123456'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [registrationErrors, setRegistrationErrors] = useState<Record<string, string>>({});

  // User/Student IDs after registration
  const [userId, setUserId] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);

  // Step 2: Course Selection
  const [courses, setCourses] = useState<CourseDropdownItem[]>([]);
  const [courseDates, setCourseDates] = useState<CourseDateDropdownItem[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState(preSelectedCourseId || '');
  const [selectedCourseDateId, setSelectedCourseDateId] = useState(preSelectedCourseDateId || '');
  const [selectedCoursePriceOverride, setSelectedCoursePriceOverride] = useState<number | null>(
    typeof preSelectedCoursePrice === 'number' ? preSelectedCoursePrice : null
  );
  const [showAllCourseDates, setShowAllCourseDates] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingDates, setLoadingDates] = useState(false);

  // Group course dates by calendar date for grid layout (same as Booking Form).
  // Each DB row is one slot (courseDateId); same calendar day can have many rows — sort by start/end instants.
  const courseDatesByDate = useMemo(() => {
    const slotStartMs = (d: CourseDateDropdownItem) => {
      const t = new Date(d.startDate).getTime();
      return Number.isNaN(t) ? 0 : t;
    };
    const slotEndMs = (d: CourseDateDropdownItem) => {
      const t = new Date(d.endDate).getTime();
      return Number.isNaN(t) ? 0 : t;
    };
    const byDate = courseDates.reduce<Record<string, CourseDateDropdownItem[]>>((acc, d) => {
      const datePart = getCalendarDateKeyInAustralia(d.startDate);
      if (!datePart) return acc;
      // Group by Sydney calendar date + dateType so different session types on the same day get separate sections
      const key = `${datePart}__${d.dateType || 'General'}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(d);
      return acc;
    }, {});
    return Object.keys(byDate)
      .sort()
      .map((groupKey) => {
        const dateKey = groupKey.split('__')[0];
        const dates = [...byDate[groupKey]].sort((a, b) => {
          const byStart = slotStartMs(a) - slotStartMs(b);
          if (byStart !== 0) return byStart;
          return slotEndMs(a) - slotEndMs(b);
        });
        return { groupKey, dateKey, dates };
      });
  }, [courseDates]);

  // Generate all items for dropdowns and group them
  const groupedCourseItems = useMemo(() => {
    const allCourseItems = courses.flatMap((course) => {
      const items = [];
      const categoryName = course.categoryName?.trim() || CATEGORY_OTHER;
      items.push({
        id: course.courseId,
        price: course.price,
        label: `${course.courseCode} – ${course.courseName} · $${course.price}`,
        categoryName
      });
      if (course.courseId === preSelectedCourseId && preSelectedCoursePrice != null && preSelectedCoursePrice !== course.price) {
        items.push({
          id: course.courseId,
          price: preSelectedCoursePrice,
          label: `${course.courseCode} – ${course.courseName} (Premium) · $${preSelectedCoursePrice}`,
          categoryName
        });
      }
      return items;
    });

    return (filterFn?: (item: any) => boolean) => {
      const filteredItems = filterFn ? allCourseItems.filter(filterFn) : allCourseItems;
      const groups: Record<string, typeof filteredItems> = {};
      filteredItems.forEach(item => {
        if (!groups[item.categoryName]) groups[item.categoryName] = [];
        groups[item.categoryName].push(item);
      });

      const orderedGroups: { category: string, items: typeof filteredItems }[] = [];
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
    };
  }, [courses, preSelectedCourseId, preSelectedCoursePrice]);

  // Step 3: Payment (moved up). When allowPayLater, force pay_later.
  const [paymentMethod, setPaymentMethod] = useState(allowPayLater ? 'pay_later' : 'bank_transfer');
  useEffect(() => {
    if (allowPayLater) setPaymentMethod('pay_later');
  }, [allowPayLater]);
  const [transactionId, setTransactionId] = useState('');
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);
  const [uploadingPayment, setUploadingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [paymentTransactionId, setPaymentTransactionId] = useState<number | null>(null);

  // Credit card form data
  const [cardData, setCardData] = useState({
    cardName: '',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
  });
  const [cardType, setCardType] = useState<'visa' | 'mastercard' | 'amex' | 'unknown'>('unknown');
  const [cardValidationErrors, setCardValidationErrors] = useState<Record<string, string>>({});

  // Step 4: LLND Quiz (was step 3)
  const [quizSectionIndex, setQuizSectionIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizSectionResults, setQuizSectionResults] = useState<{ section: string; score: number; percentage: number; passed: boolean }[]>([]);
  const quizSectionResultsRef = useRef<{ section: string; score: number; percentage: number; passed: boolean }[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const [quizAttemptNumber, setQuizAttemptNumber] = useState(1);
  const [declarationChecks, setDeclarationChecks] = useState({ honest: false, understand: false });
  const [declarationName, setDeclarationName] = useState('');
  const [showQuizDeclaration, setShowQuizDeclaration] = useState(false);

  // Mobile detection for LLN assessment (drag-drop requires desktop or desktop-mode)
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = () => setIsMobile(mq.matches);
    handler(); // Initial
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Step 5: Enrollment Form (was step 4)
  const [currentFormSection, setCurrentFormSection] = useState(1);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitValidationErrors, setSubmitValidationErrors] = useState<{ label: string; section: number }[]>([]);
  const formContainerRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<StudentEnrolmentFormData>({
    applicant: { ...initialApplicantDetails },
    usi: { ...initialUSIDetails },
    education: { ...initialEducationDetails },
    additionalInfo: { ...initialAdditionalInfo },
    privacyTerms: { ...initialPrivacyTerms },
  });

  // Keep ref in sync with quiz section results for reliable access at submit time
  useEffect(() => {
    quizSectionResultsRef.current = quizSectionResults;
  }, [quizSectionResults]);

  // Fetch courses on mount
  useEffect(() => {
    fetchCourses();
  }, []);

  // Fetch course dates when course is selected
  useEffect(() => {
    if (selectedCourseId) {
      fetchCourseDates(selectedCourseId);
      setShowAllCourseDates(false);
    } else {
      setCourseDates([]);
      setSelectedCourseDateId('');
    }
  }, [selectedCourseId]);

  // If the user changes the course manually, drop any override price (promo applies only to the preselected course).
  useEffect(() => {
    if (!selectedCourseId) return;
    if (preSelectedCourseId && selectedCourseId === preSelectedCourseId) return;
    if (selectedCoursePriceOverride != null) setSelectedCoursePriceOverride(null);
  }, [selectedCourseId, preSelectedCourseId, selectedCoursePriceOverride]);

  // If selected date gets filtered out (e.g., now in the past), clear selection
  useEffect(() => {
    if (!selectedCourseDateId) return;
    if (!courseDates.some((d) => d.courseDateId === selectedCourseDateId)) {
      setSelectedCourseDateId('');
    }
  }, [courseDates, selectedCourseDateId]);

  // Detect card type when card number changes
  useEffect(() => {
    if (cardData.cardNumber) {
      const detected = paymentService.detectCardType(cardData.cardNumber);
      setCardType(detected);
    } else {
      setCardType('unknown');
    }
  }, [cardData.cardNumber]);

  const fetchCourses = async () => {
    setLoadingCourses(true);
    try {
      const response = await publicEnrollmentWizardService.getCoursesForDropdown();
      if (response.success && response.data) {
        setCourses(Array.isArray(response.data) ? response.data : []);
      } else {
        setCourses([]);
        toast.error(response.message || 'Failed to load courses');
      }
    } catch (error) {
      setCourses([]);
      toast.error('Failed to load courses');
    } finally {
      setLoadingCourses(false);
    }
  };

  const fetchCourseDates = async (courseId: string) => {
    setLoadingDates(true);
    try {
      const response = await publicEnrollmentWizardService.getCourseDates(courseId);
      if (response.success && response.data) {
        const todayKey = getCalendarDateKeyInAustralia(new Date());
        const now = Date.now();
        const all = Array.isArray(response.data) ? response.data : [];
        const filtered = all.filter((d) => {
          const start = new Date(d.startDate);
          if (Number.isNaN(start.getTime())) return true;
          const startKey = getCalendarDateKeyInAustralia(d.startDate);
          if (!startKey) return true;
          if (startKey < todayKey) return false;
          if (start.getTime() <= now) return false;
          return true;
        });
        setCourseDates(filtered);
      } else {
        setCourseDates([]);
        toast.error(response.message || 'Failed to load course dates');
      }
    } catch (error) {
      setCourseDates([]);
      toast.error('Failed to load course dates');
    } finally {
      setLoadingDates(false);
    }
  };

  // Handle card number input with formatting
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = paymentService.formatCardNumber(e.target.value);
    if (formatted.replace(/\s/g, '').length <= 19) {
      setCardData({ ...cardData, cardNumber: formatted });
      if (cardValidationErrors.cardNumber) {
        setCardValidationErrors({ ...cardValidationErrors, cardNumber: '' });
      }
    }
  };

  // Validate card payment fields
  const validateCardPayment = (): boolean => {
    const errors: Record<string, string> = {};

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

  // Process card payment
  const processCardPayment = async (): Promise<boolean> => {
    if (!validateCardPayment()) {
      return false;
    }

    const coursePrice = getSelectedCoursePrice();

    setPaymentProcessing(true);
    setPaymentError(null);

    try {
      const result = await paymentService.processCardPayment({
        fullName: registrationData.fullName.trim(),
        email: registrationData.email.trim(),
        phone: registrationData.phone.trim(),
        password: enrollmentType === 'individual' ? '123456' : registrationData.password,
        courseId: selectedCourseId,
        selectedCourseDateId: selectedCourseDateId,
        enrollmentCode: enrollCode || undefined,
        amountCents: Math.round(coursePrice * 100),
        currency: 'AUD',
        cardName: cardData.cardName.trim(),
        cardNumber: paymentService.getCleanCardNumber(cardData.cardNumber),
        expiryMonth: cardData.expiryMonth,
        expiryYear: cardData.expiryYear,
        cvv: cardData.cvv,
      });

      if (result.success && result.data) {
        // Payment successful
        setPaymentCompleted(true);
        setPaymentTransactionId(result.data.transactionId);

        // Store user/student IDs for later
        if (result.data.userId) setUserId(result.data.userId);
        if (result.data.studentId) setStudentId(result.data.studentId);

        gtagEvent('ads_conversion_purchase_New_web', {
          method: 'card',
          course_id: selectedCourseId,
          value: coursePrice,
          currency: 'AUD',
          transaction_id: result.data.transactionId,
        });

        toast.success('Payment successful!');
        return true;
      } else {
        // Payment failed - display error
        const errorMsg = result.data?.errorMessages || result.message || result.errors?.join(', ') || 'Payment failed. Please try again.';
        setPaymentError(errorMsg);
        return false;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Payment failed. Please try again.';
      setPaymentError(errorMsg);
      return false;
    } finally {
      setPaymentProcessing(false);
    }
  };

  // Step 1: Validate registration
  const validateRegistration = (): boolean => {
    const errors: Record<string, string> = {};
    if (!registrationData.fullName.trim()) errors.fullName = 'Full name is required';
    if (!registrationData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registrationData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!registrationData.phone.trim()) errors.phone = 'Phone number is required';
    // Company enrollment: no password on frontend; backend uses default. Individual: backend default.
    if (!agreedToTerms) errors.terms = 'Please agree to the terms';
    setRegistrationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Pre-fill form data and declaration name from registration (called when leaving Payment step)
  const prefillFormFromRegistration = () => {
    const nameParts = registrationData.fullName.trim().split(' ');
    setFormData(prev => ({
      ...prev,
      applicant: {
        ...prev.applicant,
        givenName: nameParts[0] || '',
        surname: nameParts.slice(1).join(' ') || '',
        email: registrationData.email,
        mobile: registrationData.phone,
      }
    }));
    setDeclarationName(registrationData.fullName);
  };

  // Handle step navigation
  const handleNext = async () => {
    // Step 1: Course Selection
    if (currentStep === 1) {
      if (enrollmentType === 'company') {
        if (selectedCompanyCourses.length === 0) {
          toast.error('Please add at least one course');
          return;
        }
        const invalid = selectedCompanyCourses.some((item) => !item.courseDateId || (item.quantity ?? 1) < 1 || (item.quantity ?? 1) > 500);
        if (invalid) {
          toast.error('Each course must have a date and quantity between 1 and 500');
          return;
        }
        setPendingCompanyCourse(null);
      } else {
        if (!selectedCourseId) {
          toast.error('Please select a course');
          return;
        }
        if (!selectedCourseDateId) {
          toast.error('Please select a course date');
          return;
        }
      }
      setCurrentStep(2);
      return;
    }

    // Step 2: Payment (personal details + payment method) or Company order
    if (currentStep === 2) {
      if (enrollmentType === 'company') {
        if (!companyName.trim()) {
          toast.error('Please enter company name');
          return;
        }
        if (!companyEmail.trim()) {
          toast.error('Please enter company email');
          return;
        }
        // Company: no password on frontend; backend uses default
        if (!allowPayLater && !paymentMethod) {
          toast.error('Please select a payment method');
          return;
        }
        const effectiveCompanyPaymentMethod = allowPayLater ? 'pay_later' : paymentMethod;
        if (effectiveCompanyPaymentMethod === 'bank_transfer') {
          if (!transactionId.trim()) {
            toast.error('Please enter the transaction ID');
            return;
          }
          if (!paymentProofFile) {
            toast.error('Please upload the payment slip');
            return;
          }
        }
        if (effectiveCompanyPaymentMethod === 'card') {
          if (!validateCardPayment()) return;
          if (selectedCompanyCourses.length === 0 || selectedCompanyCourses.some((i) => !i.courseId || !i.courseDateId || (i.quantity ?? 1) < 1 || (i.quantity ?? 1) > 500)) {
            toast.error('Please add at least one course with date and quantity (1–500) on Step 1');
            return;
          }
          setPaymentError(null);
          setPaymentProcessing(true);
          try {
            const totalAmount = selectedCompanyCourses.reduce((s, i) => s + i.price * (i.quantity ?? 1), 0);
            const totalCents = Math.round(totalAmount * 100);
            const cardResult = await publicEnrollmentWizardService.processCompanyCardPayment({
              companyName: companyName.trim(),
              companyEmail: companyEmail.trim(),
              companyMobile: companyMobile.trim() || undefined,
              totalAmountCents: totalCents,
              cardName: cardData.cardName.trim(),
              cardNumber: cardData.cardNumber.replace(/\s/g, ''),
              expiryMonth: cardData.expiryMonth,
              expiryYear: cardData.expiryYear,
              cvv: cardData.cvv,
            });
            if (!cardResult.success || !cardResult.data?.transactionId) {
              setPaymentError(cardResult.message || 'Card payment failed');
              setPaymentProcessing(false);
              return;
            }
            const txId = cardResult.data.transactionId;
            setIsSubmitting(true);
            const items = selectedCompanyCourses.map((item) => ({
              courseId: item.courseId,
              courseDateId: item.courseDateId!,
              price: item.price,
              quantity: item.quantity ?? 1,
            }));
            const request = {
              companyEmail: companyEmail.trim(),
              companyName: companyName.trim(),
              companyMobile: companyMobile.trim() || undefined,
              items,
              paymentMethod: 'card',
              transactionId: txId,
            };
            const response = await publicEnrollmentWizardService.createCompanyOrder(request);
            setPaymentProcessing(false);
            if (response.success && response.data) {
              setCompanyOrderLinks(response.data.links);
              setCompanyOrderSuccess(true);
            } else {
              toast.error(response.message || 'Failed to create order');
            }
          } catch (err) {
            setPaymentError(err instanceof Error ? err.message : 'Payment failed');
            setPaymentProcessing(false);
          } finally {
            setIsSubmitting(false);
          }
          return;
        }
        // Pay Later or Bank Transfer
        if (selectedCompanyCourses.length === 0 || selectedCompanyCourses.some((i) => !i.courseId || !i.courseDateId || (i.quantity ?? 1) < 1 || (i.quantity ?? 1) > 500)) {
          toast.error('Please add at least one course with date and quantity (1–500) on Step 1');
          return;
        }
        setIsSubmitting(true);
        setPaymentError(null);
        const companyPayMethod = allowPayLater ? 'pay_later' : paymentMethod;
        try {
          const items = selectedCompanyCourses.map((item) => ({
            courseId: item.courseId,
            courseDateId: item.courseDateId!,
            price: item.price,
            quantity: item.quantity ?? 1,
          }));
          const request = {
            companyEmail: companyEmail.trim(),
            companyName: companyName.trim(),
            companyMobile: companyMobile.trim() || undefined,
            items,
            paymentMethod: companyPayMethod,
            transactionId: companyPayMethod === 'bank_transfer' ? transactionId.trim() : undefined,
            paymentProofDataUrl: companyPayMethod === 'bank_transfer' && paymentProofPreview ? paymentProofPreview : undefined,
            paymentProofFileName: companyPayMethod === 'bank_transfer' ? paymentProofFile?.name : undefined,
            paymentProofContentType: companyPayMethod === 'bank_transfer' ? paymentProofFile?.type : undefined,
          };
          const response = await publicEnrollmentWizardService.createCompanyOrder(request);
          if (response.success && response.data) {
            setCompanyOrderLinks(response.data.links);
            setCompanyOrderSuccess(true);
          } else {
            toast.error(response.message || 'Failed to create order');
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Failed to create order';
          setPaymentError(msg);
          toast.error(msg);
        } finally {
          setIsSubmitting(false);
        }
        return;
      }

      // Individual flow
      if (!validateRegistration()) return;

      // Check if email is already registered
      try {
        const emailCheckResponse = await authService.checkEmail(registrationData.email);
        if (emailCheckResponse.success && emailCheckResponse.data === true) {
          toast.error('This email is already registered. Please use a different email or login to your account.');
          setRegistrationErrors(prev => ({ ...prev, email: 'Email already registered' }));
          return;
        }
      } catch (error) {
        console.error('Error checking email:', error);
        toast.error('Failed to verify email. Please try again.');
        return;
      }

      if (!allowPayLater && !paymentMethod) {
        toast.error('Please select a payment method');
        return;
      }

      if (!allowPayLater && paymentMethod === 'bank_transfer') {
        if (!transactionId.trim()) {
          setPaymentError('Transaction ID is required for bank transfer');
          toast.error('Please enter the transaction ID');
          return;
        }
        if (!paymentProofFile) {
          setPaymentError('Payment slip upload is required for bank transfer');
          toast.error('Please upload the payment slip');
          return;
        }
      }

      if (!allowPayLater && paymentMethod === 'card') {
        const paymentSuccess = await processCardPayment();
        if (!paymentSuccess) return;
        return;
      }

      prefillFormFromRegistration();
      setCurrentStep(3);
      return;
    }

    // Step 3: LLND Assessment
    if (currentStep === 3) {
      if (!quizCompleted) {
        toast.error('Please complete the LLND assessment');
        return;
      }
      if (!quizPassed) {
        toast.error('LLND assessment failed. Please reattempt.');
        return;
      }
      setCurrentStep(4);
      return;
    }

    // Step 4: Enrollment Form
    if (currentStep === 4) {
      const result = validateAllSections();
      if (!result.valid) {
        setCurrentFormSection(result.firstInvalidSection);
        toast.error('Please complete all required fields before submitting');
        formContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      setSubmitValidationErrors([]);
      handleFinalSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Normalize answer for comparison - handles multi-part (pipe-separated) and trim/whitespace
  const normalizeAnswer = (answer: string | undefined): string => {
    if (!answer) return '';
    return answer
      .split('|')
      .map(part => part.trim().toLowerCase())
      .join('|');
  };

  // Handle quiz section complete
  const handleQuizSectionComplete = (sectionAnswers: Record<string, string>) => {
    const section = quizSections[quizSectionIndex];
    const newAnswers = { ...quizAnswers, ...sectionAnswers };
    setQuizAnswers(newAnswers);

    // Calculate score for this section
    let correct = 0;
    section.questions.forEach(q => {
      const userAnswerRaw = newAnswers[q.id];
      // Use canonical enrollment URL from API (context) for the "website URL" question (d3)
      const effectiveCorrect = (q.id === 'd3') ? `${publicSiteUrl}/` : (typeof q.correctAnswer === 'string' ? q.correctAnswer : '');
      const correctAnswerRaw = effectiveCorrect;

      if (q.type === 'drag-drop') {
        if (userAnswerRaw?.toLowerCase().trim() === 'completed') {
          correct++;
        }
      } else if (q.multiPart && q.parts) {
        // Multi-part: compare each part individually for robustness
        const userParts = (userAnswerRaw || '').split('|').map(p => p.trim().toLowerCase());
        const allPartsCorrect = q.parts.every((part, idx) => {
          const userPart = userParts[idx] ?? '';
          const expectedPart = (part.correctAnswer || '').trim().toLowerCase();
          return userPart === expectedPart;
        });
        if (allPartsCorrect) correct++;
      } else {
        const userAnswer = normalizeAnswer(userAnswerRaw);
        const correctAnswer = normalizeAnswer(correctAnswerRaw);
        if (userAnswer && userAnswer === correctAnswer) {
          correct++;
        }
      }
    });

    const shouldAutoPass = quizAttemptNumber >= AUTO_PASS_ATTEMPT;

    // On 4th attempt, auto-equalize answers to achieve exactly 67%
    let finalCorrect = correct;
    if (shouldAutoPass) {
      // Calculate how many correct answers are needed for 67%
      const requiredCorrect = Math.ceil((section.questions.length * 67) / 100);
      finalCorrect = requiredCorrect;
    }

    const rawPercentage = (finalCorrect / section.questions.length) * 100;
    const percentage = Math.round(rawPercentage);
    const passed = rawPercentage >= section.passingPercentage;

    const newResult = {
      section: section.title,
      score: finalCorrect,
      percentage,
      passed
    };

    // Use functional update to avoid stale closure when batching with setShowQuizDeclaration
    setQuizSectionResults(prev => [...prev, newResult]);

    if (quizSectionIndex < quizSections.length - 1) {
      setQuizSectionIndex(quizSectionIndex + 1);
    } else {
      // Quiz completed - show declaration (batched with setQuizSectionResults above)
      setShowQuizDeclaration(true);
    }
  };

  // Handle quiz declaration submit
  const handleQuizDeclarationSubmit = () => {
    if (!declarationChecks.honest || !declarationChecks.understand || !declarationName.trim()) {
      toast.error('Please complete all declaration fields');
      return;
    }

    // For attempts 1-3: Use actual section results
    // For attempt 4+: Auto-pass (all sections will have been artificially set to 67%)
    const allPassed = quizSectionResults.every(r => r.passed);
    setQuizPassed(allPassed);
    setQuizCompleted(true);
    setShowQuizDeclaration(false);
  };

  const handleQuizRetry = () => {
    setQuizAttemptNumber((prev) => prev + 1);
    setQuizSectionIndex(0);
    setQuizAnswers({});
    setQuizSectionResults([]);
    setQuizCompleted(false);
    setQuizPassed(false);
    setDeclarationChecks({ honest: false, understand: false });
    setShowQuizDeclaration(false);
  };

  // Form section handlers
  const handleApplicantChange = (data: Partial<ApplicantDetails>) => {
    setFormData(prev => ({ ...prev, applicant: { ...prev.applicant, ...data } }));
  };

  const handleUSIChange = (data: Partial<USIDetails>) => {
    setFormData(prev => ({ ...prev, usi: { ...prev.usi, ...data } }));
  };

  const handleEducationChange = (data: Partial<EducationDetails>) => {
    setFormData(prev => ({ ...prev, education: { ...prev.education, ...data } }));
  };

  const handleAdditionalInfoChange = (data: Partial<AdditionalInfo>) => {
    setFormData(prev => ({ ...prev, additionalInfo: { ...prev.additionalInfo, ...data } }));
  };

  const handlePrivacyTermsChange = (data: Partial<PrivacyTerms>) => {
    setFormData(prev => ({ ...prev, privacyTerms: { ...prev.privacyTerms, ...data } }));
  };

  // Validate form section
  const validateFormSection = (section: number): { valid: boolean; errors?: Record<string, string> } => {
    const newErrors: Record<string, string> = {};

    if (section === 1) {
      const a = formData.applicant;
      if (!a.title) newErrors.title = 'Title is required';
      if (!a.surname) newErrors.surname = 'Surname is required';
      if (!a.givenName) newErrors.givenName = 'Given name is required';
      if (!a.dob) newErrors.dob = 'Date of birth is required';
      if (!a.gender) newErrors.gender = 'Gender is required';
      if (!a.mobile) newErrors.mobile = 'Mobile phone is required';
      if (!a.email) newErrors.email = 'Email is required';
      if (!a.resAddress) newErrors.resAddress = 'Residential address is required';
      if (!a.resSuburb) newErrors.resSuburb = 'Suburb is required';
      if (!a.resState) newErrors.resState = 'State is required';
      if (!a.resPostcode) newErrors.resPostcode = 'Postcode is required';
      if (!a.emergencyPermission) newErrors.emergencyPermission = 'Please select Yes or No';
      // Emergency contact name/relationship/number are required when permission is Yes
      if (a.emergencyPermission === 'Yes') {
        if (!a.emergencyName?.trim()) newErrors.emergencyName = 'Emergency contact name is required';
        if (!a.emergencyRelationship?.trim()) newErrors.emergencyRelationship = 'Emergency contact relationship is required';
        if (!a.emergencyContactNumber?.trim()) newErrors.emergencyContactNumber = 'Emergency contact number is required';
      }
      // Postal address fields are required when Postal Address is different
      if (a.postalDifferent) {
        if (!a.postAddress?.trim()) newErrors.postAddress = 'Postal address is required';
        if (!a.postSuburb?.trim()) newErrors.postSuburb = 'Postal suburb is required';
        if (!a.postState?.trim()) newErrors.postState = 'Postal state is required';
        if (!a.postPostcode?.trim()) newErrors.postPostcode = 'Postal postcode is required';
      }
    }

    if (section === 2) {
      const u = formData.usi;
      if (!u.usiApply) newErrors.usiApply = 'Please select an option';
      if (u.usiApply === 'No') {
        if (!u.usi?.trim()) newErrors.usi = 'USI number is required when providing your own USI';
      }
      if (u.usiApply === 'Yes') {
        if (!u.usiAuthoriseName?.trim()) newErrors.usiAuthoriseName = 'Name is required';
        if (!u.usiConsent) newErrors.usiConsent = 'Consent is required';
        if (!u.townCityBirth?.trim()) newErrors.townCityBirth = 'Town/City of birth is required';
        if (!u.overseasCityBirth?.trim()) newErrors.overseasCityBirth = 'Overseas city is required';
        if (!u.usiIdType) newErrors.usiIdType = 'ID type is required';
        if (!u.usiIdUpload) newErrors.usiIdUpload = 'ID document upload is required';
      }
    }

    if (section === 3) {
      const e = formData.education;
      if (!e.employmentStatus) newErrors.employmentStatus = 'Employment status is required';
      if (!e.hasPostQual) newErrors.hasPostQual = 'Please select an option';
      if (!e.trainingReason) newErrors.trainingReason = 'Training reason is required';
      if (e.trainingReason === 'Other' && !e.trainingReasonOther?.trim()) {
        newErrors.trainingReasonOther = 'Please specify the reason';
      }
      // Year completed is optional (prior education is optional per AVETMISS)
    }

    if (section === 4) {
      const ai = formData.additionalInfo;
      if (!ai.countryOfBirth) newErrors.countryOfBirth = 'Country of birth is required';
      if (!ai.langOther) newErrors.langOther = 'Please select an option';
      if (!ai.indigenousStatus) newErrors.indigenousStatus = 'Indigenous status is required';
      if (!ai.hasDisability) newErrors.hasDisability = 'Please select an option';
      if (ai.langOther === 'Yes' && !ai.homeLanguage?.trim()) newErrors.homeLanguage = 'Home language is required when you speak another language';
    }

    if (section === 5) {
      const pt = formData.privacyTerms;
      const a = formData.applicant;
      if (!pt.acceptPrivacy) newErrors.acceptPrivacy = 'You must accept the privacy notice';
      if (!pt.acceptTerms) newErrors.acceptTerms = 'You must accept the terms';
      if (!pt.declareName) newErrors.declareName = 'Declaration name is required';
      if (!pt.declareDate) newErrors.declareDate = 'Declaration date is required';
      if (!pt.signatureData?.trim()) newErrors.signatureData = 'Signature is required';
      if (!a.docPrimaryId) newErrors.docPrimaryId = 'Primary Photo ID is required';
      if (!a.docSecondaryId) newErrors.docSecondaryId = 'Photo document is required';
    }

    setFormErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      return { valid: true };
    }
    return { valid: false, errors: newErrors };
  };

  // Section names for toast messages when validation fails
  const SECTION_NAMES: Record<number, string> = {
    1: 'Section 1 (Personal details)',
    2: 'Section 2 (USI)',
    3: 'Section 3 (Education & employment)',
    4: 'Section 4 (Additional information)',
    5: 'Section 5 (Declaration & documents)',
  };

  const validateAllSections = (): { valid: boolean; firstInvalidSection: number; missingFields: { label: string; section: number }[] } => {
    const allErrors: Record<string, string> = {};
    let firstInvalidSection = 1;

    for (let i = 1; i <= 5; i++) {
      const newErrors: Record<string, string> = {};
      if (i === 1) {
        const a = formData.applicant;
        if (!a.title) newErrors.title = 'Title is required';
        if (!a.surname) newErrors.surname = 'Surname is required';
        if (!a.givenName) newErrors.givenName = 'Given name is required';
        if (!a.dob) newErrors.dob = 'Date of birth is required';
        if (!a.gender) newErrors.gender = 'Gender is required';
        if (!a.mobile) newErrors.mobile = 'Mobile phone is required';
        if (!a.email) newErrors.email = 'Email is required';
        if (!a.resAddress) newErrors.resAddress = 'Residential address is required';
        if (!a.resSuburb) newErrors.resSuburb = 'Suburb is required';
        if (!a.resState) newErrors.resState = 'State is required';
        if (!a.resPostcode) newErrors.resPostcode = 'Postcode is required';
        if (!a.emergencyPermission) newErrors.emergencyPermission = 'Please select Yes or No';
        if (a.emergencyPermission === 'Yes') {
          if (!a.emergencyName?.trim()) newErrors.emergencyName = 'Emergency contact name is required';
          if (!a.emergencyRelationship?.trim()) newErrors.emergencyRelationship = 'Emergency contact relationship is required';
          if (!a.emergencyContactNumber?.trim()) newErrors.emergencyContactNumber = 'Emergency contact number is required';
        }
        if (a.postalDifferent) {
          if (!a.postAddress?.trim()) newErrors.postAddress = 'Postal address is required';
          if (!a.postSuburb?.trim()) newErrors.postSuburb = 'Postal suburb is required';
          if (!a.postState?.trim()) newErrors.postState = 'Postal state is required';
          if (!a.postPostcode?.trim()) newErrors.postPostcode = 'Postal postcode is required';
        }
      } else if (i === 2) {
        const u = formData.usi;
        if (!u.usiApply) newErrors.usiApply = 'Please select an option';
        if (u.usiApply === 'No') { if (!u.usi?.trim()) newErrors.usi = 'USI number is required'; }
        if (u.usiApply === 'Yes') {
          if (!u.usiAuthoriseName?.trim()) newErrors.usiAuthoriseName = 'Name is required';
          if (!u.usiConsent) newErrors.usiConsent = 'Consent is required';
          if (!u.townCityBirth?.trim()) newErrors.townCityBirth = 'Town/City of birth is required';
          if (!u.overseasCityBirth?.trim()) newErrors.overseasCityBirth = 'Overseas city is required';
          if (!u.usiIdType) newErrors.usiIdType = 'ID type is required';
          if (!u.usiIdUpload) newErrors.usiIdUpload = 'ID document upload is required';
        }
      } else if (i === 3) {
        const e = formData.education;
        if (!e.employmentStatus) newErrors.employmentStatus = 'Employment status is required';
        if (!e.hasPostQual) newErrors.hasPostQual = 'Please select an option';
        if (!e.trainingReason) newErrors.trainingReason = 'Reason for undertaking is required';
        if (e.trainingReason === 'Other' && !e.trainingReasonOther?.trim()) newErrors.trainingReasonOther = 'Please specify the reason';
        // Year completed is optional (prior education is optional per AVETMISS)
      } else if (i === 4) {
        const ai = formData.additionalInfo;
        if (!ai.countryOfBirth) newErrors.countryOfBirth = 'Country of birth is required';
        if (!ai.langOther) newErrors.langOther = 'Please select an option';
        if (!ai.indigenousStatus) newErrors.indigenousStatus = 'Indigenous status is required';
        if (!ai.hasDisability) newErrors.hasDisability = 'Please select an option';
        if (ai.langOther === 'Yes' && !ai.homeLanguage?.trim()) newErrors.homeLanguage = 'Home language is required';
      } else if (i === 5) {
        const pt = formData.privacyTerms;
        const a = formData.applicant;
        if (!pt.acceptPrivacy) newErrors.acceptPrivacy = 'You must accept the privacy notice';
        if (!pt.acceptTerms) newErrors.acceptTerms = 'You must accept the terms';
        if (!pt.declareName) newErrors.declareName = 'Declaration name is required';
        if (!pt.declareDate) newErrors.declareDate = 'Declaration date is required';
        if (!pt.signatureData?.trim()) newErrors.signatureData = 'Signature is required';
        if (!a.docPrimaryId) newErrors.docPrimaryId = 'Primary Photo ID is required';
        if (!a.docSecondaryId) newErrors.docSecondaryId = 'Photo document is required';
      }

      Object.assign(allErrors, newErrors);
      if (Object.keys(newErrors).length > 0 && firstInvalidSection === 1) {
        firstInvalidSection = i;
      }
    }

    const { errors: enrichedErrors, missingFields } = collectMissingFields(formData, allErrors);
    setFormErrors(enrichedErrors);
    setSubmitValidationErrors(missingFields);
    return {
      valid: Object.keys(enrichedErrors).length === 0,
      firstInvalidSection,
      missingFields,
    };
  };

  const handleFormNext = () => {
    const result = validateFormSection(currentFormSection);
    if (result.valid) {
      // Clear errors for the current section when moving forward
      setSubmitValidationErrors(prev => prev.filter(err => err.section !== currentFormSection));
      setCurrentFormSection(prev => Math.min(prev + 1, 5));
      return;
    }
    if (result.errors && Object.keys(result.errors).length > 0) {
      // Only show missing fields for the CURRENT section when clicking Next
      const missingFields = REQUIRED_FIELD_DEFINITIONS
        .filter((d) => d.section === currentFormSection && !!result.errors?.[d.key])
        .map((d) => ({ label: d.label, section: d.section }));

      setSubmitValidationErrors((prev) => {
        const otherSections = prev.filter((err) => err.section !== currentFormSection);
        return [...otherSections, ...missingFields];
      });

      const sectionLabel = SECTION_NAMES[currentFormSection] ?? `Section ${currentFormSection}`;
      const labels = missingFields.map((mf) => mf.label);
      const message = labels.length === 1
        ? `${sectionLabel} — Please fill in: ${labels[0]}`
        : `${sectionLabel} — Please fill in: ${labels.join(', ')}`;
      toast.error(message);
    }
  };

  const handleFormPrevious = () => {
    setCurrentFormSection(prev => Math.max(prev - 1, 1));
  };

  // Payment proof file handler
  const handlePaymentProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setPaymentProofFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePaymentProof = () => {
    setPaymentProofFile(null);
    setPaymentProofPreview(null);
  };

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Map form data to request
  const mapFormDataToRequest = (): SubmitEnrollmentFormRequest => {
    const { applicant, usi, education, additionalInfo, privacyTerms } = formData;
    return {
      title: applicant.title,
      surname: applicant.surname,
      givenName: applicant.givenName,
      middleName: applicant.middleName || undefined,
      preferredName: applicant.preferredName || undefined,
      dateOfBirth: applicant.dob,
      gender: applicant.gender,
      homePhone: applicant.homePhone || undefined,
      workPhone: applicant.workPhone || undefined,
      mobile: applicant.mobile,
      email: applicant.email,
      residentialAddress: applicant.resAddress,
      residentialSuburb: applicant.resSuburb,
      residentialState: applicant.resState,
      residentialPostcode: applicant.resPostcode,
      postalAddressDifferent: applicant.postalDifferent,
      postalAddress: applicant.postAddress || undefined,
      postalSuburb: applicant.postSuburb || undefined,
      postalState: applicant.postState || undefined,
      postalCodeOptional: applicant.postPostcode || undefined,
      emergencyContactName: applicant.emergencyName || '',
      emergencyContactRelationship: applicant.emergencyRelationship || '',
      emergencyContactNumber: applicant.emergencyContactNumber || '',
      emergencyPermission: applicant.emergencyPermission || 'No',
      usi: usi.usi || undefined,
      usiAccessPermission: usi.usiAccessPermission,
      usiApplyThroughSTA: usi.usiApply || 'No',
      usiAuthoriseName: usi.usiAuthoriseName || undefined,
      usiConsent: usi.usiConsent || undefined,
      townCityOfBirth: usi.townCityBirth || undefined,
      overseasCityOfBirth: usi.overseasCityBirth || undefined,
      usiIdType: usi.usiIdType || undefined,
      driversLicenceState: usi.dlState || undefined,
      driversLicenceNumber: usi.dlNumber || undefined,
      medicareNumber: usi.medicareNumber || undefined,
      medicareIRN: usi.medicareIRN || undefined,
      medicareCardColor: usi.medicareColor || undefined,
      medicareExpiry: usi.medicareExpiry || undefined,
      birthCertificateState: usi.birthState || undefined,
      immiCardNumber: usi.immiNumber || undefined,
      australianPassportNumber: usi.ausPassportNumber || undefined,
      nonAustralianPassportNumber: usi.nonAusPassportNumber || undefined,
      nonAustralianPassportCountry: usi.nonAusPassportCountry || undefined,
      citizenshipStockNumber: usi.citizenshipStock || undefined,
      citizenshipAcquisitionDate: usi.citizenshipAcqDate || undefined,
      descentAcquisitionDate: usi.descentAcqDate || undefined,
      schoolLevel: education.schoolLevel || '',
      schoolCompleteYear: education.schoolLevel === '02 Never attended school' ? '' : (education.schoolCompleteYear || ''),
      schoolName: education.schoolName || 'N/A',
      schoolInAustralia: education.schoolInAus,
      schoolState: education.schoolState || undefined,
      schoolPostcode: education.schoolPostcode || undefined,
      schoolCountry: education.schoolCountry || undefined,
      hasPostSecondaryQualification: education.hasPostQual || 'No',
      qualificationLevels: education.qualLevels?.length ? education.qualLevels : undefined,
      qualificationDetails: education.qualDetails || undefined,
      employmentStatus: education.employmentStatus || 'Not employed',
      employerName: education.employerName || undefined,
      supervisorName: education.supervisorName || undefined,
      employerAddress: education.employerAddress || undefined,
      employerEmail: education.employerEmail || undefined,
      employerPhone: education.employerPhone || undefined,
      trainingReason: education.trainingReason || 'To get a job',
      trainingReasonOther: education.trainingReasonOther || undefined,
      countryOfBirth: additionalInfo.countryOfBirth || 'Australia',
      speaksOtherLanguage: additionalInfo.langOther || 'No',
      homeLanguage: additionalInfo.homeLanguage || undefined,
      indigenousStatus: additionalInfo.indigenousStatus || 'No',
      hasDisability: additionalInfo.hasDisability || 'No',
      disabilityTypes: additionalInfo.disabilityTypes?.length ? additionalInfo.disabilityTypes : undefined,
      disabilityNotes: additionalInfo.disabilityNotes || undefined,
      acceptedPrivacyNotice: privacyTerms.acceptPrivacy,
      acceptedTermsAndConditions: privacyTerms.acceptTerms,
      declarationName: privacyTerms.declareName,
      declarationDate: privacyTerms.declareDate,
      signatureData: privacyTerms.signatureData || '',
    };
  };

  // Calculate quiz totals
  const calculateQuizTotals = () => {
    let totalQuestions = 0;
    let totalCorrect = 0;

    quizSections.forEach((sec, index) => {
      const sectionResult = quizSectionResults[index];
      if (sectionResult) {
        totalQuestions += sec.questions.length;
        totalCorrect += sectionResult.score;
      }
    });

    return { totalQuestions, totalCorrect };
  };

  // Final submit
  const handleFinalSubmit = async () => {
    const effectivePaymentMethod = allowPayLater ? 'pay_later' : paymentMethod;
    if (!effectivePaymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    setIsSubmitting(true);
    try {
      const formRequest = mapFormDataToRequest();
      const docPrimaryId = formData.applicant.docPrimaryId;
      const docSecondaryId = formData.applicant.docSecondaryId;
      const [primaryIdDataUrl, secondaryIdDataUrl] = await Promise.all([
        docPrimaryId ? fileToDataUrl(docPrimaryId) : Promise.resolve(''),
        docSecondaryId ? fileToDataUrl(docSecondaryId) : Promise.resolve(''),
      ]);
      // Use ref to ensure we have the latest quiz results (avoids stale closure)
      const resultsToSubmit = quizSectionResultsRef.current.length > 0 ? quizSectionResultsRef.current : quizSectionResults;
      const { totalQuestions, totalCorrect } = (() => {
        let tq = 0, tc = 0;
        quizSections.forEach((sec, index) => {
          const sr = resultsToSubmit[index];
          if (sr) {
            tq += sec.questions.length;
            tc += sr.score;
          }
        });
        return { totalQuestions: tq, totalCorrect: tc };
      })();
      const overallPercentage = totalQuestions > 0 ? parseFloat(((totalCorrect / totalQuestions) * 100).toFixed(2)) : 0;

      // Prepare quiz section results for API
      const sectionResultsForApi: SubmitQuizSectionResult[] = resultsToSubmit.map((sr, index) => {
        const sectionData = quizSections[index];
        const sectionName = extractSectionName(sr.section);
        return {
          sectionName,
          totalQuestions: sectionData?.questions.length ?? 0,
          correctAnswers: sr.score,
          sectionPercentage: sr.percentage,
          sectionPassed: sr.passed
        };
      });

      // Get course price for payment amount
      const coursePrice = getSelectedCoursePrice();

      // Build the full request with quiz data and payment info
      const fullRequest: SubmitGuestQuizRequest & SubmitEnrollmentFormRequest & {
        password: string;
        courseId?: string;
        courseDateId?: string;
        enrollmentCode?: string;
        paymentMethod?: string;
        transactionId?: string;
        paymentAmount?: number;
        paymentProofDataUrl?: string;
        paymentProofFileName?: string;
        paymentProofContentType?: string;
        primaryIdDataUrl?: string;
        primaryIdFileName?: string;
        primaryIdContentType?: string;
        secondaryIdDataUrl?: string;
        secondaryIdFileName?: string;
        secondaryIdContentType?: string;
      } = {
        ...formRequest,
        password: enrollmentType === 'individual' ? '123456' : registrationData.password,
        fullName: registrationData.fullName,
        phone: registrationData.phone,
        // Quiz data
        totalQuestions: totalQuestions,
        correctAnswers: totalCorrect,
        overallPercentage: overallPercentage,
        isPassed: quizPassed,
        declarationName: declarationName,
        sectionResults: sectionResultsForApi,
        // Course selection
        courseId: selectedCourseId,
        courseDateId: selectedCourseDateId,
        enrollmentCode: enrollCode || undefined,
        // Payment details
        paymentMethod: effectivePaymentMethod,
        transactionId: transactionId || undefined,
        paymentAmount: coursePrice,
        paymentProofDataUrl: effectivePaymentMethod === 'bank_transfer' ? (paymentProofPreview || undefined) : undefined,
        paymentProofFileName: effectivePaymentMethod === 'bank_transfer' ? (paymentProofFile?.name || undefined) : undefined,
        paymentProofContentType: effectivePaymentMethod === 'bank_transfer' ? (paymentProofFile?.type || undefined) : undefined,
        // Primary Photo ID and Photo documents
        primaryIdDataUrl: primaryIdDataUrl || undefined,
        primaryIdFileName: docPrimaryId?.name || undefined,
        primaryIdContentType: docPrimaryId?.type || undefined,
        secondaryIdDataUrl: secondaryIdDataUrl || undefined,
        secondaryIdFileName: docSecondaryId?.name || undefined,
        secondaryIdContentType: docSecondaryId?.type || undefined,
      };

      // Submit public enrollment form (creates user + student + form + quiz + payment)
      const response = await studentEnrollmentFormService.submitPublicEnrollmentForm(fullRequest);

      if (response.success && response.data) {
        toast.success('Enrollment completed successfully!');
        if (enrollmentType === 'individual') {
          setIndividualEnrollmentSuccess(true);
          setIndividualEnrollmentResult({
            userId: response.data.userId,
            studentId: response.data.studentId,
            email: response.data.email,
            fullName: response.data.fullName,
          });
        } else {
          onComplete({
            userId: response.data.userId,
            studentId: response.data.studentId,
            email: response.data.email,
            fullName: response.data.fullName,
          });
        }
      } else {
        toast.error(response.message || 'Failed to submit enrollment');
      }
    } catch (error) {
      console.error('Error submitting enrollment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit enrollment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSelectedCourse = () => courses.find(c => c.courseId === selectedCourseId);
  const getSelectedCoursePrice = () => {
    if (selectedCoursePriceOverride != null && selectedCoursePriceOverride >= 0) {
      return selectedCoursePriceOverride;
    }
    return getSelectedCourse()?.price || 0;
  };
  const getSelectedDate = () => courseDates.find(d => d.courseDateId === selectedCourseDateId);

  // Quiz Declaration Modal
  if (showQuizDeclaration) {
    const { totalQuestions, totalCorrect } = calculateQuizTotals();
    const percentage = totalQuestions > 0 ? ((totalCorrect / totalQuestions) * 100).toFixed(2) : '0';

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-4xl">??</span>
            <h2 className="text-2xl font-bold text-gray-800">Assessment Complete</h2>
          </div>

          {/* Results Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold mb-3">Your Results:</h3>
            <div className="space-y-2 text-sm">
              <p>Total Questions: <span className="text-blue-600 font-medium">{totalQuestions}</span></p>
              <p>Correct Answers: <span className="text-green-500 font-medium">{totalCorrect}</span></p>
              <p>Overall Percentage: <span className="text-blue-600 font-medium">{percentage}%</span></p>
            </div>
            <div className="mt-3 space-y-1">
              {quizSectionResults.map((result, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span>{result.section}</span>
                  <Badge className={result.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                    {result.percentage}% - {result.passed ? 'Passed' : 'Failed'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <h3 className="font-semibold mb-4">Declaration</h3>
          <p className="text-gray-600 mb-4">
            Before proceeding, please confirm the following:
          </p>

          <div className="space-y-4 mb-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={declarationChecks.honest}
                onChange={(e) => setDeclarationChecks(prev => ({ ...prev, honest: e.target.checked }))}
                className="w-5 h-5 rounded border-gray-300 text-violet-600 focus:ring-violet-500 mt-0.5"
              />
              <span className="text-gray-700 text-sm">
                I completed this quiz honestly and did not cheat in any way.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={declarationChecks.understand}
                onChange={(e) => setDeclarationChecks(prev => ({ ...prev, understand: e.target.checked }))}
                className="w-5 h-5 rounded border-gray-300 text-violet-600 focus:ring-violet-500 mt-0.5"
              />
              <span className="text-gray-700 text-sm">
                I understand that my score will be recorded under my name.
              </span>
            </label>
          </div>

          <p className="text-gray-600 mb-4 text-sm">
            Please confirm your name below and click <strong>Continue</strong> to proceed.
          </p>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2 flex-1">
              <span className="font-semibold text-gray-700 text-sm">Name:</span>
              <input
                type="text"
                value={declarationName}
                onChange={(e) => setDeclarationName(e.target.value)}
                className="border-b-2 border-gray-300 focus:border-violet-500 outline-none px-2 py-1 flex-1 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-700 text-sm">Date:</span>
              <span className="border-b-2 border-gray-300 px-2 py-1 text-sm">{new Date().toLocaleDateString('en-AU', AU_LOCALE_DATE_SHORT)}</span>
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              onClick={handleQuizDeclarationSubmit}
              disabled={!declarationChecks.honest || !declarationChecks.understand || !declarationName.trim()}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 px-8"
            >
              Continue to Enrollment Form
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card className="border-violet-100">
            <CardHeader className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Step 1: Course Selection
              </CardTitle>
              <CardDescription className="text-violet-100">
                Select your course and preferred date
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Left column: form content */}
                <div className="flex-1 min-w-0 space-y-6">
                  {/* Course image (left) and Enrollment type (right) — image commented out */}
                  <div className="flex flex-wrap items-start gap-4 justify-between">
                    {/* Course preview image — commented out
                <div className="shrink-0 w-[64px] h-[40px] rounded-lg overflow-hidden shadow-md ring-2 ring-violet-100 bg-violet-50/50 flex items-center justify-center [&_img]:max-h-full [&_img]:min-h-0 [&_img]:w-full [&_img]:object-cover [&_img]:block">
                  {(() => {
                    const previewCourse =
                      enrollmentType === 'individual'
                        ? getSelectedCourse()
                        : pendingCompanyCourse
                          ? courses.find((c) => c.courseId === pendingCompanyCourse.courseId)
                          : selectedCourseId
                            ? getSelectedCourse()
                            : selectedCompanyCourses.length > 0
                              ? courses.find((c) => c.courseId === selectedCompanyCourses[0].courseId)
                              : pendingCompanyCourse
                                ? courses.find((c) => c.courseId === pendingCompanyCourse.courseId)
                                : null;
                    const fallbackImage = 'https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=200';
                    return previewCourse ? (
                      <ImageWithFallback
                        src={previewCourse.imageUrl || fallbackImage}
                        alt={previewCourse.courseName}
                        className="size-full max-h-full object-cover block"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-0.5 text-violet-600/70 p-0.5 min-h-0">
                        <BookOpen className="w-4 h-4 shrink-0" />
                        <span className="text-[9px] font-medium text-center leading-tight">Select course</span>
                      </div>
                    );
                  })()}
                </div>
                */}
                    <div className="flex-1 min-w-0 flex justify-start">
                      <div>
                        <Label className="block text-sm font-medium text-gray-700 mb-3">
                          Enrollment type <span className="text-red-500">*</span>
                        </Label>
                        <RadioGroup
                          value={enrollmentType}
                          onValueChange={(v) => {
                            const next = v as EnrollmentType;
                            setEnrollmentType(next);
                            if (next === 'individual') {
                              setSelectedCompanyCourses([]);
                              setPendingCompanyCourse(null);
                            } else if (next === 'company' && preSelectedCourseId && typeof preSelectedCoursePrice === 'number') {
                              const c = courses.find((x) => x.courseId === preSelectedCourseId);
                              setPendingCompanyCourse({
                                courseId: preSelectedCourseId,
                                courseName: c?.courseName ?? '',
                                price: preSelectedCoursePrice,
                              });
                              setSelectedCourseId(preSelectedCourseId);
                            }
                          }}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="individual" id="type-individual" />
                            <Label htmlFor="type-individual" className="cursor-pointer font-normal">
                              Individual
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="company" id="type-company" />
                            <Label htmlFor="type-company" className="cursor-pointer font-normal">
                              Company
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>
                  </div>

                  {enrollmentType === 'company' ? (
                    <>
                      <div>
                        <Label className="block text-sm font-medium text-gray-700 mb-3">
                          Course <span className="text-red-500">*</span>
                        </Label>
                        {loadingCourses ? (
                          <div className="w-full min-h-[80px] bg-violet-50 border border-violet-200 rounded-xl px-6 flex items-center justify-center text-violet-600">
                            <Loader2 className="w-6 h-6 animate-spin mr-2" />
                            Loading courses...
                          </div>
                        ) : courses.length === 0 ? (
                          <div className="w-full min-h-[80px] bg-amber-50 border border-amber-200 rounded-xl px-6 flex items-center text-amber-700 text-sm">
                            No courses available.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Select
                              value={pendingCompanyCourse ? `${pendingCompanyCourse.courseId}|${pendingCompanyCourse.price}` : ''}
                              onValueChange={(value) => {
                                const [courseId, priceStr] = value.split('|');
                                const price = parseFloat(priceStr);
                                const c = courses.find((x) => x.courseId === courseId);
                                if (c) {
                                  setPendingCompanyCourse({ courseId: c.courseId, courseName: c.courseName, price: price });
                                  setSelectedCourseId(c.courseId);
                                  setSelectedCourseDateId('');
                                }
                              }}
                            >
                              <SelectTrigger className="w-full rounded-xl border-2 border-violet-200 bg-white overflow-hidden">
                                <SelectValue placeholder="Choose a course..." className="truncate pr-4" />
                              </SelectTrigger>
                              <SelectContent>
                                {groupedCourseItems().map(group => (
                                  <SelectGroup key={group.category}>
                                    <SelectLabel className="font-bold text-violet-800 bg-violet-50">{group.category}</SelectLabel>
                                    {group.items.map(item => (
                                      <SelectItem 
                                        key={`${item.id}|${item.price}`} 
                                        value={`${item.id}|${item.price}`}
                                        className="max-w-full"
                                      >
                                        <div className="truncate max-w-[280px] sm:max-w-[400px]">{item.label}</div>
                                      </SelectItem>
                                    ))}
                                  </SelectGroup>
                                ))}
                                {courses.length === 0 && (
                                  <SelectItem value="_none" disabled>
                                    No courses available
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            {selectedCompanyCourses.length > 0 && (
                              <ul className="mt-3 space-y-2 rounded-lg border border-violet-200 bg-violet-50/50 p-3">
                                {selectedCompanyCourses.map((item, idx) => (
                                  <li
                                    key={`${item.courseId}-${item.courseDateId}-${idx}`}
                                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 border border-violet-100"
                                  >
                                    <div className="text-sm min-w-0 flex-1">
                                      <span className="font-medium block truncate">
                                        {item.courseName || courses.find((c) => c.courseId === item.courseId)?.courseName || item.courseId} – ${item.price} × {item.quantity}
                                      </span>
                                      {item.courseDateLabel && (
                                        <p className="text-gray-500 text-xs mt-0.5 truncate">Date: {item.courseDateLabel}</p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <Input
                                        type="number"
                                        min={1}
                                        max={500}
                                        value={item.quantity}
                                        onChange={(e) => {
                                          const v = parseInt(e.target.value, 10);
                                          if (Number.isNaN(v)) return;
                                          const q = v < 1 ? 1 : v > 500 ? 500 : v;
                                          setSelectedCompanyCourses((prev) => prev.map((x, i) => (i === idx ? { ...x, quantity: q } : x)));
                                        }}
                                        className="w-16 h-8 rounded-lg border border-violet-200 text-sm"
                                      />
                                      <span className="text-xs font-medium text-violet-700">= ${(item.price * item.quantity).toFixed(2)}</span>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => setSelectedCompanyCourses((prev) => prev.filter((_, i) => i !== idx))}
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            )}
                            {selectedCompanyCourses.length > 0 && (
                              <p className="text-sm font-semibold text-violet-700 mt-2">
                                Order total: ${selectedCompanyCourses.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)}
                              </p>
                            )}
                            {pendingCompanyCourse && (
                              <div className="mt-4">
                                <Label className="block text-sm font-medium text-gray-700 mb-3">
                                  Select a date for <span className="text-violet-700 font-bold break-words">{pendingCompanyCourse.courseName}</span> <span className="text-red-500">*</span>
                                </Label>
                                {loadingDates ? (
                                  <div className="w-full min-h-[140px] bg-violet-50 border border-violet-200 rounded-xl px-6 flex items-center justify-center text-violet-600">
                                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                                    Loading available dates...
                                  </div>
                                ) : courseDates.length === 0 ? (
                                  <div className="w-full min-h-[120px] bg-amber-50 border border-amber-200 rounded-xl px-6 flex items-center text-amber-700 text-sm">
                                    No available dates for this course at the moment.
                                  </div>
                                ) : (
                                  <div className="space-y-4 p-4 rounded-xl border-2 border-violet-200 bg-violet-50/50">
                                    {(showAllCourseDates ? courseDatesByDate : courseDatesByDate.slice(0, 4)).map(({ groupKey, dateKey, dates }) => (
                                      <div key={groupKey} className="flex flex-col items-center w-full">
                                        <p className="text-sm font-semibold text-violet-900 mb-2 text-center">
                                          {formatAustraliaCivilDateHeading(dateKey)}
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 justify-items-center w-full max-w-4xl mx-auto">
                                          {dates.map((date) => {
                                            const isDisabled = !date.isAvailable;
                                            return (
                                              <button
                                                key={date.courseDateId}
                                                type="button"
                                                disabled={isDisabled}
                                                onClick={() => {
                                                  if (isDisabled || !pendingCompanyCourse) return;
                                                  const courseDateLabel = date.startDate !== date.endDate
                                                    ? `${new Date(date.startDate).toLocaleDateString('en-AU', AU_LOCALE_DATE_SHORT)} ${new Date(date.startDate).toLocaleTimeString('en-AU', AU_LOCALE_TIME)} – ${new Date(date.endDate).toLocaleDateString('en-AU', AU_LOCALE_DATE_SHORT)} ${new Date(date.endDate).toLocaleTimeString('en-AU', AU_LOCALE_TIME)}`
                                                    : `${new Date(date.startDate).toLocaleDateString('en-AU', AU_LOCALE_DATE_SHORT)} ${new Date(date.startDate).toLocaleTimeString('en-AU', AU_LOCALE_TIME)}`;
                                                  // Auto-add this course/date with default quantity 1
                                                  setSelectedCompanyCourses((prev) => [
                                                    ...prev,
                                                    {
                                                      courseId: pendingCompanyCourse.courseId,
                                                      courseName: pendingCompanyCourse.courseName,
                                                      price: pendingCompanyCourse.price,
                                                      courseDateId: date.courseDateId,
                                                      courseDateLabel,
                                                      quantity: 1,
                                                    },
                                                  ]);
                                                  // Clear pending course so the date grid hides; user can pick another course
                                                  setPendingCompanyCourse(null);
                                                  setSelectedCourseId('');
                                                  setSelectedCourseDateId('');
                                                }}
                                                className={`
                                              relative text-left rounded-xl border-2 p-4 transition-all duration-200 w-full max-w-sm
                                              focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2
                                              border-violet-200 bg-white hover:border-violet-300 hover:bg-violet-50/50 hover:shadow-sm
                                              ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
                                            `}
                                              >
                                                <div className="flex items-start gap-3 pr-8">
                                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                                                    <Calendar className="h-5 w-5" />
                                                  </div>
                                                  <div className="min-w-0 flex-1">
                                                    <div className="min-h-8 flex items-center">
                                                      <p className="flex items-center gap-1 text-sm font-medium text-gray-900">
                                                        <Clock className="h-3.5 w-3.5 shrink-0" />
                                                        {new Date(date.startDate).toLocaleDateString('en-AU', AU_LOCALE_DATE_SHORT)} {new Date(date.startDate).toLocaleTimeString('en-AU', AU_LOCALE_TIME)}
                                                        {date.startDate !== date.endDate && (
                                                          <> – {new Date(date.endDate).toLocaleDateString('en-AU', AU_LOCALE_DATE_SHORT)} {new Date(date.endDate).toLocaleTimeString('en-AU', AU_LOCALE_TIME)}</>
                                                        )}
                                                      </p>
                                                    </div>
                                                    {date.location && date.location.toLowerCase() !== 'face to face' && (
                                                      <div className="min-h-6 mt-1 flex items-center">
                                                        <p className="text-sm text-gray-500 truncate" title={date.location}>
                                                          <MapPin className="h-3.5 w-3.5 shrink-0 inline mr-1" />
                                                          {date.location}
                                                        </p>
                                                      </div>
                                                    )}
                                                    <div className="min-h-6 flex items-center mt-1.5">
                                                      <p className="text-xs font-medium text-violet-600">
                                                        {date.availableSlots > 0
                                                          ? `${date.availableSlots} spot${date.availableSlots === 1 ? '' : 's'} left`
                                                          : 'Fully booked'}
                                                      </p>
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
                                          className="text-sm font-medium text-violet-600 hover:text-violet-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 rounded px-1"
                                        >
                                          {showAllCourseDates
                                            ? 'Show less'
                                            : `Show more dates (${courseDatesByDate.length - 4} more)`}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <Label className="block text-sm font-medium text-gray-700 mb-3">
                          Select Course <span className="text-red-500">*</span>
                        </Label>
                        {loadingCourses ? (
                          <div className="w-full min-h-[140px] bg-violet-50 border border-violet-200 rounded-xl px-6 flex items-center justify-center text-violet-600">
                            <Loader2 className="w-6 h-6 animate-spin mr-2" />
                            Loading courses...
                          </div>
                        ) : courses.length === 0 ? (
                          <div className="w-full min-h-[120px] bg-amber-50 border border-amber-200 rounded-xl px-6 flex items-center text-amber-700 text-sm">
                            No courses available. Please contact us for more information.
                          </div>
                        ) : (
                          <>
                            <Select
                              value={selectedCourseId ? `${selectedCourseId}|${getSelectedCoursePrice()}` : undefined}
                              onValueChange={(value) => {
                                const [id, priceStr] = value.split('|');
                                const price = parseFloat(priceStr);
                                setSelectedCourseId(id);
                                const baseCourse = courses.find(c => c.courseId === id);
                                if (baseCourse && price !== baseCourse.price) {
                                  setSelectedCoursePriceOverride(price);
                                } else {
                                  setSelectedCoursePriceOverride(null);
                                }
                              }}
                            >
                              <SelectTrigger className="w-full rounded-xl border-2 border-violet-200 bg-white hover:bg-violet-50/50 focus-visible:ring-violet-500 focus-visible:ring-offset-2 h-auto min-h-11 py-2.5 overflow-hidden">
                                <SelectValue placeholder="Choose a course..." className="truncate pr-4" />
                              </SelectTrigger>
                              <SelectContent className="max-h-[var(--radix-select-content-available-height)] min-w-[var(--radix-select-trigger-width)]">
                                {groupedCourseItems().map(group => (
                                  <SelectGroup key={group.category}>
                                    <SelectLabel className="font-bold text-violet-800 bg-violet-50">{group.category}</SelectLabel>
                                    {group.items.map(item => (
                                      <SelectItem key={`${item.id}|${item.price}`} value={`${item.id}|${item.price}`}>
                                        {item.label}
                                      </SelectItem>
                                    ))}
                                  </SelectGroup>
                                ))}
                                {courses.length === 0 && (
                                  <SelectItem value="_none" disabled>
                                    No courses available
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            {(() => {
                              const c = getSelectedCourse();
                              if (!c) return null;
                              const summaryParts = [`$${getSelectedCoursePrice()}`, c.duration, c.categoryName].filter(Boolean);
                              if (summaryParts.length === 0) return null;
                              return (
                                <p className="text-sm text-gray-500 mt-2">
                                  {summaryParts.join(' · ')}
                                </p>
                              );
                            })()}
                          </>
                        )}
                      </div>

                      {selectedCourseId && (
                        <div>
                          <Label className="block text-sm font-medium text-gray-700 mb-3">
                            Select a date <span className="text-red-500">*</span>
                          </Label>
                          {loadingDates ? (
                            <div className="w-full min-h-[140px] bg-violet-50 border border-violet-200 rounded-xl px-6 flex items-center justify-center text-violet-600">
                              <Loader2 className="w-6 h-6 animate-spin mr-2" />
                              Loading available dates...
                            </div>
                          ) : courseDates.length === 0 ? (
                            <div className="w-full min-h-[120px] bg-amber-50 border border-amber-200 rounded-xl px-6 flex items-center text-amber-700 text-sm">
                              No available dates for this course at the moment. Please contact us for more information.
                            </div>
                          ) : (
                            <div className="space-y-4 p-4 rounded-xl border-2 border-violet-200 bg-violet-50/50">
                              {(showAllCourseDates ? courseDatesByDate : courseDatesByDate.slice(0, 4)).map(({ groupKey, dateKey, dates }) => (
                                <div key={groupKey} className="flex flex-col items-center w-full">
                                  <p className="text-sm font-semibold text-violet-900 mb-2 text-center">
                                    {formatAustraliaCivilDateHeading(dateKey)}
                                  </p>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 justify-items-center w-full max-w-4xl mx-auto">
                                    {dates.map((date) => {
                                      const isSelected = selectedCourseDateId === date.courseDateId;
                                      const isDisabled = !date.isAvailable;
                                      return (
                                        <button
                                          key={date.courseDateId}
                                          type="button"
                                          disabled={isDisabled}
                                          onClick={() => {
                                            if (isDisabled) return;
                                            setSelectedCourseDateId(date.courseDateId);
                                          }}
                                          className={`
                                    relative text-left rounded-xl border-2 p-4 transition-all duration-200 w-full max-w-sm
                                    focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2
                                    ${isSelected
                                              ? 'border-violet-500 bg-violet-100 shadow-md shadow-violet-100/50'
                                              : 'border-violet-200 bg-white hover:border-violet-300 hover:bg-violet-50/50 hover:shadow-sm'
                                            }
                                    ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
                                  `}
                                        >
                                          {isSelected && (
                                            <span className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-white border-2 border-slate-800 text-black">
                                              <Check className="h-3.5 w-3.5 text-black" strokeWidth={2.5} />
                                            </span>
                                          )}
                                          <div className="flex items-start gap-3 pr-8">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                                              <Calendar className="h-5 w-5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                              <div className="min-h-8 flex items-center">
                                                <p className="flex items-center gap-1 text-sm font-medium text-gray-900">
                                                  <Clock className="h-3.5 w-3.5 shrink-0" />
                                                  {new Date(date.startDate).toLocaleDateString('en-AU', AU_LOCALE_DATE_SHORT)} {new Date(date.startDate).toLocaleTimeString('en-AU', AU_LOCALE_TIME)}
                                                  {date.startDate !== date.endDate && (
                                                    <> – {new Date(date.endDate).toLocaleDateString('en-AU', AU_LOCALE_DATE_SHORT)} {new Date(date.endDate).toLocaleTimeString('en-AU', AU_LOCALE_TIME)}</>
                                                  )}
                                                </p>
                                              </div>
                                              <div className="min-h-6 mt-1 flex items-center">
                                                {date.location && date.location.toLowerCase() !== 'face to face' && (
                                                  <p className="flex items-center gap-1 text-sm text-gray-500 truncate" title={date.location}>
                                                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                                                    {date.location}
                                                  </p>
                                                )}
                                              </div>
                                              <div className="min-h-6 flex items-center mt-1.5">
                                                <p className="text-xs font-medium text-violet-600">
                                                  {date.availableSlots > 0
                                                    ? `${date.availableSlots} spot${date.availableSlots === 1 ? '' : 's'} left`
                                                    : 'Fully booked'}
                                                </p>
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
                                    className="text-sm font-medium text-violet-600 hover:text-violet-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 rounded px-1"
                                  >
                                    {showAllCourseDates
                                      ? 'Show less'
                                      : `Show more dates (${courseDatesByDate.length - 4} more)`}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        // Generate year options for expiry (current year + 10 years)
        const currentYear = new Date().getFullYear() % 100;
        const yearOptions = Array.from({ length: 11 }, (_, i) => {
          const year = currentYear + i;
          return year.toString().padStart(2, '0');
        });

        // Card payment success: show success card and "Continue to LLND Assessment" button
        if (paymentMethod === 'card' && paymentCompleted) {
          return (
            <Card className="border-violet-100">
              <CardHeader className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Step 2: Payment
                </CardTitle>
                <CardDescription className="text-violet-100">
                  Choose your payment method and provide payment details
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <PaymentSuccessCard
                  title="Payment successful"
                  message="Your card has been charged. You can now continue to the LLND Assessment."
                  transactionId={paymentTransactionId ?? undefined}
                  isRedirecting={false}
                >
                  <Button
                    onClick={() => {
                      prefillFormFromRegistration();
                      setCurrentStep(3);
                    }}
                    className="bg-violet-600 hover:bg-violet-700 text-white"
                  >
                    Continue to LLND Assessment
                  </Button>
                </PaymentSuccessCard>
              </CardContent>
            </Card>
          );
        }

        return (
          <Card className="border-violet-100">
            <CardHeader className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Step 2: {allowPayLater ? 'Your Details' : 'Payment'}
              </CardTitle>
              <CardDescription className="text-violet-100">
                {allowPayLater ? 'Enter your details (payment will be collected later)' : 'Enter your details and choose your payment method'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {enrollmentType === 'company' ? (
                <>
                  <div className="space-y-4 p-4 rounded-xl border-2 border-violet-200 bg-violet-50/50">
                    <h4 className="font-semibold text-violet-900">Company Details</h4>
                    <div>
                      <Label htmlFor="companyName">Company Name <span className="text-red-500">*</span></Label>
                      <Input
                        id="companyName"
                        placeholder="Your company name"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="companyEmail">Company Email <span className="text-red-500">*</span></Label>
                      <Input
                        id="companyEmail"
                        type="email"
                        placeholder="company@example.com"
                        value={companyEmail}
                        onChange={(e) => setCompanyEmail(e.target.value)}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">One-time enrollment links will be sent to this email.</p>
                    </div>
                    <div>
                      <Label htmlFor="companyMobile">Company Mobile Number</Label>
                      <Input
                        id="companyMobile"
                        type="tel"
                        placeholder="+61 xxx xxx xxx"
                        value={companyMobile}
                        onChange={(e) => setCompanyMobile(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    {/* Company account is created with a default password in the backend; no password fields shown */}
                  </div>
                </>
              ) : (
                /* Personal Details */
                <div className="space-y-4 p-4 rounded-xl border-2 border-violet-200 bg-violet-50/50">
                  <h4 className="font-semibold text-violet-900">Personal Details</h4>
                  <div>
                    <Label htmlFor="fullName">Full Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="fullName"
                      placeholder="Enter your full name"
                      value={registrationData.fullName}
                      onChange={(e) => {
                        setRegistrationData({ ...registrationData, fullName: e.target.value });
                        if (registrationErrors.fullName) setRegistrationErrors({ ...registrationErrors, fullName: '' });
                      }}
                      className={`mt-1 ${registrationErrors.fullName ? 'border-red-500' : ''}`}
                    />
                    {registrationErrors.fullName && <p className="text-red-500 text-sm mt-1">{registrationErrors.fullName}</p>}
                  </div>
                  <div>
                    <Label htmlFor="phone">Mobile Number <span className="text-red-500">*</span></Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+61 xxx xxx xxx"
                      value={registrationData.phone}
                      onChange={(e) => {
                        setRegistrationData({ ...registrationData, phone: e.target.value });
                        if (registrationErrors.phone) setRegistrationErrors({ ...registrationErrors, phone: '' });
                      }}
                      className={`mt-1 ${registrationErrors.phone ? 'border-red-500' : ''}`}
                    />
                    {registrationErrors.phone && <p className="text-red-500 text-sm mt-1">{registrationErrors.phone}</p>}
                  </div>
                  <div>
                    <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={registrationData.email}
                      onChange={(e) => {
                        setRegistrationData({ ...registrationData, email: e.target.value });
                        if (registrationErrors.email) setRegistrationErrors({ ...registrationErrors, email: '' });
                      }}
                      className={`mt-1 ${registrationErrors.email ? 'border-red-500' : ''}`}
                    />
                    {registrationErrors.email && <p className="text-red-500 text-sm mt-1">{registrationErrors.email}</p>}
                  </div>
                  {/* Individual: no password field; backend stores default password */}
                  <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <Checkbox
                      id="terms"
                      checked={agreedToTerms}
                      onCheckedChange={(checked: boolean) => {
                        setAgreedToTerms(checked);
                        if (registrationErrors.terms) setRegistrationErrors({ ...registrationErrors, terms: '' });
                      }}
                    />
                    <label htmlFor="terms" className="text-sm text-gray-700 cursor-pointer">
                      I agree to the terms and conditions and understand my information will be used for enrollment purposes
                    </label>
                  </div>
                  {registrationErrors.terms && <p className="text-red-500 text-sm">{registrationErrors.terms}</p>}
                </div>
              )}

              {/* Order Summary */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-3">Order Summary</h4>
                <div className="space-y-2 text-sm">
                  {enrollmentType === 'company' ? (
                    <>
                      {selectedCompanyCourses.length > 0 && selectedCompanyCourses.map((item, i) => (
                        <div key={`${item.courseId}-${item.courseDateId}-${i}`} className="space-y-1 pb-2 border-b border-blue-100 last:border-0 last:pb-0">
                          <div className="flex justify-between gap-2">
                            <span className="text-gray-600">Course:</span>
                            <span className="font-medium">{item.courseName || item.courseId}</span>
                          </div>
                          {item.courseDateLabel && (
                            <div className="flex justify-between gap-2">
                              <span className="text-gray-600">Date:</span>
                              <span className="font-medium text-xs">{item.courseDateLabel}</span>
                            </div>
                          )}
                          <div className="flex justify-between gap-2">
                            <span className="text-gray-600">Unit price × Qty:</span>
                            <span className="font-medium">${item.price} × {item.quantity} = ${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                      {selectedCompanyCourses.length > 0 && (
                        <div className="flex justify-between pt-2 border-t border-blue-200">
                          <span className="font-semibold text-blue-900">Total:</span>
                          <span className="font-bold text-blue-900 text-lg">${selectedCompanyCourses.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Course:</span>
                        <span className="font-medium">{getSelectedCourse()?.courseName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium">
                          {getSelectedDate() &&
                            `${new Date(getSelectedDate()!.startDate).toLocaleDateString('en-AU', AU_LOCALE_DATE_SHORT)} – ${new Date(getSelectedDate()!.endDate).toLocaleDateString('en-AU', AU_LOCALE_DATE_SHORT)}`}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-blue-200">
                        <span className="font-semibold text-blue-900">Total:</span>
                        <span className="font-bold text-blue-900 text-lg">${getSelectedCoursePrice()}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {allowPayLater && (
                <div className="rounded-lg border border-violet-200 bg-violet-50/50 p-4 text-sm text-violet-800">
                  <p className="font-medium">Pay Later</p>
                  <p className="text-violet-600 mt-1">Payment will be collected after you complete your enrollment.</p>
                </div>
              )}

              {/* Payment Method Selection */}
              {!allowPayLater && (
                <div>
                  <Label className="text-base font-semibold mb-3 block">Select Payment Method <span className="text-red-500">*</span></Label>
                  <RadioGroup value={paymentMethod} onValueChange={(value) => {
                    setPaymentMethod(value);
                    setPaymentError(null); // Clear any previous errors
                  }}>
                    <div className="space-y-3">
                      {enrollmentType === 'company' && (
                        <div className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${paymentMethod === 'pay_later' ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-gray-300'
                          }`}>
                          <RadioGroupItem value="pay_later" id="pay_later" />
                          <Label htmlFor="pay_later" className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4" />
                              <span className="font-medium">Pay Later</span>
                            </div>
                            <div className="text-sm text-gray-500">Invoice later – one-time links will be sent to your company email</div>
                          </Label>
                        </div>
                      )}
                      <div className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${paymentMethod === 'bank_transfer' ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-gray-300'
                        }`}>
                        <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                        <Label htmlFor="bank_transfer" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            <span className="font-medium">Bank Transfer</span>
                          </div>
                          <div className="text-sm text-gray-500">Transfer to our bank account </div>
                        </Label>
                      </div>

                      <div className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${paymentMethod === 'card' ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-gray-300'
                        }`}>
                        <RadioGroupItem value="card" id="card" />
                        <Label htmlFor="card" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4" />
                            <span className="font-medium">Credit Card - Pay Now</span>
                          </div>
                          <div className="text-sm text-gray-500">Pay securely with your card online</div>
                        </Label>
                      </div>

                    </div>
                  </RadioGroup>
                </div>
              )}

              {/* Bank Details (shown when bank transfer selected - informational only) */}
              {!allowPayLater && paymentMethod === 'bank_transfer' && (
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <h4 className="font-semibold mb-3">Bank Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bank:</span>
                      <span className="font-medium">Commonwealth Bank</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account Name:</span>
                      <span className="font-medium">AIET College</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">BSB:</span>
                      <span className="font-medium">062 141</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account No:</span>
                      <span className="font-medium">10490235</span>
                    </div>
                    <div className="pt-3 mt-3 border-t border-gray-200">
                      <Label htmlFor="transactionId" className="text-sm font-medium text-gray-700">
                        Transaction ID / Reference <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="transactionId"
                        type="text"
                        placeholder="Enter your bank transaction ID"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        className="mt-2"
                        disabled={paymentProcessing}
                      />
                    </div>

                    <div className="pt-3">
                      <Label htmlFor="paymentProof" className="text-sm font-medium text-gray-700">
                        Payment slip upload <span className="text-red-500">*</span>
                      </Label>
                      <div className="mt-2 flex items-center gap-3">
                        <Input
                          id="paymentProof"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handlePaymentProofChange}
                          disabled={paymentProcessing}
                        />
                        {paymentProofFile && (
                          <Button type="button" variant="outline" onClick={removePaymentProof}>
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      {paymentProofFile && (
                        <p className="text-xs text-gray-500 mt-2">
                          Selected: {paymentProofFile.name}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-3 pt-2 border-t">
                      Please use your name and course code as the payment reference.
                    </p>
                  </div>
                </div>
              )}

              {/* Credit Card Form (shown when card selected) */}
              {!allowPayLater && paymentMethod === 'card' && (
                <div className="space-y-6">
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
                    <Label htmlFor="cardName">Name on Card <span className="text-red-500">*</span></Label>
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
                      disabled={paymentProcessing}
                    />
                    {cardValidationErrors.cardName && (
                      <p className="text-red-500 text-sm mt-1">{cardValidationErrors.cardName}</p>
                    )}
                  </div>

                  {/* Card Number */}
                  <div>
                    <Label htmlFor="cardNumber">Card Number <span className="text-red-500">*</span></Label>
                    <div className="relative mt-1">
                      <Input
                        id="cardNumber"
                        type="text"
                        placeholder="4111 1111 1111 1111"
                        value={cardData.cardNumber}
                        onChange={handleCardNumberChange}
                        className={`pr-16 ${cardValidationErrors.cardNumber ? 'border-red-500' : ''}`}
                        disabled={paymentProcessing}
                        maxLength={23}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {cardType === 'visa' && (
                          <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-[8px] font-bold">VISA</div>
                        )}
                        {cardType === 'mastercard' && (
                          <div className="w-10 h-6 bg-gradient-to-r from-red-500 to-yellow-500 rounded flex items-center justify-center">
                            <div className="w-3 h-3 bg-red-500 rounded-full opacity-80"></div>
                            <div className="w-3 h-3 bg-yellow-500 rounded-full opacity-80 -ml-1"></div>
                          </div>
                        )}
                        {cardType === 'amex' && (
                          <div className="w-10 h-6 bg-blue-400 rounded flex items-center justify-center text-white text-[7px] font-bold">AMEX</div>
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
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="expiryMonth">Expiry Month <span className="text-red-500">*</span></Label>
                      <Select
                        value={cardData.expiryMonth}
                        onValueChange={(value) => {
                          setCardData({ ...cardData, expiryMonth: value });
                          if (cardValidationErrors.expiryMonth) {
                            setCardValidationErrors({ ...cardValidationErrors, expiryMonth: '' });
                          }
                        }}
                        disabled={paymentProcessing}
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
                      <Label htmlFor="expiryYear">Expiry Year <span className="text-red-500">*</span></Label>
                      <Select
                        value={cardData.expiryYear}
                        onValueChange={(value) => {
                          setCardData({ ...cardData, expiryYear: value });
                          if (cardValidationErrors.expiryYear) {
                            setCardValidationErrors({ ...cardValidationErrors, expiryYear: '' });
                          }
                        }}
                        disabled={paymentProcessing}
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
                      <Label htmlFor="cvv">CVV <span className="text-red-500">*</span></Label>
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
                          disabled={paymentProcessing}
                          maxLength={cardType === 'amex' ? 4 : 3}
                        />
                        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </div>
                      {cardValidationErrors.cvv && (
                        <p className="text-red-500 text-sm mt-1">{cardValidationErrors.cvv}</p>
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
                </div>
              )}

              {/* Payment error */}
              {paymentError && (
                <PaymentFailureCard
                  message={paymentError}
                  onDismiss={() => setPaymentError(null)}
                  onRetry={() => setPaymentError(null)}
                  retryLabel="Try again"
                />
              )}

              {enrollmentType === 'individual' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> After completing the payment step, you will proceed to the LLND Assessment and then the Enrollment Form.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 3:
        if (quizCompleted) {
          const { totalQuestions, totalCorrect } = calculateQuizTotals();
          const isAutoPassAttempt = quizAttemptNumber >= AUTO_PASS_ATTEMPT;
          const canRetry = !quizPassed && quizAttemptNumber <= MAX_REATTEMPTS;
          const percentage = isAutoPassAttempt
            ? '67.00'
            : totalQuestions > 0
              ? ((totalCorrect / totalQuestions) * 100).toFixed(2)
              : '0';

          return (
            <Card className="border-violet-100">
              <CardHeader className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5" />
                  Step 3: LLND Assessment - Complete
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className={`p-6 rounded-lg text-center ${quizPassed ? 'bg-green-50' : 'bg-yellow-50'}`}>
                  <CheckCircle className={`w-16 h-16 mx-auto mb-4 ${quizPassed ? 'text-green-500' : 'text-yellow-500'}`} />
                  <h3 className="text-xl font-bold mb-2">
                    {quizPassed ? 'Assessment Passed!' : 'Assessment Completed'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {quizPassed
                      ? 'Congratulations! You have successfully passed the LLND assessment.'
                      : 'You have completed the assessment. Please reattempt to continue.'}
                  </p>
                  <p className="text-sm text-gray-500 mb-2">
                    Attempt {quizAttemptNumber} of {AUTO_PASS_ATTEMPT}
                  </p>
                  {isAutoPassAttempt && (
                    <p className="text-sm text-violet-600 mb-2">Auto-pass applied at 67% on 4th attempt.</p>
                  )}
                  <div className="text-sm mb-4">
                    <p>Total: {totalCorrect}/{totalQuestions} ({percentage}%)</p>
                  </div>
                  <div className="space-y-2">
                    {quizSectionResults.map((result, i) => (
                      <div key={i} className="flex justify-between items-center p-2 bg-white rounded text-sm">
                        <span>{result.section}</span>
                        <Badge className={result.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                          {result.percentage}% - {result.passed ? 'Passed' : 'Failed'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  {canRetry && (
                    <div className="mt-4">
                      <Button variant="outline" onClick={handleQuizRetry}>
                        Retry Again
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        }

        return (
          <div className="space-y-4">
              <Card className="border-violet-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5" />
                    Step 3: LLND Assessment
                  </CardTitle>
                  <CardDescription>
                    Section {quizSectionIndex + 1} of {quizSections.length}: {quizSections[quizSectionIndex].title}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Progress value={((quizSectionIndex + 1) / quizSections.length) * 100} className="h-2" />
                  <div className="flex gap-2 mt-4 flex-wrap">
                    {quizSections.map((s, i) => (
                      <Badge
                        key={s.id}
                        variant={i < quizSectionIndex ? 'default' : i === quizSectionIndex ? 'secondary' : 'outline'}
                        className={i < quizSectionIndex ? 'bg-green-500' : ''}
                      >
                        {i + 1}. {s.id.charAt(0).toUpperCase() + s.id.slice(1)}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <QuizSection
                section={quizSections[quizSectionIndex]}
                onComplete={handleQuizSectionComplete}
              />
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <Card className="border-violet-100">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileEdit className="w-5 h-5" />
                      Step 4: Enrollment Form
                    </CardTitle>
                    <CardDescription>
                      Section {currentFormSection} of 5
                    </CardDescription>
                  </div>
                  <Badge>{Math.round((currentFormSection / 5) * 100)}% Complete</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Progress value={(currentFormSection / 5) * 100} className="h-2" />
                <div className="flex justify-between mt-4">
                  {['Applicant', 'USI', 'Education', 'Additional', 'Privacy & ID'].map((label, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentFormSection(i + 1)}
                      className={`flex flex-col items-center text-xs ${currentFormSection === i + 1 ? 'text-violet-600 font-semibold' :
                        currentFormSection > i + 1 ? 'text-green-600' : 'text-gray-400'
                        }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${currentFormSection === i + 1 ? 'bg-violet-600 text-white' :
                        currentFormSection > i + 1 ? 'bg-green-100 text-green-600' : 'bg-gray-100'
                        }`}>
                        {currentFormSection > i + 1 ? <CheckCircle className="w-4 h-4" /> : i + 1}
                      </div>
                      <span className="hidden sm:block">{label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div ref={formContainerRef}>
              {submitValidationErrors.some(err => err.section === currentFormSection) && (
                <div className="mb-6 rounded-xl border-2 border-red-200 bg-red-50 p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-6 w-6 flex-shrink-0 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-red-800">
                        Please complete the following required fields in this section:
                      </h3>
                      <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-red-700">
                        {submitValidationErrors
                          .filter(err => err.section === currentFormSection)
                          .map((err, idx) => (
                            <li key={idx}>{err.label}</li>
                          ))}
                      </ul>
                      <p className="mt-3 text-xs text-red-600">
                        All fields marked with * are required to proceed.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="min-h-[400px]">
                {currentFormSection === 1 && (
                  <ApplicantSection data={formData.applicant} onChange={handleApplicantChange} errors={formErrors} />
                )}
                {currentFormSection === 2 && (
                  <USISection data={formData.usi} onChange={handleUSIChange} errors={formErrors} />
                )}
                {currentFormSection === 3 && (
                  <EducationSection data={formData.education} onChange={handleEducationChange} errors={formErrors} />
                )}
                {currentFormSection === 4 && (
                  <AdditionalInfoSection
                    data={formData.additionalInfo}
                    onChange={handleAdditionalInfoChange}
                    errors={formErrors}
                  />
                )}
                {currentFormSection === 5 && (
                  <>
                    <PrivacyTermsSection
                      data={formData.privacyTerms}
                      onChange={handlePrivacyTermsChange}
                      errors={formErrors}
                    />
                    <div className="mt-8">
                      <PhotoIdSection
                        data={formData.applicant}
                        onChange={handleApplicantChange}
                        errors={formErrors}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Navigation Buttons for Form Sections 1-4 */}
            {currentFormSection < 5 && (
              <div className="pt-4 border-t flex justify-between">
                {currentFormSection > 1 && (
                  <Button variant="outline" onClick={handleFormPrevious}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                )}
                <Button
                  onClick={handleFormNext}
                  className={`bg-violet-600 hover:bg-violet-700 ${currentFormSection === 1 ? 'ml-auto' : ''}`}
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {/* Submit Button for Enrollment Form Step (section 5: Privacy, Signature + Photo & ID) */}
            {currentFormSection === 5 && (
              <div className="pt-4 border-t flex flex-col gap-4">
                <div className="flex justify-between">
                  <Button variant="outline" onClick={handleFormPrevious}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                </div>
                <Button
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 py-6 text-lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Submitting Enrollment...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Complete Enrollment
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-500 text-center mt-3">
                  By clicking "Complete Enrollment", you agree to our terms and conditions.
                  Your account will be created and you can log in to access your student portal.
                </p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // One-time link mode: only name, email, phone → password 123456 sent automatically (no payment, no LLN)
  if (isOneTimeLink && enrollCode) {
    const handleOneTimeLinkSubmit = async () => {
      const fullName = registrationData.fullName.trim();
      const email = registrationData.email.trim();
      const phone = registrationData.phone.trim();
      if (!fullName || !email || !phone) {
        toast.error('Please fill in all fields');
        return;
      }
      setOneTimeLinkError(null);
      setOneTimeLinkSubmitting(true);
      try {
        const response = await publicEnrollmentWizardService.completeEnrollmentViaLink(enrollCode, {
          fullName,
          email,
          phone,
          password: '123456',
        });
        if (response.success && response.data) {
          setOneTimeLinkError(null);
          setOneTimeLinkSuccess(true);
          onComplete({
            userId: response.data.userId,
            studentId: response.data.studentId,
            email: response.data.email,
            fullName: response.data.fullName,
          });
        } else {
          const msg = response.message || 'Registration failed';
          setOneTimeLinkError(msg);
          toast.error(msg);
        }
      } catch (err) {
        const errWithBody = err as Error & { responseBody?: { message?: string; Message?: string } };
        const message =
          errWithBody?.responseBody?.message ??
          errWithBody?.responseBody?.Message ??
          (err instanceof Error ? err.message : 'Registration failed');
        setOneTimeLinkError(message);
        toast.error(message);
      } finally {
        setOneTimeLinkSubmitting(false);
      }
    };

    if (oneTimeLinkSuccess) {
      return (
        <div className="max-w-4xl mx-auto space-y-6 p-6">
          <Card className="border-violet-100">
            <CardHeader className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Registration Complete
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-gray-700 mb-4">
                Thank you for completing your registration. Please log in to continue.
              </p>
              <Button onClick={onCancel} className="bg-violet-600 hover:bg-violet-700">
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto space-y-6 p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={onCancel} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
            Complete Your Registration
          </h1>
          <p className="text-gray-600">Enter your details to complete enrollment (no payment required).</p>
        </div>
        <Card className="border-violet-100">
          <CardHeader className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Your Details
            </CardTitle>
            <CardDescription className="text-violet-100">
              Full name, email and phone
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div>
              <Label htmlFor="otl-fullName">Full Name <span className="text-red-500">*</span></Label>
              <Input
                id="otl-fullName"
                placeholder="Enter your full name"
                value={registrationData.fullName}
                onChange={(e) => {
                  setOneTimeLinkError(null);
                  setRegistrationData((prev) => ({ ...prev, fullName: e.target.value }));
                }}
                className="mt-1"
                disabled={oneTimeLinkSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="otl-email">Email <span className="text-red-500">*</span></Label>
              <Input
                id="otl-email"
                type="email"
                placeholder="Enter your email"
                value={registrationData.email}
                onChange={(e) => {
                  setOneTimeLinkError(null);
                  setRegistrationData((prev) => ({ ...prev, email: e.target.value }));
                }}
                className="mt-1"
                disabled={oneTimeLinkSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="otl-phone">Phone <span className="text-red-500">*</span></Label>
              <Input
                id="otl-phone"
                placeholder="Enter your phone"
                value={registrationData.phone}
                onChange={(e) => {
                  setOneTimeLinkError(null);
                  setRegistrationData((prev) => ({ ...prev, phone: e.target.value }));
                }}
                className="mt-1"
                disabled={oneTimeLinkSubmitting}
              />
            </div>
            {oneTimeLinkError && (
              <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700" role="alert">
                {oneTimeLinkError}
              </div>
            )}
            <Button
              onClick={handleOneTimeLinkSubmit}
              disabled={oneTimeLinkSubmitting}
              className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600"
            >
              {oneTimeLinkSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Completing...
                </>
              ) : (
                'Complete Registration'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Individual enrollment thank-you screen (after enrollment + LLN complete)
  if (enrollmentType === 'individual' && individualEnrollmentSuccess && individualEnrollmentResult) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <Card className="overflow-hidden border-0 shadow-xl shadow-violet-100/50">
          <div className="bg-gradient-to-br from-violet-600 via-violet-700 to-fuchsia-700 px-8 py-10 text-white text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-6">
              <CheckCircle className="w-10 h-10 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
              Thank you for your booking with Safety Training Academy
            </h1>
            <p className="text-violet-100 text-sm sm:text-base max-w-md mx-auto">
              Your enrollment has been completed successfully.
            </p>
          </div>
          <CardContent className="px-8 py-8 sm:px-10 sm:py-10 space-y-6">
            <div className="prose prose-gray max-w-none text-gray-700 space-y-4 text-[15px] leading-relaxed">
              <p className="text-gray-600">
                A confirmation email has been sent to{' '}
                <span className="font-semibold text-gray-800">{individualEnrollmentResult.email}</span>. Please check your inbox and follow the instructions.
              </p>
              <p className="text-gray-600">
                If you need any assistance, please contact us.
              </p>
            </div>
            <div className="border-t border-gray-100 pt-6 mt-6">
              <p className="text-gray-600 text-sm mb-1">Kind regards,</p>
              <p className="font-semibold text-gray-800">Safety Training Academy</p>
              <p className="text-gray-600 text-sm">Training Team</p>
              <p className="text-gray-700 font-medium mt-2">1300 976 097</p>
              <a
                href="mailto:info@safetytrainingacademy.edu.au"
                className="inline-block mt-1 text-violet-600 hover:text-violet-700 font-medium hover:underline transition-colors"
              >
                info@safetytrainingacademy.edu.au
              </a>
            </div>
            <div className="pt-4">
              <Button
                onClick={() => {
                  if (individualEnrollmentResult) {
                    onComplete(individualEnrollmentResult);
                  } else {
                    onCancel();
                  }
                }}
                className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-medium px-8"
              >
                Continue to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Company order thank-you screen (after payment step)
  if (enrollmentType === 'company' && companyOrderSuccess) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={onCancel} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </div>
        <Card className="border-violet-100">
          <CardHeader className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Thank you for your booking with Safety Training Academy
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="prose prose-gray max-w-none text-gray-700 space-y-4">
              <p><strong>Instructions:</strong></p>
              <p>
                Please share the links with your employees to continue their LLN (Language, Literacy and Numeracy)
                assessment and complete their Enrolment.
              </p>
              <p>Please share the link below:</p>
              {companyOrderLinks.length > 0 && (
                <div className="rounded-lg border bg-gray-50 p-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">Enrolment &amp; LLN Links:</p>
                  <ul className="text-sm space-y-2 list-disc list-inside">
                    {companyOrderLinks.map((l, i) => (
                      <li key={i}>
                        <strong>{l.courseName}:</strong>{' '}
                        <a href={l.fullUrl} target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline break-all">
                          {l.fullUrl}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p>
                Please ask them to complete the form and assessment before their course date to finalise your
                registration.
              </p>
              <p>
                We have shared these details in Email for your reference and confirmation.
              </p>
              <p>If you need any assistance, please contact us.</p>
              <div className="border-t pt-4 mt-6 text-gray-600">
                <p>Kind regards,</p>
                <p className="font-semibold">Safety Training Academy</p>
                <p>Training Team</p>
                <p>1300 976 097</p>
                <p>
                  <a href="mailto:info@safetytrainingacademy.edu.au" className="text-violet-600 hover:underline">
                    info@safetytrainingacademy.edu.au
                  </a>
                </p>
              </div>
            </div>
            <Button onClick={onCancel} className="bg-violet-600 hover:bg-violet-700">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const visibleSteps = enrollmentType === 'company' ? WIZARD_STEPS.slice(0, 2) : WIZARD_STEPS;

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={onCancel} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
          Student Enrollment
        </h1>
        <p className="text-gray-600">Complete all steps to enroll in your course</p>
      </div>

      {/* Progress Steps */}
      <Card className="border-violet-100">
        <CardContent className="pt-6">
          <div className="flex justify-between">
            {visibleSteps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center text-xs ${currentStep === step.id ? 'text-violet-600 font-semibold' :
                    currentStep > step.id ? 'text-green-600' : 'text-gray-400'
                    }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${currentStep === step.id ? 'bg-violet-600 text-white' :
                    currentStep > step.id ? 'bg-green-100 text-green-600' : 'bg-gray-100'
                    }`}>
                    {currentStep > step.id ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className="hidden sm:block">{step.shortTitle}</span>
                </div>
              );
            })}
          </div>
          <Progress value={(currentStep / visibleSteps.length) * 100} className="mt-4 h-2" />
        </CardContent>
      </Card>

      {/* Step Content */}
      {renderStepContent()}

      {/* Navigation (for steps 1-2: Course Selection, Payment) */}
      {currentStep <= 2 && (
        <Card className="border-violet-100">
          <CardContent className="py-4">
            <div className="flex justify-end">
              <div className="flex gap-3">
                {currentStep > 1 && (
                  <Button variant="outline" onClick={handlePrevious} disabled={paymentProcessing || isSubmitting}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                )}
                <Button
                  onClick={handleNext}
                  className="bg-gradient-to-r from-violet-600 to-fuchsia-600"
                  disabled={
                    paymentProcessing ||
                    isSubmitting ||
                    (currentStep === 1 && enrollmentType === 'company' && pendingCompanyCourse !== null)
                  }
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating order...
                    </>
                  ) : paymentProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing Payment...
                    </>
                  ) : currentStep === 2 && enrollmentType === 'company' ? (
                    'Create order & get links'
                  ) : currentStep === 2 && paymentMethod === 'card' ? (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Pay ${getSelectedCoursePrice()} & Continue
                    </>
                  ) : currentStep === 2 ? (
                    'Continue to LLND Assessment'
                  ) : (
                    <>
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation for step 3 (LLND quiz completed) */}
      {currentStep === 3 && quizCompleted && quizPassed && (
        <Card className="border-violet-100">
          <CardContent className="py-4">
            <div className="flex justify-end">
              <Button
                onClick={handleNext}
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600"
              >
                Continue to Enrollment Form
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


