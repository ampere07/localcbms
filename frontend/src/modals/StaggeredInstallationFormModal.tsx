import React, { useState, useEffect } from 'react';
import { X, Calendar, ChevronDown } from 'lucide-react';
import { staggeredInstallationService } from '../services/staggeredInstallationService';
import LoadingModal from '../components/LoadingModal';

interface StaggeredInstallationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: StaggeredInstallationFormData) => void;
  customerData?: any;
}

interface StaggeredInstallationFormData {
  accountNo: string;
  fullName: string;
  contactNo: string;
  emailAddress: string;
  address: string;
  plan: string;
  provider: string;
  staggeredInstallNo: string;
  staggeredDate: string;
  staggeredBalance: string;
  monthsToPay: string;
  monthlyPayment: string;
  modifiedBy: string;
  modifiedDate: string;
  userEmail: string;
  remarks: string;
  barangay: string;
  city: string;
}

const StaggeredInstallationFormModal: React.FC<StaggeredInstallationFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  customerData
}) => {
  const getCurrentDate = () => {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
    const displayHours = now.getHours() % 12 || 12;
    return `${month}/${day}/${year} ${String(displayHours).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
  };

  const generateStaggeredInstallNo = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}`;
  };

  const [formData, setFormData] = useState<StaggeredInstallationFormData>(() => ({
    accountNo: customerData?.accountNo || '',
    fullName: customerData?.fullName || '',
    contactNo: customerData?.contactNo || '',
    emailAddress: customerData?.emailAddress || '',
    address: customerData?.address || '',
    plan: customerData?.plan || '',
    provider: 'SWITCH',
    staggeredInstallNo: generateStaggeredInstallNo(),
    staggeredDate: getCurrentDate(),
    staggeredBalance: '0.00',
    monthsToPay: '0',
    monthlyPayment: '0.00',
    modifiedBy: 'ravenampere0123@gmail.com',
    modifiedDate: getCurrentDateTime(),
    userEmail: 'ravenampere0123@gmail.com',
    remarks: '',
    barangay: customerData?.barangay || '',
    city: customerData?.city || ''
  }));

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingPercentage, setLoadingPercentage] = useState(0);

  useEffect(() => {
    if (customerData) {
      setFormData(prev => ({
        ...prev,
        accountNo: customerData.accountNo || '',
        fullName: customerData.fullName || '',
        contactNo: customerData.contactNo || '',
        emailAddress: customerData.emailAddress || '',
        address: customerData.address || '',
        plan: customerData.plan || '',
        barangay: customerData.barangay || '',
        city: customerData.city || ''
      }));
    }
  }, [customerData]);

  useEffect(() => {
    const staggeredBalance = parseFloat(formData.staggeredBalance) || 0;
    const monthsToPay = parseInt(formData.monthsToPay) || 1;
    const monthlyPayment = monthsToPay > 0 ? staggeredBalance / monthsToPay : 0;
    
    setFormData(prev => ({
      ...prev,
      monthlyPayment: monthlyPayment.toFixed(2)
    }));
  }, [formData.staggeredBalance, formData.monthsToPay]);

  const handleInputChange = (field: keyof StaggeredInstallationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleMonthsChange = (operation: 'increase' | 'decrease') => {
    const currentValue = parseInt(formData.monthsToPay) || 0;
    let newValue: number;

    if (operation === 'increase') {
      newValue = currentValue + 1;
    } else {
      newValue = Math.max(0, currentValue - 1);
    }

    setFormData(prev => ({
      ...prev,
      monthsToPay: newValue.toString()
    }));
  };



  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.accountNo.trim()) newErrors.accountNo = 'Account No. is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    console.log('Staggered Installation save button clicked!', formData);
    
    const isValid = validateForm();
    console.log('Staggered Installation form validation result:', isValid);
    
    if (!isValid) {
      console.log('Staggered Installation form validation failed. Errors:', errors);
      alert('Please fill in all required fields before saving.');
      return;
    }

    setLoading(true);
    setLoadingPercentage(0);
    try {
      console.log('Creating staggered installation with data:', formData);
      
      setLoadingPercentage(20);
      
      const payload = {
        account_no: formData.accountNo,
        staggered_install_no: formData.staggeredInstallNo,
        staggered_date: formData.staggeredDate,
        staggered_balance: parseFloat(formData.staggeredBalance) || 0,
        months_to_pay: parseInt(formData.monthsToPay) || 0,
        monthly_payment: parseFloat(formData.monthlyPayment) || 0,
        modified_by: formData.modifiedBy,
        modified_date: formData.modifiedDate,
        user_email: formData.userEmail,
        remarks: formData.remarks || ''
      };
      
      setLoadingPercentage(50);
      
      const result = await staggeredInstallationService.create(payload);
      
      setLoadingPercentage(80);
      
      if (result.success) {
        setLoadingPercentage(100);
        await new Promise(resolve => setTimeout(resolve, 500));
        alert('Staggered Installation created successfully!');
        onSave(formData);
        onClose();
      } else {
        alert(`Failed to create staggered installation: ${result.message}`);
      }
    } catch (error) {
      console.error('Error creating staggered installation:', error);
      alert(`Failed to save staggered installation: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        message="Saving staggered installation..." 
        percentage={loadingPercentage} 
      />
      
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-end z-50">
      <div className="h-full w-full max-w-2xl bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out translate-x-0 overflow-hidden flex flex-col">
        <div className="bg-gray-800 px-6 py-4 flex items-center justify-between border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Staggered Installation Form</h2>
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
                value={formData.accountNo}
                onChange={(e) => handleInputChange('accountNo', e.target.value)}
                className={`w-full px-3 py-2 bg-gray-800 border ${errors.accountNo ? 'border-red-500' : 'border-gray-700'} rounded text-red-400 focus:outline-none focus:border-orange-500 appearance-none`}
              >
                <option value={customerData?.accountNo || ''}>
                  {customerData?.accountNo || ''} | {customerData?.fullName || ''} | {customerData?.address || ''}
                </option>
              </select>
              <ChevronDown className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={20} />
            </div>
            {errors.accountNo && <p className="text-red-500 text-xs mt-1">{errors.accountNo}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-orange-500"
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Contact Number
            </label>
            <input
              type="text"
              value={formData.contactNo}
              onChange={(e) => handleInputChange('contactNo', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-orange-500"
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={formData.emailAddress}
              onChange={(e) => handleInputChange('emailAddress', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-orange-500"
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-orange-500"
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Plan
            </label>
            <input
              type="text"
              value={formData.plan}
              onChange={(e) => handleInputChange('plan', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-orange-500"
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Provider
            </label>
            <input
              type="text"
              value={formData.provider}
              onChange={(e) => handleInputChange('provider', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-orange-500"
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Staggered Install No.
            </label>
            <input
              type="text"
              value={formData.staggeredInstallNo}
              onChange={(e) => handleInputChange('staggeredInstallNo', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-orange-500"
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Staggered Date
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.staggeredDate}
                onChange={(e) => handleInputChange('staggeredDate', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-orange-500"
              />
              <Calendar className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={20} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Staggered Balance
            </label>
            <input
              type="text"
              value={`₱ ${formData.staggeredBalance}`}
              onChange={(e) => handleInputChange('staggeredBalance', e.target.value.replace('₱ ', '').replace(/[^0-9.]/g, ''))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Months to Pay
            </label>
            <input
              type="number"
              min="0"
              value={formData.monthsToPay}
              onChange={(e) => handleInputChange('monthsToPay', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Monthly Payment
            </label>
            <input
              type="text"
              value={`₱ ${formData.monthlyPayment}`}
              readOnly
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Automatically calculated based on Total Balance and Months to Pay</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Modified By
            </label>
            <input
              type="text"
              value={formData.modifiedBy}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-orange-500"
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Modified Date
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.modifiedDate}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-orange-500"
                readOnly
              />
              <Calendar className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={20} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              User Email
            </label>
            <input
              type="email"
              value={formData.userEmail}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-orange-500"
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Remarks
            </label>
            <textarea
              value={formData.remarks}
              onChange={(e) => handleInputChange('remarks', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-orange-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Barangay
            </label>
            <input
              type="text"
              value={formData.barangay}
              onChange={(e) => handleInputChange('barangay', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-orange-500"
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              City
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-orange-500"
              readOnly
            />
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default StaggeredInstallationFormModal;
