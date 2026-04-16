// src/components/CourseDetailsPage.tsx
import { useState, useEffect } from 'react';
import {
  ArrowLeft, Clock, Users, Award, CheckCircle, BookOpen, Target,
  Zap, Star, Calendar, MapPin, Globe, DollarSign, Phone, Mail,
  FileText, Loader2, TrendingUp, Shield, Sparkles,
  Menu, X, ChevronDown, ChevronRight, ChevronUp, Facebook, Linkedin, Instagram, Eye
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { motion } from 'motion/react';
import { courseService } from '../services/course.service';
import { categoryService } from '../services/category.service';
import type { CourseDetail as APICourseDetail, CourseListItem } from '../services/course.service';
import type { CategoryDropdownItem } from '../services/category.service';
import { WhatsAppButton } from './ui/WhatsAppButton';
import { courseDescriptionToHtml } from '../utils/courseDescriptionFormatter';
import { PublicHeader } from "./layout/PublicHeader";
import { SAFETY_TRAINING_ACADEMY_LOGO } from '../constants/safetyTrainingAcademyLogo';
import { SOCIAL_LINKS } from "../constants/socialLinks";

const logoImage = '/assets/SafetyTrainingAcademylogo.png';

function normalizeCourseBlurb(
  text: string,
  opts: { price?: number | string | null; delivery?: string | null; location?: string | null }
): string {
  if (!text) return text;
  let out = text;
  if (opts.price != null) {
    const priceNum =
      typeof opts.price === 'number' ? opts.price : Number(String(opts.price).replace(/[^0-9.]/g, ''));
    const formatted =
      Number.isFinite(priceNum) && Math.abs(priceNum - Math.trunc(priceNum)) < 0.000001
        ? `$${priceNum.toFixed(0)}`
        : Number.isFinite(priceNum)
          ? `$${priceNum.toFixed(2)}`
          : `$${String(opts.price)}`;

    out = out.replace(
      /(\b(?:COST|PRICE)\b\s*:\s*)\$?\s*([0-9]+(?:[.,][0-9]+)*)/gi,
      (_m, prefix) => `${prefix}${formatted}`
    );
  }
  if (opts.delivery) {
    out = out.replace(/(\bDELIVERY\b\s*:\s*)([^\n📌💵]+)(?=\s*(?:💵|📌|$))/gi, `$1${opts.delivery}`);
  }
  if (opts.location) {
    out = out.replace(/(\bLOCATION\b\s*:\s*)([^\n]+)$/gi, `$1${opts.location}`);
  }
  return out;
}

interface CourseDetailsPageProps {
  courseId: string;
  onBack: () => void;
  onEnroll: (courseData?: { courseId?: string; courseName?: string; courseCode?: string; coursePrice?: number; experienceType?: 'with' | 'without' }) => void;
  onLogin?: () => void;
  onRegister?: () => void;
  onContact?: () => void;
  onViewCourses?: () => void;
  onViewComboCourses?: () => void;
  onBookNow?: () => void;
  onCourseDetails?: (courseId: string) => void;
  onAbout?: () => void;
  onForms?: () => void;
  onFeesRefund?: () => void;
  onGallery?: () => void;
  onVOC?: () => void;
  onViewHandbook?: (url: string, title?: string, courseName?: string) => void;
  /** Called when course is loaded so the URL can be updated with the course name slug */
  onCourseUrlReady?: (courseId: string, courseName: string) => void;
}

// Helper function to map API response to display format
const mapApiCourseToDisplay = (apiCourse: APICourseDetail) => {
  return {
    id: apiCourse.courseId,
    code: apiCourse.courseCode || '',
    title: apiCourse.courseName || (apiCourse.courseCode ? 'Course' : 'Course details not available.'),
    category: apiCourse.categoryName || 'Uncategorized',
    duration: apiCourse.duration || undefined,
    students: apiCourse.enrolledStudentsCount,
    price: apiCourse.price,
    originalPrice: apiCourse.originalPrice,
    promoPrice: apiCourse.promoPrice,
    promoOriginalPrice: apiCourse.promoOriginalPrice,
    image: apiCourse.imageUrl || 'https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=1080',
    hasTheory: apiCourse.hasTheory,
    hasPractical: apiCourse.hasPractical,
    hasExam: apiCourse.hasExam,
    validityPeriod: apiCourse.validityPeriod || undefined,
    description: apiCourse.description || '',
    delivery: apiCourse.deliveryMethod || 'Face to Face Training',
    location: apiCourse.location || 'Location to be announced',
    comboOffer: apiCourse.comboOffer ? {
      description: apiCourse.comboOffer.description,
      price: apiCourse.comboOffer.price,
      duration: apiCourse.comboOffer.duration || undefined
    } : undefined,
    courseDescription: apiCourse.courseDescription?.trim() || 'Course description not available.',
    entryRequirements: apiCourse.entryRequirements.length > 0
      ? apiCourse.entryRequirements
      : ['Be at least 18 years of age.', 'Successfully complete the enrolment process.'],
    trainingOverview: apiCourse.trainingOverview.length > 0
      ? apiCourse.trainingOverview
      : [],
    vocationalOutcome: apiCourse.vocationalOutcome.length > 0
      ? apiCourse.vocationalOutcome
      : [],
    pathways: apiCourse.pathways ? {
      description: apiCourse.pathways.description || 'Students who successfully complete this unit of competency will be awarded a statement of attainment.',
      certifications: apiCourse.pathways.certifications
    } : undefined,
    feesAndCharges: apiCourse.feesAndCharges.length > 0
      ? apiCourse.feesAndCharges
      : ['Group discounts apply', 'Refund and fee protection policy – Please refer to the student handbook'],
    optionalCharges: apiCourse.optionalCharges.length > 0 ? apiCourse.optionalCharges : [],
    resourcePdf: apiCourse.resourcePdf?.title && apiCourse.resourcePdf?.url ? {
      title: apiCourse.resourcePdf.title,
      url: apiCourse.resourcePdf.url
    } : undefined,
    courseDates: apiCourse.courseDates || [],
    experienceBookingEnabled: apiCourse.experienceBookingEnabled ?? false,
    experiencePrice: apiCourse.experiencePrice,
    experienceOriginalPrice: apiCourse.experienceOriginalPrice,
    noExperiencePrice: apiCourse.noExperiencePrice,
    noExperienceOriginalPrice: apiCourse.noExperienceOriginalPrice
  };
};

export function CourseDetailsPage({
  courseId,
  onBack,
  onEnroll,
  onLogin,
  onRegister,
  onContact,
  onViewCourses,
  onViewComboCourses,
  onBookNow,
  onCourseDetails,
  onAbout,
  onForms,
  onFeesRefund,
  onGallery,
  onVOC,
  onViewHandbook,
  onCourseUrlReady
}: CourseDetailsPageProps) {
  const [course, setCourse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [coursesDropdownOpen, setCoursesDropdownOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [allCourses, setAllCourses] = useState<CourseListItem[]>([]);

  // SL + BL is a special promo tier (same rule as landing course cards).
  // IMPORTANT: Do not derive SL+BL from combo pricing; combo already has its own banner + CTA.
  const promoNum = course?.promoPrice != null ? Number(course.promoPrice) : NaN;
  const promoOrigNum =
    course?.promoOriginalPrice != null ? Number(course.promoOriginalPrice) : NaN;

  // Landing page (standard course cards) shows SL+BL whenever promoPrice is present and > 0.
  const isSlBlPromo = !Number.isNaN(promoNum) && promoNum > 0;

  const slBlPrice = isSlBlPromo ? promoNum : null;
  const slBlOriginalPrice =
    isSlBlPromo && !Number.isNaN(promoOrigNum) && promoOrigNum > 0
      ? promoOrigNum
      : null;

  const experienceBookingEnabled = Boolean(course?.experienceBookingEnabled);
  const withExperiencePrice =
    experienceBookingEnabled && course ? (course.experiencePrice ?? course.price) : null;
  const withoutExperiencePrice =
    experienceBookingEnabled && course ? (course.noExperiencePrice ?? course.price) : null;

  const [categories, setCategories] = useState<CategoryDropdownItem[]>([]);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToBooking = () => {
    const element = document.getElementById('booking-card');
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    fetchCourseDetails();
    fetchData();
  }, [courseId]);

  const fetchData = async () => {
    try {
      const [coursesRes, categoriesRes] = await Promise.all([
        courseService.getAllCourses({ pageSize: 1000 }), // Fetch all courses so all categories show in dropdown
        categoryService.getCategoriesDropdown()
      ]);
      if (coursesRes.success && coursesRes.data) {
        setAllCourses(coursesRes.data.courses);
      }
      if (categoriesRes.success && categoriesRes.data) {
        setCategories(categoriesRes.data.categories);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchCourseDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await courseService.getCourseById(courseId);

      if (response.success && response.data) {
        // Debug: Log API response to verify categoryName, courseName, courseDescription
        console.debug('[CourseDetails] API response:', {
          courseId: response.data.courseId,
          courseCode: response.data.courseCode,
          courseName: response.data.courseName,
          categoryName: response.data.categoryName,
          courseDescription: response.data.courseDescription?.substring(0, 100),
        });
        const mappedCourse = mapApiCourseToDisplay(response.data);
        setCourse(mappedCourse);
        // Update URL with course name slug for shareable links (e.g. /course/id/white-card-training)
        const name = response.data.courseName?.trim();
        if (name && onCourseUrlReady) {
          onCourseUrlReady(response.data.courseId, name);
        }
      } else {
        setError(response.message || 'Failed to load course details');
      }
    } catch (err) {
      console.error('Error fetching course details:', err);
      setError('Failed to load course details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-cyan-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading course details...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">😕</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {error || 'Course not found'}
          </h2>
          <p className="text-gray-600 mb-6">
            We couldn't find the course you're looking for. It may have been removed or the link is incorrect.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={onBack} variant="outline" className="rounded-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Button onClick={fetchCourseDetails} className="bg-cyan-600 hover:bg-cyan-700 rounded-full">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader
        onBack={onBack}
        onLogin={onLogin}
        onRegister={onRegister}
        onAbout={onAbout}
        onContact={onContact}
        onCourseDetails={onCourseDetails}
        onBookNow={onBookNow}
        onForms={onForms}
        onFeesRefund={onFeesRefund}
        onGallery={onGallery}
        onVOC={onVOC}
        onViewCourses={onViewCourses}
        onViewComboCourses={onViewComboCourses}
      />

      {/* Course Title Section */}
      <div className="bg-slate-900 text-white py-8 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button
            onClick={onBack}
            variant="ghost"
            className="text-white hover:text-cyan-400 hover:bg-white/10 mb-6 rounded-full"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Courses
          </Button>

          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <Badge className="bg-cyan-500 text-white px-4 py-1.5 text-sm font-semibold rounded-full shadow-lg">
                {course.category}
              </Badge>
              {course.comboOffer && (
                <Badge className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-4 py-1.5 text-sm font-semibold rounded-full shadow-lg animate-pulse">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Combo Available
                </Badge>
              )}
              {course.originalPrice && (
                <Badge className="bg-red-600 text-white px-4 py-1.5 text-sm font-semibold rounded-full shadow-lg">
                  SALE - Save ${course.originalPrice - course.price}!
                </Badge>
              )}
            </div>
            {course.code && (
              <h1 className="text-4xl md:text-5xl font-bold mb-3 text-white">
                {course.code}
              </h1>
            )}
            <h1 className="text-4xl md:text-5xl font-bold mb-3 text-white">
              {course.title}
            </h1>
            <p className="text-blue-100 text-lg max-w-3xl">
              {normalizeCourseBlurb(
                course.description || 'Professional certification program with industry-recognized credentials',
                { price: course.price, delivery: course.delivery, location: course.location }
              )}
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl relative">
            <Input
              type="text"
              placeholder="Search other courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-14 rounded-full bg-white/10 border-white/20 text-white placeholder:text-white/60 pl-12 backdrop-blur-sm"
            />
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side - Course Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Course Image */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative h-96 rounded-3xl overflow-hidden shadow-2xl group"
            >
              <ImageWithFallback
                src={course.image}
                alt={course.title}
                width={800}
                height={384}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
              {course.validityPeriod && (
                <div className="absolute top-6 right-6 flex gap-2">
                  <Badge className="bg-cyan-500 text-white px-4 py-2 text-lg font-bold shadow-xl rounded-full">
                    <Award className="w-4 h-4 mr-1" />
                    {course.validityPeriod}
                  </Badge>
                </div>
              )}
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center gap-4 text-white">
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full">
                    <Calendar className="w-4 h-4 text-amber-200 stroke-amber-200" />
                    <span className="font-semibold">{course.duration || '—'}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Quick Info Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              <Card className="border-2 border-cyan-100 shadow-lg rounded-2xl bg-gradient-to-br from-cyan-50 to-white">
                <CardContent className="p-3 sm:p-4 text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-2 text-white [&_svg]:text-white [&_svg]:stroke-white">
                    <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-white stroke-white" />
                  </div>
                  <div className="text-xs text-blue-600 mb-1">Delivery</div>
                  <div className="text-sm font-bold text-blue-700 line-clamp-2 sm:line-clamp-1 h-10 sm:h-auto flex items-center justify-center">{course.delivery}</div>
                </CardContent>
              </Card>

              <Card className="border-2 border-blue-100 shadow-lg rounded-2xl bg-gradient-to-br from-blue-50 to-white">
                <CardContent className="p-3 sm:p-4 text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 stroke-blue-600" />
                  </div>
                  <div className="text-xs text-blue-600 mb-1">Price</div>
                  {experienceBookingEnabled && withExperiencePrice != null && withoutExperiencePrice != null ? (
                    <div className="text-xs sm:text-sm font-bold text-blue-700 space-y-1 min-h-10 flex flex-col items-center justify-center">
                      <div>
                        <span className="text-blue-600 font-semibold">w/ exp</span>{' '}
                        ${withExperiencePrice}
                      </div>
                      <div>
                        <span className="text-blue-600 font-semibold">w/o exp</span>{' '}
                        ${withoutExperiencePrice}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm font-bold text-blue-700 h-10 sm:h-auto flex items-center justify-center">${course.price}</div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-2 border-blue-100 shadow-lg rounded-2xl bg-gradient-to-br from-blue-50 to-white">
                <CardContent className="p-3 sm:p-4 text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 stroke-blue-600" />
                  </div>
                  <div className="text-xs text-blue-600 mb-1">Duration</div>
                  <div className="text-sm font-bold text-blue-700 line-clamp-2 sm:line-clamp-1 h-10 sm:h-auto flex items-center justify-center">{course.duration || '—'}</div>
                </CardContent>
              </Card>

              <Card className="border-2 border-blue-100 shadow-lg rounded-2xl bg-gradient-to-br from-blue-50 to-white">
                <CardContent className="p-3 sm:p-4 text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 stroke-blue-600" />
                  </div>
                  <div className="text-xs text-blue-600 mb-1">Location</div>
                  <div className="text-sm font-bold text-blue-700 line-clamp-2 sm:line-clamp-1 h-10 sm:h-auto flex items-center justify-center">{course.location}</div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Combo Offer Banner */}
            {course.comboOffer && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
              >
                <Card className="border-2 border-violet-200 shadow-xl rounded-3xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 overflow-hidden">
                  <CardContent className="p-4 sm:p-6 relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
                    <div className="relative">
                      <div className="flex items-center gap-3 mb-3">
                        <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
                        <Badge className="bg-white/20 text-white px-3 py-1 text-sm font-bold rounded-full">
                          SPECIAL COMBO OFFER
                        </Badge>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        Save More with Our Combo Package!
                      </h3>
                      <p className="text-white/90 mb-4 text-lg">
                        {course.comboOffer.description}
                      </p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                        <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-3 flex-1 sm:flex-none">
                          <div className="text-sm text-white/80">Combo Price</div>
                          <div className="text-3xl font-bold text-white">${course.comboOffer.price}</div>
                        </div>
                        {course.comboOffer.duration && (
                          <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-3 flex-1 sm:flex-none">
                            <div className="text-sm text-white/80">Duration</div>
                            <div className="text-xl font-bold text-white">{course.comboOffer.duration}</div>
                          </div>
                        )}
                        <Button
                          onClick={() => onEnroll({
                            courseName: course.title,
                            courseCode: course.code,
                            coursePrice: course.comboOffer?.price || course.price
                          })}
                          className="group w-full sm:w-auto mt-3 sm:mt-0 sm:ml-auto bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 hover:from-blue-600 hover:via-cyan-600 hover:to-blue-700 text-white rounded-full px-10 sm:px-12 h-14 sm:h-16 text-base sm:text-xl font-extrabold shadow-[0_18px_35px_rgba(15,23,42,0.45)] hover:shadow-[0_22px_45px_rgba(15,23,42,0.85)] transform hover:-translate-y-1 transition-all duration-200 border border-blue-300"
                        >
                          <span className="flex items-center justify-center gap-2 sm:gap-3">
                            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-sm group-hover:scale-110 transition-transform" />
                            <span className="tracking-wide">Book Combo Now</span>
                            <span className="hidden sm:inline text-xs font-semibold uppercase tracking-[0.15em] bg-white/15 px-3 py-1 rounded-full">
                              Best Value
                            </span>
                          </span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Course Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="border-2 border-blue-100 shadow-xl rounded-3xl bg-white overflow-hidden">
                <CardHeader className="p-4 sm:p-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center shadow-lg border border-blue-200">
                      <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    </div>
                    Course Overview
                  </h2>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 overflow-x-auto">
                  <div
                    className="course-description-content text-gray-700 text-base sm:text-lg leading-relaxed [&_.course-desc-kv-label]:text-blue-600 [&_.course-desc-kv-label]:font-semibold [&_.course-desc-kv-value]:text-blue-700 [&_.course-desc-kv-value]:font-bold [&_.course-desc-h2]:text-lg sm:[&_.course-desc-h2]:text-xl [&_.course-desc-h2]:font-bold [&_.course-desc-h2]:text-slate-900 [&_.course-desc-h2]:mt-4 [&_.course-desc-h3]:text-base sm:[&_.course-desc-h3]:text-lg [&_.course-desc-h3]:font-semibold [&_.course-desc-h3]:text-slate-800 [&_.course-desc-h3]:mt-3 [&_.course-desc-ul]:list-disc [&_.course-desc-ul]:pl-4 sm:[&_.course-desc-ul]:pl-6 [&_.course-desc-ol]:list-decimal [&_.course-desc-ol]:pl-4 sm:[&_.course-desc-ol]:pl-6 [&_.course-desc-li]:my-1 [&_strong]:font-semibold [&_em]:italic [&_table]:w-full [&_table]:overflow-hidden [&_table]:block sm:[&_table]:table [&_table]:overflow-x-auto"
                    dangerouslySetInnerHTML={{
                      __html: courseDescriptionToHtml(course.courseDescription, {
                        price: course.price,
                        delivery: course.delivery,
                        location: course.location
                      })
                    }}
                  />

                  {/* Handbook */}
                  {course.resourcePdf && (
                    <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border-2 border-blue-100">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-20 bg-white border-2 border-blue-200 rounded-lg flex items-center justify-center shadow-md">
                          <BookOpen className="w-8 h-8 text-cyan-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-900 mb-1">Handbook</h4>
                          <button
                            type="button"
                            onClick={() => onViewHandbook
                              ? onViewHandbook(course.resourcePdf.url, course.resourcePdf.title, course.title)
                              : window.open(`https://docs.google.com/gview?url=${encodeURIComponent(course.resourcePdf.url)}&embedded=true`, '_blank')
                            }
                            className="text-cyan-600 hover:text-cyan-700 font-semibold flex items-center gap-2 hover:underline text-left"
                          >
                            <Eye className="w-4 h-4" />
                            View — {course.resourcePdf.title}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Entry Requirements */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
            >
              <Card className="border-2 border-blue-100 shadow-xl rounded-3xl bg-gradient-to-br from-white to-blue-50">
                <CardHeader className="p-4 sm:p-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg text-white">
                      <Target className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    Entry Requirements
                  </h2>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <ul className="space-y-3">
                    {course.entryRequirements.map((item: string, index: number) => (
                      <li key={index} className="flex items-start gap-3 bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-xl shadow-sm border border-blue-100">
                        <Zap className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span className="text-blue-700 text-lg">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Duration Details - only show when duration is set */}
            {course.duration && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card className="border-2 border-blue-100 shadow-xl rounded-3xl bg-gradient-to-br from-white to-blue-50">
                  <CardHeader className="p-4 sm:p-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg text-white">
                        <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      Duration
                    </h2>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <p className="text-blue-700 text-lg">
                      The total duration is <strong className="text-blue-700">{course.duration.toLowerCase()}</strong>. Training and assessment are conducted in our modern training facilities with industry-standard equipment.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Training Overview */}
            {course.trainingOverview.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35 }}
              >
                <Card className="border-2 border-blue-100 shadow-xl rounded-3xl bg-gradient-to-br from-white to-blue-50">
                  <CardHeader className="p-4 sm:p-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg text-white">
                        <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      Training Overview
                    </h2>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {course.trainingOverview.map((item: string, index: number) => (
                        <div key={index} className="flex items-start gap-3 bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                          <CheckCircle className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{item}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Vocational Outcome */}
            {course.vocationalOutcome.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Card className="border-2 border-blue-100 shadow-xl rounded-3xl bg-gradient-to-br from-white to-blue-50">
                  <CardHeader>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg text-white">
                        <Award className="w-6 h-6" />
                      </div>
                      Vocational Outcome
                    </h2>
                  </CardHeader>
                  <CardContent>
                    <p className="text-blue-700 mb-4 text-lg font-semibold">
                      After completing this course, you will gain the following skills and knowledge:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {course.vocationalOutcome.map((item: string, index: number) => (
                        <div key={index} className="flex items-start gap-3 bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-xl shadow-sm border border-blue-100">
                          <Star className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5 fill-blue-600" />
                          <span className="text-blue-700">{item}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Pathways */}
            {course.pathways && course.pathways.certifications.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.45 }}
              >
                <Card className="border-2 border-indigo-100 shadow-xl rounded-3xl bg-gradient-to-br from-white to-indigo-50">
                  <CardHeader>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg text-white">
                        <TrendingUp className="w-6 h-6" />
                      </div>
                      Pathways & Further Study
                    </h2>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 italic mb-4 text-lg bg-white p-4 rounded-xl">
                      {course.pathways.description}
                    </p>
                    <p className="text-gray-700 font-semibold mb-4">
                      Students completing this course may decide to undertake additional studies such as:
                    </p>
                    <div className="grid grid-cols-1 gap-3">
                      {course.pathways.certifications.map((cert: string, index: number) => (
                        <div key={index} className="flex items-start gap-3 bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                          <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-gray-700">{cert}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Fees and Charges - always show so icon is visible */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Card className="border-2 border-blue-100 shadow-xl rounded-3xl bg-gradient-to-br from-white to-blue-50">
                <CardHeader>
                  <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg text-white">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    Fees and Charges
                  </h2>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {(course.feesAndCharges.length > 0 ? course.feesAndCharges : ['Group discounts apply', 'Refund and fee protection policy – Please refer to the student handbook']).map((item: string, index: number) => (
                      <li key={index} className="flex items-start gap-3 bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-xl shadow-sm border border-blue-100">
                        <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span className="text-blue-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Optional Charges */}
            {course.optionalCharges.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.55 }}
              >
                <Card className="border-2 border-blue-100 shadow-xl rounded-3xl bg-gradient-to-br from-white to-blue-50">
                  <CardHeader>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg text-white">
                        <DollarSign className="w-6 h-6" />
                      </div>
                      Optional Charges
                    </h2>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {course.optionalCharges.map((item: string, index: number) => (
                        <li key={index} className="flex items-start gap-3 bg-gradient-to-r from-blue-50 to-cyan-50 p-3 rounded-xl border border-blue-100">
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-blue-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Right Side - Sticky Enrollment Card */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="sticky top-6 space-y-6"
            >
              {/* Main Booking Card */}
              <Card id="booking-card" className="border-2 border-cyan-200 shadow-2xl rounded-3xl overflow-hidden">
                {/* Price Header */}
                <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white p-8 text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
                  <div className="relative">
                    {experienceBookingEnabled && withExperiencePrice != null && withoutExperiencePrice != null ? (
                      <>
                        <p className="text-blue-100 text-lg mb-4">Course Fee</p>
                        <div className="space-y-4 text-left sm:text-center">
                          <div>
                            <p className="text-blue-100 text-sm mb-1">With experience</p>
                            {course.experienceOriginalPrice != null && course.experienceOriginalPrice > 0 && (
                              <div className="price-strikethrough text-lg text-white/60 mb-1">
                                ${course.experienceOriginalPrice}
                              </div>
                            )}
                            <div className="text-3xl sm:text-4xl font-bold">${withExperiencePrice}</div>
                          </div>
                          <div className="pt-4 border-t border-white/20">
                            <p className="text-blue-100 text-sm mb-1">Without experience</p>
                            {course.noExperienceOriginalPrice != null && course.noExperienceOriginalPrice > 0 && (
                              <div className="price-strikethrough text-lg text-white/60 mb-1">
                                ${course.noExperienceOriginalPrice}
                              </div>
                            )}
                            <div className="text-3xl sm:text-4xl font-bold">${withoutExperiencePrice}</div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {course.originalPrice && (
                          <div className="price-strikethrough text-xl text-white/60 mb-1">
                            ${course.originalPrice}
                          </div>
                        )}
                        <div className="text-5xl font-bold mb-2">
                          ${course.price}
                        </div>
                        <p className="text-blue-100 text-lg">Course Fee</p>
                        {course.originalPrice && (
                          <Badge className="mt-3 bg-red-500 text-white border-0 px-4 py-1.5 text-sm font-bold">
                            SAVE ${course.originalPrice - course.price}!
                          </Badge>
                        )}
                      </>
                    )}
                    {slBlPrice != null && slBlPrice > 0 && (
                      <div className="mt-4 pt-4 border-t border-white/20">
                        <p className="text-blue-100 text-sm mb-1">SL + BL</p>
                        {slBlOriginalPrice != null && (
                          <span className="price-strikethrough text-lg text-white/60 mr-2">${slBlOriginalPrice}</span>
                        )}
                        <span className="text-2xl font-bold">${slBlPrice}</span>
                      </div>
                    )}
                  </div>
                </div>

                <CardContent className="p-6 space-y-6">
                  {/* Course Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 sm:mb-4">Course Details</h3>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100 gap-1 sm:gap-4">
                      <span className="text-blue-700 flex items-center gap-2 font-semibold">
                        <Clock className="w-5 h-5 text-blue-600" />
                        Duration
                      </span>
                      <span className="font-bold text-blue-700">{course.duration || '—'}</span>
                    </div>

                    {course.resourcePdf && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200 gap-1 sm:gap-4">
                        <span className="text-gray-700 flex items-center gap-2 font-semibold">
                          <BookOpen className="w-5 h-5 text-cyan-600 flex-shrink-0" />
                          Handbook
                        </span>
                        <button
                          type="button"
                          onClick={() => onViewHandbook
                            ? onViewHandbook(course.resourcePdf.url, course.resourcePdf.title, course.title)
                            : window.open(`https://docs.google.com/gview?url=${encodeURIComponent(course.resourcePdf.url)}&embedded=true`, '_blank')
                          }
                          className="text-cyan-600 hover:text-cyan-700 font-semibold text-sm hover:underline flex-shrink-0"
                        >
                          View handbook
                        </button>
                      </div>
                    )}

                    {course.validityPeriod && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl border border-purple-100 gap-1 sm:gap-4">
                        <span className="text-gray-700 flex items-center gap-2 font-semibold">
                          <Award className="w-5 h-5 text-purple-600" />
                          Validity
                        </span>
                        <span className="font-bold text-slate-900">{course.validityPeriod}</span>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100 gap-1 sm:gap-4">
                      <span className="text-blue-700 flex items-center gap-2 font-semibold">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        Location
                      </span>
                      <span className="font-bold text-blue-700 text-sm text-right">{course.location}</span>
                    </div>
                  </div>

                  {/* Course Features */}
                  <div className="flex flex-wrap gap-2">
                    {course.hasTheory && (
                      <Badge className="bg-blue-100 text-blue-700 border-0 px-3 py-1.5 text-sm font-semibold">
                        <BookOpen className="w-3 h-3 mr-1" />
                        Theory
                      </Badge>
                    )}
                    {course.hasPractical && (
                      <Badge className="bg-green-100 text-green-700 border-0 px-3 py-1.5 text-sm font-semibold">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Practical
                      </Badge>
                    )}
                    {course.hasExam && (
                      <Badge className="bg-purple-100 text-purple-700 border-0 px-3 py-1.5 text-sm font-semibold">
                        <Award className="w-3 h-3 mr-1" />
                        Exam
                      </Badge>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3 pt-4">
                    {experienceBookingEnabled && withExperiencePrice != null && withoutExperiencePrice != null ? (
                      <>
                        <Button
                          onClick={() => onEnroll({
                            courseId,
                            courseName: course.title,
                            courseCode: course.code,
                            coursePrice: withExperiencePrice,
                            experienceType: 'with'
                          })}
                          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-full h-14 text-lg font-bold shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 flex-wrap px-3"
                        >
                          {course.experienceOriginalPrice != null && course.experienceOriginalPrice > 0 && (
                            <span className="price-strikethrough text-white/80 text-base">${course.experienceOriginalPrice}</span>
                          )}
                          <span className="text-lg">${withExperiencePrice}</span>
                          <span>Book With Experience</span>
                        </Button>
                        <Button
                          onClick={() => onEnroll({
                            courseId,
                            courseName: course.title,
                            courseCode: course.code,
                            coursePrice: withoutExperiencePrice,
                            experienceType: 'without'
                          })}
                          className="w-full bg-gradient-to-r from-red-400 to-rose-500 hover:from-red-500 hover:to-rose-600 text-white rounded-full h-14 text-lg font-bold shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 flex-wrap px-3"
                        >
                          {course.noExperienceOriginalPrice != null && course.noExperienceOriginalPrice > 0 && (
                            <span className="price-strikethrough text-white/80 text-base">${course.noExperienceOriginalPrice}</span>
                          )}
                          <span className="text-lg">${withoutExperiencePrice}</span>
                          <span>Book Without Experience</span>
                        </Button>
                        {slBlPrice != null && slBlPrice > 0 &&
                          Math.abs(slBlPrice - withExperiencePrice) > 0.001 &&
                          Math.abs(slBlPrice - withoutExperiencePrice) > 0.001 && (
                          <Button
                            onClick={() => onEnroll({
                              courseId,
                              courseName: course.title,
                              courseCode: course.code,
                              coursePrice: slBlPrice
                            })}
                            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full h-14 text-lg font-bold shadow-xl hover:shadow-2xl transition-all"
                          >
                            {slBlOriginalPrice != null && (
                              <span className="price-strikethrough text-white/80 text-base mr-2">${slBlOriginalPrice}</span>
                            )}
                            <span className="text-lg">${slBlPrice}</span>
                            <span className="ml-1">Book Now SL + BL</span>
                          </Button>
                        )}
                      </>
                    ) : (
                      <>
                        <Button
                          onClick={() => onEnroll({
                            courseId,
                            courseName: course.title,
                            courseCode: course.code,
                            coursePrice: course.price
                          })}
                          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-full h-14 text-lg font-bold shadow-xl hover:shadow-2xl transition-all"
                        >
                          BOOK NOW — ${course.price}
                        </Button>
                        {slBlPrice != null && slBlPrice > 0 && (
                          <Button
                            onClick={() => onEnroll({
                              courseId,
                              courseName: course.title,
                              courseCode: course.code,
                              coursePrice: slBlPrice
                            })}
                            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full h-14 text-lg font-bold shadow-xl hover:shadow-2xl transition-all"
                          >
                            Book Now SL + BL — ${slBlPrice}
                          </Button>
                        )}
                      </>
                    )}

                    {course.courseDates && course.courseDates.length > 0 && (
                      <Button
                        variant="outline"
                        className="w-full border-2 border-cyan-500 text-cyan-600 hover:bg-cyan-50 rounded-full h-12 font-semibold"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        View Course Calendar 2025
                      </Button>
                    )}

                    {course.resourcePdf && (
                      <Button
                        variant="outline"
                        className="w-full border-2 border-slate-300 text-slate-700 hover:bg-slate-50 rounded-full h-12 font-semibold"
                        onClick={() => onViewHandbook
                          ? onViewHandbook(course.resourcePdf.url, course.resourcePdf.title, course.title)
                          : window.open(`https://docs.google.com/gview?url=${encodeURIComponent(course.resourcePdf.url)}&embedded=true`, '_blank')
                        }
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Handbook
                      </Button>
                    )}
                  </div>

                  {/* Trust Badges */}
                  <div className="pt-4 border-t border-gray-200 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Nationally Recognized Certification</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <span>Industry-Standard Training</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Star className="w-4 h-4 text-yellow-600" />
                      <span>Expert Instructors</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Need Help Card */}
              <Card className="border-2 border-blue-100 rounded-2xl shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg text-white">
                      <Phone className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 mb-1">Need Help?</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        Contact our training advisors for personalized guidance
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Button
                      asChild
                      variant="outline"
                      className="w-full justify-start border-2 border-cyan-200 hover:bg-cyan-50 rounded-xl"
                    >
                      <a href="tel:1300976097" aria-label="Call 1300 976 097">
                        <Phone className="w-4 h-4 mr-2 text-cyan-600" />
                        <span className="text-cyan-600 font-semibold">Call: 1300 976 097</span>
                      </a>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="w-full justify-start border-2 border-blue-200 hover:bg-blue-50 rounded-xl"
                    >
                      <a
                        href="mailto:info@safetytrainingacademy.edu.au"
                        aria-label="Email info@safetytrainingacademy.edu.au"
                      >
                        <Mail className="w-4 h-4 mr-2 text-blue-600" />
                        <span className="text-blue-600 font-semibold">Email Support</span>
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={logoImage}
                  alt="Safety Training Academy"
                  width={SAFETY_TRAINING_ACADEMY_LOGO.width}
                  height={SAFETY_TRAINING_ACADEMY_LOGO.height}
                  className="h-12 w-auto max-w-full object-contain object-left"
                />
              </div>
              <p className="text-white/90 text-sm mb-4">
                Professional certification programs for your career growth.
              </p>
              {/* Social Media Icons */}
              <div className="flex gap-4">
                <a
                  href={SOCIAL_LINKS.facebook}
                  aria-label="Facebook"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
                >
                  <Facebook className="w-6 h-6" />
                </a>
                <a
                  href={SOCIAL_LINKS.linkedin}
                  aria-label="LinkedIn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
                >
                  <Linkedin className="w-6 h-6" />
                </a>
                <a
                  href={SOCIAL_LINKS.instagram}
                  aria-label="Instagram"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
                >
                  <Instagram className="w-6 h-6" />
                </a>
              </div>
            </div>
            <div>
              <h3 className="font-bold mb-4 text-lg">Head Office</h3>
              <ul className="space-y-2 text-sm text-white/90">
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Safety Training Academy | Sydney - 3/14-16 Marjorie Street, Sefton NSW 2162</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4 text-lg">Contact</h3>
              <ul className="space-y-2 text-sm text-white/90">
                <li className="flex items-start gap-2">
                  <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <a
                    href="mailto:info@safetytrainingacademy.edu.au"
                    className="hover:text-white transition-colors"
                  >
                    info@safetytrainingacademy.edu.au
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>0483 878 887</span>
                </li>
                <li className="flex items-start gap-2">
                  <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <a href="tel:1300976097" className="hover:text-white transition-colors">
                    1300 976 097
                  </a>
                </li>
                <li className="text-xs">RTO: 45234</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4 text-lg">Link</h3>
              <ul className="space-y-2 text-sm text-white/90">
                <li><button onClick={onBack} className="hover:text-white transition-colors">Home</button></li>
                <li><button onClick={onBookNow} className="hover:text-white transition-colors">Book Now</button></li>
                <li><button onClick={onBack} className="hover:text-white transition-colors">Courses</button></li>
                <li><button onClick={onAbout} className="hover:text-white transition-colors">About Us</button></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><button onClick={onContact} className="hover:text-white transition-colors">Contact</button></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/20 pt-8 text-center text-sm text-white/90">
            <p>&copy; 2024 Safety Training Academy. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.5 }}
        className="lg:hidden fixed bottom-0 left-0 right-0 z-[60] p-4 pb-8 bg-white border-t border-slate-200 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] flex items-center justify-between gap-4"
      >
        <div className="flex flex-col items-start">
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1 leading-none">
            {experienceBookingEnabled ? 'Starting From' : 'Course Fee'}
          </span>
          <div className="text-2xl font-black text-blue-700 tracking-tight leading-none">
            ${experienceBookingEnabled
              ? Math.min(withExperiencePrice || Infinity, withoutExperiencePrice || Infinity)
              : course.price
            }
          </div>
        </div>
        <Button
          onClick={() => {
            if (experienceBookingEnabled) {
              scrollToBooking();
            } else {
              onEnroll({
                courseId,
                courseName: course.title,
                courseCode: course.code,
                coursePrice: course.price
              });
            }
          }}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full h-12 text-base font-black shadow-lg active:scale-95 transition-all duration-300 border-0"
        >
          {experienceBookingEnabled ? (
            <span className="flex items-center gap-2">
              Book Now <ChevronRight className="w-4 h-4 stroke-[3px]" />
            </span>
          ) : (
            'Book Now'
          )}
        </Button>
      </motion.div>

      {/* CSS Override for Floating Buttons on Mobile */}
      <style>{`
        @media (max-width: 1024px) {
          .fixed.bottom-6.right-6 {
            bottom: 6rem !important;
            transition: bottom 0.3s ease;
          }
        }
      `}</style>

      {/* WhatsApp Floating Button */}
      <WhatsAppButton />

      {/* Back to top */}
      {showBackToTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-40 p-3 rounded-full bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2"
          aria-label="Back to top"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}