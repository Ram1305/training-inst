import { ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';

interface HandbookViewerPageProps {
  pdfUrl: string;
  title?: string;
  courseName?: string;
  onBack: () => void;
}

const GOOGLE_VIEWER_URL = 'https://docs.google.com/gview?url=';

export function HandbookViewerPage({ pdfUrl, title, courseName, onBack }: HandbookViewerPageProps) {
  const embeddedUrl = `${GOOGLE_VIEWER_URL}${encodeURIComponent(pdfUrl)}&embedded=true`;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="flex-shrink-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="rounded-full gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="min-w-0 flex-1">
          {courseName && (
            <p className="text-sm text-slate-500 truncate">{courseName}</p>
          )}
          <h1 className="font-semibold text-slate-900 truncate">
            {title || 'Handbook'}
          </h1>
        </div>
        <a
          href={embeddedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-cyan-600 hover:text-cyan-700 font-medium whitespace-nowrap"
        >
          Open in new tab
        </a>
      </header>
      <main className="flex-1 flex flex-col min-h-0 p-4">
        <iframe
          title={title || 'Handbook'}
          src={embeddedUrl}
          className="w-full flex-1 min-h-[480px] rounded-lg border border-slate-200 bg-white shadow-sm"
        />
      </main>
    </div>
  );
}
