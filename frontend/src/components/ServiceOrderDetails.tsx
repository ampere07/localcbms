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
  const [detailsWidth, setDetailsWidth] = useState<number>(600);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

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

  return (
    <div className={`h-full bg-gray-950 flex flex-col overflow-hidden ${!isMobile ? 'border-l border-white border-opacity-30' : ''} relative`} style={!isMobile ? { width: `${detailsWidth}px` } : undefined}>
      {!isMobile && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-orange-500 transition-colors z-50"
          onMouseDown={handleMouseDownResize}
        />
      )}
      <div className="bg-gray-800 p-3 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center">
          <h2 className={`text-white font-medium truncate ${isMobile ? 'max-w-[200px] text-sm' : 'max-w-md'}`}>{serviceOrder.accountNumber} | {serviceOrder.fullName} | {serviceOrder.contactAddress}</h2>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="hover:text-white text-gray-400">
            <FileCheck size={16} />
          </button>
          <button className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded-sm flex items-center" onClick={handleEditClick}>
            <Edit size={16} className="mr-1" />
            <span>Edit</span>
          </button>
          <button 
            onClick={onClose}
            className="hover:text-white text-gray-400"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto py-1 px-4 bg-gray-950">
          <div className="space-y-1">
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Ticket ID</div>
              <div className="text-white flex-1">{serviceOrder.ticketId}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Timestamp</div>
              <div className="text-white flex-1">{serviceOrder.timestamp}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Account No.</div>
              <div className="text-red-500 flex-1">
                {serviceOrder.accountNumber} | {serviceOrder.fullName} | {serviceOrder.fullAddress}
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Date Installed</div>
              <div className="text-white flex-1">{serviceOrder.dateInstalled}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Full Name</div>
              <div className="text-white flex-1">{serviceOrder.fullName}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Contact Number</div>
              <div className="text-white flex-1">{serviceOrder.contactNumber}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Full Address</div>
              <div className="text-white flex-1">{serviceOrder.fullAddress}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">House Front Picture</div>
              <div className="text-white flex-1 flex items-center min-w-0">
                <span className="truncate mr-2" title={serviceOrder.houseFrontPicture}>
                  {serviceOrder.houseFrontPicture || '-'}
                </span>
                {serviceOrder.houseFrontPicture && (
                  <button 
                    className="text-white flex-shrink-0"
                    onClick={() => window.open(serviceOrder.houseFrontPicture, '_blank')}
                  >
                    <ExternalLink size={16} />
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Email Address</div>
              <div className="text-white flex-1">{serviceOrder.emailAddress}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Plan</div>
              <div className="text-white flex-1 flex items-center">
                {serviceOrder.plan}
                <button className="ml-2 text-gray-400">
                  <Info size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Affiliate</div>
              <div className="text-white flex-1 flex items-center">
                {serviceOrder.affiliate}
                <button className="ml-2 text-gray-400">
                  <Info size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Username</div>
              <div className="text-white flex-1">{serviceOrder.username}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Connection Type</div>
              <div className="text-white flex-1">{serviceOrder.connectionType}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Router/Modem SN</div>
              <div className="text-white flex-1">{serviceOrder.routerModemSN}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">LCP</div>
              <div className="text-white flex-1 flex items-center">
                {serviceOrder.lcp}
                <button className="ml-2 text-gray-400">
                  <Info size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">NAP</div>
              <div className="text-white flex-1 flex items-center">
                {serviceOrder.nap}
                <button className="ml-2 text-gray-400">
                  <Info size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">PORT</div>
              <div className="text-white flex-1 flex items-center">
                {serviceOrder.port}
                <button className="ml-2 text-gray-400">
                  <Info size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">VLAN</div>
              <div className="text-white flex-1 flex items-center">
                {serviceOrder.vlan}
                <button className="ml-2 text-gray-400">
                  <Info size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Concern</div>
              <div className="text-white flex-1 flex items-center">
                {serviceOrder.concern}
                <button className="ml-2 text-gray-400">
                  <Info size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Concern Remarks</div>
              <div className="text-white flex-1">{serviceOrder.concernRemarks}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Visit Status</div>
              <div className="text-white flex-1">{serviceOrder.visitStatus}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Visit By</div>
              <div className="text-white flex-1 flex items-center">
                {serviceOrder.visitBy}
                <button className="ml-2 text-gray-400">
                  <Info size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Visit With</div>
              <div className="text-white flex-1 flex items-center">
                {serviceOrder.visitWith}
                <button className="ml-2 text-gray-400">
                  <Info size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Visit With Other</div>
              <div className="text-white flex-1 flex items-center">
                {serviceOrder.visitWithOther}
                <button className="ml-2 text-gray-400">
                  <Info size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Visit Remarks</div>
              <div className="text-white flex-1">{serviceOrder.visitRemarks}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Modified By</div>
              <div className="text-white flex-1 flex items-center">
                {serviceOrder.modifiedBy}
                <button className="ml-2 text-gray-400">
                  <Info size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Modified Date</div>
              <div className="text-white flex-1">{serviceOrder.modifiedDate}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">User Email</div>
              <div className="text-white flex-1 flex items-center">
                {serviceOrder.userEmail}
                <button className="ml-2 text-white">
                  <Mail size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Requested by</div>
              <div className="text-white flex-1 flex items-center">
                {serviceOrder.requestedBy}
                <button className="ml-2 text-gray-400">
                  <Info size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Assigned Email</div>
              <div className="text-white flex-1 flex items-center">
                {serviceOrder.assignedEmail}
                <button className="ml-2 text-gray-400">
                  <Info size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Support Remarks</div>
              <div className="text-white flex-1">{serviceOrder.supportRemarks}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Support Status</div>
              <div className="text-white flex-1">{serviceOrder.supportStatus || '-'}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Repair Category</div>
              <div className="text-white flex-1">{serviceOrder.repairCategory || '-'}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Priority Level</div>
              <div className="text-white flex-1">{serviceOrder.priorityLevel || '-'}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">New Router SN</div>
              <div className="text-white flex-1">{serviceOrder.newRouterSn || '-'}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">New LCP/NAP</div>
              <div className="text-white flex-1">{serviceOrder.newLcpnap || '-'}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">New Plan</div>
              <div className="text-white flex-1">{serviceOrder.newPlan || '-'}</div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Time In Image</div>
              <div className="text-white flex-1 flex items-center min-w-0">
                <span className="truncate mr-2" title={serviceOrder.image1Url}>
                  {serviceOrder.image1Url ? 'View Image' : '-'}
                </span>
                {serviceOrder.image1Url && (
                  <button 
                    className="text-white flex-shrink-0"
                    onClick={() => window.open(serviceOrder.image1Url, '_blank')}
                  >
                    <ExternalLink size={16} />
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Modem Setup Image</div>
              <div className="text-white flex-1 flex items-center min-w-0">
                <span className="truncate mr-2" title={serviceOrder.image2Url}>
                  {serviceOrder.image2Url ? 'View Image' : '-'}
                </span>
                {serviceOrder.image2Url && (
                  <button 
                    className="text-white flex-shrink-0"
                    onClick={() => window.open(serviceOrder.image2Url, '_blank')}
                  >
                    <ExternalLink size={16} />
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Time Out Image</div>
              <div className="text-white flex-1 flex items-center min-w-0">
                <span className="truncate mr-2" title={serviceOrder.image3Url}>
                  {serviceOrder.image3Url ? 'View Image' : '-'}
                </span>
                {serviceOrder.image3Url && (
                  <button 
                    className="text-white flex-shrink-0"
                    onClick={() => window.open(serviceOrder.image3Url, '_blank')}
                  >
                    <ExternalLink size={16} />
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 py-2">
              <div className="w-40 text-gray-400 text-sm">Client Signature</div>
              <div className="text-white flex-1 flex items-center min-w-0">
                <span className="truncate mr-2" title={serviceOrder.clientSignatureUrl}>
                  {serviceOrder.clientSignatureUrl ? 'View Signature' : '-'}
                </span>
                {serviceOrder.clientSignatureUrl && (
                  <button 
                    className="text-white flex-shrink-0"
                    onClick={() => window.open(serviceOrder.clientSignatureUrl, '_blank')}
                  >
                    <ExternalLink size={16} />
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex py-2">
              <div className="w-40 text-gray-400 text-sm">Service Charge</div>
              <div className="text-white flex-1">{serviceOrder.serviceCharge}</div>
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
