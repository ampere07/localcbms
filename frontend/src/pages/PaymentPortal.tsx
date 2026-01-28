import React, { useState, useEffect } from 'react';
import { Globe, Search, ChevronDown } from 'lucide-react';
import PaymentPortalDetails from '../components/PaymentPortalDetails';
import { settingsColorPaletteService, ColorPalette } from '../services/settingsColorPaletteService';

// Interfaces for payment portal data
interface PaymentPortalRecord {
  id: string;
  reference_no: string;
  account_id: number | string;
  total_amount: number;
  date_time: string;
  checkout_id: string;
  status: string;
  transaction_status: string;
  ewallet_type?: string;
  payment_channel?: string;
  type?: string;
  payment_url?: string;
  json_payload?: string;
  callback_payload?: string;
  created_at?: string;
  updated_at?: string;
  // Additional fields from join with accounts table
  accountNo?: string;
  fullName?: string;
  contactNo?: string;
  accountBalance?: number;
  provider?: string;
  city?: string;
  barangay?: string;
  plan?: string;
  address?: string;
  [key: string]: any;
}

interface LocationItem {
  id: string;
  name: string;
  count: number;
}

const PaymentPortal: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRecord, setSelectedRecord] = useState<PaymentPortalRecord | null>(null);
  const [records, setRecords] = useState<PaymentPortalRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [colorPalette, setColorPalette] = useState<ColorPalette | null>(null);

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
    const checkDarkMode = () => {
      const theme = localStorage.getItem('theme');
      setIsDarkMode(theme === 'dark' || theme === null);
    };

    checkDarkMode();

    const observer = new MutationObserver(() => {
      checkDarkMode();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchColorPalette = async () => {
      try {
        const activePalette = await settingsColorPaletteService.getActive();
        setColorPalette(activePalette);
      } catch (err) {
        console.error('Failed to fetch color palette:', err);
      }
    };
    
    fetchColorPalette();
  }, []);

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
            date_time: '9/18/2025 4:33:57 PM',
            account_id: '202306310',
            accountNo: '202306310',
            total_amount: 999.00,
            status: 'Completed',
            reference_no: '439769168',
            contactNo: '9673080816',
            accountBalance: 0.00,
            checkout_id: 'CHK001',
            transaction_status: 'Success',
            provider: 'GCash',
            ewallet_type: 'GCash',
            payment_channel: 'E-Wallet',
            fullName: 'Jocelyn H Roncales',
            city: 'Binangonan',
            created_at: '2025-09-18T20:33:57Z',
            updated_at: '2025-09-18T20:33:57Z'
          },
          {
            id: '2',
            date_time: '9/18/2025 4:33:17 PM',
            account_id: '202307326',
            accountNo: '202307326',
            total_amount: 999.00,
            status: 'Completed',
            reference_no: '334905555',
            contactNo: '9536424625',
            accountBalance: 0.00,
            checkout_id: 'CHK002',
            transaction_status: 'Success',
            provider: 'PayMaya',
            ewallet_type: 'PayMaya',
            payment_channel: 'E-Wallet',
            fullName: 'Remar A Colinayo',
            city: 'Binangonan',
            created_at: '2025-09-18T20:33:17Z',
            updated_at: '2025-09-18T20:33:17Z'
          },
          {
            id: '3',
            date_time: '9/18/2025 4:25:27 PM',
            account_id: '202304334',
            accountNo: '202304334',
            total_amount: 1000.00,
            status: 'Pending',
            reference_no: '436947078',
            contactNo: '9536424625',
            accountBalance: 1000.00,
            checkout_id: 'CHK003',
            transaction_status: 'Processing',
            provider: 'BankTransfer',
            ewallet_type: 'Bank Transfer',
            payment_channel: 'Bank Transfer',
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
                         (record.accountNo || record.account_id?.toString()).toLowerCase().includes(searchQuery.toLowerCase()) ||
                         record.reference_no?.toLowerCase().includes(searchQuery.toLowerCase());
    
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
      <div className={`flex items-center justify-center h-full ${
        isDarkMode ? 'bg-gray-950' : 'bg-gray-50'
      }`}>
        <div className="flex flex-col items-center">
          <div 
            className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 mb-3"
            style={{ borderTopColor: colorPalette?.primary || '#ea580c', borderBottomColor: colorPalette?.primary || '#ea580c' }}
          ></div>
          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Loading payment portal records...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-full ${
        isDarkMode ? 'bg-gray-950' : 'bg-gray-50'
      }`}>
        <div className={`rounded-md p-6 max-w-lg ${
          isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        }`}>
          <h3 className="text-red-500 text-lg font-medium mb-2">Error</h3>
          <p className={`mb-4 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="text-white py-2 px-4 rounded transition-colors"
            style={{
              backgroundColor: colorPalette?.primary || '#ea580c'
            }}
            onMouseEnter={(e) => {
              if (colorPalette?.accent) {
                e.currentTarget.style.backgroundColor = colorPalette.accent;
              }
            }}
            onMouseLeave={(e) => {
              if (colorPalette?.primary) {
                e.currentTarget.style.backgroundColor = colorPalette.primary;
              }
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex overflow-hidden ${
      isDarkMode ? 'bg-gray-950' : 'bg-gray-50'
    }`}>
      {/* Location Sidebar Container */}
      <div className={`w-64 border-r flex-shrink-0 flex flex-col ${
        isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className={`p-4 border-b flex-shrink-0 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <h2 className={`text-lg font-semibold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Payment Portal</h2>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {locationItems.map((location) => (
            <button
              key={location.id}
              onClick={() => {
                setSelectedLocation(location.id);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${
                isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
              } ${
                selectedLocation === location.id
                  ? ''
                  : isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}
              style={selectedLocation === location.id ? {
                backgroundColor: colorPalette?.primary ? `${colorPalette.primary}33` : 'rgba(249, 115, 22, 0.2)',
                color: colorPalette?.primary || '#fb923c'
              } : {}}
            >
              <div className="flex items-center">
                <Globe className="h-4 w-4 mr-2" />
                <span className="capitalize">{location.name}</span>
              </div>
              {location.count > 0 && (
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    selectedLocation === location.id
                      ? 'text-white'
                      : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                  }`}
                  style={selectedLocation === location.id ? {
                    backgroundColor: colorPalette?.primary || '#ea580c'
                  } : {}}
                >
                  {location.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Payment Portal Records List - Shrinks when detail view is shown */}
      <div className={`overflow-hidden flex-1 ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="flex flex-col h-full">
          {/* Search Bar */}
          <div className={`p-4 border-b flex-shrink-0 ${
            isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center space-x-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search payment portal records..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full rounded pl-10 pr-4 py-2 focus:outline-none focus:ring-1 focus:border ${
                    isDarkMode
                      ? 'bg-gray-800 text-white border border-gray-700'
                      : 'bg-white text-gray-900 border border-gray-300'
                  }`}
                  style={{
                    '--tw-ring-color': colorPalette?.primary || '#ea580c'
                  } as React.CSSProperties}
                  onFocus={(e) => {
                    if (colorPalette?.primary) {
                      e.currentTarget.style.borderColor = colorPalette.primary;
                    }
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = isDarkMode ? '#374151' : '#d1d5db';
                  }}
                />
                <Search className={`absolute left-3 top-2.5 h-4 w-4 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
              </div>
              <button className={`px-4 py-2 rounded flex items-center ${
                isDarkMode
                  ? 'bg-gray-800 text-white border border-gray-700'
                  : 'bg-gray-200 text-gray-900 border border-gray-300'
              }`}>
                <span className="mr-2">Filter</span>
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {/* Table Container */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-x-auto overflow-y-auto pb-4">
              <table className={`min-w-full text-sm ${
                isDarkMode ? 'divide-y divide-gray-700' : 'divide-y divide-gray-200'
              }`}>
                <thead className={`sticky top-0 ${
                  isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                  <tr>
                    <th scope="col" className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Date Time
                    </th>
                    <th scope="col" className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Account No
                    </th>
                    <th scope="col" className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Received Payment
                    </th>
                    <th scope="col" className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Status
                    </th>
                    <th scope="col" className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Reference No
                    </th>
                    <th scope="col" className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Contact No
                    </th>
                    <th scope="col" className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Account Balance
                    </th>
                    <th scope="col" className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Checkout ID
                    </th>
                    <th scope="col" className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Transaction Status
                    </th>
                    <th scope="col" className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Provider
                    </th>
                  </tr>
                </thead>
                <tbody className={`${
                  isDarkMode ? 'bg-gray-900 divide-y divide-gray-800' : 'bg-white divide-y divide-gray-200'
                }`}>
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map((record) => (
                      <tr 
                        key={record.id} 
                        className={`cursor-pointer ${
                          isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                        } ${selectedRecord?.id === record.id ? (isDarkMode ? 'bg-gray-800' : 'bg-gray-100') : ''}`}
                        onClick={() => handleRowClick(record)}
                      >
                        <td className={`px-4 py-3 whitespace-nowrap ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {record.date_time || 'N/A'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-red-400 font-medium">
                          {record.accountNo || record.account_id}
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap font-medium ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {formatCurrency(record.total_amount || 0)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <StatusText status={record.status || 'N/A'} />
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {record.reference_no || 'N/A'}
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {record.contactNo || 'N/A'}
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {formatCurrency(record.accountBalance || 0)}
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {record.checkout_id || 'N/A'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <StatusText status={record.transaction_status || 'N/A'} />
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {record.provider || 'N/A'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className={`px-4 py-12 text-center ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
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
        <div className="flex-shrink-0 overflow-hidden">
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