import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, User, Phone, Mail, Calendar, MapPin, Shield, Heart } from 'lucide-react';
import apiClient from '../config/axios';
import toast from 'react-hot-toast';

const PAGE_SIZE = 10;

const Patients = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [viewPatient, setViewPatient] = useState(null);
  const [editPatient, setEditPatient] = useState(null);
  const [deletePatient, setDeletePatient] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const isAdmin = user?.role === 'admin';
  const isReceptionist = user?.role === 'receptionist';

  useEffect(() => {
    if (isAdmin) {
      const fetchPatients = async () => {
        setLoading(true);
        setError('');
        try {
          console.log('🔍 Fetching patients with role: user');
          const res = await apiClient.get('/api/users?roles=user');
          console.log('📊 Patients response:', res.data);
          setPatients(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
          console.error('❌ Error fetching patients:', err);
          setError('Failed to fetch patients.');
        } finally {
          setLoading(false);
        }
      };
      fetchPatients();
    } else if (user?.role === 'doctor') {
      // Fetch patients assigned to this doctor from users collection
      setLoading(true);
      apiClient.get(`/api/users?roles=user&assignedDoctor=${user._id}`)
        .then(res => {
          setPatients(Array.isArray(res.data) ? res.data : []);
        })
        .catch(() => setPatients([]))
        .finally(() => setLoading(false));
    } else if (user?.role === 'nurse' || user?.role === 'receptionist') {
      // Fetch all patients for nurses and receptionists
      setLoading(true);
      apiClient.get('/api/users?roles=user')
        .then(res => {
          setPatients(Array.isArray(res.data) ? res.data : []);
        })
        .catch(() => setPatients([]))
        .finally(() => setLoading(false));
    } else {
      // For regular users/patients - show their own profile
      if (user?.email) {
        apiClient.get(`/api/users/profile?email=${user.email}`)
          .then(res => {
            setProfile(res.data);
            setForm(res.data);
          })
          .catch(() => setProfile(null))
          .finally(() => setLoading(false));
      }
    }
  }, [user, isAdmin]);

  // Fetch doctors for assignment (admin only)
  useEffect(() => {
    if (isAdmin) {
      apiClient.get('/api/doctors')
        .then(res => setDoctors(Array.isArray(res.data) ? res.data : []))
        .catch(() => setDoctors([]));
    }
  }, [isAdmin]);

  // Filtering logic
  let filtered = patients.filter(p => {
    const matchesSearch =
      !search ||
      (p.firstName && p.firstName.toLowerCase().includes(search.toLowerCase())) ||
      (p.lastName && p.lastName.toLowerCase().includes(search.toLowerCase())) ||
      (p.email && p.email.toLowerCase().includes(search.toLowerCase()));
    const matchesRole = !roleFilter || p.role === roleFilter;
    const matchesStatus = !statusFilter || p.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Action handlers
  const handleView = (patient) => setViewPatient(patient);
  const handleEdit = (patient) => setEditPatient(patient);
  const handleDelete = (patient) => setDeletePatient(patient);
  
  // New patient registration form state
  const [newPatientForm, setNewPatientForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    bloodType: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    },
    insurance: {
      provider: '',
      policyNumber: '',
      groupNumber: '',
      expiryDate: ''
    }
  });

  // Unique roles and statuses for filters
  const uniqueRoles = Array.from(new Set(patients.map(p => p.role))).filter(Boolean);
  const uniqueStatuses = Array.from(new Set(patients.map(p => p.status))).filter(Boolean);

  // Admin, Doctor, Nurse, Receptionist view: table of patients
  if (isAdmin || user?.role === 'doctor' || user?.role === 'nurse' || user?.role === 'receptionist') {
  return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">
          {user?.role === 'doctor' ? 'My Patients' : 
           user?.role === 'nurse' ? 'Patient Records' :
           user?.role === 'receptionist' ? 'Patient Management' :
           'All Patients'}
        </h2>
          {(isAdmin || isReceptionist) && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Register New Patient</span>
            </button>
          )}
        </div>
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row md:items-end gap-4 mb-4">
        <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
          <input
            type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
            <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }} className="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="">All</option>
              {uniqueRoles.map(role => <option key={role} value={role}>{role}</option>)}
            </select>
        </div>
        <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="">All</option>
              {uniqueStatuses.map(status => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="text-gray-500">No patients found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded shadow border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 font-bold text-left">#</th>
                  <th className="px-4 py-2 font-bold text-left">Name</th>
                  <th className="px-4 py-2 font-bold text-left">Email</th>
                  <th className="px-4 py-2 font-bold text-left">Role</th>
                  {isAdmin && <th className="px-4 py-2 font-bold text-left">Assigned Doctor</th>}
                  {paged[0]?.phone && <th className="px-4 py-2 font-bold text-left">Phone</th>}
                  {paged[0]?.status && <th className="px-4 py-2 font-bold text-left">Status</th>}
                  <th className="px-4 py-2 font-bold text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((p, idx) => (
                  <tr key={p._id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-2 border-b">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                    <td className="px-4 py-2 border-b">{p.firstName} {p.lastName}</td>
                    <td className="px-4 py-2 border-b">{p.email}</td>
                    <td className="px-4 py-2 border-b">{p.role}</td>
                    {isAdmin && (
                      <td className="px-4 py-2 border-b">
                        <select
                          value={typeof p.assignedDoctor === 'object' ? p.assignedDoctor?._id : (p.assignedDoctor || '')}
                          onChange={async (e) => {
                            const doctorId = e.target.value;
                            try {
                                      await apiClient.put(`/api/users/${p._id}/assign-doctor`, { doctorId });
        const res = await apiClient.get('/api/users?roles=user');
                              setPatients(Array.isArray(res.data) ? res.data : []);
                            } catch {
                              alert('Failed to assign doctor');
                            }
                          }}
                          className="w-full px-2 py-1 border rounded"
                        >
                          <option value="">Unassigned</option>
                          {doctors.map(doc => (
                            <option key={doc._id} value={doc._id}>
                              Dr. {doc.firstName} {doc.lastName}
                            </option>
                          ))}
                        </select>
                        {p.assignedDoctor && typeof p.assignedDoctor === 'object' && p.assignedDoctor.firstName && (
                          <div className="text-xs text-gray-600 mt-1">Assigned: Dr. {p.assignedDoctor.firstName} {p.assignedDoctor.lastName}</div>
                        )}
                      </td>
                    )}
                    {p.phone && <td className="px-4 py-2 border-b">{p.phone}</td>}
                    {p.status && <td className="px-4 py-2 border-b">{p.status}</td>}
                    <td className="px-4 py-2 border-b space-x-2">
                      <button onClick={() => handleView(p)} className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs">View</button>
                      {isAdmin && (
                        <>
                          <button onClick={() => handleEdit(p)} className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-xs">Edit</button>
                          <button onClick={() => handleDelete(p)} className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs">Delete</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-4">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50">Prev</button>
                <span>Page {page} of {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50">Next</button>
              </div>
            )}
          </div>
        )}
        {/* View Modal */}
        {viewPatient && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">Patient Details</h3>
              <div className="space-y-2">
                <div><span className="font-medium">Name:</span> {viewPatient.firstName} {viewPatient.lastName}</div>
                <div><span className="font-medium">Email:</span> {viewPatient.email}</div>
                <div><span className="font-medium">Role:</span> {viewPatient.role}</div>
                {viewPatient.phone && <div><span className="font-medium">Phone:</span> {viewPatient.phone}</div>}
                {viewPatient.status && <div><span className="font-medium">Status:</span> {viewPatient.status}</div>}
                {viewPatient.assignedDoctor && typeof viewPatient.assignedDoctor === 'object' && viewPatient.assignedDoctor.firstName && (
                  <div><span className="font-medium">Assigned Doctor:</span> Dr. {viewPatient.assignedDoctor.firstName} {viewPatient.assignedDoctor.lastName}</div>
                )}
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button type="button" onClick={() => setViewPatient(null)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">Close</button>
              </div>
            </div>
        </div>
        )}
        {/* Edit and Delete modals can be implemented here */}
        {/* Edit Modal */}
        {editPatient && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">Edit Patient</h3>
              <form
                onSubmit={async e => {
                  e.preventDefault();
                  setSaving(true);
                  try {
                    const payload = {
                      firstName: editPatient.firstName,
                      lastName: editPatient.lastName,
                      email: editPatient.email,
                      phone: editPatient.phone,
                      status: editPatient.status,
                      assignedDoctor: typeof editPatient.assignedDoctor === 'object' ? editPatient.assignedDoctor._id : editPatient.assignedDoctor || ''
                    };
                    await apiClient.put(`/api/users/profile/${editPatient._id}`, payload);
                    setEditPatient(null);
                    setSaving(false);
                    // Refresh patients
                    const res = await apiClient.get('/api/users?roles=user');
                    setPatients(Array.isArray(res.data) ? res.data : []);
                  } catch (err) {
                    setSaving(false);
                    alert('Failed to update patient.');
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-gray-700">First Name</label>
                  <input type="text" className="w-full border rounded px-3 py-2" value={editPatient.firstName} onChange={e => setEditPatient({ ...editPatient, firstName: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-gray-700">Last Name</label>
                  <input type="text" className="w-full border rounded px-3 py-2" value={editPatient.lastName} onChange={e => setEditPatient({ ...editPatient, lastName: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-gray-700">Email</label>
                  <input type="email" className="w-full border rounded px-3 py-2" value={editPatient.email} onChange={e => setEditPatient({ ...editPatient, email: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-gray-700">Phone</label>
                  <input type="text" className="w-full border rounded px-3 py-2" value={editPatient.phone || ''} onChange={e => setEditPatient({ ...editPatient, phone: e.target.value })} />
                </div>
                <div>
                  <label className="block text-gray-700">Status</label>
                  <input type="text" className="w-full border rounded px-3 py-2" value={editPatient.status || ''} onChange={e => setEditPatient({ ...editPatient, status: e.target.value })} />
                </div>
                {isAdmin && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Assigned Doctor</label>
                    <select
                      value={typeof editPatient.assignedDoctor === 'object' ? editPatient.assignedDoctor._id : (editPatient.assignedDoctor || '')}
                      onChange={e => setEditPatient({ ...editPatient, assignedDoctor: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Unassigned</option>
                      {doctors.map(doc => (
                        <option key={doc._id} value={doc._id}>
                          Dr. {doc.firstName} {doc.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex justify-end space-x-2 mt-4">
                  <button type="button" onClick={() => setEditPatient(null)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">Cancel</button>
                  <button type="submit" disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Delete Modal */}
        {deletePatient && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">Delete Patient</h3>
              <p>Are you sure you want to delete <span className="font-semibold">{deletePatient.firstName} {deletePatient.lastName}</span>?</p>
              <div className="flex justify-end space-x-2 mt-4">
                <button type="button" onClick={() => setDeletePatient(null)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">Cancel</button>
            <button
              type="button"
                  onClick={async () => {
                    setSaving(true);
                    try {
                      await apiClient.delete(`/api/users/${deletePatient._id}`);
                      setDeletePatient(null);
                      setSaving(false);
                      // Refresh patients
                      const res = await apiClient.get('/api/users?roles=user');
                      setPatients(Array.isArray(res.data) ? res.data : []);
                    } catch (err) {
                      setSaving(false);
                      alert('Failed to delete patient.');
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                  disabled={saving}
                >{saving ? 'Deleting...' : 'Delete'}</button>
              </div>
            </div>
          </div>
        )}
        
        {/* Register New Patient Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Register New Patient
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewPatientForm({
                      firstName: '',
                      lastName: '',
                      email: '',
                      username: '',
                      password: '',
                      phone: '',
                      dateOfBirth: '',
                      gender: '',
                      bloodType: '',
                      address: { street: '', city: '', state: '', zipCode: '', country: '' },
                      emergencyContact: { name: '', relationship: '', phone: '' },
                      insurance: { provider: '', policyNumber: '', groupNumber: '', expiryDate: '' }
                    });
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setSaving(true);
                  try {
                    const patientData = {
                      ...newPatientForm,
                      role: 'user',
                      isActive: true,
                      status: 'Active'
                    };
                    
                    await apiClient.post('/api/auth/register', patientData);
                    toast.success('Patient registered successfully!');
                    setShowAddModal(false);
                    setNewPatientForm({
                      firstName: '',
                      lastName: '',
                      email: '',
                      username: '',
                      password: '',
                      phone: '',
                      dateOfBirth: '',
                      gender: '',
                      bloodType: '',
                      address: { street: '', city: '', state: '', zipCode: '', country: '' },
                      emergencyContact: { name: '', relationship: '', phone: '' },
                      insurance: { provider: '', policyNumber: '', groupNumber: '', expiryDate: '' }
                    });
                    
                    // Refresh patients list
                    const res = await apiClient.get('/api/users?roles=user');
                    setPatients(Array.isArray(res.data) ? res.data : []);
                  } catch (error) {
                    toast.error(error.response?.data?.error || 'Failed to register patient');
                  } finally {
                    setSaving(false);
                  }
                }}
                className="space-y-6"
              >
                {/* Personal Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold mb-4 flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Personal Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                      <input
                        type="text"
                        required
                        value={newPatientForm.firstName}
                        onChange={(e) => setNewPatientForm({...newPatientForm, firstName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                      <input
                        type="text"
                        required
                        value={newPatientForm.lastName}
                        onChange={(e) => setNewPatientForm({...newPatientForm, lastName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input
                        type="email"
                        required
                        value={newPatientForm.email}
                        onChange={(e) => setNewPatientForm({...newPatientForm, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                      <input
                        type="text"
                        required
                        value={newPatientForm.username}
                        onChange={(e) => setNewPatientForm({...newPatientForm, username: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                      <input
                        type="password"
                        required
                        value={newPatientForm.password}
                        onChange={(e) => setNewPatientForm({...newPatientForm, password: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                      <input
                        type="tel"
                        required
                        value={newPatientForm.phone}
                        onChange={(e) => setNewPatientForm({...newPatientForm, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                      <input
                        type="date"
                        required
                        value={newPatientForm.dateOfBirth}
                        onChange={(e) => setNewPatientForm({...newPatientForm, dateOfBirth: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                      <select
                        required
                        value={newPatientForm.gender}
                        onChange={(e) => setNewPatientForm({...newPatientForm, gender: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Blood Type *</label>
                      <select
                        required
                        value={newPatientForm.bloodType}
                        onChange={(e) => setNewPatientForm({...newPatientForm, bloodType: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Blood Type</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold mb-4 flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Address Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                      <input
                        type="text"
                        value={newPatientForm.address.street}
                        onChange={(e) => setNewPatientForm({
                          ...newPatientForm, 
                          address: {...newPatientForm.address, street: e.target.value}
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input
                        type="text"
                        value={newPatientForm.address.city}
                        onChange={(e) => setNewPatientForm({
                          ...newPatientForm, 
                          address: {...newPatientForm.address, city: e.target.value}
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <input
                        type="text"
                        value={newPatientForm.address.state}
                        onChange={(e) => setNewPatientForm({
                          ...newPatientForm, 
                          address: {...newPatientForm.address, state: e.target.value}
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                      <input
                        type="text"
                        value={newPatientForm.address.zipCode}
                        onChange={(e) => setNewPatientForm({
                          ...newPatientForm, 
                          address: {...newPatientForm.address, zipCode: e.target.value}
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                      <input
                        type="text"
                        value={newPatientForm.address.country}
                        onChange={(e) => setNewPatientForm({
                          ...newPatientForm, 
                          address: {...newPatientForm.address, country: e.target.value}
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold mb-4 flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    Emergency Contact
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                      <input
                        type="text"
                        value={newPatientForm.emergencyContact.name}
                        onChange={(e) => setNewPatientForm({
                          ...newPatientForm, 
                          emergencyContact: {...newPatientForm.emergencyContact, name: e.target.value}
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                      <input
                        type="text"
                        value={newPatientForm.emergencyContact.relationship}
                        onChange={(e) => setNewPatientForm({
                          ...newPatientForm, 
                          emergencyContact: {...newPatientForm.emergencyContact, relationship: e.target.value}
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                      <input
                        type="tel"
                        value={newPatientForm.emergencyContact.phone}
                        onChange={(e) => setNewPatientForm({
                          ...newPatientForm, 
                          emergencyContact: {...newPatientForm.emergencyContact, phone: e.target.value}
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Insurance Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold mb-4 flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    Insurance Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Provider</label>
                      <input
                        type="text"
                        value={newPatientForm.insurance.provider}
                        onChange={(e) => setNewPatientForm({
                          ...newPatientForm, 
                          insurance: {...newPatientForm.insurance, provider: e.target.value}
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Policy Number</label>
                      <input
                        type="text"
                        value={newPatientForm.insurance.policyNumber}
                        onChange={(e) => setNewPatientForm({
                          ...newPatientForm, 
                          insurance: {...newPatientForm.insurance, policyNumber: e.target.value}
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Group Number</label>
                      <input
                        type="text"
                        value={newPatientForm.insurance.groupNumber}
                        onChange={(e) => setNewPatientForm({
                          ...newPatientForm, 
                          insurance: {...newPatientForm.insurance, groupNumber: e.target.value}
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                      <input
                        type="date"
                        value={newPatientForm.insurance.expiryDate}
                        onChange={(e) => setNewPatientForm({
                          ...newPatientForm, 
                          insurance: {...newPatientForm.insurance, expiryDate: e.target.value}
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setNewPatientForm({
                        firstName: '',
                        lastName: '',
                        email: '',
                        username: '',
                        password: '',
                        phone: '',
                        dateOfBirth: '',
                        gender: '',
                        bloodType: '',
                        address: { street: '', city: '', state: '', zipCode: '', country: '' },
                        emergencyContact: { name: '', relationship: '', phone: '' },
                        insurance: { provider: '', policyNumber: '', groupNumber: '', expiryDate: '' }
                      });
                    }}
                    className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Registering...
                      </>
                    ) : (
                      <>
                        <User className="h-4 w-4 mr-2" />
                        Register Patient
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Regular users/patients: show own profile
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">My Profile</h2>
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : profile ? (
        <form className="space-y-4 max-w-md mx-auto">
          <div>
            <label className="block text-gray-700">First Name</label>
            <input type="text" className="w-full border rounded px-3 py-2" value={profile.firstName} disabled />
          </div>
          <div>
            <label className="block text-gray-700">Last Name</label>
            <input type="text" className="w-full border rounded px-3 py-2" value={profile.lastName} disabled />
          </div>
          <div>
            <label className="block text-gray-700">Email</label>
            <input type="email" className="w-full border rounded px-3 py-2" value={profile.email} disabled />
          </div>
          <div>
            <label className="block text-gray-700">Phone</label>
            <input type="text" className="w-full border rounded px-3 py-2" value={profile.phone || ''} disabled />
          </div>
        </form>
      ) : (
        <div className="text-gray-500">Profile not found.</div>
      )}
    </div>
  );
};

export default Patients; 