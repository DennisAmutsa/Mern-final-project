import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  RefreshCw, 
  Filter,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  Eye,
  Save,
  CheckSquare,
  Square
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../config/axios';
import toast from 'react-hot-toast';

const DoctorSchedule = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('day'); // 'day', 'week', 'month'
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [scheduleRequest, setScheduleRequest] = useState({
    type: 'leave',
    startDate: '',
    endDate: '',
    reason: '',
    description: '',
    priority: 'normal'
  });
  
  // Schedule management state
  const [schedule, setSchedule] = useState({
    workingDays: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true
    },
    workHours: {
      startTime: '09:00',
      endTime: '16:00'
    },
    breakHours: {
      startTime: '12:00',
      endTime: '12:30'
    },
    appointmentDuration: 30,
    currentlyOnLeave: false,
    leaveDays: []
  });
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    fetchAppointments();
    fetchSchedule();
  }, [selectedDate, viewMode, filterStatus]);

  const fetchSchedule = async () => {
    try {
      const response = await apiClient.get(`/api/doctor-schedule/${user._id}`);
      if (response.data) {
        setSchedule(response.data);
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
      // If no schedule exists, use default values
    }
  };

  const submitScheduleRequest = async () => {
    try {
      const requestData = {
        ...scheduleRequest,
        doctorId: user._id,
        doctorName: `${user.firstName} ${user.lastName}`,
        status: 'pending',
        submittedAt: new Date().toISOString()
      };
      
      await apiClient.post('/api/schedule-requests', requestData);
      toast.success('Schedule request submitted successfully');
      setShowRequestModal(false);
      setScheduleRequest({
        type: 'leave',
        startDate: '',
        endDate: '',
        reason: '',
        description: '',
        priority: 'normal'
      });
    } catch (error) {
      console.error('Error submitting schedule request:', error);
      toast.error('Failed to submit request');
    }
  };

  const addLeaveDay = () => {
    setSchedule(prev => ({
      ...prev,
      leaveDays: [...prev.leaveDays, {
        date: '',
        type: 'Training',
        status: 'Approved',
        notes: ''
      }]
    }));
  };

  const removeLeaveDay = (index) => {
    setSchedule(prev => ({
      ...prev,
      leaveDays: prev.leaveDays.filter((_, i) => i !== index)
    }));
  };

  const updateLeaveDay = (index, field, value) => {
    setSchedule(prev => ({
      ...prev,
      leaveDays: prev.leaveDays.map((day, i) => 
        i === index ? { ...day, [field]: value } : day
      )
    }));
  };

  const toggleWorkingDay = (day) => {
    setSchedule(prev => ({
      ...prev,
      workingDays: {
        ...prev.workingDays,
        [day]: !prev.workingDays[day]
      }
    }));
  };

  const updateSchedule = (section, field, value) => {
    setSchedule(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(selectedDate);
      if (viewMode === 'day') {
        endDate.setHours(23, 59, 59, 999);
      } else if (viewMode === 'week') {
        endDate.setDate(endDate.getDate() + 7);
      } else if (viewMode === 'month') {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      const response = await apiClient.get('/api/appointments', {
        params: {
          doctor: user._id,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          status: filterStatus !== 'all' ? filterStatus : undefined
        }
      });
      
      setAppointments(response.data.appointments || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const navigateDate = (direction) => {
    const newDate = new Date(selectedDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + direction);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
    }
    setSelectedDate(newDate);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      case 'No Show': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-orange-100 text-orange-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const groupAppointmentsByTime = () => {
    const grouped = {};
    appointments.forEach(appointment => {
      const time = appointment.appointmentTime;
      if (!grouped[time]) {
        grouped[time] = [];
      }
      grouped[time].push(appointment);
    });
    return grouped;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
        <div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
              My Schedule
            </h1>
            <p className="text-xs sm:text-sm text-gray-600">View your current schedule and appointments</p>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={() => setShowRequestModal(true)}
              className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Request Change</span>
              <span className="sm:hidden">Request</span>
            </button>
            <button
              onClick={fetchAppointments}
              className="text-gray-600 hover:text-gray-800 p-1 sm:p-2 rounded-lg hover:bg-gray-100"
              title="Refresh"
            >
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
          </div>
        </div>
        </div>

      {/* Schedule Management Form */}
      <div className="px-3 sm:px-4 lg:px-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Working Days */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Working Days</h3>
              <div className="space-y-2">
                {Object.entries(schedule.workingDays).map(([day, isWorking]) => (
                  <label key={day} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={isWorking}
                      disabled={true}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded bg-gray-100"
                    />
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {day}
                    </span>
                  </label>
                ))}
        </div>
      </div>

            {/* Work Hours */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Work Hours</h3>
              <div className="grid grid-cols-2 gap-4">
          <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
            <input
                    type="time"
                    value={schedule.workHours.startTime}
                    disabled={true}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
            />
          </div>
          <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                  <input
                    type="time"
                    value={schedule.workHours.endTime}
                    disabled={true}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  />
                </div>
              </div>
            </div>

            {/* Break Hours */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Break Hours</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Break Start</label>
                  <input
                    type="time"
                    value={schedule.breakHours.startTime}
                    disabled={true}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  />
          </div>
          <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Break End</label>
                  <input
                    type="time"
                    value={schedule.breakHours.endTime}
                    disabled={true}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  />
                </div>
              </div>
          </div>

            {/* Appointment Duration */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Appointment Duration</h3>
          <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
            <input
                  type="number"
                  min="15"
                  max="120"
                  step="15"
                  value={schedule.appointmentDuration}
                  disabled={true}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
            />
          </div>
        </div>
      </div>

          {/* Leave Status */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <input
                type="checkbox"
                checked={schedule.currentlyOnLeave}
                disabled={true}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded bg-gray-100"
              />
              <span className="text-sm font-medium text-gray-900">Currently on leave</span>
            </div>
        </div>
        
          {/* Leave Days Management */}
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Leave Days</h3>
            <div className="space-y-3">
              {schedule.leaveDays.map((leaveDay, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <input
                    type="date"
                    value={leaveDay.date}
                    disabled={true}
                    className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  />
                  <select
                    value={leaveDay.type}
                    disabled={true}
                    className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  >
                    <option value="Training">Training</option>
                    <option value="Vacation">Vacation</option>
                    <option value="Sick Leave">Sick Leave</option>
                    <option value="Personal">Personal</option>
                    <option value="Conference">Conference</option>
                  </select>
                  <select
                    value={leaveDay.status}
                    disabled={true}
                    className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Denied">Denied</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Notes"
                    value={leaveDay.notes}
                    disabled={true}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  />
                  
                </div>
              ))}

            </div>
          </div>
        </div>
      </div>

      {/* Schedule Controls */}
      <div className="px-3 sm:px-4 lg:px-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            {/* Date Navigation */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateDate(-1)}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-900">{formatDate(selectedDate)}</h2>
                <p className="text-sm text-gray-600">Appointments</p>
              </div>
              <button
                onClick={() => navigateDate(1)}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* View Mode and Filters */}
            <div className="flex items-center space-x-2">
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="Scheduled">Scheduled</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="No Show">No Show</option>
              </select>
                          </div>
                          </div>
                        </div>
                      </div>

      {/* Schedule Content */}
      <div className="px-3 sm:px-4 lg:px-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b border-gray-200">
            <h3 className="text-base sm:text-lg font-medium text-gray-900">Appointments</h3>
          </div>
        
          {appointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments</h3>
              <p className="mt-1 text-sm text-gray-500">
                {viewMode === 'day' ? 'No appointments scheduled for this day.' : 
                 viewMode === 'week' ? 'No appointments scheduled for this week.' : 
                 'No appointments scheduled for this month.'}
              </p>
                            </div>
                          ) : (
            <div className="divide-y divide-gray-200">
              {viewMode === 'day' ? (
                // Day view - group by time
                Object.entries(groupAppointmentsByTime())
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([time, timeAppointments]) => (
                    <div key={time} className="p-4">
                      <div className="flex items-center mb-3">
                        <Clock className="h-4 w-4 text-gray-400 mr-2" />
                        <h4 className="text-sm font-medium text-gray-900">{formatTime(time)}</h4>
                        <span className="ml-2 text-xs text-gray-500">({timeAppointments.length} appointment{timeAppointments.length > 1 ? 's' : ''})</span>
                      </div>
                      <div className="space-y-3">
                        {timeAppointments.map((appointment) => (
                          <div
                            key={appointment._id}
                            className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 cursor-pointer transition-colors"
                            onClick={() => setSelectedAppointment(appointment)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <User className="h-4 w-4 text-gray-400" />
                                  <h5 className="text-sm font-medium text-gray-900">
                                    {appointment.patient?.firstName} {appointment.patient?.lastName}
                                  </h5>
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(appointment.priority)}`}>
                                    {appointment.priority}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{appointment.reason}</p>
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                  <span className="flex items-center">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {appointment.location || 'Main Clinic'}
                                  </span>
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                                    {appointment.status}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedAppointment(appointment);
                                  }}
                                  className="text-blue-600 hover:text-blue-900 p-1"
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
              ) : (
                // Week/Month view - list all appointments
                appointments.map((appointment) => (
                  <div
                    key={appointment._id}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedAppointment(appointment)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {new Date(appointment.appointmentDate).toLocaleDateString()}
                          </span>
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{formatTime(appointment.appointmentTime)}</span>
                        </div>
                        <div className="flex items-center space-x-2 mb-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <h5 className="text-sm font-medium text-gray-900">
                            {appointment.patient?.firstName} {appointment.patient?.lastName}
                          </h5>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(appointment.priority)}`}>
                            {appointment.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{appointment.reason}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {appointment.location || 'Main Clinic'}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                            {appointment.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAppointment(appointment);
                          }}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
                              )}
                            </div>
                          )}
        </div>
      </div>

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Appointment Details</h3>
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="px-4 sm:px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Patient</label>
                  <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                    {selectedAppointment.patient?.firstName} {selectedAppointment.patient?.lastName}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date & Time</label>
                  <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                    {new Date(selectedAppointment.appointmentDate).toLocaleDateString()} at {formatTime(selectedAppointment.appointmentTime)}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedAppointment.status)}`}>
                    {selectedAppointment.status}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(selectedAppointment.priority)}`}>
                    {selectedAppointment.priority}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                    {selectedAppointment.location || 'Main Clinic'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                  <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                    {selectedAppointment.duration || '30 minutes'}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Visit</label>
                <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                  {selectedAppointment.reason}
                </p>
              </div>

              {selectedAppointment.notes && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                    {selectedAppointment.notes}
                  </p>
                </div>
              )}

              {/* Patient Contact Information */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Patient Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">
                      {selectedAppointment.patient?.phone || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">
                      {selectedAppointment.patient?.email || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-4 sm:px-6 py-4 border-t border-gray-200">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Request Schedule Change</h3>
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
        </div>
      </div>

            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Request Type</label>
                <select
                  value={scheduleRequest.type}
                  onChange={(e) => setScheduleRequest(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="leave">Leave Request</option>
                  <option value="schedule_change">Schedule Change</option>
                  <option value="break_change">Break Time Change</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={scheduleRequest.startDate}
                    onChange={(e) => setScheduleRequest(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={scheduleRequest.endDate}
                    onChange={(e) => setScheduleRequest(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
          </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                <select
                  value={scheduleRequest.reason}
                  onChange={(e) => setScheduleRequest(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a reason</option>
                  <option value="vacation">Vacation</option>
                  <option value="sick_leave">Sick Leave</option>
                  <option value="personal">Personal</option>
                  <option value="training">Training/Conference</option>
                  <option value="emergency">Emergency</option>
                  <option value="other">Other</option>
                </select>
          </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={scheduleRequest.priority}
                  onChange={(e) => setScheduleRequest(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
          </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={scheduleRequest.description}
                  onChange={(e) => setScheduleRequest(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  placeholder="Provide additional details about your request..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
          </div>
          </div>
            
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={submitScheduleRequest}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Submit Request
                </button>
          </div>
        </div>
      </div>
        </div>
      )}
    </div>
  );
};

export default DoctorSchedule; 