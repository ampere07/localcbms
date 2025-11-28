import React, { useState, useEffect } from 'react';
import { X, Calendar, ChevronDown, Minus, Plus } from 'lucide-react';
import { UserData } from '../types/api';
import apiClient from '../config/api';

interface ServiceOrderEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: any) => void;
  serviceOrderData?: any;
}

interface ModalConfig {
  isOpen: boolean;
  type: 'success' | 'error' | 'warning' | 'confirm' | 'loading';
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface ServiceOrderEditFormData {
  accountNo: string;
  dateInstalled: string;
  fullName: string;
  contactNumber: string;
  emailAddress: string;
  plan: string;
  affiliate: string;
  username: string;
  connectionType: string;
  routerModemSN: string;
  lcp: string;
  nap: string;
  port: string;
  vlan: string;
  supportStatus: string;
  visitStatus: string;
  repairCategory: string;
  visitBy: string;
  visitWith: string;
  visitWithOther: string;
  visitRemarks: string;
  clientSignature: string;
  itemName1: string;
  timeIn: string;
  modemSetupImage: string;
  timeOut: string;
  assignedEmail: string;
  concern: string;
  concernRemarks: string;
  modifiedBy: string;
  modifiedDate: string;
  userEmail: string;
  supportRemarks: string;
  serviceCharge: string;
}

interface ImageFiles {
  timeInFile: File | null;
  modemSetupFile: File | null;
  timeOutFile: File | null;
  clientSignatureFile: File | null;
}

const ServiceOrderEditModal: React.FC<ServiceOrderEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  serviceOrderData
}) => {
  const getCurrentUser = (): UserData | null => {
    try {
      const authData = localStorage.getItem('authData');
      if (authData) {
        return JSON.parse(authData);
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
    return null;
  };

  const currentUser = getCurrentUser();
  const currentUserEmail = currentUser?.email || 'unknown@ampere.com';

  const [technicians, setTechnicians] = useState<UserData[]>([]);

  const [formData, setFormData] = useState<ServiceOrderEditFormData>({
    accountNo: '',
    dateInstalled: '',
    fullName: '',
    contactNumber: '',
    emailAddress: '',
    plan: '',
    affiliate: '',
    username: '',
    connectionType: '',
    routerModemSN: '',
    lcp: '',
    nap: '',
    port: '',
    vlan: '',
    supportStatus: 'In Progress',
    visitStatus: '',
    repairCategory: '',
    visitBy: '',
    visitWith: '',
    visitWithOther: '',
    visitRemarks: '',
    clientSignature: '',
    itemName1: '',
    timeIn: '',
    modemSetupImage: '',
    timeOut: '',
    assignedEmail: '',
    concern: '',
    concernRemarks: '',
    modifiedBy: currentUserEmail,
    modifiedDate: new Date().toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }),
    userEmail: currentUserEmail,
    supportRemarks: '',
    serviceCharge: '0.00'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState<ImageFiles>({
    timeInFile: null,
    modemSetupFile: null,
    timeOutFile: null,
    clientSignatureFile: null
  });
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imagePreviews, setImagePreviews] = useState<{
    timeInFile: string | null;
    modemSetupFile: string | null;
    timeOutFile: string | null;
    clientSignatureFile: string | null;
  }>({
    timeInFile: null,
    modemSetupFile: null,
    timeOutFile: null,
    clientSignatureFile: null
  });
  
  const [modal, setModal] = useState<ModalConfig>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  const formatDateForInput = (dateStr?: string): string => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (e) {
      return '';
    }
  };

  useEffect(() => {
    if (!isOpen) {
      Object.values(imagePreviews).forEach(url => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      setImagePreviews({
        timeInFile: null,
        modemSetupFile: null,
        timeOutFile: null,
        clientSignatureFile: null
      });
    }
  }, [isOpen, imagePreviews]);

  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        const response = await apiClient.get<{ success: boolean; data: UserData[] }>('/users');
        if (response.data.success && Array.isArray(response.data.data)) {
          const technicianUsers = response.data.data.filter(user => {
            const role = typeof user.role === 'string' ? user.role : (user.role as any)?.role_name || '';
            return role.toLowerCase() === 'technician';
          });
          console.log('Fetched technicians:', technicianUsers);
          setTechnicians(technicianUsers);
        }
      } catch (error) {
        console.error('Error fetching technicians:', error);
      }
    };
    
    if (isOpen) {
      fetchTechnicians();
    }
  }, [isOpen]);

  useEffect(() => {
    if (serviceOrderData && isOpen) {
      console.log('ServiceOrderEditModal - Received data:', serviceOrderData);
      console.log('Date Installed (dateInstalled):', serviceOrderData.dateInstalled);
      console.log('Date Installed (date_installed):', serviceOrderData.date_installed);
      
      setFormData(prev => ({
        ...prev,
        accountNo: serviceOrderData.accountNumber || serviceOrderData.account_no || '',
        dateInstalled: formatDateForInput(serviceOrderData.dateInstalled || serviceOrderData.date_installed),
        fullName: serviceOrderData.fullName || serviceOrderData.full_name || '',
        contactNumber: serviceOrderData.contactNumber || serviceOrderData.contact_number || '',
        emailAddress: serviceOrderData.emailAddress || serviceOrderData.email_address || '',
        plan: serviceOrderData.plan || '',
        affiliate: serviceOrderData.affiliate || serviceOrderData.group_name || '',
        username: serviceOrderData.username || '',
        connectionType: serviceOrderData.connectionType || serviceOrderData.connection_type || '',
        routerModemSN: serviceOrderData.routerModemSN || serviceOrderData.router_modem_sn || '',
        lcp: serviceOrderData.lcp || '',
        nap: serviceOrderData.nap || '',
        port: serviceOrderData.port || '',
        vlan: serviceOrderData.vlan || '',
        supportStatus: serviceOrderData.supportStatus || serviceOrderData.support_status || 'In Progress',
        visitStatus: serviceOrderData.visitStatus || serviceOrderData.visit_status || '',
        repairCategory: serviceOrderData.repairCategory || serviceOrderData.repair_category || '',
        visitBy: serviceOrderData.visitBy || serviceOrderData.visit_by || '',
        visitWith: serviceOrderData.visitWith || serviceOrderData.visit_with || '',
        visitWithOther: serviceOrderData.visitWithOther || serviceOrderData.visit_with_other || '',
        visitRemarks: serviceOrderData.visitRemarks || serviceOrderData.visit_remarks || '',
        clientSignature: serviceOrderData.clientSignature || serviceOrderData.client_signature || '',
        itemName1: serviceOrderData.itemName1 || serviceOrderData.item_name_1 || '',
        timeIn: serviceOrderData.timeIn || serviceOrderData.time_in || '',
        modemSetupImage: serviceOrderData.modemSetupImage || serviceOrderData.modem_setup_image || '',
        timeOut: serviceOrderData.timeOut || serviceOrderData.time_out || '',
        assignedEmail: serviceOrderData.assignedEmail || serviceOrderData.assigned_email || '',
        concern: serviceOrderData.concern || '',
        concernRemarks: serviceOrderData.concernRemarks || serviceOrderData.concern_remarks || '',
        userEmail: serviceOrderData.userEmail || serviceOrderData.assignedEmail || serviceOrderData.assigned_email || currentUserEmail,
        supportRemarks: serviceOrderData.supportRemarks || serviceOrderData.support_remarks || '',
        serviceCharge: serviceOrderData.serviceCharge ? serviceOrderData.serviceCharge.toString().replace('₱', '').trim() : (serviceOrderData.service_charge ? serviceOrderData.service_charge.toString().replace('₱', '').trim() : '0.00')
      }));
    }
  }, [serviceOrderData, isOpen, currentUserEmail]);

  const handleInputChange = (field: keyof ServiceOrderEditFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageChange = (field: keyof ImageFiles, file: File | null) => {
    setImageFiles(prev => ({ ...prev, [field]: file }));
    
    if (file) {
      if (imagePreviews[field] && imagePreviews[field]?.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviews[field]!);
      }
      
      const previewUrl = URL.createObjectURL(file);
      setImagePreviews(prev => ({ ...prev, [field]: previewUrl }));
      
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
      }
    }
  };

  const uploadImageToGoogleDrive = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post<{ success: boolean; data: { url: string }; message?: string }>(
        '/google-drive/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (!response.data.success || !response.data.data?.url) {
        throw new Error(response.data.message || 'Upload failed');
      }

      return response.data.data.url;
    } catch (error: any) {
      console.error('Error uploading to Google Drive:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to upload image');
    }
  };

  const uploadAllImages = async (): Promise<{ image1_url: string; image2_url: string; image3_url: string; client_signature_url: string }> => {
    const urls = { image1_url: '', image2_url: '', image3_url: '', client_signature_url: '' };
    const filesToUpload = [
      { file: imageFiles.clientSignatureFile, key: 'client_signature_url' },
      { file: imageFiles.timeInFile, key: 'image1_url' },
      { file: imageFiles.modemSetupFile, key: 'image2_url' },
      { file: imageFiles.timeOutFile, key: 'image3_url' }
    ].filter(item => item.file !== null);

    const totalFiles = filesToUpload.length;
    if (totalFiles === 0) {
      setUploadProgress(100);
      return urls;
    }

    for (let i = 0; i < filesToUpload.length; i++) {
      const { file, key } = filesToUpload[i];
      if (file) {
        const url = await uploadImageToGoogleDrive(file);
        urls[key as keyof typeof urls] = url;
        setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
      }
    }

    return urls;
  };

  const handleNumberChange = (field: 'serviceCharge', increment: boolean) => {
    setFormData(prev => {
      const currentValue = parseFloat(prev[field]) || 0;
      const newValue = increment ? currentValue + 1 : Math.max(0, currentValue - 1);
      return {
        ...prev,
        [field]: newValue.toFixed(2)
      };
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.accountNo.trim()) newErrors.accountNo = 'Account No is required';
    if (!formData.fullName.trim()) newErrors.fullName = 'Full Name is required';
    if (!formData.contactNumber.trim()) newErrors.contactNumber = 'Contact Number is required';
    
    if (!formData.emailAddress.trim()) {
      newErrors.emailAddress = 'Email Address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailAddress.trim())) {
      newErrors.emailAddress = 'Please enter a valid email address';
    }
    
    if (!formData.plan.trim()) newErrors.plan = 'Plan is required';
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.connectionType.trim()) newErrors.connectionType = 'Connection Type is required';
    if (!formData.supportStatus.trim()) newErrors.supportStatus = 'Support Status is required';
    if (!formData.concern.trim()) newErrors.concern = 'Concern is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    const updatedFormData = {
      ...formData,
      modifiedBy: currentUserEmail,
      modifiedDate: new Date().toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      })
    };
    
    setFormData(updatedFormData);
    
    if (!validateForm()) {
      setModal({
        isOpen: true,
        type: 'warning',
        title: 'Validation Error',
        message: 'Please fill in all required fields before saving.'
      });
      return;
    }

    if (!serviceOrderData?.id) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Cannot update service order: Missing ID'
      });
      return;
    }

    setModal({
      isOpen: true,
      type: 'loading',
      title: 'Saving',
      message: 'Please wait while we save your changes...'
    });
    
    setLoading(true);
    setUploadProgress(0);
    
    try {
      const serviceOrderId = serviceOrderData.id;
      
      setModal({
        isOpen: true,
        type: 'loading',
        title: 'Uploading Images',
        message: `Uploading images to Google Drive... 0%`
      });
      
      const imageUrls = await uploadAllImages();
      
      setModal({
        isOpen: true,
        type: 'loading',
        title: 'Saving Service Order',
        message: 'Saving service order details...'
      });
      
      const serviceOrderUpdateData: any = {
        account_no: updatedFormData.accountNo,
        date_installed: updatedFormData.dateInstalled,
        full_name: updatedFormData.fullName,
        contact_number: updatedFormData.contactNumber,
        email_address: updatedFormData.emailAddress,
        plan: updatedFormData.plan,
        group_name: updatedFormData.affiliate,
        username: updatedFormData.username,
        connection_type: updatedFormData.connectionType,
        router_modem_sn: updatedFormData.routerModemSN,
        lcp: updatedFormData.lcp,
        nap: updatedFormData.nap,
        port: updatedFormData.port,
        vlan: updatedFormData.vlan,
        support_status: updatedFormData.supportStatus,
        visit_status: updatedFormData.visitStatus,
        repair_category: updatedFormData.repairCategory,
        visit_by_user: updatedFormData.visitBy,
        visit_with: updatedFormData.visitWith,
        visit_remarks: updatedFormData.visitRemarks,
        client_signature: updatedFormData.clientSignature,
        item_name_1: updatedFormData.itemName1,
        image1_url: imageUrls.image1_url || formData.timeIn,
        image2_url: imageUrls.image2_url || formData.modemSetupImage,
        image3_url: imageUrls.image3_url || formData.timeOut,
        client_signature_url: imageUrls.client_signature_url || formData.clientSignature,
        assigned_email: updatedFormData.assignedEmail || updatedFormData.userEmail,
        concern: updatedFormData.concern,
        concern_remarks: updatedFormData.concernRemarks,
        updated_by: updatedFormData.modifiedBy,
        support_remarks: updatedFormData.supportRemarks,
        service_charge: parseFloat(updatedFormData.serviceCharge)
      };

      const response = await apiClient.put<{ success: boolean; message?: string; data?: any }>(
        `/service-orders/${serviceOrderId}`, 
        serviceOrderUpdateData
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Service order update failed');
      }

      setModal({
        isOpen: true,
        type: 'success',
        title: 'Success',
        message: 'Service Order updated successfully!',
        onConfirm: () => {
          setErrors({});
          onSave(updatedFormData);
          onClose();
          setModal({ ...modal, isOpen: false });
        }
      });
    } catch (error: any) {
      console.error('Error updating service order:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Failed to Update',
        message: `Failed to update service order: ${errorMessage}`,
        onConfirm: () => {
          setModal({ ...modal, isOpen: false });
        }
      });
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-end z-50">
        <div className="h-full w-full max-w-2xl bg-gray-900 shadow-2xl overflow-hidden flex flex-col">
          <div className="bg-gray-800 px-6 py-4 flex items-center justify-between border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <button onClick={onClose} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
              <h2 className="text-xl font-semibold text-white">
                {serviceOrderData?.ticket_id || serviceOrderData?.id} | {formData.fullName}
              </h2>
            </div>
            <div className="flex items-center space-x-3">
              <button onClick={onClose} className="px-4 py-2 border border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white rounded text-sm">
                Cancel
              </button>
              <button onClick={handleSave} disabled={loading} className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded text-sm">
                Save
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Account No<span className="text-red-500">*</span></label>
              <div className="relative">
                <select 
                  value={formData.accountNo} 
                  onChange={(e) => handleInputChange('accountNo', e.target.value)} 
                  className={`w-full px-3 py-2 bg-gray-800 border ${errors.accountNo ? 'border-red-500' : 'border-gray-700'} rounded text-white focus:outline-none focus:border-orange-500 appearance-none`}
                >
                  <option value="">Select Account</option>
                  {formData.accountNo && (
                    <option value={formData.accountNo}>{formData.accountNo}</option>
                  )}
                </select>
                <ChevronDown className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={20} />
              </div>
              {errors.accountNo && (
                <div className="flex items-center mt-1">
                  <div className="flex items-center justify-center w-4 h-4 rounded-full bg-orange-500 text-white text-xs mr-2">!</div>
                  <p className="text-orange-500 text-xs">This entry is required</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Date Installed<span className="text-red-500">*</span></label>
              <div className="relative">
                <input 
                  type="date" 
                  value={formData.dateInstalled} 
                  onChange={(e) => handleInputChange('dateInstalled', e.target.value)} 
                  className={`w-full px-3 py-2 bg-gray-800 border ${errors.dateInstalled ? 'border-red-500' : 'border-gray-700'} rounded text-white focus:outline-none focus:border-orange-500`} 
                />
                <Calendar className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={20} />
              </div>
              {errors.dateInstalled && (
                <div className="flex items-center mt-1">
                  <div className="flex items-center justify-center w-4 h-4 rounded-full bg-orange-500 text-white text-xs mr-2">!</div>
                  <p className="text-orange-500 text-xs">This entry is required</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Full Name<span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={formData.fullName} 
                onChange={(e) => handleInputChange('fullName', e.target.value)} 
                className={`w-full px-3 py-2 bg-gray-800 border ${errors.fullName ? 'border-red-500' : 'border-gray-700'} rounded text-white focus:outline-none focus:border-orange-500`} 
              />
              {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Contact Number<span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={formData.contactNumber} 
                onChange={(e) => handleInputChange('contactNumber', e.target.value)} 
                className={`w-full px-3 py-2 bg-gray-800 border ${errors.contactNumber ? 'border-red-500' : 'border-gray-700'} rounded text-white focus:outline-none focus:border-orange-500`} 
              />
              {errors.contactNumber && <p className="text-red-500 text-xs mt-1">{errors.contactNumber}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email Address<span className="text-red-500">*</span></label>
              <input 
                type="email" 
                value={formData.emailAddress} 
                onChange={(e) => handleInputChange('emailAddress', e.target.value)} 
                className={`w-full px-3 py-2 bg-gray-800 border ${errors.emailAddress ? 'border-red-500' : 'border-gray-700'} rounded text-white focus:outline-none focus:border-orange-500`} 
              />
              {errors.emailAddress && <p className="text-red-500 text-xs mt-1">{errors.emailAddress}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Plan<span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={formData.plan} 
                onChange={(e) => handleInputChange('plan', e.target.value)} 
                className={`w-full px-3 py-2 bg-gray-800 border ${errors.plan ? 'border-red-500' : 'border-gray-700'} rounded text-white focus:outline-none focus:border-orange-500`} 
                readOnly
              />
              {errors.plan && <p className="text-red-500 text-xs mt-1">{errors.plan}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Affiliate</label>
              <input 
                type="text" 
                value={formData.affiliate} 
                onChange={(e) => handleInputChange('affiliate', e.target.value)} 
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-orange-500" 
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Username<span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={formData.username} 
                onChange={(e) => handleInputChange('username', e.target.value)} 
                className={`w-full px-3 py-2 bg-gray-800 border ${errors.username ? 'border-red-500' : 'border-gray-700'} rounded text-white focus:outline-none focus:border-orange-500`} 
              />
              {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Connection Type<span className="text-red-500">*</span></label>
              <div className="grid grid-cols-3 gap-2">
                <button 
                  type="button" 
                  onClick={() => handleInputChange('connectionType', 'Fiber')} 
                  className={`py-2 px-4 rounded border ${formData.connectionType === 'Fiber' ? 'bg-orange-600 border-orange-700' : 'bg-gray-800 border-gray-700'} text-white transition-colors duration-200`}
                >
                  Fiber
                </button>
              </div>
              {errors.connectionType && (
                <div className="flex items-center mt-1">
                  <div className="flex items-center justify-center w-4 h-4 rounded-full bg-orange-500 text-white text-xs mr-2">!</div>
                  <p className="text-orange-500 text-xs">This entry is required</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Router/Modem SN<span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={formData.routerModemSN} 
                onChange={(e) => handleInputChange('routerModemSN', e.target.value)} 
                className={`w-full px-3 py-2 bg-gray-800 border ${errors.routerModemSN ? 'border-red-500' : 'border-gray-700'} rounded text-white focus:outline-none focus:border-orange-500`} 
              />
              {errors.routerModemSN && (
                <div className="flex items-center mt-1">
                  <div className="flex items-center justify-center w-4 h-4 rounded-full bg-orange-500 text-white text-xs mr-2">!</div>
                  <p className="text-orange-500 text-xs">This entry is required</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">LCP</label>
              <input 
                type="text" 
                value={formData.lcp} 
                onChange={(e) => handleInputChange('lcp', e.target.value)} 
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-orange-500" 
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">NAP</label>
              <input 
                type="text" 
                value={formData.nap} 
                onChange={(e) => handleInputChange('nap', e.target.value)} 
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-orange-500" 
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">PORT<span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={formData.port} 
                onChange={(e) => handleInputChange('port', e.target.value)} 
                className={`w-full px-3 py-2 bg-gray-800 border ${errors.port ? 'border-red-500' : 'border-gray-700'} rounded text-white focus:outline-none focus:border-orange-500`} 
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">VLAN<span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={formData.vlan} 
                onChange={(e) => handleInputChange('vlan', e.target.value)} 
                className={`w-full px-3 py-2 bg-gray-800 border ${errors.vlan ? 'border-red-500' : 'border-gray-700'} rounded text-white focus:outline-none focus:border-orange-500`} 
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Support Status</label>
              <div className="relative">
                <select 
                  value={formData.supportStatus} 
                  onChange={(e) => handleInputChange('supportStatus', e.target.value)} 
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-orange-500 appearance-none"
                >
                  <option value="Resolved">Resolved</option>
                  <option value="Failed">Failed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="For Visit">For Visit</option>
                </select>
                <ChevronDown className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={20} />
              </div>
            </div>

            {formData.supportStatus === 'For Visit' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Visit Status<span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select 
                      value={formData.visitStatus} 
                      onChange={(e) => handleInputChange('visitStatus', e.target.value)} 
                      className={`w-full px-3 py-2 bg-gray-800 border ${errors.visitStatus ? 'border-red-500' : 'border-gray-700'} rounded text-white focus:outline-none focus:border-orange-500 appearance-none`}
                    >
                      <option value="">Select Visit Status</option>
                      <option value="Done">Done</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Failed">Failed</option>
                      <option value="Reschedule">Reschedule</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={20} />
                  </div>
                  {errors.visitStatus && (
                    <div className="flex items-center mt-1">
                      <div className="flex items-center justify-center w-4 h-4 rounded-full bg-orange-500 text-white text-xs mr-2">!</div>
                      <p className="text-orange-500 text-xs">This entry is required</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Assigned Email<span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select 
                      value={formData.assignedEmail} 
                      onChange={(e) => {
                        console.log('Assigned Email changed to:', e.target.value);
                        handleInputChange('assignedEmail', e.target.value);
                      }} 
                      className={`w-full px-3 py-2 bg-gray-800 border ${errors.assignedEmail ? 'border-red-500' : 'border-gray-700'} rounded text-white focus:outline-none focus:border-orange-500 appearance-none`}
                    >
                      <option value="">Select Technician</option>
                      {technicians.map((tech) => {
                        const emailValue = (tech as any).email_address || tech.email || '';
                        console.log('Technician option:', tech, 'Email:', emailValue);
                        return (
                          <option key={emailValue} value={emailValue}>
                            {emailValue}
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={20} />
                  </div>
                  {errors.assignedEmail && (
                    <div className="flex items-center mt-1">
                      <div className="flex items-center justify-center w-4 h-4 rounded-full bg-orange-500 text-white text-xs mr-2">!</div>
                      <p className="text-orange-500 text-xs">This entry is required</p>
                    </div>
                  )}
                </div>

                {formData.visitStatus === 'Done' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Repair Category<span className="text-red-500">*</span></label>
                      <div className="relative">
                        <select 
                          value={formData.repairCategory} 
                          onChange={(e) => handleInputChange('repairCategory', e.target.value)} 
                          className={`w-full px-3 py-2 bg-gray-800 border ${errors.repairCategory ? 'border-red-500' : 'border-gray-700'} rounded text-white focus:outline-none focus:border-orange-500 appearance-none`}
                        >
                          <option value="">Select Repair Category</option>
                          <option value="Installation">Installation</option>
                          <option value="Repair">Repair</option>
                          <option value="Maintenance">Maintenance</option>
                          <option value="Upgrade">Upgrade</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={20} />
                      </div>
                      {errors.repairCategory && (
                        <div className="flex items-center mt-1">
                          <div className="flex items-center justify-center w-4 h-4 rounded-full bg-orange-500 text-white text-xs mr-2">!</div>
                          <p className="text-orange-500 text-xs">This entry is required</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Visit By<span className="text-red-500">*</span></label>
                      <div className="relative">
                        <select 
                          value={formData.visitBy} 
                          onChange={(e) => handleInputChange('visitBy', e.target.value)} 
                          className={`w-full px-3 py-2 bg-gray-800 border ${errors.visitBy ? 'border-red-500' : 'border-gray-700'} rounded text-white focus:outline-none focus:border-orange-500 appearance-none`}
                        >
                          <option value="">Select Visit By</option>
                          {technicians.map((tech) => {
                            const emailValue = (tech as any).email_address || tech.email || '';
                            return (
                              <option key={emailValue} value={emailValue}>
                                {emailValue}
                              </option>
                            );
                          })}
                        </select>
                        <ChevronDown className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={20} />
                      </div>
                      {errors.visitBy && (
                        <div className="flex items-center mt-1">
                          <div className="flex items-center justify-center w-4 h-4 rounded-full bg-orange-500 text-white text-xs mr-2">!</div>
                          <p className="text-orange-500 text-xs">This entry is required</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Visit With</label>
                      <div className="relative">
                        <select 
                          value={formData.visitWith} 
                          onChange={(e) => handleInputChange('visitWith', e.target.value)} 
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-orange-500 appearance-none"
                        >
                          <option value="">Select Visit With</option>
                          {technicians.map((tech) => {
                            const emailValue = (tech as any).email_address || tech.email || '';
                            return (
                              <option key={emailValue} value={emailValue}>
                                {emailValue}
                              </option>
                            );
                          })}
                        </select>
                        <ChevronDown className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={20} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Visit With Other</label>
                      <div className="relative">
                        <select 
                          value={formData.visitWithOther} 
                          onChange={(e) => handleInputChange('visitWithOther', e.target.value)} 
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-orange-500 appearance-none"
                        >
                          <option value="">Select Visit With Other</option>
                          {technicians.map((tech) => {
                            const emailValue = (tech as any).email_address || tech.email || '';
                            return (
                              <option key={emailValue} value={emailValue}>
                                {emailValue}
                              </option>
                            );
                          })}
                        </select>
                        <ChevronDown className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={20} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Visit Remarks<span className="text-red-500">*</span></label>
                      <textarea 
                        value={formData.visitRemarks} 
                        onChange={(e) => handleInputChange('visitRemarks', e.target.value)} 
                        rows={3} 
                        className={`w-full px-3 py-2 bg-gray-800 border ${errors.visitRemarks ? 'border-red-500' : 'border-gray-700'} rounded text-white focus:outline-none focus:border-orange-500 resize-none`} 
                      />
                      {errors.visitRemarks && (
                        <div className="flex items-center mt-1">
                          <div className="flex items-center justify-center w-4 h-4 rounded-full bg-orange-500 text-white text-xs mr-2">!</div>
                          <p className="text-orange-500 text-xs">This entry is required</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Client Signature<span className="text-red-500">*</span></label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange('clientSignatureFile', e.target.files?.[0] || null)}
                        className="hidden"
                        id="clientSignatureInput"
                      />
                      <label
                        htmlFor="clientSignatureInput"
                        className="relative w-full h-48 bg-gray-800 border border-gray-700 rounded overflow-hidden cursor-pointer hover:bg-gray-750 flex flex-col items-center justify-center"
                      >
                        {imagePreviews.clientSignatureFile ? (
                          <div className="relative w-full h-full">
                            <img 
                              src={imagePreviews.clientSignatureFile} 
                              alt="Client Signature" 
                              className="w-full h-full object-contain"
                            />
                            <div className="absolute bottom-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs flex items-center pointer-events-none">
                              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              Uploaded
                            </div>
                          </div>
                        ) : (
                          <>
                            <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            <p className="text-gray-400 text-sm">Click to upload</p>
                          </>
                        )}
                      </label>
                      {errors.clientSignature && (
                        <div className="flex items-center mt-1">
                          <div className="flex items-center justify-center w-4 h-4 rounded-full bg-orange-500 text-white text-xs mr-2">!</div>
                          <p className="text-orange-500 text-xs">This entry is required</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Item Name 1<span className="text-red-500">*</span></label>
                      <div className="relative">
                        <select 
                          value={formData.itemName1} 
                          onChange={(e) => handleInputChange('itemName1', e.target.value)} 
                          className={`w-full px-3 py-2 bg-gray-800 border ${errors.itemName1 ? 'border-red-500' : 'border-gray-700'} rounded text-white focus:outline-none focus:border-orange-500 appearance-none`}
                        >
                          <option value="">Select Item</option>
                          <option value="Router">Router</option>
                          <option value="Modem">Modem</option>
                          <option value="Cable">Cable</option>
                          <option value="Connector">Connector</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={20} />
                      </div>
                      {errors.itemName1 && (
                        <div className="flex items-center mt-1">
                          <div className="flex items-center justify-center w-4 h-4 rounded-full bg-orange-500 text-white text-xs mr-2">!</div>
                          <p className="text-orange-500 text-xs">This entry is required</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Time In<span className="text-red-500">*</span></label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange('timeInFile', e.target.files?.[0] || null)}
                        className="hidden"
                        id="timeInInput"
                      />
                      <label
                        htmlFor="timeInInput"
                        className="relative w-full h-48 bg-gray-800 border border-gray-700 rounded overflow-hidden cursor-pointer hover:bg-gray-750 flex flex-col items-center justify-center"
                      >
                        {imagePreviews.timeInFile ? (
                          <div className="relative w-full h-full">
                            <img 
                              src={imagePreviews.timeInFile} 
                              alt="Time In" 
                              className="w-full h-full object-contain"
                            />
                            <div className="absolute bottom-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs flex items-center pointer-events-none">
                              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              Uploaded
                            </div>
                          </div>
                        ) : (
                          <>
                            <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <p className="text-gray-400 text-sm">Click to upload</p>
                          </>
                        )}
                      </label>
                      {errors.timeIn && (
                        <div className="flex items-center mt-1">
                          <div className="flex items-center justify-center w-4 h-4 rounded-full bg-orange-500 text-white text-xs mr-2">!</div>
                          <p className="text-orange-500 text-xs">This entry is required</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Modem Setup Image<span className="text-red-500">*</span></label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange('modemSetupFile', e.target.files?.[0] || null)}
                        className="hidden"
                        id="modemSetupInput"
                      />
                      <label
                        htmlFor="modemSetupInput"
                        className="relative w-full h-48 bg-gray-800 border border-gray-700 rounded overflow-hidden cursor-pointer hover:bg-gray-750 flex flex-col items-center justify-center"
                      >
                        {imagePreviews.modemSetupFile ? (
                          <div className="relative w-full h-full">
                            <img 
                              src={imagePreviews.modemSetupFile} 
                              alt="Modem Setup" 
                              className="w-full h-full object-contain"
                            />
                            <div className="absolute bottom-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs flex items-center pointer-events-none">
                              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              Uploaded
                            </div>
                          </div>
                        ) : (
                          <>
                            <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <p className="text-gray-400 text-sm">Click to upload</p>
                          </>
                        )}
                      </label>
                      {errors.modemSetupImage && (
                        <div className="flex items-center mt-1">
                          <div className="flex items-center justify-center w-4 h-4 rounded-full bg-orange-500 text-white text-xs mr-2">!</div>
                          <p className="text-orange-500 text-xs">This entry is required</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Time Out<span className="text-red-500">*</span></label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange('timeOutFile', e.target.files?.[0] || null)}
                        className="hidden"
                        id="timeOutInput"
                      />
                      <label
                        htmlFor="timeOutInput"
                        className="relative w-full h-48 bg-gray-800 border border-gray-700 rounded overflow-hidden cursor-pointer hover:bg-gray-750 flex flex-col items-center justify-center"
                      >
                        {imagePreviews.timeOutFile ? (
                          <div className="relative w-full h-full">
                            <img 
                              src={imagePreviews.timeOutFile} 
                              alt="Time Out" 
                              className="w-full h-full object-contain"
                            />
                            <div className="absolute bottom-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs flex items-center pointer-events-none">
                              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              Uploaded
                            </div>
                          </div>
                        ) : (
                          <>
                            <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <p className="text-gray-400 text-sm">Click to upload</p>
                          </>
                        )}
                      </label>
                      {errors.timeOut && (
                        <div className="flex items-center mt-1">
                          <div className="flex items-center justify-center w-4 h-4 rounded-full bg-orange-500 text-white text-xs mr-2">!</div>
                          <p className="text-orange-500 text-xs">This entry is required</p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {(formData.visitStatus === 'Reschedule' || formData.visitStatus === 'Failed') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Visit By<span className="text-red-500">*</span></label>
                      <div className="relative">
                        <select 
                          value={formData.visitBy} 
                          onChange={(e) => handleInputChange('visitBy', e.target.value)} 
                          className={`w-full px-3 py-2 bg-gray-800 border ${errors.visitBy ? 'border-red-500' : 'border-gray-700'} rounded text-white focus:outline-none focus:border-orange-500 appearance-none`}
                        >
                          <option value="">Select Visit By</option>
                          {technicians.map((tech) => (
                            <option key={tech.email} value={tech.email}>
                              {tech.email}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={20} />
                      </div>
                      {errors.visitBy && (
                        <div className="flex items-center mt-1">
                          <div className="flex items-center justify-center w-4 h-4 rounded-full bg-orange-500 text-white text-xs mr-2">!</div>
                          <p className="text-orange-500 text-xs">This entry is required</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Visit With<span className="text-red-500">*</span></label>
                      <div className="relative">
                        <select 
                          value={formData.visitWith} 
                          onChange={(e) => handleInputChange('visitWith', e.target.value)} 
                          className={`w-full px-3 py-2 bg-gray-800 border ${errors.visitWith ? 'border-red-500' : 'border-gray-700'} rounded text-white focus:outline-none focus:border-orange-500 appearance-none`}
                        >
                          <option value="">Select Visit With</option>
                          {technicians.map((tech) => (
                            <option key={tech.email} value={tech.email}>
                              {tech.email}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={20} />
                      </div>
                      {errors.visitWith && (
                        <div className="flex items-center mt-1">
                          <div className="flex items-center justify-center w-4 h-4 rounded-full bg-orange-500 text-white text-xs mr-2">!</div>
                          <p className="text-orange-500 text-xs">This entry is required</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Visit With Other<span className="text-red-500">*</span></label>
                      <div className="relative">
                        <select 
                          value={formData.visitWithOther} 
                          onChange={(e) => handleInputChange('visitWithOther', e.target.value)} 
                          className={`w-full px-3 py-2 bg-gray-800 border ${errors.visitWithOther ? 'border-red-500' : 'border-gray-700'} rounded text-white focus:outline-none focus:border-orange-500 appearance-none`}
                        >
                          <option value="">Select Visit With Other</option>
                          {technicians.map((tech) => (
                            <option key={tech.email} value={tech.email}>
                              {tech.email}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={20} />
                      </div>
                      {errors.visitWithOther && (
                        <div className="flex items-center mt-1">
                          <div className="flex items-center justify-center w-4 h-4 rounded-full bg-orange-500 text-white text-xs mr-2">!</div>
                          <p className="text-orange-500 text-xs">This entry is required</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Visit Remarks<span className="text-red-500">*</span></label>
                      <textarea 
                        value={formData.visitRemarks} 
                        onChange={(e) => handleInputChange('visitRemarks', e.target.value)} 
                        rows={3} 
                        className={`w-full px-3 py-2 bg-gray-800 border ${errors.visitRemarks ? 'border-red-500' : 'border-gray-700'} rounded text-white focus:outline-none focus:border-orange-500 resize-none`} 
                      />
                      {errors.visitRemarks && (
                        <div className="flex items-center mt-1">
                          <div className="flex items-center justify-center w-4 h-4 rounded-full bg-orange-500 text-white text-xs mr-2">!</div>
                          <p className="text-orange-500 text-xs">This entry is required</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Concern<span className="text-red-500">*</span></label>
              <div className="relative">
                <select 
                  value={formData.concern} 
                  onChange={(e) => handleInputChange('concern', e.target.value)} 
                  className={`w-full px-3 py-2 bg-gray-800 border ${errors.concern ? 'border-red-500' : 'border-gray-700'} rounded text-white focus:outline-none focus:border-orange-500 appearance-none`}
                >
                  <option value="">Select Concern</option>
                  <option value="No Internet">No Internet</option>
                  <option value="Slow Internet">Slow Internet</option>
                  <option value="Intermittent Connection">Intermittent Connection</option>
                  <option value="Router Issue">Router Issue</option>
                  <option value="Billing Concern">Billing Concern</option>
                  <option value="Others">Others</option>
                </select>
                <ChevronDown className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={20} />
              </div>
              {errors.concern && (
                <div className="flex items-center mt-1">
                  <div className="flex items-center justify-center w-4 h-4 rounded-full bg-orange-500 text-white text-xs mr-2">!</div>
                  <p className="text-orange-500 text-xs">This entry is required</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Concern Remarks<span className="text-red-500">*</span></label>
              <textarea 
                value={formData.concernRemarks} 
                onChange={(e) => handleInputChange('concernRemarks', e.target.value)} 
                rows={3} 
                className={`w-full px-3 py-2 bg-gray-800 border ${errors.concernRemarks ? 'border-red-500' : 'border-gray-700'} rounded text-white focus:outline-none focus:border-orange-500 resize-none`} 
              />
              {errors.concernRemarks && (
                <div className="flex items-center mt-1">
                  <div className="flex items-center justify-center w-4 h-4 rounded-full bg-orange-500 text-white text-xs mr-2">!</div>
                  <p className="text-orange-500 text-xs">This entry is required</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Modified By</label>
              <input 
                type="email" 
                value={formData.modifiedBy} 
                readOnly 
                className="w-full px-3 py-2 bg-gray-700 border border-gray-700 rounded text-gray-400 cursor-not-allowed" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Modified Date</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={formData.modifiedDate} 
                  readOnly 
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-700 rounded text-gray-400 cursor-not-allowed pr-10" 
                />
                <Calendar className="absolute right-3 top-2.5 text-gray-400" size={20} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">User Email</label>
              <input 
                type="email" 
                value={formData.userEmail} 
                onChange={(e) => handleInputChange('userEmail', e.target.value)} 
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-orange-500" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Support Remarks<span className="text-red-500">*</span></label>
              <textarea 
                value={formData.supportRemarks} 
                onChange={(e) => handleInputChange('supportRemarks', e.target.value)} 
                rows={3} 
                className={`w-full px-3 py-2 bg-gray-800 border ${errors.supportRemarks ? 'border-red-500' : 'border-gray-700'} rounded text-white focus:outline-none focus:border-orange-500 resize-none`} 
              />
              {errors.supportRemarks && (
                <div className="flex items-center mt-1">
                  <div className="flex items-center justify-center w-4 h-4 rounded-full bg-orange-500 text-white text-xs mr-2">!</div>
                  <p className="text-orange-500 text-xs">This entry is required</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Service Charge<span className="text-red-500">*</span></label>
              <div className="flex items-center bg-gray-800 border border-gray-700 rounded">
                <span className="px-3 py-2 text-white">₱</span>
                <input 
                  type="number" 
                  value={formData.serviceCharge} 
                  onChange={(e) => handleInputChange('serviceCharge', e.target.value)} 
                  step="0.01"
                  className="flex-1 px-3 py-2 bg-transparent text-white focus:outline-none" 
                />
                <div className="flex">
                  <button 
                    type="button" 
                    onClick={() => handleNumberChange('serviceCharge', false)} 
                    className="px-3 py-2 text-gray-400 hover:text-white border-l border-gray-700"
                  >
                    <Minus size={16} />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleNumberChange('serviceCharge', true)} 
                    className="px-3 py-2 text-gray-400 hover:text-white border-l border-gray-700"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              {errors.serviceCharge && (
                <div className="flex items-center mt-1">
                  <div className="flex items-center justify-center w-4 h-4 rounded-full bg-orange-500 text-white text-xs mr-2">!</div>
                  <p className="text-orange-500 text-xs">This entry is required</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {modal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
              {modal.type === 'loading' ? (
                <>
                  <div className="flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mb-4"></div>
                    {modal.title === 'Uploading Images' && uploadProgress > 0 && (
                      <h3 className="text-4xl font-bold text-white">{uploadProgress}%</h3>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center mb-4">
                    {modal.type === 'success' && (
                      <div className="rounded-full bg-green-500 p-3">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    {modal.type === 'error' && (
                      <div className="rounded-full bg-red-500 p-3">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    )}
                    {modal.type === 'warning' && (
                      <div className="rounded-full bg-yellow-500 p-3">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-4 text-center">{modal.title}</h3>
                  <p className="text-gray-300 mb-6 whitespace-pre-line text-center">{modal.message}</p>
                  <div className="flex items-center justify-center gap-3">
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
                        onClick={() => {
                          if (modal.onConfirm) {
                            modal.onConfirm();
                          } else {
                            setModal({ ...modal, isOpen: false });
                          }
                        }}
                        className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded transition-colors"
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
      </div>
    </>
  );
};

export default ServiceOrderEditModal;
