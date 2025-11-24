import React, { useState, useEffect, useRef } from 'react';
import { Mail, ExternalLink, Edit, ChevronLeft, ChevronRight, Maximize2, X, Info } from 'lucide-react';

interface SOARecord {
  id: string;
  statementDate: string;
  accountNo: string;
  dateInstalled: string;
  fullName: string;
  contactNumber: string;
  emailAddress: string;
  address: string;
  plan: string;
  provider?: string;
  balanceFromPreviousBill?: number;
  statementNo?: string;
  paymentReceived?: number;
  remainingBalance?: number;
  monthlyServiceFee?: number;
  otherCharges?: number;
  vat?: number;
  dueDate?: string;
  amountDue?: number;
  totalAmountDue?: number;
  deliveryStatus?: string;
  deliveryDate?: string;
  deliveredBy?: string;
  deliveryRemarks?: string;
  deliveryProof?: string;
  modifiedBy?: string;
  modifiedDate?: string;
  printLink?: string;
  barangay?: string;
  city?: string;
  region?: string;
}

interface SOADetailsProps {
  soaRecord: SOARecord;
}

const SOADetails: React.FC<SOADetailsProps> = ({ soaRecord }) => {
  const [detailsWidth, setDetailsWidth] = useState<number>(600);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const diff = startXRef.current - e.clientX;
      const newWidth = Math.max(600, Math.min(1200, startWidthRef.current + diff));
      
      setDetailsWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = detailsWidth;
  };

  return (
    <div className="bg-gray-900 text-white h-full flex flex-col border-l border-white border-opacity-30 relative" style={{ width: `${detailsWidth}px` }}>
      <div
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-orange-500 transition-colors z-50"
        onMouseDown={handleMouseDownResize}
      />
      {/* Header with Account No and Actions */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-700">
        <h1 className="text-lg font-semibold text-white truncate pr-4 min-w-0 flex-1">
          {soaRecord.accountNo} | {soaRecord.fullName} | {soaRecord.address.split(',')[0]}
        </h1>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
            <Mail size={18} />
          </button>
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
            <ExternalLink size={18} />
          </button>
          <button className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm transition-colors">
            Edit
          </button>
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
            <ChevronLeft size={18} />
          </button>
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
            <ChevronRight size={18} />
          </button>
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
            <Maximize2 size={18} />
          </button>
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-gray-800">
          {/* Statement Info */}
          <div className="px-5 py-4">
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Statement No.</span>
              <span className="text-white">{soaRecord.statementNo || '2509180' + soaRecord.id}</span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Full Name</span>
              <span className="text-white">{soaRecord.fullName}</span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Statement Date</span>
              <span className="text-white">{soaRecord.statementDate}</span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Account No.</span>
              <div className="flex items-center">
                <span className="text-red-500">
                  {soaRecord.accountNo} | {soaRecord.fullName} | {soaRecord.address}
                </span>
                <Info size={16} className="ml-2 text-gray-500" />
              </div>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Date Installed</span>
              <span className="text-white">{soaRecord.dateInstalled}</span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Contact Number</span>
              <span className="text-white">{soaRecord.contactNumber}</span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Email Address</span>
              <span className="text-white">{soaRecord.emailAddress}</span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Plan</span>
              <div className="flex items-center">
                <span className="text-white">{soaRecord.plan}</span>
                <Info size={16} className="ml-2 text-gray-500" />
              </div>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Provider</span>
              <div className="flex items-center">
                <span className="text-white">{soaRecord.provider || 'SWITCH'}</span>
                <Info size={16} className="ml-2 text-gray-500" />
              </div>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Balance from Previous Bill</span>
              <span className="text-white">
                ₱{soaRecord.balanceFromPreviousBill?.toFixed(2) || '0.00'}
              </span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Payment Received from Previous Bill</span>
              <span className="text-white">
                ₱{soaRecord.paymentReceived || '0'}
              </span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Remaining Balance from Previous Bill</span>
              <span className="text-white">
                ₱{soaRecord.remainingBalance?.toFixed(2) || '0.00'}
              </span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Monthly Service Fee</span>
              <span className="text-white">
                ₱{soaRecord.monthlyServiceFee?.toFixed(2) || '624.11'}
              </span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Others and Basic Charges</span>
              <span className="text-white">
                ₱{soaRecord.otherCharges?.toFixed(2) || '0.00'}
              </span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">VAT</span>
              <span className="text-white">
                ₱{soaRecord.vat?.toFixed(2) || '74.89'}
              </span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">DUE DATE</span>
              <span className="text-white">{soaRecord.dueDate || '9/30/2025'}</span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">AMOUNT DUE</span>
              <span className="text-white">
                ₱{soaRecord.amountDue?.toFixed(2) || '699.00'}
              </span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">TOTAL AMOUNT DUE</span>
              <span className="text-white">
                ₱{soaRecord.totalAmountDue?.toFixed(2) || '699.00'}
              </span>
            </div>

            {soaRecord.deliveryStatus && (
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-400">Delivery Status</span>
                <span className="text-white">{soaRecord.deliveryStatus}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SOADetails;