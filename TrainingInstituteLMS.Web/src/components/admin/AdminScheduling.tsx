import { useState, useEffect } from 'react';
import { Clock, ChevronLeft, ChevronRight, Plus, X, GripVertical, MapPin, Link as LinkIcon, Loader2, Trash2, ExternalLink, Info, Calendar, Search, GraduationCap, BookOpen, Check } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { motion, AnimatePresence } from 'motion/react';
import { DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { scheduleService, type ScheduleCalendarItem, type CreateScheduleRequest } from '../../services/schedule.service';
import { courseService, type CourseListItem } from '../../services/course.service';
import { adminManagementService, type AdminResponse } from '../../services/adminManagement.service';

interface ScheduleEvent {
  id: string;
  title: string;
  type: 'theory' | 'practical' | 'exam' | 'meeting';
  courseId: string;
  courseCode: string;
  courseName: string;
  startDate: Date;
  startTime: string;
  endTime: string;
  location: string;
  meetingLink?: string;
  status: string;
  color: string;
  bgColor: string;
  teacherId?: string;
  teacherName?: string;
}

// Helper function to format date as YYYY-MM-DD in local timezone
const formatDateToLocalString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to parse YYYY-MM-DD string to local Date
const parseLocalDateString = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// Interface for draggable event templates
interface DraggableEventTemplate {
  id: string;
  title: string;
  type: 'theory' | 'practical' | 'exam' | 'meeting';
  color: string;
  bgColor: string;
}

const eventTemplates: DraggableEventTemplate[] = [
  {
    id: 'template-meeting',
    title: 'General',
    type: 'meeting',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-100'
  }
];

const getEventTypeLabel = (type: string): string => {
  switch (type.toLowerCase()) {
    case 'theory': return 'Theory Class';
    case 'practical': return 'Practical Session';
    case 'exam': return 'Exam';
    default: return 'General';
  }
};

// Stable course-based colors: same course always gets same color across views
// Stable course-based colors: same course always gets same color across views
const COURSE_COLOR_PALETTE: { color: string; bgColor: string }[] = [
  { color: 'text-blue-700', bgColor: 'bg-blue-100' },
  { color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  { color: 'text-violet-700', bgColor: 'bg-violet-100' },
  { color: 'text-amber-700', bgColor: 'bg-amber-100' },
  { color: 'text-rose-700', bgColor: 'bg-rose-100' },
  { color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
  { color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  { color: 'text-teal-700', bgColor: 'bg-teal-100' },
  { color: 'text-orange-700', bgColor: 'bg-orange-100' },
  { color: 'text-pink-700', bgColor: 'bg-pink-100' },
  { color: 'text-sky-700', bgColor: 'bg-sky-100' },
  { color: 'text-lime-700', bgColor: 'bg-lime-100' },
];

const COURSE_COLOR_LABELS = ['Blue', 'Emerald', 'Violet', 'Amber', 'Rose', 'Cyan', 'Indigo', 'Teal', 'Orange', 'Pink', 'Sky', 'Lime'];

const MANUAL_COLORS_STORAGE_KEY = 'schedule-course-colors';

function getUniqueColor(seed: string): { color: string; bgColor: string } {
  if (!seed) return { color: 'text-indigo-700', bgColor: 'bg-indigo-50' };
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % COURSE_COLOR_PALETTE.length;
  return COURSE_COLOR_PALETTE[index];
}

function getResolvedColor(courseCode: string, scheduleId: string, manualCourseColors: Record<string, number>): { color: string; bgColor: string } {
  // Manual course colors take priority for the whole course if set
  const idx = manualCourseColors[courseCode];
  if (idx !== undefined && idx >= 0 && idx < COURSE_COLOR_PALETTE.length) {
    return COURSE_COLOR_PALETTE[idx];
  }
  // Otherwise, give a unique color based on the scheduleId (event instance)
  return getUniqueColor(scheduleId || courseCode);
}

function DraggableEvent({ template }: { template: DraggableEventTemplate }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: template.id
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`${template.bgColor} ${template.color} rounded-lg p-3 cursor-grab active:cursor-grabbing border-l-4 border-current shadow-sm hover:shadow-md transition-all`}
    >
      <div className="flex items-center gap-2">
        <GripVertical className="w-4 h-4 opacity-50" />
        <span>{template.title}</span>
      </div>
    </div>
  );
}

function DroppableCalendarCell({
  date,
  events,
  onEventClick,
  selectedEventId,
}: {
  date: Date;
  events: ScheduleEvent[];
  onEventClick: (event: ScheduleEvent) => void;
  selectedEventId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: formatDateToLocalString(date)
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[120px] p-2 transition-colors ${isOver ? 'bg-blue-100 ring-2 ring-blue-500' : 'bg-white hover:bg-blue-50/30'
        }`}
    >
      <div className="space-y-1">
        {events.slice(0, 3).map((event) => {
          const isSelected = event.id === selectedEventId;
          return (
            <motion.div
              key={event.id}
              className={`${event.bgColor} ${event.color} rounded px-2 py-1 text-xs cursor-pointer hover:shadow-md transition-all border-l-2 border-current ${isSelected ? 'ring-2 ring-blue-600 ring-offset-1' : ''}`}
              whileHover={{ scale: 1.02 }}
              onClick={() => onEventClick(event)}
            >
              <div className="flex items-center gap-1">
                {isSelected ? <Check className="w-3 h-3 flex-shrink-0" /> : <Clock className="w-3 h-3 flex-shrink-0" />}
                <span className="truncate">{event.startTime}</span>
              </div>
            </motion.div>
          );
        })}
        {events.length > 3 && (
          <div className="text-xs text-gray-500 px-2">
            +{events.length - 3} more
          </div>
        )}
      </div>
    </div>
  );
}

// Droppable cell for Week View with time slots
function DroppableWeekCell({
  date,
  events,
  onEventClick,
  selectedEventId,
}: {
  date: Date;
  events: ScheduleEvent[];
  onEventClick: (event: ScheduleEvent) => void;
  selectedEventId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `week-${formatDateToLocalString(date)}`
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[400px] p-2 border-r border-gray-200 last:border-r-0 transition-colors ${isOver ? 'bg-blue-100 ring-2 ring-blue-500' : 'bg-white hover:bg-blue-50/30'
        }`}
    >
      <div className="space-y-2">
        {events.map((event) => {
          const isSelected = event.id === selectedEventId;
          return (
            <motion.div
              key={event.id}
              className={`${event.bgColor} ${event.color} rounded-lg p-3 cursor-pointer hover:shadow-md transition-all border-l-4 border-current ${isSelected ? 'ring-2 ring-blue-600 ring-offset-1' : ''}`}
              whileHover={{ scale: 1.02 }}
              onClick={() => onEventClick(event)}
            >
              <div className="flex items-center gap-1 text-sm">
                {isSelected && <Check className="w-4 h-4 flex-shrink-0" />}
                <span className="font-medium truncate">{event.courseCode}</span>
              </div>
              <div className="flex items-center gap-1 mt-1 text-xs opacity-75">
                <Clock className="w-3 h-3" />
                <span>{event.startTime} - {event.endTime}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// Droppable cell for Day View
function DroppableDayCell({
  date: initialDate,
  events,
  onEventClick,
  selectedEventId,
}: {
  date: Date;
  events: ScheduleEvent[];
  onEventClick: (event: ScheduleEvent) => void;
  selectedEventId: string | null;
}) {
  // Parse the initial date to avoid timezone issues
  const date = new Date(initialDate);
  date.setHours(0, 0, 0, 0);

  const { setNodeRef, isOver } = useDroppable({
    id: `day-${formatDateToLocalString(date)}`
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[500px] p-4 transition-colors ${isOver ? 'bg-blue-100 ring-2 ring-blue-500' : 'bg-white'
        }`}
    >
      <div className="space-y-3">
        {events.length === 0 ? (
          <div className="text-center text-gray-500 py-20">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No events scheduled for this day</p>
            <p className="text-sm">Drag an event template here to create one</p>
          </div>
        ) : (
          events.map((event) => {
            const isSelected = event.id === selectedEventId;
            return (
              <motion.div
                key={event.id}
                className={`${event.bgColor} ${event.color} rounded-lg p-4 cursor-pointer hover:shadow-lg transition-all border-l-4 border-current ${isSelected ? 'ring-2 ring-blue-600 ring-offset-2' : ''}`}
                whileHover={{ scale: 1.01 }}
                onClick={() => onEventClick(event)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {isSelected && <Check className="w-5 h-5 flex-shrink-0" />}
                      <span className="font-semibold text-lg">{event.courseCode}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{event.startTime} - {event.endTime}</span>
                      </div>
                    </div>
                  </div>
                  <Badge className={`${event.bgColor} ${event.color} border-0`}>
                    {event.courseCode}
                  </Badge>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

// Droppable row for List View
function DroppableListRow({
  date,
  events,
  onEventClick,
  selectedEventId,
}: {
  date: Date;
  events: ScheduleEvent[];
  onEventClick: (event: ScheduleEvent) => void;
  selectedEventId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `list-${formatDateToLocalString(date)}`
  });

  const formatDate = (d: Date) => {
    return d.toLocaleDateString('en-AU', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const isToday = (d: Date) => {
    const today = new Date();
    return d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
  };

  return (
    <div
      ref={setNodeRef}
      className={`border-b border-gray-200 last:border-b-0 transition-colors ${isOver ? 'bg-blue-100 ring-2 ring-blue-500' : ''
        }`}
    >
      <div className="flex">
        {/* Date Column */}
        <div className={`w-32 p-4 flex-shrink-0 ${isToday(date) ? 'bg-blue-50' : 'bg-gray-50'}`}>
          <div className={`font-semibold ${isToday(date) ? 'text-blue-600' : 'text-gray-700'}`}>
            {formatDate(date)}
          </div>
          {isToday(date) && (
            <Badge className="mt-1 bg-blue-600 text-white text-xs">Today</Badge>
          )}
        </div>

        {/* Events Column */}
        <div className="flex-1 p-4 space-y-2">
          {events.length === 0 ? (
            <div className="text-gray-400 text-sm py-2">No events</div>
          ) : (
            events.map((event) => {
              const isSelected = event.id === selectedEventId;
              return (
                <motion.div
                  key={event.id}
                  className={`${event.bgColor} ${event.color} rounded-lg p-3 cursor-pointer hover:shadow-md transition-all border-l-4 border-current flex items-center gap-4 ${isSelected ? 'ring-2 ring-blue-600 ring-offset-1' : ''}`}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => onEventClick(event)}
                >
                  <div className="flex items-center gap-2 w-24 flex-shrink-0">
                    {isSelected ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    <span className="text-sm font-medium">{event.startTime}</span>
                  </div>
                  <div className="flex-1">
                    <span className="font-medium">{event.courseCode}</span>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export function AdminScheduling() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day' | 'list'>('month');
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEventDetailDialog, setShowEventDetailDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [draggedTemplate, setDraggedTemplate] = useState<DraggableEventTemplate | null>(null);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingOld, setIsDeletingOld] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Teacher states
  const [teachers, setTeachers] = useState<AdminResponse[]>([]);
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [selectedTeacherName, setSelectedTeacherName] = useState<string>('');
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);

  const [newEvent, setNewEvent] = useState({
    title: '',
    courseId: '',
    type: 'meeting' as 'theory' | 'practical' | 'exam' | 'meeting',
    startTime: '09:00',
    endTime: '11:00',
    location: 'Face to Face',
    meetingLink: '',
    date: new Date(),
    teacherId: '',
    teacherName: ''
  });

  // Manual course colors: courseCode -> palette index (persisted in localStorage)
  const [manualCourseColors, setManualCourseColors] = useState<Record<string, number>>(() => {
    try {
      const s = localStorage.getItem(MANUAL_COLORS_STORAGE_KEY);
      if (!s) return {};
      const parsed = JSON.parse(s) as Record<string, number>;
      return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(MANUAL_COLORS_STORAGE_KEY, JSON.stringify(manualCourseColors));
    } catch {
      // ignore
    }
  }, [manualCourseColors]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const weekDaysFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Fetch courses and schedules on mount
  useEffect(() => {
    fetchCourses();
    fetchSchedules();
  }, []);

  // Refetch schedules when month or course filter changes
  useEffect(() => {
    fetchSchedules();
  }, [currentDate, selectedCourseFilter]);

  // Fetch teachers
  const fetchTeachers = async (searchQuery?: string) => {
    try {
      setIsLoadingTeachers(true);
      const response = await adminManagementService.getAllAdmins({
        searchQuery: searchQuery || undefined,
        status: 'active',
        userType: 'Teacher',
        pageSize: 50,
      });

      if (response.success && response.data) {
        setTeachers(response.data.admins);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setIsLoadingTeachers(false);
    }
  };

  // Debounced teacher search
  useEffect(() => {
    if (showAddDialog) {
      const timer = setTimeout(() => {
        fetchTeachers(teacherSearchQuery);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [teacherSearchQuery, showAddDialog]);

  // Initial fetch when dialog opens
  useEffect(() => {
    if (showAddDialog) {
      fetchTeachers();
    }
  }, [showAddDialog]);

  const handleSelectTeacher = (teacher: AdminResponse) => {
    setSelectedTeacherId(teacher.userId);
    setSelectedTeacherName(teacher.fullName);
    setNewEvent(prev => ({ ...prev, teacherId: teacher.userId, teacherName: teacher.fullName }));
    setTeacherSearchQuery('');
    setShowTeacherDropdown(false);
  };

  const handleClearTeacher = () => {
    setSelectedTeacherId('');
    setSelectedTeacherName('');
    setNewEvent(prev => ({ ...prev, teacherId: '', teacherName: '' }));
    setTeacherSearchQuery('');
  };

  const fetchCourses = async () => {
    try {
      const response = await courseService.getAllCourses({ pageSize: 100, isActive: true });
      if (response.success && response.data) {
        setCourses(response.data.courses);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
    }
  };

  const fetchSchedules = async () => {
    try {
      setIsLoading(true);

      // Get the first and last day of the current month view (including overflow days)
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - startDate.getDay());

      const lastDay = new Date(year, month + 1, 0);
      const endDate = new Date(lastDay);
      endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

      const response = await scheduleService.getSchedulesForCalendar(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
        selectedCourseFilter !== 'all' ? selectedCourseFilter : undefined
      );

      if (response.success && response.data) {
        const mappedEvents: ScheduleEvent[] = response.data.map((item: ScheduleCalendarItem) => {
          const fromBackend = item.color && item.bgColor;
          const resolvedColors = fromBackend 
            ? { color: item.color, bgColor: item.bgColor }
            : getResolvedColor(item.courseCode, item.scheduleId, manualCourseColors);

          return {
            id: item.scheduleId,
            title: item.eventTitle,
            type: item.eventType.toLowerCase() as 'theory' | 'practical' | 'exam' | 'meeting',
            courseId: '',
            courseCode: item.courseCode,
            courseName: item.courseName,
            startDate: new Date(item.scheduledDate),
            startTime: item.startTime || '09:00',
            endTime: item.endTime || '17:00',
            location: item.location || 'TBD',
            meetingLink: item.meetingLink,
            status: item.status,
            color: resolvedColors.color,
            bgColor: resolvedColors.bgColor,
            teacherId: item.teacherId,
            teacherName: item.teacherName
          };
        });
        setEvents(mappedEvents);
      }
    } catch (err) {
      console.error('Error fetching schedules:', err);
      setError('Failed to load schedules');
    } finally {
      setIsLoading(false);
    }
  };

  // Get calendar month grid
  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    const day = startDate.getDay();
    startDate.setDate(startDate.getDate() - day);

    const days = [];
    const current = new Date(startDate);
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  // Get week days for current week
  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);

    const days = [];
    const current = new Date(startOfWeek);
    for (let i = 0; i < 7; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  // Get days for list view (current month)
  const getListDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days = [];
    const current = new Date(firstDay);
    while (current <= lastDay) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  const monthDays = getMonthDays();
  const weekDaysArray = getWeekDays();
  const listDays = getListDays();

  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (view === 'month' || view === 'list') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else if (view === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'month' || view === 'list') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else if (view === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startDate);
      eventDate.setHours(0, 0, 0, 0);

      const compareDate = new Date(date);
      compareDate.setHours(0, 0, 0, 0);

      return (
        eventDate.getDate() === compareDate.getDate() &&
        eventDate.getMonth() === compareDate.getMonth() &&
        eventDate.getFullYear() === compareDate.getFullYear()
      );
    });
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const handleDragStart = (event: DragStartEvent) => {
    const template = eventTemplates.find(t => t.id === event.active.id);
    if (template) {
      setDraggedTemplate(template);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggedTemplate(null);

    if (event.over && event.active) {
      // Parse the dropped date from the droppable ID
      let droppedDateStr = event.over.id as string;

      // Handle different view prefixes
      if (droppedDateStr.startsWith('week-')) {
        droppedDateStr = droppedDateStr.replace('week-', '');
      } else if (droppedDateStr.startsWith('day-')) {
        droppedDateStr = droppedDateStr.replace('day-', '');
      } else if (droppedDateStr.startsWith('list-')) {
        droppedDateStr = droppedDateStr.replace('list-', '');
      }

      // Use parseLocalDateString to avoid timezone issues
      const droppedDate = parseLocalDateString(droppedDateStr);
      const template = eventTemplates.find(t => t.id === event.active.id);

      if (template) {
        setNewEvent({
          ...newEvent,
          title: template.title,
          type: template.type,
          date: droppedDate,
          courseId: '',
          location: 'Face to Face',
          meetingLink: ''
        });
        setShowAddDialog(true);
      }
    }
  };

  const handleEventClick = (event: ScheduleEvent) => {
    setSelectedEvent(event);
    setShowEventDetailDialog(true);
  };

  const handleSetCourseColor = (courseCode: string, value: number | 'auto') => {
    if (value === 'auto') {
      setManualCourseColors((prev) => {
        const next = { ...prev };
        delete next[courseCode];
        return next;
      });
      setEvents((prev) =>
        prev.map((e) =>
          e.courseCode === courseCode ? { ...e, ...getUniqueColor(e.id) } : e
        )
      );
      setSelectedEvent((prev) =>
        prev?.courseCode === courseCode ? { ...prev, ...getUniqueColor(prev.id) } : prev
      );
    } else {
      const colorSet = COURSE_COLOR_PALETTE[value];
      if (!colorSet) return;
      setManualCourseColors((prev) => ({ ...prev, [courseCode]: value }));
      setEvents((prev) =>
        prev.map((e) =>
          e.courseCode === courseCode ? { ...e, color: colorSet.color, bgColor: colorSet.bgColor } : e
        )
      );
      setSelectedEvent((prev) =>
        prev?.courseCode === courseCode ? { ...prev, color: colorSet.color, bgColor: colorSet.bgColor } : prev
      );
    }
  };

  const handleAddEvent = async () => {
    if (!newEvent.courseId) {
      setError('Please select a course');
      return;
    }

    if (newEvent.location === 'Online' && !newEvent.meetingLink.trim()) {
      setError('Meeting link is required for online sessions');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const selectedCourse = courses.find(c => c.courseId === newEvent.courseId);

      const request: CreateScheduleRequest = {
        courseId: newEvent.courseId,
        eventTitle: newEvent.title || getEventTypeLabel(newEvent.type),
        eventType: newEvent.type.charAt(0).toUpperCase() + newEvent.type.slice(1),
        scheduledDate: formatDateToLocalString(newEvent.date),
        startTime: newEvent.startTime,
        endTime: newEvent.endTime,
        location: newEvent.location,
        meetingLink: newEvent.location === 'Online' ? newEvent.meetingLink : undefined,
        teacherId: newEvent.teacherId || undefined
      };

      const response = await scheduleService.createSchedule(request);

      if (response.success && response.data) {
        // Add the new event to the local state (use manual or unique color)
        const courseColor = getResolvedColor(selectedCourse?.courseCode || '', response.data.scheduleId, manualCourseColors);
        const newScheduleEvent: ScheduleEvent = {
          id: response.data.scheduleId,
          title: request.eventTitle,
          type: newEvent.type,
          courseId: newEvent.courseId,
          courseCode: selectedCourse?.courseCode || '',
          courseName: selectedCourse?.courseName || '',
          startDate: newEvent.date,
          startTime: newEvent.startTime,
          endTime: newEvent.endTime,
          location: newEvent.location,
          meetingLink: newEvent.location === 'Online' ? newEvent.meetingLink : undefined,
          status: 'Scheduled',
          color: courseColor.color,
          bgColor: courseColor.bgColor,
          teacherId: newEvent.teacherId || undefined,
          teacherName: newEvent.teacherName || undefined
        };

        setEvents([...events, newScheduleEvent]);
        setShowAddDialog(false);
        resetNewEvent();
      } else {
        setError(response.message || 'Failed to create schedule');
      }
    } catch (err) {
      console.error('Error creating schedule:', err);
      setError('Failed to create schedule');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (scheduleId: string) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await scheduleService.deleteSchedule(scheduleId);

      if (response.success) {
        const wasDeactivated = response.data?.wasDeactivated;
        if (wasDeactivated) {
          // Deactivated (had enrollments) - update status in list
          setEvents(prev => prev.map(e =>
            e.id === scheduleId ? { ...e, status: 'Cancelled' } : e
          ));
        } else {
          // Actually deleted
          setEvents(prev => prev.filter(e => e.id !== scheduleId));
        }
        setShowEventDetailDialog(false);
        setSelectedEvent(null);
      } else {
        setError(response.message || 'Failed to delete schedule');
      }
    } catch (err) {
      console.error('Error deleting schedule:', err);
      setError('Failed to delete schedule');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOldSchedules = async () => {
    if (!window.confirm('Delete all past schedules with no enrollments? This cannot be undone.')) return;

    try {
      setIsDeletingOld(true);
      setError(null);
      const response = await scheduleService.deleteOldSchedules();

      if (response.success) {
        const count = response.data?.deletedCount ?? 0;
        if (count > 0) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          setEvents(prev => prev.filter(e => {
            const eventDate = new Date(e.startDate);
            eventDate.setHours(0, 0, 0, 0);
            return eventDate >= today;
          }));
        }
      } else {
        setError(response.message || 'Failed to delete old schedules');
      }
    } catch (err) {
      console.error('Error deleting old schedules:', err);
      setError('Failed to delete old schedules');
    } finally {
      setIsDeletingOld(false);
    }
  };

  const resetNewEvent = () => {
    setNewEvent({
      title: '',
      courseId: '',
      type: 'meeting',
      startTime: '09:00',
      endTime: '11:00',
      location: 'Face to Face',
      meetingLink: '',
      date: new Date(),
      teacherId: '',
      teacherName: ''
    });
    setSelectedTeacherId('');
    setSelectedTeacherName('');
    setTeacherSearchQuery('');
    setError(null);
  };

  const formatDateForDisplay = (date: Date): string => {
    return date.toLocaleDateString('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getViewTitle = () => {
    if (view === 'month' || view === 'list') {
      return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    } else if (view === 'week') {
      const weekStart = weekDaysArray[0];
      const weekEnd = weekDaysArray[6];
      if (weekStart.getMonth() === weekEnd.getMonth()) {
        return `${monthNames[weekStart.getMonth()]} ${weekStart.getDate()} - ${weekEnd.getDate()}, ${weekStart.getFullYear()}`;
      } else {
        return `${monthNames[weekStart.getMonth()]} ${weekStart.getDate()} - ${monthNames[weekEnd.getMonth()]} ${weekEnd.getDate()}, ${weekStart.getFullYear()}`;
      }
    } else if (view === 'day') {
      return formatDateForDisplay(currentDate);
    }
    return '';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Class & Exam Scheduling
        </h1>
        <p className="text-gray-600">Drag and drop events to schedule</p>
      </div>

      {/* Sync Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <span className="font-semibold">Synced with Course Dates:</span> Events scheduled here are automatically synced with the "Manage Course Dates" feature in Course Management. Changes made in either place will reflect in both views.
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">×</button>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
          {/* Sidebar with Draggable Events */}
          <Card className="border-0 shadow-xl h-fit lg:sticky lg:top-6">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Drag-n-Drop Events</h3>
              <p className="text-sm text-gray-600 mb-4">Drag these onto the calendar:</p>
              <div className="space-y-3">
                {eventTemplates.map((template) => (
                  <DraggableEvent key={template.id} template={template} />
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <Button
                  onClick={() => {
                    resetNewEvent();
                    setShowAddDialog(true);
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Event Manually
                </Button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium mb-3">Event Status:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-100 rounded border-l-2 border-blue-600" />
                    <span>Scheduled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 rounded border-l-2 border-green-600" />
                    <span>Completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-100 rounded border-l-2 border-gray-400" />
                    <span>Cancelled</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Calendar View */}
          <div className="space-y-6">
            {/* Calendar Controls */}
            <Card className="border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={goToToday}
                      variant="outline"
                      className="border-2 hover:border-blue-600 hover:text-blue-600"
                    >
                      today
                    </Button>
                    <div className="flex items-center gap-1">
                      <Button
                        onClick={goToPrevious}
                        variant="ghost"
                        size="icon"
                        className="hover:bg-blue-50"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </Button>
                      <Button
                        onClick={goToNext}
                        variant="ghost"
                        size="icon"
                        className="hover:bg-blue-50"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </div>
                    <div className="text-2xl font-semibold">
                      {getViewTitle()}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeleteOldSchedules}
                      disabled={isDeletingOld}
                      className="border-amber-200 hover:border-amber-500 hover:bg-amber-50 hover:text-amber-700"
                    >
                      {isDeletingOld ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 mr-2" />
                      )}
                      Delete old schedules
                    </Button>
                    <Select value={selectedCourseFilter} onValueChange={setSelectedCourseFilter}>
                      <SelectTrigger className="w-[240px] border-2 hover:border-blue-200">
                        <BookOpen className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" />
                        <SelectValue placeholder="Filter by course" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All courses</SelectItem>
                        {courses.map((course) => (
                          <SelectItem key={course.courseId} value={course.courseId}>
                            {course.courseCode} - {course.courseName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                      {(['month', 'week', 'day', 'list'] as const).map((v) => (
                        <button
                          key={v}
                          onClick={() => setView(v)}
                          className={`px-3 py-1 rounded-md text-sm transition-colors ${view === v
                              ? 'bg-white text-gray-900 shadow-sm font-medium'
                              : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Month View */}
            {view === 'month' && (
              <Card className="border-0 shadow-xl">
                <CardContent className="p-6">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                      <span className="ml-2 text-gray-600">Loading schedules...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
                      {/* Month Header */}
                      {weekDays.map((day) => (
                        <div key={day} className="bg-gray-50 p-3 text-center text-sm font-medium text-gray-600">
                          {day}
                        </div>
                      ))}

                      {/* Month Days */}
                      {monthDays.map((date, index) => {
                        const dayEvents = getEventsForDate(date);
                        const inCurrentMonth = isCurrentMonth(date);
                        const today = isToday(date);

                        return (
                          <div
                            key={index}
                            className={`${!inCurrentMonth ? 'opacity-40' : ''}`}
                          >
                            <div className="bg-white p-2">
                              <div
                                className={`inline-flex items-center justify-center w-7 h-7 rounded-full mb-2 ${today
                                    ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white font-semibold'
                                    : 'text-gray-700'
                                  }`}
                              >
                                {date.getDate()}
                              </div>
                            </div>
                            <DroppableCalendarCell
                              date={date}
                              events={dayEvents}
                              onEventClick={handleEventClick}
                              selectedEventId={selectedEvent?.id ?? null}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Week View */}
            {view === 'week' && (
              <Card className="border-0 shadow-xl">
                <CardContent className="p-6">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                      <span className="ml-2 text-gray-600">Loading schedules...</span>
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Week Header */}
                      <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                        {weekDaysArray.map((date, index) => {
                          const today = isToday(date);
                          return (
                            <div key={index} className="p-4 text-center border-r border-gray-200 last:border-r-0">
                              <div className="text-sm font-medium text-gray-500">{weekDays[index]}</div>
                              <div className={`mt-1 text-2xl font-semibold ${today
                                  ? 'w-10 h-10 mx-auto rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white flex items-center justify-center'
                                  : 'text-gray-700'
                                }`}>
                                {date.getDate()}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Week Days Events */}
                      <div className="grid grid-cols-7">
                        {weekDaysArray.map((date, index) => {
                          const dayEvents = getEventsForDate(date);
                          return (
                            <DroppableWeekCell
                              key={index}
                              date={date}
                              events={dayEvents}
                              onEventClick={handleEventClick}
                              selectedEventId={selectedEvent?.id ?? null}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Day View */}
            {view === 'day' && (
              <Card className="border-0 shadow-xl">
                <CardContent className="p-6">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                      <span className="ml-2 text-gray-600">Loading schedules...</span>
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Day Header */}
                      <div className="bg-gray-50 border-b border-gray-200 p-4">
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-500">{weekDaysFull[currentDate.getDay()]}</div>
                          <div className={`mt-1 text-4xl font-bold ${isToday(currentDate)
                              ? 'w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white flex items-center justify-center'
                              : 'text-gray-700'
                            }`}>
                            {currentDate.getDate()}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                          </div>
                        </div>
                      </div>

                      {/* Day Events */}
                      <DroppableDayCell
                        date={currentDate}
                        events={getEventsForDate(currentDate)}
                        onEventClick={handleEventClick}
                        selectedEventId={selectedEvent?.id ?? null}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* List View */}
            {view === 'list' && (
              <Card className="border-0 shadow-xl">
                <CardContent className="p-6">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                      <span className="ml-2 text-gray-600">Loading schedules...</span>
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* List Header */}
                      <div className="bg-gray-50 border-b border-gray-200 p-4 flex">
                        <div className="w-32 font-medium text-gray-600">Date</div>
                        <div className="flex-1 font-medium text-gray-600">Events</div>
                      </div>

                      {/* List Days */}
                      <div className="max-h-[600px] overflow-y-auto">
                        {listDays.map((date, index) => {
                          const dayEvents = getEventsForDate(date);
                          // Only show days that have events or are today or in the future
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const showDay = dayEvents.length > 0 || date >= today;

                          if (!showDay) return null;

                          return (
                            <DroppableListRow
                              key={index}
                              date={date}
                              events={dayEvents}
                              onEventClick={handleEventClick}
                              selectedEventId={selectedEvent?.id ?? null}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {draggedTemplate ? (
            <div className={`${draggedTemplate.bgColor} ${draggedTemplate.color} rounded-lg p-3 border-l-4 border-current shadow-xl`}>
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 opacity-50" />
                <span>{draggedTemplate.title}</span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Add Event Dialog */}
      <AnimatePresence>
        {showAddDialog && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddDialog(false)}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white relative">
                <button
                  onClick={() => {
                    setShowAddDialog(false);
                    resetNewEvent();
                  }}
                  className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-semibold">Add New Event</h2>
                <p className="text-white/90 mt-1">Schedule an event</p>
              </div>

              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Event Title</Label>
                    <Input
                      id="title"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      placeholder={getEventTypeLabel(newEvent.type)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Event Type</Label>
                      <SelectContent>
                        <SelectItem value="meeting">General</SelectItem>
                      </SelectContent>
                  </div>
                </div>

                <div>
                  <Label htmlFor="course">Course *</Label>
                  <Select
                    value={newEvent.courseId}
                    onValueChange={(value: string) => setNewEvent({ ...newEvent, courseId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.courseId} value={course.courseId}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{course.courseCode}</span>
                            <span className="text-gray-500">-</span>
                            <span className="truncate">{course.courseName}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formatDateToLocalString(newEvent.date)}
                      onChange={(e) => setNewEvent({ ...newEvent, date: parseLocalDateString(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={newEvent.startTime}
                      onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={newEvent.endTime}
                      onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Select
                    value={newEvent.location}
                    onValueChange={(value: string) => setNewEvent({ ...newEvent, location: value, meetingLink: value !== 'Online' ? '' : newEvent.meetingLink })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Face to Face">Face to Face</SelectItem>
                      <SelectItem value="Online">Online</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Meeting Link - Only show when location is Online */}
                {newEvent.location === 'Online' && (
                  <div>
                    <Label htmlFor="meetingLink">Meeting Link *</Label>
                    <Input
                      id="meetingLink"
                      type="url"
                      value={newEvent.meetingLink}
                      onChange={(e) => setNewEvent({ ...newEvent, meetingLink: e.target.value })}
                      placeholder="https://zoom.us/j/..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter the Zoom, Teams, or other meeting link for this online session
                    </p>
                  </div>
                )}

                {/* Teacher Assignment */}
                <div>
                  <Label className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    Assign Teacher (Optional)
                  </Label>
                  {selectedTeacherName ? (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg mt-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                        <GraduationCap className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{selectedTeacherName}</div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleClearTeacher}
                        className="p-1.5"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <Button
                        onClick={() => setShowTeacherDropdown(!showTeacherDropdown)}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        <GraduationCap className="w-4 h-4 mr-2" />
                        Assign Teacher
                      </Button>

                      {showTeacherDropdown && (
                        <div className="mt-2 p-2 bg-white rounded-lg shadow-md border">
                          <div className="flex items-center mb-2">
                            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <Input
                              value={teacherSearchQuery}
                              onChange={(e) => setTeacherSearchQuery(e.target.value)}
                              placeholder="Search teachers..."
                              className="ml-2"
                            />
                          </div>

                          {isLoadingTeachers ? (
                            <div className="py-2 text-center text-gray-500">
                              <Loader2 className="w-5 h-5 animate-spin" />
                            </div>
                          ) : (
                            <div className="max-h-[300px] overflow-y-auto">
                              {teachers.length === 0 ? (
                                <div className="py-2 text-center text-gray-500">
                                  No teachers found
                                </div>
                              ) : (
                                teachers.map((teacher) => (
                                  <div
                                    key={teacher.userId}
                                    className="flex items-center justify-between py-2 px-3 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors"
                                    onClick={() => handleSelectTeacher(teacher)}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                                        <GraduationCap className="w-4 h-4 text-white" />
                                      </div>
                                      <div className="text-sm font-medium text-gray-900">
                                        {teacher.fullName}
                                      </div>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {teacher.email}
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <Button
                    onClick={handleAddEvent}
                    disabled={isSubmitting || !newEvent.courseId}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Schedule Event
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddDialog(false);
                      resetNewEvent();
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Event Detail Dialog */}
      <Dialog open={showEventDetailDialog} onOpenChange={(open) => {
        setShowEventDetailDialog(open);
        if (!open) setSelectedEvent(null);
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedEvent && (
                <div className={`w-3 h-3 rounded-full ${selectedEvent.bgColor.replace('bg-', 'bg-').replace('200', '500')}`} />
              )}
              Event Details
            </DialogTitle>
            <DialogDescription>
              View details of the scheduled event
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              {/* Event Type Badge */}
              <div className="flex items-center gap-2">
                <Badge className={`${selectedEvent.bgColor} ${selectedEvent.color} border-0`}>
                  {getEventTypeLabel(selectedEvent.type)}
                </Badge>
                <Badge variant="outline" className={
                  selectedEvent.status === 'Scheduled' ? 'text-blue-600 border-blue-200' :
                    selectedEvent.status === 'Completed' ? 'text-green-600 border-green-200' :
                      'text-gray-600 border-gray-200'
                }>
                  {selectedEvent.status}
                </Badge>
              </div>

              {/* Event Title */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{selectedEvent.title}</h3>
              </div>

              {/* Course Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">Course:</span>
                  <span className="font-medium">{selectedEvent.courseCode}</span>
                </div>
                <div className="text-gray-700">{selectedEvent.courseName}</div>
              </div>

              {/* Manual color for this course */}
              <div className="space-y-2">
                <Label className="text-sm text-gray-500">Color for this course</Label>
                <Select
                  value={
                    manualCourseColors[selectedEvent.courseCode] !== undefined
                      ? String(manualCourseColors[selectedEvent.courseCode])
                      : 'auto'
                  }
                  onValueChange={(v) =>
                    handleSetCourseColor(selectedEvent.courseCode, v === 'auto' ? 'auto' : Number(v))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Auto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto (by course code)</SelectItem>
                    {COURSE_COLOR_PALETTE.map((_, i) => (
                      <SelectItem key={i} value={String(i)}>
                        <span className="flex items-center gap-2">
                          <span
                            className={`inline-block w-4 h-4 rounded border border-gray-300 ${COURSE_COLOR_PALETTE[i].bgColor}`}
                            aria-hidden
                          />
                          {COURSE_COLOR_LABELS[i]}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Choose a separate color for this course. All events for this course will use it (saved in this browser).
                </p>
              </div>

              {/* Teacher Info */}
              {selectedEvent.teacherName && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Conducted by</div>
                      <div className="font-medium text-gray-900">{selectedEvent.teacherName}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-gray-500">Date</div>
                  <div className="font-medium">{formatDateForDisplay(selectedEvent.startDate)}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-gray-500">Time</div>
                  <div className="font-medium flex items-center gap-1">
                    <Clock className="w-4 h-4 text-gray-400" />
                    {selectedEvent.startTime} - {selectedEvent.endTime}
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-1">
                <div className="text-sm text-gray-500">Location</div>
                <div className="font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {selectedEvent.location}
                </div>
              </div>

              {/* Meeting Link (if online) */}
              {selectedEvent.meetingLink && (
                <div className="space-y-1">
                  <div className="text-sm text-gray-500">Meeting Link</div>
                  <a
                    href={selectedEvent.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:underline font-medium"
                  >
                    <LinkIcon className="w-4 h-4" />
                    <span className="truncate">{selectedEvent.meetingLink}</span>
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleDeleteEvent(selectedEvent.id)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Event
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowEventDetailDialog(false)}
                  disabled={isSubmitting}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
