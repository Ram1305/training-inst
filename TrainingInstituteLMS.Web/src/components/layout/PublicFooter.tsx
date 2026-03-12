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
    <footer className="bg-slate-900 text-slate-300 py-16 px-4 mt-20 border-t border-slate-800">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Logo and About */}
        <div className="space-y-6">
          <img
            src={logoImage}
            alt="Safety Training Academy"
            className="h-12 brightness-0 invert opacity-80"
          />
          <p className="text-sm leading-relaxed max-w-xs">
            Providing nationally recognized safety training and certifications across Australia. Leading with quality and excellence since established.
          </p>
          <div className="flex gap-4">
            <a href="#" className="p-2 bg-slate-800 rounded-full hover:bg-cyan-500 transition-colors group">
              <Facebook className="w-5 h-5 group-hover:text-white" />
            </a>
            <a href="#" className="p-2 bg-slate-800 rounded-full hover:bg-indigo-600 transition-colors group">
              <Linkedin className="w-5 h-5 group-hover:text-white" />
            </a>
            <a href="#" className="p-2 bg-slate-800 rounded-full hover:bg-pink-600 transition-colors group">
              <Instagram className="w-5 h-5 group-hover:text-white" />
            </a>
          </div>
        </div>

        {/* Head Office */}
        <div className="space-y-6">
          <h3 className="text-white font-bold text-lg">Head Office</h3>
          <ul className="space-y-4 text-sm font-medium">
            <li className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-cyan-500 shrink-0" />
              <span>3/14-16 Marjorie Street, Sefton NSW 2162</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-cyan-500 shrink-0" />
              <a href="tel:1300976097" className="hover:text-cyan-400 transition-colors">1300 976 097</a>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-cyan-500 shrink-0" />
              <a href="mailto:info@safetytrainingacademy.edu.au" className="hover:text-cyan-400 transition-colors">info@safetytrainingacademy.edu.au</a>
            </li>
          </ul>
        </div>

        {/* Quick Links */}
        <div className="space-y-6">
          <h3 className="text-white font-bold text-lg">Quick Links</h3>
          <ul className="space-y-3 text-sm font-medium">
            <li><button onClick={onBack} className="hover:text-cyan-400 transition-colors">Home</button></li>
            <li><button onClick={onAbout} className="hover:text-cyan-400 transition-colors">About Us</button></li>
            <li><button onClick={onContact} className="hover:text-cyan-400 transition-colors">Contact</button></li>
            <li><button onClick={onForms} className="hover:text-cyan-400 transition-colors">Student Forms</button></li>
            <li><button onClick={onFeesRefund} className="hover:text-cyan-400 transition-colors">Fees & Refunds</button></li>
            <li><button onClick={onGallery} className="hover:text-cyan-400 transition-colors">Our Gallery</button></li>
          </ul>
        </div>

        {/* Accreditation */}
        <div className="space-y-6">
          <h3 className="text-white font-bold text-lg">Accreditation</h3>
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">RTO Provider</div>
                <div className="text-xl font-black text-white tracking-tighter">#45234</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Safety Training Academy. All rights reserved. RTO Provider #45234
      </div>
    </footer>
  );
}
