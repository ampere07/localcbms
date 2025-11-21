import React, { useState } from 'react';
import { 
  ArrowLeft, ArrowRight, Maximize2, X, Phone, MessageSquare, Info, 
  ExternalLink, Mail, Edit, Trash2, Globe, RefreshCw, CheckCircle
} from 'lucide-react';

interface PaymentPortalDetailsProps {
  record: {
    id: string;
    dateTime: string;
    accountNo: string;
    receivedPayment: number;
    status: string;
    referenceNo: string;
    contactNo: string;
    accountBalance: number;
    checkoutId: string;
    transactionStatus: string;
    provider: string;
    paymentMethod?: string;
    fullName?: string;
    city?: string;
    barangay?: string;
    plan?: string;
    created_at: string;
    updated_at: string;
    [key: string]: any;
  };
  onClose: () => void;
}

const PaymentPortalDetails: React.FC<PaymentPortalDetailsProps> = ({ record, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return `₱${amount.toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'completed' || statusLower === 'success' || statusLower === 'approved' || statusLower === 'paid') return 'text-green-500';
    if (statusLower === 'pending') return 'text-yellow-500';
    if (statusLower === 'processing') return 'text-blue-500';
    if (statusLower === 'failed') return 'text-red-500';
    return 'text-gray-400';
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      setLoading(true);
      console.log(`Updating payment portal record ${record.id} status to ${newStatus}`);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      record.status = newStatus;
      alert(`Payment portal status updated to ${newStatus}`);
    } catch (err: any) {
      setError(`Failed to update status: ${err.message}`);
      console.error('Status update error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayTitle = () => {
    return `${record.accountNo} | ${record.fullName || 'Unknown'} | ${record.provider} Payment`;
  };

  return (
    <div className="w-full h-full bg-gray-950 flex flex-col overflow-hidden border-l border-white border-opacity-30">
      <div className="bg-gray-800 p-3 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center min-w-0 flex-1">
          <h2 className="text-white font-medium truncate pr-4">{getDisplayTitle()}</h2>
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
      
      {error && (
        <div className="bg-red-900 bg-opacity-20 border border-red-700 text-red-400 p-3 m-3 rounded">
          {error}
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto py-4 px-4 bg-gray-950">
          <div className="space-y-4">
            <div className="flex border-b border-gray-800 py-3">
              <div className="w-40 text-gray-400 text-sm">Reference No</div>
              <div className="text-white flex-1 font-mono">
                {record.referenceNo || `${record.accountNo}-049b6beb4b39a844f8f95b`}
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-3">
              <div className="w-40 text-gray-400 text-sm">Account No</div>
              <div className="text-red-400 flex-1 font-medium flex items-center">
                {record.accountNo} | {record.fullName || 'Unknown'} | 0337 B San Roque St Cervo Cpd, {record.barangay || 'Bilibiran'}, {record.city || 'Binangonan'}, Rizal
                <button className="ml-2 text-gray-400 hover:text-white">
                  <Info size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-3">
              <div className="w-40 text-gray-400 text-sm">Contact No</div>
              <div className="text-white flex-1">
                {record.contactNo}
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-3">
              <div className="w-40 text-gray-400 text-sm">Account Balance</div>
              <div className="text-white flex-1">{formatCurrency(record.accountBalance)}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-3">
              <div className="w-40 text-gray-400 text-sm">Received Payment</div>
              <div className="text-white flex-1">{formatCurrency(record.receivedPayment)}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-3">
              <div className="w-40 text-gray-400 text-sm">Date Time</div>
              <div className="text-white flex-1">{record.dateTime}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-3">
              <div className="w-40 text-gray-400 text-sm">Checkout ID</div>
              <div className="text-white flex-1 font-mono">{record.checkoutId}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-3">
              <div className="w-40 text-gray-400 text-sm">Status</div>
              <div className={`flex-1 capitalize font-medium ${getStatusColor(record.status)}`}>
                {record.status}
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-3">
              <div className="w-40 text-gray-400 text-sm">Transaction Status</div>
              <div className={`flex-1 capitalize font-medium ${getStatusColor(record.transactionStatus)}`}>
                {record.transactionStatus}
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-3">
              <div className="w-40 text-gray-400 text-sm">Provider</div>
              <div className="text-white flex-1 flex items-center">
                {record.provider}
                <button className="ml-2 text-gray-400 hover:text-white">
                  <Info size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-3">
              <div className="w-40 text-gray-400 text-sm">Plan</div>
              <div className="text-white flex-1 flex items-center">
                {record.plan || 'SwitchNet - P999'}
                <button className="ml-2 text-gray-400 hover:text-white">
                  <Info size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-3">
              <div className="w-40 text-gray-400 text-sm">Name</div>
              <div className="text-white flex-1">{record.fullName || 'Unknown'}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-3">
              <div className="w-40 text-gray-400 text-sm">Barangay</div>
              <div className="text-white flex-1 flex items-center">
                {record.barangay || 'Bilibiran'}
                <button className="ml-2 text-gray-400 hover:text-white">
                  <Info size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex py-3">
              <div className="w-40 text-gray-400 text-sm">City</div>
              <div className="text-white flex-1">{record.city || 'Binangonan'}</div>
            </div>
          </div>
        </div>
        
        <div className="mx-auto px-4 bg-gray-950 mt-4">
          <div className="border-t border-gray-800 pt-4">
            <div className="flex items-center mb-4">
              <h3 className="text-white font-medium">Related Invoices</h3>
              <span className="ml-2 bg-gray-600 text-white text-xs px-2 py-1 rounded">1</span>
            </div>
            
            <div className="overflow-x-scroll overflow-y-hidden">
              <table className="w-max min-w-full text-sm border-separate border-spacing-0">
                <thead>
                  <tr className="border-b border-gray-700 bg-gray-800 sticky top-0 z-10">
                    <th className="text-left py-3 px-3 text-gray-400 font-normal border-r border-gray-700 bg-gray-800 min-w-28 whitespace-nowrap">Invoice Status</th>
                    <th className="text-left py-3 px-3 text-gray-400 font-normal border-r border-gray-700 bg-gray-800 min-w-28 whitespace-nowrap">Invoice Date</th>
                    <th className="text-left py-3 px-3 text-gray-400 font-normal border-r border-gray-700 bg-gray-800 min-w-28 whitespace-nowrap">Due Date</th>
                    <th className="text-left py-3 px-3 text-gray-400 font-normal border-r border-gray-700 bg-gray-800 min-w-32 whitespace-nowrap">Total Amount</th>
                    <th className="text-left py-3 px-3 text-gray-400 font-normal border-r border-gray-700 bg-gray-800 min-w-32 whitespace-nowrap">Invoice Payment</th>
                    <th className="text-left py-3 px-3 text-gray-400 font-normal border-r border-gray-700 bg-gray-800 min-w-32 whitespace-nowrap">Account No.</th>
                    <th className="text-left py-3 px-3 text-gray-400 font-normal border-r border-gray-700 bg-gray-800 min-w-28 whitespace-nowrap">Invoice No.</th>
                    <th className="text-left py-3 px-3 text-gray-400 font-normal border-r border-gray-700 bg-gray-800 min-w-40 whitespace-nowrap">Full Name</th>
                    <th className="text-left py-3 px-3 text-gray-400 font-normal border-r border-gray-700 bg-gray-800 min-w-36 whitespace-nowrap">Contact Number</th>
                    <th className="text-left py-3 px-3 text-gray-400 font-normal border-r border-gray-700 bg-gray-800 min-w-48 whitespace-nowrap">Email Address</th>
                    <th className="text-left py-3 px-3 text-gray-400 font-normal border-r border-gray-700 bg-gray-800 min-w-56 whitespace-nowrap">Address</th>
                    <th className="text-left py-3 px-3 text-gray-400 font-normal border-r border-gray-700 bg-gray-800 min-w-40 whitespace-nowrap">Plan</th>
                    <th className="text-left py-3 px-3 text-gray-400 font-normal border-r border-gray-700 bg-gray-800 min-w-28 whitespace-nowrap">Provider</th>
                    <th className="text-left py-3 px-3 text-gray-400 font-normal border-r border-gray-700 bg-gray-800 min-w-32 whitespace-nowrap">Remarks</th>
                    <th className="text-left py-3 px-3 text-gray-400 font-normal border-r border-gray-700 bg-gray-800 min-w-32 whitespace-nowrap">Invoice Balance</th>
                    <th className="text-left py-3 px-3 text-gray-400 font-normal border-r border-gray-700 bg-gray-800 min-w-48 whitespace-nowrap">Others and Basic Charges</th>
                    <th className="text-left py-3 px-3 text-gray-400 font-normal border-r border-gray-700 bg-gray-800 min-w-36 whitespace-nowrap">Date Processed</th>
                    <th className="text-left py-3 px-3 text-gray-400 font-normal border-r border-gray-700 bg-gray-800 min-w-32 whitespace-nowrap">Processed By</th>
                    <th className="text-left py-3 px-3 text-gray-400 font-normal border-r border-gray-700 bg-gray-800 min-w-36 whitespace-nowrap">Payment Method</th>
                    <th className="text-left py-3 px-3 text-gray-400 font-normal border-r border-gray-700 bg-gray-800 min-w-32 whitespace-nowrap">Reference</th>
                    <th className="text-left py-3 px-3 text-gray-400 font-normal border-r border-gray-700 bg-gray-800 min-w-40 whitespace-nowrap">Reference No.</th>
                    <th className="text-left py-3 px-3 text-gray-400 font-normal border-r border-gray-700 bg-gray-800 min-w-28 whitespace-nowrap">OR No.</th>
                    <th className="text-left py-3 px-3 text-gray-400 font-normal border-r border-gray-700 bg-gray-800 min-w-32 whitespace-nowrap">Modified By</th>
                    <th className="text-left py-3 px-3 text-gray-400 font-normal border-r border-gray-700 bg-gray-800 min-w-40 whitespace-nowrap">Modified Date</th>
                    <th className="text-left py-3 px-3 text-gray-400 font-normal border-r border-gray-700 bg-gray-800 min-w-40 whitespace-nowrap">Transaction ID</th>
                    <th className="text-left py-3 px-3 text-gray-400 font-normal border-r border-gray-700 bg-gray-800 min-w-28 whitespace-nowrap">Barangay</th>
                    <th className="text-left py-3 px-3 text-gray-400 font-normal border-r border-gray-700 bg-gray-800 min-w-28 whitespace-nowrap">City</th>
                    <th className="text-left py-3 px-3 text-gray-400 font-normal border-r border-gray-700 bg-gray-800 min-w-56 whitespace-nowrap">Related Staggered Payments</th>
                    <th className="text-left py-3 px-3 text-gray-400 font-normal border-r border-gray-700 bg-gray-800 min-w-56 whitespace-nowrap">Related Collection Requests</th>
                    <th className="text-left py-3 px-3 text-gray-400 font-normal bg-gray-800 min-w-48 whitespace-nowrap">Related DC Notices</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-800 hover:bg-gray-900">
                    <td className="py-4 px-3 border-r border-gray-800 whitespace-nowrap">
                      <span className="text-green-500 font-medium">Paid</span>
                    </td>
                    <td className="py-4 px-3 text-white border-r border-gray-800 whitespace-nowrap">8/18/2025</td>
                    <td className="py-4 px-3 text-white border-r border-gray-800 whitespace-nowrap">8/30/2025</td>
                    <td className="py-4 px-3 text-white border-r border-gray-800 whitespace-nowrap">{formatCurrency(999.00)}</td>
                    <td className="py-4 px-3 text-white border-r border-gray-800 whitespace-nowrap">{formatCurrency(999.00)}</td>
                    <td className="py-4 px-3 text-red-400 border-r border-gray-800 whitespace-nowrap">{record.accountNo}</td>
                    <td className="py-4 px-3 text-white border-r border-gray-800 whitespace-nowrap">INV-001</td>
                    <td className="py-4 px-3 text-white border-r border-gray-800 whitespace-nowrap">{record.fullName || 'Leopoldo III G De Jesus'}</td>
                    <td className="py-4 px-3 text-white border-r border-gray-800 whitespace-nowrap">{record.contactNo}</td>
                    <td className="py-4 px-3 text-white border-r border-gray-800 whitespace-nowrap">customer@email.com</td>
                    <td className="py-4 px-3 text-white border-r border-gray-800 whitespace-nowrap">0337 B San Roque St Cervo Cpd</td>
                    <td className="py-4 px-3 text-white border-r border-gray-800 whitespace-nowrap">{record.plan || 'SwitchNet - P999'}</td>
                    <td className="py-4 px-3 text-white border-r border-gray-800 whitespace-nowrap">{record.provider}</td>
                    <td className="py-4 px-3 text-white border-r border-gray-800 whitespace-nowrap">-</td>
                    <td className="py-4 px-3 text-white border-r border-gray-800 whitespace-nowrap">{formatCurrency(0.00)}</td>
                    <td className="py-4 px-3 text-white border-r border-gray-800 whitespace-nowrap">{formatCurrency(999.00)}</td>
                    <td className="py-4 px-3 text-white border-r border-gray-800 whitespace-nowrap">8/18/2025</td>
                    <td className="py-4 px-3 text-white border-r border-gray-800 whitespace-nowrap">System</td>
                    <td className="py-4 px-3 text-white border-r border-gray-800 whitespace-nowrap">Online</td>
                    <td className="py-4 px-3 text-white border-r border-gray-800 whitespace-nowrap">{record.referenceNo}</td>
                    <td className="py-4 px-3 text-white font-mono border-r border-gray-800 whitespace-nowrap">{record.referenceNo}</td>
                    <td className="py-4 px-3 text-white border-r border-gray-800 whitespace-nowrap">OR-001</td>
                    <td className="py-4 px-3 text-white border-r border-gray-800 whitespace-nowrap">Admin</td>
                    <td className="py-4 px-3 text-white border-r border-gray-800 whitespace-nowrap">8/18/2025 9:14:13 PM</td>
                    <td className="py-4 px-3 text-white font-mono border-r border-gray-800 whitespace-nowrap">{record.checkoutId}</td>
                    <td className="py-4 px-3 text-white border-r border-gray-800 whitespace-nowrap">{record.barangay || 'Bilibiran'}</td>
                    <td className="py-4 px-3 text-white border-r border-gray-800 whitespace-nowrap">{record.city || 'Binangonan'}</td>
                    <td className="py-4 px-3 text-gray-400 border-r border-gray-800 whitespace-nowrap">-</td>
                    <td className="py-4 px-3 text-gray-400 border-r border-gray-800 whitespace-nowrap">-</td>
                    <td className="py-4 px-3 text-gray-400 whitespace-nowrap">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-end mt-4 mb-6">
              <button className="text-orange-500 hover:text-orange-400 text-sm font-medium">
                Expand
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPortalDetails;
