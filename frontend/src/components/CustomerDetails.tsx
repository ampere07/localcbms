import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2, OctagonX, HandCoins, Wrench, Edit, ChevronLeft, ChevronRight as ChevronRightNav, Maximize2, X, Paperclip, Calendar, ExternalLink } from 'lucide-react';
import TransactConfirmationModal from '../modals/TransactConfirmationModal';
import TransactionFormModal from '../modals/TransactionFormModal';
import StaggeredInstallationFormModal from '../modals/StaggeredInstallationFormModal';
import DiscountFormModal from '../modals/DiscountFormModal';
import SORequestFormModal from '../modals/SORequestFormModal';
import { BillingDetailRecord } from '../types/billing';
import { settingsColorPaletteService, ColorPalette } from '../services/settingsColorPaletteService';

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
  
  const [isDarkMode, setIsDarkMode] = useState(false);
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
  const [showSORequestConfirmModal, setShowSORequestConfirmModal] = useState(false);
  const [showSORequestFormModal, setShowSORequestFormModal] = useState(false);
  const [detailsWidth, setDetailsWidth] = useState<number>(600);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [colorPalette, setColorPalette] = useState<ColorPalette | null>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

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

  const handleWrenchClick = () => {
    setShowSORequestConfirmModal(true);
  };

  const handleSORequestConfirm = () => {
    setShowSORequestConfirmModal(false);
    setShowSORequestFormModal(true);
  };

  const handleSORequestCancel = () => {
    setShowSORequestConfirmModal(false);
  };

  const handleSORequestFormSave = () => {
    console.log('SO Request saved for:', billingRecord.applicationId);
    setShowSORequestFormModal(false);
  };

  const handleSORequestFormClose = () => {
    setShowSORequestFormModal(false);
  };

  const defaultOnlineStatus: OnlineStatusRecord[] = onlineStatusRecords.length > 0 ? onlineStatusRecords : [
    {
      id: '1',
      status: 'Online',
      accountNo: billingRecord.applicationId || '',
      username: billingRecord.username || '',
      group: billingRecord.groupName || '',
      splynxId: '1'
    }
  ];

  return (
    <div className={`h-full flex flex-col border-l relative ${
      isDarkMode
        ? 'bg-gray-900 text-white border-white border-opacity-30'
        : 'bg-white text-gray-900 border-gray-300'
    }`} style={{ width: `${detailsWidth}px` }}>
      <div
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize transition-colors z-50"
        style={{
          backgroundColor: isResizing ? (colorPalette?.primary || '#ea580c') : 'transparent'
        }}
        onMouseEnter={(e) => {
          if (!isResizing) {
            e.currentTarget.style.backgroundColor = colorPalette?.accent || '#ea580c';
          }
        }}
        onMouseLeave={(e) => {
          if (!isResizing) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
        onMouseDown={handleMouseDownResize}
      />
      <div className={`px-4 py-3 flex items-center justify-between border-b ${
        isDarkMode
          ? 'bg-gray-800 border-gray-700'
          : 'bg-gray-100 border-gray-200'
      }`}>
        <h1 className={`text-lg font-semibold truncate pr-4 min-w-0 flex-1 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          {billingRecord.applicationId} | {billingRecord.customerName} | {billingRecord.address}
        </h1>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <button className={`p-2 rounded transition-colors ${
            isDarkMode
              ? 'text-gray-400 hover:text-white hover:bg-gray-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
          }`}>
            <OctagonX size={18} />
          </button>
          <button className={`p-2 rounded transition-colors ${
            isDarkMode
              ? 'text-gray-400 hover:text-white hover:bg-gray-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
          }`}>
            <HandCoins size={18} />
          </button>
          <button 
            onClick={handleWrenchClick}
            className={`p-2 rounded transition-colors ${
              isDarkMode
                ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            <Wrench size={18} />
          </button>
          <button 
            onClick={handleTransactClick}
            className="px-3 py-1 rounded text-sm transition-colors text-white"
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
          >
            Transact
          </button>
          <button className={`p-2 rounded transition-colors ${
            isDarkMode
              ? 'text-gray-400 hover:text-white hover:bg-gray-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
          }`}>
            <ChevronLeft size={18} />
          </button>
          <button className={`p-2 rounded transition-colors ${
            isDarkMode
              ? 'text-gray-400 hover:text-white hover:bg-gray-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
          }`}>
            <ChevronRightNav size={18} />
          </button>
          <button className={`p-2 rounded transition-colors ${
            isDarkMode
              ? 'text-gray-400 hover:text-white hover:bg-gray-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
          }`}>
            <Maximize2 size={18} />
          </button>
          <button 
            onClick={handleClose}
            className={`p-2 rounded transition-colors ${
              isDarkMode
                ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className={`px-6 py-4 flex items-center space-x-4 border-b ${
        isDarkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex flex-col items-center space-y-2">
          <button 
            className="flex items-center justify-center w-10 h-10 text-white rounded-full transition-colors"
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
          >
            <Paperclip size={18} />
          </button>
          <span className={`text-xs ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>Attachment</span>
        </div>
        <div className="flex flex-col items-center space-y-2">
          <button 
            className="flex items-center justify-center w-10 h-10 text-white rounded-full transition-colors"
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
          >
            <Calendar size={18} />
          </button>
          <span className={`text-xs ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>Change Billing Date</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="space-y-4">
          <h3 className={`font-semibold text-sm mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>Customer Details</h3>
          
          <div className="flex justify-between items-center">
            <span className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>Full Name</span>
            <span className={`font-medium ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>{billingRecord.customerName}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>Email Address</span>
            <span className={`font-medium ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>{billingRecord.emailAddress || billingRecord.email || ''}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>Contact Number</span>
            <span className={`font-medium ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>{billingRecord.contactNumber || ''}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>Second Contact Number</span>
            <span className={`font-medium ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>{billingRecord.secondContactNumber || ''}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>Address</span>
            <span className={`font-medium ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>{billingRecord.address?.split(',')[0] || ''}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>Barangay</span>
            <span className={`font-medium ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>{billingRecord.barangay || ''}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>City</span>
            <span className={`font-medium ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>{billingRecord.city || ''}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>Region</span>
            <span className={`font-medium ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>{billingRecord.region || ''}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>Referred By</span>
            <span className={`font-medium ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>{billingRecord.referredBy || ''}</span>
          </div>

          <div className="space-y-2">
            <span className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>Address Coordinates</span>
            <div className={`w-full h-24 border rounded flex items-center justify-center ${
              isDarkMode
                ? 'bg-gray-800 border-gray-700'
                : 'bg-gray-100 border-gray-300'
            }`}>
              <span className={`text-sm ${
                isDarkMode ? 'text-gray-500' : 'text-gray-600'
              }`}>{billingRecord.addressCoordinates || 'Map View'}</span>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>House Front Picture</span>
            {billingRecord.houseFrontPicture ? (
              <button 
                onClick={() => window.open(billingRecord.houseFrontPicture, '_blank')}
                className={isDarkMode
                  ? 'text-blue-400 hover:text-blue-300 flex items-center space-x-1'
                  : 'text-blue-600 hover:text-blue-700 flex items-center space-x-1'
                }
              >
                <span className="text-sm truncate max-w-xs">{billingRecord.houseFrontPicture}</span>
                <ExternalLink size={14} />
              </button>
            ) : (
              <span className={`font-medium ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>No image</span>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className={`font-semibold text-sm mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>Technical Details</h3>
          
          <div className="flex justify-between items-center">
            <span className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>Usage Type</span>
            <span className={`font-medium ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>{billingRecord.usageType || ''}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>Date Installed</span>
            <span className={`font-medium ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>{billingRecord.dateInstalled || ''}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>PPPOE Username</span>
            <span className={`font-medium ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>{billingRecord.username || ''}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>Connection Type</span>
            <span className={`font-medium ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>{billingRecord.connectionType || ''}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>Router Model</span>
            <span className={`font-medium ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>{billingRecord.routerModel || ''}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>Router Serial Number</span>
            <span className={`font-medium ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>{billingRecord.routerModemSN || ''}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>Online Status</span>
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
            <span className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>Mikrotik ID</span>
            <span className={`font-medium ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>{billingRecord.mikrotikId || ''}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>LCP NAP PORT</span>
            <span className={`font-medium ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>{billingRecord.lcpnap || ''}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>VLAN</span>
            <span className={`font-medium ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>{billingRecord.vlan || ''}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>SESSION IP</span>
            <span className={`font-medium ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>{billingRecord.sessionIp || billingRecord.sessionIP || ''}</span>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className={`font-semibold text-sm mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>Billing Details</h3>
          
          <div className="flex justify-between items-center">
            <span className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>Account Number</span>
            <span className={`font-medium ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>{billingRecord.applicationId}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>Billing Status</span>
            <span className={`font-medium ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>{billingRecord.status}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>Billing Day</span>
            <span className={`font-medium ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>{billingRecord.billingDay === 0 ? 'Every end of month' : (billingRecord.billingDay || '-')}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>Plan</span>
            <span className={`font-medium ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>{billingRecord.plan || ''}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>Account Balance</span>
            <span className={`font-medium ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>₱{billingRecord.accountBalance || billingRecord.balance || '0.00'}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>Total Paid</span>
            <span className={`font-medium ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>₱{billingRecord.totalPaid || '0.00'}</span>
          </div>
        </div>
      </div>

      <div className={`border-t ${
        isDarkMode ? 'border-gray-700' : 'border-gray-200'
      }`}></div>

      <div className="flex-1 overflow-y-auto">
        <div className={`border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <button
            onClick={() => toggleSection('invoices')}
            className={`w-full px-6 py-4 flex items-center justify-between text-left transition-colors ${
              isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className={`font-medium ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Related Invoices</span>
              <span className={`text-xs px-2 py-1 rounded ${
                isDarkMode
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-300 text-gray-900'
              }`}>0</span>
            </div>
            {expandedSections.invoices ? (
              <ChevronDown size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
            ) : (
              <ChevronRight size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
            )}
          </button>

          {expandedSections.invoices && (
            <div className="px-6 pb-4">
              <div className={`text-center py-8 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-600'
              }`}>No items</div>
            </div>
          )}
        </div>

        <div className={`border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <button
            onClick={() => toggleSection('paymentPortalLogs')}
            className={`w-full px-6 py-4 flex items-center justify-between text-left transition-colors ${
              isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className={`font-medium ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Related Payment Portal Logs</span>
              <span className={`text-xs px-2 py-1 rounded ${
                isDarkMode
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-300 text-gray-900'
              }`}>0</span>
            </div>
            {expandedSections.paymentPortalLogs ? (
              <ChevronDown size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
            ) : (
              <ChevronRight size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
            )}
          </button>

          {expandedSections.paymentPortalLogs && (
            <div className="px-6 pb-4">
              <div className={`text-center py-8 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-600'
              }`}>No items</div>
            </div>
          )}
        </div>

        <div className={`border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <button
            onClick={() => toggleSection('transactions')}
            className={`w-full px-6 py-4 flex items-center justify-between text-left transition-colors ${
              isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className={`font-medium ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Related Transactions</span>
              <span className={`text-xs px-2 py-1 rounded ${
                isDarkMode
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-300 text-gray-900'
              }`}>0</span>
            </div>
            {expandedSections.transactions ? (
              <ChevronDown size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
            ) : (
              <ChevronRight size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
            )}
          </button>

          {expandedSections.transactions && (
            <div className="px-6 pb-4">
              <div className={`text-center py-8 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-600'
              }`}>No items</div>
              <div className="flex justify-end">
                <button className={isDarkMode
                  ? 'text-red-400 hover:text-red-300 text-sm'
                  : 'text-red-600 hover:text-red-700 text-sm'
                }>Add</button>
              </div>
            </div>
          )}
        </div>

        <div className={`border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <button
            onClick={() => toggleSection('onlineStatus')}
            className={`w-full px-6 py-4 flex items-center justify-between text-left transition-colors ${
              isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className={`font-medium ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Related Online Status</span>
              <span className={`text-xs px-2 py-1 rounded ${
                isDarkMode
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-300 text-gray-900'
              }`}>{defaultOnlineStatus.length}</span>
            </div>
            {expandedSections.onlineStatus ? (
              <ChevronDown size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
            ) : (
              <ChevronRight size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
            )}
          </button>

          {expandedSections.onlineStatus && (
            <div className="px-6 pb-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`border-b ${
                      isDarkMode ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                      <th className={`text-left py-2 font-medium ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>Status</th>
                      <th className={`text-left py-2 font-medium ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>Account No.</th>
                      <th className={`text-left py-2 font-medium ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>Username</th>
                      <th className={`text-left py-2 font-medium ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>Affiliate</th>
                      <th className={`text-left py-2 font-medium ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>SPLYNX ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {defaultOnlineStatus.map((record) => (
                      <tr key={record.id} className={`border-b ${
                        isDarkMode ? 'border-gray-800' : 'border-gray-200'
                      }`}>
                        <td className="py-2 text-green-400">{record.status}</td>
                        <td className="py-2 text-red-400">{record.accountNo}</td>
                        <td className={`py-2 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>{record.username}</td>
                        <td className={`py-2 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>{record.group}</td>
                        <td className={`py-2 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>{record.splynxId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end mt-4">
                <button className={isDarkMode
                  ? 'text-red-400 hover:text-red-300 text-sm'
                  : 'text-red-600 hover:text-red-700 text-sm'
                }>Expand</button>
              </div>
            </div>
          )}
        </div>

        <div className={`border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <button
            onClick={() => toggleSection('staggeredInstallations')}
            className={`w-full px-6 py-4 flex items-center justify-between text-left transition-colors ${
              isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className={`font-medium ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Related Staggered</span>
              <span className={`text-xs px-2 py-1 rounded ${
                isDarkMode
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-300 text-gray-900'
              }`}>0</span>
            </div>
            {expandedSections.staggeredInstallations ? (
              <ChevronDown size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
            ) : (
              <ChevronRight size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
            )}
          </button>

          {expandedSections.staggeredInstallations && (
            <div className="px-6 pb-4">
              <div className={`text-center py-8 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-600'
              }`}>No items</div>
              <div className="flex justify-end">
                <button 
                  onClick={handleStaggeredInstallationAdd}
                  className={isDarkMode
                    ? 'text-red-400 hover:text-red-300 text-sm'
                    : 'text-red-600 hover:text-red-700 text-sm'
                  }
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={`border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <button
            onClick={() => toggleSection('advancedPayments')}
            className={`w-full px-6 py-4 flex items-center justify-between text-left transition-colors ${
              isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className={`font-medium ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Related Advanced Payments</span>
              <span className={`text-xs px-2 py-1 rounded ${
                isDarkMode
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-300 text-gray-900'
              }`}>0</span>
            </div>
            {expandedSections.advancedPayments ? (
              <ChevronDown size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
            ) : (
              <ChevronRight size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
            )}
          </button>

          {expandedSections.advancedPayments && (
            <div className="px-6 pb-4">
              <div className={`text-center py-8 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-600'
              }`}>No items</div>
              <div className="flex justify-end">
                <button className={isDarkMode
                  ? 'text-red-400 hover:text-red-300 text-sm'
                  : 'text-red-600 hover:text-red-700 text-sm'
                }>Add</button>
              </div>
            </div>
          )}
        </div>

        <div className={`border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <button
            onClick={() => toggleSection('discounts')}
            className={`w-full px-6 py-4 flex items-center justify-between text-left transition-colors ${
              isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className={`font-medium ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Related Discounts</span>
              <span className={`text-xs px-2 py-1 rounded ${
                isDarkMode
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-300 text-gray-900'
              }`}>0</span>
            </div>
            {expandedSections.discounts ? (
              <ChevronDown size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
            ) : (
              <ChevronRight size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
            )}
          </button>

          {expandedSections.discounts && (
            <div className="px-6 pb-4">
              <div className={`text-center py-8 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-600'
              }`}>No items</div>
              <div className="flex justify-end">
                <button 
                  onClick={handleDiscountAdd}
                  className={isDarkMode
                    ? 'text-red-400 hover:text-red-300 text-sm'
                    : 'text-red-600 hover:text-red-700 text-sm'
                  }
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
          <div key={section.key} className={`border-b ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <button
              onClick={() => toggleSection(section.key)}
              className={`w-full px-6 py-4 flex items-center justify-between text-left transition-colors ${
                isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className={`font-medium ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>{section.label}</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  isDarkMode
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-300 text-gray-900'
                }`}>0</span>
              </div>
              {expandedSections[section.key] ? (
                <ChevronDown size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
              ) : (
                <ChevronRight size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
              )}
            </button>

            {expandedSections[section.key] && (
              <div className="px-6 pb-4">
                <div className={`text-center py-8 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-600'
                }`}>No items</div>
                <div className="flex justify-end">
                  <button className={isDarkMode
                    ? 'text-red-400 hover:text-red-300 text-sm'
                    : 'text-red-600 hover:text-red-700 text-sm'
                  }>Add</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <TransactConfirmationModal
        isOpen={showTransactModal}
        onConfirm={handleTransactConfirm}
        onCancel={handleTransactCancel}
        amount={`₱${billingRecord.accountBalance || '0.00'}`}
        description={`Transaction for ${billingRecord.customerName} - Account: ${billingRecord.applicationId}`}
        billingRecord={billingRecord}
      />

      <TransactionFormModal
        isOpen={showTransactionFormModal}
        onClose={handleTransactionFormClose}
        onSave={handleTransactionFormSave}
        billingRecord={billingRecord}
      />

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

      {showSORequestConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 max-w-md w-full mx-4 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h3 className={`text-xl font-semibold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Create Service Order Request</h3>
            <p className={`mb-6 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Do you want to create a service order request for account <span className={`font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>{billingRecord.applicationId}</span>?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleSORequestCancel}
                className={`px-4 py-2 rounded transition-colors ${
                  isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-300 hover:bg-gray-400 text-gray-900'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSORequestConfirm}
                className="px-4 py-2 rounded transition-colors text-white"
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
              >
                Yes, Continue
              </button>
            </div>
          </div>
        </div>
      )}

      <SORequestFormModal
        isOpen={showSORequestFormModal}
        onClose={handleSORequestFormClose}
        onSave={handleSORequestFormSave}
        customerData={{
          accountNo: billingRecord.applicationId,
          dateInstalled: billingRecord.dateInstalled || '',
          fullName: billingRecord.customerName,
          contactNumber: billingRecord.contactNumber || '',
          plan: billingRecord.plan || '',
          provider: billingRecord.provider || '',
          username: billingRecord.username || '',
          emailAddress: billingRecord.emailAddress || billingRecord.email || ''
        }}
      />
    </div>
  );
};

export default BillingDetails;
