import React, { useState, useEffect, useRef } from 'react';
import { FileText, Search, ChevronDown, ListFilter, ArrowUp, ArrowDown } from 'lucide-react';
import JobOrderDetails from '../components/JobOrderDetails';
import { getJobOrders } from '../services/jobOrderService';
import { getCities, City } from '../services/cityService';
import { getBillingStatuses, BillingStatus } from '../services/lookupService';
import { JobOrder } from '../types/jobOrder';

interface LocationItem {
  id: string;
  name: string;
  count: number;
}

type DisplayMode = 'card' | 'table';

const allColumns = [
  { key: 'timestamp', label: 'Timestamp', width: 'min-w-40' },
  { key: 'dateInstalled', label: 'Date Installed', width: 'min-w-36' },
  { key: 'installationFee', label: 'Installation Fee', width: 'min-w-32' },
  { key: 'billingDay', label: 'Billing Day', width: 'min-w-28' },
  { key: 'billingStatusId', label: 'Billing Status ID', width: 'min-w-32' },
  { key: 'modemRouterSN', label: 'Modem/Router SN', width: 'min-w-36' },
  { key: 'routerModel', label: 'Router Model', width: 'min-w-32' },
  { key: 'groupName', label: 'Group Name', width: 'min-w-32' },
  { key: 'lcpnap', label: 'LCPNAP', width: 'min-w-28' },
  { key: 'port', label: 'PORT', width: 'min-w-24' },
  { key: 'vlan', label: 'VLAN', width: 'min-w-24' },
  { key: 'username', label: 'Username', width: 'min-w-32' },
  { key: 'ipAddress', label: 'IP Address', width: 'min-w-32' },
  { key: 'connectionType', label: 'Connection Type', width: 'min-w-36' },
  { key: 'usageType', label: 'Usage Type', width: 'min-w-32' },
  { key: 'usernameStatus', label: 'Username Status', width: 'min-w-32' },
  { key: 'visitBy', label: 'Visit By', width: 'min-w-32' },
  { key: 'visitWith', label: 'Visit With', width: 'min-w-32' },
  { key: 'visitWithOther', label: 'Visit With Other', width: 'min-w-32' },
  { key: 'onsiteStatus', label: 'Onsite Status', width: 'min-w-32' },
  { key: 'onsiteRemarks', label: 'Onsite Remarks', width: 'min-w-40' },
  { key: 'statusRemarks', label: 'Status Remarks', width: 'min-w-40' },
  { key: 'addressCoordinates', label: 'Address Coordinates', width: 'min-w-40' },
  { key: 'contractLink', label: 'Contract Link', width: 'min-w-48' },
  { key: 'clientSignatureUrl', label: 'Client Signature URL', width: 'min-w-48' },
  { key: 'setupImageUrl', label: 'Setup Image URL', width: 'min-w-48' },
  { key: 'speedtestImageUrl', label: 'Speedtest Image URL', width: 'min-w-48' },
  { key: 'signedContractImageUrl', label: 'Signed Contract Image URL', width: 'min-w-48' },
  { key: 'boxReadingImageUrl', label: 'Box Reading Image URL', width: 'min-w-48' },
  { key: 'routerReadingImageUrl', label: 'Router Reading Image URL', width: 'min-w-48' },
  { key: 'portLabelImageUrl', label: 'Port Label Image URL', width: 'min-w-48' },
  { key: 'houseFrontPictureUrl', label: 'House Front Picture URL', width: 'min-w-48' },
  { key: 'createdAt', label: 'Created At', width: 'min-w-40' },
  { key: 'createdByUserEmail', label: 'Created By User Email', width: 'min-w-48' },
  { key: 'updatedAt', label: 'Updated At', width: 'min-w-40' },
  { key: 'updatedByUserEmail', label: 'Updated By User Email', width: 'min-w-48' },
  { key: 'assignedEmail', label: 'Assigned Email', width: 'min-w-48' },
  { key: 'pppoeUsername', label: 'PPPoE Username', width: 'min-w-36' },
  { key: 'pppoePassword', label: 'PPPoE Password', width: 'min-w-36' },
  { key: 'fullName', label: 'Full Name of Client', width: 'min-w-48' },
  { key: 'address', label: 'Full Address of Client', width: 'min-w-56' },
  { key: 'contractTemplate', label: 'Contract Template', width: 'min-w-36' },
  { key: 'modifiedBy', label: 'Modified By', width: 'min-w-32' },
  { key: 'modifiedDate', label: 'Modified Date', width: 'min-w-40' },
  { key: 'firstName', label: 'First Name', width: 'min-w-32' },
  { key: 'middleInitial', label: 'Middle Initial', width: 'min-w-28' },
  { key: 'lastName', label: 'Last Name', width: 'min-w-32' },
  { key: 'contactNumber', label: 'Contact Number', width: 'min-w-36' },
  { key: 'secondContactNumber', label: 'Second Contact Number', width: 'min-w-40' },
  { key: 'emailAddress', label: 'Email Address', width: 'min-w-48' },
  { key: 'region', label: 'Region', width: 'min-w-28' },
  { key: 'city', label: 'City', width: 'min-w-28' },
  { key: 'barangay', label: 'Barangay', width: 'min-w-32' },
  { key: 'location', label: 'Location', width: 'min-w-32' },
  { key: 'choosePlan', label: 'Choose Plan', width: 'min-w-36' },
  { key: 'referredBy', label: 'Referred By', width: 'min-w-32' },
  { key: 'startTimestamp', label: 'Start Timestamp', width: 'min-w-40' },
  { key: 'endTimestamp', label: 'End Timestamp', width: 'min-w-40' },
  { key: 'duration', label: 'Duration', width: 'min-w-28' }
];

const JobOrderPage: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedJobOrder, setSelectedJobOrder] = useState<JobOrder | null>(null);
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [billingStatuses, setBillingStatuses] = useState<BillingStatus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('');
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);
  const sidebarStartXRef = useRef<number>(0);
  const sidebarStartWidthRef = useRef<number>(0);

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

  const formatDate = (dateStr?: string | null): string => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleString();
    } catch (e) {
      return '-';
    }
  };
  
  const getLastDayOfMonth = (): number => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return lastDay.getDate();
  };
  
  const formatPrice = (price?: number | null): string => {
    if (price === null || price === undefined || price === 0) return '-';
    return `₱${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getBillingStatusName = (statusId?: number | null): string => {
    if (!statusId) return '-';
    
    if (billingStatuses.length === 0) {
      const defaultStatuses: { [key: number]: string } = {
        1: 'In Progress',
        2: 'Active',
        3: 'Suspended',
        4: 'Cancelled',
        5: 'Overdue'
      };
      return defaultStatuses[statusId] || '-';
    }
    
    const status = billingStatuses.find(s => s.id === statusId);
    return status ? status.status_name : '-';
  };

  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    const authData = localStorage.getItem('authData');
    if (authData) {
      try {
        const userData = JSON.parse(authData);
        setUserRole(userData.role || '');
        setUserEmail(userData.email || '');
      } catch (error) {
      }
    }
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const citiesData = await getCities();
      setCities(citiesData);
      
      const billingStatusesData = await getBillingStatuses();
      setBillingStatuses(billingStatusesData);
      
      const authData = localStorage.getItem('authData');
      let assignedEmail: string | undefined;
      
      if (authData) {
        try {
          const userData = JSON.parse(authData);
          if (userData.role && userData.role.toLowerCase() === 'technician' && userData.email) {
            assignedEmail = userData.email;
          }
        } catch (error) {
        }
      }
      
      const response = await getJobOrders(assignedEmail);
      
      if (response.success && Array.isArray(response.data)) {
        const processedOrders: JobOrder[] = response.data.map((order, index) => {
          const id = order.id || order.JobOrder_ID || String(index);
          
          return {
            ...order,
            id: id
          };
        });
        
        setJobOrders(processedOrders);
      } else {
        setJobOrders([]);
      }
    } catch (err: any) {
      setError(`Failed to load data: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  
  const getClientFullName = (jobOrder: JobOrder): string => {
    return [
      jobOrder.First_Name || jobOrder.first_name || '',
      jobOrder.Middle_Initial || jobOrder.middle_initial ? (jobOrder.Middle_Initial || jobOrder.middle_initial) + '.' : '',
      jobOrder.Last_Name || jobOrder.last_name || ''
    ].filter(Boolean).join(' ').trim() || '-';
  };

  const getClientFullAddress = (jobOrder: JobOrder): string => {
    const addressParts = [
      jobOrder.Address || jobOrder.address,
      jobOrder.Location || jobOrder.location,
      jobOrder.Barangay || jobOrder.barangay,
      jobOrder.City || jobOrder.city,
      jobOrder.Region || jobOrder.region
    ].filter(Boolean);
    
    return addressParts.length > 0 ? addressParts.join(', ') : '-';
  };

  const locationItems: LocationItem[] = [
    {
      id: 'all',
      name: 'All',
      count: jobOrders.length
    }
  ];

  cities.forEach(city => {
    const cityCount = jobOrders.filter(job => {
      const jobCity = ((job.City || job.city) || '').toLowerCase();
      const cityName = city.name.toLowerCase();
      return jobCity.includes(cityName) || cityName.includes(jobCity);
    }).length;
    
    locationItems.push({
      id: city.name.toLowerCase(),
      name: city.name,
      count: cityCount
    });
  });
  
  const filteredJobOrders = jobOrders.filter(jobOrder => {
    const jobLocation = ((jobOrder.City || jobOrder.city) || '').toLowerCase();
    
    const matchesLocation = selectedLocation === 'all' || 
                          jobLocation.includes(selectedLocation) || 
                          selectedLocation.includes(jobLocation);
    
    const fullName = getClientFullName(jobOrder).toLowerCase();
    const matchesSearch = searchQuery === '' || 
                         fullName.includes(searchQuery.toLowerCase()) ||
                         ((jobOrder.Address || jobOrder.address) || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ((jobOrder.Assigned_Email || jobOrder.assigned_email) || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesLocation && matchesSearch;
  });

  const sortedJobOrders = [...filteredJobOrders].sort((a, b) => {
    if (!sortColumn) return 0;

    let aValue: any = '';
    let bValue: any = '';

    const getVal = (jo: JobOrder, key: string) => {
      switch (key) {
        case 'timestamp': return jo.Timestamp || jo.timestamp || '';
        case 'dateInstalled': return jo.Date_Installed || jo.date_installed || '';
        case 'installationFee': return jo.Installation_Fee || jo.installation_fee || 0;
        case 'billingDay': return jo.Billing_Day ?? jo.billing_day ?? 0;
        case 'billingStatusId': return jo.billing_status_id || jo.Billing_Status_ID || '';
        case 'modemRouterSN': return jo.Modem_Router_SN || jo.modem_router_sn || '';
        case 'routerModel': return jo.Router_Model || jo.router_model || '';
        case 'groupName': return jo.group_name || jo.Group_Name || '';
        case 'lcpnap': return jo.LCPNAP || jo.lcpnap || '';
        case 'port': return jo.PORT || jo.Port || jo.port || '';
        case 'vlan': return jo.VLAN || jo.vlan || '';
        case 'username': return jo.Username || jo.username || '';
        case 'ipAddress': return jo.IP_Address || jo.ip_address || jo.IP || jo.ip || '';
        case 'connectionType': return jo.Connection_Type || jo.connection_type || '';
        case 'usageType': return jo.Usage_Type || jo.usage_type || '';
        case 'usernameStatus': return jo.username_status || jo.Username_Status || '';
        case 'visitBy': return jo.Visit_By || jo.visit_by || '';
        case 'visitWith': return jo.Visit_With || jo.visit_with || '';
        case 'visitWithOther': return jo.Visit_With_Other || jo.visit_with_other || '';
        case 'onsiteStatus': return jo.Onsite_Status || jo.onsite_status || '';
        case 'onsiteRemarks': return jo.Onsite_Remarks || jo.onsite_remarks || '';
        case 'statusRemarks': return jo.Status_Remarks || jo.status_remarks || '';
        case 'fullName': return getClientFullName(jo);
        case 'address': return getClientFullAddress(jo);
        case 'assignedEmail': return jo.Assigned_Email || jo.assigned_email || '';
        case 'createdAt': return jo.created_at || jo.Created_At || '';
        case 'updatedAt': return jo.updated_at || jo.Updated_At || '';
        default: return '';
      }
    };

    aValue = getVal(a, sortColumn);
    bValue = getVal(b, sortColumn);

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const StatusText = ({ status, type }: { status?: string | null, type: 'onsite' | 'billing' }) => {
    if (!status) return <span className="text-gray-400">-</span>;
    
    let textColor = '';
    
    if (type === 'onsite') {
      switch (status.toLowerCase()) {
        case 'done':
          textColor = 'text-green-500';
          break;
        case 'reschedule':
          textColor = 'text-blue-500';
          break;
        case 'inprogress':
        case 'in progress':
          textColor = 'text-yellow-500';
          break;
        case 'failed':
          textColor = 'text-red-500';
          break;
        default:
          textColor = 'text-gray-400';
      }
    } else {
      switch (status.toLowerCase()) {
        case 'done':
          textColor = 'text-green-500';
          break;
        case 'pending':
          textColor = 'text-yellow-500';
          break;
        default:
          textColor = 'text-gray-400';
      }
    }
    
    return (
      <span className={`${textColor} capitalize`}>
        {status === 'inprogress' ? 'In Progress' : status}
      </span>
    );
  };

  const handleRowClick = (jobOrder: JobOrder) => {
    setSelectedJobOrder(jobOrder);
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

  const getValue = (value: any): string => {
    if (value === null || value === undefined || value === '') return '-';
    if (typeof value === 'string' && value.trim().toLowerCase() === 'null') return '-';
    return value;
  };

  const renderCellValue = (jobOrder: JobOrder, columnKey: string): string => {
    switch (columnKey) {
      case 'timestamp':
        return formatDate(jobOrder.Timestamp || jobOrder.timestamp);
      case 'dateInstalled':
        return formatDate(jobOrder.Date_Installed || jobOrder.date_installed);
      case 'installationFee':
        return formatPrice(jobOrder.Installation_Fee || jobOrder.installation_fee);
      case 'billingDay':
        const billingDay = jobOrder.Billing_Day ?? jobOrder.billing_day;
        if (billingDay === null || billingDay === undefined) return '-';
        const dayValue = Number(billingDay);
        if (isNaN(dayValue)) return '-';
        return dayValue === 0 ? String(getLastDayOfMonth()) : String(dayValue);
      case 'billingStatusId':
        return getValue(jobOrder.billing_status_id || jobOrder.Billing_Status_ID);
      case 'modemRouterSN':
        return getValue(jobOrder.Modem_Router_SN || jobOrder.modem_router_sn);
      case 'routerModel':
        return getValue(jobOrder.Router_Model || jobOrder.router_model);
      case 'groupName':
        return getValue(jobOrder.group_name || jobOrder.Group_Name);
      case 'lcpnap':
        return getValue(jobOrder.LCPNAP || jobOrder.lcpnap);
      case 'port':
        return getValue(jobOrder.PORT || jobOrder.Port || jobOrder.port);
      case 'vlan':
        return getValue(jobOrder.VLAN || jobOrder.vlan);
      case 'username':
        return getValue(jobOrder.Username || jobOrder.username);
      case 'ipAddress':
        return getValue(jobOrder.IP_Address || jobOrder.ip_address || jobOrder.IP || jobOrder.ip);
      case 'connectionType':
        return getValue(jobOrder.Connection_Type || jobOrder.connection_type);
      case 'usageType':
        return getValue(jobOrder.Usage_Type || jobOrder.usage_type);
      case 'usernameStatus':
        return getValue(jobOrder.username_status || jobOrder.Username_Status);
      case 'visitBy':
        return getValue(jobOrder.Visit_By || jobOrder.visit_by);
      case 'visitWith':
        return getValue(jobOrder.Visit_With || jobOrder.visit_with);
      case 'visitWithOther':
        return getValue(jobOrder.Visit_With_Other || jobOrder.visit_with_other);
      case 'onsiteStatus':
        return jobOrder.Onsite_Status || jobOrder.onsite_status || '-';
      case 'onsiteRemarks':
        return getValue(jobOrder.Onsite_Remarks || jobOrder.onsite_remarks);
      case 'statusRemarks':
        return getValue(jobOrder.Status_Remarks || jobOrder.status_remarks);
      case 'addressCoordinates':
        return getValue(jobOrder.Address_Coordinates || jobOrder.address_coordinates);
      case 'contractLink':
        return getValue(jobOrder.Contract_Link || jobOrder.contract_link);
      case 'clientSignatureUrl':
        return getValue(
          jobOrder.client_signature_url || 
          jobOrder.Client_Signature_URL || 
          jobOrder.client_signature_image_url ||
          jobOrder.Client_Signature_Image_URL
        );
      case 'setupImageUrl':
        return getValue(
          jobOrder.setup_image_url || 
          jobOrder.Setup_Image_URL ||
          jobOrder.Setup_Image_Url
        );
      case 'speedtestImageUrl':
        return getValue(
          jobOrder.speedtest_image_url || 
          jobOrder.Speedtest_Image_URL ||
          jobOrder.speedtest_image ||
          jobOrder.Speedtest_Image
        );
      case 'signedContractImageUrl':
        return getValue(
          jobOrder.signed_contract_image_url || 
          jobOrder.Signed_Contract_Image_URL ||
          jobOrder.signed_contract_url ||
          jobOrder.Signed_Contract_URL
        );
      case 'boxReadingImageUrl':
        return getValue(
          jobOrder.box_reading_image_url || 
          jobOrder.Box_Reading_Image_URL ||
          jobOrder.box_reading_url ||
          jobOrder.Box_Reading_URL
        );
      case 'routerReadingImageUrl':
        return getValue(
          jobOrder.router_reading_image_url || 
          jobOrder.Router_Reading_Image_URL ||
          jobOrder.router_reading_url ||
          jobOrder.Router_Reading_URL
        );
      case 'portLabelImageUrl':
        return getValue(
          jobOrder.port_label_image_url || 
          jobOrder.Port_Label_Image_URL ||
          jobOrder.port_label_url ||
          jobOrder.Port_Label_URL
        );
      case 'houseFrontPictureUrl':
        return getValue(
          jobOrder.house_front_picture_url || 
          jobOrder.House_Front_Picture_URL ||
          jobOrder.house_front_picture ||
          jobOrder.House_Front_Picture
        );
      case 'createdAt':
        return formatDate(jobOrder.created_at || jobOrder.Created_At);
      case 'createdByUserEmail':
        return getValue(jobOrder.created_by_user_email || jobOrder.Created_By_User_Email);
      case 'updatedAt':
        return formatDate(jobOrder.updated_at || jobOrder.Updated_At);
      case 'updatedByUserEmail':
        return getValue(jobOrder.updated_by_user_email || jobOrder.Updated_By_User_Email);
      case 'assignedEmail':
        return getValue(jobOrder.Assigned_Email || jobOrder.assigned_email);
      case 'pppoeUsername':
        return getValue(jobOrder.PPPoE_Username || jobOrder.pppoe_username);
      case 'pppoePassword':
        return getValue(jobOrder.PPPoE_Password || jobOrder.pppoe_password);
      case 'fullName':
        return getClientFullName(jobOrder);
      case 'address':
        return getClientFullAddress(jobOrder);
      case 'contractTemplate':
        return getValue(jobOrder.Contract_Template || jobOrder.contract_template);
      case 'modifiedBy':
        return getValue(jobOrder.Modified_By || jobOrder.modified_by);
      case 'modifiedDate':
        return formatDate(jobOrder.Modified_Date || jobOrder.modified_date);
      case 'firstName':
        return getValue(jobOrder.First_Name || jobOrder.first_name);
      case 'middleInitial':
        return getValue(jobOrder.Middle_Initial || jobOrder.middle_initial);
      case 'lastName':
        return getValue(jobOrder.Last_Name || jobOrder.last_name);
      case 'contactNumber':
        return getValue(jobOrder.Contact_Number || jobOrder.Mobile_Number || jobOrder.contact_number || jobOrder.mobile_number);
      case 'secondContactNumber':
        return getValue(jobOrder.Second_Contact_Number || jobOrder.Secondary_Mobile_Number || jobOrder.second_contact_number || jobOrder.secondary_mobile_number);
      case 'emailAddress':
        return getValue(jobOrder.Email_Address || jobOrder.Applicant_Email_Address || jobOrder.email_address || jobOrder.applicant_email_address);
      case 'region':
        return getValue(jobOrder.Region || jobOrder.region);
      case 'city':
        return getValue(jobOrder.City || jobOrder.city);
      case 'barangay':
        return getValue(jobOrder.Barangay || jobOrder.barangay);
      case 'location':
        return getValue(jobOrder.Location || jobOrder.location);
      case 'choosePlan':
        return getValue(jobOrder.Choose_Plan || jobOrder.Desired_Plan || jobOrder.choose_plan || jobOrder.desired_plan);
      case 'referredBy':
        return getValue(jobOrder.Referred_By || jobOrder.referred_by);
      case 'startTimestamp':
        return formatDate(jobOrder.StartTimeStamp || jobOrder.start_timestamp);
      case 'endTimestamp':
        return formatDate(jobOrder.EndTimeStamp || jobOrder.end_timestamp);
      case 'duration':
        return getValue(jobOrder.Duration || jobOrder.duration);
      default:
        return '-';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-950">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500 mb-3"></div>
          <p className="text-gray-300">Loading job orders...</p>
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
            <h2 className="text-lg font-semibold text-white">Job Orders</h2>
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

      <div className={`bg-gray-900 overflow-hidden flex-1`}>
        <div className="flex flex-col h-full">
          <div className="bg-gray-900 p-4 border-b border-gray-700 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search job orders..."
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
                <button
                  onClick={() => window.location.reload()}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded text-sm transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto">
              {displayMode === 'card' ? (
                sortedJobOrders.length > 0 ? (
                  <div className="space-y-0">
                    {sortedJobOrders.map((jobOrder) => (
                      <div
                        key={jobOrder.id}
                        onClick={() => handleRowClick(jobOrder)}
                        className={`px-4 py-3 cursor-pointer transition-colors hover:bg-gray-800 border-b border-gray-800 ${selectedJobOrder?.id === jobOrder.id ? 'bg-gray-800' : ''}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-medium text-sm mb-1">
                              {getClientFullName(jobOrder)}
                            </div>
                            <div className="text-gray-400 text-xs">
                              {formatDate(jobOrder.Timestamp || jobOrder.timestamp)} | {getClientFullAddress(jobOrder)}
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-1 ml-4 flex-shrink-0">
                            <StatusText status={jobOrder.Onsite_Status || jobOrder.onsite_status} type="onsite" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    No job orders found matching your filters
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
                      {sortedJobOrders.length > 0 ? (
                        sortedJobOrders.map((jobOrder) => (
                          <tr 
                            key={jobOrder.id} 
                            className={`border-b border-gray-800 hover:bg-gray-900 cursor-pointer transition-colors ${selectedJobOrder?.id === jobOrder.id ? 'bg-gray-800' : ''}`}
                            onClick={() => handleRowClick(jobOrder)}
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
                                <div className="truncate" title={renderCellValue(jobOrder, column.key)}>
                                  {renderCellValue(jobOrder, column.key)}
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={filteredColumns.length} className="px-4 py-12 text-center text-gray-400 border-b border-gray-800">
                            {jobOrders.length > 0
                              ? 'No job orders found matching your filters'
                              : 'No job orders found. Create your first job order.'}
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

      {selectedJobOrder && (
        <div className="flex-shrink-0 overflow-hidden">
          <JobOrderDetails 
            jobOrder={selectedJobOrder} 
            onClose={() => setSelectedJobOrder(null)}
            onRefresh={fetchData}
          />
        </div>
      )}
    </div>
  );
};

export default JobOrderPage;
