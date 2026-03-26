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
      <DialogContent className="p-0 overflow-hidden w-screen h-[100svh] max-w-none rounded-none sm:w-full sm:h-auto sm:max-w-[min(72rem,calc(100%-2rem))] sm:rounded-2xl [&_[data-slot=dialog-close]]:text-white [&_[data-slot=dialog-close]]:opacity-100 [&_[data-slot=dialog-close]]:bg-red-600 [&_[data-slot=dialog-close]]:hover:bg-red-700 [&_[data-slot=dialog-close]]:rounded-full [&_[data-slot=dialog-close]]:h-10 [&_[data-slot=dialog-close]]:w-10 [&_[data-slot=dialog-close]]:p-0 [&_[data-slot=dialog-close]]:flex [&_[data-slot=dialog-close]]:items-center [&_[data-slot=dialog-close]]:justify-center">
        <div className="bg-gradient-to-r from-cyan-600 to-indigo-600 text-white px-5 sm:px-6 py-4">
          <DialogTitle className="text-white text-base sm:text-lg font-semibold pr-8">
            {topBanner.title}
          </DialogTitle>
        </div>

        {topBanner.imageUrl ? (
          <div className="bg-gradient-to-r from-cyan-600 to-indigo-600 h-[calc(100svh-4.25rem)] sm:h-auto">
            <img
              src={topBanner.imageUrl}
              alt={topBanner.title}
              className="w-full h-full sm:h-auto sm:max-h-[80vh] object-contain"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="bg-gradient-to-r from-cyan-600 to-indigo-600 px-6 py-8 text-white">
            <div className="text-sm opacity-90">No image configured for this banner.</div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

