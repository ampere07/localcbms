import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FileText, Search, ChevronDown, RefreshCw, ListFilter, ArrowUp, ArrowDown, Menu, X } from 'lucide-react';
import ApplicationVisitDetails from '../components/ApplicationVisitDetails';
import { getAllApplicationVisits } from '../services/applicationVisitService';
import { getApplication } from '../services/applicationService';

interface ApplicationVisit {
  id: string;
  application_id: string;
  timestamp: string;
  assigned_email?: string;
  visit_by?: string;
  visit_with?: string;
  visit_with_other?: string;
  visit_status: string;
  visit_remarks?: string;
  status_remarks?: string;
  application_status?: string;
  full_name: string;
  full_address: string;
  referred_by?: string;
  updated_by_user_email: string;
  created_at: string;
  updated_at: string;
  first_name?: string;
  middle_initial?: string;
  last_name?: string;
  region?: string;
  city?: string;
  barangay?: string;
  location?: string;
  choose_plan?: string;
  promo?: string;
  house_front_picture_url?: string;
  image1_url?: string;
  image2_url?: string;
  image3_url?: string;
}

interface LocationItem {
  id: string;
  name: string;
  count: number;
}

type DisplayMode = 'card' | 'table';

// All available columns from application_visits table
const allColumns = [
  { key: 'timestamp', label: 'Timestamp', width: 'min-w-40' },
  { key: 'fullName', label: 'Full Name', width: 'min-w-48' },
  { key: 'assignedEmail', label: 'Assigned Email', width: 'min-w-48' },
  { key: 'visitStatus', label: 'Visit Status', width: 'min-w-32' },
  { key: 'applicationStatus', label: 'Application Status', width: 'min-w-36' },
  { key: 'statusRemarks', label: 'Status Remarks', width: 'min-w-40' },
  { key: 'referredBy', label: 'Referred By', width: 'min-w-32' },
  { key: 'fullAddress', label: 'Full Address', width: 'min-w-56' },
  { key: 'visitBy', label: 'Visit By', width: 'min-w-32' },
  { key: 'visitWith', label: 'Visit With', width: 'min-w-32' },
  { key: 'visitWithOther', label: 'Visit With (Other)', width: 'min-w-32' },
  { key: 'visitRemarks', label: 'Visit Remarks', width: 'min-w-40' },
  { key: 'modifiedDate', label: 'Modified Date', width: 'min-w-40' },
  { key: 'modifiedBy', label: 'Modified By', width: 'min-w-32' },
  { key: 'firstName', label: 'First Name', width: 'min-w-32' },
  { key: 'middleInitial', label: 'Middle Initial', width: 'min-w-28' },
  { key: 'lastName', label: 'Last Name', width: 'min-w-32' },
  { key: 'region', label: 'Region', width: 'min-w-28' },
  { key: 'city', label: 'City', width: 'min-w-28' },
  { key: 'barangay', label: 'Barangay', width: 'min-w-32' },
  { key: 'location', label: 'Location', width: 'min-w-32' },
  { key: 'choosePlan', label: 'Choose Plan', width: 'min-w-36' },
  { key: 'promo', label: 'Promo', width: 'min-w-28' },
  { key: 'houseFrontPicture', label: 'House Front Picture', width: 'min-w-48' },
  { key: 'image1', label: 'Image 1', width: 'min-w-48' },
  { key: 'image2', label: 'Image 2', width: 'min-w-48' },
  { key: 'image3', label: 'Image 3', width: 'min-w-48' },
  { key: 'applicationId', label: 'Application ID', width: 'min-w-32' },
  { key: 'createdAt', label: 'Created At', width: 'min-w-40' }
];

const ApplicationVisit: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedVisit, setSelectedVisit] = useState<ApplicationVisit | null>(null);
  const [applicationVisits, setApplicationVisits] = useState<ApplicationVisit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);
  const sidebarStartXRef = useRef<number>(0);
  const sidebarStartWidthRef = useRef<number>(0);

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

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return 'Not scheduled';
    try {
      return new Date(dateStr).toLocaleString();
    } catch (e) {
      return dateStr;
    }
  };
  
  useEffect(() => {
    const authData = localStorage.getItem('authData');
    if (authData) {
      try {
        const userData = JSON.parse(authData);
        setUserRole(userData.role || '');
      } catch (err) {
        // Error parsing auth data
      }
    }
  }, []);

  const fetchApplicationVisits = useCallback(async (isInitialLoad: boolean = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      }
      
      const authData = localStorage.getItem('authData');
      let assignedEmail: string | undefined;
      
      if (authData) {
        try {
          const userData = JSON.parse(authData);
          if (userData.role && userData.role.toLowerCase() === 'technician' && userData.email) {
            assignedEmail = userData.email;
          }
        } catch (err) {
          // Error parsing auth data
        }
      }
      
      const response = await getAllApplicationVisits(assignedEmail);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch application visits');
      }
      
      if (response.success && Array.isArray(response.data)) {
        
        const visits: ApplicationVisit[] = response.data.map((visit: any) => ({
          id: visit.id || '',
          application_id: visit.application_id || '',
          timestamp: visit.timestamp || visit.created_at || '',
          assigned_email: visit.assigned_email || '',
          visit_by: visit.visit_by || '',
          visit_with: visit.visit_with || '',
          visit_with_other: visit.visit_with_other || '',
          visit_status: visit.visit_status || 'Scheduled',
          visit_remarks: visit.visit_remarks || '',
          status_remarks: visit.status_remarks || '',
          application_status: visit.application_status || 'Pending',
          full_name: visit.full_name || '',
          full_address: visit.full_address || '',
          referred_by: visit.referred_by || '',
          updated_by_user_email: visit.updated_by_user_email || 'System',
          created_at: visit.created_at || '',
          updated_at: visit.updated_at || '',
          first_name: visit.first_name || '',
          middle_initial: visit.middle_initial || '',
          last_name: visit.last_name || '',
          region: visit.region || '',
          city: visit.city || '',
          barangay: visit.barangay || '',
          location: visit.location || '',
          choose_plan: visit.choose_plan || '',
          promo: visit.promo || '',
          house_front_picture_url: visit.house_front_picture_url || '',
          image1_url: visit.image1_url || '',
          image2_url: visit.image2_url || '',
          image3_url: visit.image3_url || '',
        }));
        
        setApplicationVisits(visits);
        setError(null);
      } else {
        setApplicationVisits([]);
        if (response.message) {
          setError(response.message);
        }
      }
    } catch (err: any) {
      if (isInitialLoad) {
        setError(err.message || 'Failed to load application visits. Please try again.');
        setApplicationVisits([]);
      }
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchApplicationVisits(true);
  }, [fetchApplicationVisits]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchApplicationVisits(false);
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [fetchApplicationVisits]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchApplicationVisits(false);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleVisitUpdate = async () => {
    await fetchApplicationVisits(false);
  };

  const locationItems: LocationItem[] = [
    {
      id: 'all',
      name: 'All',
      count: applicationVisits.length
    }
  ];

  const locationSet = new Set<string>();
  applicationVisits.forEach(visit => {
    const addressParts = visit.full_address.split(',');
    const city = addressParts.length > 3 ? addressParts[3].trim() : '';
    if (city) {
      locationSet.add(city.toLowerCase());
    }
  });
  const uniqueLocations = Array.from(locationSet);
    
  uniqueLocations.forEach(location => {
    if (location) {
      locationItems.push({
        id: location,
        name: location.charAt(0).toUpperCase() + location.slice(1),
        count: applicationVisits.filter(visit => {
          const addressParts = visit.full_address.split(',');
          const city = addressParts.length > 3 ? addressParts[3].trim() : '';
          return city.toLowerCase() === location;
        }).length
      });
    }
  });

  const filteredVisits = applicationVisits.filter(visit => {
    const addressParts = visit.full_address.split(',');
    const city = addressParts.length > 3 ? addressParts[3].trim().toLowerCase() : '';
    const matchesLocation = selectedLocation === 'all' || city === selectedLocation;
    
    const matchesSearch = searchQuery === '' || 
                         visit.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         visit.full_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (visit.assigned_email || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesLocation && matchesSearch;
  });

  const sortedVisits = [...filteredVisits].sort((a, b) => {
    if (!sortColumn) return 0;

    let aValue: any = '';
    let bValue: any = '';

    switch (sortColumn) {
      case 'timestamp':
        aValue = a.timestamp || '';
        bValue = b.timestamp || '';
        break;
      case 'fullName':
        aValue = a.full_name || '';
        bValue = b.full_name || '';
        break;
      case 'assignedEmail':
        aValue = a.assigned_email || '';
        bValue = b.assigned_email || '';
        break;
      case 'visitStatus':
        aValue = a.visit_status || '';
        bValue = b.visit_status || '';
        break;
      case 'applicationStatus':
        aValue = a.application_status || '';
        bValue = b.application_status || '';
        break;
      case 'statusRemarks':
        aValue = a.status_remarks || '';
        bValue = b.status_remarks || '';
        break;
      case 'referredBy':
        aValue = a.referred_by || '';
        bValue = b.referred_by || '';
        break;
      case 'fullAddress':
        aValue = a.full_address || '';
        bValue = b.full_address || '';
        break;
      case 'visitBy':
        aValue = a.visit_by || '';
        bValue = b.visit_by || '';
        break;
      case 'visitWith':
        aValue = a.visit_with || '';
        bValue = b.visit_with || '';
        break;
      case 'visitWithOther':
        aValue = a.visit_with_other || '';
        bValue = b.visit_with_other || '';
        break;
      case 'visitRemarks':
        aValue = a.visit_remarks || '';
        bValue = b.visit_remarks || '';
        break;
      case 'modifiedDate':
        aValue = a.updated_at || '';
        bValue = b.updated_at || '';
        break;
      case 'modifiedBy':
        aValue = a.updated_by_user_email || '';
        bValue = b.updated_by_user_email || '';
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
      case 'location':
        aValue = a.location || '';
        bValue = b.location || '';
        break;
      case 'choosePlan':
        aValue = a.choose_plan || '';
        bValue = b.choose_plan || '';
        break;
      case 'promo':
        aValue = a.promo || '';
        bValue = b.promo || '';
        break;
      case 'applicationId':
        aValue = a.application_id || '';
        bValue = b.application_id || '';
        break;
      case 'createdAt':
        aValue = a.created_at || '';
        bValue = b.created_at || '';
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

  const handleRowClick = async (visit: ApplicationVisit) => {
    try {
      if (!visit.application_status) {
        try {
          const applicationData = await getApplication(visit.application_id);
          
          const updatedVisit = {
            ...visit,
            application_status: applicationData.status || 'Pending'
          };
          
          setSelectedVisit(updatedVisit);
        } catch (err: any) {
          setSelectedVisit(visit);
        }
      } else {
        setSelectedVisit(visit);
      }
    } catch (err: any) {
      setError(`Failed to select visit: ${err.message || 'Unknown error'}`);
    }
  };

  const StatusText = ({ status, type }: { status: string; type: 'visit' | 'application' }) => {
    let textColor = '';
    
    if (type === 'visit') {
      switch (status.toLowerCase()) {
        case 'completed':
          textColor = 'text-green-500';
          break;
        case 'scheduled':
          textColor = 'text-yellow-500';
          break;
        case 'pending':
          textColor = 'text-blue-500';
          break;
        case 'cancelled':
          textColor = 'text-red-500';
          break;
        default:
          textColor = 'text-gray-400';
      }
    } else {
      switch (status.toLowerCase()) {
        case 'approved':
        case 'done':
          textColor = 'text-green-500';
          break;
        case 'pending':
          textColor = 'text-yellow-500';
          break;
        case 'under review':
        case 'scheduled':
          textColor = 'text-blue-500';
          break;
        case 'rejected':
        case 'failed':
          textColor = 'text-red-500';
          break;
        default:
          textColor = 'text-gray-400';
      }
    }
    
    return (
      <span className={`${textColor} capitalize`}>
        {status}
      </span>
    );
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

  const renderCellValue = (visit: ApplicationVisit, columnKey: string) => {
    switch (columnKey) {
      case 'timestamp':
        return formatDate(visit.timestamp);
      case 'fullName':
        return visit.full_name;
      case 'assignedEmail':
        return visit.assigned_email || 'Unassigned';
      case 'visitStatus':
        return visit.visit_status || 'Scheduled';
      case 'applicationStatus':
        return visit.application_status || 'Pending';
      case 'statusRemarks':
        return visit.status_remarks || 'No remarks';
      case 'referredBy':
        return visit.referred_by || 'None';
      case 'fullAddress':
        return visit.full_address || 'No address';
      case 'visitBy':
        return visit.visit_by || 'Unassigned';
      case 'visitWith':
        return visit.visit_with || 'None';
      case 'visitWithOther':
        return visit.visit_with_other || 'None';
      case 'visitRemarks':
        return visit.visit_remarks || 'No remarks';
      case 'modifiedDate':
        return formatDate(visit.updated_at);
      case 'modifiedBy':
        return visit.updated_by_user_email;
      case 'firstName':
        return visit.first_name || '-';
      case 'middleInitial':
        return visit.middle_initial || '-';
      case 'lastName':
        return visit.last_name || '-';
      case 'region':
        return visit.region || '-';
      case 'city':
        return visit.city || '-';
      case 'barangay':
        return visit.barangay || '-';
      case 'location':
        return visit.location || '-';
      case 'choosePlan':
        return visit.choose_plan || '-';
      case 'promo':
        return visit.promo || '-';
      case 'applicationId':
        return visit.application_id;
      case 'createdAt':
        return formatDate(visit.created_at);
      default:
        return '-';
    }
  };

  const renderCellDisplay = (visit: ApplicationVisit, columnKey: string) => {
    if (columnKey === 'visitStatus') {
      return <StatusText status={visit.visit_status || 'Scheduled'} type="visit" />;
    }
    if (columnKey === 'applicationStatus') {
      return <StatusText status={visit.application_status || 'Pending'} type="application" />;
    }
    return renderCellValue(visit, columnKey);
  };

  const handleLocationSelect = (locationId: string) => {
    setSelectedLocation(locationId);
    setMobileMenuOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-950">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500 mb-3"></div>
          <p className="text-gray-300">Loading application visits...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-950">
        <div className="bg-gray-800 border border-gray-700 rounded-md p-6 max-w-lg">
          <h3 className="text-red-500 text-lg font-medium mb-2">Error</h3>
          <p className="text-gray-300 mb-4">{error}</p>
          <div className="flex flex-col space-y-4">
            <button 
              onClick={() => window.location.reload()}
              className="bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded"
            >
              Retry
            </button>
            
            <div className="mt-4 p-4 bg-gray-900 rounded overflow-auto max-h-48">
              <pre className="text-xs text-gray-400 whitespace-pre-wrap">
                {error.includes("SQLSTATE") ? (
                  <>
                    <span className="text-red-400">Database Error:</span>
                    <br />
                    {error.includes("Table") ? "Table name mismatch - check the database schema" : error}
                    <br /><br />
                    <span className="text-yellow-400">Suggestion:</span>
                    <br />
                    Verify that the table &apos;application_visits&apos; exists in your database.
                  </>
                ) : error}
              </pre>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-950 h-full flex flex-col md:flex-row overflow-hidden">
      {/* Desktop Sidebar - Hidden on mobile */}
      {userRole.toLowerCase() !== 'technician' && (
      <div className="hidden md:flex bg-gray-900 border-r border-gray-700 flex-shrink-0 flex-col relative" style={{ width: `${sidebarWidth}px` }}>
        <div className="p-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-semibold text-white">Application Visits</h2>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {locationItems.map((location) => (
            <button
              key={location.id}
              onClick={() => {
                setSelectedLocation(location.id);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-gray-800 ${
                selectedLocation === location.id
                  ? 'bg-orange-500 bg-opacity-20 text-orange-400'
                  : 'text-gray-300'
              }`}
            >
              <div className="flex items-center">
                <FileText className="h-4 w-4 mr-2" />
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
      )}

      {/* Mobile Overlay Menu */}
      {mobileMenuOpen && userRole.toLowerCase() !== 'technician' && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 bg-gray-900 shadow-xl flex flex-col">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Filters</h2>
              <button onClick={() => setMobileMenuOpen(false)} className="text-gray-400 hover:text-white">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {locationItems.map((location) => (
                <button
                  key={location.id}
                  onClick={() => handleLocationSelect(location.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-gray-800 ${
                    selectedLocation === location.id
                      ? 'bg-orange-500 bg-opacity-20 text-orange-400'
                      : 'text-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
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
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`bg-gray-900 overflow-hidden flex-1 flex flex-col pb-16 md:pb-0`}>
        <div className="flex flex-col h-full">
          <div className="bg-gray-900 p-4 border-b border-gray-700 flex-shrink-0">
            <div className="flex items-center space-x-3">
              {userRole.toLowerCase() !== 'technician' && (
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
                  placeholder="Search application visits..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded pl-10 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
              <div className="hidden md:flex space-x-2">
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Refresh application visits"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
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
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </button>
                  {dropdownOpen && (
                    <div className="absolute top-full right-0 mt-1 w-36 bg-gray-800 border border-gray-700 rounded shadow-lg">
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
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto">
              {displayMode === 'card' ? (
                filteredVisits.length > 0 ? (
                  <div className="space-y-0">
                    {sortedVisits.map((visit) => (
                      <div
                        key={visit.id}
                        onClick={() => handleRowClick(visit)}
                        className={`px-4 py-3 cursor-pointer transition-colors hover:bg-gray-800 border-b border-gray-800 ${selectedVisit?.id === visit.id ? 'bg-gray-800' : ''}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-medium text-sm mb-1">
                              {visit.full_name}
                            </div>
                            <div className="text-gray-400 text-xs">
                              {formatDate(visit.timestamp)} | {visit.full_address}
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-1 ml-4 flex-shrink-0">
                            <StatusText status={visit.visit_status || 'Scheduled'} type="visit" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    {applicationVisits.length > 0
                      ? 'No application visits found matching your filters'
                      : 'No application visits found. Create your first visit by scheduling from the Applications page.'}
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
                      {filteredVisits.length > 0 ? (
                        sortedVisits.map((visit) => (
                          <tr 
                            key={visit.id} 
                            className={`border-b border-gray-800 hover:bg-gray-900 cursor-pointer transition-colors ${selectedVisit?.id === visit.id ? 'bg-gray-800' : ''}`}
                            onClick={() => handleRowClick(visit)}
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
                                <div className="truncate" title={String(renderCellValue(visit, column.key))}>
                                  {renderCellDisplay(visit, column.key)}
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={filteredColumns.length} className="px-4 py-12 text-center text-gray-400 border-b border-gray-800">
                            {applicationVisits.length > 0
                              ? 'No application visits found matching your filters'
                              : 'No application visits found. Create your first visit by scheduling from the Applications page.'}
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

      {selectedVisit && (
        <div className="fixed md:relative inset-0 md:flex-shrink-0 z-50 md:z-auto overflow-hidden">
          <div className="md:hidden absolute inset-0 bg-black bg-opacity-50" onClick={() => setSelectedVisit(null)} />
          <div className="absolute md:relative right-0 top-0 bottom-0 w-full md:w-auto h-full">
            <ApplicationVisitDetails 
              applicationVisit={selectedVisit}
              onClose={() => setSelectedVisit(null)}
              onUpdate={handleVisitUpdate}
            />
          </div>
        </div>
      )}

      {/* Mobile Bottom Bar */}
      {userRole.toLowerCase() !== 'technician' && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 z-40">
          <div className="flex overflow-x-auto hide-scrollbar">
            {locationItems.map((location) => (
              <button
                key={location.id}
                onClick={() => setSelectedLocation(location.id)}
                className={`flex-shrink-0 flex flex-col items-center justify-center px-4 py-2 text-xs transition-colors ${
                  selectedLocation === location.id
                    ? 'bg-orange-500 bg-opacity-20 text-orange-400'
                    : 'text-gray-300'
                }`}
              >
                <FileText className="h-5 w-5 mb-1" />
                <span className="capitalize whitespace-nowrap">{location.name}</span>
                {location.count > 0 && (
                  <span className={`mt-1 px-2 py-0.5 rounded-full text-xs ${
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
    </div>
  );
};

export default ApplicationVisit;
