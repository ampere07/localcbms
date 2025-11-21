import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CreditCard, Search, Circle, X, ListFilter, ArrowUp, ArrowDown } from 'lucide-react';
import BillingDetails from '../components/CustomerDetails';
import { getBillingRecords, BillingRecord } from '../services/billingService';
import { getCustomerDetail, CustomerDetailData } from '../services/customerDetailService';
import { BillingDetailRecord } from '../types/billing';
import { getCities, City } from '../services/cityService';
import { getRegions, Region } from '../services/regionService';

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
    location: customerData.location || '',
    addressCoordinates: customerData.addressCoordinates || '',
  };
};

interface LocationItem {
  id: string;
  name: string;
  count: number;
}

type DisplayMode = 'card' | 'table';

// All available columns for the table - extended list to match BillingListView
const allColumns = [
  { key: 'status', label: 'Status', width: 'min-w-28' },
  { key: 'billingStatus', label: 'Billing Status', width: 'min-w-28' },
  { key: 'accountNo', label: 'Account No.', width: 'min-w-32' },
  { key: 'dateInstalled', label: 'Date Installed', width: 'min-w-28' },
  { key: 'customerName', label: 'Full Name', width: 'min-w-40' },
  { key: 'address', label: 'Address', width: 'min-w-56' },
  { key: 'contactNumber', label: 'Contact Number', width: 'min-w-36' },
  { key: 'emailAddress', label: 'Email Address', width: 'min-w-48' },
  { key: 'plan', label: 'Plan', width: 'min-w-40' },
  { key: 'balance', label: 'Account Balance', width: 'min-w-32' },
  { key: 'username', label: 'Username', width: 'min-w-32' },
  { key: 'connectionType', label: 'Connection Type', width: 'min-w-36' },
  { key: 'routerModel', label: 'Router Model', width: 'min-w-32' },
  { key: 'routerModemSN', label: 'Router/Modem SN', width: 'min-w-36' },
  { key: 'lcpnap', label: 'LCPNAP', width: 'min-w-32' },
  { key: 'port', label: 'PORT', width: 'min-w-28' },
  { key: 'vlan', label: 'VLAN', width: 'min-w-24' },
  { key: 'billingDay', label: 'Billing Day', width: 'min-w-28' },
  { key: 'totalPaid', label: 'Total Paid', width: 'min-w-28' },
  { key: 'provider', label: 'Provider', width: 'min-w-24' },
  { key: 'lcp', label: 'LCP', width: 'min-w-28' },
  { key: 'nap', label: 'NAP', width: 'min-w-28' },
  { key: 'modifiedBy', label: 'Modified By', width: 'min-w-32' },
  { key: 'modifiedDate', label: 'Modified Date', width: 'min-w-36' },
  { key: 'barangay', label: 'Barangay', width: 'min-w-32' },
  { key: 'city', label: 'City', width: 'min-w-28' },
  { key: 'region', label: 'Region', width: 'min-w-28' },
  { key: 'lcpnapport', label: 'LCPNAPPORT', width: 'min-w-36' },
  { key: 'usageType', label: 'Usage Type', width: 'min-w-32' },
  { key: 'referredBy', label: 'Referred By', width: 'min-w-36' },
  { key: 'secondContactNumber', label: 'Second Contact Number', width: 'min-w-40' },
  { key: 'referrersAccountNumber', label: 'Referrer\'s Account Number', width: 'min-w-44' },
  { key: 'relatedInvoices', label: 'Related Invoices', width: 'min-w-36' },
  { key: 'relatedStatementOfAccount', label: 'Related Statement of Account', width: 'min-w-52' },
  { key: 'relatedDiscounts', label: 'Related Discounts', width: 'min-w-36' },
  { key: 'relatedStaggeredInstallation', label: 'Related Staggered Installation', width: 'min-w-52' },
  { key: 'relatedStaggeredPayments', label: 'Related Staggered Payments', width: 'min-w-52' },
  { key: 'relatedOverdues', label: 'Related Overdues', width: 'min-w-36' },
  { key: 'relatedDCNotices', label: 'Related DC Notices', width: 'min-w-40' },
  { key: 'relatedServiceOrders', label: 'Related Service Orders', width: 'min-w-44' },
  { key: 'relatedDisconnectedLogs', label: 'Related Disconnected Logs', width: 'min-w-48' },
  { key: 'relatedReconnectionLogs', label: 'Related Reconnection Logs', width: 'min-w-48' },
  { key: 'relatedChangeDueLogs', label: 'Related Change Due Logs', width: 'min-w-48' },
  { key: 'relatedTransactions', label: 'Related Transactions', width: 'min-w-40' },
  { key: 'relatedDetailsUpdateLogs', label: 'Related Details Update Logs', width: 'min-w-48' },
  { key: 'computedAddress', label: '_ComputedAddress', width: 'min-w-40' },
  { key: 'computedStatus', label: '_ComputedStatus', width: 'min-w-36' },
  { key: 'relatedAdvancedPayments', label: 'Related Advanced Payments', width: 'min-w-48' },
  { key: 'relatedPaymentPortalLogs', label: 'Related Payment Portal Logs', width: 'min-w-48' },
  { key: 'relatedInventoryLogs', label: 'Related Inventory Logs', width: 'min-w-44' },
  { key: 'computedAccountNo', label: '_ComputedAccountNo', width: 'min-w-44' },
  { key: 'relatedOnlineStatus', label: 'Related Online Status', width: 'min-w-44' },
  { key: 'group', label: 'Group', width: 'min-w-28' },
  { key: 'mikrotikId', label: 'Mikrotik ID', width: 'min-w-32' },
  { key: 'sessionIP', label: 'Session IP', width: 'min-w-32' },
  { key: 'relatedBorrowedLogs', label: 'Related Borrowed Logs', width: 'min-w-44' },
  { key: 'relatedPlanChangeLogs', label: 'Related Plan Change Logs', width: 'min-w-48' },
  { key: 'relatedServiceChargeLogs', label: 'Related Service Charge Logs', width: 'min-w-48' },
  { key: 'relatedAdjustedAccountLogs', label: 'Related Adjusted Account Logs', width: 'min-w-52' },
  { key: 'referralContactNo', label: 'Referral Contact No.', width: 'min-w-40' },
  { key: 'logs', label: 'Logs', width: 'min-w-24' },
  { key: 'relatedSecurityDeposits', label: 'Related Security Deposits', width: 'min-w-48' },
  { key: 'relatedApprovedTransactions', label: 'Related Approved Transaction', width: 'min-w-52' },
  { key: 'relatedAttachments', label: 'Related Attachments', width: 'min-w-40' }
];

const Customer: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetailData | null>(null);
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('card');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(allColumns.map(col => col.key));
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [columnOrder, setColumnOrder] = useState<string[]>(allColumns.map(col => col.key));
  const [sidebarWidth, setSidebarWidth] = useState<number>(256);
  const [isResizingSidebar, setIsResizingSidebar] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);
  const sidebarStartXRef = useRef<number>(0);
  const sidebarStartWidthRef = useRef<number>(0);

  // Fetch location data
  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setFilterDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef, filterDropdownRef]);

  useEffect(() => {
    const fetchLocationData = async () => {
      try {
        const [citiesData, regionsData] = await Promise.all([
          getCities(),
          getRegions()
        ]);
        setCities(citiesData || []);
        setRegions(regionsData || []);
      } catch (err) {
        console.error('Failed to fetch location data:', err);
        setCities([]);
        setRegions([]);
      }
    };
    
    fetchLocationData();
  }, []);

  // Fetch billing data
  useEffect(() => {
    const fetchBillingData = async () => {
      try {
        setIsLoading(true);
        const data = await getBillingRecords();
        setBillingRecords(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch billing records:', err);
        setError('Failed to load billing records. Please try again.');
        setBillingRecords([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBillingData();
  }, []);

  // Memoize city name lookup for performance
  const getCityName = useMemo(() => {
    const cityMap = new Map(cities.map(c => [c.id, c.name]));
    return (cityId: number | null | undefined): string => {
      if (!cityId) return 'Unknown City';
      return cityMap.get(cityId) || `City ${cityId}`;
    };
  }, [cities]);

  // Memoize location items for performance
  const locationItems: LocationItem[] = useMemo(() => {
    const items: LocationItem[] = [
      {
        id: 'all',
        name: 'All',
        count: billingRecords.length
      }
    ];
    
    // Add cities with counts
    cities.forEach((city) => {
      const cityCount = billingRecords.filter(record => record.cityId === city.id).length;
      items.push({
        id: String(city.id),
        name: city.name,
        count: cityCount
      });
    });

    return items;
  }, [cities, billingRecords]);

  // Memoize filtered and sorted records for performance
  const filteredBillingRecords = useMemo(() => {
    let filtered = billingRecords.filter(record => {
      const matchesLocation = selectedLocation === 'all' || 
                             record.cityId === Number(selectedLocation);
      
      const matchesSearch = searchQuery === '' || 
                           record.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           record.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           record.applicationId.includes(searchQuery);
      
      return matchesLocation && matchesSearch;
    });

    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any = '';
        let bValue: any = '';

        switch (sortColumn) {
          case 'status':
          case 'onlineStatus':
            aValue = a.onlineStatus || '';
            bValue = b.onlineStatus || '';
            break;
          case 'billingStatus':
            aValue = a.billingStatus || 'Active';
            bValue = b.billingStatus || 'Active';
            break;
          case 'accountNo':
            aValue = a.applicationId || '';
            bValue = b.applicationId || '';
            break;
          case 'dateInstalled':
            aValue = a.dateInstalled || '';
            bValue = b.dateInstalled || '';
            break;
          case 'customerName':
            aValue = a.customerName || '';
            bValue = b.customerName || '';
            break;
          case 'address':
            aValue = a.address || '';
            bValue = b.address || '';
            break;
          case 'contactNumber':
            aValue = a.contactNumber || '';
            bValue = b.contactNumber || '';
            break;
          case 'emailAddress':
            aValue = a.emailAddress || '';
            bValue = b.emailAddress || '';
            break;
          case 'plan':
            aValue = a.plan || '';
            bValue = b.plan || '';
            break;
          case 'balance':
            aValue = a.balance || 0;
            bValue = b.balance || 0;
            break;
          case 'username':
            aValue = a.username || '';
            bValue = b.username || '';
            break;
          case 'connectionType':
            aValue = a.connectionType || '';
            bValue = b.connectionType || '';
            break;
          case 'routerModel':
            aValue = a.routerModel || '';
            bValue = b.routerModel || '';
            break;
          case 'routerModemSN':
            aValue = a.routerModemSN || '';
            bValue = b.routerModemSN || '';
            break;
          case 'lcpnap':
            aValue = a.lcpnap || '';
            bValue = b.lcpnap || '';
            break;
          case 'port':
            aValue = a.port || '';
            bValue = b.port || '';
            break;
          case 'vlan':
            aValue = a.vlan || '';
            bValue = b.vlan || '';
            break;
          case 'billingDay':
            aValue = a.billingDay || 0;
            bValue = b.billingDay || 0;
            break;
          case 'totalPaid':
            aValue = a.totalPaid || 0;
            bValue = b.totalPaid || 0;
            break;
          case 'provider':
            aValue = a.provider || '';
            bValue = b.provider || '';
            break;
          case 'lcp':
            aValue = a.lcp || '';
            bValue = b.lcp || '';
            break;
          case 'nap':
            aValue = a.nap || '';
            bValue = b.nap || '';
            break;
          case 'modifiedBy':
            aValue = a.modifiedBy || '';
            bValue = b.modifiedBy || '';
            break;
          case 'modifiedDate':
            aValue = a.modifiedDate || '';
            bValue = b.modifiedDate || '';
            break;
          case 'barangay':
            aValue = a.barangay || '';
            bValue = b.barangay || '';
            break;
          case 'city':
            aValue = a.city || '';
            bValue = b.city || '';
            break;
          case 'region':
            aValue = a.region || '';
            bValue = b.region || '';
            break;
          default:
            return 0;
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [billingRecords, selectedLocation, searchQuery, sortColumn, sortDirection]);

  const handleRecordClick = async (record: BillingRecord) => {
    try {
      setIsLoadingDetails(true);
      console.log('Fetching customer detail for account:', record.applicationId);
      const customerData = await getCustomerDetail(record.applicationId);
      console.log('Fetched customer data:', customerData);
      setSelectedCustomer(customerData);
    } catch (error) {
      console.error('Failed to fetch customer details:', error);
      setError('Failed to load customer details');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedCustomer(null);
  };
  
  const renderCellValue = (record: BillingRecord, columnKey: string) => {
    switch (columnKey) {
      // Basic fields
      case 'status':
        return (
          <div className="flex items-center space-x-2">
            <Circle 
              className={`h-3 w-3 ${
                record.onlineStatus === 'Online' 
                  ? 'text-green-400 fill-green-400' 
                  : 'text-gray-400 fill-gray-400'
              }`} 
            />
            <span className={`text-xs ${
              record.onlineStatus === 'Online' 
                ? 'text-green-400' 
                : 'text-gray-400'
            }`}>
              {record.onlineStatus}
            </span>
          </div>
        );
      case 'billingStatus':
        return record.billingStatus || 'Active';
      case 'accountNo':
        return <span className="text-red-400">{record.applicationId}</span>;
      case 'dateInstalled':
        return record.dateInstalled || '-';
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
        return `₱ ${record.balance.toFixed(2)}`;
      case 'username':
        return record.username || '-';
      case 'connectionType':
        return record.connectionType || '-';
      case 'routerModel':
        return record.routerModel || '-';
      case 'routerModemSN':
        return record.routerModemSN || '-';
      case 'lcpnap':
        return record.lcpnap || '-';
      case 'port':
        return record.port || '-';
      case 'vlan':
        return record.vlan || '-';
      case 'billingDay':
        return record.billingDay === 0 ? 'Every end of month' : (record.billingDay || '-');
      case 'totalPaid':
        return `₱ ${record.totalPaid?.toFixed(2) || '0.00'}`;
      case 'provider':
        return record.provider || '-';
      case 'lcp':
        return record.lcp || '-';
      case 'nap':
        return record.nap || '-';
      case 'modifiedBy':
        return record.modifiedBy || '-';
      case 'modifiedDate':
        return record.modifiedDate || '-';
      case 'barangay':
        return record.barangay || '-';
      case 'city':
        return record.city || '-';
      case 'region':
        return record.region || '-';
      
      // Fields from BillingDetailRecord
      case 'lcpnapport':
        return (record as any).lcpnapport || '-';
      case 'usageType':
        return (record as any).usageType || '-';
      case 'referredBy':
        return (record as any).referredBy || '-';
      case 'secondContactNumber':
        return (record as any).secondContactNumber || '-';
      case 'referrersAccountNumber':
        return (record as any).referrersAccountNumber || '-';
      case 'group':
        return (record as any).group || '-';
      case 'mikrotikId':
        return (record as any).mikrotikId || '-';
      case 'sessionIP':
        return (record as any).sessionIP || '-';
      case 'referralContactNo':
        return (record as any).referralContactNo || '-';
      
      // Related records - placeholders
      case 'relatedInvoices':
      case 'relatedStatementOfAccount':
      case 'relatedDiscounts':
      case 'relatedStaggeredInstallation':
      case 'relatedStaggeredPayments':
      case 'relatedOverdues':
      case 'relatedDCNotices':
      case 'relatedServiceOrders':
      case 'relatedDisconnectedLogs':
      case 'relatedReconnectionLogs':
      case 'relatedChangeDueLogs':
      case 'relatedTransactions':
      case 'relatedDetailsUpdateLogs':
      case 'relatedAdvancedPayments':
      case 'relatedPaymentPortalLogs':
      case 'relatedInventoryLogs':
      case 'relatedOnlineStatus':
      case 'relatedBorrowedLogs':
      case 'relatedPlanChangeLogs':
      case 'relatedServiceChargeLogs':
      case 'relatedAdjustedAccountLogs':
      case 'relatedSecurityDeposits':
      case 'relatedApprovedTransactions':
      case 'relatedAttachments':
      case 'logs':
        return '-';
      
      // Computed fields
      case 'computedAddress':
        return (record as any).computedAddress || 
               (record.address ? (record.address.length > 25 ? `${record.address.substring(0, 25)}...` : record.address) : '-');
      case 'computedStatus':
        return (record as any).computedStatus || 
               `${record.status || 'Inactive'} | P ${record.balance.toFixed(0)}`;
      case 'computedAccountNo':
        return (record as any).computedAccountNo || 
               `${record.applicationId} | ${record.customerName}${record.address ? (' | ' + record.address.substring(0, 10) + '...') : ''}`;
        
      default:
        return '-';
    }
  };

  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      const data = await getBillingRecords();
      setBillingRecords(data);
      setError(null);
    } catch (err) {
      console.error('Failed to refresh billing records:', err);
      setError('Failed to refresh billing records. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateSampleData = async () => {
    setIsLoading(true);
    
    const API_BASE_URL = window.location.hostname === 'localhost' 
      ? 'http://localhost:8000/api'
      : 'https://backend.atssfiber.ph/api';

    const generationDate = new Date().toISOString().split('T')[0];
    
    fetch(`${API_BASE_URL}/billing-generation/force-generate-all`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        generation_date: generationDate
      })
    }).then(async (response) => {
      const result = await response.json();
      
      if (!result.success) {
        const errorDetails = result.data?.invoices?.errors || [];
        const soaErrors = result.data?.statements?.errors || [];
        const allErrors = [...errorDetails, ...soaErrors];
        
        if (allErrors.length > 0) {
          console.error('Generation errors:', allErrors);
          const firstError = allErrors[0];
          alert(`Generation failed for account ${firstError.account_no}: ${firstError.error}`);
        } else {
          alert(result.message || 'Generation failed');
        }
        setError(result.message);
        setIsLoading(false);
        return;
      }
      
      const data = await getBillingRecords();
      setBillingRecords(data);
      setError(null);
      
      const invoiceCount = result.data?.invoices?.success || 0;
      const soaCount = result.data?.statements?.success || 0;
      const accountCount = result.data?.total_accounts || 0;
      const invoiceErrors = result.data?.invoices?.failed || 0;
      const soaErrors = result.data?.statements?.failed || 0;
      
      if (invoiceErrors > 0 || soaErrors > 0) {
        const errors = [
          ...(result.data?.invoices?.errors || []),
          ...(result.data?.statements?.errors || [])
        ];
        console.error('Generation errors:', errors);
        alert(`Generated ${invoiceCount} invoices and ${soaCount} statements for ${accountCount} accounts.\n\nFailed: ${invoiceErrors} invoices, ${soaErrors} statements.\n\nCheck console for errors.`);
      } else {
        alert(`Successfully generated ${invoiceCount} invoices and ${soaCount} statements for ${accountCount} active accounts`);
      }
    }).catch((err) => {
      console.error('Generation failed:', err);
      setError('Generation failed. Please try again.');
      alert('Generation failed: ' + (err as Error).message);
    }).finally(() => {
      setIsLoading(false);
    });
  };

  const handleToggleColumn = (columnKey: string) => {
    setVisibleColumns(prev => {
      if (prev.includes(columnKey)) {
        return prev.filter(key => key !== columnKey);
      } else {
        return [...prev, columnKey];
      }
    });
  };

  const handleSelectAllColumns = () => {
    setVisibleColumns(allColumns.map(col => col.key));
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

  const filteredColumns = allColumns
    .filter(col => visibleColumns.includes(col.key))
    .sort((a, b) => {
      const indexA = columnOrder.indexOf(a.key);
      const indexB = columnOrder.indexOf(b.key);
      return indexA - indexB;
    });

  return (
    <div className="bg-gray-950 h-full flex overflow-hidden">
      <div className="bg-gray-900 border-r border-gray-700 flex-shrink-0 flex flex-col relative" style={{ width: `${sidebarWidth}px` }}>
        <div className="p-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-semibold text-white">Customer Details</h2>
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
                <CreditCard className="h-4 w-4 mr-2" />
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
        
        {/* Resize Handle */}
        <div
          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-orange-500 transition-colors z-10"
          onMouseDown={handleMouseDownSidebarResize}
        />
      </div>

      <div className="flex-1 bg-gray-900 overflow-hidden">
        <div className="flex flex-col h-full">
          <div className="bg-gray-900 p-4 border-b border-gray-700 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search customer records..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded pl-10 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
              <div className="flex space-x-2">
                {displayMode === 'table' && (
                  <div className="relative" ref={filterDropdownRef}>
                    <button
                      className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm transition-colors flex items-center"
                      onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                    >
                      <ListFilter className="h-5 w-5" />
                    </button>
                    {filterDropdownOpen && (
                      <div className="absolute top-full right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded shadow-lg z-50 max-h-96 flex flex-col">
                        <div className="p-3 border-b border-gray-700 flex items-center justify-between">
                          <span className="text-white text-sm font-medium">Column Visibility</span>
                          <div className="flex space-x-2">
                            <button
                              onClick={handleSelectAllColumns}
                              className="text-xs text-orange-500 hover:text-orange-400"
                            >
                              Select All
                            </button>
                            <span className="text-gray-600">|</span>
                            <button
                              onClick={handleDeselectAllColumns}
                              className="text-xs text-orange-500 hover:text-orange-400"
                            >
                              Deselect All
                            </button>
                          </div>
                        </div>
                        <div className="overflow-y-auto flex-1">
                          {allColumns.map((column) => (
                            <label
                              key={column.key}
                              className="flex items-center px-4 py-2 hover:bg-gray-700 cursor-pointer text-sm text-white"
                            >
                              <input
                                type="checkbox"
                                checked={visibleColumns.includes(column.key)}
                                onChange={() => handleToggleColumn(column.key)}
                                className="mr-3 h-4 w-4 rounded border-gray-600 bg-gray-700 text-orange-600 focus:ring-orange-500 focus:ring-offset-gray-800"
                              />
                              <span>{column.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div className="relative z-50" ref={dropdownRef}>
                  <button
                    className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm transition-colors flex items-center"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                  >
                    <span>{displayMode === 'card' ? 'Card View' : 'Table View'}</span>
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {dropdownOpen && (
                    <div className="fixed right-auto mt-1 w-36 bg-gray-800 border border-gray-700 rounded shadow-lg">
                      <button
                        onClick={() => {
                          setDisplayMode('card');
                          setDropdownOpen(false);
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-700 ${displayMode === 'card' ? 'text-orange-500' : 'text-white'}`}
                      >
                        Card View
                      </button>
                      <button
                        onClick={() => {
                          setDisplayMode('table');
                          setDropdownOpen(false);
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-700 ${displayMode === 'table' ? 'text-orange-500' : 'text-white'}`}
                      >
                        Table View
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleGenerateSampleData}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded text-sm transition-colors"
                >
                  {isLoading ? 'Generating...' : 'Generate Sample Data'}
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white px-4 py-2 rounded text-sm transition-colors"
                >
                  {isLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
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
                  <p className="mt-4">Loading customer records...</p>
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
              ) : displayMode === 'card' ? (
                filteredBillingRecords.length > 0 ? (
                  <div className="space-y-0">
                    {filteredBillingRecords.map((record) => (
                      <div
                        key={record.id}
                        onClick={() => handleRecordClick(record)}
                        className={`px-4 py-3 cursor-pointer transition-colors hover:bg-gray-800 border-b border-gray-800 ${selectedCustomer?.billingAccount?.accountNo === record.applicationId ? 'bg-gray-800' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="text-red-400 font-medium text-sm mb-1">
                              {record.applicationId} | {record.customerName} | {record.address}
                            </div>
                            <div className="text-white text-sm">
                              {record.status} | ₱ {record.balance.toFixed(0)}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                            <Circle 
                              className={`h-3 w-3 ${record.onlineStatus === 'Online' ? 'text-green-400 fill-green-400' : 'text-gray-400 fill-gray-400'}`} 
                            />
                            <span className={`text-sm ${record.onlineStatus === 'Online' ? 'text-green-400' : 'text-gray-400'}`}>
                              {record.onlineStatus}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    No customer records found matching your filters
                  </div>
                )
              ) : (
                <div className="overflow-x-auto overflow-y-hidden">
                  <table ref={tableRef} className="w-max min-w-full text-sm border-separate border-spacing-0">
                    <thead>
                      <tr className="border-b border-gray-700 bg-gray-800 sticky top-0 z-10">
                        {filteredColumns.map((column, index) => (
                          <th
                            key={column.key}
                            draggable
                            onDragStart={(e) => handleDragStart(e, column.key)}
                            onDragOver={(e) => handleDragOver(e, column.key)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, column.key)}
                            onDragEnd={handleDragEnd}
                            className={`text-left py-3 px-3 text-gray-400 font-normal bg-gray-800 ${column.width} whitespace-nowrap ${index < filteredColumns.length - 1 ? 'border-r border-gray-700' : ''} relative group cursor-move ${
                              draggedColumn === column.key ? 'opacity-50' : ''
                            } ${
                              dragOverColumn === column.key ? 'bg-orange-500 bg-opacity-20' : ''
                            }`}
                            style={{ width: columnWidths[column.key] ? `${columnWidths[column.key]}px` : undefined }}
                            onMouseEnter={() => setHoveredColumn(column.key)}
                            onMouseLeave={() => setHoveredColumn(null)}
                          >
                            <div className="flex items-center justify-between">
                              <span>{column.label}</span>
                              {(hoveredColumn === column.key || sortColumn === column.key) && (
                                <button
                                  onClick={() => handleSort(column.key)}
                                  className="ml-2 transition-colors"
                                >
                                  {sortColumn === column.key && sortDirection === 'desc' ? (
                                    <ArrowDown className="h-4 w-4 text-orange-400" />
                                  ) : (
                                    <ArrowUp className="h-4 w-4 text-gray-400 hover:text-orange-400" />
                                  )}
                                </button>
                              )}
                            </div>
                            {index < filteredColumns.length - 1 && (
                              <div
                                className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-orange-500 group-hover:bg-gray-600"
                                onMouseDown={(e) => handleMouseDownResize(e, column.key)}
                              />
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBillingRecords.length > 0 ? (
                        filteredBillingRecords.map((record) => (
                          <tr 
                            key={record.id} 
                            className={`border-b border-gray-800 hover:bg-gray-900 cursor-pointer transition-colors ${selectedCustomer?.billingAccount?.accountNo === record.applicationId ? 'bg-gray-800' : ''}`}
                            onClick={() => handleRecordClick(record)}
                          >
                            {filteredColumns.map((column, index) => (
                              <td 
                                key={column.key}
                                className={`py-4 px-3 text-white ${index < filteredColumns.length - 1 ? 'border-r border-gray-800' : ''}`}
                                style={{ 
                                  width: columnWidths[column.key] ? `${columnWidths[column.key]}px` : undefined,
                                  maxWidth: columnWidths[column.key] ? `${columnWidths[column.key]}px` : undefined
                                }}
                              >
                                <div className="truncate">
                                  {renderCellValue(record, column.key)}
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={filteredColumns.length} className="px-4 py-12 text-center text-gray-400 border-b border-gray-800">
                            No customer records found matching your filters
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

      {(selectedCustomer || isLoadingDetails) && (
        <div className="flex-shrink-0 overflow-hidden">
          {isLoadingDetails ? (
            <div className="w-[600px] bg-gray-900 text-white h-full flex items-center justify-center border-l border-white border-opacity-30">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading details...</p>
              </div>
            </div>
          ) : selectedCustomer ? (
            <BillingDetails
              billingRecord={convertCustomerDataToBillingDetail(selectedCustomer)}
              onlineStatusRecords={[]}
              onClose={handleCloseDetails}
            />
          ) : null}
        </div>
      )}
    </div>
  );
};

export default Customer;