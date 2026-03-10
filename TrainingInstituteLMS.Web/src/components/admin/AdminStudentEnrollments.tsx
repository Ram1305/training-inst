import { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Edit,
  Loader2,
  User,
  Mail,
  Phone,
  AlertTriangle,
  X,
  Download,
  FileDown,
  Printer
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { 
  studentEnrollmentFormService, 
  type EnrollmentFormListItem, 
  type EnrollmentFormResponse,
  type EnrollmentFormStats 
} from '../../services/studentEnrollmentForm.service';
import { enrollmentService, type StudentEnrolledCourse } from '../../services/enrollment.service';
import { adminPaymentService, type AdminPaymentProof } from '../../services/adminPayment.service';

interface AdminStudentEnrollmentsProps {
  initialSearchQuery?: string;
  initialEmailToView?: string;
  onClearInitialView?: () => void;
}

export function AdminStudentEnrollments({ initialSearchQuery, initialEmailToView, onClearInitialView }: AdminStudentEnrollmentsProps = {}) {
  const [enrollmentForms, setEnrollmentForms] = useState<EnrollmentFormListItem[]>([]);
  const [stats, setStats] = useState<EnrollmentFormStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || initialEmailToView || '');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // View/Edit Dialog
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<EnrollmentFormResponse | null>(null);
  const [loadingForm, setLoadingForm] = useState(false);

  // Review Dialog
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [isReviewing, setIsReviewing] = useState(false);

  // PDF handling
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  // Enrollments and payments per student (for Course, Course selected date, Individual/Company)
  const [studentEnrollments, setStudentEnrollments] = useState<Map<string, StudentEnrolledCourse[]>>(new Map());
  const [studentPayments, setStudentPayments] = useState<Map<string, AdminPaymentProof[]>>(new Map());

  const fetchEnrollmentsForForms = useCallback(async (forms: EnrollmentFormListItem[]): Promise<void> => {
    const enrollmentsMap = new Map<string, StudentEnrolledCourse[]>();
    const paymentsMap = new Map<string, AdminPaymentProof[]>();
    await Promise.all(
      forms.map(async (form) => {
        try {
          const [enrRes, payRes] = await Promise.all([
            enrollmentService.getStudentEnrollments(form.studentId).catch(() => ({ success: false, data: [] as StudentEnrolledCourse[] })),
            adminPaymentService.getPaymentProofs({ studentId: form.studentId, pageSize: 100 }).catch(() => ({ success: false, data: { paymentProofs: [] as AdminPaymentProof[] } })),
          ]);
          if (enrRes.success && enrRes.data) enrollmentsMap.set(form.studentId, enrRes.data);
          else enrollmentsMap.set(form.studentId, []);
          if (payRes.success && payRes.data?.paymentProofs) paymentsMap.set(form.studentId, payRes.data.paymentProofs);
          else paymentsMap.set(form.studentId, []);
        } catch {
          enrollmentsMap.set(form.studentId, []);
          paymentsMap.set(form.studentId, []);
        }
      })
    );
    setStudentEnrollments(enrollmentsMap);
    setStudentPayments(paymentsMap);
  }, []);

  // Fetch enrollment forms
  const fetchEnrollmentForms = useCallback(async () => {
    setLoading(true);
    try {
      const response = await studentEnrollmentFormService.getEnrollmentFormsForAdmin({
        searchQuery: searchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page: currentPage,
        pageSize: pageSize,
        sortDescending: true,
      });

      if (response.success) {
        setEnrollmentForms(response.data.enrollmentForms);
        setTotalCount(response.data.totalCount);
        fetchEnrollmentsForForms(response.data.enrollmentForms);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch enrollment forms');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, currentPage, pageSize, fetchEnrollmentsForForms]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await studentEnrollmentFormService.getEnrollmentFormStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchEnrollmentForms();
    fetchStats();
  }, [fetchEnrollmentForms, fetchStats]);

  // Auto-open view dialog when navigated from Students tab with initialEmailToView
  useEffect(() => {
    if (!initialEmailToView || enrollmentForms.length === 0) return;
    const form = enrollmentForms.find((f) => f.email?.toLowerCase() === initialEmailToView.toLowerCase());
    if (form) {
      handleViewForm(form.studentId);
    }
    onClearInitialView?.();
  }, [enrollmentForms, initialEmailToView]);

  const handleViewForm = async (studentId: string) => {
    setLoadingForm(true);
    setViewDialogOpen(true);
    try {
      const response = await studentEnrollmentFormService.getEnrollmentFormByIdForAdmin(studentId);
      if (response.success) {
        setSelectedForm(response.data);
      } else {
        toast.error('Failed to load enrollment form');
        setViewDialogOpen(false);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load enrollment form');
      setViewDialogOpen(false);
    } finally {
      setLoadingForm(false);
    }
  };

  const handleOpenReviewDialog = (action: 'approve' | 'reject') => {
    setReviewAction(action);
    setReviewNotes('');
    setReviewDialogOpen(true);
  };

  const handleReviewSubmit = async () => {
    if (!selectedForm) return;

    setIsReviewing(true);
    try {
      const response = await studentEnrollmentFormService.reviewEnrollmentForm(selectedForm.studentId, {
        approve: reviewAction === 'approve',
        reviewNotes: reviewNotes || undefined,
      });

      if (response.success) {
        toast.success(`Enrollment form ${reviewAction === 'approve' ? 'approved' : 'rejected'} successfully`);
        setReviewDialogOpen(false);
        setViewDialogOpen(false);
        setSelectedForm(null);
        fetchEnrollmentForms();
        fetchStats();
      } else {
        toast.error(response.message || 'Failed to submit review');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit review');
    } finally {
      setIsReviewing(false);
    }
  };

  const handleViewPdf = async (studentId: string) => {
    setIsPdfLoading(true);
    try {
      await studentEnrollmentFormService.viewEnrollmentFormPdf(studentId);
    } catch (error) {
      toast.error('Failed to generate PDF');
    } finally {
      setIsPdfLoading(false);
    }
  };

  const handleDownloadPdf = async (studentId: string, studentName: string) => {
    setIsPdfLoading(true);
    try {
      await studentEnrollmentFormService.downloadEnrollmentFormPdf(studentId, studentName);
      toast.success('PDF opened for printing');
    } catch (error) {
      toast.error('Failed to generate PDF');
    } finally {
      setIsPdfLoading(false);
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'Approved':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'Rejected':
        return <Badge className="bg-red-100 text-red-700"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'Pending':
        return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700">Unknown</Badge>;
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl text-gray-900 mb-2">Student Enrollment Forms</h1>
        <p className="text-gray-600">Review and manage student enrollment form submissions</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-violet-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 mb-1">Total Submitted</p>
                  <p className="text-2xl font-bold text-violet-600">{stats.totalSubmitted}</p>
                </div>
                <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-violet-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 mb-1">Pending Review</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pendingCount}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 mb-1">Approved</p>
                  <p className="text-2xl font-bold text-green-600">{stats.approvedCount}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 mb-1">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">{stats.rejectedCount}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filter */}
      <Card className="border-violet-100">
        <CardContent className="p-6">
          <div className="grid grid-cols-[1fr_auto] gap-4">
            <div className="relative min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 w-full"
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
            <div className="w-[150px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Forms Table */}
      <Card className="border-violet-100">
        <CardHeader>
          <CardTitle>Enrollment Forms ({totalCount})</CardTitle>
          <CardDescription>Review submitted enrollment forms</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-violet-600 mx-auto" />
              <p className="mt-2 text-gray-500">Loading...</p>
            </div>
          ) : enrollmentForms.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No enrollment forms found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Course booking date</TableHead>
                      <TableHead>Individual/Company</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Enrollments</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollmentForms.map((form) => (
                      <TableRow key={form.studentId}>
                        <TableCell>{formatDate(form.submittedAt)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-600 rounded-lg flex items-center justify-center">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div className="font-medium text-gray-900">{form.fullName}</div>
                          </div>
                        </TableCell>
                        <TableCell>{form.email}</TableCell>
                        <TableCell>{form.phoneNumber || 'N/A'}</TableCell>
                        <TableCell>
                          {(() => {
                            const enrollments = studentEnrollments.get(form.studentId) ?? [];
                            const first = enrollments[0];
                            return enrollments.length === 0 ? '—' : enrollments.length === 1 ? first.courseName : `${enrollments.length} courses`;
                          })()}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const enrollments = studentEnrollments.get(form.studentId) ?? [];
                            const first = enrollments[0];
                            const dateSource = first?.selectedCourseDate ?? first?.enrolledAt;
                            return dateSource ? formatDate(dateSource) : '—';
                          })()}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const enrollments = studentEnrollments.get(form.studentId) ?? [];
                            const payments = studentPayments.get(form.studentId) ?? [];
                            const first = enrollments[0];
                            const payment = first ? payments.find(p => p.enrollmentId === first.enrollmentId) : undefined;
                            return first?.enrollmentType ?? payment?.accountType ?? '—';
                          })()}
                        </TableCell>
                        <TableCell>{getStatusBadge(form.status)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-blue-200 text-blue-700">
                            {form.enrollmentCount} course{form.enrollmentCount !== 1 ? 's' : ''}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewForm(form.studentId)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewPdf(form.studentId)}
                              disabled={isPdfLoading}
                              title="View PDF"
                            >
                              <FileText className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadPdf(form.studentId, form.fullName)}
                              disabled={isPdfLoading}
                              title="Print/Download PDF"
                            >
                              <Printer className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-600">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} results
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1 || loading}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages || loading}
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

      {/* View Form Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={(open) => { if (!open) { setViewDialogOpen(false); setSelectedForm(null); } }}>
        <DialogContent className="max-w-[min(2800px,99vw)] max-h-[90vh] w-[99vw] enrollment-form-dialog-content">
          <DialogHeader className="pb-4 border-b border-gray-200 flex-shrink-0">
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">Enrollment Form Details</DialogTitle>
            <DialogDescription className="text-base">
              Review the student's enrollment form submission
            </DialogDescription>
          </DialogHeader>
          
          {loadingForm ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
            </div>
          ) : selectedForm ? (
            <>
              {/* Status Banner - fixed, always visible */}
              <div className={`p-5 rounded-xl flex flex-col gap-4 flex-shrink-0 shadow-sm ${
                selectedForm.enrollmentFormStatus === 'Approved' ? 'bg-green-50 border border-green-200' :
                selectedForm.enrollmentFormStatus === 'Rejected' ? 'bg-red-50 border border-red-200' :
                'bg-yellow-50 border border-yellow-200'
              }`}>
                <div className="flex items-center gap-3">
                  {selectedForm.enrollmentFormStatus === 'Approved' ? <CheckCircle className="w-5 h-5 text-green-600" /> :
                   selectedForm.enrollmentFormStatus === 'Rejected' ? <XCircle className="w-5 h-5 text-red-600" /> :
                   <Clock className="w-5 h-5 text-yellow-600" />}
                  <div>
                    <div className="font-medium">Status: {selectedForm.enrollmentFormStatus}</div>
                    {selectedForm.enrollmentFormReviewedAt && (
                      <div className="text-sm text-gray-600">
                        Reviewed on {formatDate(selectedForm.enrollmentFormReviewedAt)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewPdf(selectedForm.studentId)}
                    disabled={isPdfLoading}
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    View PDF
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadPdf(selectedForm.studentId, selectedForm.studentName)}
                    disabled={isPdfLoading}
                  >
                    <Printer className="w-4 h-4 mr-1" />
                    Print
                  </Button>
                  {selectedForm.enrollmentFormStatus === 'Pending' && (
                    <>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleOpenReviewDialog('approve')}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleOpenReviewDialog('reject')}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <ScrollArea className="enrollment-form-scroll-area flex-1 min-h-0">
                <div className="space-y-6 pr-4 pb-4">
                  {/* Review Notes */}
                {selectedForm.enrollmentFormReviewNotes && (
                  <div className="p-5 rounded-xl bg-gray-50 border border-gray-200 shadow-sm">
                    <h4 className="font-medium mb-2">Review Notes</h4>
                    <p className="text-gray-600">{selectedForm.enrollmentFormReviewNotes}</p>
                  </div>
                )}

                <Tabs defaultValue="applicant" className="w-full">
                  <TabsList className="grid w-full grid-cols-5 h-12 p-1 rounded-xl bg-gray-100/80 border border-gray-200">
                    <TabsTrigger value="applicant" className="data-[state=active]:bg-violet-100 data-[state=active]:text-violet-700 data-[state=active]:border-violet-200 data-[state=active]:shadow-sm">Applicant</TabsTrigger>
                    <TabsTrigger value="usi" className="data-[state=active]:bg-violet-100 data-[state=active]:text-violet-700 data-[state=active]:border-violet-200 data-[state=active]:shadow-sm">USI</TabsTrigger>
                    <TabsTrigger value="education" className="data-[state=active]:bg-violet-100 data-[state=active]:text-violet-700 data-[state=active]:border-violet-200 data-[state=active]:shadow-sm">Education</TabsTrigger>
                    <TabsTrigger value="additional" className="data-[state=active]:bg-violet-100 data-[state=active]:text-violet-700 data-[state=active]:border-violet-200 data-[state=active]:shadow-sm">Additional</TabsTrigger>
                    <TabsTrigger value="declaration" className="data-[state=active]:bg-violet-100 data-[state=active]:text-violet-700 data-[state=active]:border-violet-200 data-[state=active]:shadow-sm">Declaration</TabsTrigger>
                  </TabsList>

                  <TabsContent value="applicant" className="mt-4 space-y-4">
                    <Card className="rounded-xl shadow-sm transition-shadow hover:shadow-md border-gray-100">
                      <CardHeader>
                        <CardTitle className="text-lg">Personal Details</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-5">
                        <div>
                          <Label className="text-gray-500 text-sm">Title</Label>
                          <p className="font-medium text-base text-gray-900 mt-0.5">{selectedForm.title || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-gray-500 text-sm">Full Name</Label>
                          <p className="font-medium text-base text-gray-900 mt-0.5">{`${selectedForm.givenName || ''} ${selectedForm.middleName || ''} ${selectedForm.surname || ''}`.trim() || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-gray-500 text-sm">Preferred Name</Label>
                          <p className="font-medium text-base text-gray-900 mt-0.5">{selectedForm.preferredName || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-gray-500 text-sm">Date of Birth</Label>
                          <p className="font-medium text-base text-gray-900 mt-0.5">{formatDate(selectedForm.dateOfBirth)}</p>
                        </div>
                        <div>
                          <Label className="text-gray-500 text-sm">Gender</Label>
                          <p className="font-medium text-base text-gray-900 mt-0.5">{selectedForm.gender || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-gray-500 text-sm">Email</Label>
                          <p className="font-medium text-base text-gray-900 mt-0.5">{selectedForm.email || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-gray-500 text-sm">Mobile</Label>
                          <p className="font-medium text-base text-gray-900 mt-0.5">{selectedForm.mobile || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-gray-500 text-sm">Home Phone</Label>
                          <p className="font-medium text-base text-gray-900 mt-0.5">{selectedForm.homePhone || 'N/A'}</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="rounded-xl shadow-sm transition-shadow hover:shadow-md border-gray-100">
                      <CardHeader>
                        <CardTitle className="text-lg">Residential Address</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="font-medium text-base text-gray-900">
                          {selectedForm.residentialAddress || 'N/A'}
                          {selectedForm.residentialSuburb && `, ${selectedForm.residentialSuburb}`}
                          {selectedForm.residentialState && ` ${selectedForm.residentialState}`}
                          {selectedForm.residentialPostcode && ` ${selectedForm.residentialPostcode}`}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="rounded-xl shadow-sm transition-shadow hover:shadow-md border-gray-100">
                      <CardHeader>
                        <CardTitle className="text-lg">Emergency Contact</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-5">
                        <div>
                          <Label className="text-gray-500 text-sm">Name</Label>
                          <p className="font-medium text-base text-gray-900 mt-0.5">{selectedForm.emergencyContactName || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-gray-500 text-sm">Relationship</Label>
                          <p className="font-medium text-base text-gray-900 mt-0.5">{selectedForm.emergencyContactRelationship || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-gray-500 text-sm">Phone</Label>
                          <p className="font-medium text-base text-gray-900 mt-0.5">{selectedForm.emergencyContactNumber || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-gray-500 text-sm">Emergency Permission</Label>
                          <p className="font-medium text-base text-gray-900 mt-0.5">{selectedForm.emergencyPermission || 'N/A'}</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="rounded-xl shadow-sm transition-shadow hover:shadow-md border-gray-100 overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <User className="w-5 h-5 text-violet-600" />
                          Photo and ID Card
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-8 pt-6">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-gray-600 text-sm font-medium">Primary Photo ID</Label>
                            {selectedForm.primaryIdDocumentUrl && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-violet-600 hover:text-violet-700 h-8"
                                onClick={() => window.open(selectedForm.primaryIdDocumentUrl!, '_blank')}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View full size
                              </Button>
                            )}
                          </div>
                          <div className="relative min-h-[360px] rounded-xl border-2 border-gray-200 bg-gradient-to-br from-slate-50 to-gray-100/80 p-4 flex items-center justify-center overflow-auto shadow-inner">
                            {selectedForm.primaryIdDocumentUrl ? (
                              /\.(pdf)$/i.test(selectedForm.primaryIdDocumentUrl) ? (
                                <iframe
                                  src={selectedForm.primaryIdDocumentUrl}
                                  className="w-full min-h-[400px] flex-1 border-0 rounded-lg shadow-sm"
                                  title="Primary Photo ID"
                                />
                              ) : (
                                <img
                                  src={selectedForm.primaryIdDocumentUrl}
                                  alt="Primary Photo ID"
                                  className="max-w-full w-auto max-h-[480px] object-contain rounded-lg shadow-md"
                                />
                              )
                            ) : (
                              <p className="font-medium text-base text-gray-500">N/A</p>
                            )}
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-gray-600 text-sm font-medium">Photo</Label>
                            {selectedForm.secondaryIdDocumentUrl && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-violet-600 hover:text-violet-700 h-8"
                                onClick={() => window.open(selectedForm.secondaryIdDocumentUrl!, '_blank')}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View full size
                              </Button>
                            )}
                          </div>
                          <div className="relative min-h-[360px] rounded-xl border-2 border-gray-200 bg-gradient-to-br from-slate-50 to-gray-100/80 p-4 flex items-center justify-center overflow-auto shadow-inner">
                            {selectedForm.secondaryIdDocumentUrl ? (
                              /\.(pdf)$/i.test(selectedForm.secondaryIdDocumentUrl) ? (
                                <iframe
                                  src={selectedForm.secondaryIdDocumentUrl}
                                  className="w-full min-h-[400px] flex-1 border-0 rounded-lg shadow-sm"
                                  title="Photo"
                                />
                              ) : (
                                <img
                                  src={selectedForm.secondaryIdDocumentUrl}
                                  alt="Photo"
                                  className="max-w-full w-auto max-h-[480px] object-contain rounded-lg shadow-md"
                                />
                              )
                            ) : (
                              <p className="font-medium text-base text-gray-500">N/A</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="usi" className="mt-4 space-y-4">
                    <Card className="rounded-xl shadow-sm transition-shadow hover:shadow-md border-gray-100">
                      <CardHeader>
                        <CardTitle className="text-lg">USI Details</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-5">
                        <div>
                          <Label className="text-gray-500 text-sm">USI</Label>
                          <p className="font-medium text-base text-gray-900 mt-0.5">{selectedForm.usi || 'Not provided'}</p>
                        </div>
                        <div>
                          <Label className="text-gray-500 text-sm">Apply through STA</Label>
                          <p className="font-medium text-base text-gray-900 mt-0.5">{selectedForm.usiApplyThroughSTA || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-gray-500 text-sm">USI Access Permission</Label>
                          <p className="font-medium text-base text-gray-900 mt-0.5">{selectedForm.usiAccessPermission ? 'Yes' : 'No'}</p>
                        </div>
                        <div>
                          <Label className="text-gray-500 text-sm">Town/City of Birth</Label>
                          <p className="font-medium text-base text-gray-900 mt-0.5">{selectedForm.townCityOfBirth || 'N/A'}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="education" className="mt-4 space-y-4">
                    <Card className="rounded-xl shadow-sm transition-shadow hover:shadow-md border-gray-100">
                      <CardHeader>
                        <CardTitle className="text-lg">Prior Education</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-5">
                        <div>
                          <Label className="text-gray-500 text-sm">School Level</Label>
                          <p className="font-medium text-base text-gray-900 mt-0.5">{selectedForm.schoolLevel || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-gray-500 text-sm">Year Completed</Label>
                          <p className="font-medium text-base text-gray-900 mt-0.5">{selectedForm.schoolCompleteYear || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-gray-500 text-sm">School Name</Label>
                          <p className="font-medium text-base text-gray-900 mt-0.5">{selectedForm.schoolName || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-gray-500 text-sm">School Location</Label>
                          <p className="font-medium text-base text-gray-900 mt-0.5">
                            {selectedForm.schoolInAustralia 
                              ? `${selectedForm.schoolState || ''} ${selectedForm.schoolPostcode || ''}`.trim() || 'Australia'
                              : selectedForm.schoolCountry || 'Overseas'}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="rounded-xl shadow-sm transition-shadow hover:shadow-md border-gray-100">
                      <CardHeader>
                        <CardTitle className="text-lg">Employment</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-5">
                        <div>
                          <Label className="text-gray-500 text-sm">Employment Status</Label>
                          <p className="font-medium text-base text-gray-900 mt-0.5">{selectedForm.employmentStatus || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-gray-500 text-sm">Employer</Label>
                          <p className="font-medium text-base text-gray-900 mt-0.5">{selectedForm.employerName || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-gray-500 text-sm">Training Reason</Label>
                          <p className="font-medium text-base text-gray-900 mt-0.5">{selectedForm.trainingReason || 'N/A'}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="additional" className="mt-4 space-y-4">
                    <Card className="rounded-xl shadow-sm transition-shadow hover:shadow-md border-gray-100">
                      <CardHeader>
                        <CardTitle className="text-lg">Additional Information</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-5">
                        <div>
                          <Label className="text-gray-500 text-sm">Country of Birth</Label>
                          <p className="font-medium text-base text-gray-900 mt-0.5">{selectedForm.countryOfBirth || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-gray-500 text-sm">Speaks Other Language</Label>
                          <p className="font-medium text-base text-gray-900 mt-0.5">{selectedForm.speaksOtherLanguage || 'N/A'}</p>
                        </div>
                        {selectedForm.speaksOtherLanguage === 'Yes' && (
                          <div>
                            <Label className="text-gray-500 text-sm">Home Language</Label>
                            <p className="font-medium text-base text-gray-900 mt-0.5">{selectedForm.homeLanguage || 'N/A'}</p>
                          </div>
                        )}
                        <div>
                          <Label className="text-gray-500 text-sm">Indigenous Status</Label>
                          <p className="font-medium text-base text-gray-900 mt-0.5">{selectedForm.indigenousStatus || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-gray-500 text-sm">Has Disability</Label>
                          <p className="font-medium text-base text-gray-900 mt-0.5">{selectedForm.hasDisability || 'N/A'}</p>
                        </div>
                        {selectedForm.hasDisability === 'Yes' && selectedForm.disabilityTypes && (
                          <div className="col-span-2 md:col-span-3">
                            <Label className="text-gray-500 text-sm">Disability Types</Label>
                            <p className="font-medium text-base text-gray-900 mt-0.5">{selectedForm.disabilityTypes.join(', ')}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="declaration" className="mt-4 space-y-4">
                    <Card className="rounded-xl shadow-sm transition-shadow hover:shadow-md border-gray-100">
                      <CardHeader>
                        <CardTitle className="text-lg">Declaration & Signature</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                          <div>
                            <Label className="text-gray-500 text-sm">Privacy Notice Accepted</Label>
                            <p className="font-medium text-base text-gray-900 mt-0.5">{selectedForm.acceptedPrivacyNotice ? 'Yes' : 'No'}</p>
                          </div>
                          <div>
                            <Label className="text-gray-500 text-sm">Terms Accepted</Label>
                            <p className="font-medium text-base text-gray-900 mt-0.5">{selectedForm.acceptedTermsAndConditions ? 'Yes' : 'No'}</p>
                          </div>
                          <div>
                            <Label className="text-gray-500 text-sm">Declaration Name</Label>
                            <p className="font-medium text-base text-gray-900 mt-0.5">{selectedForm.declarationName || 'N/A'}</p>
                          </div>
                          <div>
                            <Label className="text-gray-500 text-sm">Declaration Date</Label>
                            <p className="font-medium text-base text-gray-900 mt-0.5">{formatDate(selectedForm.declarationDate)}</p>
                          </div>
                        </div>
                        {selectedForm.signatureData && (
                          <div>
                            <Label className="text-gray-500 text-sm">Signature</Label>
                            <div className="mt-2 border rounded-lg p-4 bg-white">
                              <img 
                                src={selectedForm.signatureData} 
                                alt="Signature" 
                                className="max-h-24"
                              />
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? 'Approve Enrollment Form' : 'Reject Enrollment Form'}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === 'approve' 
                ? 'Are you sure you want to approve this enrollment form?' 
                : 'Please provide a reason for rejecting this enrollment form.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reviewNotes">
                Review Notes {reviewAction === 'reject' && <span className="text-red-500">*</span>}
              </Label>
              <Textarea
                id="reviewNotes"
                placeholder={reviewAction === 'reject' ? 'Please explain why the form is being rejected...' : 'Optional notes...'}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setReviewDialogOpen(false)}
                disabled={isReviewing}
              >
                Cancel
              </Button>
              <Button
                className={`flex-1 ${reviewAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                onClick={handleReviewSubmit}
                disabled={isReviewing || (reviewAction === 'reject' && !reviewNotes.trim())}
              >
                {isReviewing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {reviewAction === 'approve' ? <CheckCircle className="w-4 h-4 mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                    {reviewAction === 'approve' ? 'Approve' : 'Reject'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
