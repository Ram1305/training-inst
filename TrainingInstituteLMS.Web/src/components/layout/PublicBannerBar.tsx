import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { bannersService, type Banner } from '../../services/banners.service';

export function PublicBannerBar() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [dismissed, setDismissed] = useState(false);

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

  if (dismissed) return null;
  if (!topBanner) return null;

  return (
    <div className="w-full bg-gradient-to-r from-cyan-600 to-indigo-600 text-white">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-3 relative">
        {topBanner.imageUrl ? (
          <img
            src={topBanner.imageUrl}
            alt={topBanner.title}
            className="w-10 h-10 rounded-md object-cover border border-white/20 shrink-0"
            loading="lazy"
          />
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold truncate">{topBanner.title}</div>
        </div>

        <button
          type="button"
          className="absolute right-2 top-2 inline-flex items-center justify-center rounded-md p-1.5 hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/60"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss banner"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

