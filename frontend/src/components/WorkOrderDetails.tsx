import React, { useState, useEffect, useRef } from 'react';
import {
  X, ExternalLink, Edit, Settings
} from 'lucide-react';
import { WorkOrder, WorkOrderDetailsProps } from '../types/workOrder';
import { ColorPalette } from '../services/settingsColorPaletteService';
import AssignWorkOrderModal from '../modals/AssignWorkOrderModal';

interface WorkOrderDetailsComponentProps extends WorkOrderDetailsProps {
  isDarkMode?: boolean;
  colorPalette?: ColorPalette | null;
}

const WorkOrderDetails: React.FC<WorkOrderDetailsComponentProps> = ({
  workOrder,
  onClose,
  onRefresh,
  isMobile = false,
  isDarkMode = true,
  colorPalette
}) => {
  const [userRole, setUserRole] = useState<string>('');
  const [roleId, setRoleId] = useState<number | null>(null);
  const [detailsWidth, setDetailsWidth] = useState<number>(600);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);
  const [showFieldSettings, setShowFieldSettings] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const FIELD_VISIBILITY_KEY = 'workOrderDetailsFieldVisibility';
  const FIELD_ORDER_KEY = 'workOrderDetailsFieldOrder';

  const defaultFields = [
    'id',
    'workStatus',
    'workCategory',
    'instructions',
    'reportTo',
    'assignTo',
    'remarks',
    'requestedBy',
    'requestedDate',
    'updatedBy',
    'updatedDate',
    'image_1',
    'image_2',
    'image_3',
    'signature'
  ];

  const [fieldVisibility, setFieldVisibility] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem(FIELD_VISIBILITY_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
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
    const authData = localStorage.getItem('authData');
    if (authData) {
      try {
        const userData = JSON.parse(authData);
        setUserRole(userData.role?.toLowerCase() || '');
        setRoleId(userData.role_id || null);
      } catch (error) {
        console.error('Error parsing auth data:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const diff = startXRef.current - e.clientX;
      const newWidth = Math.max(600, Math.min(1200, startWidthRef.current + diff));

      setDetailsWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

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

  const convertGDriveUrl = (url?: string | null): string => {
    if (!url) return '';
    if (url.includes('drive.google.com/file/d/')) {
      const parts = url.split('/d/');
      if (parts.length > 1) {
        const fileId = parts[1].split('/')[0];
        return `https://drive.google.com/uc?export=view&id=${fileId}`;
      }
    }
    return url;
  };

  const formatDate = (dateStr?: string | null): string => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString();
    } catch (e) {
      return dateStr;
    }
  };

  const getStatusColor = (status?: string): string => {
    if (!status) return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    switch (status.toLowerCase()) {
      case 'completed': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'in progress': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'failed':
      case 'cancelled': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'pending': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getFieldLabel = (fieldKey: string): string => {
    const labels: Record<string, string> = {
      id: 'Work Order ID',
      workStatus: 'Work Status',
      workCategory: 'Work Category',
      instructions: 'Instructions',
      reportTo: 'Report To',
      assignTo: 'Assign To',
      remarks: 'Remarks',
      requestedBy: 'Requested By',
      requestedDate: 'Requested Date',
      updatedBy: 'Updated By',
      updatedDate: 'Updated Date',
      image_1: 'Image 1',
      image_2: 'Image 2',
      image_3: 'Image 3',
      signature: 'Signature'
    };
    return labels[fieldKey] || fieldKey;
  };

  const toggleFieldVisibility = (field: string) => {
    setFieldVisibility((prev: Record<string, boolean>) => ({ ...prev, [field]: !prev[field] }));
  };

  const selectAllFields = () => {
    const allVisible: Record<string, boolean> = defaultFields.reduce((acc: Record<string, boolean>, field) => ({ ...acc, [field]: true }), {});
    setFieldVisibility(allVisible);
  };

  const deselectAllFields = () => {
    const allHidden: Record<string, boolean> = defaultFields.reduce((acc: Record<string, boolean>, field) => ({ ...acc, [field]: false }), {});
    setFieldVisibility(allHidden);
  };

  const resetFieldSettings = () => {
    const defaultVisibility: Record<string, boolean> = defaultFields.reduce((acc: Record<string, boolean>, field) => ({ ...acc, [field]: true }), {});
    setFieldVisibility(defaultVisibility);
    setFieldOrder(defaultFields);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;

    const newOrder = [...fieldOrder];
    const draggedItem = newOrder[draggedIndex];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, draggedItem);

    setFieldOrder(newOrder);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const renderFieldContent = (fieldKey: string) => {
    if (!fieldVisibility[fieldKey] || !workOrder) return null;

    const baseFieldClass = `flex flex-col sm:flex-row border-b pb-4 ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`;
    const labelClass = `w-full sm:w-1/3 text-sm mb-1 sm:mb-0 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`;
    const valueClass = `flex-1 sm:pl-4 font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`;

    switch (fieldKey) {
      case 'id':
        return (
          <div className={baseFieldClass}>
            <div className={labelClass}>Work Order ID:</div>
            <div className={valueClass}>#{workOrder.id}</div>
          </div>
        );

      case 'workStatus':
        return (
          <div className={baseFieldClass}>
            <div className={labelClass}>Work Status:</div>
            <div className={`flex-1 sm:pl-4`}>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(workOrder.work_status)}`}>
                {workOrder.work_status || 'Pending'}
              </span>
            </div>
          </div>
        );

      case 'workCategory':
        return (
          <div className={baseFieldClass}>
            <div className={labelClass}>Work Category:</div>
            <div className={valueClass}>{workOrder.work_category || 'N/A'}</div>
          </div>
        );

      case 'instructions':
        return (
          <div className={baseFieldClass}>
            <div className={labelClass}>Instructions:</div>
            <div
              className={`${valueClass} truncate`}
              title={workOrder.instructions || undefined}
            >
              {workOrder.instructions || 'N/A'}
            </div>
          </div>
        );

      case 'reportTo':
        return (
          <div className={baseFieldClass}>
            <div className={labelClass}>Report To:</div>
            <div className={valueClass}>{workOrder.report_to || 'N/A'}</div>
          </div>
        );

      case 'assignTo':
        return (
          <div className={baseFieldClass}>
            <div className={labelClass}>Assign To:</div>
            <div className={valueClass}>{workOrder.assign_to || 'Unassigned'}</div>
          </div>
        );

      case 'remarks':
        return (
          <div className={baseFieldClass}>
            <div className={labelClass}>Remarks:</div>
            <div className={valueClass}>{workOrder.remarks || 'None'}</div>
          </div>
        );

      case 'requestedBy':
        return (
          <div className={baseFieldClass}>
            <div className={labelClass}>Requested By:</div>
            <div className={valueClass}>{workOrder.requested_by || 'N/A'}</div>
          </div>
        );

      case 'requestedDate':
        return (
          <div className={baseFieldClass}>
            <div className={labelClass}>Requested Date:</div>
            <div className={valueClass}>{formatDate(workOrder.requested_date)}</div>
          </div>
        );

      case 'updatedBy':
        return (
          <div className={baseFieldClass}>
            <div className={labelClass}>Updated By:</div>
            <div className={valueClass}>{workOrder.updated_by || 'N/A'}</div>
          </div>
        );

      case 'updatedDate':
        return (
          <div className={baseFieldClass}>
            <div className={labelClass}>Updated Date:</div>
            <div className={valueClass}>{formatDate(workOrder.updated_date)}</div>
          </div>
        );

      case 'image_1':
      case 'image_2':
      case 'image_3':
      case 'signature':
        {
          const fieldValue = workOrder[fieldKey];
          const imageUrl = convertGDriveUrl(fieldValue);

          return (
            <div className={baseFieldClass}>
              <div className={labelClass}>{getFieldLabel(fieldKey)}:</div>
              <div className={valueClass}>
                {fieldValue ? (
                  <div className={`mt-2 rounded-lg border overflow-hidden max-w-sm ${isDarkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-100'}`}>
                    <img
                      src={imageUrl}
                      alt={getFieldLabel(fieldKey)}
                      className="w-full h-auto object-contain cursor-pointer transition-transform hover:scale-105"
                      onClick={() => window.open(fieldValue, '_blank')}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                      }}
                    />
                    <div className={`px-3 py-2 text-xs flex items-center justify-between ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-200/50'}`}>
                      <span className="truncate flex-1 mr-2 opacity-60">View on Google Drive</span>
                      <a
                        href={fieldValue}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-400 flex items-center"
                      >
                        <ExternalLink size={12} className="mr-1" />
                        Link
                      </a>
                    </div>
                  </div>
                ) : (
                  <span className="italic opacity-50">No Data</span>
                )}
              </div>
            </div>
          );
        }

      default:
        return null;
    }
  };

  if (!workOrder) return null;

  return (
    <div className={`flex flex-col h-full ${isDarkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <div
        className={`h-full flex flex-col relative transition-all duration-300 ${isDarkMode ? 'bg-gray-900 border-l border-gray-800' : 'bg-white border-l border-gray-200'}`}
        style={{ width: isMobile ? '100%' : `${detailsWidth}px` }}
      >
        {!isMobile && (
          <div
            className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-orange-500 hover:w-1.5 transition-all z-50"
            onMouseDown={handleMouseDownResize}
            style={{ backgroundColor: isResizing ? '#7c3aed' : 'transparent' }}
          />
        )}

        {/* Header */}
        <div className={`px-4 sm:px-6 py-4 flex items-center justify-between border-b flex-shrink-0 ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="flex-1 min-w-0 pr-4">
            <h2 className={`text-lg sm:text-xl font-semibold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Work Order #{workOrder.id}
            </h2>
            <p
              className={`text-xs sm:text-sm truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
              title={workOrder.instructions || undefined}
            >
              {workOrder.instructions}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              className="text-white px-3 py-1 rounded-sm flex items-center transition-colors text-sm md:text-base font-medium"
              style={{ backgroundColor: colorPalette?.primary || '#7c3aed' }}
              onMouseEnter={(e) => {
                if (colorPalette?.accent) e.currentTarget.style.backgroundColor = colorPalette.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colorPalette?.primary || '#7c3aed';
              }}
              onClick={() => setIsEditModalOpen(true)}
            >
              <span>Edit</span>
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
                        className={`flex items-center space-x-2 px-2 py-1.5 rounded cursor-move transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${draggedIndex === index ? isDarkMode ? 'bg-gray-600' : 'bg-gray-200' : ''}`}
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
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

      {isEditModalOpen && (
        <AssignWorkOrderModal
          isOpen={isEditModalOpen}
          isEditMode={true}
          workOrder={workOrder}
          onClose={() => setIsEditModalOpen(false)}
          onSave={() => {
            setIsEditModalOpen(false);
            if (onRefresh) onRefresh();
          }}
          onRefresh={() => {
            setIsEditModalOpen(false);
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
};

export default WorkOrderDetails;
