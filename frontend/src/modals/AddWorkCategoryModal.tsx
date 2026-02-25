import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { settingsColorPaletteService, ColorPalette } from '../services/settingsColorPaletteService';

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

interface SuccessModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
  isDarkMode: boolean;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, message, onClose, isDarkMode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className={`p-6 rounded-lg shadow-xl max-w-sm w-full mx-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Success!</h3>
          <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>{message}</p>
          <button
            onClick={onClose}
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none sm:text-sm"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

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
  const [successModalConfig, setSuccessModalConfig] = useState({ isOpen: false, message: '' });

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
      newErrors.category = 'work category name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
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
        setSuccessModalConfig({
          isOpen: true,
          message: data.message || `Work category ${editingWorkCategory ? 'updated' : 'added'} successfully`
        });
      } else {
        if (data.errors) {
          const errorMessages = Object.values(data.errors).flat().join('\n');
          alert('Validation errors:\n' + errorMessages);
        } else {
          alert(data.message || `Failed to ${editingWorkCategory ? 'update' : 'add'} work category`);
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert(`Failed to ${editingWorkCategory ? 'update' : 'add'} work category: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSuccessClose = () => {
    setSuccessModalConfig({ isOpen: false, message: '' });
    onSave();
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <>
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
              }`}>{editingWorkCategory ? 'Edit Work Category' : 'Add Work Category'}</h2>
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
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-sm flex items-center"
                style={{
                  backgroundColor: colorPalette?.primary || '#ea580c'
                }}
                onMouseEnter={(e) => {
                  if (colorPalette?.accent && !loading) {
                    e.currentTarget.style.backgroundColor = colorPalette.accent;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colorPalette?.primary || '#ea580c';
                }}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
                Work Category Name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:border-orange-500 ${errors.category ? 'border-red-500' : isDarkMode ? 'border-gray-700' : 'border-gray-300'
                  } ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
                  }`}
                placeholder="Enter work category name"
              />
              {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
            </div>

            <div>
              <div className={`p-4 border rounded-lg ${isDarkMode
                ? 'bg-blue-900/20 border-blue-700/30'
                : 'bg-blue-50 border-blue-200'
                }`}>
                <p className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-700'
                  }`}>
                  <strong>Note:</strong> work categories are used to categorize different types of usage in the system. Created and updated date information will be set automatically.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <SuccessModal
        isOpen={successModalConfig.isOpen}
        message={successModalConfig.message}
        onClose={handleSuccessClose}
        isDarkMode={isDarkMode}
      />
    </>
  );
};

export default AddWorkCategoryModal;
