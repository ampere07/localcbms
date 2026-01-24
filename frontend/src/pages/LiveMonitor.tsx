import React, { useState, useEffect, useRef } from 'react';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface WidgetConfig {
  title: string;
  w: number;
  h: number;
  type: 'chart' | 'stat';
  api: string;
  param: string;
  hasFilters?: boolean;
  filterType?: string;
}

interface WidgetData {
  label: string;
  value: number;
  series?: Record<string, number>;
}

const LiveMonitor: React.FC = () => {
  const [widgets, setWidgets] = useState<Record<string, any>>({});
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');
  const refreshInterval = useRef<NodeJS.Timeout | null>(null);

  const widgetConfigs: Record<string, WidgetConfig> = {
    billing_stat: { title: 'Billing Status', w: 4, h: 4, type: 'chart', api: 'billing_status', param: 'status' },
    online_stat: { title: 'Online Status', w: 4, h: 4, type: 'chart', api: 'online_status', param: 'status' },
    app_mon: { title: 'Application Status', w: 4, h: 4, type: 'chart', api: 'app_status', param: 'status', hasFilters: true, filterType: 'date_bgy' },
    jo_queue: { title: 'JO Queue', w: 4, h: 5, type: 'chart', api: 'queue_mon', param: 'jo', hasFilters: true, filterType: 'toggle_today' },
    so_queue: { title: 'SO Queue', w: 4, h: 5, type: 'chart', api: 'queue_mon', param: 'so', hasFilters: true, filterType: 'toggle_today' }
  };

  useEffect(() => {
    const theme = localStorage.getItem('theme');
    setIsDarkMode(theme === 'dark' || theme === null);
    
    fetchAllWidgets();
    refreshInterval.current = setInterval(fetchAllWidgets, 15000);

    return () => {
      if (refreshInterval.current) clearInterval(refreshInterval.current);
    };
  }, []);

  const fetchAllWidgets = async () => {
    const timestamp = new Date().toLocaleTimeString();
    setLastUpdate(timestamp);

    for (const [id, config] of Object.entries(widgetConfigs)) {
      try {
        const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';
        const response = await fetch(`${baseUrl}/monitor/${config.api}?param=${config.param}`);
        const data = await response.json();
        
        if (data.status === 'success' && data.data) {
          setWidgets(prev => ({ ...prev, [id]: { config, data: data.data } }));
        }
      } catch (error) {
        console.error(`Error fetching ${id}:`, error);
      }
    }
  };

  const generateChartData = (widgetData: WidgetData[], type: string = 'bar') => {
    const colors = [
      '#0d6efd', '#6610f2', '#6f42c1', '#d63384', '#dc3545',
      '#fd7e14', '#ffc107', '#198754', '#20c997', '#0dcaf0'
    ];

    if (!widgetData || widgetData.length === 0) {
      return null;
    }

    if (widgetData[0].series) {
      const labels = widgetData.map(d => d.label);
      const seriesKeys = Array.from(new Set(widgetData.flatMap(d => Object.keys(d.series || {}))));
      
      return {
        labels,
        datasets: seriesKeys.map((key, idx) => ({
          label: key,
          data: widgetData.map(d => d.series?.[key] || 0),
          backgroundColor: colors[idx % colors.length],
          borderWidth: 0
        }))
      };
    }

    return {
      labels: widgetData.map(d => d.label),
      datasets: [{
        label: 'Count',
        data: widgetData.map(d => d.value),
        backgroundColor: widgetData.map((_, idx) => colors[idx % colors.length]),
        borderWidth: 0
      }]
    };
  };

  const chartOptions: ChartOptions<any> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: isDarkMode ? '#999' : '#333',
          boxWidth: 12
        }
      }
    },
    scales: {
      x: {
        stacked: true,
        ticks: { color: isDarkMode ? '#999' : '#333' },
        grid: { color: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }
      },
      y: {
        stacked: true,
        ticks: { color: isDarkMode ? '#999' : '#333' },
        grid: { color: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }
      }
    }
  };

  const renderWidget = (id: string) => {
    const widget = widgets[id];
    if (!widget || !widget.data) {
      return (
        <div className={`text-center py-8 text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          Loading...
        </div>
      );
    }

    const chartData = generateChartData(widget.data);
    if (!chartData) {
      return (
        <div className={`text-center py-8 text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          No Data
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 min-h-0">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className={`sticky top-0 z-50 border-b ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <i className="fas fa-satellite-dish"></i>
              Live Monitor
            </h1>
            <span className="text-xs uppercase tracking-wider text-gray-500">Powered by: SYNC</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              Updated: <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>{lastUpdate}</span>
            </div>
            
            <button
              onClick={() => {
                const newTheme = !isDarkMode;
                setIsDarkMode(newTheme);
                localStorage.setItem('theme', newTheme ? 'dark' : 'light');
                document.documentElement.classList.toggle('dark', newTheme);
              }}
              className={`p-2 rounded ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
            >
              <i className={`fas fa-${isDarkMode ? 'sun' : 'moon'}`}></i>
            </button>

            <button
              onClick={fetchAllWidgets}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm"
            >
              <i className="fas fa-sync-alt mr-2"></i>
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(widgetConfigs).map(([id, config]) => (
            <div
              key={id}
              className={`rounded-lg border-l-4 border-blue-600 shadow-lg ${
                isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
              }`}
            >
              <div className="p-4">
                <h3 className="text-lg font-bold mb-4 text-blue-600">
                  {config.title}
                </h3>
                <div className="h-64">
                  {renderWidget(id)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LiveMonitor;
