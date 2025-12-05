import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, Search, Circle, X } from 'lucide-react';
import ReconnectionLogsDetails from '../components/ReconnectionLogsDetails';

interface ReconnectionLogRecord {
  id: string;
  accountNo: string;
  customerName: string;
  address: string;
  contactNumber?: string;
  emailAddress?: string;
  plan?: string;
  balance?: number;
  status?: string;
  reconnectionDate?: string;
  reconnectedBy?: string;
  reason?: string;
  remarks?: string;
  cityId?: number;
  appliedDate?: string;
  reconnectionFee?: number;
  daysDisconnected?: number;
  reconnectionCode?: string;
  onlineStatus?: string;
  username?: string;
  splynxId?: string;
  mikrotikId?: string;
  provider?: string;
  date?: string;
  barangay?: string;
  city?: string;
  dateFormat?: string;
}

interface LocationItem {
  id: string;
  name: string;
  count: number;
}

const ReconnectionLogs: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<ReconnectionLogRecord | null>(null);
  const [logRecords, setLogRecords] = useState<ReconnectionLogRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Essential table columns - only show the most important ones initially
  const [visibleColumns, setVisibleColumns] = useState([
    'date', 'accountNo', 'username', 'reconnectionFee', 'plan', 'remarks', 'splynxId', 'mikrotikId', 'provider'
  ]);

  // All available columns for the table
  const allColumns = [
    { key: 'date', label: 'Date', width: 'min-w-36' },
    { key: 'accountNo', label: 'Account No.', width: 'min-w-32' },
    { key: 'username', label: 'Username', width: 'min-w-36' },
    { key: 'reconnectionFee', label: 'Reconnection Fee', width: 'min-w-40' },
    { key: 'plan', label: 'Plan', width: 'min-w-40' },
    { key: 'remarks', label: 'Remarks', width: 'min-w-40' },
    { key: 'splynxId', label: 'Splynx ID', width: 'min-w-32' },
    { key: 'mikrotikId', label: 'Mikrotik ID', width: 'min-w-32' },
    { key: 'provider', label: 'Provider', width: 'min-w-28' },
    { key: 'status', label: 'Status', width: 'min-w-28' },
    { key: 'customerName', label: 'Full Name', width: 'min-w-40' },
    { key: 'address', label: 'Address', width: 'min-w-56' },
    { key: 'contactNumber', label: 'Contact Number', width: 'min-w-36' },
    { key: 'emailAddress', label: 'Email Address', width: 'min-w-48' },
    { key: 'balance', label: 'Account Balance', width: 'min-w-32' },
    { key: 'reconnectionDate', label: 'Reconnection Date', width: 'min-w-36' },
    { key: 'reconnectedBy', label: 'Reconnected By', width: 'min-w-36' },
    { key: 'reason', label: 'Reason', width: 'min-w-40' },
    { key: 'appliedDate', label: 'Applied Date', width: 'min-w-32' },
    { key: 'daysDisconnected', label: 'Days Disconnected', width: 'min-w-36' },
    { key: 'reconnectionCode', label: 'Reconnection Code', width: 'min-w-36' }
  ];

  // Fetch reconnection log data
  useEffect(() => {
    const fetchReconnectionData = async () => {
      try {
        setIsLoading(true);
        
        // This would be an API call in a real implementation
        // For now, we'll use mock data
        setTimeout(() => {
          const mockData: ReconnectionLogRecord[] = [
            {
              id: '1',
              accountNo: '202305171',
              customerName: 'Emelyn G Manucay',
              address: '0033 Sitio Kay Habagat St, Tatala, Binangonan, Rizal',
              remarks: 'Service restored',
              splynxId: '202509181547536099',
              mikrotikId: '*1528',
              provider: 'SWITCH',
              username: 'manucaye0220251214',
              date: '9/20/2025 3:47:54 PM',
              barangay: 'Tatala',
              city: 'Binangonan',
              dateFormat: '9/20/2025',
              cityId: 1,
              reconnectionFee: 500.00,
              plan: 'SwitchLite - P699'
            },
            {
              id: '2',
              accountNo: '202402023',
              customerName: 'Maria Santos',
              address: '456 Oak St, Lunsad, Binangonan, Rizal',
              remarks: 'Payment received',
              splynxId: 'SPL67890',
              mikrotikId: 'MK54321',
              provider: 'SWITCH',
              username: 'maria.santos456',
              date: '9/21/2025 10:15:43 AM',
              barangay: 'Lunsad',
              city: 'Binangonan',
              dateFormat: '9/21/2025',
              cityId: 1,
              reconnectionFee: 750.00,
              plan: 'SwitchPro - P1299'
            },
            {
              id: '3',
              accountNo: '202403045',
              customerName: 'Robert Reyes',
              address: '789 Pine St, Libid, Binangonan, Rizal',
              remarks: 'Issue resolved',
              splynxId: 'SPL24680',
              mikrotikId: 'MK13579',
              provider: 'SWITCH',
              username: 'robert.reyes789',
              date: '9/22/2025 09:05:11 AM',
              barangay: 'Libid',
              city: 'Binangonan',
              dateFormat: '9/22/2025',
              cityId: 1,
              reconnectionFee: 1000.00,
              plan: 'SwitchMax - P1599'
            }
          ];
          
          setLogRecords(mockData);
          setError(null);
          setIsLoading(false);
        }, 1000);
      } catch (err) {
        console.error('Failed to fetch reconnection logs:', err);
        setError('Failed to load reconnection logs. Please try again.');
        setLogRecords([]);
        setIsLoading(false);
      }
    };
    
    fetchReconnectionData();
  }, []);

  // Memoize location items for performance
  const locationItems: LocationItem[] = useMemo(() => {
    const items: LocationItem[] = [
      {
        id: 'all',
        name: 'All',
        count: logRecords.length
      }
    ];
    
    // Create a map to count records by cityId
    const cityCountMap = new Map<number, number>();
    
    logRecords.forEach(record => {
      if (record.cityId !== undefined) {
        const currentCount = cityCountMap.get(record.cityId) || 0;
        cityCountMap.set(record.cityId, currentCount + 1);
      }
    });
    
    // Add city items
    cityCountMap.forEach((count, cityId) => {
      items.push({
        id: String(cityId),
        name: getCityName(cityId),
        count
      });
    });

    return items;
  }, [logRecords]);

  // Mock function to get city name by ID (would be replaced with actual data)
  function getCityName(cityId: number): string {
    const cityMap: Record<number, string> = {
      1: 'Binangonan',
      2: 'Cardona'
    };
    
    return cityMap[cityId] || `City ${cityId}`;
  }

  // Memoize filtered records for performance
  const filteredLogRecords = useMemo(() => {
    return logRecords.filter(record => {
      const matchesLocation = selectedLocation === 'all' || 
                             (record.cityId !== undefined && record.cityId === Number(selectedLocation));
      
      const matchesSearch = searchQuery === '' || 
                           record.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           record.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           record.accountNo.includes(searchQuery);
      
      return matchesLocation && matchesSearch;
    });
  }, [logRecords, selectedLocation, searchQuery]);

  const handleRowClick = (record: ReconnectionLogRecord) => {
    setSelectedLog(record);
  };

  const handleCloseDetails = () => {
    setSelectedLog(null);
  };

  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      // In a real implementation, this would make an API call
      // For now, we'll reuse the mock data loading logic
      setTimeout(() => {
        const mockData: ReconnectionLogRecord[] = [
          // Same mock data as above
          {
            id: '1',
            accountNo: '202305171',
            customerName: 'Emelyn G Manucay',
            address: '0033 Sitio Kay Habagat St, Tatala, Binangonan, Rizal',
            remarks: 'Service restored',
            splynxId: '202509181547536099',
            mikrotikId: '*1528',
            provider: 'SWITCH',
            username: 'manucaye0220251214',
            date: '9/20/2025 3:47:54 PM',
            barangay: 'Tatala',
            city: 'Binangonan',
            dateFormat: '9/20/2025',
            cityId: 1,
            reconnectionFee: 500.00,
            plan: 'SwitchLite - P699'
          },
          {
            id: '2',
            accountNo: '202402023',
            customerName: 'Maria Santos',
            address: '456 Oak St, Lunsad, Binangonan, Rizal',
            remarks: 'Payment received',
            splynxId: 'SPL67890',
            mikrotikId: 'MK54321',
            provider: 'SWITCH',
            username: 'maria.santos456',
            date: '9/21/2025 10:15:43 AM',
            barangay: 'Lunsad',
            city: 'Binangonan',
            dateFormat: '9/21/2025',
            cityId: 1,
            reconnectionFee: 750.00,
            plan: 'SwitchPro - P1299'
          },
          {
            id: '3',
            accountNo: '202403045',
            customerName: 'Robert Reyes',
            address: '789 Pine St, Libid, Binangonan, Rizal',
            remarks: 'Issue resolved',
            splynxId: 'SPL24680',
            mikrotikId: 'MK13579',
            provider: 'SWITCH',
            username: 'robert.reyes789',
            date: '9/22/2025 09:05:11 AM',
            barangay: 'Libid',
            city: 'Binangonan',
            dateFormat: '9/22/2025',
            cityId: 1,
            reconnectionFee: 1000.00,
            plan: 'SwitchMax - P1599'
          }
        ];
        
        setLogRecords(mockData);
        setError(null);
        setIsLoading(false);
      }, 1000);
    } catch (err) {
      console.error('Failed to refresh reconnection logs:', err);
      setError('Failed to refresh reconnection logs. Please try again.');
      setIsLoading(false);
    }
  };

  const toggleColumn = (columnKey: string) => {
    setVisibleColumns(prev => 
      prev.includes(columnKey)
        ? prev.filter(col => col !== columnKey)
        : [...prev, columnKey]
    );
  };

  const renderCellValue = (record: ReconnectionLogRecord, columnKey: string) => {
    switch (columnKey) {
      case 'date':
        return record.date || (record.reconnectionDate ? record.reconnectionDate.split(' ')[0] : '-');
      case 'accountNo':
        return <span className="text-red-400">{record.accountNo}</span>;
      case 'username':
        return record.username || '-';
      case 'reconnectionFee':
        return record.reconnectionFee ? `₱ ${record.reconnectionFee.toFixed(2)}` : '-';
      case 'plan':
        return record.plan || '-';
      case 'remarks':
        return record.remarks || '-';
      case 'splynxId':
        return record.splynxId || '-';
      case 'mikrotikId':
        return record.mikrotikId || '-';
      case 'provider':
        return record.provider || '-';
      case 'status':
        return (
          <div className="flex items-center space-x-2">
            <Circle 
              className={`h-3 w-3 text-green-400 fill-green-400`} 
            />
            <span className="text-xs text-green-400">
              Reconnected
            </span>
          </div>
        );
      case 'customerName':
        return record.customerName;
      case 'address':
        return <span title={record.address}>{record.address}</span>;
      case 'contactNumber':
        return record.contactNumber || '-';
      case 'emailAddress':
        return record.emailAddress || '-';
      case 'balance':
        return record.balance ? `₱ ${record.balance.toFixed(2)}` : '-';
      case 'reconnectionDate':
        return record.reconnectionDate || '-';
      case 'reconnectedBy':
        return record.reconnectedBy || '-';
      case 'reason':
        return record.reason || '-';
      case 'appliedDate':
        return record.appliedDate || '-';
      case 'daysDisconnected':
        return record.daysDisconnected !== undefined ? record.daysDisconnected : '-';
      case 'reconnectionCode':
        return record.reconnectionCode || '-';
      default:
        return '-';
    }
  };

  const displayedColumns = allColumns.filter(col => visibleColumns.includes(col.key));

  return (
    <div className="bg-gray-950 h-full flex overflow-hidden">
      <div className="w-64 bg-gray-900 border-r border-gray-700 flex-shrink-0 flex flex-col">
        <div className="p-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-semibold text-white">Reconnection Logs</h2>
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
                <AlertTriangle className="h-4 w-4 mr-2" />
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

      <div className="flex-1 bg-gray-900 overflow-hidden">
        <div className="flex flex-col h-full">
          <div className="bg-gray-900 p-4 border-b border-gray-700 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search reconnection logs..."
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
          
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto">
              {isLoading ? (
                <div className="px-4 py-12 text-center text-gray-400">
                  <div className="animate-pulse flex flex-col items-center">
                    <div className="h-4 w-1/3 bg-gray-700 rounded mb-4"></div>
                    <div className="h-4 w-1/2 bg-gray-700 rounded"></div>
                  </div>
                  <p className="mt-4">Loading reconnection logs...</p>
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
              ) : (
                <div className="overflow-x-auto overflow-y-hidden">
                  <table className="w-max min-w-full text-sm border-separate border-spacing-0">
                    <thead>
                      <tr className="border-b border-gray-700 bg-gray-800 sticky top-0 z-10">
                        {displayedColumns.map((column, index) => (
                          <th
                            key={column.key}
                            className={`text-left py-3 px-3 text-gray-400 font-normal bg-gray-800 ${column.width} whitespace-nowrap ${
                              index < displayedColumns.length - 1 ? 'border-r border-gray-700' : ''
                            }`}
                          >
                            {column.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogRecords.length > 0 ? (
                        filteredLogRecords.map((record) => (
                          <tr 
                            key={record.id} 
                            className={`border-b border-gray-800 hover:bg-gray-900 cursor-pointer transition-colors ${
                              selectedLog?.id === record.id ? 'bg-gray-800' : ''
                            }`}
                            onClick={() => handleRowClick(record)}
                          >
                            {displayedColumns.map((column, index) => (
                              <td
                                key={column.key}
                                className={`py-4 px-3 text-white whitespace-nowrap ${
                                  index < displayedColumns.length - 1 ? 'border-r border-gray-800' : ''
                                }`}
                              >
                                {renderCellValue(record, column.key)}
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={displayedColumns.length} className="px-4 py-12 text-center text-gray-400">
                            No reconnection logs found matching your filters
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedLog && (
        <div className="w-full max-w-3xl bg-gray-900 border-l border-gray-700 flex-shrink-0 relative">
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={handleCloseDetails}
              className="text-gray-400 hover:text-white transition-colors bg-gray-800 rounded p-1"
            >
              <X size={20} />
            </button>
          </div>
          <ReconnectionLogsDetails
            reconnectionRecord={selectedLog}
          />
        </div>
      )}
    </div>
  );
};

export default ReconnectionLogs;