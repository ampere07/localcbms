import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Filter, Loader2, Eye, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { settingsColorPaletteService, ColorPalette } from '../services/settingsColorPaletteService';
import { useWorkOrderStore } from '../store/workOrderStore';
import { WorkOrder } from '../types/workOrder';
import WorkOrderDetails from '../components/WorkOrderDetails';
import AssignWorkOrderModal from '../modals/AssignWorkOrderModal';

const WorkOrderPage: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [colorPalette, setColorPalette] = useState<ColorPalette | null>(null);

  const { workOrders, isLoading, fetchWorkOrders, error } = useWorkOrderStore();
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [deletingItems, setDeletingItems] = useState<Set<number>>(new Set());

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  const [userRole, setUserRole] = useState<number | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const authData = localStorage.getItem('authData');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        setUserRole(parsed.role_id || parsed.roleId || null);
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
    setShowDetailsModal(true);
  };

  const handleAddNew = () => {
    setSelectedWorkOrder(null);
    setShowAssignModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedWorkOrder(null);
    fetchWorkOrders(1, 1000, '', ''); // Refresh after close
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-PH', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  const getFilteredWorkOrders = () => {
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

    return filtered.filter(wo =>
      (wo.instructions || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (wo.report_to || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (wo.assign_to || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (wo.requested_by || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filteredWorkOrders = getFilteredWorkOrders();

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.ceil(filteredWorkOrders.length / itemsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const paginatedWorkOrders = filteredWorkOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    return (
      <div className={`flex items-center justify-between px-6 py-4 mt-6 rounded-lg border ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredWorkOrders.length)}</span> of <span className="font-medium">{filteredWorkOrders.length}</span> results
        </div>
        <div className="flex items-center space-x-2">
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
        </div>
      </div>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'in progress': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'failed':
      case 'cancelled': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'pending': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  return (
    <div className={`min-h-screen relative ${isDarkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <div className={`border-b ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
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
                  style={{ backgroundColor: colorPalette?.primary || '#ea580c' }}
                  title="Add Work Order"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Search work orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none ${isDarkMode ? 'bg-gray-800 text-white border-gray-700 focus:border-orange-500' : 'bg-gray-100 text-gray-900 border-gray-300 focus:border-orange-500'}`}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className={`h-8 w-8 animate-spin ${isDarkMode ? 'text-white' : 'text-gray-900'}`} />
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-500">{error}</div>
        ) : filteredWorkOrders.length > 0 ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {paginatedWorkOrders.map((wo) => (
                <div
                  key={wo.id}
                  className={`rounded-xl border shadow-sm transition-all hover:shadow-md ${isDarkMode ? 'bg-gray-900 border-gray-800 hover:border-gray-700' : 'bg-white border-gray-200 hover:border-gray-300'}`}
                >
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className={`font-semibold text-lg line-clamp-1 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{wo.instructions}</h3>
                        <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>ID: #{wo.id}</p>
                      </div>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(wo.work_status)}`}>
                        {wo.work_status}
                      </span>
                    </div>

                    <div className={`space-y-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      <div className="flex justify-between">
                        <span className="opacity-70">Report To:</span>
                        <span className="font-medium truncate ml-2 max-w-[150px]">{wo.report_to}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="opacity-70">Assign To:</span>
                        <span className="font-medium truncate ml-2 max-w-[150px]">{wo.assign_to || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="opacity-70">Requested By:</span>
                        <span className="font-medium truncate ml-2 max-w-[150px]">{wo.requested_by}</span>
                      </div>
                      <div className="flex justify-between mt-2 pt-2 border-t border-dashed border-gray-700/30">
                        <span className="opacity-70">Date:</span>
                        <span className="text-xs">{formatDate(wo.requested_date)}</span>
                      </div>
                    </div>
                  </div>

                  <div className={`px-5 py-3 border-t flex justify-end gap-2 ${isDarkMode ? 'bg-gray-800/50 border-gray-800' : 'bg-gray-50 border-gray-100'}`}>
                    <button
                      onClick={() => handleEdit(wo)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${isDarkMode ? 'text-blue-400 hover:bg-blue-400/10' : 'text-blue-600 hover:bg-blue-50'}`}
                    >
                      <Edit2 className="w-4 h-4" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(wo)}
                      disabled={deletingItems.has(wo.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${deletingItems.has(wo.id) ? 'opacity-50 cursor-not-allowed' : isDarkMode ? 'text-red-400 hover:bg-red-400/10' : 'text-red-600 hover:bg-red-50'
                        }`}
                    >
                      {deletingItems.has(wo.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <PaginationControls />
          </>
        ) : (
          <div className={`text-center py-20 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            No work orders found
          </div>
        )}
      </div>

      {showDetailsModal && (
        <WorkOrderDetails
          workOrder={selectedWorkOrder}
          onClose={handleCloseModal}
          isDarkMode={isDarkMode}
          colorPalette={colorPalette}
        />
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
    </div>
  );
};

export default WorkOrderPage;
