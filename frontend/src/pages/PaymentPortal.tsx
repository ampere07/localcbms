import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Globe, Search, ChevronDown, ChevronRight, Menu, X, FileText, Filter, ChevronsLeft, ChevronsRight, RefreshCw } from 'lucide-react';
import PaymentPortalDetails from '../components/PaymentPortalDetails';
import { settingsColorPaletteService, ColorPalette } from '../services/settingsColorPaletteService';
import { usePaymentPortalStore } from '../store/paymentPortalStore';
import { PaymentPortalLog as PaymentPortalRecord } from '../services/paymentPortalLogsService';
import BillingDetails from '../components/CustomerDetails';
import { getCustomerDetail, CustomerDetailData } from '../services/customerDetailService';
import { getCities, City } from '../services/cityService';
import { getRegions, Region } from '../services/regionService';
import { barangayService, Barangay } from '../services/barangayService';
import { BillingDetailRecord } from '../types/billing';
import PaymentPortalFunnelFilter, { FilterValues, allColumns as filterColumns } from '../filter/PaymentPortalFunnelFilter';
import pusher from '../services/pusherService';

const hexToRgba = (hex: string, opacity: number) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${opacity})` : hex;
};

// Interfaces for payment portal data (PaymentPortalRecord is imported now)
// Removed local PaymentPortalRecord interface

interface LocationItem {
  id: string;
  name: string;
  count: number;
}

const convertCustomerDataToBillingDetail = (customerData: CustomerDetailData): BillingDetailRecord => {
  return {
    id: customerData.billingAccount?.accountNo || '',
    applicationId: customerData.billingAccount?.accountNo || '',
    customerName: customerData.fullName,
    address: customerData.address,
    status: customerData.billingAccount?.billingStatusId === 2 ? 'Active' : 'Inactive',
    balance: customerData.billingAccount?.accountBalance || 0,
    onlineStatus: customerData.billingAccount?.billingStatusId === 2 ? 'Online' : 'Offline',
    cityId: null,
    regionId: null,
    timestamp: customerData.updatedAt || '',
    billingStatus: customerData.billingAccount?.billingStatusId ? ({1:'In Progress', 2:'Active', 3:'Suspended', 4:'Cancelled', 5:'Overdue', 6:'Service Account'}[customerData.billingAccount.billingStatusId] || `Status ${customerData.billingAccount.billingStatusId}`) : '',
    dateInstalled: customerData.billingAccount?.dateInstalled || '',
    contactNumber: customerData.contactNumberPrimary,
    secondContactNumber: customerData.contactNumberSecondary || '',
    emailAddress: customerData.emailAddress || '',
    plan: customerData.desiredPlan || '',
    username: customerData.technicalDetails?.username || '',
    connectionType: customerData.technicalDetails?.connectionType || '',
    routerModel: customerData.technicalDetails?.routerModel || '',
    routerModemSN: customerData.technicalDetails?.routerModemSn || '',
    lcpnap: customerData.technicalDetails?.lcpnap || '',
    port: customerData.technicalDetails?.port || '',
    vlan: customerData.technicalDetails?.vlan || '',
    billingDay: customerData.billingAccount?.billingDay || 0,
    totalPaid: 0,
    provider: '',
    lcp: customerData.technicalDetails?.lcp || '',
    nap: customerData.technicalDetails?.nap || '',
    modifiedBy: '',
    modifiedDate: customerData.updatedAt || '',
    barangay: customerData.barangay || '',
    city: customerData.city || '',
    region: customerData.region || '',

    usageType: customerData.technicalDetails?.usageTypeId ? `Type ${customerData.technicalDetails.usageTypeId}` : '',
    referredBy: customerData.referredBy || '',
    referralContactNo: '',
    groupName: customerData.groupName || '',
    mikrotikId: '',
    sessionIp: customerData.technicalDetails?.ipAddress || '',
    houseFrontPicture: customerData.houseFrontPictureUrl || '',
    accountBalance: customerData.billingAccount?.accountBalance || 0,
    housingStatus: customerData.housingStatus || '',
    addressCoordinates: customerData.addressCoordinates || '',
  };
};

interface PaginationControlsProps {
  totalPages: number;
  itemsPerPage: number;
  setItemsPerPage: (val: number) => void;
  isDarkMode: boolean;
  currentPage: number;
  totalDisplayCount: number;
  handlePageChange: (page: number) => void;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  totalPages,
  itemsPerPage,
  setItemsPerPage,
  isDarkMode,
  currentPage,
  totalDisplayCount,
  handlePageChange
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className={`flex items-center justify-between px-4 py-3 border-t relative z-20 ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
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
          Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalDisplayCount)}</span> of <span className="font-medium">{totalDisplayCount}</span> results
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
          Previous
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
          Next
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

const PaymentPortal: React.FC = () => {
  const {
    paymentPortalRecords: records,
    totalCount,
    isLoading: loading,
    error,
    fetchPaymentPortalRecords,
    refreshPaymentPortalRecords,
    silentRefresh,
    fetchUpdates
  } = usePaymentPortalStore();

  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRecord, setSelectedRecord] = useState<PaymentPortalRecord | null>(null);
  const [colorPalette, setColorPalette] = useState<ColorPalette | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetailData | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  const [isFunnelFilterOpen, setIsFunnelFilterOpen] = useState<boolean>(false);
  const [activeFilters, setActiveFilters] = useState<FilterValues>(() => {
    const saved = localStorage.getItem('paymentPortalFunnelFilters');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.error('Failed to load filters:', err);
      }
    }
    return {};
  });

  const [dateTimeFrom, setDateTimeFrom] = useState<string>('');
  const [dateTimeTo, setDateTimeTo] = useState<string>('');

  const removeFilter = (key: string) => {
    const newFilters = { ...activeFilters };
    delete newFilters[key];
    setActiveFilters(newFilters);
    localStorage.setItem('paymentPortalFunnelFilters', JSON.stringify(newFilters));
  };

  const [cities, setCities] = useState<City[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

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
    fetchPaymentPortalRecords();
  }, [fetchPaymentPortalRecords]);

  // Fetch lookup data
  useEffect(() => {
    const fetchLookupData = async () => {
      try {
        const [citiesData, regionsData, barangaysRes] = await Promise.all([
          getCities(),
          getRegions(),
          barangayService.getAll()
        ]);
        setCities(citiesData || []);
        setRegions(regionsData || []);
        setBarangays(barangaysRes.success ? barangaysRes.data : []);
      } catch (err) {
        console.error('Failed to fetch lookup data:', err);
      }
    };

    fetchLookupData();
  }, []);

  // Pusher/Soketi connection for real-time payment portal updates
  useEffect(() => {
    const handleUpdate = async (data: any) => {
      console.log('[PaymentPortal Soketi] Update received, refreshing:', data);
      try {
        await fetchPaymentPortalRecords(true);
        console.log('[PaymentPortal Soketi] Data refreshed successfully');
      } catch (err) {
        console.error('[PaymentPortal Soketi] Failed to refresh data:', err);
      }
    };

    const paymentChannel = pusher.subscribe('payments');

    paymentChannel.bind('pusher:subscription_succeeded', () => {
      console.log('[PaymentPortal Soketi] Successfully subscribed to payments channel');
    });
    paymentChannel.bind('pusher:subscription_error', (error: any) => {
      console.error('[PaymentPortal Soketi] Subscription error:', error);
    });

    paymentChannel.bind('payment-updated', handleUpdate);

    // Re-subscribe on reconnection
    const stateHandler = (states: { previous: string; current: string }) => {
      console.log(`[PaymentPortal Soketi] Connection state: ${states.previous} -> ${states.current}`);
      if (states.current === 'connected' && paymentChannel.subscribed !== true) {
        pusher.subscribe('payments');
      }
    };
    pusher.connection.bind('state_change', stateHandler);

    return () => {
      paymentChannel.unbind('pusher:subscription_succeeded');
      paymentChannel.unbind('pusher:subscription_error');
      paymentChannel.unbind('payment-updated', handleUpdate);
      pusher.connection.unbind('state_change', stateHandler);
      pusher.unsubscribe('payments');
    };
  }, [fetchPaymentPortalRecords]);

  // Polling for updates every 3 seconds - Incremental fetch
  useEffect(() => {
    const POLLING_INTERVAL = 3000; // 3 seconds
    const intervalId = setInterval(async () => {
      console.log('[PaymentPortal Page] Polling for updates...');
      try {
        await fetchUpdates();
      } catch (err) {
        console.error('[PaymentPortal Page] Polling failed:', err);
      }
    }, POLLING_INTERVAL);

    return () => clearInterval(intervalId);
  }, [fetchUpdates]);

  // Idle detection and auto-refresh logic
  useEffect(() => {
    const IDLE_TIME_LIMIT = 15 * 60 * 1000; // 15 minutes
    let idleTimer: NodeJS.Timeout | null = null;

    const refreshData = async () => {
      console.log('User idle for 15 minutes, auto-refreshing payment portal data...');
      try {
        await refreshPaymentPortalRecords();
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

    // Use passive listeners for performance if possible, but standard is fine here
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
  }, [refreshPaymentPortalRecords]);

  const toggleLocationExpansion = (e: React.MouseEvent, locationId: string) => {
    e.stopPropagation();
    setExpandedLocations(prev => {
      const next = new Set(prev);
      if (next.has(locationId)) {
        next.delete(locationId);
      } else {
        next.add(locationId);
      }
      return next;
    });
  };


  // 1. Initial search/funnel filtering (Global filtered set for sidebar counts)
  const globalFilteredRecords = useMemo(() => {
    const normalizedQuery = searchQuery.toLowerCase().replace(/\s+/g, '');
    let filtered = records.filter(record => {
      const checkValue = (val: any): boolean => {
        if (val === null || val === undefined) return false;
        if (typeof val === 'object') {
          return Object.values(val).some(v => checkValue(v));
        }
        return String(val).toLowerCase().replace(/\s+/g, '').includes(normalizedQuery);
      };

      return searchQuery === '' || checkValue(record);
    });

    // Apply funnel filters
    if (activeFilters && Object.keys(activeFilters).length > 0) {
      filtered = filtered.filter((record: any) => {
        return Object.entries(activeFilters).every(([key, filter]: [string, any]) => {
          const getValForFilter = (item: any, k: string) => {
            switch (k) {
              case 'fullName': return item.fullName ?? item.full_name;
              case 'accountNo': return item.accountNo ?? item.account_no;
              case 'reference_no': return item.reference_no ?? item.referenceNo;
              default: return item[k];
            }
          };

          const val = getValForFilter(record, key);

          if (filter.type === 'checklist') {
            if (!filter.value || !Array.isArray(filter.value) || filter.value.length === 0) return true;

            const valStr = String(val || '').toLowerCase().trim();

            if (key === 'barangay' || key === 'city' || key === 'region') {
              const directVal = String(record[key] || '').toLowerCase().trim();
              const address = String(record.address || '').toLowerCase();

              return (filter.value as string[]).some(option => {
                const opt = option.toLowerCase().trim();
                return directVal === opt || address.includes(opt);
              });
            }

            return (filter.value as string[]).some(option => valStr === option.toLowerCase().trim());
          }

          if (filter.type === 'text') {
            if (!filter.value) return true;
            const value = String(val || '').toLowerCase();
            return value.includes(String(filter.value).toLowerCase());
          }

          if (filter.type === 'number') {
            const numValue = Number(val);
            if (isNaN(numValue)) return false;
            if (filter.from !== undefined && filter.from !== '' && numValue < Number(filter.from)) return false;
            if (filter.to !== undefined && filter.to !== '' && numValue > Number(filter.to)) return false;
            return true;
          }

          if (filter.type === 'date') {
            if (!val) return false;
            const dateValue = new Date(val).getTime();
            if (isNaN(dateValue)) return false;

            if (filter.from) {
              const fromDate = new Date(filter.from).getTime();
              if (dateValue < fromDate) return false;
            }
            if (filter.to) {
              const toDate = new Date(filter.to).getTime();
              if (dateValue > toDate) return false;
            }
            return true;
          }

          return true;
        });
      });
    }

    // Apply sidebar date range filters for date_time
    if (dateTimeFrom || dateTimeTo) {
      filtered = filtered.filter(record => {
        if (!record.date_time) return false;

        const dateValue = new Date(record.date_time).getTime();
        if (isNaN(dateValue)) return false;

        if (dateTimeFrom) {
          const fromDate = new Date(dateTimeFrom);
          fromDate.setHours(0, 0, 0, 0);
          if (dateValue < fromDate.getTime()) return false;
        }

        if (dateTimeTo) {
          const toDate = new Date(dateTimeTo);
          toDate.setHours(23, 59, 59, 999);
          if (dateValue > toDate.getTime()) return false;
        }

        return true;
      });
    }

    return filtered;
  }, [records, searchQuery, activeFilters, dateTimeFrom, dateTimeTo]);

  // Generate location items with hierarchy - Now using globalFilteredRecords
  const locationItems = useMemo(() => {
    // Counts for each level
    const regionCounts: Record<string, number> = {};
    const cityCounts: Record<string, number> = {};
    const barangayCounts: Record<string, number> = {};

    // Initialize counts
    regions.forEach(r => regionCounts[r.name] = 0);
    cities.forEach(c => cityCounts[`${c.region_id}_${c.name}`] = 0);
    barangays.forEach(b => barangayCounts[`${b.city_id}_${b.barangay}`] = 0);

    // Count appearances in records
    globalFilteredRecords.forEach(record => {
      const city = record.city;
      const barangay = record.barangay;

      // Find matched city to get region
      const matchedCity = cities.find(c => c.name === city);
      if (matchedCity) {
        const matchedRegion = regions.find(r => r.id === matchedCity.region_id);
        if (matchedRegion) {
          regionCounts[matchedRegion.name] = (regionCounts[matchedRegion.name] || 0) + 1;
        }
        cityCounts[`${matchedCity.region_id}_${matchedCity.name}`] = (cityCounts[`${matchedCity.region_id}_${matchedCity.name}`] || 0) + 1;
      }

      if (barangay) {
        const matchedBarangay = barangays.find(b =>
          b.barangay === barangay &&
          (!city || cities.find(c => c.id === b.city_id)?.name === city)
        );
        if (matchedBarangay) {
          barangayCounts[`${matchedBarangay.city_id}_${matchedBarangay.barangay}`] = (barangayCounts[`${matchedBarangay.city_id}_${matchedBarangay.barangay}`] || 0) + 1;
        }
      }
    });

    return {
      regions: regions.map(r => ({
        id: `reg:${r.name}`,
        name: r.name,
        count: regionCounts[r.name] || 0,
        cities: cities.filter(c => c.region_id === r.id).map(c => ({
          id: `city:${c.name}`,
          name: c.name,
          regionName: r.name,
          count: cityCounts[`${r.id}_${c.name}`] || 0,
          barangays: barangays.filter(b => b.city_id === c.id).map(b => ({
            id: `brgy:${b.barangay}`,
            name: b.barangay,
            cityName: c.name,
            regionName: r.name,
            count: barangayCounts[`${c.id}_${b.barangay}`] || 0
          }))
        }))
      })),
      total: globalFilteredRecords.length
    };
  }, [regions, cities, barangays, globalFilteredRecords]);

  // Filter records based on location
  const filteredRecords = useMemo(() => {
    return globalFilteredRecords.filter(record => {
      let matchesLocation = selectedLocation === 'all';

      if (!matchesLocation) {
        if (selectedLocation.startsWith('reg:')) {
          const regionName = selectedLocation.substring(4);
          // Try to match region via city lookup since record doesn't have region field directly
          const matchedCity = cities.find(c => c.name === record.city);
          const matchedRegion = regions.find(r => r.id === matchedCity?.region_id);
          matchesLocation = matchedRegion?.name === regionName;
        } else if (selectedLocation.startsWith('city:')) {
          const cityName = selectedLocation.substring(5);
          matchesLocation = record.city === cityName;
        } else if (selectedLocation.startsWith('brgy:')) {
          const barangayName = selectedLocation.substring(5);
          matchesLocation = record.barangay === barangayName;
        }
      }

      return matchesLocation;
    });
  }, [globalFilteredRecords, selectedLocation, cities, regions]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedLocation, searchQuery, itemsPerPage, dateTimeFrom, dateTimeTo, activeFilters]);

  // Scroll to top on page change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage]);

  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRecords, currentPage, itemsPerPage]);

  // Use totalCount for total pages if no filter/search is active
  const totalDisplayCount = useMemo(() => {
    if (searchQuery || selectedLocation !== 'all' || Object.keys(activeFilters).length > 0) {
      return filteredRecords.length;
    }
    return Math.max(totalCount, records.length);
  }, [filteredRecords.length, totalCount, records.length, searchQuery, selectedLocation, activeFilters]);

  const totalPages = Math.ceil(totalDisplayCount / itemsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };


  const handleRowClick = (record: PaymentPortalRecord) => {
    setSelectedRecord(record);
    setSelectedCustomer(null); // Clear customer view when switching records
  };

  const handleViewCustomer = async (accountNo: string) => {
    setIsLoadingDetails(true);
    try {
      const detail = await getCustomerDetail(accountNo);
      if (detail) {
        setSelectedCustomer(detail);
      }
    } catch (err) {
      console.error('Error fetching customer details:', err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Status text color component
  const StatusText = ({ status }: { status: string }) => {
    let textColor = '';

    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
      case 'paid':
        textColor = 'text-green-500';
        break;
      case 'pending':
      case 'processing':
      case 'queued':
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

  return (
    <div className={`h-full flex flex-col md:flex-row overflow-hidden pb-16 md:pb-0 ${isDarkMode ? 'bg-gray-950' : 'bg-gray-50'
      }`}>
      {/* Location Sidebar Container */}
      <div className={`hidden md:flex w-64 border-r flex-shrink-0 flex flex-col ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
        }`}>
        <div className={`p-4 border-b flex-shrink-0 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
          <div className="flex items-center justify-between mb-1">
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Payment Portal</h2>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {/* Date Range Filter Section */}
          <div className={`px-4 py-3 border-b space-y-3 ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Date Range
              </span>
              {(dateTimeFrom || dateTimeTo) && (
                <button
                  onClick={() => {
                    setDateTimeFrom('');
                    setDateTimeTo('');
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
                  value={dateTimeFrom}
                  onChange={(e) => setDateTimeFrom(e.target.value)}
                  className={`w-full px-2 py-1.5 rounded text-xs focus:outline-none border ${isDarkMode
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  style={dateTimeFrom ? { borderColor: colorPalette?.primary || '#7c3aed' } : {}}
                />
              </div>
              <div className="relative">
                <label className={`text-[10px] mb-1 block ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>To</label>
                <input
                  type="date"
                  value={dateTimeTo}
                  onChange={(e) => setDateTimeTo(e.target.value)}
                  className={`w-full px-2 py-1.5 rounded text-xs focus:outline-none border ${isDarkMode
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  style={dateTimeTo ? { borderColor: colorPalette?.primary || '#7c3aed' } : {}}
                />
              </div>
            </div>
          </div>

          {/* All Level */}
          <button
            onClick={() => setSelectedLocation('all')}
            className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
              } ${selectedLocation === 'all'
                ? ''
                : isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}
            style={selectedLocation === 'all' ? {
              backgroundColor: colorPalette?.primary ? `${colorPalette.primary}33` : 'rgba(249, 115, 22, 0.2)',
              color: colorPalette?.primary || '#7c3aed'
            } : {}}
          >
            <div className="flex items-center">
              <span>All Records</span>
            </div>
            <span
              className={`px-2 py-1 rounded-full text-xs ${selectedLocation === 'all'
                ? 'text-white'
                : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                }`}
              style={selectedLocation === 'all' ? {
                backgroundColor: colorPalette?.primary || '#7c3aed'
              } : {}}
            >
              {locationItems.total}
            </span>
          </button>

          {/* Region Level */}
          {locationItems.regions.map((region: any) => (
            <div key={region.id}>
              <button
                onClick={() => setSelectedLocation(region.id)}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                  } ${selectedLocation === region.id
                    ? ''
                    : isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                style={selectedLocation === region.id ? {
                  backgroundColor: colorPalette?.primary ? `${colorPalette.primary}33` : 'rgba(249, 115, 22, 0.2)',
                  color: colorPalette?.primary || '#7c3aed'
                } : {}}
              >
                <div className="flex items-center flex-1">
                  <button
                    onClick={(e) => toggleLocationExpansion(e, region.id)}
                    className="p-1 mr-1"
                  >
                    {expandedLocations.has(region.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  <Globe className="h-4 w-4 mr-2" />
                  <span>{region.name}</span>
                </div>
                {region.count > 0 && (
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${selectedLocation === region.id
                      ? 'text-white'
                      : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                      }`}
                    style={selectedLocation === region.id ? {
                      backgroundColor: colorPalette?.primary || '#7c3aed'
                    } : {}}
                  >
                    {region.count}
                  </span>
                )}
              </button>

              {/* City Level */}
              {expandedLocations.has(region.id) && region.cities.map((city: any) => (
                <div key={city.id}>
                  <button
                    onClick={() => setSelectedLocation(city.id)}
                    className={`w-full flex items-center justify-between pl-10 pr-4 py-2 text-sm transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                      } ${selectedLocation === city.id
                        ? ''
                        : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    style={selectedLocation === city.id ? {
                      backgroundColor: colorPalette?.primary ? `${colorPalette.primary}22` : 'rgba(249, 115, 22, 0.1)',
                      color: colorPalette?.primary || '#7c3aed'
                    } : {}}
                  >
                    <div className="flex items-center flex-1">
                      <button
                        onClick={(e) => toggleLocationExpansion(e, city.id)}
                        className="p-1 mr-1"
                      >
                        {expandedLocations.has(city.id) ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                      </button>
                      <span>{city.name}</span>
                    </div>
                    {city.count > 0 && (
                      <span className="text-xs opacity-60">{city.count}</span>
                    )}
                  </button>

                  {/* Barangay Level */}
                  {expandedLocations.has(city.id) && city.barangays.map((barangay: any) => (
                    <button
                      key={barangay.id}
                      onClick={() => setSelectedLocation(barangay.id)}
                      className={`w-full flex items-center justify-between pl-16 pr-4 py-1.5 text-xs transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                        } ${selectedLocation === barangay.id
                          ? ''
                          : isDarkMode ? 'text-gray-500' : 'text-gray-500'
                        }`}
                      style={selectedLocation === barangay.id ? {
                        color: colorPalette?.primary || '#7c3aed',
                        fontWeight: 'bold'
                      } : {}}
                    >
                      <div className="flex items-center flex-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-current mr-2 opacity-40"></span>
                        <span>{barangay.name}</span>
                      </div>
                      {barangay.count > 0 && (
                        <span className="text-[10px] opacity-50">{barangay.count}</span>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Payment Portal Records List - Shrinks when detail view is shown */}
      <div className={`overflow-hidden flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
        }`}>
        <div className="flex flex-col h-full">
          {/* Search Bar */}
          <div className={`p-4 border-b flex-shrink-0 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
            }`}>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden bg-gray-700 hover:bg-gray-600 text-white p-2 rounded text-sm transition-colors flex items-center justify-center"
                aria-label="Open filter menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search payment portal records..."
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
                onClick={() => setIsFunnelFilterOpen(true)}
                title={Object.keys(activeFilters).length > 0
                  ? `Active Filters:\n${Object.entries(activeFilters).map(([key, filter]: [string, any]) => {
                    const colName = filterColumns.find(c => c.key === key)?.label || key;
                    if (filter.type === 'text') return `${colName}: ${filter.value}`;
                    if (filter.type === 'checklist') {
                      return `${colName}: ${Array.isArray(filter.value) ? filter.value.join(', ') : filter.value}`;
                    }
                    if (filter.type === 'number') {
                      if (filter.from && filter.to) return `${colName}: ${filter.from} - ${filter.to}`;
                      if (filter.from) return `${colName}: > ${filter.from}`;
                      if (filter.to) return `${colName}: < ${filter.to}`;
                    }
                    if (filter.type === 'date') {
                      if (filter.from && filter.to) return `${colName}: ${filter.from} to ${filter.to}`;
                      if (filter.from) return `${colName}: After ${filter.from}`;
                      if (filter.to) return `${colName}: Before ${filter.to}`;
                    }
                    return colName;
                  }).join('\n')}`
                  : "Filter Payment Portal Records"
                }
                className={`px-4 py-2 rounded text-sm transition-colors flex items-center ${Object.keys(activeFilters).length > 0
                  ? 'text-red-500 hover:bg-red-500/10'
                  : isDarkMode
                    ? 'hover:bg-gray-700 text-white'
                    : 'hover:bg-gray-200 text-gray-900 border border-gray-300'
                  }`}
              >
                <Filter className="h-5 w-5" />
              </button>
              <button
                onClick={refreshPaymentPortalRecords}
                disabled={loading}
                title="Refresh Records"
                className="p-2 rounded-lg transition-all duration-200 flex items-center justify-center shadow-sm disabled:opacity-50"
                style={{ 
                  backgroundColor: colorPalette?.primary || '#7c3aed',
                  color: isDarkMode ? '#111827' : '#ffffff'
                }}
                onMouseEnter={(e) => {
                  if (!loading && colorPalette?.accent) {
                    e.currentTarget.style.backgroundColor = colorPalette.accent;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading && colorPalette?.primary) {
                    e.currentTarget.style.backgroundColor = colorPalette.primary;
                  }
                }}
              >
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Active Funnel Filters Row */}
          {Object.keys(activeFilters || {}).length > 0 && (
            <div className={`px-4 py-2 border-b flex flex-wrap items-center gap-2 overflow-x-auto no-scrollbar ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Active Filters:
              </span>
              <div className="flex flex-wrap gap-2">
                {Object.entries(activeFilters || {}).map(([key, filter]: [string, any]) => {
                  const column = filterColumns.find(c => (c as any).key === key);
                  const label = column?.label || key;

                  let displayValue = '';
                  if (filter.type === 'text' || filter.type === 'boolean') {
                    displayValue = String(filter.value);
                  } else if (filter.type === 'checklist') {
                    displayValue = Array.isArray(filter.value)
                      ? filter.value.join(', ')
                      : String(filter.value || '');
                  } else if (filter.type === 'number' || filter.type === 'date') {
                    if (filter.from && filter.to) displayValue = `${filter.from} - ${filter.to}`;
                    else if (filter.from) displayValue = `> ${filter.from}`;
                    else if (filter.to) displayValue = `< ${filter.to}`;
                  }

                  return (
                    <div
                      key={key}
                      className={`group flex items-center h-7 pl-2 pr-1 rounded-full text-xs font-medium transition-all`}
                      style={{
                        backgroundColor: hexToRgba(colorPalette?.primary || '#7c3aed', isDarkMode ? 0.1 : 0.05),
                        color: colorPalette?.primary || '#7c3aed',
                        border: `1px solid ${hexToRgba(colorPalette?.primary || '#7c3aed', 0.2)}`
                      }}
                    >
                      <span className="opacity-70 mr-1">{label}:</span>
                      <span className="truncate max-w-[150px]">{displayValue}</span>
                      <button
                        onClick={() => removeFilter(key)}
                        className={`ml-1 p-0.5 rounded-full transition-colors`}
                        onMouseEnter={(e) => {
                          if (colorPalette?.primary) {
                            e.currentTarget.style.backgroundColor = hexToRgba(colorPalette.primary, 0.2);
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
                <button
                  onClick={() => {
                    setActiveFilters({});
                    localStorage.removeItem('paymentPortalFunnelFilters');
                  }}
                  className={`text-[10px] font-bold uppercase tracking-wider underline-offset-4 hover:underline transition-colors px-2 py-1 rounded-md`}
                  style={{ color: colorPalette?.primary || '#7c3aed' }}
                  onMouseEnter={(e) => {
                    if (colorPalette?.primary) {
                      e.currentTarget.style.backgroundColor = hexToRgba(colorPalette.primary, 0.1);
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  Clear all
                </button>
              </div>
            </div>
          )}

          {/* Table Container */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-x-auto overflow-y-auto" ref={scrollRef}>
              {loading ? (
                <div className={`px-4 py-12 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <div className="animate-pulse flex flex-col items-center">
                    <div className={`h-4 w-1/3 rounded mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                    <div className={`h-4 w-1/2 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                  </div>
                  <p className="mt-4">Loading payment portal records...</p>
                </div>
              ) : error ? (
                <div className={`px-4 py-12 text-center ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                  <p>{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className={`mt-4 px-4 py-2 rounded text-white ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-400 hover:bg-gray-500'}`}>
                    Retry
                  </button>
                </div>
              ) : (
                <table className={`min-w-full text-sm ${isDarkMode ? 'divide-y divide-gray-700' : 'divide-y divide-gray-200'
                  }`}>
                  <thead className={`sticky top-0 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                    }`}>
                    <tr>
                      <th scope="col" className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                        Date Time
                      </th>
                      <th scope="col" className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                        Account No
                      </th>
                      <th scope="col" className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                        Total Amount
                      </th>
                      <th scope="col" className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                        Status
                      </th>
                      <th scope="col" className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                        Reference No
                      </th>
                      <th scope="col" className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                        Contact Number
                      </th>
                      <th scope="col" className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                        Account Balance
                      </th>
                      <th scope="col" className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                        Checkout ID
                      </th>
                      <th scope="col" className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                        Transaction Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`${isDarkMode ? 'bg-gray-900 divide-y divide-gray-800' : 'bg-white divide-y divide-gray-200'
                    }`}>
                    {paginatedRecords.length > 0 ? (
                      paginatedRecords.map((record: PaymentPortalRecord) => (
                        <tr
                          key={record.id}
                          className={`cursor-pointer ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                            } ${selectedRecord?.id === record.id ? (isDarkMode ? 'bg-gray-800' : 'bg-gray-100') : ''}`}
                          onClick={() => handleRowClick(record)}
                        >
                          {/* Date Time */}
                          <td className={`px-4 py-3 whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                            {record.date_time || 'N/A'}
                          </td>
                          {/* Account No */}
                          <td className={`px-4 py-3 whitespace-nowrap text-red-400 font-medium`}>
                            {record.accountNo || record.account_id || 'N/A'}
                          </td>
                          {/* Total Amount */}
                          <td className={`px-4 py-3 whitespace-nowrap font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                            {formatCurrency(record.total_amount || 0)}
                          </td>
                          {/* Status */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <StatusText status={record.status || 'N/A'} />
                          </td>
                          {/* Reference No */}
                          <td className={`px-4 py-3 whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                            {record.reference_no || 'N/A'}
                          </td>
                          {/* Contact Number */}
                          <td className={`px-4 py-3 whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                            {record.contactNo || 'N/A'}
                          </td>
                          {/* Account Balance */}
                          <td className={`px-4 py-3 whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                            {formatCurrency(record.accountBalance || 0)}
                          </td>
                          {/* Checkout ID */}
                          <td className={`px-4 py-3 whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                            {record.checkout_id || 'N/A'}
                          </td>
                          {/* Transaction Status */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <StatusText status={record.transaction_status || 'N/A'} />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className={`px-4 py-12 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                          {filteredRecords.length > 0
                            ? 'No payment portal records found matching your filters'
                            : (totalCount > records.length)
                              ? 'Loading more records... please wait.'
                              : 'No payment portal records found.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
            <PaginationControls
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              setItemsPerPage={setItemsPerPage}
              isDarkMode={isDarkMode}
              currentPage={currentPage}
              totalDisplayCount={totalDisplayCount}
              handlePageChange={handlePageChange}
            />
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
                }`}>Location</h2>
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
                  setSelectedLocation('all');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors border-b ${isDarkMode ? 'hover:bg-gray-800 border-gray-800' : 'hover:bg-gray-100 border-gray-200'}`}
                style={selectedLocation === 'all' ? {
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
                  {locationItems.total}
                </span>
              </button>

              {/* Mobile Date Range Filter Section */}
              <div className={`px-4 py-3 border-b space-y-3 ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Date Time Range
                  </span>
                  {(dateTimeFrom || dateTimeTo) && (
                    <button
                      onClick={() => {
                        setDateTimeFrom('');
                        setDateTimeTo('');
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
                      value={dateTimeFrom}
                      onChange={(e) => setDateTimeFrom(e.target.value)}
                      className={`w-full px-2 py-1.5 rounded text-xs focus:outline-none border ${isDarkMode
                        ? 'bg-gray-800 border-gray-700 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      style={dateTimeFrom ? { borderColor: colorPalette?.primary || '#7c3aed' } : {}}
                    />
                  </div>
                  <div className="relative">
                    <label className={`text-[10px] mb-1 block ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>To</label>
                    <input
                      type="date"
                      value={dateTimeTo}
                      onChange={(e) => setDateTimeTo(e.target.value)}
                      className={`w-full px-2 py-1.5 rounded text-xs focus:outline-none border ${isDarkMode
                        ? 'bg-gray-800 border-gray-700 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      style={dateTimeTo ? { borderColor: colorPalette?.primary || '#7c3aed' } : {}}
                    />
                  </div>
                </div>
              </div>

              {/* Region Level */}
              {locationItems.regions.map((region: any) => (
                <div key={region.id} className="border-b border-gray-800">
                  <button
                    onClick={() => {
                      setSelectedLocation(region.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${selectedLocation === region.id ? '' : 'text-gray-300'}`}
                    style={selectedLocation === region.id ? {
                      backgroundColor: colorPalette?.primary ? `${colorPalette.primary}33` : 'rgba(249, 115, 22, 0.2)',
                      color: colorPalette?.primary || '#7c3aed',
                      fontWeight: 500
                    } : {}}
                  >
                    <div className="flex items-center flex-1">
                      <button
                        onClick={(e) => toggleLocationExpansion(e, region.id)}
                        className="p-1 mr-1"
                      >
                        {expandedLocations.has(region.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      <Globe className="h-4 w-4 mr-2" />
                      <span>{region.name}</span>
                    </div>
                    {region.count > 0 && (
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-700 text-gray-300">
                        {region.count}
                      </span>
                    )}
                  </button>

                  {/* City Level */}
                  {expandedLocations.has(region.id) && region.cities.map((city: any) => (
                    <div key={city.id}>
                      <button
                        onClick={() => {
                          setSelectedLocation(city.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between pl-10 pr-4 py-2 text-sm transition-colors ${selectedLocation === city.id ? '' : 'text-gray-400'}`}
                        style={selectedLocation === city.id ? {
                          backgroundColor: colorPalette?.primary ? `${colorPalette.primary}22` : 'rgba(249, 115, 22, 0.1)',
                          color: colorPalette?.primary || '#7c3aed'
                        } : {}}
                      >
                        <div className="flex items-center flex-1">
                          <button
                            onClick={(e) => toggleLocationExpansion(e, city.id)}
                            className="p-1 mr-1"
                          >
                            {expandedLocations.has(city.id) ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronRight className="h-3 w-3" />
                            )}
                          </button>
                          <span>{city.name}</span>
                        </div>
                        {city.count > 0 && (
                          <span className="text-xs opacity-60">{city.count}</span>
                        )}
                      </button>

                      {/* Barangay Level */}
                      {expandedLocations.has(city.id) && city.barangays.map((barangay: any) => (
                        <button
                          key={barangay.id}
                          onClick={() => {
                            setSelectedLocation(barangay.id);
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between pl-16 pr-4 py-1.5 text-xs transition-colors ${selectedLocation === barangay.id ? '' : 'text-gray-500'}`}
                          style={selectedLocation === barangay.id ? {
                            color: colorPalette?.primary || '#7c3aed',
                            fontWeight: 'bold'
                          } : {}}
                        >
                          <div className="flex items-center flex-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-current mr-2 opacity-40"></span>
                            <span>{barangay.name}</span>
                          </div>
                          {barangay.count > 0 && (
                            <span className="text-[10px] opacity-50">{barangay.count}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Payment Portal Detail View - Only visible when a record is selected */}
      {selectedRecord && (
        <div className="flex-shrink-0 overflow-hidden">
          <PaymentPortalDetails
            record={selectedRecord}
            onClose={() => setSelectedRecord(null)}
            onViewCustomer={handleViewCustomer}
          />
        </div>
      )}

      {(selectedCustomer || isLoadingDetails) && (
        <div className="flex-shrink-0 overflow-hidden">
          {isLoadingDetails ? (
            <div className={`w-[600px] h-full flex items-center justify-center border-l ${isDarkMode
              ? 'bg-gray-900 text-white border-white border-opacity-30'
              : 'bg-white text-gray-900 border-gray-300'
              }`}>
              <div className="text-center">
                <div
                  className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
                  style={{ borderBottomColor: colorPalette?.primary || '#7c3aed' }}
                ></div>
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Loading details...</p>
              </div>
            </div>
          ) : selectedCustomer ? (
            <BillingDetails
              billingRecord={convertCustomerDataToBillingDetail(selectedCustomer)}
              onlineStatusRecords={[]}
              onClose={() => setSelectedCustomer(null)}
            />
          ) : null}
        </div>
      )}
      <PaymentPortalFunnelFilter
        isOpen={isFunnelFilterOpen}
        onClose={() => setIsFunnelFilterOpen(false)}
        onApplyFilters={(filters) => {
          setActiveFilters(filters);
          localStorage.setItem('paymentPortalFunnelFilters', JSON.stringify(filters));
          setIsFunnelFilterOpen(false);
        }}
        currentFilters={activeFilters}
      />
    </div>
  );
};

export default PaymentPortal;
