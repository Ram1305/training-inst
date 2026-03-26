import { useEffect, useMemo, useState } from "react";
import { bannersService, type Banner } from "../../services/banners.service";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";

const DISMISSED_PUBLIC_BANNER_KEY = "public_banner_modal_dismissed_v1";

function getBannerVersion(banner: Banner): string {
  const stamp = banner.updatedAt || banner.createdAt || "";
  return `${banner.bannerId}:${stamp}`;
}

function safeReadLocalStorage(key: string): string | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeWriteLocalStorage(key: string, value: string) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

export function PublicBannerModal() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [open, setOpen] = useState(false);

  const topBanner = useMemo(() => {
    if (!banners || banners.length === 0) return null;
    return banners[0];
  }, [banners]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await bannersService.getActivePublicBanners();
        if (cancelled) return;
        if (res.success && res.data) {
          setBanners(res.data);
        } else {
          setBanners([]);
        }
      } catch {
        if (!cancelled) setBanners([]);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!topBanner) {
      setOpen(false);
      return;
    }

    const dismissedVersion = safeReadLocalStorage(DISMISSED_PUBLIC_BANNER_KEY);
    const currentVersion = getBannerVersion(topBanner);

    setOpen(dismissedVersion !== currentVersion);
  }, [topBanner]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && topBanner) {
      safeWriteLocalStorage(DISMISSED_PUBLIC_BANNER_KEY, getBannerVersion(topBanner));
    }
    setOpen(nextOpen);
  };

  if (!topBanner) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="p-0 overflow-hidden rounded-2xl max-w-[min(46rem,calc(100%-2rem))]">
        <div className="bg-gradient-to-r from-cyan-600 to-indigo-600 text-white px-6 py-4">
          <DialogTitle className="text-white text-base sm:text-lg font-semibold pr-8">
            {topBanner.title}
          </DialogTitle>
        </div>

        {topBanner.imageUrl ? (
          <div className="bg-white">
            <img
              src={topBanner.imageUrl}
              alt={topBanner.title}
              className="w-full h-auto max-h-[75vh] object-contain bg-white"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="bg-white px-6 py-8 text-slate-700">
            <div className="text-sm">No image configured for this banner.</div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

