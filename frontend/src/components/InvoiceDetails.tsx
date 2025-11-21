import React from 'react';
import { Mail, ExternalLink, Edit, ChevronLeft, ChevronRight, Maximize2, X, Info, Download } from 'lucide-react';

interface InvoiceRecord {
  id: string;
  invoiceDate: string;
  invoiceStatus: string;
  accountNo: string;
  fullName: string;
  contactNumber: string;
  emailAddress: string;
  address: string;
  plan: string;
  dateInstalled?: string;
  provider?: string;
  invoiceNo?: string;
  invoiceBalance?: number;
  otherCharges?: number;
  totalAmountDue?: number;
  dueDate?: string;
  invoicePayment?: number;
  paymentMethod?: string;
  dateProcessed?: string;
  processedBy?: string;
  remarks?: string;
  vat?: number;
  amountDue?: number;
  balanceFromPreviousBill?: number;
  paymentReceived?: number;
  remainingBalance?: number;
  monthlyServiceFee?: number;
  staggeredPaymentsCount?: number;
}

interface InvoiceDetailsProps {
  invoiceRecord: InvoiceRecord;
}

const InvoiceDetails: React.FC<InvoiceDetailsProps> = ({ invoiceRecord }) => {
  return (
    <div className="bg-gray-900 text-white h-full flex flex-col">
      {/* Header with Invoice No and Actions */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-700">
        <h1 className="text-lg font-semibold text-white truncate pr-4 min-w-0 flex-1">
          {invoiceRecord.invoiceNo || '2508182' + invoiceRecord.id}
        </h1>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
            <Download size={18} />
          </button>
          <button className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm transition-colors flex items-center space-x-1">
            <span>Apply Stag...</span>
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
          {/* Invoice Info */}
          <div className="px-5 py-4">
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Invoice No.</span>
              <span className="text-white">{invoiceRecord.invoiceNo || '2508182' + invoiceRecord.id}</span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Account No.</span>
              <div className="flex items-center">
                <span className="text-red-500">
                  {invoiceRecord.accountNo} | {invoiceRecord.fullName} | {invoiceRecord.address}
                </span>
                <Info size={16} className="ml-2 text-gray-500" />
              </div>
            </div>
            
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Full Name</span>
              <span className="text-white">{invoiceRecord.fullName}</span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Invoice Date</span>
              <span className="text-white">{invoiceRecord.invoiceDate}</span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Contact Number</span>
              <span className="text-white">{invoiceRecord.contactNumber}</span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Email Address</span>
              <span className="text-white">{invoiceRecord.emailAddress}</span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Plan</span>
              <div className="flex items-center">
                <span className="text-white">{invoiceRecord.plan}</span>
                <Info size={16} className="ml-2 text-gray-500" />
              </div>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Provider</span>
              <div className="flex items-center">
                <span className="text-white">{invoiceRecord.provider || 'SWITCH'}</span>
                <Info size={16} className="ml-2 text-gray-500" />
              </div>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Remarks</span>
              <span className="text-white">{invoiceRecord.remarks || 'System Generated'}</span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Invoice Balance</span>
              <span className="text-white">
                ₱{invoiceRecord.invoiceBalance?.toFixed(2) || '0.00'}
              </span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Invoice Status</span>
              <span className={`${invoiceRecord.invoiceStatus === 'Unpaid' ? 'text-red-500' : 'text-green-500'}`}>
                {invoiceRecord.invoiceStatus || 'Unpaid'}
              </span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Others and Basic Charges</span>
              <span className="text-white">
                ₱{invoiceRecord.otherCharges?.toFixed(2) || '0.00'}
              </span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Total Amount</span>
              <span className="text-white">
                ₱{invoiceRecord.totalAmountDue?.toFixed(2) || '0.00'}
              </span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Invoice Payment</span>
              <span className="text-white">
                ₱{invoiceRecord.invoicePayment?.toFixed(2) || '0.00'}
              </span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Due Date</span>
              <span className="text-white">{invoiceRecord.dueDate || '9/30/2025'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Related Staggered Payments Section */}
      <div className="mt-auto border-t border-gray-800">
        <div className="px-5 py-3 flex justify-between items-center bg-gray-850 border-b border-gray-700">
          <div className="flex items-center">
            <h2 className="text-white font-medium">Related Staggered Payments</h2>
            <span className="ml-2 px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded-full">
              {invoiceRecord.staggeredPaymentsCount || 0}
            </span>
          </div>
        </div>
        {/* Empty State */}
        <div className="px-5 py-16 text-center text-gray-500">
          No items
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetails;