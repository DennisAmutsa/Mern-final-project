import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  UserCheck,
  Activity,
  MapPin,
  Phone,
  Mail,
  UserPlus
} from 'lucide-react';
import apiClient from '../config/axios';
import toast from 'react-hot-toast';

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    phone: '',
    email: '',
    headOfDepartment: '',
    capacity: '',
    status: 'active'
  });

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningDepartment, setAssigningDepartment] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      console.log('🔍 Fetching departments...');
      const response = await apiClient.get('/api/departments');
      console.log('📊 Departments response:', response.data);
      setDepartments(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('❌ Error fetching departments:', error);
      toast.error('Failed to fetch departments');
      setDepartments([]); // Ensure it's always an array
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('🔍 Submitting department:', formData);
      if (showEditModal) {
        await apiClient.put(`/api/departments/${selectedDepartment._id}`, formData);
        toast.success('Department updated successfully');
      } else {
        await apiClient.post('/api/departments', formData);
        toast.success('Department created successfully');
      }
      setShowAddModal(false);
      setShowEditModal(false);
      setFormData({
        name: '',
        description: '',
        location: '',
        phone: '',
        email: '',
        headOfDepartment: '',
        capacity: '',
        status: 'active'
      });
      fetchDepartments();
    } catch (error) {
      console.error('❌ Error submitting department:', error);
      toast.error(error.response?.data?.error || 'Operation failed');
    }
  };

  const handleEdit = (department) => {
    setSelectedDepartment(department);
    setFormData({
      name: department.name,
      description: department.description,
      location: department.location,
      phone: department.phone,
      email: department.email,
      headOfDepartment: department.headOfDepartment,
      capacity: department.capacity,
      status: department.status
    });
    setShowEditModal(true);
  };

  const handleDelete = async (departmentId) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;
    
    try {
      console.log('🔍 Deleting department:', departmentId);
      await apiClient.delete(`/api/departments/${departmentId}`);
      toast.success('Department deleted successfully');
      fetchDepartments();
    } catch (error) {
      console.error('❌ Error deleting department:', error);
      toast.error('Failed to delete department');
    }
  };

  const openAssignModal = async (department) => {
    setAssigningDepartment(department);
    setShowAssignModal(true);
    setAssignLoading(true);
    try {
      console.log('🔍 Fetching staff for department assignment...');
      const res = await apiClient.get('/api/users?roles=doctor,nurse,receptionist,pharmacist,staff');
      console.log('📊 Staff response:', res.data);
      const allowedRoles = ['doctor', 'nurse', 'receptionist', 'pharmacist', 'staff'];
      setStaffList(Array.isArray(res.data) ? res.data.filter(user => allowedRoles.includes(user.role)) : []);
      setSelectedStaff([]);
    } catch (err) {
      console.error('❌ Error fetching staff:', err);
      toast.error('Failed to fetch staff');
      setStaffList([]);
    } finally {
      setAssignLoading(false);
    }
  };

  const handleAssignStaff = async () => {
    if (!assigningDepartment || selectedStaff.length === 0) return;
    setAssignLoading(true);
    try {
      console.log('🔍 Assigning staff to department:', assigningDepartment._id, selectedStaff);
      await apiClient.post(`/api/departments/${assigningDepartment._id}/assign-staff`, { staffIds: selectedStaff });
      toast.success('Staff assigned successfully');
      setShowAssignModal(false);
      setAssigningDepartment(null);
      fetchDepartments();
    } catch (err) {
      console.error('❌ Error assigning staff:', err);
      toast.error('Failed to assign staff');
    } finally {
      setAssignLoading(false);
    }
  };

  const filteredDepartments = (Array.isArray(departments) ? departments : []).filter(dept => {
    const matchesSearch = dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dept.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || dept.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Department Management</h1>
          <p className="text-gray-600">Manage hospital departments and staff assignments</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Department</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search departments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('');
              }}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDepartments.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 py-8">
            {departments.length === 0 ? 'No departments found.' : 'No departments match your search.'}
          </div>
        ) : (
          filteredDepartments.map((department) => (
            <div key={department._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{department.name}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      department.status === 'active' ? 'bg-green-100 text-green-800' :
                      department.status === 'inactive' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {department.status}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(department)}
                    className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(department._id)}
                    className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4">{department.description}</p>

              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{department.location}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{department.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{department.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <UserCheck className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Head: {department.headOfDepartment}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Capacity: {department.capacity}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Staff Members</span>
                  <span className="font-medium text-gray-900">{department.staffCount || 0}</span>
                </div>
                <button
                  className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-1"
                  onClick={() => openAssignModal(department)}
                >
                  <UserPlus className="h-4 w-4" /> Assign Staff
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Department Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Department</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Head of Department</label>
                    <input
                      type="text"
                      value={formData.headOfDepartment}
                      onChange={(e) => setFormData({ ...formData, headOfDepartment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                    <input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Add Department
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Department Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Department</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Head of Department</label>
                    <input
                      type="text"
                      value={formData.headOfDepartment}
                      onChange={(e) => setFormData({ ...formData, headOfDepartment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                    <input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Update Department
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showAssignModal && assigningDepartment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-2 md:p-0">
          <div className="relative mx-auto p-4 md:p-5 border max-w-full w-full md:w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Assign Staff to {assigningDepartment.name}
              </h3>
              {assignLoading ? (
                <div className="text-center py-8">Loading staff...</div>
              ) : staffList.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No staff available.</div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                  {staffList.map(staff => (
                    <label key={staff._id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedStaff.includes(staff._id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedStaff(prev => [...prev, staff._id]);
                          } else {
                            setSelectedStaff(prev => prev.filter(id => id !== staff._id));
                          }
                        }}
                      />
                      <span>{staff.firstName} {staff.lastName} ({staff.email})</span>
                    </label>
                  ))}
                </div>
              )}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setAssigningDepartment(null);
                    setSelectedStaff([]);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignStaff}
                  disabled={assignLoading || selectedStaff.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {assignLoading ? 'Assigning...' : 'Assign Staff'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentManagement; 