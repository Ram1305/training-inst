import { useEffect, useState, useCallback } from 'react';
import { Users, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import {
  companyManagementService,
  type CompanyPortalEnrollmentRow,
  type CompanyResponse,
} from '../../services/companyManagement.service';
import { CompanyBillingPaymentsPanel } from './CompanyBillingPaymentsPanel';

interface CompanyStudentsEnrolledProps {
  companyId?: string | null;
  company?: CompanyResponse | null;
  onCompanyUpdated?: (company: CompanyResponse) => void;
}

export function CompanyStudentsEnrolled({ companyId, company, onCompanyUpdated }: CompanyStudentsEnrolledProps) {
  const [rows, setRows] = useState<CompanyPortalEnrollmentRow[]>([]);
  const [loading, setLoading] = useState(false);

  const loadEnrolments = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const res = await companyManagementService.getPortalEnrollments(companyId);
      if (res.success && res.data?.items) setRows(res.data.items);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    loadEnrolments();
  }, [loadEnrolments]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
          Students enrolled
        </h1>
        <p className="text-gray-600">
          Staff progress (LLND, enrolment form, training). Each pay-later enrolment appears in Pay outstanding training
          fees below (one line per course) so you can select and use Pay selected / card or bank transfer.
        </p>
      </div>

      <Card className="border-violet-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Enrolments
          </CardTitle>
          <CardDescription>Company-scoped students and courses (portal and bulk-order links).</CardDescription>
        </CardHeader>
        <CardContent>
          {!companyId ? (
            <p className="text-gray-600">Loading company…</p>
          ) : loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No company enrolments yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>LLND</TableHead>
                  <TableHead>Form</TableHead>
                  <TableHead>Training</TableHead>
                  <TableHead>Enrolled</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.enrollmentId}>
                    <TableCell>
                      <div className="font-medium">{r.studentName}</div>
                      <div className="text-xs text-gray-500">{r.studentEmail ?? '—'}</div>
                      {r.studentPhone ? <div className="text-xs text-gray-500">{r.studentPhone}</div> : null}
                    </TableCell>
                    <TableCell>{r.courseName}</TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums text-sm">
                      {new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(r.amountPaid ?? 0)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-normal">
                        {r.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          r.llnAssessmentCompleted
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800 text-xs'
                            : 'border-amber-200 bg-amber-50 text-amber-800 text-xs'
                        }
                      >
                        {r.llnAssessmentCompleted ? 'Completed' : 'Not completed'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          r.enrollmentFormCompleted
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800 text-xs'
                            : 'border-gray-200 bg-gray-50 text-gray-600 text-xs'
                        }
                      >
                        {r.enrollmentFormCompleted ? 'Submitted' : 'Not submitted'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline">{r.status}</Badge>
                        {r.completedAt ? (
                          <span className="text-xs text-gray-500">
                            Done {new Date(r.completedAt).toLocaleDateString('en-AU')}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">Not marked complete</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {new Date(r.enrolledAt).toLocaleString('en-AU')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CompanyBillingPaymentsPanel
        companyId={companyId ?? undefined}
        company={company ?? undefined}
        onCompanyUpdated={onCompanyUpdated}
        cardTitle="Pay outstanding training fees"
        cardDescription="Same list as the Payments tab. Tick lines with a balance, Pay selected, then card or bank. Use Refresh after a payment if totals do not update. Bank transfer is marked paid after we verify your receipt in admin."
        onStatementsChanged={loadEnrolments}
      />
    </div>
  );
}
