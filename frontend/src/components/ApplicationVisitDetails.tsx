import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, ArrowRight, Maximize2, X, Phone, MessageSquare, Info, 
  ExternalLink, Mail, Edit, Trash2, ArrowRightToLine, Eraser, XOctagon, RotateCw, Menu
} from 'lucide-react';
import { getApplication } from '../services/applicationService';
import { updateApplicationVisit } from '../services/applicationVisitService';
import ConfirmationModal from '../modals/MoveToJoModal';
import JOAssignFormModal from '../modals/JOAssignFormModal';
import ApplicationVisitStatusModal from '../modals/ApplicationVisitStatusModal';
import { JobOrderData } from '../services/jobOrderService';
import { settingsColorPaletteService, ColorPalette } from '../services/settingsColorPaletteService';

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
  isMobile?: boolean;
}

const ApplicationVisitDetails: React.FC<ApplicationVisitDetailsProps> = ({ applicationVisit, onClose, onUpdate, isMobile = false }) => {
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
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [colorPalette, setColorPalette] = useState<ColorPalette | null>(null);

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

  useEffect(() => {
    const checkDarkMode = () => {
      const theme = localStorage.getItem('theme');
      setIsDarkMode(theme === 'dark');
    };
    
    checkDarkMode();
    
    const observer = new MutationObserver(checkDarkMode);
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
    <div 
      className={`h-full flex flex-col overflow-hidden ${!isMobile ? 'md:border-l' : ''} relative w-full md:w-auto ${
        isDarkMode ? 'bg-gray-950 border-white border-opacity-30' : 'bg-gray-50 border-gray-300'
      }`}
      style={!isMobile && window.innerWidth >= 768 ? { width: `${detailsWidth}px` } : undefined}
    >
      {!isMobile && (
        <div
          className={`hidden md:block absolute left-0 top-0 bottom-0 w-1 cursor-col-resize transition-colors z-50 ${
            isDarkMode ? 'hover:bg-orange-500' : 'hover:bg-orange-600'
          }`}
          onMouseDown={handleMouseDownResize}
        />
      )}
      <div className={`p-3 flex items-center justify-between border-b ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center flex-1 min-w-0">
          <h2 className={`font-medium truncate ${isMobile ? 'max-w-[200px] text-sm' : ''} ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>{getFullName()}</h2>
          {loading && <div className={`ml-3 animate-pulse text-sm flex-shrink-0 ${
            isDarkMode ? 'text-orange-500' : 'text-orange-600'
          }`}>Loading...</div>}
        </div>
        
        <div className="flex items-center space-x-3">
          {userRole !== 'technician' && userRole === 'administrator' && (
            <>
              <button className={isDarkMode ? 'hover:text-white text-gray-400' : 'hover:text-gray-900 text-gray-600'}>
                <Trash2 size={16} />
              </button>
              <button 
                className={isDarkMode ? 'hover:text-white text-gray-400' : 'hover:text-gray-900 text-gray-600'}
                onClick={handleMoveToJO}
                title="Move to Job Order"
              >
                <ArrowRightToLine size={16} />
              </button>
            </>
          )}
          <button 
            className="text-white px-3 py-1 rounded-sm flex items-center transition-colors"
            style={{
              backgroundColor: colorPalette?.primary || '#ea580c'
            }}
            onMouseEnter={(e) => {
              if (colorPalette?.accent) {
                e.currentTarget.style.backgroundColor = colorPalette.accent;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colorPalette?.primary || '#ea580c';
            }}
            onClick={handleEditVisit}
            title="Edit Visit Details"
          >
            <Edit size={16} className="mr-1" />
            <span className="hidden md:inline">Visit Status</span>
          </button>
          <button className={isDarkMode ? 'hover:text-white text-gray-400' : 'hover:text-gray-900 text-gray-600'}><ArrowLeft size={16} /></button>
          <button className={isDarkMode ? 'hover:text-white text-gray-400' : 'hover:text-gray-900 text-gray-600'}><ArrowRight size={16} /></button>
          <button className={isDarkMode ? 'hover:text-white text-gray-400' : 'hover:text-gray-900 text-gray-600'}><Maximize2 size={16} /></button>
          <button 
            onClick={onClose}
            className={isDarkMode ? 'hover:text-white text-gray-400' : 'hover:text-gray-900 text-gray-600'}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>
      
      {userRole !== 'technician' && userRole === 'administrator' && (
        <div className={`py-3 border-b ${
          isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-100 border-gray-200'
        }`}>
          <div className="flex items-center justify-center px-4 space-x-4 md:space-x-8">
            <button 
              className="flex flex-col items-center text-center p-2 rounded-md transition-colors"
              style={{
                backgroundColor: isDarkMode ? 'transparent' : 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDarkMode ? '#1f2937' : '#e5e7eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              onClick={() => handleStatusUpdate(null)}
              disabled={loading}
              title="Clear status and reset to default"
            >
              <div 
                className="p-2 rounded-full transition-colors"
                style={{
                  backgroundColor: loading ? (isDarkMode ? '#4b5563' : '#9ca3af') : (colorPalette?.primary || '#ea580c')
                }}
                onMouseEnter={(e) => {
                  if (!loading && colorPalette?.accent) {
                    e.currentTarget.style.backgroundColor = colorPalette.accent;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = colorPalette?.primary || '#ea580c';
                  }
                }}
              >
                <Eraser className="text-white" size={18} />
              </div>
              <span className={`text-xs mt-1 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>Clear Status</span>
            </button>
            
            <button 
              className="flex flex-col items-center text-center p-2 rounded-md hover:bg-gray-800 transition-colors"
              onClick={() => handleStatusUpdate('Failed')}
              disabled={loading}
              title="Mark visit as failed"
            >
              <div 
                className="p-2 rounded-full transition-colors"
                style={{
                  backgroundColor: loading ? '#4b5563' : (colorPalette?.primary || '#ea580c')
                }}
                onMouseEnter={(e) => {
                  if (!loading && colorPalette?.accent) {
                    e.currentTarget.style.backgroundColor = colorPalette.accent;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = colorPalette?.primary || '#ea580c';
                  }
                }}
              >
                <XOctagon className="text-white" size={18} />
              </div>
              <span className={`text-xs mt-1 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>Failed</span>
            </button>
            
            <button 
              className="flex flex-col items-center text-center p-2 rounded-md hover:bg-gray-800 transition-colors"
              onClick={() => handleStatusUpdate('In Progress')}
              disabled={loading}
              title="Mark visit as in progress"
            >
              <div 
                className="p-2 rounded-full transition-colors"
                style={{
                  backgroundColor: loading ? '#4b5563' : (colorPalette?.primary || '#ea580c')
                }}
                onMouseEnter={(e) => {
                  if (!loading && colorPalette?.accent) {
                    e.currentTarget.style.backgroundColor = colorPalette.accent;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = colorPalette?.primary || '#ea580c';
                  }
                }}
              >
                <RotateCw className="text-white" size={18} />
              </div>
              <span className={`text-xs mt-1 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>Visit In Progress</span>
            </button>
          </div>
        </div>
      )}
      
      {error && (
        <div className={`p-3 m-3 rounded ${
          isDarkMode 
            ? 'bg-red-900 bg-opacity-20 border border-red-700 text-red-400'
            : 'bg-red-100 border border-red-300 text-red-700'
        }`}>
          {error}
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto">
        <div className={`max-w-2xl mx-auto py-6 px-4 ${
          isDarkMode ? 'bg-gray-950' : 'bg-gray-50'
        }`}>
          <div className="space-y-4">
            <div className={`flex border-b pb-4 ${
              isDarkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <div className={`w-40 text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Timestamp:</div>
              <div className={`flex-1 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>{formatDate(currentVisitData.created_at) || 'Not available'}</div>
            </div>
            
            <div className={`flex border-b pb-4 ${
              isDarkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <div className={`w-40 text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Referred By:</div>
              <div className={`flex-1 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>{currentVisitData.referred_by || 'Not specified'}</div>
            </div>
            
            <div className={`flex border-b pb-4 ${
              isDarkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <div className={`w-40 text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Full Name:</div>
              <div className={`flex-1 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>{getFullName()}</div>
            </div>
            
            <div className={`flex border-b pb-4 ${
              isDarkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <div className={`w-40 text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Contact Number:</div>
              <div className={`flex-1 flex items-center ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {applicationDetails?.mobile_number || 'Not provided'}
                {applicationDetails?.mobile_number && (
                  <>
                    <button className={isDarkMode ? 'text-gray-400 hover:text-white ml-2' : 'text-gray-600 hover:text-gray-900 ml-2'}>
                      <Phone size={16} />
                    </button>
                    <button className={isDarkMode ? 'text-gray-400 hover:text-white ml-2' : 'text-gray-600 hover:text-gray-900 ml-2'}>
                      <MessageSquare size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div className={`flex border-b pb-4 ${
              isDarkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <div className={`w-40 text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Second Contact Number:</div>
              <div className={`flex-1 flex items-center ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {applicationDetails?.secondary_mobile_number || 'Not provided'}
                {applicationDetails?.secondary_mobile_number && (
                  <>
                    <button className={isDarkMode ? 'text-gray-400 hover:text-white ml-2' : 'text-gray-600 hover:text-gray-900 ml-2'}>
                      <Phone size={16} />
                    </button>
                    <button className={isDarkMode ? 'text-gray-400 hover:text-white ml-2' : 'text-gray-600 hover:text-gray-900 ml-2'}>
                      <MessageSquare size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div className={`flex border-b pb-4 ${
              isDarkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <div className={`w-40 text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Email Address:</div>
              <div className={`flex-1 flex items-center ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {applicationDetails?.email_address || 'Not provided'}
                {applicationDetails?.email_address && (
                  <button className={isDarkMode ? 'text-gray-400 hover:text-white ml-2' : 'text-gray-600 hover:text-gray-900 ml-2'}>
                    <Mail size={16} />
                  </button>
                )}
              </div>
            </div>
            
            <div className={`flex border-b pb-4 ${
              isDarkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <div className={`w-40 text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Address:</div>
              <div className={`flex-1 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>{currentVisitData.full_address || 'Not provided'}</div>
            </div>
            
            <div className={`flex border-b pb-4 ${
              isDarkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <div className={`w-40 text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Chosen Plan:</div>
              <div className={`flex-1 flex items-center ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {applicationDetails?.desired_plan || 'Not specified'}
                {applicationDetails?.desired_plan && (
                  <button className={isDarkMode ? 'text-gray-400 hover:text-white ml-2' : 'text-gray-600 hover:text-gray-900 ml-2'}>
                    <Info size={16} />
                  </button>
                )}
              </div>
            </div>
            
            <div className={`flex border-b pb-4 ${
              isDarkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <div className={`w-40 text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Landmark:</div>
              <div className={`flex-1 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>{applicationDetails?.landmark || 'Not provided'}</div>
            </div>
            
            <div className={`flex border-b pb-4 ${
              isDarkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <div className={`w-40 text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Visit By:</div>
              <div className={`flex-1 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>{currentVisitData.visit_by || 'Not assigned'}</div>
            </div>
            
            <div className={`flex border-b pb-4 ${
              isDarkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <div className={`w-40 text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Visit With:</div>
              <div className={`flex-1 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {currentVisitData.visit_with || 'None'}
              </div>
            </div>
            
            <div className={`flex border-b pb-4 ${
              isDarkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <div className={`w-40 text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Visit With (Other):</div>
              <div className={`flex-1 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {currentVisitData.visit_with_other || 'None'}
              </div>
            </div>
            
            <div className={`flex border-b pb-4 ${
              isDarkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <div className={`w-40 text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Visit Type:</div>
              <div className={`flex-1 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Initial Visit</div>
            </div>
            
            <div className={`flex border-b pb-4 ${
              isDarkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <div className={`w-40 text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Visit Status:</div>
              <div className={`flex-1 capitalize ${
                currentVisitData.visit_status?.toLowerCase() === 'completed' ? 'text-green-500' :
                currentVisitData.visit_status?.toLowerCase() === 'failed' ? 'text-red-500' :
                currentVisitData.visit_status?.toLowerCase() === 'in progress' ? 'text-blue-500' :
                'text-orange-500'
              }`}>
                {currentVisitData.visit_status || 'Scheduled'}
              </div>
            </div>
            
            <div className={`flex border-b pb-4 ${
              isDarkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <div className={`w-40 text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Visit Notes:</div>
              <div className={`flex-1 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>{currentVisitData.visit_remarks || 'No notes'}</div>
            </div>
            
            <div className={`flex border-b pb-4 ${
              isDarkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <div className={`w-40 text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Assigned Email:</div>
              <div className={`flex-1 flex items-center ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {currentVisitData.assigned_email || 'Not assigned'}
                {currentVisitData.assigned_email && (
                  <button className={isDarkMode ? 'text-gray-400 hover:text-white ml-2' : 'text-gray-600 hover:text-gray-900 ml-2'}>
                    <Mail size={16} />
                  </button>
                )}
              </div>
            </div>
            
            <div className={`flex border-b pb-4 ${
              isDarkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <div className={`w-40 text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Application Status:</div>
              <div className={`flex-1 capitalize ${
                currentVisitData.application_status?.toLowerCase() === 'approved' ? 'text-green-500' : 'text-yellow-500'
              }`}>
                {currentVisitData.application_status || applicationDetails?.status || 'Pending'}
              </div>
            </div>
            
            <div className={`flex border-b pb-4 ${
              isDarkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <div className={`w-40 text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Modified By:</div>
              <div className={`flex-1 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>{currentVisitData.updated_by_user_email || 'System'}</div>
            </div>
            
            <div className={`flex border-b pb-4 ${
              isDarkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <div className={`w-40 text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Modified Date:</div>
              <div className={`flex-1 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {formatDate(currentVisitData.updated_at) || 'Not modified'}
              </div>
            </div>
            
            <div className={`flex border-b py-2 ${
              isDarkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <div className={`w-40 text-sm whitespace-nowrap ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>House Front Picture</div>
              <div className={`flex-1 flex items-center justify-between min-w-0 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <span className="truncate mr-2">
                  {currentVisitData.house_front_picture_url || 'No image available'}
                </span>
                {currentVisitData.house_front_picture_url && (
                  <button 
                    className={`flex-shrink-0 ${
                      isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => window.open(currentVisitData.house_front_picture_url)}
                  >
                    <ExternalLink size={16} />
                  </button>
                )}
              </div>
            </div>
            
            <div className={`flex border-b py-2 ${
              isDarkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <div className={`w-40 text-sm whitespace-nowrap ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Image 1</div>
              <div className={`flex-1 flex items-center justify-between min-w-0 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <span className="truncate mr-2">
                  {currentVisitData.image1_url || 'No image available'}
                </span>
                {currentVisitData.image1_url && (
                  <button 
                    className={`flex-shrink-0 ${
                      isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => window.open(currentVisitData.image1_url)}
                  >
                    <ExternalLink size={16} />
                  </button>
                )}
              </div>
            </div>
            
            <div className={`flex border-b py-2 ${
              isDarkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <div className={`w-40 text-sm whitespace-nowrap ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Image 2</div>
              <div className={`flex-1 flex items-center justify-between min-w-0 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <span className="truncate mr-2">
                  {currentVisitData.image2_url || 'No image available'}
                </span>
                {currentVisitData.image2_url && (
                  <button 
                    className={`flex-shrink-0 ${
                      isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => window.open(currentVisitData.image2_url)}
                  >
                    <ExternalLink size={16} />
                  </button>
                )}
              </div>
            </div>
            
            <div className={`flex border-b py-2 ${
              isDarkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <div className={`w-40 text-sm whitespace-nowrap ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Image 3</div>
              <div className={`flex-1 flex items-center justify-between min-w-0 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <span className="truncate mr-2">
                  {currentVisitData.image3_url || 'No image available'}
                </span>
                {currentVisitData.image3_url && (
                  <button 
                    className={`flex-shrink-0 ${
                      isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
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
