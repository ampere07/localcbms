import React, { useState, useEffect } from 'react';
import { X, Calendar, Loader2 } from 'lucide-react';
import { settingsColorPaletteService, ColorPalette } from '../services/settingsColorPaletteService';
import { Concern } from '../services/concernService';
import LoadingModalGlobal from '../components/LoadingModalGlobal';

interface ModalConfig {
  isOpen: boolean;
  type: 'success' | 'error' | 'warning' | 'confirm' | 'loading';
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface EditConcernModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (concernData: ConcernFormData) => void;
  concernItem: Concern | null;
}

interface ConcernFormData {
  name: string;
  userId?: number;
}

const EditConcernModal: React.FC<EditConcernModalProps> = ({
  isOpen,
  onClose,
  onSave,
  concernItem
}) => {
  const [formData, setFormData] = useState<ConcernFormData>({
    name: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingPercentage, setLoadingPercentage] = useState(0);
  const [modal, setModal] = useState<ModalConfig>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  const [modifiedDate, setModifiedDate] = useState<string>('');
  const [modifiedBy, setModifiedBy] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') === 'dark');
  const [colorPalette, setColorPalette] = useState<ColorPalette | null>(null);

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
    const authData = localStorage.getItem('authData');
    let userEmail = 'Unknown User';
    let userId: number | undefined;

    if (authData) {
      try {
        const userData = JSON.parse(authData);
        userEmail = userData.email || userData.email_address || 'Unknown User';
        userId = userData.id || userData.user_id;
      } catch (error) {
        console.error('Error parsing auth data:', error);
      }
    }

    setModifiedBy(userEmail);

    if (isOpen) {
      if (concernItem) {
        setFormData({
          name: concernItem.concern_name,
          userId: userId
        });
      } else {
        setFormData({
          name: '',
          userId: userId
        });
      }

      const now = new Date();
      const formattedDate = formatDateTime(now);
      setModifiedDate(formattedDate);
    }
  }, [isOpen, concernItem]);

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
    setFormData(prev => ({ ...prev, name: value }));
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Concern name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setLoadingPercentage(0);

    const progressInterval = setInterval(() => {
      setLoadingPercentage(prev => {
        if (prev >= 99) return 99;
        if (prev >= 90) return prev + 1;
        if (prev >= 70) return prev + 2;
        return prev + 5;
      });
    }, 300);

    try {
      await onSave(formData);
      
      clearInterval(progressInterval);
      setLoadingPercentage(100);
      
      setTimeout(() => {
        setLoading(false);
        setModal({
          isOpen: true,
          type: 'success',
          title: 'Success',
          message: concernItem ? 'Concern updated successfully.' : 'Concern added successfully.',
          onConfirm: () => {
            setModal(prev => ({ ...prev, isOpen: false }));
            handleClose();
          }
        });
      }, 500);
    } catch (error: any) {
      clearInterval(progressInterval);
      setLoading(false);
      
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to save concern. Please try again.';
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error Saving Concern',
        message: errorMessage,
        onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
      });
    }
  };

  const handleClose = () => {
    setFormData({
      name: ''
    });
    setErrors({});
    onClose();
  };

  if (!isOpen && !modal.isOpen && !loading) return null;

  return (
    <>
      <LoadingModalGlobal
        isOpen={loading}
        type="loading"
        title="Processing"
        message={concernItem ? 'Updating concern...' : 'Adding concern...'}
        loadingPercentage={loadingPercentage}
        isDarkMode={isDarkMode}
        colorPalette={colorPalette}
      />

      <LoadingModalGlobal
        isOpen={modal.isOpen}
        type={modal.type as any}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm || (() => setModal(prev => ({ ...prev, isOpen: false })))}
        onCancel={modal.onCancel}
        isDarkMode={isDarkMode}
        colorPalette={colorPalette}
      />

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-end z-50" onClick={handleClose}>
          <div
            className={`h-full w-3/4 md:w-full md:max-w-2xl shadow-2xl transform transition-transform duration-300 ease-in-out overflow-hidden flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-white'
              }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`px-6 py-4 flex items-center justify-between border-b ${isDarkMode
                ? 'bg-gray-800 border-gray-700'
                : 'bg-gray-100 border-gray-300'
              }`}>
              <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                {concernItem ? 'Edit Concern' : 'Add Concern'}
              </h2>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleClose}
                  className={`px-4 py-2 rounded text-sm ${isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                    }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-sm font-medium flex items-center transition-all active:scale-95"
                  style={{
                    backgroundColor: colorPalette?.primary || '#7c3aed'
                  }}
                  onMouseEnter={(e) => {
                    if (colorPalette?.accent && !loading) {
                      e.currentTarget.style.backgroundColor = colorPalette.accent;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colorPalette?.primary || '#7c3aed';
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
                <button
                  onClick={handleClose}
                  className={isDarkMode ? 'text-gray-400 hover:text-white transition-colors' : 'text-gray-600 hover:text-gray-900 transition-colors'}
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                  Concern Name<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder="Enter concern name"
                  className={`w-full px-3 py-2 border rounded focus:outline-none focus:border-orange-500 ${errors.name ? 'border-red-500' : isDarkMode ? 'border-gray-700' : 'border-gray-300'
                    } ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
                    }`}
                  autoFocus
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                  Modified Date
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={modifiedDate}
                    readOnly
                    className={`w-full px-3 py-2 pr-10 border rounded cursor-not-allowed ${isDarkMode
                        ? 'bg-gray-800 border-gray-700 text-gray-400'
                        : 'bg-gray-100 border-gray-300 text-gray-500'
                      }`}
                  />
                  <Calendar className={`absolute right-3 top-2.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    }`} size={20} />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                  Modified By
                </label>
                <input
                  type="text"
                  value={modifiedBy}
                  readOnly
                  className={`w-full px-3 py-2 border rounded cursor-not-allowed ${isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-gray-400'
                      : 'bg-gray-100 border-gray-300 text-gray-500'
                    }`}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EditConcernModal;

