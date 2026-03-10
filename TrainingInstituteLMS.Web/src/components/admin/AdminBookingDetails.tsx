import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { enrollmentService } from '../../services/enrollment.service';
import type {
  BookingDetailsResponseDto,
  BookingDetailsCourseDto,
  BookingDetailsEnrollmentDto,
} from '../../services/enrollment.service';

interface AdminBookingDetailsProps {
  selectedDate: string;
  onBack: () => void;
}

export function AdminBookingDetails({ selectedDate, onBack }: AdminBookingDetailsProps) {
  const [data, setData] = useState<BookingDetailsResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrollmentData, setEnrollmentData] = useState<BookingDetailsResponseDto | null>(null);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedPlan, setSelectedPlan] = useState<string>('all');

  // First fetch: get courses list for the date (no course filter)
  useEffect(() => {
    let cancelled = false;
    async function fetchCourses() {
      setLoading(true);
      try {
        const res = await enrollmentService.getBookingDetailsByDate(selectedDate, undefined, undefined);
        if (!cancelled && res.success && res.data) {
          setData(res.data);
        }
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchCourses();
    return () => { cancelled = true; };
  }, [selectedDate]);

  // Second fetch: when course is selected, fetch filtered students for that course
  useEffect(() => {
    if (!selectedCourseId) {
      setEnrollmentData(null);
      setEnrollmentLoading(false);
      return;
    }
    let cancelled = false;
    async function fetchEnrollments() {
      setEnrollmentLoading(true);
      try {
        const res = await enrollmentService.getBookingDetailsByDate(
          selectedDate,
          selectedCourseId,
          selectedPlan === 'all' ? undefined : selectedPlan
        );
        if (!cancelled && res.success && res.data) {
          setEnrollmentData(res.data);
        }
      } catch {
        if (!cancelled) setEnrollmentData(null);
      } finally {
        if (!cancelled) setEnrollmentLoading(false);
      }
    }
    fetchEnrollments();
    return () => { cancelled = true; };
  }, [selectedDate, selectedCourseId, selectedPlan]);

  const formattedDate = (() => {
    try {
      const d = new Date(selectedDate);
      return d.toLocaleDateString('en-AU', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return selectedDate;
    }
  })();

  const courses: BookingDetailsCourseDto[] = data?.courses ?? [];
  const enrollments: BookingDetailsEnrollmentDto[] = selectedCourseId
    ? (enrollmentData?.enrollments ?? [])
    : [];

  const planOptions: { value: string; label: string }[] = [
    { value: 'all', label: 'All Plans' },
    { value: 'Single', label: 'Single' },
    { value: 'Combo', label: 'Combo' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
            Bookings for {formattedDate}
          </h1>
          <p className="text-gray-500 text-sm">Students whose selected course date is this day. Cancelled excluded. Select a course to view details.</p>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-violet-600" />
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    1. Select Course <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={selectedCourseId || 'none'}
                    onValueChange={(v) => setSelectedCourseId(v === 'none' ? '' : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course to view students" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select a course</SelectItem>
                      {courses.map((c) => (
                        <SelectItem key={c.courseId} value={c.courseId}>
                          {c.courseCode} - {c.courseName} ({c.enrollmentCount} enrolled)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedCourseId && (
                  <div className="flex-1 min-w-[150px]">
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      2. Plan (Course Type)
                    </label>
                    <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {planOptions.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Enrolled Students {selectedCourseId && `(${enrollments.length})`}</CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedCourseId ? (
                <p className="text-gray-500 text-center py-12">
                  Select a course above to view enrolled students for this week
                </p>
              ) : enrollmentLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
                </div>
              ) : enrollments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No students enrolled for this course on this date</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Session</TableHead>
                        <TableHead>Individual/Company</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enrollments.map((e) => (
                        <TableRow key={e.enrollmentId}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{e.studentName}</div>
                              <div className="text-xs text-gray-500">{e.studentEmail}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{e.courseCode}</div>
                              <div className="text-xs text-gray-500">{e.courseName}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              {e.sessionTime && (
                                <span className="text-sm">{e.sessionTime}</span>
                              )}
                              {e.sessionType && (
                                <Badge variant="outline" className="ml-1 text-xs">
                                  {e.sessionType}
                                </Badge>
                              )}
                              {e.location && (
                                <div className="text-xs text-gray-500">{e.location}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{e.enrollmentType ?? '—'}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                e.paymentStatus === 'Verified'
                                  ? 'default'
                                  : e.paymentStatus === 'Rejected'
                                    ? 'destructive'
                                    : 'secondary'
                              }
                            >
                              {e.paymentStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{e.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
