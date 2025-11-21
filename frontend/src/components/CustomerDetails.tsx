import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2, OctagonX, HandCoins, Wrench, Edit, ChevronLeft, ChevronRight as ChevronRightNav, Maximize2, X, Paperclip, Calendar, ExternalLink } from 'lucide-react';
import TransactConfirmationModal from '../modals/TransactConfirmationModal';
import TransactionFormModal from '../modals/TransactionFormModal';
import StaggeredInstallationFormModal from '../modals/StaggeredInstallationFormModal';
import DiscountFormModal from '../modals/DiscountFormModal';
import { BillingDetailRecord } from '../types/billing';

interface OnlineStatusRecord {
  id: string;
  status: string;
  accountNo: string;
  username: string;
  group: string;
  splynxId: string;
}

interface BillingDetailsProps {
  billingRecord: BillingDetailRecord;
  onlineStatusRecords?: OnlineStatusRecord[];
  onClose?: () => void;
}

const BillingDetails: React.FC<BillingDetailsProps> = ({
  billingRecord,
  onlineStatusRecords = [],
  onClose
}) => {
  console.log('CustomerDetails - Received billingRecord:', billingRecord);
  console.log('CustomerDetails - houseFrontPicture value:', billingRecord.houseFrontPicture);
  
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    invoices: false,
    paymentPortalLogs: false,
    transactions: false,
    advancedPayments: false,
    discounts: false,
    staggeredInstallations: false,
    staggeredPayments: false,
    serviceOrders: false,
    serviceOrderLogs: false,
    reconnectionLogs: false,
    disconnectedLogs: false,
    detailsUpdateLogs: false,
    inventoryLogs: false,
    onlineStatus: true,
    borrowedLogs: false,
    planChangeLogs: false,
    serviceChargeLogs: false,
    changeDueLogs: false,
    securityDeposits: false
  });
  const [showTransactModal, setShowTransactModal] = useState(false);
  const [showTransactionFormModal, setShowTransactionFormModal] = useState(false);
  const [showStaggeredInstallationModal, setShowStaggeredInstallationModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [detailsWidth, setDetailsWidth] = useState<number>(600);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
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

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleTransactClick = () => {
    setShowTransactModal(true);
  };

  const handleTransactConfirm = () => {
    // Close confirmation modal and open transaction form modal
    setShowTransactModal(false);
    setShowTransactionFormModal(true);
    console.log('Transaction confirmed for:', billingRecord.applicationId);
  };

  const handleTransactCancel = () => {
    setShowTransactModal(false);
  };

  const handleTransactionFormSave = (formData: any) => {
    console.log('Transaction form saved:', formData);
    setShowTransactionFormModal(false);
    // TODO: Implement actual transaction save logic
  };

  const handleTransactionFormClose = () => {
    setShowTransactionFormModal(false);
  };

  const handleStaggeredInstallationAdd = () => {
    setShowStaggeredInstallationModal(true);
  };

  const handleStaggeredInstallationFormSave = (formData: any) => {
    console.log('Staggered installation form saved:', formData);
    setShowStaggeredInstallationModal(false);
  };

  const handleStaggeredInstallationFormClose = () => {
    setShowStaggeredInstallationModal(false);
  };

  const handleDiscountAdd = () => {
    setShowDiscountModal(true);
  };

  const handleDiscountFormSave = (formData: any) => {
    console.log('Discount form saved:', formData);
    setShowDiscountModal(false);
  };

  const handleDiscountFormClose = () => {
    setShowDiscountModal(false);
  };

  // Sample online status data based on the image
  const defaultOnlineStatus: OnlineStatusRecord[] = onlineStatusRecords.length > 0 ? onlineStatusRecords : [
    {
      id: '1',
      status: 'Online',
      accountNo: billingRecord.applicationId || '202308029',
      username: billingRecord.username || 'vergaraj0917251011',
      group: billingRecord.groupName || 'SwitchLite',
      splynxId: '1'
    }
  ];

  return (
    <div className="bg-gray-900 text-white h-full flex flex-col border-l border-white border-opacity-30 relative" style={{ width: `${detailsWidth}px` }}>
      <div
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-orange-500 transition-colors z-50"
        onMouseDown={handleMouseDownResize}
      />
      {/* Header with Customer Name and Actions */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-700">
        <h1 className="text-lg font-semibold text-white truncate pr-4 min-w-0 flex-1">
          {billingRecord.applicationId} | {billingRecord.customerName} | {billingRecord.address}
        </h1>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
            <Trash2 size={18} />
          </button>
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
            <OctagonX size={18} />
          </button>
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
            <HandCoins size={18} />
          </button>
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
            <Wrench size={18} />
          </button>
          <button 
            onClick={handleTransactClick}
            className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm transition-colors"
          >
            Transact
          </button>
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
            <ChevronLeft size={18} />
          </button>
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
            <ChevronRightNav size={18} />
          </button>
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
            <Maximize2 size={18} />
          </button>
          <button 
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 py-4 flex items-center space-x-4 border-b border-gray-700">
        <div className="flex flex-col items-center space-y-2">
          <button className="flex items-center justify-center w-10 h-10 bg-orange-600 hover:bg-orange-700 text-white rounded-full transition-colors">
            <Paperclip size={18} />
          </button>
          <span className="text-xs text-gray-300">Attachment</span>
        </div>
        <div className="flex flex-col items-center space-y-2">
          <button className="flex items-center justify-center w-10 h-10 bg-orange-600 hover:bg-orange-700 text-white rounded-full transition-colors">
            <Calendar size={18} />
          </button>
          <span className="text-xs text-gray-300">Change Billing Date</span>
        </div>
      </div>

      {/* Customer Details Section */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Customer Details */}
        <div className="space-y-4">
          <h3 className="text-white font-semibold text-sm mb-4">Customer Details</h3>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Full Name</span>
            <span className="text-white font-medium">{billingRecord.customerName}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Email Address</span>
            <span className="text-white font-medium">{billingRecord.emailAddress || billingRecord.email || ''}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Contact Number</span>
            <span className="text-white font-medium">{billingRecord.contactNumber || ''}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Second Contact Number</span>
            <span className="text-white font-medium">{billingRecord.secondContactNumber || ''}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Address</span>
            <span className="text-white font-medium">{billingRecord.address?.split(',')[0] || ''}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Barangay</span>
            <span className="text-white font-medium">{billingRecord.barangay || ''}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">City</span>
            <span className="text-white font-medium">{billingRecord.city || ''}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Region</span>
            <span className="text-white font-medium">{billingRecord.region || ''}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Referred By</span>
            <span className="text-white font-medium">{billingRecord.referredBy || ''}</span>
          </div>

          <div className="space-y-2">
            <span className="text-gray-400 text-sm">Address Coordinates</span>
            <div className="w-full h-24 bg-gray-800 border border-gray-700 rounded flex items-center justify-center">
              <span className="text-gray-500 text-sm">{billingRecord.addressCoordinates || 'Map View'}</span>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">House Front Picture</span>
            {billingRecord.houseFrontPicture ? (
              <button 
                onClick={() => window.open(billingRecord.houseFrontPicture, '_blank')}
                className="text-blue-400 hover:text-blue-300 flex items-center space-x-1"
              >
                <span className="text-sm truncate max-w-xs">{billingRecord.houseFrontPicture}</span>
                <ExternalLink size={14} />
              </button>
            ) : (
              <span className="text-white font-medium">No image</span>
            )}
          </div>
        </div>

        {/* Technical Details */}
        <div className="space-y-4">
          <h3 className="text-white font-semibold text-sm mb-4">Technical Details</h3>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Usage Type</span>
            <span className="text-white font-medium">{billingRecord.usageType || ''}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Date Installed</span>
            <span className="text-white font-medium">{billingRecord.dateInstalled || ''}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">PPPOE Username</span>
            <span className="text-white font-medium">{billingRecord.username || ''}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Connection Type</span>
            <span className="text-white font-medium">{billingRecord.connectionType || ''}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Router Model</span>
            <span className="text-white font-medium">{billingRecord.routerModel || ''}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Router Serial Number</span>
            <span className="text-white font-medium">{billingRecord.routerModemSN || ''}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Online Status</span>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                billingRecord.onlineStatus === 'Online' ? 'bg-green-400' : 'bg-red-400'
              }`}></div>
              <span className={`font-medium ${
                billingRecord.onlineStatus === 'Online' ? 'text-green-400' : 'text-red-400'
              }`}>{billingRecord.onlineStatus}</span>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Mikrotik ID</span>
            <span className="text-white font-medium">{billingRecord.mikrotikId || ''}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">LCP NAP PORT</span>
            <span className="text-white font-medium">{billingRecord.lcpnap || ''}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">VLAN</span>
            <span className="text-white font-medium">{billingRecord.vlan || ''}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">SESSION IP</span>
            <span className="text-white font-medium">{billingRecord.sessionIp || billingRecord.sessionIP || ''}</span>
          </div>
        </div>

        {/* Billing Details */}
        <div className="space-y-4">
          <h3 className="text-white font-semibold text-sm mb-4">Billing Details</h3>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Account Number</span>
            <span className="text-white font-medium">{billingRecord.applicationId}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Billing Status</span>
            <span className="text-white font-medium">{billingRecord.status}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Billing Day</span>
            <span className="text-white font-medium">{billingRecord.billingDay === 0 ? 'Every end of month' : (billingRecord.billingDay || '-')}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Plan</span>
            <span className="text-white font-medium">{billingRecord.plan || ''}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Account Balance</span>
            <span className="text-white font-medium">₱{billingRecord.accountBalance || billingRecord.balance || '0.00'}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Total Paid</span>
            <span className="text-white font-medium">₱{billingRecord.totalPaid || '0.00'}</span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-700"></div>

      {/* Related Sections */}
      <div className="flex-1 overflow-y-auto">
        {/* Related Invoices */}
        <div className="border-b border-gray-700">
          <button
            onClick={() => toggleSection('invoices')}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <span className="text-white font-medium">Related Invoices</span>
              <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded">0</span>
            </div>
            {expandedSections.invoices ? (
              <ChevronDown size={20} className="text-gray-400" />
            ) : (
              <ChevronRight size={20} className="text-gray-400" />
            )}
          </button>

          {expandedSections.invoices && (
            <div className="px-6 pb-4">
              <div className="text-center py-8 text-gray-500">No items</div>
            </div>
          )}
        </div>

        {/* Related Payment Portal Logs */}
        <div className="border-b border-gray-700">
          <button
            onClick={() => toggleSection('paymentPortalLogs')}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <span className="text-white font-medium">Related Payment Portal Logs</span>
              <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded">0</span>
            </div>
            {expandedSections.paymentPortalLogs ? (
              <ChevronDown size={20} className="text-gray-400" />
            ) : (
              <ChevronRight size={20} className="text-gray-400" />
            )}
          </button>

          {expandedSections.paymentPortalLogs && (
            <div className="px-6 pb-4">
              <div className="text-center py-8 text-gray-500">No items</div>
            </div>
          )}
        </div>

        {/* Related Transactions */}
        <div className="border-b border-gray-700">
          <button
            onClick={() => toggleSection('transactions')}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <span className="text-white font-medium">Related Transactions</span>
              <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded">0</span>
            </div>
            {expandedSections.transactions ? (
              <ChevronDown size={20} className="text-gray-400" />
            ) : (
              <ChevronRight size={20} className="text-gray-400" />
            )}
          </button>

          {expandedSections.transactions && (
            <div className="px-6 pb-4">
              <div className="text-center py-8 text-gray-500">No items</div>
              <div className="flex justify-end">
                <button className="text-red-400 hover:text-red-300 text-sm">Add</button>
              </div>
            </div>
          )}
        </div>

        {/* Related Online Status */}
        <div className="border-b border-gray-700">
          <button
            onClick={() => toggleSection('onlineStatus')}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <span className="text-white font-medium">Related Online Status</span>
              <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded">{defaultOnlineStatus.length}</span>
            </div>
            {expandedSections.onlineStatus ? (
              <ChevronDown size={20} className="text-gray-400" />
            ) : (
              <ChevronRight size={20} className="text-gray-400" />
            )}
          </button>

          {expandedSections.onlineStatus && (
            <div className="px-6 pb-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 text-gray-400 font-medium">Status</th>
                      <th className="text-left py-2 text-gray-400 font-medium">Account No.</th>
                      <th className="text-left py-2 text-gray-400 font-medium">Username</th>
                      <th className="text-left py-2 text-gray-400 font-medium">Affiliate</th>
                      <th className="text-left py-2 text-gray-400 font-medium">SPLYNX ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {defaultOnlineStatus.map((record) => (
                      <tr key={record.id} className="border-b border-gray-800">
                        <td className="py-2 text-green-400">{record.status}</td>
                        <td className="py-2 text-red-400">{record.accountNo}</td>
                        <td className="py-2 text-white">{record.username}</td>
                        <td className="py-2 text-white">{record.group}</td>
                        <td className="py-2 text-white">{record.splynxId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end mt-4">
                <button className="text-red-400 hover:text-red-300 text-sm">Expand</button>
              </div>
            </div>
          )}
        </div>

        {/* Add other sections with similar structure */}
        {/* Related Staggered Installations with Add Button */}
        <div className="border-b border-gray-700">
          <button
            onClick={() => toggleSection('staggeredInstallations')}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <span className="text-white font-medium">Related Staggered Installations</span>
              <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded">0</span>
            </div>
            {expandedSections.staggeredInstallations ? (
              <ChevronDown size={20} className="text-gray-400" />
            ) : (
              <ChevronRight size={20} className="text-gray-400" />
            )}
          </button>

          {expandedSections.staggeredInstallations && (
            <div className="px-6 pb-4">
              <div className="text-center py-8 text-gray-500">No items</div>
              <div className="flex justify-end">
                <button 
                  onClick={handleStaggeredInstallationAdd}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Related Advanced Payments */}
        <div className="border-b border-gray-700">
          <button
            onClick={() => toggleSection('advancedPayments')}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <span className="text-white font-medium">Related Advanced Payments</span>
              <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded">0</span>
            </div>
            {expandedSections.advancedPayments ? (
              <ChevronDown size={20} className="text-gray-400" />
            ) : (
              <ChevronRight size={20} className="text-gray-400" />
            )}
          </button>

          {expandedSections.advancedPayments && (
            <div className="px-6 pb-4">
              <div className="text-center py-8 text-gray-500">No items</div>
              <div className="flex justify-end">
                <button className="text-red-400 hover:text-red-300 text-sm">Add</button>
              </div>
            </div>
          )}
        </div>

        {/* Related Discounts with Add Button */}
        <div className="border-b border-gray-700">
          <button
            onClick={() => toggleSection('discounts')}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <span className="text-white font-medium">Related Discounts</span>
              <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded">0</span>
            </div>
            {expandedSections.discounts ? (
              <ChevronDown size={20} className="text-gray-400" />
            ) : (
              <ChevronRight size={20} className="text-gray-400" />
            )}
          </button>

          {expandedSections.discounts && (
            <div className="px-6 pb-4">
              <div className="text-center py-8 text-gray-500">No items</div>
              <div className="flex justify-end">
                <button 
                  onClick={handleDiscountAdd}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>
        {[
          { key: 'staggeredPayments', label: 'Related Staggered Payments' },
          { key: 'serviceOrders', label: 'Related Service Orders' },
          { key: 'reconnectionLogs', label: 'Related Reconnection Logs' },
          { key: 'disconnectedLogs', label: 'Related Disconnected Logs' },
          { key: 'detailsUpdateLogs', label: 'Related Details Update Logs' },
          { key: 'inventoryLogs', label: 'Related Inventory Logs' },
          { key: 'borrowedLogs', label: 'Related Borrowed Logs' },
          { key: 'planChangeLogs', label: 'Related Plan Change Logs' },
          { key: 'serviceChargeLogs', label: 'Related Service Charge Logs' },
          { key: 'changeDueLogs', label: 'Related Change Due Logs' },
          { key: 'securityDeposits', label: 'Related Security Deposits' }
        ].map((section) => (
          <div key={section.key} className="border-b border-gray-700">
            <button
              onClick={() => toggleSection(section.key)}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <span className="text-white font-medium">{section.label}</span>
                <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded">0</span>
              </div>
              {expandedSections[section.key] ? (
                <ChevronDown size={20} className="text-gray-400" />
              ) : (
                <ChevronRight size={20} className="text-gray-400" />
              )}
            </button>

            {expandedSections[section.key] && (
              <div className="px-6 pb-4">
                <div className="text-center py-8 text-gray-500">No items</div>
                <div className="flex justify-end">
                  <button className="text-red-400 hover:text-red-300 text-sm">Add</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Transaction Confirmation Modal */}
      <TransactConfirmationModal
        isOpen={showTransactModal}
        onConfirm={handleTransactConfirm}
        onCancel={handleTransactCancel}
        amount={`₱${billingRecord.accountBalance || '0.00'}`}
        description={`Transaction for ${billingRecord.customerName} - Account: ${billingRecord.applicationId}`}
        billingRecord={billingRecord}
      />

      {/* Transaction Form Modal */}
      <TransactionFormModal
        isOpen={showTransactionFormModal}
        onClose={handleTransactionFormClose}
        onSave={handleTransactionFormSave}
        billingRecord={billingRecord}
      />

      {/* Staggered Installation Form Modal */}
      <StaggeredInstallationFormModal
        isOpen={showStaggeredInstallationModal}
        onClose={handleStaggeredInstallationFormClose}
        onSave={handleStaggeredInstallationFormSave}
        customerData={{
          accountNo: billingRecord.applicationId,
          fullName: billingRecord.customerName,
          contactNo: billingRecord.contactNumber,
          emailAddress: billingRecord.emailAddress || billingRecord.email || '',
          address: billingRecord.address?.split(',')[0] || '',
          plan: billingRecord.plan,
          barangay: billingRecord.barangay || '',
          city: billingRecord.city || ''
        }}
      />

      {/* Discount Form Modal */}
      <DiscountFormModal
        isOpen={showDiscountModal}
        onClose={handleDiscountFormClose}
        onSave={handleDiscountFormSave}
        customerData={{
          accountNo: billingRecord.applicationId,
          fullName: billingRecord.customerName,
          address: billingRecord.address
        }}
      />
    </div>
  );
};

export default BillingDetails;
