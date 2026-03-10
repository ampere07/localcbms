import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FileText, Search, X, Columns3, ArrowUp, ArrowDown, Menu, Filter, RefreshCw, ChevronDown, ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight } from 'lucide-react';
import ServiceOrderDetails from '../components/ServiceOrderDetails';
import ServiceOrderFunnelFilter, { FilterValues, allColumns as filterColumns } from '../components/filters/ServiceOrderFunnelFilter';
import { useServiceOrderStore, type ServiceOrder } from '../store/serviceOrderStore';
import { getCities, City } from '../services/cityService';
import { getRegions, Region } from '../services/regionService';
import { barangayService, Barangay } from '../services/barangayService';
import { settingsColorPaletteService, ColorPalette } from '../services/settingsColorPaletteService';
import pusher from '../services/pusherService';


interface LocationItem {
  id: string;
  name: string;
  count: number;
}

type DisplayMode = 'card' | 'table';
type MobileView = 'locations' | 'orders' | 'details';

const allColumns = [
  { key: 'timestamp', label: 'Timestamp', width: 'min-w-40' },
  { key: 'supportStatus', label: 'Support Status', width: 'min-w-32' },
  { key: 'visitStatus', label: 'Visit Status', width: 'min-w-32' },
  { key: 'fullName', label: 'Full Name', width: 'min-w-40' },
  { key: 'contactNumber', label: 'Contact Number', width: 'min-w-36' },
  { key: 'fullAddress', label: 'Full Address', width: 'min-w-56' },
  { key: 'concern', label: 'Concern', width: 'min-w-36' },
  { key: 'concernRemarks', label: 'Concern Remarks', width: 'min-w-48' },
  { key: 'requestedBy', label: 'Requested By', width: 'min-w-36' },
  { key: 'assignedEmail', label: 'Assigned Email', width: 'min-w-48' },
  { key: 'repairCategory', label: 'Repair Category', width: 'min-w-36' },
  { key: 'modifiedBy', label: 'Modified By', width: 'min-w-32' },
  { key: 'modifiedDate', label: 'Modified Date', width: 'min-w-40' }
];

const ServiceOrderPage: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedServiceOrder, setSelectedServiceOrder] = useState<ServiceOrder | null>(null);
  const { serviceOrders, isLoading, error, fetchServiceOrders, refreshServiceOrders, silentRefresh, hasMore } = useServiceOrderStore();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [cities, setCities] = useState<City[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());
  const [userRole, setUserRole] = useState<string>('');
  const [roleId, setRoleId] = useState<number | null>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('table');
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [mobileView, setMobileView] = useState<MobileView>('locations');
  const [isFunnelFilterOpen, setIsFunnelFilterOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);
  const sidebarStartXRef = useRef<number>(0);
  const sidebarStartWidthRef = useRef<number>(0);
  const cardScrollRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [colorPalette, setColorPalette] = useState<ColorPalette | null>(null);
  const [activeFilters, setActiveFilters] = useState<any>(() => {
    const saved = localStorage.getItem('serviceOrderFilters');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.error('Failed to load filters:', err);
      }
    }
    return {};
  });

  // Pagination State - Managed by store
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
    fetchColorPalette();
  }, []);

  // Reset page logic handled by fetchServiceOrders on triggers where necessary
  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedLocation, searchQuery, activeFilters, sortColumn, sortDirection]);

  // Scroll to top on page change
  useEffect(() => {
    if (displayMode === 'card' && cardScrollRef.current) {
      cardScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (displayMode === 'table' && tableScrollRef.current) {
      tableScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage, displayMode]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const theme = localStorage.getItem('theme');
      setIsDarkMode(theme !== 'light');
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    const theme = localStorage.getItem('theme');
    setIsDarkMode(theme !== 'light');

    return () => observer.disconnect();
  }, []);

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
    const authData = localStorage.getItem('authData');
    if (authData) {
      try {
        const userData = JSON.parse(authData);
        setUserRole(userData.role || '');
        setRoleId(userData.role_id || null);
      } catch (error) {
        console.error('Error parsing auth data:', error);
      }
    }
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

  // Reset selected location if regions/cities/barangays change and selected location is no longer valid
  // Reset selected location if regions/cities/barangays change and selected location is no longer valid
  useEffect(() => {
    // Logic removed as it depended on undefined variables. 
    // SelectedLocation is now mainly derived from status which is stable.
  }, [selectedLocation]);

  // Trigger silent refresh on mount to ensure data is fresh but no spinner if cached
  useEffect(() => {
    silentRefresh();
  }, [silentRefresh]);

  // Real-time updates via Pusher/Soketi
  useEffect(() => {
    const handleUpdate = async (data: any) => {
      console.log('[ServiceOrder Soketi] Update received, silently refreshing:', data);
      try {
        await silentRefresh();
        console.log('[ServiceOrder Soketi] Data refreshed successfully');
      } catch (err) {
        console.error('[ServiceOrder Soketi] Failed to refresh data:', err);
      }
    };

    const serviceOrderChannel = pusher.subscribe('service-orders');

    serviceOrderChannel.bind('pusher:subscription_succeeded', () => {
      console.log('[ServiceOrder Soketi] Successfully subscribed to service-orders channel');
    });
    serviceOrderChannel.bind('pusher:subscription_error', (error: any) => {
      console.error('[ServiceOrder Soketi] Subscription error:', error);
    });

    serviceOrderChannel.bind('service-order-updated', handleUpdate);

    // Re-subscribe on reconnection
    const stateHandler = (states: { previous: string; current: string }) => {
      console.log(`[ServiceOrder Soketi] Connection state: ${states.previous} -> ${states.current}`);
      if (states.current === 'connected' && serviceOrderChannel.subscribed !== true) {
        pusher.subscribe('service-orders');
      }
    };
    pusher.connection.bind('state_change', stateHandler);

    return () => {
      serviceOrderChannel.unbind('pusher:subscription_succeeded');
      serviceOrderChannel.unbind('pusher:subscription_error');
      serviceOrderChannel.unbind('service-order-updated', handleUpdate);
      pusher.connection.unbind('state_change', stateHandler);
      pusher.unsubscribe('service-orders');
    };
  }, [silentRefresh]);

  // Poll for changes every 5 seconds as fallback
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        await silentRefresh();
      } catch (err) {
        // Silent fail - polling is best-effort
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [silentRefresh]);

  // Idle detection and auto-refresh logic
  useEffect(() => {
    const IDLE_TIME_LIMIT = 15 * 60 * 1000; // 15 minutes
    let idleTimer: NodeJS.Timeout | null = null;

    const refreshData = async () => {
      console.log('User idle for 15 minutes, auto-refreshing Service Order data...');
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

  // Update selectedServiceOrder with fresh data after refresh
  useEffect(() => {
    if (selectedServiceOrder) {
      const updatedOrder = serviceOrders.find(order => order.id === selectedServiceOrder.id);
      if (updatedOrder && JSON.stringify(updatedOrder) !== JSON.stringify(selectedServiceOrder)) {
        setSelectedServiceOrder(updatedOrder);
      }
    }
  }, [serviceOrders]);

  const handleRefresh = async () => {
    await refreshServiceOrders();
  };

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

  const locationItems = useMemo(() => {
    // Define main categories
    const categories = [
      { id: 'resolved', name: 'Resolved' },
      { id: 'failed', name: 'Failed' },
      { id: 'inprogress', name: 'In Progress' },
      { id: 'forvisit', name: 'For Visit' },
      { id: 'open', name: 'Open' }
    ];

    const tree: Record<string, {
      count: number,
      visits: Record<string, {
        count: number,
        barangays: Record<string, number>
      }>
    }> = {};

    categories.forEach(c => {
      tree[c.id] = { count: 0, visits: {} };
    });

    serviceOrders.forEach(so => {
      const s = (so.supportStatus || '').toLowerCase().trim();
      const v = (so.visitStatus || '').toLowerCase().trim();

      // Determine Category
      let category = 'open';
      if (s === 'resolved' || s === 'completed') category = 'resolved';
      else if (v === 'failed' || v === 'cancelled') category = 'failed';
      else if (s === 'in-progress' || s === 'in progress') category = 'inprogress';
      else if (v === 'scheduled' || v === 'reschedule') category = 'forvisit';
      else category = 'open';

      const catNode = tree[category];
      if (catNode) {
        catNode.count++;

        // Determine Visit Status
        let visitKey = v || 'empty';
        if (visitKey === 'completed') visitKey = 'done';
        if (visitKey === 'in progress') visitKey = 'inprogress';

        if (!catNode.visits[visitKey]) {
          catNode.visits[visitKey] = { count: 0, barangays: {} };
        }
        const visitNode = catNode.visits[visitKey];
        visitNode.count++;

        // Determine Barangay (match address)
        const address = (so.fullAddress || '').toLowerCase();
        let matchedBrgy = 'Unknown';

        // Try to find a matching barangay
        // Optimization: Stop at first match or collect all? 
        // User implied "the barangay value", usually unique.
        const foundBrgy = barangays.find(b => address.includes(b.barangay.toLowerCase()));
        if (foundBrgy) {
          matchedBrgy = foundBrgy.barangay;
        }

        visitNode.barangays[matchedBrgy] = (visitNode.barangays[matchedBrgy] || 0) + 1;
      }
    });

    return {
      items: categories.map(c => ({
        id: `status:${c.id}`,
        name: c.name,
        count: tree[c.id].count,
        visits: Object.entries(tree[c.id].visits).sort().map(([vKey, vData]) => {
          let vName = vKey;
          if (vKey === 'done') vName = 'Done';
          else if (vKey === 'inprogress') vName = 'In Progress';
          else if (vKey === 'reschedule') vName = 'Reschedule';
          else if (vKey === 'empty') vName = '(Empty)';
          else vName = vKey.charAt(0).toUpperCase() + vKey.slice(1);

          return {
            id: `status:${c.id}:visit:${vKey}`,
            name: vName,
            originalKey: vKey,
            count: vData.count,
            barangays: Object.entries(vData.barangays).sort().map(([bName, bCount]) => ({
              id: `status:${c.id}:visit:${vKey}:brgy:${bName}`,
              name: bName,
              count: bCount
            }))
          };
        })
      })),
      total: serviceOrders.length
    };
  }, [serviceOrders, barangays]);

  const getVal = (item: ServiceOrder, key: string): any => {
    switch (key) {
      case 'id': return item.id;
      case 'ticketId': return item.ticketId;
      case 'accountNumber': return item.accountNumber;
      case 'fullName': return item.fullName;
      case 'contactNumber': return item.contactNumber;
      case 'emailAddress': return item.emailAddress;
      case 'fullAddress': return item.fullAddress;
      case 'plan': return item.plan;
      case 'lcp': return item.lcp;
      case 'nap': return item.nap;
      case 'port': return item.port;
      case 'vlan': return item.vlan;
      case 'oldLcpnap': return item.oldLcpnap;
      case 'newLcp': return item.newLcp;
      case 'newNap': return item.newNap;
      case 'newPort': return item.newPort;
      case 'newVlan': return item.newVlan;
      case 'newLcpnap': return item.newLcpnap;
      case 'supportStatus': return item.supportStatus;
      case 'visitStatus': return item.visitStatus;
      case 'timestamp': return item.timestamp;
      case 'dateInstalled': return item.dateInstalled;
      case 'modifiedBy': return item.modifiedBy;
      case 'modifiedDate': return item.modifiedDate;
      case 'assignedEmail': return item.assignedEmail;
      case 'requestedBy': return item.requestedBy;
      case 'serviceCharge': return item.serviceCharge;
      case 'routerModel': return item.routerModel;
      case 'routerModemSN': return item.routerModemSN;
      case 'referredBy': return item.referredBy;
      case 'status': return item.status;
      case 'billingDay': return item.billingDay;
      case 'onsiteRemarks': return item.onsiteRemarks;
      case 'statusRemarks': return item.statusRemarks;
      case 'contractTemplate': return item.contractTemplate;
      case 'ipAddress': return item.ipAddress;
      case 'usageType': return item.usageType;
      case 'houseFrontPicture': return item.houseFrontPicture;
      case 'visitBy': return item.visitBy;
      case 'visitWith': return item.visitWith;
      case 'visitWithOther': return item.visitWithOther;
      default: return (item as any)[key];
    }
  };

  // Helper function to apply funnel filters
  const applyFunnelFilters = (orders: ServiceOrder[], filters: any): ServiceOrder[] => {
    if (!filters || Object.keys(filters).length === 0) return orders;

    return orders.filter(order => {
      return Object.entries(filters).every(([key, filter]: [string, any]) => {
        const orderValue = getVal(order, key);

        if (filter.type === 'checklist') {
          if (!filter.value || !Array.isArray(filter.value) || filter.value.length === 0) return true;

          if (key === 'barangay' || key === 'city' || key === 'region') {
            const address = String(order.fullAddress || '').toLowerCase();
            return filter.value.some((val: string) => address.includes(val.toLowerCase()));
          }

          if (key === 'plan') {
            // Plan filter value in checklist is just the name part, but order has full plan string
            const pVal = String(orderValue || '').toLowerCase();
            return filter.value.some((val: string) => pVal.includes(val.toLowerCase()));
          }

          return filter.value.includes(String(orderValue || ''));
        }

        if (filter.type === 'text') {
          if (!filter.value) return true;
          const value = String(orderValue || '').toLowerCase();
          return value.includes(filter.value.toLowerCase());
        }

        if (filter.type === 'number') {
          const numValue = Number(orderValue);
          if (isNaN(numValue)) return false;
          if (filter.from !== undefined && filter.from !== '' && numValue < Number(filter.from)) return false;
          if (filter.to !== undefined && filter.to !== '' && numValue > Number(filter.to)) return false;
          return true;
        }

        if (filter.type === 'date') {
          if (!orderValue) return false;
          const dateValue = new Date(orderValue).getTime();
          if (filter.from && dateValue < new Date(filter.from).getTime()) return false;
          if (filter.to && dateValue > new Date(filter.to).getTime()) return false;
          return true;
        }

        return true;
      });
    });
  };

  const filteredServiceOrders = useMemo(() => {
    const isTechnician = roleId === 2 || userRole.toLowerCase() === 'technician';

    let filtered = serviceOrders.filter(serviceOrder => {
      // 1. Technician 7-Day Filter for 'Resolved' tickets
      if (isTechnician) {
        const supportStatus = (serviceOrder.supportStatus || '').toLowerCase().trim();

        // Only filter if status is 'Resolved'
        if (supportStatus === 'resolved') {
          const updatedAt = serviceOrder.rawUpdatedAt;

          // If we have a date, check if it's older than 7 days
          if (updatedAt) {
            const updatedDate = new Date(updatedAt);
            if (!isNaN(updatedDate.getTime())) {
              const sevenDaysAgo = new Date();
              sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

              // If older than 7 days, HIDE it (return false)
              if (updatedDate < sevenDaysAgo) {
                return false;
              }
            }
          }
        }
      }

      const matchesLocation = selectedLocation === 'all' || (() => {
        if (selectedLocation.startsWith('status:')) {
          const parts = selectedLocation.split(':');
          const catId = parts[1];

          const s = (serviceOrder.supportStatus || '').toLowerCase().trim();
          const v = (serviceOrder.visitStatus || '').toLowerCase().trim();

          let category = 'open';
          if (s === 'resolved' || s === 'completed') category = 'resolved';
          else if (v === 'failed' || v === 'cancelled') category = 'failed';
          else if (s === 'in-progress' || s === 'in progress') category = 'inprogress';
          else if (v === 'scheduled' || v === 'reschedule') category = 'forvisit';
          else category = 'open';

          if (category !== catId) return false;

          // Check Visit Status
          if (parts.length > 2 && parts[2] === 'visit') {
            const visitKeyFilter = parts[3];
            let visitKey = v || 'empty';
            if (visitKey === 'completed') visitKey = 'done';
            if (visitKey === 'in progress') visitKey = 'inprogress';

            if (visitKey !== visitKeyFilter) return false;

            // Check Barangay
            if (parts.length > 4 && parts[4] === 'brgy') {
              const brgyName = parts[5];
              // Use same matching logic logic as in useMemo
              const address = (serviceOrder.fullAddress || '').toLowerCase();
              let matchedBrgy = 'Unknown';
              const foundBrgy = barangays.find(b => address.includes(b.barangay.toLowerCase()));
              if (foundBrgy) matchedBrgy = foundBrgy.barangay;

              if (matchedBrgy !== brgyName) return false;
            }
          }
          return true;
        }
        return false;
      })();

      const checkValue = (val: any): boolean => {
        if (val === null || val === undefined) return false;
        if (typeof val === 'object') {
          return Object.values(val).some(v => checkValue(v));
        }
        return String(val).toLowerCase().includes(searchQuery.toLowerCase());
      };

      const matchesSearch = searchQuery === '' || checkValue(serviceOrder);

      return matchesLocation && matchesSearch;
    });

    // Apply funnel filters
    filtered = applyFunnelFilters(filtered, activeFilters);

    filtered.sort((a, b) => {
      const idA = parseInt(a.id) || 0;
      const idB = parseInt(b.id) || 0;
      return idB - idA;
    });

    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        let aValue = getVal(a, sortColumn);
        let bValue = getVal(b, sortColumn);

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
  }, [serviceOrders, selectedLocation, searchQuery, sortColumn, sortDirection, activeFilters, userRole]);

  // Derived paginated records
  const paginatedServiceOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredServiceOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredServiceOrders, currentPage]);

  const totalPages = Math.ceil(filteredServiceOrders.length / itemsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const StatusText = ({ status, type }: { status?: string, type: 'support' | 'visit' }) => {
    if (!status) return <span className="text-gray-400">-</span>;

    let textColor = '';

    if (type === 'support') {
      switch (status.toLowerCase()) {
        case 'resolved':
        case 'completed':
          textColor = 'text-green-400';
          break;
        case 'in-progress':
        case 'in progress':
          textColor = 'text-blue-400';
          break;
        case 'pending':
          textColor = 'text-orange-400';
          break;
        case 'closed':
        case 'cancelled':
          textColor = 'text-gray-400';
          break;
        default:
          textColor = 'text-gray-400';
      }
    } else {
      switch (status.toLowerCase()) {
        case 'completed':
          textColor = 'text-green-400';
          break;
        case 'scheduled':
        case 'reschedule':
        case 'in progress':
          textColor = 'text-blue-400';
          break;
        case 'pending':
          textColor = 'text-orange-400';
          break;
        case 'cancelled':
        case 'failed':
          textColor = 'text-red-500';
          break;
        default:
          textColor = 'text-gray-400';
      }
    }

    return (
      <span className={`${textColor} font-bold uppercase`}>
        {status === 'in-progress' ? 'In Progress' : status}
      </span>
    );
  };

  const handleRowClick = (serviceOrder: ServiceOrder) => {
    setSelectedServiceOrder(serviceOrder);
    if (window.innerWidth < 768) {
      setMobileView('details');
    }
  };

  const handleLocationSelect = (locationId: string) => {
    setSelectedLocation(locationId);
    setMobileMenuOpen(false);
    setMobileView('orders');
  };

  const handleMobileBack = () => {
    if (mobileView === 'details') {
      setSelectedServiceOrder(null);
      setMobileView('orders');
    } else if (mobileView === 'orders') {
      setMobileView('locations');
    }
  };

  const handleMobileRowClick = (serviceOrder: ServiceOrder) => {
    setSelectedServiceOrder(serviceOrder);
    setMobileView('details');
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

  const renderCellValue = (serviceOrder: ServiceOrder, columnKey: string) => {
    switch (columnKey) {
      case 'timestamp':
        return serviceOrder.timestamp;
      case 'supportStatus':
        return <StatusText status={serviceOrder.supportStatus} type="support" />;
      case 'visitStatus':
        return <StatusText status={serviceOrder.visitStatus} type="visit" />;
      case 'fullName':
        return serviceOrder.fullName;
      case 'contactNumber':
        return serviceOrder.contactNumber;
      case 'fullAddress':
        return <span title={serviceOrder.fullAddress}>{serviceOrder.fullAddress}</span>;
      case 'concern':
        return serviceOrder.concern;
      case 'concernRemarks':
        return serviceOrder.concernRemarks || '-';
      case 'requestedBy':
        return serviceOrder.requestedBy || '-';
      case 'assignedEmail':
        return serviceOrder.assignedEmail || '-';
      case 'repairCategory':
        return serviceOrder.repairCategory || '-';
      case 'modifiedBy':
        return serviceOrder.modifiedBy || '-';
      case 'modifiedDate':
        return serviceOrder.modifiedDate;
      default:
        return '-';
    }
  };

  return (
    <div className={`${isDarkMode ? 'bg-gray-950' : 'bg-gray-50'
      } h-full flex flex-col md:flex-row overflow-hidden pb-16 md:pb-0`}>
      {/* Desktop Sidebar - Hidden on mobile */}
      {userRole.toLowerCase() !== 'technician' && (
        <div className={`hidden md:flex border-r flex-shrink-0 flex-col relative ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
          }`} style={{ width: `${sidebarWidth}px` }}>
          <div className={`p-4 border-b flex-shrink-0 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
            <div className="flex items-center mb-1">
              <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Service Orders</h2>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {/* All Level */}
            <button
              onClick={() => setSelectedLocation('all')}
              className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                }`}
              style={selectedLocation === 'all' ? {
                backgroundColor: colorPalette?.primary ? `${colorPalette.primary}33` : 'rgba(249, 115, 22, 0.2)',
                color: colorPalette?.primary || '#7c3aed',
                fontWeight: 500
              } : {
                color: isDarkMode ? '#d1d5db' : '#374151'
              }}
            >
              <div className="flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                <span>All Service Orders</span>
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
            {/* Status Level */}
            {locationItems.items.map((category) => {
              const isSelected = selectedLocation === category.id || selectedLocation.startsWith(`${category.id}:`);
              const isExpanded = expandedLocations.has(category.id);

              const getStatusColor = (val: string) => {
                switch (val) {
                  case 'resolved': return 'text-green-500';
                  case 'failed': return 'text-red-500';
                  case 'inprogress': return 'text-blue-500';
                  case 'forvisit': return 'text-purple-500';
                  case 'open': return 'text-orange-500';
                  default: return 'text-gray-500';
                }
              };

              return (
                <div key={category.id}>
                  <button
                    onClick={() => setSelectedLocation(category.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                      }`}
                    style={selectedLocation === category.id ? {
                      backgroundColor: colorPalette?.primary ? `${colorPalette.primary}33` : 'rgba(249, 115, 22, 0.2)',
                      color: colorPalette?.primary || '#7c3aed',
                      fontWeight: 500
                    } : {
                      color: isDarkMode ? '#d1d5db' : '#374151'
                    }}
                  >
                    <div className="flex items-center flex-1">
                      <div className={`h-2.5 w-2.5 rounded-full mr-3 ${getStatusColor(category.id.split(':')[1]).replace('text-', 'bg-')}`} />
                      <span className={`font-medium ${selectedLocation === category.id ? '' : isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{category.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {category.count > 0 && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${selectedLocation === category.id ? '' : isDarkMode ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400'}`}
                          style={selectedLocation === category.id ? {
                            backgroundColor: colorPalette?.primary || '#7c3aed',
                            color: 'white'
                          } : {}}>
                          {category.count}
                        </span>
                      )}
                      <button
                        onClick={(e) => toggleLocationExpansion(e, category.id)}
                        className={`p-1 rounded transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                      >
                        {isExpanded ? (
                          <ChevronDown className={`h-4 w-4 ${selectedLocation === category.id ? 'text-current' : 'text-gray-400'}`} />
                        ) : (
                          <ChevronRight className={`h-4 w-4 ${selectedLocation === category.id ? 'text-current' : 'text-gray-400'}`} />
                        )}
                      </button>
                    </div>
                  </button>

                  {/* Visit Status Level */}
                  {isExpanded && category.visits.map((visit) => {
                    const isVisitSelected = selectedLocation === visit.id || selectedLocation.startsWith(`${visit.id}:`);
                    const isVisitExpanded = expandedLocations.has(visit.id);

                    return (
                      <div key={visit.id}>
                        <button
                          onClick={() => setSelectedLocation(visit.id)}
                          className={`w-full flex items-center justify-between pl-10 pr-4 py-2 text-xs transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                            }`}
                          style={selectedLocation === visit.id ? {
                            backgroundColor: colorPalette?.primary ? `${colorPalette.primary}33` : 'rgba(249, 115, 22, 0.2)',
                            color: colorPalette?.primary || '#7c3aed'
                          } : {
                            color: isDarkMode ? '#9ca3af' : '#4b5563'
                          }}
                        >
                          <span className="truncate flex-1 text-left">{visit.name}</span>
                          <div className="flex items-center space-x-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${selectedLocation === visit.id ? '' : 'bg-gray-800 text-gray-500'}`}
                              style={selectedLocation === visit.id ? {
                                backgroundColor: colorPalette?.primary || '#7c3aed',
                                color: 'white'
                              } : {}}>
                              {visit.count}
                            </span>
                            <button
                              onClick={(e) => toggleLocationExpansion(e, visit.id)}
                              className={`p-0.5 rounded transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                            >
                              {isVisitExpanded ? (
                                <ChevronDown className={`h-3.5 w-3.5 ${selectedLocation === visit.id ? 'text-current' : 'text-gray-500'}`} />
                              ) : (
                                <ChevronRight className={`h-3.5 w-3.5 ${selectedLocation === visit.id ? 'text-current' : 'text-gray-500'}`} />
                              )}
                            </button>
                          </div>
                        </button>

                        {/* Barangay Level */}
                        {isVisitExpanded && visit.barangays.map((brgy) => {
                          return (
                            <button
                              key={brgy.id}
                              onClick={() => setSelectedLocation(brgy.id)}
                              className={`w-full flex items-center justify-between pl-16 pr-4 py-1.5 text-[10px] transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                                }`}
                              style={selectedLocation === brgy.id ? {
                                backgroundColor: colorPalette?.primary ? `${colorPalette.primary}33` : 'rgba(249, 115, 22, 0.2)',
                                color: colorPalette?.primary || '#7c3aed',
                                fontWeight: 'bold'
                              } : {
                                color: isDarkMode ? '#6b7280' : '#4b5563'
                              }}
                            >
                              <span className="truncate flex-1 text-left">{brgy.name}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] ${selectedLocation === brgy.id ? '' : 'bg-gray-800 text-gray-600'}`}
                                style={selectedLocation === brgy.id ? {
                                  backgroundColor: colorPalette?.primary || '#7c3aed',
                                  color: 'white'
                                } : {}}>
                                {brgy.count}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <div
            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-orange-500 transition-colors z-10"
            onMouseDown={handleMouseDownSidebarResize}
          />
        </div>
      )}

      {/* Mobile Location View */}
      {mobileView === 'locations' && (
        <div className={`md:hidden flex-1 flex flex-col overflow-hidden ${isDarkMode ? 'bg-gray-950' : 'bg-gray-50'
          }`}>
          <div className={`p-4 border-b ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
            }`}>
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Service Orders</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {/* All Level */}
            <button
              onClick={() => {
                setSelectedLocation('all');
                setMobileView('orders');
              }}
              className={`w-full flex items-center justify-between px-4 py-4 text-sm transition-colors border-b ${isDarkMode ? 'hover:bg-gray-800 border-gray-800' : 'hover:bg-gray-100 border-gray-200'}`}
              style={selectedLocation === 'all' ? {
                backgroundColor: colorPalette?.primary ? `${colorPalette.primary}33` : 'rgba(249, 115, 22, 0.2)',
                color: colorPalette?.primary || '#7c3aed'
              } : {
                color: isDarkMode ? '#d1d5db' : '#374151'
              }}
            >
              <div className="flex items-center">
                <FileText className="h-5 w-5 mr-3" />
                <span className="capitalize text-base">All Service Orders</span>
              </div>
              <span className="px-3 py-1 rounded-full text-sm bg-gray-700 text-gray-300"
                style={selectedLocation === 'all' ? {
                  backgroundColor: colorPalette?.primary || '#7c3aed',
                  color: 'white'
                } : {}}>
                {locationItems.total}
              </span>
            </button>

            {/* Status Level Mobile */}
            {locationItems.items.map((category) => {
              const isSelected = selectedLocation === category.id || selectedLocation.startsWith(`${category.id}:`);
              const isExpanded = expandedLocations.has(category.id);
              const getStatusColor = (val: string) => {
                switch (val) {
                  case 'resolved': return 'text-green-500';
                  case 'failed': return 'text-red-500';
                  case 'inprogress': return 'text-blue-500';
                  case 'forvisit': return 'text-purple-500';
                  case 'open': return 'text-orange-500';
                  default: return 'text-gray-500';
                }
              };

              return (
                <div key={category.id} className="border-b border-gray-800">
                  <button
                    onClick={() => {
                      setSelectedLocation(category.id);
                      setMobileView('orders');
                    }}
                    className={`w-full flex items-center justify-between px-4 py-4 text-sm transition-colors ${selectedLocation === category.id ? '' : 'text-gray-300'}`}
                    style={selectedLocation === category.id ? {
                      backgroundColor: colorPalette?.primary ? `${colorPalette.primary}33` : 'rgba(249, 115, 22, 0.2)',
                      color: colorPalette?.primary || '#7c3aed'
                    } : {}}
                  >
                    <div className="flex items-center flex-1">
                      <button
                        onClick={(e) => toggleLocationExpansion(e, category.id)}
                        className="p-1 mr-2"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                      </button>
                      <div className={`h-2.5 w-2.5 rounded-full mr-3 ${getStatusColor(category.id.split(':')[1]).replace('text-', 'bg-')}`} />
                      <span className="capitalize text-base">{category.name}</span>
                    </div>
                    {category.count > 0 && (
                      <span className="px-3 py-1 rounded-full text-sm bg-gray-700 text-gray-300"
                        style={selectedLocation === category.id ? {
                          backgroundColor: colorPalette?.primary || '#7c3aed',
                          color: 'white'
                        } : {}}>
                        {category.count}
                      </span>
                    )}
                  </button>

                  {/* Visit Status Level Mobile */}
                  {isExpanded && category.visits.map((visit) => {
                    const isVisitSelected = selectedLocation === visit.id || selectedLocation.startsWith(`${visit.id}:`);
                    const isVisitExpanded = expandedLocations.has(visit.id);
                    return (
                      <div key={visit.id}>
                        <button
                          onClick={() => {
                            setSelectedLocation(visit.id);
                            setMobileView('orders');
                          }}
                          className={`w-full flex items-center justify-between pl-12 pr-4 py-3 text-sm transition-colors ${selectedLocation === visit.id ? '' : 'text-gray-400'}`}
                          style={selectedLocation === visit.id ? {
                            backgroundColor: colorPalette?.primary ? `${colorPalette.primary}22` : 'rgba(249, 115, 22, 0.1)',
                            color: colorPalette?.primary || '#7c3aed'
                          } : {}}
                        >
                          <div className="flex items-center flex-1">
                            <button
                              onClick={(e) => toggleLocationExpansion(e, visit.id)}
                              className="p-1 mr-1"
                            >
                              {isVisitExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>
                            <span className="text-base">{visit.name}</span>
                          </div>
                          {visit.count > 0 && (
                            <span className="text-xs opacity-60"
                              style={selectedLocation === visit.id ? {
                                backgroundColor: colorPalette?.primary || '#7c3aed',
                                color: 'white',
                                padding: '2px 6px',
                                borderRadius: '9999px'
                              } : {
                                padding: '2px 6px',
                                borderRadius: '9999px',
                                backgroundColor: '#374151'
                              }}
                            >{visit.count}</span>
                          )}
                        </button>

                        {/* Barangay Level Mobile */}
                        {isVisitExpanded && visit.barangays.map((brgy) => (
                          <button
                            key={brgy.id}
                            onClick={() => {
                              setSelectedLocation(brgy.id);
                              setMobileView('orders');
                            }}
                            className={`w-full flex items-center justify-between pl-20 pr-4 py-2 text-sm transition-colors ${selectedLocation === brgy.id ? '' : 'text-gray-500'}`}
                            style={selectedLocation === brgy.id ? {
                              color: colorPalette?.primary || '#7c3aed',
                              fontWeight: 'bold'
                            } : {}}
                          >
                            <div className="flex items-center flex-1">
                              <span className="w-2 h-2 rounded-full bg-current mr-3 opacity-40"></span>
                              <span className="text-base">{brgy.name}</span>
                            </div>
                            {brgy.count > 0 && (
                              <span className="text-xs opacity-50"
                                style={selectedLocation === brgy.id ? {
                                  backgroundColor: colorPalette?.primary || '#7c3aed',
                                  color: 'white',
                                  padding: '2px 6px',
                                  borderRadius: '9999px'
                                } : {
                                  padding: '2px 6px',
                                  borderRadius: '9999px',
                                  backgroundColor: '#374151'
                                }}
                              >{brgy.count}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Mobile Overlay Menu */}
      {mobileMenuOpen && userRole.toLowerCase() !== 'technician' && mobileView === 'orders' && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)} />
          <div className={`absolute inset-y-0 left-0 w-64 shadow-xl flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-white'
            }`}>
            <div className={`p-4 border-b flex items-center justify-between ${isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
              <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Filters</h2>
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
                className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${selectedLocation === 'all' ? '' : 'text-gray-300'}`}
                style={selectedLocation === 'all' ? {
                  backgroundColor: colorPalette?.primary ? `${colorPalette.primary}33` : 'rgba(249, 115, 22, 0.2)',
                  color: colorPalette?.primary || '#7c3aed',
                  fontWeight: 500
                } : {}}
              >
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  <span>All Service Orders</span>
                </div>
                <span className="px-2 py-1 rounded-full text-xs bg-gray-700 text-gray-300"
                  style={selectedLocation === 'all' ? {
                    backgroundColor: colorPalette?.primary || '#7c3aed',
                    color: 'white'
                  } : {}}>
                  {locationItems.total}
                </span>
              </button>

              {/* Status Level Overlay */}
              {locationItems.items.map((category) => {
                const isSelected = selectedLocation === category.id || selectedLocation.startsWith(`${category.id}:`);
                const isExpanded = expandedLocations.has(category.id);
                const getStatusColor = (val: string) => {
                  switch (val) {
                    case 'resolved': return 'text-green-500';
                    case 'failed': return 'text-red-500';
                    case 'inprogress': return 'text-blue-500';
                    case 'forvisit': return 'text-purple-500';
                    case 'open': return 'text-orange-500';
                    default: return 'text-gray-500';
                  }
                };

                return (
                  <div key={category.id}>
                    <button
                      onClick={() => {
                        setSelectedLocation(category.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${selectedLocation === category.id ? '' : 'text-gray-300'}`}
                      style={selectedLocation === category.id ? {
                        backgroundColor: colorPalette?.primary ? `${colorPalette.primary}33` : 'rgba(249, 115, 22, 0.2)',
                        color: colorPalette?.primary || '#7c3aed',
                        fontWeight: 500
                      } : {}}
                    >
                      <div className="flex items-center flex-1">
                        <button
                          onClick={(e) => toggleLocationExpansion(e, category.id)}
                          className="p-1 mr-1"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                        <div className={`h-2.5 w-2.5 rounded-full mr-3 ${getStatusColor(category.id.split(':')[1]).replace('text-', 'bg-')}`} />
                        <span>{category.name}</span>
                      </div>
                      {category.count > 0 && (
                        <span className="px-2 py-1 rounded-full text-xs bg-gray-700 text-gray-300"
                          style={selectedLocation === category.id ? {
                            backgroundColor: colorPalette?.primary || '#7c3aed',
                            color: 'white'
                          } : {}}>
                          {category.count}
                        </span>
                      )}
                    </button>

                    {/* Visit Level Overlay */}
                    {isExpanded && category.visits.map((visit) => {
                      const isVisitExpanded = expandedLocations.has(visit.id);
                      return (
                        <div key={visit.id}>
                          <button
                            onClick={() => {
                              setSelectedLocation(visit.id);
                              setMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between pl-10 pr-4 py-2 text-sm transition-colors ${selectedLocation === visit.id ? '' : 'text-gray-400'}`}
                            style={selectedLocation === visit.id ? {
                              backgroundColor: colorPalette?.primary ? `${colorPalette.primary}22` : 'rgba(249, 115, 22, 0.1)',
                              color: colorPalette?.primary || '#7c3aed'
                            } : {}}
                          >
                            <div className="flex items-center flex-1">
                              <button
                                onClick={(e) => toggleLocationExpansion(e, visit.id)}
                                className="p-1 mr-1"
                              >
                                {isVisitExpanded ? (
                                  <ChevronDown className="h-3 w-3" />
                                ) : (
                                  <ChevronRight className="h-3 w-3" />
                                )}
                              </button>
                              <span>{visit.name}</span>
                            </div>
                            {visit.count > 0 && (
                              <span className="text-xs opacity-60"
                                style={selectedLocation === visit.id ? {
                                  backgroundColor: colorPalette?.primary || '#7c3aed',
                                  color: 'white',
                                  padding: '2px 6px',
                                  borderRadius: '9999px'
                                } : {
                                  padding: '2px 6px',
                                  borderRadius: '9999px',
                                  backgroundColor: '#374151'
                                }}
                              >{visit.count}</span>
                            )}
                          </button>

                          {/* Barangay Level Overlay */}
                          {isVisitExpanded && visit.barangays.map((brgy) => (
                            <button
                              key={brgy.id}
                              onClick={() => {
                                setSelectedLocation(brgy.id);
                                setMobileMenuOpen(false);
                              }}
                              className={`w-full flex items-center justify-between pl-16 pr-4 py-1.5 text-xs transition-colors ${selectedLocation === brgy.id ? '' : 'text-gray-500'}`}
                              style={selectedLocation === brgy.id ? {
                                color: colorPalette?.primary || '#7c3aed',
                                fontWeight: 'bold'
                              } : {}}
                            >
                              <div className="flex items-center flex-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-current mr-2 opacity-40"></span>
                                <span>{brgy.name}</span>
                              </div>
                              {brgy.count > 0 && (
                                <span className="text-[10px] opacity-50"
                                  style={selectedLocation === brgy.id ? {
                                    backgroundColor: colorPalette?.primary || '#7c3aed',
                                    color: 'white',
                                    padding: '2px 6px',
                                    borderRadius: '9999px'
                                  } : {
                                    padding: '2px 6px',
                                    borderRadius: '9999px',
                                    backgroundColor: '#374151'
                                  }}
                                >{brgy.count}</span>
                              )}
                            </button>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`overflow-hidden flex-1 flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-white'
        } ${mobileView === 'locations' || mobileView === 'details' ? 'hidden md:flex' : ''}`}>
        <div className="flex flex-col h-full">
          <div className={`p-4 border-b flex-shrink-0 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
            }`}>
            <div className="flex items-center space-x-3">
              {userRole.toLowerCase() !== 'technician' && mobileView === 'orders' && (
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="md:hidden bg-gray-700 hover:bg-gray-600 text-white p-2 rounded text-sm transition-colors flex items-center justify-center"
                  aria-label="Open filter menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
              )}
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search service orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full rounded pl-10 pr-4 py-2 border focus:outline-none ${isDarkMode
                    ? 'bg-gray-800 text-white border-gray-700'
                    : 'bg-gray-100 text-gray-900 border-gray-300'
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
              <div className="hidden md:flex space-x-2">
                <button
                  onClick={() => setIsFunnelFilterOpen(true)}
                  title={activeFilters && Object.keys(activeFilters).length > 0
                    ? `Active Filters:\n${Object.entries(activeFilters).map(([key, filter]: [string, any]) => {
                      const colName = filterColumns.find(c => c.key === key)?.label || key;
                      if (filter.type === 'text') return `${colName}: ${filter.value}`;
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
                    : "Filter Service Orders"
                  }
                  className={`px-4 py-2 rounded text-sm transition-colors flex items-center ${activeFilters && Object.keys(activeFilters).length > 0
                    ? 'text-red-500 hover:bg-red-500/10'
                    : isDarkMode
                      ? 'hover:bg-gray-700 text-white'
                      : 'hover:bg-gray-200 text-gray-900'
                    }`}
                >
                  <Filter className="h-5 w-5" />
                </button>
                {displayMode === 'table' && (
                  <div className="relative" ref={filterDropdownRef}>
                    <button
                      className={`px-4 py-2 rounded text-sm transition-colors flex items-center ${isDarkMode
                        ? 'hover:bg-gray-800 text-white'
                        : 'hover:bg-gray-100 text-gray-900'
                        }`}
                      onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                    >
                      <Columns3 className="h-5 w-5" />
                    </button>
                    {filterDropdownOpen && (
                      <div className={`absolute top-full right-0 mt-2 w-80 border rounded shadow-lg z-50 max-h-96 flex flex-col ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                        }`}>
                        <div className={`p-3 border-b flex items-center justify-between ${isDarkMode ? 'border-gray-700' : 'border-gray-200'
                          }`}>
                          <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>Column Visibility</span>
                          <div className="flex space-x-2">
                            <button
                              onClick={handleSelectAllColumns}
                              className="text-xs transition-colors"
                              style={{
                                color: colorPalette?.primary || '#7c3aed'
                              }}
                              onMouseEnter={(e) => {
                                if (colorPalette?.accent) {
                                  e.currentTarget.style.color = colorPalette.accent;
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (colorPalette?.primary) {
                                  e.currentTarget.style.color = colorPalette.primary;
                                }
                              }}
                            >
                              Select All
                            </button>
                            <span className="text-gray-600">|</span>
                            <button
                              onClick={handleDeselectAllColumns}
                              className="text-xs transition-colors"
                              style={{
                                color: colorPalette?.primary || '#7c3aed'
                              }}
                              onMouseEnter={(e) => {
                                if (colorPalette?.accent) {
                                  e.currentTarget.style.color = colorPalette.accent;
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (colorPalette?.primary) {
                                  e.currentTarget.style.color = colorPalette.primary;
                                }
                              }}
                            >
                              Deselect All
                            </button>
                          </div>
                        </div>
                        <div className="overflow-y-auto flex-1">
                          {allColumns.map((column) => (
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
                                className={`mr-3 h-4 w-4 rounded text-orange-600 focus:ring-orange-500 ${isDarkMode
                                  ? 'border-gray-600 bg-gray-700 focus:ring-offset-gray-800'
                                  : 'border-gray-300 bg-white focus:ring-offset-white'
                                  }`}
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
                    className={`px-4 py-2 rounded text-sm transition-colors flex items-center ${isDarkMode
                      ? 'hover:bg-gray-800 text-white'
                      : 'hover:bg-gray-100 text-gray-900'
                      }`}
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                  >
                    <span>{displayMode === 'card' ? 'Card' : 'Table'}</span>
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {dropdownOpen && (
                    <div className={`fixed right-auto mt-1 w-36 border rounded shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                      }`}>
                      <button
                        onClick={() => {
                          setDisplayMode('card');
                          setDropdownOpen(false);
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                          }`}
                        style={displayMode === 'card' ? {
                          color: colorPalette?.primary || '#7c3aed'
                        } : {
                          color: isDarkMode ? '#ffffff' : '#111827'
                        }}
                      >
                        Card View
                      </button>
                      <button
                        onClick={() => {
                          setDisplayMode('table');
                          setDropdownOpen(false);
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                          }`}
                        style={displayMode === 'table' ? {
                          color: colorPalette?.primary || '#7c3aed'
                        } : {
                          color: isDarkMode ? '#ffffff' : '#111827'
                        }}
                      >
                        Table View
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="text-white px-3 py-2 rounded text-sm flex items-center transition-colors disabled:bg-gray-600"
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
                  <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            <div className={`flex-1 ${displayMode === 'table' ? 'overflow-hidden' : 'overflow-y-auto'}`} ref={cardScrollRef}>
              {isLoading ? (
                <div className={`px-4 py-12 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <div className="animate-pulse flex flex-col items-center">
                    <div className={`h-4 w-1/3 rounded mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                    <div className={`h-4 w-1/2 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                  </div>
                  <p className="mt-4">Loading service orders...</p>
                </div>
              ) : error ? (
                <div className={`px-4 py-12 text-center ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                  <p>{error}</p>
                  <button
                    onClick={handleRefresh}
                    className={`mt-4 px-4 py-2 rounded text-white ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-400 hover:bg-gray-500'}`}>
                    Retry
                  </button>
                </div>
              ) : displayMode === 'card' ? (
                paginatedServiceOrders.length > 0 ? (
                  <div className="space-y-0">
                    {paginatedServiceOrders.map((serviceOrder) => (
                      <div
                        key={serviceOrder.id}
                        onClick={() => window.innerWidth < 768 ? handleMobileRowClick(serviceOrder) : handleRowClick(serviceOrder)}
                        className={`px-4 py-3 cursor-pointer transition-colors border-b ${isDarkMode
                          ? `hover:bg-gray-800 border-gray-800 ${selectedServiceOrder?.id === serviceOrder.id ? 'bg-gray-800' : ''}`
                          : `hover:bg-gray-100 border-gray-200 ${selectedServiceOrder?.id === serviceOrder.id ? 'bg-gray-100' : ''}`
                          }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className={`font-medium text-sm mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'
                              }`}>
                              {serviceOrder.fullName}
                            </div>
                            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                              {serviceOrder.timestamp} | {serviceOrder.fullAddress}
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-1 ml-4 flex-shrink-0">
                            <StatusText status={serviceOrder.supportStatus} type="support" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                    No service orders found matching your filters
                  </div>
                )
              ) : (
                <div className="h-full relative flex flex-col">
                  <div className="flex-1 overflow-auto" ref={tableScrollRef}>
                    <table ref={tableRef} className="w-max min-w-full text-sm border-separate border-spacing-0">
                      <thead>
                        <tr className={`border-b sticky top-0 z-10 ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-100'
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
                              className={`text-left py-3 px-3 font-normal ${column.width} whitespace-nowrap relative group cursor-move ${isDarkMode
                                ? `text-gray-400 bg-gray-800 ${index < filteredColumns.length - 1 ? 'border-r border-gray-700' : ''}`
                                : `text-gray-600 bg-gray-100 ${index < filteredColumns.length - 1 ? 'border-r border-gray-200' : ''}`
                                } ${draggedColumn === column.key ? 'opacity-50' : ''
                                } ${dragOverColumn === column.key ? 'bg-orange-500 bg-opacity-20' : ''
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
                        {paginatedServiceOrders.length > 0 ? (
                          paginatedServiceOrders.map((serviceOrder) => (
                            <tr
                              key={serviceOrder.id}
                              className={`border-b cursor-pointer transition-colors ${isDarkMode
                                ? `border-gray-800 hover:bg-gray-900 ${selectedServiceOrder?.id === serviceOrder.id ? 'bg-gray-800' : ''}`
                                : `border-gray-200 hover:bg-gray-100 ${selectedServiceOrder?.id === serviceOrder.id ? 'bg-gray-100' : ''}`
                                }`}
                              onClick={() => window.innerWidth < 768 ? handleMobileRowClick(serviceOrder) : handleRowClick(serviceOrder)}
                            >
                              {filteredColumns.map((column, index) => (
                                <td
                                  key={column.key}
                                  className={`py-4 px-3 ${isDarkMode
                                    ? `text-white ${index < filteredColumns.length - 1 ? 'border-r border-gray-800' : ''}`
                                    : `text-gray-900 ${index < filteredColumns.length - 1 ? 'border-r border-gray-200' : ''}`
                                    }`}
                                  style={{
                                    width: columnWidths[column.key] ? `${columnWidths[column.key]}px` : undefined,
                                    maxWidth: columnWidths[column.key] ? `${columnWidths[column.key]}px` : undefined
                                  }}
                                >
                                  <div className="truncate">
                                    {renderCellValue(serviceOrder, column.key)}
                                  </div>
                                </td>
                              ))}
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={filteredColumns.length} className={`px-4 py-12 text-center border-b ${isDarkMode ? 'text-gray-400 border-gray-800' : 'text-gray-600 border-gray-200'
                              }`}>
                              No service orders found matching your filters
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {!isLoading && filteredServiceOrders.length > 0 && totalPages > 1 && (
              <div className={`border-t p-4 flex items-center justify-between ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredServiceOrders.length)}</span> of <span className="font-medium">{filteredServiceOrders.length}</span> results
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
            )}
          </div>
        </div>
      </div>

      {
        selectedServiceOrder && mobileView === 'details' && (
          <div className={`md:hidden flex-1 flex flex-col overflow-hidden ${isDarkMode ? 'bg-gray-950' : 'bg-gray-50'
            }`}>
            <ServiceOrderDetails
              serviceOrder={selectedServiceOrder}
              onClose={handleMobileBack}
              onRefresh={refreshServiceOrders}
              isMobile={true}
            />
          </div>
        )
      }

      {
        selectedServiceOrder && mobileView !== 'details' && (
          <div className="hidden md:block flex-shrink-0 overflow-hidden">
            <ServiceOrderDetails
              serviceOrder={selectedServiceOrder}
              onClose={() => setSelectedServiceOrder(null)}
              onRefresh={refreshServiceOrders}
              isMobile={false}
            />
          </div>
        )
      }

      <ServiceOrderFunnelFilter
        isOpen={isFunnelFilterOpen}
        onClose={() => setIsFunnelFilterOpen(false)}
        onApplyFilters={(filters) => {
          console.log('Applied filters:', filters);
          setActiveFilters(filters);
          localStorage.setItem('serviceOrderFilters', JSON.stringify(filters));
          setIsFunnelFilterOpen(false);
        }}
        currentFilters={activeFilters}
      />
    </div >
  );
};

export default ServiceOrderPage;
