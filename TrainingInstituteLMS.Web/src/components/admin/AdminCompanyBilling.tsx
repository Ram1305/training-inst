import { useEffect, useState } from 'react';
import { Building2, Loader2, Search, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
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

export function AdminCompanyBilling() {
  const [items, setItems] = useState<CompanyBillingStatementListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CompanyBillingStatementDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [payRef, setPayRef] = useState('');

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
    load();
  }, [statusFilter]);

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
        paymentMethod: status === 'Paid' ? 'admin_marked_paid' : undefined,
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
          Company daily billing
        </h1>
        <p className="text-gray-600">
          Sydney calendar day statements for company portal enrolments. Approve, then mark paid when the company has
          paid.
        </p>
      </div>

      <Card className="border-violet-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Statements ({totalCount})
          </CardTitle>
          <CardDescription>Draft → Approve → Paid</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
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
              <option value="Draft">Draft</option>
              <option value="Approved">Approved</option>
              <option value="Paid">Paid</option>
            </select>
            <Button type="button" variant="secondary" onClick={() => load()}>
              Search
            </Button>
          </div>
          <Input
            placeholder="Default payment reference when using Mark paid in the table"
            value={payRef}
            onChange={(e) => setPayRef(e.target.value)}
            className="max-w-md"
          />

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
                      <Badge variant={row.status === 'Paid' ? 'default' : 'secondary'}>{row.status}</Badge>
                    </TableCell>
                    <TableCell>{row.lineCount}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(row.totalAmount)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => setDetailId(row.statementId)}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      {row.status === 'Draft' && (
                        <Button
                          type="button"
                          size="sm"
                          disabled={updatingId === row.statementId}
                          onClick={() => patchStatus(row.statementId, 'Approved')}
                        >
                          Approve
                        </Button>
                      )}
                      {(row.status === 'Draft' || row.status === 'Approved') && (
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
