import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

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
  const [selectedDate, setSelectedDate] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dcNoticeRecords, setDCNoticeRecords] = useState<DCNoticeRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Date navigation items
  const dateItems = [
    { date: 'All', id: '' },
  ];

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
    <div className="bg-gray-950 h-full flex overflow-hidden">
      <div className="w-64 bg-gray-900 border-r border-gray-700 flex-shrink-0 flex flex-col">
        <div className="p-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-semibold text-white">DC Notice</h2>
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
      </div>

      <div className="flex-1 bg-gray-900 overflow-hidden">
        <div className="flex flex-col h-full">
          <div className="bg-gray-900 p-4 border-b border-gray-700 flex-shrink-0">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center space-x-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search DC Notice records..."
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
            <div className="h-full overflow-y-auto">
              {isLoading ? (
                <div className="px-4 py-12 text-center text-gray-400">
                  <div className="animate-pulse flex flex-col items-center">
                    <div className="h-4 w-1/3 bg-gray-700 rounded mb-4"></div>
                    <div className="h-4 w-1/2 bg-gray-700 rounded"></div>
                  </div>
                  <p className="mt-4">Loading DC Notice records...</p>
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
              ) : dcNoticeRecords.length > 0 ? (
                <div className="p-4">
                  {/* Table would go here if there were records */}
                  <p className="text-white">DC Notice records would be displayed here</p>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
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