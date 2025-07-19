import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, UserCheck, Save, Edit, Plus, Trash2, AlertCircle } from 'lucide-react';
import apiClient from '../config/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const DoctorScheduleManagement = () => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      console.log('🔍 Fetching doctors...');
      const response = await apiClient.get('/api/doctors');
      console.log('📊 Doctors response:', response.data);
      setDoctors(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('❌ Error fetching doctors:', error);
      toast.error('Failed to fetch doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSchedule = async () => {
    if (!selectedDoctor) return;
    
    try {
      setSaving(true);
      console.log('🔍 Saving schedule for doctor:', selectedDoctor._id);
      await apiClient.put(`/api/doctors/${selectedDoctor._id}/schedule`, {
        schedule: selectedDoctor.schedule,
        leaveDays: selectedDoctor.leaveDays || [],
        isOnLeave: selectedDoctor.isOnLeave || false
      });
      
      console.log('✅ Schedule saved successfully');
      toast.success('Doctor schedule updated successfully!');
      fetchDoctors(); // Refresh the list
    } catch (error) {
      console.error('❌ Error updating schedule:', error);
      toast.error('Failed to update schedule');
    } finally {
      setSaving(false);
    }
  };

  const addLeaveDay = () => {
    if (!selectedDoctor) return;
    
    const newLeaveDay = {
      date: new Date().toISOString().split('T')[0],
      reason: 'Other',
      status: 'Pending',
      notes: ''
    };
    
    setSelectedDoctor({
      ...selectedDoctor,
      leaveDays: [...(selectedDoctor.leaveDays || []), newLeaveDay]
    });
  };

  const removeLeaveDay = (index) => {
    if (!selectedDoctor) return;
    
    const updatedLeaveDays = selectedDoctor.leaveDays.filter((_, i) => i !== index);
    setSelectedDoctor({
      ...selectedDoctor,
      leaveDays: updatedLeaveDays
    });
  };

  const updateLeaveDay = (index, field, value) => {
    if (!selectedDoctor) return;
    
    const updatedLeaveDays = [...selectedDoctor.leaveDays];
    updatedLeaveDays[index] = { ...updatedLeaveDays[index], [field]: value };
    
    setSelectedDoctor({
      ...selectedDoctor,
      leaveDays: updatedLeaveDays
    });
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
          <h1 className="text-2xl font-bold text-gray-900">Doctor Schedule Management</h1>
          <p className="text-gray-600">Manage doctor working hours and leave days</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <User className="h-4 w-4" />
          <span>Admin</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Doctor List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Doctors</h2>
            </div>
            <div className="p-4">
              <div className="space-y-2">
                {doctors.map(doctor => (
                  <button
                    key={doctor._id}
                    onClick={() => setSelectedDoctor(doctor)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedDoctor?._id === doctor._id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <UserCheck className="h-5 w-5 text-green-500 mr-3" />
                      <div>
                        <div className="font-medium text-gray-900">
                          Dr. {doctor.firstName} {doctor.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {doctor.department}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Schedule Editor */}
        <div className="lg:col-span-2">
          {selectedDoctor ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900">
                    Schedule for Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}
                  </h2>
                  <button
                    onClick={handleSaveSchedule}
                    disabled={saving}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Schedule'}
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Working Days */}
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-3">Working Days</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                      <label key={day} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedDoctor.schedule?.workingDays?.includes(day) || false}
                          onChange={(e) => {
                            const currentDays = selectedDoctor.schedule?.workingDays || [];
                            const newDays = e.target.checked
                              ? [...currentDays, day]
                              : currentDays.filter(d => d !== day);
                            
                            setSelectedDoctor({
                              ...selectedDoctor,
                              schedule: {
                                ...selectedDoctor.schedule,
                                workingDays: newDays
                              }
                            });
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">{day}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Working Hours */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={selectedDoctor.schedule?.workingHours?.start || '09:00'}
                      onChange={(e) => setSelectedDoctor({
                        ...selectedDoctor,
                        schedule: {
                          ...selectedDoctor.schedule,
                          workingHours: {
                            ...selectedDoctor.schedule?.workingHours,
                            start: e.target.value
                          }
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                    <input
                      type="time"
                      value={selectedDoctor.schedule?.workingHours?.end || '17:00'}
                      onChange={(e) => setSelectedDoctor({
                        ...selectedDoctor,
                        schedule: {
                          ...selectedDoctor.schedule,
                          workingHours: {
                            ...selectedDoctor.schedule?.workingHours,
                            end: e.target.value
                          }
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Break Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Break Start</label>
                    <input
                      type="time"
                      value={selectedDoctor.schedule?.breakTime?.start || '12:00'}
                      onChange={(e) => setSelectedDoctor({
                        ...selectedDoctor,
                        schedule: {
                          ...selectedDoctor.schedule,
                          breakTime: {
                            ...selectedDoctor.schedule?.breakTime,
                            start: e.target.value
                          }
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Break End</label>
                    <input
                      type="time"
                      value={selectedDoctor.schedule?.breakTime?.end || '13:00'}
                      onChange={(e) => setSelectedDoctor({
                        ...selectedDoctor,
                        schedule: {
                          ...selectedDoctor.schedule,
                          breakTime: {
                            ...selectedDoctor.schedule?.breakTime,
                            end: e.target.value
                          }
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Appointment Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Duration (minutes)</label>
                  <input
                    type="number"
                    min="15"
                    max="120"
                    step="15"
                    value={selectedDoctor.schedule?.appointmentDuration || 30}
                    onChange={(e) => setSelectedDoctor({
                      ...selectedDoctor,
                      schedule: {
                        ...selectedDoctor.schedule,
                        appointmentDuration: parseInt(e.target.value)
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* On Leave Toggle */}
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedDoctor.isOnLeave || false}
                      onChange={(e) => setSelectedDoctor({
                        ...selectedDoctor,
                        isOnLeave: e.target.checked
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Currently on leave</span>
                  </label>
                </div>

                {/* Leave Days */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-md font-medium text-gray-900">Leave Days</h3>
                    <button
                      onClick={addLeaveDay}
                      className="flex items-center px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Leave Day
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {selectedDoctor.leaveDays?.map((leaveDay, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                        <input
                          type="date"
                          value={leaveDay.date}
                          onChange={(e) => updateLeaveDay(index, 'date', e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <select
                          value={leaveDay.reason}
                          onChange={(e) => updateLeaveDay(index, 'reason', e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="Vacation">Vacation</option>
                          <option value="Sick Leave">Sick Leave</option>
                          <option value="Personal">Personal</option>
                          <option value="Conference">Conference</option>
                          <option value="Training">Training</option>
                          <option value="Other">Other</option>
                        </select>
                        <select
                          value={leaveDay.status}
                          onChange={(e) => updateLeaveDay(index, 'status', e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Notes"
                          value={leaveDay.notes || ''}
                          onChange={(e) => updateLeaveDay(index, 'notes', e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <button
                          onClick={() => removeLeaveDay(index)}
                          className="p-1 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-center text-gray-500">
                <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Select a doctor to manage their schedule</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorScheduleManagement; 