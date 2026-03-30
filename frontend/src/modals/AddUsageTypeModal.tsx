import React, { useState, useEffect } from 'react';
import { X, Loader2, Info } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { settingsColorPaletteService, ColorPalette } from '../services/settingsColorPaletteService';
import LoadingModalGlobal from '../components/LoadingModalGlobal';

interface AddUsageTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingUsageType?: UsageType | null;
}

interface UsageType {
  id: number;
  usage_name: string;
  created_at?: string;
  updated_at?: string;
  created_by_user_id?: number;
  updated_by_user_id?: number;
}

const AddUsageTypeModal: React.FC<AddUsageTypeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingUsageType
}) => {
  const [formData, setFormData] = useState({
    usage_name: ''
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
    if (isOpen && editingUsageType) {
      setFormData({
        usage_name: editingUsageType.usage_name
      });
    } else if (isOpen && !editingUsageType) {
      resetForm();
    }
  }, [isOpen, editingUsageType]);

  const resetForm = () => {
    setFormData({
      usage_name: ''
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.usage_name.trim()) {
      newErrors.usage_name = 'Usage type name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showGlobalModal('warning', 'Validation Error', 'Usage type name is required.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        usage_name: formData.usage_name.trim()
      };

      const url = editingUsageType
        ? `${API_BASE_URL}/usage-types/${editingUsageType.id}`
        : `${API_BASE_URL}/usage-types`;

      const method = editingUsageType ? 'PUT' : 'POST';

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
        showGlobalModal('success', 'Success', data.message || `Usage type ${editingUsageType ? 'updated' : 'added'} successfully`, () => {
          onSave();
          handleClose();
          closeGlobalModal();
        });
      } else {
        if (data.errors) {
          const errorMessages = Object.values(data.errors).flat().join('\n');
          showGlobalModal('error', 'Validation Errors', errorMessages);
        } else {
          showGlobalModal('error', 'Error', data.message || `Failed to ${editingUsageType ? 'update' : 'add'} usage type`);
        }
      }
    } catch (error: any) {
      console.error('Error submitting form:', error);
      showGlobalModal('error', 'Critical Error', `Failed to process request: ${error.message}`);
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
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-end z-[40]" onClick={handleClose}>
        <div
          className={`h-full w-full md:max-w-2xl shadow-3xl transform transition-transform duration-300 ease-in-out overflow-hidden flex flex-col ${isDarkMode ? 'bg-gray-900 border-l border-white/5' : 'bg-white border-l border-gray-200 shadow-2xl'
            }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`px-6 py-6 flex items-center justify-between border-b ${isDarkMode
              ? 'bg-gray-800/50 border-gray-700'
              : 'bg-gray-50 border-gray-200'
            }`}>
            <div className="flex flex-col">
              <h2 className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {editingUsageType ? 'Modify Usage Context' : 'Register Usage Type'}
              </h2>
              <p className={`text-xs mt-0.5 font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {editingUsageType ? 'Update existing configuration' : 'Define a new usage classification'}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleClose}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 ${isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold flex items-center shadow-lg active:scale-95 transition-all"
                style={{
                  backgroundColor: colorPalette?.primary || '#7c3aed'
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
                    <Loader2 size={18} className="animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  'Commit Changes'
                )}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
            <div className="space-y-6">
              <div className="group">
                <label className={`block text-xs font-bold uppercase tracking-widest mb-2.5 transition-colors ${isDarkMode ? 'text-gray-500 group-focus-within:text-blue-400' : 'text-gray-400 group-focus-within:text-blue-600'}`}>
                  Usage Designation<span className="text-red-500 ml-1.5">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.usage_name}
                    onChange={(e) => {
                      setFormData({ ...formData, usage_name: e.target.value });
                      if (errors.usage_name) setErrors({...errors, usage_name: ''});
                    }}
                    className={`w-full px-5 py-3.5 rounded-2xl border transition-all duration-300 focus:outline-none focus:ring-4 ${isDarkMode 
                      ? 'bg-gray-800 text-white border-gray-700 focus:border-blue-500 focus:ring-blue-500/10' 
                      : 'bg-white text-gray-900 border-gray-200 focus:border-blue-600 focus:ring-blue-600/10 shadow-sm'
                      } ${errors.usage_name ? 'border-red-500 ring-4 ring-red-500/10' : ''}`}
                    placeholder="e.g. Residential, Commercial, Internal"
                    autoFocus
                  />
                  {errors.usage_name && (
                    <div className="absolute -bottom-6 left-0 text-red-500 text-[10px] font-bold uppercase tracking-tighter flex items-center gap-1">
                      <X size={10} /> {errors.usage_name}
                    </div>
                  )}
                </div>
              </div>

              <div className={`p-5 rounded-2xl border flex gap-4 ${isDarkMode
                  ? 'bg-blue-500/5 border-blue-500/20'
                  : 'bg-blue-50 border-blue-200 shadow-sm shadow-blue-100'
                }`}>
                <div className={isDarkMode ? 'text-blue-400' : 'text-blue-600'}>
                  <Info size={24} />
                </div>
                <div className="flex-1">
                  <h4 className={`text-sm font-bold mb-1 ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>Configuration Policy</h4>
                  <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-blue-400/80 font-medium' : 'text-blue-700/80 font-medium'}`}>
                    Usage types are critical for classification. Modifying this might affect related reports and customer billing cycles. System-generated audit trails will log this change.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer Decoration */}
          <div className="px-8 py-6 opacity-30">
            <div className={`h-px w-full ${isDarkMode ? 'bg-gradient-to-r from-transparent via-gray-700 to-transparent' : 'bg-gradient-to-r from-transparent via-gray-300 to-transparent'}`}></div>
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

export default AddUsageTypeModal;
