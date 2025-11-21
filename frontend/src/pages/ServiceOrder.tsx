import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FileText, Search, Circle, X, ListFilter, ArrowUp, ArrowDown } from 'lucide-react';
import ServiceOrderDetails from '../components/ServiceOrderDetails';
import { getServiceOrders, ServiceOrderData } from '../services/serviceOrderService';
import { getCities, City } from '../services/cityService';

interface ServiceOrder {
  id: string;
  ticketId: string;
  timestamp: string;
  accountNumber: string;
  fullName: string;
  contactAddress: string;
  dateInstalled: string;
  contactNumber: string;
  fullAddress: string;
  houseFrontPicture: string;
  emailAddress: string;
  plan: string;
  provider: string;
  username: string;
  connectionType: string;
  routerModemSN: string;
  lcp: string;
  nap: string;
  port: string;
  vlan: string;
  concern: string;
  concernRemarks: string;
  visitStatus: string;
  visitBy: string;
  visitWith: string;
  visitWithOther: string;
  visitRemarks: string;
  modifiedBy: string;
  modifiedDate: string;
  userEmail: string;
  requestedBy: string;
  assignedEmail: string;
  supportRemarks: string;
  serviceCharge: string;
  repairCategory?: string;
  supportStatus?: string;
}

interface LocationItem {
  id: string;
  name: string;
  count: number;
}

type DisplayMode = 'card' | 'table';

// All available columns from service_orders table
const allColumns = [
  { key: 'ticketId', label: 'Ticket ID', width: 'min-w-32' },
  { key: 'timestamp', label: 'Timestamp', width: 'min-w-40' },
  { key: 'accountNumber', label: 'Account Number', width: 'min-w-36' },
  { key: 'fullName', label: 'Full Name', width: 'min-w-40' },
  { key: 'contactAddress', label: 'Contact Address', width: 'min-w-48' },
  { key: 'dateInstalled', label: 'Date Installed', width: 'min-w-32' },
  { key: 'contactNumber', label: 'Contact Number', width: 'min-w-36' },
  { key: 'fullAddress', label: 'Full Address', width: 'min-w-56' },
  { key: 'houseFrontPicture', label: 'House Front Picture', width: 'min-w-40' },
  { key: 'emailAddress', label: 'Email Address', width: 'min-w-48' },
  { key: 'plan', label: 'Plan', width: 'min-w-32' },
  { key: 'provider', label: 'Provider', width: 'min-w-28' },
  { key: 'username', label: 'Username', width: 'min-w-32' },
  { key: 'connectionType', label: 'Connection Type', width: 'min-w-36' },
  { key: 'routerModemSN', label: 'Router/Modem SN', width: 'min-w-36' },
  { key: 'lcp', label: 'LCP', width: 'min-w-28' },
  { key: 'nap', label: 'NAP', width: 'min-w-28' },
  { key: 'port', label: 'PORT', width: 'min-w-28' },
  { key: 'vlan', label: 'VLAN', width: 'min-w-24' },
  { key: 'concern', label: 'Concern', width: 'min-w-36' },
  { key: 'concernRemarks', label: 'Concern Remarks', width: 'min-w-48' },
  { key: 'visitStatus', label: 'Visit Status', width: 'min-w-32' },
  { key: 'visitBy', label: 'Visit By', width: 'min-w-32' },
  { key: 'visitWith', label: 'Visit With', width: 'min-w-32' },
  { key: 'visitWithOther', label: 'Visit With Other', width: 'min-w-36' },
  { key: 'visitRemarks', label: 'Visit Remarks', width: 'min-w-48' },
  { key: 'modifiedBy', label: 'Modified By', width: 'min-w-32' },
  { key: 'modifiedDate', label: 'Modified Date', width: 'min-w-40' },
  { key: 'userEmail', label: 'User Email', width: 'min-w-48' },
  { key: 'requestedBy', label: 'Requested By', width: 'min-w-36' },
  { key: 'assignedEmail', label: 'Assigned Email', width: 'min-w-48' },
  { key: 'supportRemarks', label: 'Support Remarks', width: 'min-w-48' },
  { key: 'serviceCharge', label: 'Service Charge', width: 'min-w-32' },
  { key: 'repairCategory', label: 'Repair Category', width: 'min-w-36' },
  { key: 'supportStatus', label: 'Support Status', width: 'min-w-32' }
];

const ServiceOrder: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedServiceOrder, setSelectedServiceOrder] = useState<ServiceOrder | null>(null);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
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

  // Format date function
  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return 'Not scheduled';
    try {
      return new Date(dateStr).toLocaleString();
    } catch (e) {
      return dateStr;
    }
  };

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
    const authData = localStorage.getItem('authData');
    if (authData) {
      try {
        const userData = JSON.parse(authData);
        setUserRole(userData.role || '');
        setUserEmail(userData.email || '');
      } catch (error) {
        console.error('Error parsing auth data:', error);
      }
    }
  }, []);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch cities data
        console.log('Fetching cities...');
        const citiesData = await getCities();
        setCities(citiesData || []);
        
        // Fetch service orders data with email filter for technicians
        console.log('Fetching service orders from service_orders table...');
        const authData = localStorage.getItem('authData');
        let assignedEmail: string | undefined;
        
        if (authData) {
          try {
            const userData = JSON.parse(authData);
            if (userData.role && userData.role.toLowerCase() === 'technician' && userData.email) {
              assignedEmail = userData.email;
              console.log('Filtering service orders for technician:', assignedEmail);
            }
          } catch (error) {
            console.error('Error parsing auth data:', error);
          }
        }
        
        const response = await getServiceOrders(assignedEmail);
        console.log('Service Orders API Response:', response);
        
        if (response.success && Array.isArray(response.data)) {
          console.log(`Found ${response.data.length} service orders`);
          
          // Map the API response to our interface
          const processedOrders: ServiceOrder[] = response.data.map((order: ServiceOrderData) => ({
            id: order.id || '',
            ticketId: order.Ticket_ID || '',
            timestamp: formatDate(order.Timestamp),
            accountNumber: order.Account_Number || '',
            fullName: order.Full_Name || '',
            contactAddress: order.Contact_Address || '',
            dateInstalled: order.Date_Installed || '',
            contactNumber: order.Contact_Number || '',
            fullAddress: order.Full_Address || '',
            houseFrontPicture: order.House_Front_Picture || '',
            emailAddress: order.Email_Address || '',
            plan: order.Plan || '',
            provider: order.Provider || '',
            username: order.Username || '',
            connectionType: order.Connection_Type || '',
            routerModemSN: order.Router_Modem_SN || '',
            lcp: order.LCP || '',
            nap: order.NAP || '',
            port: order.PORT || '',
            vlan: order.VLAN || '',
            concern: order.Concern || '',
            concernRemarks: order.Concern_Remarks || '',
            visitStatus: order.Visit_Status || '',
            visitBy: order.Visit_By || '',
            visitWith: order.Visit_With || '',
            visitWithOther: order.Visit_With_Other || '',
            visitRemarks: order.Visit_Remarks || '',
            modifiedBy: order.Modified_By || '',
            modifiedDate: formatDate(order.Modified_Date),
            userEmail: order.User_Email || '',
            requestedBy: order.Requested_By || '',
            assignedEmail: order.Assigned_Email || '',
            supportRemarks: order.Support_Remarks || '',
            serviceCharge: order.Service_Charge || '₱0.00',
            repairCategory: order.Repair_Category || '',
            supportStatus: order.Support_Status || ''
          }));
          
          setServiceOrders(processedOrders);
          console.log('Service orders data processed successfully');
        } else {
          console.warn('No service orders returned from API or invalid response format', response);
          setServiceOrders([]);
          
          if (response.table) {
            console.info(`Table name specified in response: ${response.table}`);
          }
          
          if (response.message) {
            if (response.message.includes('SQLSTATE') || response.message.includes('table')) {
              const formattedMessage = `Database error: ${response.message}`;
              setError(formattedMessage);
              console.error(formattedMessage);
            } else {
              setError(response.message);
            }
          }
        }
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(`Failed to load data: ${err.message || 'Unknown error'}`);
        setServiceOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  
  // Generate location items from cities and service orders data
  const locationItems: LocationItem[] = useMemo(() => {
    const items: LocationItem[] = [
      {
        id: 'all',
        name: 'All',
        count: serviceOrders.length
      }
    ];
    
    if (cities.length > 0) {
      cities.forEach(city => {
        const cityCount = serviceOrders.filter(so => 
          so.fullAddress.toLowerCase().includes(city.name.toLowerCase())
        ).length;
        
        items.push({
          id: city.name.toLowerCase(),
          name: city.name,
          count: cityCount
        });
      });
    } else {
      const locationSet = new Set<string>();
      
      serviceOrders.forEach(so => {
        const addressParts = so.fullAddress.split(',');
        if (addressParts.length >= 2) {
          const cityPart = addressParts[addressParts.length - 2].trim().toLowerCase();
          if (cityPart && cityPart !== '') {
            locationSet.add(cityPart);
          }
        }
      });
      
      Array.from(locationSet).forEach(location => {
        const cityCount = serviceOrders.filter(so => 
          so.fullAddress.toLowerCase().includes(location)
        ).length;
        
        items.push({
          id: location,
          name: location.charAt(0).toUpperCase() + location.slice(1),
          count: cityCount
        });
      });
    }
    
    return items;
  }, [cities, serviceOrders]);
  
  // Filter and sort service orders based on location, search query, and sorting
  const filteredServiceOrders = useMemo(() => {
    let filtered = serviceOrders.filter(serviceOrder => {
      const matchesLocation = selectedLocation === 'all' || 
                             serviceOrder.fullAddress.toLowerCase().includes(selectedLocation.toLowerCase());
      
      const matchesSearch = searchQuery === '' || 
                           serviceOrder.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           serviceOrder.fullAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (serviceOrder.concern && serviceOrder.concern.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesLocation && matchesSearch;
    });

    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any = '';
        let bValue: any = '';

        switch (sortColumn) {
          case 'ticketId':
            aValue = a.ticketId || '';
            bValue = b.ticketId || '';
            break;
          case 'timestamp':
            aValue = a.timestamp || '';
            bValue = b.timestamp || '';
            break;
          case 'accountNumber':
            aValue = a.accountNumber || '';
            bValue = b.accountNumber || '';
            break;
          case 'fullName':
            aValue = a.fullName || '';
            bValue = b.fullName || '';
            break;
          case 'contactAddress':
            aValue = a.contactAddress || '';
            bValue = b.contactAddress || '';
            break;
          case 'dateInstalled':
            aValue = a.dateInstalled || '';
            bValue = b.dateInstalled || '';
            break;
          case 'contactNumber':
            aValue = a.contactNumber || '';
            bValue = b.contactNumber || '';
            break;
          case 'fullAddress':
            aValue = a.fullAddress || '';
            bValue = b.fullAddress || '';
            break;
          case 'emailAddress':
            aValue = a.emailAddress || '';
            bValue = b.emailAddress || '';
            break;
          case 'plan':
            aValue = a.plan || '';
            bValue = b.plan || '';
            break;
          case 'provider':
            aValue = a.provider || '';
            bValue = b.provider || '';
            break;
          case 'username':
            aValue = a.username || '';
            bValue = b.username || '';
            break;
          case 'connectionType':
            aValue = a.connectionType || '';
            bValue = b.connectionType || '';
            break;
          case 'routerModemSN':
            aValue = a.routerModemSN || '';
            bValue = b.routerModemSN || '';
            break;
          case 'lcp':
            aValue = a.lcp || '';
            bValue = b.lcp || '';
            break;
          case 'nap':
            aValue = a.nap || '';
            bValue = b.nap || '';
            break;
          case 'port':
            aValue = a.port || '';
            bValue = b.port || '';
            break;
          case 'vlan':
            aValue = a.vlan || '';
            bValue = b.vlan || '';
            break;
          case 'concern':
            aValue = a.concern || '';
            bValue = b.concern || '';
            break;
          case 'concernRemarks':
            aValue = a.concernRemarks || '';
            bValue = b.concernRemarks || '';
            break;
          case 'visitStatus':
            aValue = a.visitStatus || '';
            bValue = b.visitStatus || '';
            break;
          case 'visitBy':
            aValue = a.visitBy || '';
            bValue = b.visitBy || '';
            break;
          case 'visitWith':
            aValue = a.visitWith || '';
            bValue = b.visitWith || '';
            break;
          case 'visitWithOther':
            aValue = a.visitWithOther || '';
            bValue = b.visitWithOther || '';
            break;
          case 'visitRemarks':
            aValue = a.visitRemarks || '';
            bValue = b.visitRemarks || '';
            break;
          case 'modifiedBy':
            aValue = a.modifiedBy || '';
            bValue = b.modifiedBy || '';
            break;
          case 'modifiedDate':
            aValue = a.modifiedDate || '';
            bValue = b.modifiedDate || '';
            break;
          case 'userEmail':
            aValue = a.userEmail || '';
            bValue = b.userEmail || '';
            break;
          case 'requestedBy':
            aValue = a.requestedBy || '';
            bValue = b.requestedBy || '';
            break;
          case 'assignedEmail':
            aValue = a.assignedEmail || '';
            bValue = b.assignedEmail || '';
            break;
          case 'supportRemarks':
            aValue = a.supportRemarks || '';
            bValue = b.supportRemarks || '';
            break;
          case 'serviceCharge':
            aValue = a.serviceCharge || '';
            bValue = b.serviceCharge || '';
            break;
          case 'repairCategory':
            aValue = a.repairCategory || '';
            bValue = b.repairCategory || '';
            break;
          case 'supportStatus':
            aValue = a.supportStatus || '';
            bValue = b.supportStatus || '';
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
  }, [serviceOrders, selectedLocation, searchQuery, sortColumn, sortDirection]);
  
  // Status text color component
  const StatusText = ({ status, type }: { status?: string, type: 'support' | 'visit' }) => {
    if (!status) return <span className="text-gray-400">Unknown</span>;
    
    let textColor = '';
    
    if (type === 'support') {
      switch (status.toLowerCase()) {
        case 'resolved':
          textColor = 'text-green-500';
          break;
        case 'in-progress':
        case 'in progress':
          textColor = 'text-yellow-500';
          break;
        case 'pending':
          textColor = 'text-blue-500';
          break;
        case 'closed':
          textColor = 'text-gray-400';
          break;
        default:
          textColor = 'text-gray-400';
      }
    } else {
      switch (status.toLowerCase()) {
        case 'completed':
          textColor = 'text-green-500';
          break;
        case 'scheduled':
        case 'reschedule':
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
    }
    
    return (
      <span className={`${textColor} capitalize`}>
        {status === 'in-progress' ? 'In Progress' : status}
      </span>
    );
  };

  const handleRowClick = (serviceOrder: ServiceOrder) => {
    setSelectedServiceOrder(serviceOrder);
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      const authData = localStorage.getItem('authData');
      let assignedEmail: string | undefined;
      
      if (authData) {
        try {
          const userData = JSON.parse(authData);
          if (userData.role && userData.role.toLowerCase() === 'technician' && userData.email) {
            assignedEmail = userData.email;
          }
        } catch (error) {
          console.error('Error parsing auth data:', error);
        }
      }
      
      const response = await getServiceOrders(assignedEmail);
      
      if (response.success && Array.isArray(response.data)) {
        const processedOrders: ServiceOrder[] = response.data.map((order: ServiceOrderData) => ({
          id: order.id || '',
          ticketId: order.Ticket_ID || '',
          timestamp: formatDate(order.Timestamp),
          accountNumber: order.Account_Number || '',
          fullName: order.Full_Name || '',
          contactAddress: order.Contact_Address || '',
          dateInstalled: order.Date_Installed || '',
          contactNumber: order.Contact_Number || '',
          fullAddress: order.Full_Address || '',
          houseFrontPicture: order.House_Front_Picture || '',
          emailAddress: order.Email_Address || '',
          plan: order.Plan || '',
          provider: order.Provider || '',
          username: order.Username || '',
          connectionType: order.Connection_Type || '',
          routerModemSN: order.Router_Modem_SN || '',
          lcp: order.LCP || '',
          nap: order.NAP || '',
          port: order.PORT || '',
          vlan: order.VLAN || '',
          concern: order.Concern || '',
          concernRemarks: order.Concern_Remarks || '',
          visitStatus: order.Visit_Status || '',
          visitBy: order.Visit_By || '',
          visitWith: order.Visit_With || '',
          visitWithOther: order.Visit_With_Other || '',
          visitRemarks: order.Visit_Remarks || '',
          modifiedBy: order.Modified_By || '',
          modifiedDate: formatDate(order.Modified_Date),
          userEmail: order.User_Email || '',
          requestedBy: order.Requested_By || '',
          assignedEmail: order.Assigned_Email || '',
          supportRemarks: order.Support_Remarks || '',
          serviceCharge: order.Service_Charge || '₱0.00',
          repairCategory: order.Repair_Category || '',
          supportStatus: order.Support_Status || ''
        }));
        
        setServiceOrders(processedOrders);
        setError(null);
      }
    } catch (err: any) {
      console.error('Failed to refresh service orders:', err);
      setError('Failed to refresh service orders. Please try again.');
    } finally {
      setLoading(false);
    }
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
      case 'ticketId':
        return <span className="text-red-400">{serviceOrder.ticketId}</span>;
      case 'timestamp':
        return serviceOrder.timestamp;
      case 'accountNumber':
        return serviceOrder.accountNumber || '-';
      case 'fullName':
        return serviceOrder.fullName;
      case 'contactAddress':
        return serviceOrder.contactAddress || '-';
      case 'dateInstalled':
        return serviceOrder.dateInstalled || '-';
      case 'contactNumber':
        return serviceOrder.contactNumber;
      case 'fullAddress':
        return <span title={serviceOrder.fullAddress}>{serviceOrder.fullAddress}</span>;
      case 'houseFrontPicture':
        return serviceOrder.houseFrontPicture ? 'Yes' : 'No';
      case 'emailAddress':
        return serviceOrder.emailAddress || '-';
      case 'plan':
        return serviceOrder.plan || '-';
      case 'provider':
        return serviceOrder.provider || '-';
      case 'username':
        return serviceOrder.username || '-';
      case 'connectionType':
        return serviceOrder.connectionType || '-';
      case 'routerModemSN':
        return serviceOrder.routerModemSN || '-';
      case 'lcp':
        return serviceOrder.lcp || '-';
      case 'nap':
        return serviceOrder.nap || '-';
      case 'port':
        return serviceOrder.port || '-';
      case 'vlan':
        return serviceOrder.vlan || '-';
      case 'concern':
        return serviceOrder.concern;
      case 'concernRemarks':
        return serviceOrder.concernRemarks || '-';
      case 'visitStatus':
        return <StatusText status={serviceOrder.visitStatus} type="visit" />;
      case 'visitBy':
        return serviceOrder.visitBy || '-';
      case 'visitWith':
        return serviceOrder.visitWith || '-';
      case 'visitWithOther':
        return serviceOrder.visitWithOther || '-';
      case 'visitRemarks':
        return serviceOrder.visitRemarks || '-';
      case 'modifiedBy':
        return serviceOrder.modifiedBy || '-';
      case 'modifiedDate':
        return serviceOrder.modifiedDate;
      case 'userEmail':
        return serviceOrder.userEmail || '-';
      case 'requestedBy':
        return serviceOrder.requestedBy || '-';
      case 'assignedEmail':
        return serviceOrder.assignedEmail || '-';
      case 'supportRemarks':
        return serviceOrder.supportRemarks || '-';
      case 'serviceCharge':
        return serviceOrder.serviceCharge;
      case 'repairCategory':
        return serviceOrder.repairCategory || '-';
      case 'supportStatus':
        return <StatusText status={serviceOrder.supportStatus} type="support" />;
      default:
        return '-';
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-950">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500 mb-3"></div>
          <p className="text-gray-300">Loading service orders...</p>
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
          <button 
            onClick={() => window.location.reload()}
            className="bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-950 h-full flex overflow-hidden">
      {userRole.toLowerCase() !== 'technician' && (
        <div className="bg-gray-900 border-r border-gray-700 flex-shrink-0 flex flex-col relative" style={{ width: `${sidebarWidth}px` }}>
          <div className="p-4 border-b border-gray-700 flex-shrink-0">
            <div className="flex items-center mb-1">
              <h2 className="text-lg font-semibold text-white">Service Orders</h2>
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

      <div className="flex-1 bg-gray-900 overflow-hidden">
        <div className="flex flex-col h-full">
          <div className="bg-gray-900 p-4 border-b border-gray-700 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search service orders..."
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
                  onClick={handleRefresh}
                  disabled={loading}
                  className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white px-4 py-2 rounded text-sm transition-colors"
                >
                  {loading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto">
              {loading ? (
                <div className="px-4 py-12 text-center text-gray-400">
                  <div className="animate-pulse flex flex-col items-center">
                    <div className="h-4 w-1/3 bg-gray-700 rounded mb-4"></div>
                    <div className="h-4 w-1/2 bg-gray-700 rounded"></div>
                  </div>
                  <p className="mt-4">Loading service orders...</p>
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
                filteredServiceOrders.length > 0 ? (
                  <div className="space-y-0">
                    {filteredServiceOrders.map((serviceOrder) => (
                      <div
                        key={serviceOrder.id}
                        onClick={() => handleRowClick(serviceOrder)}
                        className={`px-4 py-3 cursor-pointer transition-colors hover:bg-gray-800 border-b border-gray-800 ${selectedServiceOrder?.id === serviceOrder.id ? 'bg-gray-800' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="text-red-400 font-medium text-sm mb-1">
                              {serviceOrder.ticketId} | {serviceOrder.fullName} | {serviceOrder.fullAddress}
                            </div>
                            <div className="text-white text-sm">
                              {serviceOrder.concern} | <StatusText status={serviceOrder.supportStatus} type="support" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    No service orders found matching your filters
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
                      {filteredServiceOrders.length > 0 ? (
                        filteredServiceOrders.map((serviceOrder) => (
                          <tr 
                            key={serviceOrder.id} 
                            className={`border-b border-gray-800 hover:bg-gray-900 cursor-pointer transition-colors ${selectedServiceOrder?.id === serviceOrder.id ? 'bg-gray-800' : ''}`}
                            onClick={() => handleRowClick(serviceOrder)}
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
                                  {renderCellValue(serviceOrder, column.key)}
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={filteredColumns.length} className="px-4 py-12 text-center text-gray-400 border-b border-gray-800">
                            No service orders found matching your filters
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

      {selectedServiceOrder && (
        <div className="flex-shrink-0 overflow-hidden">
          <ServiceOrderDetails 
            serviceOrder={selectedServiceOrder} 
            onClose={() => setSelectedServiceOrder(null)}
          />
        </div>
      )}
    </div>
  );
};

export default ServiceOrder;
