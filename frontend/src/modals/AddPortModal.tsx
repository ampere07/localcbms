import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface AddPortModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingPort?: Port | null;
}

interface Port {
  id: number;
  PORT_ID: string;
  Label: string;
  created_at?: string;
  updated_at?: string;
}

const AddPortModal: React.FC<AddPortModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingPort
}) => {
  const [formData, setFormData] = useState({
    port_id: '',
    label: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://backend.atssfiber.ph/api';

  useEffect(() => {
    if (isOpen && editingPort) {
      setFormData({
        port_id: editingPort.PORT_ID,
        label: editingPort.Label
      });
    } else if (isOpen && !editingPort) {
      resetForm();
    }
  }, [isOpen, editingPort]);

  const resetForm = () => {
    setFormData({
      port_id: '',
      label: ''
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.port_id.trim()) {
      newErrors.port_id = 'Port ID is required';
    }

    if (!formData.label.trim()) {
      newErrors.label = 'Label is required';
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
        port_id: formData.port_id.trim(),
        label: formData.label.trim()
      };

      const url = editingPort 
        ? `${API_BASE_URL}/ports/${editingPort.id}`
        : `${API_BASE_URL}/ports`;
      
      const method = editingPort ? 'PUT' : 'POST';

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
        alert(data.message || `Port ${editingPort ? 'updated' : 'added'} successfully`);
        onSave();
        handleClose();
      } else {
        if (data.errors) {
          const errorMessages = Object.values(data.errors).flat().join('\n');
          alert('Validation errors:\n' + errorMessages);
        } else {
          alert(data.message || `Failed to ${editingPort ? 'update' : 'add'} port`);
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert(`Failed to ${editingPort ? 'update' : 'add'} port: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
          <h2 className="text-xl font-semibold text-white">{editingPort ? 'Edit Port' : 'Add Port'}</h2>
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
              Port ID<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.port_id}
              onChange={(e) => setFormData({ ...formData, port_id: e.target.value })}
              className={`w-full px-3 py-2 bg-gray-800 border ${errors.port_id ? 'border-red-500' : 'border-gray-700'} rounded text-white focus:outline-none focus:border-orange-500`}
              placeholder="Enter port ID"
            />
            {errors.port_id && <p className="text-red-500 text-xs mt-1">{errors.port_id}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Label<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className={`w-full px-3 py-2 bg-gray-800 border ${errors.label ? 'border-red-500' : 'border-gray-700'} rounded text-white focus:outline-none focus:border-orange-500`}
              placeholder="Enter label"
            />
            {errors.label && <p className="text-red-500 text-xs mt-1">{errors.label}</p>}
          </div>

          <div>
            <div className="p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
              <p className="text-blue-300 text-sm">
                <strong>Note:</strong> Created and updated date information will be set automatically when the port is created or updated.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddPortModal;
