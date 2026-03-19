import React, { useState, useEffect, useRef } from 'react';
import { X, Settings, Edit2, Trash2 } from 'lucide-react';
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
  const [detailsWidth, setDetailsWidth] = useState<number>(600);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);
  
  const [showFieldSettings, setShowFieldSettings] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const getFullName = (u: UserType): string => {
    const parts = [u.first_name, u.middle_initial, u.last_name].filter(Boolean);
    return parts.join(' ');
  };

  const FIELD_VISIBILITY_KEY = 'userDetailsFieldVisibility';
  const FIELD_ORDER_KEY = 'userDetailsFieldOrder';

  const defaultFields = [
    'fullName',
    'username',
    'email',
    'contactNumber',
    'role',
    'organization',
    'memberSince'
  ];

  const [fieldVisibility, setFieldVisibility] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem(FIELD_VISIBILITY_KEY);
    if (saved) return JSON.parse(saved);
    return defaultFields.reduce((acc: Record<string, boolean>, field) => ({ ...acc, [field]: true }), {});
  });

  const [fieldOrder, setFieldOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem(FIELD_ORDER_KEY);
    return saved ? JSON.parse(saved) : defaultFields;
  });

  useEffect(() => {
    localStorage.setItem(FIELD_VISIBILITY_KEY, JSON.stringify(fieldVisibility));
  }, [fieldVisibility]);

  useEffect(() => {
    localStorage.setItem(FIELD_ORDER_KEY, JSON.stringify(fieldOrder));
  }, [fieldOrder]);

  useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const diff = startXRef.current - e.clientX;
      const newWidth = Math.max(450, Math.min(1200, startWidthRef.current + diff));
      setDetailsWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = detailsWidth;
  };

  const getFieldLabel = (fieldKey: string): string => {
    const labels: Record<string, string> = {
      fullName: 'Full Name',
      username: 'Username',
      email: 'Email Address',
      contactNumber: 'Contact Number',
      role: 'System Role',
      organization: 'Organization',
      memberSince: 'Member Since'
    };
    return labels[fieldKey] || fieldKey;
  };

  const toggleFieldVisibility = (field: string) => {
    setFieldVisibility(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const selectAllFields = () => {
    const allVisible = defaultFields.reduce((acc: Record<string, boolean>, field) => ({ ...acc, [field]: true }), {});
    setFieldVisibility(allVisible);
  };

  const deselectAllFields = () => {
    const allHidden = defaultFields.reduce((acc: Record<string, boolean>, field) => ({ ...acc, [field]: false }), {});
    setFieldVisibility(allHidden);
  };

  const handleDragStart = (index: number) => setDraggedIndex(index);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (dropIndex: number) => {
    if (draggedIndex === null) return;
    const newOrder = [...fieldOrder];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, removed);
    setFieldOrder(newOrder);
    setDraggedIndex(null);
  };
  const handleDragEnd = () => setDraggedIndex(null);
  const resetFieldSettings = () => {
    setFieldOrder(defaultFields);
    selectAllFields();
  };

  const renderFieldContent = (fieldKey: string) => {
    if (!fieldVisibility[fieldKey]) return null;

    const baseFieldClass = `flex border-b pb-4 ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`;
    const labelClass = `w-40 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`;
    const valueClass = `flex-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`;

    switch (fieldKey) {
      case 'fullName':
        return (
          <div className={baseFieldClass}>
            <div className={labelClass}>Full Name:</div>
            <div className={valueClass}>{getFullName(user) || 'N/A'}</div>
          </div>
        );
      case 'username':
        return (
          <div className={baseFieldClass}>
            <div className={labelClass}>Username:</div>
            <div className={valueClass}>@{user.username || 'N/A'}</div>
          </div>
        );
      case 'email':
        return (
          <div className={baseFieldClass}>
            <div className={labelClass}>Email Address:</div>
            <div className={valueClass}>{user.email_address || 'N/A'}</div>
          </div>
        );
      case 'contactNumber':
        return (
          <div className={baseFieldClass}>
            <div className={labelClass}>Contact Number:</div>
            <div className={valueClass}>{user.contact_number || 'N/A'}</div>
          </div>
        );
      case 'role':
        return (
          <div className={baseFieldClass}>
            <div className={labelClass}>System Role:</div>
            <div className={valueClass}>{user.role?.role_name || 'N/A'}</div>
          </div>
        );
      case 'organization':
        return (
          <div className={baseFieldClass}>
            <div className={labelClass}>Organization:</div>
            <div className={valueClass}>{user.organization?.organization_name || 'N/A'}</div>
          </div>
        );
      case 'memberSince':
        return (
          <div className={baseFieldClass}>
            <div className={labelClass}>Member Since:</div>
            <div className={valueClass}>{user.created_at ? (() => {
              const date = new Date(user.created_at);
              if (isNaN(date.getTime())) return user.created_at;
              const mm = String(date.getMonth() + 1).padStart(2, '0');
              const dd = String(date.getDate()).padStart(2, '0');
              const yyyy = date.getFullYear();
              return `${mm}/${dd}/${yyyy}`;
            })() : 'N/A'}</div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`h-full flex flex-col overflow-hidden ${!isMobile ? 'md:border-l' : ''} relative w-full md:w-auto ${isDarkMode ? 'bg-gray-950 border-white border-opacity-30' : 'bg-gray-50 border-gray-300'}`}
      style={!isMobile && window.innerWidth >= 768 ? { width: `${detailsWidth}px` } : undefined}
    >
      {!isMobile && (
        <div
          className={`hidden md:block absolute left-0 top-0 bottom-0 w-1 cursor-col-resize transition-colors z-50 ${isDarkMode ? 'hover:bg-orange-500' : 'hover:bg-orange-600'}`}
          onMouseDown={handleMouseDownResize}
        />
      )}

      <div className="flex-1 overflow-y-auto block h-full flex flex-col">
        <div className={`p-3 flex items-center justify-between border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center">
            <h2 className={isDarkMode ? 'text-white font-medium' : 'text-gray-900 font-medium'}>{getFullName(user)}</h2>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => onEdit(user)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: colorPalette?.primary || '#3b82f6' }}
            >
              <Edit2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Edit</span>
            </button>
            <button
              onClick={() => onDelete(user)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${isDarkMode ? 'border-red-500/50 text-red-500 hover:bg-red-500/10' : 'border-red-200 text-red-600 hover:bg-red-50'}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Delete</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowFieldSettings(!showFieldSettings)}
                className={isDarkMode ? 'hover:text-white text-gray-400' : 'hover:text-gray-900 text-gray-600'}
                title="Field Settings"
              >
                <Settings size={16} />
              </button>
              {showFieldSettings && (
                <div className={`absolute right-0 mt-2 w-80 rounded-lg shadow-lg border z-50 max-h-96 overflow-y-auto ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <div className={`px-4 py-3 border-b flex items-center justify-between ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Field Visibility & Order</h3>
                    <div className="flex items-center space-x-2">
                      <button onClick={selectAllFields} className="text-blue-600 hover:text-blue-700 text-xs">Show All</button>
                      <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>|</span>
                      <button onClick={deselectAllFields} className="text-blue-600 hover:text-blue-700 text-xs">Hide All</button>
                      <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>|</span>
                      <button onClick={resetFieldSettings} className="text-blue-600 hover:text-blue-700 text-xs">Reset</button>
                    </div>
                  </div>
                  <div className="p-2">
                    <div className={`text-xs mb-2 px-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Drag to reorder fields</div>
                    {fieldOrder.map((fieldKey, index) => (
                      <div
                        key={fieldKey}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(index)}
                        onDragEnd={handleDragEnd}
                        className={`flex items-center space-x-2 px-2 py-1.5 rounded cursor-move transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${draggedIndex === index ? (isDarkMode ? 'bg-gray-600' : 'bg-gray-200') : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={fieldVisibility[fieldKey]}
                          onChange={() => toggleFieldVisibility(fieldKey)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>☰</span>
                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{getFieldLabel(fieldKey)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className={isDarkMode ? 'hover:text-white text-gray-400' : 'hover:text-gray-900 text-gray-600'}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto w-full h-full relative">
          <div className={`max-w-2xl mx-auto py-6 px-4 ${isDarkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
            <div className="space-y-4">
              {fieldOrder.map((fieldKey) => (
                <React.Fragment key={fieldKey}>
                  {renderFieldContent(fieldKey)}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetails;
