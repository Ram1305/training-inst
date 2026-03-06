import { motion } from "motion/react";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "./ui/utils";

export interface PaymentSuccessCardProps {
  title?: string;
  message?: string;
  transactionId?: number | null;
  isRedirecting?: boolean;
  redirectLabel?: string;
  className?: string;
  children?: React.ReactNode;
}

export function PaymentSuccessCard({
  title = "Payment successful",
  message,
  transactionId,
  isRedirecting = false,
  redirectLabel = "Taking you to the next step...",
  className,
  children,
}: PaymentSuccessCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "tween", duration: 0.3 }}
      className={cn(
        "rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-8 shadow-lg",
        className
      )}
    >
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-10 w-10 text-green-600" aria-hidden />
        </div>
        <h3 className="text-xl font-bold text-green-800">{title}</h3>
        {message && (
          <p className="mt-2 max-w-md text-base text-green-700">{message}</p>
        )}
        {transactionId != null && (
          <p className="mt-2 text-sm text-green-600/80">
            Transaction ID: {transactionId}
          </p>
        )}
        {isRedirecting && (
          <div className="mt-4 flex items-center gap-2 text-green-600">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            <span className="text-sm font-medium">{redirectLabel}</span>
          </div>
        )}
        {children && <div className="mt-6 flex justify-center">{children}</div>}
      </div>
    </motion.div>
  );
}
