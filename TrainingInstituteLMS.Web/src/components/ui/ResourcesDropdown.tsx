import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

interface ResourcesDropdownProps {
  onForms?: () => void;
  onFeesRefund?: () => void;
  onGallery?: () => void;
}

const CODE_OF_PRACTICE_LINKS = [
  { label: 'Manage and Control Asbestos in Workplace', url: 'https://safetytrainingacademy.edu.au/wp-content/uploads/2025/08/How-to-safely-remove-asbestos-COP.pdf' },
  { label: 'Asbestos Removal', url: 'https://safetytrainingacademy.edu.au/wp-content/uploads/2021/12/How-to-safely-remove-asbestos-COP-2019-1.pdf' },
  { label: 'Confined Space', url: 'https://www.safework.nsw.gov.au/__data/assets/pdf_file/0015/50073/Confined-spaces-COP.pdf' },
  { label: 'Working at Heights', url: 'https://www.safework.nsw.gov.au/__data/assets/pdf_file/0018/50076/Managing-the-risk-of-falls-at-workplaces-COP.pdf' },
];

export function ResourcesDropdown({ onForms, onFeesRefund, onGallery }: ResourcesDropdownProps) {
  const [open, setOpen] = useState(false);
  const [codeOfPracticeOpen, setCodeOfPracticeOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => {
        setOpen(false);
        setCodeOfPracticeOpen(false);
      }}
    >
      <a
        href="#resources"
        onClick={(e) => e.preventDefault()}
        className="flex items-center gap-1 text-white hover:text-cyan-400 transition-colors text-sm font-medium cursor-pointer"
        aria-expanded={open}
        aria-haspopup="true"
      >
        RESOURCES
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </a>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute left-0 top-full pt-2 z-50"
        >
          <div className="flex rounded-xl shadow-2xl border border-slate-700 overflow-hidden" style={{ backgroundColor: '#0f172a' }}>
            {/* Left panel - same as Courses dropdown */}
            <div className="dropdown-category-panel">
              <button
                onClick={() => {
                  setOpen(false);
                  onForms?.();
                }}
                className="dropdown-category-item"
              >
                <span>Forms</span>
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  onFeesRefund?.();
                }}
                className="dropdown-category-item"
              >
                <span>Fees & Refund</span>
              </button>
              <button type="button" className="dropdown-category-item opacity-70 cursor-not-allowed" disabled title="Coming soon">
                <span>Unique Student Identifier (USI)</span>
              </button>
              <button
                onMouseEnter={() => setCodeOfPracticeOpen(true)}
                className={`dropdown-category-item ${codeOfPracticeOpen ? 'active' : ''}`}
              >
                <span>Code of Practice</span>
                <ChevronRight className="w-4 h-4 flex-shrink-0" />
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  onGallery?.();
                }}
                className="dropdown-category-item"
              >
                <span>Gallery</span>
              </button>
            </div>
            {/* Right panel - same as Courses dropdown */}
            <div className="dropdown-courses-panel">
              {codeOfPracticeOpen && (
                <div>
                  {CODE_OF_PRACTICE_LINKS.map(({ label, url }) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="dropdown-course-item whitespace-normal"
                    >
                      {label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
