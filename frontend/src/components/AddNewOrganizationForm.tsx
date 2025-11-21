import React, { useState } from 'react';
import { Organization } from '../types/api';
import { organizationService } from '../services/userService';
import Breadcrumb from '../pages/Breadcrumb';

interface AddNewOrganizationFormProps {
  onCancel: () => void;
  onOrganizationCreated: (organization: Organization) => void;
}

const AddNewOrganizationForm: React.FC<AddNewOrganizationFormProps> = ({ onCancel, onOrganizationCreated }) => {
  const [formData, setFormData] = useState({
    organization_name: '',
    address: '',
    contact_number: '',
    email_address: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.organization_name?.trim()) {
      newErrors.organization_name = 'Organization name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateOrganization = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const dataToSend = {
        organization_name: formData.organization_name.trim(),
        address: formData.address.trim() || null,
        contact_number: formData.contact_number.trim() || null,
        email_address: formData.email_address.trim() || null
      };
      
      const response = await organizationService.createOrganization(dataToSend);
      
      if (response.success && response.data) {
        console.log('Organization creation response:', response.data);
        
        if (!response.data || typeof response.data !== 'object') {
          console.error('Invalid response data:', response.data);
          setErrors({ general: 'Failed to create organization. Please try again.' });
          return;
        }
        
        onOrganizationCreated(response.data);
        onCancel();
      } else {
        setErrors({ general: response.message || 'Failed to create organization' });
      }
    } catch (error: any) {
      console.error('Create organization error:', error);
      
      if (error.response?.status === 422) {
        if (error.response?.data?.errors) {
          const backendErrors: Record<string, string> = {};
          const errorData = error.response.data.errors;
          
          Object.keys(errorData).forEach(key => {
            if (Array.isArray(errorData[key])) {
              backendErrors[key] = errorData[key][0];
            } else {
              backendErrors[key] = errorData[key];
            }
          });
          
          setErrors(backendErrors);
        } else if (error.response?.data?.message) {
          setErrors({ general: error.response.data.message });
        } else {
          setErrors({ general: 'Validation error: Please check all required fields' });
        }
      } else {
        setErrors({ 
          general: error.response?.data?.message || error.message || 'Failed to create organization'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <Breadcrumb items={[
        { label: 'Organizations', onClick: onCancel },
        { label: 'Add Organization' }
      ]} />
      <div className="bg-gray-800 rounded-lg border border-gray-600 overflow-hidden text-white">
        <div className="p-6">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-2">
              Add New Organization
            </h2>
            <p className="text-gray-400 text-sm">
              Create a new organization in the system
            </p>
          </div>

          {errors.general && (
            <div className="mb-6 p-4 bg-red-900 border border-red-600 rounded text-red-200">
              {errors.general}
            </div>
          )}

          <div className="max-w-2xl">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Organization Name *
                </label>
                <input
                  type="text"
                  name="organization_name"
                  value={formData.organization_name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 bg-gray-900 border rounded text-white placeholder-gray-500 focus:outline-none focus:border-gray-400 ${
                    errors.organization_name ? 'border-red-600' : 'border-gray-600'
                  }`}
                  placeholder="Enter organization name"
                  required
                />
                {errors.organization_name && (
                  <p className="text-red-400 text-sm mt-1">{errors.organization_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  className={`w-full px-4 py-3 bg-gray-900 border rounded text-white placeholder-gray-500 focus:outline-none focus:border-gray-400 ${
                    errors.address ? 'border-red-600' : 'border-gray-600'
                  }`}
                  placeholder="Enter organization address"
                />
                {errors.address && (
                  <p className="text-red-400 text-sm mt-1">{errors.address}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Contact Number
                </label>
                <input
                  type="text"
                  name="contact_number"
                  value={formData.contact_number}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 bg-gray-900 border rounded text-white placeholder-gray-500 focus:outline-none focus:border-gray-400 ${
                    errors.contact_number ? 'border-red-600' : 'border-gray-600'
                  }`}
                  placeholder="Enter contact number"
                />
                {errors.contact_number && (
                  <p className="text-red-400 text-sm mt-1">{errors.contact_number}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email_address"
                  value={formData.email_address}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 bg-gray-900 border rounded text-white placeholder-gray-500 focus:outline-none focus:border-gray-400 ${
                    errors.email_address ? 'border-red-600' : 'border-gray-600'
                  }`}
                  placeholder="Enter email address"
                />
                {errors.email_address && (
                  <p className="text-red-400 text-sm mt-1">{errors.email_address}</p>
                )}
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={onCancel}
                disabled={loading}
                className="px-6 py-3 border border-gray-600 text-white rounded hover:bg-gray-800 transition-colors text-sm font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateOrganization}
                disabled={loading}
                className="px-6 py-3 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Organization'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddNewOrganizationForm;
