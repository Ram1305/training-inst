import { useState, useEffect } from 'react';
import {
  DollarSign,
  Search,
  Download,
  Building2,
  CheckCircle,
  X,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { toast } from 'sonner';
import {
  adminPaymentService,
  type AdminPaymentProof,
} from '../../services/adminPayment.service';
import { companyManagementService, type CompanyResponse } from '../../services/companyManagement.service';

export function AdminCompanyPayments() {
  const [payments, setPayments] = useState<AdminPaymentProof[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState<string>('');
  const [companies, setCompanies] = useState<CompanyResponse[]>([]);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(amount);
  };

  const fetchCompanies = async () => {
    try {
      const res = await companyManagementService.getAllCompanies({ pageSize: 500 });
      if (res.success && res.data?.companies) {
        setCompanies(res.data.companies);
      }
    } catch {
      // Non-blocking; company filter will be empty
    }
  };

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await adminPaymentService.getCompanyPayments({
        pageNumber: 1,
        pageSize: 200,
        searchQuery: searchQuery || undefined,
        companyId: companyFilter || undefined,
      });
      if (response.success && response.data?.paymentProofs) {
        setPayments(response.data.paymentProofs);
      } else {
        setPayments([]);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load company payments');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [searchQuery, companyFilter]);

  const handleVerify = async (payment: AdminPaymentProof) => {
    setVerifyingId(payment.paymentProofId);
    try {
      const res = await adminPaymentService.verifyPayment(payment.paymentProofId);
      if (res.success) {
        toast.success('Payment verified successfully');
        fetchPayments();
      } else {
        toast.error(res.message || 'Failed to verify payment');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to verify payment');
    } finally {
      setVerifyingId(null);
    }
  };

  const filteredPayments = payments;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-gray-900 mb-2">Company Payments</h1>
        <p className="text-gray-600">View and manage payments made by company accounts</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>Filter by company or search</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by student, course..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchPayments()}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 min-w-[180px]"
            >
              <option value="">All Companies</option>
              {companies.map((c) => (
                <option key={c.companyId} value={c.companyId}>
                  {c.companyName}
                </option>
              ))}
            </select>
            <Button onClick={fetchPayments} variant="outline">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Company Payment History ({filteredPayments.length})</CardTitle>
          <CardDescription>Payments made by company accounts for enrollments</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
            </div>
          ) : (
            <>
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment) => (
                      <TableRow key={payment.paymentProofId}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-medium text-gray-900">
                              {payment.companyName || '—'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{payment.studentName || payment.studentEmail || '—'}</div>
                            {payment.studentEmail && payment.studentName && (
                              <div className="text-xs text-gray-500">{payment.studentEmail}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{payment.courseName}</div>
                            {payment.transactionId && (
                              <div className="text-xs text-gray-500 font-mono">{payment.transactionId}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">{formatCurrency(payment.amountPaid)}</TableCell>
                        <TableCell>{formatDate(payment.paymentDate)}</TableCell>
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
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="outline" asChild>
                              <a
                                href={adminPaymentService.getReceiptDownloadUrl(payment.paymentProofId)}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Download receipt"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </Button>
                            {payment.status !== 'Verified' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleVerify(payment)}
                                disabled={verifyingId === payment.paymentProofId}
                                title="Verify payment"
                              >
                                {verifyingId === payment.paymentProofId ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredPayments.length === 0 && (
                <div className="text-center py-12">
                  <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No company payments found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Payments made by company accounts will appear here
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
