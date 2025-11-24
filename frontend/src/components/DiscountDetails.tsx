import React, { useState, useEffect, useRef } from 'react';
import { Mail, ExternalLink, Check, ChevronLeft, ChevronRight, Maximize2, X, Info } from 'lucide-react';
import { update } from '../services/discountService';

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
  approvedByEmail?: string;
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
  onClose?: () => void;
  onApproveSuccess?: () => void;
}

const DiscountDetails: React.FC<DiscountDetailsProps> = ({ discountRecord, onClose, onApproveSuccess }) => {
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [showApproveButton, setShowApproveButton] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [detailsWidth, setDetailsWidth] = useState<number>(600);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  useEffect(() => {
    const authData = localStorage.getItem('authData');
    if (authData) {
      try {
        const userData = JSON.parse(authData);
        const userEmail = userData.email || '';
        setCurrentUserEmail(userEmail);
        
        const isApprovedByUser = discountRecord.approvedByEmail && userEmail && discountRecord.approvedByEmail === userEmail;
        const isPendingStatus = discountRecord.discountStatus === 'Pending';
        
        setShowApproveButton(isApprovedByUser && isPendingStatus);
      } catch (error) {
        console.error('Error parsing auth data:', error);
      }
    }
  }, [discountRecord.approvedByEmail, discountRecord.discountStatus]);

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

  const handleApprove = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmApprove = async () => {
    if (!discountRecord.id) {
      alert('Discount ID is missing');
      return;
    }

    setIsApproving(true);
    
    try {
      const response = await update(parseInt(discountRecord.id), {
        status: 'Unused'
      });

      if (response.success) {
        alert('Discount approved successfully! Status updated to Unused.');
        setShowConfirmModal(false);
        if (onApproveSuccess) {
          onApproveSuccess();
        }
      } else {
        alert('Failed to approve discount: ' + (response.message || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('Error approving discount:', error);
      alert('Error approving discount: ' + (error.response?.data?.message || error.message || 'Unknown error'));
    } finally {
      setIsApproving(false);
    }
  };

  const handleCancelApprove = () => {
    setShowConfirmModal(false);
  };

  return (
    <div className="bg-gray-900 text-white h-full flex flex-col border-l border-white border-opacity-30 relative" style={{ width: `${detailsWidth}px` }}>
      <div
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-orange-500 transition-colors z-50"
        onMouseDown={handleMouseDownResize}
      />
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-700">
        <h1 className="text-lg font-semibold text-white truncate pr-4 min-w-0 flex-1">
          {discountRecord.fullName}
        </h1>
        <div className="flex items-center space-x-2 flex-shrink-0">
          {showApproveButton && (
            <button 
              onClick={handleApprove}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors flex items-center space-x-1"
            >
              <Check size={16} />
              <span>Approve</span>
            </button>
          )}
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
            <ChevronLeft size={18} />
          </button>
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
            <ChevronRight size={18} />
          </button>
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
            <Maximize2 size={18} />
          </button>
          {onClose && (
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
              <X size={18} />
            </button>
          )}
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

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Confirm Approval</h2>
              <button
                onClick={handleCancelApprove}
                disabled={isApproving}
                className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-300 mb-4">
                Are you sure you want to approve this discount?
              </p>
              <div className="bg-gray-900 p-4 rounded border border-gray-700 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Account No:</span>
                  <span className="text-white">{discountRecord.accountNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Customer:</span>
                  <span className="text-white">{discountRecord.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount:</span>
                  <span className="text-white">₱{discountRecord.discountAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Current Status:</span>
                  <span className="text-yellow-400">{discountRecord.discountStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">New Status:</span>
                  <span className="text-green-400">Unused</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleCancelApprove}
                disabled={isApproving}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmApprove}
                disabled={isApproving}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isApproving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Approving...
                  </>
                ) : (
                  <>
                    <Check size={16} className="mr-2" />
                    Confirm Approval
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscountDetails;