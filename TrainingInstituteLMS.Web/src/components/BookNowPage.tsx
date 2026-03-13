import { useState, useEffect } from 'react';
import { Search, Clock, Award, Sparkles, TrendingUp, Phone, Mail, Shield, Menu, X, Users, MapPin, Building, BookOpen, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/card';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { motion, AnimatePresence } from 'motion/react';
import { courseService } from '../services/course.service';
import type { CourseListItem } from '../services/course.service';
import { categoryService } from '../services/category.service';
import type { CategoryDropdownItem } from '../services/category.service';
import { WhatsAppButton } from './ui/WhatsAppButton';
import { ResourcesDropdown } from './ui/ResourcesDropdown';
import { PublicHeader } from './layout/PublicHeader';
import logoImage from '/assets/SafetyTrainingAcademylogo.png';

interface BookNowPageProps {
  onBack: () => void;
  onLogin: () => void;
  onRegister: () => void;
  onCourseDetails?: (courseId: string) => void;
  onAbout?: () => void;
  onContact?: () => void;
  onForms?: () => void;
  onFeesRefund?: () => void;
  onGallery?: () => void;
  onVOC?: () => void;
  onViewCourses?: () => void;
}

export function BookNowPage({ onBack, onLogin, onRegister, onCourseDetails, onAbout, onContact, onForms, onFeesRefund, onGallery, onVOC, onViewCourses }: BookNowPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [categories, setCategories] = useState<CategoryDropdownItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'popular' | 'new'>('all');
  const [coursesDropdownOpen, setCoursesDropdownOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getCategoriesDropdown();
      if (response.success && response.data) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await courseService.getAllCourses({ pageSize: 1000 });
      if (response.success && response.data) {
        setCourses(response.data.courses);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course =>
    course.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.courseCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCourseClick = (courseId: string) => {
    if (onCourseDetails) {
      onCourseDetails(courseId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50">
      <PublicHeader
        onBack={onBack}
        onLogin={onLogin}
        onRegister={onRegister}
        onAbout={onAbout}
        onContact={onContact}
        onBookNow={undefined}
        onCourseDetails={onCourseDetails}
        onForms={onForms}
        onFeesRefund={onFeesRefund}
        onGallery={onGallery}
        onVOC={onVOC}
        onViewCourses={onViewCourses}
      />

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10"></div>
        <motion.div
          className="absolute top-20 right-10 w-72 h-72 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full blur-3xl opacity-20"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute bottom-10 left-10 w-96 h-96 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full blur-3xl opacity-20"
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-2 rounded-full mb-6 shadow-lg">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold">Book Your Course Today</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 pb-4 leading-tight bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ paddingBottom: '0.5rem' }}>
              Start Your Training Journey
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Choose from our wide range of nationally recognized courses and transform your career with expert-led training
            </p>

            {/* Search Bar */}
            <motion.div
              className="max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search courses by name or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 h-14 text-lg rounded-full border-2 border-gray-200 focus:border-cyan-500 shadow-lg"
                />
              </div>
            </motion.div>

            {/* Quick Filters */}
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <Button
                variant={selectedFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setSelectedFilter('all')}
                className={selectedFilter === 'all' 
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-full' 
                  : 'rounded-full border-2 border-gray-300 hover:border-cyan-500'}
              >
                All Courses
              </Button>
              <Button
                variant={selectedFilter === 'popular' ? 'default' : 'outline'}
                onClick={() => setSelectedFilter('popular')}
                className={selectedFilter === 'popular' 
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-full' 
                  : 'rounded-full border-2 border-gray-300 hover:border-cyan-500'}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Popular
              </Button>
              <Button
                variant={selectedFilter === 'new' ? 'default' : 'outline'}
                onClick={() => setSelectedFilter('new')}
                className={selectedFilter === 'new' 
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-full' 
                  : 'rounded-full border-2 border-gray-300 hover:border-cyan-500'}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                New Arrivals
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="py-20 bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 pb-4 leading-tight bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent" style={{ paddingBottom: '0.5rem' }}>
              Explore Our Courses
            </h2>
            <p className="text-gray-600 text-lg">
              {filteredCourses.length} courses found
            </p>
          </motion.div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-cyan-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence>
                {filteredCourses.map((course, index) => (
                  <motion.div
                    key={course.courseId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleCourseClick(course.courseId)}
                    className="cursor-pointer"
                  >
                    <Card className="group hover:shadow-2xl transition-all duration-300 border-2 border-blue-100 hover:border-cyan-400 rounded-2xl overflow-hidden bg-white h-full flex flex-col transform hover:-translate-y-2">
                      <div className="relative h-56 overflow-hidden">
                        <ImageWithFallback
                          src={course.imageUrl || "https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=1080"}
                          alt={course.courseName}
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
                            {course.categoryName || 'Training Course'}
                          </Badge>
                          <div className="text-2xl font-bold text-cyan-600">${course.price}</div>
                        </div>
                        <CardTitle className="text-lg text-slate-900 group-hover:text-cyan-600 transition-colors line-clamp-2">
                          {course.courseCode} - {course.courseName}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 flex-grow">
                        {/* Location and Delivery */}
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
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-cyan-500" />
                            <span>{course.enrolledStudentsCount} students</span>
                          </div>
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
                      <CardFooter>
                        <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl h-11 font-semibold shadow-lg">
                          View Details
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {!loading && filteredCourses.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">No courses found</h3>
              <p className="text-gray-600">Try adjusting your search or filter</p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of students who have transformed their careers with our training
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={onLogin}
                className="bg-white text-cyan-600 hover:bg-gray-100 rounded-full px-8 h-14 text-lg font-semibold shadow-xl"
              >
                Start Learning Today
              </Button>
              <Button
                onClick={onBack}
                className="border-2 border-white text-white hover:bg-white/10 rounded-full px-8 h-14 text-lg font-semibold"
              >
                Explore More
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* WhatsApp Floating Button */}
      <WhatsAppButton />
    </div>
  );
}
