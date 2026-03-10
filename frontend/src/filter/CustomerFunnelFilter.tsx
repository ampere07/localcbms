import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { settingsColorPaletteService, ColorPalette } from '../services/settingsColorPaletteService';
import { planService, Plan } from '../services/planService';
import { getAllLCPs, LCP } from '../services/lcpService';
import { getAllNAPs, NAP } from '../services/napService';
import { getAllPorts, Port } from '../services/portService';
import { getAllVLANs, VLAN } from '../services/vlanService';
import { getAllLCPNAPs, LCPNAP } from '../services/lcpnapService';
import { Search, Check } from 'lucide-react';

interface CustomerFunnelFilterProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterValues) => void;
  currentFilters?: FilterValues;
}

export interface FilterValues {
  [key: string]: {
    type: 'text' | 'number' | 'date' | 'checklist';
    value?: string;
    from?: string | number;
    to?: string | number;
    selectedOptions?: string[];
  };
}

export interface Column {
  key: string;
  label: string;
  table: string;
  dataType: 'varchar' | 'text' | 'int' | 'bigint' | 'decimal' | 'date' | 'datetime' | 'enum';
}

const STORAGE_KEY = 'customerFunnelFilters';

export const allColumns: Column[] = [
  // billing_accounts table
  { key: 'account_no', label: 'Account No', table: 'billing_accounts', dataType: 'varchar' },
  { key: 'date_installed', label: 'Date Installed', table: 'billing_accounts', dataType: 'date' },

  // customers table
  { key: 'customerName', label: 'Full Name', table: 'customers', dataType: 'varchar' },
  { key: 'contact_number_primary', label: 'Contact Number', table: 'customers', dataType: 'varchar' },
  { key: 'email_address', label: 'Email Address', table: 'customers', dataType: 'varchar' },

  // billing_accounts table continued
  { key: 'plan_id', label: 'Plan', table: 'billing_accounts', dataType: 'bigint' },
  { key: 'account_balance', label: 'Account Balance', table: 'billing_accounts', dataType: 'decimal' },

  // technical_details table
  { key: 'username', label: 'Username', table: 'technical_details', dataType: 'varchar' },
  { key: 'connection_type', label: 'Connection Type', table: 'technical_details', dataType: 'varchar' },
  { key: 'router_modem_sn', label: 'Router/Modem SN', table: 'technical_details', dataType: 'varchar' },
  { key: 'lcp', label: 'LCP', table: 'technical_details', dataType: 'varchar' },
  { key: 'nap', label: 'NAP', table: 'technical_details', dataType: 'varchar' },
  { key: 'port', label: 'Port', table: 'technical_details', dataType: 'varchar' },
  { key: 'vlan', label: 'VLAN', table: 'technical_details', dataType: 'varchar' },
  { key: 'lcpnap', label: 'LCPNAP', table: 'technical_details', dataType: 'varchar' },

  // Modified By
  { key: 'updated_by', label: 'Modified By', table: 'customers', dataType: 'bigint' },

  // billing_accounts table continued
  { key: 'billing_day', label: 'Billing Day', table: 'billing_accounts', dataType: 'int' },
];


const CustomerFunnelFilter: React.FC<CustomerFunnelFilterProps> = ({
  isOpen,
  onClose,
  onApplyFilters,
  currentFilters
}) => {
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') === 'dark');
  const [colorPalette, setColorPalette] = useState<ColorPalette | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<Column | null>(null);
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [plans, setPlans] = useState<Plan[]>([]);
  const [lcps, setLcps] = useState<LCP[]>([]);
  const [naps, setNaps] = useState<NAP[]>([]);
  const [ports, setPorts] = useState<Port[]>([]);
  const [vlans, setVlans] = useState<VLAN[]>([]);
  const [lcpnaps, setLcpnaps] = useState<LCPNAP[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      const savedFilters = localStorage.getItem(STORAGE_KEY);
      if (savedFilters) {
        try {
          setFilterValues(JSON.parse(savedFilters));
        } catch (err) {
          console.error('Failed to load saved filters:', err);
        }
      } else if (currentFilters) {
        setFilterValues(currentFilters);
      }
    }
  }, [isOpen, currentFilters]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(localStorage.getItem('theme') === 'dark');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
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

  useEffect(() => {
    const fetchChecklistData = async () => {
      try {
        const [plansData, lcpsData, napsData, portsData, vlansData, lcpnapsData] = await Promise.all([
          planService.getAllPlans(),
          getAllLCPs(),
          getAllNAPs(),
          getAllPorts(),
          getAllVLANs(),
          getAllLCPNAPs()
        ]);
        setPlans(plansData);
        setLcps(lcpsData.data);
        setNaps(napsData.data);
        setPorts(portsData.data);
        setVlans(vlansData.data);
        setLcpnaps(lcpnapsData.data);
      } catch (err) {
        console.error('Failed to fetch checklist data:', err);
      }
    };
    if (isOpen) {
      fetchChecklistData();
    }
  }, [isOpen]);

  const handleColumnClick = (column: Column) => {
    setSelectedColumn(column);
    setSearchQuery('');
  };

  const handleBack = () => {
    setSelectedColumn(null);
    setSearchQuery('');
  };

  const toggleOption = (columnKey: string, option: string) => {
    setFilterValues(prev => {
      const current = prev[columnKey] || { type: 'checklist', selectedOptions: [] };
      const selectedOptions = current.selectedOptions || [];
      const newOptions = selectedOptions.includes(option)
        ? selectedOptions.filter(o => o !== option)
        : [...selectedOptions, option];

      return {
        ...prev,
        [columnKey]: {
          type: 'checklist',
          selectedOptions: newOptions
        }
      };
    });
  };

  const handleApply = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filterValues));
    onApplyFilters(filterValues);
    onClose();
  };

  const handleReset = () => {
    setFilterValues({});
    setSelectedColumn(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const isNumericType = (dataType: string) => {
    return ['int', 'bigint', 'decimal'].includes(dataType);
  };

  const isDateType = (dataType: string) => {
    return ['date', 'datetime'].includes(dataType);
  };

  const handleTextChange = (columnKey: string, value: string) => {
    setFilterValues(prev => ({
      ...prev,
      [columnKey]: {
        type: 'text',
        value
      }
    }));
  };

  const handleRangeChange = (columnKey: string, field: 'from' | 'to', value: string) => {
    setFilterValues(prev => ({
      ...prev,
      [columnKey]: {
        ...prev[columnKey],
        type: 'number',
        [field]: value
      }
    }));
  };

  const handleDateChange = (columnKey: string, field: 'from' | 'to', value: string) => {
    setFilterValues(prev => ({
      ...prev,
      [columnKey]: {
        ...prev[columnKey],
        type: 'date',
        [field]: value
      }
    }));
  };


  const renderFilterInput = () => {
    if (!selectedColumn) return null;

    const currentValue = filterValues[selectedColumn.key];

    // Checklist types
    const checklists: Record<string, { label: string, value: string }[]> = {
      plan_id: plans.map(p => ({
        label: `${p.name} ${Math.floor(p.price || 0)}`,
        value: p.id.toString()
      })),
      connection_type: [
        { label: 'Fiber', value: 'Fiber' },
        { label: '(empty)', value: 'empty' },
        { label: 'Antenna', value: 'Antenna' }
      ],
      lcp: lcps.map(l => ({ label: l.lcp_name, value: l.lcp_name })),
      nap: naps.map(n => ({ label: n.nap_name, value: n.nap_name })),
      port: Array.from(new Set(ports.map(p => p.PORT_ID))).map(pid => ({ label: pid, value: pid })),
      vlan: Array.from(new Set(vlans.map(v => v.vlan_id))).map(vid => ({ label: vid, value: vid })),
      lcpnap: lcpnaps.map(ln => ({ label: ln.lcpnap_name, value: ln.lcpnap_name }))
    };

    if (checklists[selectedColumn.key]) {
      const options = checklists[selectedColumn.key];
      const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
      );

      return (
        <div className="space-y-4">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search options..."
              className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:ring-2 outline-none transition-all ${isDarkMode
                ? 'bg-gray-800 border-gray-700 text-white focus:ring-purple-500/20 focus:border-purple-500'
                : 'bg-white border-gray-200 text-gray-900 focus:ring-purple-500/20 focus:border-purple-500'
                }`}
            />
          </div>
          <div className={`max-h-[400px] overflow-y-auto rounded-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            {filteredOptions.length > 0 ? (
              <div className="divide-y divide-transparent">
                {filteredOptions.map((option) => {
                  const isSelected = currentValue?.selectedOptions?.includes(option.value);
                  return (
                    <div
                      key={option.value}
                      onClick={() => toggleOption(selectedColumn.key, option.value)}
                      className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${isSelected
                        ? (isDarkMode ? 'bg-purple-500/10' : 'bg-purple-50')
                        : (isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50')
                        }`}
                    >
                      <span className={`text-sm ${isSelected
                        ? (isDarkMode ? 'text-purple-400 font-semibold' : 'text-purple-700 font-semibold')
                        : (isDarkMode ? 'text-gray-300' : 'text-gray-700')
                        }`}>
                        {option.label}
                      </span>
                      {isSelected && (
                        <Check className="h-4 w-4 text-purple-500" />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={`px-4 py-8 text-center text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                No options found matching your search.
              </div>
            )}
          </div>
        </div>
      );
    }

    if (isNumericType(selectedColumn.dataType) && (selectedColumn.key === 'account_balance' || selectedColumn.key === 'billing_day')) {
      return (
        <div className="space-y-4">
          <div>
            <label className={`text-sm font-medium mb-2 block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Minimum {selectedColumn.label}
            </label>
            <input
              type="number"
              value={currentValue?.from || ''}
              onChange={(e) => handleRangeChange(selectedColumn.key, 'from', e.target.value)}
              placeholder="0"
              className={`w-full px-3 py-2 rounded border focus:ring-2 outline-none transition-all ${isDarkMode
                ? 'bg-gray-800 border-gray-700 text-white focus:ring-purple-500/20 focus:border-purple-500'
                : 'bg-white border-gray-300 text-gray-900 focus:ring-purple-500/20 focus:border-purple-500'
                }`}
            />
          </div>
          <div>
            <label className={`text-sm font-medium mb-2 block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Maximum {selectedColumn.label}
            </label>
            <input
              type="number"
              value={currentValue?.to || ''}
              onChange={(e) => handleRangeChange(selectedColumn.key, 'to', e.target.value)}
              placeholder="Any"
              className={`w-full px-3 py-2 rounded border focus:ring-2 outline-none transition-all ${isDarkMode
                ? 'bg-gray-800 border-gray-700 text-white focus:ring-purple-500/20 focus:border-purple-500'
                : 'bg-white border-gray-300 text-gray-900 focus:ring-purple-500/20 focus:border-purple-500'
                }`}
            />
          </div>
        </div>
      );
    }

    if (isDateType(selectedColumn.dataType)) {
      return (
        <div className="space-y-4">
          <div>
            <label className={`text-sm font-medium mb-2 block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
              From Date
            </label>
            <input
              type={selectedColumn.dataType === 'datetime' ? 'datetime-local' : 'date'}
              value={currentValue?.from || ''}
              onChange={(e) => handleDateChange(selectedColumn.key, 'from', e.target.value)}
              className={`w-full px-3 py-2 rounded border focus:ring-2 outline-none transition-all ${isDarkMode
                ? 'bg-gray-800 border-gray-700 text-white focus:ring-purple-500/20 focus:border-purple-500'
                : 'bg-white border-gray-300 text-gray-900 focus:ring-purple-500/20 focus:border-purple-500'
                }`}
            />
          </div>
          <div>
            <label className={`text-sm font-medium mb-2 block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
              To Date
            </label>
            <input
              type={selectedColumn.dataType === 'datetime' ? 'datetime-local' : 'date'}
              value={currentValue?.to || ''}
              onChange={(e) => handleDateChange(selectedColumn.key, 'to', e.target.value)}
              className={`w-full px-3 py-2 rounded border focus:ring-2 outline-none transition-all ${isDarkMode
                ? 'bg-gray-800 border-gray-700 text-white focus:ring-purple-500/20 focus:border-purple-500'
                : 'bg-white border-gray-300 text-gray-900 focus:ring-purple-500/20 focus:border-purple-500'
                }`}
            />
          </div>
        </div>
      );
    }

    return (
      <div>
        <label className={`text-sm font-medium mb-2 block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
          {selectedColumn.label}
        </label>
        <div className="relative">
          <input
            type="text"
            value={currentValue?.value || ''}
            onChange={(e) => handleTextChange(selectedColumn.key, e.target.value)}
            placeholder={`Enter ${selectedColumn.label.toLowerCase()}...`}
            className={`w-full px-3 py-2 rounded border focus:ring-2 outline-none transition-all ${isDarkMode
              ? 'bg-gray-800 border-gray-700 text-white focus:ring-purple-500/20 focus:border-purple-500'
              : 'bg-white border-gray-300 text-gray-900 focus:ring-purple-500/20 focus:border-purple-500'
              }`}
          />
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        <div className="fixed inset-y-0 right-0 max-w-full flex">
          <div className={`w-screen max-w-md transform transition-transform ${isDarkMode ? 'bg-gray-900' : 'bg-white'
            }`}>
            <div className="h-full flex flex-col">
              <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'
                }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {selectedColumn && (
                      <button
                        onClick={handleBack}
                        className={`p-2 rounded-lg transition-colors ${isDarkMode
                          ? 'hover:bg-gray-800 text-gray-400'
                          : 'hover:bg-gray-100 text-gray-600'
                          }`}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                    )}
                    <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                      {selectedColumn ? selectedColumn.label : 'Filter'}
                    </h2>
                  </div>
                  <button
                    onClick={onClose}
                    className={`p-2 rounded-lg transition-colors ${isDarkMode
                      ? 'hover:bg-gray-800 text-gray-400'
                      : 'hover:bg-gray-100 text-gray-600'
                      }`}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4">
                {selectedColumn ? (
                  renderFilterInput()
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h3 className={`text-sm font-semibold mb-3 uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Available Filters
                      </h3>
                      <div className="flex flex-col gap-2 w-full">
                        {allColumns.map(column => (
                          <div
                            key={column.key}
                            onClick={() => handleColumnClick(column)}
                            className={`w-full p-3 cursor-pointer transition-all flex items-center justify-between border-b ${isDarkMode ? 'border-gray-800 hover:bg-gray-800/50' : 'border-gray-100 hover:bg-gray-50'
                              }`}
                          >
                            <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {column.label}
                            </span>
                            <div className="flex items-center space-x-2">
                              {filterValues[column.key] && (
                                <span className="h-2 w-2 rounded-full bg-purple-500" />
                              )}
                              <ChevronRight className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className={`px-6 py-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'
                }`}>
                <div className="flex space-x-3">
                  <button
                    onClick={handleReset}
                    className={`flex-1 px-4 py-2 rounded transition-colors ${isDarkMode
                      ? 'bg-gray-800 hover:bg-gray-700 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                      }`}
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleApply}
                    className="flex-1 px-4 py-2 text-white rounded transition-colors"
                    style={{ backgroundColor: colorPalette?.primary || '#7c3aed' }}
                    onMouseEnter={(e) => {
                      if (colorPalette?.accent) {
                        e.currentTarget.style.backgroundColor = colorPalette.accent;
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = colorPalette?.primary || '#7c3aed';
                    }}
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerFunnelFilter;
