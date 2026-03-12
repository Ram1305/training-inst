import { useState, useEffect } from "react";
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
}: PublicHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [coursesDropdownOpen, setCoursesDropdownOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [categories, setCategories] = useState<CategoryDropdownItem[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
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
    } catch (error) {
      console.error('Error fetching header data:', error);
    }
  };

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
            onClick={onBack}
          >
            <img
              src={logoImage}
              alt="Safety Training Academy"
              className="h-10 md:h-12"
            />
          </motion.div>

          {/* Info Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
            <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-center w-8 h-8 bg-cyan-100 rounded-lg">
                <Award className="w-4 h-4 text-cyan-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] text-gray-500 font-bold uppercase">RTO</span>
                <span className="text-xs font-bold text-slate-800">#45234</span>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] text-gray-500 font-bold uppercase">FACE TO FACE</span>
                <span className="text-xs font-bold text-slate-800">Training</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="sticky top-0 z-50 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 backdrop-blur-xl border-b border-slate-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
          {/* Left Nav Links */}
            <div className="hidden md:flex items-center gap-6">
              <button onClick={onBack} className="text-white hover:text-cyan-400 transition-colors text-xs font-bold">HOME</button>
              
              {/* Courses Dropdown */}
              <div 
                className="relative"
                onMouseEnter={() => setCoursesDropdownOpen(true)}
                onMouseLeave={() => {
                   setCoursesDropdownOpen(false);
                   setActiveCategory(null);
                }}
              >
                <button className="flex items-center gap-1 text-white hover:text-cyan-400 transition-colors text-xs font-bold uppercase">
                  COURSES
                  <ChevronDown className={`w-3 h-3 transition-transform ${coursesDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {coursesDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute left-0 top-full pt-2 z-50 min-w-[600px]"
                    >
                      <div className="flex rounded-xl shadow-2xl border border-slate-700 overflow-hidden bg-slate-950">
                        <div className="w-1/2 border-r border-slate-800 p-2">
                          {categories.map((category) => (
                            <button
                              key={category.categoryId}
                              onMouseEnter={() => setActiveCategory(category.categoryId)}
                              className={`w-full flex items-center justify-between p-3 rounded-lg text-sm font-medium transition-colors ${activeCategory === category.categoryId ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-300 hover:bg-slate-900'}`}
                            >
                              {category.categoryName}
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          ))}
                        </div>
                        <div className="w-1/2 p-2 bg-slate-900/50">
                          {activeCategory && courses.filter(c => c.categoryId === activeCategory).map((course) => (
                            <button
                              key={course.courseId}
                              onClick={() => {
                                onCourseDetails?.(course.courseId);
                                setCoursesDropdownOpen(false);
                              }}
                              className="w-full text-left p-3 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                            >
                              {course.courseName}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <ResourcesDropdown onForms={onForms} onFeesRefund={onFeesRefund} onGallery={onGallery} />
              
              <button onClick={onAbout} className="text-white hover:text-cyan-400 transition-colors text-xs font-bold">ABOUT</button>
              <button onClick={onContact} className="text-white hover:text-cyan-400 transition-colors text-xs font-bold">CONTACT</button>
              <button onClick={onVOC} className="text-cyan-400 border-2 border-cyan-400/50 rounded-lg px-4 py-1 text-xs font-bold hover:bg-cyan-400 hover:text-slate-900 transition-all">VOC</button>
            </div>

            {/* Right Action Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Button onClick={onBookNow} className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-full px-6 h-9 text-xs font-bold uppercase tracking-wider shadow-lg shadow-cyan-500/20">
                Book Now
              </Button>
              
              <Button onClick={onLogin} className="bg-white hover:bg-cyan-400 text-slate-900 hover:text-white rounded-full px-6 h-9 text-xs font-bold uppercase border border-white transition-all">
                Login / Register
              </Button>
            </div>

            {/* Mobile Menu */}
            <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
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
                  <button onClick={onBack} className="text-white text-left p-2 hover:bg-slate-800 rounded">HOME</button>
                  <button onClick={onAbout} className="text-white text-left p-2 hover:bg-slate-800 rounded">ABOUT</button>
                  <button onClick={onContact} className="text-white text-left p-2 hover:bg-slate-800 rounded">CONTACT</button>
                  <button onClick={onVOC} className="text-cyan-400 text-left p-2 hover:bg-slate-800 rounded">VOC</button>
                  <Button onClick={onBookNow} className="w-full bg-cyan-500">Book Now</Button>
                  <Button onClick={onLogin} variant="outline" className="w-full border-white text-white">Login / Register</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>
    </>
  );
}
