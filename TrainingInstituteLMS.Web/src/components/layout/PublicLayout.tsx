import type { ReactNode } from "react";
import { PublicHeader } from "./PublicHeader";
import { PublicFooter } from "./PublicFooter";
import { WhatsAppButton } from "../ui/WhatsAppButton";

interface PublicLayoutProps {
  children: ReactNode;
  onBack: () => void;
  onLogin?: () => void;
  onRegister?: () => void;
  onAbout?: () => void;
  onContact?: () => void;
  onBookNow?: () => void;
  onForms?: () => void;
  onFeesRefund?: () => void;
  onGallery?: () => void;
  onCourseDetails?: (courseId: string) => void;
  onVOC?: () => void;
}

export function PublicLayout({
  children,
  onBack,
  onLogin,
  onRegister,
  onAbout,
  onContact,
  onBookNow,
  onForms,
  onFeesRefund,
  onGallery,
  onCourseDetails,
  onVOC,
}: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <PublicHeader
        onBack={onBack}
        onLogin={onLogin}
        onRegister={onRegister}
        onAbout={onAbout}
        onContact={onContact}
        onBookNow={onBookNow}
        onForms={onForms}
        onFeesRefund={onFeesRefund}
        onGallery={onGallery}
        onCourseDetails={onCourseDetails}
        onVOC={onVOC}
      />
      <main className="flex-grow">
        {children}
      </main>
      <PublicFooter
        onBack={onBack}
        onAbout={onAbout}
        onContact={onContact}
        onForms={onForms}
        onFeesRefund={onFeesRefund}
        onGallery={onGallery}
      />
      <WhatsAppButton />
    </div>
  );
}
