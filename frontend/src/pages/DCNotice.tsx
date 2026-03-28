import React, { useState, useEffect } from 'react';
import { Search, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight ,X, Menu, Globe, Calendar, ChevronDown, RefreshCw } from 'lucide-react';
import { settingsColorPaletteService, ColorPalette } from '../services/settingsColorPaletteService';
import { useDCNoticeContext } from '../contexts/DCNoticeContext';
import pusher from '../services/pusherService';
import { DCNotice } from '../services/dcNoticeService';

const DCNoticePage: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { dcNoticeRecords, isLoading, error, refreshDCNoticeRecords, silentRefresh } = useDCNoticeContext();
  const [colorPalette, setColorPalette] = useState<ColorPalette | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [dcNoticeDateFrom, setDcNoticeDateFrom] = useState<string>('');
  const [dcNoticeDateTo, setDcNoticeDateTo] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState<boolean>(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Reset page when search or date filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDate, itemsPerPage, dcNoticeDateFrom, dcNoticeDateTo]);

  // Scroll to top on page change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage]);

  // 1. Initial search filtering (Global filtered set for sidebar counts)
  const globalFilteredRecords = React.useMemo(() => {
    let filtered = dcNoticeRecords;

    if (searchQuery) {
      const normalizedQuery = searchQuery.toLowerCase().replace(/\s+/g, '');
      const checkValue = (val: any): boolean => {
        if (val === null || val === undefined) return false;
        if (typeof val === 'object') {
          return Object.values(val).some(v => checkValue(v));
        }
        return String(val).toLowerCase().replace(/\s+/g, '').includes(normalizedQuery);
      };

      filtered = filtered.filter(record => checkValue(record));
    }

    // Apply sidebar date range filters for DC notice date
    if (dcNoticeDateFrom || dcNoticeDateTo) {
      filtered = filtered.filter(record => {
        if (!record.dc_notice_date) return false;

        const dateValue = new Date(record.dc_notice_date).getTime();
        if (isNaN(dateValue)) return false;

        if (dcNoticeDateFrom) {
          const fromDate = new Date(dcNoticeDateFrom);
          fromDate.setHours(0, 0, 0, 0);
          if (dateValue < fromDate.getTime()) return false;
        }

        if (dcNoticeDateTo) {
          const toDate = new Date(dcNoticeDateTo);
          toDate.setHours(23, 59, 59, 999);
          if (dateValue > toDate.getTime()) return false;
        }

        return true;
      });
    }

    return filtered;
  }, [dcNoticeRecords, searchQuery, dcNoticeDateFrom, dcNoticeDateTo]);

  // Derive date items from context data instead of fetching separately or static
  const dateItems = React.useMemo(() => {
    const dateCounts: Record<string, number> = {};
    const dates = new Map<string, string>(); // Formatted -> Raw

    globalFilteredRecords.forEach(record => {
      if (record.dc_notice_date) {
        const date = new Date(record.dc_notice_date);
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const yyyy = date.getFullYear();
        const formatted = `${mm}/${dd}/${yyyy}`;
        dateCounts[formatted] = (dateCounts[formatted] || 0) + 1;
        dates.set(formatted, record.dc_notice_date);
      }
    });

    const sortedDates = Array.from(dates.entries())
      .sort((a, b) => {
        const timeA = new Date(a[1]).getTime();
        const timeB = new Date(b[1]).getTime();
        return timeB - timeA; // Descending
      })
      .map(([formatted]) => ({
        date: formatted,
        count: dateCounts[formatted]
      }));

    return {
      all: globalFilteredRecords.length,
      dates: sortedDates
    };
  }, [globalFilteredRecords]);

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

  // Trigger silent refresh on mount to ensure data is fresh but no spinner if cached
  useEffect(() => {
    silentRefresh();
  }, [silentRefresh]);

  // Pusher/Soketi connection for real-time DC notice updates
  useEffect(() => {
    const handleUpdate = async (data: any) => {
      console.log('[DCNotice Soketi] Update received, refreshing:', data);
      try {
        await silentRefresh();
        console.log('[DCNotice Soketi] Data refreshed successfully');
      } catch (err) {
        console.error('[DCNotice Soketi] Failed to refresh data:', err);
      }
    };

    const dcNoticeChannel = pusher.subscribe('dc-notices');

    dcNoticeChannel.bind('dc-notice-updated', handleUpdate);

    return () => {
      dcNoticeChannel.unbind('dc-notice-updated', handleUpdate);
      pusher.unsubscribe('dc-notices');
    };
  }, [silentRefresh]);

  // Polling for updates every 3 seconds
  useEffect(() => {
    const POLLING_INTERVAL = 3000; // 3 seconds
    const intervalId = setInterval(async () => {
      console.log('[DCNotice Page] Polling for updates...');
      try {
        await silentRefresh();
      } catch (err) {
        console.error('[DCNotice Page] Polling failed:', err);
      }
    }, POLLING_INTERVAL);

    return () => clearInterval(intervalId);
  }, [silentRefresh]);

  // Idle detection and auto-refresh logic
  useEffect(() => {
    const IDLE_TIME_LIMIT = 15 * 60 * 1000; // 15 minutes
    let idleTimer: NodeJS.Timeout | null = null;

    const refreshData = async () => {
      console.log('User idle for 15 minutes, auto-refreshing DC Notice data...');
      try {
        await silentRefresh();
      } catch (err) {
        console.error('Idle refresh failed:', err);
      }
      // Set the timer again to refresh every 15 mins if they remain idle
      startTimer();
    };

    const startTimer = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(refreshData, IDLE_TIME_LIMIT);
    };

    const resetTimer = () => {
      startTimer();
    };

    const activityEvents = ['mousedown', 'keypress', 'touchstart'];

    const handleActivity = () => {
      resetTimer();
    };

    // Use passive listeners for performance
    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    startTimer(); // Initialize timer on mount

    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [silentRefresh]);

  const handleRefresh = async () => {
    await refreshDCNoticeRecords();
  };

  const filteredRecords = React.useMemo(() => {
    return globalFilteredRecords.filter(record => {
      if (selectedDate === 'All') return true;
      if (!record.dc_notice_date) return false;
      const recordDateFormatted = new Date(record.dc_notice_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      return recordDateFormatted === selectedDate;
    });
  }, [globalFilteredRecords, selectedDate]);

  const paginatedRecords = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRecords, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    return (
      <div className={`flex items-center justify-between px-4 py-3 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className={`flex items-center gap-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className={`px-2 py-1 rounded border text-sm focus:outline-none ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>entries</span>
          </div>
          <span>
            Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredRecords.length)}</span> of <span className="font-medium">{filteredRecords.length}</span> results
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className={`p-1 rounded transition-colors ${currentPage === 1
              ? (isDarkMode ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed')
              : (isDarkMode ? 'text-white hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100')
              }`}
            title="First Page"
          >
            <ChevronsLeft className="h-5 w-5" />
          </button>

          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded text-sm transition-colors ${currentPage === 1
              ? (isDarkMode ? 'text-gray-600 bg-gray-800 cursor-not-allowed' : 'text-gray-400 bg-gray-100 cursor-not-allowed')
              : (isDarkMode ? 'text-white bg-gray-700 hover:bg-gray-600' : 'text-gray-700 bg-white hover:bg-gray-50 border border-gray-300')
              }`}
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex items-center space-x-1">
            <span className={`px-2 text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Page {currentPage} of {totalPages}
            </span>
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded text-sm transition-colors ${currentPage === totalPages
              ? (isDarkMode ? 'text-gray-600 bg-gray-800 cursor-not-allowed' : 'text-gray-400 bg-gray-100 cursor-not-allowed')
              : (isDarkMode ? 'text-white bg-gray-700 hover:bg-gray-600' : 'text-gray-700 bg-white hover:bg-gray-50 border border-gray-300')
              }`}
          >
            <ChevronRight size={16} />
          </button>

          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className={`p-1 rounded transition-colors ${currentPage === totalPages
              ? (isDarkMode ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed')
              : (isDarkMode ? 'text-white hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100')
              }`}
            title="Last Page"
          >
            <ChevronsRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };

  return (
    <div className={`h-full flex flex-col md:flex-row overflow-hidden pb-16 md:pb-0 ${isDarkMode ? 'bg-gray-950' : 'bg-gray-50'
      }`}>
      <div className={`hidden md:flex w-64 border-r flex-shrink-0 flex flex-col ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
        }`}>
        <div className={`p-4 border-b flex-shrink-0 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
          <div className="flex items-center justify-between mb-1">
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>DC Notice</h2>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {/* Date Range Filter Section */}
          <div className={`px-4 py-3 border-b space-y-3 ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                DC Notice Date Range
              </span>
              {(dcNoticeDateFrom || dcNoticeDateTo) && (
                <button
                  onClick={() => {
                    setDcNoticeDateFrom('');
                    setDcNoticeDateTo('');
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
                  value={dcNoticeDateFrom}
                  onChange={(e) => setDcNoticeDateFrom(e.target.value)}
                  className={`w-full px-2 py-1.5 rounded text-xs focus:outline-none border ${isDarkMode
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  style={dcNoticeDateFrom ? { borderColor: colorPalette?.primary || '#7c3aed' } : {}}
                />
              </div>
              <div className="relative">
                <label className={`text-[10px] mb-1 block ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>To</label>
                <input
                  type="date"
                  value={dcNoticeDateTo}
                  onChange={(e) => setDcNoticeDateTo(e.target.value)}
                  className={`w-full px-2 py-1.5 rounded text-xs focus:outline-none border ${isDarkMode
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  style={dcNoticeDateTo ? { borderColor: colorPalette?.primary || '#7c3aed' } : {}}
                />
              </div>
            </div>
          </div>

          {/* All Level */}
          <button
            onClick={() => setSelectedDate('All')}
            className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
              } ${selectedDate === 'All'
                ? ''
                : isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}
            style={selectedDate === 'All' ? {
              backgroundColor: colorPalette?.primary ? `${colorPalette.primary}33` : 'rgba(249, 115, 22, 0.2)',
              color: colorPalette?.primary || '#7c3aed'
            } : {}}
          >
            <div className="flex items-center">
              <span>All Records</span>
            </div>
            <span
              className={`px-2 py-1 rounded text-xs transition-colors ${selectedDate === 'All'
                ? 'text-white'
                : isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
                }`}
              style={selectedDate === 'All' ? {
                backgroundColor: colorPalette?.primary || '#7c3aed'
              } : {}}
            >
              {dateItems.all}
            </span>
          </button>

          {/* DC Notice Month Dropdown */}
          <div className={`p-0 ${isDarkMode ? 'border-b border-gray-800' : 'border-b border-gray-100'}`}>
            <button
              onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                } ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              <div className="flex items-center">
                <span className="font-medium">DC Notice Month</span>
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
                      <Calendar className="h-4 w-4 mr-3 opacity-60" />
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
        </div>
      </div>

      <div className={`flex-1 overflow-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
        }`}>
        <div className="flex flex-col h-full">
          <div className={`p-4 border-b flex-shrink-0 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
            }`}>
            <div className="flex flex-col space-y-3">
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
                    placeholder="Search DC Notice records..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full rounded pl-10 pr-10 py-2 focus:outline-none focus:ring-1 focus:border ${isDarkMode
                      ? 'bg-gray-800 text-white border border-gray-700'
                      : 'bg-white text-gray-900 border border-gray-300'
                      }`}
                    style={{
                      '--tw-ring-color': colorPalette?.primary || '#7c3aed'
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
                  <Search className={`absolute left-3 top-2.5 h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className={`absolute right-3 top-2.5 p-0.5 rounded-full transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
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
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto" ref={scrollRef}>
              {isLoading ? (
                <div className={`px-4 py-12 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                  <div className="animate-pulse flex flex-col items-center">
                    <div className={`h-4 w-1/3 rounded mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
                      }`}></div>
                    <div className={`h-4 w-1/2 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
                      }`}></div>
                  </div>
                  <p className="mt-4">Loading DC Notice records...</p>
                </div>
              ) : error ? (
                <div className={`px-4 py-12 text-center ${isDarkMode ? 'text-red-400' : 'text-red-600'
                  }`}>
                  <p>{error}</p>
                  <button
                    onClick={handleRefresh}
                    className={`mt-4 px-4 py-2 rounded ${isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                      }`}>
                    Retry
                  </button>
                </div>
              ) : paginatedRecords.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className={`min-w-full divide-y text-sm ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'
                      }`}>
                      <thead className={`sticky top-0 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                        }`}>
                        <tr>
                          <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>ID</th>
                          <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>Account No</th>
                          <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>Customer Name</th>
                          <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>DC Notice Date</th>
                          <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>Invoice ID</th>
                          <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>Print Link</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDarkMode ? 'bg-gray-900 divide-gray-800' : 'bg-white divide-gray-200'
                        }`}>
                        {paginatedRecords.map((record) => (
                          <tr
                            key={record.id}
                            className={`${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                              }`}
                          >
                            <td className={`px-4 py-3 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'
                              }`}>{record.id}</td>
                            <td className={`px-4 py-3 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'
                              }`}>{record.account_no || '-'}</td>
                            <td className={`px-4 py-3 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'
                              }`}>{record.full_name || '-'}</td>
                            <td className={`px-4 py-3 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'
                              }`}>{formatDate(record.dc_notice_date)}</td>
                            <td className={`px-4 py-3 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'
                              }`}>{record.invoice_id || '-'}</td>
                            <td className={`px-4 py-3 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'
                              }`}>
                              {record.print_link ? (
                                <a
                                  href={record.print_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:text-blue-400"
                                >
                                  View
                                </a>
                              ) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className={`h-full flex items-center justify-center ${isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                  No items
                </div>
              )}
            </div>
            {!isLoading && !error && filteredRecords.length > 0 && <PaginationControls />}
          </div>
        </div>
      </div>

      {/* Mobile Overlay Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)} />
          <div className={`absolute inset-y-0 left-0 w-64 shadow-xl flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-white'
            }`}>
            <div className={`p-4 border-b flex items-center justify-between ${isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
              <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Categories</h2>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className={isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {/* All Level */}
              <button
                onClick={() => {
                  setSelectedDate('All');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors border-b ${isDarkMode ? 'hover:bg-gray-800 border-gray-800' : 'hover:bg-gray-100 border-gray-200'}`}
                style={selectedDate === 'All' ? {
                  backgroundColor: colorPalette?.primary ? `${colorPalette.primary}33` : 'rgba(249, 115, 22, 0.2)',
                  color: colorPalette?.primary || '#7c3aed',
                  fontWeight: 500
                } : {
                  color: isDarkMode ? '#d1d5db' : '#374151'
                }}
              >
                <div className="flex items-center">
                  <Globe className="h-4 w-4 mr-2" />
                  <span>All Records</span>
                </div>
                <span className="px-2 py-1 rounded-full text-xs bg-gray-700 text-gray-300">
                  {dateItems.all}
                </span>
              </button>

              {/* Mobile Date Range Filter Section */}
              <div className={`px-4 py-3 border-b space-y-3 ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    DC Notice Date Range
                  </span>
                  {(dcNoticeDateFrom || dcNoticeDateTo) && (
                    <button
                      onClick={() => {
                        setDcNoticeDateFrom('');
                        setDcNoticeDateTo('');
                      }}
                      className="text-[10px] font-bold uppercase tracking-wider hover:underline"
                      style={{ color: colorPalette?.primary || '#7c3aed' }}
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <label className={`text-[10px] mb-1 block ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>From</label>
                    <input
                      type="date"
                      value={dcNoticeDateFrom}
                      onChange={(e) => setDcNoticeDateFrom(e.target.value)}
                      className={`w-full px-2 py-1.5 rounded text-xs focus:outline-none border ${isDarkMode
                        ? 'bg-gray-800 border-gray-700 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      style={dcNoticeDateFrom ? { borderColor: colorPalette?.primary || '#7c3aed' } : {}}
                    />
                  </div>
                  <div className="relative">
                    <label className={`text-[10px] mb-1 block ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>To</label>
                    <input
                      type="date"
                      value={dcNoticeDateTo}
                      onChange={(e) => setDcNoticeDateTo(e.target.value)}
                      className={`w-full px-2 py-1.5 rounded text-xs focus:outline-none border ${isDarkMode
                        ? 'bg-gray-800 border-gray-700 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      style={dcNoticeDateTo ? { borderColor: colorPalette?.primary || '#7c3aed' } : {}}
                    />
                  </div>
                </div>
              </div>

              {/* Mobile DC Notice Month Dropdown */}
              <div className={`border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                <button
                  onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${isDarkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                    }`}
                >
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span className="font-medium">DC Notice Month</span>
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isDateDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDateDropdownOpen && (
                  <div className={isDarkMode ? 'bg-gray-900/50' : 'bg-gray-50/50'}>
                    {dateItems.dates.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedDate(item.date);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-6 py-3 text-sm transition-colors border-b last:border-0 ${isDarkMode ? 'hover:bg-gray-800 border-gray-800' : 'hover:bg-gray-100 border-gray-200'
                          }`}
                        style={selectedDate === item.date ? {
                          backgroundColor: colorPalette?.primary ? `${colorPalette.primary}33` : 'rgba(249, 115, 22, 0.2)',
                          color: colorPalette?.primary || '#7c3aed',
                          fontWeight: 500
                        } : {
                          color: isDarkMode ? '#9ca3af' : '#4b5563'
                        }}
                      >
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 opacity-60" />
                          <span>{item.date}</span>
                        </div>
                        <span className="px-2 py-1 rounded-full text-[10px] bg-gray-700 text-gray-300">
                          {item.count}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DCNoticePage;
