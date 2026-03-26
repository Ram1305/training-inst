// src/components/LandingPage.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Award,
  Clock,
  Users,
  Search,
  Menu,
  X,
  CheckCircle,
  Star,
  MapPin,
  Phone,
  Mail,
  Building,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Quote,
  Facebook,
  Linkedin,
  Instagram,
  Send,
  ArrowRight,
  Shield,
  BookOpen,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { motion, AnimatePresence } from "motion/react";
import { courseService } from '../services/course.service';
import { SAFETY_TRAINING_ACADEMY_LOGO } from '../constants/safetyTrainingAcademyLogo';
import type { CourseListItem } from '../services/course.service';
import { categoryService } from '../services/category.service';
import type { CategoryDropdownItem } from '../services/category.service';
import { WhatsAppButton } from "./ui/WhatsAppButton";
import { PublicHeader } from "./layout/PublicHeader";
import { PublicBannerModal } from "./layout/PublicBannerModal";
import googleReviewsJson from '../../assets/googlereviews.json';
import '../reviews-marquee.css';

interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
  onCourseDetails?: (courseId: string) => void;
  onAbout?: () => void;
  onContact?: () => void;
  onBookNow?: () => void;
  onEnrollNow?: () => void;
  onForms?: () => void;
  onFeesRefund?: () => void;
  onGallery?: () => void;
  onBookCourse?: (courseId: string, courseCode: string, courseName: string, price: number, experienceType?: 'with' | 'without') => void;
  onVOC?: () => void;
  onViewCourses?: () => void;
  onViewComboCourses?: () => void;
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/** iPhone / iPod / iPad (incl. iPadOS desktop UA). Used to avoid WebKit marquee transform hit-testing bugs. */
function detectIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) return true;
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

const clients = [
  { name: "Kenny Construction", logo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200" },
  { name: "Avopiling", logo: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200" },
  { name: "Pructon", logo: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=200" },
  { name: "Kenny Construction", logo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200" },
];

/** Max reviews shown in the landing marquee; keeps scroll smooth without loading the full JSON set. */
const LANDING_REVIEWS_MARQUEE_MAX = 20;

type LandingReview = {
  googleReviewId: string;
  author: string;
  rating: number;
  reviewText: string;
  timeText?: string | null;
  isMainReview: boolean;
};

type RawGoogleReview = {
  stars?: unknown;
  name?: unknown;
  reviewUrl?: unknown;
  text?: unknown;
};

function LandingReviewCard({ review }: { review: LandingReview }) {
  return (
    <Card className="border border-cyan-100 rounded-3xl bg-white/95 shadow-lg hover:shadow-xl transition-shadow p-6 md:p-7 h-full backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold text-slate-900 text-base truncate pr-2">{review.author}</div>
        <div className="w-7 h-7 bg-white rounded-full shadow-sm border border-slate-100 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-transparent bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text">
            G
          </span>
        </div>
      </div>
      <div className="flex gap-1.5 mb-3">
        {[...Array(review.rating)].map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
      <p className="text-sm md:text-[15px] text-gray-700 leading-relaxed line-clamp-4 min-h-[5.5rem]">
        {review.reviewText}
      </p>
      {review.timeText && <p className="text-xs text-gray-500 mt-3">{review.timeText}</p>}
    </Card>
  );
}

export function LandingPage({ onLogin, onRegister, onCourseDetails, onAbout, onContact, onBookNow, onEnrollNow, onForms, onFeesRefund, onGallery, onBookCourse, onVOC, onViewCourses, onViewComboCourses }: LandingPageProps) {
  const [isIOS] = useState(() => detectIOS());

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedCombo, setExpandedCombo] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Data states
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [categories, setCategories] = useState<CategoryDropdownItem[]>([]);
  const [googleReviews, setGoogleReviews] = useState<LandingReview[]>([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const coursesRef = useRef<CourseListItem[]>([]);

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 300);

  /** Slightly slower marquee on narrow screens so text is easier to read while auto-scrolling. */
  const [reviewsMarqueeDurationSec, setReviewsMarqueeDurationSec] = useState(2400);

  useEffect(() => {
    coursesRef.current = courses;
  }, [courses]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setReviewsMarqueeDurationSec(mq.matches ? 2880 : 2400);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const heroSlides = [
    {
      id: 1,
      title: "CAREER TRAINING AND LICENSING",
      subtitle: "Professional certification programs for Earthmoving, First Aid, Traffic Control, Asbestos Removal & more. Get certified with industry-recognized credentials.",
      image: "/assets/Slider1.jpeg",
    },
    {
      id: 2,
      title: "EXPERT-LED TRAINING",
      subtitle: "Learn from professionals with 10+ years of real-world experience. Achieve 95% pass rate with our comprehensive curriculum.",
      image: "/assets/Slider2.jpeg",
    },
    {
      id: 3,
      title: "NATIONALLY RECOGNIZED CERTIFICATES",
      subtitle: "Get certified with credentials that are recognized across all states and territories. Start your career with confidence.",
      image: "/assets/Slider3.jpeg",
    },
  ];

  const fetchCourses = useCallback(async (searchTerm?: string) => {
    try {
      // Only show main loader if we have no courses yet
      setError(null);

      const term = searchTerm?.trim() || "";

      const filter: { searchQuery?: string; pageSize: number; sortBy?: string; sortDescending?: boolean } = {
        pageSize: 1000,
        sortBy: 'displayOrder',
        sortDescending: false
      };

      if (term) {
        filter.searchQuery = term;
      }

      if (coursesRef.current.length === 0) {
        setIsLoading(true);
      }

      const response = await courseService.getActiveCourses(filter);

      if (response.success && response.data) {
        let list = response.data.courses;
        // Client-side filter fallback
        if (term) {
          const lowerTerm = term.toLowerCase();
          list = list.filter(
            (c) =>
              c.courseName?.toLowerCase().includes(lowerTerm) ||
              c.courseCode?.toLowerCase().includes(lowerTerm) ||
              (c.categoryName && c.categoryName.toLowerCase().includes(lowerTerm))
          );
        }
        setCourses(list);
      } else {
        setError(response.message || 'Failed to load courses');
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to load courses');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getCategoriesDropdown();
      if (response.success && response.data) {
        setCategories(response.data.categories);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchReviews = useCallback(async () => {
    try {
      setIsReviewsLoading(true);

      const parsedReviews = (Array.isArray(googleReviewsJson) ? googleReviewsJson : [])
        .map((review, index): LandingReview | null => {
          const rawReview = review as RawGoogleReview;

          const author = typeof rawReview.name === 'string' ? rawReview.name.trim() : '';
          const reviewText = typeof rawReview.text === 'string' ? rawReview.text.trim() : '';
          const ratingNumber = Number(rawReview.stars);
          const rating = Number.isFinite(ratingNumber)
            ? Math.min(5, Math.max(1, Math.round(ratingNumber)))
            : 5;
          const reviewUrl = typeof rawReview.reviewUrl === 'string' ? rawReview.reviewUrl.trim() : '';

          if (!author || !reviewText) {
            return null;
          }

          return {
            googleReviewId: reviewUrl || `asset-review-${index}`,
            author,
            rating,
            reviewText,
            timeText: null,
            isMainReview: false,
          };
        })
        .filter((review): review is LandingReview => review !== null)
        .slice(0, LANDING_REVIEWS_MARQUEE_MAX);

      if (parsedReviews.length > 0) {
        parsedReviews[0] = {
          ...parsedReviews[0],
          isMainReview: true,
        };
      }

      setGoogleReviews(parsedReviews);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setGoogleReviews([]);
    } finally {
      setIsReviewsLoading(false);
    }
  }, []);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch reviews on mount
  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Fetch courses on mount and when search changes (debounced via useDebounce)
  useEffect(() => {
    fetchCourses(debouncedSearch);
  }, [debouncedSearch, fetchCourses]);

  // Auto-play slider
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Back to top visibility
  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const handleCourseClick = (courseId: string) => {
    if (onCourseDetails) {
      onCourseDetails(courseId);
    }
  };

  const getCoursesByCategory = (categoryId: string) => {
    return courses
      .filter((course) => course.categoryId === categoryId && !course.hasComboOffer)
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <PublicHeader
        onBack={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
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

      <PublicBannerModal />

      {/* Hero Slider Section with Search */}
      <section id="home" className="relative overflow-x-hidden">
        <div className="relative min-h-[420px] h-[70svh] max-h-[640px] md:max-h-none md:h-[700px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0"
            >
              <ImageWithFallback
                src={heroSlides[currentSlide].image}
                alt={heroSlides[currentSlide].title}
                width={1536}
                height={700}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-800/85 to-blue-900/90" />
            </motion.div>
          </AnimatePresence>

          <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between min-w-0">
            {/* Left Side - Title and Search */}
            <motion.div
              className="max-w-3xl flex-1 min-w-0 pr-2 md:pr-0"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-6 leading-tight break-words">
                {heroSlides[currentSlide].title}
              </h1>
              <p className="text-lg md:text-xl text-blue-100 mb-8">
                {heroSlides[currentSlide].subtitle}
              </p>

              {/* Search Bar */}
              <div className="flex flex-col sm:flex-row gap-4 max-w-2xl">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search Courses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        fetchCourses(searchQuery);
                        document.getElementById("courses")?.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                    className="pl-12 pr-10 h-14 rounded-full border-2 border-blue-200 focus:border-cyan-400 bg-white"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                      title="Clear search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <Button
                  className="bg-cyan-700 hover:bg-cyan-800 text-white h-14 px-8 rounded-full text-lg font-semibold shadow-lg shadow-cyan-900/35"
                  onClick={() => {
                    fetchCourses(searchQuery);
                    document.getElementById("courses")?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Search Courses
                </Button>
              </div>
            </motion.div>

            {/* Right Side - Course Enrolment Card */}
            <motion.div
              className="hidden lg:block"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <Card className="bg-slate-800/70 backdrop-blur-lg border-2 border-cyan-400/40 shadow-xl rounded-2xl p-6 w-[340px]">
                <CardHeader className="p-0 mb-4">
                  <CardTitle className="text-2xl font-bold text-white mb-2">
                    Course Enrolment
                  </CardTitle>
                  <CardDescription className="text-white/70 text-sm leading-relaxed">
                    To enrol for a Course with Safety Training Academy, please complete our online Enrolment form via
                    the button below:
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 space-y-2.5">
                  <Button
                    onClick={onEnrollNow || onRegister}
                    className="w-full bg-slate-900/90 hover:bg-slate-950 text-white rounded-full h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all border border-slate-700/50"
                  >
                    ENROL NOW
                  </Button>
                  <Button
                    onClick={onVOC}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-full h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all"
                  >
                    VOC
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Slider Controls */}
          <button
            onClick={prevSlide}
            aria-label="Previous slide"
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full flex items-center justify-center transition-all z-20"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={nextSlide}
            aria-label="Next slide"
            className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full flex items-center justify-center transition-all z-20"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>

          {/* Slider Dots */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-1 z-20">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className="p-3 group"
                aria-label={`Go to slide ${index + 1}`}
              >
                <div className={`w-3 h-3 rounded-full transition-all ${currentSlide === index ? "bg-cyan-400 w-8" : "bg-white/50 group-hover:bg-white/80"
                  }`} />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Sunday Classes Announcement Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Sunday Classes Banner */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-red-600 mb-6">
              SUNDAY CLASSES AVAILABLE ! ENROLL NOW
            </h2>
          </motion.div>

          {/* Main Content */}
          <motion.div
            className="text-center space-y-5"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {/* Primary Heading */}
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 leading-tight">
              Workplace Health and Safety Training Courses in Sydney
            </h2>

            {/* Course Categories */}
            <div className="flex flex-wrap justify-center items-center gap-3 md:gap-4 text-lg md:text-xl lg:text-2xl font-semibold text-slate-800 pt-2">
              <span>Construction Short Courses</span>
              <span className="text-slate-400">•</span>
              <span>Earthmoving</span>
              <span className="text-slate-400">•</span>
              <span>HRW Training</span>
              <span className="text-slate-400">&</span>
              <span className="text-blue-600">VOC's for All Courses</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Combo Courses Section */}
      <section id="combo" className="py-20 bg-gradient-to-br from-purple-50 via-pink-50 to-cyan-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-6 py-2 rounded-full mb-6 shadow-lg">
              <Sparkles className="w-5 h-5" />
              <span className="font-bold text-sm uppercase tracking-wider">Special Offers</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Combo Course Packages
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Save big with our specially curated combo packages! Get multiple certifications at an unbeatable price.
            </p>
          </motion.div>

          {/* Combo Courses Grid - Using Same Card as Regular Courses */}
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {isLoading ? (
                <div className="col-span-full flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
                  <span className="ml-2 text-gray-600">Loading combo courses...</span>
                </div>
              ) : (
                courses
                  .filter(course => course.hasComboOffer)
                  .slice(0, expandedCombo ? undefined : 3)
                  .map((course, index) => (
                    <motion.div
                      key={course.courseId}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      onClick={() => handleCourseClick(course.courseId)}
                      className="cursor-pointer"
                    >
                      <Card className="group hover:shadow-2xl transition-all duration-300 border-2 border-blue-100 hover:border-cyan-400 rounded-2xl overflow-hidden bg-white h-full flex flex-col transform hover:-translate-y-2">
                        <div className="relative h-56 overflow-hidden">
                          <ImageWithFallback
                            src={course.imageUrl || "https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=1080"}
                            alt={course.courseName}
                            width={400}
                            height={224}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute top-4 right-4 flex gap-2">
                            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 text-sm font-bold shadow-lg">
                              COMBO
                            </Badge>
                            {course.validityPeriod && (
                              <Badge className="bg-cyan-500 text-white px-3 py-1 text-sm font-semibold shadow-lg">
                                {course.validityPeriod}
                              </Badge>
                            )}
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white font-semibold text-lg">View Details</span>
                          </div>
                        </div>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between mb-2">
                            <Badge
                              variant="outline"
                              className="border-blue-300 text-blue-700 font-semibold text-xs"
                            >
                              {course.categoryName}
                            </Badge>
                            <div className="text-2xl font-bold text-cyan-600">${course.price}</div>
                          </div>
                          <CardTitle className="text-lg text-slate-900 group-hover:text-cyan-600 transition-colors line-clamp-2">
                            {course.courseCode} - {course.courseName}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 flex-grow">
                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                              <span className="line-clamp-1">Face to Face Training</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Building className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                              <span className="line-clamp-1">Delivery: On-site</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            {course.duration && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4 text-cyan-500" />
                                <span>{course.duration}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2 pt-2">
                            {course.hasTheory && (
                              <Badge variant="outline" className="text-xs border-green-300 text-green-700">
                                Theory
                              </Badge>
                            )}
                            {course.hasPractical && (
                              <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                                Practical
                              </Badge>
                            )}
                            {course.hasExam && (
                              <Badge variant="outline" className="text-xs border-purple-300 text-purple-700">
                                Exam
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-2">
                          {course.experienceBookingEnabled ? (
                            <>
                              <Button
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl h-11 font-semibold shadow-lg flex items-center justify-center gap-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onBookCourse) onBookCourse(course.courseId, course.courseCode, course.courseName, course.experiencePrice || course.price, 'with');
                                }}
                              >
                                {course.experienceOriginalPrice && (
                                  <span className="price-strikethrough text-white/80 text-base mr-1">${course.experienceOriginalPrice}</span>
                                )}
                                <span className="price-current text-lg">${course.experiencePrice || course.price}</span>
                                <span className="ml-1">Book With Experience</span>
                              </Button>
                              <Button
                                className="w-full bg-gradient-to-r from-red-400 to-rose-500 hover:from-red-500 hover:to-rose-600 text-white rounded-xl h-11 font-semibold shadow-lg flex items-center justify-center gap-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onBookCourse) onBookCourse(course.courseId, course.courseCode, course.courseName, course.noExperiencePrice || course.price, 'without');
                                }}
                              >
                                {course.noExperienceOriginalPrice && (
                                  <span className="price-strikethrough text-white/80 text-base mr-1">${course.noExperienceOriginalPrice}</span>
                                )}
                                <span className="price-current text-lg">${course.noExperiencePrice || course.price}</span>
                                <span className="ml-1">Book Without Experience</span>
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl h-11 font-semibold shadow-lg flex items-center justify-center gap-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onBookCourse) onBookCourse(course.courseId, course.courseCode, course.courseName, course.price);
                                }}
                              >
                                {course.originalPrice && (
                                  <span className="price-strikethrough text-white/80 text-base mr-1">${course.originalPrice}</span>
                                )}
                                <span className="price-current text-lg">${course.price}</span>
                                <span className="ml-1">Book Now</span>
                              </Button>
                              {course.promoPrice != null && course.promoPrice > 0 && course.courseCode === 'RIIHAN301E' && (
                                <Button
                                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl h-11 font-semibold shadow-lg flex items-center justify-center gap-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onBookCourse) onBookCourse(course.courseId, course.courseCode, course.courseName, course.promoPrice!);
                                  }}
                                >
                                  {course.promoOriginalPrice != null && course.promoOriginalPrice > 0 && (
                                    <span className="price-strikethrough text-white/80 text-base mr-1">${course.promoOriginalPrice}</span>
                                  )}
                                  <span className="price-current text-lg">${course.promoPrice}</span>
                                  <span className="ml-1">Book Now SL + BL</span>
                                </Button>
                              )}
                            </>
                          )}
                          <Button
                            variant="outline"
                            className="w-full border-2 border-cyan-500 text-cyan-600 hover:bg-cyan-50 rounded-xl h-10 font-semibold"
                            onClick={(e) => { e.stopPropagation(); handleCourseClick(course.courseId); }}
                          >
                            View Details
                          </Button>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  ))
              )}
            </div>

            {/* See More Button for Combo Courses */}
            {!isLoading && courses.filter(course => course.hasComboOffer).length > 3 && (
              <div className="text-center">
                <Button
                  onClick={() => setExpandedCombo(!expandedCombo)}
                  variant="outline"
                  className="border-2 border-cyan-900 text-cyan-950 bg-white/80 hover:bg-cyan-50 rounded-full px-8 h-12 text-lg font-semibold"
                >
                  {expandedCombo ? "Show Less" : "See More Combo Courses"}
                  <ArrowRight className={`w-5 h-5 ml-2 transition-transform ${expandedCombo ? "rotate-180" : ""}`} />
                </Button>
              </div>
            )}
          </div>

          {/* No Combo Courses Message */}
          {!isLoading && courses.filter(course => course.hasComboOffer).length === 0 && (
            <motion.div
              className="text-center py-16"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full mb-4">
                <Sparkles className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-700 mb-2">No Combo Offers Available</h3>
              <p className="text-gray-600">Check back soon for exciting combo course packages!</p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Courses Section - Organized by Category */}
      <section id="courses" className="py-20 bg-gradient-to-br from-cyan-50 via-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
          {isLoading && courses.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
              <span className="ml-2 text-gray-600">Loading courses...</span>
            </div>
          ) : error && courses.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={() => fetchCourses()} variant="outline">
                Try Again
              </Button>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">No categories available.</p>
            </div>
          ) : (
            categories.map((category, catIndex) => {
              const categoryCourses = getCoursesByCategory(category.categoryId);

              if (categoryCourses.length === 0) return null;

              const isExpanded = expandedCategories.has(category.categoryId);
              const displayedCourses = isExpanded ? categoryCourses : categoryCourses.slice(0, 3);
              const hasMore = categoryCourses.length > 3;

              return (
                <motion.div
                  id={`category-${category.categoryId}`}
                  key={category.categoryId}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: catIndex * 0.1 }}
                >
                  {/* Category Header */}
                  <div className="mb-10">
                    <h2 className="text-4xl md:text-5xl font-bold text-cyan-600 mb-3">
                      {category.categoryName}
                    </h2>
                  </div>

                  {/* Course Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-6">
                    {displayedCourses.map((course, index) => (
                      <motion.div
                        key={course.courseId}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        onClick={() => handleCourseClick(course.courseId)}
                        className="cursor-pointer"
                      >
                        <Card className="group hover:shadow-2xl transition-all duration-300 border-2 border-blue-100 hover:border-cyan-400 rounded-2xl overflow-hidden bg-white h-full flex flex-col transform hover:-translate-y-2">
                          <div className="relative h-56 overflow-hidden">
                            <ImageWithFallback
                              src={course.imageUrl || "https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=1080"}
                              alt={course.courseName}
                              width={400}
                              height={224}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            {course.validityPeriod && (
                              <div className="absolute top-4 right-4">
                                <Badge className="bg-cyan-500 text-white px-3 py-1 text-sm font-semibold shadow-lg">
                                  {course.validityPeriod}
                                </Badge>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-white font-semibold text-lg">View Details</span>
                            </div>
                          </div>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between mb-2">
                              <Badge
                                variant="outline"
                                className="border-blue-300 text-blue-700 font-semibold text-xs"
                              >
                                {category.categoryName}
                              </Badge>
                              <div className="text-2xl font-bold text-cyan-600">${course.price}</div>
                            </div>
                            <CardTitle className="text-lg text-slate-900 group-hover:text-cyan-600 transition-colors line-clamp-2">
                              {course.courseCode} - {course.courseName}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3 flex-grow">
                            {/* Location and Delivery instead of description */}
                            <div className="space-y-2 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                                <span className="line-clamp-1">Face to Face Training</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Building className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                                <span className="line-clamp-1">Delivery: On-site</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              {course.duration && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4 text-cyan-500" />
                                  <span>{course.duration}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {course.hasTheory && (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-0">
                                  <BookOpen className="w-3 h-3 mr-1" />
                                  Theory
                                </Badge>
                              )}
                              {course.hasPractical && (
                                <Badge variant="secondary" className="bg-green-100 text-green-700 border-0">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Practical
                                </Badge>
                              )}
                              {course.hasExam && (
                                <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-0">
                                  <Award className="w-3 h-3 mr-1" />
                                  Exam
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                          <CardFooter className="flex flex-col gap-2">
                            {course.experienceBookingEnabled ? (
                              <>
                                <Button
                                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl h-11 font-semibold shadow-lg flex items-center justify-center gap-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onBookCourse) onBookCourse(course.courseId, course.courseCode, course.courseName, course.experiencePrice || course.price, 'with');
                                  }}
                                >
                                  {course.experienceOriginalPrice && (
                                    <span className="price-strikethrough text-white/80 text-base mr-1">${course.experienceOriginalPrice}</span>
                                  )}
                                  <span className="price-current text-lg">${course.experiencePrice || course.price}</span>
                                  <span className="ml-1">Book With Experience</span>
                                </Button>
                                <Button
                                  className="w-full bg-gradient-to-r from-red-400 to-rose-500 hover:from-red-500 hover:to-rose-600 text-white rounded-xl h-11 font-semibold shadow-lg flex items-center justify-center gap-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onBookCourse) onBookCourse(course.courseId, course.courseCode, course.courseName, course.noExperiencePrice || course.price, 'without');
                                  }}
                                >
                                  {course.noExperienceOriginalPrice && (
                                    <span className="price-strikethrough text-white/80 text-base mr-1">${course.noExperienceOriginalPrice}</span>
                                  )}
                                  <span className="price-current text-lg">${course.noExperiencePrice || course.price}</span>
                                  <span className="ml-1">Book Without Experience</span>
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl h-11 font-semibold shadow-lg flex items-center justify-center gap-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onBookCourse) onBookCourse(course.courseId, course.courseCode, course.courseName, course.price);
                                  }}
                                >
                                  {course.originalPrice && (
                                    <span className="price-strikethrough text-white/80 text-base mr-1">${course.originalPrice}</span>
                                  )}
                                  <span className="price-current text-lg">${course.price}</span>
                                  <span className="ml-1">Book Now</span>
                                </Button>
                                {course.promoPrice != null && course.promoPrice > 0 && (
                                  <Button
                                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl h-11 font-semibold shadow-lg flex items-center justify-center gap-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (onBookCourse) onBookCourse(course.courseId, course.courseCode, course.courseName, course.promoPrice!);
                                    }}
                                  >
                                    {course.promoOriginalPrice != null && course.promoOriginalPrice > 0 && (
                                      <span className="price-strikethrough text-white/80 text-base mr-1">${course.promoOriginalPrice}</span>
                                    )}
                                    <span className="price-current text-lg">${course.promoPrice}</span>
                                    <span className="ml-1">Book Now SL + BL</span>
                                  </Button>
                                )}
                              </>
                            )}
                            <Button
                              variant="outline"
                              className="w-full border-2 border-cyan-500 text-cyan-600 hover:bg-cyan-50 rounded-xl h-10 font-semibold"
                              onClick={(e) => { e.stopPropagation(); handleCourseClick(course.courseId); }}
                            >
                              View Details
                            </Button>
                          </CardFooter>
                        </Card>
                      </motion.div>
                    ))}
                  </div>

                  {/* View More Button */}
                  {hasMore && (
                    <div className="text-center">
                      <Button
                        onClick={() => toggleCategory(category.categoryId)}
                        variant="outline"
                        className="border-2 border-cyan-500 text-cyan-600 hover:bg-cyan-50 rounded-full px-8 h-12 text-lg font-semibold"
                      >
                        {isExpanded ? "Show Less" : `See More ${category.categoryName}`}
                        <ArrowRight className={`w-5 h-5 ml-2 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </Button>
                    </div>
                  )}
                </motion.div>
              );
            })
          )}

          {/* No Results Message */}
          {!isLoading && courses.length === 0 && !error && (
            <motion.div
              className="text-center py-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
                <Search className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-700 mb-2">No courses found</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                We couldn't find any courses matching "{searchQuery}".
                Try searching for something else or clear the search.
              </p>
              <Button
                variant="outline"
                className="mt-6 border-cyan-500 text-cyan-600 rounded-full"
                onClick={() => setSearchQuery('')}
              >
                Clear Search
              </Button>
            </motion.div>
          )}
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-cyan-100 to-blue-100 mb-4">
                <div className="text-4xl font-bold text-transparent bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text">
                  24
                </div>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900">About Us</h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Safety Training Academy is a Registered Training Organization specializing in Training and Assessing of
                High-Risk Licencing under the National Standard for licencing persons performing High Risk Work.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Our team at Safety Training Academy consists of highly skilled industry experts with extensive knowledge
                and field experience within their specialised sector. The training facilities, internal and external
                zones, are well equipped with up-to-date learning materials developed to deliver specific industry and
                client training needs.
              </p>

              <div className="grid grid-cols-2 gap-6 pt-6">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Building className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">2019</div>
                    <div className="text-sm text-gray-600">Year Established</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-lg bg-cyan-100 flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-cyan-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">Over 50</div>
                    <div className="text-sm text-gray-600">Years of combined experience</div>
                  </div>
                </div>
              </div>

              <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-full px-8 h-12 text-lg font-semibold shadow-lg mt-6">
                See More
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="space-y-4">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?w=400"
                  alt="Training facility"
                  width={400}
                  height={256}
                  loading="lazy"
                  className="w-full h-64 object-cover rounded-2xl shadow-lg"
                />
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400"
                  alt="Equipment training"
                  width={400}
                  height={192}
                  loading="lazy"
                  className="w-full h-48 object-cover rounded-2xl shadow-lg"
                />
              </div>
              <div className="space-y-4 mt-8">
                <ImageWithFallback
                  src="/assets/workers.png"
                  alt="Student learning"
                  width={400}
                  height={192}
                  loading="lazy"
                  className="w-full h-48 object-cover rounded-2xl shadow-lg"
                />
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1513467535987-fd81bc7d62f8?w=400"
                  alt="Practical training"
                  width={400}
                  height={256}
                  loading="lazy"
                  className="w-full h-64 object-cover rounded-2xl shadow-lg"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Reviews — auto marquee right → left on all screen sizes */}
      <section
        id="reviews"
        className="relative z-0 scroll-mt-28 md:scroll-mt-24 py-20 bg-gradient-to-b from-cyan-50/40 via-white to-blue-50/40 overflow-x-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-cyan-500 mb-2">Reviews</h2>
            <p className="text-sm text-gray-600 max-w-2xl">What students say about us.</p>
          </motion.div>
        </div>

        {isReviewsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
          </div>
        ) : googleReviews.length === 0 ? (
          <div className="text-center py-12 text-gray-500 px-4">No reviews to display</div>
        ) : (
          <div
            className={`reviews-marquee__viewport w-full py-3${isIOS ? " reviews-marquee__viewport--ios-scroll" : ""}`}
            aria-label="Google reviews row"
          >
            <div
              className="reviews-marquee__track"
              style={isIOS ? undefined : { animationDuration: `${reviewsMarqueeDurationSec}s` }}
            >
              {[...googleReviews, ...googleReviews].map((review, index) => (
                <div
                  key={`${review.googleReviewId}-${index}`}
                  className="reviews-marquee__item shrink-0 w-[min(23rem,calc(100vw-2.5rem))] sm:w-[24rem] px-3 md:px-4"
                >
                  <LandingReviewCard review={review} />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Our Clients Section */}
      <section className="relative z-10 py-16 border-t border-cyan-200/70 bg-gradient-to-br from-white via-cyan-50/80 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-cyan-500 mb-4">Our Clients</h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
            {clients.map((client, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all"
              >
                <ImageWithFallback
                  src={client.logo}
                  alt={client.name}
                  width={200}
                  height={96}
                  loading="lazy"
                  className="w-full h-24 object-contain grayscale hover:grayscale-0 transition-all"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom Section - Contact Form & Enrollment */}
      <section
        id="contact"
        className="relative z-10 scroll-mt-24 py-20 bg-gradient-to-br from-slate-800 via-blue-900 to-slate-900 overflow-hidden"
      >
        <div className="absolute inset-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=1920"
            alt="Background"
            width={1920}
            height={1080}
            loading="lazy"
            className="w-full h-full object-cover opacity-20"
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Send Us A Message */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <Card className="bg-gradient-to-br from-cyan-400 to-cyan-500 border-0 shadow-2xl rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-3xl font-bold text-white">Send Us A Message!</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input placeholder="Name*" className="bg-white border-0 rounded-xl h-12" />
                    <Input placeholder="Phone*" className="bg-white border-0 rounded-xl h-12" />
                  </div>
                  <Input placeholder="Email*" type="email" className="bg-white border-0 rounded-xl h-12" />
                  <Input placeholder="Subject" className="bg-white border-0 rounded-xl h-12" />
                  <Textarea
                    placeholder="Message"
                    className="bg-white border-0 rounded-xl min-h-32 resize-none"
                  />
                  <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-8 h-12 font-semibold">
                    SEND
                    <Send className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Course Enrollment */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="flex flex-col justify-center"
            >
              <p className="text-red-600 text-sm font-semibold uppercase tracking-wide mb-2">
                After reviews — contact &amp; enrolment
              </p>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Course Enrolment</h2>
              <p className="text-white text-lg mb-8">
                Browse and book courses from the <span className="font-semibold text-cyan-200">Courses</span> section
                higher on this page. This area is for messages and completing the official <span className="font-semibold text-cyan-200">enrolment form</span>.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={onEnrollNow || onRegister}
                  className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-8 h-14 text-lg font-semibold shadow-xl"
                >
                  ENROL NOW
                </Button>
                <Button
                  variant="outline"
                  onClick={onVOC}
                  className="bg-blue-600 hover:bg-blue-700 border-0 text-white rounded-full px-8 h-14 text-lg font-semibold shadow-xl"
                >
                  VOC
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4 bg-white/10 backdrop-blur-sm rounded-lg p-3 w-fit">
                <img
                  src="/assets/SafetyTrainingAcademylogo.png"
                  alt="Safety Training Academy"
                  width={SAFETY_TRAINING_ACADEMY_LOGO.width}
                  height={SAFETY_TRAINING_ACADEMY_LOGO.height}
                  className="h-16 w-auto max-w-full object-contain object-left brightness-0 invert"
                />
              </div>
              <p className="text-white/90 text-sm mb-4">Professional certification programs for your career growth.</p>
              <div className="flex gap-4">
                <a
                  href="#"
                  aria-label="Facebook"
                  className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
                >
                  <Facebook className="w-6 h-6" />
                </a>
                <a
                  href="#"
                  aria-label="LinkedIn"
                  className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
                >
                  <Linkedin className="w-6 h-6" />
                </a>
                <a
                  href="#"
                  aria-label="Instagram"
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
                  <span>Safety Training Academy | Sydney<br />3/14-16 Marjorie Street, Sefton NSW 2162</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4 text-lg">Contact</h3>
              <ul className="space-y-2 text-sm text-white/90">
                <li className="flex items-start gap-2">
                  <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>info@safetytrainingacademy.edu.au</span>
                </li>
                <li className="flex items-start gap-2">
                  <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>0483 878 887</span>
                </li>
                <li className="flex items-start gap-2">
                  <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>1300 976 097</span>
                </li>
                <li className="text-xs">RTO: 45234</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4 text-lg">Link</h3>
              <ul className="space-y-2 text-sm text-white/90">
                <li>
                  <a href="#home" className="hover:text-white transition-colors">
                    Home
                  </a>
                </li>
                <li>
                  <a href="#courses" className="hover:text-white transition-colors">
                    Book Now
                  </a>
                </li>
                <li>
                  <a href="#courses" className="hover:text-white transition-colors">
                    Courses
                  </a>
                </li>
                <li>
                  <button onClick={onAbout} className="hover:text-white transition-colors text-left">
                    About Us
                  </button>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <button onClick={onContact} className="hover:text-white transition-colors text-left">
                    Contact
                  </button>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/20 pt-8 text-center text-sm text-white/90">
            <p>&copy; 2024 Safety Training Academy. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* WhatsApp Floating Button */}
      <WhatsAppButton />

      {/* Back to top */}
      {showBackToTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 p-3 rounded-full bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2"
          aria-label="Back to top"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}