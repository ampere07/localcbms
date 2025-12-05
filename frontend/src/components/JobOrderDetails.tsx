import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, ArrowRight, Maximize2, X, Phone, MessageSquare, Info, 
  ExternalLink, Mail, Edit
} from 'lucide-react';
import { updateJobOrder, approveJobOrder } from '../services/jobOrderService';
import { getBillingStatuses, BillingStatus } from '../services/lookupService';
import { JobOrderDetailsProps } from '../types/jobOrder';
import JobOrderDoneFormModal from '../modals/JobOrderDoneFormModal';
import JobOrderDoneFormTechModal from '../modals/JobOrderDoneFormTechModal';
import JobOrderEditFormModal from '../modals/JobOrderEditFormModal';
import ApprovalConfirmationModal from '../modals/ApprovalConfirmationModal';

const JobOrderDetails: React.FC<JobOrderDetailsProps> = ({ jobOrder, onClose, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDoneModalOpen, setIsDoneModalOpen] = useState(false);
  const [isDoneTechModalOpen, setIsDoneTechModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [billingStatuses, setBillingStatuses] = useState<BillingStatus[]>([]);
  const [userRole, setUserRole] = useState<string>('');
  const [detailsWidth, setDetailsWidth] = useState<number>(600);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);
  
  // Get user role from localStorage
  useEffect(() => {
    const authData = localStorage.getItem('authData');
    if (authData) {
      try {
        const userData = JSON.parse(authData);
        setUserRole(userData.role?.toLowerCase() || '');
      } catch (error) {
        console.error('Error parsing auth data:', error);
      }
    }
  }, []);
  
  // Fetch billing statuses on mount
  useEffect(() => {
    const fetchBillingStatuses = async () => {
      try {
        const statuses = await getBillingStatuses();
        setBillingStatuses(statuses);
      } catch (error) {
        console.error('Error fetching billing statuses:', error);
      }
    };
    fetchBillingStatuses();
  }, []);
  
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const diff = startXRef.current - e.clientX;
      const newWidth = Math.max(600, Math.min(1200, startWidthRef.current + diff));
      
      setDetailsWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = detailsWidth;
  };
  
  // Get billing status name by ID
  const getBillingStatusName = (statusId?: number | null): string => {
    if (!statusId) return 'Not Set';
    
    // If billing statuses haven't loaded yet, show a default based on common IDs
    if (billingStatuses.length === 0) {
      const defaultStatuses: { [key: number]: string } = {
        1: 'In Progress',
        2: 'Active',
        3: 'Suspended',
        4: 'Cancelled',
        5: 'Overdue'
      };
      return defaultStatuses[statusId] || 'Loading...';
    }
    
    const status = billingStatuses.find(s => s.id === statusId);
    return status ? status.status_name : `Unknown (ID: ${statusId})`;
  };
  
  const formatDate = (dateStr?: string | null): string => {
    if (!dateStr) return 'Not scheduled';
    try {
      return new Date(dateStr).toLocaleString();
    } catch (e) {
      return dateStr;
    }
  };
  
  const formatPrice = (price?: string | number | null): string => {
    if (price === null || price === undefined) return '₱0.00';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `₱${numPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getLastDayOfMonth = (): number => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return lastDay.getDate();
  };

  const getBillingDayDisplay = (billingDay?: string | number | null): string => {
    const day = billingDay ?? null;
    if (day === null || day === undefined) return 'Not set';
    const dayValue = Number(day);
    if (isNaN(dayValue)) return 'Not set';
    return dayValue === 0 ? String(getLastDayOfMonth()) : String(dayValue);
  };

  const getClientFullName = (): string => {
    return [
      jobOrder.First_Name || '',
      jobOrder.Middle_Initial ? jobOrder.Middle_Initial + '.' : '',
      jobOrder.Last_Name || ''
    ].filter(Boolean).join(' ').trim() || 'Unknown Client';
  };

  const getClientFullAddress = (): string => {
    const addressParts = [
      jobOrder.Installation_Address || jobOrder.Address,
      jobOrder.Location,
      jobOrder.Barangay,
      jobOrder.City,
      jobOrder.Region
    ].filter(Boolean);
    
    return addressParts.length > 0 ? addressParts.join(', ') : 'No address provided';
  };

  const getStatusColor = (status: string | undefined | null, type: 'onsite' | 'billing') => {
    if (!status) return 'text-gray-400';
    
    if (type === 'onsite') {
      switch (status.toLowerCase()) {
        case 'done':
          return 'text-green-500';
        case 'reschedule':
          return 'text-blue-500';
        case 'inprogress':
        case 'in progress':
          return 'text-yellow-500';
        case 'failed':
          return 'text-red-500';
        default:
          return 'text-gray-400';
      }
    } else {
      switch (status.toLowerCase()) {
        case 'done':
          return 'text-green-500';
        case 'pending':
          return 'text-yellow-500';
        default:
          return 'text-gray-400';
      }
    }
  };
  
  const handleDoneClick = () => {
    if (userRole === 'technician') {
      setIsDoneTechModalOpen(true);
    } else {
      setIsDoneModalOpen(true);
    }
  };

  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };

  const handleDoneSave = async (formData: any) => {
    try {
      setLoading(true);
      
      if (!jobOrder.id) {
        throw new Error('Cannot update job order: Missing ID');
      }
      
      await updateJobOrder(jobOrder.id, {
        Onsite_Status: formData.onsiteStatus,
        Modified_By: formData.modifiedBy,
        Modified_Date: formData.modifiedDate,
        Contract_Link: formData.contractLink,
        Contract_Template: formData.contractTemplate,
        Assigned_Email: formData.assignedEmail
      });
      
      alert('Job Order updated successfully!');
      setIsDoneModalOpen(false);
    } catch (err: any) {
      setError(`Failed to update job order: ${err.message}`);
      console.error('Update error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSave = async (formData: any) => {
    try {
      setLoading(true);
      
      if (!jobOrder.id) {
        throw new Error('Cannot update job order: Missing ID');
      }
      
      await updateJobOrder(jobOrder.id, {
        Referred_By: formData.referredBy,
        Date_Installed: formData.dateInstalled,
        Usage_Type: formData.usageType,
        First_Name: formData.firstName,
        Middle_Initial: formData.middleInitial,
        Last_Name: formData.lastName,
        Contact_Number: formData.contactNumber,
        Second_Contact_Number: formData.secondContactNumber,
        Email_Address: formData.email,
        Address: formData.address,
        Barangay: formData.barangay,
        City: formData.city,
        Region: formData.region,
        Address_Coordinates: formData.addressCoordinates,
        Choose_Plan: formData.choosePlan,
        Status: formData.status,
        Connection_Type: formData.connectionType,
        Router_Model: formData.routerModel,
        Modem_SN: formData.modemSN,
        Provider: formData.provider,
        LCP: formData.lcp,
        NAP: formData.nap,
        PORT: formData.port,
        VLAN: formData.vlan,
        Username: formData.username,
        Onsite_Status: formData.onsiteStatus,
        Onsite_Remarks: formData.onsiteRemarks,
        Modified_By: formData.modifiedBy,
        Modified_Date: formData.modifiedDate,
        Contract_Link: formData.contractLink,
        Contract_Template: formData.contractTemplate,
        Assigned_Email: formData.assignedEmail,
        Item_Name_1: formData.itemName1,
        Visit_By: formData.visitBy,
        Visit_With: formData.visitWith,
        Visit_With_Other: formData.visitWithOther,
        Status_Remarks: formData.statusRemarks
      });
      
      alert('Job Order updated successfully!');
      setIsEditModalOpen(false);
    } catch (err: any) {
      setError(`Failed to update job order: ${err.message}`);
      console.error('Update error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleApproveClick = () => {
    setIsApprovalModalOpen(true);
  };
  
  const handleApproveConfirm = async () => {
    try {
      setLoading(true);
      
      if (!jobOrder.id) {
        throw new Error('Cannot approve job order: Missing ID');
      }
      
      const response = await approveJobOrder(jobOrder.id);
      
      if (response.success) {
        alert('Job Order approved successfully! Customer, billing account, and technical details have been created.');
        setIsApprovalModalOpen(false);
        if (onRefresh) {
          onRefresh();
        }
        onClose();
      } else {
        throw new Error(response.message || 'Failed to approve job order');
      }
    } catch (err: any) {
      setError(`Failed to approve job order: ${err.message}`);
      console.error('Approve error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const shouldShowApproveButton = () => {
    const onsiteStatus = (jobOrder.Onsite_Status || '').toLowerCase();
    const billingStatusId = jobOrder.billing_status_id || jobOrder.Billing_Status_ID;
    const isAdministrator = userRole === 'administrator';
    
    return onsiteStatus === 'done' && billingStatusId === 1 && isAdministrator;
  };
  
  const handleStatusUpdate = async (newStatus: string) => {
    try {
      setLoading(true);
      
      if (!jobOrder.id) {
        throw new Error('Cannot update job order: Missing ID');
      }
      
      await updateJobOrder(jobOrder.id, { 
        Onsite_Status: newStatus,
        Modified_By: 'current_user@ampere.com',
      });
      
      jobOrder.Onsite_Status = newStatus;
      
      alert(`Status updated to ${newStatus}`);
    } catch (err: any) {
      setError(`Failed to update status: ${err.message}`);
      console.error('Status update error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="h-full bg-gray-950 flex flex-col overflow-hidden border-l border-white border-opacity-30 relative" style={{ width: `${detailsWidth}px` }}>
      <div
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-orange-500 transition-colors z-50"
        onMouseDown={handleMouseDownResize}
      />
      <div className="bg-gray-800 p-3 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center">
          <h2 className="text-white font-medium">{getClientFullName()}</h2>
          {loading && <div className="ml-3 animate-pulse text-orange-500 text-sm">Loading...</div>}
        </div>
        
        <div className="flex items-center space-x-3">
          {userRole !== 'technician' && (
            <>
              <button className="bg-gray-800 hover:bg-gray-700 text-white p-1 rounded-sm border border-gray-700 flex items-center justify-center">
                <X size={16} />
              </button>
              <button className="bg-gray-800 hover:bg-gray-700 text-white p-1 rounded-sm border border-gray-700 flex items-center justify-center">
                <ExternalLink size={16} />
              </button>
            </>
          )}
          {shouldShowApproveButton() && (
            <button 
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-sm flex items-center"
              onClick={handleApproveClick}
              disabled={loading}
            >
              <span>Approve</span>
            </button>
          )}
          <button 
            className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded-sm flex items-center"
            onClick={handleDoneClick}
            disabled={loading}
          >
            <span>Done</span>
          </button>
          <button className="hover:text-white text-gray-400"><ArrowLeft size={16} /></button>
          <button className="hover:text-white text-gray-400"><ArrowRight size={16} /></button>
          <button className="hover:text-white text-gray-400"><Maximize2 size={16} /></button>
          <button 
            onClick={onClose}
            className="hover:text-white text-gray-400"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>
      
      {userRole !== 'technician' && (
        <div className="bg-gray-900 py-3 border-b border-gray-700 flex items-center justify-center px-4">
          <button 
            onClick={handleEditClick}
            disabled={loading}
            className="flex flex-col items-center text-center p-2 rounded-md hover:bg-gray-800 transition-colors"
          >
            <div className="bg-orange-600 p-2 rounded-full">
              <div className="text-white">
                <Edit size={18} />
              </div>
            </div>
            <span className="text-xs mt-1 text-gray-300">Edit</span>
          </button>
        </div>
      )}
      
      {error && (
        <div className="bg-red-900 bg-opacity-20 border border-red-700 text-red-400 p-3 m-3 rounded">
          {error}
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto py-6 px-4 bg-gray-950">
          <div className="space-y-4">
            <div className="flex border-b border-gray-800 pb-4">
              <div className="w-40 text-gray-400 text-sm">Timestamp:</div>
              <div className="text-white flex-1">{formatDate(jobOrder.Timestamp)}</div>
            </div>
            
            <div className="flex border-b border-gray-800 pb-4">
              <div className="w-40 text-gray-400 text-sm">Billing Status:</div>
              <div className={`${getStatusColor(getBillingStatusName(jobOrder.Billing_Status_ID || jobOrder.billing_status_id), 'billing')} flex-1 capitalize`}>
                {getBillingStatusName(jobOrder.Billing_Status_ID || jobOrder.billing_status_id)}
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 pb-4">
              <div className="w-40 text-gray-400 text-sm">Billing Day:</div>
              <div className="text-white flex-1">
                {getBillingDayDisplay(jobOrder.Billing_Day ?? jobOrder.billing_day)}
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 pb-4">
              <div className="w-40 text-gray-400 text-sm">Installation Fee:</div>
              <div className="text-white flex-1">{formatPrice(jobOrder.Installation_Fee)}</div>
            </div>
            
            <div className="flex border-b border-gray-800 pb-4">
              <div className="w-40 text-gray-400 text-sm">Referred By:</div>
              <div className="text-white flex-1">{jobOrder.Referred_By || 'None'}</div>
            </div>
            
            <div className="flex border-b border-gray-800 pb-4">
              <div className="w-40 text-gray-400 text-sm">Full Name of Client:</div>
              <div className="text-white flex-1">{getClientFullName()}</div>
            </div>
            
            <div className="flex border-b border-gray-800 pb-4">
              <div className="w-40 text-gray-400 text-sm">Full Address of Client:</div>
              <div className="text-white flex-1">{getClientFullAddress()}</div>
            </div>
            
            <div className="flex border-b border-gray-800 pb-4">
              <div className="w-40 text-gray-400 text-sm">Contact Number:</div>
              <div className="text-white flex-1 flex items-center">
                {jobOrder.Mobile_Number || jobOrder.Contact_Number || 'Not provided'}
                {(jobOrder.Mobile_Number || jobOrder.Contact_Number) && (
                  <>
                    <button className="text-gray-400 hover:text-white ml-2">
                      <Phone size={16} />
                    </button>
                    <button className="text-gray-400 hover:text-white ml-2">
                      <MessageSquare size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 pb-4">
              <div className="w-40 text-gray-400 text-sm">Second Contact Number:</div>
              <div className="text-white flex-1 flex items-center">
                {jobOrder.Secondary_Mobile_Number || 'Not provided'}
                {jobOrder.Secondary_Mobile_Number && (
                  <>
                    <button className="text-gray-400 hover:text-white ml-2">
                      <Phone size={16} />
                    </button>
                    <button className="text-gray-400 hover:text-white ml-2">
                      <MessageSquare size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 pb-4">
              <div className="w-40 text-gray-400 text-sm">Email Address:</div>
              <div className="text-white flex-1 flex items-center">
                {jobOrder.Email_Address || jobOrder.Applicant_Email_Address || 'Not provided'}
                {(jobOrder.Email_Address || jobOrder.Applicant_Email_Address) && (
                  <button className="text-gray-400 hover:text-white ml-2">
                    <Mail size={16} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex border-b border-gray-800 pb-4">
              <div className="w-40 text-gray-400 text-sm">Location:</div>
              <div className="text-white flex-1">{jobOrder.Location || 'Not specified'}</div>
            </div>
            
            <div className="flex border-b border-gray-800 pb-4">
              <div className="w-40 text-gray-400 text-sm">Barangay:</div>
              <div className="text-white flex-1">{jobOrder.Barangay || 'Not specified'}</div>
            </div>
            
            <div className="flex border-b border-gray-800 pb-4">
              <div className="w-40 text-gray-400 text-sm">City:</div>
              <div className="text-white flex-1">{jobOrder.City || 'Not specified'}</div>
            </div>
            
            <div className="flex border-b border-gray-800 pb-4">
              <div className="w-40 text-gray-400 text-sm">Region:</div>
              <div className="text-white flex-1">{jobOrder.Region || 'Not specified'}</div>
            </div>
            
            <div className="flex border-b border-gray-800 pb-4">
              <div className="w-40 text-gray-400 text-sm">Choose Plan:</div>
              <div className="text-white flex-1 flex items-center">
                {jobOrder.Desired_Plan || jobOrder.Choose_Plan || 'Not specified'}
                <button className="text-gray-400 hover:text-white ml-2">
                  <Info size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 pb-4">
              <div className="w-40 text-gray-400 text-sm">Status Remarks:</div>
              <div className="text-white flex-1">{jobOrder.Status_Remarks || 'No remarks'}</div>
            </div>
            
            <div className="flex border-b border-gray-800 pb-4">
              <div className="w-40 text-gray-400 text-sm">Remarks:</div>
              <div className="text-white flex-1">{jobOrder.Remarks || 'No remarks'}</div>
            </div>
            
            <div className="flex border-b border-gray-800 pb-4">
              <div className="w-40 text-gray-400 text-sm">Installation Landmark:</div>
              <div className="text-white flex-1">{jobOrder.Installation_Landmark || 'Not provided'}</div>
            </div>
            
            <div className="flex border-b border-gray-800 pb-4">
              <div className="w-40 text-gray-400 text-sm">Connection Type:</div>
              <div className="text-white flex-1">{jobOrder.Connection_Type || 'Not specified'}</div>
            </div>
            
            <div className="flex border-b border-gray-800 pb-4">
              <div className="w-40 text-gray-400 text-sm">Modem/Router SN:</div>
              <div className="text-white flex-1">{jobOrder.Modem_Router_SN || jobOrder.modem_router_sn || jobOrder.Modem_SN || jobOrder.modem_sn || 'Not specified'}</div>
            </div>
            
            <div className="flex border-b border-gray-800 pb-4">
              <div className="w-40 text-gray-400 text-sm">Router Model:</div>
              <div className="text-white flex-1">{jobOrder.Router_Model || jobOrder.router_model || 'Not specified'}</div>
            </div>
            
            <div className="flex border-b border-gray-800 pb-4">
              <div className="w-40 text-gray-400 text-sm">Affiliate Name:</div>
              <div className="text-white flex-1">{jobOrder.group_name || jobOrder.Group_Name || 'Not specified'}</div>
            </div>
            
            <div className="flex border-b border-gray-800 pb-4">
              <div className="w-40 text-gray-400 text-sm">LCPNAP:</div>
              <div className="text-white flex-1">{jobOrder.LCPNAP || jobOrder.lcpnap || 'Not specified'}</div>
            </div>
            
            <div className="flex border-b border-gray-800 pb-4">
              <div className="w-40 text-gray-400 text-sm">PORT:</div>
              <div className="text-white flex-1">{jobOrder.PORT || jobOrder.Port || jobOrder.port || 'Not specified'}</div>
            </div>
            
            <div className="flex border-b border-gray-800 pb-4">
              <div className="w-40 text-gray-400 text-sm">VLAN:</div>
              <div className="text-white flex-1">{jobOrder.VLAN || jobOrder.vlan || 'Not specified'}</div>
            </div>
            
            <div className="flex border-b border-gray-800 pb-4">
              <div className="w-40 text-gray-400 text-sm">Username:</div>
              <div className="text-white flex-1">{jobOrder.Username || jobOrder.username || 'Not provided'}</div>
            </div>
            
            <div className="flex border-b border-gray-800 pb-4">
              <div className="w-40 text-gray-400 text-sm">IP Address:</div>
              <div className="text-white flex-1">{jobOrder.IP_Address || jobOrder.ip_address || jobOrder.IP || jobOrder.ip || 'Not specified'}</div>
            </div>
            
            <div className="flex border-b border-gray-800 pb-4">
              <div className="w-40 text-gray-400 text-sm">Usage Type:</div>
              <div className="text-white flex-1">{jobOrder.Usage_Type || jobOrder.usage_type || 'Not specified'}</div>
            </div>
            
            <div className="flex border-b border-gray-800 pb-4">
              <div className="w-40 text-gray-400 text-sm">Date Installed:</div>
              <div className="text-white flex-1">
                {jobOrder.Date_Installed || jobOrder.date_installed 
                  ? formatDate(jobOrder.Date_Installed || jobOrder.date_installed) 
                  : 'Not installed yet'}
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 pb-4">
              <div className="w-40 text-gray-400 text-sm">Visit By:</div>
              <div className="text-white flex-1">{jobOrder.Visit_By || jobOrder.visit_by || 'Not assigned'}</div>
            </div>
            
            <div className="flex border-b border-gray-800 pb-4">
              <div className="w-40 text-gray-400 text-sm">Visit With:</div>
              <div className="text-white flex-1">{jobOrder.Visit_With || jobOrder.visit_with || 'None'}</div>
            </div>
            
            <div className="flex border-b border-gray-800 pb-4">
              <div className="w-40 text-gray-400 text-sm">Visit With Other:</div>
              <div className="text-white flex-1">{jobOrder.Visit_With_Other || jobOrder.visit_with_other || 'None'}</div>
            </div>
            
            <div className="flex border-b border-gray-800 pb-4">
              <div className="w-40 text-gray-400 text-sm">Onsite Status:</div>
              <div className={`${getStatusColor(jobOrder.Onsite_Status, 'onsite')} flex-1 capitalize`}>
                {jobOrder.Onsite_Status === 'inprogress' ? 'In Progress' : (jobOrder.Onsite_Status || 'Not set')}
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 pb-4">
              <div className="w-40 text-gray-400 text-sm">Contract Template:</div>
              <div className="text-white flex-1">{jobOrder.Contract_Template || 'Standard'}</div>
            </div>
            
            <div className="flex border-b border-gray-800 pb-4">
              <div className="w-40 text-gray-400 text-sm">Contract Link:</div>
              <div className="text-white flex-1 truncate flex items-center">
                {jobOrder.Contract_Link || 'Not available'}
                {jobOrder.Contract_Link && (
                  <button className="text-gray-400 hover:text-white ml-2">
                    <ExternalLink size={16} />
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 pb-4">
              <div className="w-40 text-gray-400 text-sm">Modified By:</div>
              <div className="text-white flex-1">{jobOrder.Modified_By || 'System'}</div>
            </div>
            
            <div className="flex border-b border-gray-800 pb-4">
              <div className="w-40 text-gray-400 text-sm">Modified Date:</div>
              <div className="text-white flex-1">{formatDate(jobOrder.Modified_Date)}</div>
            </div>
            
            <div className="flex border-b border-gray-800 pb-4">
              <div className="w-40 text-gray-400 text-sm">Assigned Email:</div>
              <div className="text-white flex-1">{jobOrder.Assigned_Email || 'Not assigned'}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm whitespace-nowrap">Setup Image</div>
              <div className="text-white flex-1 flex items-center justify-between min-w-0">
                <span className="truncate mr-2">
                  {jobOrder.setup_image_url || jobOrder.Setup_Image_URL || jobOrder.Setup_Image_Url || 'No image available'}
                </span>
                {(jobOrder.setup_image_url || jobOrder.Setup_Image_URL || jobOrder.Setup_Image_Url) && (
                  <button 
                    className="text-gray-400 hover:text-white flex-shrink-0"
                    onClick={() => window.open(jobOrder.setup_image_url || jobOrder.Setup_Image_URL || jobOrder.Setup_Image_Url || '')}
                  >
                    <ExternalLink size={16} />
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm whitespace-nowrap">Speedtest Image</div>
              <div className="text-white flex-1 flex items-center justify-between min-w-0">
                <span className="truncate mr-2">
                  {jobOrder.speedtest_image_url || jobOrder.Speedtest_Image_URL || jobOrder.speedtest_image || jobOrder.Speedtest_Image || 'No image available'}
                </span>
                {(jobOrder.speedtest_image_url || jobOrder.Speedtest_Image_URL || jobOrder.speedtest_image || jobOrder.Speedtest_Image) && (
                  <button 
                    className="text-gray-400 hover:text-white flex-shrink-0"
                    onClick={() => window.open(jobOrder.speedtest_image_url || jobOrder.Speedtest_Image_URL || jobOrder.speedtest_image || jobOrder.Speedtest_Image || '')}
                  >
                    <ExternalLink size={16} />
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm whitespace-nowrap">Signed Contract Image</div>
              <div className="text-white flex-1 flex items-center justify-between min-w-0">
                <span className="truncate mr-2">
                  {jobOrder.signed_contract_image_url || jobOrder.Signed_Contract_Image_URL || jobOrder.signed_contract_url || jobOrder.Signed_Contract_URL || 'No image available'}
                </span>
                {(jobOrder.signed_contract_image_url || jobOrder.Signed_Contract_Image_URL || jobOrder.signed_contract_url || jobOrder.Signed_Contract_URL) && (
                  <button 
                    className="text-gray-400 hover:text-white flex-shrink-0"
                    onClick={() => window.open(jobOrder.signed_contract_image_url || jobOrder.Signed_Contract_Image_URL || jobOrder.signed_contract_url || jobOrder.Signed_Contract_URL || '')}
                  >
                    <ExternalLink size={16} />
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm whitespace-nowrap">Box Reading Image</div>
              <div className="text-white flex-1 flex items-center justify-between min-w-0">
                <span className="truncate mr-2">
                  {jobOrder.box_reading_image_url || jobOrder.Box_Reading_Image_URL || jobOrder.box_reading_url || jobOrder.Box_Reading_URL || 'No image available'}
                </span>
                {(jobOrder.box_reading_image_url || jobOrder.Box_Reading_Image_URL || jobOrder.box_reading_url || jobOrder.Box_Reading_URL) && (
                  <button 
                    className="text-gray-400 hover:text-white flex-shrink-0"
                    onClick={() => window.open(jobOrder.box_reading_image_url || jobOrder.Box_Reading_Image_URL || jobOrder.box_reading_url || jobOrder.Box_Reading_URL || '')}
                  >
                    <ExternalLink size={16} />
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm whitespace-nowrap">Router Reading Image</div>
              <div className="text-white flex-1 flex items-center justify-between min-w-0">
                <span className="truncate mr-2">
                  {jobOrder.router_reading_image_url || jobOrder.Router_Reading_Image_URL || jobOrder.router_reading_url || jobOrder.Router_Reading_URL || 'No image available'}
                </span>
                {(jobOrder.router_reading_image_url || jobOrder.Router_Reading_Image_URL || jobOrder.router_reading_url || jobOrder.Router_Reading_URL) && (
                  <button 
                    className="text-gray-400 hover:text-white flex-shrink-0"
                    onClick={() => window.open(jobOrder.router_reading_image_url || jobOrder.Router_Reading_Image_URL || jobOrder.router_reading_url || jobOrder.Router_Reading_URL || '')}
                  >
                    <ExternalLink size={16} />
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm whitespace-nowrap">Port Label Image</div>
              <div className="text-white flex-1 flex items-center justify-between min-w-0">
                <span className="truncate mr-2">
                  {jobOrder.port_label_image_url || jobOrder.Port_Label_Image_URL || jobOrder.port_label_url || jobOrder.Port_Label_URL || 'No image available'}
                </span>
                {(jobOrder.port_label_image_url || jobOrder.Port_Label_Image_URL || jobOrder.port_label_url || jobOrder.Port_Label_URL) && (
                  <button 
                    className="text-gray-400 hover:text-white flex-shrink-0"
                    onClick={() => window.open(jobOrder.port_label_image_url || jobOrder.Port_Label_Image_URL || jobOrder.port_label_url || jobOrder.Port_Label_URL || '')}
                  >
                    <ExternalLink size={16} />
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm whitespace-nowrap">House Front Picture</div>
              <div className="text-white flex-1 flex items-center justify-between min-w-0">
                <span className="truncate mr-2">
                  {jobOrder.house_front_picture_url || jobOrder.House_Front_Picture_URL || jobOrder.house_front_picture || jobOrder.House_Front_Picture || 'No image available'}
                </span>
                {(jobOrder.house_front_picture_url || jobOrder.House_Front_Picture_URL || jobOrder.house_front_picture || jobOrder.House_Front_Picture) && (
                  <button 
                    className="text-gray-400 hover:text-white flex-shrink-0"
                    onClick={() => window.open(jobOrder.house_front_picture_url || jobOrder.House_Front_Picture_URL || jobOrder.house_front_picture || jobOrder.House_Front_Picture || '')}
                  >
                    <ExternalLink size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <JobOrderDoneFormModal
        isOpen={isDoneModalOpen}
        onClose={() => setIsDoneModalOpen(false)}
        onSave={handleDoneSave}
        jobOrderData={jobOrder}
      />

      <JobOrderDoneFormTechModal
        isOpen={isDoneTechModalOpen}
        onClose={() => setIsDoneTechModalOpen(false)}
        onSave={handleDoneSave}
        jobOrderData={jobOrder}
      />

      <JobOrderEditFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleEditSave}
        jobOrderData={jobOrder}
      />

      <ApprovalConfirmationModal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        onConfirm={handleApproveConfirm}
        loading={loading}
      />
    </div>
  );
};

export default JobOrderDetails;
