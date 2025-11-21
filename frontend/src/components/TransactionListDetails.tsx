import React, { useState } from 'react';
import { 
  ArrowLeft, ArrowRight, Maximize2, X, Phone, MessageSquare, Info, 
  ExternalLink, Mail, Edit, Trash2, Receipt, RefreshCw, CheckCircle
} from 'lucide-react';
import { transactionService } from '../services/transactionService';
import LoadingModal from './LoadingModal';

interface TransactionListDetailsProps {
  transaction: {
    id: string;
    dateProcessed: string;
    accountNo: string;
    receivedPayment: number;
    paymentMethod: string;
    processedBy: string;
    fullName: string;
    orNo: string;
    referenceNo: string;
    remarks: string;
    status: string;
    transactionType: string;
    image?: string;
    barangay: string;
    transactionId: string;
    contactNo: string;
    modifiedBy: string;
    modifiedDate: string;
    provider: string;
    paymentDate: string;
    city: string;
    plan: string;
    accountBalance: number;
    relatedInvoices: string;
    created_at: string;
    updated_at: string;
    [key: string]: any;
  };
  onClose: () => void;
}

const TransactionListDetails: React.FC<TransactionListDetailsProps> = ({ transaction, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [loadingPercentage, setLoadingPercentage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₱${amount.toFixed(2)}`;
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
        
        alert(`Transaction approved successfully. Status: ${status}`);
        
        if (onClose) {
          onClose();
        }
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
    // Create the full account display text like "202306310 | Jocelyn H Roncales | 0 (A) Ojascastro St, Tatala, Binangonan, Rizal"
    return `${transaction.accountNo} | ${transaction.fullName} | 0 (A) Ojascastro St, ${transaction.barangay}, ${transaction.city}, Rizal`;
  };

  return (
    <>
      <LoadingModal 
        isOpen={loading} 
        message="Approving transaction..." 
        percentage={loadingPercentage} 
      />
      
      <div className="w-full h-full bg-gray-950 flex flex-col overflow-hidden border-l border-white border-opacity-30">
      {/* Header */}
      <div className="bg-gray-800 p-3 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center min-w-0 flex-1">
          <h2 className="text-white font-medium truncate pr-4">{getAccountDisplayText()}</h2>
          {loading && <div className="ml-3 animate-pulse text-orange-500 text-sm flex-shrink-0">Loading...</div>}
        </div>
        
        <div className="flex items-center space-x-3">
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
      
      {/* Error message if any */}
      {error && (
        <div className="bg-red-900 bg-opacity-20 border border-red-700 text-red-400 p-3 m-3 rounded">
          {error}
        </div>
      )}
      
      {/* Transaction Details */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto py-1 px-4 bg-gray-950">
          <div className="space-y-1">
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Account No.</div>
              <div className="text-red-400 flex-1 font-medium flex items-center">
                {getAccountDisplayText()}
                <button className="ml-2 text-gray-400 hover:text-white">
                  <Info size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Transaction ID</div>
              <div className="text-white flex-1">{transaction.transactionId}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Full Name</div>
              <div className="text-white flex-1">{transaction.fullName}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Contact No.</div>
              <div className="text-white flex-1">{transaction.contactNo}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Received Payment</div>
              <div className="text-white flex-1 font-bold text-lg">{formatCurrency(transaction.receivedPayment)}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Date Processed</div>
              <div className="text-white flex-1">{transaction.dateProcessed}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Processed By</div>
              <div className="text-white flex-1 flex items-center">
                {transaction.processedBy}
                <button className="ml-2 text-gray-400 hover:text-white">
                  <Info size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Payment Method</div>
              <div className="text-white flex-1 flex items-center">
                {transaction.paymentMethod}
                <button className="ml-2 text-gray-400 hover:text-white">
                  <Info size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Reference No.</div>
              <div className="text-white flex-1">{transaction.referenceNo}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">OR No.</div>
              <div className="text-white flex-1">{transaction.orNo}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Modified By</div>
              <div className="text-white flex-1">shainemiraflor@gmail.com</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Modified Date</div>
              <div className="text-white flex-1">{transaction.modifiedDate}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">User Email</div>
              <div className="text-white flex-1 flex items-center">
                shainemiraflor@gmail.com
                <button className="ml-2 text-gray-400 hover:text-white">
                  <Mail size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Status</div>
              <div className="flex-1 flex items-center justify-between">
                <div className={`capitalize ${
                  transaction.status.toLowerCase() === 'done' ? 'text-green-500' :
                  transaction.status.toLowerCase() === 'pending' ? 'text-yellow-500' :
                  transaction.status.toLowerCase() === 'processing' ? 'text-blue-500' :
                  'text-gray-400'
                }`}>
                  {transaction.status}
                </div>
                {transaction.status.toLowerCase() === 'pending' && (
                  <button
                    onClick={handleApproveTransaction}
                    disabled={loading}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded text-sm transition-colors"
                  >
                    <CheckCircle size={16} />
                    <span>{loading ? 'Approving...' : 'Approve'}</span>
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Provider</div>
              <div className="text-white flex-1 flex items-center">
                {transaction.provider}
                <button className="ml-2 text-gray-400 hover:text-white">
                  <Info size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Transaction Type</div>
              <div className="text-white flex-1">{transaction.transactionType}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Payment Date</div>
              <div className="text-white flex-1">{transaction.paymentDate}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Barangay</div>
              <div className="text-white flex-1 flex items-center">
                {transaction.barangay}
                <button className="ml-2 text-gray-400 hover:text-white">
                  <Info size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">City</div>
              <div className="text-white flex-1">{transaction.city}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Plan</div>
              <div className="text-white flex-1 flex items-center">
                {transaction.plan}
                <button className="ml-2 text-gray-400 hover:text-white">
                  <Info size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Account Balance</div>
              <div className="text-white flex-1">{formatCurrency(transaction.accountBalance)}</div>
            </div>
          </div>
        </div>
        
        {/* Related Invoices Section */}
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
    </>
  );
};

export default TransactionListDetails;