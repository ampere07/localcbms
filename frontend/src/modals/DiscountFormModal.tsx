import React, { useState, useEffect } from 'react';
import { X, ChevronDown, Minus, Plus } from 'lucide-react';
import LoadingModal from '../components/LoadingModal';
import * as discountService from '../services/discountService';

interface DiscountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: DiscountFormData) => void;
  customerData?: any;
}

interface DiscountFormData {
  accountId: number | null;
  discountAmount: string;
  remaining: string;
  status: string;
  processedDate: string;
  processedByUserId: number | null;
  approvedByUserId: number | null;
  remarks: string;
}

const DiscountFormModal: React.FC<DiscountFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  customerData
}) => {
  const getCurrentDateTime = () => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState<DiscountFormData>(() => ({
    accountId: null,
    discountAmount: '0.00',
    remaining: '0.00',
    status: 'Unused',
    processedDate: getCurrentDateTime(),
    processedByUserId: null,
    approvedByUserId: null,
    remarks: ''
  }));

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingPercentage, setLoadingPercentage] = useState(0);

  useEffect(() => {
    if (customerData) {
      setFormData(prev => ({
        ...prev,
        accountId: customerData.accountId || null
      }));
    }
  }, [customerData]);

  useEffect(() => {
    if (formData.status === 'Monthly') {
      if (!formData.remaining || parseFloat(formData.remaining) === parseFloat(formData.discountAmount)) {
        setFormData(prev => ({
          ...prev,
          remaining: '0'
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        remaining: '0'
      }));
    }
  }, [formData.status]);

  const handleInputChange = (field: keyof DiscountFormData, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleDiscountAmountChange = (operation: 'increase' | 'decrease') => {
    const currentValue = parseFloat(formData.discountAmount) || 0;
    const increment = 0.01;
    let newValue: number;

    if (operation === 'increase') {
      newValue = currentValue + increment;
    } else {
      newValue = Math.max(0, currentValue - increment);
    }

    setFormData(prev => ({
      ...prev,
      discountAmount: newValue.toFixed(2)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.accountId) newErrors.accountId = 'Account No. is required';
    if (!formData.discountAmount.trim()) newErrors.discountAmount = 'Discount Amount is required';
    if (!formData.processedByUserId) newErrors.processedByUserId = 'Processed By is required';
    if (!formData.approvedByUserId) newErrors.approvedByUserId = 'Approved By is required';

    const discountAmount = parseFloat(formData.discountAmount);
    if (isNaN(discountAmount) || discountAmount <= 0) {
      newErrors.discountAmount = 'Discount Amount must be greater than 0';
    }

    if (formData.status === 'Monthly') {
      const remaining = parseInt(formData.remaining);
      if (isNaN(remaining) || remaining <= 0) {
        newErrors.remaining = 'Remaining cycles must be greater than 0 for Monthly discounts';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    console.log('Discount save button clicked!', formData);
    
    const isValid = validateForm();
    console.log('Discount form validation result:', isValid);
    
    if (!isValid) {
      console.log('Discount form validation failed. Errors:', errors);
      alert('Please fill in all required fields before saving.');
      return;
    }

    setLoading(true);
    setLoadingPercentage(0);
    try {
      console.log('Creating discount with data:', formData);
      
      setLoadingPercentage(20);
      
      const payload: discountService.DiscountData = {
        account_id: formData.accountId!,
        discount_amount: parseFloat(formData.discountAmount) || 0,
        remaining: parseInt(formData.remaining) || 0,
        status: formData.status as 'Unused' | 'Used' | 'Permanent' | 'Monthly',
        processed_date: formData.processedDate,
        processed_by_user_id: formData.processedByUserId!,
        approved_by_user_id: formData.approvedByUserId!,
        remarks: formData.remarks || ''
      };
      
      setLoadingPercentage(50);
      const result = await discountService.create(payload);
      
      setLoadingPercentage(100);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      alert('Discount created successfully!');
      onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error creating discount:', error);
      alert(`Failed to save discount: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
      setLoadingPercentage(0);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <LoadingModal 
        isOpen={loading} 
        message="Saving discount..." 
        percentage={loadingPercentage} 
      />
      
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-end z-50">
        <div className="h-full w-full max-w-2xl bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out translate-x-0 overflow-hidden flex flex-col">
          <div className="bg-gray-800 px-6 py-4 flex items-center justify-between border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">Discounted Form</h2>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleCancel}
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
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Account No.<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.accountId || ''}
                  onChange={(e) => handleInputChange('accountId', parseInt(e.target.value) || null)}
                  className={`w-full px-3 py-2 bg-gray-800 border ${errors.accountId ? 'border-red-500' : 'border-gray-700'} rounded text-white focus:outline-none focus:border-orange-500 appearance-none`}
                >
                  <option value="">Select Account</option>
                  <option value={customerData?.accountId || ''}>
                    {customerData?.accountNo || ''} | {customerData?.fullName || ''} | {customerData?.address || ''}
                  </option>
                </select>
                <ChevronDown className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={20} />
              </div>
              {errors.accountId && <p className="text-red-500 text-xs mt-1">{errors.accountId}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Discount Status
              </label>
              <div className="relative">
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-orange-500 appearance-none"
                >
                  <option value="Unused">Unused</option>
                  <option value="Used">Used</option>
                  <option value="Permanent">Permanent</option>
                  <option value="Monthly">Monthly</option>
                </select>
                <ChevronDown className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={20} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Discount Amount<span className="text-red-500">*</span>
              </label>
              <div className="flex items-center">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={`₱ ${formData.discountAmount}`}
                    onChange={(e) => handleInputChange('discountAmount', e.target.value.replace('₱ ', '').replace(/[^0-9.]/g, ''))}
                    className={`w-full px-3 py-2 bg-gray-800 border ${errors.discountAmount ? 'border-red-500' : 'border-gray-700'} rounded-l text-white focus:outline-none focus:border-orange-500`}
                  />
                </div>
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => handleDiscountAmountChange('decrease')}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white border border-gray-700 border-l-0 text-sm"
                  >
                    <Minus size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDiscountAmountChange('increase')}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white border border-gray-700 border-l-0 border-t-0 rounded-r text-sm"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              {errors.discountAmount && <p className="text-red-500 text-xs mt-1">{errors.discountAmount}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Processed By<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.processedByUserId || ''}
                  onChange={(e) => handleInputChange('processedByUserId', parseInt(e.target.value) || null)}
                  className={`w-full px-3 py-2 bg-gray-800 border ${errors.processedByUserId ? 'border-red-500' : 'border-gray-700'} rounded text-white focus:outline-none focus:border-orange-500 appearance-none`}
                >
                  <option value="">Select Processor</option>
                  <option value="1">admin@ampere.com</option>
                  <option value="2">billing@ampere.com</option>
                  <option value="3">finance@ampere.com</option>
                </select>
                <ChevronDown className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={20} />
              </div>
              {errors.processedByUserId && <p className="text-red-500 text-xs mt-1">{errors.processedByUserId}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Approved By<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.approvedByUserId || ''}
                  onChange={(e) => handleInputChange('approvedByUserId', parseInt(e.target.value) || null)}
                  className={`w-full px-3 py-2 bg-gray-800 border ${errors.approvedByUserId ? 'border-red-500' : 'border-gray-700'} rounded text-white focus:outline-none focus:border-orange-500 appearance-none`}
                >
                  <option value="">Select Approver</option>
                  <option value="1">admin@ampere.com</option>
                  <option value="4">manager@ampere.com</option>
                  <option value="5">supervisor@ampere.com</option>
                </select>
                <ChevronDown className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={20} />
              </div>
              {errors.approvedByUserId && <p className="text-red-500 text-xs mt-1">{errors.approvedByUserId}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Remarks
              </label>
              <textarea
                value={formData.remarks}
                onChange={(e) => handleInputChange('remarks', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-orange-500 resize-none"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DiscountFormModal;
