import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Filter, Loader2 } from 'lucide-react';
import AddUsageTypeModal from '../modals/AddUsageTypeModal';

interface UsageType {
  id: number;
  usage_name: string;
  created_at?: string;
  updated_at?: string;
  created_by_user_id?: number;
  updated_by_user_id?: number;
}

const UsageTypeList: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [usageTypes, setUsageTypes] = useState<UsageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUsageType, setEditingUsageType] = useState<UsageType | null>(null);
  const [deletingItems, setDeletingItems] = useState<Set<number>>(new Set());

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://backend.atssfiber.ph/api';

  useEffect(() => {
    loadUsageTypes();
  }, []);

  const loadUsageTypes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/usage-types`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || 'Unknown error'}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setUsageTypes(data.data || []);
      } else {
        console.error('API returned error:', data.message);
        setUsageTypes([]);
      }
    } catch (error) {
      console.error('Error loading usage types:', error);
      setUsageTypes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (usageType: UsageType) => {
    if (!window.confirm(`⚠️ PERMANENT DELETE WARNING ⚠️\n\nAre you sure you want to permanently delete "${usageType.usage_name}"?\n\nThis will PERMANENTLY REMOVE the usage type from the database and CANNOT BE UNDONE!\n\nClick OK to permanently delete, or Cancel to keep the usage type.`)) {
      return;
    }

    setDeletingItems(prev => {
      const newSet = new Set(prev);
      newSet.add(usageType.id);
      return newSet;
    });
    
    try {
      const response = await fetch(`${API_BASE_URL}/usage-types/${usageType.id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        await loadUsageTypes();
        alert('✅ Usage type permanently deleted from database: ' + (data.message || 'Usage type deleted successfully'));
      } else {
        alert('❌ Failed to delete usage type: ' + (data.message || 'Failed to delete usage type'));
      }
    } catch (error) {
      console.error('Error deleting usage type:', error);
      alert('Failed to delete usage type: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setDeletingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(usageType.id);
        return newSet;
      });
    }
  };

  const handleEdit = (usageType: UsageType) => {
    setEditingUsageType(usageType);
    setShowAddModal(true);
  };

  const handleAddNew = () => {
    setEditingUsageType(null);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingUsageType(null);
  };

  const handleSaveModal = async () => {
    await loadUsageTypes();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-PH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getFilteredUsageTypes = () => {
    if (!searchQuery) return usageTypes;
    
    return usageTypes.filter(usageType => 
      usageType.usage_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const renderListItem = (usageType: UsageType) => {
    return (
      <div key={usageType.id} className="bg-gray-900 border-b border-gray-800">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="text-white font-medium text-lg">{usageType.usage_name}</h3>
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span>Created: {formatDate(usageType.created_at)}</span>
              <span>Updated: {formatDate(usageType.updated_at)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleEdit(usageType)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
              title="Edit"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(usageType)}
              disabled={deletingItems.has(usageType.id)}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title={deletingItems.has(usageType.id) ? 'Permanently Deleting...' : 'Permanently Delete'}
            >
              {deletingItems.has(usageType.id) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const filteredUsageTypes = getFilteredUsageTypes();

  return (
    <div className="min-h-screen bg-gray-950 relative">
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-white">Usage Type List</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={handleAddNew}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
              <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded">
                <Filter className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search Usage Type List"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-gray-600 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        ) : filteredUsageTypes.length > 0 ? (
          <div>
            {filteredUsageTypes.map(renderListItem)}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-500">
            No usage types found
          </div>
        )}
      </div>

      <AddUsageTypeModal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        onSave={handleSaveModal}
        editingUsageType={editingUsageType}
      />
    </div>
  );
};

export default UsageTypeList;
