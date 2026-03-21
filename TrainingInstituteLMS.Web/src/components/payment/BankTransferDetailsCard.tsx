import { BANK_TRANSFER_DETAILS } from '../../config/bankTransferDetails';

type BankTransferDetailsCardProps = {
  className?: string;
  heading?: string;
};

export function BankTransferDetailsCard({
  className = '',
  heading = 'Details for deposit',
}: BankTransferDetailsCardProps) {
  const { bankName, accountName, accountNumber, bsb } = BANK_TRANSFER_DETAILS;
  return (
    <div className={`rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm ${className}`}>
      <h4 className="mb-3 font-semibold text-gray-900 underline">{heading}</h4>
      <div className="space-y-2 text-gray-700">
        <div className="flex justify-between gap-4">
          <span className="text-gray-600">Bank:</span>
          <span className="font-medium text-gray-900">{bankName}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-600">Account name:</span>
          <span className="font-medium text-gray-900">{accountName}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-600">BSB:</span>
          <span className="font-mono font-medium text-gray-900">{bsb}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-600">Account no.:</span>
          <span className="font-mono font-medium text-gray-900">{accountNumber}</span>
        </div>
      </div>
    </div>
  );
}
