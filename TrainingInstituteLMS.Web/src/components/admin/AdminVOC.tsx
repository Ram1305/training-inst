import { useState, useEffect } from 'react';
import { API_CONFIG } from '../../config/api.config';
import {
  Users,
  Search,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  X,
  Clock,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Filter,
  MoreVertical,
  Download,
  Shield,
  BookOpen,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select';
import { toast } from 'sonner';
import { vocManagementService, type VOCSubmissionResponse } from '../../services/vocManagement.service';
import { format } from 'date-fns';

export function AdminVOC() {
  const [submissions, setSubmissions] = useState<VOCSubmissionResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<VOCSubmissionResponse | null>(null);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const response = await vocManagementService.getAllSubmissions({
        pageNumber: currentPage,
        pageSize: pageSize,
        searchQuery: searchQuery || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });

      if (response.success) {
        setSubmissions(response.data.submissions);
        setTotalCount(response.data.totalCount);
      }
    } catch (error) {
      toast.error('Failed to fetch VOC submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [currentPage, statusFilter]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const response = await vocManagementService.updateStatus(id, newStatus);
      if (response.success) {
        toast.success(`Status updated to ${newStatus}`);
        fetchSubmissions();
        if (selectedSubmission?.submissionId === id) {
          setSelectedSubmission(response.data);
        }
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this submission?')) return;
    try {
      const response = await vocManagementService.deleteSubmission(id);
      if (response.success) {
        toast.success('Submission deleted');
        fetchSubmissions();
      }
    } catch (error) {
      toast.error('Failed to delete submission');
    }
  };

  const openDetails = (submission: VOCSubmissionResponse) => {
    setSelectedSubmission(submission);
    setDetailsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">Verified</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200">Completed</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200">Rejected</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200">Pending</Badge>;
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">VOC Submissions</h1>
          <p className="text-slate-600">Review and manage Verification of Competency course renewals</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-violet-100 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name, email or Student ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchSubmissions()}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Verified">Verified</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={fetchSubmissions} variant="outline" className="border-violet-200 text-violet-700 hover:bg-violet-50">
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submissions Table */}
      <Card className="border-slate-100 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Submission Date</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead>ID Number</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Preferred Start</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex items-center justify-center gap-2 text-slate-500">
                    <Clock className="w-5 h-5 animate-spin" />
                    Loading submissions...
                  </div>
                </TableCell>
              </TableRow>
            ) : submissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-slate-500">
                  No VOC submissions found.
                </TableCell>
              </TableRow>
            ) : (
              submissions.map((s) => (
                <TableRow key={s.submissionId} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-medium">
                    {format(new Date(s.createdAt), 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-slate-900">{s.firstName} {s.lastName}</div>
                    <div className="text-xs text-slate-500">{s.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">{s.australianStudentId}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{s.phone}</div>
                    <div className="text-xs text-slate-500">{s.city}, {s.state}</div>
                  </TableCell>
                  <TableCell>
                    {s.preferredStartDate ? (
                      <div>
                        <div className="text-sm font-medium">{format(new Date(s.preferredStartDate), 'dd MMM yyyy')}</div>
                        <div className="text-xs text-slate-500 capitalize">{s.preferredTime} session</div>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(s.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openDetails(s)}>
                        <Eye className="w-4 h-4 text-slate-600" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(s.submissionId)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between bg-slate-50/30">
            <div className="text-sm text-slate-500">
              Showing {submissions.length} of {totalCount} records
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>VOC Submission Details</DialogTitle>
            <DialogDescription>
              Detailed information for {selectedSubmission?.firstName} {selectedSubmission?.lastName}
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-bold uppercase text-slate-400">Student ID</div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-500" />
                    <span className="font-mono font-bold">{selectedSubmission.australianStudentId}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold uppercase text-slate-400">Current Status</div>
                  <div>{getStatusBadge(selectedSubmission.status)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 border-b pb-1">Contact Info</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Mail className="w-4 h-4" /> {selectedSubmission.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Phone className="w-4 h-4" /> {selectedSubmission.phone}
                    </div>
                    <div className="flex items-start gap-2 text-sm text-slate-600">
                      <MapPin className="w-4 h-4 mt-0.5" />
                      <div>
                        {selectedSubmission.streetAddress}<br />
                        {selectedSubmission.city}, {selectedSubmission.state} {selectedSubmission.postcode}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 border-b pb-1">Booking Info</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="w-4 h-4" />
                      {selectedSubmission.preferredStartDate ? format(new Date(selectedSubmission.preferredStartDate), 'PPP') : 'No date selected'}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Clock className="w-4 h-4" />
                      <span className="capitalize">{selectedSubmission.preferredTime || 'No time selected'} session</span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedSubmission.comments && (
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase text-slate-400">Comments</div>
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm text-slate-700 italic">
                    "{selectedSubmission.comments}"
                  </div>
                </div>
              )}

              {/* Selected Courses */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 border-b pb-1 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-violet-500" /> Selected Courses
                </h4>
                <div className="grid gap-2">
                  {selectedSubmission.selectedCoursesJson ? (
                    (() => {
                      try {
                        const courses = JSON.parse(selectedSubmission.selectedCoursesJson);
                        return Array.isArray(courses) ? courses.map((c: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                            <div className="flex flex-col">
                              <span className="font-semibold text-sm">{c.courseName}</span>
                              {c.courseDateDisplay && <span className="text-[10px] text-slate-500 font-medium">{c.courseDateDisplay}</span>}
                            </div>
                            <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2 py-1 rounded">${c.price}</span>
                          </div>
                        )) : <div className="text-slate-400 italic">No courses listed</div>;
                      } catch {
                        return <div className="text-red-400 italic">Error parsing course data</div>;
                      }
                    })()
                  ) : (
                    <div className="text-slate-400 italic text-sm">No courses selected</div>
                  )}
                </div>
              </div>

              {/* Payment Summary */}
              <div className="p-4 bg-slate-900 rounded-xl text-white">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Payment Information</div>
                  <Badge className={selectedSubmission.paymentMethod === 'CreditCard' ? "bg-green-500" : "bg-indigo-500"}>
                    {selectedSubmission.paymentMethod || 'N/A'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Total Amount</p>
                    <p className="text-xl font-black text-cyan-400">${selectedSubmission.totalAmount?.toFixed(2) || '0.00'}</p>
                  </div>
                  {selectedSubmission.transactionId && (
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Transaction ID</p>
                      <p className="text-xs font-mono text-slate-300 truncate">{selectedSubmission.transactionId}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Proof */}
              {selectedSubmission.paymentProofPath && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 border-b pb-1 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-violet-500" /> Payment Receipt
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden group relative bg-slate-50">
                    <img
                      src={API_CONFIG.BASE_URL.replace('/api', '') + selectedSubmission.paymentProofPath}
                      alt="Payment Proof"
                      className="w-full h-auto max-h-60 object-contain cursor-pointer transition-all group-hover:scale-[1.02]"
                      onClick={() => window.open(API_CONFIG.BASE_URL.replace('/api', '') + selectedSubmission.paymentProofPath, '_blank')}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <Button
                         variant="secondary"
                         size="sm"
                         className="gap-2"
                         onClick={() => window.open(API_CONFIG.BASE_URL.replace('/api', '') + selectedSubmission.paymentProofPath, '_blank')}
                       >
                         <Eye className="w-4 h-4" /> View Full Image
                       </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleUpdateStatus(selectedSubmission.submissionId, 'Verified')}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" /> Mark Verified
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUpdateStatus(selectedSubmission.submissionId, 'Completed')}
                  >
                    Mark Completed
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleUpdateStatus(selectedSubmission.submissionId, 'Rejected')}
                  >
                    <XCircle className="w-4 h-4 mr-2" /> Reject
                  </Button>
                </div>
                <Button variant="ghost" onClick={() => setDetailsDialogOpen(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
