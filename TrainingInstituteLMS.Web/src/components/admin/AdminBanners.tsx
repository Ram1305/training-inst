import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Upload, X as XIcon, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Switch } from '../ui/switch';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { bannersService, type Banner } from '../../services/banners.service';
import { filesService } from '../../services/files.service';

export function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formSortOrder, setFormSortOrder] = useState<number>(0);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formImageFile, setFormImageFile] = useState<File | null>(null);
  const [formImagePreview, setFormImagePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const nextDefaultSortOrder = useMemo(() => {
    if (banners.length === 0) return 1;
    const maxOrder = Math.max(...banners.map((b) => b.sortOrder ?? 0));
    return (maxOrder || 0) + 1;
  }, [banners]);

  const fetchBanners = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await bannersService.getAdminBanners();
      if (res.success && res.data) {
        setBanners(res.data);
      } else {
        setBanners([]);
        setError(res.message || 'Failed to load banners');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load banners';
      setBanners([]);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const resetAddForm = () => {
    setFormTitle('');
    setFormSortOrder(0);
    setFormIsActive(true);
    setFormImageFile(null);
    setFormImagePreview('');
  };

  const openAddDialog = () => {
    resetAddForm();
    setFormSortOrder(nextDefaultSortOrder);
    setShowAddDialog(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPG, PNG, WebP, etc.)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size should be less than 5MB');
      return;
    }
    setFormImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setFormImagePreview(reader.result as string);
    reader.readAsDataURL(file);
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
    if (!formImageFile) {
      toast.error('Please upload a banner image');
      return;
    }

    setIsSubmitting(true);
    try {
      const imagePath = await filesService.uploadFileRelative(formImageFile, 'banners');

      const res = await bannersService.createBanner({
        title: formTitle.trim(),
        imagePath,
        isActive: formIsActive,
        sortOrder: Number.isFinite(formSortOrder) ? formSortOrder : nextDefaultSortOrder,
      });

      if (res.success) {
        toast.success('Banner created');
        setShowAddDialog(false);
        await fetchBanners();
      } else {
        toast.error(res.message || 'Failed to create banner');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create banner');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (b: Banner) => {
    try {
      const res = await bannersService.toggleBanner(b.bannerId);
      if (res.success) {
        toast.success(b.isActive ? 'Banner hidden' : 'Banner enabled');
        fetchBanners();
      } else {
        toast.error(res.message || 'Failed to update banner');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update banner');
    }
  };

  const handleSortOrderChange = async (b: Banner, value: number) => {
    try {
      const res = await bannersService.updateBanner(b.bannerId, { sortOrder: value });
      if (res.success) {
        fetchBanners();
      } else {
        toast.error(res.message || 'Failed to update sort order');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update sort order');
    }
  };

  const handleTitleChange = async (b: Banner, value: string) => {
    const nextTitle = value.trim();
    if (!nextTitle) {
      toast.error('Title is required');
      return;
    }
    try {
      const res = await bannersService.updateBanner(b.bannerId, { title: nextTitle });
      if (res.success) {
        fetchBanners();
      } else {
        toast.error(res.message || 'Failed to update title');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update title');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await bannersService.deleteBanner(deleteTarget.bannerId);
      if (res.success) {
        toast.success('Banner deleted');
        setDeleteTarget(null);
        fetchBanners();
      } else {
        toast.error(res.message || 'Failed to delete banner');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete banner');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Banners</h2>
          <p className="text-gray-600">
            Manage website banners (title + image). Turn a banner on to show it on the public site.
          </p>
        </div>
        <Button onClick={openAddDialog} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Banner
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Could not load banners</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Banners</CardTitle>
          <CardDescription>
            Use the toggle to show/hide. Lower sort order shows first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 text-center text-gray-600">Loading banners…</div>
          ) : banners.length === 0 ? (
            <div className="py-10 text-center text-gray-600">
              <div className="mx-auto mb-3 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-gray-500" />
              </div>
              No banners yet. Click “Add Banner” to create one.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {banners.map((b) => (
                <div
                  key={b.bannerId}
                  className="flex gap-4 p-4 rounded-xl border border-violet-100 bg-white"
                >
                  <div className="w-36 h-20 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center">
                    {b.imageUrl ? (
                      <ImageWithFallback
                        src={b.imageUrl}
                        alt={b.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-gray-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm text-gray-500">Title</div>
                        <Input
                          defaultValue={b.title}
                          onBlur={(e) => {
                            const next = e.target.value;
                            if (next.trim() !== b.title) handleTitleChange(b, next);
                          }}
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => setDeleteTarget(b)}
                        title="Delete banner"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-500">Sort order</div>
                        <Input
                          type="number"
                          defaultValue={b.sortOrder}
                          className="w-28"
                          onBlur={(e) => {
                            const next = Number(e.target.value);
                            if (!Number.isFinite(next)) return;
                            if (next !== b.sortOrder) handleSortOrderChange(b, next);
                          }}
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          checked={b.isActive}
                          onCheckedChange={() => handleToggleActive(b)}
                        />
                        <span className="text-sm text-gray-700">
                          {b.isActive ? 'On' : 'Off'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Banner</DialogTitle>
            <DialogDescription>
              Upload an image and set a title. Turn it on to show it on the public website.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bannerTitle">Title</Label>
              <Input
                id="bannerTitle"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. New course dates available"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Sort order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formSortOrder}
                  onChange={(e) => setFormSortOrder(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label>Active</Label>
                <div className="flex items-center gap-2 h-10">
                  <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
                  <span className="text-sm text-gray-700">{formIsActive ? 'On' : 'Off'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Image</Label>
              <div className="flex items-center gap-3">
                <Button variant="outline" className="gap-2" asChild>
                  <label>
                    <Upload className="w-4 h-4" />
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                  </label>
                </Button>
                {formImageFile && (
                  <div className="text-sm text-gray-600 truncate flex-1">{formImageFile.name}</div>
                )}
                {(formImageFile || formImagePreview) && (
                  <Button variant="ghost" size="sm" onClick={clearImage} title="Clear image">
                    <XIcon className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {formImagePreview && (
                <div className="mt-2 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                  <img src={formImagePreview} alt="Preview" className="w-full h-48 object-cover" />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmitAdd} disabled={isSubmitting} className="gap-2">
              {isSubmitting ? 'Saving…' : 'Create Banner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteTarget != null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete banner?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the banner. (The image file will also be deleted where possible.)
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

