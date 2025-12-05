import React from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X, Info } from 'lucide-react';

interface DisconnectionRecord {
  id?: string;
  accountNo: string;
  customerName: string;
  address?: string;
  contactNumber?: string;
  emailAddress?: string;
  plan?: string;
  balance?: number;
  status?: string;
  disconnectionDate?: string;
  disconnectedBy?: string;
  reason?: string;
  remarks?: string;
  provider?: string;
  appliedDate?: string;
  reconnectionFee?: number;
  daysDisconnected?: number;
  disconnectionCode?: string;
  reconnectionDate?: string;
  reconnectedBy?: string;
  paymentStatus?: string;
  totalDue?: number;
  username?: string;
  splynxId?: string;
  mikrotikId?: string;
  date?: string;
  barangay?: string;
  city?: string;
  dateFormat?: string;
}

interface DisconnectionLogsDetailsProps {
  disconnectionRecord: DisconnectionRecord;
}

const DisconnectionLogsDetails: React.FC<DisconnectionLogsDetailsProps> = ({ disconnectionRecord }) => {
  // Format the title as shown in screenshot
  const title = `${disconnectionRecord.accountNo} | ${disconnectionRecord.customerName} | ${disconnectionRecord.address}`;
  
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
              {disconnectionRecord.accountNo} | {disconnectionRecord.customerName} | {disconnectionRecord.address}
            </p>
          </div>
          
          {/* ID */}
          <div>
            <h3 className="text-sm uppercase text-gray-500 mb-2">id</h3>
            <p className="text-white">
              {disconnectionRecord.splynxId || '202509181547536099'}
            </p>
          </div>
          
          {/* Mikrotik ID */}
          <div>
            <h3 className="text-sm uppercase text-gray-500 mb-2">Mikrotik ID</h3>
            <p className="text-white">
              {disconnectionRecord.mikrotikId || '*1528'}
            </p>
          </div>
          
          {/* Provider */}
          <div>
            <h3 className="text-sm uppercase text-gray-500 mb-2">Provider</h3>
            <p className="text-white">
              {disconnectionRecord.provider || 'SWITCH'}
            </p>
          </div>
          
          {/* Username */}
          <div>
            <h3 className="text-sm uppercase text-gray-500 mb-2">Username</h3>
            <p className="text-white">
              {disconnectionRecord.username || 'manucaye0220251214'}
            </p>
          </div>
          
          {/* Date */}
          <div>
            <h3 className="text-sm uppercase text-gray-500 mb-2">Date</h3>
            <p className="text-white">
              {disconnectionRecord.date || '9/18/2025 3:47:54 PM'}
            </p>
          </div>
          
          {/* Remarks */}
          <div>
            <h3 className="text-sm uppercase text-gray-500 mb-2">Remarks</h3>
            <p className="text-white">
              {disconnectionRecord.remarks || 'Pullout'}
            </p>
          </div>
          
          {/* Barangay */}
          <div>
            <h3 className="text-sm uppercase text-gray-500 mb-2">Barangay</h3>
            <div className="flex items-center">
              <p className="text-white">
                {disconnectionRecord.barangay || 'Tatala'}
              </p>
              <Info size={16} className="ml-2 text-gray-500" />
            </div>
          </div>
          
          {/* City */}
          <div>
            <h3 className="text-sm uppercase text-gray-500 mb-2">City</h3>
            <p className="text-white">
              {disconnectionRecord.city || 'Binangonan'}
            </p>
          </div>
          
          {/* Date Format */}
          <div>
            <h3 className="text-sm uppercase text-gray-500 mb-2">Date Format</h3>
            <p className="text-white">
              {disconnectionRecord.dateFormat || disconnectionRecord.date?.split(' ')[0] || '9/18/2025'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisconnectionLogsDetails;