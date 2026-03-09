import { useState, useEffect } from 'react';
import { ArrowLeft, GraduationCap, Mail, Lock, Eye, EyeOff, User as UserIcon, Building2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { authService } from '../services/auth.service';
import type { User } from '../App';

interface LoginPageProps {
  onLogin: (user: User) => void;
  onBack: () => void;
  onNavigateToEnroll?: () => void;
}

const REMEMBER_KEY_EMAIL = 'login_remembered_email';
const REMEMBER_KEY_PASSWORD = 'login_remembered_password';
const REMEMBER_KEY_CHECKED = 'login_remember_me';

export function LoginPage({ onLogin, onBack, onNavigateToEnroll }: LoginPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Login form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Load saved email, password, and Remember me from last session
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem(REMEMBER_KEY_EMAIL);
      const savedPassword = localStorage.getItem(REMEMBER_KEY_PASSWORD);
      const savedChecked = localStorage.getItem(REMEMBER_KEY_CHECKED);
      if (savedEmail) setLoginEmail(savedEmail);
      if (savedPassword) setLoginPassword(savedPassword);
      if (savedChecked === 'true') setRememberMe(true);
    } catch {
      // ignore localStorage errors (e.g. private mode)
    }
  }, []);
  
  // Registration form states
  const [regAccountType, setRegAccountType] = useState<'Individual' | 'Company'>('Individual');
  const [regName, setRegName] = useState('');
  const [regCompanyName, setRegCompanyName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await authService.login({
        email: loginEmail,
        password: loginPassword,
        rememberMe: rememberMe,
      });

      if (response.success) {
        try {
          if (rememberMe) {
            localStorage.setItem(REMEMBER_KEY_EMAIL, loginEmail);
            localStorage.setItem(REMEMBER_KEY_PASSWORD, loginPassword);
            localStorage.setItem(REMEMBER_KEY_CHECKED, 'true');
          } else {
            localStorage.removeItem(REMEMBER_KEY_EMAIL);
            localStorage.removeItem(REMEMBER_KEY_PASSWORD);
            localStorage.removeItem(REMEMBER_KEY_CHECKED);
          }
        } catch {
          // ignore localStorage errors
        }
        onLogin({
          id: response.data.userId,
          name: response.data.fullName,
          email: response.data.email,
          role: (response.data.userType?.toLowerCase() === 'company' ? 'company' : response.data.userType?.toLowerCase()) as 'student' | 'teacher' | 'admin' | 'superadmin' | 'company',
          avatar: undefined,
          studentId: response.data.studentId,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const isCompany = regAccountType === 'Company';
    try {
      const response = await authService.register({
        accountType: regAccountType,
        fullName: isCompany ? regCompanyName : regName,
        companyName: isCompany ? regCompanyName : undefined,
        email: regEmail,
        password: regPassword,
        phoneNumber: isCompany ? undefined : regPhone,
        acceptTerms: acceptTerms,
      });

      if (response.success) {
        onLogin({
          id: response.data.userId,
          name: response.data.fullName,
          email: response.data.email,
          role: (response.data.userType?.toLowerCase() === 'company' ? 'company' : response.data.userType?.toLowerCase()) as 'student' | 'teacher' | 'admin' | 'superadmin' | 'company',
          avatar: undefined,
          studentId: response.data.studentId,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 flex items-center justify-center p-4">
      {/* Background Decorative Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-violet-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob" />
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-fuchsia-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000" />

      <div className="w-full max-w-5xl relative z-10">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left Side - Branding */}
          <div className="hidden md:block">
            <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-3xl p-12 text-white h-full">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-7 h-7" />
                </div>
                <div className="text-2xl">Safety Training Academy</div>
              </div>
              <div className="space-y-6">
                <h2 className="text-4xl">
                  Start Your Professional Journey Today
                </h2>
                <p className="text-violet-100">
                  Join thousands of professionals who have advanced their careers through our industry-recognized certification programs.
                </p>
                <div className="space-y-4 pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                      ✓
                    </div>
                    <div>Industry-recognized certifications</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                      ✓
                    </div>
                    <div>Expert instructors with real-world experience</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                      ✓
                    </div>
                    <div>Flexible learning schedules</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login/Register Form */}
          <Card className="border-violet-100">
            <CardHeader>
              <CardTitle>Welcome Back</CardTitle>
              <CardDescription>Sign in to your account or create a new one</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Sign In</TabsTrigger>
                  <TabsTrigger
                    value="register"
                    onClick={(e) => {
                      if (onNavigateToEnroll) {
                        e.preventDefault();
                        onNavigateToEnroll();
                      }
                    }}
                  >
                    Register
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form className="space-y-4" onSubmit={handleLogin}>
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="you@example.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="pl-10"
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="pl-10 pr-10"
                          required
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          disabled={isLoading}
                        />
                        <span className="text-sm text-gray-600">Remember me</span>
                      </label>
                      <Button variant="link" className="text-violet-600 p-0 h-auto text-sm">
                        Forgot password?
                      </Button>
                    </div>

                    <Button 
                      type="submit"
                      className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </form>
                </TabsContent>

                {/* Register tab navigates to enroll page when onNavigateToEnroll is provided */}
                <TabsContent value="register" className="mt-0">
                  {!onNavigateToEnroll && (
                    <form className="space-y-4" onSubmit={handleRegister}>
                      <div className="space-y-3">
                        <Label>Register as</Label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="regAccountType"
                              value="Individual"
                              checked={regAccountType === 'Individual'}
                              onChange={() => setRegAccountType('Individual')}
                              disabled={isLoading}
                              className="rounded-full border-gray-300"
                            />
                            <span className="text-sm font-medium">Individual</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="regAccountType"
                              value="Company"
                              checked={regAccountType === 'Company'}
                              onChange={() => setRegAccountType('Company')}
                              disabled={isLoading}
                              className="rounded-full border-gray-300"
                            />
                            <span className="text-sm font-medium">Company</span>
                          </label>
                        </div>
                      </div>

                      {regAccountType === 'Individual' ? (
                        <div className="space-y-2">
                          <Label htmlFor="reg-name">Full Name</Label>
                          <div className="relative">
                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                              id="reg-name"
                              type="text"
                              placeholder="John Doe"
                              value={regName}
                              onChange={(e) => setRegName(e.target.value)}
                              className="pl-10"
                              required
                              disabled={isLoading}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label htmlFor="reg-company-name">Company Name</Label>
                          <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                              id="reg-company-name"
                              type="text"
                              placeholder="Acme Corp"
                              value={regCompanyName}
                              onChange={(e) => setRegCompanyName(e.target.value)}
                              className="pl-10"
                              required
                              disabled={isLoading}
                            />
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="reg-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="reg-email"
                            type="email"
                            placeholder="you@example.com"
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            className="pl-10"
                            required
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      {regAccountType === 'Individual' && (
                        <div className="space-y-2">
                          <Label htmlFor="reg-phone">Phone Number (optional)</Label>
                          <Input
                            id="reg-phone"
                            type="tel"
                            placeholder="+1 (555) 123-4567"
                            value={regPhone}
                            onChange={(e) => setRegPhone(e.target.value)}
                            disabled={isLoading}
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="reg-password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="reg-password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            className="pl-10 pr-10"
                            required
                            minLength={6}
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <input 
                          type="checkbox" 
                          className="mt-1 rounded border-gray-300" 
                          required
                          checked={acceptTerms}
                          onChange={(e) => setAcceptTerms(e.target.checked)}
                          disabled={isLoading}
                        />
                        <span className="text-sm text-gray-600">
                          I agree to the Terms of Service and Privacy Policy
                        </span>
                      </div>

                      <Button 
                        type="submit"
                        className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Creating Account...' : 'Create Account'}
                      </Button>
                    </form>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}