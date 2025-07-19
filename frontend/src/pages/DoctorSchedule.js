import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, UserCheck, Search, Filter, Plus, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import apiClient from '../config/axios';
import toast from 'react-hot-toast';

const DoctorSchedule = () => {
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  useEffect(() => {
    fetchDoctors();
    fetchAppointments();
  }, [selectedDate, selectedDoctor]);

  const fetchDoctors = async () => {
    try {
      const response = await apiClient.get('/api/doctors');
      setDoctors(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to fetch doctors');
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const dateParam = selectedDate ? `&date=${selectedDate}` : '';
      const doctorParam = selectedDoctor ? `&doctor=${selectedDoctor}` : '';
      
      const response = await apiClient.get(`/api/appointments?${dateParam}${doctorParam}`);
      const appointmentsData = Array.isArray(response.data) ? response.data : 
                             response.data.appointments || [];
      setAppointments(appointmentsData);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  // Filter doctors based on search and department
  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = !searchTerm || 
      doctor.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = !departmentFilter || doctor.department === departmentFilter;
    
    return matchesSearch && matchesDepartment;
  });

  // Get unique departments
  const departments = [...new Set(doctors.map(d => d.department).filter(Boolean))];

  // Group appointments by doctor
  const appointmentsByDoctor = appointments.reduce((acc, appointment) => {
    const doctorId = appointment.doctor?._id || appointment.doctor;
    if (!acc[doctorId]) {
      acc[doctorId] = [];
    }
    acc[doctorId].push(appointment);
    return acc;
  }, {});

  // Get available time slots (9 AM to 5 PM, 30-minute intervals)
  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  const timeSlots = getTimeSlots();

  // Check if a time slot is available for a doctor
  const isSlotAvailable = (doctorId, timeSlot) => {
    const doctor = doctors.find(d => d._id === doctorId);
    if (!doctor) return false;
    
    // Check if doctor is on leave
    if (doctor.isOnLeave) return false;
    
    // Check if it's a working day
    const dayOfWeek = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' });
    const schedule = doctor.schedule || {};
    const workingDays = schedule.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const workingHours = schedule.workingHours || { start: '09:00', end: '17:00' };
    const breakTime = schedule.breakTime || { start: '12:00', end: '13:00' };
    
    if (!workingDays.includes(dayOfWeek)) return false;
    
    // Check working hours
    if (timeSlot < workingHours.start || timeSlot >= workingHours.end) return false;
    
    // Check break time
    if (timeSlot >= breakTime.start && timeSlot < breakTime.end) return false;
    
    // Check if slot is booked
    const doctorAppointments = appointmentsByDoctor[doctorId] || [];
    return !doctorAppointments.some(apt => apt.appointmentTime === timeSlot);
  };

  // Get appointment status for a time slot
  const getSlotStatus = (doctorId, timeSlot) => {
    const doctor = doctors.find(d => d._id === doctorId);
    if (!doctor) return 'unavailable';
    
    // Check if doctor is on leave
    if (doctor.isOnLeave) return 'on-leave';
    
    // Check if it's a working day
    const dayOfWeek = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' });
    const schedule = doctor.schedule || {};
    const workingDays = schedule.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const workingHours = schedule.workingHours || { start: '09:00', end: '17:00' };
    const breakTime = schedule.breakTime || { start: '12:00', end: '13:00' };
    
    if (!workingDays.includes(dayOfWeek)) return 'not-working';
    
    // Check working hours
    if (timeSlot < workingHours.start || timeSlot >= workingHours.end) return 'outside-hours';
    
    // Check break time
    if (timeSlot >= breakTime.start && timeSlot < breakTime.end) return 'break';
    
    // Check if slot is booked
    const doctorAppointments = appointmentsByDoctor[doctorId] || [];
    const appointment = doctorAppointments.find(apt => apt.appointmentTime === timeSlot);
    return appointment ? appointment.status : 'available';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Doctor Schedule & Availability</h1>
          <p className="text-gray-600">View and manage doctor schedules</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          <span>{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Doctors</option>
              {doctors.map(doctor => (
                <option key={doctor._id} value={doctor._id}>
                  Dr. {doctor.firstName} {doctor.lastName} - {doctor.department}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search doctors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Schedule for {new Date(selectedDate).toLocaleDateString()}
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Doctor
                </th>
                {timeSlots.map(timeSlot => (
                  <th key={timeSlot} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {(() => {
                      const [hours, minutes] = timeSlot.split(':');
                      const hour = parseInt(hours);
                      const ampm = hour >= 12 ? 'PM' : 'AM';
                      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
                      return `${displayHour}:${minutes} ${ampm}`;
                    })()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDoctors.length === 0 ? (
                <tr>
                  <td colSpan={timeSlots.length + 1} className="px-6 py-8 text-center text-gray-500">
                    No doctors found
                  </td>
                </tr>
              ) : (
                filteredDoctors.map(doctor => (
                  <tr key={doctor._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <UserCheck className="h-5 w-5 text-green-500 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Dr. {doctor.firstName} {doctor.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {doctor.department}
                          </div>
                        </div>
                      </div>
                    </td>
                                          {timeSlots.map(timeSlot => {
                        const status = getSlotStatus(doctor._id, timeSlot);
                        const isAvailable = isSlotAvailable(doctor._id, timeSlot);
                      
                      return (
                        <td key={timeSlot} className="px-3 py-4 whitespace-nowrap text-center">
                          {isAvailable ? (
                            <div className="flex items-center justify-center">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="ml-1 text-xs text-green-600">Available</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center">
                              {status === 'Scheduled' || status === 'Confirmed' ? (
                                <>
                                  <XCircle className="h-4 w-4 text-red-500" />
                                  <span className="ml-1 text-xs text-red-600">Booked</span>
                                </>
                              ) : status === 'break' ? (
                                <>
                                  <Clock className="h-4 w-4 text-yellow-500" />
                                  <span className="ml-1 text-xs text-yellow-600">Break</span>
                                </>
                              ) : status === 'on-leave' ? (
                                <>
                                  <AlertCircle className="h-4 w-4 text-orange-500" />
                                  <span className="ml-1 text-xs text-orange-600">On Leave</span>
                                </>
                              ) : status === 'not-working' ? (
                                <>
                                  <XCircle className="h-4 w-4 text-gray-400" />
                                  <span className="ml-1 text-xs text-gray-500">Off Day</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 text-gray-400" />
                                  <span className="ml-1 text-xs text-gray-500">Unavailable</span>
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
            <span className="text-sm text-gray-600">Available</span>
          </div>
          <div className="flex items-center">
            <XCircle className="h-4 w-4 text-red-500 mr-2" />
            <span className="text-sm text-gray-600">Booked</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 text-yellow-500 mr-2" />
            <span className="text-sm text-gray-600">Break Time</span>
          </div>
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-orange-500 mr-2" />
            <span className="text-sm text-gray-600">On Leave</span>
          </div>
          <div className="flex items-center">
            <XCircle className="h-4 w-4 text-gray-400 mr-2" />
            <span className="text-sm text-gray-600">Off Day</span>
          </div>
          <div className="flex items-center">
            <XCircle className="h-4 w-4 text-gray-400 mr-2" />
            <span className="text-sm text-gray-600">Outside Hours</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorSchedule; 