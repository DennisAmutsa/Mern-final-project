import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, UserCheck, Plus, Search, Filter, AlertTriangle, CheckCircle, XCircle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../config/axios';
import toast from 'react-hot-toast';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [editingId, setEditingId] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const isReceptionist = user?.role === 'receptionist';
  const isAdmin = user?.role === 'admin';

  const fetchAppointments = async (page = 1) => {
    try {
      setLoading(true);
      // Use user.id instead of user._id (MongoDB vs API response format)
      const userId = user?.id || user?._id;
      let url = `/api/appointments?page=${page}&limit=7`;
      
      if (user?.role === 'doctor' && userId) {
        url += `&doctor=${userId}`;
        console.log('🔍 Fetching appointments for doctor:', userId);
      }
      
      // Add filters to URL
      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }
      if (dateFilter) {
        url += `&date=${dateFilter}`;
      }
      
      console.log('📋 Fetching appointments from URL:', url);
      const response = await apiClient.get(url);
      console.log('📊 Appointments response:', response.data);
      
      if (Array.isArray(response.data)) {
        setAppointments(response.data);
        setCurrentPage(1);
        setTotalPages(1);
        setTotalAppointments(response.data.length);
        setHasNext(false);
        setHasPrev(false);
      } else if (Array.isArray(response.data.appointments)) {
        setAppointments(response.data.appointments);
        setCurrentPage(response.data.pagination.currentPage);
        setTotalPages(response.data.pagination.totalPages);
        setTotalAppointments(response.data.pagination.totalAppointments);
        setHasNext(response.data.pagination.hasNext);
        setHasPrev(response.data.pagination.hasPrev);
      } else {
        setAppointments([]);
        setCurrentPage(1);
        setTotalPages(1);
        setTotalAppointments(0);
        setHasNext(false);
        setHasPrev(false);
      }
    } catch (error) {
      console.error('❌ Error fetching appointments:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await apiClient.get('/api/users?roles=user,patient');
      setPatients(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setPatients([]);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await apiClient.get('/api/users?roles=doctor');
      setDoctors(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setDoctors([]);
    }
  };

  useEffect(() => {
    fetchAppointments(currentPage);
    if (isReceptionist || isAdmin) {
      fetchPatients();
      fetchDoctors();
    }
    // eslint-disable-next-line
  }, [user, isReceptionist, isAdmin, currentPage, statusFilter, dateFilter]);

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleNextPage = () => {
    if (hasNext) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (hasPrev) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Filter handlers
  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleDateFilterChange = (date) => {
    setDateFilter(date);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleSearchChange = (term) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page when searching
  };

  const statusOptions = ["Scheduled", "In Progress", "Completed", "Cancelled"];

  // Appointment scheduling form state
  const [scheduleForm, setScheduleForm] = useState({
    patient: '',
    doctor: '',
    appointmentDate: '',
    appointmentTime: '',
    reason: '',
    type: 'Consultation',
    priority: 'Medium',
    department: 'General Medicine'
  });

  const handleStatusUpdate = async (id) => {
    if (!newStatus) return;
    await apiClient.put(`/api/appointments/${id}`, { status: newStatus });
    setEditingId(null);
    setNewStatus('');
    fetchAppointments(currentPage);
  };

  const handleScheduleAppointment = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/api/appointments', scheduleForm);
      toast.success('Appointment scheduled successfully!');
      setShowScheduleModal(false);
      setScheduleForm({
        patient: '',
        doctor: '',
        appointmentDate: '',
        appointmentTime: '',
        reason: '',
        type: 'Consultation',
        priority: 'Medium',
        department: 'General Medicine'
      });
      fetchAppointments(currentPage);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to schedule appointment');
    }
  };

  // Filter appointments
  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = !searchTerm || 
      appointment.patient?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.patient?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.doctor?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.doctor?.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || appointment.status === statusFilter;
    
    const matchesDate = !dateFilter || 
      new Date(appointment.appointmentDate).toDateString() === new Date(dateFilter).toDateString();
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6">
      {/* Header with Schedule Button for Receptionists */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">
          {user?.role === 'doctor' ? 'My Appointments' : 
           user?.role === 'receptionist' ? 'Appointment Management' :
           'All Appointments'}
        </h2>
        {(isReceptionist || isAdmin) && (
          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Schedule Appointment</span>
          </button>
        )}
      </div>

      {/* Search and Filters */}
      {(isReceptionist || isAdmin) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search by patient or doctor..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">All Status</option>
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => handleDateFilterChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  handleSearchChange('');
                  handleStatusFilterChange('');
                  handleDateFilterChange('');
                }}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Appointments Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Summary Section */}
        <div className="px-4 sm:px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <div className="text-sm text-gray-600">
              Showing {appointments.length} of {totalAppointments} appointments
              {totalPages > 1 && (
                <span className="ml-2">(Page {currentPage} of {totalPages})</span>
              )}
            </div>
            {totalAppointments > 0 && (
              <div className="text-sm text-gray-600">
                Total: {totalAppointments} appointment{totalAppointments !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAppointments.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                  No appointments found.
                </td>
              </tr>
            ) : (
              filteredAppointments.map((appointment) => (
                <tr key={appointment._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="text-sm font-medium text-gray-900">
                        {appointment.patient?.firstName} {appointment.patient?.lastName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <UserCheck className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm text-gray-900">
                        Dr. {appointment.doctor?.firstName} {appointment.doctor?.lastName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {appointment.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {appointment.appointmentTime || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {appointment.type || 'Consultation'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {appointment.reason || 'General consultation'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      appointment.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      appointment.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                        appointment.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                      appointment.status === 'Scheduled' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {appointment.status || 'Scheduled'}
                      </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {user?.role === 'doctor' && editingId === appointment._id ? (
                      <div className="flex space-x-2">
                        <select 
                          value={newStatus} 
                          onChange={e => setNewStatus(e.target.value)} 
                          className="border rounded px-2 py-1 text-xs"
                        >
                          <option value="">Select status</option>
                          {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                        <button 
                          onClick={() => handleStatusUpdate(appointment._id)} 
                          className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                        >
                          Save
                        </button>
                        <button 
                          onClick={() => setEditingId(null)} 
                          className="px-2 py-1 bg-gray-300 text-gray-700 rounded text-xs hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                      {user?.role === 'doctor' && !['Cancelled', 'Completed'].includes(appointment.status) && (
                          <button 
                            onClick={() => { 
                              setEditingId(appointment._id); 
                              setNewStatus(appointment.status || 'Scheduled'); 
                            }} 
                            className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                          >
                            Update
                          </button>
                        )}
                        {(isReceptionist || isAdmin) && (
                          <button 
                            onClick={async () => {
                              // Handle appointment cancellation
                              if (window.confirm('Are you sure you want to cancel this appointment?')) {
                                                              try {
                                await apiClient.put(`/api/appointments/${appointment._id}`, { status: 'Cancelled' });
                                toast.success('Appointment cancelled successfully!');
                                  fetchAppointments(currentPage);
                              } catch (error) {
                                toast.error('Failed to cancel appointment');
                              }
                              }
                            }}
                            className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>

        {/* Mobile Card View */}
        <div className="lg:hidden">
          {filteredAppointments.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No appointments found.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredAppointments.map((appointment) => (
                <div key={appointment._id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center mb-2">
                        <User className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-900 break-words">
                          {appointment.patient?.firstName} {appointment.patient?.lastName}
                        </span>
                      </div>
                      <div className="flex items-center mb-2">
                        <UserCheck className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-600 break-words">
                          Dr. {appointment.doctor?.firstName} {appointment.doctor?.lastName}
                        </span>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                      appointment.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      appointment.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                      appointment.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                      appointment.status === 'Scheduled' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {appointment.status || 'Scheduled'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 text-sm">
                    <div>
                      <span className="text-gray-500">Date:</span>
                      <span className="ml-1 text-gray-900">
                        {appointment.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Time:</span>
                      <span className="ml-1 text-gray-900">
                        {appointment.appointmentTime || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Type:</span>
                      <span className="ml-1 text-gray-900">
                        {appointment.type || 'Consultation'}
                      </span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-gray-500">Reason:</span>
                      <span className="ml-1 text-gray-900 break-words">
                        {appointment.reason || 'General consultation'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {user?.role === 'doctor' && editingId === appointment._id ? (
                      <>
                        <select 
                          value={newStatus} 
                          onChange={e => setNewStatus(e.target.value)} 
                          className="border rounded px-2 py-1 text-xs flex-1 min-w-0"
                        >
                          <option value="">Select status</option>
                          {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                        <button 
                          onClick={() => handleStatusUpdate(appointment._id)} 
                          className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                        >
                          Save
                        </button>
                        <button 
                          onClick={() => setEditingId(null)} 
                          className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-xs hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        {user?.role === 'doctor' && !['Cancelled', 'Completed'].includes(appointment.status) && (
                          <button 
                            onClick={() => { 
                              setEditingId(appointment._id); 
                              setNewStatus(appointment.status || 'Scheduled'); 
                            }} 
                            className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                          >
                            Update
                          </button>
                        )}
                        {(isReceptionist || isAdmin) && (
                          <button 
                            onClick={async () => {
                              if (window.confirm('Are you sure you want to cancel this appointment?')) {
                                try {
                                  await apiClient.put(`/api/appointments/${appointment._id}`, { status: 'Cancelled' });
                                  toast.success('Appointment cancelled successfully!');
                                  fetchAppointments(currentPage);
                                } catch (error) {
                                  toast.error('Failed to cancel appointment');
                                }
                              }
                            }}
                            className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                          >
                            Cancel
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pagination Controls */}
      {(totalPages > 1) && (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mt-6">
          <button
            onClick={handlePrevPage}
            disabled={!hasPrev}
            className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={!hasNext}
            className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Next
          </button>
        </div>
      )}

      {/* Schedule Appointment Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                Schedule New Appointment
              </h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-gray-500 hover:text-gray-700 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleScheduleAppointment} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient *</label>
                  <select
                    required
                    value={scheduleForm.patient}
                    onChange={(e) => setScheduleForm({...scheduleForm, patient: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">Select Patient</option>
                    {patients.map(patient => (
                      <option key={patient._id} value={patient._id}>
                        {patient.firstName} {patient.lastName} - {patient.email}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Doctor *</label>
                  <select
                    required
                    value={scheduleForm.doctor}
                    onChange={(e) => setScheduleForm({...scheduleForm, doctor: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">Select Doctor</option>
                    {doctors.map(doctor => (
                      <option key={doctor._id} value={doctor._id}>
                        Dr. {doctor.firstName} {doctor.lastName} - {doctor.department}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={scheduleForm.appointmentDate}
                    onChange={(e) => setScheduleForm({...scheduleForm, appointmentDate: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                  <input
                    type="time"
                    required
                    value={scheduleForm.appointmentTime}
                    onChange={(e) => setScheduleForm({...scheduleForm, appointmentTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={scheduleForm.type}
                    onChange={(e) => setScheduleForm({...scheduleForm, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="Consultation">Consultation</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Surgery">Surgery</option>
                    <option value="Check-up">Check-up</option>
                    <option value="Vaccination">Vaccination</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={scheduleForm.priority}
                    onChange={(e) => setScheduleForm({...scheduleForm, priority: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                <textarea
                  required
                  value={scheduleForm.reason}
                  onChange={(e) => setScheduleForm({...scheduleForm, reason: e.target.value})}
                  rows="3"
                  placeholder="Enter appointment reason..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="w-full sm:w-auto px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center text-sm"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments; 