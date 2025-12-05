import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, ArrowRight, Maximize2, X, Phone, MessageSquare, Info, 
  ExternalLink, Mail, Edit, Trash2, ArrowRightToLine, Eraser, XOctagon, RotateCw
} from 'lucide-react';
import { getApplication } from '../services/applicationService';
import { updateApplicationVisit } from '../services/applicationVisitService';
import ConfirmationModal from '../modals/MoveToJoModal';
import JOAssignFormModal from '../modals/JOAssignFormModal';
import ApplicationVisitStatusModal from '../modals/ApplicationVisitStatusModal';
import { JobOrderData } from '../services/jobOrderService';

interface ApplicationVisitDetailsProps {
  applicationVisit: {
    id: string;
    application_id: string;
    timestamp?: string;
    assigned_email?: string;
    visit_by?: string;
    visit_with?: string;
    visit_with_other?: string;
    visit_status?: string;
    visit_remarks?: string;
    status_remarks?: string;
    application_status?: string;
    full_name: string;
    full_address: string;
    referred_by?: string;
    updated_by_user_email: string;
    created_at?: string;
    updated_at?: string;
    first_name?: string;
    middle_initial?: string;
    last_name?: string;
    house_front_picture_url?: string;
    image1_url?: string;
    image2_url?: string;
    image3_url?: string;
    [key: string]: any;
  };
  onClose: () => void;
  onUpdate?: () => void;
}

const ApplicationVisitDetails: React.FC<ApplicationVisitDetailsProps> = ({ applicationVisit, onClose, onUpdate }) => {
  const [applicationDetails, setApplicationDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMoveConfirmation, setShowMoveConfirmation] = useState(false);
  const [showJOAssignForm, setShowJOAssignForm] = useState(false);
  const [showEditStatusModal, setShowEditStatusModal] = useState(false);
  const [currentVisitData, setCurrentVisitData] = useState(applicationVisit);
  const [userRole, setUserRole] = useState<string>('');
  const [detailsWidth, setDetailsWidth] = useState<number>(600);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  useEffect(() => {
    const authData = localStorage.getItem('authData');
    if (authData) {
      try {
        const user = JSON.parse(authData);
        setUserRole(user.role?.toLowerCase() || '');
      } catch (error) {
        // Error parsing user data
      }
    }
  }, []);

  useEffect(() => {
    setCurrentVisitData(applicationVisit);
  }, [applicationVisit]);

  useEffect(() => {
    const fetchApplicationData = async () => {
      if (!applicationVisit.application_id) return;
      
      try {
        setLoading(true);
        const appData = await getApplication(applicationVisit.application_id);
        setApplicationDetails(appData);
      } catch (err: any) {
        setError(`Failed to load application data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchApplicationData();
  }, [applicationVisit.application_id]);

  const handleMoveToJO = () => {
    setShowMoveConfirmation(true);
  };

  const handleConfirmMoveToJO = () => {
    setShowMoveConfirmation(false);
    setShowJOAssignForm(true);
  };

  const handleSaveJOForm = (formData: JobOrderData) => {
    setShowJOAssignForm(false);
    if (onUpdate) {
      onUpdate();
    }
  };

  const handleEditVisit = () => {
    setShowEditStatusModal(true);
  };

  const handleSaveEditedVisit = (updatedVisit: any) => {
    setCurrentVisitData({ ...currentVisitData, ...updatedVisit });
    setShowEditStatusModal(false);
    if (onUpdate) {
      onUpdate();
    }
  };

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

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'Not scheduled';
    try {
      return new Date(dateStr).toLocaleString();
    } catch (e) {
      return dateStr;
    }
  };

  const getFullName = () => {
    return currentVisitData.full_name || `${currentVisitData.first_name || ''} ${currentVisitData.middle_initial || ''} ${currentVisitData.last_name || ''}`.trim();
  };

  const handleStatusUpdate = async (newStatus: string | null) => {
    try {
      setLoading(true);
      setError(null);
      
      const authData = localStorage.getItem('authData');
      let updatedByEmail = null;
      
      if (authData) {
        try {
          const user = JSON.parse(authData);
          updatedByEmail = user.email;
        } catch (error) {
          // Error parsing auth data
        }
      }
      
      await updateApplicationVisit(applicationVisit.id, { 
        visit_status: newStatus,
        updated_by_user_email: updatedByEmail
      });
      
      setCurrentVisitData({ ...currentVisitData, visit_status: newStatus || '' });
      
      const statusMessage = newStatus ? `Status updated to ${newStatus}` : 'Status cleared successfully';
      alert(statusMessage);
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Unknown error occurred';
      setError(`Failed to update status: ${errorMessage}`);
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
          <h2 className="text-white font-medium">{getFullName()}</h2>
          {loading && <div className="ml-3 animate-pulse text-orange-500 text-sm">Loading...</div>}
        </div>
        
        <div className="flex items-center space-x-3">
          {userRole !== 'technician' && userRole === 'administrator' && (
            <>
              <button className="hover:text-white text-gray-400">
                <Trash2 size={16} />
              </button>
              <button 
                className="hover:text-white text-gray-400"
                onClick={handleMoveToJO}
                title="Move to Job Order"
              >
                <ArrowRightToLine size={16} />
              </button>
            </>
          )}
          <button 
            className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded-sm flex items-center"
            onClick={handleEditVisit}
            title="Edit Visit Details"
          >
            <Edit size={16} className="mr-1" />
            <span>Visit Status</span>
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
      
      {userRole !== 'technician' && userRole === 'administrator' && (
        <div className="bg-gray-900 py-4 border-b border-gray-700 flex items-center justify-center space-x-8">
          <button 
            className="flex flex-col items-center text-center hover:opacity-80 transition-opacity"
            onClick={() => handleStatusUpdate(null)}
            disabled={loading}
            title="Clear status and reset to default"
          >
            <div className={`p-3 rounded-full ${loading ? 'bg-gray-600' : 'bg-orange-600 hover:bg-orange-700'}`}>
              <Eraser className="text-white" size={24} />
            </div>
            <span className="text-xs mt-1 text-gray-300">Clear Status</span>
          </button>
          
          <button 
            className="flex flex-col items-center text-center hover:opacity-80 transition-opacity"
            onClick={() => handleStatusUpdate('Failed')}
            disabled={loading}
            title="Mark visit as failed"
          >
            <div className={`p-3 rounded-full ${loading ? 'bg-gray-600' : 'bg-orange-600 hover:bg-orange-700'}`}>
              <XOctagon className="text-white" size={24} />
            </div>
            <span className="text-xs mt-1 text-gray-300">Failed</span>
          </button>
          
          <button 
            className="flex flex-col items-center text-center hover:opacity-80 transition-opacity"
            onClick={() => handleStatusUpdate('In Progress')}
            disabled={loading}
            title="Mark visit as in progress"
          >
            <div className={`p-3 rounded-full ${loading ? 'bg-gray-600' : 'bg-orange-600 hover:bg-orange-700'}`}>
              <RotateCw className="text-white" size={24} />
            </div>
            <span className="text-xs mt-1 text-gray-300">Visit In Progress</span>
          </button>
        </div>
      )}
      
      {error && (
        <div className="bg-red-900 bg-opacity-20 border border-red-700 text-red-400 p-3 m-3 rounded">
          {error}
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto py-1 px-4 bg-gray-950">
          <div className="space-y-1">
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Timestamp</div>
              <div className="text-white flex-1">{formatDate(currentVisitData.created_at) || 'Not available'}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Referred By</div>
              <div className="text-white flex-1">{currentVisitData.referred_by || 'Not specified'}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Full Name</div>
              <div className="text-white flex-1">{getFullName()}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Contact Number</div>
              <div className="text-white flex-1 flex items-center justify-between">
                <span>{applicationDetails?.mobile_number || 'Not provided'}</span>
                <div className="flex items-center space-x-2">
                  <button className="text-gray-400 hover:text-white">
                    <Phone size={16} />
                  </button>
                  <button className="text-gray-400 hover:text-white">
                    <MessageSquare size={16} />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Second Contact Number</div>
              <div className="text-white flex-1 flex items-center justify-between">
                <span>{applicationDetails?.secondary_mobile_number || 'Not provided'}</span>
                {applicationDetails?.secondary_mobile_number && (
                  <div className="flex items-center space-x-2">
                    <button className="text-gray-400 hover:text-white">
                      <Phone size={16} />
                    </button>
                    <button className="text-gray-400 hover:text-white">
                      <MessageSquare size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Email Address</div>
              <div className="text-white flex-1 flex items-center justify-between">
                <span>{applicationDetails?.email_address || 'Not provided'}</span>
                <button className="text-gray-400 hover:text-white">
                  <Mail size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Address</div>
              <div className="text-white flex-1">{currentVisitData.full_address || 'Not provided'}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Chosen Plan</div>
              <div className="text-white flex-1 flex items-center justify-between">
                <span>{applicationDetails?.desired_plan || 'Not specified'}</span>
                <button className="text-gray-400 hover:text-white">
                  <Info size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Landmark</div>
              <div className="text-white flex-1">{applicationDetails?.landmark || 'Not provided'}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Visit By</div>
              <div className="text-white flex-1">{currentVisitData.visit_by || 'Not assigned'}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Visit With</div>
              <div className="text-white flex-1">
                {currentVisitData.visit_with || 'None'}
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Visit With (Other)</div>
              <div className="text-white flex-1">
                {currentVisitData.visit_with_other || 'None'}
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Visit Type</div>
              <div className="text-white flex-1">Initial Visit</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Visit Status</div>
              <div className={`flex-1 ${
                currentVisitData.visit_status?.toLowerCase() === 'completed' ? 'text-green-500' :
                currentVisitData.visit_status?.toLowerCase() === 'failed' ? 'text-red-500' :
                currentVisitData.visit_status?.toLowerCase() === 'in progress' ? 'text-blue-500' :
                'text-orange-500'
              }`}>
                {currentVisitData.visit_status || 'Scheduled'}
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Visit Notes</div>
              <div className="text-white flex-1">{currentVisitData.visit_remarks || 'No notes'}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Assigned Email</div>
              <div className="text-white flex-1 flex items-center justify-between">
                <span>{currentVisitData.assigned_email || 'Not assigned'}</span>
                {currentVisitData.assigned_email && (
                  <button className="text-gray-400 hover:text-white">
                    <Mail size={16} />
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Application Status</div>
              <div className={`text-${currentVisitData.application_status?.toLowerCase() === 'approved' ? 'green' : 'yellow'}-500 flex-1`}>
                {currentVisitData.application_status || applicationDetails?.status || 'Pending'}
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Modified By</div>
              <div className="text-white flex-1">{currentVisitData.updated_by_user_email || 'System'}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Modified Date</div>
              <div className="text-white flex-1">
                {formatDate(currentVisitData.updated_at) || 'Not modified'}
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm whitespace-nowrap">House Front Picture</div>
              <div className="text-white flex-1 flex items-center justify-between min-w-0">
                <span className="truncate mr-2">
                  {currentVisitData.house_front_picture_url || 'No image available'}
                </span>
                {currentVisitData.house_front_picture_url && (
                  <button 
                    className="text-gray-400 hover:text-white flex-shrink-0"
                    onClick={() => window.open(currentVisitData.house_front_picture_url)}
                  >
                    <ExternalLink size={16} />
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm whitespace-nowrap">Image 1</div>
              <div className="text-white flex-1 flex items-center justify-between min-w-0">
                <span className="truncate mr-2">
                  {currentVisitData.image1_url || 'No image available'}
                </span>
                {currentVisitData.image1_url && (
                  <button 
                    className="text-gray-400 hover:text-white flex-shrink-0"
                    onClick={() => window.open(currentVisitData.image1_url)}
                  >
                    <ExternalLink size={16} />
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm whitespace-nowrap">Image 2</div>
              <div className="text-white flex-1 flex items-center justify-between min-w-0">
                <span className="truncate mr-2">
                  {currentVisitData.image2_url || 'No image available'}
                </span>
                {currentVisitData.image2_url && (
                  <button 
                    className="text-gray-400 hover:text-white flex-shrink-0"
                    onClick={() => window.open(currentVisitData.image2_url)}
                  >
                    <ExternalLink size={16} />
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm whitespace-nowrap">Image 3</div>
              <div className="text-white flex-1 flex items-center justify-between min-w-0">
                <span className="truncate mr-2">
                  {currentVisitData.image3_url || 'No image available'}
                </span>
                {currentVisitData.image3_url && (
                  <button 
                    className="text-gray-400 hover:text-white flex-shrink-0"
                    onClick={() => window.open(currentVisitData.image3_url)}
                  >
                    <ExternalLink size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showMoveConfirmation}
        title="Confirm"
        message="Are you sure you want to move this application to JO?"
        confirmText="Move to JO"
        cancelText="Cancel"
        onConfirm={handleConfirmMoveToJO}
        onCancel={() => setShowMoveConfirmation(false)}
      />

      <JOAssignFormModal
        isOpen={showJOAssignForm}
        onClose={() => setShowJOAssignForm(false)}
        onSave={handleSaveJOForm}
        applicationData={{
          id: currentVisitData.application_id,
          referred_by: applicationDetails?.referred_by || currentVisitData.referred_by,
          first_name: applicationDetails?.first_name || currentVisitData.first_name,
          middle_initial: applicationDetails?.middle_initial || currentVisitData.middle_initial,
          last_name: applicationDetails?.last_name || currentVisitData.last_name,
          email_address: applicationDetails?.email_address,
          mobile_number: applicationDetails?.mobile_number,
          secondary_mobile_number: applicationDetails?.secondary_mobile_number,
          installation_address: applicationDetails?.installation_address || currentVisitData.full_address?.split(',')[0]?.trim() || '',
          barangay: applicationDetails?.barangay,
          city: applicationDetails?.city,
          region: applicationDetails?.region,
          location: applicationDetails?.location,
          desired_plan: applicationDetails?.desired_plan,
          landmark: applicationDetails?.landmark,
          house_front_picture_url: currentVisitData.house_front_picture_url || applicationDetails?.house_front_picture_url,
        }}
      />

      <ApplicationVisitStatusModal
        isOpen={showEditStatusModal}
        onClose={() => setShowEditStatusModal(false)}
        onSave={handleSaveEditedVisit}
        visitData={{
          id: currentVisitData.id,
          first_name: applicationDetails?.first_name || currentVisitData.first_name || '',
          middle_initial: applicationDetails?.middle_initial || currentVisitData.middle_initial || '',
          last_name: applicationDetails?.last_name || currentVisitData.last_name || '',
          contact_number: applicationDetails?.mobile_number || '',
          second_contact_number: applicationDetails?.secondary_mobile_number || '',
          email_address: applicationDetails?.email_address || '',
          address: currentVisitData.full_address || '',
          barangay: applicationDetails?.barangay || '',
          city: applicationDetails?.city || '',
          region: applicationDetails?.region || '',
          location: applicationDetails?.location || '',
          choose_plan: applicationDetails?.desired_plan || '',
          visit_remarks: currentVisitData.visit_remarks || '',
          status_remarks: currentVisitData.status_remarks || '',
          visit_notes: currentVisitData.visit_remarks || '',
          assigned_email: currentVisitData.assigned_email || '',
          visit_by: currentVisitData.visit_by || '',
          visit_with: currentVisitData.visit_with || '',
          visit_with_other: currentVisitData.visit_with_other || '',
          application_status: currentVisitData.application_status || '',
          visit_status: currentVisitData.visit_status || '',
          image1_url: currentVisitData.image1_url || '',
          image2_url: currentVisitData.image2_url || '',
          image3_url: currentVisitData.image3_url || ''
        }}
      />
    </div>
  );
};

export default ApplicationVisitDetails;
