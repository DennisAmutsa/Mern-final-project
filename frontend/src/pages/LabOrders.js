import React, { useState, useEffect } from 'react';
import { 
  TestTube, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  RefreshCw, 
  X,
  User,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../config/axios';
import toast from 'react-hot-toast';

const LabOrders = () => {
  const [labOrders, setLabOrders] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newOrder, setNewOrder] = useState({
    patient: '',
    tests: [{ testType: '', testName: '', priority: 'Routine' }],
    priority: 'Routine',
    dueDate: '',
    notes: '',
    instructions: ''
  });

  const { user } = useAuth();

  useEffect(() => {
    fetchLabOrders();
    fetchPatients();
  }, []);

  const fetchLabOrders = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/lab-orders');
      setLabOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error fetching lab orders:', error);
      toast.error('Failed to fetch lab orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      // Fetch ALL patients (including discharged ones) for lab orders
      // Doctors should be able to create lab orders for any patient
      const response = await apiClient.get('/api/patients?limit=100');
      setPatients(response.data.patients || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      // Fallback to all users with patient role if the patients endpoint doesn't exist
      try {
        const fallbackResponse = await apiClient.get('/api/users?roles=patient');
        setPatients(fallbackResponse.data || []);
      } catch (fallbackError) {
        console.error('Error fetching patients (fallback):', fallbackError);
      }
    }
  };

  const addLabOrder = async (orderData) => {
    try {
      await apiClient.post('/api/lab-orders', orderData);
      toast.success('Lab order created successfully');
      setShowAddModal(false);
      setNewOrder({
        patient: '',
        tests: [{ testType: '', testName: '', priority: 'Routine' }],
        priority: 'Routine',
        dueDate: '',
        notes: '',
        instructions: ''
      });
      fetchLabOrders();
    } catch (error) {
      console.error('Error creating lab order:', error);
      toast.error('Failed to create lab order');
    }
  };

  const deleteLabOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this lab order?')) {
      return;
    }
    
    try {
      await apiClient.delete(`/api/lab-orders/${orderId}`);
      toast.success('Lab order deleted successfully');
      fetchLabOrders();
    } catch (error) {
      console.error('Error deleting lab order:', error);
      toast.error('Failed to delete lab order');
    }
  };

  const addTest = () => {
    setNewOrder({
      ...newOrder,
      tests: [...newOrder.tests, { testType: '', testName: '', priority: 'Routine' }]
    });
  };

  const removeTest = (index) => {
    const updatedTests = newOrder.tests.filter((_, i) => i !== index);
    setNewOrder({ ...newOrder, tests: updatedTests });
  };

  const updateTest = (index, field, value) => {
    const updatedTests = [...newOrder.tests];
    updatedTests[index] = { ...updatedTests[index], [field]: value };
    setNewOrder({ ...newOrder, tests: updatedTests });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Emergency': return 'bg-red-100 text-red-800';
      case 'Urgent': return 'bg-orange-100 text-orange-800';
      case 'Routine': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
          <div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Lab Orders Management</h1>
            <p className="text-xs sm:text-sm text-gray-600">Create and manage laboratory test requests</p>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Create Lab Order</span>
              <span className="sm:hidden">Create</span>
            </button>
            <button
              onClick={fetchLabOrders}
              className="text-gray-600 hover:text-gray-800 p-1 sm:p-2 rounded-lg hover:bg-gray-100"
              title="Refresh"
            >
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-3 sm:px-4 lg:px-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b border-gray-200">
            <h3 className="text-base sm:text-lg font-medium text-gray-900">Lab Orders</h3>
          </div>
          <div className="overflow-x-auto -mx-3 sm:-mx-4 lg:-mx-6">
            <table className="min-w-full divide-y divide-gray-200">
                             <thead className="bg-gray-50">
                 <tr>
                   <th className="px-2 sm:px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                   <th className="px-2 sm:px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tests</th>
                   <th className="px-2 sm:px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                   <th className="px-2 sm:px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                   <th className="px-2 sm:px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested</th>
                   <th className="px-2 sm:px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due</th>
                   <th className="px-2 sm:px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                 </tr>
               </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {labOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-2 sm:px-3 lg:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 mr-1 sm:mr-2" />
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-medium text-gray-900 truncate block">
                            {order.patient?.firstName} {order.patient?.lastName}
                          </span>
                          <p className="text-xs text-gray-500 truncate">ID: {order.patient?._id?.slice(-4)}</p>
                        </div>
                      </div>
                    </td>
                                         <td className="px-2 sm:px-3 lg:px-6 py-4 whitespace-nowrap text-xs text-gray-900">
                       {order.tests?.length || 0} tests
                     </td>
                     <td className="px-2 sm:px-3 lg:px-6 py-4 whitespace-nowrap">
                       <span className={`inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(order.priority)}`}>
                         {order.priority === 'Emergency' ? 'EMG' : order.priority === 'Urgent' ? 'URG' : 'RUT'}
                       </span>
                     </td>
                     <td className="px-2 sm:px-3 lg:px-6 py-4 whitespace-nowrap">
                       <span className={`inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)}`}>
                         {order.orderStatus === 'In Progress' ? 'PROC' : order.orderStatus === 'Completed' ? 'COMP' : order.orderStatus === 'Pending' ? 'PEND' : 'CANC'}
                       </span>
                     </td>
                     <td className="px-2 sm:px-3 lg:px-6 py-4 whitespace-nowrap text-xs text-gray-900">
                       {new Date(order.requestedDate).toLocaleDateString()}
                     </td>
                     <td className="px-2 sm:px-3 lg:px-6 py-4 whitespace-nowrap text-xs text-gray-900">
                       {order.dueDate ? new Date(order.dueDate).toLocaleDateString() : 'N/A'}
                     </td>
                    <td className="px-2 sm:px-3 lg:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="View Details"
                        >
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                        <button
                          onClick={() => deleteLabOrder(order._id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete Order"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {labOrders.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No lab orders found
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Lab Order Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Create New Lab Order</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              addLabOrder(newOrder);
            }}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Patient *</label>
                  <p className="text-xs text-gray-500 mb-1">Note: Lab orders can be created for all patients, including discharged ones for follow-up care</p>
                  <select
                    required
                    value={newOrder.patient}
                    onChange={(e) => setNewOrder({...newOrder, patient: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select patient</option>
                    {patients.map((patient) => (
                      <option key={patient._id} value={patient._id}>
                        {patient.firstName} {patient.lastName} {patient.status ? `(${patient.status})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={newOrder.priority}
                    onChange={(e) => setNewOrder({...newOrder, priority: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Routine">Routine</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                  <input
                    type="date"
                    value={newOrder.dueDate}
                    onChange={(e) => setNewOrder({...newOrder, dueDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Instructions</label>
                  <input
                    type="text"
                    value={newOrder.instructions}
                    onChange={(e) => setNewOrder({...newOrder, instructions: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Special instructions for lab tech"
                  />
                </div>
              </div>

              {/* Tests Section */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-md font-medium text-gray-900">Tests</h4>
                  <button
                    type="button"
                    onClick={addTest}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Test
                  </button>
                </div>
                
                {newOrder.tests.map((test, index) => (
                  <div key={index} className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4 p-4 border border-gray-200 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Test Type *</label>
                      <select
                        required
                        value={test.testType}
                        onChange={(e) => updateTest(index, 'testType', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select test type</option>
                        <option value="Blood Test">Blood Test</option>
                        <option value="Urine Test">Urine Test</option>
                        <option value="X-Ray">X-Ray</option>
                        <option value="CT Scan">CT Scan</option>
                        <option value="MRI">MRI</option>
                        <option value="Ultrasound">Ultrasound</option>
                        <option value="ECG">ECG</option>
                        <option value="Biopsy">Biopsy</option>
                        <option value="Culture Test">Culture Test</option>
                        <option value="Allergy Test">Allergy Test</option>
                        <option value="Pregnancy Test">Pregnancy Test</option>
                        <option value="Drug Test">Drug Test</option>
                        <option value="Genetic Test">Genetic Test</option>
                        <option value="Microbiology Test">Microbiology Test</option>
                        <option value="Chemistry Test">Chemistry Test</option>
                        <option value="Hematology Test">Hematology Test</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Test Name *</label>
                      <input
                        type="text"
                        required
                        value={test.testName}
                        onChange={(e) => updateTest(index, 'testName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter test name"
                      />
                    </div>
                    
                    <div className="flex items-end space-x-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                        <select
                          value={test.priority}
                          onChange={(e) => updateTest(index, 'priority', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Routine">Routine</option>
                          <option value="Urgent">Urgent</option>
                          <option value="Emergency">Emergency</option>
                        </select>
                      </div>
                      
                      {newOrder.tests.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTest(index)}
                          className="text-red-600 hover:text-red-900 p-2"
                          title="Remove Test"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={newOrder.notes}
                  onChange={(e) => setNewOrder({...newOrder, notes: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes for the lab technician"
                />
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Lab Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lab Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Lab Order Details</h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="px-4 sm:px-6 py-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Patient</label>
                  <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                    {selectedOrder.patient?.firstName} {selectedOrder.patient?.lastName}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Order Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.orderStatus)}`}>
                    {selectedOrder.orderStatus}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(selectedOrder.priority)}`}>
                    {selectedOrder.priority}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Requested Date</label>
                  <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                    {new Date(selectedOrder.requestedDate).toLocaleDateString()}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                  <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                    {selectedOrder.dueDate ? new Date(selectedOrder.dueDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Completed Date</label>
                  <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                    {selectedOrder.completedDate ? new Date(selectedOrder.completedDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Tests Section */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Tests</h4>
                <div className="space-y-4">
                  {selectedOrder.tests?.map((test, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Test Type</label>
                          <p className="text-sm text-gray-900">{test.testType}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Test Name</label>
                          <p className="text-sm text-gray-900">{test.testName}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(test.status)}`}>
                            {test.status}
                          </span>
                        </div>
                      </div>
                      
                      {test.results && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <h5 className="text-sm font-medium text-gray-900 mb-2">Results</h5>
                          {test.results.findings && (
                            <p className="text-sm text-gray-700 mb-2"><strong>Findings:</strong> {test.results.findings}</p>
                          )}
                          {test.results.observations && (
                            <p className="text-sm text-gray-700"><strong>Observations:</strong> {test.results.observations}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{selectedOrder.notes}</p>
                </div>
              )}

              {selectedOrder.instructions && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Instructions</label>
                  <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{selectedOrder.instructions}</p>
                </div>
              )}
            </div>
            
            <div className="px-4 sm:px-6 py-4 border-t border-gray-200">
              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
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

export default LabOrders;
