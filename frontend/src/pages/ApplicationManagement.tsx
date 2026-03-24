import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FileText, Search, Columns3, ChevronDown, ArrowUp, ArrowDown, Menu, X, Filter, RefreshCw, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ExternalLink, Globe, Calendar } from 'lucide-react';
import ApplicationDetails from '../components/ApplicationDetails';
import AddApplicationModal from '../modals/AddApplicationModal';
import ApplicationFunnelFilter, { allColumns as filterColumns } from '../filter/ApplicationFunnelFilter';
import { useApplicationStore } from '../store/applicationStore';
import { Application } from '../types/application';
import { getCities, City } from '../services/cityService';
import { getRegions, Region } from '../services/regionService';
import { barangayService, Barangay } from '../services/barangayService';
import { locationEvents, LOCATION_EVENTS } from '../services/locationEvents';
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

const allColumns = [
  { key: 'timestamp', label: 'Timestamp', width: 'min-w-40' },
  { key: 'status', label: 'Status', width: 'min-w-28' },
  { key: 'customerName', label: 'Customer Name', width: 'min-w-48' },
  { key: 'firstName', label: 'First Name', width: 'min-w-32' },
  { key: 'middleInitial', label: 'Middle Initial', width: 'min-w-28' },
  { key: 'lastName', label: 'Last Name', width: 'min-w-32' },
  { key: 'emailAddress', label: 'Email Address', width: 'min-w-48' },
  { key: 'mobileNumber', label: 'Mobile Number', width: 'min-w-36' },
  { key: 'secondaryMobileNumber', label: 'Secondary Mobile Number', width: 'min-w-40' },
  { key: 'installationAddress', label: 'Installation Address', width: 'min-w-56' },
  { key: 'landmark', label: 'Landmark', width: 'min-w-32' },
  { key: 'region', label: 'Region', width: 'min-w-28' },
  { key: 'city', label: 'City', width: 'min-w-28' },
  { key: 'barangay', label: 'Barangay', width: 'min-w-32' },

  { key: 'desiredPlan', label: 'Desired Plan', width: 'min-w-36' },
  { key: 'promo', label: 'Promo', width: 'min-w-28' },
  { key: 'referredBy', label: 'Referred By', width: 'min-w-32' },
  { key: 'createDate', label: 'Create Date', width: 'min-w-32' },
  { key: 'createTime', label: 'Create Time', width: 'min-w-28' }
];

interface ApplicationManagementProps {
  onNavigate?: (section: string, extra?: string) => void;
}

const ApplicationManagement: React.FC<ApplicationManagementProps> = ({ onNavigate }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const { applications, isLoading, error, fetchApplications, refreshApplications, silentRefresh, hasMore } = useApplicationStore();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [cities, setCities] = useState<City[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());
  const [locationDataLoaded, setLocationDataLoaded] = useState<boolean>(false);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('card');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [funnelFilters, setFunnelFilters] = useState<any>(() => {
    const saved = localStorage.getItem('applicationFunnelFilters');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.error('Failed to load filters:', err);
      }
    }
    return {};
  });
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem('applicationManagementVisibleColumns');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.error('Failed to load column visibility:', err);
      }
    }
    return allColumns.map(col => col.key);
  });
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
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isFunnelFilterOpen, setIsFunnelFilterOpen] = useState<boolean>(false);
  const [timestampFrom, setTimestampFrom] = useState<string>('');
  const [timestampTo, setTimestampTo] = useState<string>('');
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
  const [itemsPerPage, setItemsPerPage] = useState<number>(25);

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
        const [citiesData, regionsData, barangaysRes] = await Promise.all([
          getCities(),
          getRegions(),
          barangayService.getAll()
        ]);
        setCities(citiesData || []);
        setRegions(regionsData || []);
        setBarangays(barangaysRes.success ? barangaysRes.data : []);
        setLocationDataLoaded(true);
      } catch (err) {
        console.error('Failed to fetch location data:', err);
        setCities([]);
        setRegions([]);
        setBarangays([]);
        setLocationDataLoaded(true);
      }
    };

    fetchLocationData();
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
    refreshApplications();
  }, [refreshApplications]);

  // Global Soketi/Pusher connection for real-time application data
  useEffect(() => {
    const channel = pusher.subscribe('applications');

    channel.bind('pusher:subscription_succeeded', () => {
      console.log('[ApplicationManagement Soketi] Successfully subscribed to applications channel');
    });

    channel.bind('pusher:subscription_error', (error: any) => {
      console.error('[ApplicationManagement Soketi] Subscription error:', error);
    });

    channel.bind('new-application', async (data: any) => {
      console.log('[ApplicationManagement Soketi] New application event RECEIVED:', data);

      const appId = data.id || (data.application && data.application.id);

      if (appId) {
        try {
          // 1. Try to fetch the full details for this specific application for immediate UI update
          const { getApplication } = await import('../services/applicationService');
          const fullApp = await getApplication(String(appId));
          console.log('[ApplicationManagement Soketi] Full application details fetched:', fullApp);

          // 2. Add/Update in store immediately
          const { addNotificationRecord } = useApplicationStore.getState();
          addNotificationRecord(fullApp);
        } catch (err) {
          console.warn('[ApplicationManagement Soketi] Failed to fetch individual app details, fallback to silent refresh:', err);
        }
      }

      // Always trigger a silent refresh to ensure counts and filters are synced
      try {
        await silentRefresh();
        console.log('[ApplicationManagement Soketi] Silent refresh completed');
      } catch (err) {
        console.error('[ApplicationManagement Soketi] Silent refresh failed:', err);
      }
    });

    // Log connection state for debugging
    const stateHandler = (states: { previous: string; current: string }) => {
      console.log(`[ApplicationManagement Soketi] Connection state: ${states.previous} -> ${states.current}`);
      if (states.current === 'connected' && channel.subscribed !== true) {
        console.log('[ApplicationManagement Soketi] Reconnected, re-subscribing...');
        pusher.subscribe('applications');
      }
    };
    pusher.connection.bind('state_change', stateHandler);

    return () => {
      channel.unbind('pusher:subscription_succeeded');
      channel.unbind('pusher:subscription_error');
      channel.unbind('new-application');
      pusher.connection.unbind('state_change', stateHandler);
      pusher.unsubscribe('applications');
    };
  }, [silentRefresh]);



  // Idle detection and auto-refresh logic
  useEffect(() => {
    const IDLE_TIME_LIMIT = 15 * 60 * 1000; // 15 minutes
    let idleTimer: NodeJS.Timeout | null = null;

    const refreshData = async () => {
      console.log('User idle for 15 minutes, auto-refreshing Application data...');
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
    await refreshApplications();
  };

  const handleApplicationUpdate = () => {
    silentRefresh();
  };

  const removeFilter = (key: string) => {
    const newFilters = { ...funnelFilters };
    delete newFilters[key];
    setFunnelFilters(newFilters);
    localStorage.setItem('applicationFunnelFilters', JSON.stringify(newFilters));
  };

  // 1. Initial search and funnel filtering (Global filtered set for sidebar counts)
  const globalFilteredApplications = useMemo(() => {
    let filtered = applications.filter(application => {
      const normalizedQuery = searchQuery.toLowerCase().replace(/\s+/g, '');
      const checkValue = (val: any): boolean => {
        if (val === null || val === undefined) return false;
        if (typeof val === 'object') {
          return Object.values(val).some(v => checkValue(v));
        }
        return String(val).toLowerCase().replace(/\s+/g, '').includes(normalizedQuery);
      };

      const matchesSearch = searchQuery === '' || checkValue(application);

      let matchesFunnel = true;
      if (Object.keys(funnelFilters).length > 0) {
        for (const [key, filter] of Object.entries(funnelFilters)) {
          const appValue = (application as any)[key];
          const typedFilter = filter as any;

          if (typedFilter.type === 'text' && typedFilter.value !== undefined && typedFilter.value !== '') {
            if (!String(appValue || '').toLowerCase().includes(String(typedFilter.value).toLowerCase())) {
              matchesFunnel = false;
              break;
            }
          }
          else if (typedFilter.type === 'number') {
            const numValue = parseFloat(appValue);
            if (!isNaN(numValue)) {
              if (typedFilter.from !== undefined && typedFilter.from !== '' && numValue < parseFloat(typedFilter.from)) {
                matchesFunnel = false;
                break;
              }
              if (typedFilter.to !== undefined && typedFilter.to !== '' && numValue > parseFloat(typedFilter.to)) {
                matchesFunnel = false;
                break;
              }
            } else if ((typedFilter.from !== undefined && typedFilter.from !== '') || (typedFilter.to !== undefined && typedFilter.to !== '')) {
              matchesFunnel = false;
              break;
            }
          }
          else if (typedFilter.type === 'date') {
            if (appValue) {
              const dateValue = new Date(appValue).getTime();
              if (!isNaN(dateValue)) {
                if (typedFilter.from) {
                  const fromDate = new Date(typedFilter.from).getTime();
                  if (dateValue < fromDate) { matchesFunnel = false; break; }
                }
                if (typedFilter.to) {
                  const toDate = new Date(typedFilter.to).getTime();
                  if (dateValue > toDate + 86400000) { matchesFunnel = false; break; }
                }
              } else {
                matchesFunnel = false; break;
              }
            } else if (typedFilter.from || typedFilter.to) {
              matchesFunnel = false; break;
            }
          }
          else if (typedFilter.type === 'boolean' && typedFilter.value !== undefined && typedFilter.value !== '') {
            const boolVal = appValue === true || appValue === 'true' || appValue === 1;
            if (boolVal !== typedFilter.value) {
              matchesFunnel = false; break;
            }
          }
          else if (typedFilter.type === 'checklist' && typedFilter.selectedOptions && typedFilter.selectedOptions.length > 0) {
            let appVal = (application as any)[key];
            if (key === 'status') {
              let status = String(appVal || '').toLowerCase();
              if (!appVal || String(appVal).trim() === '') {
                status = 'empty';
              }
              appVal = status === 'schedule' ? 'scheduled' : status;
            }

            const normalizedValue = String(appVal || '').toLowerCase().trim();
            const isMatch = typedFilter.selectedOptions.some((opt: string) => {
              const filterVal = String(opt).toLowerCase().trim();
              if (['status', 'barangay', 'city', 'region', 'terms_agreed', 'desired_plan', 'desiredPlan'].includes(key)) {
                return normalizedValue === filterVal;
              }
              return normalizedValue.includes(filterVal);
            });

            if (!isMatch) {
              matchesFunnel = false;
              break;
            }
          }
        }
      }

      return matchesSearch && matchesFunnel;
    });

    // Apply sidebar date range filters for timestamp
    if (timestampFrom || timestampTo) {
      filtered = filtered.filter(record => {
        const dateValueStr = record.timestamp;
        if (!dateValueStr) return false;

        const dateValue = new Date(dateValueStr).getTime();
        if (isNaN(dateValue)) return false;

        if (timestampFrom) {
          const fromDate = new Date(timestampFrom);
          fromDate.setHours(0, 0, 0, 0);
          if (dateValue < fromDate.getTime()) return false;
        }

        if (timestampTo) {
          const toDate = new Date(timestampTo);
          toDate.setHours(23, 59, 59, 999);
          if (dateValue > toDate.getTime()) return false;
        }

        return true;
      });
    }

    return filtered;
  }, [applications, searchQuery, funnelFilters, timestampFrom, timestampTo]);

  const statusItems = useMemo(() => {
    const statuses = [
      { name: 'Scheduled', value: 'scheduled' },
      { name: 'No Slot', value: 'no slot' },
      { name: 'No Facility', value: 'no facility' },
      { name: 'Duplicate', value: 'duplicate' },
      { name: 'Cancelled', value: 'cancelled' },
      { name: 'Confirmed', value: 'confirmed' },
      { name: 'Pending', value: 'pending' },
      { name: 'Empty', value: 'empty' }
    ];

    const counts: Record<string, number> = {};
    statuses.forEach(s => counts[s.value] = 0);

    globalFilteredApplications.forEach(app => {
      let status = (app.status || '').toLowerCase();
      if (!app.status || String(app.status).trim() === '') {
        status = 'empty';
      }
      const normalizedStatus = status === 'schedule' ? 'scheduled' : status;
      if (counts[normalizedStatus] !== undefined) {
        counts[normalizedStatus]++;
      }
    });

    return {
      items: statuses.map(s => ({
        id: `status:${s.value}`,
        name: s.name,
        count: counts[s.value] || 0
      })).filter(s => s.count > 0),
      total: globalFilteredApplications.length
    };
  }, [globalFilteredApplications]);

  const filteredApplications = useMemo(() => {
    let filtered = globalFilteredApplications.filter(application => {
      if (selectedLocation === 'all') return true;

      if (selectedLocation.startsWith('status:')) {
        const statusValue = selectedLocation.substring(7);
        let appStatus = (application.status || '').toLowerCase();
        if (!application.status || String(application.status).trim() === '') {
          appStatus = 'empty';
        }
        const normalizedAppStatus = appStatus === 'schedule' ? 'scheduled' : appStatus;
        return normalizedAppStatus === statusValue;
      }
      return true;
    });

    filtered.sort((a, b) => {
      const dateA = a.created_at || a.timestamp;
      const dateB = b.created_at || b.timestamp;
      const timeA = dateA ? new Date(dateA).getTime() : 0;
      const timeB = dateB ? new Date(dateB).getTime() : 0;
      if (timeA !== timeB) return timeB - timeA;
      const idA = parseInt(a.id) || 0;
      const idB = parseInt(b.id) || 0;
      return idB - idA;
    });

    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any = '';
        let bValue: any = '';

        switch (sortColumn) {
          case 'timestamp':
            aValue = a.create_date && a.create_time ? `${a.create_date} ${a.create_time}` : a.timestamp || '';
            bValue = b.create_date && b.create_time ? `${b.create_date} ${b.create_time}` : b.timestamp || '';
            break;
          case 'customerName':
            aValue = a.customer_name || '';
            bValue = b.customer_name || '';
            break;
          case 'firstName':
            aValue = a.first_name || '';
            bValue = b.first_name || '';
            break;
          case 'middleInitial':
            aValue = a.middle_initial || '';
            bValue = b.middle_initial || '';
            break;
          case 'lastName':
            aValue = a.last_name || '';
            bValue = b.last_name || '';
            break;
          case 'emailAddress':
            aValue = a.email_address || '';
            bValue = b.email_address || '';
            break;
          case 'mobileNumber':
            aValue = a.mobile_number || '';
            bValue = b.mobile_number || '';
            break;
          case 'secondaryMobileNumber':
            aValue = a.secondary_mobile_number || '';
            bValue = b.secondary_mobile_number || '';
            break;
          case 'installationAddress':
            aValue = a.installation_address || a.address || '';
            bValue = b.installation_address || b.address || '';
            break;
          case 'landmark':
            aValue = a.landmark || '';
            bValue = b.landmark || '';
            break;
          case 'region':
            aValue = a.region || '';
            bValue = b.region || '';
            break;
          case 'city':
            aValue = a.city || '';
            bValue = b.city || '';
            break;
          case 'barangay':
            aValue = a.barangay || '';
            bValue = b.barangay || '';
            break;

          case 'desiredPlan':
            aValue = a.desired_plan || '';
            bValue = b.desired_plan || '';
            break;
          case 'promo':
            aValue = a.promo || '';
            bValue = b.promo || '';
            break;
          case 'referredBy':
            aValue = a.referred_by || '';
            bValue = b.referred_by || '';
            break;
          case 'status':
            aValue = a.status || '';
            bValue = b.status || '';
            break;
          case 'createDate':
            aValue = a.create_date || '';
            bValue = b.create_date || '';
            break;
          case 'createTime':
            aValue = a.create_time || '';
            bValue = b.create_time || '';
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
  }, [globalFilteredApplications, selectedLocation, sortColumn, sortDirection]);

  // Derived paginated records
  const paginatedApplications = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredApplications.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredApplications, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedLocation, searchQuery, funnelFilters, sortColumn, sortDirection, itemsPerPage, timestampFrom, timestampTo]);

  // Scroll to top on page change
  useEffect(() => {
    if (displayMode === 'card' && cardScrollRef.current) {
      cardScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (displayMode === 'table' && tableScrollRef.current) {
      tableScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage, displayMode]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleRowClick = (application: Application) => {
    setSelectedApplication(application);
  };

  const handleToggleColumn = (columnKey: string) => {
    setVisibleColumns(prev => {
      const newColumns = prev.includes(columnKey)
        ? prev.filter(key => key !== columnKey)
        : [...prev, columnKey];
      localStorage.setItem('applicationManagementVisibleColumns', JSON.stringify(newColumns));
      return newColumns;
    });
  };

  const handleSelectAllColumns = () => {
    const allKeys = allColumns.map(col => col.key);
    setVisibleColumns(allKeys);
    localStorage.setItem('applicationManagementVisibleColumns', JSON.stringify(allKeys));
  };

  const handleDeselectAllColumns = () => {
    setVisibleColumns([]);
    localStorage.setItem('applicationManagementVisibleColumns', JSON.stringify([]));
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

  const filteredColumns = allColumns
    .filter(col => visibleColumns.includes(col.key))
    .sort((a, b) => {
      const indexA = columnOrder.indexOf(a.key);
      const indexB = columnOrder.indexOf(b.key);
      return indexA - indexB;
    });

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

  const formatDate = (dateString?: string) => {
    if (!dateString || dateString === '-' || dateString === 'N/A') return dateString || '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const yyyy = date.getFullYear();
      return `${mm}/${dd}/${yyyy}`;
    } catch (e) {
      return dateString;
    }
  };

  const renderCellValue = (application: Application, columnKey: string) => {
    switch (columnKey) {
      case 'timestamp':
        return application.create_date && application.create_time
          ? `${formatDate(application.create_date)} ${application.create_time}`
          : formatDate(application.timestamp) || '-';
      case 'status':
        return application.status || '-';
      case 'customerName':
        return application.customer_name;
      case 'firstName':
        return application.first_name || '-';
      case 'middleInitial':
        return application.middle_initial || '-';
      case 'lastName':
        return application.last_name || '-';
      case 'emailAddress':
        return application.email_address || '-';
      case 'mobileNumber':
        return application.mobile_number || '-';
      case 'secondaryMobileNumber':
        return application.secondary_mobile_number || '-';
      case 'installationAddress':
        return application.installation_address || application.address || '-';
      case 'landmark':
        return application.landmark || '-';
      case 'region':
        return application.region || '-';
      case 'city':
        return application.city || '-';
      case 'barangay':
        return application.barangay || '-';

      case 'desiredPlan':
        return application.desired_plan || '-';
      case 'promo':
        return application.promo || '-';
      case 'referredBy':
        return application.referred_by || '-';
      case 'createDate':
        return formatDate(application.create_date) || '-';
      case 'createTime':
        return application.create_time || '-';
      default:
        return '-';
    }
  };

  const renderCellDisplay = (application: Application, columnKey: string) => {
    if (columnKey === 'status') {
      const status = (!application.status || String(application.status).trim() === '') ? 'Empty' : application.status;
      return (
        <span className={`text-xs px-2 py-1 font-bold uppercase ${status.toLowerCase() === 'schedule' ? 'text-green-400' :
          status.toLowerCase() === 'no facility' ? 'text-red-400' :
            status.toLowerCase() === 'cancelled' ? 'text-red-500' :
              status.toLowerCase() === 'no slot' ? 'text-purple-400' :
                status.toLowerCase() === 'duplicate' ? 'text-pink-400' :
                  status.toLowerCase() === 'in progress' ? 'text-blue-400' :
                    status.toLowerCase() === 'completed' ? 'text-green-400' :
                      status.toLowerCase() === 'confirmed' ? 'text-green-400' :
                        status.toLowerCase() === 'pending' ? 'text-orange-400' :
                          status.toLowerCase() === 'empty' ? 'text-gray-500' :
                            'text-gray-400'
          }`}>
          {status}
        </span>
      );
    }
    return renderCellValue(application, columnKey);
  };

  const handleLocationSelect = (locationId: string) => {
    setSelectedLocation(locationId);
    setMobileMenuOpen(false);
  };

  return (
    <div className={`h-full flex flex-col md:flex-row overflow-hidden ${isDarkMode ? 'bg-gray-950' : 'bg-gray-50'
      }`}>
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className={`hidden md:flex border-r flex-shrink-0 flex-col relative z-40 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
        }`} style={{ width: `${sidebarWidth}px` }}>
        <div className={`p-4 border-b flex-shrink-0 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
          <div className="flex items-center justify-between mb-1">
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Applications</h2>
            <button
              onClick={() => window.open('https://apply.atssfiber.ph', '_blank', 'noopener,noreferrer')}
              className="px-2.5 py-1 text-xs font-medium rounded flex items-center transition-colors shadow-sm text-white hover:opacity-90"
              style={{ backgroundColor: colorPalette?.primary || '#7c3aed' }}
              title="Open Application Form"
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1" />
              Apply
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {/* Date Range Filter Section */}
          <div className={`px-4 py-3 border-b space-y-3 ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Timestamp Range
              </span>
              {(timestampFrom || timestampTo) && (
                <button
                  onClick={() => {
                    setTimestampFrom('');
                    setTimestampTo('');
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
                  value={timestampFrom}
                  onChange={(e) => setTimestampFrom(e.target.value)}
                  className={`w-full px-2 py-1.5 rounded text-xs focus:outline-none border ${isDarkMode
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  style={timestampFrom ? { borderColor: colorPalette?.primary || '#7c3aed' } : {}}
                />
              </div>
              <div className="relative">
                <label className={`text-[10px] mb-1 block ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>To</label>
                <input
                  type="date"
                  value={timestampTo}
                  onChange={(e) => setTimestampTo(e.target.value)}
                  className={`w-full px-2 py-1.5 rounded text-xs focus:outline-none border ${isDarkMode
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  style={timestampTo ? { borderColor: colorPalette?.primary || '#7c3aed' } : {}}
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
              <span>All Applications</span>
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
              {statusItems.total}
            </span>
          </button>

          {/* Status Items */}
          {statusItems.items.map((status) => {
            const isSelected = selectedLocation === status.id;
            const getStatusColor = (val: string) => {
              switch (val) {
                case 'scheduled': return 'text-green-500';
                case 'no slot': return 'text-purple-500';
                case 'no facility': return 'text-red-500';
                case 'duplicate': return 'text-pink-500';
                case 'cancelled': return 'text-red-600';
                case 'confirmed': return 'text-green-500';
                case 'pending': return 'text-orange-500';
                case 'empty': return 'text-gray-500';
                default: return 'text-gray-500';
              }
            };

            return (
              <button
                key={status.id}
                onClick={() => setSelectedLocation(status.id)}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                  }`}
                style={isSelected ? {
                  backgroundColor: colorPalette?.primary ? `${colorPalette.primary}33` : 'rgba(249, 115, 22, 0.2)',
                  color: colorPalette?.primary || '#7c3aed'
                } : {}}
              >
                <div className="flex items-center flex-1">
                  <div className={`h-2.5 w-2.5 rounded-full mr-3 ${getStatusColor(status.id.split(':')[1]).replace('text-', 'bg-')}`} />
                  <span className={`font-medium ${isSelected ? '' : isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{status.name}</span>
                </div>
                {status.count > 0 && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isSelected ? '' : isDarkMode ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400'}`}
                    style={isSelected ? {
                      backgroundColor: colorPalette?.primary || '#7c3aed',
                      color: 'white'
                    } : {}}>
                    {status.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div
          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize transition-colors z-10"
          onMouseDown={handleMouseDownSidebarResize}
          style={{
            backgroundColor: isResizingSidebar ? (colorPalette?.primary || '#7c3aed') : 'transparent'
          }}
          onMouseEnter={(e) => {
            if (!isResizingSidebar && colorPalette?.accent) {
              e.currentTarget.style.backgroundColor = colorPalette.accent;
            }
          }}
          onMouseLeave={(e) => {
            if (!isResizingSidebar) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        />
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
                }`}>Filters</h2>
              <button onClick={() => setMobileMenuOpen(false)} className={isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}>
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
                  color: colorPalette?.primary || '#7c3aed'
                } : {}}
              >
                <div className="flex items-center">
                  <Globe className="h-4 w-4 mr-2" />
                  <span>All Applications</span>
                </div>
                <span className="px-2 py-1 rounded-full text-xs bg-gray-700 text-gray-300">
                  {statusItems.total}
                </span>
              </button>

              {/* Mobile Date Range Filter Section */}
              <div className={`px-4 py-3 border-b space-y-3 ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Timestamp Range
                  </span>
                  {(timestampFrom || timestampTo) && (
                    <button
                      onClick={() => {
                        setTimestampFrom('');
                        setTimestampTo('');
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
                      value={timestampFrom}
                      onChange={(e) => setTimestampFrom(e.target.value)}
                      className={`w-full px-2 py-1.5 rounded text-xs focus:outline-none border ${isDarkMode
                        ? 'bg-gray-800 border-gray-700 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      style={timestampFrom ? { borderColor: colorPalette?.primary || '#7c3aed' } : {}}
                    />
                  </div>
                  <div className="relative">
                    <label className={`text-[10px] mb-1 block ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>To</label>
                    <input
                      type="date"
                      value={timestampTo}
                      onChange={(e) => setTimestampTo(e.target.value)}
                      className={`w-full px-2 py-1.5 rounded text-xs focus:outline-none border ${isDarkMode
                        ? 'bg-gray-800 border-gray-700 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      style={timestampTo ? { borderColor: colorPalette?.primary || '#7c3aed' } : {}}
                    />
                  </div>
                </div>
              </div>

              {/* Status Items */}
              {statusItems.items.map((status) => {
                const isSelected = selectedLocation === status.id;
                const getStatusColor = (val: string) => {
                  switch (val) {
                    case 'scheduled': return 'text-green-500';
                    case 'no slot': return 'text-purple-500';
                    case 'no facility': return 'text-red-500';
                    case 'duplicate': return 'text-pink-500';
                    case 'cancelled': return 'text-red-600';
                    case 'confirmed': return 'text-green-500';
                    case 'pending': return 'text-orange-500';
                    case 'empty': return 'text-gray-500';
                    default: return 'text-gray-500';
                  }
                };

                return (
                  <button
                    key={status.id}
                    onClick={() => {
                      setSelectedLocation(status.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${isSelected ? '' : 'text-gray-300'}`}
                    style={isSelected ? {
                      backgroundColor: colorPalette?.primary ? `${colorPalette.primary}33` : 'rgba(249, 115, 22, 0.2)',
                      color: colorPalette?.primary || '#7c3aed'
                    } : {}}
                  >
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{status.name}</span>
                    </div>
                    {status.count > 0 && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${isSelected ? 'text-white' : isDarkMode ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400'}`}
                        style={isSelected ? {
                          backgroundColor: colorPalette?.primary || '#7c3aed'
                        } : {}}>
                        {status.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`overflow-hidden flex-1 flex flex-col pb-16 md:pb-0 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
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
                  placeholder="Search applications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full rounded pl-10 pr-10 py-2 focus:outline-none ${isDarkMode
                    ? 'bg-gray-800 text-white border border-gray-700'
                    : 'bg-white text-gray-900 border border-gray-300'
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
              <div className="hidden md:flex space-x-2">
                <button
                  onClick={() => setIsFunnelFilterOpen(true)}
                  title={Object.keys(funnelFilters || {}).length > 0
                    ? `Active Filters:\n${Object.entries(funnelFilters || {}).map(([key, filter]: [string, any]) => {
                      const colName = filterColumns.find(c => c.key === key)?.label || key;
                      if (filter.type === 'text') return `${colName}: ${filter.value}`;
                      if (filter.type === 'boolean') return `${colName}: ${filter.value ? 'Yes' : 'No'}`;
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
                    : "Filter Applications"
                  }
                  className={`px-4 py-2 rounded text-sm transition-colors flex items-center ${Object.keys(funnelFilters || {}).length > 0
                    ? 'text-red-500 hover:bg-red-500/10'
                    : isDarkMode
                      ? 'hover:bg-gray-800 text-white'
                      : 'hover:bg-gray-100 text-gray-900'
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
                      <div className={`absolute top-full right-0 mt-2 w-80 rounded shadow-lg z-50 max-h-96 flex flex-col ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        } border`}>
                        <div className={`p-3 border-b flex items-center justify-between ${isDarkMode ? 'border-gray-700' : 'border-gray-200'
                          }`}>
                          <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>Column Visibility</span>
                          <div className="flex space-x-2">
                            <button
                              onClick={handleSelectAllColumns}
                              className="text-xs"
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
                              className="text-xs"
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
                              className={`flex items-center px-4 py-2 cursor-pointer text-sm ${isDarkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 text-gray-900'
                                }`}
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
                <div className="relative" ref={dropdownRef}>
                  <button
                    className={`px-4 py-2 rounded text-sm transition-colors flex items-center ${isDarkMode
                      ? 'hover:bg-gray-800 text-white'
                      : 'hover:bg-gray-100 text-gray-900'
                      }`}
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                  >
                    <span>{displayMode === 'card' ? 'Card' : 'Table'}</span>
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </button>
                  {dropdownOpen && (
                    <div className={`absolute top-full right-0 mt-1 w-36 rounded shadow-lg border z-50 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
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
                          color: isDarkMode ? 'white' : '#111827'
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
                          color: isDarkMode ? 'white' : '#111827'
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
          {Object.keys(funnelFilters || {}).length > 0 && (
            <div className={`px-4 py-2 border-b flex flex-wrap items-center gap-2 overflow-x-auto no-scrollbar ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Active Filters:
              </span>
              <div className="flex flex-wrap gap-2">
                {Object.entries(funnelFilters || {}).map(([key, filter]: [string, any]) => {
                  const column = filterColumns.find(c => (c as any).key === key);
                  const label = column?.label || key;

                  let displayValue = '';
                  if (filter.type === 'text' || filter.type === 'boolean') {
                    displayValue = String(filter.value);
                  } else if (filter.type === 'checklist') {
                    displayValue = Array.isArray(filter.selectedOptions)
                      ? filter.selectedOptions.join(', ')
                      : String(filter.selectedOptions);
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
                    setFunnelFilters({});
                    localStorage.removeItem('applicationFunnelFilters');
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

          {/* Applications List Container */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className={`flex-1 ${displayMode === 'table' ? 'overflow-hidden' : 'overflow-y-auto'}`} ref={cardScrollRef}>
              {isLoading ? (
                <div className={`px-4 py-12 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                  <div className="animate-pulse flex flex-col items-center">
                    <div className={`h-4 w-1/3 rounded mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
                      }`}></div>
                    <div className={`h-4 w-1/2 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
                      }`}></div>
                  </div>
                  <p className="mt-4">Loading applications...</p>
                </div>
              ) : error ? (
                <div className={`px-4 py-12 text-center ${isDarkMode ? 'text-red-400' : 'text-red-600'
                  }`}>
                  <p>{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className={`mt-4 px-4 py-2 rounded text-white ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-400 hover:bg-gray-500'
                      }`}>
                    Retry
                  </button>
                </div>
              ) : displayMode === 'card' ? (
                paginatedApplications.length > 0 ? (
                  <div className="space-y-0">
                    {paginatedApplications.map((application) => (
                      <div
                        key={application.id}
                        onClick={() => handleRowClick(application)}
                        className={`px-4 py-3 cursor-pointer transition-colors border-b ${isDarkMode ? 'hover:bg-gray-800 border-gray-800' : 'hover:bg-gray-100 border-gray-200'
                          } ${selectedApplication?.id === application.id ? (isDarkMode ? 'bg-gray-800' : 'bg-gray-100') : ''}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className={`font-medium text-sm mb-1 uppercase ${isDarkMode ? 'text-white' : 'text-gray-900'
                              }`}>
                              {application.customer_name}
                            </div>
                            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                              {application.create_date && application.create_time
                                ? `${application.create_date} ${application.create_time}`
                                : application.timestamp || 'Not specified'}
                              {' | '}
                              {[
                                application.installation_address || application.address,

                                application.barangay,
                                application.city,
                                application.region
                              ].filter(Boolean).join(', ')}
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-1 ml-4 flex-shrink-0">
                            {(() => {
                              const status = (!application.status || String(application.status).trim() === '') ? 'Empty' : application.status;
                              return (
                                <div className={`text-xs px-2 py-1 font-bold uppercase ${status.toLowerCase() === 'schedule' ? 'text-green-400' :
                                  status.toLowerCase() === 'no facility' ? 'text-red-400' :
                                    status.toLowerCase() === 'cancelled' ? 'text-red-500' :
                                      status.toLowerCase() === 'no slot' ? 'text-purple-400' :
                                        status.toLowerCase() === 'duplicate' ? 'text-pink-400' :
                                          status.toLowerCase() === 'in progress' ? 'text-blue-400' :
                                            status.toLowerCase() === 'completed' ? 'text-green-400' :
                                              status.toLowerCase() === 'confirmed' ? 'text-green-400' :
                                                status.toLowerCase() === 'pending' ? 'text-orange-400' :
                                                  status.toLowerCase() === 'empty' ? 'text-gray-500' :
                                                    'text-gray-400'
                                  }`}>
                                  {status}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                    No applications found matching your filters
                  </div>
                )
              ) : (
                <div className="h-full relative flex flex-col">
                  <div className="flex-1 overflow-auto" ref={tableScrollRef}>
                    <table ref={tableRef} className="w-max min-w-full text-sm border-separate border-spacing-0">
                      <thead>
                        <tr className={`border-b sticky top-0 z-20 ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-gray-100'
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
                              className={`text-left py-3 px-3 font-normal ${column.width} whitespace-nowrap relative group cursor-move ${isDarkMode ? 'text-gray-400 bg-gray-800' : 'text-gray-600 bg-gray-100'
                                } ${index < filteredColumns.length - 1 ? (isDarkMode ? 'border-r border-gray-700' : 'border-r border-gray-200') : ''} ${draggedColumn === column.key ? 'opacity-50' : ''
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
                                      <ArrowDown className="h-4 w-4" style={{ color: colorPalette?.primary || '#7c3aed' }} />
                                    ) : (
                                      <ArrowUp className="h-4 w-4 text-gray-400" style={{
                                        color: sortColumn === column.key ? (colorPalette?.primary || '#7c3aed') : undefined
                                      }} />
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
                        {paginatedApplications.length > 0 ? (
                          paginatedApplications.map((application) => (
                            <tr
                              key={application.id}
                              className={`border-b cursor-pointer transition-colors ${isDarkMode ? 'border-gray-800 hover:bg-gray-900' : 'border-gray-200 hover:bg-gray-50'
                                } ${selectedApplication?.id === application.id ? (isDarkMode ? 'bg-gray-800' : 'bg-gray-100') : ''}`}
                              onClick={() => handleRowClick(application)}
                            >
                              {filteredColumns.map((column, index) => (
                                <td
                                  key={column.key}
                                  className={`py-4 px-3 ${index < filteredColumns.length - 1 ? (isDarkMode ? 'border-r border-gray-800' : 'border-r border-gray-200') : ''} ${isDarkMode ? 'text-white' : 'text-gray-900'
                                    }`}
                                  style={{
                                    width: columnWidths[column.key] ? `${columnWidths[column.key]}px` : undefined,
                                    maxWidth: columnWidths[column.key] ? `${columnWidths[column.key]}px` : undefined
                                  }}
                                >
                                  <div className="truncate" title={String(renderCellValue(application, column.key))}>
                                    {renderCellDisplay(application, column.key)}
                                  </div>
                                </td>
                              ))}
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={filteredColumns.length} className={`px-4 py-12 text-center border-b ${isDarkMode ? 'text-gray-400 border-gray-800' : 'text-gray-600 border-gray-200'
                              }`}>
                              No applications found matching your filters
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
            {!isLoading && filteredApplications.length > 0 && totalPages > 1 && (
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
                    Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredApplications.length)}</span> of <span className="font-medium">{filteredApplications.length}</span> results
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className={`px-2 py-1 rounded text-sm transition-colors ${currentPage === 1
                      ? (isDarkMode ? 'text-gray-600 bg-gray-800 cursor-not-allowed' : 'text-gray-400 bg-gray-100 cursor-not-allowed')
                      : (isDarkMode ? 'text-white bg-gray-700 hover:bg-gray-600' : 'text-gray-700 bg-white hover:bg-gray-50 border border-gray-300')
                      }`}
                    title="First Page"
                  >
                    <ChevronsLeft size={16} />
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
                    className={`px-2 py-1 rounded text-sm transition-colors ${currentPage === totalPages
                      ? (isDarkMode ? 'text-gray-600 bg-gray-800 cursor-not-allowed' : 'text-gray-400 bg-gray-100 cursor-not-allowed')
                      : (isDarkMode ? 'text-white bg-gray-700 hover:bg-gray-600' : 'text-gray-700 bg-white hover:bg-gray-50 border border-gray-300')
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
      </div>

      {/* Mobile Bottom Bar */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 border-t z-40 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
        }`}>
        <div className="flex overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setSelectedLocation('all')}
            className={`flex-shrink-0 flex flex-col items-center justify-center px-4 py-2 text-xs transition-colors ${selectedLocation === 'all' ? '' : 'text-gray-300'}`}
            style={selectedLocation === 'all' ? {
              backgroundColor: colorPalette?.primary ? `${colorPalette.primary}33` : 'rgba(249, 115, 22, 0.2)',
              color: colorPalette?.primary || '#7c3aed'
            } : {}}
          >
            <FileText className="h-5 w-5 mb-1" />
            <span className="whitespace-nowrap">All</span>
          </button>

          {statusItems.items.map((status) => {
            const getStatusColor = (val: string) => {
              switch (val) {
                case 'scheduled': return 'text-green-500';
                case 'no slot': return 'text-purple-500';
                case 'no facility': return 'text-red-500';
                case 'duplicate': return 'text-pink-500';
                case 'cancelled': return 'text-red-600';
                case 'confirmed': return 'text-green-500';
                case 'pending': return 'text-orange-500';
                case 'empty': return 'text-gray-500';
                default: return 'text-gray-500';
              }
            };
            const statusValue = status.id.split(':')[1];
            return (
              <button
                key={status.id}
                onClick={() => setSelectedLocation(status.id)}
                className={`flex-shrink-0 flex flex-col items-center justify-center px-4 py-2 text-xs transition-colors ${selectedLocation === status.id ? '' : 'text-gray-300'}`}
                style={selectedLocation === status.id ? {
                  backgroundColor: colorPalette?.primary ? `${colorPalette.primary}33` : 'rgba(249, 115, 22, 0.2)',
                  color: colorPalette?.primary || '#7c3aed'
                } : {}}
              >
                <div className={`h-2.5 w-2.5 rounded-full mb-1 ${getStatusColor(statusValue).replace('text-', 'bg-')}`} />
                <span className="whitespace-nowrap">{status.name}</span>
                {status.count > 0 && (
                  <span className={`mt-1 px-2 py-0.5 rounded text-[10px] transition-colors`}
                    style={selectedLocation === status.id ? {
                      backgroundColor: colorPalette?.primary || '#7c3aed',
                      color: 'white'
                    } : {
                      backgroundColor: isDarkMode ? '#1f2937' : '#f3f4f6',
                      color: isDarkMode ? '#9ca3af' : '#6b7280'
                    }}>
                    {status.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedApplication && (
        <div className="flex-shrink-0 overflow-hidden">
          <ApplicationDetails
            application={selectedApplication}
            onClose={() => setSelectedApplication(null)}
            onApplicationUpdate={handleApplicationUpdate}
            onNavigate={onNavigate}
          />
        </div>
      )}

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Add Application Modal */}
      <AddApplicationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={() => {
          silentRefresh();
          setIsAddModalOpen(false);
        }}
      />

      {/* Application Funnel Filter */}
      <ApplicationFunnelFilter
        isOpen={isFunnelFilterOpen}
        onClose={() => setIsFunnelFilterOpen(false)}
        onApplyFilters={(filters) => {
          console.log('Applied filters:', filters);
          setFunnelFilters(filters);
          setIsFunnelFilterOpen(false);
        }}
        currentFilters={funnelFilters}
      />
    </div>
  );
};

export default ApplicationManagement;
