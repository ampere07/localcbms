import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Loader2, CheckCircle, XCircle, Router } from 'lucide-react';
import { settingsColorPaletteService, ColorPalette } from '../services/settingsColorPaletteService';

interface PPPoEConfig {
  id: number;
  account_no: string;
  username: string;
  password: string;
  ip_address: string;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

const PPPoESetup: React.FC = () => {
  const [configs, setConfigs] = useState<PPPoEConfig[]>([]);
  const [filteredConfigs, setFilteredConfigs] = useState<PPPoEConfig[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<PPPoEConfig | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [colorPalette, setColorPalette] = useState<ColorPalette | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    account_no: '',
    username: '',
    password: '',
    ip_address: '',
    status: 'active' as 'active' | 'inactive'
  });

  useEffect(() => {
    const checkDarkMode = () => {
      const theme = localStorage.getItem('theme');
      setIsDarkMode(theme === 'dark' || theme === null);
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
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
    fetchConfigs();
  }, []);

  useEffect(() => {
    const filtered = configs.filter(config =>
      config.account_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      config.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      config.ip_address.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredConfigs(filtered);
  }, [searchTerm, configs]);

  const fetchConfigs = async () => {
    setIsLoading(true);
    try {
      // API call would go here
      // const response = await pppoeService.getAll();
      // setConfigs(response.data);
      
      // Mock data for now
      setConfigs([]);
    } catch (error) {
      console.error('Failed to fetch PPPoE configs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    setFormData({
      account_no: '',
      username: '',
      password: '',
      ip_address: '',
      status: 'active'
    });
    setShowAddModal(true);
  };

  const handleEdit = (config: PPPoEConfig) => {
    setSelectedConfig(config);
    setFormData({
      account_no: config.account_no,
      username: config.username,
      password: config.password,
      ip_address: config.ip_address,
      status: config.status
    });
    setShowEditModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this PPPoE configuration?')) return;

    setIsLoading(true);
    try {
      // API call would go here
      // await pppoeService.delete(id);
      
      setConfigs(configs.filter(c => c.id !== id));
      setMessage('PPPoE configuration deleted successfully');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to delete PPPoE config:', error);
      setMessage('Failed to delete PPPoE configuration');
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (showEditModal && selectedConfig) {
        // API call would go here
        // await pppoeService.update(selectedConfig.id, formData);
        
        setConfigs(configs.map(c => 
          c.id === selectedConfig.id ? { ...c, ...formData } : c
        ));
        setMessage('PPPoE configuration updated successfully');
      } else {
        // API call would go here
        // const response = await pppoeService.create(formData);
        
        const newConfig: PPPoEConfig = {
          id: Date.now(),
          ...formData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setConfigs([...configs, newConfig]);
        setMessage('PPPoE configuration created successfully');
      }

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      setShowAddModal(false);
      setShowEditModal(false);
    } catch (error) {
      console.error('Failed to save PPPoE config:', error);
      setMessage('Failed to save PPPoE configuration');
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const renderModal = () => {
    const isOpen = showAddModal || showEditModal;
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-full max-w-md`}>
          <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {showEditModal ? 'Edit' : 'Add'} PPPoE Configuration
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Account No
              </label>
              <input
                type="text"
                value={formData.account_no}
                onChange={(e) => setFormData({ ...formData, account_no: e.target.value })}
                className={`w-full px-3 py-2 border rounded ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Username
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className={`w-full px-3 py-2 border rounded ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`w-full px-3 py-2 border rounded ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                IP Address
              </label>
              <input
                type="text"
                value={formData.ip_address}
                onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                className={`w-full px-3 py-2 border rounded ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="192.168.1.1"
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                className={`w-full px-3 py-2 border rounded ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2 text-white rounded transition-colors"
                style={{ backgroundColor: colorPalette?.primary || '#ea580c' }}
              >
                {isLoading ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                }}
                className={`flex-1 px-4 py-2 rounded transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 text-white hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className={`p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} min-h-screen`}>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Router className="h-6 w-6" style={{ color: colorPalette?.primary || '#ea580c' }} />
          <h1 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            PPPoE Setup
          </h1>
        </div>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Manage PPPoE configurations for customer accounts
        </p>
      </div>

      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-4 mb-4`}>
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative flex-1 w-full sm:w-auto">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <input
              type="text"
              placeholder="Search by account, username, or IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors whitespace-nowrap"
            style={{ backgroundColor: colorPalette?.primary || '#ea580c' }}
          >
            <Plus className="h-5 w-5" />
            Add Configuration
          </button>
        </div>
      </div>

      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm overflow-hidden`}>
        {isLoading && configs.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: colorPalette?.primary || '#ea580c' }} />
          </div>
        ) : filteredConfigs.length === 0 ? (
          <div className="text-center py-12">
            <Router className={`h-12 w-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              No PPPoE configurations found
            </p>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {searchTerm ? 'Try adjusting your search terms' : 'Click "Add Configuration" to create your first PPPoE config'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Account No
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Username
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    IP Address
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Status
                  </th>
                  <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'} divide-y`}>
                {filteredConfigs.map((config) => (
                  <tr key={config.id} className={isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-900'
                    }`}>
                      {config.account_no}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-900'
                    }`}>
                      {config.username}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-900'
                    }`}>
                      {config.ip_address}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        config.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {config.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(config)}
                        className={`mr-3 ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-900'}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(config.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {renderModal()}

      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-8 flex flex-col items-center gap-4`}>
            <CheckCircle className="h-16 w-16 text-green-500" />
            <p className={`font-medium text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{message}</p>
          </div>
        </div>
      )}

      {showError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-8 flex flex-col items-center gap-4`}>
            <XCircle className="h-16 w-16 text-red-500" />
            <p className={`font-medium text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PPPoESetup;
