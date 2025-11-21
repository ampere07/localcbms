import React, { useState, useEffect } from 'react';
import { AlertTriangle, Plus, Search, Package, X } from 'lucide-react';
import InventoryFormModal from '../modals/InventoryFormModal';
import InventoryDetails from '../components/InventoryDetails';

interface InventoryItem {
  item_name: string;
  item_description?: string;
  supplier?: string;
  quantity_alert?: number;
  image?: string;
  category?: string;
  item_id?: number;
  modified_by?: string;
  modified_date?: string;
  user_email?: string;
}

interface Category {
  id: string;
  name: string;
  count: number;
}

interface InventoryFormData {
  itemName: string;
  itemDescription: string;
  supplier: string;
  quantityAlert: number;
  image: File | null;
  modifiedBy: string;
  modifiedDate: string;
  userEmail: string;
  category: string;
  totalStockAvailable: number;
  totalStockIn: number;
}

const API_BASE_URL = 'https://backend.atssfiber.ph/api';

const Inventory: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showInventoryForm, setShowInventoryForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dbCategories, setDbCategories] = useState<{ id: number; name: string }[]>([]);

  // Fetch inventory data and categories from API
  useEffect(() => {
    fetchInventoryData();
    fetchCategories();
  }, []);

  // Calculate and update category counts whenever items or db categories change
  useEffect(() => {
    if (dbCategories.length > 0) {
      const categoriesWithCount: Category[] = [
        {
          id: 'all',
          name: 'ALL',
          count: inventoryItems.length
        },
        ...dbCategories.map((cat) => {
          const categoryId = cat.name.toLowerCase().replace(/\s+/g, '-');
          const count = inventoryItems.filter(item => {
            const itemCategory = (item.category || '').toLowerCase().replace(/\s+/g, '-');
            return itemCategory === categoryId;
          }).length;
          return {
            id: categoryId,
            name: cat.name,
            count
          };
        })
      ];
      setCategories(categoriesWithCount);
    }
  }, [inventoryItems, dbCategories]);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/inventory`);
      const data = await response.json();
      
      if (data.success) {
        setInventoryItems(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch inventory data');
        console.error('API Error:', data);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/inventory-categories`);
      const data = await response.json();
      
      if (data.success) {
        setDbCategories(data.data || []);
      } else {
        console.error('Failed to fetch categories:', data.message);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Filter items based on selected category and search query
  const filteredItems = selectedCategory === '' ? [] : inventoryItems.filter(item => {
    const itemCategory = (item.category || '').toLowerCase().replace(/\s+/g, '-');
    const matchesCategory = selectedCategory === 'all' || itemCategory === selectedCategory;
    
    const matchesSearch = searchQuery === '' || 
                         item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.item_description && item.item_description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  const handleItemClick = (item: InventoryItem) => {
    setSelectedItem(item);
  };

  const handleCloseDetails = () => {
    setSelectedItem(null);
  };

  const handleAddItem = () => {
    setEditingItem(null);
    setShowInventoryForm(true);
  };

  const getSelectedCategoryName = (): string => {
    if (selectedCategory === 'all' || selectedCategory === '') {
      return '';
    }
    const category = categories.find(cat => cat.id === selectedCategory);
    return category ? category.name : '';
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setShowInventoryForm(true);
  };

  const handleDeleteItem = async (item: InventoryItem) => {
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/${encodeURIComponent(item.item_name)}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Inventory item deleted successfully!');
        if (selectedItem?.item_name === item.item_name) {
          setSelectedItem(null);
        }
        await fetchInventoryData();
      } else {
        alert('Failed to delete inventory item: ' + data.message);
        console.error('Delete Error:', data);
      }
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      alert('Failed to delete inventory item: Network error');
    }
  };

  const handleSaveInventoryItem = async (formData: InventoryFormData) => {
    try {
      console.log('Saving inventory item:', formData);
      
      const isEditing = editingItem !== null;
      const url = isEditing 
        ? `${API_BASE_URL}/inventory/${encodeURIComponent(editingItem.item_name)}`
        : `${API_BASE_URL}/inventory`;
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item_name: formData.itemName,
          item_description: formData.itemDescription,
          supplier: formData.supplier,
          quantity_alert: formData.quantityAlert,
          category: formData.category,
          item_id: null,
          image: '',
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        const message = isEditing ? 'Inventory item updated successfully!' : 'Inventory item added successfully!';
        alert(message);
        setShowInventoryForm(false);
        setEditingItem(null);
        await fetchInventoryData();
        await fetchCategories();
      } else {
        alert('Failed to save inventory item: ' + data.message);
        console.error('Save Error:', data);
      }
    } catch (error) {
      console.error('Error saving inventory item:', error);
      alert('Failed to save inventory item: Network error');
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-950 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
          <div className="text-white text-lg">Loading inventory...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-950 h-full flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4 mx-auto" />
          <div className="text-white text-lg mb-2">Error Loading Inventory</div>
          <div className="text-gray-400 mb-4">{error}</div>
          <button 
            onClick={fetchInventoryData}
            className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-950 h-full flex flex-col md:flex-row overflow-hidden">
      {/* Category Sidebar - Desktop / Bottom Navbar - Mobile */}
      <div className="md:w-64 bg-gray-900 md:border-r border-t md:border-t-0 border-gray-700 flex-shrink-0 flex flex-col order-2 md:order-1">
        <div className="p-4 border-b border-gray-700 flex-shrink-0 hidden md:block">
          <h2 className="text-lg font-semibold text-white flex items-center">
            <Package className="mr-2" size={20} />
            Inventory
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto md:block overflow-x-auto">
          <div className="flex md:flex-col md:space-y-0 space-x-2 md:space-x-0 p-2 md:p-0">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`md:w-full flex-shrink-0 flex flex-col md:flex-row items-center md:justify-between px-4 py-3 text-sm transition-colors hover:bg-gray-800 rounded-md md:rounded-none ${
                  selectedCategory === category.id
                    ? 'bg-orange-500 bg-opacity-20 text-orange-400 md:border-r-2 border-orange-500'
                    : 'text-gray-300'
                }`}
              >
                <span className="uppercase font-medium text-xs md:text-sm whitespace-nowrap">{category.name}</span>
                <span className={`px-2 py-1 rounded-full text-xs mt-1 md:mt-0 ${
                  selectedCategory === category.id
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}>
                  {category.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-gray-900 overflow-hidden order-1 md:order-2">
        <div className="flex flex-col h-full">
          {/* Search Bar */}
          <div className="bg-gray-900 p-4 border-b border-gray-700 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search inventory..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded pl-10 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
              <button 
                className="bg-orange-600 text-white px-4 py-2 rounded text-sm flex items-center space-x-2 hover:bg-orange-700 transition-colors"
                onClick={handleAddItem}
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Add Item</span>
              </button>
            </div>
          </div>
          
          {/* Items List */}
          <div className="flex-1 overflow-y-auto">
            <div className="divide-y divide-gray-700">
              {filteredItems.length > 0 ? (
                filteredItems.map((item, index) => (
                  <div 
                    key={item.item_name + index} 
                    className={`px-6 py-4 flex items-center justify-between hover:bg-gray-800 transition-colors cursor-pointer group ${
                      selectedItem?.item_name === item.item_name ? 'bg-gray-800 border-r-2 border-orange-500' : ''
                    }`}
                    onClick={() => handleItemClick(item)}
                  >
                    <div>
                      <div className="text-white font-medium text-base">
                        {item.item_name}
                      </div>
                      {item.modified_date && (
                        <div className="text-gray-400 text-sm mt-1">
                          {new Date(item.modified_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: true
                          })}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        className="p-2 text-gray-400 hover:text-white rounded transition-colors" 
                        title="View Details"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleItemClick(item);
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button 
                        className="p-2 text-gray-400 hover:text-red-400 rounded transition-colors" 
                        title="Delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(item);
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      <button 
                        className="p-2 text-gray-400 hover:text-white rounded transition-colors" 
                        title="Edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditItem(item);
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-gray-400">
                  <Package size={48} className="mx-auto mb-4 text-gray-600" />
                  <div className="text-lg mb-2">
                    {selectedCategory === '' ? 'Select a category to view items' : 'No items found'}
                  </div>
                  <div className="text-sm">
                    {selectedCategory === '' 
                      ? 'Choose a category from the sidebar to see inventory items'
                      : inventoryItems.length === 0 
                        ? 'Start by adding some inventory items' 
                        : 'Try adjusting your search or category filter'
                    }
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Details Panel */}
      {selectedItem && (
        <div className="w-full max-w-2xl bg-gray-900 border-l border-gray-700 flex-shrink-0 relative">
          <InventoryDetails
            item={selectedItem}
            inventoryLogs={[]}
            borrowedLogs={[]}
            jobOrders={[]}
            serviceOrders={[]}
            defectiveLogs={[]}
            totalStockIn={0}
            totalStockAvailable={0}
            onEdit={handleEditItem}
            onDelete={handleDeleteItem}
            onClose={handleCloseDetails}
          />
        </div>
      )}

      {/* Inventory Form Modal */}
      <InventoryFormModal
        isOpen={showInventoryForm}
        onClose={() => {
          setShowInventoryForm(false);
          setEditingItem(null);
        }}
        onSave={handleSaveInventoryItem}
        initialCategory={getSelectedCategoryName()}
        editData={editingItem ? {
          itemName: editingItem.item_name,
          itemDescription: editingItem.item_description || '',
          supplier: editingItem.supplier || '',
          quantityAlert: editingItem.quantity_alert || 0,
          image: null,
          modifiedBy: editingItem.modified_by || 'ravenampere0123@gmail.com',
          modifiedDate: editingItem.modified_date || new Date().toISOString().slice(0, 16),
          userEmail: editingItem.user_email || 'ravenampere0123@gmail.com',
          category: editingItem.category || '',
          totalStockAvailable: 0,
          totalStockIn: 0
        } : null}
      />
    </div>
  );
};

export default Inventory;
