import React, { useState } from 'react';
import { 
  X, Edit, Trash2, ArrowLeft, ArrowRight, Maximize2, 
  ChevronDown, ChevronUp
} from 'lucide-react';

interface LocationItem {
  id: number;
  name: string;
  type: 'city' | 'region' | 'borough' | 'location';
  parentId?: number;
  parentName?: string;
  cityId?: number;
  regionId?: number;
  boroughId?: number;
}

interface LocationDetailsModalProps {
  isOpen: boolean;
  location: LocationItem | null;
  onClose: () => void;
  onEdit: (location: LocationItem) => void;
  onDelete: (location: LocationItem) => void;
}

const LocationDetailsModal: React.FC<LocationDetailsModalProps> = ({
  isOpen,
  location,
  onClose,
  onEdit,
  onDelete
}) => {
  const [expandedSections, setExpandedSections] = useState({
    relatedApplications: false,
    relatedServiceOrders: false
  });

  if (!isOpen || !location) return null;

  const getLocationTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      city: 'City',
      region: 'Region',
      borough: 'Barangay',
      location: 'Location'
    };
    return labels[type] || type;
  };

  const handleEdit = () => {
    onEdit(location);
  };

  const handleDelete = () => {
    onDelete(location);
  };

  const toggleSection = (section: 'relatedApplications' | 'relatedServiceOrders') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-end z-50">
      <div className="w-full max-w-2xl h-full bg-gray-900 flex flex-col overflow-hidden border-l border-gray-700 animate-slide-in">
        {/* Header */}
        <div className="bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-700">
          <h2 className="text-white font-semibold text-xl">
            {location.name}
          </h2>
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleDelete}
              className="text-gray-400 hover:text-white p-2 rounded hover:bg-gray-700 transition-colors"
              title="Delete"
            >
              <Trash2 size={20} />
            </button>
            <button 
              onClick={handleEdit}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center space-x-2 transition-colors"
            >
              <Edit size={18} />
              <span>Edit</span>
            </button>
            <button className="text-gray-400 hover:text-white p-1 rounded"><ArrowLeft size={20} /></button>
            <button className="text-gray-400 hover:text-white p-1 rounded"><ArrowRight size={20} /></button>
            <button className="text-gray-400 hover:text-white p-1 rounded"><Maximize2 size={20} /></button>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1 rounded"
              aria-label="Close"
            >
              <X size={22} />
            </button>
          </div>
        </div>
        
        {/* Location Details */}
        <div className="flex-1 overflow-y-auto bg-gray-900">
          <div className="p-6 space-y-6">
            {/* Name */}
            <div>
              <div className="text-gray-400 text-sm mb-1">Name</div>
              <div className="text-white text-base">{location.name}</div>
            </div>

            {/* Type */}
            <div>
              <div className="text-gray-400 text-sm mb-1">Type</div>
              <div className="text-white text-base">{getLocationTypeLabel(location.type)}</div>
            </div>

            {/* Parent Information */}
            {location.parentName && (
              <div>
                <div className="text-gray-400 text-sm mb-1">
                  {location.type === 'city' ? 'Region' : 
                   location.type === 'borough' ? 'City' : 
                   location.type === 'location' ? 'Barangay' : 'Parent'}
                </div>
                <div className="text-white text-base">{location.parentName}</div>
              </div>
            )}

            {/* ID */}
            <div>
              <div className="text-gray-400 text-sm mb-1">id</div>
              <div className="text-white text-base">{location.id}</div>
            </div>

            {/* Additional IDs based on type */}
            {location.type === 'city' && location.parentId && (
              <div>
                <div className="text-gray-400 text-sm mb-1">Region ID</div>
                <div className="text-white text-base">{location.parentId}</div>
              </div>
            )}

            {location.type === 'borough' && (
              <>
                {location.cityId && (
                  <div>
                    <div className="text-gray-400 text-sm mb-1">City ID</div>
                    <div className="text-white text-base">{location.cityId}</div>
                  </div>
                )}
                {location.regionId && (
                  <div>
                    <div className="text-gray-400 text-sm mb-1">Region ID</div>
                    <div className="text-white text-base">{location.regionId}</div>
                  </div>
                )}
              </>
            )}

            {location.type === 'location' && (
              <>
                {location.boroughId && (
                  <div>
                    <div className="text-gray-400 text-sm mb-1">Barangay ID</div>
                    <div className="text-white text-base">{location.boroughId}</div>
                  </div>
                )}
                {location.cityId && (
                  <div>
                    <div className="text-gray-400 text-sm mb-1">City ID</div>
                    <div className="text-white text-base">{location.cityId}</div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Related Applications Section */}
          <div className="border-t border-gray-700">
            <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <h3 className="text-white font-medium text-base">Related Applications</h3>
                <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded">0</span>
              </div>
              <button
                onClick={() => toggleSection('relatedApplications')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {expandedSections.relatedApplications ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>

            {expandedSections.relatedApplications && (
              <div className="bg-gray-900 p-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 border-b border-gray-700">
                        <th className="text-left py-2 px-2">Customer Name</th>
                        <th className="text-left py-2 px-2">Address</th>
                        <th className="text-left py-2 px-2">Status</th>
                        <th className="text-left py-2 px-2">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-gray-500">
                          No related applications found
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Related Service Orders Section */}
          <div className="border-t border-gray-700">
            <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <h3 className="text-white font-medium text-base">Related Service Orders</h3>
                <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded">0</span>
              </div>
              <button
                onClick={() => toggleSection('relatedServiceOrders')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {expandedSections.relatedServiceOrders ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>

            {expandedSections.relatedServiceOrders && (
              <div className="bg-gray-900 p-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 border-b border-gray-700">
                        <th className="text-left py-2 px-2">Service Type</th>
                        <th className="text-left py-2 px-2">Customer</th>
                        <th className="text-left py-2 px-2">Status</th>
                        <th className="text-left py-2 px-2">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-gray-500">
                          No related service orders found
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Expand Button */}
          <div className="bg-gray-900 p-4 border-t border-gray-700">
            <button className="w-full text-red-500 hover:text-red-400 text-sm font-medium transition-colors">
              Expand
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationDetailsModal;
