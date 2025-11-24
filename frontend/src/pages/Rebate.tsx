import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import RebateFormModal from '../modals/RebateFormModal';
import apiClient from '../config/api';

interface RebateRecord {
  id: number;
  number_of_dates: number;
  rebate_type: string;
  selected_rebate: string;
  month: string;
  status: string;
  modified_by: string;
  modified_date: string;
}

const Rebate: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [rebateRecords, setRebateRecords] = useState<RebateRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [sidebarWidth, setSidebarWidth] = useState<number>(256);
  const [isResizingSidebar, setIsResizingSidebar] = useState<boolean>(false);
  const sidebarStartXRef = useRef<number>(0);
  const sidebarStartWidthRef = useRef<number>(0);

  const dateItems = [
    { date: 'All', id: '' },
  ];

  useEffect(() => {
    fetchRebateData();
  }, []);

  const fetchRebateData = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<RebateRecord[]>('/rebates');
      console.log('Rebate API response:', response.data);
      setRebateRecords(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch Rebate records:', err);
      setError('Failed to load Rebate records. Please try again.');
      setRebateRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchRebateData();
  };

  const filteredRecords = rebateRecords.filter(record => {
    const matchesSearch = searchQuery === '' || 
      record.selected_rebate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.rebate_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.month.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  useEffect(() => {
    if (!isResizingSidebar) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingSidebar) return;
      
      const diff = e.clientX - sidebarStartXRef.current;
      const newWidth = Math.max(200, Math.min(500, sidebarStartWidthRef.current + diff));
      
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizingSidebar(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingSidebar]);

  const handleMouseDownSidebarResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingSidebar(true);
    sidebarStartXRef.current = e.clientX;
    sidebarStartWidthRef.current = sidebarWidth;
  };

  return (
    <div className="bg-gray-950 h-full flex overflow-hidden">
      <div className="bg-gray-900 border-r border-gray-700 flex-shrink-0 flex flex-col relative" style={{ width: `${sidebarWidth}px` }}>
        <div className="p-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-semibold text-white">Rebates</h2>
            <div>
              <button 
                className="flex items-center space-x-1 bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm"
                onClick={() => setIsModalOpen(true)}
              >
                <span className="font-bold">+</span>
                <span>Add</span>
              </button>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {dateItems.map((item, index) => (
            <button
              key={index}
              onClick={() => setSelectedDate(item.date)}
              className={`w-full flex items-center px-4 py-3 text-sm transition-colors hover:bg-gray-800 ${
                selectedDate === item.date
                  ? 'bg-orange-500 bg-opacity-20 text-orange-400'
                  : 'text-gray-300'
              }`}
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

        {/* Resize Handle */}
        <div
          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-orange-500 transition-colors z-10"
          onMouseDown={handleMouseDownSidebarResize}
        />
      </div>

      <div className="bg-gray-900 overflow-hidden flex-1">
        <div className="flex flex-col h-full">
          <div className="bg-gray-900 p-4 border-b border-gray-700 flex-shrink-0">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center space-x-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search Rebate records..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded pl-10 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white px-4 py-2 rounded text-sm transition-colors"
                >
                  {isLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-x-auto overflow-y-auto pb-4">
              {isLoading ? (
                <div className="px-4 py-12 text-center text-gray-400">
                  <div className="animate-pulse flex flex-col items-center">
                    <div className="h-4 w-1/3 bg-gray-700 rounded mb-4"></div>
                    <div className="h-4 w-1/2 bg-gray-700 rounded"></div>
                  </div>
                  <p className="mt-4">Loading Rebate records...</p>
                </div>
              ) : error ? (
                <div className="px-4 py-12 text-center text-red-400">
                  <p>{error}</p>
                  <button 
                    onClick={handleRefresh}
                    className="mt-4 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded">
                    Retry
                  </button>
                </div>
              ) : filteredRecords.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-700 text-sm">
                  <thead className="bg-gray-800 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Rebate Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Selected Rebate</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Month</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Number of Dates</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Modified By</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Modified Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-900 divide-y divide-gray-800">
                    {filteredRecords.map((record) => (
                      <tr 
                        key={record.id}
                        className="hover:bg-gray-800 cursor-pointer"
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">{record.id}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300 capitalize">{record.rebate_type}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">{record.selected_rebate}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">{record.month}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">{record.number_of_dates}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">{record.status}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">{record.modified_by}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">{record.modified_date || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <h1 className="text-orange-500 text-2xl mb-4">Rebate Component</h1>
                  <p className="text-lg">No Rebate records found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <RebateFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={() => {
          setIsModalOpen(false);
          handleRefresh();
        }}
      />
    </div>
  );
};

export default Rebate;
