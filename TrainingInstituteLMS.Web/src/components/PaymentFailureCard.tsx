import { motion } from "motion/react";
import { AlertCircle, X } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "./ui/utils";

export interface PaymentFailureCardProps {
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function PaymentFailureCard({
  message,
  onDismiss,
  onRetry,
  retryLabel = "Try again",
  className,
}: PaymentFailureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "tween", duration: 0.3 }}
      className={cn(
        "rounded-xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-rose-50 p-5 shadow-md",
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100">
          <AlertCircle className="h-6 w-6 text-red-600" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-bold text-red-800">Payment failed</h3>
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="shrink-0 rounded p-1 text-red-600 hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"
                aria-label="Dismiss"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          <p className="mt-1 text-sm leading-relaxed text-red-700">{message}</p>
          {(onRetry || onDismiss) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {onRetry && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="border-red-300 bg-white text-red-700 hover:bg-red-50 hover:text-red-800"
                >
                  {retryLabel}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
