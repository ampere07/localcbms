import React, { useState, useEffect } from 'react';
import { X, Calendar, Loader2 } from 'lucide-react';

interface AddInventoryCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (categoryData: { name: string; modified_by?: string }) => void;
}

const AddInventoryCategoryModal: React.FC<AddInventoryCategoryModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [categoryName, setCategoryName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [modifiedBy] = useState('ravenampere0123@gmail.com');
  const [modifiedDate, setModifiedDate] = useState('');

  useEffect(() => {
    const now = new Date();
    const formatted = now.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    setModifiedDate(formatted);
  }, []);

  useEffect(() => {
    if (loading) {
      setLoadingProgress(0);
      const interval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      return () => clearInterval(interval);
    }
  }, [loading]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!categoryName.trim()) {
      newErrors.categoryName = 'Category name is required';
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
      console.log('Creating new inventory category:', categoryName);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      onSave({ 
        name: categoryName.trim(),
        modified_by: modifiedBy
      });
      
      setLoadingProgress(100);
      
      setTimeout(() => {
        setLoading(false);
        handleClose();
      }, 500);
    } catch (error: any) {
      console.error('Error creating inventory category:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create inventory category. Please try again.';
      alert(`Error: ${errorMessage}`);
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    
    setCategoryName('');
    setErrors({});
    setLoadingProgress(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-end z-50">
        <div className="h-full w-full max-w-2xl bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out translate-x-0 overflow-hidden flex flex-col">
          <div className="bg-gray-900 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleClose}
                disabled={loading}
                className="text-gray-400 hover:text-white transition-colors disabled:text-gray-600 disabled:cursor-not-allowed"
              >
                <X size={24} />
              </button>
              <h2 className="text-xl font-semibold text-white">Inventory Category Form</h2>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleClose}
                disabled={loading}
                className="px-6 py-2 border border-red-600 text-red-600 hover:bg-red-600 hover:text-white rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-sm flex items-center"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category Name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={categoryName}
                onChange={(e) => {
                  setCategoryName(e.target.value);
                  if (errors.categoryName) {
                    setErrors(prev => ({ ...prev, categoryName: '' }));
                  }
                }}
                placeholder=""
                disabled={loading}
                className={`w-full px-4 py-3 bg-gray-900 border ${errors.categoryName ? 'border-red-500' : 'border-gray-700'} rounded text-white focus:outline-none focus:border-red-500 disabled:bg-gray-800 disabled:cursor-not-allowed`}
                autoFocus
              />
              {errors.categoryName && <p className="text-red-500 text-xs mt-1">{errors.categoryName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Modified By
              </label>
              <div className="inline-block px-4 py-2 bg-gray-800 border border-gray-700 rounded-full text-white text-sm">
                {modifiedBy}
              </div>
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
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded text-gray-400 focus:outline-none cursor-default"
                />
                <Calendar className="absolute right-4 top-3.5 text-gray-500" size={20} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60]">
          <div className="bg-gray-800 rounded-lg p-12 flex flex-col items-center gap-6">
            <Loader2 className="h-16 w-16 text-red-600 animate-spin" />
            <p className="text-white font-bold text-4xl">{Math.round(loadingProgress)}%</p>
          </div>
        </div>
      )}
    </>
  );
};

export default AddInventoryCategoryModal;
