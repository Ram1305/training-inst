import { BANK_TRANSFER_DETAILS } from '../../config/bankTransferDetails';

interface BankTransferDetailsCardProps {
  className?: string;
  /** Optional amount line, e.g. "Transfer $460.00 to:" */
  amountHint?: string;
  /** When false, omit the heading (parent already has a section title). */
  showTitle?: boolean;
}

export function BankTransferDetailsCard({
  className = '',
  amountHint,
  showTitle = true,
}: BankTransferDetailsCardProps) {
  const d = BANK_TRANSFER_DETAILS;
  return (
    <div className={`rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm ${className}`}>
      {showTitle ? <h4 className="mb-3 font-semibold text-gray-900">Bank details</h4> : null}
      {amountHint ? <p className="mb-3 text-gray-700">{amountHint}</p> : null}
      <div className="space-y-2">
        <div className="flex justify-between gap-2">
          <span className="text-gray-600">Bank</span>
          <span className="font-medium text-gray-900">{d.bankName}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-gray-600">Account name</span>
          <span className="font-medium text-gray-900">{d.accountName}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-gray-600">BSB</span>
          <span className="font-mono font-medium text-gray-900">{d.bsb}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-gray-600">Account no.</span>
          <span className="font-mono font-medium text-gray-900">{d.accountNumber}</span>
        </div>
      </div>
    </div>
  );
}
