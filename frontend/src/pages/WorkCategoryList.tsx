import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Filter, Loader2, X } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import AddWorkCategoryModal from '../modals/AddWorkCategoryModal';
import { settingsColorPaletteService, ColorPalette } from '../services/settingsColorPaletteService';

interface WorkCategory {
  id: number;
  category: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by_user_id?: number;
}

const WorkCategoryList: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [workCategorys, setWorkCategorys] = useState<WorkCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWorkCategory, setEditingWorkCategory] = useState<WorkCategory | null>(null);
  const [deletingItems, setDeletingItems] = useState<Set<number>>(new Set());
  const [colorPalette, setColorPalette] = useState<ColorPalette | null>(null);

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

  useEffect(() => {
    loadWorkCategorys();
  }, []);

  // Idle detection and auto-refresh logic
  useEffect(() => {
    const IDLE_TIME_LIMIT = 15 * 60 * 1000; // 15 minutes
    let idleTimer: NodeJS.Timeout | null = null;

    const refreshData = async () => {
      console.log('User idle for 15 minutes, auto-refreshing Work Category data...');
      try {
        await loadWorkCategorys(true); // Silent refresh
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
  }, []);

  const loadWorkCategorys = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/work-categories`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || 'Unknown error'}`);
      }

      const data = await response.json();

      if (data.success) {
        setWorkCategorys(data.data || []);
      } else {
        console.error('API returned error:', data.message);
        setWorkCategorys([]);
      }
    } catch (error) {
      console.error('Error loading work categories:', error);
      setWorkCategorys([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (workCategory: WorkCategory) => {
    if (!window.confirm(`⚠️ PERMANENT DELETE WARNING ⚠️\n\nAre you sure you want to permanently delete "${workCategory.category}"?\n\nThis will PERMANENTLY REMOVE the work category from the database and CANNOT BE UNDONE!\n\nClick OK to permanently delete, or Cancel to keep the work category.`)) {
      return;
    }

    setDeletingItems(prev => {
      const newSet = new Set(prev);
      newSet.add(workCategory.id);
      return newSet;
    });

    try {
      const response = await fetch(`${API_BASE_URL}/work-categories/${workCategory.id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await loadWorkCategorys();
        alert('✅ work category permanently deleted from database: ' + (data.message || 'work category deleted successfully'));
      } else {
        alert('❌ Failed to delete work category: ' + (data.message || 'Failed to delete work category'));
      }
    } catch (error) {
      console.error('Error deleting work category:', error);
      alert('Failed to delete work category: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setDeletingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(workCategory.id);
        return newSet;
      });
    }
  };

  const handleEdit = (workCategory: WorkCategory) => {
    setEditingWorkCategory(workCategory);
    setShowAddModal(true);
  };

  const handleAddNew = () => {
    setEditingWorkCategory(null);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingWorkCategory(null);
  };

  const handleSaveModal = async () => {
    await loadWorkCategorys();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const yyyy = date.getFullYear();
      return `${mm}/${dd}/${yyyy}`;
    } catch (e) {
      return dateString;
    }
  };

  const getFilteredWorkCategorys = () => {
    if (!searchQuery) return workCategorys;

    return workCategorys.filter(workCategory =>
      workCategory.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const renderListItem = (workCategory: WorkCategory) => {
    return (
      <div key={workCategory.id} className={`border-b ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}>
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className={`font-medium text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                {workCategory.category}
              </h3>
            </div>
            <div className={`flex items-center gap-4 mt-2 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>
              <span>Created: {formatDate(workCategory.created_at)}</span>
              <span>By: {workCategory.created_by || 'system'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleEdit(workCategory)}
              className={`p-2 rounded ${isDarkMode
                ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              title="Edit"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(workCategory)}
              disabled={deletingItems.has(workCategory.id)}
              className={`p-2 rounded disabled:opacity-50 disabled:cursor-not-allowed ${isDarkMode
                ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700'
                : 'text-gray-600 hover:text-red-600 hover:bg-gray-200'
                }`}
              title={deletingItems.has(workCategory.id) ? 'Permanently Deleting...' : 'Permanently Delete'}
            >
              {deletingItems.has(workCategory.id) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const filteredWorkCategorys = getFilteredWorkCategorys();

  return (
    <div className={`min-h-screen relative ${isDarkMode ? 'bg-gray-950' : 'bg-gray-50'
      }`}>
      <div className={`border-b ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
              Work Category List
            </h1>
            <div className="flex items-center gap-3">
              <button
                onClick={handleAddNew}
                className="px-4 py-2 text-white rounded-lg flex items-center gap-2 transition-colors"
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
                Add
              </button>
              <button className={`p-2 rounded ${isDarkMode
                ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}>
                <Filter className="h-5 w-5" />
              </button>
              <button className={`p-2 rounded ${isDarkMode
                ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`} />
            <input
              type="text"
              placeholder="Search Work Category List"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-10 py-2 rounded-lg border focus:outline-none ${isDarkMode
                ? 'bg-gray-800 text-white border-gray-700'
                : 'bg-gray-100 text-gray-900 border-gray-300'
                }`}
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
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-0.5 rounded-full transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className={`flex justify-center items-center py-20`}>
            <Loader2 className={`h-8 w-8 animate-spin ${isDarkMode ? 'text-white' : 'text-gray-900'
              }`} />
          </div>
        ) : filteredWorkCategorys.length > 0 ? (
          <div>
            {filteredWorkCategorys.map(renderListItem)}
          </div>
        ) : (
          <div className={`text-center py-20 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`}>
            No work categories found
          </div>
        )}
      </div>

      <AddWorkCategoryModal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        onSave={handleSaveModal}
        editingWorkCategory={editingWorkCategory}
      />
    </div>
  );
};

export default WorkCategoryList;
