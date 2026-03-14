import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Receipt, Search, ChevronRight, Tag, ChevronDown, Menu, X, ChevronsLeft, ChevronsRight } from 'lucide-react';
import DiscountDetails from '../components/DiscountDetails';
import DiscountFormModal from '../modals/DiscountFormModal';
import { useDiscountStore, DiscountRecord } from '../store/discountStore';
import pusher from '../services/pusherService';
import { settingsColorPaletteService, ColorPalette } from '../services/settingsColorPaletteService';
import BillingDetails from '../components/CustomerDetails';
import { getCustomerDetail, CustomerDetailData } from '../services/customerDetailService';
import { BillingDetailRecord } from '../types/billing';
import { getCities, City } from '../services/cityService';
import { getRegions, Region } from '../services/regionService';
import { barangayService, Barangay } from '../services/barangayService';

interface LocationItem {
  id: string;
  name: string;
  count: number;
}


const convertCustomerDataToBillingDetail = (customerData: CustomerDetailData): BillingDetailRecord => {
  return {
    id: customerData.billingAccount?.accountNo || '',
    applicationId: customerData.billingAccount?.accountNo || '',
    customerName: customerData.fullName,
    address: customerData.address,
    status: customerData.billingAccount?.billingStatusId === 2 ? 'Active' : 'Inactive',
    balance: customerData.billingAccount?.accountBalance || 0,
    onlineStatus: customerData.billingAccount?.billingStatusId === 2 ? 'Online' : 'Offline',
    cityId: null,
    regionId: null,
    timestamp: customerData.updatedAt || '',
    billingStatus: customerData.billingAccount?.billingStatusId ? `Status ${customerData.billingAccount.billingStatusId}` : '',
    dateInstalled: customerData.billingAccount?.dateInstalled || '',
    contactNumber: customerData.contactNumberPrimary,
    secondContactNumber: customerData.contactNumberSecondary || '',
    emailAddress: customerData.emailAddress || '',
    plan: customerData.desiredPlan || '',
    username: customerData.technicalDetails?.username || '',
    connectionType: customerData.technicalDetails?.connectionType || '',
    routerModel: customerData.technicalDetails?.routerModel || '',
    routerModemSN: customerData.technicalDetails?.routerModemSn || '',
    lcpnap: customerData.technicalDetails?.lcpnap || '',
    port: customerData.technicalDetails?.port || '',
    vlan: customerData.technicalDetails?.vlan || '',
    billingDay: customerData.billingAccount?.billingDay || 0,
    totalPaid: 0,
    provider: '',
    lcp: customerData.technicalDetails?.lcp || '',
    nap: customerData.technicalDetails?.nap || '',
    modifiedBy: '',
    modifiedDate: customerData.updatedAt || '',
    barangay: customerData.barangay || '',
    city: customerData.city || '',
    region: customerData.region || '',

    usageType: customerData.technicalDetails?.usageTypeId ? `Type ${customerData.technicalDetails.usageTypeId}` : '',
    referredBy: customerData.referredBy || '',
    referralContactNo: '',
    groupName: customerData.groupName || '',
    mikrotikId: '',
    sessionIp: customerData.technicalDetails?.ipAddress || '',
    houseFrontPicture: customerData.houseFrontPictureUrl || '',
    accountBalance: customerData.billingAccount?.accountBalance || 0,
    housingStatus: customerData.housingStatus || '',
    addressCoordinates: customerData.addressCoordinates || '',
  };
};

const Discounts: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDiscount, setSelectedDiscount] = useState<DiscountRecord | null>(null);
  const { discountRecords, isLoading, error, refreshDiscounts, silentRefresh } = useDiscountStore();
  const [cities, setCities] = useState<City[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [sidebarWidth, setSidebarWidth] = useState<number>(256);
  const [isResizingSidebar, setIsResizingSidebar] = useState<boolean>(false);
  const sidebarStartXRef = useRef<number>(0);
  const sidebarStartWidthRef = useRef<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [colorPalette, setColorPalette] = useState<ColorPalette | null>(null);
  const [isDiscountFormModalOpen, setIsDiscountFormModalOpen] = useState<boolean>(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetailData | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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

  // Trigger silent refresh on mount to ensure data is fresh but no spinner if cached
  useEffect(() => {
    silentRefresh();
  }, [silentRefresh]);

  // Pusher/Soketi connection for real-time discount updates
  useEffect(() => {
    const handleUpdate = async (data: any) => {
      console.log('[Discounts Soketi] Update received, silently refreshing:', data);
      try {
        await silentRefresh();
        console.log('[Discounts Soketi] Data refreshed successfully');
      } catch (err) {
        console.error('[Discounts Soketi] Failed to refresh data:', err);
      }
    };

    const discountChannel = pusher.subscribe('discounts');

    discountChannel.bind('discount-updated', handleUpdate);

    return () => {
      discountChannel.unbind('discount-updated', handleUpdate);
      pusher.unsubscribe('discounts');
    };
  }, [silentRefresh]);

  // Idle detection and auto-refresh logic
  useEffect(() => {
    const IDLE_TIME_LIMIT = 15 * 60 * 1000; // 15 minutes
    let idleTimer: NodeJS.Timeout | null = null;

    const refreshData = async () => {
      console.log('User idle for 15 minutes, auto-refreshing discount data...');
      try {
        await silentRefresh();
      } catch (err) {
        console.error('Idle refresh failed:', err);
      }
      // Set the timer again to refresh every 15 mins if they remain idle
      startTimer();
    };

    const startTimer = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(refreshData, IDLE_TIME_LIMIT);
    };

    const resetTimer = () => {
      startTimer();
    };

    const activityEvents = ['mousedown', 'keypress', 'touchstart'];

    const handleActivity = () => {
      resetTimer();
    };

    // Use passive listeners for performance
    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    startTimer(); // Initialize timer on mount

    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [silentRefresh]);

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

  // Generate hierarchical location items
  const locationItems = useMemo(() => {
    // Counts for each level
    const regionCounts: Record<string, number> = {};
    const cityCounts: Record<string, number> = {};
    const barangayCounts: Record<string, number> = {};

    // Initialize counts
    regions.forEach(r => regionCounts[r.name] = 0);
    cities.forEach(c => cityCounts[`${c.region_id}_${c.name}`] = 0);
    barangays.forEach(b => barangayCounts[`${b.city_id}_${b.barangay}`] = 0);

    // Count appearances in discountRecords
    discountRecords.forEach(record => {
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
      total: discountRecords.length
    };
  }, [regions, cities, barangays, discountRecords]);


  const filteredDiscountRecords = useMemo(() => {
    return discountRecords.filter(record => {
      let matchesLocation = selectedLocation === 'all';

      if (!matchesLocation) {
        if (selectedLocation.startsWith('reg:')) {
          matchesLocation = record.region === selectedLocation.substring(4);
        } else if (selectedLocation.startsWith('city:')) {
          matchesLocation = record.city === selectedLocation.substring(5);
        } else if (selectedLocation.startsWith('brgy:')) {
          matchesLocation = record.barangay === selectedLocation.substring(5);
        } else {
          // Fallback for old numeric city IDs if any
          matchesLocation = record.cityId === Number(selectedLocation);
        }
      }

      const normalizedQuery = searchQuery.toLowerCase().replace(/\s+/g, '');
      const matchesSearch = searchQuery === '' ||
        record.fullName.toLowerCase().replace(/\s+/g, '').includes(normalizedQuery) ||
        record.address.toLowerCase().replace(/\s+/g, '').includes(normalizedQuery) ||
        record.accountNo.replace(/\s+/g, '').includes(normalizedQuery);

      return matchesLocation && matchesSearch;
    });
  }, [discountRecords, selectedLocation, searchQuery]);


  // Reset page when search or location changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedLocation, itemsPerPage]);

  // Scroll to top on page change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage]);

  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredDiscountRecords.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredDiscountRecords, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredDiscountRecords.length / itemsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    return (
      <div className={`flex items-center justify-between px-4 py-3 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className={`flex items-center gap-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className={`px-2 py-1 rounded border text-sm focus:outline-none ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>entries</span>
          </div>
          <span>
            Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredDiscountRecords.length)}</span> of <span className="font-medium">{filteredDiscountRecords.length}</span> results
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className={`p-1 rounded transition-colors ${currentPage === 1
              ? (isDarkMode ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed')
              : (isDarkMode ? 'text-white hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100')
              }`}
            title="First Page"
          >
            <ChevronsLeft className="h-5 w-5" />
          </button>

          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded text-sm transition-colors ${currentPage === 1
              ? (isDarkMode ? 'text-gray-600 bg-gray-800 cursor-not-allowed' : 'text-gray-400 bg-gray-100 cursor-not-allowed')
              : (isDarkMode ? 'text-white bg-gray-700 hover:bg-gray-600' : 'text-gray-700 bg-white hover:bg-gray-50 border border-gray-300')
              }`}
          >
            Previous
          </button>

          <div className="flex items-center space-x-1">
            <span className={`px-2 text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Page {currentPage} of {totalPages}
            </span>
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded text-sm transition-colors ${currentPage === totalPages
              ? (isDarkMode ? 'text-gray-600 bg-gray-800 cursor-not-allowed' : 'text-gray-400 bg-gray-100 cursor-not-allowed')
              : (isDarkMode ? 'text-white bg-gray-700 hover:bg-gray-600' : 'text-gray-700 bg-white hover:bg-gray-50 border border-gray-300')
              }`}
          >
            Next
          </button>

          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className={`p-1 rounded transition-colors ${currentPage === totalPages
              ? (isDarkMode ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed')
              : (isDarkMode ? 'text-white hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100')
              }`}
            title="Last Page"
          >
            <ChevronsRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  };

  const handleRecordClick = (record: DiscountRecord) => {
    setSelectedDiscount(record);
    setSelectedCustomer(null); // Clear customer view when switching records
  };

  const handleViewCustomer = async (accountNo: string) => {
    setIsLoadingDetails(true);
    try {
      const detail = await getCustomerDetail(accountNo);
      if (detail) {
        setSelectedCustomer(detail);
      }
    } catch (err) {
      console.error('Error fetching customer details:', err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedDiscount(null);
  };

  const handleRefresh = async () => {
    await refreshDiscounts();
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
    <div className={`h-full flex flex-col md:flex-row overflow-hidden pb-16 md:pb-0 ${isDarkMode ? 'bg-gray-950' : 'bg-gray-50'
      }`}>
      <div className={`hidden md:flex border-r flex-shrink-0 flex flex-col relative ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
        }`} style={{ width: `${sidebarWidth}px` }}>
        <div className={`p-4 border-b flex-shrink-0 hidden md:block ${isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
          <div className="flex items-center justify-between mb-1">
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Discounts</h2>
            <div>
              <button
                className="flex items-center space-x-1 text-white px-3 py-1 rounded text-sm transition-colors"
                onClick={handleOpenDiscountFormModal}
                style={{
                  backgroundColor: colorPalette?.primary || '#7c3aed'
                }}
                onMouseEnter={(e) => {
                  if (colorPalette?.accent) {
                    e.currentTarget.style.backgroundColor = colorPalette.accent;
                  }
                }}
                onMouseLeave={(e) => {
                  if (colorPalette?.primary) {
                    e.currentTarget.style.backgroundColor = colorPalette.primary;
                  } else {
                    e.currentTarget.style.backgroundColor = '#7c3aed';
                  }
                }}
              >
                <span className="font-bold">+</span>
                <span>Add</span>
              </button>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {/* All Level */}
          <button
            onClick={() => setSelectedLocation('all')}
            className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
              } ${selectedLocation === 'all'
                ? ''
                : isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}
            style={selectedLocation === 'all' ? {
              backgroundColor: colorPalette?.primary ? `${colorPalette.primary}33` : 'rgba(124, 58, 237, 0.2)',
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
                  backgroundColor: colorPalette?.primary ? `${colorPalette.primary}33` : 'rgba(124, 58, 237, 0.2)',
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
                      backgroundColor: colorPalette?.primary ? `${colorPalette.primary}22` : 'rgba(124, 58, 237, 0.1)',
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
                        <span className="text-[10px] opacity-50">{barangay.count}</span>
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

      <div className={`flex-1 overflow-hidden flex flex-col ${isDarkMode ? 'bg-gray-950' : 'bg-gray-50'
        }`}>
        <div className={`p-4 border-b flex-shrink-0 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
          }`}>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden bg-gray-700 hover:bg-gray-600 text-white p-2 rounded text-sm transition-colors flex items-center justify-center"
              aria-label="Open filter menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search discounts..."
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
            <div className="md:hidden">
              <button
                className="flex items-center space-x-1 text-white px-3 py-2 rounded text-sm transition-colors"
                onClick={handleOpenDiscountFormModal}
                style={{
                  backgroundColor: colorPalette?.primary || '#7c3aed'
                }}
              >
                <span className="font-bold">+</span>
                <span>Add</span>
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto" ref={scrollRef}>
              {isLoading ? (
                <div className={`px-4 py-12 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                  <div className="animate-pulse flex flex-col items-center">
                    <div className={`h-4 w-1/3 rounded mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
                      }`}></div>
                    <div className={`h-4 w-1/2 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
                      }`}></div>
                  </div>
                  <p className="mt-4">Loading discount records...</p>
                </div>
              ) : error ? (
                <div className={`px-4 py-12 text-center ${isDarkMode ? 'text-red-400' : 'text-red-600'
                  }`}>
                  <p>{error}</p>
                  <button
                    onClick={handleRefresh}
                    className={`mt-4 px-4 py-2 rounded ${isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                      }`}>
                    Retry
                  </button>
                </div>
              ) : (
                <div className="space-y-0">
                  {paginatedRecords.length > 0 ? (
                    paginatedRecords.map((record) => (
                      <div
                        key={record.id}
                        onClick={() => handleRecordClick(record)}
                        className={`px-4 py-3 cursor-pointer transition-colors border-b ${isDarkMode ? 'hover:bg-gray-800 border-gray-800' : 'hover:bg-gray-100 border-gray-200'
                          } ${selectedDiscount?.id === record.id ? (isDarkMode ? 'bg-gray-800' : 'bg-gray-100') : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
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
                    <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                      No discount records found matching your filters
                    </div>
                  )}
                </div>
              )}
            </div>
            {!isLoading && !error && filteredDiscountRecords.length > 0 && <PaginationControls />}
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
                <span className="px-2 py-1 rounded-full text-xs bg-gray-700 text-gray-300">
                  {locationItems.total}
                </span>
              </button>

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
                      backgroundColor: colorPalette?.primary ? `${colorPalette.primary}33` : 'rgba(124, 58, 237, 0.2)',
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
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-700 text-gray-300">
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
                          backgroundColor: colorPalette?.primary ? `${colorPalette.primary}22` : 'rgba(124, 58, 237, 0.1)',
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
        <div className="flex-shrink-0 overflow-hidden">
          <DiscountDetails
            discountRecord={selectedDiscount as any}
            onClose={handleCloseDetails}
            onApproveSuccess={handleRefresh}
            onViewCustomer={handleViewCustomer}
          />
        </div>
      )}

      {(selectedCustomer || isLoadingDetails) && (
        <div className="flex-shrink-0 overflow-hidden">
          {isLoadingDetails ? (
            <div className={`w-[600px] h-full flex items-center justify-center border-l ${isDarkMode
              ? 'bg-gray-900 text-white border-white border-opacity-30'
              : 'bg-white text-gray-900 border-gray-300'
              }`}>
              <div className="text-center">
                <div
                  className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
                  style={{ borderBottomColor: colorPalette?.primary || '#7c3aed' }}
                ></div>
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Loading details...</p>
              </div>
            </div>
          ) : selectedCustomer ? (
            <BillingDetails
              billingRecord={convertCustomerDataToBillingDetail(selectedCustomer)}
              onlineStatusRecords={[]}
              onClose={() => setSelectedCustomer(null)}
            />
          ) : null}
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
