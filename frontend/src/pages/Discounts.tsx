import React, { useState, useEffect, useMemo } from 'react';
import { Search, ChevronRight, Tag, X } from 'lucide-react';
import DiscountDetails from '../components/DiscountDetails';

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
  modifiedBy: string;
  modifiedDate: string;
  userEmail: string;
  remarks: string;
  cityId?: number;
  barangay?: string;
  city?: string;
  completeAddress?: string;
  onlineStatus?: string;
}

interface LocationItem {
  id: string;
  name: string;
  count: number;
}

  // Mock service functions for the demo
const getDiscountRecords = async (): Promise<DiscountRecord[]> => {
  // In a real implementation, this would be an API call
  return [
    {
      id: '1',
      fullName: 'Michael C Cerda',
      accountNo: '202301255',
      contactNumber: '9568823688',
      emailAddress: 'mikecerda924@gmail.com',
      address: '0066 Sitio Kabilang Tabi',
      completeAddress: '0066 Sitio Kabilang Tabi, Pila Pila, Binangonan, Rizal',
      plan: 'SwitchNet - P999',
      provider: 'SWITCH',
      discountId: '20250902154042',
      discountAmount: 133.20,
      discountStatus: 'Unused',
      dateCreated: '9/2/2025',
      processedBy: 'Cheryll Mae Briones',
      processedDate: '9/2/2025',
      approvedBy: 'Maria Zolina C. Anore',
      modifiedBy: 'Cheryll Mae Briones',
      modifiedDate: '9/2/2025 3:40:42 PM',
      userEmail: 'cheryll.briones@switchfiber.ph',
      remarks: 'rebate for 4 days high loss',
      cityId: 1,
      barangay: 'Pila Pila',
      city: 'Binangonan',
      onlineStatus: 'Online'
    },
    {
      id: '2',
      fullName: 'Jane Smith',
      accountNo: '202306002',
      contactNumber: '9456789123',
      emailAddress: 'jane.smith@example.com',
      address: '456 Oak St',
      completeAddress: '456 Oak St, Malaban, Binangonan, Rizal',
      plan: 'SwitchLite - P699',
      provider: 'SWITCH',
      discountId: '20250903154043',
      discountAmount: 200,
      discountStatus: 'Used',
      dateCreated: '9/3/2025',
      processedBy: 'Cheryll Mae Briones',
      processedDate: '9/3/2025',
      approvedBy: 'Maria Zolina C. Anore',
      modifiedBy: 'Cheryll Mae Briones',
      modifiedDate: '9/3/2025 1:15:22 PM',
      userEmail: 'cheryll.briones@switchfiber.ph',
      remarks: 'referral discount',
      cityId: 1,
      barangay: 'Malaban',
      city: 'Binangonan',
      onlineStatus: 'Offline'
    }
  ];
};

const getCities = async () => {
  // In a real implementation, this would be an API call
  return [
    { id: 1, name: 'Quezon City' },
    { id: 2, name: 'Manila' },
    { id: 3, name: 'Makati' }
  ];
};

const getRegions = async () => {
  // In a real implementation, this would be an API call
  return [
    { id: 1, name: 'Metro Manila' },
    { id: 2, name: 'Calabarzon' }
  ];
};

const Discounts: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDiscount, setSelectedDiscount] = useState<DiscountRecord | null>(null);
  const [discountRecords, setDiscountRecords] = useState<DiscountRecord[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch location data
  useEffect(() => {
    const fetchLocationData = async () => {
      try {
        const [citiesData, regionsData] = await Promise.all([
          getCities(),
          getRegions()
        ]);
        setCities(citiesData || []);
        setRegions(regionsData || []);
      } catch (err) {
        console.error('Failed to fetch location data:', err);
        setCities([]);
        setRegions([]);
      }
    };
    
    fetchLocationData();
  }, []);

  // Fetch discount data
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

  // Memoize city name lookup for performance
  const getCityName = useMemo(() => {
    const cityMap = new Map(cities.map(c => [c.id, c.name]));
    return (cityId: number | null | undefined): string => {
      if (!cityId) return 'Unknown City';
      return cityMap.get(cityId) || `City ${cityId}`;
    };
  }, [cities]);

  // Memoize location items for performance
  const locationItems: LocationItem[] = useMemo(() => {
    const items: LocationItem[] = [
      {
        id: 'all',
        name: 'All',
        count: discountRecords.length
      }
    ];
    
    // Add cities with counts
    cities.forEach((city) => {
      const cityCount = discountRecords.filter(record => record.cityId === city.id).length;
      items.push({
        id: String(city.id),
        name: city.name,
        count: cityCount
      });
    });

    return items;
  }, [cities, discountRecords]);

  // Memoize filtered records for performance
  const filteredDiscountRecords = useMemo(() => {
    return discountRecords.filter(record => {
      const matchesLocation = selectedLocation === 'all' || 
                             record.cityId === Number(selectedLocation);
      
      const matchesSearch = searchQuery === '' || 
                           record.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           record.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           record.accountNo.includes(searchQuery);
      
      return matchesLocation && matchesSearch;
    });
  }, [discountRecords, selectedLocation, searchQuery]);

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

  return (
    <div className="bg-gray-950 h-full flex flex-col md:flex-row overflow-hidden">
      {/* Location Sidebar - Desktop / Bottom Navbar - Mobile */}
      <div className="md:w-64 bg-gray-900 md:border-r border-t md:border-t-0 border-gray-700 flex-shrink-0 flex flex-col order-2 md:order-1">
        <div className="p-4 border-b border-gray-700 flex-shrink-0 hidden md:block">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-semibold text-white">Discounts</h2>
            <div>
              <button 
                className="flex items-center space-x-1 bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm"
                onClick={() => alert('Add new discount')}
              >
                <span className="font-bold">+</span>
                <span>Add</span>
              </button>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto md:block overflow-x-auto">
          <div className="flex md:flex-col md:space-y-0 space-x-2 md:space-x-0 p-2 md:p-0">
            {locationItems.map((location) => (
              <button
                key={location.id}
                onClick={() => setSelectedLocation(location.id)}
                className={`md:w-full flex-shrink-0 flex flex-col md:flex-row items-center md:justify-between px-4 py-3 text-sm transition-colors hover:bg-gray-800 rounded-md md:rounded-none ${
                  selectedLocation === location.id
                    ? location.id === 'all' 
                      ? 'bg-orange-500 bg-opacity-20 text-orange-400' 
                      : 'bg-orange-500 bg-opacity-20 text-orange-400'
                    : 'text-gray-300'
                }`}
              >
                {location.id === 'all' ? (
                  <>
                    <span className="text-xs md:text-sm whitespace-nowrap">All</span>
                    {location.count > 0 && (
                      <span className={`px-2 py-1 rounded-full text-xs mt-1 md:mt-0 ${
                        selectedLocation === location.id
                          ? 'bg-orange-600 text-white'
                          : 'bg-gray-700 text-gray-300'
                      }`}>
                        {location.count}
                      </span>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col md:flex-row items-center md:justify-between w-full">
                    <div className="flex items-center">
                      <ChevronRight size={16} className="mr-2 hidden md:block" />
                      <span className="capitalize text-xs md:text-sm whitespace-nowrap">{location.name}</span>
                    </div>
                    {location.count > 0 && (
                      <span className={`px-2 py-1 rounded-full text-xs mt-1 md:mt-0 ${
                        selectedLocation === location.id
                          ? 'bg-orange-600 text-white'
                          : 'bg-gray-700 text-gray-300'
                      }`}>
                        {location.count}
                      </span>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-gray-950 overflow-hidden order-1 md:order-2">
        {/* Main content without the search bar */}
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto">
              {isLoading ? (
                <div className="px-4 py-12 text-center text-gray-400">
                  <div className="animate-pulse flex flex-col items-center">
                    <div className="h-4 w-1/3 bg-gray-700 rounded mb-4"></div>
                    <div className="h-4 w-1/2 bg-gray-700 rounded"></div>
                  </div>
                  <p className="mt-4">Loading discount records...</p>
                </div>
              ) : error ? (
                <div className="px-4 py-12 text-center text-red-400">
                  <p>{error}</p>
                  <button 
                    onClick={handleRefresh}
                    className="mt-4 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded">
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
                        className={`px-4 py-3 cursor-pointer transition-colors hover:bg-gray-800 border-b border-gray-800 ${selectedDiscount?.id === record.id ? 'bg-gray-800' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-medium">
                              {record.fullName}
                            </div>
                            <div className="text-red-400 text-sm">
                              {record.accountNo} | {record.fullName} | {record.address}
                            </div>
                          </div>
                          <div className="flex items-center ml-4 flex-shrink-0">
                            <span className="text-white">
                              ₱{record.discountAmount.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      No discount records found matching your filters
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedDiscount && (
        <div className="w-full max-w-3xl bg-gray-900 border-l border-gray-700 flex-shrink-0 relative">
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={handleCloseDetails}
              className="text-gray-400 hover:text-white transition-colors bg-gray-800 rounded p-1"
            >
              <X size={20} />
            </button>
          </div>
          <DiscountDetails
            discountRecord={selectedDiscount}
          />
        </div>
      )}
    </div>
  );
};

export default Discounts;
