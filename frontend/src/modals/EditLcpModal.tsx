import React, { useState, useEffect } from 'react';
import { X, Calendar, Trash2, Loader2 } from 'lucide-react';
import { settingsColorPaletteService, ColorPalette } from '../services/settingsColorPaletteService';
import LoadingModalGlobal from '../components/LoadingModalGlobal';
import { useLcpStore } from '../store/lcpStore';

interface EditLcpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lcpData: LcpFormData) => void;
  lcpItem: LcpItem | null;
}

interface LcpItem {
  id: number;
  lcp_name: string;
  created_at?: string;
  updated_at?: string;
}

interface LcpFormData {
  name: string;
}

const EditLcpModal: React.FC<EditLcpModalProps> = ({
  isOpen,
  onClose,
  onSave,
  lcpItem
}) => {
  const [formData, setFormData] = useState<LcpFormData>({
    name: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [modifiedDate, setModifiedDate] = useState<string>('');
  const [modifiedBy, setModifiedBy] = useState<string>('');
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

  const { deleteLcpItem } = useLcpStore();

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
    // Get current user email from localStorage
    const authData = localStorage.getItem('authData');
    let userEmail = 'Unknown User';

    if (authData) {
      try {
        const userData = JSON.parse(authData);
        userEmail = userData.email || userData.email_address || 'Unknown User';
      } catch (error) {
        console.error('Error parsing auth data:', error);
      }
    }

    setModifiedBy(userEmail);

    if (isOpen) {
      if (lcpItem) {
        setFormData({
          name: lcpItem.lcp_name
        });
      } else {
        setFormData({
          name: ''
        });
      }

      // Set current date/time
      const now = new Date();
      const formattedDate = formatDateTime(now);
      setModifiedDate(formattedDate);
    }
  }, [isOpen, lcpItem]);

  const formatDateTime = (date: Date): string => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';

    hours = hours % 12;
    hours = hours ? hours : 12;
    const strHours = String(hours).padStart(2, '0');

    return `${month}/${day}/${year} ${strHours}:${minutes}:${seconds} ${ampm}`;
  };

  const handleInputChange = (value: string) => {
    setFormData({ name: value });
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'LCP Name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    const isValid = validateForm();

    if (!isValid) {
      showGlobalModal('warning', 'Validation Error', 'LCP Name is required.');
      return;
    }

    setLoading(true);

    try {
      await onSave(formData);
      setLoading(false);
      handleClose();
    } catch (error: any) {
      console.error('Error saving LCP:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save LCP. Please try again.';
      showGlobalModal('error', 'Error', errorMessage);
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!lcpItem) return;
    
    showGlobalModal(
      'confirm',
      'Confirm Deletion',
      `Are you sure you want to permanently delete "${lcpItem.lcp_name}"?`,
      executeDelete
    );
  };

  const executeDelete = async () => {
    if (!lcpItem) return;
    closeGlobalModal();
    setLoading(true);
    
    showGlobalModal('loading', 'Deleting', `Removing ${lcpItem.lcp_name}...`);
    
    try {
      await deleteLcpItem(lcpItem.id);
      setLoading(false);
      showGlobalModal('success', 'Deleted', 'LCP item deleted successfully', () => {
        closeGlobalModal();
        handleClose();
      });
    } catch (error: any) {
      console.error('Error deleting LCP:', error);
      setLoading(false);
      showGlobalModal('error', 'Error', error.response?.data?.message || error.message || 'Failed to delete LCP');
    }
  };

  const handleClose = () => {
    setFormData({
      name: ''
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-end z-[40]" onClick={handleClose}>
        <div
          className={`h-full w-full md:max-w-2xl shadow-2xl transform transition-transform duration-300 ease-in-out overflow-hidden flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-white'
            }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`px-6 py-5 flex items-center justify-between border-b ${isDarkMode
              ? 'bg-gray-800 border-gray-700'
              : 'bg-gray-50 border-gray-200'
            }`}>
            <h2 className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
              {lcpItem ? 'Edit LCP Details' : 'Add New LCP'}
            </h2>
            <div className="flex items-center space-x-3">
              {lcpItem && (
                <button
                  onClick={handleDelete}
                  className={`p-2 rounded-lg transition-all ${isDarkMode
                    ? 'text-gray-400 hover:text-red-400 hover:bg-red-400/10'
                    : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                    }`}
                  title="Delete LCP"
                >
                  <Trash2 size={20} />
                </button>
              )}
              <button
                onClick={handleClose}
                className={`p-2 rounded-lg transition-colors ${isDarkMode 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
              >
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <div className="space-y-4">
              <div className="group">
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 transition-colors ${isDarkMode ? 'text-gray-400 group-focus-within:text-blue-400' : 'text-gray-500 group-focus-within:text-blue-600'
                  }`}>
                  LCP Name<span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder="Enter LCP instance name"
                  className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 shadow-sm focus:ring-2 focus:ring-opacity-50 ring-offset-2 ${isDarkMode ? 'ring-offset-gray-900' : 'ring-offset-white'} ${errors.name 
                    ? 'border-red-500 ring-red-500/20' 
                    : isDarkMode 
                      ? 'border-gray-700 bg-gray-800 text-white focus:border-blue-500 focus:ring-blue-500/20' 
                      : 'border-gray-200 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500/20'
                    }`}
                  autoFocus
                />
                {errors.name && <p className="text-red-500 text-xs font-medium mt-1.5 flex items-center gap-1"><X size={12} /> {errors.name}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="space-y-2">
                  <label className={`block text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Modified Date
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={modifiedDate}
                      readOnly
                      className={`w-full px-4 py-2.5 pr-10 border rounded-lg cursor-not-allowed text-sm font-medium ${isDarkMode
                          ? 'bg-gray-800/50 border-gray-700 text-gray-400'
                          : 'bg-gray-50 border-gray-200 text-gray-500'
                        }`}
                    />
                    <Calendar className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'
                      }`} size={18} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={`block text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Modified By
                  </label>
                  <input
                    type="text"
                    value={modifiedBy}
                    readOnly
                    className={`w-full px-4 py-2.5 border rounded-lg cursor-not-allowed text-sm font-medium ${isDarkMode
                        ? 'bg-gray-800/50 border-gray-700 text-gray-400'
                        : 'bg-gray-50 border-gray-200 text-gray-500'
                      }`}
                  />
                </div>
              </div>
            </div>

            <div className={`mt-auto pt-6 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleClose}
                  className={`flex-1 px-6 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 ${isDarkMode
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-[2] px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm flex items-center justify-center transition-all shadow-lg active:scale-95 ring-2 ring-blue-500 ring-opacity-0 hover:ring-opacity-50"
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
                      <Loader2 className="animate-spin h-5 w-5 mr-3" />
                      Processing...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
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

export default EditLcpModal;
