import React from 'react';
import { Mail, ExternalLink, Edit, ChevronLeft, ChevronRight, Maximize2, X, Info } from 'lucide-react';

interface DiscountRecord {
  id?: string;
  fullName: string;
  accountNo: string;
  contactNumber: string;
  emailAddress: string;
  address: string;
  plan: string;
  provider: string;
  discountId: string;
  discountAmount: number;
  discountStatus: string;
  dateCreated: string;
  processedBy: string;
  processedDate: string;
  approvedBy: string;
  modifiedBy: string;
  modifiedDate: string;
  userEmail: string;
  remarks: string;
  barangay?: string;
  city?: string;
  completeAddress?: string;
}

interface DiscountDetailsProps {
  discountRecord: DiscountRecord;
}

const DiscountDetails: React.FC<DiscountDetailsProps> = ({ discountRecord }) => {
  return (
    <div className="bg-gray-900 text-white h-full flex flex-col">
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-700">
        <h1 className="text-lg font-semibold text-white truncate pr-4 min-w-0 flex-1">
          {discountRecord.fullName}
        </h1>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <button className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm transition-colors flex items-center space-x-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            <span>Edit</span>
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
          <div className="px-5 py-4">
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Full Name</span>
              <span className="text-white">{discountRecord.fullName}</span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Account No.</span>
              <div className="flex items-center">
                <span className="text-red-500">
                  {discountRecord.accountNo} | {discountRecord.fullName} | {discountRecord.completeAddress || discountRecord.address}
                </span>
                <Info size={16} className="ml-2 text-gray-500" />
              </div>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Contact Number</span>
              <span className="text-white">{discountRecord.contactNumber}</span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Email Address</span>
              <span className="text-white">{discountRecord.emailAddress}</span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Address</span>
              <span className="text-white">{discountRecord.address}</span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Plan</span>
              <span className="text-white">{discountRecord.plan}</span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Provider</span>
              <span className="text-white">{discountRecord.provider}</span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Discount ID</span>
              <span className="text-white">{discountRecord.discountId}</span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Discount Amount</span>
              <span className="text-white">₱{discountRecord.discountAmount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Discount Status</span>
              <span className="text-white">{discountRecord.discountStatus}</span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Date Created</span>
              <span className="text-white">{discountRecord.dateCreated}</span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Processed By</span>
              <div className="flex items-center">
                <span className="text-white">{discountRecord.processedBy}</span>
                <Info size={16} className="ml-2 text-gray-500" />
              </div>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Processed Date</span>
              <span className="text-white">{discountRecord.processedDate}</span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Approved By</span>
              <div className="flex items-center">
                <span className="text-white">{discountRecord.approvedBy}</span>
                <Info size={16} className="ml-2 text-gray-500" />
              </div>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Modified By</span>
              <div className="flex items-center">
                <span className="text-white">{discountRecord.modifiedBy}</span>
                <Info size={16} className="ml-2 text-gray-500" />
              </div>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Modified Date</span>
              <span className="text-white">{discountRecord.modifiedDate}</span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">User Email</span>
              <div className="flex items-center">
                <span className="text-white">{discountRecord.userEmail}</span>
                <Mail size={16} className="ml-2 text-gray-500" />
              </div>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Remarks</span>
              <span className="text-white">{discountRecord.remarks}</span>
            </div>

            {discountRecord.barangay && (
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-400">Barangay</span>
                <div className="flex items-center">
                  <span className="text-white">{discountRecord.barangay}</span>
                  <Info size={16} className="ml-2 text-gray-500" />
                </div>
              </div>
            )}

            {discountRecord.city && (
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-400">City</span>
                <div className="flex items-center">
                  <span className="text-white">{discountRecord.city}</span>
                  <Info size={16} className="ml-2 text-gray-500" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscountDetails;