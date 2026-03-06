import { useState, useEffect } from 'react';
import { Home, ChevronLeft, ChevronRight, Loader2, Calendar } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { enrollmentService } from '../../services/enrollment.service';
import type { DailyBookingStat, WeeklyBookingStatsDto } from '../../services/enrollment.service';

interface AdminDashboardProps {
  onNavigate: (page: string, extra?: string) => void;
  onNavigateToLanding?: () => void;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getStartOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // Monday as first day
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDateForApi(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function AdminDashboard({ onNavigate, onNavigateToLanding }: AdminDashboardProps) {
  const [weekStart, setWeekStart] = useState<Date>(() => getStartOfWeek(new Date()));
  const [stats, setStats] = useState<WeeklyBookingStatsDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchStats() {
      setLoading(true);
      try {
        const res = await enrollmentService.getWeeklyBookingStats(formatDateForApi(weekStart));
        if (!cancelled && res.success && res.data) {
          setStats(res.data);
        }
      } catch {
        if (!cancelled) setStats(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchStats();
    return () => { cancelled = true; };
  }, [weekStart]);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekLabel = `${weekStart.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  const handlePrevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };

  const handleNextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };

  const getCountForDate = (dateStr: string): number => {
    if (!stats?.dailyStats) return 0;
    const found = stats.dailyStats.find((s: DailyBookingStat) => {
      const apiDate = typeof s.date === 'string' ? s.date.slice(0, 10) : formatDateForApi(new Date(s.date));
      return apiDate === dateStr;
    });
    return found?.totalCount ?? 0;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
          Admin Dashboard
        </h1>
        <p className="text-gray-600">Welcome back! Here's an overview of your institute</p>
      </div>

      {/* Bookings This Week */}
      <Card className="border-violet-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Bookings This Week
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrevWeek} disabled={loading}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium text-gray-600 min-w-[180px] text-center">{weekLabel}</span>
              <Button variant="outline" size="sm" onClick={handleNextWeek} disabled={loading}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {WEEKDAYS.map((_, i) => {
                const d = new Date(weekStart);
                d.setDate(d.getDate() + i);
                const dateStr = formatDateForApi(d);
                const count = getCountForDate(dateStr);
                const isToday =
                  formatDateForApi(new Date()) === dateStr;
                return (
                  <button
                    key={dateStr}
                    onClick={() => onNavigate('booking-details', dateStr)}
                    className={`
                      flex flex-col items-center justify-center p-4 rounded-lg border transition-all
                      hover:bg-violet-50 hover:border-violet-300
                      ${isToday ? 'border-violet-500 bg-violet-50' : 'border-gray-200'}
                    `}
                  >
                    <span className="text-xs text-gray-500">{WEEKDAYS[i]}</span>
                    <span className="text-lg font-semibold text-gray-800 mt-1">{d.getDate()}</span>
                    <span className="text-sm font-medium text-violet-600 mt-1">{count}</span>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-violet-100 bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white">
        <CardHeader>
          <CardTitle className="text-white">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {onNavigateToLanding && (
            <Button 
              variant="secondary" 
              className="w-full justify-start"
              onClick={onNavigateToLanding}
            >
              <Home className="w-4 h-4 mr-2" />
              Go to Landing Page
            </Button>
          )}
          <Button 
            variant="secondary" 
            className="w-full justify-start"
            onClick={() => onNavigate('students')}
          >
            Walk-in Registration
          </Button>
          <Button 
            variant="secondary" 
            className="w-full justify-start"
            onClick={() => onNavigate('courses')}
          >
            Add New Course
          </Button>
          <Button 
            variant="secondary" 
            className="w-full justify-start"
            onClick={() => onNavigate('reports')}
          >
            Generate Report
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
