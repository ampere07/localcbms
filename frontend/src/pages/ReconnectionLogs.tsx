import { AlertTriangle, Search, Circle, ChevronLeft, ChevronRight, Menu, ChevronDown, RefreshCw, ChevronsLeft, ChevronsRight } from 'lucide-react';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReconnectionLogsDetails from '../components/ReconnectionLogsDetails';
import { settingsColorPaletteService, ColorPalette } from '../services/settingsColorPaletteService';
import { useReconnectionStore } from '../store/reconnectionStore';
import { userService } from '../services/userService';

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

const ReconnectionLogs: React.FC = () => {
  const { logRecords, isLoading, error, fetchLogRecords, refreshLogRecords } = useReconnectionStore();
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<ReconnectionLogRecord | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [colorPalette, setColorPalette] = useState<ColorPalette | null>(null);
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});
  const [sidebarWidth, setSidebarWidth] = useState<number>(256);
  const [isResizingSidebar, setIsResizingSidebar] = useState<boolean>(false);
  const sidebarStartXRef = useRef<number>(0);
  const sidebarStartWidthRef = useRef<number>(0);
  const [statementDateFrom, setStatementDateFrom] = useState<string>('');
  const [statementDateTo, setStatementDateTo] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('All');
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

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
    const fetchUsers = async () => {
      try {
        const response = await userService.getAllUsers();
        if (response.success && response.data) {
          const map: Record<string, string> = {};
          response.data.forEach((user: any) => {
            const firstName = (user.first_name || '').trim();
            const lastName = (user.last_name || '').trim();
            const fullName = `${firstName} ${lastName}`.trim();
            map[user.id.toString()] = fullName || user.username || user.email_address || user.email || 'Unknown User';
          });
          setUsersMap(map);
        }
      } catch (err) {
        console.error('Failed to fetch users:', err);
      }
    };
    fetchUsers();
  }, []);

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

  // Essential table columns - only show the most important ones initially
  const [visibleColumns, setVisibleColumns] = useState([
    'date', 'accountNo', 'username', 'reconnectionFee', 'plan', 'remarks', 'sessionId', 'reconnectedBy'
  ]);

  // All available columns for the table
  const allColumns = [
    { key: 'date', label: 'Date', width: 'min-w-36' },
    { key: 'accountNo', label: 'Account No.', width: 'min-w-32' },
    { key: 'username', label: 'Username', width: 'min-w-36' },
    { key: 'reconnectionFee', label: 'Reconnection Fee', width: 'min-w-40' },
    { key: 'plan', label: 'Plan', width: 'min-w-40' },
    { key: 'remarks', label: 'Remarks', width: 'min-w-40' },
    { key: 'sessionId', label: 'Session ID', width: 'min-w-32' },
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

  // Fetch reconnection log data via store
  useEffect(() => {
    fetchLogRecords();
  }, [fetchLogRecords]);

  // Reset pagination when search or location changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedLocation, statementDateFrom, statementDateTo, selectedDate]);

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

  // Memoize records filtered by global filters (search and date range) but NOT categorical filters (location/month)
  const globalFilteredRecords = useMemo(() => {
    return logRecords.filter(record => {
      const matchesSearch = searchQuery === '' || checkValue(record, searchQuery);
      
      let matchesDateRange = true;
      if (statementDateFrom || statementDateTo) {
        const dateRaw = record.date || record.reconnectionDate || '';
        const dateValue = new Date(dateRaw).getTime();
        
        if (isNaN(dateValue)) {
          matchesDateRange = false;
        } else {
          if (statementDateFrom) {
            const fromDate = new Date(statementDateFrom).setHours(0, 0, 0, 0);
            if (dateValue < fromDate) matchesDateRange = false;
          }
          if (statementDateTo) {
            const toDate = new Date(statementDateTo).setHours(23, 59, 59, 999);
            if (dateValue > toDate) matchesDateRange = false;
          }
        }
      }
      
      return matchesSearch && matchesDateRange;
    });
  }, [logRecords, searchQuery, statementDateFrom, statementDateTo]);

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const yyyy = date.getFullYear();
      return `${mm}/${dd}/${yyyy}`;
    } catch (e) {
      return dateStr;
    }
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

  // Memoize location items for performance
  const locationItems: LocationItem[] = useMemo(() => {
    // Only records matching the global filters and the selected month if not 'All'
    let filteredForLocations = globalFilteredRecords.filter(record => {
      return selectedDate === 'All' || (record.date && record.date.startsWith(selectedDate));
    });

    const items: LocationItem[] = [];

    // Create a map to count records by cityId
    const cityCountMap = new Map<number, number>();

    filteredForLocations.forEach(record => {
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
  }, [globalFilteredRecords, selectedDate]);

  const dateItems = useMemo(() => {
    // Only records matching the global filters and the selected location if not 'all'
    let filteredForMonths = globalFilteredRecords.filter(record => {
      return selectedLocation === 'all' || (record.cityId !== undefined && record.cityId === Number(selectedLocation));
    });

    const counts: Record<string, number> = {};
    const months = new Set<string>();

    filteredForMonths.forEach(record => {
      if (record.date && record.date !== '-') {
        const monthKey = record.date.substring(0, 7); // YYYY-MM
        counts[monthKey] = (counts[monthKey] || 0) + 1;
        months.add(monthKey);
      }
    });

    const sortedMonths = Array.from(months).sort().reverse().map(month => ({
      date: month,
      count: counts[month]
    }));

    return {
      all: filteredForMonths.length,
      dates: sortedMonths
    };
  }, [globalFilteredRecords, selectedLocation]);

  // Memoize filtered records for performance
  const filteredLogRecords = useMemo(() => {
    return logRecords.filter(record => {
      const matchesLocation = selectedLocation === 'all' ||
        (record.cityId !== undefined && record.cityId === Number(selectedLocation));

      const matchesSearch = searchQuery === '' || checkValue(record, searchQuery);

      let matchesDateRange = true;
      if (statementDateFrom || statementDateTo) {
        const dateRaw = record.date || record.reconnectionDate || '';
        const dateValue = new Date(dateRaw).getTime();

        if (isNaN(dateValue)) {
          matchesDateRange = false;
        } else {
          if (statementDateFrom) {
            const fromDate = new Date(statementDateFrom).setHours(0, 0, 0, 0);
            if (dateValue < fromDate) matchesDateRange = false;
          }
          if (statementDateTo) {
            const toDate = new Date(statementDateTo).setHours(23, 59, 59, 999);
            if (dateValue > toDate) matchesDateRange = false;
          }
        }
      }

      const matchesMonth = selectedDate === 'All' || (record.date && record.date.startsWith(selectedDate));

      return matchesLocation && matchesSearch && matchesDateRange && matchesMonth;
    });
  }, [logRecords, selectedLocation, searchQuery, statementDateFrom, statementDateTo, selectedDate]);

  // Pagination logic
  const totalPages = Math.ceil(filteredLogRecords.length / itemsPerPage);
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogRecords.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogRecords, currentPage]);

  const handleRowClick = (record: ReconnectionLogRecord) => {
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

  const renderCellValue = (record: ReconnectionLogRecord, columnKey: string) => {
    switch (columnKey) {
      case 'date':
        return formatDate(record.date || record.reconnectionDate);
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
        return formatDate(record.reconnectionDate);
      case 'reconnectedBy': {
        const val = record.reconnectedBy;
        if (!val) return '-';
        const strVal = String(val);
        if (/^\d+$/.test(strVal)) {
          return usersMap[strVal] || strVal;
        }
        return strVal;
      }
      case 'reason':
        return record.reason || '-';
      case 'appliedDate':
        return formatDate(record.appliedDate);
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
    <div className={`h-full flex overflow-hidden ${isDarkMode ? 'bg-gray-950' : 'bg-gray-50'
      }`}>
      {/* Sidebar */}
      <div 
        className={`border-r flex-shrink-0 flex flex-col relative transition-all duration-300 ease-in-out ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}
        style={{ width: `${sidebarWidth}px` }}
      >
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between shadow-sm ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50/50 border-gray-100'}`}>
          <h2 className={`text-lg font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Reconnection Logs
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* Date Range Filter Section */}
          <div className={`px-4 py-3 border-b space-y-3 ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Date Range
              </span>
              {(statementDateFrom || statementDateTo) && (
                <button
                  onClick={() => {
                    setStatementDateFrom('');
                    setStatementDateTo('');
                  }}
                  className="text-[10px] font-bold uppercase tracking-wider hover:underline"
                  style={{ color: colorPalette?.primary || '#7c3aed' }}
                >
                  Clear
                </button>
              )}
            </div>
            <div className="space-y-2">
              <div className="relative">
                <label className={`text-[10px] mb-1 block ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>From</label>
                <input
                  type="date"
                  value={statementDateFrom}
                  onChange={(e) => setStatementDateFrom(e.target.value)}
                  className={`w-full px-2 py-1.5 rounded text-xs focus:outline-none border ${isDarkMode
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  style={statementDateFrom ? { borderColor: colorPalette?.primary || '#7c3aed' } : {}}
                />
              </div>
              <div className="relative">
                <label className={`text-[10px] mb-1 block ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>To</label>
                <input
                  type="date"
                  value={statementDateTo}
                  onChange={(e) => setStatementDateTo(e.target.value)}
                  className={`w-full px-2 py-1.5 rounded text-xs focus:outline-none border ${isDarkMode
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  style={statementDateTo ? { borderColor: colorPalette?.primary || '#7c3aed' } : {}}
                />
              </div>
            </div>
          </div>

          {/* All Level */}
          <button
            onClick={() => {
              setSelectedLocation('all');
              setSelectedDate('All');
            }}
            className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
              } ${selectedLocation === 'all' && selectedDate === 'All'
                ? ''
                : isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}
            style={selectedLocation === 'all' && selectedDate === 'All' ? {
              backgroundColor: colorPalette?.primary ? `${colorPalette.primary}33` : 'rgba(249, 115, 22, 0.2)',
              color: colorPalette?.primary || '#7c3aed'
            } : {}}
          >
            <div className="flex items-center">
              <span>All Records</span>
            </div>
            <span
              className={`px-2 py-1 rounded text-xs transition-colors ${selectedLocation === 'all' && selectedDate === 'All'
                ? 'text-white'
                : isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-400'
                }`}
              style={selectedLocation === 'all' && selectedDate === 'All' ? {
                backgroundColor: colorPalette?.primary || '#7c3aed'
              } : {}}
            >
              {globalFilteredRecords.length}
            </span>
          </button>

          {/* Month Dropdown */}
          <div className={`p-0 ${isDarkMode ? 'border-b border-gray-800' : 'border-b border-gray-100'}`}>
            <button
              onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                } ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              <div className="flex items-center">
                <span className="font-medium">Reconnection Month</span>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${isDarkMode ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400'
                    }`}
                >
                  {dateItems.dates.length}
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${isDateDropdownOpen ? 'rotate-180' : ''}`}
                />
              </div>
            </button>

            {isDateDropdownOpen && (
              <div className={`${isDarkMode ? 'bg-gray-900/50' : 'bg-gray-50/50 shadow-inner'}`}>
                {dateItems.dates.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(item.date)}
                    className={`w-full flex items-center justify-between px-6 py-2.5 text-sm transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                      } ${selectedDate === item.date
                        ? ''
                        : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    style={selectedDate === item.date ? {
                      backgroundColor: colorPalette?.primary ? `${colorPalette.primary}33` : 'rgba(249, 115, 22, 0.2)',
                      color: colorPalette?.primary || '#7c3aed',
                      fontWeight: 500
                    } : {}}
                  >
                    <div className="flex items-center">
                      <span className="truncate">{item.date}</span>
                    </div>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${selectedDate === item.date
                        ? 'text-white'
                        : isDarkMode ? 'bg-gray-800 text-gray-500' : 'bg-gray-200 text-gray-500'
                        }`}
                      style={selectedDate === item.date ? {
                        backgroundColor: colorPalette?.primary || '#7c3aed'
                      } : {}}
                    >
                      {item.count}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="py-2">
            {locationItems.map((location) => (
              <button
                key={location.id}
                onClick={() => setSelectedLocation(location.id)}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${selectedLocation === location.id
                  ? ''
                  : isDarkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                style={selectedLocation === location.id ? {
                  backgroundColor: `${colorPalette?.primary || '#7c3aed'}33`,
                  color: colorPalette?.primary || '#7c3aed'
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
                      backgroundColor: colorPalette?.primary || '#7c3aed'
                    } : {}}
                  >
                    {location.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Sidebar Resize Handle */}
        <div
          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize transition-colors z-10"
          style={{
            backgroundColor: isResizingSidebar ? (colorPalette?.primary || '#7c3aed') : 'transparent'
          }}
          onMouseEnter={(e) => {
            if (!isResizingSidebar && colorPalette?.primary) {
              e.currentTarget.style.backgroundColor = colorPalette.primary;
            }
          }}
          onMouseLeave={(e) => {
            if (!isResizingSidebar) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
          onMouseDown={handleMouseDownSidebarResize}
        />
      </div>

      <div className={`flex-1 overflow-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-white'
        }`}>
        <div className="flex flex-col h-full">
          <div className={`p-4 border-b flex-shrink-0 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
            }`}>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className={`md:hidden p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                  }`}
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search reconnection logs..."
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
                title="Refresh Records"
                className="p-2 rounded-lg transition-all duration-200 flex items-center justify-center shadow-sm disabled:opacity-50"
                style={{ 
                  backgroundColor: colorPalette?.primary || '#7c3aed',
                  color: isDarkMode ? '#111827' : '#ffffff'
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
                <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
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
                  <p className="mt-4">Loading reconnection logs...</p>
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
                        paginatedRecords.map((record: ReconnectionLogRecord) => (
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

          {/* Pagination UI */}
          {!isLoading && !error && filteredLogRecords.length > 0 && (
            <div className={`p-4 border-t flex items-center justify-between ${isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-400' : 'bg-white border-gray-200 text-gray-600'
              }`}>
              <div className="text-sm">
                Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredLogRecords.length)}</span> of <span className="font-medium">{filteredLogRecords.length}</span> records
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded border transition-colors ${isDarkMode
                    ? 'border-gray-700 hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-transparent'
                    : 'border-gray-300 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent'
                    }`}
                  title="First Page"
                >
                  <ChevronsLeft size={16} />
                </button>
                <button
                  onClick={() => setCurrentPage((prev: number) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`p-2 rounded border transition-colors ${isDarkMode
                    ? 'border-gray-700 hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-transparent'
                    : 'border-gray-300 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent'
                    }`}
                  title="Previous Page"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="text-sm font-medium px-2">
                  Page {currentPage} of {totalPages || 1}
                </div>
                <button
                  onClick={() => setCurrentPage((prev: number) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`p-2 rounded border transition-colors ${isDarkMode
                    ? 'border-gray-700 hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-transparent'
                    : 'border-gray-300 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent'
                    }`}
                  title="Next Page"
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`p-2 rounded border transition-colors ${isDarkMode
                    ? 'border-gray-700 hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-transparent'
                    : 'border-gray-300 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent'
                    }`}
                  title="Last Page"
                >
                  <ChevronsRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedLog && (
        <ReconnectionLogsDetails
          reconnectionRecord={selectedLog}
          onClose={handleCloseDetails}
        />
      )}

      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        isDarkMode={isDarkMode}
        colorPalette={colorPalette}
        selectedLocation={selectedLocation}
        setSelectedLocation={setSelectedLocation}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        dateItems={dateItems}
        locationItems={locationItems}
        statementDateFrom={statementDateFrom}
        setStatementDateFrom={setStatementDateFrom}
        statementDateTo={statementDateTo}
        setStatementDateTo={setStatementDateTo}
        isDateDropdownOpen={isDateDropdownOpen}
        setIsDateDropdownOpen={setIsDateDropdownOpen}
        logRecordsCount={globalFilteredRecords.length}
      />
    </div>
  );
};

const MobileMenu: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  colorPalette: ColorPalette | null;
  selectedLocation: string;
  setSelectedLocation: (id: string) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  dateItems: { all: number, dates: { date: string, count: number }[] };
  locationItems: LocationItem[];
  statementDateFrom: string;
  setStatementDateFrom: (val: string) => void;
  statementDateTo: string;
  setStatementDateTo: (val: string) => void;
  isDateDropdownOpen: boolean;
  setIsDateDropdownOpen: (val: boolean) => void;
  logRecordsCount: number;
}> = ({
  isOpen, onClose, isDarkMode, colorPalette,
  selectedLocation, setSelectedLocation,
  selectedDate, setSelectedDate,
  dateItems, locationItems,
  statementDateFrom, setStatementDateFrom,
  statementDateTo, setStatementDateTo,
  isDateDropdownOpen, setIsDateDropdownOpen,
  logRecordsCount
}) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 md:hidden">
        <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
        <div className={`absolute inset-y-0 left-0 w-64 shadow-xl flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
          <div className={`p-4 border-b flex items-center justify-between ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Reconnection Logs</h2>
            <button onClick={onClose} className={isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}>
              <Circle className="h-6 w-6" /> {/* Using Circle as a placeholder or close icon if X not available, but X is available in lucide */}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {/* Date Range */}
            <div className={`px-4 py-3 border-b space-y-3 ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Date Range</span>
              <div className="grid grid-cols-1 gap-2">
                <input
                  type="date"
                  value={statementDateFrom}
                  onChange={(e) => setStatementDateFrom(e.target.value)}
                  className={`w-full px-2 py-1.5 rounded text-xs border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'}`}
                />
                <input
                  type="date"
                  value={statementDateTo}
                  onChange={(e) => setStatementDateTo(e.target.value)}
                  className={`w-full px-2 py-1.5 rounded text-xs border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>
            </div>

            {/* All Records */}
            <button
              onClick={() => { setSelectedLocation('all'); setSelectedDate('All'); onClose(); }}
              className={`w-full flex items-center justify-between px-4 py-3 text-sm border-b ${isDarkMode ? 'hover:bg-gray-800 border-gray-800' : 'hover:bg-gray-100 border-gray-200'}`}
              style={selectedLocation === 'all' && selectedDate === 'All' ? { backgroundColor: colorPalette?.primary ? `${colorPalette.primary}33` : 'rgba(249, 115, 22, 0.2)', color: colorPalette?.primary || '#7c3aed' } : {}}
            >
              <div className="flex items-center"><span>All Records</span></div>
              <span className="px-2 py-1 rounded-full text-xs bg-gray-700 text-gray-300">{logRecordsCount}</span>
            </button>

            {/* Months */}
            <div className={`border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
              <button onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)} className="w-full flex items-center justify-between px-4 py-3 text-sm">
                <div className="flex items-center"><span>Months</span></div>
                <ChevronDown className={`h-4 w-4 transition-transform ${isDateDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isDateDropdownOpen && (
                <div className={isDarkMode ? 'bg-gray-900/50' : 'bg-gray-50/50'}>
                  {dateItems.dates.map((item, idx) => (
                    <button key={idx} onClick={() => { setSelectedDate(item.date); onClose(); }} className="w-full flex items-center justify-between px-6 py-2 text-sm">
                      <span>{item.date}</span>
                      <span className="text-[10px] opacity-60">{item.count}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Locations */}
            <div className="py-2">
              {locationItems.map(loc => (
                <button key={loc.id} onClick={() => { setSelectedLocation(loc.id); onClose(); }} className="w-full flex items-center justify-between px-4 py-2 text-sm">
                  <span>{loc.name}</span>
                  <span className="text-[10px] opacity-60">{loc.count}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
};

export default ReconnectionLogs;