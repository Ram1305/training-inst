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
          Tick each student / course line you want to settle. Payment is always the full remaining balance for the lines
          you select. Card payment marks the bill paid immediately; bank transfer is marked paid after we verify your
          deposit in admin.
        </p>
      </div>

      <CompanyBillingPaymentsPanel companyId={companyId} />
    </div>
  );
}
