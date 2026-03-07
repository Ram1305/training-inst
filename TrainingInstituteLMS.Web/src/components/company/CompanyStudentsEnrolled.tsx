import { Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface CompanyStudentsEnrolledProps {
  companyId?: string | null;
}

export function CompanyStudentsEnrolled({ companyId }: CompanyStudentsEnrolledProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
          Student Enrolled
        </h1>
        <p className="text-gray-600">
          View students enrolled under your company.
        </p>
      </div>

      <Card className="border-violet-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Enrolled Students
          </CardTitle>
          <CardDescription>
            Company-scoped student enrolment data will appear here once the backend supports it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-violet-200 bg-violet-50/50 p-8 text-center">
            <Users className="mx-auto h-12 w-12 text-violet-300" />
            <p className="mt-4 text-gray-600">
              {companyId
                ? 'No company-specific students endpoint is configured yet. Please contact support to enable this feature.'
                : 'Loading company details...'}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              The backend may need endpoints such as /CompanyManagement/{'{companyId}'}/students
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
