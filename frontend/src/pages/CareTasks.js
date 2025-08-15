import React, { useState, useEffect } from 'react';
import { 
  Clipboard, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  X, 
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiClient from '../config/axios';
import toast from 'react-hot-toast';

const CareTasks = () => {
  const [careTasks, setCareTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  
  // Form states
  const [taskForm, setTaskForm] = useState({
    task: '',
    description: '',
    priority: 'Medium',
    dueDate: '',
    room: '',
    category: 'General',
    notes: '',
    assignedTo: '',
    patientId: ''
  });
  
  const [availableNurses, setAvailableNurses] = useState([]);
  const [availablePatients, setAvailablePatients] = useState([]);
  const [loadingNurses, setLoadingNurses] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  const priorityOptions = ['Low', 'Medium', 'High'];
  const statusOptions = ['Pending', 'In Progress', 'Completed', 'Cancelled'];
  const categoryOptions = ['General', 'Medication', 'Observation', 'Procedure'];

  useEffect(() => {
    fetchCareTasks();
    if (showAddTask) {
      fetchAvailableNurses();
      fetchAvailablePatients();
    }
  }, [showAddTask]);

  const fetchCareTasks = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/care-tasks');
      setCareTasks(response.data);
    } catch (error) {
      console.error('Error fetching care tasks:', error);
      toast.error('Failed to fetch care tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableNurses = async () => {
    try {
      setLoadingNurses(true);
      let response;
      try {
        response = await apiClient.get('/api/users?roles=nurse');
      } catch (error) {
        response = await apiClient.get('/api/auth/users?roles=nurse');
      }
      const nurses = response.data.users || response.data || [];
      setAvailableNurses(nurses);
    } catch (error) {
      console.error('Error fetching nurses:', error);
      toast.error('Failed to fetch available nurses');
    } finally {
      setLoadingNurses(false);
    }
  };

  const fetchAvailablePatients = async () => {
    try {
      setLoadingPatients(true);
      let response;
      try {
        response = await apiClient.get('/api/users?roles=user');
      } catch (error) {
        response = await apiClient.get('/api/auth/users?roles=user');
      }
      const patients = response.data.users || response.data || [];
      setAvailablePatients(patients);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to fetch available patients');
    } finally {
      setLoadingPatients(false);
    }
  };

  const handleAddTask = async () => {
    if (!taskForm.task || !taskForm.description || !taskForm.assignedTo || !taskForm.patientId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await apiClient.post('/api/care-tasks', {
        ...taskForm,
        assignedBy: user._id,
        status: 'Pending'
      });
      
      toast.success('Care task created successfully');
      setShowAddTask(false);
      setTaskForm({
        task: '',
        description: '',
        priority: 'Medium',
        dueDate: '',
        room: '',
        category: 'General',
        notes: '',
        assignedTo: '',
        patientId: ''
      });
      fetchCareTasks();
    } catch (error) {
      toast.error('Failed to create care task');
      console.error('Error creating care task:', error);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await apiClient.patch(`/api/care-tasks/${taskId}/status`, { status: newStatus });
      toast.success('Task status updated successfully');
      fetchCareTasks();
    } catch (error) {
      toast.error('Failed to update task status');
      console.error('Error updating task status:', error);
    }
  };

  const filteredTasks = careTasks.filter(task => {
    const matchesSearch = task.task?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.patient?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.patient?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.assignedTo?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.assignedTo?.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    const matchesCategory = filterCategory === 'all' || task.category === filterCategory;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Medication': return '💊';
      case 'Observation': return '👁️';
      case 'Procedure': return '🔬';
      default: return '📋';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Care Tasks Management</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage and track nursing care tasks</p>
        </div>
        <button
          onClick={() => setShowAddTask(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm sm:text-base">{user?.role === 'nurse' ? 'Request Care Task' : 'Create Task'}</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full text-sm"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="all">All Status</option>
            {statusOptions.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="all">All Priorities</option>
            {priorityOptions.map(priority => (
              <option key={priority} value={priority}>{priority}</option>
            ))}
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="all">All Categories</option>
            {categoryOptions.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-base sm:text-lg font-medium text-gray-900">
            Care Tasks ({filteredTasks.length})
          </h2>
        </div>
        <div className="p-4 sm:p-6">
          {filteredTasks.length > 0 ? (
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <div key={task._id} className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="text-xl sm:text-2xl">{getCategoryIcon(task.category)}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 text-sm sm:text-base">{task.task}</h3>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">{task.description}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-500">
                          <span className="flex items-center space-x-1">
                            <User className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="truncate">{task.patient?.firstName} {task.patient?.lastName}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clipboard className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="truncate">{task.assignedTo?.firstName} {task.assignedTo?.lastName}</span>
                          </span>
                          {task.room && (
                            <span className="flex items-center space-x-1">
                              <span>🏥</span>
                              <span className="truncate">{task.room}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                      {task.dueDate && (
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                        </span>
                      )}
                      <span className="flex items-center space-x-1">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>Created: {new Date(task.createdAt).toLocaleDateString()}</span>
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedTask(task);
                          setShowTaskDetails(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium"
                      >
                        View Details
                      </button>
                      <select
                        value={task.status}
                        onChange={(e) => updateTaskStatus(task._id, e.target.value)}
                        className="text-xs border border-gray-300 rounded px-2 py-1"
                      >
                        {statusOptions.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <Clipboard className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No care tasks found</h3>
              <p className="text-sm sm:text-base text-gray-600">Create your first care task to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
              {user?.role === 'nurse' ? 'Request Care Task' : 'Create Care Task'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Patient *</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  value={taskForm.patientId}
                  onChange={(e) => setTaskForm({ ...taskForm, patientId: e.target.value })}
                  disabled={loadingPatients}
                >
                  <option value="">
                    {loadingPatients ? 'Loading patients...' : `Select a patient (${availablePatients.length} available)`}
                  </option>
                  {availablePatients.map(patient => (
                    <option key={patient._id} value={patient._id}>
                      {patient.firstName} {patient.lastName}
                    </option>
                  ))}
                </select>
                {availablePatients.length === 0 && !loadingPatients && (
                  <p className="text-xs text-red-500 mt-1">No patients found</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Task *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  value={taskForm.task}
                  onChange={(e) => setTaskForm({ ...taskForm, task: e.target.value })}
                  placeholder="e.g., Medication Check"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  rows="2"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="Detailed description of the task..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign To *</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  value={taskForm.assignedTo}
                  onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                  disabled={loadingNurses}
                >
                  <option value="">
                    {loadingNurses ? 'Loading nurses...' : `Select a nurse (${availableNurses.length} available)`}
                  </option>
                  {availableNurses.map(nurse => (
                    <option key={nurse._id} value={nurse._id}>
                      {nurse.firstName} {nurse.lastName}
                    </option>
                  ))}
                </select>
                {availableNurses.length === 0 && !loadingNurses && (
                  <p className="text-xs text-red-500 mt-1">No nurses found</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                  >
                    {priorityOptions.map(priority => (
                      <option key={priority} value={priority}>{priority}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={taskForm.category}
                    onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })}
                  >
                    {categoryOptions.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Room</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={taskForm.room}
                    onChange={(e) => setTaskForm({ ...taskForm, room: e.target.value })}
                    placeholder="e.g., Room 101"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  rows="2"
                  value={taskForm.notes}
                  onChange={(e) => setTaskForm({ ...taskForm, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>
              
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
                <button
                  onClick={() => setShowAddTask(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTask}
                  className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 text-sm"
                >
                  {user?.role === 'nurse' ? 'Request Care Task' : 'Create Task'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      {showTaskDetails && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base sm:text-lg font-medium text-gray-900">Task Details</h3>
              <button
                onClick={() => setShowTaskDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="text-2xl sm:text-3xl">{getCategoryIcon(selectedTask.category)}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg sm:text-xl font-medium text-gray-900">{selectedTask.task}</h4>
                  <p className="text-sm sm:text-base text-gray-600">{selectedTask.description}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Patient:</span>
                  <p className="text-xs sm:text-sm text-gray-900">{selectedTask.patient?.firstName} {selectedTask.patient?.lastName}</p>
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Assigned To:</span>
                  <p className="text-xs sm:text-sm text-gray-900">{selectedTask.assignedTo?.firstName} {selectedTask.assignedTo?.lastName}</p>
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Priority:</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedTask.priority)}`}>
                    {selectedTask.priority}
                  </span>
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Status:</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTask.status)}`}>
                    {selectedTask.status}
                  </span>
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Category:</span>
                  <p className="text-xs sm:text-sm text-gray-900">{selectedTask.category}</p>
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Room:</span>
                  <p className="text-xs sm:text-sm text-gray-900">{selectedTask.room || 'Not specified'}</p>
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Due Date:</span>
                  <p className="text-xs sm:text-sm text-gray-900">
                    {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : 'Not specified'}
                  </p>
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Created:</span>
                  <p className="text-xs sm:text-sm text-gray-900">{new Date(selectedTask.createdAt).toLocaleString()}</p>
                </div>
              </div>
              
              {selectedTask.notes && (
                <div>
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Notes:</span>
                  <p className="text-xs sm:text-sm text-gray-900 mt-1">{selectedTask.notes}</p>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Update Status:</span>
                  <select
                    value={selectedTask.status}
                    onChange={(e) => updateTaskStatus(selectedTask._id, e.target.value)}
                    className="text-xs sm:text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    {statusOptions.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => setShowTaskDetails(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CareTasks;