import { Facebook, Linkedin, Instagram, MapPin, Phone, Mail, Shield } from "lucide-react";
import logoImage from '/assets/SafetyTrainingAcademylogo.png';
import { SAFETY_TRAINING_ACADEMY_LOGO } from '../../constants/safetyTrainingAcademyLogo';
import { SOCIAL_LINKS } from "../../constants/socialLinks";

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
    <footer className="bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-600 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">

          {/* Logo & About */}
          <div>
            <div className="flex items-center gap-3 mb-4 bg-white/10 backdrop-blur-sm rounded-lg p-3 w-fit">
              <img
                src={logoImage}
                alt="Safety Training Academy"
                width={SAFETY_TRAINING_ACADEMY_LOGO.width}
                height={SAFETY_TRAINING_ACADEMY_LOGO.height}
                className="h-16 w-auto max-w-full object-contain object-left brightness-0 invert"
              />
            </div>
            <p className="text-white/90 text-sm mb-4">
              Professional certification programs for your career growth.
            </p>
            <div className="flex gap-4">
              <a
                href={SOCIAL_LINKS.facebook}
                aria-label="Facebook"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
              >
                <Facebook className="w-6 h-6" />
              </a>
              <a
                href={SOCIAL_LINKS.linkedin}
                aria-label="LinkedIn"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
              >
                <Linkedin className="w-6 h-6" />
              </a>
              <a
                href={SOCIAL_LINKS.instagram}
                aria-label="Instagram"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
              >
                <Instagram className="w-6 h-6" />
              </a>
            </div>
          </div>

          {/* Head Office */}
          <div>
            <h3 className="font-bold mb-4 text-lg">Head Office</h3>
            <ul className="space-y-2 text-sm text-white/90">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Safety Training Academy | Sydney<br />3/14-16 Marjorie Street, Sefton NSW 2162</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <a href="tel:1300976097" className="hover:text-white transition-colors">1300 976 097</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <a href="mailto:info@safetytrainingacademy.edu.au" className="hover:text-white transition-colors text-xs">info@safetytrainingacademy.edu.au</a>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold mb-4 text-lg">Links</h3>
            <ul className="space-y-2 text-sm text-white/90">
              <li><button onClick={onBack} className="hover:text-white transition-colors text-left">Home</button></li>
              <li><button onClick={onAbout} className="hover:text-white transition-colors text-left">About Us</button></li>
              <li><button onClick={onContact} className="hover:text-white transition-colors text-left">Contact</button></li>
              <li><button onClick={onForms} className="hover:text-white transition-colors text-left">Student Forms</button></li>
              <li><button onClick={onFeesRefund} className="hover:text-white transition-colors text-left">Fees & Refunds</button></li>
              <li><button onClick={onGallery} className="hover:text-white transition-colors text-left">Our Gallery</button></li>
            </ul>
          </div>

          {/* Accreditation */}
          <div>
            <h3 className="font-bold mb-4 text-lg">Accreditation</h3>
            <div className="bg-white/10 backdrop-blur-sm p-5 rounded-2xl border border-white/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-[10px] text-white/70 uppercase tracking-widest font-bold">RTO Provider</div>
                  <div className="text-2xl font-black text-white tracking-tight">#45234</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/20 pt-8 text-center text-sm text-white/90">
          <p>© {new Date().getFullYear()} Safety Training Academy. All rights reserved. RTO Provider #45234</p>
        </div>
      </div>
    </footer>
  );
}
