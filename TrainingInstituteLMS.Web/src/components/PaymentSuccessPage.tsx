import { useEffect, useRef } from 'react';
import { CheckCircle, ArrowRight, Download, Home, Mail, Shield, CreditCard, Building2, Sparkles } from 'lucide-react';
import { Button } from './ui/button';

interface PaymentSuccessPageProps {
  paymentMethod?: 'card' | 'bank_transfer';
  transactionId?: number | string | null;
  courseName?: string;
  coursePrice?: number;
  studentName?: string;
  studentEmail?: string;
  onContinue: () => void;
  continueLabel?: string;
}

export function PaymentSuccessPage({
  paymentMethod = 'card',
  transactionId,
  courseName,
  coursePrice,
  studentName,
  studentEmail,
  onContinue,
  continueLabel = 'Continue to LLND Assessment',
}: PaymentSuccessPageProps) {
  const confettiRef = useRef<HTMLDivElement>(null);

  // Simple confetti-like particle animation
  useEffect(() => {
    const container = confettiRef.current;
    if (!container) return;
    const colours = ['#7c3aed', '#a855f7', '#22c55e', '#3b82f6', '#f59e0b', '#ec4899'];
    const particles: HTMLDivElement[] = [];
    for (let i = 0; i < 48; i++) {
      const el = document.createElement('div');
      const size = Math.round(Math.random() * 8 + 5);
      el.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: ${colours[Math.floor(Math.random() * colours.length)]};
        border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 40}%;
        opacity: ${Math.random() * 0.6 + 0.4};
        animation: confettiFall ${Math.random() * 2 + 1.5}s ease-in ${Math.random() * 0.8}s forwards;
        pointer-events: none;
      `;
      container.appendChild(el);
      particles.push(el);
    }
    return () => particles.forEach((p) => p.remove());
  }, []);

  const isBankTransfer = paymentMethod === 'bank_transfer';

  return (
    <>
      {/* Keyframe injection */}
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(180px) rotate(360deg); opacity: 0; }
        }
        @keyframes successBounce {
          0%   { transform: scale(0.5); opacity: 0; }
          60%  { transform: scale(1.15); }
          80%  { transform: scale(0.95); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeSlidUp {
          0%   { opacity: 0; transform: translateY(18px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .payment-success-icon {
          animation: successBounce 0.7s cubic-bezier(0.36, 0.07, 0.19, 0.97) 0.1s both;
        }
        .payment-success-title {
          animation: fadeSlidUp 0.5s ease 0.5s both;
        }
        .payment-success-body {
          animation: fadeSlidUp 0.5s ease 0.7s both;
        }
        .payment-success-cta {
          animation: fadeSlidUp 0.5s ease 0.9s both;
        }
        .shimmer-text {
          background: linear-gradient(90deg,
            #7c3aed 0%, #a855f7 25%, #ec4899 50%, #a855f7 75%, #7c3aed 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background subtle circles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-violet-200/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-fuchsia-200/30 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-100/20 rounded-full blur-3xl" />
        </div>

        {/* Confetti container */}
        <div ref={confettiRef} className="absolute inset-0 pointer-events-none overflow-hidden" />

        <div className="relative z-10 w-full max-w-lg">
          {/* Main card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/60 overflow-hidden">
            {/* Header gradient strip */}
            <div className="h-2 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />

            <div className="p-8 md:p-10">
              {/* Success icon */}
              <div className="payment-success-icon flex flex-col items-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-300/50">
                    <CheckCircle className="w-14 h-14 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="absolute -top-1 -right-1 w-8 h-8 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center shadow-md">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>

              {/* Title */}
              <div className="payment-success-title text-center mb-2">
                <h1 className="text-3xl font-extrabold shimmer-text mb-1">
                  {isBankTransfer ? 'Transfer Submitted!' : 'Payment Successful!'}
                </h1>
                <p className="text-gray-500 text-sm">
                  {isBankTransfer
                    ? 'Your bank transfer details have been received.'
                    : 'Your card has been charged successfully.'}
                </p>
              </div>

              {/* Details card */}
              <div className="payment-success-body mt-6 space-y-3">
                {/* Payment method badge */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                    isBankTransfer
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-violet-100 text-violet-700 border border-violet-200'
                  }`}>
                    {isBankTransfer
                      ? <><Building2 className="w-3.5 h-3.5" /> Bank Transfer</>
                      : <><CreditCard className="w-3.5 h-3.5" /> Credit Card</>}
                  </span>
                  {!isBankTransfer && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                      <Shield className="w-3.5 h-3.5" /> Verified
                    </span>
                  )}
                </div>

                {/* Info rows */}
                <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
                  {courseName && (
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-gray-500 font-medium">Course</span>
                      <span className="text-sm font-semibold text-gray-800 text-right max-w-[60%]">{courseName}</span>
                    </div>
                  )}
                  {coursePrice != null && (
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-gray-500 font-medium">Amount Paid</span>
                      <span className="text-lg font-bold text-green-600">${coursePrice.toFixed(2)} AUD</span>
                    </div>
                  )}
                  {transactionId != null && (
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-gray-500 font-medium">Transaction ID</span>
                      <span className="text-sm font-mono font-semibold text-gray-700">#{transactionId}</span>
                    </div>
                  )}
                  {studentName && (
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-gray-500 font-medium">Name</span>
                      <span className="text-sm font-semibold text-gray-800">{studentName}</span>
                    </div>
                  )}
                  {studentEmail && (
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-gray-500 font-medium flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" /> Email
                      </span>
                      <span className="text-sm font-semibold text-gray-800 truncate max-w-[60%]">{studentEmail}</span>
                    </div>
                  )}
                </div>

                {/* Bank transfer notice */}
                {isBankTransfer && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 mt-2">
                    <p className="font-semibold mb-1">⏳ Pending Verification</p>
                    <p className="text-amber-700 text-xs leading-relaxed">
                      Your bank transfer is being reviewed. Our team will verify your payment and confirm your enrollment within 1–2 business days.
                    </p>
                  </div>
                )}

                {/* Email confirmation notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 flex gap-3">
                  <Mail className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" />
                  <div>
                    <p className="font-semibold">Confirmation email sent</p>
                    <p className="text-blue-600 text-xs mt-0.5">Check your inbox for a payment confirmation email.</p>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <div className="payment-success-cta mt-8 space-y-3">
                <Button
                  id="payment-success-continue-btn"
                  onClick={onContinue}
                  className="w-full h-12 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-semibold text-base rounded-xl shadow-lg shadow-violet-200 transition-all hover:shadow-violet-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {continueLabel}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <p className="text-center text-xs text-gray-400 mt-4">
            Safety Training Academy · RTO: 45234
          </p>
        </div>
      </div>
    </>
  );
}
