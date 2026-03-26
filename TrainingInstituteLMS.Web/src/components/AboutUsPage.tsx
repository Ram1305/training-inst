import { useState, useEffect } from 'react';
import { GraduationCap, Phone, Mail, Shield, Menu, X, CheckCircle, Target, Eye, Lightbulb, Sparkles, Users, Award, TrendingUp, MapPin, Facebook, Linkedin, Instagram, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { motion } from 'motion/react';
import { courseService } from '../services/course.service';
import type { CourseListItem } from '../services/course.service';
import { categoryService } from '../services/category.service';
import type { CategoryDropdownItem } from '../services/category.service';
import { WhatsAppButton } from './ui/WhatsAppButton';
import logoImage from '/assets/SafetyTrainingAcademylogo.png';
import { SAFETY_TRAINING_ACADEMY_LOGO } from '../constants/safetyTrainingAcademyLogo';
import buildingImage from '/assets/Safety-Training-Academy-Office-in-Sydney.jpg';
import classroomImage from '/assets/Safety-Training-Academy-Class-in-Sydney.jpg';
import { PublicHeader } from './layout/PublicHeader';
import { ResourcesDropdown } from './ui/ResourcesDropdown';

interface AboutUsPageProps {
  onBack: () => void;
  onLogin: () => void;
  onRegister: () => void;
  onContact?: () => void;
  onViewCourses?: () => void;
  onViewComboCourses?: () => void;
  onBookNow?: () => void;
  onCourseDetails?: (courseId: string) => void;
  onForms?: () => void;
  onFeesRefund?: () => void;
  onGallery?: () => void;
  onVOC?: () => void;
}

export function AboutUsPage({ onBack, onLogin, onRegister, onContact, onViewCourses, onViewComboCourses, onBookNow, onCourseDetails, onForms, onFeesRefund, onGallery, onVOC }: AboutUsPageProps) {
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

  const courses = [
    { name: 'Forklift Licences', approval: 'RTO 800469' },
    { name: 'High risk work (WP) licence', approval: 'RTO 800469' },
    { name: 'Elevating Work Platform (EWP) Licences', approval: 'RTO 800469', card: 'EWPA Yellow Card' },
    { name: 'Asbestos Removal Class B & supervisor', approval: 'RTO 800469' },
    { name: 'WHS White Card', approval: 'RTO 800469' },
    { name: 'Traffic control courses', approval: 'RTO 800469' },
    { name: 'Working at Height safety & More' }
  ];

  const values = [
    {
      icon: Sparkles,
      title: 'Easy Accessibility',
      description: 'Our training services are readily accessible to everyone who needs them.',
      color: 'cyan',
      gradient: 'from-cyan-400 to-blue-500'
    },
    {
      icon: Target,
      title: 'Striving for Excellence',
      description: 'We continually aim for the highest qualities in everything we do.',
      color: 'blue',
      gradient: 'from-blue-600 to-indigo-600',
      highlighted: true
    },
    {
      icon: Award,
      title: 'Highest Quality',
      description: 'An assurance that a person received quality training from us without negative feedback.',
      color: 'cyan',
      gradient: 'from-cyan-400 to-blue-500'
    },
    {
      icon: Users,
      title: 'Inclusive',
      description: 'We reflect clients views in our actions and critical thinking to serve betters',
      color: 'purple',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: Shield,
      title: 'Trustworthy',
      description: 'We are open, honest, and committed to the highest standards of ethical behaviour',
      color: 'green',
      gradient: 'from-green-500 to-emerald-500'
    }
  ];

  const missions = [
    'Ensure that all of the services are easily affordable, accessible, and meet our clients\' needs.',
    'Train clients with the knowledge that shapes and directs their career pathways/or gain employment.',
    'Create a training center that provides an innovative and exciting learning experience for all clients and trainers.',
    'Provide training programs that fulfill industry and employer skills requirements',
    'Provide high-quality services that meet the quality standard of our clients'
  ];

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader
        onBack={onBack}
        onLogin={onLogin}
        onRegister={onRegister}
        onAbout={() => {}}
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

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 mix-blend-multiply" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center"
          >
            <Badge className="bg-cyan-500 text-white px-6 py-2 text-lg mb-6">
              RTO #45234 | ASQA Accredited
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              About <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Us</span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
              Empowering careers through excellence in vocational education and training
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content - Who We Are */}
      <section className="py-20 bg-gradient-to-br from-cyan-50 via-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600">
                  Safety Training Academy
                </span>
                <br />
                <span className="text-slate-900">specialises in the delivery of short courses</span>
              </h2>

              <Card className="bg-white border-2 border-blue-100 shadow-xl rounded-3xl mb-6">
                <CardContent className="p-6">
                  <p className="text-gray-700 text-lg leading-relaxed mb-4">
                    <span className="font-bold text-slate-900">Safety Training Academy</span> (STA) is a specialty branch of Australian International Education Training which was formed in 2017, who is a{' '}
                    <span className="font-bold text-cyan-600">Registered Training Organisation (RTO</span> Provider No <span className="font-bold">45234</span>) that specialises in the delivery of{' '}
                    <span className="font-bold text-blue-600">Vocational Education & Training (VET)</span> accredited courses by the{' '}
                    <span className="font-bold text-slate-900">Australian Skills Quality Authority (ASQA)</span>.
                  </p>

                  <div className="mt-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-4">Our short courses are including but not limited to:</h3>
                    <div className="space-y-3">
                      {courses.map((course, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className="flex items-start gap-3 bg-gradient-to-r from-cyan-50 to-blue-50 p-4 rounded-xl"
                        >
                          <CheckCircle className="w-6 h-6 text-cyan-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="text-gray-800 font-semibold">{course.name}</span>
                            {course.approval && (
                              <span className="text-cyan-600 font-bold ml-2">
                                (SafeWork NSW Approval No: {course.approval})
                              </span>
                            )}
                            {course.card && (
                              <span className="text-gray-600 ml-2">- {course.card}</span>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img src={buildingImage} alt="Safety Training Academy Building" className="w-full h-auto" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <Badge className="bg-cyan-500 text-white px-4 py-2 text-lg shadow-xl">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Safety Training Academy | Sydney - 3/14-16 Marjorie Street, Sefton NSW 2162
                  </Badge>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Why Choose <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600">Safety Training Academy</span>
              <br />
              <span className="text-slate-900">for short courses in Sydney</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <Card className="border-2 border-cyan-100 shadow-xl rounded-3xl overflow-hidden">
                <CardContent className="p-8 space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-gray-700 text-lg">
                      <span className="font-bold text-cyan-600">Safety Training Academy training programs</span> on short courses are not only limited to theory but practical classes that fully train the participants in their specific field.
                    </p>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-gray-700 text-lg">
                      Our trainers have been in the industry for several years, and they are committed, experienced, and extremely qualified in the specific area in which they choose to train and assess.
                    </p>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-gray-700 text-lg">
                      <span className="font-bold text-slate-900">The safety of every student is so important to us</span> that why we make it our priority. We are located in a well-organized area. We set ourselves apart by ensuring that our training rooms are built with modern technology such as excellent air-conditioned training.
                    </p>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-gray-700 text-lg">
                      Our training program full of qualities irrespective of any course you registered for, and we do not just take your money and prepare you to study everything by yourself and fail.
                    </p>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-gray-700 text-lg">
                      Our equipment for each course is very standard, contributing to the training to be more understandable by every one of our students.
                    </p>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-gray-700 text-lg">
                      Our customer support system is always available to help you 24/7 every day in a week; we will very thrilled to help you. At STA, we stand out of our competitors with our low cost; you can't find any other fee less expensive than us, with our quality training and training equipment.
                    </p>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-gray-700 text-lg">
                      Our training location has easy access to public transport without too much stress. And lastly, you can choose to train in your home place and at a convenient time.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img src={classroomImage} alt="Training Classroom" className="w-full h-auto" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <h3 className="text-white text-2xl font-bold">Modern Training Facilities</h3>
                  <p className="text-blue-100 mt-2">State-of-the-art equipment and comfortable learning environment</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Vision & Mission Section */}
      <section className="py-20 bg-gradient-to-br from-slate-100 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <Card className="border-2 border-cyan-200 shadow-xl rounded-3xl overflow-hidden h-full bg-gradient-to-br from-white to-cyan-50">
                <CardHeader className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white p-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <Eye className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-3xl">Our Vision</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <p className="text-gray-700 text-lg leading-relaxed">
                    Our vision is to help people identify and achieve their career growth and development through our bespoke and relevant training solutions.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <Card className="border-2 border-blue-200 shadow-xl rounded-3xl overflow-hidden h-full bg-gradient-to-br from-white to-blue-50">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <Target className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-3xl">Our Mission</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <p className="text-gray-700 text-lg leading-relaxed mb-6">
                    Our journey starts with our mission. It declares our purpose as a trainer and serves as the standard against which we weigh our actions and decisions.
                  </p>
                  <div className="space-y-4">
                    {missions.map((mission, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="flex items-start gap-3"
                      >
                        <CheckCircle className="w-6 h-6 text-cyan-600 flex-shrink-0 mt-1" />
                        <p className="text-gray-700">{mission}</p>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Values Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-12"
          >
            <Badge className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-2 text-lg mb-4">
              OUR VALUES
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              What we <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600">value</span> are:
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className={`border-2 ${value.highlighted ? 'border-blue-400 shadow-2xl shadow-blue-500/50' : 'border-blue-100'} rounded-3xl overflow-hidden h-full transition-all hover:shadow-2xl hover:-translate-y-2 ${value.highlighted ? 'bg-gradient-to-br from-blue-600 to-indigo-600' : 'bg-white'}`}>
                  <CardContent className="p-8">
                    <div className={`w-16 h-16 ${value.highlighted ? 'bg-white/20' : `bg-gradient-to-br ${value.gradient}`} rounded-2xl flex items-center justify-center mb-6`}>
                      <value.icon className={`w-8 h-8 ${value.highlighted ? 'text-white' : 'text-white'}`} />
                    </div>
                    <h3 className={`text-2xl font-bold mb-4 ${value.highlighted ? 'text-white' : 'text-slate-900'}`}>
                      {value.title}
                    </h3>
                    <p className={`${value.highlighted ? 'text-blue-100' : 'text-gray-700'} text-lg leading-relaxed`}>
                      {value.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of students who have transformed their careers with our nationally recognized training programs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={onRegister}
                className="bg-white text-cyan-600 hover:bg-gray-100 rounded-full px-8 h-14 text-lg font-semibold shadow-xl"
              >
                Enrol Now
              </Button>
              <Button
                onClick={onViewCourses || onBack}
                className="bg-white text-cyan-600 hover:bg-gray-100 rounded-full px-8 h-14 text-lg font-semibold shadow-xl"
              >
                View Courses
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

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
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all">
                  <Instagram className="w-5 h-5" />
                </a>
              </div>
            </div>
            <div>
              <h3 className="font-bold mb-4 text-lg">Head Office</h3>
              <ul className="space-y-2 text-sm text-white/90">
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Safety Training Academy | Sydney - 3/14-16 Marjorie Street, Sefton NSW 2162 AUSTRALIA</span>
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
                <li><button onClick={onBack} className="hover:text-white transition-colors">Home</button></li>
                <li><a href="#courses" className="hover:text-white transition-colors">Book Now</a></li>
                <li><a href="#courses" className="hover:text-white transition-colors">Courses</a></li>
                <li><a href="#about" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
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
    </div>
  );
}
