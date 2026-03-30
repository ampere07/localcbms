import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, Eraser, Camera, Search, ChevronDown, ClipboardCheck, UserPlus, Info } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { settingsColorPaletteService, ColorPalette } from '../services/settingsColorPaletteService';
import { userService } from '../services/userService';
import { API_BASE_URL } from '../config/api';
import LoadingModalGlobal from '../components/LoadingModalGlobal';

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

  const [globalModal, setGlobalModal] = useState<{
    isOpen: boolean;
    type: 'loading' | 'success' | 'error' | 'confirm' | 'warning';
    title: string;
    message: string;
    percentage?: number;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: 'loading',
    title: '',
    message: ''
  });

  const [assignToSearch, setAssignToSearch] = useState('');
  const [isAssignToOpen, setIsAssignToOpen] = useState(false);

  const showGlobalModal = (
    type: 'loading' | 'success' | 'error' | 'confirm' | 'warning', 
    title: string, 
    message: string,
    onConfirm?: () => void,
    percentage?: number
  ) => {
    setGlobalModal({
      isOpen: true,
      type,
      title,
      message,
      onConfirm,
      percentage
    });
  };

  const closeGlobalModal = () => {
    setGlobalModal(prev => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(localStorage.getItem('theme') !== 'light');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    setIsDarkMode(localStorage.getItem('theme') !== 'light');
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
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
        const response = await userService.getUsersByRoleId([1, 2, 4, 5, 6, 7]);
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

    const convertGDriveUrl = (url?: string | null): string => {
      if (!url) return '';
      if (typeof url !== 'string') return '';
      if (url.includes('drive.google.com/file/d/')) {
        const parts = url.split('/d/');
        if (parts.length > 1) {
          const fileId = parts[1].split('/')[0];
          return `https://drive.google.com/uc?export=view&id=${fileId}`;
        }
      }
      return url;
    };

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
        setImagePreviews({
          image_1: convertGDriveUrl(workOrder.image_1),
          image_2: convertGDriveUrl(workOrder.image_2),
          image_3: convertGDriveUrl(workOrder.image_3),
          signature: convertGDriveUrl(workOrder.signature)
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
        setImagePreviews({
          image_1: '',
          image_2: '',
          image_3: '',
          signature: ''
        });
      }
      setAssignToSearch('');
      setIsAssignToOpen(false);
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
    if (!formData.instructions.trim()) newErrors.instructions = 'Tactical instructions required';
    if (!formData.work_category) newErrors.work_category = 'Classification required';
    if (!formData.report_to.trim()) newErrors.report_to = 'Report point required';
    if (!formData.assign_to.trim()) newErrors.assign_to = 'Assignee selection required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      showGlobalModal('warning', 'Validation Fail', 'Please complete all prioritized operational fields.');
      return;
    }

    setLoading(true);
    showGlobalModal('loading', 'Unit Synchronization', isEditMode ? 'Updating logistical record...' : 'Establishing new work mission...', undefined, 15);

    const progressInterval = setInterval(() => {
      setLoadingPercentage(prev => {
        if (prev >= 95) return 95;
        return prev + 5;
      });
    }, 200);

    try {
      const authData = localStorage.getItem('authData');
      const parsedUser = authData ? JSON.parse(authData) : null;
      const currentUserEmail = parsedUser ? (parsedUser.email_address || parsedUser.email || 'system') : 'system';

      let signatureFile = images.signature;

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
        throw new Error(data.message || Object.values(data.errors || {}).join(', ') || 'Failed to finalize mission');
      }

      clearInterval(progressInterval);
      showGlobalModal('success', 'Execution Priority Alpha', isEditMode ? 'Work order reconfiguration finalized.' : 'New mission entry successfully established.', () => {
        onSave();
        if (onRefresh) onRefresh();
        onClose();
        closeGlobalModal();
      });

    } catch (error: any) {
      clearInterval(progressInterval);
      showGlobalModal('error', 'Operational Disruption', error.message || 'Verification failure during mission entry.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  const ImageUploadPreview = ({ field, label }: { field: 'image_1' | 'image_2' | 'image_3', label: string }) => (
    <div className="space-y-3">
      <label className={`block text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
        {label}
      </label>
      <div className={`relative border-3 border-dashed rounded-[2rem] p-6 text-center transition-all duration-300 group ${isDarkMode ? 'border-gray-800 hover:border-blue-500/30 hover:bg-white/[0.02]' : 'border-gray-100 hover:border-blue-600/30 hover:bg-gray-50 shadow-sm'}`}>
        {imagePreviews[field] ? (
          <div className="relative overflow-hidden rounded-2xl shadow-2xl">
            <img src={imagePreviews[field]} alt={label} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                onClick={() => {
                  setImagePreviews(prev => ({ ...prev, [field]: '' }));
                  setImages(prev => ({ ...prev, [field]: null }));
                }}
                className="bg-red-500 text-white p-3 rounded-full hover:scale-110 active:scale-90 transition-all shadow-xl"
              >
                <Eraser size={20} />
              </button>
            </div>
          </div>
        ) : (
          <label className="cursor-pointer block py-8">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
              if (e.target.files?.[0]) handleImageUpload(field, e.target.files[0]);
            }} />
            <div className="flex flex-col items-center gap-3">
               <div className={`p-4 rounded-3xl ${isDarkMode ? 'bg-gray-800 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                <Camera size={32} strokeWidth={2.5} />
               </div>
               <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-gray-400/60' : 'text-gray-500/60'}`}>Initiate Signal Capture</span>
            </div>
          </label>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-md flex justify-end z-[5000]" onClick={handleClose}>
        <div 
          className={`h-full w-full md:max-w-3xl flex flex-col shadow-4xl transform transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isDarkMode ? 'bg-gray-950 border-l border-white/5' : 'bg-white border-l border-gray-200'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Action Header */}
          <div className={`px-10 py-10 flex items-center justify-between border-b relative overflow-hidden ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200 shadow-sm'}`}>
             <div className="flex flex-col">
                <div className={`p-3 rounded-2xl w-fit mb-4 ${isDarkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                   <ClipboardCheck size={32} strokeWidth={2.5} />
                </div>
                <h2 className={`text-3xl font-black italic tracking-tighter ${isDarkMode ? 'text-white' : 'text-gray-950'}`}>
                  {isEditMode ? 'REALIGN MISSION' : 'ASSIGN WORK PRIORITY'}
                </h2>
                <div className="flex items-center gap-2 mt-1.5 opacity-50 uppercase text-[10px] font-black tracking-[0.2em]">
                   <span className={isDarkMode ? 'text-blue-400' : 'text-blue-600'}>Operational Vector Alpha</span>
                   <span className={isDarkMode ? 'text-gray-700' : 'text-gray-300'}>|</span>
                   <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Logistical Command System</span>
                </div>
             </div>
             
             <div className="flex items-center gap-4">
                <button
                  onClick={handleClose}
                  className={`p-3 rounded-full transition-all active:scale-90 ${isDarkMode ? 'hover:bg-gray-800 text-gray-500' : 'hover:bg-gray-100 text-gray-400'}`}
                >
                  <X size={32} strokeWidth={3} />
                </button>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
            {(() => {
              const isAssignedToCurrentUser = Boolean(isEditMode && formData.assign_to && currentUserEmail && formData.assign_to.toLowerCase() === currentUserEmail.toLowerCase());
              
              return (
                <div className="space-y-12">
                  {/* Status Indicator for Edit Mode */}
                  {((userRole !== 1 && userRole !== 7) || isEditMode) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="group">
                          <label className={`block text-[10px] font-black uppercase tracking-[0.2em] mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>Current Mission State</label>
                          <div className="relative">
                            <select 
                              value={formData.work_status} 
                              onChange={(e) => handleInputChange('work_status', e.target.value)}
                              className={`w-full px-6 py-4 rounded-[2rem] border-2 appearance-none transition-all duration-300 focus:outline-none focus:ring-8 font-black uppercase tracking-widest text-xs ${isDarkMode 
                                ? 'bg-gray-900 border-gray-800 text-white focus:border-blue-500/50 focus:ring-blue-500/5' 
                                : 'bg-white border-gray-100 text-gray-950 focus:border-blue-600/50 focus:ring-blue-600/5 shadow-xl shadow-blue-100/10'}`}
                            >
                              <option value="Pending">PENDING DISPATCH</option>
                              <option value="In Progress">ACTIVE DEPLOYMENT</option>
                              <option value="Completed">MISSION COMPLETE</option>
                              <option value="Failed">SYSTEM FAILURE</option>
                              <option value="Cancelled">ABORTED OPERATION</option>
                            </select>
                            <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 opacity-30" size={20} />
                          </div>
                       </div>
                       <div className="group">
                          <label className={`block text-[10px] font-black uppercase tracking-[0.2em] mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>Work Domain Taxonomy</label>
                          <div className="relative">
                            <select 
                              value={formData.work_category} 
                              onChange={(e) => handleInputChange('work_category', e.target.value)} 
                              disabled={isAssignedToCurrentUser}
                              className={`w-full px-6 py-4 rounded-[2rem] border-2 appearance-none transition-all duration-300 focus:outline-none focus:ring-8 font-black uppercase tracking-widest text-xs ${errors.work_category ? 'border-red-500' : ''} ${isAssignedToCurrentUser ? 'opacity-50 cursor-not-allowed' : ''} ${isDarkMode 
                                ? 'bg-gray-900 border-gray-800 text-white focus:border-blue-500/50 focus:ring-blue-500/5' 
                                : 'bg-white border-gray-100 text-gray-950 focus:border-blue-600/50 focus:ring-blue-600/5 shadow-xl shadow-blue-100/10'}`}
                            >
                              <option value="">UNCATEGORIZED SECTOR</option>
                              {categories.map(c => <option key={c.id} value={c.category}>{c.category.toUpperCase()}</option>)}
                            </select>
                            <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 opacity-30" size={20} />
                          </div>
                          {errors.work_category && <p className="mt-2 text-red-500 text-[9px] font-black uppercase tracking-widest">{errors.work_category}</p>}
                       </div>
                    </div>
                  )}

                  <div className="group">
                    <label className={`block text-[10px] font-black uppercase tracking-[0.2em] mb-4 transition-colors ${isDarkMode ? 'text-gray-600 group-focus-within:text-blue-400' : 'text-gray-400 group-focus-within:text-blue-600'}`}>Tactical Instructions<span className="text-red-500 ml-2">*</span></label>
                    <textarea 
                      value={formData.instructions} 
                      onChange={(e) => handleInputChange('instructions', e.target.value)} 
                      rows={4} 
                      disabled={isAssignedToCurrentUser}
                      style={{ fontSize: '1.25rem' }}
                      className={`w-full px-8 py-6 rounded-[2.5rem] border-2 transition-all duration-500 focus:outline-none focus:ring-[1rem] font-bold tracking-tight resize-none ${errors.instructions ? 'border-red-500' : isAssignedToCurrentUser ? 'opacity-50' : (isDarkMode ? 'bg-gray-900 border-gray-800 text-white focus:border-blue-500/50 focus:ring-blue-500/5' : 'bg-white border-gray-100 text-gray-950 focus:border-blue-600/50 focus:ring-blue-600/5 shadow-2xl shadow-blue-100/20')}`} 
                      placeholder="ENTER SPECIFIC ACTION STEPS..." 
                    />
                    {errors.instructions && <p className="mt-2 text-red-500 text-[9px] font-black uppercase tracking-widest">{errors.instructions}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="group">
                      <label className={`block text-[10px] font-black uppercase tracking-[0.2em] mb-4 ${isDarkMode ? 'text-gray-600 group-focus-within:text-blue-400' : 'text-gray-400 group-focus-within:text-blue-600'}`}>Report Vector Point<span className="text-red-500 ml-2">*</span></label>
                      <input 
                        type="text" 
                        value={formData.report_to} 
                        onChange={(e) => handleInputChange('report_to', e.target.value)} 
                        disabled={isAssignedToCurrentUser}
                        className={`w-full px-8 py-5 rounded-[2rem] border-2 transition-all duration-300 focus:outline-none focus:ring-8 font-bold ${errors.report_to ? 'border-red-500' : (isDarkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-100 text-gray-950')}`} 
                        placeholder="Location/Unit Code"
                      />
                      {errors.report_to && <p className="mt-2 text-red-500 text-[9px] font-black uppercase tracking-widest">{errors.report_to}</p>}
                    </div>

                    <div className="group">
                      <label className={`block text-[10px] font-black uppercase tracking-[0.2em] mb-4 ${isDarkMode ? 'text-gray-600 group-focus-within:text-blue-400' : 'text-gray-400 group-focus-within:text-blue-600'}`}>Operational Assignee<span className="text-red-500 ml-2">*</span></label>
                      <div className="relative">
                        <div className={`flex items-center px-6 py-4 rounded-[2rem] border-2 transition-all duration-300 focus-within:ring-8 ${isAssignedToCurrentUser ? 'opacity-50' : (isDarkMode ? 'bg-gray-900 border-gray-800 group-focus-within:border-blue-500/50 group-focus-within:ring-blue-500/5' : 'bg-white border-gray-100 group-focus-within:border-blue-600/50 group-focus-within:ring-blue-600/5')}`}>
                           <UserPlus size={20} className="mr-3 opacity-30" />
                           <input
                            type="text"
                            placeholder="Search Authorized Personnel..."
                            value={isAssignToOpen ? assignToSearch : (assignees.find(a => a.email === formData.assign_to)?.name || formData.assign_to || assignToSearch)}
                            onChange={(e) => {
                              setAssignToSearch(e.target.value);
                              if (!isAssignToOpen) setIsAssignToOpen(true);
                            }}
                            onFocus={() => !isAssignedToCurrentUser && setIsAssignToOpen(true)}
                            disabled={isAssignedToCurrentUser}
                            className={`w-full bg-transparent border-none focus:outline-none p-0 text-sm font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-gray-950'}`}
                          />
                          {!isAssignedToCurrentUser && (
                            <button
                              type="button"
                              onClick={() => {
                                if (isAssignToOpen) {
                                  setIsAssignToOpen(false);
                                  setAssignToSearch('');
                                } else {
                                  handleInputChange('assign_to', '');
                                  setAssignToSearch('');
                                }
                              }}
                              className="ml-2"
                            >
                               {isAssignToOpen || formData.assign_to ? <Eraser size={18} className="opacity-40" /> : <ChevronDown size={18} className="opacity-40" />}
                            </button>
                          )}
                        </div>

                        {isAssignToOpen && !isAssignedToCurrentUser && (
                          <div className={`absolute left-0 right-0 top-full mt-3 z-[6000] rounded-3xl shadow-[0_30px_100px_-20px_rgba(0,0,0,0.5)] border-2 overflow-hidden flex flex-col ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                            <div className="max-h-80 overflow-y-auto custom-scrollbar p-2">
                              {assignees
                                .filter(a => a.name.toLowerCase().includes(assignToSearch.toLowerCase()) || a.email.toLowerCase().includes(assignToSearch.toLowerCase()))
                                .map((assignee) => (
                                  <div
                                    key={assignee.email}
                                    className={`px-5 py-4 rounded-2xl cursor-pointer transition-all flex flex-col gap-1 mb-1 ${isDarkMode ? 'hover:bg-blue-500/10' : 'hover:bg-blue-50'} ${formData.assign_to === assignee.email ? (isDarkMode ? 'bg-blue-500/20 shadow-inner' : 'bg-blue-50/50') : ''}`}
                                    onClick={() => {
                                      handleInputChange('assign_to', assignee.email);
                                      setAssignToSearch('');
                                      setIsAssignToOpen(false);
                                    }}
                                  >
                                    <span className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-gray-950'}`}>{assignee.name}</span>
                                    <span className={`text-[10px] font-bold opacity-40 italic ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{assignee.email}</span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                      {errors.assign_to && <p className="mt-2 text-red-500 text-[9px] font-black uppercase tracking-widest">{errors.assign_to}</p>}
                    </div>
                  </div>

                  <div className="group">
                    <label className={`block text-[10px] font-black uppercase tracking-[0.2em] mb-4 ${isDarkMode ? 'text-gray-600 group-focus-within:text-blue-400' : 'text-gray-400 group-focus-within:text-blue-600'}`}>Mission Narrative / Remarks</label>
                    <textarea 
                      value={formData.remarks} 
                      onChange={(e) => handleInputChange('remarks', e.target.value)} 
                      rows={4}
                      className={`w-full px-8 py-6 rounded-[2.5rem] border-2 transition-all duration-500 focus:outline-none focus:ring-[1rem] font-medium resize-none ${isDarkMode ? 'bg-gray-900 border-gray-800 text-white focus:border-blue-500/50 focus:ring-blue-500/5' : 'bg-white border-gray-100 text-gray-950 focus:border-blue-600/50 focus:ring-blue-600/5 shadow-2xl shadow-blue-100/10'}`} 
                      placeholder="ADDITIONAL SYSTEM DEBRIES / OBSERVATIONS..." 
                    />
                  </div>

                  {isEditMode && (
                    <div className="space-y-12">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <ImageUploadPreview field="image_1" label="Primary Evidence" />
                        <ImageUploadPreview field="image_2" label="Secondary Proof" />
                        <ImageUploadPreview field="image_3" label="Site Validation" />
                      </div>

                      <div className="space-y-4">
                        <label className={`block text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          Authorized Personnel Signature
                        </label>
                        <div className={`border-3 rounded-[3rem] overflow-hidden relative w-full h-72 group transition-all duration-500 ${isDarkMode ? 'bg-white border-gray-800' : 'bg-gray-50 border-gray-200 shadow-inner'}`}>
                          {imagePreviews.signature ? (
                            <div className="absolute inset-0 flex items-center justify-center p-10">
                              <img src={imagePreviews.signature} alt="Signature Preview" className="max-h-full max-w-full drop-shadow-2xl" />
                              <button
                                onClick={() => {
                                  setImagePreviews(prev => ({ ...prev, signature: '' }));
                                  setImages(prev => ({ ...prev, signature: null }));
                                }}
                                className="absolute top-6 right-6 bg-red-500 text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-90 transition-all border-4 border-white/20"
                              >
                                <Eraser size={24} />
                              </button>
                            </div>
                          ) : (
                            <>
                              <SignatureCanvas
                                ref={sigCanvas}
                                penColor="black"
                                dotSize={1}
                                minWidth={2}
                                onEnd={() => { if (errors.signature) setErrors(prev => ({ ...prev, signature: '' })); }}
                                canvasProps={{ className: 'w-full h-full cursor-crosshair' }}
                              />
                              <div className="absolute top-6 right-6 flex gap-3">
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
                                  className={`p-3 rounded-2xl shadow-xl transition-all cursor-pointer hover:scale-110 active:scale-90 ${isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`}
                                >
                                  <Camera size={20} strokeWidth={2.5} />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => sigCanvas.current?.clear()}
                                  className={`p-3 rounded-2xl shadow-xl transition-all hover:scale-110 active:scale-90 ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-600 border'}`}
                                >
                                  <Eraser size={20} strokeWidth={2.5} />
                                </button>
                              </div>
                              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-20 pointer-events-none">
                                 <div className="h-px w-8 bg-black"></div>
                                 <span className="text-[10px] font-black uppercase tracking-widest text-black">Sign Within Boundary</span>
                                 <div className="h-px w-8 bg-black"></div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className={`p-8 rounded-[3rem] border-2 flex flex-col gap-6 shadow-sm ${isDarkMode ? 'bg-blue-500/[0.02] border-blue-500/10' : 'bg-blue-50/50 border-blue-100'}`}>
                    <div className="flex items-center gap-4">
                       <div className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                          <Info size={20} strokeWidth={3} />
                       </div>
                       <h4 className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-blue-400' : 'text-blue-900'}`}>Protocol Directive</h4>
                    </div>
                    <p className={`text-[11px] font-bold leading-relaxed opacity-70 italic ${isDarkMode ? 'text-blue-300/60' : 'text-blue-700/80'}`}>
                      "Assigned personnel must adhere to the tactical instructions provided. Site evidence and signatures are mandatory for mission completion validation. All logistical shifts are logged for historical audit integrity."
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Action Interface Footer */}
          <div className={`p-10 border-t flex flex-col gap-4 ${isDarkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-gray-50/80 border-gray-200'}`}>
             <button
                onClick={handleSave}
                disabled={loading}
                className="w-full px-12 py-6 disabled:opacity-50 text-white rounded-[2.5rem] font-black text-sm uppercase tracking-[0.4em] flex items-center justify-center shadow-4xl active:scale-[0.98] transition-all duration-300"
                style={{ 
                  backgroundColor: colorPalette?.primary || '#3b82f6',
                  boxShadow: `0 25px 60px -15px ${isDarkMode ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.2)'}`
                }}
                onMouseEnter={(e) => { if (colorPalette?.accent && !loading) e.currentTarget.style.backgroundColor = colorPalette.accent; }}
                onMouseLeave={(e) => { if (colorPalette?.primary) e.currentTarget.style.backgroundColor = colorPalette.primary; }}
              >
                {loading ? <div className="flex items-center gap-4"><Loader2 size={24} className="animate-spin" /><span>Syncing Logic...</span></div> : 'Commence Mission'}
              </button>
              
              <button
                onClick={handleClose}
                className={`w-full py-4 rounded-full font-black text-[9px] uppercase tracking-[0.6em] transition-all duration-300 active:scale-95 ${isDarkMode ? 'text-gray-600 hover:text-white' : 'text-gray-400 hover:text-gray-950'}`}
              >
                Abort Classification
              </button>
          </div>
        </div>
      </div>

      <LoadingModalGlobal
        isOpen={globalModal.isOpen}
        type={globalModal.type}
        title={globalModal.title}
        message={globalModal.message}
        loadingPercentage={globalModal.percentage}
        onConfirm={globalModal.onConfirm || closeGlobalModal}
        onCancel={closeGlobalModal}
        colorPalette={colorPalette}
        isDarkMode={isDarkMode}
      />
    </>
  );
};

export default AssignWorkOrderModal;
