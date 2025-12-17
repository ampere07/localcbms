import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { settingsColorPaletteService, ColorPalette } from '../services/settingsColorPaletteService';

interface DateItem {
  date: string;
  id: string;
}

interface DCNoticeRecord {
  id: string;
  noticeDate: string;
  dueDate: string;
  accountNo: string;
  fullName: string;
  contactNumber: string;
  emailAddress: string;
  address: string;
  plan: string;
  noticeNo?: string;
  noticeStatus: string;
  outstandingBalance: number;
  daysOutstanding: number;
  disconnectionDate?: string;
}

const DCNotice: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dcNoticeRecords, setDCNoticeRecords] = useState<DCNoticeRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [colorPalette, setColorPalette] = useState<ColorPalette | null>(null);

  // Date navigation items
  const dateItems = [
    { date: 'All', id: '' },
  ];

  useEffect(() => {
    const checkDarkMode = () => {
      const theme = localStorage.getItem('theme');
      setIsDarkMode(theme === 'dark' || theme === null);
    };

    checkDarkMode();

    const observer = new MutationObserver(() => {
      checkDarkMode();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

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

  // Fetch DC Notice data
  useEffect(() => {
    const fetchDCNoticeData = async () => {
      try {
        setIsLoading(true);
        
        // In a real implementation, this would fetch from an API
        // For now, we'll simulate loading
        setTimeout(() => {
          // For now, set empty array as per the screenshot showing "No items"
          setDCNoticeRecords([]);
          setError(null);
          setIsLoading(false);
        }, 1000);
      } catch (err) {
        console.error('Failed to fetch DC Notice records:', err);
        setError('Failed to load DC Notice records. Please try again.');
        setDCNoticeRecords([]);
        setIsLoading(false);
      }
    };
    
    fetchDCNoticeData();
  }, []);

  const handleRefresh = async () => {
    // In a real implementation, this would re-fetch from the API
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className={`h-full flex overflow-hidden ${
      isDarkMode ? 'bg-gray-950' : 'bg-gray-50'
    }`}>
      <div className={`w-64 border-r flex-shrink-0 flex flex-col ${
        isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className={`p-4 border-b flex-shrink-0 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <h2 className={`text-lg font-semibold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>DC Notice</h2>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {dateItems.map((item, index) => (
            <button
              key={index}
              onClick={() => setSelectedDate(item.date)}
              className={`w-full flex items-center px-4 py-3 text-sm transition-colors ${
                isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
              } ${
                selectedDate === item.date
                  ? ''
                  : isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}
              style={selectedDate === item.date ? {
                backgroundColor: colorPalette?.primary ? `${colorPalette.primary}33` : 'rgba(249, 115, 22, 0.2)',
                color: colorPalette?.primary || '#fb923c'
              } : {}}
            >
              <span className="text-sm font-medium flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                {item.date}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className={`flex-1 overflow-hidden ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="flex flex-col h-full">
          <div className={`p-4 border-b flex-shrink-0 ${
            isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="flex flex-col space-y-3">
              <div className="flex items-center space-x-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search DC Notice records..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full rounded pl-10 pr-4 py-2 focus:outline-none focus:ring-1 focus:border ${
                      isDarkMode
                        ? 'bg-gray-800 text-white border border-gray-700'
                        : 'bg-white text-gray-900 border border-gray-300'
                    }`}
                    style={{
                      '--tw-ring-color': colorPalette?.primary || '#ea580c'
                    } as React.CSSProperties}
                    onFocus={(e) => {
                      if (colorPalette?.primary) {
                        e.currentTarget.style.borderColor = colorPalette.primary;
                      }
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = isDarkMode ? '#374151' : '#d1d5db';
                    }}
                  />
                  <Search className={`absolute left-3 top-2.5 h-4 w-4 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="text-white px-4 py-2 rounded text-sm transition-colors disabled:bg-gray-600"
                  style={{
                    backgroundColor: isLoading ? '#4b5563' : (colorPalette?.primary || '#ea580c')
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading && colorPalette?.accent) {
                      e.currentTarget.style.backgroundColor = colorPalette.accent;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading && colorPalette?.primary) {
                      e.currentTarget.style.backgroundColor = colorPalette.primary;
                    }
                  }}
                >
                  {isLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto">
              {isLoading ? (
                <div className={`px-4 py-12 text-center ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <div className="animate-pulse flex flex-col items-center">
                    <div className={`h-4 w-1/3 rounded mb-4 ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
                    }`}></div>
                    <div className={`h-4 w-1/2 rounded ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
                    }`}></div>
                  </div>
                  <p className="mt-4">Loading DC Notice records...</p>
                </div>
              ) : error ? (
                <div className={`px-4 py-12 text-center ${
                  isDarkMode ? 'text-red-400' : 'text-red-600'
                }`}>
                  <p>{error}</p>
                  <button 
                    onClick={handleRefresh}
                    className={`mt-4 px-4 py-2 rounded ${
                      isDarkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                    }`}>
                    Retry
                  </button>
                </div>
              ) : dcNoticeRecords.length > 0 ? (
                <div className="p-4">
                  {/* Table would go here if there were records */}
                  <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>DC Notice records would be displayed here</p>
                </div>
              ) : (
                <div className={`h-full flex items-center justify-center ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  No items
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DCNotice;