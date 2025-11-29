import React, { useState, useEffect } from 'react';
import { X, ChevronDown, CheckCircle } from 'lucide-react';
import LoadingModal from '../components/LoadingModal';
import * as serviceOrderService from '../services/serviceOrderService';
import * as concernService from '../services/concernService';

interface SORequestFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  customerData?: {
    accountNo: string;
    dateInstalled: string;
    fullName: string;
    contactNumber: string;
    plan: string;
    provider: string;
    username: string;
    emailAddress?: string;
  };
}

const SORequestFormModal: React.FC<SORequestFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  customerData
}) => {
  const getUserEmail = () => {
    try {
      const authData = localStorage.getItem('authData');
      if (authData) {
        const userData = JSON.parse(authData);
        return userData.email || userData.user?.email || 'unknown@example.com';
      }
      return 'unknown@example.com';
    } catch (error) {
      console.error('Error getting user email:', error);
      return 'unknown@example.com';
    }
  };

  const generateTicketId = () => {
    const year = new Date().getFullYear();
    const randomDigits = Math.floor(1000000 + Math.random() * 9000000);
    return `${year}${randomDigits}`;
  };

  const [formData, setFormData] = useState({
    ticketId: '',
    accountNo: '',
    dateInstalled: '',
    fullName: '',
    contactNumber: '',
    plan: '',
    provider: '',
    username: '',
    concern: '',
    concernRemarks: '',
    accountEmail: '',
    status: 'unused'
  });

  const [concerns, setConcerns] = useState<concernService.Concern[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPercentage, setLoadingPercentage] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        ticketId: generateTicketId(),
        accountNo: customerData?.accountNo || '',
        dateInstalled: customerData?.dateInstalled || '',
        fullName: customerData?.fullName || '',
        contactNumber: customerData?.contactNumber || '',
        plan: customerData?.plan || '',
        provider: customerData?.provider || '',
        username: customerData?.username || '',
        accountEmail: customerData?.emailAddress || '',
        concern: '',
        concernRemarks: '',
        status: 'unused'
      });
      loadData();
    }
  }, [isOpen, customerData]);

  const loadData = async () => {
    try {
      const concernsResponse = await concernService.concernService.getAllConcerns();
      setConcerns(concernsResponse || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.accountNo) {
      newErrors.accountNo = 'Account No. is required';
    }

    if (!formData.dateInstalled) {
      newErrors.dateInstalled = 'Date Installed is required';
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full Name is required';
    }

    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = 'Contact Number is required';
    }

    if (!formData.plan) {
      newErrors.plan = 'Plan is required';
    }



    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!formData.concern) {
      newErrors.concern = 'Concern is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      alert('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setLoadingPercentage(0);

    try {
      setLoadingPercentage(20);

      const payload: any = {
        account_no: formData.accountNo,
        timestamp: new Date().toISOString(),
        support_status: 'Open',
        concern: formData.concern,
        concern_remarks: formData.concernRemarks,
        priority_level: 'Medium',
        requested_by: formData.accountEmail || formData.accountNo,
        visit_status: 'Pending',
        created_by_user: getUserEmail(),
        status: formData.status
      };

      setLoadingPercentage(50);
      await serviceOrderService.createServiceOrder(payload);

      setLoadingPercentage(100);
      await new Promise(resolve => setTimeout(resolve, 500));

      setShowSuccess(true);
    } catch (error) {
      console.error('Error creating SO request:', error);
      alert(`Failed to save SO request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
      setLoadingPercentage(0);
    }
  };

  const handleCancel = () => {
    setFormData({
      ticketId: '',
      accountNo: '',
      dateInstalled: '',
      fullName: '',
      contactNumber: '',
      plan: '',
      provider: '',
      username: '',
      accountEmail: '',
      concern: '',
      concernRemarks: '',
      status: 'unused'
    });
    setErrors({});
    onClose();
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    onSave();
    handleCancel();
  };

  if (!isOpen) return null;

  return (
    <>
      <LoadingModal 
        isOpen={loading} 
        message="Saving SO request..." 
        percentage={loadingPercentage} 
      />
      
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="flex flex-col items-center">
              <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
              <p className="text-white text-center mb-6">SO Request created successfully!</p>
              
              <button
                onClick={handleSuccessClose}
                className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-end z-50">
        <div className="h-full w-full max-w-2xl bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out translate-x-0 overflow-hidden flex flex-col">
          <div className="bg-gray-800 px-6 py-4 flex items-center justify-between border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">SO Request</h2>
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
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-sm flex items-center"
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

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Ticket ID<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.ticketId}
                readOnly
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Account No.<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.accountNo}
                readOnly
                className={`w-full px-3 py-2 bg-gray-800 border ${
                  errors.accountNo ? 'border-red-500' : 'border-gray-700'
                } rounded text-red-400 cursor-not-allowed`}
              />
              {errors.accountNo && <p className="text-red-500 text-xs mt-1">{errors.accountNo}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Date Installed<span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.dateInstalled}
                onChange={(e) => handleInputChange('dateInstalled', e.target.value)}
                className={`w-full px-3 py-2 bg-gray-800 border ${
                  errors.dateInstalled ? 'border-red-500' : 'border-gray-700'
                } rounded text-white focus:outline-none focus:border-red-500`}
              />
              {errors.dateInstalled && <p className="text-red-500 text-xs mt-1">{errors.dateInstalled}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full Name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                className={`w-full px-3 py-2 bg-gray-800 border ${
                  errors.fullName ? 'border-red-500' : 'border-gray-700'
                } rounded text-white focus:outline-none focus:border-red-500`}
              />
              {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Contact Number<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.contactNumber}
                onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                className={`w-full px-3 py-2 bg-gray-800 border ${
                  errors.contactNumber ? 'border-red-500' : 'border-gray-700'
                } rounded text-white focus:outline-none focus:border-red-500`}
              />
              {errors.contactNumber && <p className="text-red-500 text-xs mt-1">{errors.contactNumber}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Plan<span className="text-red-500">*</span>
              </label>
              <div className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white">
                {formData.plan || 'No plan'}
              </div>
              {errors.plan && <p className="text-red-500 text-xs mt-1">{errors.plan}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Affiliate
              </label>
              <div className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white">
                {formData.provider || 'No affiliate'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Username<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className={`w-full px-3 py-2 bg-gray-800 border ${
                  errors.username ? 'border-red-500' : 'border-gray-700'
                } rounded text-white focus:outline-none focus:border-red-500`}
              />
              {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Concern<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.concern}
                  onChange={(e) => handleInputChange('concern', e.target.value)}
                  className={`w-full px-3 py-2 bg-gray-800 border ${
                    errors.concern ? 'border-red-500' : 'border-gray-700'
                  } rounded text-white focus:outline-none focus:border-red-500 appearance-none`}
                >
                  <option value="">Select Concern</option>
                  {concerns.map(concern => (
                    <option key={concern.id} value={concern.concern_name}>
                      {concern.concern_name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={20} />
              </div>
              {errors.concern && <p className="text-red-500 text-xs mt-1">{errors.concern}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Concern Remarks<span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.concernRemarks}
                onChange={(e) => handleInputChange('concernRemarks', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-red-500 resize-none"
                placeholder="Enter concern details..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Status<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-red-500 appearance-none"
                >
                  <option value="unused">Unused</option>
                  <option value="multiple">Multiple</option>
                </select>
                <ChevronDown className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={20} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SORequestFormModal;
