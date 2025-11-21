import React from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X, Info } from 'lucide-react';

interface ReconnectionRecord {
  id?: string;
  accountNo: string;
  customerName: string;
  address?: string;
  contactNumber?: string;
  emailAddress?: string;
  plan?: string;
  balance?: number;
  status?: string;
  reconnectionDate?: string;
  reconnectedBy?: string;
  reason?: string;
  remarks?: string;
  provider?: string;
  appliedDate?: string;
  reconnectionFee?: number;
  daysDisconnected?: number;
  reconnectionCode?: string;
  username?: string;
  splynxId?: string;
  mikrotikId?: string;
  date?: string;
  barangay?: string;
  city?: string;
  dateFormat?: string;
}

interface ReconnectionLogsDetailsProps {
  reconnectionRecord: ReconnectionRecord;
}

const ReconnectionLogsDetails: React.FC<ReconnectionLogsDetailsProps> = ({ reconnectionRecord }) => {
  // Format the title as shown in screenshot
  const title = `${reconnectionRecord.accountNo} | ${reconnectionRecord.customerName} | ${reconnectionRecord.address}`;
  
  return (
    <div className="bg-gray-900 text-white h-full flex flex-col">
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-700">
        <h1 className="text-lg font-semibold text-white truncate pr-4 min-w-0 flex-1">
          {title}
        </h1>
        <div className="flex items-center space-x-2 flex-shrink-0">
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
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {/* Account No */}
          <div>
            <h3 className="text-sm uppercase text-gray-500 mb-2">Account No.</h3>
            <p className="text-red-500">
              {reconnectionRecord.accountNo} | {reconnectionRecord.customerName} | {reconnectionRecord.address}
            </p>
          </div>
          
          {/* ID */}
          <div>
            <h3 className="text-sm uppercase text-gray-500 mb-2">id</h3>
            <p className="text-white">
              {reconnectionRecord.splynxId || '202509181617722'}
            </p>
          </div>
          
          {/* Mikrotik ID */}
          <div>
            <h3 className="text-sm uppercase text-gray-500 mb-2">Mikrotik ID</h3>
            <p className="text-white">
              {reconnectionRecord.mikrotikId || '*1C7E'}
            </p>
          </div>
          
          {/* Provider */}
          <div>
            <h3 className="text-sm uppercase text-gray-500 mb-2">Provider</h3>
            <div className="flex items-center">
              <p className="text-white">
                {reconnectionRecord.provider || 'SWITCH'}
              </p>
              <Info size={16} className="ml-2 text-gray-500" />
            </div>
          </div>
          
          {/* Username */}
          <div>
            <h3 className="text-sm uppercase text-gray-500 mb-2">Username</h3>
            <p className="text-white">
              {reconnectionRecord.username || 'santosg0701251450'}
            </p>
          </div>
          
          {/* Date */}
          <div>
            <h3 className="text-sm uppercase text-gray-500 mb-2">Date</h3>
            <p className="text-white">
              {reconnectionRecord.date || '9/18/2025 4:17:22 PM'}
            </p>
          </div>
          
          {/* Plan */}
          <div>
            <h3 className="text-sm uppercase text-gray-500 mb-2">Plan</h3>
            <div className="flex items-center">
              <p className="text-white">
                {reconnectionRecord.plan || 'SwitchLite - P699'}
              </p>
              <Info size={16} className="ml-2 text-gray-500" />
            </div>
          </div>
          
          {/* Reconnection Fee */}
          <div>
            <h3 className="text-sm uppercase text-gray-500 mb-2">Reconnection Fee</h3>
            <p className="text-white">
              ₱{reconnectionRecord.reconnectionFee !== undefined ? reconnectionRecord.reconnectionFee.toFixed(2) : '0.00'}
            </p>
          </div>
          
          {/* Remarks */}
          <div>
            <h3 className="text-sm uppercase text-gray-500 mb-2">Remarks</h3>
            <p className="text-white">
              {reconnectionRecord.remarks || 'Transaction'}
            </p>
          </div>
          
          {/* Barangay */}
          <div>
            <h3 className="text-sm uppercase text-gray-500 mb-2">Barangay</h3>
            <div className="flex items-center">
              <p className="text-white">
                {reconnectionRecord.barangay || 'Tatala'}
              </p>
              <Info size={16} className="ml-2 text-gray-500" />
            </div>
          </div>
          
          {/* City */}
          <div>
            <h3 className="text-sm uppercase text-gray-500 mb-2">City</h3>
            <div className="flex items-center">
              <p className="text-white">
                {reconnectionRecord.city || 'Binangonan'}
              </p>
              <Info size={16} className="ml-2 text-gray-500" />
            </div>
          </div>
          
          {/* Date Format */}
          <div>
            <h3 className="text-sm uppercase text-gray-500 mb-2">Date Format</h3>
            <p className="text-white">
              {reconnectionRecord.dateFormat || '9/18/2025'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReconnectionLogsDetails;