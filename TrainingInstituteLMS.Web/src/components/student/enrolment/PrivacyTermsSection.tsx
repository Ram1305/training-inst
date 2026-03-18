import { useRef, useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Checkbox } from '../../ui/checkbox';
import { Button } from '../../ui/button';
import { ScrollArea } from '../../ui/scroll-area';
import { AlertTriangle, Eraser, PenTool, Check, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '../../ui/dialog';
import type { PrivacyTerms } from '../../../types/studentEnrolment';

interface PrivacyTermsSectionProps {
  data: PrivacyTerms;
  onChange: (data: Partial<PrivacyTerms>) => void;
  errors: Record<string, string>;
}

export function PrivacyTermsSection({ data, onChange, errors }: PrivacyTermsSectionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dialogCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasInk, setHasInk] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const hasInkRef = useRef(false);
  const isDrawingRef = useRef(false);

  useEffect(() => {
    hasInkRef.current = hasInk;
  }, [hasInk]);

  useEffect(() => {
    isDrawingRef.current = isDrawing;
  }, [isDrawing]);

  // Fit canvas to CSS size
  const fitCanvasToSize = useCallback((targetCanvas?: HTMLCanvasElement | null) => {
    const canvas = targetCanvas ?? canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const ratio = window.devicePixelRatio || 1;

    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000';
  }, []);

  useEffect(() => {
    // Basic mobile detection by viewport width
    const mq = window.matchMedia('(max-width: 768px)');
    const handleMediaChange = () => setIsMobile(mq.matches);
    handleMediaChange();
    mq.addEventListener('change', handleMediaChange);

    let rafId: number | null = null;

    const preserveAndFit = (canvas: HTMLCanvasElement | null) => {
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      // Resizing canvas clears it; keep current ink if we have any.
      const shouldPreserve = hasInkRef.current || isDrawingRef.current;
      const snap = shouldPreserve ? canvas.toDataURL('image/png') : null;

      fitCanvasToSize(canvas);

      if (!snap) return;
      const img = new Image();
      img.onload = () => {
        const nextCtx = canvas.getContext('2d');
        if (!nextCtx) return;
        const nextRect = canvas.getBoundingClientRect();
        nextCtx.drawImage(img, 0, 0, nextRect.width, nextRect.height);
      };
      img.src = snap;
    };

    const handleResize = () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(() => {
        preserveAndFit(canvasRef.current);
        preserveAndFit(dialogCanvasRef.current);
      });
    };

    fitCanvasToSize();
    fitCanvasToSize(dialogCanvasRef.current);
    window.addEventListener('resize', handleResize);

    return () => {
      mq.removeEventListener('change', handleMediaChange);
      window.removeEventListener('resize', handleResize);
    };
  }, [fitCanvasToSize]);

  // Restore signature from data when component mounts or user navigates back
  useEffect(() => {
    if (!data.signatureData) return;

    const img = new Image();
    img.onload = () => {
      const canvases: (HTMLCanvasElement | null)[] = [
        canvasRef.current,
        dialogCanvasRef.current,
      ];

      canvases.forEach((canvas) => {
        if (!canvas) return;
        fitCanvasToSize(canvas);
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const rect = canvas.getBoundingClientRect();
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      });

      setHasInk(true);
    };
    img.src = data.signatureData;
  }, [data.signatureData, fitCanvasToSize]);

  const getPos = (e: React.MouseEvent | React.TouchEvent, targetCanvas?: HTMLCanvasElement | null) => {
    const canvas = targetCanvas ?? canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent, targetCanvas?: HTMLCanvasElement | null) => {
    // Prevent the page from scrolling while starting a signature stroke on touch devices
    if ('touches' in e) {
      if (e.cancelable) {
        e.preventDefault();
      }
    }
    setIsDrawing(true);
    lastPos.current = getPos(e, targetCanvas);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent, targetCanvas?: HTMLCanvasElement | null) => {
    if (!isDrawing || !lastPos.current) return;

    const canvas = targetCanvas ?? canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Prevent the page from scrolling while drawing on touch devices
    if ('touches' in e) {
      if (e.cancelable) {
        e.preventDefault();
      }
    }

    const pos = getPos(e, targetCanvas);

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    lastPos.current = pos;
    setHasInk(true);
  };

  const stopDrawing = (targetCanvas?: HTMLCanvasElement | null) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = targetCanvas ?? canvasRef.current;
    if (canvas && hasInk) {
      onChange({ signatureData: canvas.toDataURL('image/png') });
    }
  };

  const clearSignature = () => {
    const canvases: (HTMLCanvasElement | null)[] = [
      canvasRef.current,
      dialogCanvasRef.current,
    ];

    canvases.forEach((canvas) => {
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      fitCanvasToSize(canvas);
    });

    setHasInk(false);
    lastPos.current = null;
    onChange({ signatureData: '' });
  };

  return (
    <div className="space-y-6">
      {/* Section Title */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
        <h2 className="text-lg font-bold text-gray-800">SECTION 5 — PRIVACY NOTICE, TERMS & ONLINE SIGNATURE</h2>
      </div>

      {/* Warning Alert */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-amber-800 text-sm">
          Please read the Privacy Notice and Terms & Conditions. You must accept them before submitting.
        </p>
      </div>

      {/* Privacy Notice */}
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-gray-800 mb-4">Privacy Notice</h3>
          <ScrollArea className="h-[280px] border border-gray-200 rounded-lg p-4 bg-white">
            <div className="text-sm text-gray-600 space-y-4 pr-4">
              <div>
                <strong>Why we collect your personal information</strong>
                <p className="mt-1">
                  As a registered training organisation (RTO), we collect your personal information so we can process and manage your enrolment in vocational education and training (VET) course(s).
                </p>
              </div>

              <div>
                <strong>How we use your personal information</strong>
                <p className="mt-1">
                  We use your personal information to enable us to deliver VET courses to you and, otherwise, as needed, to comply with our obligations as an RTO.
                </p>
              </div>

              <div>
                <strong>How we disclose your personal information</strong>
                <p className="mt-1">
                  We are required by law (under the National Vocational Education and Training Regulator Act 2011 (Cth)) to disclose the personal information we collect to the National VET Data Collection kept by the National Centre for Vocational Education Research (NCVER).
                  NCVER is responsible for collecting, managing, analysing and communicating research and statistics about the Australian VET sector.
                  We are also authorised by law (under the NVETR Act) to disclose your personal information to relevant State/Territory training authorities.
                </p>
              </div>

              <div>
                <strong>How the NCVER and other bodies handle your personal information</strong>
                <p className="mt-1">
                  NCVER will collect, hold, use and disclose your personal information in accordance with the law, including the Privacy Act 1988 (Cth) and the NVETR Act.
                  Your information may be used for purposes including administration of VET, facilitating statistics and research, and understanding how the VET market operates.
                </p>
              </div>

              <div>
                <strong>Surveys</strong>
                <p className="mt-1">
                  You may receive a student survey conducted by or on behalf of government departments or NCVER. You may opt out at the time of being contacted.
                </p>
              </div>

              <div>
                <strong>Contact information</strong>
                <p className="mt-1">
                  Safety Training Academy — Maria Hajjar<br />
                  0439 007 746<br />
                  maria@safetytrainingacademy.edu.au
                </p>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Terms & Conditions */}
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-gray-800 mb-4">Terms & Conditions (Key Policies)</h3>
          <ScrollArea className="h-[280px] border border-gray-200 rounded-lg p-4 bg-white">
            <div className="text-sm text-gray-600 space-y-4 pr-4">
              <div>
                <strong>Complaints & Appeals</strong>
                <p className="mt-1">
                  Complaints are recorded and managed through STA's complaints process. If not resolved, you may lodge an appeal.
                  Appeals may progress to independent mediation (e.g., National Training Complaints Hotline / Ombudsman pathways where applicable).
                </p>
              </div>

              <div>
                <strong>Reassessment</strong>
                <p className="mt-1">
                  If you believe an assessment outcome is unfair, first discuss with your assessor. If unresolved, follow the formal appeals process.
                  STA may require evidence, and independent reassessment may be arranged where necessary.
                </p>
              </div>

              <div>
                <strong>Consumer Guarantee</strong>
                <p className="mt-1">
                  STA will provide training and assessment with due care and skill, fit for purpose, and within a reasonable timeframe.
                </p>
              </div>

              <div>
                <strong>Change to agreed services</strong>
                <p className="mt-1">
                  Changes may occur due to course/practical requirements, third party arrangements, or ownership changes.
                  Where possible, STA will notify affected learners.
                </p>
              </div>

              <div>
                <strong>Credit Transfer / RPL</strong>
                <p className="mt-1">
                  Credit Transfer may be granted for equivalent units with verified evidence. RPL requires evidence of competence.
                </p>
              </div>

              <div>
                <strong>Language, Literacy and Numeracy (LLN)</strong>
                <p className="mt-1">
                  Learners may be assessed for LLN needs. Support may be provided or referrals made where appropriate.
                </p>
              </div>

              <div>
                <strong>Important information</strong>
                <p className="mt-1">
                  By signing this form, you confirm the information provided is correct and you agree to STA policies and procedures.
                </p>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Acceptance Checkboxes */}
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="acceptPrivacy"
              checked={data.acceptPrivacy}
              onCheckedChange={(checked) => onChange({ acceptPrivacy: !!checked })}
              className="mt-1"
            />
            <div>
              <Label htmlFor="acceptPrivacy" className="font-normal cursor-pointer flex items-center gap-1">
                I have read and understood the Privacy Notice.
                <span className="text-red-500 font-bold">*</span>
              </Label>
              {errors.acceptPrivacy && <p className="text-sm text-red-500">{errors.acceptPrivacy}</p>}
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="acceptTerms"
              checked={data.acceptTerms}
              onCheckedChange={(checked) => onChange({ acceptTerms: !!checked })}
              className="mt-1"
            />
            <div>
              <Label htmlFor="acceptTerms" className="font-normal cursor-pointer flex items-center gap-1">
                I accept the Terms & Conditions and agree to comply.
                <span className="text-red-500 font-bold">*</span>
              </Label>
              {errors.acceptTerms && <p className="text-sm text-red-500">{errors.acceptTerms}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Declaration */}
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-gray-800 mb-4">Declaration</h3>
          <ul className="text-sm text-gray-600 list-disc list-inside space-y-1 mb-6">
            <li>I confirm the information provided is true and correct.</li>
            <li>I understand I must provide a USI to receive certification (where applicable).</li>
            <li>I understand STA policies apply (training, assessment, complaints/appeals and privacy).</li>
          </ul>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="declareName" className="flex items-center gap-1">
                Student Name
                <span className="text-red-500 font-bold">*</span>
              </Label>
              <Input
                id="declareName"
                value={data.declareName}
                onChange={(e) => onChange({ declareName: e.target.value })}
                className={errors.declareName ? 'border-red-500' : ''}
              />
              {errors.declareName && <p className="text-sm text-red-500">{errors.declareName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="declareDate" className="flex items-center gap-1">
                Date
                <span className="text-red-500 font-bold">*</span>
              </Label>
              <Input
                id="declareDate"
                type="date"
                value={data.declareDate}
                onChange={(e) => onChange({ declareDate: e.target.value })}
                className={errors.declareDate ? 'border-red-500' : ''}
              />
              {errors.declareDate && <p className="text-sm text-red-500">{errors.declareDate}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Online Signature */}
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="pt-6">
          <Label className="flex items-center gap-1 mb-4">
            Online Signature
            <span className="text-red-500 font-bold">*</span>
          </Label>

          {/* Desktop / tablet inline pad */}
          <div className="hidden md:block border-2 border-dashed border-gray-300 rounded-xl p-4 bg-white">
            <canvas
              ref={canvasRef}
              className="w-full h-[220px] border border-gray-200 rounded-lg bg-white cursor-crosshair touch-none"
              onMouseDown={(e) => startDrawing(e)}
              onMouseMove={(e) => draw(e)}
              onMouseUp={() => stopDrawing()}
              onMouseLeave={() => stopDrawing()}
            />
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearSignature}
              >
                Clear
              </Button>
              <span className="text-sm text-gray-500">
                Draw with your mouse or trackpad inside the box.
              </span>
            </div>
          </div>

          {/* Mobile: dialog-based signature pad */}
          <div className="md:hidden">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <div className="border border-dashed border-gray-300 rounded-xl p-4 bg-white">
                <p className="text-sm text-gray-600 mb-2">
                  On mobile, sign using the full-screen pad.
                </p>
                <div className="flex items-center gap-2">
                  <DialogTrigger asChild>
                    <Button 
                      type="button" 
                      className="flex-1 bg-white hover:bg-slate-50 text-blue-600 border-2 border-blue-100 hover:border-blue-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl font-semibold h-12 flex items-center justify-center gap-2"
                    >
                      <PenTool className="w-5 h-5" />
                      Open Signature Pad
                    </Button>
                  </DialogTrigger>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearSignature}
                  >
                    Clear
                  </Button>
                </div>
                {data.signatureData && (
                  <p className="text-xs text-green-600 mt-2">
                    A signature has been captured. You can reopen the pad to update it.
                  </p>
                )}
                {errors.signatureData && (
                  <p className="text-sm text-red-500 mt-2">{errors.signatureData}</p>
                )}
              </div>

              <DialogContent className="max-w-[95vw] w-full md:max-w-2xl p-0 overflow-hidden border-none bg-slate-50 rounded-3xl shadow-2xl">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center relative">
                  <DialogHeader className="space-y-1">
                    <DialogTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                      <PenTool className="w-6 h-6" />
                      Digital Signature
                    </DialogTitle>
                    <DialogDescription className="text-blue-100 text-sm">
                      Please use your finger or a stylus to sign inside the white area below.
                    </DialogDescription>
                  </DialogHeader>
                </div>

                <div className="p-4 md:p-8">
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
                    <div className="relative border-2 border-dashed border-blue-200 rounded-2xl p-2 bg-white shadow-inner">
                      <canvas
                        ref={dialogCanvasRef}
                        className="w-full h-[320px] md:h-[400px] rounded-xl bg-white cursor-crosshair touch-none"
                        onMouseDown={(e) => startDrawing(e, dialogCanvasRef.current)}
                        onMouseMove={(e) => draw(e, dialogCanvasRef.current)}
                        onMouseUp={() => stopDrawing(dialogCanvasRef.current)}
                        onMouseLeave={() => stopDrawing(dialogCanvasRef.current)}
                        onTouchStart={(e) => startDrawing(e, dialogCanvasRef.current)}
                        onTouchMove={(e) => draw(e, dialogCanvasRef.current)}
                        onTouchEnd={() => stopDrawing(dialogCanvasRef.current)}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4 mt-8">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full sm:w-auto flex items-center justify-center gap-2 border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl h-12 px-6 transition-all duration-200"
                      onClick={clearSignature}
                    >
                      <Eraser className="w-4 h-4" />
                      Clear Signature
                    </Button>
                    
                    <Button
                      type="button"
                      className="w-full flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl h-12 shadow-lg shadow-blue-200 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                      onClick={() => {
                        const canvas = dialogCanvasRef.current;
                        if (canvas && hasInk) {
                          onChange({ signatureData: canvas.toDataURL('image/png') });
                        }
                        setIsDialogOpen(false);
                      }}
                    >
                      <Check className="w-5 h-5 mr-1" />
                      Confirm & Save
                    </Button>
                  </div>
                  
                  <p className="text-center text-xs text-slate-400 mt-6 flex items-center justify-center gap-1.5 leading-relaxed">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></span>
                    Your signature will be securely encrypted and saved to your profile.
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
