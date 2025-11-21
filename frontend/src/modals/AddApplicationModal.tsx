import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface AddApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingApplication?: ApplicationData | null;
}

interface ApplicationData {
  id?: string;
  first_name: string;
  middle_initial?: string;
  last_name: string;
  email_address: string;
  mobile_number: string;
  secondary_mobile_number?: string;
  installation_address: string;
  landmark?: string;
  region?: string;
  city?: string;
  barangay?: string;
  location?: string;
  desired_plan: string;
  promo?: string;
  referred_by?: string;
  status: string;
  terms_and_conditions: boolean;
  government_valid_id?: string;
}

const AddApplicationModal: React.FC<AddApplicationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingApplication
}) => {
  const [formData, setFormData] = useState<ApplicationData>({
    first_name: '',
    middle_initial: '',
    last_name: '',
    email_address: '',
    mobile_number: '',
    secondary_mobile_number: '',
    installation_address: '',
    landmark: '',
    region: '',
    city: '',
    barangay: '',
    location: '',
    desired_plan: '',
    promo: '',
    referred_by: '',
    status: 'pending',
    terms_and_conditions: false,
    government_valid_id: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://backend.atssfiber.ph/api';

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'text-orange-400' },
    { value: 'schedule', label: 'Scheduled', color: 'text-green-400' },
    { value: 'no facility', label: 'No Facility', color: 'text-red-400' },
    { value: 'cancelled', label: 'Cancelled', color: 'text-red-500' },
    { value: 'no slot', label: 'No Slot', color: 'text-yellow-400' },
    { value: 'duplicate', label: 'Duplicate', color: 'text-yellow-500' },
    { value: 'in progress', label: 'In Progress', color: 'text-blue-400' },
    { value: 'completed', label: 'Completed', color: 'text-green-400' }
  ];

  useEffect(() => {
    if (isOpen && editingApplication) {
      setFormData({
        first_name: editingApplication.first_name || '',
        middle_initial: editingApplication.middle_initial || '',
        last_name: editingApplication.last_name || '',
        email_address: editingApplication.email_address || '',
        mobile_number: editingApplication.mobile_number || '',
        secondary_mobile_number: editingApplication.secondary_mobile_number || '',
        installation_address: editingApplication.installation_address || '',
        landmark: editingApplication.landmark || '',
        region: editingApplication.region || '',
        city: editingApplication.city || '',
        barangay: editingApplication.barangay || '',
        location: editingApplication.location || '',
        desired_plan: editingApplication.desired_plan || '',
        promo: editingApplication.promo || '',
        referred_by: editingApplication.referred_by || '',
        status: editingApplication.status || 'pending',
        terms_and_conditions: editingApplication.terms_and_conditions || false,
        government_valid_id: editingApplication.government_valid_id || ''
      });
    } else if (isOpen && !editingApplication) {
      resetForm();
    }
  }, [isOpen, editingApplication]);

  const resetForm = () => {
    setFormData({
      first_name: '',
      middle_initial: '',
      last_name: '',
      email_address: '',
      mobile_number: '',
      secondary_mobile_number: '',
      installation_address: '',
      landmark: '',
      region: '',
      city: '',
      barangay: '',
      location: '',
      desired_plan: '',
      promo: '',
      referred_by: '',
      status: 'pending',
      terms_and_conditions: false,
      government_valid_id: ''
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    if (!formData.email_address.trim()) {
      newErrors.email_address = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email_address)) {
      newErrors.email_address = 'Invalid email address format';
    }

    if (!formData.mobile_number.trim()) {
      newErrors.mobile_number = 'Mobile number is required';
    } else if (!/^[0-9]{10,11}$/.test(formData.mobile_number)) {
      newErrors.mobile_number = 'Mobile number must be 10-11 digits';
    }

    if (formData.secondary_mobile_number && !/^[0-9]{10,11}$/.test(formData.secondary_mobile_number)) {
      newErrors.secondary_mobile_number = 'Secondary mobile number must be 10-11 digits';
    }

    if (!formData.installation_address.trim()) {
      newErrors.installation_address = 'Installation address is required';
    }

    if (!formData.desired_plan.trim()) {
      newErrors.desired_plan = 'Desired plan is required';
    }

    if (!formData.terms_and_conditions) {
      newErrors.terms_and_conditions = 'You must agree to the terms and conditions';
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
        first_name: formData.first_name.trim(),
        middle_initial: formData.middle_initial?.trim() || '',
        last_name: formData.last_name.trim(),
        email_address: formData.email_address.trim(),
        mobile_number: formData.mobile_number.trim(),
        secondary_mobile_number: formData.secondary_mobile_number?.trim() || '',
        installation_address: formData.installation_address.trim(),
        landmark: formData.landmark?.trim() || '',
        region: formData.region?.trim() || '',
        city: formData.city?.trim() || '',
        barangay: formData.barangay?.trim() || '',
        location: formData.location?.trim() || '',
        desired_plan: formData.desired_plan.trim(),
        promo: formData.promo?.trim() || '',
        referred_by: formData.referred_by?.trim() || '',
        status: formData.status,
        terms_and_conditions: formData.terms_and_conditions,
        government_valid_id: formData.government_valid_id?.trim() || ''
      };

      const url = editingApplication 
        ? `${API_BASE_URL}/applications/${editingApplication.id}`
        : `${API_BASE_URL}/applications`;
      
      const method = editingApplication ? 'PUT' : 'POST';

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
        alert(data.message || `Application ${editingApplication ? 'updated' : 'created'} successfully`);
        onSave();
        handleClose();
      } else {
        if (data.errors) {
          const errorMessages = Object.values(data.errors).flat().join('\n');
          alert('Validation errors:\n' + errorMessages);
        } else {
          alert(data.message || `Failed to ${editingApplication ? 'update' : 'create'} application`);
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert(`Failed to ${editingApplication ? 'update' : 'create'} application: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        className="h-full w-full md:w-full md:max-w-2xl bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gray-800 px-6 py-4 flex items-center justify-between border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">{editingApplication ? 'Edit Application' : 'New Application'}</h2>
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
              Status<span className="text-red-500">*</span>
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-orange-500"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                First Name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className={`w-full px-3 py-2 bg-gray-800 border ${errors.first_name ? 'border-red-500' : 'border-gray-700'} rounded text-white focus:outline-none focus:border-orange-500`}
                placeholder="Enter first name"
              />
              {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                M.I.
              </label>
              <input
                type="text"
                maxLength={2}
                value={formData.middle_initial}
                onChange={(e) => setFormData({ ...formData, middle_initial: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-orange-500"
                placeholder="M.I."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Last Name<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              className={`w-full px-3 py-2 bg-gray-800 border ${errors.last_name ? 'border-red-500' : 'border-gray-700'} rounded text-white focus:outline-none focus:border-orange-500`}
              placeholder="Enter last name"
            />
            {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address<span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email_address}
              onChange={(e) => setFormData({ ...formData, email_address: e.target.value })}
              className={`w-full px-3 py-2 bg-gray-800 border ${errors.email_address ? 'border-red-500' : 'border-gray-700'} rounded text-white focus:outline-none focus:border-orange-500`}
              placeholder="example@email.com"
            />
            {errors.email_address && <p className="text-red-500 text-xs mt-1">{errors.email_address}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Mobile Number<span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.mobile_number}
              onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value.replace(/\D/g, '') })}
              className={`w-full px-3 py-2 bg-gray-800 border ${errors.mobile_number ? 'border-red-500' : 'border-gray-700'} rounded text-white focus:outline-none focus:border-orange-500`}
              placeholder="09123456789"
              maxLength={11}
            />
            {errors.mobile_number && <p className="text-red-500 text-xs mt-1">{errors.mobile_number}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Second Mobile Number
            </label>
            <input
              type="tel"
              value={formData.secondary_mobile_number}
              onChange={(e) => setFormData({ ...formData, secondary_mobile_number: e.target.value.replace(/\D/g, '') })}
              className={`w-full px-3 py-2 bg-gray-800 border ${errors.secondary_mobile_number ? 'border-red-500' : 'border-gray-700'} rounded text-white focus:outline-none focus:border-orange-500`}
              placeholder="09123456789"
              maxLength={11}
            />
            {errors.secondary_mobile_number && <p className="text-red-500 text-xs mt-1">{errors.secondary_mobile_number}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Installation Address<span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.installation_address}
              onChange={(e) => setFormData({ ...formData, installation_address: e.target.value })}
              rows={3}
              className={`w-full px-3 py-2 bg-gray-800 border ${errors.installation_address ? 'border-red-500' : 'border-gray-700'} rounded text-white focus:outline-none focus:border-orange-500 resize-none`}
              placeholder="Enter full installation address"
            />
            {errors.installation_address && <p className="text-red-500 text-xs mt-1">{errors.installation_address}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Landmark
            </label>
            <input
              type="text"
              value={formData.landmark}
              onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-orange-500"
              placeholder="Nearby landmark"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Region
              </label>
              <input
                type="text"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-orange-500"
                placeholder="Region"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-orange-500"
                placeholder="City"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Barangay
              </label>
              <input
                type="text"
                value={formData.barangay}
                onChange={(e) => setFormData({ ...formData, barangay: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-orange-500"
                placeholder="Barangay"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-orange-500"
                placeholder="Specific location"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Desired Plan<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.desired_plan}
              onChange={(e) => setFormData({ ...formData, desired_plan: e.target.value })}
              className={`w-full px-3 py-2 bg-gray-800 border ${errors.desired_plan ? 'border-red-500' : 'border-gray-700'} rounded text-white focus:outline-none focus:border-orange-500`}
              placeholder="e.g., FLASH, TURBO, etc."
            />
            {errors.desired_plan && <p className="text-red-500 text-xs mt-1">{errors.desired_plan}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Promo
            </label>
            <input
              type="text"
              value={formData.promo}
              onChange={(e) => setFormData({ ...formData, promo: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-orange-500"
              placeholder="Promo code (if any)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Referred By
            </label>
            <input
              type="text"
              value={formData.referred_by}
              onChange={(e) => setFormData({ ...formData, referred_by: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-orange-500"
              placeholder="Name of referrer (if any)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Government Valid ID
            </label>
            <input
              type="text"
              value={formData.government_valid_id}
              onChange={(e) => setFormData({ ...formData, government_valid_id: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-orange-500"
              placeholder="Google Drive link or ID number"
            />
            <p className="text-gray-500 text-xs mt-1">Upload to Google Drive and paste the link here</p>
          </div>

          <div>
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.terms_and_conditions}
                onChange={(e) => setFormData({ ...formData, terms_and_conditions: e.target.checked })}
                className={`mt-1 h-4 w-4 rounded border ${errors.terms_and_conditions ? 'border-red-500' : 'border-gray-600'} bg-gray-700 text-orange-600 focus:ring-orange-500 focus:ring-offset-gray-800`}
              />
              <div className="flex-1">
                <span className="text-sm text-gray-300">
                  I agree to the Terms and Conditions<span className="text-red-500">*</span>
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  By checking this box, you confirm that you have read and agree to our terms and conditions.
                </p>
                {errors.terms_and_conditions && <p className="text-red-500 text-xs mt-1">{errors.terms_and_conditions}</p>}
              </div>
            </label>
          </div>

          <div className="p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
            <p className="text-blue-300 text-sm">
              <strong>Note:</strong> Timestamp will be automatically recorded when the application is created.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddApplicationModal;
