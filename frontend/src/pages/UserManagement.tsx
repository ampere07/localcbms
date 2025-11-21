import React, { useState, useEffect } from 'react';
import { User } from '../types/api';
import { userService } from '../services/userService';
import Breadcrumb from './Breadcrumb';
import AddNewUserForm from '../components/AddNewUserForm';
import EditUserForm from '../components/EditUserForm';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await userService.getAllUsers();
      
      if (response.success && response.data) {
        setUsers(response.data);
      }
    } catch (error: any) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFullName = (user: User): string => {
    const parts = [user.first_name, user.middle_initial, user.last_name].filter(Boolean);
    return parts.join(' ');
  };

  const filteredUsers = users.filter(user => {
    const fullName = getFullName(user);
    return (
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Pagination calculations
  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);
  const showingStart = totalItems === 0 ? 0 : startIndex + 1;
  const showingEnd = Math.min(endIndex, totalItems);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleAddNewUser = () => {
    setShowAddUserForm(true);
  };

  const handleCancelAddUser = () => {
    setShowAddUserForm(false);
  };

  const handleUserCreated = (newUser: User) => {
    if (!newUser) {
      console.error('Received invalid user from creation');
      alert('Warning: Failed to receive user data. Please refresh the page.');
      return;
    }
    
    setUsers(prev => [...prev, newUser]);
    setShowAddUserForm(false);
  };

  const handleEditUser = (user: User) => {
    if (!user) {
      console.error('Cannot edit user: No user data');
      alert('Cannot edit user: No user data');
      return;
    }
    
    setEditingUser(user);
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
  };

  const handleUserUpdated = (updatedUser: User) => {
    setUsers(prev => prev.map(user => 
      user.id === updatedUser.id ? updatedUser : user
    ));
    setEditingUser(null);
  };

  const handleDeleteClick = (user: User) => {
    setDeletingUser(user);
  };

  const handleCancelDelete = () => {
    setDeletingUser(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;

    try {
      const response = await userService.deleteUser(deletingUser.id);
      
      if (response.success) {
        setUsers(prev => prev.filter(user => user.id !== deletingUser.id));
        setDeletingUser(null);
      } else {
        const errorMessage = response.message || 'Failed to delete user';
        alert(errorMessage);
      }
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete user';
      alert(errorMessage);
    }
  };

  // Show forms or main view
  if (showAddUserForm) {
    return <AddNewUserForm onCancel={handleCancelAddUser} onUserCreated={handleUserCreated} />;
  }

  if (editingUser) {
    return <EditUserForm user={editingUser} onCancel={handleCancelEdit} onUserUpdated={handleUserUpdated} />;
  }

  return (
    <div className="p-6">
      <Breadcrumb items={[
        { label: 'Users' }
      ]} />
      <div className="bg-gray-800 rounded-lg border border-gray-600 overflow-hidden text-white">
        <div className="p-6">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-2">
              User Management
            </h2>
            <p className="text-gray-400 text-sm">
              Manage system users and their permissions
            </p>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-8">
            <input
              type="text"
              placeholder="Search users by name, username, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-3 bg-gray-900 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-gray-100 w-full md:w-80"
            />
            <button 
              onClick={handleAddNewUser}
              className="px-6 py-3 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm font-medium whitespace-nowrap"
            >
              Add New User
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-400">Loading users...</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block bg-gray-800 rounded border border-gray-600 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="">
                        <th className="px-4 py-4 text-left text-sm font-medium text-gray-300 border-b border-gray-600">Name</th>
                        <th className="px-4 py-4 text-left text-sm font-medium text-gray-300 border-b border-gray-600">Username</th>
                        <th className="px-4 py-4 text-left text-sm font-medium text-gray-300 border-b border-gray-600">Email</th>
                        <th className="px-4 py-4 text-left text-sm font-medium text-gray-300 border-b border-gray-600">Contact</th>
                        <th className="px-4 py-4 text-left text-sm font-medium text-gray-300 border-b border-gray-600">Organization</th>
                        <th className="px-4 py-4 text-left text-sm font-medium text-gray-300 border-b border-gray-600">Created</th>
                        <th className="px-4 py-4 text-left text-sm font-medium text-gray-300 border-b border-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentUsers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                            No users found
                          </td>
                        </tr>
                      ) : (
                        currentUsers.map((user: User) => (
                          <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-750">
                            <td className="px-4 py-4 text-sm text-white">
                              {user.salutation && (
                                <span className="text-gray-400 mr-1">{user.salutation}</span>
                              )}
                              {getFullName(user)}
                            </td>
                            <td className="px-4 py-4 text-sm text-white">{user.username}</td>
                            <td className="px-4 py-4 text-sm text-gray-300">{user.email_address}</td>
                            <td className="px-4 py-4 text-sm text-gray-300">
                              {user.contact_number || '-'}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-300">
                              {user.organization?.organization_name || 'No Organization'}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-300">
                              {new Date(user.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleEditUser(user)}
                                  className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900 rounded transition-colors"
                                  title="Edit user"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button 
                                  onClick={() => handleDeleteClick(user)}
                                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900 rounded transition-colors"
                                  title="Delete user"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {currentUsers.length === 0 ? (
                  <div className="bg-gray-800 rounded border border-gray-600 p-6 text-center text-gray-400">
                    No users found
                  </div>
                ) : (
                  currentUsers.map((user: User) => (
                    <div key={user.id} className="bg-gray-800 rounded border border-gray-600 p-4">
                      <div className="mb-3">
                        <div className="text-white font-medium mb-1">
                          {user.salutation && (
                            <span className="text-gray-400 mr-1">{user.salutation}</span>
                          )}
                          {getFullName(user)}
                        </div>
                        <div className="text-sm text-gray-400">@{user.username}</div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Email:</span>
                          <span className="text-gray-300 truncate ml-2">{user.email_address}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Contact:</span>
                          <span className="text-gray-300">{user.contact_number || '-'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Organization:</span>
                          <span className="text-gray-300 truncate ml-2">{user.organization?.organization_name || 'No Organization'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Created:</span>
                          <span className="text-gray-300">{new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-3 border-t border-gray-700">
                        <button 
                          onClick={() => handleEditUser(user)}
                          className="flex-1 px-4 py-2 text-blue-400 border border-blue-400 hover:bg-blue-900 rounded transition-colors text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(user)}
                          className="flex-1 px-4 py-2 text-red-400 border border-red-400 hover:bg-red-900 rounded transition-colors text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* Pagination Controls */}
          {totalItems > 0 && (
            <div className="mt-4">
              <div className="px-4 md:px-6 py-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <div className="text-sm text-gray-300 text-center sm:text-left">
                    Showing {showingStart} to {showingEnd} of {totalItems} entries
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm text-gray-300">Show</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                      className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-gray-400"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span className="text-sm text-gray-300">entries</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-center gap-1 flex-wrap">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || totalPages === 0}
                    className="px-3 py-1 text-sm bg-gray-800 border border-gray-600 rounded text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    Previous
                  </button>
                  
                  <div className="hidden sm:flex items-center gap-1">
                  {totalPages > 0 && Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      const distance = Math.abs(page - currentPage);
                      return distance <= 2 || page === 1 || page === totalPages;
                    })
                    .map((page, index, array) => {
                      const prevPage = array[index - 1];
                      const showEllipsis = prevPage && page - prevPage > 1;
                      
                      return (
                        <React.Fragment key={page}>
                          {showEllipsis && (
                            <span className="px-2 text-gray-400">...</span>
                          )}
                          <button
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-1 text-sm border rounded ${
                              currentPage === page
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700'
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      );
                    })}
                  </div>
                  
                  <div className="sm:hidden text-sm text-gray-300 px-3 py-1">
                    {currentPage} / {totalPages}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="px-3 py-1 text-sm bg-gray-800 border border-gray-600 rounded text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Delete Confirmation Modal */}
        {deletingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-900 p-6 rounded border border-gray-700 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-white mb-4">
                Confirm Delete User
              </h3>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete user "{getFullName(deletingUser)}" ({deletingUser.username})? This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={handleCancelDelete}
                  className="px-4 py-2 border border-gray-600 text-white rounded hover:bg-gray-800 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
