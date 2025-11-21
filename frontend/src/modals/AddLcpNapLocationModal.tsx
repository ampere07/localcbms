import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, MapPin, ChevronDown, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { getRegions, getCities, City } from '../services/cityService';
import { barangayService, Barangay } from '../services/barangayService';
import { locationDetailService, LocationDetail } from '../services/locationDetailService';
import { getActiveImageSize, resizeImage, ImageSizeSetting } from '../services/imageSettingsService';
import { GOOGLE_MAPS_API_KEY } from '../config/maps';

interface AddLcpNapLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

interface LCP {
  id: number;
  lcp_name: string;
}

interface NAP {
  id: number;
  nap_name: string;
}

interface Region {
  id: number;
  name: string;
}

const AddLcpNapLocationModal: React.FC<AddLcpNapLocationModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const getCurrentUser = () => {
    try {
      const authData = localStorage.getItem('authData');
      if (authData) {
        const user = JSON.parse(authData);
        return user.email || '';
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
    return '';
  };

  const currentUserEmail = getCurrentUser();

  const [formData, setFormData] = useState({
    reading_image: null as File | null,
    street: '',
    barangay: '',
    city: '',
    region: '',
    location: '',
    lcp_name: '',
    nap_name: '',
    port_total: '',
    lcpnap_name: '',
    coordinates: '',
    image: null as File | null,
    image_2: null as File | null,
    modified_by: currentUserEmail,
  });

  const [imagePreviews, setImagePreviews] = useState({
    reading_image: null as string | null,
    image: null as string | null,
    image_2: null as string | null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loadingPercentage, setLoadingPercentage] = useState(0);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultType, setResultType] = useState<'success' | 'error'>('success');
  const [resultMessage, setResultMessage] = useState('');
  const [lcpList, setLcpList] = useState<LCP[]>([]);
  const [napList, setNapList] = useState<NAP[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [allCities, setAllCities] = useState<City[]>([]);
  const [allBarangays, setAllBarangays] = useState<Barangay[]>([]);
  const [allLocations, setAllLocations] = useState<LocationDetail[]>([]);
  const [showCoordinatesMap, setShowCoordinatesMap] = useState<boolean>(false);
  const [activeImageSize, setActiveImageSize] = useState<ImageSizeSetting | null>(null);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  const API_BASE_URL = 'https://backend.atssfiber.ph/api';

  useEffect(() => {
    if (isOpen) {
      loadDropdownData();
      fetchImageSizeSettings();
      resetForm();
    }
  }, [isOpen]);

  const fetchImageSizeSettings = async () => {
    try {
      const settings = await getActiveImageSize();
      setActiveImageSize(settings);
    } catch (error) {
      setActiveImageSize(null);
    }
  };

  useEffect(() => {
    if (showCoordinatesMap && !mapInstanceRef.current) {
      loadMapScript();
    }

    return () => {
      cleanupMap();
    };
  }, [showCoordinatesMap]);

  useEffect(() => {
    if (formData.lcp_name && formData.nap_name) {
      const generatedName = `${formData.lcp_name} to ${formData.nap_name}`;
      setFormData(prev => ({ ...prev, lcpnap_name: generatedName }));
    }
  }, [formData.lcp_name, formData.nap_name]);

  const loadMapScript = () => {
    if (window.google?.maps) {
      initializeMap();
      return;
    }

    const existingScript = document.getElementById('google-maps-script-modal');
    if (existingScript) {
      existingScript.addEventListener('load', initializeMap);
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script-modal';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`;
    script.async = true;
    script.defer = true;
    script.onload = initializeMap;
    script.onerror = () => {
      console.error('Failed to load Google Maps script');
    };
    document.head.appendChild(script);
  };

  const initializeMap = () => {
    if (!mapRef.current || !window.google?.maps) return;

    cleanupMap();

    try {
      const defaultLat = 14.5995;
      const defaultLng = 120.9842;
      
      const map = new google.maps.Map(mapRef.current, {
        center: { lat: defaultLat, lng: defaultLng },
        zoom: 6,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
      });

      map.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          handleMapClick(e.latLng.lat(), e.latLng.lng());
        }
      });

      mapInstanceRef.current = map;

      if (formData.coordinates) {
        const coords = formData.coordinates.split(',').map(c => c.trim());
        if (coords.length === 2) {
          const lat = parseFloat(coords[0]);
          const lng = parseFloat(coords[1]);
          if (!isNaN(lat) && !isNaN(lng)) {
            addMarkerToMap(lat, lng);
            map.setCenter({ lat, lng });
            map.setZoom(15);
          }
        }
      }
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  const cleanupMap = () => {
    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }
    mapInstanceRef.current = null;
  };

  const handleMapClick = (lat: number, lng: number) => {
    addMarkerToMap(lat, lng);
    setFormData(prev => ({
      ...prev,
      coordinates: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    }));
    if (errors.coordinates) {
      setErrors(prev => ({ ...prev, coordinates: '' }));
    }
  };

  const addMarkerToMap = (lat: number, lng: number) => {
    if (!mapInstanceRef.current || !window.google?.maps) return;

    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    const marker = new google.maps.Marker({
      position: { lat, lng },
      map: mapInstanceRef.current,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#f97316',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
      title: 'Selected Location'
    });

    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="font-family: system-ui; text-align: center; color: #1f2937;">
          <strong>Selected Location</strong><br/>
          <span style="font-size: 12px; color: #666;">${lat.toFixed(6)}, ${lng.toFixed(6)}</span>
        </div>
      `
    });

    marker.addListener('click', () => {
      infoWindow.open(mapInstanceRef.current, marker);
    });

    markerRef.current = marker;
  };

  const handleToggleMap = () => {
    setShowCoordinatesMap(!showCoordinatesMap);
  };

  const loadDropdownData = async () => {
    try {
      const [lcpResponse, napResponse, regionsData, citiesData, barangaysData, locationsData] = await Promise.all([
        fetch(`${API_BASE_URL}/lcp`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        }),
        fetch(`${API_BASE_URL}/nap`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        }),
        getRegions(),
        getCities(),
        barangayService.getAll(),
        locationDetailService.getAll()
      ]);

      const lcpData = await lcpResponse.json();
      const napData = await napResponse.json();

      if (lcpData.success) {
        setLcpList(lcpData.data || []);
      }
      if (napData.success) {
        setNapList(napData.data || []);
      }
      if (Array.isArray(regionsData)) {
        setRegions(regionsData);
      }
      if (Array.isArray(citiesData)) {
        setAllCities(citiesData);
      }
      if (barangaysData.success && Array.isArray(barangaysData.data)) {
        setAllBarangays(barangaysData.data);
      }
      if (locationsData.success && Array.isArray(locationsData.data)) {
        setAllLocations(locationsData.data);
      }
    } catch (error) {
      console.error('Error loading dropdown data:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.lcp_name) {
      newErrors.lcp_name = 'LCP is required';
    }
    if (!formData.nap_name) {
      newErrors.nap_name = 'NAP is required';
    }
    if (!formData.port_total) {
      newErrors.port_total = 'PORT TOTAL is required';
    }
    if (!formData.lcpnap_name.trim()) {
      newErrors.lcpnap_name = 'LCPNAP is required';
    }
    if (!formData.coordinates.trim()) {
      newErrors.coordinates = 'Coordinates is required';
    }
    if (!formData.image) {
      newErrors.image = 'Image is required';
    }
    if (!formData.image_2) {
      newErrors.image_2 = 'Image 2 is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = async (field: 'reading_image' | 'image' | 'image_2', file: File) => {
    try {
      let processedFile = file;
      
      if (activeImageSize && activeImageSize.image_size_value < 100) {
        try {
          processedFile = await resizeImage(file, activeImageSize.image_size_value);
        } catch (resizeError) {
          processedFile = file;
        }
      }
      
      setFormData(prev => ({ ...prev, [field]: processedFile }));
      
      if (imagePreviews[field]) {
        URL.revokeObjectURL(imagePreviews[field]!);
      }
      
      const previewUrl = URL.createObjectURL(processedFile);
      setImagePreviews(prev => ({ ...prev, [field]: previewUrl }));
      
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
      }
    } catch (error) {
      setFormData(prev => ({ ...prev, [field]: file }));
      
      if (imagePreviews[field]) {
        URL.revokeObjectURL(imagePreviews[field]!);
      }
      
      const previewUrl = URL.createObjectURL(file);
      setImagePreviews(prev => ({ ...prev, [field]: previewUrl }));
      
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
      }
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setShowLoadingModal(true);
    setUploadProgress(0);
    setLoadingPercentage(0);
    
    const progressInterval = setInterval(() => {
      setLoadingPercentage(prev => {
        if (prev >= 99) return 99;
        if (prev >= 90) return prev + 0.5;
        if (prev >= 70) return prev + 1;
        return prev + 3;
      });
    }, 200);
    
    try {
      const submitData = new FormData();
      
      console.log('=== FORM SUBMISSION DEBUG START ===');
      console.log('Form Data:', {
        reading_image: formData.reading_image?.name,
        street: formData.street,
        barangay: formData.barangay,
        city: formData.city,
        region: formData.region,
        location: formData.location,
        lcp_name: formData.lcp_name,
        nap_name: formData.nap_name,
        port_total: formData.port_total,
        lcpnap_name: formData.lcpnap_name,
        coordinates: formData.coordinates,
        image: formData.image?.name,
        image_2: formData.image_2?.name,
        modified_by: formData.modified_by,
      });
      
      if (formData.reading_image) {
        submitData.append('reading_image', formData.reading_image);
      }
      submitData.append('street', formData.street);
      submitData.append('barangay', formData.barangay);
      submitData.append('city', formData.city);
      submitData.append('region', formData.region);
      submitData.append('location', formData.location);
      submitData.append('lcp_id', formData.lcp_name);
      submitData.append('nap_id', formData.nap_name);
      submitData.append('port_total', formData.port_total);
      submitData.append('lcpnap_name', formData.lcpnap_name);
      submitData.append('coordinates', formData.coordinates);
      if (formData.image) {
        submitData.append('image', formData.image);
      }
      if (formData.image_2) {
        submitData.append('image_2', formData.image_2);
      }
      submitData.append('modified_by', formData.modified_by);

      console.log('FormData entries:');
      Array.from(submitData.entries()).forEach(([key, value]) => {
        if (value instanceof File) {
          console.log(`${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
        } else {
          console.log(`${key}: ${value}`);
        }
      });

      console.log('Sending POST request to:', `${API_BASE_URL}/lcpnap`);
      
      const xhr = new XMLHttpRequest();
      
      const uploadPromise = new Promise<Response>((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(new Response(xhr.responseText, {
              status: xhr.status,
              statusText: xhr.statusText,
              headers: new Headers({
                'content-type': xhr.getResponseHeader('content-type') || 'application/json'
              })
            }));
          } else {
            reject(new Error(`HTTP error! status: ${xhr.status}`));
          }
        });
        
        xhr.addEventListener('error', () => reject(new Error('Network error')));
        xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));
        
        xhr.open('POST', `${API_BASE_URL}/lcpnap`);
        xhr.send(submitData);
      });
      
      const response = await uploadPromise;

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      let data;
      const contentType = response.headers.get('content-type');
      console.log('Content-Type:', contentType);
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
        console.log('Response data:', data);
      } else {
        const textResponse = await response.text();
        console.log('Non-JSON response:', textResponse);
        throw new Error(`Server returned non-JSON response: ${textResponse.substring(0, 200)}`);
      }

      if (!response.ok || !data.success) {
        console.error('Request failed:', {
          status: response.status,
          statusText: response.statusText,
          data: data
        });
        throw new Error(data.message || data.error || 'Failed to save LCPNAP');
      }

      console.log('=== FORM SUBMISSION SUCCESS ===');
      clearInterval(progressInterval);
      setLoadingPercentage(100);
      await new Promise(resolve => setTimeout(resolve, 500));
      setShowLoadingModal(false);
      setResultType('success');
      setResultMessage('LCP/NAP location created successfully');
      setShowResultModal(true);
      
      setTimeout(() => {
        setShowResultModal(false);
        onSave();
        handleClose();
      }, 2000);
      
    } catch (error: any) {
      console.error('=== FORM SUBMISSION ERROR ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Full error:', error);
      
      clearInterval(progressInterval);
      setShowLoadingModal(false);
      setResultType('error');
      setResultMessage(error.message || 'Failed to save LCP/NAP location');
      setShowResultModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      reading_image: null,
      street: '',
      barangay: '',
      city: '',
      region: '',
      location: '',
      lcp_name: '',
      nap_name: '',
      port_total: '',
      lcpnap_name: '',
      coordinates: '',
      image: null,
      image_2: null,
      modified_by: currentUserEmail,
    });
    setImagePreviews({
      reading_image: null,
      image: null,
      image_2: null,
    });
    setErrors({});
  };

  const handleRegionChange = (regionName: string) => {
    setFormData(prev => ({ 
      ...prev, 
      region: regionName,
      city: '',
      barangay: '',
      location: ''
    }));
  };

  const handleCityChange = (cityName: string) => {
    setFormData(prev => ({ 
      ...prev, 
      city: cityName,
      barangay: '',
      location: ''
    }));
  };

  const handleBarangayChange = (barangayName: string) => {
    setFormData(prev => ({ 
      ...prev, 
      barangay: barangayName,
      location: ''
    }));
  };

  const getFilteredCities = () => {
    if (!formData.region) return [];
    const selectedRegion = regions.find(reg => reg.name === formData.region);
    if (!selectedRegion) return [];
    return allCities.filter(city => city.region_id === selectedRegion.id);
  };

  const getFilteredBarangays = () => {
    if (!formData.city) return [];
    const selectedCity = allCities.find(city => city.name === formData.city);
    if (!selectedCity) return [];
    return allBarangays.filter(brgy => brgy.city_id === selectedCity.id);
  };

  const getFilteredLocations = () => {
    if (!formData.barangay) return [];
    const selectedBarangay = allBarangays.find(brgy => brgy.barangay === formData.barangay);
    if (!selectedBarangay) return [];
    return allLocations.filter(loc => loc.barangay_id === selectedBarangay.id);
  };

  const filteredCities = getFilteredCities();
  const filteredBarangays = getFilteredBarangays();
  const filteredLocations = getFilteredLocations();

  const ImageUploadField: React.FC<{
    label: string;
    field: 'reading_image' | 'image' | 'image_2';
    required?: boolean;
    error?: string;
  }> = ({ label, field, required, error }) => (
    <div>
      <label className="block text-sm font-medium text-white mb-2">
        {label}{required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative w-full h-48 bg-gray-800 border border-gray-700 rounded overflow-hidden cursor-pointer hover:bg-gray-750">
        <input 
          type="file" 
          accept="image/*" 
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleImageUpload(field, e.target.files[0]);
            }
          }} 
          className="absolute inset-0 opacity-0 cursor-pointer z-10" 
        />
        {imagePreviews[field] ? (
          <div className="relative w-full h-full">
            <img 
              src={imagePreviews[field]!} 
              alt={label} 
              className="w-full h-full object-contain"
            />
            <div className="absolute bottom-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs flex items-center">
              <Camera className="mr-1" size={14} />Uploaded
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
            <Camera size={32} />
            <span className="text-sm mt-2">Click to upload</span>
          </div>
        )}
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );

  if (!isOpen) return null;

  return (
    <>
      {showLoadingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-[10000] flex items-center justify-center">
          <div className="bg-gray-800 rounded-lg p-8 flex flex-col items-center space-y-6 min-w-[320px]">
            <Loader2 className="w-20 h-20 text-orange-500 animate-spin" />
            <div className="text-center">
              <p className="text-white text-4xl font-bold">{loadingPercentage}%</p>
            </div>
          </div>
        </div>
      )}

      {showResultModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-[10000] flex items-center justify-center">
          <div className="bg-gray-800 rounded-lg p-8 flex flex-col items-center space-y-4 max-w-md">
            {resultType === 'success' ? (
              <>
                <CheckCircle className="w-16 h-16 text-green-500" />
                <p className="text-white text-xl font-semibold">Success!</p>
                <p className="text-gray-300 text-center">{resultMessage}</p>
              </>
            ) : (
              <>
                <AlertCircle className="w-16 h-16 text-red-500" />
                <p className="text-white text-xl font-semibold">Error</p>
                <p className="text-gray-300 text-center">{resultMessage}</p>
                <button
                  onClick={() => setShowResultModal(false)}
                  className="mt-4 px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-[9998]"
        onClick={handleClose}
      />
      
      <div className="fixed right-0 top-0 h-full w-[600px] bg-gray-900 shadow-2xl z-[9999] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-800">
          <h2 className="text-xl font-semibold text-white">LCP NAP Location Form</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-4">
            <ImageUploadField label="Reading Image" field="reading_image" />

            <div>
              <label className="block text-sm font-medium text-white mb-2">Street</label>
              <input
                type="text"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Region</label>
              <div className="relative">
                <select
                  value={formData.region}
                  onChange={(e) => handleRegionChange(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-orange-500 focus:outline-none appearance-none"
                >
                  <option value="">Select Region</option>
                  {regions.map(region => (
                    <option key={region.id} value={region.name}>{region.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={20} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">City</label>
              <div className="relative">
                <select
                  value={formData.city}
                  onChange={(e) => handleCityChange(e.target.value)}
                  disabled={!formData.region}
                  className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-orange-500 focus:outline-none disabled:opacity-50 appearance-none"
                >
                  <option value="">{formData.region ? 'Select City' : 'All'}</option>
                  {filteredCities.map(city => (
                    <option key={city.id} value={city.name}>{city.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={20} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Barangay</label>
              <div className="relative">
                <select
                  value={formData.barangay}
                  onChange={(e) => handleBarangayChange(e.target.value)}
                  disabled={!formData.city}
                  className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-orange-500 focus:outline-none disabled:opacity-50 appearance-none"
                >
                  <option value="">{formData.city ? 'Select Barangay' : 'All'}</option>
                  {filteredBarangays.map(barangay => (
                    <option key={barangay.id} value={barangay.barangay}>{barangay.barangay}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={20} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Location</label>
              <div className="relative">
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  disabled={!formData.barangay}
                  className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-orange-500 focus:outline-none disabled:opacity-50 appearance-none"
                >
                  <option value="">{formData.barangay ? 'Select Location' : 'All'}</option>
                  {filteredLocations.map(location => (
                    <option key={location.id} value={location.location_name}>{location.location_name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={20} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                LCP<span className="text-red-500">*</span>
              </label>
              <select
                value={formData.lcp_name}
                onChange={(e) => setFormData({ ...formData, lcp_name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-orange-500 focus:outline-none"
              >
                <option value="">Select LCP</option>
                {lcpList.map(lcp => (
                  <option key={lcp.id} value={lcp.lcp_name}>{lcp.lcp_name}</option>
                ))}
              </select>
              {errors.lcp_name && <p className="text-red-500 text-xs mt-1">{errors.lcp_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                NAP<span className="text-red-500">*</span>
              </label>
              <select
                value={formData.nap_name}
                onChange={(e) => setFormData({ ...formData, nap_name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-orange-500 focus:outline-none"
              >
                <option value="">Select NAP</option>
                {napList.map(nap => (
                  <option key={nap.id} value={nap.nap_name}>{nap.nap_name}</option>
                ))}
              </select>
              {errors.nap_name && <p className="text-red-500 text-xs mt-1">{errors.nap_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                PORT TOTAL<span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, port_total: '8' })}
                  className={`py-3 px-4 rounded border ${
                    formData.port_total === '8' 
                      ? 'bg-orange-600 border-orange-700 text-white' 
                      : 'bg-gray-800 border-gray-700 text-gray-300'
                  } transition-colors`}
                >
                  8
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, port_total: '16' })}
                  className={`py-3 px-4 rounded border ${
                    formData.port_total === '16' 
                      ? 'bg-orange-600 border-orange-700 text-white' 
                      : 'bg-gray-800 border-gray-700 text-gray-300'
                  } transition-colors`}
                >
                  16
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, port_total: '32' })}
                  className={`py-3 px-4 rounded border ${
                    formData.port_total === '32' 
                      ? 'bg-orange-600 border-orange-700 text-white' 
                      : 'bg-gray-800 border-gray-700 text-gray-300'
                  } transition-colors`}
                >
                  32
                </button>
              </div>
              {errors.port_total && <p className="text-red-500 text-xs mt-1">{errors.port_total}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                LCPNAP<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.lcpnap_name}
                readOnly
                className="w-full px-3 py-2 bg-gray-700 text-gray-300 rounded border border-gray-700 cursor-not-allowed"
                placeholder="Auto-generated from LCP and NAP"
              />
              {errors.lcpnap_name && <p className="text-red-500 text-xs mt-1">{errors.lcpnap_name}</p>}
              <p className="text-xs text-gray-400 mt-1">Format: LCP-XXX to NAP-XXX</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Coordinates<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.coordinates}
                  onChange={(e) => setFormData({ ...formData, coordinates: e.target.value })}
                  placeholder="14.466580, 121.201807"
                  className="w-full px-3 py-2 pr-10 bg-gray-800 text-white rounded border border-gray-700 focus:border-orange-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleToggleMap}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-orange-500 transition-colors"
                >
                  <MapPin size={20} />
                </button>
              </div>
              {errors.coordinates && <p className="text-red-500 text-xs mt-1">{errors.coordinates}</p>}
              
              {showCoordinatesMap && (
                <div className="mt-3 border border-gray-700 rounded overflow-hidden">
                  <div 
                    ref={mapRef}
                    className="w-full h-[400px] bg-gray-800"
                  />
                  <div className="bg-gray-800 px-3 py-2 text-xs text-gray-400 border-t border-gray-700">
                    Click on the map to set coordinates
                  </div>
                </div>
              )}
            </div>

            <ImageUploadField label="Image" field="image" required error={errors.image} />

            <ImageUploadField label="Image 2" field="image_2" required error={errors.image_2} />

            <div>
              <label className="block text-sm font-medium text-white mb-2">Modified By</label>
              <input
                type="text"
                value={formData.modified_by}
                readOnly
                className="w-full px-3 py-2 bg-gray-800 text-gray-400 rounded border border-gray-700 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-800 bg-gray-800">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-orange-400 hover:text-orange-300 border border-orange-600 hover:border-orange-500 rounded bg-transparent"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </>
  );
};

export default AddLcpNapLocationModal;
