import React, { useState, useEffect } from 'react';
import { X, Loader2, CreditCard } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { settingsColorPaletteService, ColorPalette } from '../services/settingsColorPaletteService';
import LoadingModalGlobal from '../components/LoadingModalGlobal';

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
      showGlobalModal('warning', 'Validation Error', 'Payment method name is required.');
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
        showGlobalModal('success', 'Success', data.message || `Payment method ${editingPaymentMethod ? 'updated' : 'added'} successfully`, () => {
          onSave();
          handleClose();
          closeGlobalModal();
        });
      } else {
        if (data.errors) {
          const errorMessages = Object.values(data.errors).flat().join('\n');
          showGlobalModal('error', 'Validation Fail', errorMessages);
        } else {
          showGlobalModal('error', 'Update Failed', data.message || `Failed to ${editingPaymentMethod ? 'update' : 'add'} method`);
        }
      }
    } catch (error: any) {
      console.error('Error submitting form:', error);
      showGlobalModal('error', 'System Error', `Failed to finalize request: ${error.message}`);
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
      <div className="fixed inset-0 bg-black bg-opacity-65 backdrop-blur-sm flex items-center justify-end z-[40]" onClick={handleClose}>
        <div
          className={`h-full w-full md:max-w-2xl shadow-3xl transform transition-transform duration-300 ease-out flex flex-col ${isDarkMode ? 'bg-gray-950 border-l border-white/5' : 'bg-white border-l border-gray-200'
            }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`px-8 py-8 flex items-center justify-between border-b ${isDarkMode
              ? 'bg-gray-900/40 border-gray-800'
              : 'bg-gray-50 border-gray-200'
            }`}>
            <div className="flex flex-col">
              <h2 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {editingPaymentMethod ? 'Configure Gateway' : 'New Payment Portal'}
              </h2>
              <p className={`text-xs mt-1 font-bold tracking-wide uppercase opacity-60 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {editingPaymentMethod ? 'Update existing financial channel' : 'Establish a new payment reception point'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleClose}
                className={`p-2 rounded-full transition-all active:scale-90 ${isDarkMode ? 'hover:bg-gray-800 text-gray-500' : 'hover:bg-gray-100 text-gray-400'}`}
              >
                <X size={28} />
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
            <div className="space-y-8">
              <div className="group">
                <label className={`block text-[10px] font-black uppercase tracking-[0.2em] mb-3 transition-colors ${isDarkMode ? 'text-gray-600 group-focus-within:text-emerald-500' : 'text-gray-400 group-focus-within:text-emerald-600'}`}>
                  Payment Method Identifier<span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.payment_method}
                    onChange={(e) => {
                      setFormData({ ...formData, payment_method: e.target.value });
                      if (errors.payment_method) setErrors({...errors, payment_method: ''});
                    }}
                    className={`w-full px-6 py-4.5 rounded-2xl border-2 transition-all duration-300 focus:outline-none focus:ring-8 ${isDarkMode 
                      ? 'bg-gray-900 text-white border-gray-800 focus:border-emerald-500/50 focus:ring-emerald-500/5' 
                      : 'bg-white text-gray-900 border-gray-100 focus:border-emerald-600/50 focus:ring-emerald-600/5 shadow-xl shadow-gray-200/50'
                      } ${errors.payment_method ? 'border-red-500/50 ring-red-500/5' : ''}`}
                    placeholder="e.g. G-Cash, PayMaya, Bank Transfer"
                    autoFocus
                  />
                  {errors.payment_method && (
                    <p className="mt-2 text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                      <X size={10} /> {errors.payment_method}
                    </p>
                  )}
                </div>
              </div>

              <div className={`p-6 rounded-3xl border-2 flex gap-6 ${isDarkMode
                  ? 'bg-emerald-500/[0.03] border-emerald-500/10'
                  : 'bg-emerald-50 border-emerald-100 shadow-inner'
                }`}>
                <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                  <CreditCard size={32} strokeWidth={2.5} />
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className={`text-base font-black ${isDarkMode ? 'text-emerald-400' : 'text-emerald-900'}`}>Financial Compliance</h4>
                  <p className={`text-xs leading-relaxed font-bold opacity-70 ${isDarkMode ? 'text-emerald-300/60' : 'text-emerald-700/80'}`}>
                    Ensure the method name matches the provider's official designation. This field is used for automated reconciliation and accounting reports. Incorrect naming can lead to audit discrepancies.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className={`p-8 border-t flex gap-4 ${isDarkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
            <button
              onClick={handleClose}
              className={`flex-1 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 ${isDarkMode
                  ? 'bg-gray-800 text-gray-500 hover:text-white'
                  : 'bg-white text-gray-400 hover:text-gray-900 shadow-sm'
                }`}
            >
              Discard Changes
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-[2] px-10 py-4 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center shadow-2xl shadow-emerald-500/20 active:scale-95 transition-all"
              style={{
                backgroundColor: colorPalette?.primary || '#10b981'
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
                  <Loader2 size={20} className="animate-spin mr-3" />
                  Synchronizing...
                </>
              ) : (
                'Finalize Configuration'
              )}
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

export default AddPaymentMethodModal;
