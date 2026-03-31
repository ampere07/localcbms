import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Receipt, Search, ChevronRight, Tag, ChevronDown, Menu, X, ChevronsLeft, ChevronsRight, Globe, Calendar, RefreshCw, Plus } from 'lucide-react';
import DiscountDetails from '../components/DiscountDetails';
import DiscountFormModal from '../modals/DiscountFormModal';
import * as discountService from '../services/discountService';
import barangayService from '../services/barangayService';
import { getRegions, Region } from '../services/regionService';
import { getCities, City } from '../services/cityService';
import { settingsColorPaletteService, ColorPalette } from '../services/settingsColorPaletteService';
 
interface DiscountRecord {
  id: string;
  fullName: string;
  accountNo: string;
  contactNumber: string;
  emailAddress: string;
  address: string;
  plan: string;
  provider: string;
  discountId: string;
  discountAmount: number;
  discountStatus: string;
  dateCreated: string;
  processedBy: string;
  processedDate: string;
  approvedBy: string;
  approvedByEmail?: string;
  modifiedBy: string;
  modifiedDate: string;
  userEmail: string;
  remarks: string;
  cityId?: number;
  barangay?: string;
  city?: string;
  region?: string;
  created_at?: string;
  completeAddress?: string;
  onlineStatus?: string;
}

interface LocationItem {
  id: string;
  name: string;
  count: number;
}

const formatDate = (dateStr?: string, includeTime: boolean = false): string => {
  if (!dateStr) return 'No date';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();

    if (includeTime) {
      let hours = date.getHours();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${mm}/${dd}/${yyyy} ${hours}:${minutes}:${seconds} ${ampm}`;
    }

    return `${mm}/${dd}/${yyyy}`;
  } catch (e) {
    return dateStr;
  }
};

const getDiscountRecords = async (): Promise<DiscountRecord[]> => {
  try {
    const response = await discountService.getAll();
    if (response.success && response.data) {
      return response.data.map((discount: any) => {
        const customer = discount.billing_account?.customer;
        const plan = discount.billing_account?.plan;
        
        return {
          id: String(discount.id),
          fullName: customer?.full_name || 
                    [customer?.first_name, customer?.middle_initial, customer?.last_name]
                      .filter(Boolean).join(' ') || 'N/A',
          accountNo: discount.account_no || 'N/A',
          contactNumber: customer?.contact_number_primary || 'N/A',
          emailAddress: customer?.email_address || 'N/A',
          address: customer?.address || 'N/A',
          completeAddress: [
            customer?.address,
            customer?.location,
            customer?.barangay,
            customer?.city,
            customer?.region
          ].filter(Boolean).join(', ') || 'N/A',
          plan: plan?.plan_name || 'N/A',
          provider: 'N/A',
          discountId: String(discount.id),
          discountAmount: parseFloat(discount.discount_amount) || 0,
          discountStatus: discount.status || 'Unknown',
          dateCreated: discount.created_at ? formatDate(discount.created_at) : 'N/A',
          processedBy: discount.processed_by_user?.full_name || discount.processed_by_user?.username || 'N/A',
          processedDate: discount.processed_date ? formatDate(discount.processed_date) : 'N/A',
          approvedBy: discount.approved_by_user?.full_name || discount.approved_by_user?.username || 'N/A',
          approvedByEmail: discount.approved_by_user?.email_address || discount.approved_by_user?.email,
          modifiedBy: discount.updated_by_user?.full_name || discount.updated_by_user?.username || 'N/A',
          modifiedDate: discount.updated_at ? formatDate(discount.updated_at, true) : 'N/A',
          userEmail: discount.processed_by_user?.email_address || discount.processed_by_user?.email || 'N/A',
          remarks: discount.remarks || '',
          cityId: customer?.city_id || undefined,
          barangay: customer?.barangay,
          city: customer?.city,
          region: customer?.region,
          created_at: discount.created_at,
          onlineStatus: undefined
        };
      });
    }
    return [];
  } catch (error) {
    console.error('Error fetching discount records:', error);
    throw error;
  }
};



const Discounts: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDiscount, setSelectedDiscount] = useState<DiscountRecord | null>(null);
  const [discountRecords, setDiscountRecords] = useState<DiscountRecord[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState<number>(256);
  const [isResizingSidebar, setIsResizingSidebar] = useState<boolean>(false);
  const sidebarStartXRef = useRef<number>(0);
  const sidebarStartWidthRef = useRef<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [colorPalette, setColorPalette] = useState<ColorPalette | null>(null);
  const [isDiscountFormModalOpen, setIsDiscountFormModalOpen] = useState<boolean>(false);
  const [barangays, setBarangays] = useState<any[]>([]);
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());
  const [createdDateFrom, setCreatedDateFrom] = useState<string>('');
  const [createdDateTo, setCreatedDateTo] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

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
    const fetchLocationData = async () => {
      try {
        const [citiesData, regionsData, barangaysRes] = await Promise.all([
          getCities(),
          getRegions(),
          barangayService.getAll()
        ]);
        setCities(citiesData || []);
        setRegions(regionsData || []);
        setBarangays(barangaysRes.success ? barangaysRes.data : []);
      } catch (err) {
        console.error('Failed to fetch location data:', err);
      }
    };
    
    fetchLocationData();
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
    const fetchDiscountData = async () => {
      try {
        setIsLoading(true);
        const data = await getDiscountRecords();
        setDiscountRecords(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch discount records:', err);
        setError('Failed to load discount records. Please try again.');
        setDiscountRecords([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDiscountData();
  }, []);

  const toggleLocationExpansion = (e: React.MouseEvent, locationId: string) => {
    e.stopPropagation();
    setExpandedLocations(prev => {
      const next = new Set(prev);
      if (next.has(locationId)) {
        next.delete(locationId);
      } else {
        next.add(locationId);
      }
      return next;
    });
  };

  const getCityName = useMemo(() => {
    const cityMap = new Map(cities.map(c => [c.id, c.name]));
    return (cityId: number | null | undefined): string => {
      if (!cityId) return 'Unknown City';
      return cityMap.get(cityId) || `City ${cityId}`;
    };
  }, [cities]);

  const searchFilteredRecords = useMemo(() => {
    return discountRecords.filter(record => {
      const matchesSearch = searchQuery === '' || 
        record.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.accountNo.includes(searchQuery);
      
      if (!matchesSearch) return false;

      if (createdDateFrom || createdDateTo) {
        const recordDate = record.created_at ? new Date(record.created_at) : null;
        if (!recordDate) return false;
        
        recordDate.setHours(0, 0, 0, 0);

        if (createdDateFrom) {
          const fromDate = new Date(createdDateFrom);
          if (recordDate < fromDate) return false;
        }

        if (createdDateTo) {
          const toDate = new Date(createdDateTo);
          if (recordDate > toDate) return false;
        }
      }
      
      return true;
    });
  }, [discountRecords, searchQuery, createdDateFrom, createdDateTo]);

  // Generate hierarchical location items (Derive counts from search results)
  const locationItems = useMemo(() => {
    // Counts for each level
    const regionCounts: Record<string, number> = {};
    const cityCounts: Record<string, number> = {};
    const barangayCounts: Record<string, number> = {};

    // Count appearances in searchFilteredRecords
    searchFilteredRecords.forEach(record => {
      const region = record.region;
      const city = record.city;
      const barangay = record.barangay;

      if (region) regionCounts[region] = (regionCounts[region] || 0) + 1;

      if (city) {
        const matchedCity = cities.find(c => c.name === city);
        if (matchedCity) {
          cityCounts[`${matchedCity.region_id}_${matchedCity.name}`] = (cityCounts[`${matchedCity.region_id}_${matchedCity.name}`] || 0) + 1;
        }
      }

      if (barangay) {
        const matchedBarangay = barangays.find(b =>
          b.barangay === barangay &&
          (!city || cities.find(c => c.id === b.city_id)?.name === city)
        );
        if (matchedBarangay) {
          barangayCounts[`${matchedBarangay.city_id}_${matchedBarangay.barangay}`] = (barangayCounts[`${matchedBarangay.city_id}_${matchedBarangay.barangay}`] || 0) + 1;
        }
      }
    });

    return {
      regions: regions.map(r => ({
        id: `reg:${r.name}`,
        name: r.name,
        count: regionCounts[r.name] || 0,
        cities: cities.filter(c => c.region_id === r.id).map(c => ({
          id: `city:${c.name}`,
          name: c.name,
          regionName: r.name,
          count: cityCounts[`${r.id}_${c.name}`] || 0,
          barangays: barangays.filter(b => b.city_id === c.id).map(b => ({
            id: `brgy:${b.barangay}`,
            name: b.barangay,
            cityName: c.name,
            regionName: r.name,
            count: barangayCounts[`${c.id}_${b.barangay}`] || 0
          }))
        }))
      })),
      total: searchFilteredRecords.length
    };
  }, [regions, cities, barangays, searchFilteredRecords]);

  const filteredDiscountRecords = useMemo(() => {
    return searchFilteredRecords.filter(record => {
      if (selectedLocation === 'all') return true;
      
      if (selectedLocation.startsWith('reg:')) {
        return record.region === selectedLocation.replace('reg:', '');
      }
      
      if (selectedLocation.startsWith('city:')) {
        return record.city === selectedLocation.replace('city:', '');
      }
      
      if (selectedLocation.startsWith('brgy:')) {
        return record.barangay === selectedLocation.replace('brgy:', '');
      }
      
      return record.cityId === Number(selectedLocation);
    });
  }, [searchFilteredRecords, selectedLocation]);


  const handleRecordClick = (record: DiscountRecord) => {
    setSelectedDiscount(record);
  };

  const handleCloseDetails = () => {
    setSelectedDiscount(null);
  };

  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      const data = await getDiscountRecords();
      setDiscountRecords(data);
      setError(null);
    } catch (err) {
      console.error('Failed to refresh discount records:', err);
      setError('Failed to refresh discount records. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isResizingSidebar) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingSidebar) return;
      
      const diff = e.clientX - sidebarStartXRef.current;
      const newWidth = Math.max(200, Math.min(500, sidebarStartWidthRef.current + diff));
      
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizingSidebar(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingSidebar]);

  const handleMouseDownSidebarResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingSidebar(true);
    sidebarStartXRef.current = e.clientX;
    sidebarStartWidthRef.current = sidebarWidth;
  };

  const handleOpenDiscountFormModal = () => {
    setIsDiscountFormModalOpen(true);
  };

  const handleCloseDiscountFormModal = () => {
    setIsDiscountFormModalOpen(false);
  };

  const handleSaveDiscount = async (formData: any) => {
    try {
      // The form modal handles the save internally, just refresh the list
      await handleRefresh();
      handleCloseDiscountFormModal();
    } catch (error) {
      console.error('Error saving discount:', error);
    }
  };

  return (
    <div className={`h-full flex flex-col md:flex-row overflow-hidden ${
      isDarkMode ? 'bg-gray-950' : 'bg-gray-50'
    }`}>
      <div className={`md:border-r border-t md:border-t-0 flex-shrink-0 flex flex-col order-2 md:order-1 relative ${
        isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
      }`} style={{ width: `${sidebarWidth}px` }}>
        <div className={`p-4 border-b flex-shrink-0 hidden md:block ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <h2 className={`text-lg font-semibold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Discounts</h2>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {/* Date Range Filter Section */}
          <div className={`px-4 py-3 border-b space-y-3 ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Created Date Range
              </span>
              {(createdDateFrom || createdDateTo) && (
                <button
                  onClick={() => {
                    setCreatedDateFrom('');
                    setCreatedDateTo('');
                  }}
                  className="text-[10px] font-bold uppercase tracking-wider hover:underline"
                  style={{ color: colorPalette?.primary || '#7c3aed' }}
                >
                  Clear
                </button>
              )}
            </div>
            <div className="space-y-2">
              <div className="relative">
                <label className={`text-[10px] mb-1 block ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>From</label>
                <input
                  type="date"
                  value={createdDateFrom}
                  onChange={(e) => setCreatedDateFrom(e.target.value)}
                  className={`w-full px-2 py-1.5 rounded text-xs focus:outline-none border ${isDarkMode
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  style={createdDateFrom ? { borderColor: colorPalette?.primary || '#7c3aed' } : {}}
                />
              </div>
              <div className="relative">
                <label className={`text-[10px] mb-1 block ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>To</label>
                <input
                  type="date"
                  value={createdDateTo}
                  onChange={(e) => setCreatedDateTo(e.target.value)}
                  className={`w-full px-2 py-1.5 rounded text-xs focus:outline-none border ${isDarkMode
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  style={createdDateTo ? { borderColor: colorPalette?.primary || '#7c3aed' } : {}}
                />
              </div>
            </div>
          </div>

          {/* All Level */}
          <button
            onClick={() => setSelectedLocation('all')}
            className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
              } ${selectedLocation === 'all'
                ? ''
                : isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}
            style={selectedLocation === 'all' ? {
              backgroundColor: colorPalette?.primary ? `${colorPalette.primary}33` : 'rgba(249, 115, 22, 0.2)',
              color: colorPalette?.primary || '#7c3aed'
            } : {}}
          >
            <div className="flex items-center">
              <span>All Discounts</span>
            </div>
            <span
              className={`px-2 py-1 rounded-full text-xs ${selectedLocation === 'all'
                ? 'text-white'
                : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                }`}
              style={selectedLocation === 'all' ? {
                backgroundColor: colorPalette?.primary || '#7c3aed'
              } : {}}
            >
              {locationItems.total}
            </span>
          </button>

          {/* Region Level */}
          {locationItems.regions.map((region: any) => (
            <div key={region.id}>
              <button
                onClick={() => setSelectedLocation(region.id)}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                  } ${selectedLocation === region.id
                    ? ''
                    : isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                style={selectedLocation === region.id ? {
                  backgroundColor: colorPalette?.primary ? `${colorPalette.primary}33` : 'rgba(249, 115, 22, 0.2)',
                  color: colorPalette?.primary || '#7c3aed'
                } : {}}
              >
                <div className="flex items-center flex-1">
                  <button
                    onClick={(e) => toggleLocationExpansion(e, region.id)}
                    className="p-1 mr-1"
                  >
                    {expandedLocations.has(region.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  <Tag className="h-4 w-4 mr-2" />
                  <span>{region.name}</span>
                </div>
                {region.count > 0 && (
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${selectedLocation === region.id
                      ? 'text-white'
                      : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                      }`}
                    style={selectedLocation === region.id ? {
                      backgroundColor: colorPalette?.primary || '#7c3aed'
                    } : {}}
                  >
                    {region.count}
                  </span>
                )}
              </button>

              {/* City Level */}
              {expandedLocations.has(region.id) && region.cities.map((city: any) => (
                <div key={city.id}>
                  <button
                    onClick={() => setSelectedLocation(city.id)}
                    className={`w-full flex items-center justify-between pl-10 pr-4 py-2 text-sm transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                      } ${selectedLocation === city.id
                        ? ''
                        : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    style={selectedLocation === city.id ? {
                      backgroundColor: colorPalette?.primary ? `${colorPalette.primary}22` : 'rgba(249, 115, 22, 0.1)',
                      color: colorPalette?.primary || '#7c3aed'
                    } : {}}
                  >
                    <div className="flex items-center flex-1">
                      <button
                        onClick={(e) => toggleLocationExpansion(e, city.id)}
                        className="p-1 mr-1"
                      >
                        {expandedLocations.has(city.id) ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                      </button>
                      <span>{city.name}</span>
                    </div>
                    {city.count > 0 && (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${selectedLocation === city.id
                        ? 'text-white bg-white/20'
                        : isDarkMode ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400'
                        }`}>
                        {city.count}
                      </span>
                    )}
                  </button>

                  {/* Barangay Level */}
                  {expandedLocations.has(city.id) && city.barangays.map((barangay: any) => (
                    <button
                      key={barangay.id}
                      onClick={() => setSelectedLocation(barangay.id)}
                      className={`w-full flex items-center justify-between pl-16 pr-4 py-1.5 text-xs transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                        } ${selectedLocation === barangay.id
                          ? ''
                          : isDarkMode ? 'text-gray-500' : 'text-gray-500'
                        }`}
                      style={selectedLocation === barangay.id ? {
                        color: colorPalette?.primary || '#7c3aed',
                        fontWeight: 'bold'
                      } : {}}
                    >
                      <div className="flex items-center flex-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-current mr-2 opacity-40"></span>
                        <span>{barangay.name}</span>
                      </div>
                      {barangay.count > 0 && (
                        <span className={`px-1 py-0.5 rounded text-[9px] transition-colors ${selectedLocation === barangay.id
                          ? 'text-white bg-white/20'
                          : isDarkMode ? 'bg-gray-800 text-gray-600' : 'bg-gray-100 text-gray-400'
                          }`}>
                          {barangay.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div
          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize transition-colors z-10 hidden md:block"
          onMouseDown={handleMouseDownSidebarResize}
          style={{
            backgroundColor: isResizingSidebar ? (colorPalette?.primary || '#7c3aed') : 'transparent'
          }}
          onMouseEnter={(e) => {
            if (!isResizingSidebar && colorPalette?.primary) {
              e.currentTarget.style.backgroundColor = colorPalette.primary;
            }
          }}
          onMouseLeave={(e) => {
            if (!isResizingSidebar) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        />
      </div>

      <div className={`flex-1 overflow-hidden order-1 md:order-2 ${
        isDarkMode ? 'bg-gray-950' : 'bg-gray-50'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header with Search (Replicated from Invoice.tsx pattern) */}
          <div className={`p-4 border-b flex-shrink-0 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
            }`}>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className={`md:hidden p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                  }`}
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search Discount records..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full rounded pl-10 pr-10 py-2 focus:outline-none focus:ring-1 focus:border ${isDarkMode
                    ? 'bg-gray-800 text-white border border-gray-700'
                    : 'bg-white text-gray-900 border border-gray-300'
                    }`}
                  style={{
                    '--tw-ring-color': colorPalette?.primary || '#7c3aed'
                  } as React.CSSProperties}
                  onFocus={(e) => {
                    if (colorPalette?.primary) {
                      e.currentTarget.style.borderColor = colorPalette.primary;
                    }
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = isDarkMode ? '#374151' : '#d1d5db';
                  }}
                />
                <Search className={`absolute left-3 top-2.5 h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className={`absolute right-3 top-2.5 p-0.5 rounded-full transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleOpenDiscountFormModal}
                  title="Add Discount"
                  className={`p-2 rounded-lg transition-all duration-200 flex items-center justify-center shadow-sm`}
                  style={{ 
                    backgroundColor: colorPalette?.primary || '#7c3aed',
                    color: isDarkMode ? '#111827' : '#ffffff'
                  }}
                  onMouseEnter={(e) => {
                    if (colorPalette?.accent) {
                      e.currentTarget.style.backgroundColor = colorPalette.accent;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (colorPalette?.primary) {
                      e.currentTarget.style.backgroundColor = colorPalette.primary;
                    }
                  }}
                >
                  <Plus className="h-5 w-5" />
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  title="Refresh Records"
                  className={`p-2 rounded-lg transition-all duration-200 flex items-center justify-center shadow-sm disabled:opacity-50`}
                  style={{ 
                    backgroundColor: colorPalette?.primary || '#7c3aed',
                    color: isDarkMode ? '#111827' : '#ffffff'
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading && colorPalette?.accent) {
                      e.currentTarget.style.backgroundColor = colorPalette.accent;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading && colorPalette?.primary) {
                      e.currentTarget.style.backgroundColor = colorPalette.primary;
                    }
                  }}
                >
                  <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto">
              {isLoading ? (
                <div className={`px-4 py-12 text-center ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <div className="animate-pulse flex flex-col items-center">
                    <div className={`h-4 w-1/3 rounded mb-4 ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
                    }`}></div>
                    <div className={`h-4 w-1/2 rounded ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
                    }`}></div>
                  </div>
                  <p className="mt-4">Loading discount records...</p>
                </div>
              ) : error ? (
                <div className={`px-4 py-12 text-center ${
                  isDarkMode ? 'text-red-400' : 'text-red-600'
                }`}>
                  <p>{error}</p>
                  <button 
                    onClick={handleRefresh}
                    className={`mt-4 px-4 py-2 rounded ${
                      isDarkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                    }`}>
                    Retry
                  </button>
                </div>
              ) : (
                <div className="space-y-0">
                  {filteredDiscountRecords.length > 0 ? (
                    filteredDiscountRecords.map((record) => (
                      <div
                        key={record.id}
                        onClick={() => handleRecordClick(record)}
                        className={`px-4 py-3 cursor-pointer transition-colors border-b ${
                          isDarkMode ? 'hover:bg-gray-800 border-gray-800' : 'hover:bg-gray-100 border-gray-200'
                        } ${selectedDiscount?.id === record.id ? (isDarkMode ? 'bg-gray-800' : 'bg-gray-100') : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className={`font-medium ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {record.fullName}
                            </div>
                            <div className="text-red-400 text-sm">
                              {record.accountNo} | {record.fullName} | {record.address}
                            </div>
                          </div>
                          <div className="flex items-center ml-4 flex-shrink-0">
                            <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                              ₱{record.discountAmount.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={`text-center py-12 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      No discount records found matching your filters
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)} />
          <div className={`absolute inset-y-0 left-0 w-64 shadow-xl flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-white'
            }`}>
            <div className={`p-4 border-b flex items-center justify-between ${isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
              <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Location</h2>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className={isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {/* All Level */}
              <button
                onClick={() => {
                  setSelectedLocation('all');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors border-b ${isDarkMode ? 'hover:bg-gray-800 border-gray-800' : 'hover:bg-gray-100 border-gray-200'}`}
                style={selectedLocation === 'all' ? {
                  backgroundColor: colorPalette?.primary ? `${colorPalette.primary}33` : 'rgba(124, 58, 237, 0.2)',
                  color: colorPalette?.primary || '#7c3aed',
                  fontWeight: 500
                } : {
                  color: isDarkMode ? '#d1d5db' : '#374151'
                }}
              >
                <div className="flex items-center">
                  <Tag className="h-4 w-4 mr-2" />
                  <span>All Discounts</span>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${selectedLocation === 'all'
                    ? 'text-white'
                    : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                    }`}
                  style={selectedLocation === 'all' ? {
                    backgroundColor: colorPalette?.primary || '#7c3aed'
                  } : {}}
                >
                  {locationItems.total}
                </span>
              </button>

              {/* Mobile Date Range Filter Section */}
              <div className={`px-4 py-3 border-b space-y-3 ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Created Date Range
                  </span>
                  {(createdDateFrom || createdDateTo) && (
                    <button
                      onClick={() => {
                        setCreatedDateFrom('');
                        setCreatedDateTo('');
                      }}
                      className="text-[10px] font-bold uppercase tracking-wider hover:underline"
                      style={{ color: colorPalette?.primary || '#7c3aed' }}
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <label className={`text-[10px] mb-1 block ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>From</label>
                    <input
                      type="date"
                      value={createdDateFrom}
                      onChange={(e) => setCreatedDateFrom(e.target.value)}
                      className={`w-full px-2 py-1.5 rounded text-xs focus:outline-none border ${isDarkMode
                        ? 'bg-gray-800 border-gray-700 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      style={createdDateFrom ? { borderColor: colorPalette?.primary || '#7c3aed' } : {}}
                    />
                  </div>
                  <div className="relative">
                    <label className={`text-[10px] mb-1 block ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>To</label>
                    <input
                      type="date"
                      value={createdDateTo}
                      onChange={(e) => setCreatedDateTo(e.target.value)}
                      className={`w-full px-2 py-1.5 rounded text-xs focus:outline-none border ${isDarkMode
                        ? 'bg-gray-800 border-gray-700 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      style={createdDateTo ? { borderColor: colorPalette?.primary || '#7c3aed' } : {}}
                    />
                  </div>
                </div>
              </div>

              {/* Region Level */}
              {locationItems.regions.map((region: any) => (
                <div key={region.id} className="border-b border-gray-800">
                  <button
                    onClick={() => {
                      setSelectedLocation(region.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${selectedLocation === region.id ? '' : 'text-gray-300'}`}
                    style={selectedLocation === region.id ? {
                      backgroundColor: colorPalette?.primary ? `${colorPalette.primary}33` : 'rgba(249, 115, 22, 0.2)',
                      color: colorPalette?.primary || '#7c3aed',
                      fontWeight: 500
                    } : {}}
                  >
                    <div className="flex items-center flex-1">
                      <button
                        onClick={(e) => toggleLocationExpansion(e, region.id)}
                        className="p-1 mr-1"
                      >
                        {expandedLocations.has(region.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      <Tag className="h-4 w-4 mr-2" />
                      <span>{region.name}</span>
                    </div>
                    {region.count > 0 && (
                      <span className={`px-2 py-1 rounded-full text-xs ${selectedLocation === region.id
                        ? 'text-white'
                        : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                        }`}
                        style={selectedLocation === region.id ? {
                          backgroundColor: colorPalette?.primary || '#7c3aed'
                        } : {}}
                      >
                        {region.count}
                      </span>
                    )}
                  </button>

                  {/* City Level */}
                  {expandedLocations.has(region.id) && region.cities.map((city: any) => (
                    <div key={city.id}>
                      <button
                        onClick={() => {
                          setSelectedLocation(city.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between pl-10 pr-4 py-2 text-sm transition-colors ${selectedLocation === city.id ? '' : 'text-gray-400'}`}
                        style={selectedLocation === city.id ? {
                          backgroundColor: colorPalette?.primary ? `${colorPalette.primary}22` : 'rgba(249, 115, 22, 0.1)',
                          color: colorPalette?.primary || '#7c3aed'
                        } : {}}
                      >
                        <div className="flex items-center flex-1">
                          <button
                            onClick={(e) => toggleLocationExpansion(e, city.id)}
                            className="p-1 mr-1"
                          >
                            {expandedLocations.has(city.id) ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronRight className="h-3 w-3" />
                            )}
                          </button>
                          <span>{city.name}</span>
                        </div>
                        {city.count > 0 && (
                          <span className="text-xs opacity-60">{city.count}</span>
                        )}
                      </button>

                      {/* Barangay Level */}
                      {expandedLocations.has(city.id) && city.barangays.map((barangay: any) => (
                        <button
                          key={barangay.id}
                          onClick={() => {
                            setSelectedLocation(barangay.id);
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between pl-16 pr-4 py-1.5 text-xs transition-colors ${selectedLocation === barangay.id ? '' : 'text-gray-500'}`}
                          style={selectedLocation === barangay.id ? {
                            color: colorPalette?.primary || '#7c3aed',
                            fontWeight: 'bold'
                          } : {}}
                        >
                          <div className="flex items-center flex-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-current mr-2 opacity-40"></span>
                            <span>{barangay.name}</span>
                          </div>
                          {barangay.count > 0 && (
                            <span className="text-[10px] opacity-50">{barangay.count}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedDiscount && (
        <div className="flex-shrink-0 overflow-hidden order-3">
          <DiscountDetails
            discountRecord={selectedDiscount}
            onClose={handleCloseDetails}
            onApproveSuccess={handleRefresh}
          />
        </div>
      )}

      {/* Discount Form Modal */}
      <DiscountFormModal
        isOpen={isDiscountFormModalOpen}
        onClose={handleCloseDiscountFormModal}
        onSave={handleSaveDiscount}
      />
    </div>
  );
};

export default Discounts;
