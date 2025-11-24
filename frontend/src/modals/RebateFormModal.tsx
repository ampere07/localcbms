import React, { useState, useEffect } from 'react';
import { X, Minus, Plus, ChevronDown } from 'lucide-react';
import LoadingModal from '../components/LoadingModal';
import * as massRebateService from '../services/massRebateService';
import * as lcpnapService from '../services/lcpnapService';
import * as lcpService from '../services/lcpService';
import * as locationDetailService from '../services/locationDetailService';

interface RebateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

type RebateType = 'lcpnap' | 'lcp' | 'location' | null;

const RebateFormModal: React.FC<RebateFormModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const getUserEmail = () => {
    try {
      const authData = localStorage.getItem('authData');
      if (authData) {
        const userData = JSON.parse(authData);
        return userData.email || 'unknown@example.com';
      }
      return 'unknown@example.com';
    } catch (error) {
      console.error('Error getting user email:', error);
      return 'unknown@example.com';
    }
  };

  const [formData, setFormData] = useState({
    numberOfDays: 0,
    rebateType: null as RebateType,
    selectedId: null as number | null,
    month: '',
    status: 'Unused',
    modifiedBy: getUserEmail()
  });

  const [lcpnapList, setLcpnapList] = useState<lcpnapService.LCPNAP[]>([]);
  const [lcpList, setLcpList] = useState<lcpService.LCP[]>([]);
  const [locationList, setLocationList] = useState<locationDetailService.LocationDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPercentage, setLoadingPercentage] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        modifiedBy: getUserEmail()
      }));
      loadAllData();
    }
  }, [isOpen]);

  const loadAllData = async () => {
    try {
      const [lcpnapResponse, lcpResponse, locationResponse] = await Promise.all([
        lcpnapService.getAllLCPNAPs(),
        lcpService.getAllLCPs(),
        locationDetailService.locationDetailService.getAll()
      ]);

      if (lcpnapResponse.success) {
        setLcpnapList(lcpnapResponse.data);
      }

      if (lcpResponse.success) {
        setLcpList(lcpResponse.data);
      }

      if (locationResponse.success) {
        setLocationList(locationResponse.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };



  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleNumberChange = (operation: 'increase' | 'decrease') => {
    const currentValue = formData.numberOfDays;
    let newValue: number;

    if (operation === 'increase') {
      newValue = currentValue + 1;
    } else {
      newValue = Math.max(0, currentValue - 1);
    }

    setFormData(prev => ({ ...prev, numberOfDays: newValue }));
  };

  const handleRebateTypeChange = (type: RebateType) => {
    setFormData(prev => ({ ...prev, rebateType: type, selectedId: null }));
    if (errors.rebateType) {
      setErrors(prev => ({ ...prev, rebateType: '' }));
    }
    if (errors.selectedId) {
      setErrors(prev => ({ ...prev, selectedId: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.numberOfDays <= 0) {
      newErrors.numberOfDays = 'Number of Days must be greater than 0';
    }

    if (!formData.rebateType) {
      newErrors.rebateType = 'Please select a rebate type';
    }

    if (formData.rebateType && !formData.selectedId) {
      newErrors.selectedId = 'Please select an item from the dropdown';
    }

    if (!formData.month) {
      newErrors.month = 'Please select a month';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      alert('Please fill in all required fields correctly.');
      return;
    }

    setLoading(true);
    setLoadingPercentage(0);

    try {
      setLoadingPercentage(20);

      let selectedRebateName = '';
      if (formData.rebateType === 'lcpnap') {
        const selected = lcpnapList.find(item => item.id === formData.selectedId);
        selectedRebateName = selected?.lcpnap_name || '';
      } else if (formData.rebateType === 'lcp') {
        const selected = lcpList.find(item => item.id === formData.selectedId);
        selectedRebateName = selected?.lcp_name || '';
      } else if (formData.rebateType === 'location') {
        const selected = locationList.find(item => item.id === formData.selectedId);
        selectedRebateName = selected?.location_name || '';
      }

      const payload: massRebateService.MassRebateData = {
        number_of_dates: formData.numberOfDays,
        rebate_type: formData.rebateType as 'lcpnap' | 'lcp' | 'location',
        selected_rebate: selectedRebateName,
        month: formData.month,
        status: formData.status as 'Unused' | 'Used',
        modified_by: formData.modifiedBy
      };

      setLoadingPercentage(50);
      await massRebateService.create(payload);

      setLoadingPercentage(100);
      await new Promise(resolve => setTimeout(resolve, 500));

      alert('Mass rebate created successfully!');
      onSave();
      onClose();
    } catch (error) {
      console.error('Error creating mass rebate:', error);
      alert(`Failed to save mass rebate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
      setLoadingPercentage(0);
    }
  };

  const handleCancel = () => {
    setFormData({
      numberOfDays: 0,
      rebateType: null,
      selectedId: null,
      month: '',
      status: 'Unused',
      modifiedBy: getUserEmail()
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <LoadingModal 
        isOpen={loading} 
        message="Saving mass rebate..." 
        percentage={loadingPercentage} 
      />
      
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-end z-50">
        <div className="h-full w-full max-w-2xl bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out translate-x-0 overflow-hidden flex flex-col">
          <div className="bg-gray-800 px-6 py-4 flex items-center justify-between border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">Mass Rebate Form</h2>
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
                Number of Days<span className="text-red-500">*</span>
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  value={formData.numberOfDays}
                  onChange={(e) => handleInputChange('numberOfDays', parseInt(e.target.value) || 0)}
                  className={`flex-1 px-3 py-2 bg-gray-800 border ${errors.numberOfDays ? 'border-red-500' : 'border-gray-700'} rounded-l text-white focus:outline-none focus:border-orange-500`}
                />
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => handleNumberChange('decrease')}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white border border-gray-700 border-l-0"
                  >
                    <Minus size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNumberChange('increase')}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white border border-gray-700 border-l-0 border-t-0 rounded-r"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              {errors.numberOfDays && <p className="text-red-500 text-xs mt-1">{errors.numberOfDays}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Rebate Type<span className="text-red-500">*</span>
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleRebateTypeChange('lcpnap')}
                  className={`flex-1 px-4 py-2 rounded border transition-colors ${
                    formData.rebateType === 'lcpnap'
                      ? 'bg-orange-600 border-orange-600 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                  }`}
                >
                  LCPNAP
                </button>
                <button
                  type="button"
                  onClick={() => handleRebateTypeChange('lcp')}
                  className={`flex-1 px-4 py-2 rounded border transition-colors ${
                    formData.rebateType === 'lcp'
                      ? 'bg-orange-600 border-orange-600 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                  }`}
                >
                  LCP
                </button>
                <button
                  type="button"
                  onClick={() => handleRebateTypeChange('location')}
                  className={`flex-1 px-4 py-2 rounded border transition-colors ${
                    formData.rebateType === 'location'
                      ? 'bg-orange-600 border-orange-600 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                  }`}
                >
                  Location
                </button>
              </div>
              {errors.rebateType && <p className="text-red-500 text-xs mt-1">{errors.rebateType}</p>}
            </div>

            {formData.rebateType === 'lcpnap' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select LCPNAP<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.selectedId || ''}
                    onChange={(e) => handleInputChange('selectedId', e.target.value ? parseInt(e.target.value) : null)}
                    className={`w-full px-3 py-2 bg-gray-800 border ${errors.selectedId ? 'border-red-500' : 'border-gray-700'} rounded text-white focus:outline-none focus:border-orange-500 appearance-none`}
                  >
                    <option value="">Select LCPNAP</option>
                    {lcpnapList.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.lcpnap_name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={20} />
                </div>
                {errors.selectedId && <p className="text-red-500 text-xs mt-1">{errors.selectedId}</p>}
              </div>
            )}

            {formData.rebateType === 'lcp' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select LCP<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.selectedId || ''}
                    onChange={(e) => handleInputChange('selectedId', e.target.value ? parseInt(e.target.value) : null)}
                    className={`w-full px-3 py-2 bg-gray-800 border ${errors.selectedId ? 'border-red-500' : 'border-gray-700'} rounded text-white focus:outline-none focus:border-orange-500 appearance-none`}
                  >
                    <option value="">Select LCP</option>
                    {lcpList.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.lcp_name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={20} />
                </div>
                {errors.selectedId && <p className="text-red-500 text-xs mt-1">{errors.selectedId}</p>}
              </div>
            )}

            {formData.rebateType === 'location' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Location<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.selectedId || ''}
                    onChange={(e) => handleInputChange('selectedId', e.target.value ? parseInt(e.target.value) : null)}
                    className={`w-full px-3 py-2 bg-gray-800 border ${errors.selectedId ? 'border-red-500' : 'border-gray-700'} rounded text-white focus:outline-none focus:border-orange-500 appearance-none`}
                  >
                    <option value="">Select Location</option>
                    {locationList.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.location_name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={20} />
                </div>
                {errors.selectedId && <p className="text-red-500 text-xs mt-1">{errors.selectedId}</p>}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Month<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.month}
                  onChange={(e) => handleInputChange('month', e.target.value)}
                  className={`w-full px-3 py-2 bg-gray-800 border ${errors.month ? 'border-red-500' : 'border-gray-700'} rounded text-white focus:outline-none focus:border-orange-500 appearance-none`}
                >
                  <option value="">Select Month</option>
                  <option value="January">January</option>
                  <option value="February">February</option>
                  <option value="March">March</option>
                  <option value="April">April</option>
                  <option value="May">May</option>
                  <option value="June">June</option>
                  <option value="July">July</option>
                  <option value="August">August</option>
                  <option value="September">September</option>
                  <option value="October">October</option>
                  <option value="November">November</option>
                  <option value="December">December</option>
                </select>
                <ChevronDown className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={20} />
              </div>
              {errors.month && <p className="text-red-500 text-xs mt-1">{errors.month}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Status
              </label>
              <input
                type="text"
                value={formData.status}
                readOnly
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Modified By
              </label>
              <input
                type="text"
                value={formData.modifiedBy}
                readOnly
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-400 cursor-not-allowed"
              />
            </div>


          </div>
        </div>
      </div>
    </>
  );
};

export default RebateFormModal;
