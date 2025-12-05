import React, { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';

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
      alert(`Error: ${errorMessage}`);
      setLoading(false);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-end z-50" onClick={handleClose}>
      <div 
        className="h-full w-3/4 md:w-full md:max-w-2xl bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gray-800 px-6 py-4 flex items-center justify-between border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">
            {lcpItem ? 'Edit LCP' : 'Add LCP'}
          </h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
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
              LCP Name<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Enter LCP name"
              className={`w-full px-3 py-2 bg-gray-800 border ${
                errors.name ? 'border-red-500' : 'border-gray-700'
              } rounded text-white focus:outline-none focus:border-orange-500`}
              autoFocus
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Modified Date
            </label>
            <div className="relative">
              <input
                type="text"
                value={modifiedDate}
                readOnly
                className="w-full px-3 py-2 pr-10 bg-gray-800 border border-gray-700 rounded text-gray-400 cursor-not-allowed"
              />
              <Calendar className="absolute right-3 top-2.5 text-gray-500" size={20} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Modified By
            </label>
            <input
              type="text"
              value={modifiedBy}
              readOnly
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-400 cursor-not-allowed"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditLcpModal;
