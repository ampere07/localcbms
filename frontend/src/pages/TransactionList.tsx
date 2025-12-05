import React, { useState, useEffect, useRef } from 'react';
import { Receipt, Search, ChevronDown } from 'lucide-react';
import TransactionListDetails from '../components/TransactionListDetails';
import { transactionService } from '../services/transactionService';

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

interface LocationItem {
  id: string;
  name: string;
  count: number;
}

const TransactionList: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sidebarWidth, setSidebarWidth] = useState<number>(256);
  const [isResizingSidebar, setIsResizingSidebar] = useState<boolean>(false);
  const sidebarStartXRef = useRef<number>(0);
  const sidebarStartWidthRef = useRef<number>(0);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `₱${numAmount.toFixed(2)}`;
  };

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        console.log('Fetching transactions from API...');
        
        const result = await transactionService.getAllTransactions();
        
        if (result.success && result.data) {
          setTransactions(result.data);
          console.log('Transactions loaded:', result.data.length);
        } else {
          throw new Error(result.message || 'Failed to fetch transactions');
        }
      } catch (err: any) {
        console.error('Error fetching transactions:', err);
        setError(`Failed to load transactions: ${err.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const locationItems: LocationItem[] = [
    {
      id: 'all',
      name: 'All',
      count: transactions.length
    }
  ];

  const locationSet = new Set<string>();
  transactions.forEach(transaction => {
    const location = transaction.account?.customer?.city?.toLowerCase();
    if (location) {
      locationSet.add(location);
    }
  });
  const uniqueLocations = Array.from(locationSet);
    
  uniqueLocations.forEach(location => {
    if (location) {
      locationItems.push({
        id: location,
        name: location.charAt(0).toUpperCase() + location.slice(1),
        count: transactions.filter(t => 
          t.account?.customer?.city?.toLowerCase() === location).length
      });
    }
  });

  const filteredTransactions = transactions.filter(transaction => {
    const transactionLocation = transaction.account?.customer?.city?.toLowerCase();
    const matchesLocation = selectedLocation === 'all' || transactionLocation === selectedLocation;
    
    const matchesSearch = searchQuery === '' || 
                         transaction.account?.customer?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.account?.account_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.reference_no?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesLocation && matchesSearch;
  });

  const handleRowClick = (transaction: Transaction) => {
    console.log('Transaction clicked:', transaction);
    console.log('Customer data:', transaction.account?.customer);
    console.log('Full name:', transaction.account?.customer?.full_name);
    setSelectedTransaction(transaction);
  };

  useEffect(() => {
    if (!isResizingSidebar) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingSidebar) return;
      
      const diff = e.clientX - sidebarStartXRef.current;
      const newWidth = Math.max(200, Math.min(500, sidebarStartWidthRef.current + diff));
      
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizingSidebar(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingSidebar]);

  const handleMouseDownSidebarResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingSidebar(true);
    sidebarStartXRef.current = e.clientX;
    sidebarStartWidthRef.current = sidebarWidth;
  };

  const StatusText = ({ status }: { status: string }) => {
    let textColor = '';
    
    switch (status.toLowerCase()) {
      case 'done':
      case 'completed':
        textColor = 'text-green-500';
        break;
      case 'pending':
        textColor = 'text-yellow-500';
        break;
      case 'processing':
        textColor = 'text-blue-500';
        break;
      case 'failed':
      case 'cancelled':
        textColor = 'text-red-500';
        break;
      default:
        textColor = 'text-gray-400';
    }
    
    return (
      <span className={`${textColor} capitalize`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-950">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500 mb-3"></div>
          <p className="text-gray-300">Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-950">
        <div className="bg-gray-800 border border-gray-700 rounded-md p-6 max-w-lg">
          <h3 className="text-red-500 text-lg font-medium mb-2">Error</h3>
          <p className="text-gray-300 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-950 h-full flex overflow-hidden">
      <div className="bg-gray-900 border-r border-gray-700 flex-shrink-0 flex flex-col relative" style={{ width: `${sidebarWidth}px` }}>
        <div className="p-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-semibold text-white">Transactions</h2>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {locationItems.map((location) => (
            <button
              key={location.id}
              onClick={() => setSelectedLocation(location.id)}
              className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-gray-800 ${
                selectedLocation === location.id
                  ? 'bg-orange-500 bg-opacity-20 text-orange-400'
                  : 'text-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Receipt className="h-4 w-4 mr-2" />
                <span className="capitalize">{location.name}</span>
              </div>
              {location.count > 0 && (
                <span className={`px-2 py-1 rounded-full text-xs ${
                  selectedLocation === location.id
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}>
                  {location.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div
          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-orange-500 transition-colors z-10"
          onMouseDown={handleMouseDownSidebarResize}
        />
      </div>

      <div className={`bg-gray-900 overflow-hidden ${selectedTransaction ? 'flex-1' : 'flex-1'}`}>
        <div className="flex flex-col h-full">
          <div className="bg-gray-900 p-4 border-b border-gray-700 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded pl-10 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
              <button className="bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 flex items-center">
                <span className="mr-2">Filter</span>
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-x-auto overflow-y-auto pb-4">
              <table className="min-w-full divide-y divide-gray-700 text-sm">
                <thead className="bg-gray-800 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Date Processed</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Account No.</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Received Payment</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Payment Method</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Processed By</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Full Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">OR No.</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Reference No.</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Remarks</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Transaction Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Image</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Barangay</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Contact No</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Payment Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">City</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Plan</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Account Balance</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Created At</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Updated At</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-900 divide-y divide-gray-800">
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((transaction) => (
                      <tr 
                        key={transaction.id} 
                        className={`hover:bg-gray-800 cursor-pointer ${selectedTransaction?.id === transaction.id ? 'bg-gray-800' : ''}`}
                        onClick={() => handleRowClick(transaction)}
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">{formatDate(transaction.date_processed)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-red-400 font-medium">{transaction.account?.account_no || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-white font-medium">{formatCurrency(transaction.received_payment)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">{transaction.payment_method}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">{transaction.processed_by_user || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">{transaction.account?.customer?.full_name || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">{transaction.or_no}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">{transaction.reference_no}</td>
                        <td className="px-4 py-3 text-gray-300 max-w-xs truncate">{transaction.remarks || 'No remarks'}</td>
                        <td className="px-4 py-3 whitespace-nowrap"><StatusText status={transaction.status} /></td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">{transaction.transaction_type}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">{transaction.image_url ? 'Yes' : '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">{transaction.account?.customer?.barangay || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">{transaction.account?.customer?.contact_number_primary || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">{formatDate(transaction.payment_date)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">{transaction.account?.customer?.city || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">{transaction.account?.customer?.desired_plan || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">{formatCurrency(transaction.account?.account_balance || 0)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">{formatDate(transaction.created_at)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">{formatDate(transaction.updated_at)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={20} className="px-4 py-12 text-center text-gray-400">
                        {transactions.length > 0
                          ? 'No transactions found matching your filters'
                          : 'No transactions found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {selectedTransaction && (
        <div className="flex-shrink-0 overflow-hidden">
          <TransactionListDetails 
            transaction={selectedTransaction}
            onClose={() => setSelectedTransaction(null)}
          />
        </div>
      )}
    </div>
  );
};

export default TransactionList;
