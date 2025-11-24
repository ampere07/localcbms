import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, ArrowRight, Maximize2, X, Info, 
  ExternalLink, CheckCircle
} from 'lucide-react';
import LoadingModal from './LoadingModal';
import { staggeredInstallationService } from '../services/staggeredInstallationService';

interface StaggeredInstallation {
  id: string;
  account_no: string;
  staggered_install_no: string;
  staggered_date: string;
  staggered_balance: number;
  months_to_pay: number;
  monthly_payment: number;
  modified_by: string;
  modified_date: string;
  user_email: string;
  remarks: string;
  status: string;
  month1: string | null;
  month2: string | null;
  month3: string | null;
  month4: string | null;
  month5: string | null;
  month6: string | null;
  month7: string | null;
  month8: string | null;
  month9: string | null;
  month10: string | null;
  month11: string | null;
  month12: string | null;
  created_at: string;
  updated_at: string;
  billing_account?: {
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

interface StaggeredListDetailsProps {
  staggered: StaggeredInstallation;
  onClose: () => void;
}

const StaggeredListDetails: React.FC<StaggeredListDetailsProps> = ({ staggered, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [loadingPercentage, setLoadingPercentage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');

  useEffect(() => {
    const authData = localStorage.getItem('authData');
    if (authData) {
      try {
        const userData = JSON.parse(authData);
        setCurrentUserEmail(userData.email || '');
      } catch (error) {
        console.error('Failed to parse auth data:', error);
      }
    }
  }, []);

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

  const handleApproveStaggered = async () => {
    if (!window.confirm('Are you sure you want to approve this staggered installation? This will deduct the staggered balance from the account and apply it to unpaid invoices.')) {
      return;
    }

    try {
      setLoading(true);
      setLoadingPercentage(0);
      setError(null);
      
      setLoadingPercentage(20);
      
      const result = await staggeredInstallationService.approve(staggered.id);
      
      setLoadingPercentage(60);
      
      if (result.success) {
        setLoadingPercentage(100);
        
        staggered.status = 'Active';
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setSuccessMessage(result.message || 'Staggered installation approved successfully');
        setShowSuccessModal(true);
      } else {
        throw new Error(result.message || 'Failed to approve staggered installation');
      }
    } catch (err: any) {
      setError(`Failed to approve staggered installation: ${err.message || 'Unknown error'}`);
      console.error('Approve staggered error:', err);
    } finally {
      setLoading(false);
      setLoadingPercentage(0);
    }
  };

  const getAccountDisplayText = () => {
    const accountNo = staggered.billing_account?.account_no || staggered.account_no || '-';
    const fullName = staggered.billing_account?.customer?.full_name || '-';
    const address = staggered.billing_account?.customer?.address || '';
    const barangay = staggered.billing_account?.customer?.barangay || '';
    const city = staggered.billing_account?.customer?.city || '';
    const region = staggered.billing_account?.customer?.region || '';
    
    const location = [address, barangay, city, region].filter(Boolean).join(', ');
    return `${accountNo} | ${fullName}${location ? ` | ${location}` : ''}`;
  };

  const getMonthPayments = (): Array<{ month: number; invoiceId: string }> => {
    const months: Array<{ month: number; invoiceId: string }> = [];
    for (let i = 1; i <= 12; i++) {
      const monthKey = `month${i}` as keyof StaggeredInstallation;
      const value = staggered[monthKey];
      if (typeof value === 'string' && value) {
        months.push({ month: i, invoiceId: value });
      }
    }
    return months;
  };

  return (
    <>
      <LoadingModal 
        isOpen={loading} 
        message="Approving staggered installation..." 
        percentage={loadingPercentage} 
      />
      
      <div className="w-full h-full bg-gray-950 flex flex-col overflow-hidden border-l border-white border-opacity-30">
        <div className="bg-gray-800 p-3 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center min-w-0 flex-1">
            <h2 className="text-white font-medium truncate pr-4">{getAccountDisplayText()}</h2>
            {loading && <div className="ml-3 animate-pulse text-orange-500 text-sm flex-shrink-0">Loading...</div>}
          </div>
          
          <div className="flex items-center space-x-3">
            {staggered.status.toLowerCase() === 'pending' && 
             currentUserEmail && 
             staggered.modified_by.toLowerCase() === currentUserEmail.toLowerCase() && (
              <button
                onClick={handleApproveStaggered}
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
                <div className="w-40 text-gray-400 text-sm">Staggered ID</div>
                <div className="text-white flex-1">{staggered.id}</div>
              </div>
              
              <div className="flex border-b border-gray-800 py-2">
                <div className="w-40 text-gray-400 text-sm">Install No.</div>
                <div className="text-white flex-1">{staggered.staggered_install_no}</div>
              </div>
              
              <div className="flex border-b border-gray-800 py-2">
                <div className="w-40 text-gray-400 text-sm">Account No.</div>
                <div className="text-red-400 flex-1 font-medium flex items-center">
                  {staggered.billing_account?.account_no || staggered.account_no || '-'}
                  <button className="ml-2 text-gray-400 hover:text-white">
                    <Info size={16} />
                  </button>
                </div>
              </div>
              
              <div className="flex border-b border-gray-800 py-2">
                <div className="w-40 text-gray-400 text-sm">Full Name</div>
                <div className="text-white flex-1">{staggered.billing_account?.customer?.full_name || '-'}</div>
              </div>
              
              <div className="flex border-b border-gray-800 py-2">
                <div className="w-40 text-gray-400 text-sm">Contact No.</div>
                <div className="text-white flex-1">{staggered.billing_account?.customer?.contact_number_primary || '-'}</div>
              </div>
              
              <div className="flex border-b border-gray-800 py-2">
                <div className="w-40 text-gray-400 text-sm">Staggered Balance</div>
                <div className="text-white flex-1 font-bold text-lg">{formatCurrency(staggered.staggered_balance)}</div>
              </div>
              
              <div className="flex border-b border-gray-800 py-2">
                <div className="w-40 text-gray-400 text-sm">Monthly Payment</div>
                <div className="text-white flex-1 font-bold text-lg">{formatCurrency(staggered.monthly_payment)}</div>
              </div>
              
              <div className="flex border-b border-gray-800 py-2">
                <div className="w-40 text-gray-400 text-sm">Months to Pay</div>
                <div className="text-white flex-1">
                  <span className={`font-bold ${staggered.months_to_pay === 0 ? 'text-green-500' : 'text-orange-400'}`}>
                    {staggered.months_to_pay}
                  </span>
                  <span className="text-gray-400 ml-2">
                    {staggered.months_to_pay === 0 ? 'Completed' : `${staggered.months_to_pay} month${staggered.months_to_pay !== 1 ? 's' : ''} remaining`}
                  </span>
                </div>
              </div>
              
              <div className="flex border-b border-gray-800 py-2">
                <div className="w-40 text-gray-400 text-sm">Staggered Date</div>
                <div className="text-white flex-1">{formatDate(staggered.staggered_date)}</div>
              </div>
              
              <div className="flex border-b border-gray-800 py-2">
                <div className="w-40 text-gray-400 text-sm">Modified By</div>
                <div className="text-white flex-1">{staggered.modified_by || '-'}</div>
              </div>
              
              <div className="flex border-b border-gray-800 py-2">
                <div className="w-40 text-gray-400 text-sm">User Email</div>
                <div className="text-white flex-1">{staggered.user_email || '-'}</div>
              </div>
              
              <div className="flex border-b border-gray-800 py-2">
                <div className="w-40 text-gray-400 text-sm">Remarks</div>
                <div className="text-white flex-1">{staggered.remarks || 'No remarks'}</div>
              </div>
              
              <div className="flex border-b border-gray-800 py-2">
                <div className="w-40 text-gray-400 text-sm">Status</div>
                <div className="flex-1">
                  <div className={`capitalize ${
                    staggered.status.toLowerCase() === 'active' ? 'text-green-500' :
                    staggered.status.toLowerCase() === 'pending' ? 'text-yellow-500' :
                    staggered.status.toLowerCase() === 'completed' ? 'text-blue-500' :
                    'text-gray-400'
                  }`}>
                    {staggered.status}
                  </div>
                </div>
              </div>
              
              <div className="flex border-b border-gray-800 py-2">
                <div className="w-40 text-gray-400 text-sm">Barangay</div>
                <div className="text-white flex-1">{staggered.billing_account?.customer?.barangay || '-'}</div>
              </div>
              
              <div className="flex border-b border-gray-800 py-2">
                <div className="w-40 text-gray-400 text-sm">City</div>
                <div className="text-white flex-1">{staggered.billing_account?.customer?.city || '-'}</div>
              </div>
              
              <div className="flex border-b border-gray-800 py-2">
                <div className="w-40 text-gray-400 text-sm">Region</div>
                <div className="text-white flex-1">{staggered.billing_account?.customer?.region || '-'}</div>
              </div>
              
              <div className="flex border-b border-gray-800 py-2">
                <div className="w-40 text-gray-400 text-sm">Plan</div>
                <div className="text-white flex-1">{staggered.billing_account?.customer?.desired_plan || '-'}</div>
              </div>
              
              <div className="flex border-b border-gray-800 py-2">
                <div className="w-40 text-gray-400 text-sm">Account Balance</div>
                <div className="text-white flex-1">{formatCurrency(staggered.billing_account?.account_balance || 0)}</div>
              </div>
              
              <div className="flex border-b border-gray-800 py-2">
                <div className="w-40 text-gray-400 text-sm">Created At</div>
                <div className="text-white flex-1">{formatDate(staggered.created_at)}</div>
              </div>
              
              <div className="flex border-b border-gray-800 py-2">
                <div className="w-40 text-gray-400 text-sm">Updated At</div>
                <div className="text-white flex-1">{formatDate(staggered.updated_at)}</div>
              </div>
            </div>
          </div>
          
          <div className="mx-auto px-4 bg-gray-950 mt-4">
            <div className="border-t border-gray-800 pt-4">
              <div className="flex items-center mb-4">
                <h3 className="text-white font-medium">Monthly Payment History</h3>
                <span className="ml-2 bg-gray-600 text-white text-xs px-2 py-1 rounded">
                  {getMonthPayments().length}
                </span>
              </div>
              {getMonthPayments().length > 0 ? (
                <div className="space-y-2">
                  {getMonthPayments().map((payment) => (
                    <div key={payment.month} className="flex items-center justify-between bg-gray-800 p-3 rounded">
                      <div className="text-gray-300">
                        <span className="font-medium">Month {payment.month}</span>
                      </div>
                      <div className="text-gray-400 flex items-center space-x-2">
                        <span>Invoice ID: {payment.invoiceId}</span>
                        <ExternalLink size={14} className="text-orange-500 cursor-pointer hover:text-orange-400" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  No payment history yet
                </div>
              )}
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

export default StaggeredListDetails;
