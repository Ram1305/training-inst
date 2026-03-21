import { useEffect, useMemo, useState } from 'react';
import { DollarSign, Loader2, CreditCard, Building2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { companyManagementService } from '../../services/companyManagement.service';
import { paymentService } from '../../services/payment.service';
import type { CompanyBillingStatementListItem } from '../../services/adminCompanyBilling.service';
import { toast } from 'sonner';
import { BankTransferDetailsCard } from '../payment/BankTransferDetailsCard';

function toastPaymentAuthError(err: unknown, fallback: string) {
  const msg = err instanceof Error ? err.message : '';
  const status = (err as Error & { status?: number }).status;
  if (status === 401 || /authentication required/i.test(msg)) {
    toast.error(
      'Your session is not valid with the server. Please sign out, sign in again, and retry (the billing list can load without a live session).'
    );
    return;
  }
  toast.error(msg || fallback);
}

export function balanceOf(row: CompanyBillingStatementListItem): number {
  if (row.balanceDue != null) return row.balanceDue;
  const paid = row.paidAmount ?? 0;
  return row.totalAmount - paid;
}

/** Company portal: never show internal Draft/Approved workflow — only paid vs pending. */
function companyPaymentDisplay(row: CompanyBillingStatementListItem): { label: string; paid: boolean } {
  const bal = balanceOf(row);
  if (bal <= 0.009) return { label: 'Paid', paid: true };
  return { label: 'Pending payment', paid: false };
}

export interface CompanyBillingPaymentsPanelProps {
  companyId?: string;
  cardTitle?: string;
  cardDescription?: string;
  /** Called after a successful card payment or bank submission (reload enrolments, etc.). */
  onStatementsChanged?: () => void;
}

export function CompanyBillingPaymentsPanel({
  companyId,
  cardTitle = 'Training fees',
  cardDescription =
    'Each pay-later company enrolment appears as a line here. Balance reflects payments already applied. Card settles immediately; bank transfer updates after we verify your receipt in admin.',
  onStatementsChanged,
}: CompanyBillingPaymentsPanelProps) {
  const [items, setItems] = useState<CompanyBillingStatementListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [payTab, setPayTab] = useState<'card' | 'bank'>('card');
  const [submitting, setSubmitting] = useState(false);

  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');

  const [bankRef, setBankRef] = useState('');
  const [bankFile, setBankFile] = useState<File | null>(null);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(n);

  const load = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const res = await companyManagementService.getBillingStatements(companyId, { page: 1, pageSize: 200 });
      if (res.success && res.data) setItems(res.data.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [companyId]);

  const pendingRows = useMemo(
    () => items.filter((r) => balanceOf(r) > 0.009),
    [items]
  );

  const selectedRows = useMemo(
    () => selectedOrder.map((id) => items.find((i) => i.statementId === id)).filter(Boolean) as CompanyBillingStatementListItem[],
    [selectedOrder, items]
  );

  const selectedBalanceTotal = useMemo(
    () => selectedRows.reduce((s, r) => s + balanceOf(r), 0),
    [selectedRows]
  );

  const payAmount = selectedBalanceTotal;

  const toggleRow = (statementId: string) => {
    setSelectedOrder((prev) =>
      prev.includes(statementId) ? prev.filter((x) => x !== statementId) : [...prev, statementId]
    );
  };

  const selectAllPending = () => {
    setSelectedOrder(pendingRows.map((r) => r.statementId));
  };

  const clearSelection = () => setSelectedOrder([]);

  const openCheckout = () => {
    if (selectedOrder.length === 0) {
      toast.error('Select at least one line to pay.');
      return;
    }
    setPayTab('card');
    setBankRef('');
    setBankFile(null);
    setCheckoutOpen(true);
  };

  const notifyChanged = async () => {
    await load();
    onStatementsChanged?.();
  };

  const submitCard = async () => {
    if (!companyId || payAmount <= 0) {
      toast.error('Select lines with a balance due.');
      return;
    }
    if (!cardName.trim() || !cardNumber.trim() || !expiryMonth || !expiryYear || !cvv) {
      toast.error('Complete all card fields.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await paymentService.processCompanyBillingCard({
        companyId,
        statementIds: selectedOrder,
        amountCents: Math.round(payAmount * 100),
        cardName: cardName.trim(),
        cardNumber: paymentService.getCleanCardNumber(cardNumber),
        expiryMonth,
        expiryYear,
        cvv,
      });
      if (res.success && res.data?.success) {
        toast.success(res.message || 'Payment successful. Confirmation emails have been sent.');
        setCheckoutOpen(false);
        clearSelection();
        await notifyChanged();
      } else {
        const msg =
          (typeof res.data?.errorMessages === 'string' ? res.data.errorMessages : null) ||
          res.message ||
          res.errors?.join(', ') ||
          'Payment failed.';
        toast.error(msg);
      }
    } catch (e) {
      toastPaymentAuthError(e, 'Payment failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitBank = async () => {
    if (!companyId || payAmount <= 0) {
      toast.error('Select lines with a balance due.');
      return;
    }
    if (!bankFile) {
      toast.error('Attach your transfer receipt (screenshot or PDF).');
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('statementIds', JSON.stringify(selectedOrder));
      fd.append('amount', String(payAmount));
      if (bankRef.trim()) fd.append('customerReference', bankRef.trim());
      fd.append('receipt', bankFile);
      const res = await companyManagementService.submitBillingBankTransfer(companyId, fd);
      if (res.success && res.data) {
        toast.success(res.data.message || res.message || 'Submitted. Check your email for confirmation.');
        setCheckoutOpen(false);
        clearSelection();
        await notifyChanged();
      } else {
        toast.error(res.message || 'Submission failed.');
      }
    } catch (e) {
      toastPaymentAuthError(e, 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Card className="border-violet-100">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {cardTitle}
            </CardTitle>
            <CardDescription>{cardDescription}</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => load()}
              disabled={!companyId || loading}
              title="Reload balances from the server"
            >
              {loading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <RefreshCw className="h-4 w-4 shrink-0" />}
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={selectAllPending} disabled={pendingRows.length === 0}>
              Select all outstanding
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={clearSelection} disabled={selectedOrder.length === 0}>
              Clear
            </Button>
            <Button type="button" size="sm" onClick={openCheckout} disabled={selectedOrder.length === 0}>
              Pay selected
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!companyId ? (
            <p className="text-gray-600">Loading company…</p>
          ) : loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              No outstanding charges. Pay-later company enrolments appear here as soon as they are recorded.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>Date (Sydney)</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((row) => {
                  const bal = balanceOf(row);
                  const canSelect = bal > 0.009;
                  const disp = companyPaymentDisplay(row);
                  return (
                    <TableRow key={row.statementId}>
                      <TableCell>
                        {canSelect ? (
                          <Checkbox
                            checked={selectedOrder.includes(row.statementId)}
                            onCheckedChange={() => toggleRow(row.statementId)}
                            aria-label={`Select line ${row.statementId}`}
                          />
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{row.sydneyBillingDate}</TableCell>
                      <TableCell>
                        {row.lineCount === 1 && row.primaryStudentName ? row.primaryStudentName : `— (${row.lineCount} lines)`}
                      </TableCell>
                      <TableCell>
                        {row.lineCount === 1 && row.primaryCourseName ? row.primaryCourseName : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={disp.paid ? 'default' : 'secondary'}>{disp.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(row.totalAmount)}</TableCell>
                      <TableCell className="text-right text-gray-600">
                        {formatCurrency(row.paidAmount ?? 0)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(bal)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pay selected lines</DialogTitle>
            <DialogDescription>
              Total for selected lines: <strong>{formatCurrency(payAmount)}</strong> (full balance for each selected line).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex rounded-lg border border-violet-100 p-1 bg-violet-50/40">
              <Button
                type="button"
                variant={payTab === 'card' ? 'default' : 'ghost'}
                className="flex-1 gap-2"
                onClick={() => setPayTab('card')}
              >
                <CreditCard className="h-4 w-4" />
                Credit card
              </Button>
              <Button
                type="button"
                variant={payTab === 'bank' ? 'default' : 'ghost'}
                className="flex-1 gap-2"
                onClick={() => setPayTab('bank')}
              >
                <Building2 className="h-4 w-4" />
                Bank transfer
              </Button>
            </div>

            {payTab === 'card' && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="cbp-card-name">Name on card</Label>
                  <Input id="cbp-card-name" value={cardName} onChange={(e) => setCardName(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="cbp-card-num">Card number</Label>
                  <Input
                    id="cbp-card-num"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(paymentService.formatCardNumber(e.target.value))}
                    className="mt-1 font-mono"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="cbp-mm">MM</Label>
                    <Input id="cbp-mm" value={expiryMonth} onChange={(e) => setExpiryMonth(e.target.value)} maxLength={2} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="cbp-yy">YY</Label>
                    <Input id="cbp-yy" value={expiryYear} onChange={(e) => setExpiryYear(e.target.value)} maxLength={2} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="cbp-cvv">CVV</Label>
                    <Input id="cbp-cvv" type="password" value={cvv} onChange={(e) => setCvv(e.target.value)} maxLength={4} className="mt-1" />
                  </div>
                </div>
              </div>
            )}

            {payTab === 'bank' && (
              <div className="space-y-3 text-sm text-gray-600">
                <p>
                  Transfer the exact amount below using your bank&apos;s app, then upload the receipt. We will verify your
                  deposit and mark these lines paid from the admin side; you will receive email confirmation.
                </p>
                <BankTransferDetailsCard
                  amountHint={`Transfer ${formatCurrency(payAmount)} to:`}
                  className="border-violet-100 bg-violet-50/50"
                />
                <div>
                  <Label htmlFor="cbp-bank-ref">Transaction ID / reference (optional)</Label>
                  <Input
                    id="cbp-bank-ref"
                    value={bankRef}
                    onChange={(e) => setBankRef(e.target.value)}
                    className="mt-1"
                    placeholder="e.g. bank receipt reference"
                  />
                </div>
                <div>
                  <Label htmlFor="cbp-bank-file">Receipt file</Label>
                  <Input
                    id="cbp-bank-file"
                    type="file"
                    accept="image/*,.pdf"
                    className="mt-1"
                    onChange={(e) => setBankFile(e.target.files?.[0] ?? null)}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setCheckoutOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            {payTab === 'card' ? (
              <Button type="button" onClick={() => submitCard()} disabled={submitting || payAmount <= 0}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : `Pay ${formatCurrency(payAmount)}`}
              </Button>
            ) : (
              <Button type="button" onClick={() => submitBank()} disabled={submitting || payAmount <= 0}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit bank notice'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
