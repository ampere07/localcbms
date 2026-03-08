import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, ArrowUp, ArrowDown, ListFilter, ChevronsLeft, ChevronsRight } from 'lucide-react';
import InvoiceDetails from '../components/InvoiceDetails';

import { settingsColorPaletteService, ColorPalette } from '../services/settingsColorPaletteService';
import { paymentService, PendingPayment } from '../services/paymentService';
import { useInvoiceStore, InvoiceRecordUI } from '../store/invoiceStore';
import BillingDetails from '../components/CustomerDetails';
import { getCustomerDetail, CustomerDetailData } from '../services/customerDetailService';
import { BillingDetailRecord } from '../types/billing';
import InvoiceFunnelFilter, { FilterValues } from '../filter/InvoiceFunnelFilter';
import pusher from '../services/pusherService';
import { Filter } from 'lucide-react';

// Removed local InvoiceRecordUI interface

// Removed local InvoiceRecordUI interface

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

const Invoice: React.FC = () => {
  const { invoiceRecords, totalCount, isLoading, error, fetchInvoiceRecords, refreshInvoiceRecords, silentRefresh } = useInvoiceStore();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sidebarWidth, setSidebarWidth] = useState<number>(256);
  const [isResizingSidebar, setIsResizingSidebar] = useState<boolean>(false);
  const sidebarStartXRef = useRef<number>(0);
  const sidebarStartWidthRef = useRef<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedRecord, setSelectedRecord] = useState<InvoiceRecordUI | null>(null);
  // Removed local invoiceRecords, isLoading, error state
  const [colorPalette, setColorPalette] = useState<ColorPalette | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [accountNo, setAccountNo] = useState<string>('');
  const [accountBalance, setAccountBalance] = useState<number>(0);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetailData | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState<boolean>(false);
  const [showPaymentVerifyModal, setShowPaymentVerifyModal] = useState<boolean>(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [fullName, setFullName] = useState<string>('');
  const [showPaymentLinkModal, setShowPaymentLinkModal] = useState<boolean>(false);
  const [paymentLinkData, setPaymentLinkData] = useState<{ referenceNo: string; amount: number; paymentUrl: string } | null>(null);
  const [showPendingPaymentModal, setShowPendingPaymentModal] = useState<boolean>(false);
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Table State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [sortColumn, setSortColumn] = useState<string | null>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const startWidthRef = useRef<number>(0);
  const startXRef = useRef<number>(0);
  const [isFunnelFilterOpen, setIsFunnelFilterOpen] = useState<boolean>(false);
  const [activeFilters, setActiveFilters] = useState<FilterValues>(() => {
    const saved = localStorage.getItem('invoiceFunnelFilters');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.error('Failed to load filters:', err);
      }
    }
    return {};
  });
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  const allColumns = [
    { key: 'id', label: 'ID', width: 'min-w-20' },
    { key: 'accountNo', label: 'Account Number', width: 'min-w-36' },
    { key: 'invoiceDate', label: 'Invoice Date', width: 'min-w-36' },
    { key: 'invoiceBalance', label: 'Invoice Balance', width: 'min-w-36' },
    { key: 'serviceCharge', label: 'Service Charge', width: 'min-w-36' },
    { key: 'rebate', label: 'Rebate', width: 'min-w-28' },
    { key: 'discounts', label: 'Discounts', width: 'min-w-28' },
    { key: 'staggered', label: 'Staggered', width: 'min-w-28' },
    { key: 'totalAmount', label: 'Total Amount', width: 'min-w-32' },
    { key: 'receivedPayment', label: 'Received Payment', width: 'min-w-36' },
    { key: 'dueDate', label: 'Due Date', width: 'min-w-32' },
    { key: 'status', label: 'Status', width: 'min-w-28' },
    { key: 'paymentPortalLogRef', label: 'Payment Portal Log Ref', width: 'min-w-44' },
    { key: 'transactionId', label: 'Transaction ID', width: 'min-w-36' },
    { key: 'createdAt', label: 'Created At', width: 'min-w-40' },
    { key: 'createdBy', label: 'Created By', width: 'min-w-32' },
    { key: 'updatedAt', label: 'Updated At', width: 'min-w-40' },
    { key: 'updatedBy', label: 'Updated By', width: 'min-w-32' },
    { key: 'fullName', label: 'Full Name', width: 'min-w-40' },
    { key: 'contactNumber', label: 'Contact Number', width: 'min-w-36' },
    { key: 'emailAddress', label: 'Email Address', width: 'min-w-48' },
    { key: 'address', label: 'Address', width: 'min-w-56' },
    { key: 'plan', label: 'Plan', width: 'min-w-32' },
    { key: 'dateInstalled', label: 'Date Installed', width: 'min-w-32' },
    { key: 'barangay', label: 'Barangay', width: 'min-w-32' },
    { key: 'city', label: 'City', width: 'min-w-32' },
    { key: 'region', label: 'Region', width: 'min-w-32' },
  ];

  const customerColumns = [
    { key: 'id', label: 'ID', width: 'min-w-20' },
    { key: 'invoiceDate', label: 'Invoice Date', width: 'min-w-36' },
    { key: 'dueDate', label: 'Due Date', width: 'min-w-32' },
    { key: 'totalAmount', label: 'Total Amount', width: 'min-w-32' },
    { key: 'status', label: 'Status', width: 'min-w-28' },
  ];

  const displayColumns = userRole === 'customer' ? customerColumns : allColumns;

  // Derive date items from context data instead of fetching separately or static
  const dateItems: Array<{ date: string; id: string }> = useMemo(() => {
    const dates = new Map<string, string>();
    invoiceRecords.forEach(record => {
      if (record.invoiceDate && record.invoiceDate !== 'N/A') {
        // Map formatted date to raw date for sorting
        dates.set(record.invoiceDate, record.invoiceDateRaw || record.invoiceDate);
      }
    });

    const sortedDates = Array.from(dates.entries())
      .sort((a, b) => {
        const timeA = new Date(a[1]).getTime();
        const timeB = new Date(b[1]).getTime();
        return timeB - timeA;
      })
      .map(([formatted]) => formatted);

    return [{ date: 'All', id: '' }, ...sortedDates.map(d => ({ date: d, id: d }))];
  }, [invoiceRecords]);

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
    const authData = localStorage.getItem('authData');
    if (authData) {
      try {
        const user = JSON.parse(authData);
        setUserRole(user.role?.toLowerCase() || '');
        setAccountNo(user.username || ''); // username IS the account_no
        const balance = parseFloat(user.account_balance || '0');
        setAccountBalance(balance);
        setPaymentAmount(balance > 0 ? balance : 100); // Default to 100 if no balance
        setFullName(user.full_name || '');
      } catch (error) {
        console.error('Error parsing auth data:', error);
      }
    }
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

  // Initial data fetch
  useEffect(() => {
    fetchInvoiceRecords();
  }, [fetchInvoiceRecords]);

  // Pusher/Soketi connection for real-time invoice updates
  useEffect(() => {
    const handleUpdate = async (data: any) => {
      console.log('[Invoice Soketi] Update received, refreshing:', data);
      try {
        await fetchInvoiceRecords(true);
        console.log('[Invoice Soketi] Data refreshed successfully');
      } catch (err) {
        console.error('[Invoice Soketi] Failed to refresh data:', err);
      }
    };

    const invoiceChannel = pusher.subscribe('invoices');

    invoiceChannel.bind('invoice-updated', handleUpdate);

    return () => {
      invoiceChannel.unbind('invoice-updated', handleUpdate);
      pusher.unsubscribe('invoices');
    };
  }, [fetchInvoiceRecords]);

  // Idle detection and auto-refresh logic
  useEffect(() => {
    const IDLE_TIME_LIMIT = 15 * 60 * 1000; // 15 minutes
    let idleTimer: NodeJS.Timeout | null = null;

    const refreshData = async () => {
      console.log('User idle for 15 minutes, auto-refreshing Invoice data...');
      try {
        await refreshInvoiceRecords();
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
  }, [refreshInvoiceRecords]);

  // Initialize column order and visibility
  useEffect(() => {
    if (displayColumns.length > 0) {
      if (columnOrder.length === 0) {
        setColumnOrder(displayColumns.map(col => col.key));
      }
      if (visibleColumns.length === 0) {
        setVisibleColumns(displayColumns.map(col => col.key));
      }
    }
  }, [displayColumns, columnOrder.length, visibleColumns.length]);

  // Handle click outside for filter dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setFilterDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [filterDropdownRef]);




  const filteredRecords = useMemo(() => {
    let filtered = invoiceRecords.filter(record => {
      const matchesDate = selectedDate === 'All' || record.invoiceDate === selectedDate;
      const checkValue = (val: any): boolean => {
        if (val === null || val === undefined) return false;
        if (typeof val === 'object') {
          return Object.values(val).some(v => checkValue(v));
        }
        return String(val).toLowerCase().includes(searchQuery.toLowerCase());
      };

      const matchesSearch = searchQuery === '' || checkValue(record);

      return matchesDate && matchesSearch;
    });

    // Apply funnel filters
    if (activeFilters && Object.keys(activeFilters).length > 0) {
      filtered = filtered.filter(record => {
        return Object.entries(activeFilters).every(([key, filter]: [string, any]) => {
          const recordValue = (record as any)[key];

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

    // Sorting logic
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any = (a as any)[sortColumn] || '';
        let bValue: any = (b as any)[sortColumn] || '';

        // Handle numeric values
        const numericColumns = [
          'invoiceBalance', 'serviceCharge', 'rebate', 'discounts', 'staggered', 'totalAmount', 'receivedPayment'
        ];

        if (numericColumns.includes(sortColumn)) {
          aValue = Number(aValue) || 0;
          bValue = Number(bValue) || 0;
        } else if (sortColumn === 'invoiceDate' || sortColumn === 'dueDate' || sortColumn === 'createdAt' || sortColumn === 'updatedAt') {
          // Use raw date for sorting if available
          if (sortColumn === 'invoiceDate') {
            aValue = a.invoiceDateRaw || a.invoiceDate || '';
            bValue = b.invoiceDateRaw || b.invoiceDate || '';
          }
          aValue = new Date(aValue).getTime() || 0;
          bValue = new Date(bValue).getTime() || 0;
        } else {
          aValue = String(aValue).toLowerCase();
          bValue = String(bValue).toLowerCase();
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [invoiceRecords, selectedDate, searchQuery, sortColumn, sortDirection, activeFilters]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDate, searchQuery, itemsPerPage]);

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

  const totalDisplayCount = useMemo(() => {
    if (selectedDate === 'All' && searchQuery === '' && Object.keys(activeFilters).length === 0) {
      return totalCount;
    }
    return filteredRecords.length;
  }, [filteredRecords.length, totalCount, selectedDate, searchQuery, activeFilters]);

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

  const handleRowClick = (record: InvoiceRecordUI) => {
    if (userRole !== 'customer') {
      setSelectedRecord(record);
      setSelectedCustomer(null); // Clear customer view when switching records
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

  const handleCloseDetails = () => {
    setSelectedRecord(null);
  };

  const handleRefresh = async () => {
    await refreshInvoiceRecords();
  };

  const handlePayNow = async () => {
    setErrorMessage('');
    setIsPaymentProcessing(true);

    try {
      const pending = await paymentService.checkPendingPayment(accountNo);

      if (pending && pending.payment_url) {
        setPendingPayment(pending);
        setShowPendingPaymentModal(true);
      } else {
        setPaymentAmount(accountBalance > 0 ? accountBalance : 100);
        setShowPaymentVerifyModal(true);
      }
    } catch (error: any) {
      console.error('Error checking pending payment:', error);
      setPaymentAmount(accountBalance > 0 ? accountBalance : 100);
      setShowPaymentVerifyModal(true);
    } finally {
      setIsPaymentProcessing(false);
    }
  };

  const handleCloseVerifyModal = () => {
    setShowPaymentVerifyModal(false);
    setPaymentAmount(accountBalance);
  };

  const handleProceedToCheckout = async () => {
    if (paymentAmount < 1) {
      setErrorMessage('Payment amount must be at least ₱1.00');
      return;
    }

    if (isPaymentProcessing) {
      return;
    }

    setIsPaymentProcessing(true);
    setErrorMessage('');

    try {
      const response = await paymentService.createPayment(accountNo, paymentAmount);

      if (response.status === 'success' && response.payment_url) {
        setShowPaymentVerifyModal(false);
        setPaymentLinkData({
          referenceNo: response.reference_no || '',
          amount: response.amount || paymentAmount,
          paymentUrl: response.payment_url
        });
        setShowPaymentLinkModal(true);
      } else {
        throw new Error(response.message || 'Failed to create payment link');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      setErrorMessage(error.message || 'Failed to create payment. Please try again.');
    } finally {
      setIsPaymentProcessing(false);
    }
  };

  const handleOpenPaymentLink = () => {
    if (paymentLinkData?.paymentUrl) {
      window.open(paymentLinkData.paymentUrl, '_blank');
      setShowPaymentLinkModal(false);
      setPaymentLinkData(null);
    }
  };

  const handleCancelPaymentLink = () => {
    setShowPaymentLinkModal(false);
    setPaymentLinkData(null);
  };

  const handleResumePendingPayment = () => {
    if (pendingPayment && pendingPayment.payment_url) {
      window.open(pendingPayment.payment_url, '_blank');
      setShowPendingPaymentModal(false);
      setPendingPayment(null);
    }
  };

  const handleCancelPendingPayment = () => {
    setShowPendingPaymentModal(false);
    setPendingPayment(null);
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

  const handleToggleColumn = (columnKey: string) => {
    setVisibleColumns(prev => {
      const newColumns = prev.includes(columnKey)
        ? prev.filter(key => key !== columnKey)
        : [...prev, columnKey];
      return newColumns;
    });
  };

  const handleSelectAllColumns = () => {
    const allKeys = displayColumns.map(col => col.key);
    setVisibleColumns(allKeys);
  };

  const handleDeselectAllColumns = () => {
    setVisibleColumns([]);
  };

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection('asc');
      } else {
        setSortDirection('desc');
      }
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const handleDragStart = (e: React.DragEvent, columnKey: string) => {
    setDraggedColumn(columnKey);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedColumn && draggedColumn !== columnKey) {
      setDragOverColumn(columnKey);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, targetColumnKey: string) => {
    e.preventDefault();

    if (!draggedColumn || draggedColumn === targetColumnKey) {
      setDraggedColumn(null);
      setDragOverColumn(null);
      return;
    }

    const newOrder = [...columnOrder];
    const draggedIndex = newOrder.indexOf(draggedColumn);
    const targetIndex = newOrder.indexOf(targetColumnKey);

    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedColumn);

    setColumnOrder(newOrder);
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  const handleDragEnd = () => {
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  const handleMouseDownResize = (e: React.MouseEvent, columnKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColumn(columnKey);
    startXRef.current = e.clientX;

    const th = (e.target as HTMLElement).closest('th');
    if (th) {
      startWidthRef.current = th.offsetWidth;
    }
  };

  useEffect(() => {
    if (!resizingColumn) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingColumn) return;

      const diff = e.clientX - startXRef.current;
      const newWidth = Math.max(100, startWidthRef.current + diff);

      setColumnWidths(prev => ({
        ...prev,
        [resizingColumn]: newWidth
      }));
    };

    const handleMouseUp = () => {
      setResizingColumn(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingColumn]);

  const filteredColumns = displayColumns
    .filter(col => visibleColumns.includes(col.key))
    .sort((a, b) => {
      const indexA = columnOrder.indexOf(a.key);
      const indexB = columnOrder.indexOf(b.key);
      return indexA - indexB;
    });

  const renderCellValue = (record: InvoiceRecordUI, columnKey: string) => {
    switch (columnKey) {
      case 'id':
        return record.id;
      case 'status':
        return (
          <span className={`${record.status === 'Unpaid' ? 'text-red-500' :
            record.status === 'Paid' ? 'text-green-500' :
              'text-yellow-500'
            }`}>
            {record.status}
          </span>
        );
      case 'accountNo':
        return <span className="text-red-400">{record.accountNo}</span>;
      case 'invoiceDate':
        return record.invoiceDate;
      case 'invoiceBalance':
        return `₱ ${(record.invoiceBalance ?? 0).toFixed(2)}`;
      case 'serviceCharge':
        return `₱ ${(record.serviceCharge ?? 0).toFixed(2)}`;
      case 'rebate':
        return `₱ ${(record.rebate ?? 0).toFixed(2)}`;
      case 'discounts':
        return `₱ ${(record.discounts ?? 0).toFixed(2)}`;
      case 'staggered':
        return `₱ ${(record.staggered ?? 0).toFixed(2)}`;
      case 'totalAmount':
        return `₱ ${(record.totalAmount ?? 0).toFixed(2)}`;
      case 'receivedPayment':
        return `₱ ${(record.receivedPayment ?? 0).toFixed(2)}`;
      case 'dueDate':
        return record.dueDate || '-';
      case 'paymentPortalLogRef':
        return record.paymentPortalLogRef || 'NULL';
      case 'transactionId':
        return record.transactionId || 'NULL';
      case 'createdAt':
        return record.createdAt || '-';
      case 'createdBy':
        return record.createdBy || '-';
      case 'updatedAt':
        return record.updatedAt || '-';
      case 'updatedBy':
        return record.updatedBy || '-';
      case 'fullName':
        return record.fullName || '-';
      case 'contactNumber':
        return record.contactNumber || '-';
      case 'emailAddress':
        return record.emailAddress || '-';
      case 'address':
        return <span title={record.address}>{record.address || '-'}</span>;
      case 'plan':
        return record.plan || '-';
      case 'dateInstalled':
        return record.dateInstalled || '-';
      case 'barangay':
        return record.barangay || '-';
      case 'city':
        return record.city || '-';
      case 'region':
        return record.region || '-';
      default:
        return '-';
    }
  };

  return (
    <div className={`h-full flex flex-col md:flex-row overflow-hidden pb-16 md:pb-0 ${isDarkMode ? 'bg-gray-950' : 'bg-gray-50'
      }`}>
      {userRole !== 'customer' && (
        <div className={`hidden md:flex border-r flex-shrink-0 flex flex-col relative ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
          }`} style={{ width: `${sidebarWidth}px` }}>
          <div className={`p-4 border-b flex-shrink-0 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
            <div className="flex items-center justify-between mb-1">
              <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Invoice</h2>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {dateItems.map((item, index) => (
              <button
                key={index}
                onClick={() => setSelectedDate(item.date)}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                  } ${selectedDate === item.date
                    ? ''
                    : isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                style={selectedDate === item.date ? {
                  backgroundColor: colorPalette?.primary ? `${colorPalette.primary}33` : 'rgba(249, 115, 22, 0.2)',
                  color: colorPalette?.primary || '#7c3aed'
                } : {}}
              >
                <span className="text-sm font-medium flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                  {item.date}
                </span>
              </button>
            ))}
          </div>

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
      )}

      <div className={`flex-1 overflow-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
        }`}>
        <div className="flex flex-col h-full">
          <div className={`p-4 border-b flex-shrink-0 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
            }`}>
            <div className="flex items-center space-x-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search Invoice records..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full rounded pl-10 pr-4 py-2 focus:outline-none focus:ring-1 focus:border ${isDarkMode
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
              </div>
              <button
                onClick={() => setIsFunnelFilterOpen(true)}
                className={`px-4 py-2 rounded text-sm transition-colors flex items-center ${isDarkMode
                  ? 'hover:bg-gray-700 text-white'
                  : 'hover:bg-gray-200 text-gray-900'
                  }`}
              >
                <Filter className="h-5 w-5" />
              </button>

              {userRole !== 'customer' && (
                <div className="relative" ref={filterDropdownRef}>
                  <button
                    className={`px-4 py-2 rounded text-sm transition-colors flex items-center ${isDarkMode
                      ? 'hover:bg-gray-700 text-white'
                      : 'hover:bg-gray-200 text-gray-900'
                      }`}
                    onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                  >
                    <ListFilter className="h-5 w-5" />
                  </button>
                  {filterDropdownOpen && (
                    <div className={`absolute top-full right-0 mt-2 w-80 rounded shadow-lg z-50 max-h-[70vh] flex flex-col ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                      }`}>
                      <div className={`p-3 border-b flex items-center justify-between ${isDarkMode ? 'border-gray-700' : 'border-gray-200'
                        }`}>
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>Column Visibility</span>
                        <div className="flex space-x-2">
                          <button
                            onClick={handleSelectAllColumns}
                            className="text-xs"
                            style={{ color: colorPalette?.primary || '#7c3aed' }}
                          >
                            Select All
                          </button>
                          <span className={isDarkMode ? 'text-gray-600' : 'text-gray-400'}>|</span>
                          <button
                            onClick={handleDeselectAllColumns}
                            className="text-xs"
                            style={{ color: colorPalette?.primary || '#7c3aed' }}
                          >
                            Deselect All
                          </button>
                        </div>
                      </div>
                      <div className="overflow-y-auto flex-1">
                        {displayColumns.map((column) => (
                          <label
                            key={column.key}
                            className={`flex items-center px-4 py-2 cursor-pointer text-sm ${isDarkMode
                              ? 'hover:bg-gray-700 text-white'
                              : 'hover:bg-gray-100 text-gray-900'
                              }`}
                          >
                            <input
                              type="checkbox"
                              checked={visibleColumns.includes(column.key)}
                              onChange={() => handleToggleColumn(column.key)}
                              className={`mr-3 h-4 w-4 rounded ${isDarkMode
                                ? 'border-gray-600 bg-gray-700 focus:ring-offset-gray-800'
                                : 'border-gray-300 bg-white focus:ring-offset-white'
                                }`}
                              style={{
                                accentColor: colorPalette?.primary || '#7c3aed'
                              }}
                            />
                            <span>{column.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {userRole === 'customer' && (
                <button
                  onClick={handlePayNow}
                  disabled={isPaymentProcessing}
                  className="text-white px-4 py-2 rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: isPaymentProcessing ? '#6b7280' : (colorPalette?.primary || '#7c3aed')
                  }}
                  onMouseEnter={(e) => {
                    if (!isPaymentProcessing && colorPalette?.accent) {
                      e.currentTarget.style.backgroundColor = colorPalette.accent;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isPaymentProcessing && colorPalette?.primary) {
                      e.currentTarget.style.backgroundColor = colorPalette.primary;
                    }
                  }}
                >
                  {isPaymentProcessing ? 'Processing...' : 'Pay Now'}
                </button>
              )}
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="text-white px-4 py-2 rounded text-sm transition-colors disabled:bg-gray-600"
                style={{
                  backgroundColor: isLoading ? '#4b5563' : (colorPalette?.primary || '#7c3aed')
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

          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-hidden">
              {isLoading ? (
                <div className={`px-4 py-12 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                  <div className="animate-pulse flex flex-col items-center">
                    <div className={`h-4 w-1/3 rounded mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
                      }`}></div>
                    <div className={`h-4 w-1/2 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
                      }`}></div>
                  </div>
                  <p className="mt-4">Loading Invoice records...</p>
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
              ) : (
                <>
                  <div className="h-full relative flex flex-col">
                    <div className="flex-1 overflow-auto" ref={scrollRef}>
                      <table className="w-max min-w-full text-sm border-separate border-spacing-0">
                        <thead>
                          <tr className={`border-b sticky top-0 z-10 ${isDarkMode
                            ? 'border-gray-700 bg-gray-800'
                            : 'border-gray-200 bg-gray-100'
                            }`}>
                            {filteredColumns.map((column, index) => (
                              <th
                                key={column.key}
                                draggable
                                onDragStart={(e) => handleDragStart(e, column.key)}
                                onDragOver={(e) => handleDragOver(e, column.key)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, column.key)}
                                onDragEnd={handleDragEnd}
                                onClick={() => handleSort(column.key)}
                                className={`group relative text-left py-3 px-3 font-normal whitespace-nowrap cursor-pointer select-none transition-colors ${isDarkMode ? 'text-gray-400 bg-gray-800 hover:bg-gray-700' : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                                  } ${index < filteredColumns.length - 1 ? (isDarkMode ? 'border-r border-gray-700' : 'border-r border-gray-200') : ''
                                  } ${dragOverColumn === column.key ? 'border-l-2 border-[#7c3aed]' : ''
                                  } ${draggedColumn === column.key ? 'opacity-50' : ''}`}
                                style={{
                                  width: columnWidths[column.key] ? `${columnWidths[column.key]}px` : undefined,
                                  minWidth: columnWidths[column.key] ? `${columnWidths[column.key]}px` : (column.width === 'min-w-max' ? 'max-content' : undefined)
                                }}
                              >
                                <div className="flex items-center space-x-1">
                                  <span>{column.label}</span>
                                  {sortColumn === column.key && (
                                    sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                                  )}
                                </div>
                                {/* Resize Handle */}
                                <div
                                  className={`absolute right-0 top-0 bottom-0 w-1 cursor-col-resize opacity-0 group-hover:opacity-100 transition-opacity z-10 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}
                                  onMouseDown={(e) => handleMouseDownResize(e, column.key)}
                                />
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedRecords.length > 0 ? (
                            paginatedRecords.map((record) => (
                              <tr
                                key={record.id}
                                className={`border-b transition-colors ${isDarkMode
                                  ? 'border-gray-800 hover:bg-gray-900'
                                  : 'border-gray-200 hover:bg-gray-50'
                                  } ${selectedRecord?.id === record.id ? (isDarkMode ? 'bg-gray-800' : 'bg-gray-100') : ''
                                  } ${userRole === 'customer' ? '' : 'cursor-pointer'
                                  }`}
                                onClick={() => handleRowClick(record)}
                              >
                                {filteredColumns.map((column, index) => (
                                  <td
                                    key={column.key}
                                    className={`py-4 px-3 whitespace-nowrap ${isDarkMode ? 'text-white' : 'text-gray-900'
                                      } ${index < filteredColumns.length - 1 ? (isDarkMode ? 'border-r border-gray-800' : 'border-r border-gray-200') : ''
                                      }`}
                                    style={{
                                      width: columnWidths[column.key] ? `${columnWidths[column.key]}px` : undefined,
                                      minWidth: columnWidths[column.key] ? `${columnWidths[column.key]}px` : (column.width === 'min-w-max' ? 'max-content' : undefined)
                                    }}
                                  >
                                    {renderCellValue(record as any, column.key)}
                                  </td>
                                ))}
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={displayColumns.length} className={`px-4 py-12 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                {filteredRecords.length > 0
                                  ? 'No Invoice records found matching your filters'
                                  : (totalCount > invoiceRecords.length)
                                    ? 'Loading more records... please wait.'
                                    : 'No Invoice records found.'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
            {!isLoading && !error && filteredRecords.length > 0 && <PaginationControls />}
          </div>
        </div>
      </div>

      {selectedRecord && userRole !== 'customer' && (
        <div className="flex-shrink-0 overflow-hidden">
          <InvoiceDetails
            invoiceRecord={selectedRecord as any}
            onViewCustomer={handleViewCustomer}
            onClose={handleCloseDetails}
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

      {showPaymentVerifyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className={`rounded-lg shadow-xl max-w-md w-full mx-4 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
              }`}
          >
            <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
              <h3 className="text-xl font-bold text-center">Confirm Payment</h3>
            </div>

            <div className="p-6">
              <div className={`p-4 rounded mb-4 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                <div className="flex justify-between mb-2">
                  <span>Account:</span>
                  <span className="font-bold">{fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Current Balance:</span>
                  <span className={`font-bold ${accountBalance > 0 ? 'text-red-500' : 'text-green-500'
                    }`}>₱{accountBalance.toFixed(2)}</span>
                </div>
              </div>

              {errorMessage && (
                <div className={`p-3 rounded mb-4 ${isDarkMode ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'
                  }`}>
                  <p className="text-red-500 text-sm text-center">{errorMessage}</p>
                </div>
              )}

              <div className="mb-4">
                <label className="block font-bold mb-2">Payment Amount</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  min="1"
                  step="0.01"
                  className={`w-full px-4 py-3 rounded text-lg font-bold ${isDarkMode
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                    } border focus:outline-none focus:ring-2`}
                  style={{
                    '--tw-ring-color': colorPalette?.primary || '#7c3aed'
                  } as React.CSSProperties}
                />
                <div className={`text-sm text-right mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                  {accountBalance > 0 ? (
                    <span>Outstanding balance: ₱{accountBalance.toFixed(2)}</span>
                  ) : (
                    <span>Minimum: ₱1.00</span>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCloseVerifyModal}
                  disabled={isPaymentProcessing}
                  className={`flex-1 px-4 py-3 rounded font-bold transition-colors ${isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleProceedToCheckout}
                  disabled={isPaymentProcessing || paymentAmount < 1}
                  className="flex-1 px-4 py-3 rounded font-bold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: (isPaymentProcessing || paymentAmount < 1)
                      ? '#6b7280'
                      : (colorPalette?.primary || '#7c3aed')
                  }}
                  onMouseEnter={(e) => {
                    if (!isPaymentProcessing && paymentAmount >= 1 && colorPalette?.accent) {
                      e.currentTarget.style.backgroundColor = colorPalette.accent;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isPaymentProcessing && paymentAmount >= 1 && colorPalette?.primary) {
                      e.currentTarget.style.backgroundColor = colorPalette.primary;
                    }
                  }}
                >
                  {isPaymentProcessing ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    'PROCEED TO CHECKOUT →'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )
      }

      {
        showPendingPaymentModal && pendingPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div
              className={`rounded-lg shadow-xl max-w-md w-full mx-4 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}
            >
              <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className="text-xl font-bold text-center">Transaction In Progress</h3>
              </div>

              <div className="p-6">
                <div className={`p-4 rounded mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <p className="text-center mb-4">
                    You have a pending payment (<b>{pendingPayment?.reference_no}</b>).
                    <br />The link is still active.
                  </p>
                  <div className="flex justify-between mt-4">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Amount:</span>
                    <span className="font-bold text-lg" style={{ color: colorPalette?.primary || '#7c3aed' }}>
                      ₱{pendingPayment?.amount?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleCancelPendingPayment}
                    className={`flex-1 px-4 py-3 rounded font-bold transition-colors ${isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                      }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResumePendingPayment}
                    className="flex-1 px-4 py-3 rounded font-bold text-white transition-colors"
                    style={{ backgroundColor: colorPalette?.primary || '#7c3aed' }}
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
                    Pay Now →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {
        showPaymentLinkModal && paymentLinkData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div
              className={`rounded-lg shadow-xl max-w-md w-full mx-4 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}
            >
              <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className="text-xl font-bold text-center">Proceed to Payment Portal</h3>
              </div>

              <div className="p-6">
                <div className={`p-4 rounded mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <div className="flex justify-between mb-3">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Reference:</span>
                    <span className="font-mono font-bold">{paymentLinkData?.referenceNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Amount:</span>
                    <span className="font-bold text-lg" style={{ color: colorPalette?.primary || '#7c3aed' }}>
                      ₱{paymentLinkData?.amount?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleOpenPaymentLink}
                  className="w-full px-4 py-3 rounded font-bold text-white transition-colors"
                  style={{ backgroundColor: colorPalette?.primary || '#7c3aed' }}
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
                  PROCEED
                </button>
              </div>
            </div>
          </div>
        )
      }
      <InvoiceFunnelFilter
        isOpen={isFunnelFilterOpen}
        onClose={() => setIsFunnelFilterOpen(false)}
        onApplyFilters={(filters) => {
          setActiveFilters(filters);
          localStorage.setItem('invoiceFunnelFilters', JSON.stringify(filters));
          setIsFunnelFilterOpen(false);
        }}
        currentFilters={activeFilters}
      />
    </div>
  );
};

export default Invoice;
