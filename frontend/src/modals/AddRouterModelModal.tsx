import React, { useState, useEffect } from 'react';
import { X, User, Calendar } from 'lucide-react';

interface RouterModel {
  SN: string;
  Model?: string;
  brand?: string;
  description?: string;
  is_active?: boolean;
  modified_date?: string;
  modified_by?: string;
  created_at?: string;
  updated_at?: string;
}

interface AddRouterModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingRouter?: RouterModel | null;
}

const AddRouterModelModal: React.FC<AddRouterModelModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingRouter
}) => {
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    description: '',
    modifiedDate: new Date().toISOString().slice(0, 16),
    modifiedBy: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

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

    if (isOpen && editingRouter) {
      setFormData({
        brand: editingRouter.brand || '',
        model: editingRouter.Model || '',
        description: editingRouter.description || '',
        modifiedDate: new Date().toISOString().slice(0, 16),
        modifiedBy: userEmail
      });
    } else if (isOpen && !editingRouter) {
      setFormData({
        brand: '',
        model: '',
        description: '',
        modifiedDate: new Date().toISOString().slice(0, 16),
        modifiedBy: userEmail
      });
    }
  }, [isOpen, editingRouter]);

  const resetForm = () => {
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

    setFormData({
      brand: '',
      model: '',
      description: '',
      modifiedDate: new Date().toISOString().slice(0, 16),
      modifiedBy: userEmail
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.brand.trim()) {
      newErrors.brand = 'Brand is required';
    }

    if (!formData.model.trim()) {
      newErrors.model = 'Model is required';
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
        brand: formData.brand.trim(),
        model: formData.model.trim(),
        description: formData.description.trim()
      };

      const url = editingRouter 
        ? `${API_BASE_URL}/router-models/${editingRouter.SN}`
        : `${API_BASE_URL}/router-models`;
      
      const method = editingRouter ? 'PUT' : 'POST';

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
        alert(data.message || `Router model ${editingRouter ? 'updated' : 'added'} successfully`);
        onSave();
        handleClose();
      } else {
        if (data.errors) {
          const errorMessages = Object.values(data.errors).flat().join('\n');
          alert('Validation errors:\n' + errorMessages);
        } else {
          alert(data.message || `Failed to ${editingRouter ? 'update' : 'add'} router model`);
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert(`Failed to ${editingRouter ? 'update' : 'add'} router model: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
          <h2 className="text-xl font-semibold text-white">{editingRouter ? 'Edit Router Model' : 'Add Router Model'}</h2>
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
              Brand<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              className={`w-full px-3 py-2 bg-gray-800 border ${errors.brand ? 'border-red-500' : 'border-gray-700'} rounded text-white focus:outline-none focus:border-orange-500`}
              placeholder="Enter router brand"
            />
            {errors.brand && <p className="text-red-500 text-xs mt-1">{errors.brand}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Model<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              className={`w-full px-3 py-2 bg-gray-800 border ${errors.model ? 'border-red-500' : 'border-gray-700'} rounded text-white focus:outline-none focus:border-orange-500`}
              placeholder="Enter router model"
            />
            {errors.model && <p className="text-red-500 text-xs mt-1">{errors.model}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-orange-500 resize-none"
              placeholder="Enter router description or specifications"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Modified By
            </label>
            <div className="relative">
              <input
                type="email"
                value={formData.modifiedBy}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-orange-500"
                placeholder="Current user email"
                readOnly
              />
              <User className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Modified Date
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                value={formData.modifiedDate}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-orange-500"
                readOnly
              />
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none" />
            </div>
          </div>

          <div>
            <div className="p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
              <p className="text-blue-300 text-sm">
                <strong>Note:</strong> Serial Number (SN) will be automatically generated based on brand and model. Modified date and user information will be set automatically when the router model is created or updated.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddRouterModelModal;
