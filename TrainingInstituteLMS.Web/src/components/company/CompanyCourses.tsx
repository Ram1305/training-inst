import { useState, useEffect } from 'react';
import { BookOpen, Search, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { courseService } from '../../services/course.service';
import type { CourseListItem } from '../../services/course.service';

export function CompanyCourses() {
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function fetchCourses() {
      setLoading(true);
      try {
        const response = await courseService.getActiveCourses({
          searchQuery: searchQuery.trim() || undefined,
          page: 1,
          pageSize: 50,
        });
        if (!cancelled && response.success && response.data?.courses) {
          setCourses(response.data.courses);
        } else if (!cancelled) {
          setCourses([]);
        }
      } catch {
        if (!cancelled) setCourses([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchCourses();
    return () => { cancelled = true; };
  }, [searchQuery]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
          Courses
        </h1>
        <p className="text-gray-600">
          Browse available training courses. Contact the academy to enrol your employees.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search courses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 max-w-md"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
        </div>
      ) : courses.length === 0 ? (
        <Card className="border-violet-100">
          <CardContent className="py-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-gray-600">No courses found</p>
            <p className="text-sm text-gray-500">Try adjusting your search or check back later.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.courseId} className="border-violet-100 overflow-hidden">
              <CardHeader className="pb-2">
                <div className="text-xs font-medium text-violet-600">{course.courseCode}</div>
                <CardTitle className="text-base">{course.courseName}</CardTitle>
                <CardDescription>
                  {course.duration && `${course.duration} • `}
                  {course.price > 0 ? `$${course.price}` : 'Contact for pricing'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {course.description ?? 'Industry-recognised certification course.'}
                </p>
                {course.categoryName && (
                  <span className="mt-2 inline-block text-xs text-gray-500">{course.categoryName}</span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
