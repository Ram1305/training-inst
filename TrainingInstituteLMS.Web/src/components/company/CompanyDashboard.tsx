import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { BookOpen, DollarSign, Users } from 'lucide-react';
import type { CompanyResponse } from '../../services/companyManagement.service';

interface CompanyDashboardProps {
  company: CompanyResponse | null;
  userName: string;
}

export function CompanyDashboard({ company, userName }: CompanyDashboardProps) {
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
