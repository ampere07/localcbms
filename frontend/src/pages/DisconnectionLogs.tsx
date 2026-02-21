import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, Search, Circle, X, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import DisconnectionLogsDetails from '../components/DisconnectionLogsDetails';
import { settingsColorPaletteService, ColorPalette } from '../services/settingsColorPaletteService';
import { useDisconnectionStore } from '../store/disconnectionStore';

interface DisconnectionLogRecord {
  id: string;
  accountNo: string;
  customerName: string;
  address: string;
  contactNumber?: string;
  emailAddress?: string;
  plan?: string;
  balance?: number;
  status?: string;
  disconnectionDate?: string;
  disconnectedBy?: string;
  reason?: string;
  remarks?: string;
  cityId?: number;
  appliedDate?: string;
  reconnectionFee?: number;
  daysDisconnected?: number;
  disconnectionCode?: string;
  username?: string;
  sessionId?: string;
  splynxId?: string;
  mikrotikId?: string;
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

const DisconnectionLogs: React.FC = () => {
  const { logRecords, isLoading, error, fetchLogRecords, refreshLogRecords } = useDisconnectionStore();
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<DisconnectionLogRecord | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [colorPalette, setColorPalette] = useState<ColorPalette | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    const checkDarkMode = () => {
      const theme = localStorage.getItem('theme');
      setIsDarkMode(theme === 'dark');
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
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

  // Essential table columns - only show the most important ones initially
  const [visibleColumns, setVisibleColumns] = useState([
    'date', 'accountNo', 'username', 'remarks', 'sessionId', 'disconnectedBy'
  ]);

  // All available columns for the table
  const allColumns = [
    { key: 'date', label: 'Date', width: 'min-w-36' },
    { key: 'accountNo', label: 'Account No.', width: 'min-w-32' },
    { key: 'username', label: 'Username', width: 'min-w-36' },
    { key: 'remarks', label: 'Remarks', width: 'min-w-40' },
    { key: 'sessionId', label: 'Session ID', width: 'min-w-32' },
    { key: 'status', label: 'Status', width: 'min-w-28' },
    { key: 'customerName', label: 'Full Name', width: 'min-w-40' },
    { key: 'address', label: 'Address', width: 'min-w-56' },
    { key: 'contactNumber', label: 'Contact Number', width: 'min-w-36' },
    { key: 'emailAddress', label: 'Email Address', width: 'min-w-48' },
    { key: 'plan', label: 'Plan', width: 'min-w-40' },
    { key: 'balance', label: 'Account Balance', width: 'min-w-32' },
    { key: 'disconnectionDate', label: 'Disconnection Date', width: 'min-w-36' },
    { key: 'disconnectedBy', label: 'Disconnected By', width: 'min-w-36' },
    { key: 'reason', label: 'Reason', width: 'min-w-40' },
    { key: 'appliedDate', label: 'Applied Date', width: 'min-w-32' },
    { key: 'reconnectionFee', label: 'Reconnection Fee', width: 'min-w-36' },
    { key: 'daysDisconnected', label: 'Days Disconnected', width: 'min-w-36' },
    { key: 'disconnectionCode', label: 'Disconnection Code', width: 'min-w-36' }
  ];

  // Fetch disconnection log data via store
  useEffect(() => {
    fetchLogRecords();
  }, [fetchLogRecords]);

  // Reset pagination when search or location changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedLocation]);

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

  // Recursive search function to enable deep searching through all record data
  const checkValue = (obj: any, query: string): boolean => {
    if (!obj || query === "") return query === "";
    if (typeof obj === "string") return obj.toLowerCase().includes(query.toLowerCase());
    if (typeof obj === "number") return obj.toString().includes(query);
    if (Array.isArray(obj)) return obj.some((item) => checkValue(item, query));
    if (typeof obj === "object") return Object.values(obj).some((value) => checkValue(value, query));
    return false;
  };

  // Memoize filtered records for performance
  const filteredLogRecords = useMemo(() => {
    return logRecords.filter(record => {
      const matchesLocation = selectedLocation === 'all' ||
        (record.cityId !== undefined && record.cityId === Number(selectedLocation));

      const matchesSearch = searchQuery === '' || checkValue(record, searchQuery);

      return matchesLocation && matchesSearch;
    });
  }, [logRecords, selectedLocation, searchQuery]);

  // Pagination logic
  const totalPages = Math.ceil(filteredLogRecords.length / itemsPerPage);
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogRecords.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogRecords, currentPage]);

  const handleRowClick = (record: DisconnectionLogRecord) => {
    setSelectedLog(record);
  };

  const handleCloseDetails = () => {
    setSelectedLog(null);
  };

  const handleRefresh = async () => {
    await refreshLogRecords();
  };

  const toggleColumn = (columnKey: string) => {
    setVisibleColumns(prev =>
      prev.includes(columnKey)
        ? prev.filter(col => col !== columnKey)
        : [...prev, columnKey]
    );
  };

  const renderCellValue = (record: DisconnectionLogRecord, columnKey: string) => {
    switch (columnKey) {
      case 'date':
        return record.date || (record.disconnectionDate ? record.disconnectionDate.split(' ')[0] : '-');
      case 'accountNo':
        return <span className="text-red-400">{record.accountNo}</span>;
      case 'username':
        return record.username || '-';
      case 'remarks':
        return record.remarks || '-';
      case 'sessionId':
        return record.sessionId || '-';
      case 'status':
        return (
          <div className="flex items-center space-x-2">
            <Circle
              className={`h-3 w-3 text-red-400 fill-red-400`}
            />
            <span className="text-xs text-red-400">
              {record.status}
            </span>
          </div>
        );
      case 'accountNo':
        return <span className="text-red-400">{record.accountNo}</span>;
      case 'customerName':
        return record.customerName;
      case 'address':
        return <span title={record.address}>{record.address}</span>;
      case 'contactNumber':
        return record.contactNumber || '-';
      case 'emailAddress':
        return record.emailAddress || '-';
      case 'plan':
        return record.plan || '-';
      case 'balance':
        return record.balance ? `₱ ${record.balance.toFixed(2)}` : '-';
      case 'disconnectionDate':
        return record.disconnectionDate || '-';
      case 'disconnectedBy':
        return record.disconnectedBy || '-';
      case 'reason':
        return record.reason || '-';
      case 'remarks':
        return record.remarks || '-';
      case 'appliedDate':
        return record.appliedDate || '-';
      case 'reconnectionFee':
        return record.reconnectionFee ? `₱ ${record.reconnectionFee.toFixed(2)}` : '-';
      case 'daysDisconnected':
        return record.daysDisconnected !== undefined ? record.daysDisconnected : '-';
      case 'disconnectionCode':
        return record.disconnectionCode || '-';
      default:
        return '-';
    }
  };

  const displayedColumns = allColumns.filter(col => visibleColumns.includes(col.key));

  return (
    <div className={`h-full flex overflow-hidden ${isDarkMode ? 'bg-gray-950' : 'bg-gray-50'
      }`}>
      <div className={`w-64 border-r flex-shrink-0 flex flex-col ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
        }`}>
        <div className={`p-4 border-b flex-shrink-0 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
          <div className="flex items-center justify-between mb-1">
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Disconnection Logs</h2>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {locationItems.map((location) => (
            <button
              key={location.id}
              onClick={() => setSelectedLocation(location.id)}
              className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${selectedLocation === location.id
                ? ''
                : isDarkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'
                }`}
              style={selectedLocation === location.id ? {
                backgroundColor: `${colorPalette?.primary || '#ea580c'}33`, // 20% opacity (approx hex suffix 33)
                color: colorPalette?.primary || '#ea580c'
              } : {}}
            >
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <span className="capitalize">{location.name}</span>
              </div>
              {location.count > 0 && (
                <span className={`px-2 py-1 rounded-full text-xs ${selectedLocation === location.id
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

      <div className={`flex-1 overflow-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-white'
        }`}>
        <div className="flex flex-col h-full">
          <div className={`p-4 border-b flex-shrink-0 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
            }`}>
            <div className="flex items-center space-x-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search disconnection logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full rounded pl-10 pr-4 py-2 focus:outline-none ${isDarkMode
                    ? 'bg-gray-800 text-white border-gray-700'
                    : 'bg-white text-gray-900 border-gray-300'
                    }`}
                  onFocus={(e) => {
                    if (colorPalette?.primary) {
                      e.currentTarget.style.borderColor = colorPalette.primary;
                      e.currentTarget.style.boxShadow = `0 0 0 1px ${colorPalette.primary}`;
                    }
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = isDarkMode ? '#374151' : '#d1d5db';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <Search className={`absolute left-3 top-2.5 h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
              </div>
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="text-white px-4 py-2 rounded text-sm transition-colors"
                style={{
                  backgroundColor: isLoading ? (isDarkMode ? '#4b5563' : '#9ca3af') : (colorPalette?.primary || '#ea580c')
                }}
                onMouseEnter={(e) => {
                  if (!isLoading && colorPalette?.accent) {
                    e.currentTarget.style.backgroundColor = colorPalette.accent;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading && colorPalette?.primary) {
                    e.currentTarget.style.backgroundColor = colorPalette.primary;
                  }
                }}
              >
                {isLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto">
              {isLoading ? (
                <div className={`px-4 py-12 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                  <div className="animate-pulse flex flex-col items-center">
                    <div className={`h-4 w-1/3 rounded mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
                      }`}></div>
                    <div className={`h-4 w-1/2 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
                      }`}></div>
                  </div>
                  <p className="mt-4">Loading disconnection logs...</p>
                </div>
              ) : error ? (
                <div className={`px-4 py-12 text-center ${isDarkMode ? 'text-red-400' : 'text-red-600'
                  }`}>
                  <p>{error}</p>
                  <button
                    onClick={handleRefresh}
                    className={`mt-4 text-white px-4 py-2 rounded ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-500 hover:bg-gray-600'
                      }`}>
                    Retry
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto overflow-y-hidden">
                  <table className="w-max min-w-full text-sm border-separate border-spacing-0">
                    <thead>
                      <tr className={`border-b sticky top-0 z-10 ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
                        }`}>
                        {displayedColumns.map((column, index) => (
                          <th
                            key={column.key}
                            className={`text-left py-3 px-3 font-normal ${column.width} whitespace-nowrap ${isDarkMode ? 'text-gray-400 bg-gray-800' : 'text-gray-600 bg-gray-50'
                              } ${index < displayedColumns.length - 1
                                ? isDarkMode ? 'border-r border-gray-700' : 'border-r border-gray-200'
                                : ''
                              }`}
                          >
                            {column.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRecords.length > 0 ? (
                        paginatedRecords.map((record) => (
                          <tr
                            key={record.id}
                            className={`border-b cursor-pointer transition-colors ${isDarkMode
                              ? 'border-gray-800 hover:bg-gray-900'
                              : 'border-gray-200 hover:bg-gray-50'
                              } ${selectedLog?.id === record.id
                                ? isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                                : ''
                              }`}
                            onClick={() => handleRowClick(record)}
                          >
                            {displayedColumns.map((column, index) => (
                              <td
                                key={column.key}
                                className={`py-4 px-3 whitespace-nowrap ${isDarkMode ? 'text-white' : 'text-gray-900'
                                  } ${index < displayedColumns.length - 1
                                    ? isDarkMode ? 'border-r border-gray-800' : 'border-r border-gray-200'
                                    : ''
                                  }`}
                              >
                                {renderCellValue(record, column.key)}
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={displayedColumns.length} className={`px-4 py-12 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                            No disconnection logs found matching your filters
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Pagination UI */}
          {!isLoading && !error && filteredLogRecords.length > 0 && (
            <div className={`p-4 border-t flex items-center justify-between ${isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-400' : 'bg-white border-gray-200 text-gray-600'
              }`}>
              <div className="text-sm">
                Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredLogRecords.length)}</span> of <span className="font-medium">{filteredLogRecords.length}</span> records
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`p-2 rounded border transition-colors ${isDarkMode
                    ? 'border-gray-700 hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-transparent'
                    : 'border-gray-300 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent'
                    }`}
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="text-sm font-medium px-2">
                  Page {currentPage} of {totalPages || 1}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`p-2 rounded border transition-colors ${isDarkMode
                    ? 'border-gray-700 hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-transparent'
                    : 'border-gray-300 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent'
                    }`}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedLog && (
        <div className={`w-full max-w-3xl border-l flex-shrink-0 relative ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
          }`}>
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={handleCloseDetails}
              className={`transition-colors rounded p-1 ${isDarkMode
                ? 'text-gray-400 hover:text-white bg-gray-800'
                : 'text-gray-600 hover:text-gray-900 bg-gray-100'
                }`}
            >
              <X size={20} />
            </button>
          </div>
          <DisconnectionLogsDetails
            disconnectionRecord={selectedLog}
          />
        </div>
      )}
    </div>
  );
};

export default DisconnectionLogs;