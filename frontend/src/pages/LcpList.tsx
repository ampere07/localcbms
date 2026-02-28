import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import EditLcpModal from '../modals/EditLcpModal';
import { settingsColorPaletteService, ColorPalette } from '../services/settingsColorPaletteService';
import { useLcpStore } from '../store/lcpStore';
import { LCP } from '../services/lcpService';

interface LcpFormData {
  name: string;
}

const LcpList: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LCP | null>(null);

  const [deletingItems, setDeletingItems] = useState<Set<number>>(new Set());
  const [colorPalette, setColorPalette] = useState<ColorPalette | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const itemsPerPage = 50;

  const {
    lcpItems,
    isLoading,
    error,
    currentPage,
    totalCount,
    fetchLcpItems,
    addLcpItem,
    updateLcpItem,
    deleteLcpItem,
    searchQuery,
    setSearchQuery,
    refreshLcpItems
  } = useLcpStore();

  const totalPages = Math.ceil(totalCount / itemsPerPage);

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
      const theme = localStorage.getItem('theme');
      setIsDarkMode(theme !== 'light');
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    const theme = localStorage.getItem('theme');
    setIsDarkMode(theme !== 'light');

    return () => observer.disconnect();
  }, []);

  // Initial load
  useEffect(() => {
    refreshLcpItems();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Idle detection and auto-refresh logic
  const { silentRefresh } = useLcpStore();
  useEffect(() => {
    const IDLE_TIME_LIMIT = 15 * 60 * 1000; // 15 minutes
    let idleTimer: NodeJS.Timeout | null = null;

    const refreshData = async () => {
      console.log('User idle for 15 minutes, auto-refreshing LCP data...');
      try {
        await silentRefresh();
      } catch (err) {
        console.error('Idle refresh failed:', err);
      }
      // Set the timer again to refresh every 15 mins if they remain idle
      startTimer();
    };

    const startTimer = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(refreshData, IDLE_TIME_LIMIT);
    };

    const resetTimer = () => {
      startTimer();
    };

    const activityEvents = ['mousedown', 'keypress', 'touchstart'];

    const handleActivity = () => {
      resetTimer();
    };

    // Use passive listeners for performance
    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    startTimer(); // Initialize timer on mount

    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [silentRefresh]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchLcpItems(newPage, itemsPerPage, searchQuery);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(() => {
      fetchLcpItems(1, itemsPerPage, query);
    }, 500);
  };

  const handleDelete = async (item: LCP, event: React.MouseEvent) => {
    event.stopPropagation();

    if (!window.confirm(`⚠️ PERMANENT DELETE WARNING ⚠️\n\nAre you sure you want to permanently delete "${item.lcp_name}"?\n\nThis action CANNOT BE UNDONE!\n\nClick OK to permanently delete, or Cancel to keep the item.`)) {
      return;
    }

    setDeletingItems(prev => {
      const newSet = new Set(prev);
      newSet.add(item.id);
      return newSet;
    });

    try {
      await deleteLcpItem(item.id);
    } catch (error) {
      console.error('Error deleting LCP:', error);
      alert('Failed to delete LCP: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setDeletingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  };

  const handleEdit = (item: LCP, event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleSave = async (formData: LcpFormData) => {
    try {
      if (editingItem) {
        await updateLcpItem(editingItem.id, formData.name.trim());
      } else {
        await addLcpItem(formData.name.trim());
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      throw error;
    }
  };

  return (
    <div className={`${isDarkMode ? 'bg-gray-950' : 'bg-gray-50'
      } h-full flex overflow-hidden`}>
      <div className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'
        } overflow-hidden flex-1`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={`p-4 border-b flex-shrink-0 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
            }`}>
            <div className="flex items-center space-x-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search LCP"
                  value={searchQuery}
                  onChange={handleSearch}
                  className={`w-full rounded pl-10 pr-4 py-2 focus:outline-none ${isDarkMode
                    ? 'bg-gray-800 text-white border-gray-700'
                    : 'bg-gray-100 text-gray-900 border-gray-300'
                    } border`}
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
                <Search className={`absolute left-3 top-2.5 h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
              </div>
              <button
                onClick={handleAddNew}
                className="text-white px-4 py-2 rounded text-sm transition-colors flex items-center space-x-1"
                style={{
                  backgroundColor: colorPalette?.primary || '#7c3aed'
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
                <Plus className="h-4 w-4" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto">
              {isLoading && lcpItems.length === 0 ? (
                <div className={`px-4 py-12 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                  <div className="animate-pulse flex flex-col items-center">
                    <div className={`h-4 w-1/3 rounded mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
                      }`}></div>
                    <div className={`h-4 w-1/2 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
                      }`}></div>
                  </div>
                  <p className="mt-4">Loading LCP items...</p>
                </div>
              ) : error ? (
                <div className={`px-4 py-12 text-center ${isDarkMode ? 'text-red-400' : 'text-red-600'
                  }`}>
                  <p>{error}</p>
                  <button
                    onClick={() => fetchLcpItems(1, itemsPerPage, searchQuery)}
                    className="mt-4 px-4 py-2 rounded text-white transition-colors"
                    style={{
                      backgroundColor: colorPalette?.primary || '#7c3aed'
                    }}>
                    Retry
                  </button>
                </div>
              ) : lcpItems.length === 0 ? (
                <div className={`px-4 py-12 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                  "No LCP items found"
                </div>
              ) : (
                <div className="space-y-0">
                  {lcpItems.map((item) => (
                    <div
                      key={item.id}
                      className={`px-4 py-3 cursor-pointer transition-colors border-b ${isDarkMode
                        ? 'hover:bg-gray-800 border-gray-800'
                        : 'hover:bg-gray-100 border-gray-200'
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium text-sm mb-1 uppercase ${isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                            {item.lcp_name}
                          </div>
                          {item.created_at && (
                            <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                              Created: {new Date(item.created_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                          <button
                            onClick={(e) => handleEdit(item, e)}
                            className={`p-1.5 rounded transition-colors ${isDarkMode
                              ? 'text-gray-400 hover:text-blue-400 hover:bg-gray-700'
                              : 'text-gray-600 hover:text-blue-600 hover:bg-gray-200'
                              }`}
                            title="Edit LCP"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={(e) => handleDelete(item, e)}
                            disabled={deletingItems.has(item.id)}
                            className={`p-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isDarkMode
                              ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700'
                              : 'text-gray-600 hover:text-red-600 hover:bg-gray-200'
                              }`}
                            title={deletingItems.has(item.id) ? 'Deleting...' : 'Delete LCP'}
                          >
                            {deletingItems.has(item.id) ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className={`px-4 py-4 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                      <div className="animate-pulse flex flex-col items-center">
                        <Loader2 size={24} className="animate-spin mb-2" />
                        <p>Loading...</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {!isLoading && lcpItems.length > 0 && totalPages > 1 && (
              <div className={`border-t p-4 flex items-center justify-between flex-shrink-0 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalCount)}</span> of <span className="font-medium">{totalCount}</span> results
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
            )}
          </div>
        </div>
      </div>

      {/* Edit/Add LCP Modal */}
      <EditLcpModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        lcpItem={editingItem}
      />
    </div>
  );
};

export default LcpList;
