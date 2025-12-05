import React, { useState, useEffect } from 'react';
import { Receipt, Hash, Edit2, Trash2, Save, X, Calendar } from 'lucide-react';
import { customAccountNumberService, CustomAccountNumber } from '../services/customAccountNumberService';
import apiClient from '../config/api';

interface BillingConfigData {
  advance_generation_day: number;
  due_date_day: number;
  disconnection_day: number;
  overdue_day: number;
  disconnection_notice: number;
}

interface BillingConfigResponse {
  success: boolean;
  data: BillingConfigData | null;
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

const BillingConfig: React.FC = () => {
  const [customAccountNumber, setCustomAccountNumber] = useState<CustomAccountNumber | null>(null);
  const [isEditingAccountNumber, setIsEditingAccountNumber] = useState<boolean>(false);
  const [accountNumberInput, setAccountNumberInput] = useState<string>('');
  const [loadingAccountNumber, setLoadingAccountNumber] = useState<boolean>(false);

  const [billingConfig, setBillingConfig] = useState<BillingConfigData | null>(null);
  const [isEditingBillingConfig, setIsEditingBillingConfig] = useState<boolean>(false);
  const [billingConfigInput, setBillingConfigInput] = useState<BillingConfigData>({
    advance_generation_day: 0,
    due_date_day: 0,
    disconnection_day: 0,
    overdue_day: 0,
    disconnection_notice: 0
  });
  const [loadingBillingConfig, setLoadingBillingConfig] = useState<boolean>(false);

  const [modal, setModal] = useState<ModalConfig>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  const fetchCustomAccountNumber = async () => {
    try {
      setLoadingAccountNumber(true);
      const response = await customAccountNumberService.get();
      if (response.success && response.data) {
        setCustomAccountNumber(response.data);
        setAccountNumberInput(response.data.starting_number);
      } else {
        setCustomAccountNumber(null);
        setAccountNumberInput('');
      }
    } catch (error) {
      console.error('Error fetching custom account number:', error);
    } finally {
      setLoadingAccountNumber(false);
    }
  };

  const fetchBillingConfig = async () => {
    try {
      setLoadingBillingConfig(true);
      const response = await apiClient.get<BillingConfigResponse>('/billing-config');
      if (response.data.success && response.data.data) {
        setBillingConfig(response.data.data);
        setBillingConfigInput(response.data.data);
      } else {
        setBillingConfig(null);
      }
    } catch (error) {
      console.error('Error fetching billing config:', error);
    } finally {
      setLoadingBillingConfig(false);
    }
  };

  useEffect(() => {
    fetchCustomAccountNumber();
    fetchBillingConfig();
  }, []);

  const handleSaveAccountNumber = async () => {
    try {
      setLoadingAccountNumber(true);
      const trimmedInput = accountNumberInput.trim();
      
      if (trimmedInput !== '' && trimmedInput.length > 7) {
        setModal({
          isOpen: true,
          type: 'error',
          title: 'Validation Error',
          message: 'Starting number must not exceed 7 characters'
        });
        setLoadingAccountNumber(false);
        return;
      }

      if (customAccountNumber) {
        await customAccountNumberService.update(trimmedInput);
        setModal({
          isOpen: true,
          type: 'success',
          title: 'Success',
          message: 'Starting account number updated successfully'
        });
      } else {
        await customAccountNumberService.create(trimmedInput);
        setModal({
          isOpen: true,
          type: 'success',
          title: 'Success',
          message: 'Starting account number created successfully'
        });
      }
      await fetchCustomAccountNumber();
      setIsEditingAccountNumber(false);
    } catch (error: any) {
      console.error('Error saving custom account number:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Unknown error occurred';
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: `Failed to save: ${errorMessage}`
      });
    } finally {
      setLoadingAccountNumber(false);
    }
  };

  const handleDeleteAccountNumber = async () => {
    if (!customAccountNumber) return;

    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Confirm Deletion',
      message: 'Are you sure you want to delete the starting account number?',
      onConfirm: async () => {
        try {
          setLoadingAccountNumber(true);
          await customAccountNumberService.delete();
          setModal({
            isOpen: true,
            type: 'success',
            title: 'Success',
            message: 'Starting account number deleted successfully'
          });
          setCustomAccountNumber(null);
          setAccountNumberInput('');
          setIsEditingAccountNumber(false);
        } catch (error: any) {
          console.error('Error deleting custom account number:', error);
          setModal({
            isOpen: true,
            type: 'error',
            title: 'Error',
            message: `Failed to delete: ${error.response?.data?.message || error.message}`
          });
        } finally {
          setLoadingAccountNumber(false);
        }
      },
      onCancel: () => {
        setModal({ ...modal, isOpen: false });
      }
    });
  };

  const handleCancelEdit = () => {
    if (customAccountNumber) {
      setAccountNumberInput(customAccountNumber.starting_number);
    } else {
      setAccountNumberInput('');
    }
    setIsEditingAccountNumber(false);
  };

  const handleSaveBillingConfig = async () => {
    try {
      setLoadingBillingConfig(true);
      
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

      const payload: any = {
        user_email: userEmail
      };

      if (billingConfigInput.advance_generation_day !== undefined && billingConfigInput.advance_generation_day !== null) {
        payload.advance_generation_day = billingConfigInput.advance_generation_day;
      }
      if (billingConfigInput.due_date_day !== undefined && billingConfigInput.due_date_day !== null) {
        payload.due_date_day = billingConfigInput.due_date_day;
      }
      if (billingConfigInput.disconnection_day !== undefined && billingConfigInput.disconnection_day !== null) {
        payload.disconnection_day = billingConfigInput.disconnection_day;
      }
      if (billingConfigInput.overdue_day !== undefined && billingConfigInput.overdue_day !== null) {
        payload.overdue_day = billingConfigInput.overdue_day;
      }
      if (billingConfigInput.disconnection_notice !== undefined && billingConfigInput.disconnection_notice !== null) {
        payload.disconnection_notice = billingConfigInput.disconnection_notice;
      }

      if (billingConfig) {
        await apiClient.put('/billing-config', payload);
        setModal({
          isOpen: true,
          type: 'success',
          title: 'Success',
          message: 'Billing configuration updated successfully'
        });
      } else {
        await apiClient.post('/billing-config', payload);
        setModal({
          isOpen: true,
          type: 'success',
          title: 'Success',
          message: 'Billing configuration created successfully'
        });
      }
      await fetchBillingConfig();
      setIsEditingBillingConfig(false);
    } catch (error: any) {
      console.error('Error saving billing config:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Unknown error occurred';
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: `Failed to save: ${errorMessage}`
      });
    } finally {
      setLoadingBillingConfig(false);
    }
  };

  const handleDeleteBillingConfig = async () => {
    if (!billingConfig) return;

    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Confirm Deletion',
      message: 'Are you sure you want to delete the billing configuration?',
      onConfirm: async () => {
        try {
          setLoadingBillingConfig(true);
          await apiClient.delete('/billing-config');
          setModal({
            isOpen: true,
            type: 'success',
            title: 'Success',
            message: 'Billing configuration deleted successfully'
          });
          setBillingConfig(null);
          setBillingConfigInput({
            advance_generation_day: 0,
            due_date_day: 0,
            disconnection_day: 0,
            overdue_day: 0,
            disconnection_notice: 0
          });
          setIsEditingBillingConfig(false);
        } catch (error: any) {
          console.error('Error deleting billing config:', error);
          setModal({
            isOpen: true,
            type: 'error',
            title: 'Error',
            message: `Failed to delete: ${error.response?.data?.message || error.message}`
          });
        } finally {
          setLoadingBillingConfig(false);
        }
      },
      onCancel: () => {
        setModal({ ...modal, isOpen: false });
      }
    });
  };

  const handleCancelBillingConfigEdit = () => {
    if (billingConfig) {
      setBillingConfigInput(billingConfig);
    } else {
      setBillingConfigInput({
        advance_generation_day: 0,
        due_date_day: 0,
        disconnection_day: 0,
        overdue_day: 0,
        disconnection_notice: 0
      });
    }
    setIsEditingBillingConfig(false);
  };

  interface BillingGenerationResponse {
    success: boolean;
    data: {
      invoices: { success: number; failed: number };
      statements: { success: number; failed: number };
    };
    message?: string;
  }

  const handleTestGeneration = async () => {
    try {
      setLoadingBillingConfig(true);
      
      const response = await apiClient.post<BillingGenerationResponse>('/billing-generation/force-generate-all');
      
      if (response.data.success) {
        const data = response.data.data;
        const totalGenerated = data.invoices.success + data.statements.success;
        const totalFailed = data.invoices.failed + data.statements.failed;
        
        setModal({
          isOpen: true,
          type: 'success',
          title: 'Test Generation Complete',
          message: `Successfully generated ${totalGenerated} billing records. ${totalFailed > 0 ? `${totalFailed} failed.` : ''} Check SOA and Invoice pages to review.`
        });
      } else {
        setModal({
          isOpen: true,
          type: 'error',
          title: 'Generation Failed',
          message: response.data.message || 'Failed to generate billing records'
        });
      }
    } catch (error: any) {
      console.error('Error testing billing generation:', error);
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: `Test generation failed: ${error.response?.data?.error || error.message}`
      });
    } finally {
      setLoadingBillingConfig(false);
    }
  };

  const handleBillingConfigInputChange = (field: keyof BillingConfigData, value: string) => {
    if (value === '') {
      setBillingConfigInput(prev => ({
        ...prev,
        [field]: '' as any
      }));
      return;
    }
    
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 31) {
      setBillingConfigInput(prev => ({
        ...prev,
        [field]: numValue
      }));
    }
  };

  return (
    <div className="p-6 bg-gray-950 min-h-full">
      <div className="mb-6 pb-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white mb-2 flex items-center gap-3">
              Billing Configurations
            </h2>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-4 pb-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-white">
              Starting Account Number
            </h3>
          </div>
          
          <div className="space-y-4">
            <p className="text-gray-400 text-sm">
              Set a custom starting number for new billing accounts. This can only be created once. You can edit or delete it after creation.
            </p>

            {loadingAccountNumber ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              </div>
            ) : customAccountNumber && !isEditingAccountNumber ? (
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-orange-500 bg-opacity-20 flex items-center justify-center">
                    <Hash className="h-5 w-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-lg">{customAccountNumber.starting_number}</p>
                    <p className="text-gray-400 text-xs">Current starting number</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditingAccountNumber(true)}
                    className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900 rounded transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={handleDeleteAccountNumber}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Starting Number
                  </label>
                  <input
                    type="text"
                    value={accountNumberInput}
                    onChange={(e) => setAccountNumberInput(e.target.value)}
                    placeholder="e.g., ABC1234 (optional, max 7 characters)"
                    maxLength={7}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-orange-500 uppercase"
                    disabled={loadingAccountNumber}
                  />
                  <p className="text-gray-500 text-xs mt-2">
                    Enter any combination of letters and numbers (max 7 characters). Leave blank to generate without prefix.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveAccountNumber}
                    disabled={loadingAccountNumber}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded transition-colors"
                  >
                    <Save size={18} />
                    <span>{customAccountNumber ? 'Update' : 'Create'}</span>
                  </button>
                  {customAccountNumber && (
                    <button
                      onClick={handleCancelEdit}
                      disabled={loadingAccountNumber}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded transition-colors"
                    >
                      <X size={18} />
                      <span>Cancel</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 pb-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-white">
              Billing Day Configuration
            </h3>
          </div>
          
          <div className="space-y-4">
            <p className="text-gray-400 text-sm">
              Configure the day intervals for billing operations. This can only be created once. You can edit or delete it after creation.
            </p>

            {loadingBillingConfig ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              </div>
            ) : billingConfig && !isEditingBillingConfig ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-800 p-4 rounded">
                    <p className="text-gray-400 text-xs mb-1">Advance Generation Day</p>
                    <p className="text-white font-medium text-lg">{billingConfig.advance_generation_day}</p>
                  </div>
                  <div className="bg-gray-800 p-4 rounded">
                    <p className="text-gray-400 text-xs mb-1">Due Date Day</p>
                    <p className="text-white font-medium text-lg">{billingConfig.due_date_day}</p>
                  </div>
                  <div className="bg-gray-800 p-4 rounded">
                    <p className="text-gray-400 text-xs mb-1">Disconnection Day</p>
                    <p className="text-white font-medium text-lg">{billingConfig.disconnection_day}</p>
                  </div>
                  <div className="bg-gray-800 p-4 rounded">
                    <p className="text-gray-400 text-xs mb-1">Overdue Day</p>
                    <p className="text-white font-medium text-lg">{billingConfig.overdue_day}</p>
                  </div>
                  <div className="bg-gray-800 p-4 rounded">
                    <p className="text-gray-400 text-xs mb-1">Disconnection Notice</p>
                    <p className="text-white font-medium text-lg">{billingConfig.disconnection_notice}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => setIsEditingBillingConfig(true)}
                    className="flex items-center gap-2 px-4 py-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900 rounded transition-colors"
                  >
                    <Edit2 size={18} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={handleDeleteBillingConfig}
                    className="flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-900 rounded transition-colors"
                  >
                    <Trash2 size={18} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Advance Generation Day
                    </label>
                    <input
                      type="number"
                      value={billingConfigInput.advance_generation_day}
                      onChange={(e) => handleBillingConfigInputChange('advance_generation_day', e.target.value)}
                      onFocus={(e) => e.target.select()}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-orange-500"
                      min="0"
                      max="31"
                      disabled={loadingBillingConfig}
                    />
                    <p className="text-gray-500 text-xs mt-2">
                      Days before billing day to generate bills (0-31, 0 = disabled)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Due Date Day
                    </label>
                    <input
                      type="number"
                      value={billingConfigInput.due_date_day}
                      onChange={(e) => handleBillingConfigInputChange('due_date_day', e.target.value)}
                      onFocus={(e) => e.target.select()}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-orange-500"
                      min="1"
                      max="31"
                      disabled={loadingBillingConfig}
                    />
                    <p className="text-gray-500 text-xs mt-2">
                      Days after billing day for payment due date (0-31, 0 = same day)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Disconnection Day
                    </label>
                    <input
                      type="number"
                      value={billingConfigInput.disconnection_day}
                      onChange={(e) => handleBillingConfigInputChange('disconnection_day', e.target.value)}
                      onFocus={(e) => e.target.select()}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-orange-500"
                      min="1"
                      max="31"
                      disabled={loadingBillingConfig}
                    />
                    <p className="text-gray-500 text-xs mt-2">
                      Days after due date to disconnect service (0-31, 0 = disabled)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Overdue Day
                    </label>
                    <input
                      type="number"
                      value={billingConfigInput.overdue_day}
                      onChange={(e) => handleBillingConfigInputChange('overdue_day', e.target.value)}
                      onFocus={(e) => e.target.select()}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-orange-500"
                      min="1"
                      max="31"
                      disabled={loadingBillingConfig}
                    />
                    <p className="text-gray-500 text-xs mt-2">
                      Days after due date to mark as overdue (0-31, 0 = same day)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Disconnection Notice
                    </label>
                    <input
                      type="number"
                      value={billingConfigInput.disconnection_notice}
                      onChange={(e) => handleBillingConfigInputChange('disconnection_notice', e.target.value)}
                      onFocus={(e) => e.target.select()}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-orange-500"
                      min="1"
                      max="31"
                      disabled={loadingBillingConfig}
                    />
                    <p className="text-gray-500 text-xs mt-2">
                      Days before disconnection to send notice (0-31, 0 = disabled)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveBillingConfig}
                    disabled={loadingBillingConfig}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded transition-colors"
                  >
                    <Save size={18} />
                    <span>{billingConfig ? 'Update' : 'Create'}</span>
                  </button>
                  {billingConfig && (
                    <button
                      onClick={handleCancelBillingConfigEdit}
                      disabled={loadingBillingConfig}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded transition-colors"
                    >
                      <X size={18} />
                      <span>Cancel</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 pb-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-white">
              Test Billing Generation
            </h3>
          </div>
          
          <div className="space-y-4">
            <p className="text-gray-400 text-sm">
              Test the billing generation system by generating SOA and invoices for all active accounts. This will create new billing records for testing purposes.
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={handleTestGeneration}
                disabled={loadingBillingConfig}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10"></polyline>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                </svg>
                <span>Test Generate All Billings</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {modal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">{modal.title}</h3>
            <p className="text-gray-300 mb-6">{modal.message}</p>
            <div className="flex items-center justify-end gap-3">
              {modal.type === 'confirm' ? (
                <>
                  <button
                    onClick={modal.onCancel}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={modal.onConfirm}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded transition-colors"
                  >
                    Confirm
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setModal({ ...modal, isOpen: false })}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded transition-colors"
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

export default BillingConfig;
