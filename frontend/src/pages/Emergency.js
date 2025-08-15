import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Plus, Clock, User, Activity, Search, Wifi, WifiOff, FileText, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import io from 'socket.io-client';
import { API_BASE_URL, WS_BASE_URL } from '../config/api';
import jsPDF from 'jspdf';

const PAGE_SIZE = 10;

const Emergency = () => {
  const [emergencies, setEmergencies] = useState([]);
  const [stats, setStats] = useState({ totalEmergency: 0, todayEmergency: 0, resolvedToday: 0, availableStaff: 0 });
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [addForm, setAddForm] = useState({ patientId: '', emergencyType: '', severity: '', symptoms: '', assignedDoctor: '' });
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [statusForm, setStatusForm] = useState({ status: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterDoctor, setFilterDoctor] = useState('');
  const [filterPatient, setFilterPatient] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const intervalRef = useRef();

  // Fetch emergencies, stats, patients, and doctors
  const fetchAll = () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    Promise.all([
      fetch(`${API_BASE_URL}/api/emergency`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      }).then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      }),
      fetch(`${API_BASE_URL}/api/emergency/stats`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      }).then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      }),
      fetch(`${API_BASE_URL}/api/users?roles=user,patient&limit=1000`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      }).then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      }),
      fetch(`${API_BASE_URL}/api/doctors`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      }).then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
    ]).then(([cases, statsData, patientsData, doctorsData]) => {
      setEmergencies(Array.isArray(cases) ? cases : []);
      setStats({
        totalEmergency: statsData.totalEmergency || 0,
        todayEmergency: statsData.todayEmergency || 0,
        resolvedToday: statsData.resolvedToday || 0,
        availableStaff: statsData.availableStaff || 0
      });
      setPatients(Array.isArray(patientsData) ? patientsData : []);
      setDoctors(Array.isArray(doctorsData.doctors) ? doctorsData.doctors : (Array.isArray(doctorsData) ? doctorsData : []));
    }).catch((error) => {
      console.error('Error fetching emergency data:', error);
      setEmergencies([]);
      setStats({ totalEmergency: 0, todayEmergency: 0, resolvedToday: 0, availableStaff: 0 });
      setPatients([]);
      setDoctors([]);
    }).finally(() => setLoading(false));
  };

  // Remove polling interval, only fetch once on mount
  useEffect(() => {
    fetchAll();
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    const newSocket = io(WS_BASE_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('join-emergency');
    });
    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });
    newSocket.on('new-emergency', (emergencyData) => {
      toast.error(`New emergency: ${emergencyData.patientName} - ${emergencyData.condition}`);
      fetchAll();
    });
    newSocket.on('emergency-update', (updateData) => {
      toast.success(`Emergency status updated: ${updateData.patientName}`);
      fetchAll();
    });
    return () => {
      newSocket.close();
    };
  }, []);

  // Add New Emergency
  const handleAddEmergency = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/emergency`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(addForm)
      });
      if (res.ok) {
        setShowAddModal(false);
        setAddForm({ patientId: '', emergencyType: '', severity: '', symptoms: '', assignedDoctor: '' });
        fetchAll();
        toast.success('Emergency case added!');
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.error || 'Failed to add emergency.');
      }
    } catch (error) {
      console.error('Error adding emergency:', error);
      toast.error('Failed to add emergency.');
    } finally {
      setActionLoading(false);
    }
  };

  // Update Emergency Status
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedEmergency || !selectedEmergency.patient?._id) {
      toast.error('Invalid emergency data');
      return;
    }
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/emergency/${selectedEmergency.patient._id}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: statusForm.status })
      });
      if (res.ok) {
        setShowStatusModal(false);
        setStatusForm({ status: '' });
        setSelectedEmergency(null);
        fetchAll();
        toast.success('Status updated!');
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.error || 'Failed to update status.');
      }
    } catch (error) {
      console.error('Error updating emergency status:', error);
      toast.error('Failed to update status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtering, searching, sorting, and pagination
  let filtered = emergencies.filter(em => {
    const matchesSearch =
      (!search ||
        (em.patient?.firstName && em.patient.firstName.toLowerCase().includes(search.toLowerCase())) ||
        (em.patient?.lastName && em.patient.lastName.toLowerCase().includes(search.toLowerCase())) ||
        (em.appointment?.reason && em.appointment.reason.toLowerCase().includes(search.toLowerCase())) ||
        (em.appointment?.symptoms && em.appointment.symptoms.toLowerCase().includes(search.toLowerCase())));
    const matchesStatus = !filterStatus || em.appointment?.status === filterStatus;
    const matchesSeverity = !filterSeverity || em.appointment?.priority === filterSeverity;
    const matchesDoctor = !filterDoctor || (em.appointment?.doctor && em.appointment.doctor._id === filterDoctor);
    const matchesPatient = !filterPatient || em.patient?._id === filterPatient;
    return matchesSearch && matchesStatus && matchesSeverity && matchesDoctor && matchesPatient;
  });
  filtered = filtered.sort((a, b) => {
    let valA = a.appointment?.[sortBy] || '';
    let valB = b.appointment?.[sortBy] || '';
    if (sortBy === 'createdAt') {
      valA = new Date(valA);
      valB = new Date(valB);
    }
    if (sortDir === 'asc') return valA > valB ? 1 : -1;
    return valA < valB ? 1 : -1;
  });
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) return <div>Loading...</div>;

  // Export functionality
  const exportEmergenciesCSV = () => {
    if (!emergencies.length) return;
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Patient,Type,Severity,Symptoms,Doctor,Status,Created At\n';
    emergencies.forEach(em => {
      csvContent += `"${em.patient?.firstName || ''} ${em.patient?.lastName || ''}",${em.appointment?.reason || ''},${em.appointment?.priority || ''},"${em.appointment?.symptoms || ''}","${em.appointment?.doctor ? em.appointment.doctor.firstName + ' ' + em.appointment.doctor.lastName : ''}",${em.appointment?.status || ''},${em.appointment?.createdAt || ''}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `emergencies-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Emergencies exported as CSV!');
  };

  const exportEmergenciesPDF = () => {
    if (!emergencies.length) return;
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPos = 20;
    
    // Title
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('Emergency Cases Report', pageWidth / 2, yPos, { align: 'center' });
    
    // Date
    yPos += 15;
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPos, { align: 'center' });
    
    // Summary Statistics
    yPos += 20;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Summary Statistics', 20, yPos);
    
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Total Emergency Cases: ${stats.totalEmergency}`, 20, yPos);
    yPos += 7;
    doc.text(`Today's Cases: ${stats.todayEmergency}`, 20, yPos);
    yPos += 7;
    doc.text(`Resolved Today: ${stats.resolvedToday}`, 20, yPos);
    yPos += 7;
    doc.text(`Available Staff: ${stats.availableStaff}`, 20, yPos);
    
    // Emergency Cases List
    yPos += 15;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Emergency Cases Details', 20, yPos);
    
    yPos += 10;
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    
    emergencies.forEach((emergency, index) => {
      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      const patientName = emergency.patient ? `${emergency.patient.firstName} ${emergency.patient.lastName}` : 'Unknown Patient';
      const doctorName = emergency.appointment?.doctor ? `${emergency.appointment.doctor.firstName} ${emergency.appointment.doctor.lastName}` : 'Unassigned';
      const emergencyType = emergency.appointment?.reason || 'Unknown';
      const severity = emergency.appointment?.priority || 'Unknown';
      const status = emergency.appointment?.status || 'Unknown';
      const createdAt = emergency.appointment?.createdAt ? new Date(emergency.appointment.createdAt).toLocaleString() : 'Unknown';
      
      doc.setFont(undefined, 'bold');
      doc.text(`Case ${index + 1}: ${emergencyType}`, 20, yPos);
      yPos += 5;
      
      doc.setFont(undefined, 'normal');
      doc.text(`Patient: ${patientName}`, 25, yPos);
      yPos += 4;
      doc.text(`Doctor: ${doctorName}`, 25, yPos);
      yPos += 4;
      doc.text(`Severity: ${severity}`, 25, yPos);
      yPos += 4;
      doc.text(`Status: ${status}`, 25, yPos);
      yPos += 4;
      doc.text(`Created: ${createdAt}`, 25, yPos);
      
      if (emergency.appointment?.symptoms) {
        yPos += 4;
        doc.text(`Symptoms: ${emergency.appointment.symptoms}`, 25, yPos);
      }
      
      yPos += 8; // Space between cases
    });
    
    // Save the PDF
    doc.save(`emergency-cases-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Emergency cases exported as PDF!');
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Emergency Cases</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage urgent care and critical cases</p>
          <div className="flex items-center space-x-1 mt-1">
            {isConnected ? (
              <>
                <Wifi className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                <span className="text-xs sm:text-sm text-green-600">Live Updates</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                <span className="text-xs sm:text-sm text-red-600">Offline</span>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <button onClick={exportEmergenciesCSV} className="flex items-center justify-center space-x-2 px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
            <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Export CSV</span>
          </button>
          <button onClick={exportEmergenciesPDF} className="flex items-center justify-center space-x-2 px-3 py-2 text-xs sm:text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
            <Download className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Export PDF</span>
          </button>
          <button onClick={() => setShowAddModal(true)} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center justify-center space-x-2 text-sm">
            <Plus className="h-4 w-4" />
            <span>New Emergency</span>
          </button>
        </div>
      </div>

      {/* Filters/Search/Sort */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          <div className="sm:col-span-2 lg:col-span-1">
          <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
          <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search emergencies..."
              value={search}
              onChange={e => setSearch(e.target.value)}
                className="pl-8 sm:pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
            <option value="">All</option>
            <option value="In Progress">In Progress</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="No Show">No Show</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Severity</label>
            <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
            <option value="">All</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Doctor</label>
            <select value={filterDoctor} onChange={e => setFilterDoctor(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
            <option value="">All</option>
            {doctors.map(d => (
              <option key={d._id} value={d._id}>{d.firstName} {d.lastName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Patient</label>
            <select value={filterPatient} onChange={e => setFilterPatient(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
            <option value="">All</option>
            {patients.map(p => (
              <option key={p._id} value={p._id}>{p.firstName} {p.lastName}</option>
            ))}
          </select>
        </div>
          <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Sort By</label>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
            <option value="createdAt">Arrival Time</option>
            <option value="severity">Severity</option>
            <option value="status">Status</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Direction</label>
              <select value={sortDir} onChange={e => setSortDir(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
          </select>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50 text-sm">Prev</button>
          <span className="text-sm">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50 text-sm">Next</button>
        </div>
      )}

      {/* Emergency Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
              </div>
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-500">Active Emergencies</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalEmergency}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
              </div>
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-500">Today's Cases</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.todayEmergency}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
              </div>
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-500">Resolved Today</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.resolvedToday}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
              </div>
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-500">Available Staff</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.availableStaff}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Emergency Cases */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-medium text-gray-900">Active Emergency Cases</h3>
        </div>
        <div className="p-4 sm:p-6">
          <div className="space-y-4">
            {paged.length === 0 ? (
              <div className="text-center text-gray-500 text-sm sm:text-base">No active emergency cases.</div>
            ) : (
              paged.map((em) => (
                <div key={em.appointment?._id || em.patient?._id} className={`border rounded-lg p-3 sm:p-4 ${em.appointment?.priority === 'Critical' ? 'bg-red-50 border-red-200' : em.appointment?.priority === 'High' ? 'bg-yellow-50 border-yellow-200' : em.appointment?.priority === 'Medium' ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${em.appointment?.priority === 'Critical' ? 'bg-red-100' : em.appointment?.priority === 'High' ? 'bg-yellow-100' : em.appointment?.priority === 'Medium' ? 'bg-orange-100' : 'bg-gray-100'}`}>
                          <AlertTriangle className={`h-4 w-4 sm:h-6 sm:w-6 ${em.appointment?.priority === 'Critical' ? 'text-red-600' : em.appointment?.priority === 'High' ? 'text-yellow-600' : em.appointment?.priority === 'Medium' ? 'text-orange-600' : 'text-gray-600'}`} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm sm:text-lg font-medium text-gray-900">{em.appointment?.reason || 'Emergency Case'}</h4>
                        <p className="text-xs sm:text-sm text-gray-600">Patient: {em.patient?.firstName} {em.patient?.lastName} ({em.patient?.patientId || em.patient?._id})</p>
                        <p className="text-xs sm:text-sm text-gray-600">Assigned: {em.appointment?.doctor ? `${em.appointment.doctor.firstName} ${em.appointment.doctor.lastName}` : '-'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                        <span className={`text-xs sm:text-sm font-medium ${em.appointment?.status === 'Resolved' ? 'text-green-600' : em.appointment?.status === 'Waiting' ? 'text-yellow-600' : 'text-red-600'}`}>{em.appointment?.status || 'In Progress'}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Arrived: {em.appointment?.createdAt ? new Date(em.appointment.createdAt).toLocaleTimeString() : '-'}</p>
                    </div>
                  </div>
                  <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${em.appointment?.priority === 'Critical' ? 'bg-red-100 text-red-800' : em.appointment?.priority === 'High' ? 'bg-yellow-100 text-yellow-800' : em.appointment?.priority === 'Medium' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'}`}>
                      {em.appointment?.priority || 'Critical'}
                    </span>
                    <span className="text-xs sm:text-sm text-gray-600">{em.appointment?.department || 'Emergency'}</span>
                  </div>
                  <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    {em.appointment?.status !== 'Completed' && (
                      <button className="bg-red-600 text-white px-3 py-1 rounded text-xs sm:text-sm hover:bg-red-700" onClick={() => { setSelectedEmergency(em); setShowStatusModal(true); }}>
                        Update Status
                      </button>
                    )}
                    <button className="bg-blue-600 text-white px-3 py-1 rounded text-xs sm:text-sm hover:bg-blue-700" onClick={() => { setSelectedEmergency(em); setShowDetailsModal(true); }}>
                      View Details
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Emergency Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-base sm:text-lg font-bold mb-4">Add New Emergency</h3>
            <form onSubmit={handleAddEmergency} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                <select required value={addForm.patientId} onChange={e => setAddForm(f => ({ ...f, patientId: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm">
                  <option value="">Select Patient</option>
                  {patients.map(p => (
                    <option key={p._id} value={p._id}>{p.firstName} {p.lastName} ({p.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Type</label>
                <input required type="text" value={addForm.emergencyType} onChange={e => setAddForm(f => ({ ...f, emergencyType: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm" placeholder="e.g. Cardiac Arrest" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                <select required value={addForm.severity} onChange={e => setAddForm(f => ({ ...f, severity: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm">
                  <option value="">Select Severity</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
                  </div>
                  <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Symptoms</label>
                <input required type="text" value={addForm.symptoms} onChange={e => setAddForm(f => ({ ...f, symptoms: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm" placeholder="e.g. Chest pain, shortness of breath" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Doctor</label>
                <select required value={addForm.assignedDoctor} onChange={e => setAddForm(f => ({ ...f, assignedDoctor: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm">
                  <option value="">Select Doctor</option>
                  {doctors.map(d => (
                    <option key={d._id} value={d._id}>{d.firstName} {d.lastName} ({d.email})</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-2 mt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm">Cancel</button>
                <button type="submit" disabled={actionLoading} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-sm">{actionLoading ? 'Saving...' : 'Add Emergency'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showStatusModal && selectedEmergency && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 w-full max-w-md">
            <h3 className="text-base sm:text-lg font-bold mb-4">Update Emergency Status</h3>
            <form onSubmit={handleUpdateStatus} className="space-y-4">
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select required value={statusForm.status} onChange={e => setStatusForm({ status: e.target.value })} className="w-full border rounded px-3 py-2 text-sm">
                  <option value="">Select Status</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="No Show">No Show</option>
                </select>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-2 mt-4">
                <button type="button" onClick={() => setShowStatusModal(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm">Cancel</button>
                <button type="submit" disabled={actionLoading} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-sm">{actionLoading ? 'Saving...' : 'Update Status'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showDetailsModal && selectedEmergency && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-base sm:text-lg font-bold mb-4">Emergency Details</h3>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Patient:</span> {selectedEmergency.patient?.firstName} {selectedEmergency.patient?.lastName} ({selectedEmergency.patient?.patientId || selectedEmergency.patient?._id})</div>
              <div><span className="font-medium">Assigned Doctor:</span> {selectedEmergency.appointment?.doctor ? `${selectedEmergency.appointment.doctor.firstName} ${selectedEmergency.appointment.doctor.lastName} (${selectedEmergency.appointment.doctor.email})` : '-'}</div>
              <div><span className="font-medium">Emergency Type:</span> {selectedEmergency.appointment?.reason || '-'}</div>
              <div><span className="font-medium">Severity:</span> {selectedEmergency.appointment?.priority || '-'}</div>
              <div><span className="font-medium">Symptoms:</span> {selectedEmergency.appointment?.symptoms || '-'}</div>
              <div><span className="font-medium">Status:</span> {selectedEmergency.appointment?.status || '-'}</div>
              <div><span className="font-medium">Department:</span> {selectedEmergency.appointment?.department || '-'}</div>
              <div><span className="font-medium">Arrived:</span> {selectedEmergency.appointment?.createdAt ? new Date(selectedEmergency.appointment.createdAt).toLocaleString() : '-'}</div>
            </div>
            <div className="flex justify-end mt-4">
              <button type="button" onClick={() => setShowDetailsModal(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Emergency; 