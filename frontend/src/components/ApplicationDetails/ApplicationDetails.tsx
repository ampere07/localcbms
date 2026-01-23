import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, ArrowRight, Maximize2, X, Phone, MessageSquare, Info, 
  ExternalLink, Mail, Edit, Newspaper, ArrowRightFromLine, Calendar, 
  Ban, XCircle, RotateCw, CheckCircle, Loader, Square
} from 'lucide-react';
import { getApplication, updateApplication } from '../../services/applicationService';
import ConfirmationModal from '../../modals/MoveToJoModal';
import JOAssignFormModal from '../../modals/JOAssignFormModal';
import ApplicationVisitFormModal from '../../modals/ApplicationVisitFormModal';
import { JobOrderData } from '../../services/jobOrderService';
import { ApplicationVisitData, getApplicationVisits } from '../../services/applicationVisitService';
import { settingsColorPaletteService, ColorPalette } from '../../services/settingsColorPaletteService';

interface ApplicationDetailsProps {
  application: {
    id: string;
    customerName: string;
    timestamp: string;
    address: string;
    location: string;
    city?: string;
    region?: string;
    barangay?: string;
    email_address?: string;
    mobile_number?: string;
  };
  onClose: () => void;
  onApplicationUpdate?: () => void;
}

const ApplicationDetails: React.FC<ApplicationDetailsProps> = ({ application, onClose, onApplicationUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailedApplication, setDetailedApplication] = useState<any>(null);
  const [showMoveConfirmation, setShowMoveConfirmation] = useState(false);
  const [showJOAssignForm, setShowJOAssignForm] = useState(false);
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [showStatusConfirmation, setShowStatusConfirmation] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string>('');
  const [showVisitExistsConfirmation, setShowVisitExistsConfirmation] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [detailsWidth, setDetailsWidth] = useState<number>(600);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [colorPalette, setColorPalette] = useState<ColorPalette | null>(null);

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

  const handleMoveToJO = () => {
    setShowMoveConfirmation(true);
  };

  const handleConfirmMoveToJO = () => {
    setShowMoveConfirmation(false);
    setShowJOAssignForm(true);
  };

  const handleScheduleVisit = async () => {
    try {
      setLoading(true);
      
      const existingVisitsResponse = await getApplicationVisits(application.id);
      
      if (existingVisitsResponse.success && existingVisitsResponse.data && existingVisitsResponse.data.length > 0) {
        setShowVisitExistsConfirmation(true);
      } else {
        setShowVisitForm(true);
      }
    } catch (error) {
      console.error('Error checking existing visits:', error);
      setShowVisitForm(true);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCreateNewVisit = () => {
    setShowVisitExistsConfirmation(false);
    setShowVisitForm(true);
  };

  const handleCancelCreateNewVisit = () => {
    setShowVisitExistsConfirmation(false);
  };

  const handleStatusChange = (newStatus: string) => {
    setPendingStatus(newStatus);
    setShowStatusConfirmation(true);
  };

  const handleConfirmStatusChange = async () => {
    try {
      setLoading(true);
      
      await updateApplication(application.id, { status: pendingStatus });
      
      const updatedApplication = await getApplication(application.id);
      setDetailedApplication(updatedApplication);
      
      setShowStatusConfirmation(false);
      setPendingStatus('');
      
      if (onApplicationUpdate) {
        onApplicationUpdate();
      }
      
      setSuccessMessage(`Status updated to ${pendingStatus}`);
      setShowSuccessModal(true);
    } catch (err: any) {
      setError(`Failed to update status: ${err.message}`);
      console.error('Status update error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelStatusChange = () => {
    setShowStatusConfirmation(false);
    setPendingStatus('');
  };

  const handleSaveJOForm = (formData: JobOrderData) => {
    setShowJOAssignForm(false);
  };

  const handleSaveVisitForm = (formData: ApplicationVisitData) => {
    setShowVisitForm(false);
    
    if (onApplicationUpdate) {
      onApplicationUpdate();
    }
  };

  useEffect(() => {
    const fetchApplicationDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await getApplication(application.id);
        setDetailedApplication(result);
      } catch (err: any) {
        console.error('Error fetching application details:', err);
        setError(err.message || 'Failed to load application details');
      } finally {
        setLoading(false);
      }
    };

    fetchApplicationDetails();
  }, [application.id]);

  const getClientFullName = (): string => {
    return [
      detailedApplication?.first_name || '',
      detailedApplication?.middle_initial ? detailedApplication.middle_initial + '.' : '',
      detailedApplication?.last_name || ''
    ].filter(Boolean).join(' ').trim() || application.customerName || 'Unknown Client';
  };

  const getClientFullAddress = (): string => {
    const addressParts = [
      detailedApplication?.installation_address || application.address,
      detailedApplication?.location || application.location,
      detailedApplication?.barangay || application.barangay,
      detailedApplication?.city || application.city,
      detailedApplication?.region || application.region
    ].filter(Boolean);
    
    return addressParts.length > 0 ? addressParts.join(', ') : 'No address provided';
  };

  const formatDate = (dateStr?: string | null): string => {
    if (!dateStr) return 'Not provided';
    try {
      return new Date(dateStr).toLocaleString();
    } catch (e) {
      return dateStr;
    }
  };

  const getStatusColor = (status?: string | null): string => {
    if (!status) return 'text-gray-400';
    
    switch (status.toLowerCase()) {
      case 'approved':
      case 'in progress':
        return 'text-green-500';
      case 'pending':
        return 'text-yellow-500';
      case 'cancelled':
      case 'no facility':
        return 'text-red-500';
      case 'no slot':
        return 'text-blue-500';
      default:
        return 'text-gray-400';
    }
  };
  
  return (
    <div className={`h-full flex flex-col overflow-hidden border-l relative ${
      isDarkMode ? 'bg-gray-950 border-white border-opacity-30' : 'bg-gray-50 border-gray-300'
    }`} style={{ width: `${detailsWidth}px` }}>
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 cursor-col-resize transition-colors z-50 ${
          isDarkMode ? 'hover:bg-orange-500' : 'hover:bg-orange-600'
        }`}
        onMouseDown={handleMouseDownResize}
      />
      
      <div className={`p-3 flex items-center justify-between border-b ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center">
          <h2 className={isDarkMode ? 'text-white font-medium' : 'text-gray-900 font-medium'}>{getClientFullName()}</h2>
          {loading && <div className={`ml-3 animate-pulse text-sm ${
            isDarkMode ? 'text-orange-500' : 'text-orange-600'
          }`}>Loading...</div>}
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            className="px-3 py-1 rounded-sm flex items-center text-white"
            style={{
              backgroundColor: colorPalette?.primary || '#ea580c'
            }}
            onMouseEnter={(e) => {
              if (colorPalette?.accent) {
                e.currentTarget.style.backgroundColor = colorPalette.accent;
              }
            }}
            onMouseLeave={(e) => {
              if (colorPalette?.primary) {
                e.currentTarget.style.backgroundColor = colorPalette.primary;
              }
            }}
            onClick={handleMoveToJO}
            disabled={loading}
          >
            <span>Move To JO</span>
          </button>

          
          <button 
            className="px-3 py-1 rounded-sm flex items-center text-white"
            style={{
              backgroundColor: colorPalette?.primary || '#ea580c'
            }}
            onMouseEnter={(e) => {
              if (colorPalette?.accent) {
                e.currentTarget.style.backgroundColor = colorPalette.accent;
              }
            }}
            onMouseLeave={(e) => {
              if (colorPalette?.primary) {
                e.currentTarget.style.backgroundColor = colorPalette.primary;
              }
            }}
            onClick={handleScheduleVisit}
            disabled={loading}
          >
            <span>Schedule</span>
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
      
      <div className={`py-3 border-b flex items-center justify-center px-4 ${
        isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-100 border-gray-200'
      }`}>
        <button 
          className={`flex flex-col items-center text-center p-2 rounded-md transition-colors ${
            isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
          }`}
          onClick={() => handleStatusChange('No Facility')}
          disabled={loading}
        >
          <div 
            className="p-2 rounded-full"
            style={{
              backgroundColor: colorPalette?.primary || '#ea580c'
            }}
          >
            <div className="text-white">
              <Ban size={18} />
            </div>
          </div>
          <span className={`text-xs mt-1 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>No Facility</span>
        </button>
        
        <button 
          className={`flex flex-col items-center text-center p-2 rounded-md transition-colors ${
            isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
          }`}
          onClick={() => handleStatusChange('Cancelled')}
          disabled={loading}
        >
          <div 
            className="p-2 rounded-full"
            style={{
              backgroundColor: colorPalette?.primary || '#ea580c'
            }}
          >
            <div className="text-white">
              <XCircle size={18} />
            </div>
          </div>
          <span className={`text-xs mt-1 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>Cancelled</span>
        </button>
        
        <button 
          className={`flex flex-col items-center text-center p-2 rounded-md transition-colors ${
            isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
          }`}
          onClick={() => handleStatusChange('No Slot')}
          disabled={loading}
        >
          <div 
            className="p-2 rounded-full"
            style={{
              backgroundColor: colorPalette?.primary || '#ea580c'
            }}
          >
            <div className="text-white">
              <RotateCw size={18} />
            </div>
          </div>
          <span className={`text-xs mt-1 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>No Slot</span>
        </button>
        
        <button 
          className={`flex flex-col items-center text-center p-2 rounded-md transition-colors ${
            isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
          }`}
          onClick={() => handleStatusChange('Duplicate')}
          disabled={loading}
        >
          <div 
            className="p-2 rounded-full"
            style={{
              backgroundColor: colorPalette?.primary || '#ea580c'
            }}
          >
            <div className="text-white">
              <Square size={18} />
            </div>
          </div>
          <span className={`text-xs mt-1 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>Duplicate</span>
        </button>
        
        <button 
          className={`flex flex-col items-center text-center p-2 rounded-md transition-colors ${
            isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
          }`}
          onClick={() => handleStatusChange('In Progress')}
          disabled={loading}
        >
          <div 
            className="p-2 rounded-full"
            style={{
              backgroundColor: colorPalette?.primary || '#ea580c'
            }}
          >
            <div className="text-white">
              <CheckCircle size={18} />
            </div>
          </div>
          <span className={`text-xs mt-1 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>Clear Status</span>
        </button>
      </div>
      
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
              }`}>
                {detailedApplication?.create_date && detailedApplication?.create_time 
                  ? `${detailedApplication.create_date} ${detailedApplication.create_time}` 
                  : formatDate(application.timestamp)}
              </div>
            </div>
            
            <div className={`flex border-b pb-4 ${
              isDarkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <div className={`w-40 text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Status:</div>
              <div className={`${getStatusColor(detailedApplication?.status)} flex-1 capitalize`}>
                {detailedApplication?.status || 'Pending'}
              </div>
            </div>
            
            <div className={`flex border-b pb-4 ${
              isDarkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <div className={`w-40 text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Referred By:</div>
              <div className={`flex-1 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>{detailedApplication?.referred_by || 'None'}</div>
            </div>
            
            <div className={`flex border-b pb-4 ${
              isDarkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <div className={`w-40 text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Full Name of Client:</div>
              <div className={`flex-1 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>{getClientFullName()}</div>
            </div>
            
            <div className={`flex border-b pb-4 ${
              isDarkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <div className={`w-40 text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Full Address of Client:</div>
              <div className={`flex-1 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>{getClientFullAddress()}</div>
            </div>
            
            <div className={`flex border-b pb-4 ${
              isDarkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <div className={`w-40 text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Landmark:</div>
              <div className={`flex-1 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>{detailedApplication?.landmark || 'Not provided'}</div>
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
                {detailedApplication?.mobile_number || application.mobile_number || 'Not provided'}
                {(detailedApplication?.mobile_number || application.mobile_number) && (
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
                {detailedApplication?.secondary_mobile_number || 'Not provided'}
                {detailedApplication?.secondary_mobile_number && (
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
                {detailedApplication?.email_address || application.email_address || 'Not provided'}
                {(detailedApplication?.email_address || application.email_address) && (
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
              }`}>Village:</div>
              <div className={`flex-1 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>{detailedApplication?.village || 'Not specified'}</div>
            </div>
            
            <div className={`flex border-b pb-4 ${
              isDarkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <div className={`w-40 text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Barangay:</div>
              <div className={`flex-1 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>{detailedApplication?.barangay || application.barangay || 'Not specified'}</div>
            </div>
            
            <div className={`flex border-b pb-4 ${
              isDarkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <div className={`w-40 text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>City:</div>
              <div className={`flex-1 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>{detailedApplication?.city || application.city || 'Not specified'}</div>
            </div>
            
            <div className={`flex border-b pb-4 ${
              isDarkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <div className={`w-40 text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Region:</div>
              <div className={`flex-1 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>{detailedApplication?.region || application.region || 'Not specified'}</div>
            </div>
            
            <div className={`flex border-b pb-4 ${
              isDarkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <div className={`w-40 text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Desired Plan:</div>
              <div className={`flex-1 flex items-center ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {detailedApplication?.desired_plan || 'Not specified'}
                {detailedApplication?.desired_plan && (
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
              }`}>Promo:</div>
              <div className={`flex-1 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>{detailedApplication?.promo || 'None'}</div>
            </div>
            
            {detailedApplication?.terms_agreed && (
              <div className={`flex border-b pb-4 ${
                isDarkMode ? 'border-gray-800' : 'border-gray-200'
              }`}>
                <div className={`w-40 text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Terms and Conditions:</div>
                <div className={`flex-1 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Agreed</div>
              </div>
            )}
            
            <div className={`flex border-b py-2 ${
              isDarkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <div className={`w-40 text-sm whitespace-nowrap ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Proof of Billing</div>
              <div className={`flex-1 flex items-center justify-between min-w-0 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <span className="truncate mr-2">
                  {detailedApplication?.proof_of_billing_url || 'No document available'}
                </span>
                {detailedApplication?.proof_of_billing_url && (
                  <button 
                    className={`flex-shrink-0 ${
                      isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => window.open(detailedApplication.proof_of_billing_url)}
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
              }`}>Government Valid ID</div>
              <div className={`flex-1 flex items-center justify-between min-w-0 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <span className="truncate mr-2">
                  {detailedApplication?.government_valid_id_url || 'No document available'}
                </span>
                {detailedApplication?.government_valid_id_url && (
                  <button 
                    className={`flex-shrink-0 ${
                      isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => window.open(detailedApplication.government_valid_id_url)}
                  >
                    <ExternalLink size={16} />
                  </button>
                )}
              </div>
            </div>
            
            <div className={`flex border-b py-2 ${
              isDarkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <div className={`w-40 text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <div>Secondary Government</div>
                <div>Valid ID</div>
              </div>
              <div className={`flex-1 flex items-center justify-between min-w-0 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <span className="truncate mr-2">
                  {detailedApplication?.secondary_government_valid_id_url || 'No document available'}
                </span>
                {detailedApplication?.secondary_government_valid_id_url && (
                  <button 
                    className={`flex-shrink-0 ${
                      isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => window.open(detailedApplication.secondary_government_valid_id_url)}
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
              }`}>House Front Picture</div>
              <div className={`flex-1 flex items-center justify-between min-w-0 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <span className="truncate mr-2">
                  {detailedApplication?.house_front_picture_url || 'No image available'}
                </span>
                {detailedApplication?.house_front_picture_url && (
                  <button 
                    className={`flex-shrink-0 ${
                      isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => window.open(detailedApplication.house_front_picture_url)}
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
              }`}>Promo Image</div>
              <div className={`flex-1 flex items-center justify-between min-w-0 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <span className="truncate mr-2">
                  {detailedApplication?.promo_url || 'No image available'}
                </span>
                {detailedApplication?.promo_url && (
                  <button 
                    className={`flex-shrink-0 ${
                      isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => window.open(detailedApplication.promo_url)}
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
              }`}>Nearest Landmark 1</div>
              <div className={`flex-1 flex items-center justify-between min-w-0 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <span className="truncate mr-2">
                  {detailedApplication?.nearest_landmark1_url || 'No image available'}
                </span>
                {detailedApplication?.nearest_landmark1_url && (
                  <button 
                    className={`flex-shrink-0 ${
                      isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => window.open(detailedApplication.nearest_landmark1_url)}
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
              }`}>Nearest Landmark 2</div>
              <div className={`flex-1 flex items-center justify-between min-w-0 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <span className="truncate mr-2">
                  {detailedApplication?.nearest_landmark2_url || 'No image available'}
                </span>
                {detailedApplication?.nearest_landmark2_url && (
                  <button 
                    className={`flex-shrink-0 ${
                      isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => window.open(detailedApplication.nearest_landmark2_url)}
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
              }`}>Document Attachment</div>
              <div className={`flex-1 flex items-center justify-between min-w-0 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <span className="truncate mr-2">
                  {detailedApplication?.document_attachment_url || 'No document available'}
                </span>
                {detailedApplication?.document_attachment_url && (
                  <button 
                    className={`flex-shrink-0 ${
                      isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => window.open(detailedApplication.document_attachment_url)}
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
              }`}>Other ISP Bill</div>
              <div className={`flex-1 flex items-center justify-between min-w-0 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <span className="truncate mr-2">
                  {detailedApplication?.other_isp_bill_url || 'No document available'}
                </span>
                {detailedApplication?.other_isp_bill_url && (
                  <button 
                    className={`flex-shrink-0 ${
                      isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => window.open(detailedApplication.other_isp_bill_url)}
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

      <ConfirmationModal
        isOpen={showStatusConfirmation}
        title="Confirm Status Change"
        message={`Are you sure you want to change the status to "${pendingStatus}"?`}
        confirmText="Change Status"
        cancelText="Cancel"
        onConfirm={handleConfirmStatusChange}
        onCancel={handleCancelStatusChange}
      />

      <JOAssignFormModal
        isOpen={showJOAssignForm}
        onClose={() => setShowJOAssignForm(false)}
        onSave={handleSaveJOForm}
        applicationData={{
          ...detailedApplication,
          installation_address: detailedApplication?.installation_address || application.address,
        }}
      />

      <ConfirmationModal
        isOpen={showVisitExistsConfirmation}
        title="Visit Already Exists"
        message="This application already has a scheduled visit. Do you want to schedule another visit for this application?"
        confirmText="Continue"
        cancelText="Cancel"
        onConfirm={handleConfirmCreateNewVisit}
        onCancel={handleCancelCreateNewVisit}
      />

      <ApplicationVisitFormModal
        isOpen={showVisitForm}
        onClose={() => setShowVisitForm(false)}
        onSave={handleSaveVisitForm}
        applicationData={{
          ...detailedApplication,
          id: detailedApplication?.id || application.id,
          secondaryNumber: detailedApplication?.mobile_alt || ''
        }}
      />

      <ConfirmationModal
        isOpen={showSuccessModal}
        title="Success"
        message={successMessage}
        confirmText="OK"
        cancelText="Close"
        onConfirm={() => setShowSuccessModal(false)}
        onCancel={() => setShowSuccessModal(false)}
      />
    </div>
  );
};

export default ApplicationDetails;
