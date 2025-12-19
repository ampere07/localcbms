import React, { useState, useEffect, useRef } from 'react';
import { Bell, RefreshCw } from 'lucide-react';
import { systemConfigService } from '../services/systemConfigService';
import { notificationService, type Notification as AppNotification } from '../services/notificationService';

interface HeaderProps {
  onToggleSidebar?: () => void;
  onSearch?: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onSearch }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const url = await systemConfigService.getLogo();
        setLogoUrl(url);
      } catch (error) {
        console.error('Failed to load logo:', error);
      }
    };

    loadLogo();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'logoUpdated') {
        loadLogo();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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
    const fetchInitialData = async () => {
      try {
        const count = await notificationService.getUnreadCount();
        setUnreadCount(count);
        
        const data = await notificationService.getRecentApplications(10);
        setNotifications(data);
      } catch (error) {
        console.error('Failed to fetch initial notifications:', error);
      }
    };

    fetchInitialData();

    const interval = setInterval(async () => {
      try {
        const count = await notificationService.getUnreadCount();
        setUnreadCount(count);
        
        const data = await notificationService.getRecentApplications(10);
        setNotifications(data);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const handleToggleClick = () => {
    if (onToggleSidebar) {
      onToggleSidebar();
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const toggleNotifications = async () => {
    setShowNotifications(!showNotifications);
    
    if (!showNotifications) {
      setLoading(true);
      try {
        const data = await notificationService.getRecentApplications(10);
        setNotifications(data);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <header className={`${
      isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'
    } border-b h-16 flex items-center px-4`}>
      <div className="flex items-center space-x-4">
        <button 
          onClick={handleToggleClick}
          className={`${
            isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'
          } p-2 transition-colors cursor-pointer`}
          type="button"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        {logoUrl ? (
          <div className="flex flex-col items-center">
            <img 
              src={logoUrl} 
              alt="System Logo" 
              className="h-10 object-contain"
              onError={(e) => {
                console.error('Failed to load header logo');
                e.currentTarget.style.display = 'none';
              }}
            />
            <span className={`text-[10px] ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              powered by SYNC
            </span>
          </div>
        ) : (
          <h1 className={`${
            isDarkMode ? 'text-white' : 'text-gray-900'
          } text-xl font-bold`}>
            SYNC
          </h1>
        )}
      </div>
      
      <div className="flex-1"></div>

      <div className="flex items-center space-x-2">
        <button 
          onClick={handleRefresh}
          className={`p-2 ${
            isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'
          } transition-colors`}
        >
          <RefreshCw className="h-5 w-5" />
        </button>
        
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={toggleNotifications}
            className={`p-2 relative ${
              isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'
            } transition-colors`}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>

          {showNotifications && (
            <div className={`absolute right-0 mt-2 w-96 rounded-lg shadow-lg ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } border z-50`}>
              <div className={`p-4 border-b ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <h3 className={`font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Recent Applications
                </h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className={`p-4 text-center ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Loading...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className={`p-4 text-center ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    No new applications
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div 
                      key={notification.id}
                      className={`p-4 border-b ${
                        isDarkMode ? 'border-gray-700 hover:bg-gray-750' : 'border-gray-200 hover:bg-gray-50'
                      } transition-colors cursor-pointer`}
                    >
                      <div className={`font-medium ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {notification.customer_name}
                      </div>
                      <div className={`text-sm ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Plan: {notification.plan_name}
                      </div>
                      <div className={`text-xs mt-1 ${
                        isDarkMode ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        {notification.formatted_date}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
