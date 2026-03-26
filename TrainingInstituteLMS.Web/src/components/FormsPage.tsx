import { useState, useEffect } from 'react';
import { Phone, Mail, MapPin, Menu, X, Award, Users, CheckCircle, ChevronDown, ChevronRight, FileText, Download } from 'lucide-react';
import { Button } from './ui/button';
import { motion } from 'motion/react';
import { courseService } from '../services/course.service';
import type { CourseListItem } from '../services/course.service';
import { categoryService } from '../services/category.service';
import type { CategoryDropdownItem } from '../services/category.service';
import { WhatsAppButton } from './ui/WhatsAppButton';
import { ResourcesDropdown } from './ui/ResourcesDropdown';
import { PublicHeader } from './layout/PublicHeader';
import logoImage from '/assets/SafetyTrainingAcademylogo.png';
import { SAFETY_TRAINING_ACADEMY_LOGO } from '../constants/safetyTrainingAcademyLogo';

interface FormsPageProps {
  onBack: () => void;
  onLogin: () => void;
  onRegister: () => void;
  onAbout?: () => void;
  onContact?: () => void;
  onBookNow?: () => void;
  onCourseDetails?: (courseId: string) => void;
  onFeesRefund?: () => void;
  onGallery?: () => void;
  onVOC?: () => void;
  onViewCourses?: () => void;
  onViewComboCourses?: () => void;
}

export function FormsPage({ onBack, onLogin, onRegister, onAbout, onContact, onBookNow, onCourseDetails, onFeesRefund, onGallery, onVOC, onViewCourses, onViewComboCourses }: FormsPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [coursesDropdownOpen, setCoursesDropdownOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [allCourses, setAllCourses] = useState<CourseListItem[]>([]);
  const [categories, setCategories] = useState<CategoryDropdownItem[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [coursesRes, categoriesRes] = await Promise.all([
        courseService.getAllCourses({ pageSize: 1000 }),
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

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader
        onBack={onBack}
        onLogin={onLogin}
        onRegister={onRegister}
        onAbout={onAbout}
        onContact={onContact}
        onBookNow={onBookNow}
        onCourseDetails={onCourseDetails}
        onForms={undefined}
        onFeesRefund={onFeesRefund}
        onGallery={onGallery}
        onVOC={onVOC}
        onViewCourses={onViewCourses}
        onViewComboCourses={onViewComboCourses}
      />

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-slate-900 mb-8">Forms</h1>

          {/* Forms Section */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <img
                  src={logoImage}
                  alt="Safety Training Academy"
                  width={SAFETY_TRAINING_ACADEMY_LOGO.width}
                  height={SAFETY_TRAINING_ACADEMY_LOGO.height}
                  className="h-16 w-auto max-w-full object-contain object-left"
                />
              </div>
            </div>

            {/* Participant Handbook */}
            <div className="mb-8">
              <a
                href="https://safetytrainingacademy.edu.au/wp-content/uploads/2023/08/STA-49-Student-Handbook-PDF.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="block group"
              >
                <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg p-8 border-2 border-cyan-200 hover:border-cyan-400 transition-all hover:shadow-lg cursor-pointer">
                  <h2 className="text-3xl font-bold text-cyan-600 mb-2 group-hover:text-cyan-700">
                    Participant Handbook
                  </h2>
                  <p className="text-gray-700 font-medium">
                    CLICK TO DOWNLOAD THE PARTICIPANT HANDBOOK (PDF)
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-cyan-600 group-hover:text-cyan-700">
                    <Download className="w-5 h-5" />
                    <span className="font-semibold">Download PDF</span>
                  </div>
                </div>
              </a>
            </div>

            {/* Additional Documents */}
            <div className="space-y-4">
              <a
                href="https://safetytrainingacademy.edu.au/wp-content/uploads/2024/04/STA-05-Complaints-and-Appeals-Information-and-Form.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-5 bg-red-50 hover:bg-red-100 rounded-lg border-2 border-red-200 hover:border-red-300 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                    <FileText className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-lg text-blue-900 group-hover:text-blue-700">
                    COMPLAINTS AND APPEALS PROCESS
                  </span>
                </div>
                <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-blue-700" />
              </a>

              <button
                onClick={onFeesRefund}
                className="w-full flex items-center justify-between p-5 bg-red-50 hover:bg-red-100 rounded-lg border-2 border-red-200 hover:border-red-300 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                    <FileText className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-lg text-blue-900 group-hover:text-blue-700">
                    FEES AND REFUND POLICY
                  </span>
                </div>
                <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-blue-700" />
              </button>

              <a
                href="https://safetytrainingacademy.edu.au/wp-content/uploads/2025/09/WHS-Act-2011-010.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-5 bg-red-50 hover:bg-red-100 rounded-lg border-2 border-red-200 hover:border-red-300 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                    <FileText className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-lg text-blue-900 group-hover:text-blue-700">
                    WHS ACT
                  </span>
                </div>
                <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-blue-700" />
              </a>
            </div>
          </div>
        </motion.div>
      </div>

      {/* WhatsApp Floating Button */}
      <WhatsAppButton />
    </div>
  );
}
