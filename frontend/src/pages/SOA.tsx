import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import SOADetails from '../components/SOADetails';
import { soaService, SOARecord } from '../services/soaService';
import { settingsColorPaletteService, ColorPalette } from '../services/settingsColorPaletteService';

interface SOARecordUI {
  id: string;
  accountNo: string;
  statementDate: string;
  balanceFromPreviousBill: number;
  paymentReceivedPrevious: number;
  remainingBalancePrevious: number;
  monthlyServiceFee: number;
  serviceCharge: number;
  rebate: number;
  discounts: number;
  staggered: number;
  vat: number;
  dueDate: string;
  amountDue: number;
  totalAmountDue: number;
  printLink?: string;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
  fullName: string;
  contactNumber: string;
  emailAddress: string;
  address: string;
  plan: string;
  dateInstalled: string;
  barangay?: string;
  city?: string;
  region?: string;
  provider?: string;
  statementNo?: string;
  paymentReceived?: number;
  remainingBalance?: number;
  deliveryStatus?: string;
  deliveryDate?: string;
  deliveredBy?: string;
  deliveryRemarks?: string;
  deliveryProof?: string;
  modifiedBy?: string;
  modifiedDate?: string;
}

const SOA: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sidebarWidth, setSidebarWidth] = useState<number>(256);
  const [isResizingSidebar, setIsResizingSidebar] = useState<boolean>(false);
  const sidebarStartXRef = useRef<number>(0);
  const sidebarStartWidthRef = useRef<number>(0);
  const [selectedRecord, setSelectedRecord] = useState<SOARecordUI | null>(null);
  const [soaRecords, setSOARecords] = useState<SOARecordUI[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [colorPalette, setColorPalette] = useState<ColorPalette | null>(null);

  const allColumns = [
    { key: 'id', label: 'ID', width: 'min-w-20' },
    { key: 'accountNo', label: 'Account Number', width: 'min-w-36' },
    { key: 'statementDate', label: 'Statement Date', width: 'min-w-36' },
    { key: 'balanceFromPreviousBill', label: 'Balance from Previous Bill', width: 'min-w-48' },
    { key: 'paymentReceivedPrevious', label: 'Payment Received Previous', width: 'min-w-48' },
    { key: 'remainingBalancePrevious', label: 'Remaining Balance Previous', width: 'min-w-48' },
    { key: 'monthlyServiceFee', label: 'Monthly Service Fee', width: 'min-w-40' },
    { key: 'serviceCharge', label: 'Service Charge', width: 'min-w-36' },
    { key: 'rebate', label: 'Rebate', width: 'min-w-28' },
    { key: 'discounts', label: 'Discounts', width: 'min-w-28' },
    { key: 'staggered', label: 'Staggered', width: 'min-w-28' },
    { key: 'vat', label: 'VAT', width: 'min-w-28' },
    { key: 'dueDate', label: 'Due Date', width: 'min-w-32' },
    { key: 'amountDue', label: 'Amount Due', width: 'min-w-32' },
    { key: 'totalAmountDue', label: 'Total Amount Due', width: 'min-w-36' },
    { key: 'printLink', label: 'Print Link', width: 'min-w-28' },
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
    fetchSOAData();
  }, []);

  const fetchSOAData = async () => {
    try {
      setIsLoading(true);
      const data = await soaService.getAllStatements();
      
      const transformedData: SOARecordUI[] = data.map(record => ({
        id: record.id.toString(),
        accountNo: record.account_no || record.account?.account_no || '',
        statementDate: new Date(record.statement_date).toLocaleDateString(),
        balanceFromPreviousBill: Number(record.balance_from_previous_bill) || 0,
        paymentReceivedPrevious: Number(record.payment_received_previous) || 0,
        remainingBalancePrevious: Number(record.remaining_balance_previous) || 0,
        monthlyServiceFee: Number(record.monthly_service_fee) || 0,
        serviceCharge: Number(record.service_charge) || 0,
        rebate: Number(record.rebate) || 0,
        discounts: Number(record.discounts) || 0,
        staggered: Number(record.staggered) || 0,
        vat: Number(record.vat) || 0,
        dueDate: new Date(record.due_date).toLocaleDateString(),
        amountDue: Number(record.amount_due) || 0,
        totalAmountDue: Number(record.total_amount_due) || 0,
        printLink: record.print_link,
        createdAt: record.created_at ? new Date(record.created_at).toLocaleString() : '',
        createdBy: record.created_by,
        updatedAt: record.updated_at ? new Date(record.updated_at).toLocaleString() : '',
        updatedBy: record.updated_by,
        fullName: record.account?.customer?.full_name || 'Unknown',
        contactNumber: record.account?.customer?.contact_number_primary || 'N/A',
        emailAddress: record.account?.customer?.email_address || 'N/A',
        address: record.account?.customer?.address || 'N/A',
        plan: record.account?.customer?.desired_plan || 'No Plan',
        dateInstalled: record.account?.date_installed ? new Date(record.account.date_installed).toLocaleDateString() : 'N/A',
        barangay: record.account?.customer?.barangay || '',
        city: record.account?.customer?.city || '',
        region: record.account?.customer?.region || '',
        provider: 'SWITCH',
        statementNo: '2509180' + record.id.toString(),
        paymentReceived: Number(record.payment_received_previous) || 0,
        remainingBalance: Number(record.remaining_balance_previous) || 0,
        deliveryStatus: undefined,
        deliveryDate: undefined,
        deliveredBy: undefined,
        deliveryRemarks: undefined,
        deliveryProof: undefined,
        modifiedBy: record.updated_by,
        modifiedDate: record.updated_at ? new Date(record.updated_at).toLocaleDateString() : undefined,
      }));

      setSOARecords(transformedData);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch SOA records:', err);
      setError('Failed to load SOA records. Please try again.');
      setSOARecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRecords = soaRecords.filter(record => {
    const matchesDate = selectedDate === 'All' || record.statementDate === selectedDate;
    const matchesSearch = searchQuery === '' || 
                         record.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         record.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         record.accountNo.includes(searchQuery) ||
                         record.id.includes(searchQuery);
    
    return matchesDate && matchesSearch;
  });

  const handleRowClick = (record: SOARecordUI) => {
    setSelectedRecord(record);
  };

  const handleCloseDetails = () => {
    setSelectedRecord(null);
  };

  const handleRefresh = async () => {
    await fetchSOAData();
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

  const renderCellValue = (record: SOARecordUI, columnKey: string) => {
    switch (columnKey) {
      case 'id':
        return record.id;
      case 'accountNo':
        return <span className="text-red-400">{record.accountNo}</span>;
      case 'statementDate':
        return record.statementDate;
      case 'balanceFromPreviousBill':
        return `₱ ${record.balanceFromPreviousBill.toFixed(2)}`;
      case 'paymentReceivedPrevious':
        return `₱ ${record.paymentReceivedPrevious.toFixed(2)}`;
      case 'remainingBalancePrevious':
        return `₱ ${record.remainingBalancePrevious.toFixed(2)}`;
      case 'monthlyServiceFee':
        return `₱ ${record.monthlyServiceFee.toFixed(2)}`;
      case 'serviceCharge':
        return `₱ ${record.serviceCharge.toFixed(2)}`;
      case 'rebate':
        return `₱ ${record.rebate.toFixed(2)}`;
      case 'discounts':
        return `₱ ${record.discounts.toFixed(2)}`;
      case 'staggered':
        return `₱ ${record.staggered.toFixed(2)}`;
      case 'vat':
        return `₱ ${record.vat.toFixed(2)}`;
      case 'dueDate':
        return record.dueDate;
      case 'amountDue':
        return `₱ ${record.amountDue.toFixed(2)}`;
      case 'totalAmountDue':
        return `₱ ${record.totalAmountDue.toFixed(2)}`;
      case 'printLink':
        return record.printLink || 'NULL';
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
      <div className={`border-r flex-shrink-0 flex flex-col relative ${
        isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
      }`} style={{ width: `${sidebarWidth}px` }}>
        <div className={`p-4 border-b flex-shrink-0 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <h2 className={`text-lg font-semibold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>SOA</h2>
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
                  placeholder="Search SOA records..."
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
                  <p className="mt-4">Loading SOA records...</p>
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
                        {allColumns.map((column, index) => (
                          <th
                            key={column.key}
                            className={`text-left py-3 px-3 font-normal ${column.width} whitespace-nowrap ${
                              isDarkMode ? 'text-gray-400 bg-gray-800' : 'text-gray-600 bg-gray-100'
                            } ${
                              index < allColumns.length - 1 ? (isDarkMode ? 'border-r border-gray-700' : 'border-r border-gray-200') : ''
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
                            className={`border-b cursor-pointer transition-colors ${
                              isDarkMode
                                ? 'border-gray-800 hover:bg-gray-900'
                                : 'border-gray-200 hover:bg-gray-50'
                            } ${
                              selectedRecord?.id === record.id ? (isDarkMode ? 'bg-gray-800' : 'bg-gray-100') : ''
                            }`}
                            onClick={() => handleRowClick(record)}
                          >
                            {allColumns.map((column, index) => (
                              <td
                                key={column.key}
                                className={`py-4 px-3 whitespace-nowrap ${
                                  isDarkMode ? 'text-white' : 'text-gray-900'
                                } ${
                                  index < allColumns.length - 1 ? (isDarkMode ? 'border-r border-gray-800' : 'border-r border-gray-200') : ''
                                }`}
                              >
                                {renderCellValue(record, column.key)}
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={allColumns.length} className={`px-4 py-12 text-center ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            No SOA records found matching your filters
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

      {selectedRecord && (
        <div className="flex-shrink-0 overflow-hidden">
          <SOADetails soaRecord={selectedRecord} />
        </div>
      )}
    </div>
  );
};

export default SOA;
