import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { WorkOrder, WorkOrderDetailsProps } from '../types/workOrder';
import { ColorPalette } from '../services/settingsColorPaletteService';
import AssignWorkOrderModal from '../modals/AssignWorkOrderModal';
interface SuccessModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
  isDarkMode: boolean;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, message, onClose, isDarkMode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className={`p-6 rounded-lg shadow-xl max-w-sm w-full mx-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Success!</h3>
          <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>{message}</p>
          <button
            onClick={onClose}
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none sm:text-sm"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

const WorkOrderDetails: React.FC<WorkOrderDetailsProps & { isDarkMode?: boolean; colorPalette?: ColorPalette | null }> = ({
  workOrder,
  onClose,
  isDarkMode = true,
  colorPalette
}) => {
  const [formData, setFormData] = useState<Partial<WorkOrder>>({
    instructions: '',
    report_to: '',
    assign_to: '',
    remarks: '',
    work_status: 'Pending'
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successModalConfig, setSuccessModalConfig] = useState({ isOpen: false, message: '' });
  const [userRole, setUserRole] = useState<number | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    const authData = localStorage.getItem('authData');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        setUserRole(parsed.role_id || parsed.roleId || null);
      } catch (e) { }
    }
  }, []);
  useEffect(() => {
    if (workOrder) {
      setFormData({
        instructions: workOrder.instructions || '',
        report_to: workOrder.report_to || '',
        assign_to: workOrder.assign_to || '',
        remarks: workOrder.remarks || '',
        work_status: workOrder.work_status || 'Pending'
      });
    }
  }, [workOrder]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.instructions?.trim()) newErrors.instructions = 'Instructions are required';
    if (!formData.report_to?.trim()) newErrors.report_to = 'Report To is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);

    try {
      const authData = localStorage.getItem('authData');
      const currentUserEmail = authData ? JSON.parse(authData)?.email : 'system';

      const payload = {
        ...formData,
        [workOrder ? 'updated_by' : 'requested_by']: currentUserEmail
      };

      const url = workOrder
        ? `${API_BASE_URL}/work-orders/${workOrder.id}`
        : `${API_BASE_URL}/work-orders`;

      const method = workOrder ? 'PUT' : 'POST';

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
        setSuccessModalConfig({
          isOpen: true,
          message: data.message || `Work order ${workOrder ? 'updated' : 'added'} successfully`
        });
      } else {
        if (data.errors) {
          const errorMessages = Object.values(data.errors).flat().join('\n');
          alert('Validation errors:\n' + errorMessages);
        } else {
          alert(data.message || `Failed to ${workOrder ? 'update' : 'add'} work order`);
        }
      }
    } catch (error: any) {
      alert(`Error saving work order: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessModalConfig({ isOpen: false, message: '' });
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-end z-50 p-4 sm:p-0" onClick={onClose}>
        <div
          className={`h-full w-full sm:w-3/4 md:w-full md:max-w-3xl shadow-2xl transform transition-transform duration-300 ease-in-out overflow-hidden flex flex-col ${isDarkMode ? 'bg-gray-900 border-l border-gray-800' : 'bg-white'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`px-6 py-4 flex items-center justify-between border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'}`}>
            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {workOrder ? 'Edit Work Order' : 'Add New Work Order'}
            </h2>
            <div className="flex items-center space-x-3">
              {workOrder && userRole !== 1 && userRole !== 7 && (
                <button
                  onClick={() => setShowAssignModal(true)}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${isDarkMode ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                >
                  Edit Location Details
                </button>
              )}
              <button
                onClick={onClose}
                className={`px-4 py-2 rounded text-sm font-medium ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-sm font-medium flex items-center"
                style={{ backgroundColor: colorPalette?.primary || '#ea580c' }}
              >
                {loading ? <><Loader2 className="animate-spin h-4 w-4 mr-2" /> Saving...</> : 'Save Order'}
              </button>
              <button onClick={onClose} className={isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}>
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Instructions / Brief Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${errors.instructions ? 'border-red-500' : isDarkMode ? 'border-gray-700' : 'border-gray-300'} ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
                  placeholder="Enter detailed instructions here..."
                />
                {errors.instructions && <p className="text-red-500 text-xs mt-1">{errors.instructions}</p>}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Report To <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.report_to}
                  onChange={(e) => setFormData({ ...formData, report_to: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${errors.report_to ? 'border-red-500' : isDarkMode ? 'border-gray-700' : 'border-gray-300'} ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
                  placeholder="e.g. John Doe"
                />
                {errors.report_to && <p className="text-red-500 text-xs mt-1">{errors.report_to}</p>}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Assign To
                </label>
                <input
                  type="text"
                  value={formData.assign_to}
                  onChange={(e) => setFormData({ ...formData, assign_to: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${isDarkMode ? 'border-gray-700' : 'border-gray-300'} ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
                  placeholder="e.g. Jane Smith"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Status
                </label>
                <select
                  value={formData.work_status}
                  onChange={(e) => setFormData({ ...formData, work_status: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${isDarkMode ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Failed">Failed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Internal Remarks
                </label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  rows={2}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${isDarkMode ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
                  placeholder="Additional context or notes if any..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <SuccessModal
        isOpen={successModalConfig.isOpen}
        message={successModalConfig.message}
        onClose={handleSuccessClose}
        isDarkMode={isDarkMode}
      />

      {showAssignModal && (
        <AssignWorkOrderModal
          isOpen={showAssignModal}
          isEditMode={true}
          workOrder={workOrder}
          onClose={() => setShowAssignModal(false)}
          onSave={() => {
            setShowAssignModal(false);
            onClose();
          }}
          onRefresh={() => {
            setShowAssignModal(false);
            onClose();
          }}
        />
      )}
    </>
  );
};

export default WorkOrderDetails;
