import React, { useState, useEffect } from 'react';
import { dashboardService, DashboardCounts } from '../services/dashboardService';
import { Wifi, WifiOff, Ban } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

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
        const response = await dashboardService.getCounts();
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
    const interval = setInterval(fetchCounts, 30000);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  const chartOptions = {
    indexAxis: 'x' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
        titleColor: isDarkMode ? '#f1f5f9' : '#0f172a',
        bodyColor: isDarkMode ? '#f1f5f9' : '#0f172a',
        borderColor: isDarkMode ? '#334155' : '#e2e8f0',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 12,
        displayColors: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
          font: {
            size: 10,
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
          font: {
            size: 10,
            weight: 600,
          },
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
  };

  const getChartData = (data: { label: string; count: number }[] | undefined, primaryColor: string) => ({
    labels: data?.map(d => d.label) || [],
    datasets: [
      {
        data: data?.map(d => d.count) || [],
        backgroundColor: primaryColor,
        borderRadius: 8,
        barThickness: 24,
      },
    ],
  });

  const metricCard = (title: string, value: number | undefined, icon: React.ReactNode, iconColor: string) => (
    <div className={`relative overflow-hidden rounded-xl border p-6 transition-all duration-300 ${isDarkMode
      ? 'bg-slate-900/40 border-slate-800 backdrop-blur-md'
      : 'bg-white border-slate-200 shadow-sm'
      }`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          {title}
        </span>
        <div className={iconColor}>
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <h3 className="text-3xl font-bold tracking-tight">
          {loading && !counts ? '...' : (value ?? 0).toLocaleString()}
        </h3>
      </div>
    </div>
  );

  const statusItem = (label: string, value: number | undefined, textColor: string) => (
    <div className="flex items-center justify-between p-3 rounded-xl transition-colors hover:bg-slate-800/10 dark:hover:bg-white/5">
      <div className="flex items-center gap-3">
        <span className={`font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{label}</span>
      </div>
      <span className={`text-lg font-bold ${textColor}`}>{loading && !counts ? '...' : (value ?? 0).toLocaleString()}</span>
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center gap-3 text-[#FF4500]">
            <p className="font-medium text-sm">Unable to fetch dashboard metrics.</p>
          </div>
        )}

        {/* Top Row: Radius Monitor Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {metricCard("Online", counts?.radius_online, <Wifi size={20} />, "text-emerald-500")}
          {metricCard("Offline", counts?.radius_offline, <WifiOff size={20} />, "text-slate-500")}
          {metricCard("Blocked", counts?.radius_blocked, <Ban size={20} />, "text-red-500")}
        </div>

        {/* Middle Row: Support Monthly Summary */}
        <div className={`rounded-2xl border p-8 ${isDarkMode ? 'bg-slate-900/40 border-slate-800 backdrop-blur-xl' : 'bg-white border-slate-200 shadow-lg'}`}>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold uppercase tracking-widest text-indigo-500">Support Monthly Summary</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 min-h-[350px]">
            {/* Chart: Support Concern Analytics */}
            <div className={`rounded-xl p-6 ${isDarkMode ? 'bg-slate-950/20' : 'bg-slate-50'}`}>
              <p className="font-bold uppercase tracking-widest text-xs opacity-70 mb-6">Support Concern Analytics</p>
              <div className="h-[250px] relative">
                <Bar
                  options={chartOptions}
                  data={getChartData(counts?.monthly_support_concerns || [], 'rgba(99, 102, 241, 0.8)')}
                />
              </div>
            </div>

            {/* Chart: Repair Category Distribution */}
            <div className={`rounded-xl p-6 ${isDarkMode ? 'bg-slate-950/20' : 'bg-slate-50'}`}>
              <p className="font-bold uppercase tracking-widest text-xs opacity-70 mb-6">Repair Category distribution</p>
              <div className="h-[250px] relative">
                <Bar
                  options={chartOptions}
                  data={getChartData(counts?.monthly_repair_categories || [], 'rgba(16, 185, 129, 0.8)')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row: Detailed Statuses (Job Orders and Applications Added) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

          {/* Support Status Today */}
          <div className={`rounded-2xl border p-6 transition-transform hover:translate-y-[-4px] duration-500 ${isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200 shadow-md'}`}>
            <h3 className="font-bold uppercase tracking-widest text-xs mb-6 opacity-70">Support Status Today</h3>
            <div className="space-y-2">
              {statusItem("In Progress", counts?.support_status_in_progress, "text-blue-500")}
              {statusItem("For Visit", counts?.support_status_for_visit, "text-indigo-500")}
              {statusItem("Resolved", counts?.support_status_resolved, "text-emerald-500")}
              {statusItem("Failed", counts?.support_status_failed, "text-red-500")}
            </div>
          </div>

          {/* For Visit Today */}
          <div className={`rounded-2xl border p-6 transition-transform hover:translate-y-[-4px] duration-500 ${isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200 shadow-md'}`}>
            <h3 className="font-bold uppercase tracking-widest text-xs mb-6 opacity-70">For Visit Today</h3>
            <div className="space-y-2">
              {statusItem("In Progress", counts?.visit_status_in_progress, "text-amber-500")}
              {statusItem("Done", counts?.visit_status_done, "text-emerald-500")}
              {statusItem("Rescheduled", counts?.visit_status_rescheduled, "text-cyan-500")}
              {statusItem("Failed", counts?.visit_status_failed, "text-red-500")}
            </div>
          </div>

          {/* Job Order Onsite Status Today */}
          <div className={`rounded-2xl border p-6 transition-transform hover:translate-y-[-4px] duration-500 ${isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200 shadow-md'}`}>
            <h3 className="font-bold uppercase tracking-widest text-xs mb-6 opacity-70">Job Order Onsite Status</h3>
            <div className="space-y-2">
              {statusItem("Pending", counts?.jo_status_pending, "text-slate-500")}
              {statusItem("In Progress", counts?.jo_status_in_progress, "text-blue-500")}
              {statusItem("Done", counts?.jo_status_done, "text-emerald-500")}
              {statusItem("Failed", counts?.jo_status_failed, "text-red-500")}
            </div>
          </div>

          {/* Applications Status Today */}
          <div className={`rounded-2xl border p-6 transition-transform hover:translate-y-[-4px] duration-500 ${isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200 shadow-md'}`}>
            <h3 className="font-bold uppercase tracking-widest text-xs mb-6 opacity-70">Application Status</h3>
            <div className="space-y-1">
              {statusItem("Scheduled", counts?.app_status_scheduled, "text-indigo-500")}
              {statusItem("In Progress", counts?.app_status_in_progress, "text-blue-500")}
              {statusItem("No Facility", counts?.app_status_no_facility, "text-amber-500")}
              {statusItem("Cancelled", counts?.app_status_cancelled, "text-red-500")}
              {statusItem("No Slot", counts?.app_status_no_slot, "text-orange-500")}
              {statusItem("Duplicate", counts?.app_status_duplicate, "text-slate-500")}
            </div>
          </div>

        </div>

        {/* Floating Background Glows */}
        {isDarkMode && (
          <>
            <div className="fixed top-0 -left-64 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse" />
            <div className="fixed bottom-0 -right-64 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse duration-[5000ms]" />
          </>
        )}

      </div>
    </div>
  );
};

export default DashboardContent;
