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
      
      // Call API to update application status
      await updateApplication(application.id, { status: pendingStatus });
      
      // Refetch the application details from database to ensure we have the latest status
      const updatedApplication = await getApplication(application.id);
      setDetailedApplication(updatedApplication);
      
      setShowStatusConfirmation(false);
      setPendingStatus('');
      
      // Call the callback to refresh the application list
      if (onApplicationUpdate) {
        onApplicationUpdate();
      }
      
      // Show success message
      alert(`Status updated to ${pendingStatus}`);
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
        
        // Getting application from the 'applications' table
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

  const applicationDetails = {
    ...application,
    id: detailedApplication?.id || application.id || '',
    create_date: detailedApplication?.create_date || '',
    create_time: detailedApplication?.create_time || '',
    email_address: detailedApplication?.email_address || application.email_address || '',
    first_name: detailedApplication?.first_name || '',
    middle_initial: detailedApplication?.middle_initial || '',
    last_name: detailedApplication?.last_name || '',
    mobile_number: detailedApplication?.mobile_number || application.mobile_number || '',
    secondary_mobile_number: detailedApplication?.secondary_mobile_number || '',
    status: detailedApplication?.status || 'pending',
    installation_address: detailedApplication?.installation_address || application.address || '',
    landmark: detailedApplication?.landmark || '',
    region: detailedApplication?.region || application.region || '',
    city: detailedApplication?.city || application.city || '',
    barangay: detailedApplication?.barangay || application.barangay || '',
    village: detailedApplication?.village || '',
    desired_plan: detailedApplication?.desired_plan || '',
    promo: detailedApplication?.promo || '',
    referred_by: detailedApplication?.referred_by || '',
    proof_of_billing_url: detailedApplication?.proof_of_billing_url || '',
    government_valid_id_url: detailedApplication?.government_valid_id_url || '',
    secondary_government_valid_id_url: detailedApplication?.secondary_government_valid_id_url || '',
    house_front_picture_url: detailedApplication?.house_front_picture_url || '',
    promo_url: detailedApplication?.promo_url || '',
    nearest_landmark1_url: detailedApplication?.nearest_landmark1_url || '',
    nearest_landmark2_url: detailedApplication?.nearest_landmark2_url || '',
    document_attachment_url: detailedApplication?.document_attachment_url || '',
    other_isp_bill_url: detailedApplication?.other_isp_bill_url || '',
    terms_agreed: detailedApplication?.terms_agreed || false,
    
    fullName: [
      detailedApplication?.first_name,
      detailedApplication?.middle_initial,
      detailedApplication?.last_name
    ].filter(Boolean).join(' ') || application.customerName || '',
    
    fullAddress: [
      detailedApplication?.installation_address || application.address,
      detailedApplication?.location || application.location,
      detailedApplication?.barangay || application.barangay,
      detailedApplication?.city || application.city,
      detailedApplication?.region || application.region
    ].filter(Boolean).join(', '),
    
    timestamp: detailedApplication?.create_date && detailedApplication?.create_time 
      ? `${detailedApplication.create_date} ${detailedApplication.create_time}` 
      : application.timestamp || '',
  };


  
  return (
    <div className="h-full bg-gray-950 flex flex-col overflow-hidden">
      <div className="bg-gray-900 p-3 flex items-center justify-between border-b border-gray-800">
        <div className="flex items-center">
          <h2 className="text-white font-semibold text-lg">
            {detailedApplication?.first_name || application.customerName.split(' ')[0] || 'None'}
          </h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="bg-transparent text-gray-400 hover:text-white p-1 rounded">
            <Newspaper size={20} />
          </button>
          <button 
            className="bg-transparent text-gray-400 hover:text-white p-1 rounded"
            onClick={handleMoveToJO}
          >
            <ArrowRightFromLine size={20} />
          </button>
          <button 
            className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded flex items-center"
            onClick={handleScheduleVisit}
          >
            <Calendar size={16} className="mr-1" />
            <span>Schedule</span>
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
      
      {/* Action Buttons */}
      <div className="bg-gray-900 py-4 border-b border-gray-800">
        <div className="flex items-center space-x-4 px-4 overflow-x-auto hide-scrollbar">
          <button 
            className="flex flex-col items-center text-center hover:bg-gray-800 rounded-lg p-2 transition-colors flex-shrink-0"
            onClick={() => handleStatusChange('No Facility')}
            disabled={loading}
          >
            <div className="bg-orange-600 p-3 rounded-full">
              <Ban className="text-white" size={24} />
            </div>
            <span className="text-xs mt-1 text-gray-300 whitespace-nowrap">No Facility</span>
          </button>
          
          <button 
            className="flex flex-col items-center text-center hover:bg-gray-800 rounded-lg p-2 transition-colors flex-shrink-0"
            onClick={() => handleStatusChange('Cancelled')}
            disabled={loading}
          >
            <div className="bg-orange-600 p-3 rounded-full">
              <XCircle className="text-white" size={24} />
            </div>
            <span className="text-xs mt-1 text-gray-300 whitespace-nowrap">Cancelled</span>
          </button>
          
          <button 
            className="flex flex-col items-center text-center hover:bg-gray-800 rounded-lg p-2 transition-colors flex-shrink-0"
            onClick={() => handleStatusChange('No Slot')}
            disabled={loading}
          >
            <div className="bg-orange-600 p-3 rounded-full">
              <RotateCw className="text-white" size={24} />
            </div>
            <span className="text-xs mt-1 text-gray-300 whitespace-nowrap">No Slot</span>
          </button>
          
          <button 
            className="flex flex-col items-center text-center hover:bg-gray-800 rounded-lg p-2 transition-colors flex-shrink-0"
            onClick={() => handleStatusChange('Duplicate')}
            disabled={loading}
          >
            <div className="bg-orange-600 p-3 rounded-full">
              <Square className="text-white" size={24} />
            </div>
            <span className="text-xs mt-1 text-gray-300 whitespace-nowrap">Duplicate</span>
          </button>
          
          <button 
            className="flex flex-col items-center text-center hover:bg-gray-800 rounded-lg p-2 transition-colors flex-shrink-0"
            onClick={() => handleStatusChange('In Progress')}
            disabled={loading}
          >
            <div className="bg-orange-600 p-3 rounded-full">
              <CheckCircle className="text-white" size={24} />
            </div>
            <span className="text-xs mt-1 text-gray-300 whitespace-nowrap">Clear Status</span>
          </button>
        </div>
      </div>
      
      {/* Application Details */}
      <div className="flex-1 overflow-y-auto bg-gray-900">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader className="animate-spin text-orange-500" size={32} />
            <span className="ml-3 text-gray-400">Loading application details...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-red-500 mb-4">{error}</div>
            <button 
              onClick={() => {
                setError(null);
                window.location.reload();
              }} 
              className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded">
              Retry
            </button>
          </div>
        ) : (
          <div className="p-4">
            <div className="space-y-0">
              <div className="flex py-3 border-b border-gray-800">
                <div className="w-40 text-gray-400 text-sm">Referred by:</div>
                <div className="text-white flex-1">{detailedApplication?.referred_by || 'None'}</div>
              </div>
              
              <div className="flex py-3 border-b border-gray-800">
                <div className="w-40 text-gray-400 text-sm">Status</div>
                <div className="text-green-500 flex-1">{detailedApplication?.status || 'None'}</div>
              </div>
              
              <div className="flex py-3 border-b border-gray-800">
                <div className="w-40 text-gray-400 text-sm">Timestamp</div>
                <div className="text-white flex-1">{detailedApplication?.timestamp || 'None'}</div>
              </div>
              
              <div className="flex py-3 border-b border-gray-800">
                <div className="w-40 text-gray-400 text-sm">Full Name</div>
                <div className="text-white flex-1">
                  {detailedApplication?.customer_name || 
                   [detailedApplication?.first_name, detailedApplication?.middle_initial, detailedApplication?.last_name].filter(Boolean).join(' ') || 
                   application.customerName || 'None'}
                </div>
              </div>
              
              <div className="flex py-3 border-b border-gray-800">
                <div className="w-40 text-gray-400 text-sm">Full Address</div>
                <div className="text-white flex-1">
                  {[
                    detailedApplication?.installation_address || application.address,
                    detailedApplication?.location || application.location,
                    detailedApplication?.barangay || application.barangay,
                    detailedApplication?.city || application.city,
                    detailedApplication?.region || application.region
                  ].filter(Boolean).join(', ') || 'No address'}
                </div>
              </div>
              
              <div className="flex py-3 border-b border-gray-800">
                <div className="w-40 text-gray-400 text-sm">Landmark</div>
                <div className="text-white flex-1">{detailedApplication?.landmark || 'None'}</div>
              </div>
              
              <div className="flex py-3 border-b border-gray-800">
                <div className="w-40 text-gray-400 text-sm">Email Address</div>
                <div className="text-white flex-1">{detailedApplication?.email_address || application.email_address || 'None'}</div>
              </div>
              
              <div className="flex py-3 border-b border-gray-800">
                <div className="w-40 text-gray-400 text-sm">Mobile Number</div>
                <div className="text-white flex-1 flex justify-between items-center">
                  <span>{detailedApplication?.mobile_number || application.mobile_number || 'None'}</span>
                  {(detailedApplication?.mobile_number || application.mobile_number) && (
                    <div>
                      <button className="text-gray-400 hover:text-white ml-2">
                        <Phone size={16} />
                      </button>
                      <button className="text-gray-400 hover:text-white ml-2">
                        <MessageSquare size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex py-3 border-b border-gray-800">
                <div className="w-40 text-gray-400 text-sm">Second Mobile Number</div>
                <div className="text-white flex-1 flex justify-between items-center">
                  <span>{detailedApplication?.secondary_mobile_number || 'None'}</span>
                  {detailedApplication?.secondary_mobile_number && (
                    <div>
                      <button className="text-gray-400 hover:text-white ml-2">
                        <Phone size={16} />
                      </button>
                      <button className="text-gray-400 hover:text-white ml-2">
                        <MessageSquare size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex py-3 border-b border-gray-800">
                <div className="w-40 text-gray-400 text-sm">Desired Plan</div>
                <div className="text-white flex-1 flex justify-between items-center">
                  <span>{detailedApplication?.desired_plan || 'None'}</span>
                  {detailedApplication?.desired_plan && (
                    <button className="text-gray-400 hover:text-white">
                      <Info size={16} />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex py-3 border-b border-gray-800">
                <div className="w-40 text-gray-400 text-sm">Promo</div>
                <div className="text-white flex-1">{detailedApplication?.promo || 'None'}</div>
              </div>
              
              {detailedApplication?.terms_agreed && (
                <div className="flex py-3 border-b border-gray-800">
                  <div className="w-40 text-gray-400 text-sm">Terms and Conditions</div>
                  <div className="text-white flex-1">Agreed</div>
                </div>
              )}
              
              {detailedApplication?.government_valid_id_url && (
                <div className="flex py-3 border-b border-gray-800">
                  <div className="w-40 text-gray-400 text-sm">Government Valid ID</div>
                  <div className="text-white flex-1 flex justify-between items-center truncate">
                    <span className="truncate">{detailedApplication.government_valid_id_url}</span>
                    <button 
                      className="text-gray-400 hover:text-white"
                      onClick={() => window.open(detailedApplication.government_valid_id_url)}
                    >
                      <ExternalLink size={16} />
                    </button>
                  </div>
                </div>
              )}
              
              {detailedApplication?.secondary_government_valid_id_url && (
                <div className="flex py-3 border-b border-gray-800">
                  <div className="w-40 text-gray-400 text-sm">Secondary Government Valid ID</div>
                  <div className="text-white flex-1 flex justify-between items-center truncate">
                    <span className="truncate">{detailedApplication.secondary_government_valid_id_url}</span>
                    <button 
                      className="text-gray-400 hover:text-white"
                      onClick={() => window.open(detailedApplication.secondary_government_valid_id_url)}
                    >
                      <ExternalLink size={16} />
                    </button>
                  </div>
                </div>
              )}
              
              {detailedApplication?.promo_url && (
                <div className="flex py-3 border-b border-gray-800">
                  <div className="w-40 text-gray-400 text-sm">Promo URL</div>
                  <div className="text-white flex-1 flex justify-between items-center truncate">
                    <span className="truncate">{detailedApplication.promo_url}</span>
                    <button 
                      className="text-gray-400 hover:text-white"
                      onClick={() => window.open(detailedApplication.promo_url)}
                    >
                      <ExternalLink size={16} />
                    </button>
                  </div>
                </div>
              )}
              
              {detailedApplication?.nearest_landmark1_url && (
                <div className="flex py-3 border-b border-gray-800">
                  <div className="w-40 text-gray-400 text-sm">Nearest Landmark 1</div>
                  <div className="text-white flex-1 flex justify-between items-center truncate">
                    <span className="truncate">{detailedApplication.nearest_landmark1_url}</span>
                    <button 
                      className="text-gray-400 hover:text-white"
                      onClick={() => window.open(detailedApplication.nearest_landmark1_url)}
                    >
                      <ExternalLink size={16} />
                    </button>
                  </div>
                </div>
              )}
              
              {detailedApplication?.nearest_landmark2_url && (
                <div className="flex py-3 border-b border-gray-800">
                  <div className="w-40 text-gray-400 text-sm">Nearest Landmark 2</div>
                  <div className="text-white flex-1 flex justify-between items-center truncate">
                    <span className="truncate">{detailedApplication.nearest_landmark2_url}</span>
                    <button 
                      className="text-gray-400 hover:text-white"
                      onClick={() => window.open(detailedApplication.nearest_landmark2_url)}
                    >
                      <ExternalLink size={16} />
                    </button>
                  </div>
                </div>
              )}
              
              {detailedApplication?.house_front_picture_url && (
                <div className="flex py-3">
                  <div className="w-40 text-gray-400 text-sm">House Front Picture</div>
                  <div className="text-white flex-1 flex justify-between items-center truncate">
                    <span className="truncate">{detailedApplication.house_front_picture_url}</span>
                    <button 
                      className="text-gray-400 hover:text-white"
                      onClick={() => window.open(detailedApplication.house_front_picture_url)}
                    >
                      <ExternalLink size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Use the ConfirmationModal component */}
      <ConfirmationModal
        isOpen={showMoveConfirmation}
        title="Confirm"
        message="Are you sure you want to move this application to JO?"
        confirmText="Move to JO"
        cancelText="Cancel"
        onConfirm={handleConfirmMoveToJO}
        onCancel={() => setShowMoveConfirmation(false)}
      />

      {/* Status Change Confirmation Modal */}
      <ConfirmationModal
        isOpen={showStatusConfirmation}
        title="Confirm Status Change"
        message={`Are you sure you want to change the status to "${pendingStatus}"?`}
        confirmText="Change Status"
        cancelText="Cancel"
        onConfirm={handleConfirmStatusChange}
        onCancel={handleCancelStatusChange}
      />

      {/* Use the JOAssignFormModal component */}
      <JOAssignFormModal
        isOpen={showJOAssignForm}
        onClose={() => setShowJOAssignForm(false)}
        onSave={handleSaveJOForm}
        applicationData={{
          ...detailedApplication,
          installation_address: detailedApplication?.installation_address || application.address,
        }}
      />

      {/* Visit Exists Confirmation Modal */}
      <ConfirmationModal
        isOpen={showVisitExistsConfirmation}
        title="Visit Already Exists"
        message="This application already has a scheduled visit. Do you want to schedule another visit for this application?"
        confirmText="Continue"
        cancelText="Cancel"
        onConfirm={handleConfirmCreateNewVisit}
        onCancel={handleCancelCreateNewVisit}
      />

      {/* Use the ApplicationVisitFormModal component */}
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

export default ApplicationDetails;