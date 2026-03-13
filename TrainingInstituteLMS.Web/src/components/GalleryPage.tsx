import { useState, useEffect } from 'react';
import { Phone, Mail, MapPin, Menu, X, Loader2, Images } from 'lucide-react';
import { Button } from './ui/button';
import { motion } from 'motion/react';
import { galleryService, getFullImageUrl, type GalleryImage } from '../services/gallery.service';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { PublicHeader } from './layout/PublicHeader';
import logoImage from '/assets/SafetyTrainingAcademylogo.png';

interface GalleryPageProps {
  onBack: () => void;
  onLogin: () => void;
  onRegister: () => void;
  onAbout?: () => void;
  onContact?: () => void;
  onBookNow?: () => void;
  onCourseDetails?: (courseId: string) => void;
  onForms?: () => void;
  onFeesRefund?: () => void;
  onVOC?: () => void;
  onViewCourses?: () => void;
}

export function GalleryPage({
  onBack,
  onLogin,
  onRegister,
  onAbout,
  onContact,
  onBookNow,
  onForms,
  onFeesRefund,
  onVOC,
  onViewCourses,
}: GalleryPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const response = await galleryService.getPublicGallery();
        if (response.success && response.data) {
          setImages(response.data);
        }
      } catch (error) {
        console.error('Error fetching gallery:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGallery();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader
        onBack={onBack}
        onLogin={onLogin}
        onRegister={onRegister}
        onAbout={onAbout}
        onContact={onContact}
        onBookNow={onBookNow}
        onForms={onForms}
        onFeesRefund={onFeesRefund}
        onGallery={undefined}
        onVOC={onVOC}
        onViewCourses={onViewCourses}
      />

 {/* Hero Section - Blue Theme */}
<div className="relative py-20 px-4 sm:py-24 lg:py-28 overflow-hidden">
  {/* Background gradient - attractive blue tones */}
  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-100" />
  
  {/* Subtle dot pattern overlay (blue-ish tone, very light) */}
  <div 
    className="absolute inset-0 opacity-30"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%233b82f6' fill-opacity='0.08'%3E%3Cpath d='M36 34c0-2.21-1.79-4-4-4s-4 1.79-4 4 1.79 4 4 4 4-1.79 4-4zm0-10c0-2.21-1.79-4-4-4s-4 1.79-4 4 1.79 4 4 4 4-1.79 4-4z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      backgroundSize: '60px 60px'
    }}
  />

  {/* Optional subtle wave/curve accent (can remove if you prefer clean look) */}
  <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[120%] h-64 bg-gradient-to-b from-sky-200/40 to-transparent blur-3xl" />

  <div className="relative max-w-7xl mx-auto text-center">
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >
      {/* Icon with blue gradient */}
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white mb-8 shadow-xl shadow-blue-200/50 ring-1 ring-blue-400/30">
        <Images className="w-10 h-10" />
      </div>

      {/* Main heading with blue gradient text */}
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-600 bg-clip-text text-transparent mb-5 tracking-tight">
        Gallery
      </h1>

      <p className="text-xl sm:text-2xl text-gray-700 max-w-3xl mx-auto font-medium leading-relaxed">
        Explore our training facilities, sessions, and success stories
      </p>

      {/* Optional subtle CTA / accent line */}
      <div className="mt-10">
        <div className="inline-block h-1 w-24 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" />
      </div>
    </motion.div>
  </div>
</div>

      {/* Gallery Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12 pb-20">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-violet-600" />
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border-2 border-dashed border-violet-200 bg-gradient-to-br from-violet-50/50 to-fuchsia-50/50">
            <Images className="w-16 h-16 mx-auto text-violet-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No images yet</h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Our gallery will be updated soon with photos from our training sessions and facilities.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {images.map((img, index) => (
              <motion.div
                key={img.galleryImageId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 bg-white border border-gray-100 hover:border-violet-200"
              >
                <div className="aspect-square relative overflow-hidden bg-gray-100">
                  <ImageWithFallback
                    src={getFullImageUrl(img.imageUrl)}
                    alt={img.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="text-lg font-semibold text-white drop-shadow-lg">{img.title}</h3>
                  </div>
                </div>
                <div className="p-4 bg-white group-hover:bg-violet-50/50 transition-colors">
                  <h3 className="font-semibold text-gray-900 group-hover:text-violet-800 transition-colors line-clamp-2">
                    {img.title}
                  </h3>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
