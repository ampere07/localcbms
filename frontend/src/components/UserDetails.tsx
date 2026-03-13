import React from 'react';
import { X, User, Mail, Phone, Shield, Building2, Calendar, Edit2, Trash2 } from 'lucide-react';
import { User as UserType } from '../types/api';
import { ColorPalette } from '../services/settingsColorPaletteService';

interface UserDetailsProps {
  user: UserType;
  onClose: () => void;
  onEdit: (user: UserType) => void;
  onDelete: (user: UserType) => void;
  isMobile: boolean;
  isDarkMode: boolean;
  colorPalette: ColorPalette | null;
}

const UserDetails: React.FC<UserDetailsProps> = ({
  user,
  onClose,
  onEdit,
  onDelete,
  isMobile,
  isDarkMode,
  colorPalette
}) => {
  const getFullName = (u: UserType): string => {
    const parts = [u.first_name, u.middle_initial, u.last_name].filter(Boolean);
    return parts.join(' ');
  };

  const DetailItem = ({ label, value, isLast = false }: { label: string, value: string, isLast?: boolean }) => (
    <div className={`py-4 ${!isLast ? `border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}` : ''}`}>
      <div className="flex flex-col gap-1">
        <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          {label}
        </span>
        <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {value || 'N/A'}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col h-full ${isMobile ? 'w-full' : 'w-[450px] border-l'} ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
      {/* Header */}
      <div className={`px-6 py-4 border-b flex items-center justify-between ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
        <div /> {/* Left empty as requested */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(user)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: colorPalette?.primary || '#3b82f6' }}
          >
            <Edit2 className="h-3.5 w-3.5" />
            Edit
          </button>
          <button
            onClick={() => onDelete(user)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${isDarkMode ? 'border-red-500/50 text-red-500 hover:bg-red-500/10' : 'border-red-200 text-red-600 hover:bg-red-50'}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
          <div className={`w-px h-6 mx-1 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`} />
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-800 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'}`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex flex-col">
          <DetailItem label="Full Name" value={getFullName(user)} />
          <DetailItem label="Username" value={`@${user.username}`} />
          <DetailItem label="Email Address" value={user.email_address} />
          <DetailItem label="Contact Number" value={user.contact_number || 'N/A'} />
          <DetailItem label="System Role" value={user.role?.role_name || 'N/A'} />
          <DetailItem label="Organization" value={user.organization?.organization_name || 'N/A'} />
          <DetailItem label="Member Since" value={new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} isLast />
        </div>
      </div>
    </div>
  );
};

export default UserDetails;
