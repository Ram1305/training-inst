import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Star, RefreshCw, Search, Loader2, ChevronUp, ChevronDown, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { reviewService, type GoogleReview, type GoogleReviewStats, type CreateGoogleReviewRequest, type UpdateGoogleReviewRequest } from '../../services/review.service';
import { toast } from 'sonner';

// Star rating display/input component
function StarRating({ rating, size = 'md', editable = false, onRatingChange }: { rating: number; size?: 'sm' | 'md'; editable?: boolean; onRatingChange?: (r: number) => void }) {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type={editable ? 'button' : undefined}
          onClick={editable ? () => onRatingChange?.(i) : undefined}
          className={editable ? 'cursor-pointer hover:scale-110 transition-transform' : ''}
          disabled={!editable}
        >
          <Star className={`${sizeClass} ${i <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
        </button>
      ))}
    </div>
  );
}

// Preview card - mimics landing page review card
function ReviewPreviewCard({ review }: { review: { author: string; rating: number; reviewText: string; timeText?: string | null; isMainReview: boolean } }) {
  return (
    <div className="rounded-xl border-2 border-violet-100 bg-gradient-to-br from-white to-violet-50/50 p-4 shadow-sm">
      {review.isMainReview ? (
        <div className="text-center">
          <div className="text-3xl font-bold text-transparent bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 to-blue-500 bg-clip-text mb-1">G</div>
          <div className="text-xs font-semibold text-gray-600 mb-2">{review.author}</div>
          <div className="text-2xl font-bold text-slate-900 mb-1">{review.rating}.0</div>
          <StarRating rating={review.rating} size="sm" />
          <p className="text-xs text-gray-600 mt-2 line-clamp-2">{review.reviewText}</p>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-start mb-2">
            <span className="font-bold text-slate-900 text-sm">{review.author}</span>
            <span className="text-xs font-bold text-transparent bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text">G</span>
          </div>
          <StarRating rating={review.rating} size="sm" />
          <p className="text-xs text-gray-700 leading-relaxed mt-2 line-clamp-3">{review.reviewText}</p>
          {review.timeText && <p className="text-xs text-gray-500 mt-1">{review.timeText}</p>}
        </div>
      )}
    </div>
  );
}

const initialForm: CreateGoogleReviewRequest = {
  author: '',
  rating: 5,
  reviewText: '',
  timeText: '',
  isMainReview: false,
  displayOrder: 0,
};

export function AdminReviews() {
  const [reviews, setReviews] = useState<GoogleReview[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [featuredFilter, setFeaturedFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showDialog, setShowDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateGoogleReviewRequest & { displayOrder?: number }>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<GoogleReview | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [stats, setStats] = useState<GoogleReviewStats | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setIsStatsLoading(true);
    try {
      const response = await reviewService.getAdminStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch {
      // ignore
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await reviewService.getAdminReviews({
        searchQuery: searchQuery || undefined,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
        isMainReview: featuredFilter === 'all' ? undefined : featuredFilter === 'featured',
        page: currentPage,
        pageSize,
        sortBy: 'displayOrder',
        sortDescending: false,
      });

      if (response.success) {
        const data = response.data;
        setReviews(data?.reviews ?? []);
        setTotalCount(data?.totalCount ?? 0);
        setTotalPages(data?.totalPages ?? 1);
        setError(null);
      } else {
        setError(response.message || 'Failed to fetch reviews');
        setReviews([]);
        setTotalCount(0);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
      const message = err instanceof Error ? err.message : 'Failed to fetch reviews';
      const isNetworkOrJson =
        message.includes('JSON') ||
        message.includes('Network') ||
        message.includes('fetch') ||
        message.includes('Failed to fetch');
      setError(
        isNetworkOrJson
          ? 'Could not load reviews. Check that the API is running and try again.'
          : message
      );
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter, featuredFilter, currentPage]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleRefresh = () => {
    fetchReviews();
    fetchStats();
  };

  const handleAddReview = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({ ...initialForm, displayOrder: (stats?.totalCount ?? 0) + 1 });
    setShowDialog(true);
  };

  const handleEditReview = (review: GoogleReview) => {
    setIsEditing(true);
    setEditingId(review.googleReviewId);
    setFormData({
      author: review.author,
      rating: review.rating,
      reviewText: review.reviewText,
      timeText: review.timeText || '',
      isMainReview: review.isMainReview,
      displayOrder: review.displayOrder,
    });
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    if (!formData.author.trim()) {
      toast.error('Author is required');
      return;
    }
    if (!formData.reviewText.trim()) {
      toast.error('Review text is required');
      return;
    }
    if (formData.rating < 1 || formData.rating > 5) {
      toast.error('Rating must be between 1 and 5');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && editingId) {
        const updateReq: UpdateGoogleReviewRequest = {
          author: formData.author.trim(),
          rating: formData.rating,
          reviewText: formData.reviewText.trim(),
          timeText: formData.timeText?.trim() || null,
          isMainReview: formData.isMainReview,
          displayOrder: formData.displayOrder ?? 0,
        };
        const response = await reviewService.updateReview(editingId, updateReq);
        if (response.success) {
          toast.success('Review updated successfully');
          setShowDialog(false);
          fetchReviews();
          fetchStats();
        } else {
          toast.error(response.message || 'Failed to update review');
        }
      } else {
        const createReq: CreateGoogleReviewRequest = {
          author: formData.author.trim(),
          rating: formData.rating,
          reviewText: formData.reviewText.trim(),
          timeText: formData.timeText?.trim() || null,
          isMainReview: formData.isMainReview,
          displayOrder: formData.displayOrder ?? 0,
        };
        const response = await reviewService.createReview(createReq);
        if (response.success) {
          toast.success('Review created successfully');
          setShowDialog(false);
          setFormData(initialForm);
          await fetchReviews();
          await fetchStats();
        } else {
          toast.error(response.message || 'Failed to create review');
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const response = await reviewService.deleteReview(deleteTarget.googleReviewId);
      if (response.success) {
        toast.success('Review deleted successfully');
        setDeleteTarget(null);
        fetchReviews();
        fetchStats();
      } else {
        toast.error(response.message || 'Failed to delete review');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete review');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (review: GoogleReview) => {
    try {
      const response = await reviewService.toggleStatus(review.googleReviewId);
      if (response.success) {
        toast.success(`Review ${review.isActive ? 'deactivated' : 'activated'} successfully`);
        fetchReviews();
        fetchStats();
      } else {
        toast.error(response.message || 'Failed to update status');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index <= 0) return;
    const newOrder = [...reviews];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    const ids = newOrder.map((r) => r.googleReviewId);
    try {
      const response = await reviewService.reorderReviews(ids);
      if (response.success) {
        toast.success('Order updated');
        fetchReviews();
      } else {
        toast.error(response.message || 'Failed to reorder');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reorder');
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index >= reviews.length - 1) return;
    const newOrder = [...reviews];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    const ids = newOrder.map((r) => r.googleReviewId);
    try {
      const response = await reviewService.reorderReviews(ids);
      if (response.success) {
        toast.success('Order updated');
        fetchReviews();
      } else {
        toast.error(response.message || 'Failed to reorder');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reorder');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
          Google Reviews
        </h1>
        <p className="text-gray-600">Manage reviews displayed on the landing page</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-violet-100">
          <CardHeader className="pb-3">
            <CardDescription>Total Reviews</CardDescription>
            <CardTitle className="text-3xl bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
              {isStatsLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : stats?.totalCount ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-violet-100">
          <CardHeader className="pb-3">
            <CardDescription>Featured (Main Review)</CardDescription>
            <CardTitle className="text-3xl text-amber-600">
              {isStatsLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : stats?.featuredCount ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-violet-100">
          <CardHeader className="pb-3">
            <CardDescription>Average Rating</CardDescription>
            <CardTitle className="text-3xl text-yellow-600 flex items-center gap-2">
              {isStatsLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <>
                  <Star className="w-7 h-7 fill-yellow-400 text-yellow-400" />
                  {stats?.averageRating?.toFixed(1) ?? '0'}
                </>
              )}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
            <Button variant="link" onClick={fetchReviews} className="ml-2 p-0 h-auto">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-violet-100">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Reviews</CardTitle>
              <CardDescription>Add, edit, or reorder reviews shown on the landing page</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button
                size="sm"
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
                onClick={handleAddReview}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Review
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by author or review text..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  title="Clear"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={featuredFilter} onValueChange={setFeaturedFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Featured" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="regular">Regular</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 rounded-xl border-2 border-dashed border-violet-200 bg-violet-50/50">
              <Star className="w-12 h-12 mx-auto text-violet-300 mb-4" />
              <p className="text-gray-600 font-medium mb-2">No review found</p>
              <p className="text-sm text-gray-500 mb-4">Add your first review to display on the landing page</p>
              <Button
                onClick={handleAddReview}
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Review
              </Button>
            </div>
          ) : (
            <>
              <div className="border rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-violet-50/50">
                      <TableHead className="w-12">Order</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Preview</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reviews.map((review, index) => (
                      <TableRow key={review.googleReviewId} className="hover:bg-violet-50/30">
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleMoveUp(index)}
                              disabled={index === 0}
                            >
                              <ChevronUp className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleMoveDown(index)}
                              disabled={index === reviews.length - 1}
                            >
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{review.author}</div>
                          {review.isMainReview && (
                            <Badge variant="secondary" className="mt-1 bg-amber-100 text-amber-800 text-xs">
                              Featured
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <StarRating rating={review.rating} size="sm" />
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px]">
                            <p className="text-sm text-gray-600 truncate" title={review.reviewText}>
                              {review.reviewText}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={review.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                            {review.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditReview(review)}>
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleStatus(review)}
                              className={review.isActive ? 'text-amber-600' : 'text-green-600'}
                            >
                              {review.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteTarget(review)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Review' : 'Add Review'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update the review details' : 'Add a new review to display on the landing page'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="author">Author *</Label>
                  <Input
                    id="author"
                    value={formData.author}
                    onChange={(e) => setFormData((f) => ({ ...f, author: e.target.value }))}
                    placeholder="e.g. John Smith"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rating *</Label>
                  <StarRating
                    rating={formData.rating}
                    size="md"
                    editable
                    onRatingChange={(r) => setFormData((f) => ({ ...f, rating: r }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reviewText">Review Text *</Label>
                  <Textarea
                    id="reviewText"
                    value={formData.reviewText}
                    onChange={(e) => setFormData((f) => ({ ...f, reviewText: e.target.value }))}
                    placeholder="The review content..."
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeText">Time Text (optional)</Label>
                  <Input
                    id="timeText"
                    value={formData.timeText || ''}
                    onChange={(e) => setFormData((f) => ({ ...f, timeText: e.target.value }))}
                    placeholder="e.g. a year ago"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayOrder">Display Order</Label>
                  <Input
                    id="displayOrder"
                    type="number"
                    min={1}
                    value={formData.displayOrder || 0}
                    onChange={(e) => setFormData((f) => ({ ...f, displayOrder: parseInt(e.target.value, 10) || 0 }))}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isMainReview"
                    checked={formData.isMainReview}
                    onCheckedChange={(checked) => setFormData((f) => ({ ...f, isMainReview: checked }))}
                  />
                  <Label htmlFor="isMainReview">Featured (Main Review with Google branding)</Label>
                </div>
              </div>
              <div>
                <Label className="mb-2 block">Preview</Label>
                <ReviewPreviewCard
                  review={{
                    author: formData.author || 'Author',
                    rating: formData.rating,
                    reviewText: formData.reviewText || 'Review text will appear here...',
                    timeText: formData.timeText || null,
                    isMainReview: formData.isMainReview ?? false,
                  }}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.author.trim() || !formData.reviewText.trim()}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the review from &quot;{deleteTarget?.author}&quot;? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
