import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';

interface Promo {
  id: number;
  name: string;
  status?: string;
}

interface PromoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingPromo: Promo | null;
}

const PromoFormModal: React.FC<PromoFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingPromo
}) => {
  const [formData, setFormData] = useState({
    name: '',
    status: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://backend.atssfiber.ph/api';

  useEffect(() => {
    if (isOpen && editingPromo) {
      setFormData({
        name: editingPromo.name,
        status: editingPromo.status || ''
      });
    } else if (isOpen && !editingPromo) {
      resetForm();
    }
  }, [isOpen, editingPromo]);

  const resetForm = () => {
    setFormData({
      name: '',
      status: ''
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Promo name is required';
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
        name: formData.name.trim(),
        status: formData.status.trim()
      };

      const url = editingPromo 
        ? `${API_BASE_URL}/promos/${editingPromo.id}`
        : `${API_BASE_URL}/promos`;
      
      const method = editingPromo ? 'PUT' : 'POST';

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
        alert(data.message || `Promo ${editingPromo ? 'updated' : 'added'} successfully`);
        onSave();
        handleClose();
      } else {
        if (data.errors) {
          const errorMessages = Object.values(data.errors).flat().join('\n');
          alert('Validation errors:\n' + errorMessages);
        } else {
          alert(data.message || `Failed to ${editingPromo ? 'update' : 'add'} promo`);
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert(`Failed to ${editingPromo ? 'update' : 'add'} promo: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        className="h-full w-3/4 md:w-full md:max-w-2xl bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gray-800 px-6 py-4 flex items-center justify-between border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">{editingPromo ? 'Edit Promo' : 'Add Promo'}</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-sm flex items-center"
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
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Promo Name<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3 py-2 bg-gray-800 border ${errors.name ? 'border-red-500' : 'border-gray-700'} rounded text-white focus:outline-none focus:border-orange-500`}
              placeholder="Enter promo name"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-orange-500"
            >
              <option value="">Select Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div>
            <div className="p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
              <p className="text-blue-300 text-sm">
                <strong>Note:</strong> Created and updated timestamps will be set automatically when the promo is created or updated.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoFormModal;
