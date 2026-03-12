import { useState } from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Facebook,
  Linkedin,
  Instagram,
  ChevronDown,
  ArrowLeft,
  CheckCircle,
  Shield,
  Calendar as CalendarIcon,
  Clock,
  Send,
  Loader2,
  Menu,
  X
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { vocManagementService } from '../../services/vocManagement.service';

interface PublicVOCFormProps {
  onBack: () => void;
}

export function PublicVOCForm({ onBack }: PublicVOCFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [date, setDate] = useState<Date>();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      australianStudentId: formData.get('studentId') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      streetAddress: formData.get('street') as string,
      city: formData.get('city') as string,
      state: (formData.get('state') as string) || 'NSW',
      postcode: formData.get('zip') as string,
      preferredStartDate: date?.toISOString(),
      preferredTime: formData.get('preferredTime') as string,
      comments: formData.get('comments') as string,
    };

    setIsSubmitting(true);
    try {
      const response = await vocManagementService.submitVOC(data);
      if (response.success) {
        toast.success('VOC Booking submitted successfully!');
        // Reset form or navigate back
        setTimeout(() => onBack(), 2000);
      } else {
        toast.error(response.message || 'Failed to submit booking');
      }
    } catch (error) {
      toast.error('An error occurred while submitting. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    // Mock verification
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success('Australian Student ID verified!');
    setIsVerifying(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Dark Header/Navigation */}
      <nav className="bg-slate-950 text-white sticky top-0 z-50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo and Back Button */}
            <div className="flex items-center gap-4">
              <button 
                onClick={onBack}
                className="p-2 hover:bg-slate-800 rounded-full transition-colors group"
                title="Back to Home"
              >
                <ArrowLeft className="w-6 h-6 text-slate-400 group-hover:text-white" />
              </button>
              <div className="flex items-center">
                <img
                  src="/assets/SafetyTrainingAcademylogo.png"
                  alt="Safety Training Academy"
                  className="h-10 md:h-12 brightness-0 invert"
                />
              </div>
            </div>

            {/* Desktop Menu Icons */}
            <div className="hidden md:flex items-center gap-6">
              <div className="flex items-center gap-2 text-slate-300">
                <Shield className="w-5 h-5 text-cyan-400" />
                <span className="text-sm font-semibold">VOC RENEWAL</span>
              </div>
              <button className="p-2 text-slate-300 hover:text-white">
                <Menu className="w-6 h-6" />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg text-white hover:bg-slate-800"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Form Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
              VOC Course Renewal Form
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Verify your competency and renew your certification quickly and easily.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1: Personal Information */}
            <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-cyan-500 to-blue-600" />
              <CardHeader className="bg-slate-50/50">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-cyan-600" />
                  Personal Information
                </CardTitle>
                <CardDescription>Enter your basic details as shown on your ID.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input name="firstName" id="firstName" placeholder="e.g. John" required className="h-12 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input name="lastName" id="lastName" placeholder="e.g. Doe" required className="h-12 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="studentId">Australian Student ID</Label>
                  <div className="flex gap-2">
                    <Input 
                      name="studentId"
                      id="studentId" 
                      placeholder="Enter your Student ID" 
                      className="h-12 border-slate-200 flex-1 focus:border-cyan-500 focus:ring-cyan-500"
                    />
                    <Button 
                      type="button" 
                      onClick={handleVerify}
                      disabled={isVerifying}
                      className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md active:scale-95"
                    >
                      {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Contact Details */}
            <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden">
              <CardHeader className="bg-slate-50/50">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Phone className="w-5 h-5 text-cyan-600" />
                  Contact Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input name="email" id="email" type="email" placeholder="john.doe@example.com" required className="h-12 border-slate-200 focus:border-cyan-500" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input name="phone" id="phone" type="tel" placeholder="e.g. 0400 000 000" required className="h-12 border-slate-200 focus:border-cyan-500" />
                </div>
              </CardContent>
            </Card>

            {/* Section 3: Address Section */}
            <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden">
              <CardHeader className="bg-slate-50/50">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-cyan-600" />
                  Address Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="street">Street Address</Label>
                  <Input name="street" id="street" placeholder="123 Example St" required className="h-12 border-slate-200 focus:border-cyan-500" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input name="city" id="city" placeholder="Sydney" required className="h-12 border-slate-200 focus:border-cyan-500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Select name="state" defaultValue="NSW">
                      <SelectTrigger className="h-12 border-slate-200">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NSW">New South Wales</SelectItem>
                        <SelectItem value="VIC">Victoria</SelectItem>
                        <SelectItem value="QLD">Queensland</SelectItem>
                        <SelectItem value="WA">Western Australia</SelectItem>
                        <SelectItem value="SA">South Australia</SelectItem>
                        <SelectItem value="TAS">Tasmania</SelectItem>
                        <SelectItem value="ACT">ACT</SelectItem>
                        <SelectItem value="NT">Northern Territory</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">ZIP/Postal Code</Label>
                    <Input name="zip" id="zip" placeholder="2000" required className="h-12 border-slate-200 focus:border-cyan-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 4: Booking Details */}
            <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden">
              <CardHeader className="bg-slate-50/50">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-cyan-600" />
                  Booking Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Preferred Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={`w-full h-12 justify-start text-left font-normal border-slate-200 ${!date && "text-muted-foreground"}`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Preferred Time</Label>
                  <Select name="preferredTime">
                    <SelectTrigger className="h-12 border-slate-200">
                      <SelectValue placeholder="Select time session" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning (8:00 AM - 12:00 PM)</SelectItem>
                      <SelectItem value="afternoon">Afternoon (1:00 PM - 5:00 PM)</SelectItem>
                      <SelectItem value="evening">Evening (6:00 PM - 10:00 PM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="comments">Additional Comments</Label>
                  <Textarea 
                    name="comments"
                    id="comments" 
                    placeholder="Provide any additional information here..." 
                    className="min-h-[120px] border-slate-200 focus:border-cyan-500"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="pt-6">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full h-14 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-700 hover:to-blue-800 text-white text-lg font-bold rounded-xl shadow-lg shadow-cyan-500/30 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="w-5 h-5" />
                    Submit Booking
                  </span>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-16 px-4 mt-20 border-t border-slate-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Logo and About */}
          <div className="space-y-6">
            <img
              src="/assets/SafetyTrainingAcademylogo.png"
              alt="Safety Training Academy"
              className="h-12 brightness-0 invert opacity-80"
            />
            <p className="text-sm leading-relaxed max-w-xs">
              Providing nationally recognized safety training and certifications across Australia. Leading with quality and excellence since established.
            </p>
            <div className="flex gap-4">
              <a href="#" className="p-2 bg-slate-800 rounded-full hover:bg-cyan-500 transition-colors group">
                <Facebook className="w-5 h-5 group-hover:text-white" />
              </a>
              <a href="#" className="p-2 bg-slate-800 rounded-full hover:bg-indigo-600 transition-colors group">
                <Linkedin className="w-5 h-5 group-hover:text-white" />
              </a>
              <a href="#" className="p-2 bg-slate-800 rounded-full hover:bg-pink-600 transition-colors group">
                <Instagram className="w-5 h-5 group-hover:text-white" />
              </a>
            </div>
          </div>

          {/* Quick Contact */}
          <div className="space-y-6">
            <h3 className="text-white font-bold text-lg">Head Office</h3>
            <ul className="space-y-4 text-sm font-medium">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-cyan-500 shrink-0" />
                <span>3/14-16 Marjorie Street, Sefton NSW 2162</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-cyan-500 shrink-0" />
                <a href="tel:1300976097" className="hover:text-cyan-400 transition-colors">1300 976 097</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-cyan-500 shrink-0" />
                <a href="mailto:info@safetytrainingacademy.edu.au" className="hover:text-cyan-400 transition-colors">info@safetytrainingacademy.edu.au</a>
              </li>
            </ul>
          </div>

          {/* Accreditation */}
          <div className="space-y-6">
            <h3 className="text-white font-bold text-lg">Accreditation</h3>
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">RTO Provider</div>
                  <div className="text-xl font-black text-white tracking-tighter">#45234</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Safety Training Academy. All rights reserved. RTO Provider #45234
        </div>
      </footer>
    </div>
  );
}
