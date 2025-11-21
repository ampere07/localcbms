import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Trash2, X, FileText, Copy, Printer, ChevronLeft, ChevronRight as ChevronRightNav, Maximize2, AlertTriangle } from 'lucide-react';

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

interface InventoryLog {
  id: string;
  date: string;
  itemQuantity: number;
  requestedBy: string;
  requestedWith: string;
}

interface BorrowedLog {
  id: string;
  date: string;
  borrowedBy: string;
  quantity: number;
  returnDate?: string;
  status: string;
}

interface JobOrder {
  id: string;
  jobOrderNumber: string;
  date: string;
  assignedTo: string;
  quantity: number;
  status: string;
}

interface ServiceOrder {
  id: string;
  serviceOrderNumber: string;
  date: string;
  technician: string;
  quantity: number;
  status: string;
}

interface DefectiveLog {
  id: string;
  date: string;
  reportedBy: string;
  quantity: number;
  defectType: string;
  description: string;
}

interface InventoryDetailsProps {
  item: InventoryItem;
  inventoryLogs?: InventoryLog[];
  borrowedLogs?: BorrowedLog[];
  jobOrders?: JobOrder[];
  serviceOrders?: ServiceOrder[];
  defectiveLogs?: DefectiveLog[];
  totalStockIn?: number;
  totalStockAvailable?: number;
  onEdit?: (item: InventoryItem) => void;
  onDelete?: (item: InventoryItem) => void;
  onClose?: () => void;
}

const InventoryDetails: React.FC<InventoryDetailsProps> = ({
  item,
  inventoryLogs = [
    {
      id: '1',
      date: '2023-11-27T14:07:58',
      itemQuantity: 4,
      requestedBy: 'None',
      requestedWith: 'None'
    }
  ],
  borrowedLogs = [],
  jobOrders = [],
  serviceOrders = [],
  defectiveLogs = [],
  totalStockIn = 4,
  totalStockAvailable = 4,
  onEdit,
  onDelete,
  onClose
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    inventoryLogs: true,
    borrowedLogs: false,
    jobOrders: false,
    serviceOrders: false,
    defectiveLogs: false
  });
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(item);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      if (window.confirm(`Are you sure you want to delete "${item.item_name}"?`)) {
        onDelete(item);
      }
    }
  };

  const handleExpand = () => {
    setIsExpanded(true);
  };

  const handleCollapse = () => {
    setIsExpanded(false);
  };

  if (isExpanded) {
    // Render expanded view that takes over the main content area only
    return (
      <div className="fixed right-0 bottom-0 bg-gray-900 text-white z-40 flex flex-col" 
           style={{ left: '256px', top: '64px' }}> {/* 256px sidebar width, 64px header height */}
        {/* Toolbar */}
        <div className="bg-gray-800 px-6 py-2 border-b border-gray-700">
          <div className="flex items-center justify-between">
            {/* Left side - Breadcrumb Navigation */}
            <div className="flex items-center text-sm text-gray-300">
              <span>Inventory Category List</span>
              <ChevronRight size={16} className="mx-2" />
              <span>{item.category || 'EVENT'}</span>
              <ChevronRight size={16} className="mx-2" />
              <span className="text-white">{item.item_name}</span>
            </div>
            
            {/* Right side - Toolbar buttons */}
            <div className="flex items-center space-x-1">
              <button 
                onClick={handleDelete}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
                title="Delete"
              >
                <Trash2 size={18} />
              </button>
              <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
                <X size={18} />
              </button>
              <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
                <Printer size={18} />
              </button>
              <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
                <Copy size={18} />
              </button>
              <button 
                onClick={handleEdit}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors flex items-center space-x-1"
              >
                <span>Edit</span>
              </button>
              <button 
                onClick={handleCollapse}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                title="Back to side panel view"
              >
                <ChevronLeft size={18} />
              </button>
              <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
                <ChevronRightNav size={18} />
              </button>
              <button 
                onClick={handleCollapse}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                title="Collapse to side panel view"
              >
                <Maximize2 size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex h-full">
            {/* Left Side - Image */}
            <div className="w-1/2 p-6">
              <div className="bg-gray-800 w-full h-80 flex items-center justify-center border border-gray-700 rounded">
                <AlertTriangle size={64} className="text-gray-600" />
              </div>
            </div>

            {/* Right Side - Item Details and Related Sections */}
            <div className="w-1/2 p-6 overflow-y-auto">
              <div className="space-y-6">
              {/* Item Details Section */}
              <div className="bg-gray-800 border border-gray-700 rounded">
                <div className="px-6 py-4 border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Category</span>
                    <span className="text-white font-medium">{item.category || 'EVENT'}</span>
                  </div>
                </div>
                
                <div className="px-6 py-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Item Name</span>
                    <span className="text-white font-medium">{item.item_name}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Quantity Alert</span>
                    <span className="text-white font-medium">{item.quantity_alert || 10}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Item Description</span>
                    <span className="text-white font-medium">{item.item_description || item.item_name}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Total Stock IN</span>
                    <span className="text-white font-medium">{totalStockIn}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Total Stock Available</span>
                    <span className="text-green-400 font-bold text-lg">{totalStockAvailable}</span>
                  </div>
                </div>
              </div>

              {/* Related Inventory Logs */}
              <div className="bg-gray-800 border border-gray-700 rounded">
                <div className="px-6 py-4 border-b border-gray-700">
                  <div className="flex items-center space-x-3">
                    <span className="text-white font-medium text-lg">Related Inventory Logs</span>
                    <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded">
                      {inventoryLogs.length}
                    </span>
                  </div>
                </div>
                
                {inventoryLogs.length > 0 ? (
                  <div className="divide-y divide-gray-700">
                    {inventoryLogs.map((log) => (
                      <div key={log.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-750 transition-colors group">
                        <div>
                          <div className="text-white font-medium">
                            Log Entry #{log.id}
                          </div>
                          <div className="text-gray-400 text-sm">
                            {formatDate(log.date)}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 text-gray-400 hover:text-white rounded transition-colors" title="View Details">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button className="p-2 text-gray-400 hover:text-red-400 rounded transition-colors" title="Delete">
                            <Trash2 size={16} />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-white rounded transition-colors" title="Edit">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {/* Footer with Expand and Add Item buttons */}
                    <div className="px-6 py-3 bg-gray-750 border-t border-gray-700 flex items-center justify-between">
                      <span className="text-red-500 text-sm cursor-pointer hover:underline">Expand</span>
                      <button className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700 transition-colors">
                        Add Item
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="px-6 py-12 text-center text-gray-500">
                    No items
                  </div>
                )}
              </div>

              {/* Related Borrowed Logs */}
              <div className="bg-gray-800 border border-gray-700 rounded">
                <div className="px-6 py-4 border-b border-gray-700">
                  <div className="flex items-center space-x-3">
                    <span className="text-white font-medium text-lg">Related Borrowed Logs</span>
                    <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded">
                      {borrowedLogs.length}
                    </span>
                  </div>
                </div>
                <div className="px-6 py-12 text-center text-gray-500">
                  No items
                </div>
              </div>

              {/* Related Job Orders */}
              <div className="bg-gray-800 border border-gray-700 rounded">
                <div className="px-6 py-4 border-b border-gray-700">
                  <div className="flex items-center space-x-3">
                    <span className="text-white font-medium text-lg">Related Job Orders</span>
                    <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded">
                      {jobOrders.length}
                    </span>
                  </div>
                </div>
                <div className="px-6 py-12 text-center text-gray-500">
                  No items
                </div>
              </div>

              {/* Related Service Orders */}
              <div className="bg-gray-800 border border-gray-700 rounded">
                <div className="px-6 py-4 border-b border-gray-700">
                  <div className="flex items-center space-x-3">
                    <span className="text-white font-medium text-lg">Related Service Orders</span>
                    <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded">
                      {serviceOrders.length}
                    </span>
                  </div>
                </div>
                <div className="px-6 py-12 text-center text-gray-500">
                  No items
                </div>
              </div>

              {/* Related Defective Logs */}
              <div className="bg-gray-800 border border-gray-700 rounded">
                <div className="px-6 py-4 border-b border-gray-700">
                  <div className="flex items-center space-x-3">
                    <span className="text-white font-medium text-lg">Related Defective Logs</span>
                    <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded">
                      {defectiveLogs.length}
                    </span>
                  </div>
                </div>
                <div className="px-6 py-12 text-center text-gray-500">
                  No items
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 text-white h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center bg-gray-800 px-4 py-2">
        <div className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-sm uppercase font-medium mr-3">
          {item.category || 'EVENT'}
        </div>
        <div className="flex-1 text-center">
          <h1 className="text-lg font-semibold text-white">{item.item_name}</h1>
        </div>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors ml-3"
        >
          <X size={20} />
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
        <div className="flex items-center justify-center space-x-1">
          <button 
            onClick={handleDelete}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
            <X size={18} />
          </button>
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
            <Printer size={18} />
          </button>
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
            <Copy size={18} />
          </button>
          <button 
            onClick={handleEdit}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors flex items-center space-x-1"
          >
            <span>Edit</span>
          </button>
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
            <ChevronLeft size={18} />
          </button>
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
            <ChevronRightNav size={18} />
          </button>
          <button 
            onClick={handleExpand}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="Expand to full view"
          >
            <Maximize2 size={18} />
          </button>
        </div>
      </div>

      {/* Main Image/Content Area */}
      <div className="bg-gray-800 h-64 flex items-center justify-center border-b border-gray-700">
        <div className="text-center">
          <AlertTriangle size={48} className="text-gray-600 mx-auto mb-2" />
        </div>
      </div>

      {/* Item Details */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-4">
          {/* Category */}
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-400 text-sm">Category</span>
            <div className="flex items-center">
              <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-sm uppercase font-medium">
                {item.category || 'EVENT'}
              </span>
            </div>
          </div>

          {/* Item Name */}
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-400 text-sm">Item Name</span>
            <span className="text-white font-medium">{item.item_name}</span>
          </div>

          {/* Quantity Alert */}
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-400 text-sm">Quantity Alert</span>
            <span className="text-white font-medium">{item.quantity_alert || 10}</span>
          </div>

          {/* Item Description */}
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-400 text-sm">Item Description</span>
            <span className="text-white font-medium">{item.item_description || item.item_name}</span>
          </div>

          {/* Total Stock IN */}
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-400 text-sm">Total Stock IN</span>
            <span className="text-white font-medium">{totalStockIn}</span>
          </div>

          {/* Total Stock Available */}
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-400 text-sm">Total Stock Available</span>
            <span className="text-green-400 font-bold text-lg">{totalStockAvailable}</span>
          </div>
        </div>

        {/* Related Sections */}
        <div className="border-t border-gray-700">
          {/* Related Inventory Logs */}
          <div className="border-b border-gray-700">
            <button
              onClick={() => toggleSection('inventoryLogs')}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="text-white font-medium">Related Inventory Logs</span>
                <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded min-w-[20px] text-center">
                  {inventoryLogs.length}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {expandedSections.inventoryLogs ? (
                  <ChevronDown size={20} className="text-gray-400" />
                ) : (
                  <ChevronRight size={20} className="text-gray-400" />
                )}
              </div>
            </button>

            {expandedSections.inventoryLogs && (
              <div className="bg-gray-800">
                {inventoryLogs.length > 0 ? (
                  <div>
                    {/* Table Header */}
                    <div className="grid grid-cols-4 gap-4 px-6 py-3 bg-gray-700 text-sm font-medium text-gray-300">
                      <div className="flex items-center">
                        Date <ChevronDown size={14} className="ml-1" />
                      </div>
                      <div className="text-center">Item Quantity</div>
                      <div className="text-center">Requested By</div>
                      <div className="text-center">Requested With</div>
                    </div>
                    
                    {/* Table Row */}
                    {inventoryLogs.map((log) => (
                      <div key={log.id} className="grid grid-cols-4 gap-4 px-6 py-3 border-b border-gray-700 last:border-b-0">
                        <div className="text-white text-sm">{formatDate(log.date)}</div>
                        <div className="text-white text-sm text-center">{log.itemQuantity}</div>
                        <div className="text-white text-sm text-center">{log.requestedBy}</div>
                        <div className="text-white text-sm text-center">{log.requestedWith}</div>
                      </div>
                    ))}
                    
                    {/* Navigation */}
                    <div className="px-6 py-2 flex items-center justify-between bg-gray-750">
                      <button className="p-1 text-gray-400 hover:text-white">
                        <ChevronLeft size={16} />
                      </button>
                      <div className="flex-1 h-1 bg-gray-600 rounded mx-4">
                        <div className="h-full bg-gray-500 rounded" style={{ width: '50%' }}></div>
                      </div>
                      <button className="p-1 text-gray-400 hover:text-white">
                        <ChevronRightNav size={16} />
                      </button>
                    </div>
                    
                    <div className="px-6 py-2 text-right">
                      <button 
                        onClick={handleExpand}
                        className="text-red-500 text-sm cursor-pointer hover:underline bg-transparent border-none"
                      >
                        Expand
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No items
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Related Borrowed Logs */}
          <div className="border-b border-gray-700">
            <button
              onClick={() => toggleSection('borrowedLogs')}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="text-white font-medium">Related Borrowed Logs</span>
                <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded min-w-[20px] text-center">
                  {borrowedLogs.length}
                </span>
              </div>
              {expandedSections.borrowedLogs ? (
                <ChevronDown size={20} className="text-gray-400" />
              ) : (
                <ChevronRight size={20} className="text-gray-400" />
              )}
            </button>

            {expandedSections.borrowedLogs && (
              <div className="px-6 py-8 text-center text-gray-500">
                No items
              </div>
            )}
          </div>

          {/* Related Job Orders */}
          <div className="border-b border-gray-700">
            <button
              onClick={() => toggleSection('jobOrders')}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="text-white font-medium">Related Job Orders</span>
                <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded min-w-[20px] text-center">
                  {jobOrders.length}
                </span>
              </div>
              {expandedSections.jobOrders ? (
                <ChevronDown size={20} className="text-gray-400" />
              ) : (
                <ChevronRight size={20} className="text-gray-400" />
              )}
            </button>

            {expandedSections.jobOrders && (
              <div className="px-6 py-8 text-center text-gray-500">
                No items
              </div>
            )}
          </div>

          {/* Related Service Orders */}
          <div className="border-b border-gray-700">
            <button
              onClick={() => toggleSection('serviceOrders')}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="text-white font-medium">Related Service Orders</span>
                <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded min-w-[20px] text-center">
                  {serviceOrders.length}
                </span>
              </div>
              {expandedSections.serviceOrders ? (
                <ChevronDown size={20} className="text-gray-400" />
              ) : (
                <ChevronRight size={20} className="text-gray-400" />
              )}
            </button>

            {expandedSections.serviceOrders && (
              <div className="px-6 py-8 text-center text-gray-500">
                No items
              </div>
            )}
          </div>

          {/* Related Defective Logs */}
          <div>
            <button
              onClick={() => toggleSection('defectiveLogs')}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="text-white font-medium">Related Defective Logs</span>
                <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded min-w-[20px] text-center">
                  {defectiveLogs.length}
                </span>
              </div>
              {expandedSections.defectiveLogs ? (
                <ChevronDown size={20} className="text-gray-400" />
              ) : (
                <ChevronRight size={20} className="text-gray-400" />
              )}
            </button>

            {expandedSections.defectiveLogs && (
              <div className="px-6 py-8 text-center text-gray-500">
                No items
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryDetails;