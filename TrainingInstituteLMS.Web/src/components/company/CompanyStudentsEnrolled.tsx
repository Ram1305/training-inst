import { useEffect, useState } from 'react';
import { Users, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { companyManagementService, type CompanyPortalEnrollmentRow } from '../../services/companyManagement.service';

interface CompanyStudentsEnrolledProps {
  companyId?: string | null;
}

export function CompanyStudentsEnrolled({ companyId }: CompanyStudentsEnrolledProps) {
  const [rows, setRows] = useState<CompanyPortalEnrollmentRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await companyManagementService.getPortalEnrollments(companyId);
        if (!cancelled && res.success && res.data?.items) setRows(res.data.items);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
          Students enrolled
        </h1>
        <p className="text-gray-600">
          Staff who enrolled using your company links, with the course they selected.
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
                  <TableHead>Enrolled</TableHead>
                  <TableHead>Training</TableHead>
                  <TableHead>Bill</TableHead>
                  <TableHead>Enrolment ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.enrollmentId}>
                    <TableCell>
                      <div className="font-medium">{r.studentName}</div>
                      <div className="text-xs text-gray-500">{r.studentEmail ?? '—'}</div>
                    </TableCell>
                    <TableCell>{r.courseName}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {new Date(r.enrolledAt).toLocaleString('en-AU')}
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
                    <TableCell>
                      {r.hasCompanyBill ? (
                        <Badge variant={r.companyBillStatus === 'Paid' ? 'default' : 'secondary'}>
                          {r.companyBillStatus ?? '—'}
                        </Badge>
                      ) : (
                        <span className="text-sm text-gray-500">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-gray-600 break-all" title={r.enrollmentId}>
                        {r.enrollmentId}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
