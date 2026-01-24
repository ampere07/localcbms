import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { concernService, Concern } from '../services/concernService';

const ConcernConfig: React.FC = () => {
  const [concerns, setConcerns] = useState<Concern[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [newConcernName, setNewConcernName] = useState<string>('');
  const [editingConcern, setEditingConcern] = useState<Concern | null>(null);
  const [deletingConcern, setDeletingConcern] = useState<Concern | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

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
    fetchConcerns();
  }, []);

  const fetchConcerns = async () => {
    try {
      setLoading(true);
      const data = await concernService.getAllConcerns();
      setConcerns(data);
    } catch (err) {
      console.error('Error fetching concerns:', err);
      setError('Failed to load concerns');
    } finally {
      setLoading(false);
    }
  };

  const handleAddConcern = async () => {
    if (!newConcernName.trim()) {
      setError('Concern name cannot be empty');
      return;
    }

    try {
      await concernService.createConcern(newConcernName);
      setShowAddModal(false);
      setNewConcernName('');
      setError('');
      fetchConcerns();
    } catch (err) {
      setError('Failed to add concern');
    }
  };

  const handleEditConcern = async () => {
    if (!editingConcern || !editingConcern.concern_name.trim()) {
      setError('Concern name cannot be empty');
      return;
    }

    try {
      await concernService.updateConcern(editingConcern.id, editingConcern.concern_name);
      setShowEditModal(false);
      setEditingConcern(null);
      setError('');
      fetchConcerns();
    } catch (err) {
      setError('Failed to update concern');
    }
  };

  const handleDeleteConcern = async () => {
    if (!deletingConcern) return;

    try {
      await concernService.deleteConcern(deletingConcern.id);
      setShowDeleteModal(false);
      setDeletingConcern(null);
      setError('');
      fetchConcerns();
    } catch (err) {
      setError('Failed to delete concern');
    }
  };

  const openEditModal = (concern: Concern) => {
    setEditingConcern({ ...concern });
    setShowEditModal(true);
    setError('');
  };

  const openDeleteModal = (concern: Concern) => {
    setDeletingConcern(concern);
    setShowDeleteModal(true);
    setError('');
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Concern Configuration
          </h1>
          <button
            onClick={() => {
              setShowAddModal(true);
              setError('');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isDarkMode 
                ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                : 'bg-orange-500 hover:bg-orange-600 text-white'
            }`}
          >
            <Plus className="h-5 w-5" />
            Add Concern
          </button>
        </div>

        {error && (
          <div className={`mb-4 p-4 rounded-lg ${
            isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
          }`}>
            {error}
          </div>
        )}

        {loading ? (
          <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading concerns...
          </div>
        ) : (
          <div className={`rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <table className="w-full">
              <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    ID
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Concern Name
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={isDarkMode ? 'divide-y divide-gray-700' : 'divide-y divide-gray-200'}>
                {concerns.length === 0 ? (
                  <tr>
                    <td colSpan={3} className={`px-6 py-4 text-center ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      No concerns found
                    </td>
                  </tr>
                ) : (
                  concerns.map((concern) => (
                    <tr key={concern.id} className={isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {concern.id}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {concern.concern_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(concern)}
                            className={`p-2 rounded transition-colors ${
                              isDarkMode 
                                ? 'text-blue-400 hover:bg-blue-900' 
                                : 'text-blue-600 hover:bg-blue-100'
                            }`}
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(concern)}
                            className={`p-2 rounded transition-colors ${
                              isDarkMode 
                                ? 'text-red-400 hover:bg-red-900' 
                                : 'text-red-600 hover:bg-red-100'
                            }`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 w-full max-w-md ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h2 className={`text-xl font-bold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Add New Concern
            </h2>
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Concern Name
              </label>
              <input
                type="text"
                value={newConcernName}
                onChange={(e) => setNewConcernName(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="Enter concern name"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewConcernName('');
                  setError('');
                }}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                }`}
              >
                <X className="h-5 w-5" />
              </button>
              <button
                onClick={handleAddConcern}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                    : 'bg-orange-500 hover:bg-orange-600 text-white'
                }`}
              >
                <Check className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingConcern && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 w-full max-w-md ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h2 className={`text-xl font-bold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Edit Concern
            </h2>
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Concern Name
              </label>
              <input
                type="text"
                value={editingConcern.concern_name}
                onChange={(e) => setEditingConcern({ ...editingConcern, concern_name: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingConcern(null);
                  setError('');
                }}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                }`}
              >
                <X className="h-5 w-5" />
              </button>
              <button
                onClick={handleEditConcern}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                    : 'bg-orange-500 hover:bg-orange-600 text-white'
                }`}
              >
                <Check className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && deletingConcern && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 w-full max-w-md ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h2 className={`text-xl font-bold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Delete Concern
            </h2>
            <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Are you sure you want to delete "{deletingConcern.concern_name}"?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingConcern(null);
                  setError('');
                }}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConcern}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConcernConfig;
