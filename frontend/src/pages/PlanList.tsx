import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Filter, Loader2, X } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import AddPlanModal from '../modals/AddPlanModal';
import PlanListDetails from '../components/PlanListDetails';
import { settingsColorPaletteService, ColorPalette } from '../services/settingsColorPaletteService';

interface Plan {
  id: number;
  name: string;
  description?: string;
  price: number;
  is_active?: boolean;
  modified_date?: string;
  modified_by?: string;
  created_at?: string;
  updated_at?: string;
}

interface PlanListProps {
  onNavigate?: (section: string, extra?: string) => void;
  initialSearchQuery?: string;
}

const PlanList: React.FC<PlanListProps> = ({ onNavigate, initialSearchQuery = '' }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [deletingItems, setDeletingItems] = useState<Set<number>>(new Set());
  const [colorPalette, setColorPalette] = useState<ColorPalette | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

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
    loadPlans();
  }, []);

  useEffect(() => {
    if (initialSearchQuery && plans.length > 0) {
      // Find exact or partial match to auto-open
      const matchedPlan = plans.find(p => 
        p.name.toLowerCase() === initialSearchQuery.toLowerCase() ||
        p.name.toLowerCase().includes(initialSearchQuery.toLowerCase())
      );
      if (matchedPlan) {
        setSelectedPlan(matchedPlan);
      }
    }
  }, [initialSearchQuery, plans]);

  // Idle detection and auto-refresh logic
  useEffect(() => {
    const IDLE_TIME_LIMIT = 15 * 60 * 1000; // 15 minutes
    let idleTimer: NodeJS.Timeout | null = null;

    const refreshData = async () => {
      console.log('User idle for 15 minutes, auto-refreshing Plan data...');
      try {
        await loadPlans(true); // Silent refresh
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

  const loadPlans = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/plans`, {
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
        setPlans(data.data || []);
      } else {
        console.error('API returned error:', data.message);
        setPlans([]);
      }
    } catch (error) {
      console.error('Error loading plans:', error);
      setPlans([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (plan: Plan) => {
    if (!window.confirm(`⚠️ PERMANENT DELETE WARNING ⚠️\n\nAre you sure you want to permanently delete "${plan.name}"?\n\nThis will PERMANENTLY REMOVE the plan from the database and CANNOT BE UNDONE!\n\nClick OK to permanently delete, or Cancel to keep the plan.`)) {
      return;
    }

    setDeletingItems(prev => {
      const newSet = new Set(prev);
      newSet.add(plan.id);
      return newSet;
    });

    try {
      const response = await fetch(`${API_BASE_URL}/plans/${plan.id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await loadPlans();
        alert('✅ Plan permanently deleted from database: ' + (data.message || 'Plan deleted successfully'));
      } else {
        alert('❌ Failed to delete plan: ' + (data.message || 'Failed to delete plan'));
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
      alert('Failed to delete plan: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setDeletingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(plan.id);
        return newSet;
      });
      if (selectedPlan && selectedPlan.id === plan.id) {
        setSelectedPlan(null);
      }
    }
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingPlan(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingPlan(null);
  };

  const handleModalSave = async () => {
    await loadPlans();
    // Refresh selected plan if it was just edited
    if (editingPlan && selectedPlan && selectedPlan.id === editingPlan.id) {
      // Find the fully updated plan object in the next states instead of doing it immediately.
      // Easiest is to let `loadPlans()` handle the list, then we just wait for it.
      // We will do a small fetch inside if needed, or update via useEffect on `plans`.
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(price);
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

  const getFilteredPlans = () => {
    if (!searchQuery) return plans;

    return plans.filter(plan =>
      plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (plan.description && plan.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  const renderListItem = (plan: Plan) => {
    const isActive = plan.is_active !== undefined ? plan.is_active : true;
    const isSelected = selectedPlan?.id === plan.id;

    return (
      <div 
        key={plan.id} 
        onClick={() => setSelectedPlan(plan)}
        className={`border-b cursor-pointer transition-colors ${
          isSelected 
            ? (isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-blue-50 border-blue-200')
            : (isDarkMode ? 'bg-gray-900 border-gray-800 hover:bg-gray-800' : 'bg-white border-gray-200 hover:bg-gray-50')
        }`}
      >
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className={`font-medium text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>{plan.name}</h3>
              <span className="text-green-400 font-semibold">
                {formatPrice(plan.price)}
              </span>
              {isActive && (
                <span className="text-xs px-2 py-1 rounded bg-green-800 text-green-400">
                  Active
                </span>
              )}
            </div>
            {plan.description && (
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>{plan.description}</p>
            )}
            <div className={`flex items-center gap-4 mt-2 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-600'
              }`}>
              <span>Modified: {formatDate(plan.modified_date)}</span>
              <span>By: {plan.modified_by || 'System'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(plan);
              }}
              className={`p-2 rounded transition-colors ${isDarkMode
                ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              title="Edit"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(plan);
              }}
              disabled={deletingItems.has(plan.id)}
              className={`p-2 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${isDarkMode
                ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700'
                : 'text-gray-600 hover:text-red-600 hover:bg-gray-100'
                }`}
              title={deletingItems.has(plan.id) ? 'Permanently Deleting...' : 'Permanently Delete'}
            >
              {deletingItems.has(plan.id) ? (
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

  // Update selectedPlan when plans list changes (e.g. after edit)
  useEffect(() => {
    if (selectedPlan) {
      const updatedPlan = plans.find(p => p.id === selectedPlan.id);
      if (updatedPlan) {
        setSelectedPlan(updatedPlan);
      } else if (!isLoading) {
        // Only clear if not loading, meaning item truly absent
        // setSelectedPlan(null); // Optional: clear if deleted, handled in handleDelete mostly
      }
    }
  }, [plans]);

  const filteredPlans = getFilteredPlans();

  return (
    <div className={`min-h-screen flex ${isDarkMode ? 'bg-gray-950' : 'bg-gray-50'
      }`}>
      
      <div className={`flex flex-col flex-1 min-w-0 ${selectedPlan ? 'hidden min-[900px]:flex' : 'flex'}`}>
        <div className={`border-b ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          }`}>
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Plan List</h1>
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
              <button className={`p-2 rounded transition-colors ${isDarkMode
                ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}>
                <Filter className="h-5 w-5" />
              </button>
              <button className={`p-2 rounded transition-colors ${isDarkMode
                ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
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
              placeholder="Search Plan List"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-10 py-2 rounded-lg border focus:outline-none ${isDarkMode
                ? 'bg-gray-800 text-white border-gray-700'
                : 'bg-white text-gray-900 border-gray-300'
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
          <div className="flex justify-center items-center py-20">
            <Loader2 className={`h-8 w-8 animate-spin ${isDarkMode ? 'text-white' : 'text-gray-900'
              }`} />
          </div>
        ) : getFilteredPlans().length > 0 ? (
          <div>
            {getFilteredPlans().map(renderListItem)}
          </div>
        ) : (
          <div className={`text-center py-20 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'
            }`}>
            No plans found
          </div>
        )}
      </div>
      </div>

      {selectedPlan && (
        <div className="flex-shrink-0 w-full min-[900px]:w-auto border-l h-screen sticky top-0" style={{ zIndex: 40, borderColor: isDarkMode ? '#374151' : '#e5e7eb' }}>
          <PlanListDetails
            plan={selectedPlan}
            onClose={() => setSelectedPlan(null)}
            isMobile={typeof window !== 'undefined' ? window.innerWidth < 900 : false}
            onNavigate={onNavigate}
          />
        </div>
      )}

      <AddPlanModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleModalSave}
        editingPlan={editingPlan}
      />
    </div>
  );
};

export default PlanList;
