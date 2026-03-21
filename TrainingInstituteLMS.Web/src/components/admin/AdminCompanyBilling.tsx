import { useEffect, useState } from 'react';
import { Building2, Loader2, Search, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { toast } from 'sonner';
import {
  adminCompanyBillingService,
  type CompanyBillingStatementListItem,
  type CompanyBillingStatementDetail,
} from '../../services/adminCompanyBilling.service';
import { companyManagementService, type CompanyResponse } from '../../services/companyManagement.service';

export function AdminCompanyBilling() {
  const [items, setItems] = useState<CompanyBillingStatementListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [companyIdFilter, setCompanyIdFilter] = useState('');
  const [companies, setCompanies] = useState<CompanyResponse[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CompanyBillingStatementDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [payRef, setPayRef] = useState('');
  const [markPaidPaymentMethod, setMarkPaidPaymentMethod] = useState('bank_transfer');
  const [enrollmentIdToComplete, setEnrollmentIdToComplete] = useState('');
  const [recordingComplete, setRecordingComplete] = useState(false);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(n);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminCompanyBillingService.getStatements({
        page: 1,
        pageSize: 100,
        status: statusFilter || undefined,
        search: searchQuery.trim() || undefined,
        companyId: companyIdFilter || undefined,
      });
      if (res.success && res.data) {
        setItems(res.data.items);
        setTotalCount(res.data.totalCount);
      } else {
        toast.error(res.message || 'Failed to load statements');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await companyManagementService.getAllCompanies({ pageNumber: 1, pageSize: 500 });
        if (!cancelled && res.success && res.data?.companies) setCompanies(res.data.companies);
      } catch {
        /* dropdown optional */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    load();
  }, [statusFilter, companyIdFilter]);

  useEffect(() => {
    if (!detailId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setDetailLoading(true);
      try {
        const res = await adminCompanyBillingService.getStatementById(detailId);
        if (!cancelled && res.success && res.data) setDetail(res.data);
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [detailId]);

  const patchStatus = async (statementId: string, status: string, extra?: { paymentReference?: string }) => {
    setUpdatingId(statementId);
    try {
      const res = await adminCompanyBillingService.updateStatement(statementId, {
        status,
        paymentReference: extra?.paymentReference,
        paymentMethod: status === 'Paid' ? markPaidPaymentMethod : undefined,
      });
      if (res.success) {
        toast.success('Updated');
        await load();
        if (detailId === statementId) {
          const d = await adminCompanyBillingService.getStatementById(statementId);
          if (d.success && d.data) setDetail(d.data);
        }
      } else {
        toast.error(res.message || 'Update failed');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const canMarkPaid = (status: string) =>
    status === 'Draft' || status === 'Approved' || status === 'Unpaid' || status === 'PartiallyPaid';

  const recordTrainingComplete = async () => {
    const id = enrollmentIdToComplete.trim();
    if (!id) {
      toast.error('Paste an enrollment ID (from enrolment records or the company enrolments list).');
      return;
    }
    setRecordingComplete(true);
    try {
      const res = await adminCompanyBillingService.recordPortalTrainingComplete(id);
      if (res.success) {
        toast.success(res.message || 'Recorded complete; bill created if not already present.');
        setEnrollmentIdToComplete('');
        await load();
      } else {
        toast.error(res.message || 'Could not record completion');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not record completion');
    } finally {
      setRecordingComplete(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
          Company billing
        </h1>
        <p className="text-gray-600">
          Bills are raised when training is marked complete for a company portal enrolment. Card payments are marked paid
          automatically; for bank transfer, use <strong>Mark paid</strong> after you verify the deposit. There is no
          separate approve step for companies.
        </p>
      </div>

      <Card className="border-violet-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Statements ({totalCount})
          </CardTitle>
          <CardDescription>Unpaid lines: mark paid when payment is confirmed. Choose how payment was received below.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex flex-col gap-1 min-w-[200px] flex-1">
              <label className="text-xs text-gray-500">Company</label>
              <select
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={companyIdFilter}
                onChange={(e) => setCompanyIdFilter(e.target.value)}
              >
                <option value="">All companies</option>
                {companies.map((c) => (
                  <option key={c.companyId} value={c.companyId}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search company or email..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && load()}
              />
            </div>
            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="Unpaid">Unpaid</option>
              <option value="PartiallyPaid">Partially paid</option>
              <option value="Paid">Paid</option>
              <option value="Draft">Draft (legacy)</option>
            </select>
            <Button type="button" variant="secondary" onClick={() => load()}>
              Search
            </Button>
          </div>
          <div className="flex flex-wrap items-end gap-4 max-w-2xl">
            <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
              <Label className="text-xs text-gray-500">Recorded payment method (when you click Mark paid)</Label>
              <select
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={markPaidPaymentMethod}
                onChange={(e) => setMarkPaidPaymentMethod(e.target.value)}
              >
                <option value="bank_transfer">Bank transfer (verified)</option>
                <option value="credit_card">Credit card (manual record)</option>
                <option value="admin_adjustment">Admin adjustment / other</option>
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label className="text-xs text-gray-500">Default reference / note (optional)</Label>
              <Input
                placeholder="e.g. receipt #, submission id"
                value={payRef}
                onChange={(e) => setPayRef(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date (Sydney)</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Lines</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((row) => (
                  <TableRow key={row.statementId}>
                    <TableCell>{row.sydneyBillingDate}</TableCell>
                    <TableCell>
                      <div className="font-medium">{row.companyName}</div>
                    </TableCell>
                    <TableCell>
                      {row.lineCount === 1 && row.primaryStudentName ? row.primaryStudentName : '—'}
                    </TableCell>
                    <TableCell>
                      {row.lineCount === 1 && row.primaryCourseName ? row.primaryCourseName : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.status === 'Paid' ? 'default' : 'secondary'}>{row.status}</Badge>
                    </TableCell>
                    <TableCell>{row.lineCount}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(row.totalAmount)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => setDetailId(row.statementId)}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      {canMarkPaid(row.status) && (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={updatingId === row.statementId}
                          onClick={() =>
                            patchStatus(row.statementId, 'Paid', {
                              paymentReference: payRef.trim() || undefined,
                            })
                          }
                        >
                          Mark paid
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="border-violet-100">
        <CardHeader>
          <CardTitle className="text-base">Record training complete (portal)</CardTitle>
          <CardDescription>
            When a staff member finishes training, paste their enrollment ID here to mark the course complete and
            create an Unpaid per-course bill (permanent company portal link only).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 items-center">
          <Input
            placeholder="Enrollment GUID"
            value={enrollmentIdToComplete}
            onChange={(e) => setEnrollmentIdToComplete(e.target.value)}
            className="max-w-xl font-mono text-sm"
          />
          <Button type="button" disabled={recordingComplete} onClick={() => recordTrainingComplete()}>
            {recordingComplete ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Record complete and bill'}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={!!detailId} onOpenChange={(o) => !o && setDetailId(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Statement detail</DialogTitle>
            <DialogDescription>
              {detail && (
                <>
                  {detail.companyName} — {detail.sydneyBillingDate} — {detail.status}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {detailLoading || !detail ? (
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          ) : (
            <div className="space-y-4">
              <p className="text-lg font-semibold">{formatCurrency(detail.totalAmount)}</p>
              <p className="text-sm text-gray-600">
                Use &quot;Record training complete&quot; above with the enrollment GUID when a course is finished so an
                Unpaid line appears here. When the company pays by bank transfer, verify the deposit then use{' '}
                <strong>Mark paid</strong> in the table above (choose payment method and reference first).
              </p>
              {detail && canMarkPaid(detail.status) && (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={updatingId === detail.statementId}
                    onClick={() =>
                      patchStatus(detail.statementId, 'Paid', {
                        paymentReference: payRef.trim() || undefined,
                      })
                    }
                  >
                    Mark this statement paid
                  </Button>
                  <span className="text-xs text-gray-500">
                    Uses &quot;Recorded payment method&quot; and reference from the filters above.
                  </span>
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Enrolled</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.lines.map((l) => (
                    <TableRow key={l.lineId}>
                      <TableCell>
                        <div>{l.studentName}</div>
                        <div className="text-xs text-gray-500">{l.studentEmail}</div>
                      </TableCell>
                      <TableCell>{l.courseName}</TableCell>
                      <TableCell>{new Date(l.enrolledAt).toLocaleString('en-AU')}</TableCell>
                      <TableCell className="text-right">{formatCurrency(l.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
