import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, Eraser, Camera } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { settingsColorPaletteService, ColorPalette } from '../services/settingsColorPaletteService';
import { userService } from '../services/userService';
import { API_BASE_URL } from '../config/api';

interface AssignWorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  onRefresh?: () => void;
  isEditMode?: boolean;
  workOrder?: any;
}

interface User {
  email: string;
  name: string;
}

interface ModalConfig {
  isOpen: boolean;
  type: 'success' | 'error' | 'warning' | 'confirm' | 'loading';
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

const AssignWorkOrderModal: React.FC<AssignWorkOrderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onRefresh,
  isEditMode = false,
  workOrder
}) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [colorPalette, setColorPalette] = useState<ColorPalette | null>(null);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [assignees, setAssignees] = useState<User[]>([]);
  const [categories, setCategories] = useState<{ id: number, category: string }[]>([]);
  const [userRole, setUserRole] = useState<number | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');

  const sigCanvas = useRef<SignatureCanvas>(null);

  const [formData, setFormData] = useState({
    instructions: '',
    work_category: '',
    report_to: '',
    assign_to: '',
    remarks: '',
    work_status: 'Pending'
  });

  const [images, setImages] = useState({
    image_1: null as File | null,
    image_2: null as File | null,
    image_3: null as File | null,
    signature: null as File | null
  });

  const [imagePreviews, setImagePreviews] = useState({
    image_1: '',
    image_2: '',
    image_3: '',
    signature: ''
  });

  const [loading, setLoading] = useState(false);
  const [loadingPercentage, setLoadingPercentage] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [modal, setModal] = useState<ModalConfig>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  useEffect(() => {
    const theme = localStorage.getItem('theme');
    setIsDarkMode(theme !== 'light');

    const fetchPalette = async () => {
      const palette = await settingsColorPaletteService.getActive();
      setColorPalette(palette);
    };
    fetchPalette();

    const authData = localStorage.getItem('authData');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        setUserRole(parsed.role_id || parsed.roleId || null);
        setCurrentUserEmail(parsed.email_address || parsed.email || '');
      } catch (e) { }
    }
  }, []);

  useEffect(() => {
    const fetchTechnicians = async () => {
      if (!isOpen) return;
      try {
        const response = await userService.getUsersByRole('technician');
        if (response.success && response.data) {
          const list = response.data
            .map((user: any) => ({
              email: user.email_address || user.email || '',
              name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
            }))
            .filter((t: User) => t.name && t.email);
          setTechnicians(list);
        }
      } catch (error) {
        setTechnicians([]);
      }
      try {
        const response = await userService.getUsersByRoleId([1, 4, 5, 6]);
        if (response.success && response.data) {
          const list = response.data
            .map((user: any) => ({
              email: user.email_address || user.email || '',
              name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
            }))
            .filter((t: User) => t.name && t.email);
          setAssignees(list);
        }
      } catch (error) {
        setAssignees([]);
      }
    };
    const fetchCategories = async () => {
      if (!isOpen) return;
      try {
        const response = await fetch(`${API_BASE_URL}/work-categories`);
        const result = await response.json();
        if (result.success && result.data) {
          setCategories(result.data);
        }
      } catch (error) {
        setCategories([]);
      }
    };
    fetchTechnicians();
    fetchCategories();

    if (isOpen) {
      if (isEditMode && workOrder) {
        setFormData({
          instructions: workOrder.instructions || '',
          work_category: workOrder.work_category || '',
          report_to: workOrder.report_to || '',
          assign_to: workOrder.assign_to || '',
          remarks: workOrder.remarks || '',
          work_status: workOrder.work_status || 'Pending'
        });
      } else {
        setFormData({
          instructions: '',
          work_category: '',
          report_to: '',
          assign_to: '',
          remarks: '',
          work_status: 'Pending'
        });
      }
    }
  }, [isOpen, isEditMode, workOrder]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleImageUpload = (field: string, file: File) => {
    if (file) {
      setImages(prev => ({ ...prev, [field]: file }));
      setImagePreviews(prev => ({ ...prev, [field]: URL.createObjectURL(file) }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.instructions.trim()) newErrors.instructions = 'Instructions are required';
    if (!formData.work_category) newErrors.work_category = 'Work Category is required';
    if (!formData.report_to.trim()) newErrors.report_to = 'Report To is required';
    if (!formData.assign_to.trim()) newErrors.assign_to = 'Assign To is required';

    if (isEditMode) {
      // Images and signature are now optional
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

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

    try {
      const authData = localStorage.getItem('authData');
      const parsedUser = authData ? JSON.parse(authData) : null;
      const currentUserEmail = parsedUser ? (parsedUser.email_address || parsedUser.email || 'system') : 'system';

      let signatureFile = images.signature;

      // If no file but canvas has data, grab it
      if (!signatureFile && sigCanvas.current && !sigCanvas.current.isEmpty()) {
        const dataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
        const blob = await (await fetch(dataUrl)).blob();
        signatureFile = new File([blob], 'signature.png', { type: 'image/png' });
      }

      const submitData = new FormData();
      submitData.append('instructions', formData.instructions);
      submitData.append('work_category', formData.work_category);
      submitData.append('report_to', formData.report_to);
      submitData.append('assign_to', formData.assign_to);
      submitData.append('remarks', formData.remarks);
      submitData.append('requested_by', currentUserEmail);

      if ((userRole !== 1 && userRole !== 7) || isEditMode) {
        submitData.append('work_status', formData.work_status);
      } else {
        submitData.append('work_status', 'Pending');
      }

      if (images.image_1) submitData.append('image_1', images.image_1);
      if (images.image_2) submitData.append('image_2', images.image_2);
      if (images.image_3) submitData.append('image_3', images.image_3);
      if (signatureFile) submitData.append('signature', signatureFile);

      if (isEditMode && workOrder?.id) {
        submitData.append('_method', 'PUT');
      }

      const url = isEditMode && workOrder?.id
        ? `${API_BASE_URL}/work-orders/${workOrder.id}`
        : `${API_BASE_URL}/work-orders`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: submitData
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || Object.values(data.errors || {}).join(', ') || 'Failed to save');
      }

      clearInterval(progressInterval);
      setLoadingPercentage(100);

      setTimeout(() => {
        setModal({
          isOpen: true,
          type: 'success',
          title: 'Success',
          message: isEditMode ? 'Work Order updated successfully!' : 'Work Order created successfully!',
          onConfirm: () => {
            onSave();
            if (onRefresh) onRefresh();
            onClose();
            setModal(prev => ({ ...prev, isOpen: false }));
          }
        });
      }, 500);

    } catch (error: any) {
      clearInterval(progressInterval);
      setModal({
        isOpen: true,
        type: 'error',
        title: isEditMode ? 'Failed to Update Work Order' : 'Failed to Create Work Order',
        message: error.message || 'An error occurred'
      });
    } finally {
      setTimeout(() => {
        setLoading(false);
        setLoadingPercentage(0);
      }, 500);
    }
  };

  if (!isOpen) return null;

  const ImageUploadPreview = ({ field, label }: { field: 'image_1' | 'image_2' | 'image_3', label: string }) => (
    <div className="mb-4">
      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        {label}
      </label>
      <div className={`border-2 border-dashed rounded-lg p-4 text-center ${isDarkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-50'}`}>
        {imagePreviews[field] ? (
          <div className="relative">
            <img src={imagePreviews[field]} alt={label} className="max-h-48 mx-auto" />
            <button
              onClick={() => {
                setImagePreviews(prev => ({ ...prev, [field]: '' }));
                setImages(prev => ({ ...prev, [field]: null }));
              }}
              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <label className="cursor-pointer block">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
              if (e.target.files?.[0]) handleImageUpload(field, e.target.files[0]);
            }} />
            <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Click to upload image</span>
          </label>
        )}
      </div>
    </div>
  );

  return (
    <>
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-[10000] flex items-center justify-center">
          <div className={`rounded-lg p-8 flex flex-col items-center space-y-6 min-w-[320px] ${isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
            <Loader2
              className="w-20 h-20 animate-spin"
              style={{ color: colorPalette?.primary || '#7c3aed' }}
            />
            <div className="text-center">
              <p className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>{loadingPercentage}%</p>
            </div>
          </div>
        </div>
      )}

      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-end z-[5000]">
        <div className={`h-full w-full max-w-2xl flex flex-col shadow-2xl transition-transform ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
          <div className={`px-6 py-4 flex items-center justify-between border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Assign Work Order</h2>
            <div className="flex space-x-2">
              <button onClick={onClose} className={`px-4 py-2 rounded ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900'}`}>Cancel</button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 text-white rounded disabled:opacity-50"
                style={{ backgroundColor: colorPalette?.primary || '#7c3aed' }}
              >
                Save
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {(() => {
              const isAssignedToCurrentUser = Boolean(isEditMode && formData.assign_to && currentUserEmail && formData.assign_to.toLowerCase() === currentUserEmail.toLowerCase());
              const disabledClass = isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed opacity-70' : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed opacity-70';

              return (
                <>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Instructions<span className="text-red-500">*</span></label>
                    <textarea value={formData.instructions} onChange={(e) => handleInputChange('instructions', e.target.value)} rows={4} disabled={isAssignedToCurrentUser}
                      className={`w-full px-3 py-2 border rounded focus:outline-none resize-none ${errors.instructions ? 'border-red-500' : isAssignedToCurrentUser ? disabledClass : isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Work Category<span className="text-red-500">*</span></label>
                    <select value={formData.work_category} onChange={(e) => handleInputChange('work_category', e.target.value)} disabled={isAssignedToCurrentUser}
                      className={`w-full px-3 py-2 border rounded focus:outline-none ${errors.work_category ? 'border-red-500' : isAssignedToCurrentUser ? disabledClass : isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c.id} value={c.category}>{c.category}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Report To<span className="text-red-500">*</span></label>
                      <input type="text" value={formData.report_to} onChange={(e) => handleInputChange('report_to', e.target.value)} disabled={isAssignedToCurrentUser}
                        placeholder="Enter Report To"
                        className={`w-full px-3 py-2 border rounded focus:outline-none ${errors.report_to ? 'border-red-500' : isAssignedToCurrentUser ? disabledClass : isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Assign To<span className="text-red-500">*</span></label>
                      <select value={formData.assign_to} onChange={(e) => handleInputChange('assign_to', e.target.value)} disabled={isAssignedToCurrentUser}
                        className={`w-full px-3 py-2 border rounded focus:outline-none ${errors.assign_to ? 'border-red-500' : isAssignedToCurrentUser ? disabledClass : isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                        <option value="">Select Assigned User</option>
                        {assignees.map(t => <option key={t.email} value={t.email}>{t.email}</option>)}
                      </select>
                    </div>
                  </div>

                  {((userRole !== 1 && userRole !== 7) || isEditMode) && (
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Work Status</label>
                      <select value={formData.work_status} onChange={(e) => handleInputChange('work_status', e.target.value)}
                        className={`w-full px-3 py-2 border rounded focus:outline-none ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Failed">Failed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Remarks</label>
                    <textarea value={formData.remarks} onChange={(e) => handleInputChange('remarks', e.target.value)} rows={4}
                      className={`w-full px-3 py-2 border rounded focus:outline-none resize-none ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                  </div>

                  {isEditMode && (
                    <>
                      <ImageUploadPreview field="image_1" label="Image 1" />
                      <ImageUploadPreview field="image_2" label="Image 2" />
                      <ImageUploadPreview field="image_3" label="Image 3" />

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Client Signature
                        </label>
                        <div className={`border rounded overflow-hidden relative w-full h-48 bg-white`}>
                          {imagePreviews.signature ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <img src={imagePreviews.signature} alt="Signature Preview" className="max-h-full max-w-full" />
                              <button
                                onClick={() => {
                                  setImagePreviews(prev => ({ ...prev, signature: '' }));
                                  setImages(prev => ({ ...prev, signature: null }));
                                }}
                                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <>
                              <SignatureCanvas
                                ref={sigCanvas}
                                penColor="black"
                                onEnd={() => {
                                  if (errors.signature) setErrors(prev => ({ ...prev, signature: '' }));
                                }}
                                canvasProps={{ className: 'w-full h-full cursor-crosshair' }}
                              />
                              <div className="absolute top-2 right-2 flex space-x-2">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleImageUpload('signature', file);
                                  }}
                                  className="hidden"
                                  id="sigUploadInput"
                                />
                                <label
                                  htmlFor="sigUploadInput"
                                  className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow transition-colors cursor-pointer"
                                  title="Upload Image"
                                >
                                  <Camera size={16} />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    sigCanvas.current?.clear();
                                  }}
                                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 p-2 rounded-full shadow transition-colors"
                                  title="Clear Canvas"
                                >
                                  <Eraser size={16} />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                </>
              );
            })()}
          </div>
        </div>
      </div>

      {modal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[10000]">
          <div className={`border rounded-lg p-8 max-w-md w-full mx-4 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
            }`}>
            {modal.type === 'loading' ? (
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-4" style={{ borderColor: colorPalette?.primary || '#7c3aed' }}></div>
                </div>
                <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>{modal.title}</h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>{modal.message}</p>
              </div>
            ) : (
              <>
                <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>{modal.title}</h3>
                <p className={`mb-6 whitespace-pre-line ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>{modal.message}</p>
                <div className="flex items-center justify-end gap-3">
                  {modal.type === 'confirm' ? (
                    <>
                      <button
                        onClick={modal.onCancel}
                        className={`px-4 py-2 rounded transition-colors ${isDarkMode
                          ? 'bg-gray-700 hover:bg-gray-600 text-white'
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                          }`}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={modal.onConfirm}
                        className="px-4 py-2 text-white rounded transition-colors"
                        style={{
                          backgroundColor: colorPalette?.primary || '#7c3aed'
                        }}
                        onMouseEnter={(e) => {
                          if (colorPalette?.accent) {
                            e.currentTarget.style.backgroundColor = colorPalette.accent;
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = colorPalette?.primary || '#7c3aed';
                        }}
                      >
                        Confirm
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        if (modal.onConfirm) {
                          modal.onConfirm();
                        } else {
                          setModal(prev => ({ ...prev, isOpen: false }));
                        }
                      }}
                      className="px-4 py-2 text-white rounded transition-colors"
                      style={{
                        backgroundColor: colorPalette?.primary || '#7c3aed'
                      }}
                      onMouseEnter={(e) => {
                        if (colorPalette?.accent) {
                          e.currentTarget.style.backgroundColor = colorPalette.accent;
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = colorPalette?.primary || '#7c3aed';
                      }}
                    >
                      OK
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AssignWorkOrderModal;
