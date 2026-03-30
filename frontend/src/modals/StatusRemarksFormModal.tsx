import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import apiClient from '../config/api';
import { settingsColorPaletteService, ColorPalette } from '../services/settingsColorPaletteService';

interface ModalConfig {
  isOpen: boolean;
  type: 'success' | 'error' | 'warning' | 'confirm' | 'loading';
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface StatusRemark {
  id: number;
  status_remarks: string;
}

interface StatusRemarksFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingRemark: StatusRemark | null;
}

const StatusRemarksFormModal: React.FC<StatusRemarksFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingRemark
}) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [colorPalette, setColorPalette] = useState<ColorPalette | null>(null);
  const [formData, setFormData] = useState({
    status_remarks: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [modal, setModal] = useState<ModalConfig>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

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
    if (isOpen && editingRemark) {
      setFormData({
        status_remarks: editingRemark.status_remarks
      });
    } else if (isOpen && !editingRemark) {
      resetForm();
    }
  }, [isOpen, editingRemark]);

  const resetForm = () => {
    setFormData({
      status_remarks: ''
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.status_remarks.trim()) {
      newErrors.status_remarks = 'Status remark is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setModal({
        isOpen: true,
        type: 'warning',
        title: 'Validation Error',
        message: 'Please fill in all required fields.'
      });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        status_remarks: formData.status_remarks.trim()
      };

      const url = editingRemark
        ? `/status-remarks/${editingRemark.id}`
        : `/status-remarks`;

      const method = editingRemark ? 'put' : 'post';

      const response = await apiClient[method](url, payload) as any;

      if (response.data.success) {
        setModal({
          isOpen: true,
          type: 'success',
          title: 'Success',
          message: response.data.message || `Status remark ${editingRemark ? 'updated' : 'added'} successfully`,
          onConfirm: () => {
            onSave();
            handleClose();
            setModal(prev => ({ ...prev, isOpen: false }));
          }
        });
      } else {
        setModal({
          isOpen: true,
          type: 'error',
          title: 'Error',
          message: response.data.message || `Failed to ${editingRemark ? 'update' : 'add'} status remark`
        });
      }
    } catch (error: any) {
      console.error('Error submitting form:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      if (error.response?.data?.errors) {
        const validationMsgs = Object.values(error.response.data.errors).flat().join('\n');
        setModal({
          isOpen: true,
          type: 'error',
          title: 'Validation Errors',
          message: validationMsgs
        });
      } else {
        setModal({
          isOpen: true,
          type: 'error',
          title: 'Error',
          message: `Failed to ${editingRemark ? 'update' : 'add'} status remark: ${errorMessage}`
        });
      }
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-end z-50" onClick={handleClose}>
        <div
          className={`h-full w-3/4 md:w-full md:max-w-2xl shadow-2xl transform transition-transform duration-300 ease-in-out overflow-hidden flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-white'
            }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`px-6 py-4 flex items-center justify-between border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'
            }`}>
            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>{editingRemark ? 'Edit Status Remark' : 'Add Status Remark'}</h2>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleClose}
                className={`px-4 py-2 rounded text-sm transition-colors ${isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                  }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-sm flex items-center transition-colors"
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
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </button>
              <button
                onClick={handleClose}
                className={`transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                Status Remark<span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.status_remarks}
                onChange={(e) => setFormData({ ...formData, status_remarks: e.target.value })}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:border-orange-500 min-h-[120px] ${isDarkMode
                  ? 'bg-gray-800 text-white border-gray-700'
                  : 'bg-white text-gray-900 border-gray-300'
                  } ${errors.status_remarks ? 'border-red-500' : ''}`}
                placeholder="Enter status remark details"
              />
              {errors.status_remarks && <p className="text-red-500 text-xs mt-1">{errors.status_remarks}</p>}
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-[10000] flex items-center justify-center">
          <div className={`rounded-lg p-8 flex flex-col items-center space-y-6 min-w-[320px] ${isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
            <Loader2
              className="w-20 h-20 animate-spin"
              style={{ color: colorPalette?.primary || '#7c3aed' }}
            />
          </div>
        </div>
      )}

      {modal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60]">
          <div className={`border rounded-lg p-8 max-w-md w-full mx-4 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
            }`}>
            {modal.type === 'loading' ? (
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-4" style={{ borderColor: colorPalette?.primary || '#7c3aed' }}></div>
                </div>
                <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>{modal.title}</h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>{modal.message}</p>
              </div>
            ) : (
              <>
                <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>{modal.title}</h3>
                <p className={`mb-6 whitespace-pre-line ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>{modal.message}</p>
                <div className="flex items-center justify-end gap-3">
                  {modal.type === 'confirm' ? (
                    <>
                      <button
                        onClick={modal.onCancel}
                        className={`px-4 py-2 rounded transition-colors ${isDarkMode
                          ? 'bg-gray-700 hover:bg-gray-600 text-white'
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                          }`}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={modal.onConfirm}
                        className="px-4 py-2 text-white rounded transition-colors"
                        style={{
                          backgroundColor: colorPalette?.primary || '#7c3aed'
                        }}
                        onMouseEnter={(e) => {
                          if (colorPalette?.accent) {
                            e.currentTarget.style.backgroundColor = colorPalette.accent;
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = colorPalette?.primary || '#7c3aed';
                        }}
                      >
                        Confirm
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        if (modal.onConfirm) {
                          modal.onConfirm();
                        } else {
                          setModal({ ...modal, isOpen: false });
                        }
                      }}
                      className="px-4 py-2 text-white rounded transition-colors"
                      style={{
                        backgroundColor: colorPalette?.primary || '#7c3aed'
                      }}
                      onMouseEnter={(e) => {
                        if (colorPalette?.accent) {
                          e.currentTarget.style.backgroundColor = colorPalette.accent;
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = colorPalette?.primary || '#7c3aed';
                      }}
                    >
                      OK
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default StatusRemarksFormModal;
