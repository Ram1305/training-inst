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
import { SAFETY_TRAINING_ACADEMY_LOGO } from '../../constants/safetyTrainingAcademyLogo';

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
  onViewComboCourses?: () => void;
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
  onViewComboCourses,
}: PublicHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [coursesDropdownOpen, setCoursesDropdownOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [categories, setCategories] = useState<CategoryDropdownItem[]>([]);
  const headerDataLoadingRef = useRef(false);
  const headerDataLoadedRef = useRef(false);

  const shortCourses = courses.filter((c) => !c.hasComboOffer);
  const comboCourses = courses.filter((c) => c.hasComboOffer);
  const categoriesWithShortCourses = categories.filter((cat) =>
    shortCourses.some((course) => course.categoryId === cat.categoryId)
  );

  const isComboCategoryActive = activeCategory === '__combo__';

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
    const scrollY = window.scrollY;

    const htmlStyle = document.documentElement.style;

    const prevHtml = {
      overflow: htmlStyle.overflow,
    };

    // Block page scroll at the root element; menu scrolls independently.
    htmlStyle.overflow = "hidden";

    return () => {
      htmlStyle.overflow = prevHtml.overflow;

      window.scrollTo(0, scrollY);
    };
  }, [mobileMenuOpen]);

  return (
    <header className="w-full">
      {/* Top Bar with Contact Info — dark bar (uses utilities present in prebuilt index.css) */}
      <div className="bg-slate-900 text-white py-2 px-4 border-b border-cyan-500/30">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center md:justify-between items-center text-sm gap-3 md:gap-6">
          <a
            href="tel:1300976097"
            className="flex items-center gap-2 font-semibold text-white phone-number-link underline-offset-2 hover:text-cyan-400 hover:underline transition-colors"
          >
            <Phone className="w-4 h-4 shrink-0 text-cyan-400" aria-hidden />
            1300 976 097
          </a>
          <span className="flex items-center gap-2 font-medium text-white">
            <Mail className="w-4 h-4 shrink-0 text-cyan-400" aria-hidden />
            info@safetytrainingacademy.edu.au
          </span>
          <span className="flex items-center gap-2 font-medium text-white">
            <MapPin className="w-4 h-4 shrink-0 text-cyan-400" aria-hidden />
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
              width={SAFETY_TRAINING_ACADEMY_LOGO.width}
              height={SAFETY_TRAINING_ACADEMY_LOGO.height}
              className="h-14 md:h-16 w-auto max-w-full object-contain object-left"
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
                  if (!activeCategory) {
                    setActiveCategory(categoriesWithShortCourses[0]?.categoryId ?? '__combo__');
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
                      {/* Categories panel (includes manual Combo Courses) */}
                      <div className="dropdown-category-panel">
                        {categoriesWithShortCourses.map((category) => (
                          <button
                            key={category.categoryId}
                            onMouseEnter={() => setActiveCategory(category.categoryId)}
                            className={`dropdown-category-item ${activeCategory === category.categoryId ? 'active' : ''}`}
                          >
                            <span>{category.categoryName}</span>
                            <ChevronRight className="w-4 h-4 flex-shrink-0" />
                          </button>
                        ))}
                        <button
                          key="__combo__"
                          onMouseEnter={() => setActiveCategory('__combo__')}
                          onClick={() => {
                            onViewComboCourses?.();
                            setCoursesDropdownOpen(false);
                          }}
                          className={`dropdown-category-item ${isComboCategoryActive ? 'active' : ''}`}
                        >
                          <span>Combo Courses</span>
                          <ChevronRight className="w-4 h-4 flex-shrink-0" />
                        </button>
                      </div>

                      {/* Courses panel */}
                      <div className="dropdown-courses-panel">
                        {activeCategory && (
                          <div>
                            {(isComboCategoryActive ? comboCourses : shortCourses.filter((c) => c.categoryId === activeCategory)).map(
                              (course) => (
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
                              )
                            )}
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
              <Button
                onClick={onBookNow}
                className="rounded-full px-6 shadow-md bg-cyan-500 text-white hover:bg-cyan-600"
              >
                Book now
              </Button>
              <Button
                variant="outline"
                onClick={onVOC}
                className="rounded-full px-6 font-semibold border-2 border-cyan-200 bg-transparent text-cyan-400 hover:bg-slate-800 hover:text-cyan-300"
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
                  <Phone className="w-4 h-4 text-cyan-200 shrink-0" aria-hidden />
                  <a
                    href="tel:1300976097"
                    className="text-white phone-number-link underline-offset-2 hover:text-cyan-100 hover:underline transition-colors"
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
        </div>
      </nav>

      {/* Mobile menu — rendered outside sticky nav */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="md:hidden fixed inset-0 top-16 z-40 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 overflow-y-auto overscroll-contain touch-pan-y [-webkit-overflow-scrolling:touch]"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <div className="flex flex-col p-4 space-y-2 pb-12">
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
                className="w-full rounded-full bg-cyan-500 text-white hover:bg-cyan-600 shadow-md"
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
                className="w-full rounded-full border-2 border-cyan-200 text-cyan-400 hover:bg-slate-800 hover:text-cyan-300"
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
    </header>
  );
}
