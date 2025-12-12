import React, { useState, useEffect } from 'react';
import { X, ChevronDown, Minus, Plus } from 'lucide-react';
import LoadingModal from '../components/LoadingModal';
import * as discountService from '../services/discountService';
import { userService } from '../services/userService';
import { getBillingRecords } from '../services/billingService';

interface DiscountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: DiscountFormData) => void;
  customerData?: any;
}

interface DiscountFormData {
  accountNo: string | null;
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
    accountNo: null,
    discountAmount: '0.00',
    remaining: '0.00',
    status: 'Pending',
    processedDate: getCurrentDateTime(),
    processedByUserId: null,
    approvedByUserId: null,
    remarks: ''
  }));

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingPercentage, setLoadingPercentage] = useState(0);
  const [users, setUsers] = useState<any[]>([]);
  const [billingAccounts, setBillingAccounts] = useState<any[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(localStorage.getItem('theme') === 'dark');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (customerData) {
      setFormData(prev => ({
        ...prev,
        accountNo: customerData.accountNo || null
      }));
    }
  }, [customerData]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await userService.getAllUsers();
        if (response.success && response.data) {
          setUsers(response.data);
          
          const authData = localStorage.getItem('authData');
          if (authData) {
            const userData = JSON.parse(authData);
            const currentUser = response.data.find(
              (user: any) => user.email_address === userData.email || user.email === userData.email
            );
            if (currentUser) {
              setFormData(prev => ({
                ...prev,
                processedByUserId: currentUser.id
              }));
            }
          }
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    const fetchBillingAccounts = async () => {
      try {
        const accounts = await getBillingRecords();
        setBillingAccounts(accounts);
      } catch (error) {
        console.error('Error fetching billing accounts:', error);
      }
    };

    if (isOpen) {
      fetchUsers();
      fetchBillingAccounts();
    }
  }, [isOpen]);

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

    if (!formData.accountNo) newErrors.accountNo = 'Account No. is required';
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
        account_no: formData.accountNo!,
        discount_amount: parseFloat(formData.discountAmount) || 0,
        remaining: parseInt(formData.remaining) || 0,
        status: formData.status as 'Pending' | 'Unused' | 'Used' | 'Permanent' | 'Monthly',
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
        <div className={`h-full w-full max-w-2xl shadow-2xl transform transition-transform duration-300 ease-in-out translate-x-0 overflow-hidden flex flex-col ${
          isDarkMode ? 'bg-gray-900' : 'bg-white'
        }`}>
          <div className={`px-6 py-4 flex items-center justify-between border-b ${
            isDarkMode
              ? 'bg-gray-800 border-gray-700'
              : 'bg-gray-100 border-gray-300'
          }`}>
            <h2 className={`text-xl font-semibold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Discounted Form</h2>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleCancel}
                className={`px-4 py-2 rounded text-sm ${
                  isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                }`}
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
                className={isDarkMode ? 'text-gray-400 hover:text-white transition-colors' : 'text-gray-600 hover:text-gray-900 transition-colors'}
              >
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Account No.<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.accountNo || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleInputChange('accountNo', value || null);
                  }}
                  className={`w-full px-3 py-2 border rounded focus:outline-none focus:border-orange-500 cursor-pointer overflow-hidden text-ellipsis ${
                    errors.accountNo ? 'border-red-500' : isDarkMode ? 'border-gray-700' : 'border-gray-300'
                  } ${
                    isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
                  }`}
                  style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
                >
                  <option value="" className={isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>
                    Select Account
                  </option>
                  {billingAccounts.map((account) => {
                    const fullName = [
                      account.firstName || '',
                      account.middleInitial || '',
                      account.lastName || ''
                    ].filter(Boolean).join(' ');
                    
                    const addressParts = [
                      account.address || '',
                      account.location || '',
                      account.barangay || '',
                      account.city || '',
                      account.region || ''
                    ].filter(Boolean).join(', ');
                    
                    const accountNumber = account.accountNo || account.account_no || '';
                    const displayText = `${accountNumber} | ${fullName || account.customerName} | ${addressParts}`;
                    const truncatedText = displayText.length > 80 ? displayText.substring(0, 77) + '...' : displayText;
                    
                    return (
                      <option 
                        key={account.id} 
                        value={accountNumber} 
                        className={isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}
                        title={displayText}
                      >
                        {truncatedText}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className={`absolute right-3 top-2.5 pointer-events-none ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`} size={20} />
              </div>
              {errors.accountNo && <p className="text-red-500 text-xs mt-1">{errors.accountNo}</p>}
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Discount Status
              </label>
              <div className="relative">
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className={`w-full px-3 py-2 border rounded focus:outline-none focus:border-orange-500 cursor-pointer ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
                >
                  <option value="Pending" className={isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>Pending</option>
                  <option value="Unused" className={isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>Unused</option>
                  <option value="Permanent" className={isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>Permanent</option>
                  <option value="Monthly" className={isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>Monthly</option>
                </select>
                <ChevronDown className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={20} />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Discount Amount<span className="text-red-500">*</span>
              </label>
              <div className="flex items-center">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={`₱ ${formData.discountAmount}`}
                    onChange={(e) => handleInputChange('discountAmount', e.target.value.replace('₱ ', '').replace(/[^0-9.]/g, ''))}
                    className={`w-full px-3 py-2 border rounded-l focus:outline-none focus:border-orange-500 ${
                      errors.discountAmount ? 'border-red-500' : isDarkMode ? 'border-gray-700' : 'border-gray-300'
                    } ${
                      isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
                    }`}
                  />
                </div>
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => handleDiscountAmountChange('decrease')}
                    className={`px-3 py-1 border border-l-0 text-sm ${
                      isDarkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-white border-gray-700'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-900 border-gray-300'
                    }`}
                  >
                    <Minus size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDiscountAmountChange('increase')}
                    className={`px-3 py-1 border border-l-0 border-t-0 rounded-r text-sm ${
                      isDarkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-white border-gray-700'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-900 border-gray-300'
                    }`}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              {errors.discountAmount && <p className="text-red-500 text-xs mt-1">{errors.discountAmount}</p>}
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Processed By<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.processedByUserId || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleInputChange('processedByUserId', value ? parseInt(value) : null);
                  }}
                  disabled
                  className={`w-full px-3 py-2 border rounded focus:outline-none focus:border-orange-500 cursor-not-allowed opacity-60 ${
                    errors.processedByUserId ? 'border-red-500' : isDarkMode ? 'border-gray-700' : 'border-gray-300'
                  } ${
                    isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
                  }`}
                  style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
                >
                  <option value="" className={isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>Select Processor</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id} className={isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>
                      {user.email_address || user.username}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={20} />
              </div>
              {errors.processedByUserId && <p className="text-red-500 text-xs mt-1">{errors.processedByUserId}</p>}
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Approved By<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.approvedByUserId || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleInputChange('approvedByUserId', value ? parseInt(value) : null);
                  }}
                  className={`w-full px-3 py-2 border rounded focus:outline-none focus:border-orange-500 cursor-pointer ${
                    errors.approvedByUserId ? 'border-red-500' : isDarkMode ? 'border-gray-700' : 'border-gray-300'
                  } ${
                    isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
                  }`}
                  style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
                >
                  <option value="" className={isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>Select Approver</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id} className={isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>
                      {user.email_address || user.username}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={20} />
              </div>
              {errors.approvedByUserId && <p className="text-red-500 text-xs mt-1">{errors.approvedByUserId}</p>}
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Remarks
              </label>
              <textarea
                value={formData.remarks}
                onChange={(e) => handleInputChange('remarks', e.target.value)}
                rows={4}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:border-orange-500 resize-none ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DiscountFormModal;
