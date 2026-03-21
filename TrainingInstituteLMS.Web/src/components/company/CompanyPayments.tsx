import { useEffect, useState } from 'react';
import { DollarSign, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { companyManagementService } from '../../services/companyManagement.service';
import type { CompanyBillingStatementListItem } from '../../services/adminCompanyBilling.service';

interface CompanyPaymentsProps {
  companyId?: string;
}

export function CompanyPayments({ companyId }: CompanyPaymentsProps) {
  const [items, setItems] = useState<CompanyBillingStatementListItem[]>([]);
  const [loading, setLoading] = useState(false);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(n);

  useEffect(() => {
    if (!companyId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await companyManagementService.getBillingStatements(companyId, { page: 1, pageSize: 100 });
        if (!cancelled && res.success && res.data) setItems(res.data.items);
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
          Payments
        </h1>
        <p className="text-gray-600">
          Daily billing statements (Australia/Sydney calendar day) for enrolments via your company portal link.
        </p>
      </div>

      <Card className="border-violet-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Billing statements
          </CardTitle>
          <CardDescription>
            Status updates when the training provider approves your statement and records payment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!companyId ? (
            <p className="text-gray-600">Loading company…</p>
          ) : loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No statements yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date (Sydney)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Lines</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((row) => (
                  <TableRow key={row.statementId}>
                    <TableCell>{row.sydneyBillingDate}</TableCell>
                    <TableCell>
                      <Badge variant={row.status === 'Paid' ? 'default' : 'secondary'}>{row.status}</Badge>
                    </TableCell>
                    <TableCell>{row.lineCount}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(row.totalAmount)}</TableCell>
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
