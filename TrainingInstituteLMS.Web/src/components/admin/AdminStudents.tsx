import { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit, Trash2, Eye, EyeOff, Mail, Lock, User, Phone, GraduationCap, FileText, ClipboardList, CheckCircle, XCircle, X, BookOpen, DollarSign, Download, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { studentManagementService, type StudentResponse } from '../../services/studentManagement.service';
import { quizService } from '../../services/quiz.service';
import { studentEnrollmentFormService } from '../../services/studentEnrollmentForm.service';
import { adminPaymentService, type AdminPaymentProof } from '../../services/adminPayment.service';
import { AdminCompanies } from './AdminCompanies';

interface AdminStudentsProps {
  onNavigate?: (page: string, studentEmail?: string) => void;
}

interface StudentStatus {
  hasPassedQuiz: boolean;
  hasCompletedEnrollment: boolean;
}

export function AdminStudents({ onNavigate }: AdminStudentsProps = {}) {
  const [students, setStudents] = useState<StudentResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('all');
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentResponse | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // View Details modal
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsStudent, setDetailsStudent] = useState<StudentResponse | null>(null);
  const [detailsPayments, setDetailsPayments] = useState<AdminPaymentProof[]>([]);
  const [detailsStatus, setDetailsStatus] = useState<StudentStatus | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // Student status tracking (quiz and enrollment)
  const [studentStatuses, setStudentStatuses] = useState<Map<string, StudentStatus>>(new Map());

  // Form states
  const [formData, setFormData] = useState({
    fullName: '',
    preferredName: '',
    email: '',
    phone: '',
    password: '',
  });

  // Fetch students
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await studentManagementService.getAllStudents({
        searchQuery: searchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        pageNumber: currentPage,
        pageSize: pageSize,
      });

      if (response.success) {
        setStudents(response.data.students);
        setTotalCount(response.data.totalCount);
        // Fetch statuses for the loaded students
        fetchStudentStatuses(response.data.students);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  // Fetch quiz and enrollment status for students
  const fetchStudentStatuses = async (studentList: StudentResponse[]) => {
    const statusMap = new Map<string, StudentStatus>();
    
    // Fetch statuses for each student (in parallel)
    await Promise.all(
      studentList.map(async (student) => {
        try {
          const [quizStatus, enrollmentStatus] = await Promise.all([
            quizService.getStudentQuizStatus(student.studentId).catch(() => null),
            studentEnrollmentFormService.getEnrollmentFormByStudentId(student.studentId).catch(() => null)
          ]);

          statusMap.set(student.studentId, {
            hasPassedQuiz: quizStatus?.hasPassedQuiz || quizStatus?.hasAdminBypass || false,
            hasCompletedEnrollment: enrollmentStatus?.success && enrollmentStatus.data?.enrollmentFormCompleted || false
          });
        } catch (error) {
          // If there's an error, set default status
          statusMap.set(student.studentId, {
            hasPassedQuiz: false,
            hasCompletedEnrollment: false
          });
        }
      })
    );

    setStudentStatuses(statusMap);
  };

  useEffect(() => {
    fetchStudents();
  }, [currentPage, searchQuery, statusFilter]);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await studentManagementService.createStudent({
        fullName: formData.fullName,
        preferredName: formData.preferredName || undefined,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phone || undefined,
      });

      if (response.success) {
        toast.success('Student created successfully!');
        setCreateDialogOpen(false);
        resetForm();
        fetchStudents();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create student');
    } finally {
      setLoading(false);
    }
  };

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    setLoading(true);
    try {
      const response = await studentManagementService.updateStudent(selectedStudent.studentId, {
        fullName: formData.fullName,
        preferredName: formData.preferredName || undefined,
        email: formData.email,
        phoneNumber: formData.phone || undefined,
        password: formData.password || undefined,
      });

      if (response.success) {
        toast.success('Student updated successfully!');
        setEditDialogOpen(false);
        setSelectedStudent(null);
        resetForm();
        fetchStudents();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update student');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    setLoading(true);
    try {
      const response = await studentManagementService.deleteStudent(studentId);
      
      if (response.success) {
        toast.success('Student deleted successfully!');
        fetchStudents();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete student');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (studentId: string, currentStatus: boolean) => {
    setLoading(true);
    try {
      const response = await studentManagementService.toggleStudentStatus(studentId);
      
      if (response.success) {
        toast.success(`Student ${currentStatus ? 'deactivated' : 'activated'} successfully!`);
        fetchStudents();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to toggle student status');
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (student: StudentResponse) => {
    setSelectedStudent(student);
    setFormData({
      fullName: student.fullName,
      preferredName: student.preferredName || '',
      email: student.email,
      phone: student.phoneNumber || '',
      password: '',
    });
    setEditDialogOpen(true);
  };

  const openDetailsModal = async (student: StudentResponse) => {
    setDetailsModalOpen(true);
    setDetailsStudent(null);
    setDetailsPayments([]);
    setDetailsStatus(null);
    setDetailsError(null);
    setDetailsLoading(true);

    try {
      const [studentRes, paymentsRes, quizStatusRes, enrollmentRes] = await Promise.all([
        studentManagementService.getStudentById(student.studentId),
        adminPaymentService.getPaymentProofs({ studentId: student.studentId, pageSize: 100 }),
        quizService.getStudentQuizStatus(student.studentId).catch(() => null),
        studentEnrollmentFormService.getEnrollmentFormByStudentId(student.studentId).catch(() => null),
      ]);

      if (studentRes.success && studentRes.data) {
        setDetailsStudent(studentRes.data);
      }
      if (paymentsRes.success && paymentsRes.data?.paymentProofs) {
        setDetailsPayments(paymentsRes.data.paymentProofs);
      }
      setDetailsStatus({
        hasPassedQuiz: !!quizStatusRes?.hasPassedQuiz || !!quizStatusRes?.hasAdminBypass,
        hasCompletedEnrollment: !!(enrollmentRes?.success && enrollmentRes.data?.enrollmentFormCompleted),
      });
    } catch (error) {
      setDetailsError(error instanceof Error ? error.message : 'Failed to load details');
      toast.error(error instanceof Error ? error.message : 'Failed to load student details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      preferredName: '',
      email: '',
      phone: '',
      password: '',
    });
    setShowPassword(false);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateLong = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(amount);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-gray-900 mb-2">Student Management</h1>
        <p className="text-gray-600">Manage students and companies</p>
      </div>

      <Tabs defaultValue="students" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="companies">Companies</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-6 mt-0">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Students</h2>
          <p className="text-gray-600 text-sm">Manage all registered students</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={(open) => { setCreateDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Add New Student
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
              <DialogDescription>
                Fill in the details to create a new student account
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="create-name"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-preferred-name">Preferred Name (Optional)</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="create-preferred-name"
                    placeholder="Johnny"
                    value={formData.preferredName}
                    onChange={(e) => setFormData({ ...formData, preferredName: e.target.value })}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="create-email"
                    type="email"
                    placeholder="student@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="create-phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="create-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 pr-10"
                    required
                    minLength={6}
                    disabled={loading}
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

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setCreateDialogOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Add Student'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>Find students by name, email, or status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search students by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchStudents()}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'active' | 'inactive' | 'all');
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <Button onClick={fetchStudents} variant="outline">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student Accounts ({totalCount})</CardTitle>
          <CardDescription>Manage all student registrations and access</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
              <p className="mt-2 text-gray-500">Loading...</p>
            </div>
          ) : (
            <>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>LLND Status</TableHead>
                      <TableHead>Enrollment Form</TableHead>
                      <TableHead>Enrollments</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => {
                      const status = studentStatuses.get(student.studentId);
                      return (
                      <TableRow key={student.studentId}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-600 rounded-lg flex items-center justify-center">
                              <GraduationCap className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{student.fullName}</div>
                              {student.preferredName && (
                                <div className="text-xs text-gray-500">({student.preferredName})</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>{student.phoneNumber || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {status ? (
                              <Badge 
                                variant="outline" 
                                className={status.hasPassedQuiz 
                                  ? 'border-green-200 bg-green-50 text-green-700' 
                                  : 'border-red-200 bg-red-50 text-red-700'
                                }
                              >
                                {status.hasPassedQuiz ? (
                                  <><CheckCircle className="w-3 h-3 mr-1" /> Completed</>
                                ) : (
                                  <><XCircle className="w-3 h-3 mr-1" /> Not Completed</>
                                )}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-gray-200 text-gray-500">
                                Loading...
                              </Badge>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onNavigate?.('quiz-results', student.email)}
                              disabled={loading || !onNavigate}
                              title="View Quiz Results"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {status ? (
                              <Badge 
                                variant="outline" 
                                className={status.hasCompletedEnrollment 
                                  ? 'border-green-200 bg-green-50 text-green-700' 
                                  : 'border-red-200 bg-red-50 text-red-700'
                                }
                              >
                                {status.hasCompletedEnrollment ? (
                                  <><CheckCircle className="w-3 h-3 mr-1" /> Completed</>
                                ) : (
                                  <><XCircle className="w-3 h-3 mr-1" /> Not Completed</>
                                )}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-gray-200 text-gray-500">
                                Loading...
                              </Badge>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onNavigate?.('enrollment-forms', student.email)}
                              disabled={loading || !onNavigate}
                              title="View Enrollment Form"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-blue-200 text-blue-700">
                            {student.enrollmentCount} course{student.enrollmentCount !== 1 ? 's' : ''}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              student.isActive
                                ? 'bg-green-100 text-green-700 hover:bg-green-100'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-100'
                            }
                          >
                            {student.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(student.lastLoginAt)}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDetailsModal(student)}
                              disabled={loading}
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(student)}
                              disabled={loading}
                              title="Edit Student"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleStatus(student.studentId, student.isActive)}
                              disabled={loading}
                              title={student.isActive ? 'Deactivate Student' : 'Activate Student'}
                            >
                              {student.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                    })}
                  </TableBody>
                </Table>
              </div>

              {students.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No students found</p>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} results
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <span className="px-3 py-1 text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) { setSelectedStudent(null); resetForm(); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>
              Update student information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditStudent} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="edit-name"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-preferred-name">Preferred Name (Optional)</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="edit-preferred-name"
                  placeholder="Johnny"
                  value={formData.preferredName}
                  onChange={(e) => setFormData({ ...formData, preferredName: e.target.value })}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="student@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="edit-phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-password">New Password (optional)</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="edit-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Leave empty to keep current"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10 pr-10"
                  minLength={6}
                  disabled={loading}
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

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setEditDialogOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Student'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Details Modal */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Student Details</DialogTitle>
            <DialogDescription>View student profile, purchased courses, and payment history</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2 -mr-2">
            {detailsLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-12 h-12 animate-spin text-violet-600 mb-4" />
                <p className="text-gray-500">Loading student details...</p>
              </div>
            ) : detailsError ? (
              <div className="text-center py-12">
                <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <p className="text-red-600">{detailsError}</p>
              </div>
            ) : detailsStudent ? (
              <div className="space-y-6">
                {/* Profile Header */}
                <div className="rounded-2xl bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 border border-violet-100 p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                      {detailsStudent.fullName?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-bold text-gray-900 truncate">{detailsStudent.fullName}</h2>
                      {detailsStudent.preferredName && (
                        <p className="text-gray-500 text-sm">Preferred: {detailsStudent.preferredName}</p>
                      )}
                      <div className="flex flex-wrap gap-3 mt-2">
                        <span className="inline-flex items-center gap-1.5 text-gray-600">
                          <Mail className="w-4 h-4 text-violet-500" />
                          <a href={`mailto:${detailsStudent.email}`} className="hover:text-violet-600">{detailsStudent.email}</a>
                        </span>
                        {detailsStudent.phoneNumber && (
                          <span className="inline-flex items-center gap-1.5 text-gray-600">
                            <Phone className="w-4 h-4 text-violet-500" />
                            {detailsStudent.phoneNumber}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Badge className={detailsStudent.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                          {detailsStudent.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        {detailsStatus && (
                          <>
                            <Badge variant="outline" className={detailsStatus.hasPassedQuiz ? 'border-green-200 bg-green-50 text-green-700' : 'border-amber-200 bg-amber-50 text-amber-700'}>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              LLND: {detailsStatus.hasPassedQuiz ? 'Completed' : 'Not Completed'}
                            </Badge>
                            <Badge variant="outline" className={detailsStatus.hasCompletedEnrollment ? 'border-green-200 bg-green-50 text-green-700' : 'border-amber-200 bg-amber-50 text-amber-700'}>
                              <FileText className="w-3 h-3 mr-1" />
                              Form: {detailsStatus.hasCompletedEnrollment ? 'Completed' : 'Not Completed'}
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Purchased Courses */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-violet-600" />
                    Purchased Courses
                  </h3>
                  {detailsPayments.length === 0 ? (
                    <Card className="border-dashed border-violet-200 bg-violet-50/50">
                      <CardContent className="py-12 text-center">
                        <BookOpen className="w-12 h-12 text-violet-300 mx-auto mb-3" />
                        <p className="text-gray-600 font-medium">No courses purchased yet</p>
                        <p className="text-gray-500 text-sm mt-1">This student has not enrolled in any courses</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {detailsPayments.map((payment) => (
                        <Card key={payment.paymentProofId} className="overflow-hidden border-violet-100 hover:shadow-md transition-shadow">
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <CardTitle className="text-base">{payment.courseName}</CardTitle>
                                <CardDescription>{payment.courseCode}</CardDescription>
                              </div>
                              <Badge
                                className={
                                  payment.status === 'Verified'
                                    ? 'bg-green-100 text-green-700'
                                    : payment.status === 'Pending'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-red-100 text-red-700'
                                }
                              >
                                {payment.status}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Amount paid</span>
                              <span className="font-semibold text-gray-900">{formatCurrency(payment.amountPaid)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Payment date</span>
                              <span>{formatDateLong(payment.paymentDate)}</span>
                            </div>
                            {payment.transactionId && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Transaction ID</span>
                                <span className="font-mono text-xs">{payment.transactionId}</span>
                              </div>
                            )}
                            <a
                              href={adminPaymentService.getReceiptDownloadUrl(payment.paymentProofId)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-violet-600 hover:text-violet-700 text-sm mt-2"
                            >
                              <Download className="w-4 h-4" />
                              Download receipt
                            </a>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Payment Details Summary */}
                {detailsPayments.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-violet-600" />
                      Payment Summary
                    </h3>
                    <Card className="border-violet-100">
                      <CardContent className="pt-6">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Course</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Receipt</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {detailsPayments.map((payment) => (
                                <TableRow key={payment.paymentProofId}>
                                  <TableCell>
                                    <div>
                                      <div className="font-medium">{payment.courseName}</div>
                                      <div className="text-xs text-gray-500">{payment.transactionId}</div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="font-medium">{formatCurrency(payment.amountPaid)}</TableCell>
                                  <TableCell>{formatDateLong(payment.paymentDate)}</TableCell>
                                  <TableCell>
                                    <Badge
                                      variant="outline"
                                      className={
                                        payment.status === 'Verified'
                                          ? 'border-green-200 bg-green-50 text-green-700'
                                          : payment.status === 'Pending'
                                          ? 'border-amber-200 bg-amber-50 text-amber-700'
                                          : 'border-red-200 bg-red-50 text-red-700'
                                      }
                                    >
                                      {payment.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      asChild
                                    >
                                      <a href={adminPaymentService.getReceiptDownloadUrl(payment.paymentProofId)} target="_blank" rel="noopener noreferrer">
                                        <Download className="w-4 h-4" />
                                      </a>
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                          <span className="font-medium text-gray-700">Total paid</span>
                          <span className="text-lg font-bold text-violet-700">
                            {formatCurrency(detailsPayments.reduce((sum, p) => sum + p.amountPaid, 0))}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
        </TabsContent>

        <TabsContent value="companies" className="mt-0">
          <AdminCompanies />
        </TabsContent>
      </Tabs>
    </div>
  );
}
