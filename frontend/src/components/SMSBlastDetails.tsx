import React from 'react';
import { Trash2, Edit, ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';

interface SMSBlastRecord {
  id?: string;
  title?: string;
  message: string;
  modifiedDate: string;
  modifiedEmail: string;
  userEmail?: string;
  recipients?: number;
  status?: string;
  sentDate?: string;
  sentTime?: string;
  createdBy?: string;
  createdDate?: string;
  messageType?: string;
  isBulk?: boolean;
  isCritical?: boolean;
  targetGroup?: string;
  deliveryStatus?: string;
  deliveryRate?: number;
  failedCount?: number;
  remarks?: string;
  barangay?: string;
  city?: string;
}

interface SMSBlastDetailsProps {
  smsBlastRecord: SMSBlastRecord;
}

const SMSBlastDetails: React.FC<SMSBlastDetailsProps> = ({ smsBlastRecord }) => {
  return (
    <div className="bg-gray-900 text-white h-full flex flex-col">
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-700">
        <h1 className="text-lg font-semibold text-white truncate pr-4 min-w-0 flex-1">
          {smsBlastRecord.title || "NOTICE TO THE PUBLIC"}
        </h1>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
            <Trash2 size={18} />
          </button>
          <button className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm transition-colors flex items-center space-x-1">
            <Edit size={16} />
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
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {/* Message section */}
          <div className="mb-6">
            <h3 className="text-sm uppercase text-gray-500 mb-2">message</h3>
            <div className="text-white whitespace-pre-wrap break-words">
              <p className="font-medium mb-3">{smsBlastRecord.title || "NOTICE TO THE PUBLIC"}</p>
              <p className="mb-4">
                {smsBlastRecord.message || 
                "This is to inform everyone that Mr. ELMER F. SOLIMAN, former Sales Agent is no longer employed to our company. He's NOT AUTHORIZED to transact any business, impose any fees, or pull out modems and other peripherals on behalf of Switch Fiber.\n\nReport immediately if you encountered any transactions from Mr. Elmer Soliman. Contact us at (Globe) 0915 407 7565 or (Smart) 0919 486 9998"}
              </p>
            </div>
          </div>
          
          {/* Modified Date */}
          <div>
            <h3 className="text-sm uppercase text-gray-500 mb-2">modified date</h3>
            <p className="text-white">
              {smsBlastRecord.modifiedDate || "6/28/2024 9:38:30 AM"}
            </p>
          </div>
          
          {/* Modified Email */}
          <div>
            <h3 className="text-sm uppercase text-gray-500 mb-2">modified email</h3>
            <p className="text-white">
              {smsBlastRecord.modifiedEmail || "heatherlynn.hernandez@switchfiber.ph"}
            </p>
          </div>
          
          {/* Additional information that might be shown when expanded */}
          {smsBlastRecord.recipients && (
            <div>
              <h3 className="text-sm uppercase text-gray-500 mb-2">recipients</h3>
              <p className="text-white">{smsBlastRecord.recipients}</p>
            </div>
          )}
          
          {smsBlastRecord.status && (
            <div>
              <h3 className="text-sm uppercase text-gray-500 mb-2">status</h3>
              <p className="text-white">{smsBlastRecord.status}</p>
            </div>
          )}
          
          {smsBlastRecord.barangay && (
            <div>
              <h3 className="text-sm uppercase text-gray-500 mb-2">barangay</h3>
              <p className="text-white">{smsBlastRecord.barangay}</p>
            </div>
          )}
          
          {smsBlastRecord.city && (
            <div>
              <h3 className="text-sm uppercase text-gray-500 mb-2">city</h3>
              <p className="text-white">{smsBlastRecord.city}</p>
            </div>
          )}
          
          {smsBlastRecord.messageType && (
            <div>
              <h3 className="text-sm uppercase text-gray-500 mb-2">message type</h3>
              <p className="text-white">{smsBlastRecord.messageType}</p>
            </div>
          )}
          
          {smsBlastRecord.targetGroup && (
            <div>
              <h3 className="text-sm uppercase text-gray-500 mb-2">target group</h3>
              <p className="text-white">{smsBlastRecord.targetGroup}</p>
            </div>
          )}
          
          {smsBlastRecord.deliveryStatus && (
            <div>
              <h3 className="text-sm uppercase text-gray-500 mb-2">delivery status</h3>
              <p className="text-white">{smsBlastRecord.deliveryStatus}</p>
            </div>
          )}
          
          {smsBlastRecord.deliveryRate !== undefined && (
            <div>
              <h3 className="text-sm uppercase text-gray-500 mb-2">delivery rate</h3>
              <p className="text-white">{smsBlastRecord.deliveryRate}%</p>
            </div>
          )}
          
          {smsBlastRecord.failedCount !== undefined && (
            <div>
              <h3 className="text-sm uppercase text-gray-500 mb-2">failed count</h3>
              <p className="text-white">{smsBlastRecord.failedCount}</p>
            </div>
          )}
          
          {smsBlastRecord.remarks && (
            <div>
              <h3 className="text-sm uppercase text-gray-500 mb-2">remarks</h3>
              <p className="text-white">{smsBlastRecord.remarks}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SMSBlastDetails;