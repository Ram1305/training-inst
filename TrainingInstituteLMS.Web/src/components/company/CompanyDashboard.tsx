import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { BookOpen, DollarSign, Users, Link2, Check } from 'lucide-react';
import { toast } from 'sonner';
import type { CompanyResponse } from '../../services/companyManagement.service';

interface CompanyDashboardProps {
  company: CompanyResponse | null;
  userName: string;
}

export function CompanyDashboard({ company, userName }: CompanyDashboardProps) {
  const [copied, setCopied] = useState(false);
  const portalUrl = company?.portalEnrollmentUrl?.trim();

  const copyPortalLink = async () => {
    if (!portalUrl) {
      toast.error('Enrolment link is not available yet.');
      return;
    }
    try {
      await navigator.clipboard.writeText(portalUrl);
      setCopied(true);
      toast.success('Link copied');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
          Company Dashboard
        </h1>
        <p className="text-gray-600">
          Welcome back, {company?.companyName ?? userName}! Here&apos;s an overview of your account.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-violet-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Browse courses</p>
            <p className="text-xs text-gray-500">
              View available training courses in the Courses section
            </p>
          </CardContent>
        </Card>

        <Card className="border-violet-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Payment history</p>
            <p className="text-xs text-gray-500">
              View and manage payments in the Payments section
            </p>
          </CardContent>
        </Card>

        <Card className="border-violet-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students Enrolled</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Enrolled students</p>
            <p className="text-xs text-gray-500">
              View students enrolled under your company in the Student Enrolled section
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-violet-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Employee enrolment link
          </CardTitle>
          <CardDescription>
            Share this link with staff. They choose a course and session; training fees are billed to your company (no
            card payment on this link).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {portalUrl ? (
            <>
              <div className="rounded-lg border border-violet-100 bg-violet-50/40 p-3 text-sm break-all font-mono text-gray-800">
                {portalUrl}
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={copyPortalLink}>
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Link2 className="h-4 w-4 mr-2" />
                    Copy link
                  </>
                )}
              </Button>
            </>
          ) : (
            <p className="text-sm text-gray-600">
              {company
                ? 'Your permanent link will appear here after the account is fully provisioned. Refresh the page or contact support if it is missing.'
                : 'Loading…'}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-violet-100">
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
          <CardDescription>
            Use the sidebar to navigate to Courses, Payments, and Student Enrolled sections.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            {company
              ? `You are logged in as ${company.companyName} (${company.email}).`
              : 'Loading company details...'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
