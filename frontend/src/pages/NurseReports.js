import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Activity, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Calendar,
  FileText,
  BarChart3,
  PieChart,
  Download,
  Filter
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../config/axios';
import toast from 'react-hot-toast';

const NurseReports = () => {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState({
    patientCare: [],
    medicationAdmin: [],
    vitalSigns: [],
    careTasks: [],
    shiftHandover: []
  });
  const [selectedReport, setSelectedReport] = useState('patient-care');
  const [dateRange, setDateRange] = useState('today');
  const [filterPatient, setFilterPatient] = useState('');

  const { user } = useAuth();

  useEffect(() => {
    fetchNurseReports();
  }, [dateRange, filterPatient]);

  const fetchNurseReports = async () => {
    try {
      setLoading(true);
      
      // Fetch different types of nursing reports using existing endpoints
      const [patientCareRes, medicationRes, vitalsRes, tasksRes, handoverRes] = await Promise.all([
        apiClient.get('/api/patient-notes?limit=50'),
        apiClient.get('/api/auth/medications/administered'),
        apiClient.get('/api/vitals'),
        apiClient.get('/api/care-tasks'),
        apiClient.get('/api/shift-handover')
      ]);

      setReports({
        patientCare: patientCareRes.data || [],
        medicationAdmin: medicationRes.data || [],
        vitalSigns: vitalsRes.data || [],
        careTasks: tasksRes.data || [],
        shiftHandover: handoverRes.data || []
      });
    } catch (error) {
      console.error('Error fetching nurse reports:', error);
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const getDateRangeData = (data) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    return data.filter(item => {
      const itemDate = new Date(item.createdAt || item.date);
      switch (dateRange) {
        case 'today':
          return itemDate >= today;
        case 'week':
          return itemDate >= weekAgo;
        case 'month':
          return itemDate >= monthAgo;
        default:
          return true;
      }
    });
  };

  const getFilteredData = (data) => {
    let filtered = getDateRangeData(data);
    if (filterPatient) {
      filtered = filtered.filter(item => 
        item.patient?.firstName?.toLowerCase().includes(filterPatient.toLowerCase()) ||
        item.patient?.lastName?.toLowerCase().includes(filterPatient.toLowerCase())
      );
    }
    return filtered;
  };

  const generatePatientCareReport = () => {
    const data = getFilteredData(reports.patientCare);
    const totalNotes = data.length;
    const notesByType = data.reduce((acc, note) => {
      acc[note.type] = (acc[note.type] || 0) + 1;
      return acc;
    }, {});

    return {
      totalNotes,
      notesByType,
      recentNotes: data.slice(0, 10)
    };
  };

  const generateMedicationReport = () => {
    const data = getFilteredData(reports.medicationAdmin);
    const totalAdministered = data.length;
    const byMedication = data.reduce((acc, med) => {
      acc[med.medication] = (acc[med.medication] || 0) + 1;
      return acc;
    }, {});

    return {
      totalAdministered,
      byMedication,
      recentAdmin: data.slice(0, 10)
    };
  };

  const generateVitalSignsReport = () => {
    const data = getFilteredData(reports.vitalSigns);
    const totalReadings = data.length;
    const abnormalReadings = data.filter(vital => 
      vital.status === 'Warning' || vital.status === 'Critical'
    ).length;

    return {
      totalReadings,
      abnormalReadings,
      normalReadings: totalReadings - abnormalReadings,
      recentReadings: data.slice(0, 10)
    };
  };

  const generateCareTasksReport = () => {
    const data = getFilteredData(reports.careTasks);
    const totalTasks = data.length;
    const completedTasks = data.filter(task => task.status === 'Completed').length;
    const pendingTasks = data.filter(task => task.status === 'Pending').length;
    const inProgressTasks = data.filter(task => task.status === 'In Progress').length;

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      completionRate: totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0,
      recentTasks: data.slice(0, 10)
    };
  };

  const renderPatientCareReport = () => {
    const report = generatePatientCareReport();
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Notes</p>
                <p className="text-2xl font-bold text-gray-900">{report.totalNotes}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Assessment Notes</p>
                <p className="text-2xl font-bold text-gray-900">{report.notesByType.assessment || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Progress Notes</p>
                <p className="text-2xl font-bold text-gray-900">{report.notesByType.progress || 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Patient Notes</h3>
          </div>
          <div className="p-6">
            {report.recentNotes.length > 0 ? (
              <div className="space-y-4">
                {report.recentNotes.map((note, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">
                          {note.patient?.firstName} {note.patient?.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{note.note}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(note.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        note.type === 'assessment' ? 'bg-blue-100 text-blue-800' :
                        note.type === 'progress' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {note.type?.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No patient notes found</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderMedicationReport = () => {
    const report = generateMedicationReport();
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Administered</p>
                <p className="text-2xl font-bold text-gray-900">{report.totalAdministered}</p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today</p>
                <p className="text-2xl font-bold text-gray-900">
                  {getDateRangeData(reports.medicationAdmin).length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-gray-900">
                  {getDateRangeData(reports.medicationAdmin).filter(item => {
                    const itemDate = new Date(item.createdAt);
                    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                    return itemDate >= weekAgo;
                  }).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Medication Administration</h3>
          </div>
          <div className="p-6">
            {report.recentAdmin.length > 0 ? (
              <div className="space-y-4">
                {report.recentAdmin.map((med, index) => (
                  <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{med.medication}</p>
                      <p className="text-sm text-gray-600">
                        {med.patient?.firstName} {med.patient?.lastName} - {med.dosage}
                      </p>
                      {med.notes && (
                        <p className="text-xs text-gray-500 mt-1">
                          Notes: {med.notes}
                        </p>
                      )}
                    </div>
                                         <div className="text-right">
                       <p className="text-sm text-gray-600">
                         {new Date(med.administeredAt).toLocaleString()}
                       </p>
                       <p className="text-xs text-gray-500">by {med.administeredBy}</p>
                       {med.status && (
                         <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                           med.status === 'Administered' ? 'bg-green-100 text-green-800' :
                           med.status === 'Refused' ? 'bg-red-100 text-red-800' :
                           med.status === 'Missed' ? 'bg-yellow-100 text-yellow-800' :
                           'bg-gray-100 text-gray-800'
                         }`}>
                           {med.status}
                         </span>
                       )}
                     </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No medication administration records found</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderVitalSignsReport = () => {
    const report = generateVitalSignsReport();
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Readings</p>
                <p className="text-2xl font-bold text-gray-900">{report.totalReadings}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Normal</p>
                <p className="text-2xl font-bold text-green-600">{report.normalReadings}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Abnormal</p>
                <p className="text-2xl font-bold text-red-600">{report.abnormalReadings}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Alert Rate</p>
                <p className="text-2xl font-bold text-orange-600">
                  {report.totalReadings > 0 ? ((report.abnormalReadings / report.totalReadings) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Vital Signs</h3>
          </div>
          <div className="p-6">
            {report.recentReadings.length > 0 ? (
              <div className="space-y-4">
                {report.recentReadings.map((vital, index) => (
                  <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {vital.patient?.firstName} {vital.patient?.lastName}
                      </p>
                                             <p className="text-sm text-gray-600">
                         BP: {vital.bloodPressure.systolic}/{vital.bloodPressure.diastolic} | HR: {vital.heartRate} | Temp: {vital.temperature}°F
                       </p>
                     </div>
                     <div className="text-right">
                       <p className="text-sm text-gray-600">
                         {new Date(vital.recordedAt).toLocaleString()}
                       </p>
                       {vital.status !== 'Normal' && (
                         <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                           vital.status === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                         }`}>
                           {vital.status}
                         </span>
                       )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No vital signs records found</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCareTasksReport = () => {
    const report = generateCareTasksReport();
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{report.totalTasks}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{report.completedTasks}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">{report.inProgressTasks}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-purple-600">{report.completionRate}%</p>
              </div>
              <PieChart className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Care Tasks</h3>
          </div>
          <div className="p-6">
            {report.recentTasks.length > 0 ? (
              <div className="space-y-4">
                {report.recentTasks.map((task, index) => (
                  <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{task.task}</p>
                      <p className="text-sm text-gray-600">
                        {task.patient?.firstName} {task.patient?.lastName} - {task.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        task.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        task.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(task.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No care tasks found</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderShiftHandoverReport = () => {
    const data = getFilteredData(reports.shiftHandover);
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Handovers</p>
                <p className="text-2xl font-bold text-gray-900">{data.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.filter(item => {
                    const itemDate = new Date(item.createdAt);
                    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                    return itemDate >= weekAgo;
                  }).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Issues</p>
                <p className="text-2xl font-bold text-orange-600">
                  {data.filter(item => item.pendingIssues && item.pendingIssues.length > 0).length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Shift Handovers</h3>
          </div>
          <div className="p-6">
            {data.length > 0 ? (
              <div className="space-y-4">
                {data.slice(0, 10).map((handover, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">
                          Handover from {handover.fromNurse?.firstName} {handover.fromNurse?.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{handover.summary}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(handover.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          To: {handover.toNurse?.firstName} {handover.toNurse?.lastName}
                        </p>
                        {handover.pendingIssues && handover.pendingIssues.length > 0 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            {handover.pendingIssues.length} pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No shift handover records found</p>
            )}
          </div>
        </div>
      </div>
    );
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nursing Reports</h1>
          <p className="text-gray-600">Comprehensive nursing activity and patient care reports</p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>Export Report</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="patient-care">Patient Care Notes</option>
              <option value="medication">Medication Administration</option>
              <option value="vital-signs">Vital Signs</option>
              <option value="care-tasks">Care Tasks</option>
              <option value="shift-handover">Shift Handover</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Patient</label>
            <input
              type="text"
              placeholder="Search patient name..."
              value={filterPatient}
              onChange={(e) => setFilterPatient(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            {selectedReport === 'patient-care' && 'Patient Care Notes Report'}
            {selectedReport === 'medication' && 'Medication Administration Report'}
            {selectedReport === 'vital-signs' && 'Vital Signs Report'}
            {selectedReport === 'care-tasks' && 'Care Tasks Report'}
            {selectedReport === 'shift-handover' && 'Shift Handover Report'}
          </h2>
        </div>
        <div className="p-6">
          {selectedReport === 'patient-care' && renderPatientCareReport()}
          {selectedReport === 'medication' && renderMedicationReport()}
          {selectedReport === 'vital-signs' && renderVitalSignsReport()}
          {selectedReport === 'care-tasks' && renderCareTasksReport()}
          {selectedReport === 'shift-handover' && renderShiftHandoverReport()}
        </div>
      </div>
    </div>
  );
};

export default NurseReports;
