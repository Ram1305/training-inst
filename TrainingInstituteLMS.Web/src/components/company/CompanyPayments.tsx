import { DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface CompanyPaymentsProps {
  companyId?: string | null;
}

export function CompanyPayments({ companyId }: CompanyPaymentsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
          Payments
        </h1>
        <p className="text-gray-600">
          View and manage payment history for your company enrolments.
        </p>
      </div>

      <Card className="border-violet-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment History
          </CardTitle>
          <CardDescription>
            Company-scoped payment data will appear here once the backend supports it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-violet-200 bg-violet-50/50 p-8 text-center">
            <DollarSign className="mx-auto h-12 w-12 text-violet-300" />
            <p className="mt-4 text-gray-600">
              {companyId
                ? 'No company-specific payment endpoint is configured yet. Please contact support to enable this feature.'
                : 'Loading company details...'}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              The backend may need endpoints such as /CompanyManagement/{'{companyId}'}/payments
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
