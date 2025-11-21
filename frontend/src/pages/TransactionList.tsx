import React, { useState, useEffect } from 'react';
import { Receipt, Search, ChevronDown } from 'lucide-react';
import TransactionListDetails from '../components/TransactionListDetails';

// Interfaces for transaction data
interface Transaction {
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
}

interface LocationItem {
  id: string;
  name: string;
  count: number;
}

const TransactionList: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Format date function
  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return 'No date';
    try {
      return new Date(dateStr).toLocaleString();
    } catch (e) {
      return dateStr;
    }
  };

  // Format currency function
  const formatCurrency = (amount: number) => {
    return `₱${amount.toFixed(2)}`;
  };

  // Fetch data from API (placeholder for now)
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        console.log('Fetching transactions...');
        
        // TODO: Replace with actual API call
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Sample transaction data
        const sampleTransactions: Transaction[] = [
          {
            id: '1',
            dateProcessed: '9/18/2025 4:33:57 PM',
            accountNo: '202306310',
            receivedPayment: 999.00,
            paymentMethod: 'Gcash',
            processedBy: 'Sheena Espinoza',
            fullName: 'Jocelyn H Roncales',
            orNo: '-',
            referenceNo: '439769168',
            remarks: '',
            status: 'Done',
            transactionType: 'Recurring Fee',
            barangay: 'Darangan',
            transactionId: 'TXN001',
            contactNo: '9673080816',
            modifiedBy: 'Sheena Espinoza',
            modifiedDate: '9/18/2025 4:33:57 PM',
            provider: 'SWITCH',
            paymentDate: '9/18/2025 4:33:57 PM',
            city: 'Binangonan',
            plan: 'SwitchLite - P699',
            accountBalance: 0.00,
            relatedInvoices: '',
            created_at: '2025-09-18T20:33:57Z',
            updated_at: '2025-09-18T20:33:57Z'
          },
          {
            id: '2',
            dateProcessed: '9/18/2025 4:33:17 PM',
            accountNo: '202307326',
            receivedPayment: 999.00,
            paymentMethod: 'Gcash',
            processedBy: 'Sheena Espinoza',
            fullName: 'Remar A Colinayo',
            orNo: '-',
            referenceNo: '334905555',
            remarks: '',
            status: 'Done',
            transactionType: 'Recurring Fee',
            barangay: 'Darangan',
            transactionId: 'TXN002',
            contactNo: '9536424625',
            modifiedBy: 'Sheena Espinoza',
            modifiedDate: '9/18/2025 4:33:17 PM',
            provider: 'SWITCH',
            paymentDate: '9/18/2025 4:33:17 PM',
            city: 'Binangonan',
            plan: 'SwitchLite - P699',
            accountBalance: 0.00,
            relatedInvoices: '',
            created_at: '2025-09-18T20:33:17Z',
            updated_at: '2025-09-18T20:33:17Z'
          },
          {
            id: '3',
            dateProcessed: '9/18/2025 4:25:27 PM',
            accountNo: '202304334',
            receivedPayment: 1000.00,
            paymentMethod: 'Gcash',
            processedBy: 'Sheena Espinoza',
            fullName: 'Sharon Ivy A Lobarbio',
            orNo: '-',
            referenceNo: '436947078',
            remarks: '',
            status: 'Done',
            transactionType: 'Recurring Fee',
            barangay: 'San Roque',
            transactionId: 'TXN003',
            contactNo: '9536424625',
            modifiedBy: 'Sheena Espinoza',
            modifiedDate: '9/18/2025 4:25:27 PM',
            provider: 'SWITCH',
            paymentDate: '9/18/2025 4:25:27 PM',
            city: 'Angono',
            plan: 'SwitchConnect - P999',
            accountBalance: 0.00,
            relatedInvoices: '',
            created_at: '2025-09-18T20:25:27Z',
            updated_at: '2025-09-18T20:25:27Z'
          }
        ];
        
        setTransactions(sampleTransactions);
        console.log('Transactions data loaded successfully');
      } catch (err: any) {
        console.error('Error fetching transactions:', err);
        setError(`Failed to load transactions: ${err.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  // Generate location items with counts based on real data
  const locationItems: LocationItem[] = [
    {
      id: 'all',
      name: 'All',
      count: transactions.length
    }
  ];

  // Add unique locations from the data
  const locationSet = new Set<string>();
  transactions.forEach(transaction => {
    const location = transaction.city?.toLowerCase();
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
        count: transactions.filter(transaction => 
          transaction.city?.toLowerCase() === location).length
      });
    }
  });

  // Filter transactions based on location and search query
  const filteredTransactions = transactions.filter(transaction => {
    const transactionLocation = transaction.city?.toLowerCase();
    const matchesLocation = selectedLocation === 'all' || transactionLocation === selectedLocation;
    
    const matchesSearch = searchQuery === '' || 
                         transaction.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.accountNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.referenceNo.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesLocation && matchesSearch;
  });

  const handleRowClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
  };

  // Status text color component
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
      {/* Location Sidebar Container */}
      <div className="w-64 bg-gray-900 border-r border-gray-700 flex-shrink-0 flex flex-col">
        <div className="p-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-semibold text-white">Transactions</h2>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {locationItems.map((location) => (
            <button
              key={location.id}
              onClick={() => {
                setSelectedLocation(location.id);
              }}
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
      </div>

      {/* Transactions List - Shrinks when detail view is shown */}
      <div className={`bg-gray-900 overflow-hidden ${selectedTransaction ? 'flex-1' : 'flex-1'}`}>
        <div className="flex flex-col h-full">
          {/* Search Bar */}
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
          
          {/* Table Container */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-x-auto overflow-y-auto pb-4">
              <table className="min-w-full divide-y divide-gray-700 text-sm">
                <thead className="bg-gray-800 sticky top-0">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      Date Processed
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      Account No.
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      Received Payment
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      Payment Method
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      Processed By
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      Full Name
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      OR No.
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      Reference No.
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Remarks
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      Transaction Type
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      Image
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      Barangay
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      Transaction ID
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      Contact No
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      Modified By
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      Modified Date
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      Provider
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      Payment Date
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      City
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      Plan
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      Account Balance
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      Related Invoices
                    </th>
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
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">
                          {transaction.dateProcessed}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-red-400 font-medium">
                          {transaction.accountNo}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-white font-medium">
                          {formatCurrency(transaction.receivedPayment)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">
                          {transaction.paymentMethod}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">
                          {transaction.processedBy}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">
                          {transaction.fullName}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">
                          {transaction.orNo}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">
                          {transaction.referenceNo}
                        </td>
                        <td className="px-4 py-3 text-gray-300 max-w-xs truncate">
                          {transaction.remarks || 'No remarks'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <StatusText status={transaction.status} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">
                          {transaction.transactionType}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">
                          {transaction.image || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">
                          {transaction.barangay}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">
                          {transaction.transactionId}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">
                          {transaction.contactNo}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">
                          {transaction.modifiedBy}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">
                          {transaction.modifiedDate}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">
                          {transaction.provider}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">
                          {transaction.paymentDate}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">
                          {transaction.city}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">
                          {transaction.plan}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">
                          {formatCurrency(transaction.accountBalance)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">
                          {transaction.relatedInvoices || '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={23} className="px-4 py-12 text-center text-gray-400">
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

      {/* Transaction Detail View - Only visible when a transaction is selected */}
      {selectedTransaction && (
        <div className="flex-1 overflow-hidden">
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