import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Edit2, Trash2, Loader2, RefreshCw, ChevronsLeft, ChevronsRight, X, Filter } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { settingsColorPaletteService, ColorPalette } from '../services/settingsColorPaletteService';
import { useWorkOrderStore } from '../store/workOrderStore';
import { WorkOrder } from '../types/workOrder';
import WorkOrderDetails from '../components/WorkOrderDetails';
import AssignWorkOrderModal from '../modals/AssignWorkOrderModal';
import pusher from '../services/pusherService';
import WorkOrderFunnelFilter, { FilterValues } from '../components/filters/WorkOrderFunnelFilter';

const WorkOrderPage: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [colorPalette, setColorPalette] = useState<ColorPalette | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const { workOrders, isLoading, fetchWorkOrders, fetchUpdates, error } = useWorkOrderStore();
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [deletingItems, setDeletingItems] = useState<Set<number>>(new Set());
  const [mobileView, setMobileView] = useState<'orders' | 'details'>('orders');

  const [isFunnelFilterOpen, setIsFunnelFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterValues>({});

  useEffect(() => {
    const saved = localStorage.getItem('workOrderFunnelFilters');
    if (saved) {
      try {
        setActiveFilters(JSON.parse(saved));
      } catch (err) {
        console.error('Failed to parse saved filters', err);
      }
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      // If we move to desktop view, ensure we are not stuck in mobile 'details' view
      if (window.innerWidth >= 768 && mobileView === 'details') {
        setMobileView('orders');
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileView]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [userRole, setUserRole] = useState<number | null>(null);
  const [userRoleName, setUserRoleName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const authData = localStorage.getItem('authData');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        setUserRole(parsed.role_id || parsed.roleId || null);
        setUserRoleName(parsed.role || parsed.role_name || '');
        setUserEmail(parsed.email_address || parsed.email || '');
        setUserName(`${parsed.first_name || ''} ${parsed.last_name || ''}`.trim() || parsed.username || '');
      } catch (e) { }
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
    const observer = new MutationObserver(() => {
      setIsDarkMode(localStorage.getItem('theme') !== 'light');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    setIsDarkMode(localStorage.getItem('theme') !== 'light');
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fetchWorkOrders(1, 1000, '', '');
  }, [fetchWorkOrders]);

  // Real-time updates via Pusher/Soketi
  useEffect(() => {
    let lastRefreshTime = 0;
    const DEBOUNCE_MS = 10000; // Minimum 10s between Pusher-triggered refreshes

    const handleUpdate = async (data: any) => {
      const now = Date.now();
      if (now - lastRefreshTime < DEBOUNCE_MS) {
        console.log('[WorkOrder Soketi] Skipping refresh (debounce)');
        return;
      }
      lastRefreshTime = now;
      console.log('[WorkOrder Soketi] Update received, refreshing:', data);
      try {
        await fetchWorkOrders(1, 1000, '', '');
        console.log('[WorkOrder Soketi] Data refreshed successfully');
      } catch (err) {
        console.error('[WorkOrder Soketi] Failed to refresh data:', err);
      }
    };

    const workOrderChannel = pusher.subscribe('work-orders');

    workOrderChannel.bind('pusher:subscription_succeeded', () => {
      console.log('[WorkOrder Soketi] Successfully subscribed to work-orders channel');
    });
    workOrderChannel.bind('pusher:subscription_error', (error: any) => {
      console.error('[WorkOrder Soketi] Subscription error:', error);
    });

    workOrderChannel.bind('work-order-updated', handleUpdate);

    // Re-subscribe on reconnection
    const stateHandler = (states: { previous: string; current: string }) => {
      console.log(`[WorkOrder Soketi] Connection state: ${states.previous} -> ${states.current}`);
      if (states.current === 'connected' && workOrderChannel.subscribed !== true) {
        pusher.subscribe('work-orders');
      }
    };
    pusher.connection.bind('state_change', stateHandler);

    return () => {
      workOrderChannel.unbind('pusher:subscription_succeeded');
      workOrderChannel.unbind('pusher:subscription_error');
      workOrderChannel.unbind('work-order-updated', handleUpdate);
      pusher.connection.unbind('state_change', stateHandler);
      pusher.unsubscribe('work-orders');
    };
  }, [fetchWorkOrders]);

  // Polling for updates every 3 seconds - Incremental fetch
  useEffect(() => {
    const POLLING_INTERVAL = 3000; // 3 seconds
    const intervalId = setInterval(async () => {
      console.log('[WorkOrder Page] Polling for updates...');
      try {
        await fetchUpdates('');
      } catch (err) {
        console.error('[WorkOrder Page] Polling failed:', err);
      }
    }, POLLING_INTERVAL);

    return () => clearInterval(intervalId);
  }, [fetchUpdates]);


  const handleDelete = async (workOrder: WorkOrder) => {
    if (!window.confirm(`⚠️ Are you sure you want to permanently delete this work order?`)) return;

    setDeletingItems(prev => new Set(prev).add(workOrder.id));
    try {
      const response = await fetch(`${API_BASE_URL}/work-orders/${workOrder.id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        await fetchWorkOrders(1, 1000, '', '');
      } else {
        alert('❌ Failed to delete work order');
      }
    } catch (error) {
      console.error('Error deleting work order:', error);
    } finally {
      setDeletingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(workOrder.id);
        return newSet;
      });
    }
  };

  const handleEdit = (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder);
    if (window.innerWidth >= 768) {
      setMobileView('orders');
    } else {
      setMobileView('details');
    }
  };

  const handleMobileBack = () => {
    if (mobileView === 'details') {
      setSelectedWorkOrder(null);
      setMobileView('orders');
    }
  };

  const handleAddNew = () => {
    setSelectedWorkOrder(null);
    setShowAssignModal(true);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-PH', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  const applyFunnelFilters = (orders: WorkOrder[], filters: any): WorkOrder[] => {
    if (!filters || Object.keys(filters).length === 0) return orders;

    return orders.filter(order => {
      return Object.entries(filters).every(([key, filter]: [string, any]) => {
        let orderValue = (order as any)[key];
        
        let match = true;
        if (filter.type === 'text') {
          if (!filter.value) match = true;
          else {
            const value = String(orderValue || '').toLowerCase();
            match = value.includes(filter.value.toLowerCase());
          }
        } else if (filter.type === 'number') {
          const numValue = Number(orderValue);
          if (isNaN(numValue)) match = false;
          else if (filter.from !== undefined && filter.from !== '' && numValue < Number(filter.from)) match = false;
          else if (filter.to !== undefined && filter.to !== '' && numValue > Number(filter.to)) match = false;
          else match = true;
        } else if (filter.type === 'date') {
          if (!orderValue) match = false;
          else {
            const normalizeDate = (d: any, isEnd: boolean = false) => {
              let s = String(d).trim().replace(' ', 'T');
              if (s.length === 10) {
                s = isEnd ? `${s}T23:59:59.999` : `${s}T00:00:00`;
              }
              return new Date(s).getTime();
            };

            const orderTime = normalizeDate(orderValue);
            const fromTime = filter.from ? normalizeDate(filter.from) : null;
            const toTime = filter.to ? normalizeDate(filter.to, true) : null;

            if (fromTime && orderTime < fromTime) match = false;
            else if (toTime && orderTime > toTime) match = false;
            else match = true;
          }
        }

        return match;
      });
    });
  };

  const filteredWorkOrders = useMemo(() => {
    let filtered = workOrders;

    // Apply role-based filtering for OSP
    if (userRole === 6) {
      filtered = filtered.filter(wo => {
        // Find if user is assigned - assign_to can be either name or email
        const targetAssign = (wo.assign_to || '').toLowerCase();
        return targetAssign === userEmail.toLowerCase() || targetAssign === userName.toLowerCase();
      });
    }

    if (!searchQuery) return applyFunnelFilters(filtered, activeFilters);

    const normalizedQuery = searchQuery.toLowerCase().replace(/\s+/g, '');
    const preFiltered = filtered.filter(wo => {
      const checkValue = (val: any): boolean => {
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().replace(/\s+/g, '').includes(normalizedQuery);
      };

      return (
        checkValue(wo.instructions) ||
        checkValue(wo.report_to) ||
        checkValue(wo.assign_to) ||
        checkValue(wo.requested_by)
      );
    });

    return applyFunnelFilters(preFiltered, activeFilters);
  }, [workOrders, userRole, userEmail, userName, searchQuery, activeFilters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, itemsPerPage]);

  const totalPages = Math.ceil(filteredWorkOrders.length / itemsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Scroll to top on page change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage]);

  const paginatedWorkOrders = useMemo(() => {
    return filteredWorkOrders.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredWorkOrders, currentPage, itemsPerPage]);

  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    return (
      <div className={`border-t p-4 flex items-center justify-between ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className={`flex items-center gap-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className={`px-2 py-1 rounded border text-sm focus:outline-none ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>entries</span>
          </div>
          <span>
            Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredWorkOrders.length)}</span> of <span className="font-medium">{filteredWorkOrders.length}</span> results
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className={`px-2 py-1 rounded text-sm transition-colors ${currentPage === 1
              ? (isDarkMode ? 'text-gray-600 bg-gray-800 cursor-not-allowed' : 'text-gray-400 bg-gray-100 cursor-not-allowed')
              : (isDarkMode ? 'text-white bg-gray-700 hover:bg-gray-600' : 'text-gray-700 bg-white hover:bg-gray-50 border border-gray-300')
              }`}
            title="First Page"
          >
            <ChevronsLeft size={16} />
          </button>

          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded text-sm transition-colors ${currentPage === 1
              ? (isDarkMode ? 'text-gray-600 bg-gray-800 cursor-not-allowed' : 'text-gray-400 bg-gray-100 cursor-not-allowed')
              : (isDarkMode ? 'text-white bg-gray-700 hover:bg-gray-600' : 'text-gray-700 bg-white hover:bg-gray-50 border border-gray-300')
              }`}
          >
            Previous
          </button>

          <div className="flex items-center space-x-1">
            <span className={`px-2 text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Page {currentPage} of {totalPages}
            </span>
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded text-sm transition-colors ${currentPage === totalPages
              ? (isDarkMode ? 'text-gray-600 bg-gray-800 cursor-not-allowed' : 'text-gray-400 bg-gray-100 cursor-not-allowed')
              : (isDarkMode ? 'text-white bg-gray-700 hover:bg-gray-600' : 'text-gray-700 bg-white hover:bg-gray-50 border border-gray-300')
              }`}
          >
            Next
          </button>

          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className={`px-2 py-1 rounded text-sm transition-colors ${currentPage === totalPages
              ? (isDarkMode ? 'text-gray-600 bg-gray-800 cursor-not-allowed' : 'text-gray-400 bg-gray-100 cursor-not-allowed')
              : (isDarkMode ? 'text-white bg-gray-700 hover:bg-gray-600' : 'text-gray-700 bg-white hover:bg-gray-50 border border-gray-300')
              }`}
            title="Last Page"
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  const getStatusColor = (status?: string) => {
    if (!status) return isDarkMode ? 'text-gray-500' : 'text-gray-400';
    switch (status.toLowerCase()) {
      case 'completed': return 'text-green-500';
      case 'in progress': return 'text-blue-500';
      case 'failed':
      case 'cancelled': return 'text-red-500';
      case 'pending':
      case 'scheduled': return isDarkMode ? 'text-gray-400' : 'text-gray-500';
      default: return isDarkMode ? 'text-gray-500' : 'text-gray-400';
    }
  };

  return (
    <div className={`h-full flex flex-col md:flex-row overflow-hidden pb-16 md:pb-0 ${isDarkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <div className={`overflow-hidden flex-1 flex flex-col md:pb-0 ${mobileView === 'details' ? 'hidden md:flex' : ''}`}>
        <div className="flex flex-col h-full">
          <div className={`border-b flex-shrink-0 ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="px-6 py-4">
              <div className="flex items-center justify-between mb-4">
                <h1 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Work Orders
                </h1>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => fetchWorkOrders(1, 1000, '', '')}
                    disabled={isLoading}
                    className={`p-2 rounded ${isDarkMode
                      ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                      }`}
                    title="Refresh"
                  >
                    <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>

                  {(userRole === 1 || userRole === 7) && (
                    <button
                      onClick={handleAddNew}
                      className="px-4 py-2 text-white rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                      style={{ backgroundColor: colorPalette?.primary || '#7c3aed' }}
                      title="Add Work Order"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search work orders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full rounded pl-10 pr-10 py-2 focus:outline-none ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-gray-100 text-gray-900 border-gray-300'} border`}
                    onFocus={(e) => {
                      if (colorPalette?.primary) {
                        e.currentTarget.style.borderColor = colorPalette.primary;
                        e.currentTarget.style.boxShadow = `0 0 0 1px ${colorPalette.primary}`;
                      }
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = isDarkMode ? '#374151' : '#d1d5db';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                  <Search className={`absolute left-3 top-2.5 h-5 w-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className={`absolute right-3 top-2.5 p-0.5 rounded-full transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsFunnelFilterOpen(true)}
                    className={`p-2 rounded-lg border transition-colors flex items-center justify-center relative ${isDarkMode
                        ? 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                        : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                  >
                    <Filter className="h-5 w-5" />
                    {activeFilters && Object.keys(activeFilters).length > 0 && (
                      <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                        style={{ backgroundColor: colorPalette?.primary || '#7c3aed' }}>
                        {Object.keys(activeFilters).length}
                      </div>
                    )}
                  </button>
                  {activeFilters && Object.keys(activeFilters).length > 0 && (
                    <button
                      onClick={() => {
                        setActiveFilters({});
                        localStorage.removeItem('workOrderFunnelFilters');
                      }}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors ${isDarkMode
                          ? 'border-red-900/30 bg-red-900/20 text-red-400 hover:bg-red-900/40'
                          : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                        }`}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto" ref={scrollRef}>
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className={`h-8 w-8 animate-spin ${isDarkMode ? 'text-white' : 'text-gray-900'}`} />
              </div>
            ) : error ? (
              <div className="text-center py-20 text-red-500">{error}</div>
            ) : filteredWorkOrders.length > 0 ? (
              <div className="space-y-0">
                {paginatedWorkOrders.map((wo) => (
                  <div
                    key={wo.id}
                    onClick={() => handleEdit(wo)}
                    className={`flex items-start px-4 py-3 cursor-pointer transition-colors border-b ${isDarkMode
                      ? `hover:bg-gray-800 border-b-gray-800 ${selectedWorkOrder?.id === wo.id ? 'bg-gray-800' : ''}`
                      : `hover:bg-gray-100 border-b-gray-200 ${selectedWorkOrder?.id === wo.id ? 'bg-gray-100' : ''}`
                      }`}
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <div className={`font-semibold text-sm mb-0.5 truncate uppercase flex items-center justify-between ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        <span className="truncate">{wo.instructions || `WORK ORDER #${wo.id}`}</span>
                        <span className={`text-[10px] font-medium tracking-wide flex-shrink-0 ml-2 ${getStatusColor(wo.work_status)}`}>
                          {(wo.work_status || 'SCHEDULED').toUpperCase()}
                        </span>
                      </div>
                      <div className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} flex items-center`}>
                        {wo.work_category && (
                          <>
                            <span className="font-medium text-blue-500">{wo.work_category}</span>
                            <span className="mx-1.5 opacity-50">|</span>
                          </>
                        )}
                        <span>{formatDate(wo.requested_date)}</span>
                        <span className="mx-1.5 opacity-50">|</span>
                        <span className="truncate">{wo.report_to || 'Location not specified'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`text-center py-20 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                No work orders found
              </div>
            )}
          </div>
          {!isLoading && filteredWorkOrders.length > 0 && <PaginationControls />}
        </div>
      </div>

      {selectedWorkOrder && mobileView === 'details' && (
        <div className={`md:hidden flex-1 flex flex-col overflow-hidden ${isDarkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
          <WorkOrderDetails
            workOrder={selectedWorkOrder}
            onClose={handleMobileBack}
            onRefresh={() => fetchWorkOrders(1, 1000, '', '')}
            isMobile={true}
            isDarkMode={isDarkMode}
            colorPalette={colorPalette}
          />
        </div>
      )}

      {selectedWorkOrder && (mobileView !== 'details' || window.innerWidth >= 768) && (
        <div className="hidden md:block flex-shrink-0 overflow-hidden">
          <WorkOrderDetails
            workOrder={selectedWorkOrder}
            onClose={() => setSelectedWorkOrder(null)}
            onRefresh={() => fetchWorkOrders(1, 1000, '', '')}
            isMobile={false}
            isDarkMode={isDarkMode}
            colorPalette={colorPalette}
          />
        </div>
      )}

      {showAssignModal && (
        <AssignWorkOrderModal
          isOpen={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          onSave={() => {
            setShowAssignModal(false);
            fetchWorkOrders(1, 1000, '', '');
          }}
          onRefresh={() => fetchWorkOrders(1, 1000, '', '')}
        />
      )}

      <WorkOrderFunnelFilter
        isOpen={isFunnelFilterOpen}
        onClose={() => setIsFunnelFilterOpen(false)}
        currentFilters={activeFilters}
        onApplyFilters={(filters) => {
          setActiveFilters(filters);
          localStorage.setItem('workOrderFunnelFilters', JSON.stringify(filters));
          setIsFunnelFilterOpen(false);
        }}
      />
    </div>
  );
};

export default WorkOrderPage;
