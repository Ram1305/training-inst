import { useRef, useState } from 'react';
import { Card, CardContent } from '../../ui/card';
import { Label } from '../../ui/label';
import { Button } from '../../ui/button';
import { Upload, FileCheck, FileText, ImagePlus, X } from 'lucide-react';
import type { ApplicantDetails } from '../../../types/studentEnrolment';

const ACCEPT = '.pdf,.jpg,.jpeg,.png';
const MAX_MB = 5;

interface PhotoIdSectionProps {
  data: ApplicantDetails;
  onChange: (data: Partial<ApplicantDetails>) => void;
  errors: Record<string, string>;
}

export function PhotoIdSection({ data, onChange, errors }: PhotoIdSectionProps) {
  const primaryInputRef = useRef<HTMLInputElement>(null);
  const secondaryInputRef = useRef<HTMLInputElement>(null);
  const [sizeError, setSizeError] = useState<'primary' | 'secondary' | null>(null);

  const handlePrimaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSizeError(null);
    const file = e.target.files?.[0];
    if (file && file.size > MAX_MB * 1024 * 1024) {
      setSizeError('primary');
      e.target.value = '';
      return;
    }
    onChange({ docPrimaryId: file || null });
    e.target.value = '';
  };

  const handleSecondaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSizeError(null);
    const file = e.target.files?.[0];
    if (file && file.size > MAX_MB * 1024 * 1024) {
      setSizeError('secondary');
      e.target.value = '';
      return;
    }
    onChange({ docSecondaryId: file || null });
    e.target.value = '';
  };

  const clearPrimary = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange({ docPrimaryId: null });
    if (primaryInputRef.current) primaryInputRef.current.value = '';
  };

  const clearSecondary = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange({ docSecondaryId: null });
    if (secondaryInputRef.current) secondaryInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h2 className="text-lg font-bold text-gray-800 mb-1">PHOTO AND ID CARD</h2>
        <p className="text-sm text-gray-700">
          Please upload a clear copy of your identification document(s). Files must be readable.
        </p>
        <p className="text-sm text-gray-600 mt-1">
          Accepted: PDF, JPG, PNG. Example: Passport / Driver Licence.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ID document upload */}
        <Card className={`border-2 transition-colors ${errors.docPrimaryId ? 'border-red-300 bg-red-50/30' : 'border-gray-200'}`}>
          <CardContent className="pt-6">
            <Label className="flex items-center gap-2 text-gray-800 font-semibold mb-3">
              <FileText className="w-5 h-5 text-violet-600" />
              Identification document
              <span className="text-red-500">*</span>
            </Label>
            <p className="text-sm text-gray-500 mb-4">e.g. Passport / Driver Licence</p>

            <input
              ref={primaryInputRef}
              type="file"
              accept={ACCEPT}
              onChange={handlePrimaryChange}
              className="hidden"
              id="docPrimaryId"
            />
            <label
              htmlFor="docPrimaryId"
              className="block border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-violet-400 hover:bg-violet-50/30 transition-colors min-h-[160px] flex flex-col items-center justify-center"
            >
              {data.docPrimaryId ? (
                <>
                  <FileCheck className="w-12 h-12 text-green-600 mb-2" />
                  <p className="text-sm font-medium text-gray-800 truncate max-w-full px-2">{data.docPrimaryId.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{(data.docPrimaryId.size / 1024).toFixed(1)} KB</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-3 text-gray-600 hover:text-red-600"
                    onClick={clearPrimary}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                </>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Click to upload</p>
                  <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG (max {MAX_MB}MB)</p>
                </>
              )}
            </label>
            {errors.docPrimaryId && (
              <p className="text-sm text-red-500 mt-2">{errors.docPrimaryId}</p>
            )}
            {sizeError === 'primary' && (
              <p className="text-sm text-amber-600 mt-2">File must be under {MAX_MB}MB. Please choose a smaller file.</p>
            )}
          </CardContent>
        </Card>

        {/* Photo upload */}
        <Card className={`border-2 transition-colors ${errors.docSecondaryId ? 'border-red-300 bg-red-50/30' : 'border-gray-200'}`}>
          <CardContent className="pt-6">
            <Label className="flex items-center gap-2 text-gray-800 font-semibold mb-3">
              <ImagePlus className="w-5 h-5 text-violet-600" />
              Upload a Photo
              <span className="text-red-500">*</span>
            </Label>
            <p className="text-sm text-gray-500 mb-4">Example: Upload a Photo.</p>

            <input
              ref={secondaryInputRef}
              type="file"
              accept={ACCEPT}
              onChange={handleSecondaryChange}
              className="hidden"
              id="docSecondaryId"
            />
            <label
              htmlFor="docSecondaryId"
              className="block border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-violet-400 hover:bg-violet-50/30 transition-colors min-h-[160px] flex flex-col items-center justify-center"
            >
              {data.docSecondaryId ? (
                <>
                  <FileCheck className="w-12 h-12 text-green-600 mb-2" />
                  <p className="text-sm font-medium text-gray-800 truncate max-w-full px-2">{data.docSecondaryId.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{(data.docSecondaryId.size / 1024).toFixed(1)} KB</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-3 text-gray-600 hover:text-red-600"
                    onClick={clearSecondary}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                </>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Click to upload</p>
                  <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG (max {MAX_MB}MB)</p>
                </>
              )}
            </label>
            {errors.docSecondaryId && (
              <p className="text-sm text-red-500 mt-2">{errors.docSecondaryId}</p>
            )}
            {sizeError === 'secondary' && (
              <p className="text-sm text-amber-600 mt-2">File must be under {MAX_MB}MB. Please choose a smaller file.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-gray-500 text-center">
        Ensure documents are clear and readable. Accepted: PDF, JPG, PNG. Max {MAX_MB}MB per file.
      </p>
    </div>
  );
}
