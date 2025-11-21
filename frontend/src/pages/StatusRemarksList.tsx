import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Loader2 } from 'lucide-react';

interface StatusRemark {
  id: number;
  status_remarks: string;
  created_at?: string;
  created_by_user_id?: number;
  updated_at?: string;
  updated_by_user_id?: number;
}

const StatusRemarksList: React.FC = () => {
  const [statusRemarks, setStatusRemarks] = useState<StatusRemark[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRemark, setEditingRemark] = useState<StatusRemark | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    status_remarks: ''
  });

  const API_BASE_URL = 'https://backend.atssfiber.ph/api';

  useEffect(() => {
    fetchStatusRemarks();
  }, []);

  const fetchStatusRemarks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/status-remarks`);
      const data = await response.json();
      
      if (data.success) {
        setStatusRemarks(data.data);
      } else {
        setError(data.message || 'Failed to fetch status remarks');
      }
    } catch (error) {
      console.error('Error fetching status remarks:', error);
      setError('Failed to fetch status remarks');
    } finally {
      setLoading(false);
    }
  };

  const filteredRemarks = statusRemarks.filter(remark =>
    remark.status_remarks.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddClick = () => {
    setEditingRemark(null);
    setFormData({ status_remarks: '' });
    setShowAddModal(true);
  };

  const handleEditClick = (remark: StatusRemark) => {
    setEditingRemark(remark);
    setFormData({
      status_remarks: remark.status_remarks
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this status remark?')) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`${API_BASE_URL}/status-remarks/${id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        await fetchStatusRemarks();
      } else {
        alert('Failed to delete status remark: ' + data.message);
      }
    } catch (error) {
      console.error('Error deleting status remark:', error);
      alert('Failed to delete status remark');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.status_remarks.trim()) {
      alert('Please enter a status remark');
      return;
    }

    setSaving(true);
    try {
      const url = editingRemark 
        ? `${API_BASE_URL}/status-remarks/${editingRemark.id}`
        : `${API_BASE_URL}/status-remarks`;
      
      const method = editingRemark ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status_remarks: formData.status_remarks.trim()
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setShowAddModal(false);
        setFormData({ status_remarks: '' });
        await fetchStatusRemarks();
      } else {
        alert(data.message || 'Failed to save status remark');
      }
    } catch (error) {
      console.error('Error saving status remark:', error);
      alert('Failed to save status remark');
    } finally {
      setSaving(false);
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch {
      return 'N/A';
    }
  };

  if (loading && statusRemarks.length === 0) {
    return (
      <div className="bg-gray-950 h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-orange-500 mb-4 mx-auto" />
          <div className="text-white text-lg">Loading status remarks...</div>
        </div>
      </div>
    );
  }

  if (error && statusRemarks.length === 0) {
    return (
      <div className="bg-gray-950 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-lg mb-2">Error Loading Status Remarks</div>
          <div className="text-gray-400 mb-4">{error}</div>
          <button 
            onClick={fetchStatusRemarks}
            className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-950 h-full flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 px-6 py-4 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Status Remarks List</h1>
        </div>
      </div>

      {/* Search and Add Section */}
      <div className="bg-gray-900 px-6 py-4 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search Status Remarks"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800 text-white border border-gray-600 rounded pl-10 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
          <button 
            onClick={handleAddClick}
            className="bg-orange-600 text-white px-4 py-2 rounded text-sm flex items-center space-x-2 hover:bg-orange-700 transition-colors ml-4"
          >
            <Plus size={16} />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Status Remarks Table */}
      <div className="flex-1 overflow-y-auto">
        {filteredRemarks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800 border-b border-gray-700 sticky top-0">
                <tr>
                  <th className="px-6 py-4 text-left text-white font-medium">Status Remarks</th>
                  <th className="px-6 py-4 text-left text-white font-medium">Created By User ID</th>
                  <th className="px-6 py-4 text-left text-white font-medium">Created At</th>
                  <th className="px-6 py-4 text-left text-white font-medium">Updated By User ID</th>
                  <th className="px-6 py-4 text-left text-white font-medium">Updated At</th>
                  <th className="px-6 py-4 text-left text-white font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRemarks.map((remark) => (
                  <tr key={remark.id} className="bg-gray-900 border-b border-gray-800 hover:bg-gray-800 transition-colors">
                    <td className="px-6 py-4 text-white font-medium">{remark.status_remarks}</td>
                    <td className="px-6 py-4 text-gray-300">{remark.created_by_user_id || 'N/A'}</td>
                    <td className="px-6 py-4 text-gray-400 text-sm">{formatDateTime(remark.created_at)}</td>
                    <td className="px-6 py-4 text-gray-300">{remark.updated_by_user_id || 'N/A'}</td>
                    <td className="px-6 py-4 text-gray-400 text-sm">{formatDateTime(remark.updated_at)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditClick(remark)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(remark.id)}
                          disabled={deletingId === remark.id}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Delete"
                        >
                          {deletingId === remark.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-400">
            <div className="text-lg mb-2">No status remarks found</div>
            <div className="text-sm">
              {searchQuery 
                ? 'Try adjusting your search filter' 
                : 'Start by adding some status remarks'
              }
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowAddModal(false)}
          />
          
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
              <div className="px-6 py-4 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-white">
                  {editingRemark ? 'Edit Status Remark' : 'Add Status Remark'}
                </h2>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Status Remark<span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.status_remarks}
                    onChange={(e) => setFormData({ ...formData, status_remarks: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter status remark"
                  />
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2 text-gray-300 border border-gray-600 rounded hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    {editingRemark ? 'Update' : 'Add'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StatusRemarksList;
