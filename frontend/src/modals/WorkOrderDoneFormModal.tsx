import React, { useState, useEffect } from 'react';
import { X, Calendar, ChevronDown, Minus, Plus, Loader2, Search, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { UserData } from '../types/api';
import { updateWorkOrder } from '../services/workOrderService';
import { updateApplication } from '../services/applicationService';
import { userService } from '../services/userService';
import { getAllGroups, Group } from '../services/groupService';
import { getRegions, getCities, City } from '../services/cityService';
import { barangayService, Barangay } from '../services/barangayService';
import apiClient from '../config/api';
import { settingsColorPaletteService, ColorPalette } from '../services/settingsColorPaletteService';

interface Region {
  id: number;
  name: string;
}

interface Plan {
  id: number;
  name: string;
  description?: string;
  price?: number;
}

interface Promo {
  id: number;
  promo_name: string;
  description?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface WorkOrderDoneFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: any) => void;
  workOrderData?: any;
}

interface JOFormData {
  timestamp: string;
  status: string;
  referredBy: string;
  firstName: string;
  middleInitial: string;
  lastName: string;
  contactNumber: string;
  email: string;
  address: string;
  barangay: string;
  city: string;
  region: string;
  choosePlan: string;
  promo: string;
  remarks: string;
  installationFee: number | string;
  billingDay: string;
  isLastDayOfMonth: boolean;
  onsiteStatus: string;
  assignedEmail: string;
  modifiedBy: string;
  modifiedDate: string;
  installationLandmark: string;
}

const WorkOrderDoneFormModal: React.FC<WorkOrderDoneFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  workOrderData
}) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [colorPalette, setColorPalette] = useState<ColorPalette | null>(null);

  const getCurrentUser = (): UserData | null => {
    try {
      const authData = localStorage.getItem('authData');
      if (authData) return JSON.parse(authData);
    } catch (error) {
      console.error('Error getting current user:', error);
    }
    return null;
  };

  const currentUser = getCurrentUser();
  const currentUserEmail = currentUser?.email || 'unknown@ampere.com';

  const [formData, setFormData] = useState<JOFormData>({
    timestamp: new Date().toLocaleString('sv-SE').replace(' ', ' '),
    status: '',
    referredBy: '',
    firstName: '',
    middleInitial: '',
    lastName: '',
    contactNumber: '',
    email: '',
    address: '',
    barangay: '',
    city: '',
    region: '',
    choosePlan: '',
    promo: '',
    remarks: '',
    installationFee: 0,
    billingDay: '',
    isLastDayOfMonth: false,
    onsiteStatus: 'In Progress',
    assignedEmail: '',
    modifiedBy: currentUserEmail,
    modifiedDate: new Date().toLocaleString('sv-SE').replace(' ', ' '),
    installationLandmark: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingPercentage, setLoadingPercentage] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState<{
    title: string;
    messages: Array<{ type: 'success' | 'warning' | 'error'; text: string }>;
  }>({ title: '', messages: [] });

  const [technicians, setTechnicians] = useState<Array<{ email: string; name: string }>>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [allCities, setAllCities] = useState<City[]>([]);
  const [allBarangays, setAllBarangays] = useState<Barangay[]>([]);
  const [referredBySearch, setReferredBySearch] = useState('');
  const [isReferredByOpen, setIsReferredByOpen] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      const theme = localStorage.getItem('theme');
      setIsDarkMode(theme === 'dark' || theme === null);
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchColorPalette = async () => {
      try {
        const activePalette = await settingsColorPaletteService.getActive();
        setColorPalette(activePalette);
      } catch (err) {
        console.error('Failed to fetch color palette:', err);
      }
    };
    fetchColorPalette();
  }, []);

  useEffect(() => {
    const fetchTechnicians = async () => {
      if (!isOpen) return;
      try {
        const response = await userService.getUsersByRole('technician');
        if (response.success && response.data) {
          const list = response.data
            .filter((u: any) => u.first_name || u.last_name)
            .map((u: any) => {
              const name = `${(u.first_name || '').trim()} ${(u.last_name || '').trim()}`.trim();
              return { email: u.email_address || u.email || '', name: name || u.username || u.email_address || '' };
            })
            .filter((t: any) => t.name && t.email);
          setTechnicians(list);
        }
      } catch { setTechnicians([]); }
    };
    fetchTechnicians();
  }, [isOpen]);

  useEffect(() => {
    const fetchAgents = async () => {
      if (!isOpen) return;
      try {
        const response = await userService.getUsersByRole('agent');
        if (response.success && response.data) {
          setAgents(response.data);
        } else {
          const responseById = await userService.getUsersByRoleId(4);
          if (responseById.success && responseById.data) setAgents(responseById.data);
        }
      } catch { setAgents([]); }
    };
    fetchAgents();
  }, [isOpen]);

  useEffect(() => {
    const fetchGroups = async () => {
      if (!isOpen) return;
      try {
        const response = await getAllGroups();
        setGroups(response.success && Array.isArray(response.data) ? response.data : []);
      } catch { setGroups([]); }
    };
    fetchGroups();
  }, [isOpen]);

  useEffect(() => {
    const loadPlans = async () => {
      if (!isOpen) return;
      try {
        const response = await apiClient.get<ApiResponse<Plan[]> | Plan[]>('/plans');
        const data = response.data;
        if (data && typeof data === 'object' && 'success' in data && data.success && Array.isArray(data.data)) {
          setPlans(data.data);
        } else if (Array.isArray(data)) {
          setPlans(data);
        } else { setPlans([]); }
      } catch { setPlans([]); }
    };
    loadPlans();
  }, [isOpen]);

  useEffect(() => {
    const loadPromos = async () => {
      if (!isOpen) return;
      try {
        const response = await apiClient.get<ApiResponse<Promo[]> | Promo[]>('/promos');
        const data = response.data;
        if (data && typeof data === 'object' && 'success' in data && data.success && Array.isArray(data.data)) {
          setPromos(data.data);
        } else if (Array.isArray(data)) {
          setPromos(data);
        } else { setPromos([]); }
      } catch { setPromos([]); }
    };
    loadPromos();
  }, [isOpen]);

  useEffect(() => {
    const fetchRegions = async () => {
      if (!isOpen) return;
      try {
        const fetchedRegions = await getRegions();
        setRegions(Array.isArray(fetchedRegions) ? fetchedRegions : []);
      } catch { setRegions([]); }
    };
    fetchRegions();
  }, [isOpen]);

  useEffect(() => {
    const fetchAllCities = async () => {
      if (!isOpen) return;
      try {
        const fetchedCities = await getCities();
        setAllCities(Array.isArray(fetchedCities) ? fetchedCities : []);
      } catch { setAllCities([]); }
    };
    fetchAllCities();
  }, [isOpen]);

  useEffect(() => {
    const fetchAllBarangays = async () => {
      if (!isOpen) return;
      try {
        const response = await barangayService.getAll();
        setAllBarangays(response.success && Array.isArray(response.data) ? response.data : []);
      } catch { setAllBarangays([]); }
    };
    fetchAllBarangays();
  }, [isOpen]);

  useEffect(() => {
    if (workOrderData && isOpen) {
      setFormData(prev => ({
        ...prev,
        timestamp: workOrderData.timestamp || workOrderData.Timestamp || new Date().toLocaleString('sv-SE').replace(' ', ' '),
        status: workOrderData.Status || workOrderData.status || '',
        referredBy: workOrderData.Referred_By || workOrderData.referred_by || '',
        firstName: workOrderData.First_Name || workOrderData.first_name || '',
        middleInitial: workOrderData.Middle_Initial || workOrderData.middle_initial || '',
        lastName: workOrderData.Last_Name || workOrderData.last_name || '',
        contactNumber: workOrderData.Mobile_Number || workOrderData.Contact_Number || workOrderData.mobile_number || '',
        email: workOrderData.Email_Address || workOrderData.email_address || workOrderData.email || '',
        address: workOrderData.Address || workOrderData.Installation_Address || workOrderData.address || '',
        barangay: workOrderData.Barangay || workOrderData.barangay || '',
        city: workOrderData.City || workOrderData.city || '',
        region: workOrderData.Region || workOrderData.region || '',
        choosePlan: workOrderData.Desired_Plan || workOrderData.desired_plan || workOrderData.Choose_Plan || workOrderData.choose_plan || '',
        promo: workOrderData.promo || workOrderData.Promo || '',
        remarks: workOrderData.Onsite_Remarks || workOrderData.onsite_remarks || workOrderData.remarks || '',
        installationFee: workOrderData.installation_fee || workOrderData.Installation_Fee || 0,
        billingDay: (workOrderData.billing_day !== undefined && workOrderData.billing_day !== null) ? String(workOrderData.billing_day) : (workOrderData.Billing_Day !== undefined && workOrderData.Billing_Day !== null) ? String(workOrderData.Billing_Day) : '',
        isLastDayOfMonth: workOrderData.billing_day === 0 || workOrderData.Billing_Day === 0,
        onsiteStatus: workOrderData.Onsite_Status || workOrderData.onsite_status || 'In Progress',
        assignedEmail: workOrderData.Assigned_Email || workOrderData.assigned_email || '',
        installationLandmark: workOrderData.installation_landmark || workOrderData.Installation_Landmark || ''
      }));
    }
  }, [workOrderData, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        timestamp: new Date().toLocaleString('sv-SE').replace(' ', ' '),
        status: '',
        referredBy: '',
        firstName: '',
        middleInitial: '',
        lastName: '',
        contactNumber: '',
        email: '',
        address: '',
        barangay: '',
        city: '',
        region: '',
        choosePlan: '',
        promo: '',
        remarks: '',
        installationFee: 0,
        billingDay: '',
        isLastDayOfMonth: false,
        onsiteStatus: 'In Progress',
        assignedEmail: '',
        modifiedBy: currentUserEmail,
        modifiedDate: new Date().toLocaleString('sv-SE').replace(' ', ' '),
        installationLandmark: ''
      });
      setErrors({});
      setReferredBySearch('');
      setIsReferredByOpen(false);
    }
  }, [isOpen, currentUserEmail]);

  const handleInputChange = (field: keyof JOFormData, value: string | number | boolean) => {
    if (field === 'middleInitial' && typeof value === 'string') {
      value = value.replace(/[0-9]/g, '');
    }

    if (field === 'billingDay') {
      const numValue = parseInt(value as string);
      if (!isNaN(numValue) && numValue > 30) return;
    }

    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      if (field === 'isLastDayOfMonth' && value === true) newData.billingDay = '0';
      if (field === 'region') { newData.city = ''; newData.barangay = ''; }
      else if (field === 'city') { newData.barangay = ''; }
      return newData;
    });

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleInstallationFeeChange = (value: string) => {
    if (value === '' || value === '-') {
      setFormData(prev => ({ ...prev, installationFee: value }));
    } else {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) setFormData(prev => ({ ...prev, installationFee: value }));
    }
    if (errors.installationFee) setErrors(prev => ({ ...prev, installationFee: '' }));
  };

  const handleNumberChange = (field: 'installationFee' | 'billingDay', increment: boolean) => {
    setFormData(prev => {
      if (field === 'installationFee') {
        const currentVal = Number(prev[field]) || 0;
        return { ...prev, [field]: increment ? currentVal + 0.01 : Math.max(0, currentVal - 0.01) };
      } else {
        const currentValue = parseInt(prev[field]) || 1;
        const newValue = increment ? Math.min(30, currentValue + 1) : Math.max(1, currentValue - 1);
        return { ...prev, [field]: newValue.toString() };
      }
    });
  };

  const showMessageModal = (title: string, messages: Array<{ type: 'success' | 'warning' | 'error'; text: string }>) => {
    setModalContent({ title, messages });
    setShowModal(true);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.timestamp.trim()) newErrors.timestamp = 'Timestamp is required';
    if (!formData.status.trim()) newErrors.status = 'Status is required';
    if (!formData.firstName.trim()) newErrors.firstName = 'First Name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last Name is required';

    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = 'Contact Number is required';
    } else if (!/^[0-9+\-\s()]+$/.test(formData.contactNumber.trim())) {
      newErrors.contactNumber = 'Please enter a valid contact number';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.region.trim()) newErrors.region = 'Region is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.barangay.trim()) newErrors.barangay = 'Barangay is required';
    if (!formData.choosePlan.trim()) newErrors.choosePlan = 'Choose Plan is required';
    if (Number(formData.installationFee) < 0) newErrors.installationFee = 'Installation fee cannot be negative';

    const billingDayNum = parseInt(formData.billingDay);
    if (!formData.isLastDayOfMonth) {
      if (isNaN(billingDayNum) || billingDayNum < 1) {
        newErrors.billingDay = 'Billing Day must be at least 1';
      } else if (billingDayNum > 30) {
        newErrors.billingDay = 'Billing Day cannot exceed 30';
      }
    }

    if (formData.status === 'Confirmed') {
      if (!formData.onsiteStatus.trim()) newErrors.onsiteStatus = 'Onsite Status is required';
      if (formData.onsiteStatus !== 'Failed' && !formData.assignedEmail.trim()) {
        newErrors.assignedEmail = 'Assigned Email is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    const updatedFormData = {
      ...formData,
      modifiedBy: currentUserEmail,
      modifiedDate: new Date().toLocaleString('sv-SE').replace(' ', ' ')
    };
    setFormData(updatedFormData);

    if (!validateForm()) {
      showMessageModal('Validation Error', [{ type: 'error', text: 'Please fill in all required fields before saving.' }]);
      return;
    }

    if (!workOrderData?.id && !workOrderData?.WorkOrder_ID) {
      showMessageModal('Error', [{ type: 'error', text: 'Cannot update work order: Missing ID' }]);
      return;
    }

    setLoading(true);
    setLoadingPercentage(0);
    const progressInterval = setInterval(() => {
      setLoadingPercentage(prev => {
        if (prev >= 99) return 99;
        if (prev >= 90) return prev + 1;
        if (prev >= 70) return prev + 2;
        return prev + 5;
      });
    }, 300);

    const saveMessages: Array<{ type: 'success' | 'warning' | 'error'; text: string }> = [];

    try {
      const workOrderId = workOrderData.id || workOrderData.WorkOrder_ID;
      const applicationId = workOrderData.Application_ID || workOrderData.application_id;

      const workOrderUpdateData: any = {
        timestamp: updatedFormData.timestamp,
        onsite_status: updatedFormData.onsiteStatus,
        assigned_email: updatedFormData.assignedEmail,
        onsite_remarks: updatedFormData.remarks,
        installation_fee: Number(updatedFormData.installationFee) || 0,
        billing_day: updatedFormData.isLastDayOfMonth ? 0 : (parseInt(updatedFormData.billingDay) || 30),
        installation_landmark: updatedFormData.installationLandmark || null,
        updated_by_user_email: updatedFormData.modifiedBy
      };

      const workOrderResponse = await updateWorkOrder(workOrderId, workOrderUpdateData);
      if (!workOrderResponse.success) throw new Error(workOrderResponse.message || 'work order update failed');
      saveMessages.push({ type: 'success', text: 'work order updated successfully' });

      if (applicationId) {
        const applicationUpdateData: any = {
          status: updatedFormData.status
        };
        await updateApplication(applicationId, applicationUpdateData);
        saveMessages.push({ type: 'success', text: 'Application status updated' });
      }

      clearInterval(progressInterval);
      setLoadingPercentage(100);
      await new Promise(resolve => setTimeout(resolve, 500));

      setErrors({});
      setLoading(false);
      setLoadingPercentage(0);
      showMessageModal('Success', saveMessages);
      onSave(updatedFormData);
      onClose();
    } catch (error: any) {
      clearInterval(progressInterval);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      setLoading(false);
      setLoadingPercentage(0);
      showMessageModal('Error', [{ type: 'error', text: `Failed to update records: ${errorMessage}` }]);
    }
  };

  const getFilteredCities = () => {
    if (!formData.region) return [];
    const selectedRegion = regions.find(reg => reg.name === formData.region);
    if (!selectedRegion) return [];
    return allCities.filter(city => city.region_id === selectedRegion.id);
  };

  const getFilteredBarangays = () => {
    if (!formData.city) return [];
    const selectedCity = allCities.find(city => city.name === formData.city);
    if (!selectedCity) return [];
    return allBarangays.filter(brgy => brgy.city_id !== undefined && brgy.city_id === selectedCity.id);
  };

  const filteredCities = getFilteredCities();
  const filteredBarangays = getFilteredBarangays();

  if (!isOpen) return null;

  return (
    <>
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-[10000] flex items-center justify-center">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-8 flex flex-col items-center space-y-6 min-w-[320px]`}>
            <Loader2 className="w-20 h-20 animate-spin" style={{ color: colorPalette?.primary || '#f97316' }} />
            <div className="text-center">
              <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'} text-4xl font-bold`}>{loadingPercentage}%</p>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60]">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col`}>
            <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{modalContent.title}</h3>
              <button onClick={() => setShowModal(false)} className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-4 overflow-y-auto flex-1">
              <div className="space-y-3">
                {modalContent.messages.map((message, index) => (
                  <div key={index} className={`flex items-start gap-3 p-3 rounded-lg ${message.type === 'success'
                    ? isDarkMode ? 'bg-green-900/30 border border-green-700' : 'bg-green-100 border border-green-300'
                    : message.type === 'warning'
                      ? isDarkMode ? 'bg-yellow-900/30 border border-yellow-700' : 'bg-yellow-100 border border-yellow-300'
                      : isDarkMode ? 'bg-red-900/30 border border-red-700' : 'bg-red-100 border border-red-300'
                    }`}>
                    {message.type === 'success' && <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={20} />}
                    {message.type === 'warning' && <AlertCircle className="text-yellow-500 flex-shrink-0 mt-0.5" size={20} />}
                    {message.type === 'error' && <XCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />}
                    <p className={`text-sm ${message.type === 'success'
                      ? isDarkMode ? 'text-green-200' : 'text-green-800'
                      : message.type === 'warning'
                        ? isDarkMode ? 'text-yellow-200' : 'text-yellow-800'
                        : isDarkMode ? 'text-red-200' : 'text-red-800'
                      }`}>{message.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className={`px-6 py-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-end`}>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-white rounded transition-colors"
                style={{ backgroundColor: colorPalette?.primary || '#ea580c' }}
                onMouseEnter={(e) => { if (colorPalette?.accent) e.currentTarget.style.backgroundColor = colorPalette.accent; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colorPalette?.primary || '#ea580c'; }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-end z-50">
        <div className={`h-full w-full max-w-2xl ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} shadow-2xl overflow-hidden flex flex-col`}>
          <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'} px-6 py-4 flex items-center justify-between border-b`}>
            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {`${formData.firstName} ${formData.middleInitial} ${formData.lastName}`.trim() || 'Work Order Done Form'}
            </h2>
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border rounded text-sm"
                style={{ borderColor: colorPalette?.primary || '#ea580c', color: colorPalette?.primary || '#ea580c' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 disabled:opacity-50 text-white rounded text-sm"
                style={{ backgroundColor: colorPalette?.primary || '#ea580c' }}
                onMouseEnter={(e) => { if (colorPalette?.accent) e.currentTarget.style.backgroundColor = colorPalette.accent; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colorPalette?.primary || '#ea580c'; }}
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Timestamp<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={formData.timestamp}
                    onChange={(e) => handleInputChange('timestamp', e.target.value)}
                    className={`w-full px-3 py-2 border rounded focus:outline-none focus:border-orange-500 ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'} ${errors.timestamp ? 'border-red-500' : ''}`}
                  />
                  <Calendar className={`absolute right-3 top-2.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} size={20} />
                </div>
                {errors.timestamp && <p className="text-red-500 text-xs mt-1">{errors.timestamp}</p>}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Status<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className={`w-full px-3 py-2 border rounded focus:outline-none focus:border-orange-500 appearance-none ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'} ${errors.status ? 'border-red-500' : ''}`}
                  >
                    <option value="" disabled>Select Status</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="For Confirmation">For Confirmation</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                  <ChevronDown className={`absolute right-3 top-2.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} size={20} />
                </div>
                {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status}</p>}
              </div>

              <div className="relative">
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Referred By</label>
                <div className={`flex items-center px-3 py-2 border rounded transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'} ${isReferredByOpen ? 'border-orange-500' : ''}`}>
                  <Search size={16} className={`mr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <input
                    type="text"
                    placeholder="Search Agent..."
                    value={isReferredByOpen ? referredBySearch : (formData.referredBy || '')}
                    onChange={(e) => {
                      setReferredBySearch(e.target.value);
                      if (!isReferredByOpen) setIsReferredByOpen(true);
                    }}
                    onFocus={() => setIsReferredByOpen(true)}
                    className={`w-full bg-transparent border-none focus:outline-none p-0 text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (isReferredByOpen) { setIsReferredByOpen(false); setReferredBySearch(''); }
                      else { handleInputChange('referredBy', ''); setReferredBySearch(''); }
                    }}
                    className={`ml-2 transition-transform duration-200 ${isReferredByOpen ? 'rotate-180' : ''}`}
                  >
                    <ChevronDown size={18} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                  </button>
                </div>

                {isReferredByOpen && (
                  <div className={`absolute left-0 right-0 top-full mt-1 z-50 rounded-md shadow-2xl border overflow-hidden flex flex-col ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`} style={{ minWidth: '100%' }}>
                    <div className="max-h-60 overflow-y-auto">
                      {agents
                        .filter(agent => {
                          const fullName = `${agent.first_name || ''} ${agent.middle_initial || ''} ${agent.last_name || ''}`.replace(/\s+/g, ' ').trim();
                          const searchLower = referredBySearch.toLowerCase();
                          return fullName.toLowerCase().includes(searchLower) ||
                            (agent.username && agent.username.toLowerCase().includes(searchLower)) ||
                            (agent.email_address && agent.email_address.toLowerCase().includes(searchLower));
                        })
                        .map((agent) => {
                          const fullName = `${agent.first_name || ''} ${agent.middle_initial || ''} ${agent.last_name || ''}`.replace(/\s+/g, ' ').trim();
                          return (
                            <div
                              key={agent.id}
                              className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100 text-gray-700'} ${formData.referredBy === fullName ? (isDarkMode ? 'bg-orange-600/20 text-orange-400' : 'bg-orange-50 text-orange-600') : ''}`}
                              onClick={() => { handleInputChange('referredBy', fullName); setIsReferredByOpen(false); setReferredBySearch(''); }}
                            >
                              <div className="flex items-center justify-between">
                                <span>{fullName}</span>
                                {formData.referredBy === fullName && <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>}
                              </div>
                            </div>
                          );
                        })}
                      {agents.filter(agent => {
                        const fullName = `${agent.first_name || ''} ${agent.middle_initial || ''} ${agent.last_name || ''}`.replace(/\s+/g, ' ').trim();
                        const searchLower = referredBySearch.toLowerCase();
                        return fullName.toLowerCase().includes(searchLower) ||
                          (agent.username && agent.username.toLowerCase().includes(searchLower)) ||
                          (agent.email_address && agent.email_address.toLowerCase().includes(searchLower));
                      }).length === 0 && (
                          <div className={`px-4 py-8 text-center text-sm italic ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            No Agent found for "{referredBySearch}"
                          </div>
                        )}
                    </div>
                  </div>
                )}

                {isReferredByOpen && (
                  <div className="fixed inset-0 z-40 bg-transparent" onClick={() => { setIsReferredByOpen(false); setReferredBySearch(''); }} />
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  First Name<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded focus:outline-none focus:border-orange-500 ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'} ${errors.firstName ? 'border-red-500' : ''}`}
                />
                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Middle Initial</label>
                <input
                  type="text"
                  value={formData.middleInitial}
                  onChange={(e) => handleInputChange('middleInitial', e.target.value)}
                  onKeyDown={(e) => { if (/[0-9]/.test(e.key)) e.preventDefault(); }}
                  maxLength={1}
                  className={`w-full px-3 py-2 border rounded focus:outline-none focus:border-orange-500 ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Last Name<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded focus:outline-none focus:border-orange-500 ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'} ${errors.lastName ? 'border-red-500' : ''}`}
                />
                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Contact Number<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.contactNumber}
                  onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                  className={`w-full px-3 py-2 border rounded focus:outline-none focus:border-orange-500 ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'} ${errors.contactNumber ? 'border-red-500' : ''}`}
                />
                {errors.contactNumber && <p className="text-red-500 text-xs mt-1">{errors.contactNumber}</p>}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Applicant Email Address<span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded focus:outline-none focus:border-orange-500 ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'} ${errors.email ? 'border-red-500' : ''}`}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Address<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className={`w-full px-3 py-2 border rounded focus:outline-none focus:border-orange-500 ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'} ${errors.address ? 'border-red-500' : ''}`}
                />
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Region<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.region}
                    onChange={(e) => handleInputChange('region', e.target.value)}
                    className={`w-full px-3 py-2 border rounded focus:outline-none focus:border-orange-500 appearance-none ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'} ${errors.region ? 'border-red-500' : ''}`}
                  >
                    <option value="">Select Region</option>
                    {formData.region && !regions.some(reg => reg.name === formData.region) && (
                      <option value={formData.region}>{formData.region}</option>
                    )}
                    {regions.map((region) => (
                      <option key={region.id} value={region.name}>{region.name}</option>
                    ))}
                  </select>
                  <ChevronDown className={`absolute right-3 top-2.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} size={20} />
                </div>
                {errors.region && <p className="text-red-500 text-xs mt-1">{errors.region}</p>}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  City<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    disabled={!formData.region}
                    className={`w-full px-3 py-2 border rounded focus:outline-none focus:border-orange-500 appearance-none disabled:opacity-50 disabled:cursor-not-allowed ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'} ${errors.city ? 'border-red-500' : ''}`}
                  >
                    <option value="">{formData.region ? 'Select City' : 'Select Region First'}</option>
                    {formData.city && !filteredCities.some(city => city.name === formData.city) && (
                      <option value={formData.city}>{formData.city}</option>
                    )}
                    {filteredCities.map((city) => (
                      <option key={city.id} value={city.name}>{city.name}</option>
                    ))}
                  </select>
                  <ChevronDown className={`absolute right-3 top-2.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} size={20} />
                </div>
                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Barangay<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.barangay}
                    onChange={(e) => handleInputChange('barangay', e.target.value)}
                    disabled={!formData.city}
                    className={`w-full px-3 py-2 border rounded focus:outline-none focus:border-orange-500 appearance-none disabled:opacity-50 disabled:cursor-not-allowed ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'} ${errors.barangay ? 'border-red-500' : ''}`}
                  >
                    <option value="">{formData.city ? 'Select Barangay' : 'Select City First'}</option>
                    {formData.barangay && !filteredBarangays.some(b => b.barangay === formData.barangay) && (
                      <option value={formData.barangay}>{formData.barangay}</option>
                    )}
                    {filteredBarangays.map((barangay) => (
                      <option key={barangay.id} value={barangay.barangay}>{barangay.barangay}</option>
                    ))}
                  </select>
                  <ChevronDown className={`absolute right-3 top-2.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} size={20} />
                </div>
                {errors.barangay && <p className="text-red-500 text-xs mt-1">{errors.barangay}</p>}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Choose Plan<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.choosePlan}
                    onChange={(e) => handleInputChange('choosePlan', e.target.value)}
                    className={`w-full px-3 py-2 border rounded focus:outline-none focus:border-orange-500 appearance-none ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'} ${errors.choosePlan ? 'border-red-500' : ''}`}
                  >
                    <option value="">Select Plan</option>
                    {formData.choosePlan && !plans.some(plan => {
                      const planWithPrice = plan.price ? `${plan.name} - P${plan.price}` : plan.name;
                      return planWithPrice === formData.choosePlan || plan.name === formData.choosePlan;
                    }) && (
                        <option value={formData.choosePlan}>{formData.choosePlan}</option>
                      )}
                    {plans.map((plan) => {
                      const planWithPrice = plan.price ? `${plan.name} - P${plan.price}` : plan.name;
                      return (
                        <option key={plan.id} value={planWithPrice}>{planWithPrice}</option>
                      );
                    })}
                  </select>
                  <ChevronDown className={`absolute right-3 top-2.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} size={20} />
                </div>
                {errors.choosePlan && <p className="text-red-500 text-xs mt-1">{errors.choosePlan}</p>}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Promo</label>
                <div className="relative">
                  <select
                    value={formData.promo}
                    onChange={(e) => handleInputChange('promo', e.target.value)}
                    className={`w-full px-3 py-2 border rounded focus:outline-none focus:border-orange-500 appearance-none ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'}`}
                  >
                    <option value="">Select Promo</option>
                    <option value="None">None</option>
                    {formData.promo && formData.promo !== 'None' && !promos.some(p => p.promo_name === formData.promo) && (
                      <option value={formData.promo}>{formData.promo}</option>
                    )}
                    {promos.map((promo) => (
                      <option key={promo.id} value={promo.promo_name}>
                        {promo.promo_name}{promo.description ? ` - ${promo.description}` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className={`absolute right-3 top-2.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} size={20} />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Remarks</label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => handleInputChange('remarks', e.target.value)}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded focus:outline-none focus:border-orange-500 resize-none ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Installation Fee<span className="text-red-500">*</span>
                </label>
                <div className={`flex items-center border rounded ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}>
                  <span className={`px-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>₱</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.installationFee}
                    onChange={(e) => handleInstallationFeeChange(e.target.value)}
                    className={`flex-1 px-3 py-2 bg-transparent focus:outline-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield] ${isDarkMode ? 'text-white' : 'text-gray-900'} ${errors.installationFee ? 'border-red-500' : ''}`}
                    placeholder="0.00"
                  />
                </div>
                {errors.installationFee && <p className="text-red-500 text-xs mt-1">{errors.installationFee}</p>}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Billing Day<span className="text-red-500">*</span>
                </label>
                <div className={`flex items-center border rounded ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.billingDay}
                    onChange={(e) => handleInputChange('billingDay', e.target.value)}
                    disabled={formData.isLastDayOfMonth}
                    className={`flex-1 px-3 py-2 bg-transparent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${isDarkMode ? 'text-white' : 'text-gray-900'} ${errors.billingDay ? 'border-red-500' : ''}`}
                  />
                  <div className="flex">
                    <button
                      type="button"
                      onClick={() => handleNumberChange('billingDay', false)}
                      disabled={formData.isLastDayOfMonth}
                      className={`px-3 py-2 border-l transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isDarkMode ? 'text-gray-400 hover:text-white border-gray-700' : 'text-gray-600 hover:text-gray-900 border-gray-300'}`}
                    >
                      <Minus size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNumberChange('billingDay', true)}
                      disabled={formData.isLastDayOfMonth}
                      className={`px-3 py-2 border-l transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isDarkMode ? 'text-gray-400 hover:text-white border-gray-700' : 'text-gray-600 hover:text-gray-900 border-gray-300'}`}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <div className="mt-2 flex items-center">
                  <input
                    type="checkbox"
                    id="isLastDayOfMonth"
                    checked={formData.isLastDayOfMonth}
                    onChange={(e) => handleInputChange('isLastDayOfMonth', e.target.checked)}
                    className={`w-4 h-4 rounded text-orange-600 focus:ring-orange-500 focus:ring-2 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
                  />
                  <label htmlFor="isLastDayOfMonth" className={`ml-2 text-sm cursor-pointer ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Always use last day of the month
                  </label>
                </div>

                {parseInt(formData.billingDay) > 30 && !formData.isLastDayOfMonth && (
                  <p className="text-orange-500 text-xs mt-1 flex items-center">
                    <span className="mr-1">⚠</span>Billing Day must be between 1 and 30
                  </p>
                )}
                {errors.billingDay && <p className="text-red-500 text-xs mt-1">{errors.billingDay}</p>}
              </div>
            </div>

            <div className="space-y-4">
              {formData.status === 'Confirmed' && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Onsite Status<span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.onsiteStatus}
                      onChange={(e) => handleInputChange('onsiteStatus', e.target.value)}
                      className={`w-full px-3 py-2 border rounded focus:outline-none focus:border-orange-500 appearance-none ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'} ${errors.onsiteStatus ? 'border-red-500' : ''}`}
                    >
                      <option value="In Progress">In Progress</option>
                      <option value="Done">Done</option>
                      <option value="Failed">Failed</option>
                      <option value="Reschedule">Reschedule</option>
                    </select>
                    <ChevronDown className={`absolute right-3 top-2.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} size={20} />
                  </div>
                  {errors.onsiteStatus && <p className="text-red-500 text-xs mt-1">{errors.onsiteStatus}</p>}
                </div>
              )}

              {formData.status === 'Confirmed' && formData.onsiteStatus !== 'Failed' && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Assigned Email<span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.assignedEmail}
                      onChange={(e) => handleInputChange('assignedEmail', e.target.value)}
                      className={`w-full px-3 py-2 border rounded focus:outline-none focus:border-orange-500 appearance-none ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'} ${errors.assignedEmail ? 'border-red-500' : ''}`}
                    >
                      <option value="">Select Assigned Email</option>
                      {formData.assignedEmail && !technicians.some(t => t.email === formData.assignedEmail) && (
                        <option value={formData.assignedEmail}>{formData.assignedEmail}</option>
                      )}
                      {technicians.map((technician, index) => (
                        <option key={index} value={technician.email}>{technician.email}</option>
                      ))}
                    </select>
                    <ChevronDown className={`absolute right-3 top-2.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} size={20} />
                  </div>
                  {errors.assignedEmail && <p className="text-red-500 text-xs mt-1">{errors.assignedEmail}</p>}
                </div>
              )}

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Modified By<span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.modifiedBy}
                  readOnly
                  className={`w-full px-3 py-2 border rounded cursor-not-allowed ${isDarkMode ? 'bg-gray-700 border-gray-700 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-600'}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Modified Date<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={formData.modifiedDate}
                    readOnly
                    className={`w-full px-3 py-2 border rounded cursor-not-allowed ${isDarkMode ? 'bg-gray-700 border-gray-700 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-600'}`}
                  />
                  <Calendar className={`absolute right-3 top-2.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} size={20} />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Installation Landmark</label>
                <input
                  type="text"
                  value={formData.installationLandmark}
                  onChange={(e) => handleInputChange('installationLandmark', e.target.value)}
                  className={`w-full px-3 py-2 border rounded focus:outline-none focus:border-orange-500 ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'}`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default WorkOrderDoneFormModal;
