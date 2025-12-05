import React, { useState, useEffect } from 'react';
import apiClient from '../config/api';

interface SmsConfigData {
  id: number;
  code: string;
  email: string;
  password: string;
  sender: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

interface SmsConfigResponse {
  success: boolean;
  data: SmsConfigData[];
  count: number;
  message?: string;
}

interface ModalConfig {
  isOpen: boolean;
  type: 'success' | 'error' | 'warning' | 'confirm';
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

const SmsConfig: React.FC = () => {
  const [smsConfigs, setSmsConfigs] = useState<SmsConfigData[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [operationLoading, setOperationLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<Record<number, boolean>>({});

  const [formData, setFormData] = useState({
    code: '',
    email: '',
    password: '',
    sender: ''
  });

  const [modal, setModal] = useState<ModalConfig>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  const fetchSmsConfigs = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<SmsConfigResponse>('/sms-config');
      if (response.data.success && response.data.data) {
        setSmsConfigs(response.data.data);
      } else {
        setSmsConfigs([]);
      }
    } catch (error) {
      console.error('Error fetching SMS configs:', error);
      setSmsConfigs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSmsConfigs();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      code: '',
      email: '',
      password: '',
      sender: ''
    });
  };

  const handleStartCreate = () => {
    resetForm();
    setIsCreating(true);
  };

  const handleStartEdit = (config: SmsConfigData) => {
    setFormData({
      code: config.code || '',
      email: config.email || '',
      password: config.password || '',
      sender: config.sender || ''
    });
    setEditingId(config.id);
  };

  const handleSave = async () => {
    try {
      setOperationLoading(true);
      
      const authData = localStorage.getItem('authData');
      let userEmail = 'unknown@user.com';
      
      if (authData) {
        try {
          const userData = JSON.parse(authData);
          userEmail = userData.email || userData.user?.email || 'unknown@user.com';
        } catch (error) {
          console.error('Error parsing auth data:', error);
        }
      }

      const payload = {
        ...formData,
        updated_by: userEmail
      };

      if (isCreating) {
        await apiClient.post('/sms-config', payload);
        setModal({
          isOpen: true,
          type: 'success',
          title: 'Success',
          message: 'SMS configuration created successfully'
        });
        setIsCreating(false);
      } else if (editingId !== null) {
        await apiClient.put(`/sms-config/${editingId}`, payload);
        setModal({
          isOpen: true,
          type: 'success',
          title: 'Success',
          message: 'SMS configuration updated successfully'
        });
        setEditingId(null);
      }
      
      await fetchSmsConfigs();
      resetForm();
      setShowPassword({});
    } catch (error: any) {
      console.error('Error saving SMS config:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Unknown error occurred';
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: `Failed to save: ${errorMessage}`
      });
    } finally {
      setOperationLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Confirm Deletion',
      message: 'Are you sure you want to delete this SMS configuration?',
      onConfirm: async () => {
        try {
          setModal({ ...modal, isOpen: false });
          setOperationLoading(true);
          await apiClient.delete(`/sms-config/${id}`);
          setModal({
            isOpen: true,
            type: 'success',
            title: 'Success',
            message: 'SMS configuration deleted successfully'
          });
          await fetchSmsConfigs();
        } catch (error: any) {
          console.error('Error deleting SMS config:', error);
          setModal({
            isOpen: true,
            type: 'error',
            title: 'Error',
            message: `Failed to delete: ${error.response?.data?.message || error.message}`
          });
        } finally {
          setOperationLoading(false);
        }
      },
      onCancel: () => {
        setModal({ ...modal, isOpen: false });
      }
    });
  };

  const handleCancel = () => {
    resetForm();
    setIsCreating(false);
    setEditingId(null);
    setShowPassword({});
  };

  const togglePasswordVisibility = (id: number) => {
    setShowPassword(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const canCreateNew = smsConfigs.length < 2;

  return (
    <div className="p-4 bg-gray-950 min-h-full">
      <div className="mb-4 pb-3 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white mb-1">
              SMS Configuration
            </h2>
          </div>
          {canCreateNew && !isCreating && editingId === null && (
            <button
              onClick={handleStartCreate}
              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded transition-colors"
            >
              Create New
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {loading && smsConfigs.length === 0 && !isCreating ? (
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
          </div>
        ) : (
          <>
            {smsConfigs.map((config) => (
              <div key={config.id} className="bg-gray-800 rounded p-4 border border-gray-700">
                {editingId === config.id ? (
                  <div className="space-y-3">
                    <h3 className="text-base font-semibold text-white mb-2">Edit Configuration #{config.id}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">
                          API Code
                        </label>
                        <input
                          type="text"
                          value={formData.code}
                          onChange={(e) => handleInputChange('code', e.target.value)}
                          placeholder="Enter API code"
                          className="w-full px-3 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-orange-500"
                          disabled={loading}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="Enter email"
                          className="w-full px-3 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-orange-500"
                          disabled={loading}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">
                          Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword[config.id] ? 'text' : 'password'}
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            placeholder="Enter password"
                            className="w-full px-3 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-orange-500"
                            disabled={loading}
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(config.id)}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 text-xs"
                          >
                            {showPassword[config.id] ? 'Hide' : 'Show'}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">
                          Sender Name
                        </label>
                        <input
                          type="text"
                          value={formData.sender}
                          onChange={(e) => handleInputChange('sender', e.target.value)}
                          placeholder="Enter sender name"
                          className="w-full px-3 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-orange-500"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-3 py-1.5 text-sm bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded transition-colors"
                      >
                        Update
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={loading}
                        className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base font-semibold text-white">Configuration #{config.id}</h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStartEdit(config)}
                          className="px-3 py-1 text-sm text-blue-400 hover:text-blue-300 hover:bg-blue-900 rounded transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(config.id)}
                          className="px-3 py-1 text-sm text-red-400 hover:text-red-300 hover:bg-red-900 rounded transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-gray-700 p-2.5 rounded">
                        <p className="text-gray-400 text-xs mb-0.5">API Code</p>
                        <p className="text-white font-medium text-sm">{config.code || 'Not set'}</p>
                      </div>
                      <div className="bg-gray-700 p-2.5 rounded">
                        <p className="text-gray-400 text-xs mb-0.5">Email</p>
                        <p className="text-white font-medium text-sm">{config.email || 'Not set'}</p>
                      </div>
                      <div className="bg-gray-700 p-2.5 rounded">
                        <p className="text-gray-400 text-xs mb-0.5">Sender Name</p>
                        <p className="text-white font-medium text-sm">{config.sender || 'Not set'}</p>
                      </div>
                      <div className="bg-gray-700 p-2.5 rounded">
                        <p className="text-gray-400 text-xs mb-0.5">Password</p>
                        <p className="text-white font-medium text-sm">
                          {showPassword[config.id] ? config.password : '••••••••'}
                        </p>
                        <button
                          onClick={() => togglePasswordVisibility(config.id)}
                          className="text-orange-400 hover:text-orange-300 text-xs"
                        >
                          {showPassword[config.id] ? 'Hide' : 'Show'}
                        </button>
                      </div>
                      <div className="bg-gray-700 p-2.5 rounded md:col-span-2">
                        <p className="text-gray-400 text-xs mb-0.5">Last Updated By</p>
                        <p className="text-white font-medium text-sm">{config.updated_by || 'Unknown'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isCreating && (
              <div className="bg-gray-800 rounded p-4 border border-gray-700">
                <h3 className="text-base font-semibold text-white mb-2">Create New Configuration</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">
                        API Code
                      </label>
                      <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => handleInputChange('code', e.target.value)}
                        placeholder="Enter API code"
                        className="w-full px-3 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-orange-500"
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="Enter email"
                        className="w-full px-3 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-orange-500"
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword[0] ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          placeholder="Enter password"
                          className="w-full px-3 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-orange-500"
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(0)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 text-xs"
                        >
                          {showPassword[0] ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">
                        Sender Name
                      </label>
                      <input
                        type="text"
                        value={formData.sender}
                        onChange={(e) => handleInputChange('sender', e.target.value)}
                        placeholder="Enter sender name"
                        className="w-full px-3 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-orange-500"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="px-3 py-1.5 text-sm bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded transition-colors"
                    >
                      Create
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={loading}
                      className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {smsConfigs.length === 0 && !isCreating && (
              <div className="text-center py-8 text-gray-400">
                <p className="text-base mb-1">No SMS configurations found</p>
              </div>
            )}
          </>
        )}
      </div>

      {operationLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
              <p className="text-white text-base font-medium">Processing...</p>
              <p className="text-gray-400 text-sm mt-2">Please wait</p>
            </div>
          </div>
        </div>
      )}

      {modal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 max-w-md w-full mx-4">
            <h3 className="text-base font-semibold text-white mb-3">{modal.title}</h3>
            <p className="text-gray-300 text-sm mb-4">{modal.message}</p>
            <div className="flex items-center justify-end gap-2">
              {modal.type === 'confirm' ? (
                <>
                  <button
                    onClick={modal.onCancel}
                    className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={modal.onConfirm}
                    className="px-3 py-1.5 text-sm bg-orange-600 hover:bg-orange-700 text-white rounded transition-colors"
                  >
                    Confirm
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setModal({ ...modal, isOpen: false })}
                  className="px-3 py-1.5 text-sm bg-orange-600 hover:bg-orange-700 text-white rounded transition-colors"
                >
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmsConfig;
