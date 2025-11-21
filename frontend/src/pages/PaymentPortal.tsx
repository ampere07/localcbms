import React, { useState, useEffect } from 'react';
import { Globe, Search, ChevronDown } from 'lucide-react';
import PaymentPortalDetails from '../components/PaymentPortalDetails';

// Interfaces for payment portal data
interface PaymentPortalRecord {
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
  created_at: string;
  updated_at: string;
}

interface LocationItem {
  id: string;
  name: string;
  count: number;
}

const PaymentPortal: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRecord, setSelectedRecord] = useState<PaymentPortalRecord | null>(null);
  const [records, setRecords] = useState<PaymentPortalRecord[]>([]);
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
    const fetchPaymentPortalRecords = async () => {
      try {
        setLoading(true);
        console.log('Fetching payment portal records...');
        
        // TODO: Replace with actual API call
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Sample payment portal data
        const sampleRecords: PaymentPortalRecord[] = [
          {
            id: '1',
            dateTime: '9/18/2025 4:33:57 PM',
            accountNo: '202306310',
            receivedPayment: 999.00,
            status: 'Completed',
            referenceNo: '439769168',
            contactNo: '9673080816',
            accountBalance: 0.00,
            checkoutId: 'CHK001',
            transactionStatus: 'Success',
            provider: 'GCash',
            paymentMethod: 'E-Wallet',
            fullName: 'Jocelyn H Roncales',
            city: 'Binangonan',
            created_at: '2025-09-18T20:33:57Z',
            updated_at: '2025-09-18T20:33:57Z'
          },
          {
            id: '2',
            dateTime: '9/18/2025 4:33:17 PM',
            accountNo: '202307326',
            receivedPayment: 999.00,
            status: 'Completed',
            referenceNo: '334905555',
            contactNo: '9536424625',
            accountBalance: 0.00,
            checkoutId: 'CHK002',
            transactionStatus: 'Success',
            provider: 'PayMaya',
            paymentMethod: 'E-Wallet',
            fullName: 'Remar A Colinayo',
            city: 'Binangonan',
            created_at: '2025-09-18T20:33:17Z',
            updated_at: '2025-09-18T20:33:17Z'
          },
          {
            id: '3',
            dateTime: '9/18/2025 4:25:27 PM',
            accountNo: '202304334',
            receivedPayment: 1000.00,
            status: 'Pending',
            referenceNo: '436947078',
            contactNo: '9536424625',
            accountBalance: 1000.00,
            checkoutId: 'CHK003',
            transactionStatus: 'Processing',
            provider: 'BankTransfer',
            paymentMethod: 'Bank Transfer',
            fullName: 'Sharon Ivy A Lobarbio',
            city: 'Angono',
            created_at: '2025-09-18T20:25:27Z',
            updated_at: '2025-09-18T20:25:27Z'
          }
        ];
        
        setRecords(sampleRecords);
        console.log('Payment portal records loaded successfully');
      } catch (err: any) {
        console.error('Error fetching payment portal records:', err);
        setError(`Failed to load payment portal records: ${err.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentPortalRecords();
  }, []);

  // Generate location items with counts based on real data
  const locationItems: LocationItem[] = [
    {
      id: 'all',
      name: 'All',
      count: records.length
    }
  ];

  // Add unique locations from the data
  const locationSet = new Set<string>();
  records.forEach(record => {
    const location = record.city?.toLowerCase();
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
        count: records.filter(record => 
          record.city?.toLowerCase() === location).length
      });
    }
  });

  // Filter records based on location and search query
  const filteredRecords = records.filter(record => {
    const recordLocation = record.city?.toLowerCase();
    const matchesLocation = selectedLocation === 'all' || recordLocation === selectedLocation;
    
    const matchesSearch = searchQuery === '' || 
                         record.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         record.accountNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         record.referenceNo.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesLocation && matchesSearch;
  });

  const handleRowClick = (record: PaymentPortalRecord) => {
    setSelectedRecord(record);
  };

  // Status text color component
  const StatusText = ({ status }: { status: string }) => {
    let textColor = '';
    
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        textColor = 'text-green-500';
        break;
      case 'pending':
      case 'processing':
        textColor = 'text-yellow-500';
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
          <p className="text-gray-300">Loading payment portal records...</p>
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
            <h2 className="text-lg font-semibold text-white">Payment Portal</h2>
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
                <Globe className="h-4 w-4 mr-2" />
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

      {/* Payment Portal Records List - Shrinks when detail view is shown */}
      <div className={`bg-gray-900 overflow-hidden ${selectedRecord ? 'flex-1' : 'flex-1'}`}>
        <div className="flex flex-col h-full">
          {/* Search Bar */}
          <div className="bg-gray-900 p-4 border-b border-gray-700 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search payment portal records..."
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
                      Date Time
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      Account No
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      Received Payment
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      Reference No
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      Contact No
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      Account Balance
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      Checkout ID
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      Transaction Status
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      Provider
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-900 divide-y divide-gray-800">
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map((record) => (
                      <tr 
                        key={record.id} 
                        className={`hover:bg-gray-800 cursor-pointer ${selectedRecord?.id === record.id ? 'bg-gray-800' : ''}`}
                        onClick={() => handleRowClick(record)}
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">
                          {record.dateTime}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-red-400 font-medium">
                          {record.accountNo}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-white font-medium">
                          {formatCurrency(record.receivedPayment)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <StatusText status={record.status} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">
                          {record.referenceNo}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">
                          {record.contactNo}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">
                          {formatCurrency(record.accountBalance)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">
                          {record.checkoutId}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <StatusText status={record.transactionStatus} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">
                          {record.provider}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="px-4 py-12 text-center text-gray-400">
                        {records.length > 0
                          ? 'No payment portal records found matching your filters'
                          : 'No payment portal records found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Portal Detail View - Only visible when a record is selected */}
      {selectedRecord && (
        <div className="flex-1 overflow-hidden">
          <PaymentPortalDetails 
            record={selectedRecord}
            onClose={() => setSelectedRecord(null)}
          />
        </div>
      )}
    </div>
  );
};

export default PaymentPortal;