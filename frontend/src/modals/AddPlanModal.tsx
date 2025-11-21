import React, { useState, useEffect } from 'react';
import { X, Plus, Minus } from 'lucide-react';

interface AddPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingPlan?: Plan | null;
}

interface Plan {
  id: number;
  name: string;
  description?: string;
  price: number;
  is_active?: boolean;
  modified_date?: string;
  modified_by?: string;
  created_at?: string;
  updated_at?: string;
}

const AddPlanModal: React.FC<AddPlanModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingPlan
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://backend.atssfiber.ph/api';

  useEffect(() => {
    if (isOpen && editingPlan) {
      setFormData({
        name: editingPlan.name,
        description: editingPlan.description || '',
        price: editingPlan.price || 0
      });
    } else if (isOpen && !editingPlan) {
      resetForm();
    }
  }, [isOpen, editingPlan]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Plan name is required';
    }

    if (formData.price < 0) {
      newErrors.price = 'Price cannot be negative';
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
        description: formData.description.trim(),
        price: formData.price
      };

      const url = editingPlan 
        ? `${API_BASE_URL}/plans/${editingPlan.id}`
        : `${API_BASE_URL}/plans`;
      
      const method = editingPlan ? 'PUT' : 'POST';

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
        alert(data.message || `Plan ${editingPlan ? 'updated' : 'added'} successfully`);
        onSave();
        handleClose();
      } else {
        if (data.errors) {
          const errorMessages = Object.values(data.errors).flat().join('\n');
          alert('Validation errors:\n' + errorMessages);
        } else {
          alert(data.message || `Failed to ${editingPlan ? 'update' : 'add'} plan`);
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert(`Failed to ${editingPlan ? 'update' : 'add'} plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const incrementPrice = () => {
    setFormData({ ...formData, price: formData.price + 1 });
  };

  const decrementPrice = () => {
    if (formData.price > 0) {
      setFormData({ ...formData, price: formData.price - 1 });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-end z-50" onClick={handleClose}>
      <div 
        className="h-full w-3/4 md:w-full md:max-w-2xl bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gray-800 px-6 py-4 flex items-center justify-between border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">{editingPlan ? 'Edit Plan' : 'Add Plan'}</h2>
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
              Plan Name<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3 py-2 bg-gray-800 border ${errors.name ? 'border-red-500' : 'border-gray-700'} rounded text-white focus:outline-none focus:border-orange-500`}
              placeholder="Enter plan name"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
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
              placeholder="Enter plan description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Price<span className="text-red-500">*</span>
            </label>
            <div className="flex items-stretch">
              <div className="flex items-center px-4 bg-gray-800 border border-gray-700 rounded-l-lg border-r-0">
                <span className="text-gray-400 font-medium">₱</span>
              </div>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) || 0 })}
                className={`flex-1 px-4 py-3 bg-gray-800 text-white border ${errors.price ? 'border-red-500' : 'border-gray-700'} focus:border-orange-500 focus:outline-none text-center border-l-0 border-r-0`}
                step="0.01"
                min="0"
              />
              <div className="flex flex-col border-t border-b border-r border-gray-700 rounded-r-lg overflow-hidden bg-gray-800">
                <button
                  type="button"
                  onClick={incrementPrice}
                  className="flex-1 px-3 py-1.5 text-gray-400 hover:text-white hover:bg-gray-600 flex items-center justify-center border-b border-gray-700"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={decrementPrice}
                  className="flex-1 px-3 py-1.5 text-gray-400 hover:text-white hover:bg-gray-600 flex items-center justify-center"
                >
                  <Minus className="h-4 w-4" />
                </button>
              </div>
            </div>
            {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
          </div>

          <div>
            <div className="p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
              <p className="text-blue-300 text-sm">
                <strong>Note:</strong> Modified date and user information will be set automatically when the plan is created or updated.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddPlanModal;
