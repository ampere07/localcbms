import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Receipt, Search, ChevronDown, CheckCheck, X, Check, ChevronRight, Menu, FileText, Globe, Filter } from 'lucide-react';
import TransactionListDetails from '../components/TransactionListDetails';
import { transactionService } from '../services/transactionService';
import { getCities, City } from '../services/cityService';
import { getRegions, Region } from '../services/regionService';
import { barangayService, Barangay } from '../services/barangayService';
import LoadingModal from '../components/LoadingModal';
import { settingsColorPaletteService, ColorPalette } from '../services/settingsColorPaletteService';
import { useTransactionStore } from '../store/transactionStore';
import { Transaction } from '../types/transaction';
import BillingDetails from '../components/CustomerDetails';
import { getCustomerDetail, CustomerDetailData } from '../services/customerDetailService';
import { BillingDetailRecord } from '../types/billing';
import TransactionFunnelFilter, { FilterValues } from '../filter/TransactionFunnelFilter';

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
    billingStatus: customerData.billingAccount?.billingStatusId ? `Status ${customerData.billingAccount.billingStatusId}` : '',
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

interface TransactionListProps {
  onNavigate?: (section: string, extra?: string) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({ onNavigate }) => {
  const { transactions, totalCount, isLoading: loading, error, silentRefresh, fetchTransactions } = useTransactionStore();

  // Fetch data on mount if empty
  useEffect(() => {
    if (transactions.length === 0) {
      fetchTransactions();
    }
  }, [fetchTransactions, transactions.length]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sidebarWidth, setSidebarWidth] = useState<number>(256);
  const [isResizingSidebar, setIsResizingSidebar] = useState<boolean>(false);
  const sidebarStartXRef = useRef<number>(0);
  const sidebarStartWidthRef = useRef<number>(0);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Local state for batch approval (kept local as it's UI functionality)
  const [isBatchApproveMode, setIsBatchApproveMode] = useState<boolean>(false);
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<string[]>([]);
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [showFailedModal, setShowFailedModal] = useState<boolean>(false);
  const [approvalMessage, setApprovalMessage] = useState<string>('');
  const [approvalDetails, setApprovalDetails] = useState<any>(null);
  const [colorPalette, setColorPalette] = useState<ColorPalette | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetailData | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  const [customerRefreshKey, setCustomerRefreshKey] = useState<number>(0);
  const [isFunnelFilterOpen, setIsFunnelFilterOpen] = useState<boolean>(false);
  const [activeFilters, setActiveFilters] = useState<FilterValues>(() => {
    const saved = localStorage.getItem('transactionFunnelFilters');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.error('Failed to load filters:', err);
      }
    }
    return {};
  });

  const [cities, setCities] = useState<City[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;



  // Dark mode synchronization logic
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

  // Fetch theme data
  useEffect(() => {
    const fetchThemeData = async () => {
      try {
        const activePalette = await settingsColorPaletteService.getActive();
        setColorPalette(activePalette);
      } catch (err) {
        console.error('Failed to fetch color palette:', err);
      }
    };

    fetchThemeData();
  }, []);

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

  // Idle detection and auto-refresh logic
  useEffect(() => {
    const IDLE_TIME_LIMIT = 15 * 60 * 1000; // 15 minutes
    let idleTimer: NodeJS.Timeout | null = null;

    const refreshData = async () => {
      console.log('User idle for 15 minutes, auto-refreshing transaction data...');
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

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return 'No date';
    try {
      const date = new Date(dateStr);
      // Check if date is valid
      if (isNaN(date.getTime())) return dateStr || 'Invalid Date';

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
      console.warn('Error formatting date:', dateStr, e);
      return dateStr || 'Error';
    }
  };

  const formatCurrency = (amount: number | string | null | undefined) => {
    if (amount === null || amount === undefined || amount === '') return '₱0.00';
    try {
      const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      if (isNaN(numAmount)) return '₱0.00';
      return `₱${numAmount.toFixed(2)}`;
    } catch (e) {
      console.warn('Error formatting currency:', amount, e);
      return '₱0.00';
    }
  };


  // Generate hierarchical location items
  const locationItems = useMemo(() => {
    // Counts for each level
    const regionCounts: Record<string, number> = {};
    const cityCounts: Record<string, number> = {};
    const barangayCounts: Record<string, number> = {};

    // Initialize counts
    regions.forEach(r => regionCounts[r.name] = 0);
    cities.forEach(c => cityCounts[`${c.region_id}_${c.name}`] = 0);
    barangays.forEach(b => barangayCounts[`${b.city_id}_${b.barangay}`] = 0);

    // Count appearances in transactions
    transactions.forEach(transaction => {
      const region = transaction.account?.customer?.region;
      const city = transaction.account?.customer?.city;
      const barangay = transaction.account?.customer?.barangay;

      if (region) regionCounts[region] = (regionCounts[region] || 0) + 1;

      if (city) {
        const matchedCity = cities.find(c => c.name === city);
        if (matchedCity) {
          cityCounts[`${matchedCity.region_id}_${matchedCity.name}`] = (cityCounts[`${matchedCity.region_id}_${matchedCity.name}`] || 0) + 1;
        }
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
      total: transactions.length
    };
  }, [regions, cities, barangays, transactions]);

  const filteredTransactions = useMemo(() => {
    let filtered = transactions.filter(transaction => {
      let matchesLocation = selectedLocation === 'all';

      if (!matchesLocation) {
        if (selectedLocation.startsWith('reg:')) {
          matchesLocation = transaction.account?.customer?.region === selectedLocation.substring(4);
        } else if (selectedLocation.startsWith('city:')) {
          matchesLocation = transaction.account?.customer?.city === selectedLocation.substring(5);
        } else if (selectedLocation.startsWith('brgy:')) {
          matchesLocation = transaction.account?.customer?.barangay === selectedLocation.substring(5);
        }
      }

      const matchesSearch = searchQuery === '' ||
        (transaction.account?.customer?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (transaction.account?.account_no || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (transaction.reference_no || '').toLowerCase().includes(searchQuery.toLowerCase());

      return matchesLocation && matchesSearch;
    });

    // Apply funnel filters
    if (activeFilters && Object.keys(activeFilters).length > 0) {
      filtered = filtered.filter(transaction => {
        return Object.entries(activeFilters).every(([key, filter]: [string, any]) => {
          let recordValue: any;

          // Data mapping for nested fields
          if (key === 'full_name') recordValue = transaction.account?.customer?.full_name;
          else if (key === 'barangay') recordValue = transaction.account?.customer?.barangay;
          else if (key === 'city') recordValue = transaction.account?.customer?.city;
          else if (key === 'region') recordValue = transaction.account?.customer?.region;
          else if (key === 'account_balance') recordValue = transaction.account?.account_balance;
          else recordValue = (transaction as any)[key];

          if (filter.type === 'text') {
            if (!filter.value) return true;
            const value = String(recordValue || '').toLowerCase();
            return value.includes(filter.value.toLowerCase());
          }

          if (filter.type === 'number') {
            const numValue = Number(recordValue);
            if (isNaN(numValue)) return false;
            if (filter.from !== undefined && filter.from !== '' && numValue < Number(filter.from)) return false;
            if (filter.to !== undefined && filter.to !== '' && numValue > Number(filter.to)) return false;
            return true;
          }

          if (filter.type === 'date') {
            if (!recordValue) return false;
            const dateValue = new Date(recordValue).getTime();
            if (filter.from && dateValue < new Date(filter.from).getTime()) return false;
            if (filter.to && dateValue > new Date(filter.to).getTime()) return false;
            return true;
          }

          return true;
        });
      });
    }

    return filtered;
  }, [transactions, selectedLocation, searchQuery, activeFilters]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedLocation, searchQuery, activeFilters]);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTransactions, currentPage]);

  // Use totalCount for total pages if no filter/search is active
  const totalDisplayCount = useMemo(() => {
    if (searchQuery || selectedLocation !== 'all' || Object.keys(activeFilters).length > 0) {
      return filteredTransactions.length;
    }
    return Math.max(totalCount, transactions.length);
  }, [filteredTransactions.length, totalCount, transactions.length, searchQuery, selectedLocation, activeFilters]);

  const totalPages = Math.ceil(totalDisplayCount / itemsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    return (
      <div className={`flex items-center justify-between px-4 py-3 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalDisplayCount)}</span> of <span className="font-medium">{totalDisplayCount}</span> results
        </div>
        <div className="flex items-center space-x-2">
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
        </div>
      </div>
    );
  };

  const handleRowClick = (transaction: Transaction) => {
    if (isBatchApproveMode) {
      if ((transaction.status || '').toLowerCase() === 'pending') {
        toggleTransactionSelection(transaction.id);
      }
    } else {
      setSelectedTransaction(transaction);
      setSelectedCustomer(null);
    }
  };

  const refreshCustomerDetails = async (accountNo: string) => {
    try {
      const detail = await getCustomerDetail(accountNo);
      if (detail) {
        setSelectedCustomer(detail);
        setCustomerRefreshKey(prev => prev + 1);
      }
    } catch (err) {
      console.error('Error refreshing customer details:', err);
    }
  };

  const handleApprovalSuccess = async () => {
    await silentRefresh();
    // Sync selectedTransaction with fresh store data
    if (selectedTransaction) {
      const freshTransactions = useTransactionStore.getState().transactions;
      const updated = freshTransactions.find(t => t.id === selectedTransaction.id);
      if (updated) setSelectedTransaction(updated);
    }
    // Refresh customer panel if open
    if (selectedCustomer) {
      const accountNo = selectedCustomer.billingAccount?.accountNo;
      if (accountNo) await refreshCustomerDetails(accountNo);
    }
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

  const toggleTransactionSelection = (transactionId: string) => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction || (transaction.status || '').toLowerCase() !== 'pending') {
      return;
    }

    setSelectedTransactionIds(prev => {
      if (prev.includes(transactionId)) {
        return prev.filter(id => id !== transactionId);
      } else {
        return [...prev, transactionId];
      }
    });
  };

  const toggleSelectAll = () => {
    const pendingTransactions = filteredTransactions.filter(t => (t.status || '').toLowerCase() === 'pending');
    const pendingTransactionIds = pendingTransactions.map(t => t.id);

    if (selectedTransactionIds.length === pendingTransactionIds.length && pendingTransactionIds.length > 0) {
      setSelectedTransactionIds([]);
    } else {
      setSelectedTransactionIds(pendingTransactionIds);
    }
  };

  const handleCancelApprove = () => {
    setIsBatchApproveMode(false);
    setSelectedTransactionIds([]);
  };

  const handleBatchApprove = async () => {
    if (selectedTransactionIds.length === 0) {
      return;
    }

    setShowConfirmModal(true);
  };

  const confirmBatchApproval = async () => {
    setShowConfirmModal(false);

    try {
      setIsApproving(true);
      // Removed setError(null) as error is now managed by context primarily, though local error handling for this action would be ideal.
      // We'll rely on global error or modal for now.

      const result = await transactionService.batchApproveTransactions(selectedTransactionIds);

      if (result.success) {
        const successCount = result.data?.success?.length || 0;
        const failedCount = result.data?.failed?.length || 0;

        setApprovalDetails(result.data);

        if (failedCount > 0) {
          setApprovalMessage(
            `Batch approval completed with some failures: ${successCount} successful, ${failedCount} failed`
          );
          setShowFailedModal(true);
        } else {
          setApprovalMessage(
            `Successfully approved ${successCount} transaction(s)`
          );
          setShowSuccessModal(true);
        }

        setIsBatchApproveMode(false);
        setSelectedTransactionIds([]);

        // Refresh transactions using context
        await silentRefresh();
        // Refresh customer panel if open
        if (selectedCustomer) {
          const accountNo = selectedCustomer.billingAccount?.accountNo;
          if (accountNo) await refreshCustomerDetails(accountNo);
        }
      } else {
        setApprovalMessage(result.message || 'Failed to approve transactions');
        setShowFailedModal(true);
      }
    } catch (err: any) {
      console.error('Batch approval error:', err);
      setApprovalMessage(`Failed to approve transactions: ${err.message}`);
      setShowFailedModal(true);
    } finally {
      setIsApproving(false);
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

  const StatusText = ({ status }: { status?: string | null }) => {
    let textColor = '';
    const statusLower = (status || '').toLowerCase();

    switch (statusLower) {
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
        {status || 'Unknown'}
      </span>
    );
  };

  return (
    <div className={`h-full flex flex-col md:flex-row overflow-hidden pb-16 md:pb-0 ${isDarkMode ? 'bg-gray-950' : 'bg-gray-50'
      }`}>
      <div className={`hidden md:flex border-r flex-shrink-0 flex-col relative ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
        }`} style={{ width: `${sidebarWidth}px` }}>
        <div className={`p-4 border-b flex-shrink-0 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
          <div className="flex items-center justify-between mb-1">
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Transactions</h2>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
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
              color: colorPalette?.primary || '#fb923c'
            } : {}}
          >
            <div className="flex items-center">
              <Receipt className="h-4 w-4 mr-2" />
              <span>All Transactions</span>
            </div>
            <span
              className={`px-2 py-1 rounded-full text-xs ${selectedLocation === 'all'
                ? 'text-white'
                : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                }`}
              style={selectedLocation === 'all' ? {
                backgroundColor: colorPalette?.primary || '#ea580c'
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
                  color: colorPalette?.primary || '#fb923c'
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
                  <Receipt className="h-4 w-4 mr-2" />
                  <span>{region.name}</span>
                </div>
                {region.count > 0 && (
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${selectedLocation === region.id
                      ? 'text-white'
                      : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                      }`}
                    style={selectedLocation === region.id ? {
                      backgroundColor: colorPalette?.primary || '#ea580c'
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
                      color: colorPalette?.primary || '#fb923c'
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
                        color: colorPalette?.primary || '#fb923c',
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

        <div
          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize transition-colors z-10"
          style={{
            backgroundColor: isResizingSidebar ? (colorPalette?.primary || '#ea580c') : 'transparent'
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

      <div className={`overflow-hidden flex-1 flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
        }`}>
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
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full rounded pl-10 pr-4 py-2 focus:outline-none focus:ring-1 focus:border ${isDarkMode
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
              <Search className={`absolute left-3 top-2.5 h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
            </div>
            <button
              onClick={() => isBatchApproveMode ? handleCancelApprove() : setIsBatchApproveMode(true)}
              className="px-4 py-2 rounded flex items-center transition-colors text-white"
              style={{
                backgroundColor: isBatchApproveMode ? '#dc2626' : (colorPalette?.primary || '#ea580c')
              }}
              onMouseEnter={(e) => {
                if (isBatchApproveMode) {
                  e.currentTarget.style.backgroundColor = '#b91c1c';
                } else if (colorPalette?.accent) {
                  e.currentTarget.style.backgroundColor = colorPalette.accent;
                }
              }}
              onMouseLeave={(e) => {
                if (isBatchApproveMode) {
                  e.currentTarget.style.backgroundColor = '#dc2626';
                } else if (colorPalette?.primary) {
                  e.currentTarget.style.backgroundColor = colorPalette.primary;
                }
              }}
            >
              {isBatchApproveMode ? (
                <>
                  <X className="h-4 w-4 mr-2" />
                  <span>Cancel Approve</span>
                </>
              ) : (
                <>
                  <CheckCheck className="h-4 w-4 mr-2" />
                  <span>Batch Approve</span>
                </>
              )}
            </button>
            {isBatchApproveMode && (
              <button
                onClick={handleBatchApprove}
                disabled={selectedTransactionIds.length === 0 || isApproving}
                className={`px-4 py-2 rounded flex items-center transition-colors ${selectedTransactionIds.length === 0 || isApproving
                  ? isDarkMode
                    ? 'bg-gray-700 text-gray-500 border border-gray-600 cursor-not-allowed'
                    : 'bg-gray-300 text-gray-500 border border-gray-400 cursor-not-allowed'
                  : isDarkMode
                    ? 'bg-green-600 text-white border border-green-700 hover:bg-green-700'
                    : 'bg-green-500 text-white border border-green-600 hover:bg-green-600'
                  }`}
              >
                <Check className="h-4 w-4 mr-2" />
                <span>{isApproving ? 'Approving...' : `Approve (${selectedTransactionIds.length})`}</span>
              </button>
            )}
            <button
              onClick={() => setIsFunnelFilterOpen(true)}
              className={`px-4 py-2 rounded text-sm transition-colors flex items-center ${isDarkMode
                ? 'hover:bg-gray-700 text-white'
                : 'hover:bg-gray-200 text-gray-900 border border-gray-300'
                }`}
            >
              <Filter className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-x-auto overflow-y-auto">
            {loading ? (
              <div className={`px-4 py-12 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <div className="animate-pulse flex flex-col items-center">
                  <div className={`h-4 w-1/3 rounded mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                  <div className={`h-4 w-1/2 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                </div>
                <p className="mt-4">Loading transactions...</p>
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
                    {isBatchApproveMode && (
                      <th className={`px-4 py-3 text-left ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                        <input
                          type="checkbox"
                          checked={
                            selectedTransactionIds.length > 0 &&
                            selectedTransactionIds.length === filteredTransactions.filter(t => (t.status || '').toLowerCase() === 'pending').length &&
                            filteredTransactions.filter(t => (t.status || '').toLowerCase() === 'pending').length > 0
                          }
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                          style={{
                            accentColor: colorPalette?.primary || '#ea580c'
                          }}
                        />
                      </th>
                    )}
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>Date Processed</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>Status</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>Account No.</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>Received Payment</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>Payment Method</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>Processed By</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>Full Name</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>OR No.</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>Reference No.</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>Remarks</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>Transaction Type</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>Image</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>Barangay</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>Contact No</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>Payment Date</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>City</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>Plan</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>Balance Before</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>Approved By</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>Account Balance</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>Created At</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>Updated At</th>
                  </tr>
                </thead>
                <tbody className={`${isDarkMode ? 'bg-gray-900 divide-y divide-gray-800' : 'bg-white divide-y divide-gray-200'
                  }`}>
                  {paginatedTransactions.length > 0 ? (
                    paginatedTransactions.map((transaction) => {
                      const isSelected = selectedTransactionIds.includes(transaction.id);
                      const isPending = (transaction.status || '').toLowerCase() === 'pending';
                      const canSelect = isBatchApproveMode && isPending;

                      return (
                        <tr
                          key={transaction.id}
                          className={`${canSelect ? 'cursor-pointer' : isBatchApproveMode ? 'cursor-not-allowed' : 'cursor-pointer'
                            } ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                            } ${!isSelected && selectedTransaction?.id === transaction.id
                              ? (isDarkMode ? 'bg-gray-800' : 'bg-gray-100')
                              : !isSelected && isBatchApproveMode && !isPending
                                ? (isDarkMode ? 'bg-gray-800 opacity-50' : 'bg-gray-200 opacity-50')
                                : ''
                            }`}
                          style={isSelected ? {
                            backgroundColor: colorPalette?.primary ? `${colorPalette.primary}33` : 'rgba(249, 115, 22, 0.2)'
                          } : {}}
                          onClick={() => handleRowClick(transaction)}
                        >
                          {isBatchApproveMode && (
                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleTransactionSelection(transaction.id)}
                                disabled={!isPending}
                                className={`w-4 h-4 rounded border-gray-300 ${isPending ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                                  }`}
                                style={{
                                  accentColor: colorPalette?.primary || '#ea580c'
                                }}
                              />
                            </td>
                          )}
                          <td className={`px-4 py-3 whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>{formatDate(transaction.date_processed)}</td>
                          <td className="px-4 py-3 whitespace-nowrap"><StatusText status={transaction.status} /></td>
                          <td className="px-4 py-3 whitespace-nowrap text-red-400 font-medium">{transaction.account?.account_no || '-'}</td>
                          <td className={`px-4 py-3 whitespace-nowrap font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>{formatCurrency(transaction.received_payment)}</td>
                          <td className={`px-4 py-3 whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>{transaction.payment_method_info?.payment_method || transaction.payment_method}</td>
                          <td className={`px-4 py-3 whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>{transaction.processed_by_user || '-'}</td>
                          <td className={`px-4 py-3 whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>{transaction.account?.customer?.full_name || '-'}</td>
                          <td className={`px-4 py-3 whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>{transaction.or_no}</td>
                          <td className={`px-4 py-3 whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>{transaction.reference_no}</td>
                          <td className={`px-4 py-3 max-w-xs truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>{transaction.remarks || 'No remarks'}</td>
                          <td className={`px-4 py-3 whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>{transaction.transaction_type}</td>
                          <td className={`px-4 py-3 whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>{transaction.image_url ? 'Yes' : '-'}</td>
                          <td className={`px-4 py-3 whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>{transaction.account?.customer?.barangay || '-'}</td>
                          <td className={`px-4 py-3 whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>{transaction.account?.customer?.contact_number_primary || '-'}</td>
                          <td className={`px-4 py-3 whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>{formatDate(transaction.payment_date)}</td>
                          <td className={`px-4 py-3 whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>{transaction.account?.customer?.city || '-'}</td>
                          <td className={`px-4 py-3 whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>{transaction.account?.customer?.desired_plan || '-'}</td>
                          <td className={`px-4 py-3 whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>{formatCurrency(transaction.account_balance_before || 0)}</td>
                          <td className={`px-4 py-3 whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>{transaction.approved_by || '-'}</td>
                          <td className={`px-4 py-3 whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>{formatCurrency(transaction.account?.account_balance || 0)}</td>
                          <td className={`px-4 py-3 whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>{formatDate(transaction.created_at)}</td>
                          <td className={`px-4 py-3 whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>{formatDate(transaction.updated_at)}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={isBatchApproveMode ? 21 : 20} className={`px-4 py-12 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                        {filteredTransactions.length > 0
                          ? 'No transactions found matching your filters'
                          : (totalCount > transactions.length)
                            ? 'Loading more records... please wait.'
                            : 'No transactions found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
          <PaginationControls />
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
                  color: colorPalette?.primary || '#fb923c',
                  fontWeight: 500
                } : {
                  color: isDarkMode ? '#d1d5db' : '#374151'
                }}
              >
                <div className="flex items-center">
                  <Receipt className="h-4 w-4 mr-2" />
                  <span>All Transactions</span>
                </div>
                <span className="px-2 py-1 rounded-full text-xs bg-gray-700 text-gray-300">
                  {locationItems.total}
                </span>
              </button>

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
                      color: colorPalette?.primary || '#fb923c',
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
                      <Receipt className="h-4 w-4 mr-2" />
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
                          color: colorPalette?.primary || '#fb923c'
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
                            color: colorPalette?.primary || '#fb923c',
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

      {selectedTransaction && (
        <div className="flex-shrink-0 overflow-hidden">
          <TransactionListDetails
            transaction={selectedTransaction}
            onClose={() => setSelectedTransaction(null)}
            onNavigate={onNavigate}
            onViewCustomer={handleViewCustomer}
            onApprovalSuccess={handleApprovalSuccess}
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
                  style={{ borderBottomColor: colorPalette?.primary || '#ea580c' }}
                ></div>
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Loading details...</p>
              </div>
            </div>
          ) : selectedCustomer ? (
            <BillingDetails
              billingRecord={convertCustomerDataToBillingDetail(selectedCustomer)}
              onlineStatusRecords={[]}
              onClose={() => setSelectedCustomer(null)}
              onRefresh={async () => {
                const accountNo = selectedCustomer.billingAccount?.accountNo;
                if (accountNo) await refreshCustomerDetails(accountNo);
              }}
              refreshKey={customerRefreshKey}
            />
          ) : null}
        </div>
      )}

      <LoadingModal
        isOpen={isApproving}
        message="Approving transactions..."
        percentage={50}
      />

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 max-w-md w-full mx-4 border ${isDarkMode
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-300'
            }`}>
            <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Confirm Batch Approval</h3>
            <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
              Are you sure you want to approve {selectedTransactionIds.length} transaction(s)? This will update account balances and apply payments to invoices.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmBatchApproval}
                className="text-white px-6 py-2 rounded transition-colors"
                style={{
                  backgroundColor: colorPalette?.primary || '#22c55e'
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
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 max-w-md w-full mx-4 border ${isDarkMode
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-300'
            }`}>
            <h3 className={`text-xl font-semibold mb-4 text-green-500`}>Success</h3>
            <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>{approvalMessage}</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {showFailedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 max-w-2xl w-full mx-4 border ${isDarkMode
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-300'
            }`}>
            <h3 className={`text-xl font-semibold mb-4 text-red-500`}>Batch Approval Results</h3>
            <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>{approvalMessage}</p>

            {approvalDetails && approvalDetails.failed && approvalDetails.failed.length > 0 && (
              <div className={`mb-6 p-4 rounded max-h-96 overflow-y-auto ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'
                }`}>
                <h4 className={`font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>Failed Transactions:</h4>
                <ul className="space-y-2">
                  {approvalDetails.failed.map((fail: any, index: number) => (
                    <li key={index} className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                      <span className="font-medium">ID: {fail.transaction_id}</span> - {fail.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowFailedModal(false)}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      <TransactionFunnelFilter
        isOpen={isFunnelFilterOpen}
        onClose={() => setIsFunnelFilterOpen(false)}
        onApplyFilters={(filters) => {
          setActiveFilters(filters);
          localStorage.setItem('transactionFunnelFilters', JSON.stringify(filters));
          setIsFunnelFilterOpen(false);
        }}
        currentFilters={activeFilters}
      />
    </div >
  );
};

export default TransactionList;
