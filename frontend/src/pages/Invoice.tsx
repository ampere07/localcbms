import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import InvoiceDetails from '../components/InvoiceDetails';
import { invoiceService, InvoiceRecord } from '../services/invoiceService';
import { settingsColorPaletteService, ColorPalette } from '../services/settingsColorPaletteService';

interface InvoiceRecordUI {
  id: string;
  accountNo: string;
  invoiceDate: string;
  invoiceBalance: number;
  serviceCharge: number;
  rebate: number;
  discounts: number;
  staggered: number;
  totalAmount: number;
  receivedPayment: number;
  dueDate: string;
  status: string;
  paymentPortalLogRef?: string;
  transactionId?: string;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
  fullName: string;
  contactNumber: string;
  emailAddress: string;
  address: string;
  plan: string;
  dateInstalled?: string;
  barangay?: string;
  city?: string;
  region?: string;
  provider?: string;
  invoiceNo?: string;
  totalAmountDue?: number;
  invoicePayment?: number;
  paymentMethod?: string;
  dateProcessed?: string;
  processedBy?: string;
  remarks?: string;
  vat?: number;
  amountDue?: number;
  balanceFromPreviousBill?: number;
  paymentReceived?: number;
  remainingBalance?: number;
  monthlyServiceFee?: number;
  staggeredPaymentsCount?: number;
  invoiceStatus: string;
}

const Invoice: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sidebarWidth, setSidebarWidth] = useState<number>(256);
  const [isResizingSidebar, setIsResizingSidebar] = useState<boolean>(false);
  const sidebarStartXRef = useRef<number>(0);
  const sidebarStartWidthRef = useRef<number>(0);
  const [selectedRecord, setSelectedRecord] = useState<InvoiceRecordUI | null>(null);
  const [invoiceRecords, setInvoiceRecords] = useState<InvoiceRecordUI[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [colorPalette, setColorPalette] = useState<ColorPalette | null>(null);
  const [userRole, setUserRole] = useState<string>('');

  const allColumns = [
    { key: 'id', label: 'ID', width: 'min-w-20' },
    { key: 'accountNo', label: 'Account Number', width: 'min-w-36' },
    { key: 'invoiceDate', label: 'Invoice Date', width: 'min-w-36' },
    { key: 'invoiceBalance', label: 'Invoice Balance', width: 'min-w-36' },
    { key: 'serviceCharge', label: 'Service Charge', width: 'min-w-36' },
    { key: 'rebate', label: 'Rebate', width: 'min-w-28' },
    { key: 'discounts', label: 'Discounts', width: 'min-w-28' },
    { key: 'staggered', label: 'Staggered', width: 'min-w-28' },
    { key: 'totalAmount', label: 'Total Amount', width: 'min-w-32' },
    { key: 'receivedPayment', label: 'Received Payment', width: 'min-w-36' },
    { key: 'dueDate', label: 'Due Date', width: 'min-w-32' },
    { key: 'status', label: 'Status', width: 'min-w-28' },
    { key: 'paymentPortalLogRef', label: 'Payment Portal Log Ref', width: 'min-w-44' },
    { key: 'transactionId', label: 'Transaction ID', width: 'min-w-36' },
    { key: 'createdAt', label: 'Created At', width: 'min-w-40' },
    { key: 'createdBy', label: 'Created By', width: 'min-w-32' },
    { key: 'updatedAt', label: 'Updated At', width: 'min-w-40' },
    { key: 'updatedBy', label: 'Updated By', width: 'min-w-32' },
    { key: 'fullName', label: 'Full Name', width: 'min-w-40' },
    { key: 'contactNumber', label: 'Contact Number', width: 'min-w-36' },
    { key: 'emailAddress', label: 'Email Address', width: 'min-w-48' },
    { key: 'address', label: 'Address', width: 'min-w-56' },
    { key: 'plan', label: 'Plan', width: 'min-w-32' },
    { key: 'dateInstalled', label: 'Date Installed', width: 'min-w-32' },
    { key: 'barangay', label: 'Barangay', width: 'min-w-32' },
    { key: 'city', label: 'City', width: 'min-w-32' },
    { key: 'region', label: 'Region', width: 'min-w-32' },
  ];

  const customerColumns = [
    { key: 'id', label: 'ID', width: 'min-w-20' },
    { key: 'invoiceDate', label: 'Invoice Date', width: 'min-w-36' },
    { key: 'dueDate', label: 'Due Date', width: 'min-w-32' },
    { key: 'totalAmount', label: 'Total Amount', width: 'min-w-32' },
    { key: 'status', label: 'Status', width: 'min-w-28' },
  ];

  const displayColumns = userRole === 'customer' ? customerColumns : allColumns;

  const dateItems: Array<{ date: string; id: string }> = [{ date: 'All', id: '' }];

  useEffect(() => {
    const checkDarkMode = () => {
      const theme = localStorage.getItem('theme');
      setIsDarkMode(theme === 'dark' || theme === null);
    };

    checkDarkMode();

    const observer = new MutationObserver(() => {
      checkDarkMode();
    });

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
        console.error('Error parsing auth data:', error);
      }
    }
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
    fetchInvoiceData();
  }, []);

  const fetchInvoiceData = async () => {
    try {
      setIsLoading(true);
      const data = await invoiceService.getAllInvoices();
      
      const transformedData: InvoiceRecordUI[] = data.map(record => ({
        id: record.id.toString(),
        accountNo: record.account_no || record.account?.account_no || '',
        invoiceDate: new Date(record.invoice_date).toLocaleDateString(),
        invoiceBalance: Number(record.invoice_balance) || 0,
        serviceCharge: Number(record.service_charge) || 0,
        rebate: Number(record.rebate) || 0,
        discounts: Number(record.discounts) || 0,
        staggered: Number(record.staggered) || 0,
        totalAmount: Number(record.total_amount) || 0,
        receivedPayment: Number(record.received_payment) || 0,
        dueDate: new Date(record.due_date).toLocaleDateString(),
        status: record.status,
        paymentPortalLogRef: record.payment_portal_log_ref,
        transactionId: record.transaction_id,
        createdAt: record.created_at ? new Date(record.created_at).toLocaleString() : '',
        createdBy: record.created_by,
        updatedAt: record.updated_at ? new Date(record.updated_at).toLocaleString() : '',
        updatedBy: record.updated_by,
        fullName: record.account?.customer?.full_name || 'Unknown',
        contactNumber: record.account?.customer?.contact_number_primary || 'N/A',
        emailAddress: record.account?.customer?.email_address || 'N/A',
        address: record.account?.customer?.address || 'N/A',
        plan: record.account?.customer?.desired_plan || 'No Plan',
        dateInstalled: record.account?.date_installed ? new Date(record.account.date_installed).toLocaleDateString() : '',
        barangay: record.account?.customer?.barangay || '',
        city: record.account?.customer?.city || '',
        region: record.account?.customer?.region || '',
        provider: 'SWITCH',
        invoiceNo: '2508182' + record.id.toString(),
        totalAmountDue: Number(record.total_amount) || 0,
        invoicePayment: Number(record.received_payment) || 0,
        paymentMethod: record.received_payment > 0 ? 'Payment Received' : 'N/A',
        dateProcessed: record.received_payment > 0 && record.updated_at ? new Date(record.updated_at).toLocaleDateString() : undefined,
        processedBy: record.received_payment > 0 ? record.updated_by : undefined,
        remarks: 'System Generated',
        vat: 0,
        amountDue: (Number(record.total_amount) || 0) - (Number(record.received_payment) || 0),
        balanceFromPreviousBill: 0,
        paymentReceived: Number(record.received_payment) || 0,
        remainingBalance: (Number(record.total_amount) || 0) - (Number(record.received_payment) || 0),
        monthlyServiceFee: Number(record.invoice_balance) || 0,
        staggeredPaymentsCount: 0,
        invoiceStatus: record.status,
      }));

      setInvoiceRecords(transformedData);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch Invoice records:', err);
      setError('Failed to load Invoice records. Please try again.');
      setInvoiceRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRecords = invoiceRecords.filter(record => {
    const matchesDate = selectedDate === 'All' || record.invoiceDate === selectedDate;
    const matchesSearch = searchQuery === '' || 
                         record.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         record.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         record.accountNo.includes(searchQuery) ||
                         record.id.includes(searchQuery) ||
                         record.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (record.transactionId && record.transactionId.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesDate && matchesSearch;
  });

  const handleRowClick = (record: InvoiceRecordUI) => {
    if (userRole !== 'customer') {
      setSelectedRecord(record);
    }
  };

  const handleCloseDetails = () => {
    setSelectedRecord(null);
  };

  const handleRefresh = async () => {
    await fetchInvoiceData();
  };

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

  const renderCellValue = (record: InvoiceRecordUI, columnKey: string) => {
    switch (columnKey) {
      case 'id':
        return record.id;
      case 'accountNo':
        return <span className="text-red-400">{record.accountNo}</span>;
      case 'invoiceDate':
        return record.invoiceDate;
      case 'invoiceBalance':
        return `₱ ${record.invoiceBalance.toFixed(2)}`;
      case 'serviceCharge':
        return `₱ ${record.serviceCharge.toFixed(2)}`;
      case 'rebate':
        return `₱ ${record.rebate.toFixed(2)}`;
      case 'discounts':
        return `₱ ${record.discounts.toFixed(2)}`;
      case 'staggered':
        return `₱ ${record.staggered.toFixed(2)}`;
      case 'totalAmount':
        return `₱ ${record.totalAmount.toFixed(2)}`;
      case 'receivedPayment':
        return `₱ ${record.receivedPayment.toFixed(2)}`;
      case 'dueDate':
        return record.dueDate;
      case 'status':
        return (
          <span className={`${
            record.status === 'Unpaid' ? 'text-red-500' : 
            record.status === 'Paid' ? 'text-green-500' : 
            'text-yellow-500'
          }`}>
            {record.status}
          </span>
        );
      case 'paymentPortalLogRef':
        return record.paymentPortalLogRef || 'NULL';
      case 'transactionId':
        return record.transactionId || 'NULL';
      case 'createdAt':
        return record.createdAt || '-';
      case 'createdBy':
        return record.createdBy || '-';
      case 'updatedAt':
        return record.updatedAt || '-';
      case 'updatedBy':
        return record.updatedBy || '-';
      case 'fullName':
        return record.fullName || '-';
      case 'contactNumber':
        return record.contactNumber || '-';
      case 'emailAddress':
        return record.emailAddress || '-';
      case 'address':
        return <span title={record.address}>{record.address || '-'}</span>;
      case 'plan':
        return record.plan || '-';
      case 'dateInstalled':
        return record.dateInstalled || '-';
      case 'barangay':
        return record.barangay || '-';
      case 'city':
        return record.city || '-';
      case 'region':
        return record.region || '-';
      default:
        return '-';
    }
  };

  return (
    <div className={`h-full flex overflow-hidden ${
      isDarkMode ? 'bg-gray-950' : 'bg-gray-50'
    }`}>
      {userRole !== 'customer' && (
        <div className={`border-r flex-shrink-0 flex flex-col relative ${
          isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
        }`} style={{ width: `${sidebarWidth}px` }}>
        <div className={`p-4 border-b flex-shrink-0 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <h2 className={`text-lg font-semibold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Invoice</h2>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {dateItems.map((item, index) => (
            <button
              key={index}
              onClick={() => setSelectedDate(item.date)}
              className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${
                isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
              } ${
                selectedDate === item.date
                  ? ''
                  : isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}
              style={selectedDate === item.date ? {
                backgroundColor: colorPalette?.primary ? `${colorPalette.primary}33` : 'rgba(249, 115, 22, 0.2)',
                color: colorPalette?.primary || '#fb923c'
              } : {}}
            >
              <span className="text-sm font-medium flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                {item.date}
              </span>
            </button>
          ))}
        </div>

        <div
          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize transition-colors z-10"
          style={{
            backgroundColor: isResizingSidebar ? (colorPalette?.primary || '#ea580c') : 'transparent'
          }}
          onMouseEnter={(e) => {
            if (!isResizingSidebar && colorPalette?.primary) {
              e.currentTarget.style.backgroundColor = colorPalette.primary;
            }
          }}
          onMouseLeave={(e) => {
            if (!isResizingSidebar) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
          onMouseDown={handleMouseDownSidebarResize}
        />
        </div>
      )}

      <div className={`flex-1 overflow-hidden ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="flex flex-col h-full">
          <div className={`p-4 border-b flex-shrink-0 ${
            isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center space-x-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search Invoice records..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full rounded pl-10 pr-4 py-2 focus:outline-none focus:ring-1 focus:border ${
                    isDarkMode
                      ? 'bg-gray-800 text-white border border-gray-700'
                      : 'bg-white text-gray-900 border border-gray-300'
                  }`}
                  style={{
                    '--tw-ring-color': colorPalette?.primary || '#ea580c'
                  } as React.CSSProperties}
                  onFocus={(e) => {
                    if (colorPalette?.primary) {
                      e.currentTarget.style.borderColor = colorPalette.primary;
                    }
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = isDarkMode ? '#374151' : '#d1d5db';
                  }}
                />
                <Search className={`absolute left-3 top-2.5 h-4 w-4 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
              </div>
              {userRole === 'customer' && (
                <button
                  className="text-white px-4 py-2 rounded text-sm transition-colors"
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
                  Pay Now
                </button>
              )}
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="text-white px-4 py-2 rounded text-sm transition-colors disabled:bg-gray-600"
                style={{
                  backgroundColor: isLoading ? '#4b5563' : (colorPalette?.primary || '#ea580c')
                }}
                onMouseEnter={(e) => {
                  if (!isLoading && colorPalette?.accent) {
                    e.currentTarget.style.backgroundColor = colorPalette.accent;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading && colorPalette?.primary) {
                    e.currentTarget.style.backgroundColor = colorPalette.primary;
                  }
                }}
              >
                {isLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto">
              {isLoading ? (
                <div className={`px-4 py-12 text-center ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <div className="animate-pulse flex flex-col items-center">
                    <div className={`h-4 w-1/3 rounded mb-4 ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
                    }`}></div>
                    <div className={`h-4 w-1/2 rounded ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
                    }`}></div>
                  </div>
                  <p className="mt-4">Loading Invoice records...</p>
                </div>
              ) : error ? (
                <div className={`px-4 py-12 text-center ${
                  isDarkMode ? 'text-red-400' : 'text-red-600'
                }`}>
                  <p>{error}</p>
                  <button 
                    onClick={handleRefresh}
                    className={`mt-4 px-4 py-2 rounded ${
                      isDarkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                    }`}>
                    Retry
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto overflow-y-hidden">
                  <table className="w-max min-w-full text-sm border-separate border-spacing-0">
                    <thead>
                      <tr className={`border-b sticky top-0 z-10 ${
                        isDarkMode
                          ? 'border-gray-700 bg-gray-800'
                          : 'border-gray-200 bg-gray-100'
                      }`}>
                        {displayColumns.map((column, index) => (
                          <th
                            key={column.key}
                            className={`text-left py-3 px-3 font-normal ${column.width} whitespace-nowrap ${
                              isDarkMode ? 'text-gray-400 bg-gray-800' : 'text-gray-600 bg-gray-100'
                            } ${
                              index < displayColumns.length - 1 ? (isDarkMode ? 'border-r border-gray-700' : 'border-r border-gray-200') : ''
                            }`}
                          >
                            {column.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.length > 0 ? (
                        filteredRecords.map((record) => (
                          <tr 
                            key={record.id} 
                            className={`border-b transition-colors ${
                              isDarkMode
                                ? 'border-gray-800 hover:bg-gray-900'
                                : 'border-gray-200 hover:bg-gray-50'
                            } ${
                              selectedRecord?.id === record.id ? (isDarkMode ? 'bg-gray-800' : 'bg-gray-100') : ''
                            } ${
                              userRole === 'customer' ? '' : 'cursor-pointer'
                            }`}
                            onClick={() => handleRowClick(record)}
                          >
                            {displayColumns.map((column, index) => (
                              <td
                                key={column.key}
                                className={`py-4 px-3 whitespace-nowrap ${
                                  isDarkMode ? 'text-white' : 'text-gray-900'
                                } ${
                                  index < displayColumns.length - 1 ? (isDarkMode ? 'border-r border-gray-800' : 'border-r border-gray-200') : ''
                                }`}
                              >
                                {renderCellValue(record, column.key)}
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={displayColumns.length} className={`px-4 py-12 text-center ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            No Invoice records found matching your filters
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

      {selectedRecord && userRole !== 'customer' && (
        <div className="flex-shrink-0 overflow-hidden">
          <InvoiceDetails invoiceRecord={selectedRecord} />
        </div>
      )}
    </div>
  );
};

export default Invoice;
