import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import StaggeredListDetails from '../components/StaggeredListDetails';
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

const StaggeredPayment: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStaggered, setSelectedStaggered] = useState<StaggeredInstallation | null>(null);
  const [staggeredRecords, setStaggeredRecords] = useState<StaggeredInstallation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `₱${numAmount.toFixed(2)}`;
  };

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return 'No date';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Date navigation items
  const dateItems = [
    { date: 'All', id: '' },
  ];

  // Fetch Staggered Payment data
  useEffect(() => {
    const fetchStaggeredPaymentData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('Fetching staggered installations from API...');
        const result = await staggeredInstallationService.getAll();
        
        if (result.success && result.data) {
          setStaggeredRecords(result.data);
          console.log('Staggered installations loaded:', result.data.length);
        } else {
          throw new Error(result.message || 'Failed to fetch staggered installations');
        }
      } catch (err: any) {
        console.error('Failed to fetch staggered installations:', err);
        setError(`Failed to load staggered installations: ${err.message || 'Unknown error'}`);
        setStaggeredRecords([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStaggeredPaymentData();
  }, []);

  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await staggeredInstallationService.getAll();
      
      if (result.success && result.data) {
        setStaggeredRecords(result.data);
        console.log('Staggered installations refreshed:', result.data.length);
      } else {
        throw new Error(result.message || 'Failed to refresh staggered installations');
      }
    } catch (err: any) {
      console.error('Failed to refresh staggered installations:', err);
      setError(`Failed to refresh: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRowClick = (staggered: StaggeredInstallation) => {
    console.log('Staggered clicked:', staggered);
    setSelectedStaggered(staggered);
  };

  const filteredRecords = staggeredRecords.filter(record => {
    const matchesSearch = searchQuery === '' || 
      record.account_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.staggered_install_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.billing_account?.customer?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const StatusBadge = ({ status }: { status: string }) => {
    let colorClass = '';
    
    switch (status.toLowerCase()) {
      case 'active':
        colorClass = 'text-green-500';
        break;
      case 'pending':
        colorClass = 'text-yellow-500';
        break;
      case 'completed':
        colorClass = 'text-blue-500';
        break;
      default:
        colorClass = 'text-gray-400';
    }
    
    return (
      <span className={`${colorClass} capitalize`}>
        {status}
      </span>
    );
  };

  return (
    <div className="bg-gray-950 h-full flex overflow-hidden">
      <div className="w-64 bg-gray-900 border-r border-gray-700 flex-shrink-0 flex flex-col">
        <div className="p-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-semibold text-white">Staggered Payment</h2>
            <div>
              <button 
                className="flex items-center space-x-1 bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm"
                onClick={() => alert('Add new staggered payment')}
              >
                <span className="font-bold">+</span>
                <span>Add</span>
              </button>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {dateItems.map((item, index) => (
            <button
              key={index}
              onClick={() => setSelectedDate(item.date)}
              className={`w-full flex items-center px-4 py-3 text-sm transition-colors hover:bg-gray-800 ${
                selectedDate === item.date
                  ? 'bg-orange-500 bg-opacity-20 text-orange-400'
                  : 'text-gray-300'
              }`}
            >
              <span className="text-sm font-medium flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                {item.date}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 overflow-hidden flex-1">
        <div className="flex flex-col h-full">
          <div className="bg-gray-900 p-4 border-b border-gray-700 flex-shrink-0">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center space-x-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search Staggered Payment records..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded pl-10 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white px-4 py-2 rounded text-sm transition-colors"
                >
                  {isLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-x-auto overflow-y-auto pb-4">
              {isLoading ? (
                <div className="px-4 py-12 text-center text-gray-400">
                  <div className="animate-pulse flex flex-col items-center">
                    <div className="h-4 w-1/3 bg-gray-700 rounded mb-4"></div>
                    <div className="h-4 w-1/2 bg-gray-700 rounded"></div>
                  </div>
                  <p className="mt-4">Loading Staggered Payment records...</p>
                </div>
              ) : error ? (
                <div className="px-4 py-12 text-center text-red-400">
                  <p>{error}</p>
                  <button 
                    onClick={handleRefresh}
                    className="mt-4 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded">
                    Retry
                  </button>
                </div>
              ) : filteredRecords.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-700 text-sm">
                  <thead className="bg-gray-800 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Install No.</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Account No.</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Full Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Staggered Balance</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Monthly Payment</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Months to Pay</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Staggered Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Modified By</th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-900 divide-y divide-gray-800">
                    {filteredRecords.map((record) => (
                      <tr 
                        key={record.id}
                        className={`hover:bg-gray-800 cursor-pointer ${selectedStaggered?.id === record.id ? 'bg-gray-800' : ''}`}
                        onClick={() => handleRowClick(record)}
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">{record.staggered_install_no}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-red-400 font-medium">{record.account_no}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">{record.billing_account?.customer?.full_name || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-white font-medium">{formatCurrency(record.staggered_balance)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-white font-medium">{formatCurrency(record.monthly_payment)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">
                          <span className={record.months_to_pay === 0 ? 'text-green-500 font-bold' : 'text-orange-400 font-bold'}>
                            {record.months_to_pay}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={record.status} /></td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">{formatDate(record.staggered_date)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">{record.modified_by || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <h1 className="text-orange-500 text-2xl mb-4">Staggered Payment</h1>
                  <p className="text-lg">No payment records found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedStaggered && (
        <div className="flex-1 overflow-hidden">
          <StaggeredListDetails 
            staggered={selectedStaggered}
            onClose={() => setSelectedStaggered(null)}
          />
        </div>
      )}
    </div>
  );
};

export default StaggeredPayment;
