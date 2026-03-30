import React, { useState, useEffect } from 'react';
import { X, Loader2, ClipboardList, Info } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { settingsColorPaletteService, ColorPalette } from '../services/settingsColorPaletteService';
import LoadingModalGlobal from '../components/LoadingModalGlobal';

interface AddWorkCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingWorkCategory?: WorkCategory | null;
}

interface WorkCategory {
  id: number;
  category: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by_user_id?: number;
}

const AddWorkCategoryModal: React.FC<AddWorkCategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingWorkCategory
}) => {
  const [formData, setFormData] = useState({
    category: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') === 'dark');
  const [colorPalette, setColorPalette] = useState<ColorPalette | null>(null);

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
    const observer = new MutationObserver(() => {
      setIsDarkMode(localStorage.getItem('theme') === 'dark');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
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
    if (isOpen && editingWorkCategory) {
      setFormData({
        category: editingWorkCategory.category
      });
    } else if (isOpen && !editingWorkCategory) {
      resetForm();
    }
  }, [isOpen, editingWorkCategory]);

  const resetForm = () => {
    setFormData({
      category: ''
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.category.trim()) {
      newErrors.category = 'Work category name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showGlobalModal('warning', 'Validation Error', 'Category designation is required.');
      return;
    }

    setLoading(true);

    try {
      const authData = localStorage.getItem('authData');
      const currentUserEmail = authData ? JSON.parse(authData)?.email : 'system';

      const payload = {
        category: formData.category.trim(),
        created_by: currentUserEmail
      };

      const url = editingWorkCategory
        ? `${API_BASE_URL}/work-categories/${editingWorkCategory.id}`
        : `${API_BASE_URL}/work-categories`;

      const method = editingWorkCategory ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showGlobalModal('success', 'Execution Success', data.message || `Work category ${editingWorkCategory ? 'updated' : 'added'} successfully`, () => {
          onSave();
          handleClose();
          closeGlobalModal();
        });
      } else {
        if (data.errors) {
          const errorMessages = Object.values(data.errors).flat().join('\n');
          showGlobalModal('error', 'Integrity Error', errorMessages);
        } else {
          showGlobalModal('error', 'Request Denied', data.message || `Failed to ${editingWorkCategory ? 'update' : 'add'} category`);
        }
      }
    } catch (error: any) {
      console.error('Error submitting form:', error);
      showGlobalModal('error', 'System Interruption', `External fault detected: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-[2px] flex items-center justify-end z-[40]" onClick={handleClose}>
        <div
          className={`h-full w-full md:max-w-xl shadow-4xl transform transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col ${isDarkMode ? 'bg-gray-950 border-l border-white/5' : 'bg-white border-l border-gray-200'
            }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Area */}
          <div className={`px-8 py-10 flex flex-col border-b relative overflow-hidden ${isDarkMode
              ? 'bg-gray-900/40 border-gray-800'
              : 'bg-gray-50 border-gray-200'
            }`}>
            <div className="absolute top-0 right-0 p-4">
              <button
                onClick={handleClose}
                className={`p-2 rounded-full transition-all active:scale-90 ${isDarkMode ? 'hover:bg-gray-800 text-gray-500' : 'hover:bg-gray-100 text-gray-400'}`}
              >
                <X size={24} />
              </button>
            </div>
            
            <div className={`mb-6 p-4 rounded-2xl w-fit ${isDarkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
              <ClipboardList size={32} strokeWidth={2.5} />
            </div>

            <h2 className={`text-2xl font-black italic tracking-tighter ${isDarkMode ? 'text-white' : 'text-gray-950'}`}>
              {editingWorkCategory ? 'RECONFIGURE CATEGORY' : 'ESTABLISH CLASSIFICATION'}
            </h2>
            <p className={`text-[10px] font-black uppercase tracking-[0.3em] mt-2 opacity-50 ${isDarkMode ? 'text-indigo-300' : 'text-indigo-900'}`}>
              {editingWorkCategory ? 'Structural refinement of work order logic' : 'New taxonomic entry for operational workflows'}
            </p>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
            <div className="space-y-10">
              <div className="group">
                <label className={`block text-[10px] font-black uppercase tracking-[0.2em] mb-4 transition-all duration-300 ${isDarkMode ? 'text-gray-600 group-focus-within:text-indigo-400' : 'text-gray-400 group-focus-within:text-indigo-600'}`}>
                  Operational Category Label<span className="text-red-500 ml-2">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => {
                      setFormData({ ...formData, category: e.target.value });
                      if (errors.category) setErrors({...errors, category: ''});
                    }}
                    className={`w-full px-8 py-5 rounded-3xl border-2 transition-all duration-500 focus:outline-none focus:ring-[12px] text-lg font-bold ${isDarkMode 
                      ? 'bg-gray-900 text-white border-gray-800 focus:border-indigo-500/50 focus:ring-indigo-500/5' 
                      : 'bg-white text-gray-950 border-gray-100 focus:border-indigo-600/50 focus:ring-indigo-600/5 shadow-2xl shadow-indigo-100/20'
                      } ${errors.category ? 'border-red-500/50 ring-red-500/5' : ''}`}
                    placeholder="e.g. TECHNICAL REPAIR"
                    autoFocus
                  />
                  {errors.category && (
                    <div className="absolute -bottom-8 left-0 text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 animate-bounce">
                      <X size={12} strokeWidth={3} /> {errors.category}
                    </div>
                  )}
                </div>
              </div>

              <div className={`p-8 rounded-[40px] border-2 flex flex-col gap-6 shadow-sm transition-all duration-500 hover:shadow-xl ${isDarkMode
                  ? 'bg-indigo-500/[0.02] border-indigo-500/10'
                  : 'bg-indigo-50/30 border-indigo-100'
                }`}>
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                    <Info size={20} strokeWidth={2.5} />
                  </div>
                  <h4 className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-indigo-300' : 'text-indigo-900'}`}>Structural Impact Note</h4>
                </div>
                <p className={`text-[11px] leading-relaxed font-bold opacity-70 italic ${isDarkMode ? 'text-indigo-200/60' : 'text-indigo-800/80'}`}>
                  "Work order categories define the technical hierarchy of support tickets. Modifying existing entries may alter legacy reporting metrics and technician assignment logic within the Work Management Portal."
                </p>
              </div>
            </div>
          </div>

          {/* Action Interface */}
          <div className={`p-10 border-t flex flex-col gap-4 ${isDarkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-gray-50/50 border-gray-200'}`}>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full px-12 py-6 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-[32px] font-black text-xs uppercase tracking-[0.4em] flex items-center justify-center shadow-3xl active:scale-95 transition-all duration-300"
              style={{
                backgroundColor: colorPalette?.primary || '#6366f1',
                boxShadow: `0 20px 40px -15px ${isDarkMode ? 'rgba(99, 102, 241, 0.4)' : 'rgba(99, 102, 241, 0.2)'}`
              }}
              onMouseEnter={(e) => {
                if (colorPalette?.accent && !loading) {
                  e.currentTarget.style.backgroundColor = colorPalette.accent;
                }
              }}
              onMouseLeave={(e) => {
                if (colorPalette?.primary) {
                  e.currentTarget.style.backgroundColor = colorPalette.primary;
                }
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={24} className="animate-spin mr-4" />
                  Synchronizing Core...
                </>
              ) : (
                'Finalize Entry'
              )}
            </button>
            
            <button
              onClick={handleClose}
              className={`w-full py-4 rounded-full font-black text-[9px] uppercase tracking-[0.5em] transition-all duration-300 active:scale-95 ${isDarkMode
                  ? 'text-gray-600 hover:text-white'
                  : 'text-gray-400 hover:text-gray-900'
                }`}
            >
              Abort Classification
            </button>
          </div>
        </div>
      </div>

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
    </>
  );
};

export default AddWorkCategoryModal;
