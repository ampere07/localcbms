import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Edit2, Trash2, Loader2, RefreshCw, ChevronsLeft, ChevronsRight, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { settingsColorPaletteService, ColorPalette } from '../services/settingsColorPaletteService';
import { useWorkOrderStore } from '../store/workOrderStore';
import { WorkOrder } from '../types/workOrder';
import WorkOrderDetails from '../components/WorkOrderDetails';
import AssignWorkOrderModal from '../modals/AssignWorkOrderModal';
import pusher from '../services/pusherService';
import LoadingModalGlobal from '../components/LoadingModalGlobal';

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

  const [globalModal, setGlobalModal] = useState<{
    isOpen: boolean;
    type: 'loading' | 'success' | 'error' | 'confirm' | 'warning';
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: 'loading',
    title: '',
    message: ''
  });

  const showGlobalModal = (
    type: 'loading' | 'success' | 'error' | 'confirm' | 'warning', 
    title: string, 
    message: string,
    onConfirm?: () => void
  ) => {
    setGlobalModal({
      isOpen: true,
      type,
      title,
      message,
      onConfirm
    });
  };

  const closeGlobalModal = () => {
    setGlobalModal(prev => ({ ...prev, isOpen: false }));
  };

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
  const [itemsPerPage, setItemsPerPage] = useState(25);
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


  const handleDelete = (workOrder: WorkOrder) => {
    showGlobalModal(
      'confirm',
      'Confirm Deletion',
      `Are you sure you want to permanently delete this work order?`,
      () => executeDelete(workOrder)
    );
  };

  const executeDelete = async (workOrder: WorkOrder) => {
    closeGlobalModal();
    
    setDeletingItems(prev => new Set(prev).add(workOrder.id));
    showGlobalModal('loading', 'Deleting', 'Removing work order from system...');

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
        showGlobalModal('success', 'Deleted', 'Work order deleted successfully');
      } else {
        showGlobalModal('error', 'Delete Failed', data.message || 'Failed to delete work order');
      }
    } catch (error: any) {
      console.error('Error deleting work order:', error);
      showGlobalModal('error', 'Error', error.message || 'An unexpected error occurred during deletion');
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
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      return dateString;
    }
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

    if (!searchQuery) return filtered;

    const normalizedQuery = searchQuery.toLowerCase().replace(/\s+/g, '');
    return filtered.filter(wo => {
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
  }, [workOrders, userRole, userEmail, userName, searchQuery]);

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
            <ChevronLeft size={16} />
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
            <ChevronRight size={16} />
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
    <div className={`h-full flex flex-col md:flex-row overflow-hidden pb-16 md:pb-0 ${isDarkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
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
                    className={`w-full rounded-xl pl-10 pr-10 py-2.5 focus:outline-none focus:ring-4 transition-all ${isDarkMode 
                      ? 'bg-gray-800 text-white border-gray-700/50 focus:border-blue-500 focus:ring-blue-500/10' 
                      : 'bg-white text-gray-900 border-gray-200 focus:border-blue-600 focus:ring-blue-600/10 shadow-sm'} border`}
                  />
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar" ref={scrollRef}>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-10 w-10 animate-spin" style={{ color: colorPalette?.primary }} />
                <p className="animate-pulse font-medium opacity-60">Synchronizing work orders...</p>
              </div>
            ) : error ? (
              <div className="text-center py-20 text-red-500 font-bold whitespace-pre-wrap px-4">{error}</div>
            ) : filteredWorkOrders.length > 0 ? (
              <div className="divide-y divide-gray-800/10 dark:divide-white/5">
                {paginatedWorkOrders.map((wo) => (
                  <div
                    key={wo.id}
                    onClick={() => handleEdit(wo)}
                    className={`flex items-start px-6 py-4 cursor-pointer transition-all duration-200 ${isDarkMode
                      ? `hover:bg-white/[0.02] border-gray-800 ${selectedWorkOrder?.id === wo.id ? 'bg-white/[0.05]' : ''}`
                      : `hover:bg-gray-50 border-gray-200 ${selectedWorkOrder?.id === wo.id ? 'bg-gray-50 border-l-4 border-l-blue-500 pl-5' : ''}`
                      }`}
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <div className={`font-bold text-sm mb-1 truncate uppercase flex items-center justify-between ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        <span className="truncate group-hover:translate-x-1 transition-transform">{wo.instructions || `WORK ORDER #${wo.id}`}</span>
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'bg-black/20' : 'bg-gray-100'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${getStatusColor(wo.work_status).replace('text-', 'bg-')}`}></span>
                          <span className={getStatusColor(wo.work_status)}>{(wo.work_status || 'SCHEDULED').toUpperCase()}</span>
                        </div>
                      </div>
                      <div className={`text-[10px] sm:text-xs font-bold uppercase tracking-wide flex items-center gap-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {wo.work_category && (
                          <span className="text-blue-500 font-black">{wo.work_category}</span>
                        )}
                        <span className="opacity-30">•</span>
                        <span>{formatDate(wo.requested_date)}</span>
                        <span className="opacity-30">•</span>
                        <span className="truncate">{wo.report_to || 'LOCATION PENDING'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 space-y-4 opacity-40">
                <Search size={64} strokeWidth={1} />
                <p className="text-xl font-bold">No operational orders discovered</p>
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

      <LoadingModalGlobal
        isOpen={globalModal.isOpen}
        type={globalModal.type}
        title={globalModal.title}
        message={globalModal.message}
        onConfirm={globalModal.onConfirm || closeGlobalModal}
        onCancel={closeGlobalModal}
        colorPalette={colorPalette}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};

export default WorkOrderPage;
