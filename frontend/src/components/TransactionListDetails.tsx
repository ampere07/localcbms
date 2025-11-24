import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, ArrowRight, Maximize2, X, Phone, MessageSquare, Info, 
  ExternalLink, Mail, Edit, Trash2, Receipt, RefreshCw, CheckCircle
} from 'lucide-react';
import { transactionService } from '../services/transactionService';
import LoadingModal from './LoadingModal';

interface Transaction {
  id: string;
  account_no: string;
  transaction_type: string;
  received_payment: number;
  payment_date: string;
  date_processed: string;
  processed_by_user: string;
  payment_method: string;
  reference_no: string;
  or_no: string;
  remarks: string;
  status: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  account?: {
    id: number;
    account_no: string;
    customer: {
      full_name: string;
      contact_number_primary: string;
      barangay: string;
      city: string;
      desired_plan: string;
      address: string;
      region: string;
    };
    account_balance: number;
  };
}

interface TransactionListDetailsProps {
  transaction: Transaction;
  onClose: () => void;
}

const TransactionListDetails: React.FC<TransactionListDetailsProps> = ({ transaction, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [loadingPercentage, setLoadingPercentage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [detailsWidth, setDetailsWidth] = useState<number>(600);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  // Debug logging
  console.log('TransactionListDetails received transaction:', transaction);
  console.log('TransactionListDetails customer:', transaction.account?.customer);
  console.log('TransactionListDetails full_name:', transaction.account?.customer?.full_name);

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

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `₱${numAmount.toFixed(2)}`;
  };

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return 'No date';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch (e) {
      return dateStr;
    }
  };

  const handleApproveTransaction = async () => {
    if (!window.confirm('Are you sure you want to approve this transaction?')) {
      return;
    }

    try {
      setLoading(true);
      setLoadingPercentage(0);
      setError(null);
      
      setLoadingPercentage(20);
      
      const result = await transactionService.approveTransaction(transaction.id);
      
      setLoadingPercentage(60);
      
      if (result.success) {
        setLoadingPercentage(100);
        
        const status = result.data?.status || 'Done';
        transaction.status = status;
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setSuccessMessage(`Transaction approved successfully. Status: ${status}`);
        setShowSuccessModal(true);
      } else {
        setError(result.message || 'Failed to approve transaction');
      }
    } catch (err: any) {
      setError(`Failed to approve transaction: ${err.message}`);
      console.error('Approve transaction error:', err);
    } finally {
      setLoading(false);
      setLoadingPercentage(0);
    }
  };

  const getAccountDisplayText = () => {
    const accountNo = transaction.account?.account_no || '-';
    const fullName = transaction.account?.customer?.full_name || '-';
    const address = transaction.account?.customer?.address || '';
    const barangay = transaction.account?.customer?.barangay || '';
    const city = transaction.account?.customer?.city || '';
    const region = transaction.account?.customer?.region || '';
    
    const location = [address, barangay, city, region].filter(Boolean).join(', ');
    return `${accountNo} | ${fullName}${location ? ` | ${location}` : ''}`;
  };

  return (
    <>
      <LoadingModal 
        isOpen={loading} 
        message="Approving transaction..." 
        percentage={loadingPercentage} 
      />
      
      <div className="bg-gray-950 flex flex-col overflow-hidden border-l border-white border-opacity-30 relative" style={{ width: `${detailsWidth}px`, height: '100%' }}>
      <div
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-orange-500 transition-colors z-50"
        onMouseDown={handleMouseDownResize}
      />
      <div className="bg-gray-800 p-3 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center min-w-0 flex-1">
          <h2 className="text-white font-medium truncate pr-4">{getAccountDisplayText()}</h2>
          {loading && <div className="ml-3 animate-pulse text-orange-500 text-sm flex-shrink-0">Loading...</div>}
        </div>
        
        <div className="flex items-center space-x-3">
          {transaction.status.toLowerCase() === 'pending' && (
            <button
              onClick={handleApproveTransaction}
              disabled={loading}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded text-sm transition-colors"
            >
              <CheckCircle size={16} />
              <span>{loading ? 'Approving...' : 'Approve'}</span>
            </button>
          )}
          <button className="hover:text-white text-gray-400"><ArrowLeft size={16} /></button>
          <button className="hover:text-white text-gray-400"><ArrowRight size={16} /></button>
          <button className="hover:text-white text-gray-400"><Maximize2 size={16} /></button>
          <button 
            onClick={onClose}
            className="hover:text-white text-gray-400"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-900 bg-opacity-20 border border-red-700 text-red-400 p-3 m-3 rounded">
          {error}
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto py-1 px-4 bg-gray-950">
          <div className="space-y-1">
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Transaction ID</div>
              <div className="text-white flex-1">{transaction.id}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Account No.</div>
              <div className="text-red-400 flex-1 font-medium flex items-center">
                {transaction.account?.account_no || '-'}
                <button className="ml-2 text-gray-400 hover:text-white">
                  <Info size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Full Name</div>
              <div className="text-white flex-1">{transaction.account?.customer?.full_name || '-'}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Contact No.</div>
              <div className="text-white flex-1">{transaction.account?.customer?.contact_number_primary || '-'}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Transaction Type</div>
              <div className="text-white flex-1">{transaction.transaction_type}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Received Payment</div>
              <div className="text-white flex-1 font-bold text-lg">{formatCurrency(transaction.received_payment)}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Payment Date</div>
              <div className="text-white flex-1">{formatDate(transaction.payment_date)}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Date Processed</div>
              <div className="text-white flex-1">{formatDate(transaction.date_processed)}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Processed By</div>
              <div className="text-white flex-1 flex items-center">
                {transaction.processed_by_user || '-'}
                <button className="ml-2 text-gray-400 hover:text-white">
                  <Info size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Payment Method</div>
              <div className="text-white flex-1 flex items-center">
                {transaction.payment_method}
                <button className="ml-2 text-gray-400 hover:text-white">
                  <Info size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Reference No.</div>
              <div className="text-white flex-1">{transaction.reference_no}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">OR No.</div>
              <div className="text-white flex-1">{transaction.or_no}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Remarks</div>
              <div className="text-white flex-1">{transaction.remarks || 'No remarks'}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Status</div>
              <div className="flex-1">
                <div className={`capitalize ${
                  transaction.status.toLowerCase() === 'done' ? 'text-green-500' :
                  transaction.status.toLowerCase() === 'pending' ? 'text-yellow-500' :
                  transaction.status.toLowerCase() === 'processing' ? 'text-blue-500' :
                  'text-gray-400'
                }`}>
                  {transaction.status}
                </div>
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Barangay</div>
              <div className="text-white flex-1 flex items-center">
                {transaction.account?.customer?.barangay || '-'}
                <button className="ml-2 text-gray-400 hover:text-white">
                  <Info size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">City</div>
              <div className="text-white flex-1">{transaction.account?.customer?.city || '-'}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Region</div>
              <div className="text-white flex-1">{transaction.account?.customer?.region || '-'}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Plan</div>
              <div className="text-white flex-1 flex items-center">
                {transaction.account?.customer?.desired_plan || '-'}
                <button className="ml-2 text-gray-400 hover:text-white">
                  <Info size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Account Balance</div>
              <div className="text-white flex-1">{formatCurrency(transaction.account?.account_balance || 0)}</div>
            </div>
            
            {transaction.image_url && (
              <div className="flex border-b border-gray-800 py-2">
                <div className="w-40 text-gray-400 text-sm">Payment Proof</div>
                <div className="text-white flex-1">
                  <a 
                    href={transaction.image_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-orange-500 hover:text-orange-400 flex items-center"
                  >
                    View Image <ExternalLink size={14} className="ml-1" />
                  </a>
                </div>
              </div>
            )}
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Created At</div>
              <div className="text-white flex-1">{formatDate(transaction.created_at)}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Updated At</div>
              <div className="text-white flex-1">{formatDate(transaction.updated_at)}</div>
            </div>
          </div>
        </div>
        
        <div className="mx-auto px-4 bg-gray-950 mt-4">
          <div className="border-t border-gray-800 pt-4">
            <div className="flex items-center mb-4">
              <h3 className="text-white font-medium">Related Invoices</h3>
              <span className="ml-2 bg-gray-600 text-white text-xs px-2 py-1 rounded">0</span>
            </div>
            <div className="text-center py-8 text-gray-400">
              No items
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Success Modal */}
    {showSuccessModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">Success</h3>
          <p className="text-gray-300 mb-6">{successMessage}</p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowSuccessModal(false);
                if (onClose) {
                  onClose();
                }
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default TransactionListDetails;
