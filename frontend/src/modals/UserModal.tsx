import React, { useState, useEffect } from 'react';
import { X, Loader2, Eye, EyeOff } from 'lucide-react';
import { User, CreateUserRequest, UpdateUserRequest, Organization, Role } from '../types/api';
import { userService, organizationService, roleService } from '../services/userService';
import { settingsColorPaletteService, ColorPalette } from '../services/settingsColorPaletteService';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: User) => void;
  user?: User | null; // If provided, we are in Edit mode
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSave, user }) => {
  const isEditMode = !!user;
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [colorPalette, setColorPalette] = useState<ColorPalette | null>(null);
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  const [formData, setFormData] = useState<CreateUserRequest & { salutation?: string }>({
    first_name: '',
    middle_initial: '',
    last_name: '',
    username: '',
    email_address: '',
    contact_number: '',
    password: '',
    organization_id: undefined,
    role_id: undefined,
    salutation: ''
  });

  useEffect(() => {
    const theme = localStorage.getItem('theme');
    setIsDarkMode(theme === 'dark');

    const fetchPalette = async () => {
      const palette = await settingsColorPaletteService.getActive();
      setColorPalette(palette);
    };
    fetchPalette();

    const loadData = async () => {
      try {
        const [orgsRes, rolesRes] = await Promise.all([
          organizationService.getAllOrganizations(),
          roleService.getAllRoles()
        ]);
        if (orgsRes.success) setOrganizations(orgsRes.data || []);
        if (rolesRes.success) setRoles(rolesRes.data || []);
      } catch (err) {
        console.error('Failed to load modal data:', err);
      }
    };
    if (isOpen) loadData();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (user) {
        setFormData({
          first_name: user.first_name || '',
          middle_initial: user.middle_initial || '',
          last_name: user.last_name || '',
          username: user.username || '',
          email_address: user.email_address || '',
          contact_number: user.contact_number || '',
          password: '',
          organization_id: user.organization_id ?? undefined,
          role_id: user.role_id ?? undefined,
          salutation: user.salutation || ''
        });
        setConfirmPassword('');
      } else {
        setFormData({
          first_name: '',
          middle_initial: '',
          last_name: '',
          username: '',
          email_address: '',
          contact_number: '',
          password: '',
          organization_id: undefined,
          role_id: undefined,
          salutation: ''
        });
        setConfirmPassword('');
      }
      setErrors({});
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isOpen, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'organization_id' || name === 'role_id') {
      const val = value ? parseInt(value) : undefined;
      setFormData(prev => ({ ...prev, [name]: val }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.first_name?.trim()) newErrors.first_name = 'Required';
    if (!formData.last_name?.trim()) newErrors.last_name = 'Required';
    if (!formData.username?.trim()) newErrors.username = 'Required';
    if (!formData.email_address?.trim()) newErrors.email_address = 'Required';
    
    if (!isEditMode) {
      if (!formData.password) newErrors.password = 'Required';
      else if (formData.password.length < 8) newErrors.password = 'Min 8 chars';
      if (formData.password !== confirmPassword) newErrors.confirmPassword = 'Mismatch';
    } else if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Min 8 chars';
    }

    if (!formData.role_id) newErrors.role_id = 'Required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      let response;
      if (isEditMode && user) {
        const updateData: UpdateUserRequest = {
          salutation: formData.salutation,
          first_name: formData.first_name,
          middle_initial: formData.middle_initial,
          last_name: formData.last_name,
          username: formData.username,
          email_address: formData.email_address,
          contact_number: formData.contact_number,
          organization_id: formData.organization_id,
          role_id: formData.role_id,
        };
        if (formData.password) updateData.password = formData.password;
        response = await userService.updateUser(user.id, updateData);
      } else {
        response = await userService.createUser(formData);
      }

      if (response.success && response.data) {
        onSave(response.data);
        onClose();
      } else {
        setErrors({ general: response.message || 'Action failed' });
      }
    } catch (err: any) {
      setErrors({ general: err.message || 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputClass = `w-full px-3 py-2 border rounded focus:outline-none transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'}`;
  const labelClass = `block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-end z-[5000]">
      <div className={`h-full w-full max-w-xl flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <h2 className="text-xl font-semibold">
            {isEditMode ? 'Edit User' : 'Add New User'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors dark:hover:bg-gray-800">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {errors.general && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded text-sm">
              {errors.general}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelClass}>Salutation</label>
              <select name="salutation" value={formData.salutation} onChange={handleInputChange} className={inputClass}>
                <option value="">None</option>
                <option value="Mr">Mr</option>
                <option value="Ms">Ms</option>
                <option value="Mrs">Mrs</option>
                <option value="Dr">Dr</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>First Name*</label>
              <input name="first_name" value={formData.first_name} onChange={handleInputChange} className={`${inputClass} ${errors.first_name ? 'border-red-500' : ''}`} />
            </div>

            <div>
              <label className={labelClass}>Last Name*</label>
              <input name="last_name" value={formData.last_name} onChange={handleInputChange} className={`${inputClass} ${errors.last_name ? 'border-red-500' : ''}`} />
            </div>

            <div>
              <label className={labelClass}>Middle Initial</label>
              <input name="middle_initial" value={formData.middle_initial} onChange={handleInputChange} maxLength={1} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Username*</label>
              <input name="username" value={formData.username} onChange={handleInputChange} className={`${inputClass} ${errors.username ? 'border-red-500' : ''}`} />
            </div>

            <div className="col-span-2">
              <label className={labelClass}>Email Address*</label>
              <input type="email" name="email_address" value={formData.email_address} onChange={handleInputChange} className={`${inputClass} ${errors.email_address ? 'border-red-500' : ''}`} />
            </div>

            <div>
              <label className={labelClass}>Contact Number</label>
              <input name="contact_number" value={formData.contact_number} onChange={handleInputChange} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Organization</label>
              <select name="organization_id" value={formData.organization_id || ''} onChange={handleInputChange} className={inputClass}>
                <option value="">None</option>
                {organizations.map(org => <option key={org.id} value={org.id}>{org.organization_name}</option>)}
              </select>
            </div>

            <div className="col-span-2">
              <label className={labelClass}>Role*</label>
              <select name="role_id" value={formData.role_id || ''} onChange={handleInputChange} className={`${inputClass} ${errors.role_id ? 'border-red-500' : ''}`}>
                <option value="">Select Role</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.role_name}</option>)}
              </select>
            </div>

            <div className="col-span-2">
              <label className={labelClass}>{isEditMode ? 'New Password (Optional)' : 'Password*'}</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleInputChange} className={`${inputClass} ${errors.password ? 'border-red-500' : ''}`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-gray-500">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {!isEditMode && (
              <div className="col-span-2">
                <label className={labelClass}>Confirm Password*</label>
                <div className="relative">
                  <input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`${inputClass} ${errors.confirmPassword ? 'border-red-500' : ''}`} />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-2.5 text-gray-500">
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t flex items-center justify-end gap-3 ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <button onClick={onClose} className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${isDarkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-50'}`}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            style={{ backgroundColor: colorPalette?.primary }}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {isEditMode ? 'Update User' : 'Create User'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserModal;
