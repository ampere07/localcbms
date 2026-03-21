import React, { useState, useEffect } from 'react';
import { settingsColorPaletteService, ColorPalette } from '../services/settingsColorPaletteService';
import { Search, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import apiClient from '../config/api';

const hexToRgba = (hex: string, opacity: number) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${opacity})` : hex;
};

interface InvoiceFunnelFilterProps {
    isOpen: boolean;
    onClose: () => void;
    onApplyFilters: (filters: FilterValues) => void;
    currentFilters?: FilterValues;
}

export interface FilterValues {
    [key: string]: {
        type: 'text' | 'number' | 'date' | 'checklist';
        value?: string | string[];
        from?: string | number;
        to?: string | number;
    };
}

interface Column {
    key: string;
    label: string;
    dataType: 'varchar' | 'text' | 'int' | 'decimal' | 'date' | 'datetime' | 'checklist';
}

const STORAGE_KEY = 'invoiceFunnelFilters';

export const allColumns: Column[] = [
    { key: 'id', label: 'Invoice ID', dataType: 'int' },
    { key: 'accountNo', label: 'Account Number', dataType: 'varchar' },
    { key: 'fullName', label: 'Full Name', dataType: 'varchar' },
    { key: 'invoiceDateRaw', label: 'Invoice Date', dataType: 'date' },
    { key: 'dueDate', label: 'Due Date', dataType: 'date' },
    { key: 'invoiceBalance', label: 'Invoice Balance', dataType: 'decimal' },
    { key: 'serviceCharge', label: 'Service Charge', dataType: 'decimal' },
    { key: 'rebate', label: 'Rebate', dataType: 'decimal' },
    { key: 'discounts', label: 'Discounts', dataType: 'decimal' },
    { key: 'staggered', label: 'Staggered', dataType: 'decimal' },
    { key: 'totalAmount', label: 'Total Amount', dataType: 'decimal' },
    { key: 'receivedPayment', label: 'Received Payment', dataType: 'decimal' },
    { key: 'status', label: 'Status', dataType: 'checklist' },
    { key: 'paymentPortalLogRef', label: 'Payment Portal Ref', dataType: 'varchar' },
    { key: 'transactionId', label: 'Transaction ID', dataType: 'varchar' },
    { key: 'address', label: 'Address', dataType: 'text' },
    { key: 'barangay', label: 'Barangay', dataType: 'checklist' },
    { key: 'city', label: 'City', dataType: 'checklist' },
    { key: 'region', label: 'Region', dataType: 'checklist' },
    { key: 'createdAt', label: 'Created At', dataType: 'datetime' },
    { key: 'createdBy', label: 'Created By', dataType: 'varchar' },
];

const InvoiceFunnelFilter: React.FC<InvoiceFunnelFilterProps> = ({
    isOpen,
    onClose,
    onApplyFilters,
    currentFilters
}) => {
    const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') === 'dark');
    const [colorPalette, setColorPalette] = useState<ColorPalette | null>(null);
    const [selectedColumn, setSelectedColumn] = useState<Column | null>(null);
    const [filterValues, setFilterValues] = useState<FilterValues>({});
    const [searchTerm, setSearchTerm] = useState('');

    // Checklist data states
    const [barangays, setBarangays] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    const [regions, setRegions] = useState<string[]>([]);

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
        if (isOpen) {
            const fetchChecklistData = async () => {
                try {
                    const locRes = await apiClient.get<{ success: boolean; data: { barangays: string[], cities: string[], regions: string[] } }>('/lookup/customer-locations');
                    if (locRes.data.success) {
                        setBarangays(locRes.data.data.barangays);
                        setCities(locRes.data.data.cities);
                        setRegions(locRes.data.data.regions);
                    }
                } catch (err) {
                    console.error('Failed to fetch checklist data:', err);
                }
            };
            fetchChecklistData();
        }
    }, [isOpen]);

    const handleColumnClick = (column: Column) => {
        setSelectedColumn(column);
        setSearchTerm('');
    };

    const handleBack = () => {
        setSelectedColumn(null);
        setSearchTerm('');
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
        return ['int', 'decimal'].includes(dataType);
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

    const toggleOption = (columnKey: string, option: string) => {
        setFilterValues(prev => {
            const current = prev[columnKey] || { type: 'checklist', value: [] };
            const selectedOptions = (current.value as string[]) || [];

            const nextOptions = selectedOptions.includes(option)
                ? selectedOptions.filter(o => o !== option)
                : [...selectedOptions, option];

            if (nextOptions.length === 0) {
                const newFilters = { ...prev };
                delete newFilters[columnKey];
                return newFilters;
            }

            return {
                ...prev,
                [columnKey]: {
                    type: 'checklist',
                    value: nextOptions
                }
            };
        });
    };

    const renderFilterInput = () => {
        if (!selectedColumn) return null;

        const currentValue = filterValues[selectedColumn.key];

        if (selectedColumn.dataType === 'checklist') {
            let options: { label: string, value: string }[] = [];
            if (selectedColumn.key === 'status') {
                options = [
                    { label: 'Paid', value: 'Paid' },
                    { label: 'Unpaid', value: 'Unpaid' },
                    { label: 'Partial', value: 'Partial' },
                    { label: 'Overdue', value: 'Overdue' },
                    { label: 'Cancelled', value: 'Cancelled' }
                ];
            } else if (selectedColumn.key === 'barangay') {
                options = barangays.map(b => ({ label: b, value: b }));
            } else if (selectedColumn.key === 'city') {
                options = cities.map(c => ({ label: c, value: c }));
            } else if (selectedColumn.key === 'region') {
                options = regions.map(r => ({ label: r, value: r }));
            }

            const filteredOptions = options.filter(opt =>
                opt.label.toLowerCase().includes(searchTerm.toLowerCase())
            );

            return (
                <div className="flex flex-col h-full overflow-hidden">
                    <div className="relative mb-4">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                        <input
                            type="text"
                            placeholder="Search options..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm focus:outline-none transition-all ${isDarkMode
                                ? 'bg-gray-800 border-gray-700 text-white'
                                : 'bg-gray-50 border-gray-200 text-gray-900'
                                }`}
                            style={{ borderColor: 'transparent' }}
                            onFocus={(e) => {
                                if (colorPalette?.primary) {
                                    e.currentTarget.style.borderColor = colorPalette.primary;
                                }
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.borderColor = 'transparent';
                            }}
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-1 custom-scrollbar">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option, idx) => {
                                const isSelected = (currentValue?.value as string[])?.includes(option.value);
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => toggleOption(selectedColumn.key, option.value)}
                                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${isSelected
                                            ? ''
                                            : (isDarkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-50 text-gray-700')
                                            }`}
                                        style={isSelected ? {
                                            backgroundColor: hexToRgba(colorPalette?.primary || '#7c3aed', 0.1),
                                            color: colorPalette?.primary || '#7c3aed'
                                        } : {}}
                                    >
                                        <span className="text-sm font-medium">{option.label}</span>
                                        {isSelected && <Check className="h-4 w-4" />}
                                    </button>
                                );
                            })
                        ) : (
                            <div className="text-center py-8">
                                <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>No results found</p>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        if (isNumericType(selectedColumn.dataType)) {
            return (
                <div className="space-y-4">
                    <div>
                        <label className={`text-sm font-medium mb-2 block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                            From
                        </label>
                        <input
                            type="number"
                            value={currentValue?.from || ''}
                            onChange={(e) => handleRangeChange(selectedColumn.key, 'from', e.target.value)}
                            placeholder="Minimum value"
                            className={`w-full px-3 py-2 rounded border ${isDarkMode
                                ? 'bg-gray-800 border-gray-700 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                                }`}
                        />
                    </div>
                    <div>
                        <label className={`text-sm font-medium mb-2 block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                            To
                        </label>
                        <input
                            type="number"
                            value={currentValue?.to || ''}
                            onChange={(e) => handleRangeChange(selectedColumn.key, 'to', e.target.value)}
                            placeholder="Maximum value"
                            className={`w-full px-3 py-2 rounded border focus:outline-none transition-all ${isDarkMode
                                ? 'bg-gray-800 border-gray-700 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                                }`}
                            style={{ borderColor: 'transparent' }}
                            onFocus={(e) => {
                                if (colorPalette?.primary) {
                                    e.currentTarget.style.borderColor = colorPalette.primary;
                                }
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.borderColor = 'transparent';
                            }}
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
                            From
                        </label>
                        <input
                            type={selectedColumn.dataType === 'datetime' ? 'datetime-local' : 'date'}
                            value={currentValue?.from || ''}
                            onChange={(e) => handleDateChange(selectedColumn.key, 'from', e.target.value)}
                            className={`w-full px-3 py-2 rounded border ${isDarkMode
                                ? 'bg-gray-800 border-gray-700 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                                }`}
                        />
                    </div>
                    <div>
                        <label className={`text-sm font-medium mb-2 block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                            To
                        </label>
                        <input
                            type={selectedColumn.dataType === 'datetime' ? 'datetime-local' : 'date'}
                            value={currentValue?.to || ''}
                            onChange={(e) => handleDateChange(selectedColumn.key, 'to', e.target.value)}
                            className={`w-full px-3 py-2 rounded border ${isDarkMode
                                ? 'bg-gray-800 border-gray-700 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
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
                    Search Value
                </label>
                <input
                    type="text"
                    value={currentValue?.value || ''}
                    onChange={(e) => handleTextChange(selectedColumn.key, e.target.value)}
                    placeholder={`Enter ${selectedColumn.label.toLowerCase()}`}
                    className={`w-full px-3 py-2 rounded border focus:outline-none transition-all ${isDarkMode
                        ? 'bg-gray-800 border-gray-700 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                        }`}
                    style={{ borderColor: 'transparent' }}
                    onFocus={(e) => {
                        if (colorPalette?.primary) {
                            e.currentTarget.style.borderColor = colorPalette.primary;
                        }
                    }}
                    onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'transparent';
                    }}
                />
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
                                            {selectedColumn ? selectedColumn.label : 'Invoice Filter'}
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
                                            <h3 className={`text-sm font-semibold mb-3 uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                                }`}>
                                                Invoice Details
                                            </h3>
                                            <div className="flex flex-col gap-2 w-full">
                                                {allColumns.map(column => {
                                                    const isActive = !!filterValues[column.key];
                                                    return (
                                                        <div
                                                            key={column.key}
                                                            onClick={() => handleColumnClick(column)}
                                                            className={`group w-full p-4 cursor-pointer transition-all flex items-center justify-between rounded-xl mb-1 ${isDarkMode
                                                                ? 'hover:bg-gray-800/50'
                                                                : 'hover:bg-gray-50 border border-transparent hover:border-gray-100'
                                                                }`}
                                                        >
                                                            <div className="flex items-center space-x-3">
                                                                <div className="relative">
                                                                    <span className={`text-sm font-semibold transition-colors ${isActive ? '' : (isDarkMode ? 'text-gray-200' : 'text-gray-700')
                                                                        }`}
                                                                        style={isActive ? { color: colorPalette?.primary || '#7c3aed' } : {}}
                                                                    >
                                                                        {column.label}
                                                                    </span>
                                                                    {isActive && (
                                                                        <div
                                                                            className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
                                                                            style={{
                                                                                backgroundColor: colorPalette?.primary || '#7c3aed',
                                                                                boxShadow: `0 0 8px ${hexToRgba(colorPalette?.primary || '#7c3aed', 0.6)}`
                                                                            }}
                                                                        />
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center space-x-3">
                                                                {isActive && (
                                                                    <span
                                                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider`}
                                                                        style={{
                                                                            backgroundColor: hexToRgba(colorPalette?.primary || '#7c3aed', isDarkMode ? 0.2 : 0.1),
                                                                            color: colorPalette?.primary || '#7c3aed'
                                                                        }}
                                                                    >
                                                                        Active
                                                                    </span>
                                                                )}
                                                                <ChevronRight className={`h-4 w-4 transition-transform group-hover:translate-x-0.5 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'
                                                                    }`} />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
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
                                        className="flex-1 px-4 py-3 rounded-2xl font-bold text-sm text-white transition-all duration-200 active:scale-[0.98]"
                                        style={{ 
                                            backgroundColor: colorPalette?.primary || '#7c3aed',
                                            boxShadow: `0 4px 12px ${hexToRgba(colorPalette?.primary || '#7c3aed', 0.2)}`
                                        }}
                                    >
                                        Apply Filters
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

export default InvoiceFunnelFilter;
