import React, { useState, useEffect } from 'react';
import { logsService } from '../services/userService';

interface ActivityLog {
  log_id: number;
  level: 'info' | 'warning' | 'error' | 'debug';
  action: string;
  message: string;
  user_id?: number;
  target_user_id?: number;
  resource_type?: string;
  resource_id?: number;
  ip_address?: string;
  user_agent?: string;
  additional_data?: any;
  created_at: string;
  updated_at: string;
  user?: {
    user_id: number;
    username: string;
    full_name: string;
  };
  target_user?: {
    user_id: number;
    username: string;
    full_name: string;
  };
}

interface LogStats {
  total_logs: number;
  by_level: {
    info: number;
    warning: number;
    error: number;
    debug: number;
  };
  recent_actions: Array<{
    action: string;
    count: number;
  }>;
  active_users: Array<{
    user_id: number;
    activity_count: number;
    user?: {
      user_id: number;
      username: string;
      full_name: string;
    };
  }>;
}

const Logs: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showStats, setShowStats] = useState(false);

  const levelColors = {
    info: 'text-blue-400 bg-blue-900',
    warning: 'text-yellow-400 bg-yellow-900', 
    error: 'text-red-400 bg-red-900',
    debug: 'text-gray-400 bg-gray-700'
  };

  const loadLogs = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: 20,
        search: searchTerm || undefined,
        level: filterLevel !== 'all' ? filterLevel : undefined,
      };

      const response = await logsService.getLogs(params);
      if (response.success && response.data) {
        setLogs(response.data);
        if (response.pagination) {
          setCurrentPage(response.pagination.current_page);
          setTotalPages(response.pagination.last_page);
        }
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await logsService.getStats(7); // Last 7 days
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  useEffect(() => {
    loadLogs();
    loadStats();
  }, []);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (currentPage === 1) {
        loadLogs(1);
      } else {
        setCurrentPage(1);
        loadLogs(1);
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, filterLevel]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    loadLogs(newPage);
  };

  const handleExport = async () => {
    try {
      const response = await logsService.exportLogs({
        format: 'json',
        level: filterLevel !== 'all' ? filterLevel : undefined,
        days: 30
      });
      
      const blob = new Blob([JSON.stringify(response, null, 2)], {
        type: 'application/json'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `activity_logs_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="bg-gray-950 text-white">
      <div className="p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-2">
            Activity Logs
          </h2>
          <p className="text-gray-400 text-sm">
            Monitor system activities and user actions
          </p>
        </div>

        {/* Stats Section */}
        {stats && (
          <div className="mb-6">
            <button
              onClick={() => setShowStats(!showStats)}
              className="text-blue-400 hover:text-blue-300 text-sm mb-4"
            >
              {showStats ? 'Hide Statistics' : 'Show Statistics (Last 7 Days)'}
            </button>
            
            {showStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-900 p-4 rounded border border-gray-700">
                  <div className="text-2xl font-semibold text-white">{stats.total_logs}</div>
                  <div className="text-gray-400 text-sm">Total Activities</div>
                </div>
                <div className="bg-gray-900 p-4 rounded border border-gray-700">
                  <div className="text-2xl font-semibold text-red-400">{stats.by_level.error}</div>
                  <div className="text-gray-400 text-sm">Errors</div>
                </div>
                <div className="bg-gray-900 p-4 rounded border border-gray-700">
                  <div className="text-2xl font-semibold text-yellow-400">{stats.by_level.warning}</div>
                  <div className="text-gray-400 text-sm">Warnings</div>
                </div>
                <div className="bg-gray-900 p-4 rounded border border-gray-700">
                  <div className="text-2xl font-semibold text-blue-400">{stats.by_level.info}</div>
                  <div className="text-gray-400 text-sm">Info</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="flex justify-between items-center mb-8 gap-4">
          <input
            type="text"
            placeholder="Search logs by message, action, or user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-3 bg-gray-900 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 flex-1 max-w-md"
          />
          
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="px-4 py-3 bg-gray-900 border border-gray-600 rounded text-white focus:outline-none focus:border-gray-400"
          >
            <option value="all">All Levels</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="debug">Debug</option>
          </select>

          <button 
            onClick={handleExport}
            className="px-6 py-3 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            Export Logs
          </button>
        </div>

        {/* Logs Table */}
        <div className="bg-gray-900 rounded border border-gray-700 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">
              Loading logs...
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-700">
                      <th className="px-4 py-4 text-left text-sm font-medium text-gray-300 border-b border-gray-600">Time</th>
                      <th className="px-4 py-4 text-left text-sm font-medium text-gray-300 border-b border-gray-600">Level</th>
                      <th className="px-4 py-4 text-left text-sm font-medium text-gray-300 border-b border-gray-600">Action</th>
                      <th className="px-4 py-4 text-left text-sm font-medium text-gray-300 border-b border-gray-600">User</th>
                      <th className="px-4 py-4 text-left text-sm font-medium text-gray-300 border-b border-gray-600">Message</th>
                      <th className="px-4 py-4 text-left text-sm font-medium text-gray-300 border-b border-gray-600">IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                          No logs found
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log.log_id} className="border-b border-gray-700 hover:bg-gray-750">
                          <td className="px-4 py-4 text-sm text-gray-300">
                            {formatDate(log.created_at)}
                          </td>
                          <td className="px-4 py-4 text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${levelColors[log.level]}`}>
                              {log.level.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-white">
                            {formatAction(log.action)}
                          </td>
                          <td className="px-4 py-4 text-sm text-white">
                            {log.user ? log.user.username : 'System'}
                          </td>
                          <td className="px-4 py-4 text-sm text-white max-w-md truncate">
                            {log.message}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-300">
                            {log.ip_address || '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 bg-gray-800 border-t border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-400">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-sm bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 text-sm bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Logs;
