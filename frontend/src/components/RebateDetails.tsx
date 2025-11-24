import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, ArrowRight, Maximize2, X, Info, ExternalLink, CheckCircle
} from 'lucide-react';
import LoadingModal from './LoadingModal';
import * as massRebateService from '../services/massRebateService';

interface RebateUsage {
  id: number;
  rebates_id: number;
  account_no: string;
  status: string;
  month: string;
}

interface Rebate {
  id: number;
  number_of_dates: number;
  rebate_type: string;
  selected_rebate: string;
  month: string;
  status: string;
  created_by: string;
  modified_by: string | null;
  modified_date: string;
}

interface RebateDetailsProps {
  rebate: Rebate;
  onClose: () => void;
}

const RebateDetails: React.FC<RebateDetailsProps> = ({ rebate, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [loadingPercentage, setLoadingPercentage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [rebateUsages, setRebateUsages] = useState<RebateUsage[]>([]);
  const [usagesLoading, setUsagesLoading] = useState(false);

  const canApprove = rebate.status.toLowerCase() === 'pending';

  useEffect(() => {
    fetchRebateUsages();
  }, [rebate.id]);

  const fetchRebateUsages = async () => {
    try {
      setUsagesLoading(true);
      const response = await fetch(`http://localhost:8000/api/rebates-usage?rebates_id=${rebate.id}`);
      const data = await response.json();
      
      if (data.success) {
        setRebateUsages(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch rebate usages:', err);
    } finally {
      setUsagesLoading(false);
    }
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

  const handleApproveRebate = async () => {
    if (!window.confirm('Are you sure you want to approve this rebate? This will change the status to Unused and the rebate will become available for use.')) {
      return;
    }

    try {
      setLoading(true);
      setLoadingPercentage(0);
      setError(null);
      
      setLoadingPercentage(20);
      
      const result = await massRebateService.update(rebate.id, { status: 'Unused' });
      
      setLoadingPercentage(60);
      
      if (result.success) {
        setLoadingPercentage(100);
        
        rebate.status = result.data?.status || 'Unused';
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setSuccessMessage('Rebate approved successfully. Status changed to Unused.');
        setShowSuccessModal(true);
      } else {
        setError(result.message || 'Failed to approve rebate');
      }
    } catch (err: any) {
      setError(`Failed to approve rebate: ${err.message}`);
      console.error('Approve rebate error:', err);
    } finally {
      setLoading(false);
      setLoadingPercentage(0);
    }
  };



  const getDisplayText = () => {
    return `${rebate.rebate_type.toUpperCase()} | ${rebate.selected_rebate} | ${rebate.month}`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'unused':
        return 'text-green-500';
      case 'used':
        return 'text-red-500';
      case 'pending':
        return 'text-yellow-500';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <>
      <LoadingModal 
        isOpen={loading} 
        message="Processing rebate..." 
        percentage={loadingPercentage} 
      />
      
      <div className="w-full h-full bg-gray-950 flex flex-col overflow-hidden border-l border-white border-opacity-30">
        <div className="bg-gray-800 p-3 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center min-w-0 flex-1">
            <h2 className="text-white font-medium truncate pr-4">{getDisplayText()}</h2>
            {loading && <div className="ml-3 animate-pulse text-orange-500 text-sm flex-shrink-0">Loading...</div>}
          </div>
          
          <div className="flex items-center space-x-3">
            {canApprove && (
              <button
                onClick={handleApproveRebate}
                disabled={loading}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded text-sm transition-colors"
              >
                <CheckCircle size={16} />
                <span>{loading ? 'Processing...' : 'Approve'}</span>
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
                <div className="w-40 text-gray-400 text-sm">Rebate ID</div>
                <div className="text-white flex-1">{rebate.id}</div>
              </div>
              
              <div className="flex border-b border-gray-800 py-2">
                <div className="w-40 text-gray-400 text-sm">Rebate Type</div>
                <div className="text-white flex-1 capitalize flex items-center">
                  {rebate.rebate_type}
                  <button className="ml-2 text-gray-400 hover:text-white">
                    <Info size={16} />
                  </button>
                </div>
              </div>
              
              <div className="flex border-b border-gray-800 py-2">
                <div className="w-40 text-gray-400 text-sm">Selected Rebate</div>
                <div className="text-white flex-1">{rebate.selected_rebate}</div>
              </div>
              
              <div className="flex border-b border-gray-800 py-2">
                <div className="w-40 text-gray-400 text-sm">Month</div>
                <div className="text-white flex-1">{rebate.month}</div>
              </div>
              
              <div className="flex border-b border-gray-800 py-2">
                <div className="w-40 text-gray-400 text-sm">Number of Days</div>
                <div className="text-white flex-1 font-bold text-lg">{rebate.number_of_dates}</div>
              </div>
              
              <div className="flex border-b border-gray-800 py-2">
                <div className="w-40 text-gray-400 text-sm">Status</div>
                <div className="flex-1">
                  <div className={`capitalize font-medium ${getStatusColor(rebate.status)}`}>
                    {rebate.status}
                  </div>
                </div>
              </div>
              
              <div className="flex border-b border-gray-800 py-2">
                <div className="w-40 text-gray-400 text-sm">Created By</div>
                <div className="text-white flex-1 flex items-center">
                  {rebate.created_by || '-'}
                  <button className="ml-2 text-gray-400 hover:text-white">
                    <Info size={16} />
                  </button>
                </div>
              </div>
              
              <div className="flex border-b border-gray-800 py-2">
                <div className="w-40 text-gray-400 text-sm">Approved By</div>
                <div className="text-white flex-1 flex items-center">
                  {rebate.modified_by || '-'}
                  {rebate.modified_by && (
                    <button className="ml-2 text-gray-400 hover:text-white">
                      <Info size={16} />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex border-b border-gray-800 py-2">
                <div className="w-40 text-gray-400 text-sm">Modified Date</div>
                <div className="text-white flex-1">{formatDate(rebate.modified_date)}</div>
              </div>
            </div>
          </div>
          
          <div className="mx-auto px-4 bg-gray-950 mt-4">
            <div className="border-t border-gray-800 pt-4">
              <div className="flex items-center mb-4">
                <h3 className="text-white font-medium">Affected Accounts</h3>
                <span className="ml-2 bg-gray-600 text-white text-xs px-2 py-1 rounded">
                  {rebateUsages.length}
                </span>
              </div>
              
              {usagesLoading ? (
                <div className="text-center py-8 text-gray-400">
                  <div className="animate-pulse">Loading accounts...</div>
                </div>
              ) : rebateUsages.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700 text-sm">
                    <thead className="bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Account No</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Month</th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-900 divide-y divide-gray-800">
                      {rebateUsages.map((usage) => (
                        <tr key={usage.id} className="hover:bg-gray-800">
                          <td className="px-4 py-3 whitespace-nowrap text-gray-300">{usage.account_no}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`capitalize ${getStatusColor(usage.status)}`}>
                              {usage.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-gray-300">{usage.month}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  No affected accounts found
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

export default RebateDetails;
