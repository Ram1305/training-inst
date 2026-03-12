import { Facebook, Linkedin, Instagram, MapPin, Phone, Mail, Shield } from "lucide-react";
import logoImage from '/assets/SafetyTrainingAcademylogo.png';

interface PublicFooterProps {
  onBack?: () => void;
  onAbout?: () => void;
  onContact?: () => void;
  onForms?: () => void;
  onFeesRefund?: () => void;
  onGallery?: () => void;
}

export function PublicFooter({ onBack, onAbout, onContact, onForms, onFeesRefund, onGallery }: PublicFooterProps) {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-0 px-4 mt-20 border-t-4 border-cyan-500">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 pb-12">
        {/* Logo and About */}
        <div className="space-y-6">
          <img
            src={logoImage}
            alt="Safety Training Academy"
            className="h-12 brightness-0 invert opacity-90"
          />
          <p className="text-sm leading-relaxed text-slate-400 max-w-xs">
            Providing nationally recognized safety training and certifications across Australia. Leading with quality and excellence since established.
          </p>
          <div className="flex gap-3">
            <a href="#" aria-label="Facebook" className="p-2.5 bg-blue-600 rounded-full hover:bg-blue-700 transition-colors">
              <Facebook className="w-4 h-4 text-white" />
            </a>
            <a href="#" aria-label="LinkedIn" className="p-2.5 bg-sky-700 rounded-full hover:bg-sky-800 transition-colors">
              <Linkedin className="w-4 h-4 text-white" />
            </a>
            <a href="#" aria-label="Instagram" className="p-2.5 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full hover:opacity-90 transition-opacity">
              <Instagram className="w-4 h-4 text-white" />
            </a>
          </div>
        </div>

        {/* Head Office */}
        <div className="space-y-5">
          <h3 className="text-white font-bold text-lg border-b border-slate-700 pb-2">Head Office</h3>
          <ul className="space-y-4 text-sm">
            <li className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <span className="text-slate-300">3/14-16 Marjorie Street, Sefton NSW 2162</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-cyan-400 shrink-0" />
              <a href="tel:1300976097" className="text-slate-300 hover:text-cyan-400 transition-colors font-medium">1300 976 097</a>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-cyan-400 shrink-0" />
              <a href="mailto:info@safetytrainingacademy.edu.au" className="text-slate-300 hover:text-cyan-400 transition-colors text-xs">info@safetytrainingacademy.edu.au</a>
            </li>
          </ul>
        </div>

        {/* Quick Links */}
        <div className="space-y-5">
          <h3 className="text-white font-bold text-lg border-b border-slate-700 pb-2">Quick Links</h3>
          <ul className="space-y-3 text-sm">
            <li><button onClick={onBack} className="text-slate-300 hover:text-cyan-400 transition-colors hover:translate-x-1 transform inline-block">Home</button></li>
            <li><button onClick={onAbout} className="text-slate-300 hover:text-cyan-400 transition-colors hover:translate-x-1 transform inline-block">About Us</button></li>
            <li><button onClick={onContact} className="text-slate-300 hover:text-cyan-400 transition-colors hover:translate-x-1 transform inline-block">Contact</button></li>
            <li><button onClick={onForms} className="text-slate-300 hover:text-cyan-400 transition-colors hover:translate-x-1 transform inline-block">Student Forms</button></li>
            <li><button onClick={onFeesRefund} className="text-slate-300 hover:text-cyan-400 transition-colors hover:translate-x-1 transform inline-block">Fees & Refunds</button></li>
            <li><button onClick={onGallery} className="text-slate-300 hover:text-cyan-400 transition-colors hover:translate-x-1 transform inline-block">Our Gallery</button></li>
          </ul>
        </div>

        {/* Accreditation */}
        <div className="space-y-5">
          <h3 className="text-white font-bold text-lg border-b border-slate-700 pb-2">Accreditation</h3>
          <div className="bg-slate-800 p-5 rounded-2xl border border-cyan-500/30 shadow-lg shadow-cyan-500/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center border border-cyan-500/30">
                <Shield className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">RTO Provider</div>
                <div className="text-2xl font-black text-white tracking-tight">#45234</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-slate-700 bg-slate-950">
        <div className="max-w-7xl mx-auto py-5 px-4 flex flex-col md:flex-row justify-between items-center gap-2 text-xs text-slate-400">
          <span>© {new Date().getFullYear()} Safety Training Academy. All rights reserved.</span>
          <span className="text-slate-500">RTO Provider #45234</span>
        </div>
      </div>
    </footer>
  );
}
