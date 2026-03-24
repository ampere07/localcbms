import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { settingsColorPaletteService, ColorPalette } from '../services/settingsColorPaletteService';

interface AddPaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingPaymentMethod?: PaymentMethod | null;
}

interface PaymentMethod {
  id: number;
  payment_method: string;
  created_at?: string;
  updated_at?: string;
  created_by_user_id?: number;
  updated_by_user_id?: number;
}

const AddPaymentMethodModal: React.FC<AddPaymentMethodModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingPaymentMethod
}) => {
  const [formData, setFormData] = useState({
    payment_method: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
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
    if (isOpen && editingPaymentMethod) {
      setFormData({
        payment_method: editingPaymentMethod.payment_method
      });
    } else if (isOpen && !editingPaymentMethod) {
      resetForm();
    }
  }, [isOpen, editingPaymentMethod]);

  const resetForm = () => {
    setFormData({
      payment_method: ''
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.payment_method.trim()) {
      newErrors.payment_method = 'Payment method name is required';
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
      const payload = {
        payment_method: formData.payment_method.trim()
      };

      const url = editingPaymentMethod
        ? `${API_BASE_URL}/payment-methods/${editingPaymentMethod.id}`
        : `${API_BASE_URL}/payment-methods`;

      const method = editingPaymentMethod ? 'PUT' : 'POST';

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
        alert(data.message || `Payment method ${editingPaymentMethod ? 'updated' : 'added'} successfully`);
        onSave();
        handleClose();
      } else {
        if (data.errors) {
          const errorMessages = Object.values(data.errors).flat().join('\n');
          alert('Validation errors:\n' + errorMessages);
        } else {
          alert(data.message || `Failed to ${editingPaymentMethod ? 'update' : 'add'} payment method`);
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert(`Failed to ${editingPaymentMethod ? 'update' : 'add'} payment method: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
            }`}>{editingPaymentMethod ? 'Edit Payment Method' : 'Add Payment Method'}</h2>
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
              Payment Method Name<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:border-orange-500 ${errors.payment_method ? 'border-red-500' : isDarkMode ? 'border-gray-700' : 'border-gray-300'
                } ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
                }`}
              placeholder="Enter payment method name"
            />
            {errors.payment_method && <p className="text-red-500 text-xs mt-1">{errors.payment_method}</p>}
          </div>

          <div>
            <div className={`p-4 border rounded-lg ${isDarkMode
                ? 'bg-blue-900/20 border-blue-700/30'
                : 'bg-blue-50 border-blue-200'
              }`}>
              <p className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-700'
                }`}>
                <strong>Note:</strong> Payment methods are used to categorize different ways customers can pay their bills. Created and updated date information will be set automatically.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddPaymentMethodModal;
