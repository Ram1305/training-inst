import { useState, useEffect, useRef, useCallback } from "react";
import {
  Menu,
  X,
  MapPin,
  Phone,
  Mail,
  ChevronDown,
  ChevronRight,
  Award,
  Users,
  CheckCircle,
  Building,
  ChevronUp,
} from "lucide-react";
import { Button } from "../ui/button";
import { motion, AnimatePresence } from "motion/react";
import { courseService, type CourseListItem } from '../../services/course.service';
import { categoryService, type CategoryDropdownItem } from '../../services/category.service';
import { ResourcesDropdown } from "../ui/ResourcesDropdown";
import logoImage from '/assets/SafetyTrainingAcademylogo.png';

interface PublicHeaderProps {
  onBack?: () => void;
  onLogin?: () => void;
  onRegister?: () => void;
  onCourseDetails?: (courseId: string) => void;
  onAbout?: () => void;
  onContact?: () => void;
  onBookNow?: () => void;
  onForms?: () => void;
  onFeesRefund?: () => void;
  onGallery?: () => void;
  onVOC?: () => void;
  onViewCourses?: () => void;
}

export function PublicHeader({
  onBack,
  onLogin,
  onRegister,
  onCourseDetails,
  onAbout,
  onContact,
  onBookNow,
  onForms,
  onFeesRefund,
  onGallery,
  onVOC,
  onViewCourses,
}: PublicHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [coursesDropdownOpen, setCoursesDropdownOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [categories, setCategories] = useState<CategoryDropdownItem[]>([]);
  const headerDataLoadingRef = useRef(false);
  const headerDataLoadedRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (headerDataLoadingRef.current || headerDataLoadedRef.current) return;
    headerDataLoadingRef.current = true;
    try {
      const [coursesRes, categoriesRes] = await Promise.all([
        courseService.getActiveCourses({ pageSize: 1000 }),
        categoryService.getCategoriesDropdown()
      ]);
      if (coursesRes.success && coursesRes.data) {
        setCourses(coursesRes.data.courses);
      }
      if (categoriesRes.success && categoriesRes.data) {
        setCategories(categoriesRes.data.categories);
      }
      headerDataLoadedRef.current = true;
    } catch (error) {
      console.error('Error fetching header data:', error);
    } finally {
      headerDataLoadingRef.current = false;
    }
  }, []);

  // Desktop: load dropdown data on mount. Mobile: defer until menu opens (less work on first paint).
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const runIfDesktop = () => {
      if (mq.matches) void fetchData();
    };
    runIfDesktop();
    mq.addEventListener("change", runIfDesktop);
    return () => mq.removeEventListener("change", runIfDesktop);
  }, [fetchData]);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileMenuOpen]);

  return (
    <>
      {/* Top Bar with Contact Info - Light Blue Stripe */}
      <div className="bg-cyan-400 text-white py-2.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center md:justify-between items-center text-sm gap-3 md:gap-6">
          <a href="tel:1300976097" className="flex items-center gap-2 font-semibold phone-number-link hover:text-slate-900 transition-colors">
            <Phone className="w-4 h-4" />
            1300 976 097
          </a>
          <span className="flex items-center gap-2 font-medium">
            <Mail className="w-4 h-4" />
            info@safetytrainingacademy.edu.au
          </span>
          <span className="flex items-center gap-2 font-medium">
            <MapPin className="w-4 h-4" />
            3/14-16 Marjorie Street, Sefton NSW 2162
          </span>
        </div>
      </div>

      {/* Logo and Info Section - White Background */}
      <div className="bg-white border-b border-gray-200 py-4 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-6">
          {/* Logo */}
          <motion.div
            className="flex items-center cursor-pointer"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            onClick={() => {
              closeMobileMenu();
              onBack?.();
            }}
          >
            <img
              src={logoImage}
              alt="Safety Training Academy"
              className="h-14 md:h-16"
            />
          </motion.div>

          {/* Info Badges - Gen Z Style */}
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
            <motion.div
              className="flex items-center gap-4 bg-white px-6 py-3 rounded-xl border border-gray-200 shadow-sm"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="flex items-center justify-center w-10 h-10 bg-cyan-100 rounded-lg flex-shrink-0">
                <Award className="w-5 h-5 text-cyan-600" />
              </div>
              <div className="flex flex-col items-start justify-center">
                <span className="text-[9px] text-gray-500 font-medium uppercase tracking-wide leading-tight">RTO</span>
                <span className="text-sm font-bold text-slate-800 leading-tight whitespace-nowrap">#45234</span>
              </div>
            </motion.div>

            <motion.div
              className="flex items-center gap-4 bg-white px-6 py-3 rounded-xl border border-gray-200 shadow-sm"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg flex-shrink-0">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex flex-col items-start justify-center">
                <span className="text-[9px] text-gray-500 font-medium uppercase tracking-wide leading-tight whitespace-nowrap">FACE TO FACE</span>
                <span className="text-sm font-bold text-slate-800 leading-tight">Training</span>
              </div>
            </motion.div>

            <motion.div
              className="flex items-center gap-4 bg-white px-6 py-3 rounded-xl border border-gray-200 shadow-sm"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-lg flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="flex flex-col items-start justify-center">
                <span className="text-[9px] text-gray-500 font-medium uppercase tracking-wide leading-tight">QUALIFIED</span>
                <span className="text-sm font-bold text-slate-800 leading-tight">Trainers</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="sticky top-0 z-50 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 backdrop-blur-xl border-b border-slate-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <button
                onClick={onBack}
                className="text-white hover:text-cyan-400 transition-colors text-sm font-medium"
              >
                HOME
              </button>
              {/* Courses Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => {
                  setCoursesDropdownOpen(true);
                  const categoriesWithCourses = categories.filter(cat =>
                    courses.some(course => course.categoryId === cat.categoryId)
                  );
                  if (categoriesWithCourses.length > 0 && !activeCategory) {
                    setActiveCategory(categoriesWithCourses[0].categoryId);
                  }
                }}
                onMouseLeave={() => {
                  setActiveCategory(null);
                  setCoursesDropdownOpen(false);
                }}
              >
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    if (onViewCourses) {
                      onViewCourses();
                    } else {
                      onBack?.();
                    }
                  }}
                  className="flex items-center gap-1 text-white hover:text-cyan-400 transition-colors text-sm font-medium cursor-pointer"
                >
                  COURSES
                  <ChevronDown className={`w-4 h-4 transition-transform ${coursesDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {coursesDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute left-0 top-full pt-2 z-50"
                  >
                    <div className="flex rounded-xl shadow-2xl border border-slate-700 overflow-hidden" style={{ backgroundColor: '#0f172a' }}>
                      <div className="dropdown-category-panel">
                        {categories
                          .filter(category => courses.some(course => course.categoryId === category.categoryId))
                          .map((category) => (
                            <button
                              key={category.categoryId}
                              onMouseEnter={() => setActiveCategory(category.categoryId)}
                              className={`dropdown-category-item ${activeCategory === category.categoryId ? 'active' : ''}`}
                            >
                              <span>{category.categoryName}</span>
                              <ChevronRight className="w-4 h-4 flex-shrink-0" />
                            </button>
                          ))}
                      </div>
                      <div className="dropdown-courses-panel">
                        {activeCategory && (
                          <div>
                            {courses
                              .filter(course => course.categoryId === activeCategory)
                              .map((course) => (
                                <button
                                  key={course.courseId}
                                  onClick={() => {
                                    onCourseDetails?.(course.courseId);
                                    setCoursesDropdownOpen(false);
                                  }}
                                  className="dropdown-course-item"
                                >
                                  {course.courseName}
                                </button>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              <ResourcesDropdown onForms={onForms} onFeesRefund={onFeesRefund} onGallery={onGallery} />

              <button
                onClick={onAbout}
                className="text-white hover:text-cyan-400 transition-colors text-sm font-medium"
              >
                ABOUT
              </button>
              <button
                onClick={onContact}
                className="text-white hover:text-cyan-400 transition-colors text-sm font-medium"
              >
                CONTACT
              </button>
              <div className="relative">
                <button
                  onClick={onBack}
                  className="text-white hover:text-cyan-400 transition-colors text-sm font-bold px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/50 animate-pulse"
                >
                  COMBO COURSES
                </button>
              </div>
              <Button
                onClick={onBookNow}
                className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-full px-6"
              >
                Book now
              </Button>
              <Button
                variant="outline"
                onClick={onVOC}
                className="border-2 border-cyan-400 bg-cyan-400/10 text-cyan-400 hover:bg-cyan-400 hover:text-slate-900 rounded-full px-6 font-semibold"
              >
                VOC
              </Button>
              <Button
                onClick={onLogin}
                variant="outline"
                className="border-2 border-white bg-transparent text-white hover:bg-white hover:text-slate-900 rounded-full px-6 font-semibold"
              >
                Login / Register
              </Button>

              {/* Contact Number - Desktop Inline */}
              <div className="flex items-center ml-6">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300">
                  <Phone className="w-4 h-4 text-cyan-400" />
                  <a
                    href="tel:1300976097"
                    className="text-white phone-number-link hover:text-cyan-400 transition-colors"
                  >
                    1300 976 097
                  </a>
                </div>
              </div>
            </div>

            {/* Mobile Menu */}
            <button
              type="button"
              className="md:hidden text-white"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              onClick={() => {
                setMobileMenuOpen((open) => {
                  const next = !open;
                  if (next) void fetchData();
                  return next;
                });
              }}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden pb-6 border-t border-slate-700"
              >
                <div className="flex flex-col mt-4 space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      closeMobileMenu();
                      onBack?.();
                    }}
                    className="text-white text-left p-2 hover:bg-slate-800 rounded"
                  >
                    HOME
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      closeMobileMenu();
                      (onViewCourses || onBack)?.();
                    }}
                    className="text-white text-left p-2 hover:bg-slate-800 rounded"
                  >
                    COURSES
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      closeMobileMenu();
                      onForms?.();
                    }}
                    className="text-white text-left p-2 hover:bg-slate-800 rounded"
                  >
                    FORMS
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      closeMobileMenu();
                      onFeesRefund?.();
                    }}
                    className="text-white text-left p-2 hover:bg-slate-800 rounded"
                  >
                    FEES & REFUND
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      closeMobileMenu();
                      onGallery?.();
                    }}
                    className="text-white text-left p-2 hover:bg-slate-800 rounded"
                  >
                    GALLERY
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      closeMobileMenu();
                      onAbout?.();
                    }}
                    className="text-white text-left p-2 hover:bg-slate-800 rounded"
                  >
                    ABOUT
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      closeMobileMenu();
                      onContact?.();
                    }}
                    className="text-white text-left p-2 hover:bg-slate-800 rounded"
                  >
                    CONTACT
                  </button>
                  <Button
                    type="button"
                    onClick={() => {
                      closeMobileMenu();
                      (onBookNow || onLogin)?.();
                    }}
                    className="w-full bg-cyan-500 hover:bg-cyan-600 text-white"
                  >
                    Book now
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      closeMobileMenu();
                      onVOC?.();
                    }}
                    className="w-full border-2 border-cyan-400 text-cyan-400"
                  >
                    VOC
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      closeMobileMenu();
                      onLogin?.();
                    }}
                    className="w-full border-2 border-white bg-transparent text-white hover:bg-white hover:text-slate-900 font-semibold"
                  >
                    Login / Register
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>
    </>
  );
}
