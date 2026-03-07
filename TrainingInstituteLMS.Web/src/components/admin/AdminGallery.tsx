import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, RefreshCw, Search, Loader2, Upload, X, Edit2, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Badge } from '../ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { galleryService, getFullImageUrl, type GalleryImage, type CreateGalleryImageRequest, type UpdateGalleryImageRequest } from '../../services/gallery.service';
import { filesService } from '../../services/files.service';
import { toast } from 'sonner';
import { ImageWithFallback } from '../figma/ImageWithFallback';

export function AdminGallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(12);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formImageFile, setFormImageFile] = useState<File | null>(null);
  const [formImagePreview, setFormImagePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<GalleryImage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editTarget, setEditTarget] = useState<GalleryImage | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchImages = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await galleryService.getAdminGallery({
        searchQuery: searchQuery || undefined,
        page: currentPage,
        pageSize,
        sortBy: 'DisplayOrder',
        sortDescending: false,
      });

      if (response.success && response.data) {
        setImages(response.data.images);
        setTotalCount(response.data.totalCount);
        setTotalPages(response.data.totalPages);
        setError(null);
      } else {
        setError(response.message || 'Failed to fetch gallery images');
        setImages([]);
        setTotalCount(0);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Error fetching gallery:', err);
      const message = err instanceof Error ? err.message : 'Failed to fetch gallery';
      setError(
        message.includes('JSON') || message.includes('Network') || message.includes('fetch')
          ? 'Could not load gallery. Check that the API is running and try again.'
          : message
      );
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, currentPage]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleRefresh = () => {
    fetchImages();
  };

  const handleAddGallery = () => {
    setFormTitle('');
    setFormImageFile(null);
    setFormImagePreview('');
    setShowAddDialog(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file (JPG, PNG, WebP, etc.)');
        return;
      }
      setFormImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setFormImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setFormImageFile(null);
    setFormImagePreview('');
  };

  const handleSubmitAdd = async () => {
    if (!formTitle.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!formImageFile && !formImagePreview) {
      toast.error('Please add an image');
      return;
    }

    setIsSubmitting(true);
    setIsUploading(true);
    try {
      let imageUrl = '';
      if (formImageFile) {
        imageUrl = await filesService.uploadFile(formImageFile, 'gallery-images');
      } else if (formImagePreview?.startsWith('data:image/')) {
        imageUrl = formImagePreview;
      } else if (formImagePreview?.startsWith('http')) {
        imageUrl = formImagePreview;
      } else {
        toast.error('Invalid image');
        return;
      }

      const request: CreateGalleryImageRequest = {
        title: formTitle.trim(),
        imageUrl,
        displayOrder: totalCount + 1,
      };

      const response = await galleryService.createGalleryImage(request);
      if (response.success) {
        toast.success('Gallery image added successfully');
        setShowAddDialog(false);
        fetchImages();
      } else {
        toast.error(response.message || 'Failed to add gallery image');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add gallery image');
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const response = await galleryService.deleteGalleryImage(deleteTarget.galleryImageId);
      if (response.success) {
        toast.success('Gallery image deleted successfully');
        setDeleteTarget(null);
        fetchImages();
      } else {
        toast.error(response.message || 'Failed to delete');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditClick = (img: GalleryImage) => {
    setEditTarget(img);
    setEditTitle(img.title);
  };

  const handleSaveEdit = async () => {
    if (!editTarget) return;
    if (!editTitle.trim()) {
      toast.error('Title is required');
      return;
    }
    setIsUpdating(true);
    try {
      const request: UpdateGalleryImageRequest = { title: editTitle.trim() };
      const response = await galleryService.updateGalleryImage(editTarget.galleryImageId, request);
      if (response.success) {
        toast.success('Gallery image updated successfully');
        setEditTarget(null);
        fetchImages();
      } else {
        toast.error(response.message || 'Failed to update');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleActive = async (img: GalleryImage) => {
    try {
      const request: UpdateGalleryImageRequest = { isActive: !img.isActive };
      const response = await galleryService.updateGalleryImage(img.galleryImageId, request);
      if (response.success) {
        toast.success(img.isActive ? 'Image deactivated' : 'Image activated');
        fetchImages();
      } else {
        toast.error(response.message || 'Failed to update');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-3xl font-bold text-transparent">
          Gallery
        </h1>
        <p className="text-gray-600">Manage images displayed on the Gallery page</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-violet-100">
          <CardHeader className="pb-3">
            <CardDescription>Total Images</CardDescription>
            <CardTitle className="text-3xl bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : totalCount}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
            <Button variant="link" onClick={fetchImages} className="ml-2 p-0 h-auto">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-violet-100 shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl">Gallery Images</CardTitle>
              <CardDescription>Add images with titles to display on the public Gallery page</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button
                size="sm"
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 shadow-md"
                onClick={handleAddGallery}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Gallery
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
                placeholder="Search by title..."
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
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-10 h-10 animate-spin text-violet-600" />
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-16 rounded-xl border-2 border-dashed border-violet-200 bg-gradient-to-br from-violet-50/50 to-fuchsia-50/50">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-violet-100 to-fuchsia-100 flex items-center justify-center">
                <Plus className="w-8 h-8 text-violet-500" />
              </div>
              <p className="text-gray-700 font-semibold mb-2">No gallery images yet</p>
              <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                Add your first image with a title to showcase on the Gallery page
              </p>
              <Button
                onClick={handleAddGallery}
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 shadow-md"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Gallery
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {images.map((img) => (
                <div
                  key={img.galleryImageId}
                  className="rounded-xl overflow-hidden border-2 border-violet-100 bg-white shadow-md hover:shadow-xl transition-all duration-300 hover:border-violet-200 flex flex-col"
                >
                  <div className="aspect-square relative bg-gray-100 flex-shrink-0">
                    <ImageWithFallback
                      src={getFullImageUrl(img.imageUrl)}
                      alt={img.title}
                      className="w-full h-full object-cover"
                    />
                    {!img.isActive && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Badge variant="secondary" className="bg-gray-700">Inactive</Badge>
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 mb-3">{img.title}</h3>
                    <div className="flex flex-wrap gap-2 mt-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-gray-700 hover:bg-blue-50"
                        onClick={() => handleEditClick(img)}
                        title="Edit title"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`h-8 ${img.isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`}
                        onClick={() => handleToggleActive(img)}
                        title={img.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {img.isActive ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5 mr-1" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            Activate
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-red-600 hover:bg-red-50"
                        onClick={() => setDeleteTarget(img)}
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Gallery Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
              Add Gallery Image
            </DialogTitle>
            <DialogDescription>Upload an image and add a title. This will appear on the Gallery page.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="gallery-title">Title</Label>
              <Input
                id="gallery-title"
                placeholder="e.g. Safety Training Session"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Image</Label>
              <div className="border-2 border-dashed border-violet-200 rounded-xl p-6 text-center hover:border-violet-400 hover:bg-violet-50/30 transition-colors">
                <input
                  type="file"
                  id="gallery-image"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <label htmlFor="gallery-image" className="cursor-pointer block">
                  <Upload className="w-12 h-12 mx-auto mb-3 text-violet-400" />
                  <p className="text-sm font-medium text-gray-700 mb-1">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500">PNG, JPG, WebP up to 5MB</p>
                </label>
              </div>
              {formImagePreview && (
                <div className="relative mt-3 rounded-lg overflow-hidden border-2 border-violet-200 bg-gray-50">
                  <img
                    src={formImagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-2 flex justify-between items-center bg-gradient-to-t from-black/70 to-transparent">
                    <span className="text-sm font-medium text-white">Selected image</span>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="gap-1"
                      onClick={clearImage}
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitAdd}
              disabled={isSubmitting || !formTitle.trim() || (!formImageFile && !formImagePreview)}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isUploading ? 'Uploading...' : 'Adding...'}
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Image
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Gallery Image</DialogTitle>
            <DialogDescription>Update the title for this gallery image</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="e.g. Safety Training Session"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={isUpdating || !editTitle.trim()}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
            >
              {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Gallery Image</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.title}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
