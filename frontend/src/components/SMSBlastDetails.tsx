import React, { useState, useEffect, useRef } from 'react';
import { Edit, X } from 'lucide-react';
import { settingsColorPaletteService, ColorPalette } from '../services/settingsColorPaletteService';

interface SMSBlastRecord {
  id?: string;
  title?: string;
  message: string;
  billing_day?: number | null;
  message_count?: number | null;
  credit_used?: string | null;
  modifiedDate: string;
  modifiedEmail: string;
  userEmail?: string;
  recipients?: number;
  status?: string;
  sentDate?: string;
  sentTime?: string;
  createdBy?: string;
  createdDate?: string;
  messageType?: string;
  isBulk?: boolean;
  isCritical?: boolean;
  targetGroup?: string;
  deliveryStatus?: string;
  deliveryRate?: number;
  failedCount?: number;
  remarks?: string;
  barangay?: string;
  city?: string;
  target_name?: string;
  target_type?: string;
}

interface SMSBlastDetailsProps {
  smsBlastRecord: SMSBlastRecord;
  onClose: () => void;
  isMobile?: boolean;
}

const SMSBlastDetails: React.FC<SMSBlastDetailsProps> = ({ smsBlastRecord, onClose, isMobile = false }) => {
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') === 'dark');
  const [colorPalette, setColorPalette] = useState<ColorPalette | null>(null);
  const [detailsWidth, setDetailsWidth] = useState<number>(600);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(localStorage.getItem('theme') === 'dark');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchColorPalette = async () => {
      try {
        const activePalette = await settingsColorPaletteService.getActive();
        setColorPalette(activePalette);
      } catch (err) {
        console.error('Failed to fetch color palette:', err);
      }
    };
    fetchColorPalette();
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const diff = startXRef.current - e.clientX;
      const newWidth = Math.max(400, Math.min(1000, startWidthRef.current + diff));
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

  const renderField = (label: string, value: any) => {
    if (value === null || value === undefined || value === '') return null;

    return (
      <div className={`flex border-b pb-4 ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className={`w-40 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{label}:</div>
        <div className={`flex-1 text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'} break-words whitespace-pre-wrap`}>
          {value}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`h-full flex relative ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}
      style={{ width: isMobile ? '100%' : `${detailsWidth}px` }}
    >
      {!isMobile && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-50 transition-colors"
          onMouseDown={handleMouseDownResize}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colorPalette?.primary || '#ea580c';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '';
          }}
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className={`px-4 py-3 flex items-center justify-between border-b ${isDarkMode
          ? 'bg-gray-800 border-gray-700'
          : 'bg-gray-100 border-gray-200'
          }`}>
          <h1 className={`text-lg font-semibold truncate pr-4 min-w-0 flex-1 ${isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
            {smsBlastRecord.target_name && smsBlastRecord.target_name !== 'N/A'
              ? `${smsBlastRecord.target_name} (${smsBlastRecord.target_type})`
              : (smsBlastRecord.title || "SMS BLAST LOG")}
          </h1>
          <div className="flex items-center space-x-3 flex-shrink-0">
            <button
              className="px-3 py-1 text-white rounded text-sm transition-colors flex items-center space-x-1"
              style={{
                backgroundColor: colorPalette?.primary || '#ea580c'
              }}
              onMouseEnter={(e) => {
                if (colorPalette?.accent) {
                  e.currentTarget.style.backgroundColor = colorPalette.accent;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colorPalette?.primary || '#ea580c';
              }}
            >
              <Edit size={16} />
              <span>Edit</span>
            </button>



            <button
              onClick={onClose}
              className={`p-1 rounded transition-colors ${isDarkMode
                ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className={`max-w-2xl mx-auto py-6 px-4 ${isDarkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
            <div className="space-y-4">
              {renderField('Message', smsBlastRecord.message)}
              {renderField('Target Name', smsBlastRecord.target_name)}
              {renderField('Target Type', smsBlastRecord.target_type)}
              {renderField('Barangay', smsBlastRecord.barangay)}
              {renderField('City', smsBlastRecord.city)}
              {renderField('Billing Day', smsBlastRecord.billing_day)}
              {renderField('Recipient Count', smsBlastRecord.message_count)}
              {renderField('Credit Used', smsBlastRecord.credit_used)}
              {renderField('Modified Date', smsBlastRecord.modifiedDate)}
              {renderField('Modified Email', smsBlastRecord.modifiedEmail)}
              {renderField('Created By', smsBlastRecord.userEmail)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SMSBlastDetails;