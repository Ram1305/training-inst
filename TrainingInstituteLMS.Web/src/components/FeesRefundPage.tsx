import { useState, useEffect } from 'react';
import { Phone, Mail, MapPin, Menu, X, Award, Users, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react';
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

interface FeesRefundPageProps {
  onGallery?: () => void;
  onBack: () => void;
  onLogin: () => void;
  onRegister: () => void;
  onAbout?: () => void;
  onContact?: () => void;
  onBookNow?: () => void;
  onCourseDetails?: (courseId: string) => void;
  onVOC?: () => void;
  onViewCourses?: () => void;
  onViewComboCourses?: () => void;
}

export function FeesRefundPage({ onBack, onLogin, onRegister, onAbout, onContact, onBookNow, onCourseDetails, onGallery, onVOC, onViewCourses, onViewComboCourses }: FeesRefundPageProps) {
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
        onFeesRefund={undefined}
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
          <h1 className="text-4xl font-bold text-slate-900 mb-8">Terms & Conditions</h1>

          {/* Compulsory Fees Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-blue-900 mb-6">COMPULSORY FEES</h2>
            <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
              <p className="text-gray-700 leading-relaxed">
                The tuition fees for each of qualifications provided by Safety Training Academy as well as fees for Recognition of Prior Learning are summarised in the Fee Schedule which you will receive prior to enrolment. Contained in this Fee schedule is detailed information regarding total fees, payment terms, fees and charges for additional services, and any fees paid in advance.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Fee payment schedules may be negotiated on an individual basis with the CEO. Non-payment of fees may result in cancellation of registration and non-awarding of a qualification or statement of attainment.
              </p>
            </div>
          </section>

          {/* Refund Policy Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-blue-900 mb-6">REFUND POLICY</h2>
            <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
              <p className="text-gray-700 leading-relaxed mb-4">
                Students are provided with the refund policy and student enrolment form prior to enrolment. Refund information is always available from the Administration Manager.
              </p>
              
              <ol className="space-y-3 list-decimal list-inside text-gray-700">
                <li>Non-refundable $100 booking fee</li>
                <li>Fee Refund Applications are considered on a case-by-case basis.</li>
                <li>The request for refund is made in writing to the CEO using the Fee Refund Application which is available upon request from the Administration Manager.</li>
                <li>The CEO is the person responsible for approval of fee refund applications.</li>
                <li>Course cancellation after acceptance by Safety Training Academy may occur up to 7 days prior to commencement of the course without penalty and must be made in writing, by email or by fax. A full refund minus the non-refundable enrolment fee will be paid with notice of 7 days or more.</li>
                <li>Course cancellation with less than 3 days' notice after acceptance by Safety Training Academy will not result in any refund.</li>
                <li>Accepted students who withdraw after course commencement owing to unforeseen or exceptional circumstance can apply for fee refund. If granted, fees will be refunded on a pro-rata basis (based on the number of days remaining in the course).</li>
                <li>Safety Training Academy defaults if a course does not commence on the designated day or is actually cancelled. No student will be disadvantaged.</li>
                <li>Fee refunds will be made within 14 days after demand when Safety Training Academy defaults and within 28 days after demand when the student defaults.</li>
                <li>Safety Training Academy 's dispute resolution process do not circumscribe the student's right to pursue other legal remedies. This agreement does not remove the right of either party to take further action under Australia's consumer protection laws for unpaid and overdue fees.</li>
                <li>Students may contact the Australian Skills Quality Authority to make a formal complaint.</li>
                <li>This refund policy is subject to review from time to time in accordance with the change to conditions policy outlined below.</li>
                <li>Students have a right to obtain a refund for services not provided by Safety Training Academy in the event the arrangement is terminated early or Safety Training Academy fails to provide the agreed services.</li>
              </ol>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-gray-700 leading-relaxed">
                  Applications for refunds may take up to 10 working days to be processed. Refund payments will be finalised no later than 21 days after dated receipt of this form.
                </p>
              </div>
            </div>
          </section>

          {/* Cooling-Off Period Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-blue-900 mb-6">COOLING-OFF PERIOD</h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-700 leading-relaxed">
                While there is no cooling off period applicable under the Consumer Law, our refund policy provides very generous conditions should the student elect not to proceed with their enrolment in the course offered.
              </p>
            </div>
          </section>

          {/* Change to Conditions Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-blue-900 mb-6">CHANGE TO CONDITIONS</h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-700 leading-relaxed">
                Safety Training Academy reserves the right to change fees, conditions, course times or course commencement dates. You will be notified as soon as practicable of any changes to our operations. If there are any changes that may affect your training and/or assessment, including in relation to any third party arrangements or changes in ownership, you will be notified as soon as practicable.
              </p>
            </div>
          </section>

          {/* Additional Documents Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-blue-900 mb-6">Related Documents</h2>
            <div className="bg-white rounded-lg shadow-md p-6 space-y-3">
              <a
                href="https://safetytrainingacademy.edu.au/wp-content/uploads/2024/04/STA-05-Complaints-and-Appeals-Information-and-Form.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">
                    PDF
                  </div>
                  <span className="font-semibold text-blue-900 group-hover:text-blue-700">
                    COMPLAINTS AND APPEALS PROCESS
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </a>

              <a
                href="https://safetytrainingacademy.edu.au/wp-content/uploads/2025/09/WHS-Act-2011-010.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">
                    PDF
                  </div>
                  <span className="font-semibold text-blue-900 group-hover:text-blue-700">
                    WHS ACT
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </a>
            </div>
          </section>
        </motion.div>
      </div>

      {/* WhatsApp Floating Button */}
      <WhatsAppButton />
    </div>
  );
}
