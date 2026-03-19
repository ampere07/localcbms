import React, { useState, useEffect } from 'react';
import {
  TrendingUp, Users, Globe, Wifi, Ticket, Receipt, Cpu, HardDrive,
  Activity, ArrowUpRight, MoreVertical, Plus, UserPlus, FilePlus,
  CheckSquare, Send, Radio, HardDrive as HardwareIcon, List,
  Settings, Grid, ChevronDown, Monitor, CreditCard, PieChart
} from 'lucide-react';
import { settingsColorPaletteService, ColorPalette } from '../services/settingsColorPaletteService';

const DashboardContent: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [colorPalette, setColorPalette] = useState<ColorPalette | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>('connected');

  useEffect(() => {
    const checkDarkMode = () => {
      const theme = localStorage.getItem('theme');
      setIsDarkMode(theme === 'dark' || theme === null);
    };

    const fetchColorPalette = async () => {
      try {
        const activePalette = await settingsColorPaletteService.getActive();
        setColorPalette(activePalette);
      } catch (err) {
        console.error('Failed to fetch color palette:', err);
      }
    };

    checkDarkMode();
    fetchColorPalette();

    const observer = new MutationObserver(() => {
      checkDarkMode();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  const toggleSection = (id: string) => {
    setActiveSectionId(prev => (prev === id ? null : id));
  };

  const statCards = [
    { title: "Online customers", count: 5, color: "#10b981", icon: Wifi },
    { title: "New customers", count: 10, color: "#3b82f6", icon: UserPlus },
    { title: "New & open tickets", count: 5, color: "#f59e0b", icon: Ticket },
    { title: "Devices down", count: 2, color: "#ef4444", icon: Activity }
  ];

  const shortcuts = [
    { label: "Add customer", icon: UserPlus },
    { label: "Add lead", icon: TrendingUp },
    { label: "Add ticket", icon: FilePlus },
    { label: "Add task", icon: CheckSquare },
    { label: "Send message", icon: Send },
    { label: "Add router", icon: Radio },
    { label: "Add hardware", icon: HardwareIcon },
    { label: "Add internet tariff plan", icon: List },
    { label: "Configure the system", icon: Settings },
    { label: "Configure modules", icon: Grid }
  ];

  const sections = [
    { id: 'connected', title: "Connected customers (active + blocked)", icon: Users, fullWidth: true },
    { id: 'system', title: "System status", icon: Monitor },
    { id: 'customers', title: "Customers", icon: Users },
    { id: 'networking', title: "Networking", icon: Globe },
    { id: 'finance', title: "Finance", icon: CreditCard },
    { id: 'leads', title: "Leads", icon: TrendingUp },
    { id: 'tickets', title: "Tickets", icon: Ticket }
  ];

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#0a0a0c]' : 'bg-[#f4f7fa]'} p-4 md:p-6 pb-20`}>
      <div className="max-w-[1600px] mx-auto space-y-6">

        {/* Page Title */}
        <div className="flex items-center gap-3 mb-2">
          <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Dashboard</h1>
        </div>

        {/* 1. Stat Cards Top Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, i) => (
            <div key={i} className={`p-4 rounded-xl border flex flex-col justify-between h-28 relative ${isDarkMode ? 'bg-gray-900/40 border-gray-800' : 'bg-white border-gray-200'
              }`}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <card.icon size={16} style={{ color: card.color }} />
                  <span className={`text-xs font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-800'}`}>
                    {card.title}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-end">
                <button className="text-[10px] font-bold uppercase tracking-wider text-blue-500 hover:text-blue-400 transition-colors">
                  View
                </button>
                <span className="text-3xl font-black leading-none" style={{ color: card.color }}>
                  {card.count}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* 2. Welcome Banner */}
        <div className={`p-5 rounded-lg border-l-4 ${isDarkMode
            ? 'bg-[#2a241a] border-[#d97706] text-[#fde68a]'
            : 'bg-[#fffbeb] border-[#f59e0b] text-[#92400e]'
          }`}>
          <h3 className="text-sm font-bold mb-2">Welcome to Local CBMS Framework</h3>
          <p className="text-xs leading-relaxed opacity-90">
            Some features are disabled in this demo version; for example billing automation for some specific accounts...<br />
            To get full access on your own server, please contact support. All demo data is restored periodically.
          </p>
        </div>

        {/* 3. Shortcuts Bar */}
        <div className={`p-4 rounded-xl border relative ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
              Shortcuts
            </h3>
            <button className={`${isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-700'}`}>
              <ArrowUpRight size={16} />
            </button>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-4">
            {shortcuts.map((s, i) => (
              <button key={i} className="flex items-center gap-1.5 group">
                <s.icon size={15} style={{ color: colorPalette?.primary || '#3b82f6' }} className="transition-transform group-hover:scale-110" />
                <span className={`text-[11px] font-semibold ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
                  }`}>
                  {s.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 4. Category Sections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          {sections.map((section) => (
            <div
              key={section.id}
              className={`rounded-xl border flex flex-col ${section.fullWidth ? 'lg:col-span-2' : ''} ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
                }`}
            >
              <button
                onClick={() => toggleSection(section.id)}
                className={`p-4 flex items-center justify-between w-full hover:bg-black/5 transition-colors rounded-t-xl group ${
                  activeSectionId === section.id ? 'border-b border-gray-800' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <section.icon size={18} style={{ color: colorPalette?.primary || '#3b82f6' }} />
                  <span className={`text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                    {section.title}
                  </span>
                </div>
                <ChevronDown
                  size={18}
                  className={`text-gray-500 transition-transform duration-300 ${activeSectionId === section.id ? 'rotate-180' : 'rotate-0'}`}
                />
              </button>

              {activeSectionId === section.id && (
                <div className="p-0 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className={`divide-y ${isDarkMode ? 'divide-gray-800' : 'divide-gray-100'}`}>
                    {section.id === 'system' && (
                      <div className="p-4 space-y-3">
                        {[
                          { label: 'CPU cores', value: '4' },
                          { label: 'Load average (1, 5, 15 min)', value: '1.27, 1.21, 1.14' },
                          { label: 'CPU usage', value: '25.31 %', isProgress: true, progressColor: '#f59e0b', percent: 25.31 },
                          { label: 'Memory: 3.73 GB (Free 25.84 %)', isProgress: true, isUsedFree: true, used: 74.16, free: 25.84 },
                          { label: 'I/O wait', value: '0.00 %', isProgress: true, progressColor: '#3b82f6', percent: 0 },
                          { label: 'Swap: 3.73 GB (Free 54.89 %)', isProgress: true, isUsedFree: true, used: 45.11, free: 54.89 },
                          { label: 'Disk: 19.52 GB (Free 26.89 %)', isProgress: true, isUsedFree: true, used: 73.11, free: 26.89 },
                          { label: 'Last DB backup', value: '19 minutes ago (146.81 KB)' },
                          { label: 'Last remote backup', value: 'Never', valueColor: '#ef4444' },
                        ].map((row, i) => (
                          <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2 last:border-0">
                            <span className={`text-[11px] font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{row.label}</span>
                            {row.isProgress ? (
                              <div className="flex items-center gap-3 w-full sm:w-1/2">
                                <div className={`flex-1 h-3 rounded overflow-hidden flex ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                                  {row.isUsedFree ? (
                                    <>
                                      <div className="bg-[#f59e0b] h-full flex items-center justify-center text-[8px] text-white font-bold" style={{ width: `${row.used}%` }}>Used</div>
                                      <div className="bg-[#10b981] h-full flex items-center justify-center text-[8px] text-white font-bold" style={{ width: `${row.free}%` }}>Free</div>
                                    </>
                                  ) : (
                                    <div className="h-full" style={{ width: `${row.percent}%`, backgroundColor: row.progressColor || '#3b82f6' }} />
                                  )}
                                </div>
                                {!row.isUsedFree && <span className={`text-[11px] font-black min-w-[45px] text-right ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{row.value}</span>}
                              </div>
                            ) : (
                              <span className={`text-[11px] font-bold ${row.valueColor ? '' : (isDarkMode ? 'text-white' : 'text-gray-900')}`} style={{ color: row.valueColor }}>{row.value}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {section.id === 'customers' && (
                      <div className="p-4 space-y-2">
                        {[
                          { label: 'Service Order Support Status - In Progress', value: '0' },
                          { label: 'Service Order For Visit - In Progress', value: '0' },
                          { label: 'Service Order For Visit Pullout - In Progress', value: '0' },
                          { label: 'Application Pending', value: '0' },
                          { label: 'Job Order In Progress', value: '0' },
                          { label: 'Online', value: '0' },
                          { label: 'Offline', value: '0' },
                          { label: 'Blocked', value: '0' },
                        ].map((row, i) => (
                          <div key={i} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0">
                            <span className={`text-[11px] font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{row.label}</span>
                            <span className={`text-[11px] font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{row.value}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {section.id === 'networking' && (
                      <div className="p-4 space-y-2">
                        {[
                          { label: 'Routers', value: '2' },
                          { label: 'Monitoring devices', value: '3' },
                          { label: 'Devices down (SNMP)', value: '2' },
                          { label: 'Devices down (Ping)', value: '1' },
                          { label: 'IPv4 networks', value: '2' },
                          { label: 'Total private addresses', value: '508' },
                          { label: 'Private addresses used', value: '3' },
                          { label: 'Total public addresses', value: '0' },
                          { label: 'Public addresses used', value: '0' },
                        ].map((row, i) => (
                          <div key={i} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0">
                            <span className={`text-[11px] font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{row.label}</span>
                            <span className={`text-[11px] font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{row.value}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {section.id === 'finance' && (
                      <div className="p-4 space-y-4">
                        <div>
                          <h4 className="text-[10px] font-bold text-[#10b981] uppercase tracking-wider mb-2">Current month</h4>
                          <div className="space-y-2">
                            {[
                              { label: 'Payments', value: '7 (29100.00 $)' },
                              { label: 'Paid invoices', value: '7 (29100.00 $)' },
                              { label: 'Unpaid invoices', value: '3 (3600.00 $)' },
                              { label: 'Credit notes', value: '0 (0.00 $)' },
                            ].map((row, i) => (
                              <div key={i} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0">
                                <span className={`text-[11px] font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{row.label}</span>
                                <span className={`text-[11px] font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{row.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-[10px] font-bold text-[#f59e0b] uppercase tracking-wider mb-2">Last month</h4>
                          <div className="space-y-2">
                            {[
                              { label: 'Payments', value: '0 (0.00 $)' },
                              { label: 'Paid invoices', value: '0 (0.00 $)' },
                              { label: 'Unpaid invoices', value: '0 (0.00 $)' },
                              { label: 'Credit notes', value: '0 (0.00 $)' },
                            ].map((row, i) => (
                              <div key={i} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0">
                                <span className={`text-[11px] font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{row.label}</span>
                                <span className={`text-[11px] font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{row.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {section.id === 'leads' && (
                      <div className="p-4 space-y-2">
                        {[
                          { label: 'Tasks for today', value: '0' },
                          { label: 'New leads', value: '1' },
                          { label: 'Active leads', value: '1' },
                          { label: 'Deals', value: '0' },
                        ].map((row, i) => (
                          <div key={i} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0">
                            <span className={`text-[11px] font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{row.label}</span>
                            <span className={`text-[11px] font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{row.value}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {section.id === 'tickets' && (
                      <div className="p-4 space-y-2">
                        {[
                          { label: 'New', value: '0' },
                          { label: 'Work in progress', value: '1' },
                          { label: 'Resolved', value: '5' },
                          { label: 'Waiting on agent', value: '2' },
                        ].map((row, i) => (
                          <div key={i} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0">
                            <span className={`text-[11px] font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{row.label}</span>
                            <span className={`text-[11px] font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{row.value}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {section.id === 'connected' && (
                      <div className="p-6">
                        <div className={`p-10 border border-dashed rounded-lg flex flex-col items-center justify-center gap-2 ${isDarkMode ? 'bg-black/20 border-gray-800' : 'bg-gray-50 border-gray-200'
                          }`}>
                          <PieChart size={24} className={isDarkMode ? 'text-gray-700' : 'text-gray-300'} />
                          <span className={`text-xs ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                            No {section.title.toLowerCase()} data available yet.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default DashboardContent;
