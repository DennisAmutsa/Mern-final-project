import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, UserPlus, Shield, UserCheck, UserX, Edit, Trash2, Search, Filter } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [assignForm, setAssignForm] = useState({
    role: '',
    department: '',
    employeeId: ''
  });
  const [addUserForm, setAddUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    role: '',
    department: '',
    employeeId: ''
  });
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editUserForm, setEditUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    department: '',
    employeeId: '',
    isActive: true
  });

  const roles = [
    { value: 'admin', label: 'Administrator' },
    { value: 'doctor', label: 'Doctor' },
    { value: 'nurse', label: 'Nurse' },
    { value: 'receptionist', label: 'Receptionist' },
    { value: 'pharmacist', label: 'Pharmacist' }
  ];

  const departments = [
    'Emergency', 'Cardiology', 'Neurology', 'Pediatrics', 
    'Orthopedics', 'General Medicine', 'Surgery', 'ICU', 
    'Pharmacy', 'Administration'
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL ? API_BASE_URL + '/api/auth/users' : '/api/auth/users'}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL ? API_BASE_URL + '/api/auth/users/' + selectedUser._id + '/assign-role' : '/api/auth/users/' + selectedUser._id + '/assign-role'}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(assignForm)
      });

      if (response.ok) {
        setShowAssignModal(false);
        setSelectedUser(null);
        setAssignForm({ role: '', department: '', employeeId: '' });
        fetchUsers();
      }
    } catch (error) {
      console.error('Error assigning role:', error);
    }
  };

  const handleAddUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL ? API_BASE_URL + '/api/auth/users' : '/api/auth/users'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(addUserForm)
      });

      if (response.ok) {
        setShowAddUserModal(false);
        setAddUserForm({
          firstName: '',
          lastName: '',
          email: '',
          username: '',
          password: '',
          role: '',
          department: '',
          employeeId: ''
        });
        fetchUsers();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user');
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL ? API_BASE_URL + '/api/auth/users/' + userId + '/toggle-status' : '/api/auth/users/' + userId + '/toggle-status'}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL ? API_BASE_URL + '/api/auth/users/' + userId : '/api/auth/users/' + userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const openEditUserModal = (user) => {
    setSelectedUser(user);
    setEditUserForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      role: user.role || '',
      department: user.department || '',
      employeeId: user.employeeId || '',
      isActive: user.isActive
    });
    setShowEditUserModal(true);
  };

  const handleEditUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL ? API_BASE_URL + '/api/auth/users/' + selectedUser._id : '/api/auth/users/' + selectedUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editUserForm)
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (response.ok) {
        setShowEditUserModal(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        // Check if response has JSON content
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
        const error = await response.json();
        if (error.errors && Array.isArray(error.errors)) {
          alert(error.errors.map(e => e.msg).join('\n'));
        } else {
          alert(error.error || 'Failed to update user');
          }
        } else {
          // Handle non-JSON response (like HTML error page)
          const textResponse = await response.text();
          console.error('Non-JSON response:', textResponse);
          alert('Server error: Invalid response format');
        }
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.lastName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    const matchesDepartment = !departmentFilter || user.department === departmentFilter;
    
    return matchesSearch && matchesRole && matchesDepartment;
  });

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'doctor': return 'bg-blue-100 text-blue-800';
      case 'nurse': return 'bg-green-100 text-green-800';
      case 'receptionist': return 'bg-yellow-100 text-yellow-800';
      case 'pharmacist': return 'bg-purple-100 text-purple-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 text-sm md:text-base">Manage hospital staff accounts and permissions</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <UsersIcon className="h-6 w-6 text-blue-600" />
            <span className="text-sm text-gray-500">{users.length} users</span>
          </div>
          <button
            onClick={() => setShowAddUserModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors w-full md:w-auto"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Roles</option>
              {roles.map(role => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('');
                setDepartmentFilter('');
              }}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto w-full">
        <div className="min-w-full w-full">
          <table className="min-w-full w-full divide-y divide-gray-200 text-xs md:text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                        <div className="text-xs text-gray-400">
                          @{user.username}
                        </div>
                        {user.employeeId && (
                          <div className="text-xs text-blue-600 font-medium">
                            ID: {user.employeeId}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                      {user.role === 'pending' ? 'Pending' : roles.find(r => r.value === user.role)?.label || user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.department || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.isActive)}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {user.role === 'pending' && (
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowAssignModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="Assign Role"
                        >
                          <Shield className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleStatus(user._id, user.isActive)}
                        className={user.isActive ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}
                        title={user.isActive ? "Deactivate" : "Activate"}
                      >
                        {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete User"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <Edit
                        className="h-4 w-4 text-blue-600 hover:text-blue-900 cursor-pointer"
                        title="Edit User"
                        onClick={() => openEditUserModal(user)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Role Modal */}
      {showAssignModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-2 md:p-0">
          <div className="relative mx-auto p-4 md:p-5 border max-w-full w-full md:w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Assign Role to {selectedUser.firstName} {selectedUser.lastName}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    value={assignForm.role}
                    onChange={(e) => setAssignForm({ ...assignForm, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Role</option>
                    {roles.map(role => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </div>
                {assignForm.role && assignForm.role !== 'admin' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department
                    </label>
                    <select
                      value={assignForm.department}
                      onChange={(e) => setAssignForm({ ...assignForm, department: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={assignForm.employeeId}
                    onChange={(e) => setAssignForm({ ...assignForm, employeeId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., EMP001, DOC2024, NUR001"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Assign a unique Employee ID for this user
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedUser(null);
                    setAssignForm({ role: '', department: '', employeeId: '' });
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignRole}
                  disabled={!assignForm.role}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Assign Role
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-2 md:p-0">
          <div className="relative mx-auto p-4 md:p-5 border max-w-full w-full md:w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Add New User
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={addUserForm.firstName}
                    onChange={(e) => setAddUserForm({ ...addUserForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={addUserForm.lastName}
                    onChange={(e) => setAddUserForm({ ...addUserForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={addUserForm.email}
                    onChange={(e) => setAddUserForm({ ...addUserForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., john.doe@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={addUserForm.username}
                    onChange={(e) => setAddUserForm({ ...addUserForm, username: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., johndoe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={addUserForm.password}
                    onChange={(e) => setAddUserForm({ ...addUserForm, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter a secure password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    value={addUserForm.role}
                    onChange={(e) => setAddUserForm({ ...addUserForm, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Role</option>
                    {roles.map(role => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </div>
                {addUserForm.role && addUserForm.role !== 'admin' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department
                    </label>
                    <select
                      value={addUserForm.department}
                      onChange={(e) => setAddUserForm({ ...addUserForm, department: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={addUserForm.employeeId}
                    onChange={(e) => setAddUserForm({ ...addUserForm, employeeId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., EMP001, DOC2024, NUR001"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Assign a unique Employee ID for this user
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddUserModal(false);
                    setAddUserForm({
                      firstName: '',
                      lastName: '',
                      email: '',
                      username: '',
                      password: '',
                      role: '',
                      department: '',
                      employeeId: ''
                    });
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddUser}
                  disabled={!addUserForm.firstName || !addUserForm.lastName || !addUserForm.email || !addUserForm.username || !addUserForm.password || !addUserForm.role}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Add User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditUserModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-2 md:p-0">
          <div className="relative mx-auto p-4 md:p-5 border max-w-full w-full md:w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Edit User
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    value={editUserForm.firstName}
                    onChange={e => setEditUserForm({ ...editUserForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    value={editUserForm.lastName}
                    onChange={e => setEditUserForm({ ...editUserForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={editUserForm.email}
                    onChange={e => setEditUserForm({ ...editUserForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select
                    value={editUserForm.role}
                    onChange={e => setEditUserForm({ ...editUserForm, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Role</option>
                    {roles.map(role => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </div>
                {editUserForm.role && editUserForm.role !== 'admin' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                    <select
                      value={editUserForm.department}
                      onChange={e => setEditUserForm({ ...editUserForm, department: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID</label>
                  <input
                    type="text"
                    value={editUserForm.employeeId}
                    onChange={e => setEditUserForm({ ...editUserForm, employeeId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={editUserForm.isActive}
                    onChange={e => setEditUserForm({ ...editUserForm, isActive: e.target.value === 'true' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={true}>Active</option>
                    <option value={false}>Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditUserModal(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditUser}
                  disabled={!editUserForm.firstName || !editUserForm.lastName || !editUserForm.email || !editUserForm.role}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users; 