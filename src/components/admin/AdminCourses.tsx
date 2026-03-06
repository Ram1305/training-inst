import { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Upload, X, Tags, Loader2, Calendar as CalendarIcon, Clock, Search, GraduationCap, FileText, Bold, Italic, Heading2, Heading3, List, ListOrdered, GripVertical } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { DndContext, pointerWithin, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { courseService } from '../../services/course.service';
import type { CourseListItem, CreateCourseRequest, UpdateCourseRequest } from '../../services/course.service';
import { categoryService } from '../../services/category.service';
import type { CategoryItem, CategoryDropdownItem } from '../../services/category.service';
import { courseDateService } from '../../services/courseDate.service';
import type { CourseDateSimple, CreateCourseDateRequest } from '../../services/courseDate.service';
import { adminManagementService, type AdminResponse } from '../../services/adminManagement.service';
import { filesService } from '../../services/files.service';
import { courseDescriptionToHtml } from '../../utils/courseDescriptionFormatter';

interface CourseFormData {
  code: string;
  title: string;
  categoryId: string;
  duration: string;
  price: number;
  originalPrice?: number;
  promoPrice?: number;
  promoOriginalPrice?: number;
  image: string;
  hasTheory: boolean;
  hasPractical: boolean;
  hasExam: boolean;
  validityPeriod: string;
  delivery: string;
  location: string;
  courseDescriptions: string[];
  entryRequirements: string[];
  trainingOverview: string[];
  vocationalOutcome: string[];
  pathwaysDescription: string;
  pathwaysCertifications: string[];
  feesAndCharges: string[];
  optional: string[];
  resourcePdfTitle?: string;
  resourcePdfUrl?: string;
  // Experience-based pricing
  experienceBookingEnabled: boolean;
  experiencePrice?: number;
  experienceOriginalPrice?: number;
  noExperiencePrice?: number;
  noExperienceOriginalPrice?: number;
  comboOfferEnabled: boolean;
  comboDescription?: string;
  comboPrice?: number;
  comboDuration?: string;
}

// Extended type for local date management (includes unsaved dates)
interface LocalCourseDate extends Partial<CourseDateSimple> {
  tempId?: string; // For unsaved dates
  scheduledDate: string;
  dateType: string;
  location?: string;
  meetingLink?: string;
  isNew?: boolean;
  teacherId?: string;
  teacherName?: string;
}

const initialFormData: CourseFormData = {
  code: '',
  title: '',
  categoryId: '',
  duration: '',
  price: 0,
  image: '',
  hasTheory: true,
  hasPractical: true,
  hasExam: true,
  validityPeriod: '',
  delivery: 'Face to Face Training',
  location: 'Face to Face',
  courseDescriptions: [''],
  entryRequirements: [''],
  trainingOverview: [''],
  vocationalOutcome: [''],
  pathwaysDescription: '',
  pathwaysCertifications: [''],
  feesAndCharges: [''],
  optional: [''],
  experienceBookingEnabled: false,
  comboOfferEnabled: false,
};

// Date type configuration
const DATE_TYPES = [
  { value: 'General', label: 'General', color: 'bg-gray-500', bgColor: 'bg-gray-100', textColor: 'text-gray-700' },
  { value: 'Theory', label: 'Theory', color: 'bg-blue-500', bgColor: 'bg-blue-100', textColor: 'text-blue-700' },
  { value: 'Practical', label: 'Practical', color: 'bg-purple-500', bgColor: 'bg-purple-100', textColor: 'text-purple-700' },
  { value: 'Exam', label: 'Exam', color: 'bg-green-500', bgColor: 'bg-green-100', textColor: 'text-green-700' },
];

const getDateTypeConfig = (dateType: string) => {
  return DATE_TYPES.find(dt => dt.value === dateType) || DATE_TYPES[0];
};

function SortableCourseCard({
  course,
  onEdit,
  onToggleStatus,
  onManageDates,
  onDelete,
  disabled = false,
}: {
  course: CourseListItem;
  onEdit: (courseId: string) => void;
  onToggleStatus: (courseId: string) => void;
  onManageDates: (course: CourseListItem) => void;
  onDelete: (courseId: string) => void;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: course.courseId,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="border-violet-100 hover:shadow-lg transition-shadow"
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {!disabled && (
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing touch-none p-1 -ml-1 rounded hover:bg-violet-50 flex-shrink-0"
                title="Drag to reorder (order reflects on landing page)"
              >
                <GripVertical className="w-4 h-4 text-violet-400" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">{course.courseCode}</Badge>
                {course.hasComboOffer && (
                  <Badge className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white">
                    Combo Available
                  </Badge>
                )}
              </div>
              <CardTitle>{course.courseName}</CardTitle>
              <CardDescription>
                {course.categoryName || 'Uncategorized'}
                {course.duration ? ` • ${course.duration}` : ''} •{' '}
                {course.experienceBookingEnabled ? (
                  <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 ml-1">
                    <span>
                      {course.experienceOriginalPrice && (
                        <span className="line-through text-gray-400 mr-1">${course.experienceOriginalPrice}</span>
                      )}
                      <span className="font-semibold text-green-600">${course.experiencePrice ?? course.price}</span>
                      <span className="text-xs text-gray-500">(w/ exp)</span>
                    </span>
                    <span>
                      {course.noExperienceOriginalPrice && (
                        <span className="line-through text-gray-400 mr-1">${course.noExperienceOriginalPrice}</span>
                      )}
                      <span className="font-semibold text-red-600">${course.noExperiencePrice ?? course.price}</span>
                      <span className="text-xs text-gray-500">(w/o exp)</span>
                    </span>
                  </span>
                ) : (
                  <>
                    {course.originalPrice && (
                      <span className="line-through text-gray-400 ml-2">${course.originalPrice}</span>
                    )}
                    <span className="font-semibold text-violet-600 ml-1">${course.price}</span>
                  </>
                )}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge
              className={`cursor-pointer ${course.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
              onClick={() => onToggleStatus(course.courseId)}
            >
              {course.isActive ? 'active' : 'inactive'}
            </Badge>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onManageDates(course)}
              title="Manage Course Dates"
            >
              <CalendarIcon className="w-4 h-4 text-violet-600" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => onEdit(course.courseId)}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onDelete(course.courseId)}
              title="Delete course"
              className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
          <div className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{course.enrolledStudentsCount}</span> students enrolled
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Minimal sortable row showing only course title; used in Reorder Courses dialog. */
function SortableCourseTitleRow({ course }: { course: CourseListItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: course.courseId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-100"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none p-1 -ml-1 rounded hover:bg-violet-50 flex-shrink-0"
        title="Drag to reorder"
      >
        <GripVertical className="w-4 h-4 text-violet-400" />
      </div>
      <span className="font-medium text-gray-800 truncate">{course.courseName}</span>
    </div>
  );
}

function SortableCategoryRow({
  category,
  editingCategory,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  isSubmitting,
  setEditingCategory,
}: {
  category: CategoryItem;
  editingCategory: { id: string; value: string } | null;
  onEdit: (category: CategoryItem) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDelete: (categoryId: string) => void;
  isSubmitting: boolean;
  setEditingCategory: (v: { id: string; value: string } | null) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.categoryId,
    disabled: !!editingCategory,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
    >
      {editingCategory?.id === category.categoryId ? (
        <div className="flex-1 flex gap-2">
          <Input
            value={editingCategory.value}
            onChange={(e) => setEditingCategory({ ...editingCategory, value: e.target.value })}
            onKeyPress={(e) => e.key === 'Enter' && onSaveEdit()}
            autoFocus
            disabled={isSubmitting}
          />
          <Button
            size="sm"
            onClick={onSaveEdit}
            className="bg-green-600 hover:bg-green-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onCancelEdit}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing touch-none p-1 -ml-1 rounded hover:bg-violet-50 flex-shrink-0"
              title="Drag to reorder (order reflects on front page)"
            >
              <GripVertical className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <span className="font-medium text-gray-700">{category.categoryName}</span>
              {category.courseCount > 0 && (
                <Badge variant="secondary" className="text-xs ml-2">
                  {category.courseCount} courses
                </Badge>
              )}
              {!category.isActive && (
                <Badge variant="outline" className="text-xs ml-2 text-red-600">
                  Inactive
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(category)}
              className="hover:bg-blue-100"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(category.categoryId)}
              className="hover:bg-red-100 text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export function AdminCourses() {
  // Dialog states
  const [showDialog, setShowDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showReorderCoursesDialog, setShowReorderCoursesDialog] = useState(false);
  const [selectedCategoryForReorder, setSelectedCategoryForReorder] = useState<CategoryItem | null>(null);
  const [showDateDialog, setShowDateDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [managingDatesForCourse, setManagingDatesForCourse] = useState<{ id: string; name: string; code: string } | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data states
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [categories, setCategories] = useState<CategoryDropdownItem[]>([]);
  const [allCategories, setAllCategories] = useState<CategoryItem[]>([]);
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  
  // Category management states
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<{ id: string; value: string } | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);
  const [isCategorySubmitting, setIsCategorySubmitting] = useState(false);
  const [isCourseDeleteSubmitting, setIsCourseDeleteSubmitting] = useState(false);
  
  // Image states
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageUploadMethod, setImageUploadMethod] = useState<'url' | 'upload'>('url');
  const [editingCourseImageUrl, setEditingCourseImageUrl] = useState<string | null>(null);
  
  // Date picker states
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedDateType, setSelectedDateType] = useState<string>('General');
  const [selectedStartTime, setSelectedStartTime] = useState<string>('09:00');
  const [selectedEndTime, setSelectedEndTime] = useState<string>('17:00');
  const [selectedLocation, setSelectedLocation] = useState<string>('Face to Face');
  const [selectedMeetingLink, setSelectedMeetingLink] = useState<string>('');
  const [selectedMaxCapacity, setSelectedMaxCapacity] = useState<string>('');
  
  // Bulk date upload states
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkEndDate, setBulkEndDate] = useState<string>('');
  const [selectedDays, setSelectedDays] = useState<Record<number, boolean>>({
    0: false, // Sunday
    1: false, // Monday
    2: false, // Tuesday
    3: false, // Wednesday
    4: false, // Thursday
    5: false, // Friday
    6: false, // Saturday
  });
  
  // Course dates state - includes both saved and unsaved dates
  const [courseDates, setCourseDates] = useState<LocalCourseDate[]>([]);
  const [isLoadingDates, setIsLoadingDates] = useState(false);
  const [isDeletingDate, setIsDeletingDate] = useState<string | null>(null);
  
  // Form data
  const [formData, setFormData] = useState<CourseFormData>(initialFormData);

  // Resource PDF upload
  const [resourcePdfFile, setResourcePdfFile] = useState<File | null>(null);
  const [resourcePdfUploading, setResourcePdfUploading] = useState(false);
  const [resourcePdfUploadError, setResourcePdfUploadError] = useState<string | null>(null);
  const resourcePdfInputRef = useRef<HTMLInputElement>(null);
  const descriptionTextareaRefs = useRef<Record<number, HTMLTextAreaElement | null>>({});

  // Course reorder state
  const [isReordering, setIsReordering] = useState(false);
  const [isCategoryReordering, setIsCategoryReordering] = useState(false);

  // Teacher states for date management
  const [teachers, setTeachers] = useState<AdminResponse[]>([]);
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [selectedTeacherName, setSelectedTeacherName] = useState<string>('');
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    fetchCategories();
    fetchAllCategories();
  }, []);

  const fetchCourses = async (query?: string) => {
    try {
      setIsLoading(true);
      const response = await courseService.getAllCourses({
        pageSize: 100,
        searchQuery: (query ?? searchQuery).trim() || undefined,
        sortBy: 'displayOrder',
        sortDescending: false,
      });
      if (response.success && response.data) {
        setCourses(response.data.courses);
      } else {
        setError(response.message || 'Failed to load courses');
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to load courses');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch courses on mount and when search changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCourses(searchQuery);
    }, searchQuery ? 300 : 0); // Debounce when typing, immediate when clearing
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getCategoriesDropdown();
      if (response.success && response.data) {
        setCategories(response.data.categories);
      }
    } catch (err) {
      console.error('Error fetching categories dropdown:', err);
    }
  };

  const fetchAllCategories = async () => {
    try {
      const response = await categoryService.getAllCategories({
        pageSize: 100,
        sortBy: 'displayOrder',
        sortDescending: false,
      });
      if (response.success && response.data) {
        setAllCategories(response.data.categories);
      }
    } catch (err) {
      console.error('Error fetching all categories:', err);
    }
  };

  // Teacher fetching function
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
    if (showDateDialog) {
      const timer = setTimeout(() => {
        fetchTeachers(teacherSearchQuery);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [teacherSearchQuery, showDateDialog]);

  // Initial fetch when dialog opens
  useEffect(() => {
    if (showDateDialog) {
      fetchTeachers();
    }
  }, [showDateDialog]);

  // Course CRUD operations
  const handleCreateCourse = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      const request: CreateCourseRequest = {
        courseCode: formData.code.trim() || undefined,
        courseName: formData.title.trim() || undefined,
        categoryId: formData.categoryId || undefined,
        duration: formData.duration || undefined,
        price: formData.price || undefined,
        originalPrice: formData.originalPrice,
        promoPrice: formData.promoPrice,
        promoOriginalPrice: formData.promoOriginalPrice,
        imageUrl: formData.image,
        hasTheory: formData.hasTheory,
        hasPractical: formData.hasPractical,
        hasExam: formData.hasExam,
        validityPeriod: formData.validityPeriod,
        deliveryMethod: formData.delivery,
        location: formData.location,
        courseDescription: formData.courseDescriptions.filter(d => d.trim()).join('\n\n') || undefined,
        entryRequirements: formData.entryRequirements.filter(r => r.trim()),
        trainingOverview: formData.trainingOverview.filter(t => t.trim()),
        vocationalOutcome: formData.vocationalOutcome.filter(v => v.trim()),
        pathwaysDescription: formData.pathwaysDescription,
        pathwaysCertifications: formData.pathwaysCertifications.filter(p => p.trim()),
        feesAndCharges: formData.feesAndCharges.filter(f => f.trim()),
        optionalCharges: formData.optional.filter(o => o.trim()),
        resourcePdfTitle: formData.resourcePdfTitle,
        resourcePdfUrl: formData.resourcePdfUrl,
        experienceBookingEnabled: formData.experienceBookingEnabled,
        experiencePrice: formData.experiencePrice,
        experienceOriginalPrice: formData.experienceOriginalPrice,
        noExperiencePrice: formData.noExperiencePrice,
        noExperienceOriginalPrice: formData.noExperienceOriginalPrice,
        comboOfferEnabled: formData.comboOfferEnabled,
        comboDescription: formData.comboDescription,
        comboPrice: formData.comboPrice,
        comboDuration: formData.comboDuration,
      };

      const response = await courseService.createCourse(request);

      if (response.success) {
        setShowDialog(false);
        resetForm();
        fetchCourses();
      } else {
        setError(response.message || 'Failed to create course');
      }
    } catch (err) {
      console.error('Error creating course:', err);
      setError('Failed to create course');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCourse = async () => {
    if (!editingCourseId) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const request: UpdateCourseRequest = {
        courseCode: formData.code,
        courseName: formData.title,
        categoryId: formData.categoryId || undefined,
        duration: formData.duration,
        price: formData.price,
        originalPrice: formData.originalPrice,
        promoPrice: formData.promoPrice,
        promoOriginalPrice: formData.promoOriginalPrice,
        imageUrl: formData.image?.trim() || editingCourseImageUrl || undefined,
        hasTheory: formData.hasTheory,
        hasPractical: formData.hasPractical,
        hasExam: formData.hasExam,
        validityPeriod: formData.validityPeriod,
        deliveryMethod: formData.delivery,
        location: formData.location,
        courseDescription: formData.courseDescriptions.filter(d => d.trim()).join('\n\n') || undefined,
        entryRequirements: formData.entryRequirements.filter(r => r.trim()),
        trainingOverview: formData.trainingOverview.filter(t => t.trim()),
        vocationalOutcome: formData.vocationalOutcome.filter(v => v.trim()),
        pathwaysDescription: formData.pathwaysDescription,
        pathwaysCertifications: formData.pathwaysCertifications.filter(p => p.trim()),
        feesAndCharges: formData.feesAndCharges.filter(f => f.trim()),
        optionalCharges: formData.optional.filter(o => o.trim()),
        resourcePdfTitle: formData.resourcePdfTitle,
        resourcePdfUrl: formData.resourcePdfUrl,
        experienceBookingEnabled: formData.experienceBookingEnabled,
        experiencePrice: formData.experiencePrice,
        experienceOriginalPrice: formData.experienceOriginalPrice,
        noExperiencePrice: formData.noExperiencePrice,
        noExperienceOriginalPrice: formData.noExperienceOriginalPrice,
        comboOfferEnabled: formData.comboOfferEnabled,
        comboDescription: formData.comboDescription,
        comboPrice: formData.comboPrice,
        comboDuration: formData.comboDuration,
      };

      const response = await courseService.updateCourse(editingCourseId, request);

      if (response.success) {
        setShowDialog(false);
        resetForm();
        setIsEditing(false);
        setEditingCourseId(null);
        setEditingCourseImageUrl(null);
        fetchCourses();
      } else {
        setError(response.message || 'Failed to update course');
      }
    } catch (err) {
      console.error('Error updating course:', err);
      setError('Failed to update course');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCourse = async (courseId: string) => {
    try {
      const response = await courseService.getCourseById(courseId);
      if (response.success && response.data) {
        const course = response.data;
        setFormData({
          code: course.courseCode,
          title: course.courseName,
          categoryId: course.categoryId || '',
          duration: course.duration || '',
          price: course.price,
          originalPrice: course.originalPrice,
          promoPrice: course.promoPrice,
          promoOriginalPrice: course.promoOriginalPrice,
          image: course.imageUrl || '',
          hasTheory: course.hasTheory,
          hasPractical: course.hasPractical,
          hasExam: course.hasExam,
          validityPeriod: course.validityPeriod || '',
          delivery: course.deliveryMethod || 'Face to Face Training',
          location: course.location || '',
          courseDescriptions: course.courseDescription?.trim() ? course.courseDescription.split(/\n\n+/).map(s => s.trim()).filter(Boolean) : [''],
          entryRequirements: course.entryRequirements.length > 0 ? course.entryRequirements : [''],
          trainingOverview: course.trainingOverview.length > 0 ? course.trainingOverview : [''],
          vocationalOutcome: course.vocationalOutcome.length > 0 ? course.vocationalOutcome : [''],
          pathwaysDescription: course.pathways?.description || '',
          pathwaysCertifications: course.pathways?.certifications.length ? course.pathways.certifications : [''],
          feesAndCharges: course.feesAndCharges.length > 0 ? course.feesAndCharges : [''],
          optional: course.optionalCharges.length > 0 ? course.optionalCharges : [''],
          resourcePdfTitle: course.resourcePdf?.title,
          resourcePdfUrl: course.resourcePdf?.url,
          experienceBookingEnabled: course.experienceBookingEnabled || false,
          experiencePrice: course.experiencePrice,
          experienceOriginalPrice: course.experienceOriginalPrice,
          noExperiencePrice: course.noExperiencePrice,
          noExperienceOriginalPrice: course.noExperienceOriginalPrice,
          comboOfferEnabled: !!course.comboOffer,
          comboDescription: course.comboOffer?.description,
          comboPrice: course.comboOffer?.price,
          comboDuration: course.comboOffer?.duration,
        });
        setImagePreview(course.imageUrl || '');
        setImageUploadMethod((course.imageUrl || '').startsWith('data:') ? 'upload' : 'url');
        setEditingCourseImageUrl(course.imageUrl || null);
        setIsEditing(true);
        setEditingCourseId(courseId);
        setShowDialog(true);
      }
    } catch (err) {
      console.error('Error fetching course details:', err);
      setError('Failed to load course details');
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      const response = await courseService.deleteCourse(courseId);
      if (response.success) {
        fetchCourses();
      } else {
        setError(response.message || 'Failed to delete course');
      }
    } catch (err) {
      console.error('Error deleting course:', err);
      setError('Failed to delete course');
    }
  };

  const confirmDeleteCourse = async () => {
    if (!courseToDelete) return;
    setIsCourseDeleteSubmitting(true);
    try {
      await handleDeleteCourse(courseToDelete);
      setCourseToDelete(null);
    } finally {
      setIsCourseDeleteSubmitting(false);
    }
  };

  const handleToggleCourseStatus = async (courseId: string) => {
    try {
      const response = await courseService.toggleCourseStatus(courseId);
      if (response.success) {
        fetchCourses();
      } else {
        setError(response.message || 'Failed to toggle course status');
      }
    } catch (err) {
      console.error('Error toggling course status:', err);
      setError('Failed to toggle course status');
    }
  };

  const handleCourseReorder = async (categoryId: string, oldOrder: string[], newOrder: string[]) => {
    if (JSON.stringify(oldOrder) === JSON.stringify(newOrder)) return;

    const previousCourses = [...courses];
    const optimisticCourses = courses.map((c) => {
      if (c.categoryId !== categoryId) return c;
      const idx = newOrder.indexOf(c.courseId);
      return { ...c, displayOrder: idx };
    });
    setCourses(optimisticCourses);
    setIsReordering(true);

    try {
      const response = await courseService.reorderCourses(categoryId, newOrder);
      if (response.success) {
        await fetchCourses();
      } else {
        setCourses(previousCourses);
        setError(response.message || 'Failed to reorder courses');
      }
    } catch (err) {
      console.error('Error reordering courses:', err);
      setCourses(previousCourses);
      setError('Failed to reorder courses');
    } finally {
      setIsReordering(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const draggedCourse = courses.find((c) => c.courseId === active.id);
    if (!draggedCourse?.categoryId) return;

    const overCourse = courses.find((c) => c.courseId === over.id);
    if (!overCourse || overCourse.categoryId !== draggedCourse.categoryId) return;

    // Use same order as displayed (aligned with landing page: by displayOrder)
    const categoryCourseIds = courses
      .filter((c) => c.categoryId === draggedCourse.categoryId)
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
      .map((c) => c.courseId);

    const oldIndex = categoryCourseIds.indexOf(active.id as string);
    const newIndex = categoryCourseIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(categoryCourseIds, oldIndex, newIndex);
    handleCourseReorder(draggedCourse.categoryId, categoryCourseIds, newOrder);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    })
  );

  // Group courses by category (aligned with landing page: categories by displayOrder, courses within each by displayOrder)
  const coursesByCategory = categories
    .map((cat) => ({
      category: cat,
      courses: courses
        .filter((c) => c.categoryId === cat.categoryId)
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)),
    }))
    .filter((g) => g.courses.length > 0);

  const uncategorizedCourses = courses
    .filter((c) => !c.categoryId)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  // Category CRUD operations
  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;

    try {
      setIsCategorySubmitting(true);
      const response = await categoryService.createCategory({
        categoryName: newCategory.trim()
      });

      if (response.success) {
        setNewCategory('');
        fetchCategories();
        fetchAllCategories();
      } else {
        alert(response.message || 'Failed to create category');
      }
    } catch (err) {
      console.error('Error creating category:', err);
      alert('Failed to create category');
    } finally {
      setIsCategorySubmitting(false);
    }
  };

  const handleEditCategory = (category: CategoryItem) => {
    setEditingCategory({ id: category.categoryId, value: category.categoryName });
  };

  const handleSaveEdit = async () => {
    if (!editingCategory || !editingCategory.value.trim()) return;

    try {
      setIsCategorySubmitting(true);
      const response = await categoryService.updateCategory(editingCategory.id, {
        categoryName: editingCategory.value.trim()
      });

      if (response.success) {
        setEditingCategory(null);
        fetchCategories();
        fetchAllCategories();
      } else {
        alert(response.message || 'Failed to update category');
      }
    } catch (err) {
      console.error('Error updating category:', err);
      alert('Failed to update category');
    } finally {
      setIsCategorySubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
  };

  const handleCategoryReorder = async (newOrder: string[]) => {
    if (newOrder.length === 0) return;
    try {
      setIsCategoryReordering(true);
      const response = await categoryService.reorderCategories(newOrder);
      if (response.success) {
        await fetchAllCategories();
        fetchCategories();
        fetchCourses();
      } else {
        alert(response.message || 'Failed to reorder categories');
      }
    } catch (err) {
      console.error('Error reordering categories:', err);
      alert('Failed to reorder categories');
    } finally {
      setIsCategoryReordering(false);
    }
  };

  const handleCategoryDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sortedCategoryIds = [...allCategories]
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
      .map((c) => c.categoryId);

    const oldIndex = sortedCategoryIds.indexOf(active.id as string);
    const newIndex = sortedCategoryIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(sortedCategoryIds, oldIndex, newIndex);
    handleCategoryReorder(newOrder);
  };

  const handleDeleteCategory = (categoryId: string) => {
    setCategoryToDelete(categoryId);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      setIsCategorySubmitting(true);
      const response = await categoryService.deleteCategory(categoryToDelete);

      if (response.success) {
        setCategoryToDelete(null);
        fetchCategories();
        fetchAllCategories();
      } else {
        alert(response.message || 'Failed to delete category');
      }
    } catch (err) {
      console.error('Error deleting category:', err);
      alert('Failed to delete category');
    } finally {
      setIsCategorySubmitting(false);
    }
  };

  // Form helpers
  const resetForm = () => {
    setFormData(initialFormData);
    setImagePreview('');
    setError(null);
  };

  const addArrayItem = (field: keyof CourseFormData) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] as string[]), '']
    }));
  };

  const removeArrayItem = (field: keyof CourseFormData, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }));
  };

  const updateArrayItem = (field: keyof CourseFormData, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).map((item, i) => i === index ? value : item)
    }));
  };

  const getDescriptionTextarea = (index: number): HTMLTextAreaElement | null => {
    const fromRef = descriptionTextareaRefs.current[index];
    if (fromRef) return fromRef;
    const active = document.activeElement;
    if (active instanceof HTMLTextAreaElement && active.id?.startsWith('course-desc-')) {
      const idx = parseInt(active.id.replace('course-desc-', ''), 10);
      if (idx === index) return active;
    }
    return null;
  };

  const applyDescriptionFormatting = (index: number, wrapChar: string) => {
    const textarea = getDescriptionTextarea(index);
    if (!textarea) return;
    const { selectionStart, selectionEnd, value } = textarea;
    if (selectionStart === selectionEnd) return;
    const selectedText = value.substring(selectionStart, selectionEnd);
    const newText = value.substring(0, selectionStart) + wrapChar + selectedText + wrapChar + value.substring(selectionEnd);
    updateArrayItem('courseDescriptions', index, newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(selectionStart + wrapChar.length, selectionEnd + wrapChar.length);
    }, 0);
  };

  const insertDescriptionAtCursor = (index: number, prefix: string) => {
    const textarea = getDescriptionTextarea(index);
    if (!textarea) return;
    const { selectionStart, selectionEnd, value } = textarea;
    const before = value.substring(0, selectionStart);
    const after = value.substring(selectionEnd);
    const newText = before + prefix + after;
    updateArrayItem('courseDescriptions', index, newText);
    setTimeout(() => {
      textarea.focus();
      const pos = selectionStart + prefix.length;
      textarea.setSelectionRange(pos, pos);
    }, 0);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setFormData(prev => ({ ...prev, image: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImagePreview('');
    setFormData(prev => ({ ...prev, image: '' }));
  };

  const handleResourcePdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setResourcePdfUploadError(null);
    if (file) {
      if (file.type !== 'application/pdf') {
        setResourcePdfUploadError('Please select a PDF file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setResourcePdfUploadError('File size must be less than 10MB');
        return;
      }
      setResourcePdfFile(file);
    } else {
      setResourcePdfFile(null);
    }
  };

  const handleResourcePdfUpload = async () => {
    if (!resourcePdfFile) return;
    setResourcePdfUploading(true);
    setResourcePdfUploadError(null);
    try {
      const url = await filesService.uploadFile(resourcePdfFile, 'course-resources');
      setFormData(prev => ({
        ...prev,
        resourcePdfUrl: url,
        resourcePdfTitle: prev.resourcePdfTitle || resourcePdfFile.name.replace(/\.pdf$/i, ''),
      }));
      setResourcePdfFile(null);
      if (resourcePdfInputRef.current) resourcePdfInputRef.current.value = '';
    } catch (err) {
      setResourcePdfUploadError(err instanceof Error ? err.message : 'Failed to upload PDF');
    } finally {
      setResourcePdfUploading(false);
    }
  };

  const clearResourcePdf = () => {
    setFormData(prev => ({ ...prev, resourcePdfUrl: '', resourcePdfTitle: prev.resourcePdfTitle }));
    setResourcePdfFile(null);
    setResourcePdfUploadError(null);
  };

  // ==================== DATE MANAGEMENT FUNCTIONS ====================

  const formatDateForDisplay = (dateString: string): string => {
    // Create date from YYYY-MM-DD format without timezone conversion
    const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-AU', { 
      weekday: 'short',
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatDateForInput = (dateString: string): string => {
    // Extract YYYY-MM-DD part if it's an ISO string, otherwise return as is
    return dateString.includes('T') ? dateString.split('T')[0] : dateString;
  };

  // Open date management dialog
  const handleOpenDateDialog = async (course: CourseListItem) => {
    try {
      setManagingDatesForCourse({
        id: course.courseId,
        name: course.courseName,
        code: course.courseCode
      });
      setIsLoadingDates(true);
      setDateError(null);
      setShowDateDialog(true);

      // Fetch existing dates from backend - only today and future (user's local date)
      const today = new Date();
      const fromDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const response = await courseDateService.getCourseDatesForCourse(course.courseId, false, fromDate);
      
      if (response.success && response.data) {
        // Filter out any past dates (safety net for timezone edge cases) - only show today and future
        const todayStr = fromDate;
        const filtered = response.data.filter((d) => {
          const dStr = typeof d.scheduledDate === 'string'
            ? (d.scheduledDate.includes('T') ? d.scheduledDate.split('T')[0] : d.scheduledDate)
            : (d.scheduledDate as unknown as Date)?.toISOString?.()?.split('T')[0] ?? '';
          return dStr >= todayStr;
        });
        const existingDates: LocalCourseDate[] = filtered.map(d => ({
          ...d,
          isNew: false
        }));
        setCourseDates(existingDates);
      } else {
        setCourseDates([]);
      }

      // Set default location to Face to Face
      setSelectedLocation('Face to Face');
    } catch (err) {
      console.error('Error loading course dates:', err);
      setDateError('Failed to load course dates');
      setCourseDates([]);
    } finally {
      setIsLoadingDates(false);
    }
  };

  // Helper function to get dates between start and end date for selected days
  const getDatesBetween = (startDate: string, endDate: string, selectedDays: Record<number, boolean>): string[] => {
    const dates: string[] = [];
    
    // Parse dates as local dates (not UTC)
    const startParts = startDate.split('-').map(Number);
    const endParts = endDate.split('-').map(Number);
    
    const start = new Date(startParts[0], startParts[1] - 1, startParts[2]);
    const end = new Date(endParts[0], endParts[1] - 1, endParts[2]);
    
    const current = new Date(start);
    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (selectedDays[dayOfWeek]) {
        // Format as YYYY-MM-DD without timezone conversion
        const year = current.getFullYear();
        const month = String(current.getMonth() + 1).padStart(2, '0');
        const day = String(current.getDate()).padStart(2, '0');
        dates.push(`${year}-${month}-${day}`);
      }
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  // Add a new date to the local list
  const handleAddDate = () => {
    if (!selectedDate) {
      setDateError('Please select a start date');
      return;
    }

    // Validate meeting link for online location
    if (selectedLocation === 'Online' && !selectedMeetingLink.trim()) {
      setDateError('Meeting link is required for online sessions');
      return;
    }

    // Handle bulk mode
    if (isBulkMode) {
      if (!bulkEndDate) {
        setDateError('Please select an end date for bulk upload');
        return;
      }

      const hasSelectedDays = Object.values(selectedDays).some(v => v);
      if (!hasSelectedDays) {
        setDateError('Please select at least one day of the week');
        return;
      }

      if (new Date(bulkEndDate) < new Date(selectedDate)) {
        setDateError('End date must be after start date');
        return;
      }

      const datesToAdd = getDatesBetween(selectedDate, bulkEndDate, selectedDays);
      
      if (datesToAdd.length === 0) {
        setDateError('No dates found for the selected days in this range');
        return;
      }

      // Allow multiple sessions per day (same or different times)
      const newDates: LocalCourseDate[] = datesToAdd.map((dateValue, index) => ({
        tempId: `temp-${Date.now()}-${dateValue}-${index}`,
        scheduledDate: dateValue,
        dateType: selectedDateType,
        startTime: selectedStartTime || undefined,
        endTime: selectedEndTime || undefined,
        location: selectedLocation,
        meetingLink: selectedLocation === 'Online' ? selectedMeetingLink : undefined,
        isNew: true,
        availableSpots: selectedMaxCapacity ? parseInt(selectedMaxCapacity) : 999,
        isAvailable: true,
        teacherId: selectedTeacherId && selectedTeacherId.trim() !== '' ? selectedTeacherId : undefined,
        teacherName: selectedTeacherName && selectedTeacherName.trim() !== '' ? selectedTeacherName : undefined
      }));

      setCourseDates(prev => [...prev, ...newDates].sort((a, b) => 
        new Date(a.scheduledDate + 'T00:00:00').getTime() - new Date(b.scheduledDate + 'T00:00:00').getTime()
      ));

      // Reset form
      setSelectedDate('');
      setBulkEndDate('');
      setSelectedDays({ 0: false, 1: false, 2: false, 3: false, 4: false, 5: false, 6: false });
      setSelectedMeetingLink('');
      setSelectedTeacherId('');
      setSelectedTeacherName('');
      setDateError(null);
      return;
    }

    // Single date mode - allow multiple sessions on same day (same or different times)
    const dateValue = selectedDate;

    // Validate date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateObj = new Date(selectedDate + 'T00:00:00');
    
    if (selectedDateObj < today) {
      if (!confirm('This date is in the past. Are you sure you want to add it?')) {
        return;
      }
    }

    // Add new date to local state with teacher info
    const newDate: LocalCourseDate = {
      tempId: `temp-${Date.now()}`,
      scheduledDate: dateValue, // Store as YYYY-MM-DD
      dateType: selectedDateType,
      startTime: selectedStartTime || undefined,
      endTime: selectedEndTime || undefined,
      location: selectedLocation,
      meetingLink: selectedLocation === 'Online' ? selectedMeetingLink : undefined,
      isNew: true,
      availableSpots: selectedMaxCapacity ? parseInt(selectedMaxCapacity) : 999,
      isAvailable: true,
      // Only store teacherId if it's a valid non-empty string
      teacherId: selectedTeacherId && selectedTeacherId.trim() !== '' ? selectedTeacherId : undefined,
      teacherName: selectedTeacherName && selectedTeacherName.trim() !== '' ? selectedTeacherName : undefined
    };

    setCourseDates(prev => [...prev, newDate].sort((a, b) =>
      new Date(a.scheduledDate + 'T00:00:00').getTime() - new Date(b.scheduledDate + 'T00:00:00').getTime()
    ));

    // Reset form but keep date so user can add another slot on same day
    setSelectedMeetingLink('');
    setSelectedTeacherId('');
    setSelectedTeacherName('');
    setDateError(null);
  };

  // Remove a date (either delete from DB or remove from local state)
  const handleRemoveDate = async (date: LocalCourseDate) => {
    if (date.isNew) {
      // Just remove from local state
      setCourseDates(prev => prev.filter(d => d.tempId !== date.tempId));
    } else if (date.courseDateId) {
      // Delete from database
      try {
        setIsDeletingDate(date.courseDateId);
        const response = await courseDateService.deleteCourseDate(date.courseDateId);
        
        if (response.success) {
          const wasDeactivated = response.data?.wasDeactivated;
          if (wasDeactivated) {
            // Deactivated (had enrollments) - update isActive instead of removing
            setCourseDates(prev => prev.map(d =>
              d.courseDateId === date.courseDateId ? { ...d, isActive: false } : d
            ));
          } else {
            // Actually deleted
            setCourseDates(prev => {
              const newDates = prev.filter(d => d.courseDateId !== date.courseDateId);
              if (managingDatesForCourse) {
                setCourses(prevCourses =>
                  prevCourses.map(course =>
                    course.courseId === managingDatesForCourse.id
                      ? {
                          ...course,
                          courseDatesCount: newDates.length,
                          courseDates: newDates.map(d => d.scheduledDate)
                        }
                      : course
                  )
                );
              }
              return newDates;
            });
          }
        } else {
          setDateError(response.message || 'Failed to delete date');
        }
      } catch (err) {
        console.error('Error deleting date:', err);
        setDateError(err instanceof Error ? err.message : 'Failed to delete date');
      } finally {
        setIsDeletingDate(null);
      }
    }
  };

  // Save all new dates to the backend
  const handleSaveCourseDates = async () => {
    if (!managingDatesForCourse) return;

    const newDates = courseDates.filter(d => d.isNew);
    
    if (newDates.length === 0) {
      setShowDateDialog(false);
      handleCloseDateDialog();
      return;
    }

    try {
      setIsSubmitting(true);
      setDateError(null);

      // Create each new date individually with teacher info
      const createPromises = newDates.map(date => {
        const request: CreateCourseDateRequest = {
          courseId: managingDatesForCourse.id,
          dateType: date.dateType,
          scheduledDate: date.scheduledDate,
          startTime: date.startTime || undefined,
          endTime: date.endTime || undefined,
          location: date.location || undefined,
          meetingLink: date.meetingLink || undefined,
          maxCapacity: date.availableSpots && date.availableSpots < 999 ? date.availableSpots : undefined,
          // Only include teacherId if it's a non-empty string
          teacherId: date.teacherId && date.teacherId.trim() !== '' ? date.teacherId : undefined
        };
        return courseDateService.createCourseDate(request);
      });

      const results = await Promise.all(createPromises);
      
      const failedResults = results.filter(r => !r.success);
      
      if (failedResults.length > 0) {
        // Get the first error message to display
        const firstError = failedResults[0]?.message || 'Unknown error';
        setDateError(`${failedResults.length} date(s) failed to save: ${firstError}`);
      } else {
        // Update the local course state with the new dates count
        setCourses(prevCourses => 
          prevCourses.map(course => 
            course.courseId === managingDatesForCourse.id
              ? { 
                  ...course, 
                  courseDatesCount: courseDates.length,
                  courseDates: courseDates.map(d => d.scheduledDate)
                }
              : course
          )
        );
        
        setShowDateDialog(false);
        handleCloseDateDialog();
        fetchCourses(); // Refresh to update date counts from backend
      }
    } catch (err) {
      console.error('Error saving course dates:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save course dates';
      setDateError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close date dialog and reset state
  const handleCloseDateDialog = () => {
    setShowDateDialog(false);
    setManagingDatesForCourse(null);
    setCourseDates([]);
    setSelectedDate('');
    setSelectedDateType('General');
    setSelectedStartTime('09:00');
    setSelectedEndTime('17:00');
    setSelectedLocation('Face to Face');
    setSelectedMeetingLink('');
    setSelectedMaxCapacity('');
    setSelectedTeacherId('');
    setSelectedTeacherName('');
    setTeacherSearchQuery('');
    setDateError(null);
    // Reset bulk mode states
    setIsBulkMode(false);
    setBulkEndDate('');
    setSelectedDays({ 0: false, 1: false, 2: false, 3: false, 4: false, 5: false, 6: false });
  };

  // Select a teacher for the course date
  const handleSelectTeacher = (teacher: AdminResponse) => {
    setSelectedTeacherId(teacher.userId);
    setSelectedTeacherName(teacher.fullName);
    setShowTeacherDropdown(false);
    setTeacherSearchQuery('');
  };

  // Clear the selected teacher
  const handleClearTeacher = () => {
    setSelectedTeacherId('');
    setSelectedTeacherName('');
    setTeacherSearchQuery('');
  };

  // Toggle date status
  const handleToggleDateStatus = async (courseDateId: string) => {
    try {
      const response = await courseDateService.toggleCourseDateStatus(courseDateId);
      if (response.success) {
        // Refresh dates (only today and future)
        if (managingDatesForCourse) {
          const today = new Date();
          const fromDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
          const refreshResponse = await courseDateService.getCourseDatesForCourse(managingDatesForCourse.id, false, fromDate);
          if (refreshResponse.success && refreshResponse.data) {
            const filtered = refreshResponse.data.filter((d) => {
              const dStr = typeof d.scheduledDate === 'string'
                ? (d.scheduledDate.includes('T') ? d.scheduledDate.split('T')[0] : d.scheduledDate)
                : (d.scheduledDate as unknown as Date)?.toISOString?.()?.split('T')[0] ?? '';
              return dStr >= fromDate;
            });
            const existingDates: LocalCourseDate[] = filtered.map(d => ({
              ...d,
              isNew: false
            }));
            // Merge with any unsaved new dates
            const newDates = courseDates.filter(d => d.isNew);
            setCourseDates([...existingDates, ...newDates].sort((a, b) => 
              new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
            ));
          }
        }
      }
    } catch (err) {
      console.error('Error toggling date status:', err);
    }
  };

  // Pre-fill form to add another slot for a date (used by "Add slot" button)
  const handleAddSlotForDate = (scheduledDate: string, dateType: string) => {
    setSelectedDate(formatDateForInput(scheduledDate));
    setSelectedDateType(dateType);
    setIsBulkMode(false);
    setDateError(null);
  };

  // Group dates by date for display
  const groupedDates = courseDates.reduce((groups, date) => {
    const dateKey = formatDateForInput(date.scheduledDate);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(date);
    return groups;
  }, {} as Record<string, LocalCourseDate[]>);

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      resetForm();
      setIsEditing(false);
      setEditingCourseId(null);
      setEditingCourseImageUrl(null);
    }
    setShowDialog(open);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        <span className="ml-2 text-gray-600">Loading courses...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-3xl font-bold text-transparent">
            Course Management
          </h1>
          <p className="text-gray-600">Create and manage courses with detailed information</p>
        </div>
        <div className="flex gap-3">
          {/* Manage Categories Dialog */}
          <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-violet-200 hover:bg-violet-50">
                <Tags className="w-4 h-4 mr-2" />
                Manage Categories
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Manage Course Categories</DialogTitle>
                <DialogDescription>Add, edit, or remove course categories</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Add New Category */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter new category name"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                    disabled={isCategorySubmitting}
                  />
                  <Button 
                    onClick={handleAddCategory} 
                    className="bg-violet-600 hover:bg-violet-700"
                    disabled={isCategorySubmitting || !newCategory.trim()}
                  >
                    {isCategorySubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add
                      </>
                    )}
                  </Button>
                </div>

                {/* Categories List - Drag to reorder (order reflects on front page) */}
                <div className="border rounded-lg p-4 max-h-[400px] overflow-y-auto">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={pointerWithin}
                    onDragEnd={handleCategoryDragEnd}
                  >
                    <SortableContext
                      items={[...allCategories].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)).map((c) => c.categoryId)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {[...allCategories]
                          .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
                          .map((category) => (
                            <SortableCategoryRow
                              key={category.categoryId}
                              category={category}
                              editingCategory={editingCategory}
                              onEdit={handleEditCategory}
                              onCancelEdit={handleCancelEdit}
                              onSaveEdit={handleSaveEdit}
                              onDelete={handleDeleteCategory}
                              isSubmitting={isCategorySubmitting}
                              setEditingCategory={setEditingCategory}
                            />
                          ))}
                        {allCategories.length === 0 && (
                          <p className="text-center text-gray-500 py-4">No categories found</p>
                        )}
                      </div>
                    </SortableContext>
                  </DndContext>
                  {isCategoryReordering && (
                    <p className="text-sm text-violet-600 mt-2 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Reordering...
                    </p>
                  )}
                </div>

                <p className="text-sm text-gray-500">
                  Total Categories: <strong>{allCategories.length}</strong>
                  <span className="text-gray-400 ml-2">• Drag to reorder (order appears on front page)</span>
                </p>
              </div>
            </DialogContent>
          </Dialog>

          {/* Reorder Courses Dialog */}
          <Dialog
            open={showReorderCoursesDialog}
            onOpenChange={(open) => {
              setShowReorderCoursesDialog(open);
              setSelectedCategoryForReorder(null);
            }}
          >
            <DialogTrigger asChild>
              <Button variant="outline" className="border-violet-200 hover:bg-violet-50">
                <ListOrdered className="w-4 h-4 mr-2" />
                Reorder Courses
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Manage Course Order</DialogTitle>
                <DialogDescription>
                  Select a category, then drag courses to reorder. Order reflects on the landing page.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 flex-1 min-h-0 overflow-hidden flex flex-col">
                {/* Category selector */}
                <div className="border rounded-lg p-3 max-h-[200px] overflow-y-auto">
                  <p className="text-sm font-medium text-gray-700 mb-2">Select category</p>
                  <div className="space-y-1">
                    {[...allCategories]
                      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
                      .map((category) => (
                        <button
                          key={category.categoryId}
                          type="button"
                          onClick={() => setSelectedCategoryForReorder(category)}
                          className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                            selectedCategoryForReorder?.categoryId === category.categoryId
                              ? 'bg-violet-100 border border-violet-300 text-violet-800'
                              : 'bg-gray-50 hover:bg-gray-100 border border-transparent text-gray-700'
                          }`}
                        >
                          <span className="font-medium">{category.categoryName}</span>
                          {category.courseCount > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {category.courseCount} courses
                            </Badge>
                          )}
                        </button>
                      ))}
                    {allCategories.length === 0 && (
                      <p className="text-center text-gray-500 py-4">No categories found</p>
                    )}
                  </div>
                </div>
                {/* Course list for selected category (drag-and-drop) */}
                {selectedCategoryForReorder && (
                  <div className="border rounded-lg p-4 flex-1 min-h-0 overflow-y-auto flex flex-col">
                    <h4 className="text-sm font-semibold text-violet-700 mb-2">
                      Courses in {selectedCategoryForReorder.categoryName}
                      {isReordering && (
                        <span className="text-sm font-normal text-gray-500 ml-2">(reordering...)</span>
                      )}
                    </h4>
                    {(() => {
                      const categoryCourses = courses
                        .filter((c) => c.categoryId === selectedCategoryForReorder.categoryId)
                        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
                      const courseIds = categoryCourses.map((c) => c.courseId);
                      if (categoryCourses.length === 0) {
                        return <p className="text-gray-500 py-4">No courses in this category.</p>;
                      }
                      return (
                        <DndContext
                          sensors={sensors}
                          collisionDetection={pointerWithin}
                          onDragEnd={handleDragEnd}
                        >
                          <SortableContext items={courseIds} strategy={verticalListSortingStrategy}>
                            <div className="space-y-2">
                              {categoryCourses.map((course) => (
                                <SortableCourseTitleRow key={course.courseId} course={course} />
                              ))}
                            </div>
                          </SortableContext>
                        </DndContext>
                      );
                    })()}
                  </div>
                )}
                {!selectedCategoryForReorder && (
                  <p className="text-sm text-gray-500 py-2">Select a category above to reorder its courses.</p>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Create New Course Dialog */}
          <Dialog open={showDialog} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700">
                <Plus className="w-4 h-4 mr-2" />
                Create New Course
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{isEditing ? 'Edit Course' : 'Create New Course'}</DialogTitle>
                <DialogDescription>
                  {isEditing ? 'Update course details' : 'Set up a new course with comprehensive details'}
                </DialogDescription>
              </DialogHeader>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="requirements">Requirements</TabsTrigger>
                  <TabsTrigger value="pathways">Pathways</TabsTrigger>
                  <TabsTrigger value="combo">Combo Offer</TabsTrigger>
                </TabsList>

                {/* Basic Info Tab */}
                <TabsContent value="basic" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="code">Course Code (Optional)</Label>
                      <Input
                        id="code"
                        placeholder="e.g., RIIHAN309F"
                        value={formData.code}
                        onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="title">Course Title (Optional)</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Conduct Telescopic materials handler operations"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category (Optional)</Label>
                      <Select
                        value={formData.categoryId}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
                      >
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.categoryId} value={category.categoryId}>
                              {category.categoryName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration (Optional)</Label>
                      <Input
                        id="duration"
                        placeholder="e.g., 1 Day Course"
                        value={formData.duration}
                        onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                      />
                    </div>
                    {/* Price options: main + SL + BL (strikethrough + price) */}
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-gray-700">Pricing (Optional)</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="price">Selling Price ($)</Label>
                          <Input
                            id="price"
                            type="number"
                            placeholder="e.g. 1050"
                            value={formData.price || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="originalPrice">Original Price ($) — strikethrough</Label>
                          <Input
                            id="originalPrice"
                            type="number"
                            placeholder="e.g. 450"
                            value={formData.originalPrice || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, originalPrice: parseFloat(e.target.value) || undefined }))}
                          />
                        </div>
                      </div>
                      <div className="border-t pt-3 mt-1">
                        <p className="text-xs font-medium text-gray-600 mb-2">SL + BL pricing</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="promoOriginalPrice">SL + BL Strikethrough Price ($)</Label>
                            <Input
                              id="promoOriginalPrice"
                              type="number"
                              placeholder="e.g. 499"
                              value={formData.promoOriginalPrice || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, promoOriginalPrice: parseFloat(e.target.value) || undefined }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="promoPrice">SL + BL Price ($)</Label>
                            <Input
                              id="promoPrice"
                              type="number"
                              placeholder="e.g. 399"
                              value={formData.promoPrice || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, promoPrice: parseFloat(e.target.value) || undefined }))}
                            />
                          </div>
                        </div>
                      </div>
                      {(formData.originalPrice != null && formData.originalPrice > 0) || (formData.promoPrice != null && formData.promoPrice > 0) ? (
                        <p className="text-sm text-gray-600">
                          Preview — Main:{' '}
                          {formData.originalPrice != null && formData.originalPrice > 0 && (
                            <span className="line-through text-gray-500">${formData.originalPrice}</span>
                          )}
                          {formData.originalPrice != null && formData.originalPrice > 0 && ' '}
                          <span className="font-semibold text-violet-600">${formData.price || 0}</span>
                          {formData.promoPrice != null && formData.promoPrice > 0 && (
                            <>
                              {' · SL + BL: '}
                              {formData.promoOriginalPrice != null && formData.promoOriginalPrice > 0 && (
                                <span className="line-through text-gray-500">${formData.promoOriginalPrice}</span>
                              )}
                              {formData.promoOriginalPrice != null && formData.promoOriginalPrice > 0 && ' '}
                              <span className="text-amber-600 font-medium">${formData.promoPrice}</span>
                            </>
                          )}
                        </p>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="validityPeriod">Certificate Validity (Optional)</Label>
                      <Input
                        id="validityPeriod"
                        placeholder="e.g., 3 years"
                        value={formData.validityPeriod}
                        onChange={(e) => setFormData(prev => ({ ...prev, validityPeriod: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="delivery">Delivery Method (Optional)</Label>
                      <Input
                        id="delivery"
                        placeholder="e.g., Face to Face Training"
                        value={formData.delivery}
                        onChange={(e) => setFormData(prev => ({ ...prev, delivery: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location (Optional)</Label>
                    <Select
                      value={formData.location}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
                    >
                      <SelectTrigger id="location">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Face to Face">Face to Face</SelectItem>
                        <SelectItem value="Online">Online</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <Label>Course Image (Optional)</Label>

                    {/* Upload Method Toggle */}
                    <div className="flex gap-2 mb-3">
                      <Button
                        type="button"
                        variant={imageUploadMethod === 'upload' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setImageUploadMethod('upload')}
                        className={imageUploadMethod === 'upload' ? 'bg-violet-600' : ''}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Image
                      </Button>
                      <Button
                        type="button"
                        variant={imageUploadMethod === 'url' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setImageUploadMethod('url')}
                        className={imageUploadMethod === 'url' ? 'bg-violet-600' : ''}
                      >
                        URL
                      </Button>
                    </div>

                    {/* Upload Option */}
                    {imageUploadMethod === 'upload' && (
                      <div className="space-y-3">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-violet-400 transition-colors">
                          <input
                            type="file"
                            id="imageUpload"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                          <label htmlFor="imageUpload" className="cursor-pointer">
                            <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <p className="text-sm text-gray-600 mb-1">
                              Click to upload or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">
                              PNG, JPG, WEBP up to 5MB
                            </p>
                          </label>
                        </div>

                        {imagePreview && (
                          <div className="relative">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-full h-48 object-cover rounded-lg"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2"
                              onClick={clearImage}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* URL Option */}
                    {imageUploadMethod === 'url' && (
                      <div className="space-y-3">
                        <Input
                          id="imageUrl"
                          placeholder="https://example.com/image.jpg"
                          value={formData.image}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, image: e.target.value }));
                            setImagePreview(e.target.value);
                          }}
                        />

                        {formData.image && (
                          <div className="relative">
                            <img
                              src={formData.image}
                              alt="Preview"
                              className="w-full h-48 object-cover rounded-lg"
                              onError={() => setImagePreview('')}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-gray-500">
                      This image will be displayed on the course card and detail page
                    </p>
                  </div>
                </TabsContent>

                {/* Details Tab */}
                <TabsContent value="details" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Course Description (Optional)</Label>
                    <p className="text-xs text-gray-500">
                      Select text then use Bold/Italic. Or use: **bold** *italic* ## Heading ## ### Subheading ### - bullet 1. numbered
                    </p>
                    {formData.courseDescriptions.map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <div className="flex-1 flex flex-col gap-1">
                          <div className="flex flex-wrap gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 px-2"
                              title="Bold (select text first)"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => applyDescriptionFormatting(index, '**')}
                            >
                              <Bold className="w-4 h-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 px-2"
                              title="Italic (select text first)"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => applyDescriptionFormatting(index, '*')}
                            >
                              <Italic className="w-4 h-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 px-2"
                              title="Heading 2 (## )"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => insertDescriptionAtCursor(index, '## ')}
                            >
                              <Heading2 className="w-4 h-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 px-2"
                              title="Heading 3 (### )"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => insertDescriptionAtCursor(index, '### ')}
                            >
                              <Heading3 className="w-4 h-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 px-2"
                              title="Bullet list (- )"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => insertDescriptionAtCursor(index, '- ')}
                            >
                              <List className="w-4 h-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 px-2"
                              title="Numbered list (1. )"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => insertDescriptionAtCursor(index, '1. ')}
                            >
                              <ListOrdered className="w-4 h-4" />
                            </Button>
                          </div>
                          <Textarea
                            id={`course-desc-${index}`}
                            ref={(el) => { descriptionTextareaRefs.current[index] = el; }}
                            placeholder="Description paragraph... Use **bold**, *italic*, ## heading, - bullet, 1. numbered"
                            rows={5}
                            value={item}
                            onChange={(e) => updateArrayItem('courseDescriptions', index, e.target.value)}
                            className="flex-1 font-mono text-sm"
                          />
                          {item.trim() ? (
                            <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm">
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Preview</span>
                              <div
                                className="mt-1 prose prose-sm max-w-none [&_.course-desc-h2]:text-base [&_.course-desc-h2]:font-semibold [&_.course-desc-h3]:text-sm [&_.course-desc-h3]:font-medium [&_.course-desc-ul]:list-disc [&_.course-desc-ol]:list-decimal [&_.course-desc-li]:my-0.5"
                                dangerouslySetInnerHTML={{ __html: courseDescriptionToHtml(item) }}
                              />
                            </div>
                          ) : null}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="shrink-0 self-start"
                          onClick={() => removeArrayItem('courseDescriptions', index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addArrayItem('courseDescriptions')}
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add Description Paragraph
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Training Overview (Optional)</Label>
                    {formData.trainingOverview.map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="Training point..."
                          value={item}
                          onChange={(e) => updateArrayItem('trainingOverview', index, e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeArrayItem('trainingOverview', index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addArrayItem('trainingOverview')}
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add Training Point
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Vocational Outcome (Optional)</Label>
                    {formData.vocationalOutcome.map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="Outcome point..."
                          value={item}
                          onChange={(e) => updateArrayItem('vocationalOutcome', index, e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeArrayItem('vocationalOutcome', index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addArrayItem('vocationalOutcome')}
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add Outcome Point
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Fees and Charges (Optional)</Label>
                    {formData.feesAndCharges.map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="Fee or charge detail..."
                          value={item}
                          onChange={(e) => updateArrayItem('feesAndCharges', index, e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeArrayItem('feesAndCharges', index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addArrayItem('feesAndCharges')}
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add Fee/Charge
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Optional Charges (Optional)</Label>
                    {formData.optional.map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="e.g., Certificate Reissuance: $50 per item"
                          value={item}
                          onChange={(e) => updateArrayItem('optional', index, e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeArrayItem('optional', index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addArrayItem('optional')}
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add Optional Charge
                    </Button>
                  </div>
                </TabsContent>

                {/* Requirements Tab */}
                <TabsContent value="requirements" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Entry Requirements (Optional)</Label>
                    {formData.entryRequirements.map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="Entry requirement..."
                          value={item}
                          onChange={(e) => updateArrayItem('entryRequirements', index, e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeArrayItem('entryRequirements', index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addArrayItem('entryRequirements')}
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add Requirement
                    </Button>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Upload handbook (Optional)
                      </CardTitle>
                      <CardDescription>
                        Upload a PDF or enter a URL. This handbook is shown on the course details page with a view option.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="resourcePdfTitle">Handbook title</Label>
                        <Input
                          id="resourcePdfTitle"
                          placeholder="e.g., Code of Practice Managing the Risk..."
                          value={formData.resourcePdfTitle || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, resourcePdfTitle: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Upload handbook</Label>
                        <div className="flex flex-wrap gap-2 items-center">
                          <input
                            ref={resourcePdfInputRef}
                            type="file"
                            accept=".pdf,application/pdf"
                            className="hidden"
                            onChange={handleResourcePdfFileChange}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => resourcePdfInputRef.current?.click()}
                            disabled={resourcePdfUploading}
                          >
                            {resourcePdfUploading ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Upload className="w-4 h-4 mr-2" />
                            )}
                            {resourcePdfFile ? resourcePdfFile.name : 'Choose PDF'}
                          </Button>
                          {resourcePdfFile && (
                            <Button
                              type="button"
                              onClick={handleResourcePdfUpload}
                              disabled={resourcePdfUploading}
                            >
                              {resourcePdfUploading ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Upload className="w-4 h-4 mr-2" />
                              )}
                              Upload
                            </Button>
                          )}
                          {formData.resourcePdfUrl && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={clearResourcePdf}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Clear
                            </Button>
                          )}
                        </div>
                        {resourcePdfUploadError && (
                          <p className="text-sm text-red-600">{resourcePdfUploadError}</p>
                        )}
                        {formData.resourcePdfUrl && (
                          <p className="text-sm text-green-600 flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            Handbook linked. It will appear on the course details page.
                          </p>
                        )}
                      </div>
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-white px-2 text-gray-500">Or</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="resourcePdfUrl">Enter handbook URL</Label>
                        <Input
                          id="resourcePdfUrl"
                          placeholder="https://... (external link)"
                          value={formData.resourcePdfUrl || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, resourcePdfUrl: e.target.value }))}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Pathways Tab */}
                <TabsContent value="pathways" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="pathwaysDescription">Pathways Description (Optional)</Label>
                    <Textarea
                      id="pathwaysDescription"
                      rows={3}
                      placeholder="Description of pathways and certifications..."
                      value={formData.pathwaysDescription}
                      onChange={(e) => setFormData(prev => ({ ...prev, pathwaysDescription: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Pathway Certifications (Optional)</Label>
                    {formData.pathwaysCertifications.map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="e.g., RII30820 - Certificate III in Civil Construction Plant Operations"
                          value={item}
                          onChange={(e) => updateArrayItem('pathwaysCertifications', index, e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeArrayItem('pathwaysCertifications', index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addArrayItem('pathwaysCertifications')}
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add Certification
                    </Button>
                  </div>
                </TabsContent>

                {/* Combo Offer Tab */}
                <TabsContent value="combo" className="space-y-4 mt-4">
                  {/* Experience-Based Pricing Section */}
                  <Card className="border-2 border-green-200">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span>Experience-Based Pricing</span>
                        <Badge className="bg-gradient-to-r from-green-500 to-emerald-600">Booking Options</Badge>
                      </CardTitle>
                      <CardDescription>
                        Enable different pricing for students with and without prior experience
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="experienceBookingEnabled"
                          checked={formData.experienceBookingEnabled}
                          onChange={(e) => setFormData(prev => ({ ...prev, experienceBookingEnabled: e.target.checked }))}
                        />
                        <Label htmlFor="experienceBookingEnabled">Enable Experience-Based Booking</Label>
                      </div>

                      {formData.experienceBookingEnabled && (
                        <>
                          <div className="grid grid-cols-2 gap-6">
                            {/* With Experience */}
                            <div className="space-y-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                              <h4 className="font-semibold text-green-800 flex items-center gap-2">
                                ✓ Book With Experience
                              </h4>
                              <div className="space-y-2">
                                <Label htmlFor="experiencePrice">Price ($) (Optional)</Label>
                                <Input
                                  id="experiencePrice"
                                  type="number"
                                  placeholder="e.g., 400"
                                  value={formData.experiencePrice || ''}
                                  onChange={(e) => setFormData(prev => ({ ...prev, experiencePrice: parseFloat(e.target.value) || undefined }))}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="experienceOriginalPrice">Original Price ($) (Optional - for strikethrough)</Label>
                                <Input
                                  id="experienceOriginalPrice"
                                  type="number"
                                  placeholder="e.g., 500"
                                  value={formData.experienceOriginalPrice || ''}
                                  onChange={(e) => setFormData(prev => ({ ...prev, experienceOriginalPrice: parseFloat(e.target.value) || undefined }))}
                                />
                              </div>
                            </div>

                            {/* Without Experience */}
                            <div className="space-y-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                              <h4 className="font-semibold text-red-800 flex items-center gap-2">
                                ✗ Book Without Experience
                              </h4>
                              <div className="space-y-2">
                                <Label htmlFor="noExperiencePrice">Price ($) (Optional)</Label>
                                <Input
                                  id="noExperiencePrice"
                                  type="number"
                                  placeholder="e.g., 620"
                                  value={formData.noExperiencePrice || ''}
                                  onChange={(e) => setFormData(prev => ({ ...prev, noExperiencePrice: parseFloat(e.target.value) || undefined }))}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="noExperienceOriginalPrice">Original Price ($) (Optional - for strikethrough)</Label>
                                <Input
                                  id="noExperienceOriginalPrice"
                                  type="number"
                                  placeholder="e.g., 800"
                                  value={formData.noExperienceOriginalPrice || ''}
                                  onChange={(e) => setFormData(prev => ({ ...prev, noExperienceOriginalPrice: parseFloat(e.target.value) || undefined }))}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-semibold text-blue-900 mb-2">Preview</h4>
                            <div className="flex gap-4">
                              <div className="flex-1 bg-green-100 rounded-lg p-3 text-center">
                                {formData.experienceOriginalPrice && (
                                  <span className="text-sm text-gray-500 line-through mr-2">${formData.experienceOriginalPrice}</span>
                                )}
                                <span className="font-bold text-green-700">${formData.experiencePrice || 0}</span>
                                <div className="text-xs text-green-600 mt-1">Book With Experience</div>
                              </div>
                              <div className="flex-1 bg-red-100 rounded-lg p-3 text-center">
                                {formData.noExperienceOriginalPrice && (
                                  <span className="text-sm text-gray-500 line-through mr-2">${formData.noExperienceOriginalPrice}</span>
                                )}
                                <span className="font-bold text-red-700">${formData.noExperiencePrice || 0}</span>
                                <div className="text-xs text-red-600 mt-1">Book Without Experience</div>
                              </div>
                            </div>
                          </div>

                          <p className="text-sm text-gray-500">
                            When enabled, two booking buttons will appear on the course card instead of "Book Now"
                          </p>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-violet-200">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span>Combo Package Offer</span>
                        <Badge className="bg-gradient-to-r from-violet-600 to-fuchsia-600">Premium</Badge>
                      </CardTitle>
                      <CardDescription>
                        Create a combo package offer by bundling this course with another course at a discounted price
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="comboOfferEnabled"
                          checked={formData.comboOfferEnabled}
                          onChange={(e) => setFormData(prev => ({ ...prev, comboOfferEnabled: e.target.checked }))}
                        />
                        <Label htmlFor="comboOfferEnabled">Enable Combo Package Offer</Label>
                      </div>

                      {formData.comboOfferEnabled && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="comboDescription">Combo Description (Optional)</Label>
                            <Input
                              id="comboDescription"
                              placeholder="e.g., RIIWHS204E + RIIWHS202E Enter and work in confined spaces"
                              value={formData.comboDescription || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, comboDescription: e.target.value }))}
                            />
                            <p className="text-sm text-gray-500">
                              Describe what courses are included in this combo package
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="comboPrice">Combo Price ($) (Optional)</Label>
                              <Input
                                id="comboPrice"
                                type="number"
                                placeholder="350"
                                value={formData.comboPrice || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, comboPrice: parseFloat(e.target.value) || undefined }))}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="comboDuration">Combo Duration (Optional)</Label>
                              <Input
                                id="comboDuration"
                                placeholder="e.g., 2 Days Training"
                                value={formData.comboDuration || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, comboDuration: e.target.value }))}
                              />
                            </div>
                          </div>

                          <div className="bg-violet-50 border border-violet-200 rounded-lg p-4">
                            <h4 className="font-semibold text-violet-900 mb-2">Combo Preview</h4>
                            <div className="space-y-1 text-sm">
                              <p><strong>Package:</strong> {formData.comboDescription || 'N/A'}</p>
                              <p><strong>Price:</strong> ${formData.comboPrice || 0}</p>
                              <p><strong>Duration:</strong> {formData.comboDuration || 'N/A'}</p>
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  <div className="flex gap-3 pt-4">
                    <Button
                      className="flex-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
                      onClick={isEditing ? handleUpdateCourse : handleCreateCourse}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {isEditing ? 'Updating...' : 'Creating...'}
                        </>
                      ) : (
                        isEditing ? 'Update Course' : 'Create Course'
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => handleDialogClose(false)}>
                      Cancel
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
          <button 
            className="ml-2 text-red-500 hover:text-red-700" 
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Search courses by name or code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchCourses(searchQuery)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Courses List - Grouped by Category (aligned with landing page) */}
      <div className="space-y-8">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
          </div>
        ) : courses.length === 0 ? (
          <Card className="border-violet-100">
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 mb-4">No courses found. Create your first course!</p>
              <Button 
                onClick={() => setShowDialog(true)}
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Course
              </Button>
            </CardContent>
          </Card>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragEnd={handleDragEnd}
          >
            {coursesByCategory.map(({ category, courses: categoryCourses }) => {
              const courseIds = categoryCourses.map((c) => c.courseId);
              return (
                <div key={category.categoryId} className="space-y-4">
                  <h3 className="text-xl font-semibold text-violet-700 flex items-center gap-2">
                    {category.categoryName}
                    {isReordering && (
                      <span className="text-sm font-normal text-gray-500">(reordering...)</span>
                    )}
                  </h3>
                  <SortableContext items={courseIds} strategy={verticalListSortingStrategy}>
                    <div className="grid grid-cols-1 gap-4">
                      {categoryCourses.map((course) => (
                        <SortableCourseCard
                          key={course.courseId}
                          course={course}
                          onEdit={handleEditCourse}
                          onToggleStatus={handleToggleCourseStatus}
                          onManageDates={handleOpenDateDialog}
                          onDelete={(id) => setCourseToDelete(id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </div>
              );
            })}
            {uncategorizedCourses.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-600">Uncategorized</h3>
                <SortableContext items={uncategorizedCourses.map((c) => c.courseId)} strategy={verticalListSortingStrategy}>
                  <div className="grid grid-cols-1 gap-4">
                    {uncategorizedCourses.map((course) => (
                      <SortableCourseCard
                        key={course.courseId}
                        course={course}
                        onEdit={handleEditCourse}
                        onToggleStatus={handleToggleCourseStatus}
                        onManageDates={handleOpenDateDialog}
                        onDelete={(id) => setCourseToDelete(id)}
                        disabled
                      />
                    ))}
                  </div>
                </SortableContext>
              </div>
            )}
          </DndContext>
        )}
      </div>

      {/* ==================== COURSE DATES MANAGEMENT DIALOG ==================== */}
      <Dialog open={showDateDialog} onOpenChange={(open) => !open && handleCloseDateDialog()}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-violet-600" />
              Manage Course Dates
            </DialogTitle>
            <DialogDescription>
              {managingDatesForCourse && (
                <span>
                  <strong>{managingDatesForCourse.code}</strong> - {managingDatesForCourse.name}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {dateError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
              <span>{dateError}</span>
              <button onClick={() => setDateError(null)} className="text-red-500 hover:text-red-700">×</button>
            </div>
          )}

          <div className="space-y-6">
            {/* Add New Date Section */}
            <Card className="border-violet-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Add New Date
                  </CardTitle>
                  {/* Bulk Mode Toggle */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isBulkMode}
                      onChange={(e) => {
                        setIsBulkMode(e.target.checked);
                        if (!e.target.checked) {
                          setBulkEndDate('');
                          setSelectedDays({ 0: false, 1: false, 2: false, 3: false, 4: false, 5: false, 6: false });
                        }
                      }}
                      className="w-4 h-4 text-violet-600 rounded border-gray-300 focus:ring-violet-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Bulk Upload</span>
                  </label>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Date Input */}
                  <div className="space-y-2">
                    <Label>{isBulkMode ? 'Start Date *' : 'Date *'}</Label>
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  {/* End Date - Only show in bulk mode */}
                  {isBulkMode ? (
                    <div className="space-y-2">
                      <Label>End Date *</Label>
                      <Input
                        type="date"
                        value={bulkEndDate}
                        onChange={(e) => setBulkEndDate(e.target.value)}
                        min={selectedDate || new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  ) : (
                    /* Date Type Selector - Show in single mode */
                    <div className="space-y-2">
                      <Label>Session Type *</Label>
                      <Select value={selectedDateType} onValueChange={setSelectedDateType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {DATE_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${type.color}`} />
                                {type.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Day Selection - Only show in bulk mode */}
                {isBulkMode && (
                  <div className="space-y-3 p-4 bg-violet-50 rounded-lg border border-violet-200">
                    <Label className="text-sm font-medium">Select Days of the Week *</Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { day: 0, label: 'Sun' },
                        { day: 1, label: 'Mon' },
                        { day: 2, label: 'Tue' },
                        { day: 3, label: 'Wed' },
                        { day: 4, label: 'Thu' },
                        { day: 5, label: 'Fri' },
                        { day: 6, label: 'Sat' },
                      ].map(({ day, label }) => (
                        <label
                          key={day}
                          className={`flex items-center justify-center w-12 h-10 rounded-lg cursor-pointer transition-all ${
                            selectedDays[day]
                              ? 'bg-violet-600 text-white'
                              : 'bg-white border border-gray-300 text-gray-700 hover:border-violet-400'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedDays[day]}
                            onChange={(e) => setSelectedDays(prev => ({ ...prev, [day]: e.target.checked }))}
                            className="sr-only"
                          />
                          <span className="text-sm font-medium">{label}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">
                      Select the days on which sessions should be scheduled
                    </p>
                  </div>
                )}

                {/* Session Type - Show in bulk mode (moved from grid) */}
                {isBulkMode && (
                  <div className="space-y-2">
                    <Label>Session Type *</Label>
                    <Select value={selectedDateType} onValueChange={setSelectedDateType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {DATE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${type.color}`} />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Start Time */}
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={selectedStartTime}
                      onChange={(e) => setSelectedStartTime(e.target.value)}
                    />
                  </div>

                  {/* End Time */}
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={selectedEndTime}
                      onChange={(e) => setSelectedEndTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Location */}
                  <div className="space-y-2">
                    <Label>Location (Optional)</Label>
                    <Select
                      value={selectedLocation}
                      onValueChange={(value) => setSelectedLocation(value)}
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

                  {/* Max Capacity */}
                  <div className="space-y-2">
                    <Label>Max Capacity (Optional)</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 20"
                      value={selectedMaxCapacity}
                      onChange={(e) => setSelectedMaxCapacity(e.target.value)}
                    />
                  </div>
                </div>

                {/* Meeting Link - Only show when location is Online */}
                {selectedLocation === 'Online' && (
                  <div className="space-y-2">
                    <Label>Meeting Link *</Label>
                    <Input
                      type="url"
                      placeholder="https://zoom.us/j/..."
                      value={selectedMeetingLink}
                      onChange={(e) => setSelectedMeetingLink(e.target.value)}
                    />
                    <p className="text-xs text-gray-500">
                      Enter the Zoom, Teams, or other meeting link for this online session
                    </p>
                  </div>
                )}

                {/* Teacher Assignment */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    Assign Teacher (Optional)
                  </Label>
                  {selectedTeacherName ? (
                    <div className="flex items-center gap-2 p-3 bg-violet-50 border border-violet-200 rounded-lg">
                      <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-lg flex items-center justify-center">
                        <GraduationCap className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{selectedTeacherName}</div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClearTeacher}
                        className="text-gray-500 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="Search teachers by name or email..."
                          value={teacherSearchQuery}
                          onChange={(e) => {
                            setTeacherSearchQuery(e.target.value);
                            setShowTeacherDropdown(true);
                          }}
                          onFocus={() => setShowTeacherDropdown(true)}
                          className="pl-10"
                        />
                      </div>
                      {showTeacherDropdown && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {isLoadingTeachers ? (
                            <div className="flex items-center justify-center p-4">
                              <Loader2 className="w-5 h-5 animate-spin text-violet-600" />
                              <span className="ml-2 text-sm text-gray-500">Loading teachers...</span>
                            </div>
                          ) : teachers.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">
                              No teachers found
                            </div>
                          ) : (
                            teachers.map((teacher) => (
                              <button
                                key={teacher.userId}
                                type="button"
                                onClick={() => handleSelectTeacher(teacher)}
                                className="w-full flex items-center gap-3 p-3 hover:bg-violet-50 transition-colors text-left"
                              >
                                <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <GraduationCap className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{teacher.fullName}</div>
                                  <div className="text-xs text-gray-500">{teacher.email}</div>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    Search and select a teacher to conduct this session
                  </p>
                </div>

                <Button
                  onClick={handleAddDate}
                  disabled={!selectedDate || (isBulkMode && (!bulkEndDate || !Object.values(selectedDays).some(v => v)))}
                  className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {isBulkMode ? 'Add Bulk Dates' : 'Add Date'}
                </Button>
              </CardContent>
            </Card>

            {/* Existing Dates List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">
                  Scheduled Dates ({courseDates.length})
                </Label>
                <div className="flex gap-2">
                  {DATE_TYPES.map((type) => (
                    <div key={type.value} className="flex items-center gap-1 text-xs">
                      <div className={`w-2 h-2 rounded-full ${type.color}`} />
                      <span className="text-gray-500">{type.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {isLoadingDates ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
                  <span className="ml-2 text-gray-600">Loading dates...</span>
                </div>
              ) : courseDates.length === 0 ? (
                <div className="text-center py-12 border-2 rounded-lg border-dashed border-gray-300 bg-gray-50">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600 font-medium">No dates scheduled yet</p>
                  <p className="text-gray-500 text-sm">Add dates above for students to enroll</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto border rounded-lg p-4 bg-gray-50">
                  {Object.entries(groupedDates).map(([dateKey, datesOnDay]) => (
                    <div key={dateKey} className="space-y-2">
                      {/* Date Header */}
                      <div className="flex items-center justify-between gap-2 text-sm font-semibold text-gray-700 sticky top-0 bg-gray-50 py-1">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4" />
                          {formatDateForDisplay(datesOnDay[0].scheduledDate)}
                          <Badge variant="outline" className="text-xs">
                            {datesOnDay.length} session{datesOnDay.length !== 1 ? 's' : ''} available
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAddSlotForDate(datesOnDay[0].scheduledDate, datesOnDay[0].dateType)}
                          className="text-violet-600 hover:text-violet-700 hover:bg-violet-50 text-xs"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add slot
                        </Button>
                      </div>

                      {/* Sessions for this date */}
                      <div className="space-y-2 pl-6">
                        {datesOnDay.map((date) => {
                          const typeConfig = getDateTypeConfig(date.dateType);
                          const isDeleting = isDeletingDate === date.courseDateId;
                          
                          return (
                            <div
                              key={date.courseDateId || date.tempId}
                              className={`flex items-center justify-between p-3 bg-white rounded-lg border ${
                                date.isNew ? 'border-violet-300 border-dashed' : 'border-gray-200'
                              } hover:shadow-sm transition-all`}
                            >
                              <div className="flex items-center gap-3 flex-wrap">
                                {/* Type Badge */}
                                <Badge className={`${typeConfig.bgColor} ${typeConfig.textColor} border-0`}>
                                  {typeConfig.label}
                                </Badge>

                                {/* Time */}
                                {date.startTime && (
                                  <div className="flex items-center gap-1 text-sm text-gray-600">
                                    <Clock className="w-3 h-3" />
                                    <span>{date.startTime}</span>
                                    {date.endTime && <span>- {date.endTime}</span>}
                                  </div>
                                )}

                                {/* Teacher Info */}
                                {date.teacherName && (
                                  <div className="flex items-center gap-1 text-sm text-violet-600">
                                    <GraduationCap className="w-3 h-3" />
                                    <span>{date.teacherName}</span>
                                  </div>
                                )}

                                {/* Meeting Link for Online */}
                                {date.location === 'Online' && date.meetingLink && (
                                  <a 
                                    href={date.meetingLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                  </svg>
                                    <span>Link</span>
                                  </a>
                                )}

                                {/* New Badge */}
                                {date.isNew && (
                                  <Badge variant="outline" className="text-xs text-violet-600 border-violet-300">
                                    Unsaved
                                  </Badge>
                                )}

                                {/* Inactive Badge */}
                                {!date.isNew && date.isAvailable === false && (
                                  <Badge variant="outline" className="text-xs text-red-600 border-red-300">
                                    Inactive
                                  </Badge>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                {/* Availability info */}
                                {!date.isNew && ((date.currentEnrollments ?? 0) > 0 || (date.availableSpots !== undefined && date.availableSpots < 999)) && (
                                  <span className="text-xs text-gray-500">
                                    {(date.currentEnrollments ?? 0) > 0 ? `${date.currentEnrollments} enrolled` : ''}
                                    {(date.currentEnrollments ?? 0) > 0 && date.availableSpots !== undefined && date.availableSpots < 999 ? ', ' : ''}
                                    {date.availableSpots !== undefined && date.availableSpots < 999 ? `${date.availableSpots} spots left` : ''}
                                  </span>
                                )}

                                {/* Toggle Status Button (only for saved dates) */}
                                {!date.isNew && date.courseDateId && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleToggleDateStatus(date.courseDateId!)}
                                    className="text-gray-500 hover:text-gray-700"
                                    title={date.isAvailable ? 'Deactivate' : 'Activate'}
                                  >
                                    {date.isAvailable ? 'Deactivate' : 'Activate'}
                                  </Button>
                                )}

                                {/* Delete Button */}
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="inline-flex">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleRemoveDate(date)}
                                          disabled={isDeleting || (!date.isNew && (date.currentEnrollments ?? 0) > 0)}
                                          className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-60"
                                        >
                                          {isDeleting ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                          ) : (
                                            <Trash2 className="w-4 h-4" />
                                          )}
                                        </Button>
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {!date.isNew && (date.currentEnrollments ?? 0) > 0
                                        ? `Cannot delete - ${date.currentEnrollments} student(s) enrolled. Use Deactivate instead.`
                                        : 'Delete this date'}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleSaveCourseDates}
              disabled={isSubmitting || courseDates.filter(d => d.isNew).length === 0}
              className="flex-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Save New Dates ({courseDates.filter(d => d.isNew).length})
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleCloseDateDialog} disabled={isSubmitting}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation Dialog */}
      <AlertDialog open={categoryToDelete !== null} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this category? 
              {allCategories.find(c => c.categoryId === categoryToDelete)?.courseCount ? 
                ' This category has courses and will be deactivated instead.' : 
                ' This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCategoryToDelete(null)} disabled={isCategorySubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteCategory} 
              className="bg-red-600 hover:bg-red-700"
              disabled={isCategorySubmitting}
            >
              {isCategorySubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Course Confirmation Dialog */}
      <AlertDialog open={courseToDelete !== null} onOpenChange={(open) => !open && setCourseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this course? This will also delete all associated dates.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCourseToDelete(null)} disabled={isCourseDeleteSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteCourse}
              className="bg-red-600 hover:bg-red-700"
              disabled={isCourseDeleteSubmitting}
            >
              {isCourseDeleteSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}