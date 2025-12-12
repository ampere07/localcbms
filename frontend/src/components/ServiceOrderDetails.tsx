import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, ArrowRight, Maximize2, X, ExternalLink, Mail, Edit, Info, FileCheck 
} from 'lucide-react';
import ServiceOrderEditModal from '../modals/ServiceOrderEditModal';

interface ServiceOrderDetailsProps {
  serviceOrder: {
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
    affiliate: string;
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
    priorityLevel?: string;
    newRouterSn?: string;
    newLcpnap?: string;
    newPlan?: string;
    clientSignatureUrl?: string;
    image1Url?: string;
    image2Url?: string;
    image3Url?: string;
  };
  onClose: () => void;
  isMobile?: boolean;
}

const ServiceOrderDetails: React.FC<ServiceOrderDetailsProps> = ({ serviceOrder, onClose, isMobile = false }) => {
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') === 'dark');
  const [detailsWidth, setDetailsWidth] = useState<number>(600);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(localStorage.getItem('theme') === 'dark');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
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

  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
  };

  const handleSaveEdit = (formData: any) => {
    console.log('Service order updated:', formData);
    setIsEditModalOpen(false);
  };

  const renderField = (label: string, value: any, hasInfo: boolean = false) => (
    <div className={`flex py-2 ${
      isDarkMode ? 'border-b border-gray-800' : 'border-b border-gray-300'
    }`}>
      <div className={`w-40 text-sm ${
        isDarkMode ? 'text-gray-400' : 'text-gray-600'
      }`}>{label}</div>
      <div className={`flex-1 flex items-center ${
        isDarkMode ? 'text-white' : 'text-gray-900'
      }`}>
        {value || '-'}
        {hasInfo && (
          <button className={isDarkMode ? 'ml-2 text-gray-400 hover:text-white' : 'ml-2 text-gray-600 hover:text-gray-900'}>
            <Info size={16} />
          </button>
        )}
      </div>
    </div>
  );

  const renderImageField = (label: string, url: string | undefined, displayText: string) => (
    <div className={`flex py-2 ${
      isDarkMode ? 'border-b border-gray-800' : 'border-b border-gray-300'
    }`}>
      <div className={`w-40 text-sm ${
        isDarkMode ? 'text-gray-400' : 'text-gray-600'
      }`}>{label}</div>
      <div className={`flex-1 flex items-center min-w-0 ${
        isDarkMode ? 'text-white' : 'text-gray-900'
      }`}>
        <span className="truncate mr-2" title={url}>
          {url ? displayText : '-'}
        </span>
        {url && (
          <button 
            className={`flex-shrink-0 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}
            onClick={() => window.open(url, '_blank')}
          >
            <ExternalLink size={16} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className={`h-full flex flex-col overflow-hidden relative ${!isMobile ? 'border-l' : ''} ${
      isDarkMode
        ? 'bg-gray-950 border-white border-opacity-30'
        : 'bg-white border-gray-300'
    }`} style={!isMobile ? { width: `${detailsWidth}px` } : undefined}>
      {!isMobile && (
        <div
          className={`absolute left-0 top-0 bottom-0 w-1 cursor-col-resize transition-colors z-50 ${
            isDarkMode ? 'hover:bg-orange-500' : 'hover:bg-orange-600'
          }`}
          onMouseDown={handleMouseDownResize}
        />
      )}
      <div className={`p-3 flex items-center justify-between border-b ${
        isDarkMode
          ? 'bg-gray-800 border-gray-700'
          : 'bg-gray-100 border-gray-200'
      }`}>
        <div className="flex items-center">
          <h2 className={`font-medium truncate ${isMobile ? 'max-w-[200px] text-sm' : 'max-w-md'} ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>{serviceOrder.accountNumber} | {serviceOrder.fullName} | {serviceOrder.contactAddress}</h2>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className={isDarkMode ? 'hover:text-white text-gray-400' : 'hover:text-gray-900 text-gray-600'}>
            <FileCheck size={16} />
          </button>
          <button className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded-sm flex items-center" onClick={handleEditClick}>
            <Edit size={16} className="mr-1" />
            <span>Edit</span>
          </button>
          <button 
            onClick={onClose}
            className={isDarkMode ? 'hover:text-white text-gray-400' : 'hover:text-gray-900 text-gray-600'}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className={`mx-auto py-1 px-4 ${
          isDarkMode ? 'bg-gray-950' : 'bg-white'
        }`}>
          <div className="space-y-1">
            {renderField('Ticket ID', serviceOrder.ticketId)}
            {renderField('Timestamp', serviceOrder.timestamp)}
            
            <div className={`flex py-2 ${
              isDarkMode ? 'border-b border-gray-800' : 'border-b border-gray-300'
            }`}>
              <div className={`w-40 text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Account No.</div>
              <div className="text-red-500 flex-1">
                {serviceOrder.accountNumber} | {serviceOrder.fullName} | {serviceOrder.fullAddress}
              </div>
            </div>
            
            {renderField('Date Installed', serviceOrder.dateInstalled)}
            {renderField('Full Name', serviceOrder.fullName)}
            {renderField('Contact Number', serviceOrder.contactNumber)}
            {renderField('Full Address', serviceOrder.fullAddress)}
            {renderImageField('House Front Picture', serviceOrder.houseFrontPicture, serviceOrder.houseFrontPicture)}
            {renderField('Email Address', serviceOrder.emailAddress)}
            {renderField('Plan', serviceOrder.plan, true)}
            {renderField('Affiliate', serviceOrder.affiliate, true)}
            {renderField('Username', serviceOrder.username)}
            {renderField('Connection Type', serviceOrder.connectionType)}
            {renderField('Router/Modem SN', serviceOrder.routerModemSN)}
            {renderField('LCP', serviceOrder.lcp, true)}
            {renderField('NAP', serviceOrder.nap, true)}
            {renderField('PORT', serviceOrder.port, true)}
            {renderField('VLAN', serviceOrder.vlan, true)}
            {renderField('Concern', serviceOrder.concern, true)}
            {renderField('Concern Remarks', serviceOrder.concernRemarks)}
            {renderField('Visit Status', serviceOrder.visitStatus)}
            {renderField('Visit By', serviceOrder.visitBy, true)}
            {renderField('Visit With', serviceOrder.visitWith, true)}
            {renderField('Visit With Other', serviceOrder.visitWithOther, true)}
            {renderField('Visit Remarks', serviceOrder.visitRemarks)}
            {renderField('Modified By', serviceOrder.modifiedBy, true)}
            {renderField('Modified Date', serviceOrder.modifiedDate)}
            
            <div className={`flex py-2 ${
              isDarkMode ? 'border-b border-gray-800' : 'border-b border-gray-300'
            }`}>
              <div className={`w-40 text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>User Email</div>
              <div className={`flex-1 flex items-center ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {serviceOrder.userEmail}
                <button className={`ml-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  <Mail size={16} />
                </button>
              </div>
            </div>
            
            {renderField('Requested by', serviceOrder.requestedBy, true)}
            {renderField('Assigned Email', serviceOrder.assignedEmail, true)}
            {renderField('Support Remarks', serviceOrder.supportRemarks)}
            {renderField('Support Status', serviceOrder.supportStatus)}
            {renderField('Repair Category', serviceOrder.repairCategory)}
            {renderField('Priority Level', serviceOrder.priorityLevel)}
            {renderField('New Router SN', serviceOrder.newRouterSn)}
            {renderField('New LCP/NAP', serviceOrder.newLcpnap)}
            {renderField('New Plan', serviceOrder.newPlan)}
            {renderImageField('Time In Image', serviceOrder.image1Url, 'View Image')}
            {renderImageField('Modem Setup Image', serviceOrder.image2Url, 'View Image')}
            {renderImageField('Time Out Image', serviceOrder.image3Url, 'View Image')}
            {renderImageField('Client Signature', serviceOrder.clientSignatureUrl, 'View Signature')}
            
            <div className="flex py-2">
              <div className={`w-40 text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Service Charge</div>
              <div className={`flex-1 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>{serviceOrder.serviceCharge}</div>
            </div>
          </div>
        </div>
      </div>

      {isEditModalOpen && (
        <ServiceOrderEditModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onSave={handleSaveEdit}
          serviceOrderData={serviceOrder}
        />
      )}
    </div>
  );
};

export default ServiceOrderDetails;
