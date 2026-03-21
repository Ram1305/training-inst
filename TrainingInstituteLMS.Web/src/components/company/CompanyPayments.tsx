import { CompanyBillingPaymentsPanel } from './CompanyBillingPaymentsPanel';

interface CompanyPaymentsProps {
  companyId?: string;
}

export function CompanyPayments({ companyId }: CompanyPaymentsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
          Payments
        </h1>
        <p className="text-gray-600">
          Lines match pay-later enrolments from your portal or bulk-order links (one fee per course). Tick what you want
          to pay; the amount is always the full remaining balance on each selected line. After you pay by card, totals and
          the Payment column update straight away—use Refresh if you need the latest from the server.
        </p>
      </div>

      <CompanyBillingPaymentsPanel companyId={companyId} cardTitle="Pay training fees" />
    </div>
  );
}
