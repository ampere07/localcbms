import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FileText, X, Columns3, ArrowUp, ArrowDown, Menu, Filter, RefreshCw, ChevronDown, ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight } from 'lucide-react';
import GlobalSearch from './globalfunctions/GlobalSearch';
import ServiceOrderDetails from '../components/ServiceOrderDetails';
import ServiceOrderFunnelFilter, { FilterValues, allColumns as filterColumns } from '../components/filters/ServiceOrderFunnelFilter';
import { useServiceOrderStore, type ServiceOrder } from '../store/serviceOrderStore';
import { getCities, City } from '../services/cityService';
import { getRegions, Region } from '../services/regionService';
import { barangayService, Barangay } from '../services/barangayService';
import { settingsColorPaletteService, ColorPalette } from '../services/settingsColorPaletteService';
import pusher from '../services/pusherService';

const hexToRgba = (hex: string, opacity: number) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${opacity})` : hex;
};


interface LocationItem {
  id: string;
  name: string;
  count: number;
}

type DisplayMode = 'card' | 'table';
type MobileView = 'locations' | 'orders' | 'details';

const allColumns = [
  { key: 'timestamp', label: 'Timestamp', width: 'min-w-40' },
  { key: 'fullName', label: 'Full Name', width: 'min-w-40' },
  { key: 'contactNumber', label: 'Contact Number', width: 'min-w-36' },
  { key: 'fullAddress', label: 'Full Address', width: 'min-w-56' },
  { key: 'concern', label: 'Concern', width: 'min-w-36' },
  { key: 'concernRemarks', label: 'Concern Remarks', width: 'min-w-48' },
  { key: 'requestedBy', label: 'Requested By', width: 'min-w-36' },
  { key: 'supportStatus', label: 'Support Status', width: 'min-w-32' },
  { key: 'assignedEmail', label: 'Assigned Email', width: 'min-w-48' },
  { key: 'repairCategory', label: 'Repair Category', width: 'min-w-36' },
  { key: 'modifiedBy', label: 'Modified By', width: 'min-w-32' },
  { key: 'modifiedDate', label: 'Modified Date', width: 'min-w-40' },
  { key: 'startTime', label: 'Start Time', width: 'min-w-40' },
  { key: 'endTime', label: 'End Time', width: 'min-w-40' },
  { key: 'duration', label: 'Duration', width: 'min-w-28' },
  { key: 'visitStatus', label: 'Visit Status', width: 'min-w-32' }
];

const ServiceOrderPage: React.FC = () => {
  const calculateDuration = (start?: string | null, end?: string | null): string => {
    if (!start || !end) return '-';
    try {
      const startTime = new Date(start);
      const endTime = new Date(end);
      const diffMs = endTime.getTime() - startTime.getTime();

      if (diffMs < 0) return 'Invalid duration';

      const diffHrs = Math.floor(diffMs / 3600000);
      const diffMins = Math.floor((diffMs % 3600000) / 60000);
      const diffSecs = Math.floor((diffMs % 60000) / 1000);

      const parts = [];
      if (diffHrs > 0) parts.push(`${diffHrs}h`);
      if (diffMins > 0) parts.push(`${diffMins}m`);
      if (diffSecs > 0 || parts.length === 0) parts.push(`${diffSecs}s`);

      return parts.join(' ');
    } catch (e) {
      return '-';
    }
  };

  const formatDateTime = (dateStr?: string | null): string => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const yyyy = date.getFullYear();
      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const hh = String(hours).padStart(2, '0');
      return `${mm}/${dd}/${yyyy} ${hh}:${minutes} ${ampm}`;
    } catch (e) {
      return '-';
    }
  };

  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedServiceOrder, setSelectedServiceOrder] = useState<ServiceOrder | null>(null);
  const { serviceOrders, isLoading, error, silentRefresh, hasMore, fetchUpdates, fetchServiceOrders } = useServiceOrderStore();
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
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    allColumns
      .map(col => col.key)
      .filter(key => key !== 'startTime' && key !== 'endTime' && key !== 'duration')
  );
  const [technicianEmail, setTechnicianEmail] = useState<string | undefined>(undefined);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
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

  const removeFilter = (key: string) => {
    const newFilters = { ...activeFilters };
    delete newFilters[key];
    setActiveFilters(newFilters);
    localStorage.setItem('serviceOrderFilters', JSON.stringify(newFilters));
  };

  // Pagination State - Managed by store
  const [itemsPerPage, setItemsPerPage] = useState<number>(25);


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
  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedLocation, searchQuery, activeFilters, sortColumn, sortDirection, itemsPerPage]);

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
        if (userData.role && userData.role.toLowerCase() === 'technician' && userData.email) {
          setTechnicianEmail(userData.email);
        }
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

  useEffect(() => {
    // Use silentRefresh on mount to check for updates without showing a spinner if we already have data
    silentRefresh(technicianEmail);
  }, [silentRefresh, technicianEmail]);

  // Real-time updates via Pusher/Soketi
  useEffect(() => {
    const handleUpdate = async (data: any) => {
      console.log('[ServiceOrder Soketi] Update received, silently refreshing:', data);
      try {
        await silentRefresh(technicianEmail);
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
  }, [technicianEmail, silentRefresh]);

  // Polling for updates every 3 seconds - Incremental fetch
  useEffect(() => {
    const POLLING_INTERVAL = 3000; // 3 seconds
    const intervalId = setInterval(async () => {
      console.log('[ServiceOrder Page] Polling for updates...');
      try {
        await fetchUpdates(technicianEmail);
      } catch (err) {
        console.error('[ServiceOrder Page] Polling failed:', err);
      }
    }, POLLING_INTERVAL);

    return () => clearInterval(intervalId);
  }, [technicianEmail, fetchUpdates]);

  // Idle detection and auto-refresh logic
  useEffect(() => {
    const IDLE_TIME_LIMIT = 15 * 60 * 1000; // 15 minutes
    let idleTimer: NodeJS.Timeout | null = null;

    const refreshData = async () => {
      console.log('User idle for 15 minutes, auto-refreshing Service Order data...');
      try {
        await fetchUpdates(technicianEmail);
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
  }, [technicianEmail, silentRefresh, fetchUpdates]);

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
    setCurrentPage(1);
    await fetchServiceOrders(true);
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

  const getVal = (item: ServiceOrder, key: string): any => {
    switch (key) {
      case 'id': return item.id;
      case 'ticketId': return item.ticketId ?? (item as any).ticket_id ?? '';
      case 'accountNumber': return item.accountNumber ?? (item as any).account_no ?? '';
      case 'fullName': return item.fullName;
      case 'contactNumber': return item.contactNumber;
      case 'emailAddress': return item.emailAddress;
      case 'fullAddress': return item.fullAddress ?? (item as any).full_address ?? '';
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
      case 'supportStatus': return item.supportStatus ?? (item as any).support_status ?? '';
      case 'visitStatus': return item.visitStatus;
      case 'timestamp': return item.timestamp;
      case 'dateInstalled': return item.dateInstalled;
      case 'modifiedBy': return item.modifiedBy ?? (item as any).updated_by_user ?? '';
      case 'modifiedDate': return item.modifiedDate ?? (item as any).updated_at ?? '';
      case 'assignedEmail': return item.assignedEmail;
      case 'requestedBy': return item.requestedBy;
      case 'serviceCharge': return item.serviceCharge;
      case 'routerModel': return item.routerModel;
      case 'routerModemSN': return item.routerModemSN ?? (item as any).router_modem_sn ?? '';
      case 'referredBy': return item.referredBy;
      case 'status': return item.status;
      case 'billingDay': return item.billingDay ?? (item as any).billing_day ?? '';
      case 'repairCategory': return item.repairCategory ?? (item as any).repair_category ?? '';
      case 'visitRemarks': return item.visitRemarks ?? (item as any).visit_remarks ?? '';
      case 'supportRemarks': return item.supportRemarks ?? (item as any).support_remarks ?? '';
      case 'priorityLevel': return item.priorityLevel ?? (item as any).priority_level ?? '';
      case 'newRouterSn': return item.newRouterSn ?? (item as any).new_router_sn ?? '';
      case 'newPlan': return item.newPlan ?? (item as any).new_plan ?? '';
      case 'contactAddress': return item.contactAddress ?? (item as any).contact_address ?? '';
      case 'startTime': return item.start_time;
      case 'endTime': return item.end_time;
      case 'duration': return calculateDuration(item.start_time, item.end_time);
      default: {
        const val = (item as any)[key];
        return val !== undefined && val !== null ? val : '';
      }
    }
  };

  const applyFunnelFilters = (orders: ServiceOrder[], filters: any): ServiceOrder[] => {
    if (!filters || Object.keys(filters).length === 0) return orders;

    return orders.filter(order => {
      return Object.entries(filters).every(([key, filter]: [string, any]) => {
        const orderValue = getVal(order, key);

        if (filter.type === 'checklist') {
          if (!filter.value || !Array.isArray(filter.value) || filter.value.length === 0) return true;

          const valStr = String(orderValue || '').toLowerCase().trim();

          if (key === 'barangay' || key === 'city' || key === 'region') {
            const address = String(order.fullAddress || '').toLowerCase();
            return filter.value.some((val: string) => {
              const filterVal = String(val).toLowerCase().trim();
              return address.includes(filterVal);
            });
          }

          return filter.value.some((val: string) => {
            const filterVal = String(val).toLowerCase().trim();
            return valStr === filterVal;
          });
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

  // 1. Initial search and funnel filtering (Global filtered set for sidebar counts)
  const globalFilteredServiceOrders = useMemo(() => {
    const isTechnician = roleId === 2 || userRole.toLowerCase() === 'technician';

    let filtered = serviceOrders.filter(serviceOrder => {
      // 1. Technician 7-Day Filter for 'Resolved' tickets
      if (isTechnician) {
        const supportStatus = (serviceOrder.supportStatus || '').toLowerCase().trim();
        if (supportStatus === 'resolved') {
          const updatedAt = serviceOrder.rawUpdatedAt;
          if (updatedAt) {
            const updatedDate = new Date(updatedAt);
            if (!isNaN(updatedDate.getTime())) {
              const sevenDaysAgo = new Date();
              sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
              if (updatedDate < sevenDaysAgo) {
                return false;
              }
            }
          }
        }
      }

      const normalizedQuery = searchQuery.toLowerCase().replace(/\s+/g, '');
      const checkValue = (val: any): boolean => {
        if (val === null || val === undefined) return false;
        if (typeof val === 'object') {
          return Object.values(val).some(v => checkValue(v));
        }
        return String(val).toLowerCase().replace(/\s+/g, '').includes(normalizedQuery);
      };

      return searchQuery === '' || checkValue(serviceOrder);
    });

    return applyFunnelFilters(filtered, activeFilters);
  }, [serviceOrders, searchQuery, activeFilters, userRole, roleId]);

  const locationItems = useMemo(() => {
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

    globalFilteredServiceOrders.forEach(so => {
      const s = (so.supportStatus || '').toLowerCase().trim();
      const v = (so.visitStatus || '').toLowerCase().trim();

      let category = 'open';
      if (s === 'resolved' || s === 'completed') category = 'resolved';
      else if (v === 'failed' || v === 'cancelled') category = 'failed';
      else if (s === 'in-progress' || s === 'in progress') category = 'inprogress';
      else if (v === 'scheduled' || v === 'reschedule') category = 'forvisit';
      else category = 'open';

      const catNode = tree[category];
      if (catNode) {
        catNode.count++;

        let visitKey = v || 'empty';
        if (visitKey === 'completed') visitKey = 'done';
        if (visitKey === 'in progress') visitKey = 'inprogress';

        if (!catNode.visits[visitKey]) {
          catNode.visits[visitKey] = { count: 0, barangays: {} };
        }
        const visitNode = catNode.visits[visitKey];
        visitNode.count++;

        const address = (so.fullAddress || '').toLowerCase();
        let matchedBrgy = 'Unknown';
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
      total: globalFilteredServiceOrders.length
    };
  }, [globalFilteredServiceOrders, barangays]);

  const filteredServiceOrders = useMemo(() => {
    let filtered = globalFilteredServiceOrders.filter(serviceOrder => {
      if (selectedLocation === 'all') return true;

      // Extract location match logic
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

        if (parts.length > 2 && parts[2] === 'visit') {
          const visitKeyFilter = parts[3];
          let visitKey = v || 'empty';
          if (visitKey === 'completed') visitKey = 'done';
          if (visitKey === 'in progress') visitKey = 'inprogress';

          if (visitKey !== visitKeyFilter) return false;

          if (parts.length > 4 && parts[4] === 'brgy') {
            const brgyName = parts[5];
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
    });

    filtered.sort((a, b) => {
      // 1. Precise database timestamp (createdAt)
      const dateA = a.createdAt || a.timestamp || '';
      const dateB = b.createdAt || b.timestamp || '';
      
      const timeA = dateA ? new Date(dateA).getTime() : 0;
      const timeB = dateB ? new Date(dateB).getTime() : 0;
      
      if (!isNaN(timeA) && !isNaN(timeB) && timeA !== timeB) {
        return timeB - timeA;
      }
      
      // 2. Fallback to ID comparison (numeric logic to ensure latest ID is first)
      const idA = parseInt(String(a.id).replace(/\D/g, '')) || 0;
      const idB = parseInt(String(b.id).replace(/\D/g, '')) || 0;
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
  }, [globalFilteredServiceOrders, selectedLocation, sortColumn, sortDirection, barangays]);

  // Derived paginated records
  const paginatedServiceOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredServiceOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredServiceOrders, currentPage, itemsPerPage]);

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
      case 'startTime':
        return formatDateTime(serviceOrder.start_time);
      case 'endTime':
        return formatDateTime(serviceOrder.end_time);
      case 'duration':
        return calculateDuration(serviceOrder.start_time, serviceOrder.end_time);
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
                <span>All Service Orders</span>
              </div>
              <span
                className={`px-2 py-1 rounded text-xs transition-colors ${selectedLocation === 'all'
                  ? 'text-white'
                  : isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
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
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${selectedLocation === category.id
                          ? 'text-white'
                          : isDarkMode ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400'
                          }`}
                          style={selectedLocation === category.id ? {
                            backgroundColor: colorPalette?.primary || '#7c3aed'
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
                            <span className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${selectedLocation === visit.id
                              ? 'text-white'
                              : isDarkMode ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400'
                              }`}
                              style={selectedLocation === visit.id ? {
                                backgroundColor: colorPalette?.primary || '#7c3aed'
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
                              <span className={`px-1.5 py-0.5 rounded text-[9px] transition-colors ${selectedLocation === brgy.id
                                ? 'text-white'
                                : isDarkMode ? 'bg-gray-800 text-gray-600' : 'bg-gray-100 text-gray-500'
                                }`}
                                style={selectedLocation === brgy.id ? {
                                  backgroundColor: colorPalette?.primary || '#7c3aed'
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
              <span className={`px-3 py-1 rounded text-sm transition-colors ${selectedLocation === 'all'
                ? 'text-white'
                : isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
                }`}
                style={selectedLocation === 'all' ? {
                  backgroundColor: colorPalette?.primary || '#7c3aed'
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
                      <span className={`px-3 py-1 rounded text-sm transition-colors ${selectedLocation === category.id
                        ? 'text-white'
                        : isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
                        }`}
                        style={selectedLocation === category.id ? {
                          backgroundColor: colorPalette?.primary || '#7c3aed'
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
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${selectedLocation === visit.id
                              ? 'text-white'
                              : isDarkMode ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400'
                              }`}
                              style={selectedLocation === visit.id ? {
                                backgroundColor: colorPalette?.primary || '#7c3aed'
                              } : {}}>
                              {visit.count}
                            </span>
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
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${selectedLocation === brgy.id
                                ? 'text-white'
                                : isDarkMode ? 'bg-gray-800 text-gray-600' : 'bg-gray-100 text-gray-500'
                                }`}
                                style={selectedLocation === brgy.id ? {
                                  backgroundColor: colorPalette?.primary || '#7c3aed'
                                } : {}}>
                                {brgy.count}
                              </span>
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
                  <span>All Service Orders</span>
                </div>
                <span className={`px-2 py-1 rounded text-xs transition-colors ${selectedLocation === 'all'
                  ? 'text-white'
                  : isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
                  }`}
                  style={selectedLocation === 'all' ? {
                    backgroundColor: colorPalette?.primary || '#7c3aed'
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
                        <span className={`px-2 py-1 rounded text-xs transition-colors ${selectedLocation === category.id
                          ? 'text-white'
                          : isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
                          }`}
                          style={selectedLocation === category.id ? {
                            backgroundColor: colorPalette?.primary || '#7c3aed'
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
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${selectedLocation === visit.id
                                ? 'text-white'
                                : isDarkMode ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400'
                                }`}
                                style={selectedLocation === visit.id ? {
                                  backgroundColor: colorPalette?.primary || '#7c3aed'
                                } : {}}>
                                {visit.count}
                              </span>
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
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${selectedLocation === brgy.id
                                  ? 'text-white'
                                  : isDarkMode ? 'bg-gray-800 text-gray-600' : 'bg-gray-100 text-gray-400'
                                  }`}
                                  style={selectedLocation === brgy.id ? {
                                    backgroundColor: colorPalette?.primary || '#7c3aed'
                                  } : {}}>
                                  {brgy.count}
                                </span>
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
              <GlobalSearch 
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                isDarkMode={isDarkMode}
                colorPalette={colorPalette}
                placeholder="Search service orders..."
              />
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
                      title="Column Visibility"
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

          {/* Active Funnel Filters Row */}
          {activeFilters && Object.keys(activeFilters).length > 0 && (
            <div className={`px-4 py-2 border-b flex flex-wrap items-center gap-2 overflow-x-auto no-scrollbar ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Active Filters:
              </span>
              <div className="flex flex-wrap gap-2">
                {Object.entries(activeFilters).map(([key, filter]: [string, any]) => {
                  const column = filterColumns.find(c => c.key === key);
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
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFilter(key);
                        }}
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
                    localStorage.removeItem('serviceOrderFilters');
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
                <div className={`flex items-center gap-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <div className="flex items-center gap-2">
                    <span>Show</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => setItemsPerPage(Number(e.target.value))}
                      className={`px-2 py-1 rounded border focus:outline-none text-xs transition-colors ${isDarkMode
                        ? 'bg-gray-800 border-gray-700 text-white focus:border-orange-500'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-orange-500'
                        }`}
                    >
                      {[10, 25, 50, 100].map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                    <span>entries</span>
                  </div>
                  <div>
                    Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredServiceOrders.length)}</span> of <span className="font-medium">{filteredServiceOrders.length}</span> results
                  </div>
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
              onRefresh={fetchUpdates}
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
              onRefresh={fetchUpdates}
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
