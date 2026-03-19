import React, { useState, useEffect } from 'react';
import { monitorService, DashboardCounts } from '../services/monitorService';

const DashboardContent: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [counts, setCounts] = useState<DashboardCounts | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

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

    const fetchCounts = async () => {
      try {
        setLoading(true);
        const response = await monitorService.getDashboardCounts();
        if (response.status === 'success') {
          setCounts(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard counts:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
    // Refresh every 30 seconds
    const interval = setInterval(fetchCounts, 30000);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  const stats = [
    {
      label: "Service Order Support Status - In Progress Count",
      value: counts?.so_support_in_progress ?? 0,
      color: "blue"
    },
    {
      label: "Service Order For Visit - In Progress Count",
      value: counts?.so_visit_in_progress ?? 0,
      color: "indigo"
    },
    {
      label: "Service Order For Visit Pullout - In Progress Count",
      value: counts?.so_visit_pullout_in_progress ?? 0,
      color: "rose"
    },
    {
      label: "Application Pending Count",
      value: counts?.app_pending ?? 0,
      color: "amber"
    },
    {
      label: "Job Order In Progress Count",
      value: counts?.jo_in_progress ?? 0,
      color: "emerald"
    },
    {
      label: "Online Count",
      value: counts?.radius_online ?? 0,
      color: "cyan"
    },
    {
      label: "Offline Count",
      value: counts?.radius_offline ?? 0,
      color: "gray"
    },
    {
      label: "Blocked Count",
      value: counts?.radius_blocked ?? 0,
      color: "red"
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: isDarkMode ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-200',
      indigo: isDarkMode ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border-indigo-200',
      rose: isDarkMode ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-600 border-rose-200',
      amber: isDarkMode ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-600 border-amber-200',
      emerald: isDarkMode ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200',
      cyan: isDarkMode ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-cyan-50 text-cyan-600 border-cyan-200',
      gray: isDarkMode ? 'bg-gray-500/10 text-gray-400 border-gray-500/20' : 'bg-gray-50 text-gray-600 border-gray-200',
      red: isDarkMode ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-red-50 text-red-600 border-red-200',
    };
    return colorMap[color] || '';
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
      }`}>
      <div className="p-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-3xl font-bold tracking-tight">System Metrics</h2>
            </div>
          </div>
          {loading && !counts && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 text-indigo-400 text-sm font-medium">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <span>Initial loading...</span>
            </div>
          )}
        </div>

        {error && (
          <p>Unable to fetch latest metrics. Please check your connection.</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stats.map((stat, i) => {
            const colors = getColorClasses(stat.color);
            return (
              <div
                key={i}
                className={`relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 ${isDarkMode
                    ? 'bg-slate-900/50 border-slate-800'
                    : 'bg-white border-slate-200 shadow-sm'
                  }`}
              >
                {/* Decorative Background Gradient */}
                <div className={`absolute -right-4 -top-4 h-32 w-32 rounded-full opacity-10 ${colors.split(' ')[0]}`} />

                <div className="relative z-10">
                  <div className="space-y-2">
                    <p className={`text-sm font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                      {stat.label.replace(' Count', '')}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-sm font-medium tracking-tight">
                        {loading && !counts ? '...' : stat.value.toLocaleString()}
                      </h3>
                      <span className="text-sm font-medium opacity-50 capitalize">
                        total records
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress-like decorative bar */}
                <div className="absolute bottom-0 left-0 h-1.5 w-full bg-slate-800/10 overflow-hidden">
                  <div
                    className={`h-full opacity-40 transition-all duration-1000 ease-out ${colors.split(' ')[0]}`}
                    style={{ width: loading ? '0%' : '100%' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;
