import { useEffect, useMemo, useState } from 'react';
import { DollarSign, Loader2, CreditCard, Building2 } from 'lucide-react';
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
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { companyManagementService } from '../../services/companyManagement.service';
import { paymentService } from '../../services/payment.service';
import type { CompanyBillingStatementListItem } from '../../services/adminCompanyBilling.service';
import { toast } from 'sonner';

interface CompanyPaymentsProps {
  companyId?: string;
}

function balanceOf(row: CompanyBillingStatementListItem): number {
  if (row.balanceDue != null) return row.balanceDue;
  const paid = row.paidAmount ?? 0;
  return row.totalAmount - paid;
}

export function CompanyPayments({ companyId }: CompanyPaymentsProps) {
  const [items, setItems] = useState<CompanyBillingStatementListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [payMode, setPayMode] = useState<'full' | 'partial'>('full');
  const [partialAmount, setPartialAmount] = useState('');
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

  const payAmount = useMemo(() => {
    if (payMode === 'full') return selectedBalanceTotal;
    const n = parseFloat(partialAmount.replace(/,/g, ''));
    if (Number.isNaN(n) || n <= 0) return 0;
    return Math.min(n, selectedBalanceTotal);
  }, [payMode, partialAmount, selectedBalanceTotal]);

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
      toast.error('Select at least one bill to pay.');
      return;
    }
    setPayMode('full');
    setPartialAmount('');
    setPayTab('card');
    setBankRef('');
    setBankFile(null);
    setCheckoutOpen(true);
  };

  const submitCard = async () => {
    if (!companyId || payAmount <= 0) {
      toast.error('Enter a valid payment amount.');
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
        await load();
      } else {
        const msg =
          (typeof res.data?.errorMessages === 'string' ? res.data.errorMessages : null) ||
          res.message ||
          res.errors?.join(', ') ||
          'Payment failed.';
        toast.error(msg);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Payment failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitBank = async () => {
    if (!companyId || payAmount <= 0) {
      toast.error('Enter a valid payment amount.');
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
        await load();
      } else {
        toast.error(res.message || 'Submission failed.');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
          Payments
        </h1>
        <p className="text-gray-600">
          Tick the staff / course lines you want to pay, choose full or part payment, then pay by card (applied
          immediately) or bank transfer (we verify your deposit before updating balances — you will get email
          confirmation either way).
        </p>
      </div>

      <Card className="border-violet-100">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Outstanding bills
            </CardTitle>
            <CardDescription>
              Balance due reflects payments already applied. Card payments update your balance straight away.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
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
            <p className="text-gray-600 text-center py-8">No bills yet. Charges appear after training is completed.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>Date (Sydney)</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((row) => {
                  const bal = balanceOf(row);
                  const canSelect = bal > 0.009;
                  return (
                    <TableRow key={row.statementId}>
                      <TableCell>
                        {canSelect ? (
                          <Checkbox
                            checked={selectedOrder.includes(row.statementId)}
                            onCheckedChange={() => toggleRow(row.statementId)}
                            aria-label={`Select bill ${row.statementId}`}
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
                        <Badge variant={row.status === 'Paid' ? 'default' : 'secondary'}>{row.status}</Badge>
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
            <DialogTitle>Pay selected bills</DialogTitle>
            <DialogDescription>
              Selected balance: <strong>{formatCurrency(selectedBalanceTotal)}</strong>. Amount to pay now:{' '}
              <strong>{formatCurrency(payAmount)}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Payment amount</Label>
              <RadioGroup
                value={payMode}
                onValueChange={(v) => setPayMode(v as 'full' | 'partial')}
                className="mt-2 flex flex-col gap-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="full" id="pay-full" />
                  <Label htmlFor="pay-full" className="font-normal cursor-pointer">
                    Pay full balance for selection ({formatCurrency(selectedBalanceTotal)})
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="partial" id="pay-partial" />
                  <Label htmlFor="pay-partial" className="font-normal cursor-pointer">
                    Part payment
                  </Label>
                </div>
              </RadioGroup>
              {payMode === 'partial' && (
                <Input
                  type="number"
                  min={0.01}
                  step={0.01}
                  max={selectedBalanceTotal}
                  className="mt-2"
                  placeholder="Amount (AUD)"
                  value={partialAmount}
                  onChange={(e) => setPartialAmount(e.target.value)}
                />
              )}
            </div>

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
                  <Label htmlFor="cb-card-name">Name on card</Label>
                  <Input id="cb-card-name" value={cardName} onChange={(e) => setCardName(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="cb-card-num">Card number</Label>
                  <Input
                    id="cb-card-num"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(paymentService.formatCardNumber(e.target.value))}
                    className="mt-1 font-mono"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="cb-mm">MM</Label>
                    <Input id="cb-mm" value={expiryMonth} onChange={(e) => setExpiryMonth(e.target.value)} maxLength={2} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="cb-yy">YY</Label>
                    <Input id="cb-yy" value={expiryYear} onChange={(e) => setExpiryYear(e.target.value)} maxLength={2} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="cb-cvv">CVV</Label>
                    <Input id="cb-cvv" type="password" value={cvv} onChange={(e) => setCvv(e.target.value)} maxLength={4} className="mt-1" />
                  </div>
                </div>
              </div>
            )}

            {payTab === 'bank' && (
              <div className="space-y-3 text-sm text-gray-600">
                <p>
                  Transfer the amount below using your bank&apos;s app, then upload the receipt. We will match the
                  deposit and apply it to the selected bills (you will receive email confirmation; balances update
                  after we verify).
                </p>
                <div>
                  <Label htmlFor="cb-bank-ref">Your reference (optional)</Label>
                  <Input id="cb-bank-ref" value={bankRef} onChange={(e) => setBankRef(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="cb-bank-file">Receipt file</Label>
                  <Input
                    id="cb-bank-file"
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
    </div>
  );
}
