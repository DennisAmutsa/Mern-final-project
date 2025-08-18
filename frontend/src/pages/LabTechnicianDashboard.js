import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, 
  TestTube, 
  Microscope, 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  User,
  FileText,
  BarChart3,
  Settings,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  Calendar,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckSquare,
  X,
  Save,
  Printer,
  RefreshCw,
  PlusCircle,
  MinusCircle,
  AlertOctagon,
  Play
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../config/axios';
import toast from 'react-hot-toast';

const LabTechnicianDashboard = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    const path = location.pathname;
    if (path.includes('/lab-orders')) return 'lab-orders';
    if (path.includes('/equipment')) return 'equipment';
    if (path.includes('/inventory')) return 'inventory';
    if (path.includes('/reports')) return 'reports';
    if (path.includes('/settings')) return 'settings';
    return 'overview';
  });
  const [labOrders, setLabOrders] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingOrders: 0,
    completedOrders: 0,
    operationalEquipment: 0,
    lowStockItems: 0
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);

  // State for forms and modals
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showAddInventoryModal, setShowAddInventoryModal] = useState(false);
  const [showEditInventoryModal, setShowEditInventoryModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [editingInventory, setEditingInventory] = useState(null);
  const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
  const [newEquipment, setNewEquipment] = useState({
    name: '',
    equipmentType: '',
    model: '',
    serialNumber: '',
    location: '',
    manufacturer: '',
    supplier: '',
    purchaseDate: '',
    warrantyExpiry: '',
    assignedTechnician: ''
  });
  
  // Form states
  const [newInventoryItem, setNewInventoryItem] = useState({
    name: '',
    category: '',
    description: '',
    unit: '',
    quantity: 0,
    minStock: 10,
    maxStock: 100,
    supplier: '',
    cost: 0,
    location: '',
    batchNumber: '',
    manufacturer: '',
    barcode: '',
    expiryDate: ''
  });

  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchDashboardData();
    }
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Update active tab when URL changes
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/lab-orders')) setActiveTab('lab-orders');
    else if (path.includes('/equipment')) setActiveTab('equipment');
    else if (path.includes('/inventory')) setActiveTab('inventory');
    else if (path.includes('/reports')) setActiveTab('reports');
    else if (path.includes('/settings')) setActiveTab('settings');
    else setActiveTab('overview');
  }, [location.pathname]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchLabOrders(),
        fetchEquipment(),
        fetchInventory(),
        fetchStats(),
        fetchTechnicians()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLabOrders = async (status = '') => {
    try {
      const params = new URLSearchParams({ limit: '10' });
      if (status) {
        params.append('status', status);
      }
      const response = await apiClient.get(`/api/lab-orders?${params}`);
      setLabOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error fetching lab orders:', error);
    }
  };

  const fetchEquipment = async (status = '') => {
    try {
      const params = new URLSearchParams({ limit: '10' });
      if (status) {
        params.append('status', status);
      }
      const response = await apiClient.get(`/api/lab-equipment?${params}`);
      setEquipment(response.data.equipment || []);
    } catch (error) {
      console.error('Error fetching equipment:', error);
    }
  };

  const fetchInventory = async (category = '', page = 1) => {
    try {
      // Fetch both lab inventory and relevant general inventory
      const [labResponse, generalResponse] = await Promise.all([
        apiClient.get(`/api/lab-inventory?${new URLSearchParams({ 
          limit: itemsPerPage.toString(),
          page: page.toString(),
          ...(category && { category })
        })}`),
        apiClient.get(`/api/inventory?${new URLSearchParams({ 
          limit: itemsPerPage.toString(),
          page: page.toString(),
          ...(category && { category })
        })}`)
      ]);

      const labInventory = labResponse.data.inventory || [];
      const generalInventory = (generalResponse.data.items || []).filter(item => 
        // Filter general inventory to show only lab-relevant items
        ['Test Kits', 'Reagents', 'Consumables', 'Glassware', 'Safety Equipment', 'Media', 'Antibodies', 'Enzymes', 'Standards'].includes(item.category)
      );

      // Combine and format the inventory
      const combinedInventory = [
        ...labInventory.map(item => ({
          ...item,
          name: item.itemName || item.name,
          quantity: item.currentStock || item.quantity,
          minStock: item.minimumStock || item.minStock,
          maxStock: item.maximumStock || item.maxStock,
          barcode: item.catalogNumber || item.barcode,
          manufacturer: item.supplier || item.manufacturer,
          type: 'Lab'
        })),
        ...generalInventory.map(item => ({
          ...item,
          type: 'General'
        }))
      ];

      setInventory(combinedInventory);
      setTotalItems(combinedInventory.length);
      setTotalPages(Math.ceil(combinedInventory.length / itemsPerPage));
      setCurrentPage(1);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setInventory([]);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const response = await apiClient.get('/api/users?roles=lab_technician');
      setTechnicians(response.data || []);
    } catch (error) {
      console.error('Error fetching technicians:', error);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch stats from various endpoints
      const [pendingOrdersRes, completedOrdersRes, equipmentRes, inventoryRes] = await Promise.all([
        apiClient.get('/api/lab-orders?status=Pending'),
        apiClient.get('/api/lab-orders?status=Completed'),
        apiClient.get('/api/lab-equipment?status=Operational'),
        apiClient.get('/api/lab-inventory/alerts/low-stock')
      ]);

      setStats({
        pendingOrders: pendingOrdersRes.data.pagination?.totalOrders || 0,
        completedOrders: completedOrdersRes.data.pagination?.totalOrders || 0,
        operationalEquipment: equipmentRes.data.pagination?.totalEquipment || 0,
        lowStockItems: inventoryRes.data.lowStockItems?.length || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Lab Order Management Functions

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await apiClient.patch(`/api/lab-orders/${orderId}/status`, { orderStatus: newStatus });
      toast.success('Order status updated successfully');
      fetchLabOrders();
      fetchStats();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const addTestResult = async (orderId, tests) => {
    try {
      // Convert tests to the format expected by the API
      const testResults = tests.map(test => ({
        results: {
          findings: test.results?.findings || '',
          values: test.results?.values || []
        },
        status: test.status || 'Pending',
        notes: test.notes || ''
      }));

      await apiClient.post(`/api/lab-orders/${orderId}/results`, { testResults });
      toast.success('Test results added successfully');
      fetchLabOrders();
    } catch (error) {
      console.error('Error adding test results:', error);
      toast.error('Failed to add test results');
    }
  };

  // Equipment Management Functions
  const updateEquipmentStatus = async (equipmentId, newStatus) => {
    try {
      await apiClient.patch(`/api/lab-equipment/${equipmentId}/status`, { status: newStatus });
      toast.success('Equipment status updated successfully');
      fetchEquipment();
      fetchStats();
    } catch (error) {
      console.error('Error updating equipment status:', error);
      toast.error('Failed to update equipment status');
    }
  };

  const scheduleMaintenance = async (equipmentId, maintenanceData) => {
    try {
      await apiClient.patch(`/api/lab-equipment/${equipmentId}/maintenance`, maintenanceData);
      toast.success('Maintenance scheduled successfully');
      fetchEquipment();
    } catch (error) {
      console.error('Error scheduling maintenance:', error);
      toast.error('Failed to schedule maintenance');
    }
  };

  const addNewEquipment = async (equipmentData) => {
    try {
      await apiClient.post('/api/lab-equipment', equipmentData);
      toast.success('Equipment added successfully');
      setShowAddEquipmentModal(false);
      setNewEquipment({
        name: '',
        equipmentType: '',
        model: '',
        serialNumber: '',
        location: '',
        manufacturer: '',
        supplier: '',
        purchaseDate: '',
        warrantyExpiry: '',
        assignedTechnician: ''
      });
      fetchEquipment();
    } catch (error) {
      console.error('Error adding equipment:', error);
      toast.error('Failed to add equipment');
    }
  };

  // Inventory Management Functions
  const updateInventoryStock = async (itemId, newStock) => {
    try {
      // First get the current item to calculate the difference
      const currentItem = inventory.find(item => item._id === itemId);
      if (!currentItem) {
        toast.error('Item not found');
        return;
      }
      
      const currentQuantity = currentItem.currentStock || currentItem.quantity;
      const difference = newStock - currentQuantity;
      const operation = difference > 0 ? 'add' : 'subtract';
      const quantity = Math.abs(difference);
      
      // Use the appropriate endpoint based on item type
      const endpoint = currentItem.type === 'Lab' 
        ? `/api/lab-inventory/${itemId}/stock`
        : `/api/inventory/${currentItem.itemId || itemId}/stock`;
      
      await apiClient.put(endpoint, { 
        quantity, 
        operation 
      });
      toast.success('Inventory stock updated successfully');
      fetchInventory();
      fetchStats();
    } catch (error) {
      console.error('Error updating inventory stock:', error);
      toast.error('Failed to update inventory stock');
    }
  };

  const requestRestock = async (itemId, quantity) => {
    try {
      const currentItem = inventory.find(item => item._id === itemId);
      if (!currentItem) {
        toast.error('Item not found');
        return;
      }
      
      const currentQuantity = currentItem.currentStock || currentItem.quantity;
      const maxStock = currentItem.maximumStock || currentItem.maxStock;
      
      // Use the appropriate endpoint based on item type
      const endpoint = currentItem.type === 'Lab' 
        ? `/api/lab-inventory/${itemId}/restock`
        : `/api/inventory/${currentItem.itemId || itemId}/restock`;
      
      await apiClient.post(endpoint, { 
        quantity: quantity || (maxStock - currentQuantity),
        priority: 'Normal',
        notes: 'Requested by lab technician'
      });
      toast.success('Restock request submitted successfully');
    } catch (error) {
      console.error('Error requesting restock:', error);
      toast.error('Failed to submit restock request');
    }
  };

  const addNewInventoryItem = async (itemData) => {
    try {
      // Convert to lab inventory format
      const itemToAdd = {
        itemName: itemData.name,
        category: itemData.category,
        description: itemData.description,
        unit: itemData.unit,
        currentStock: itemData.quantity,
        minimumStock: itemData.minStock,
        maximumStock: itemData.maxStock,
        supplier: itemData.supplier,
        catalogNumber: itemData.barcode,
        cost: itemData.cost,
        expiryDate: itemData.expiryDate,
        location: itemData.location,
        notes: itemData.notes
      };
      
      await apiClient.post('/api/lab-inventory', itemToAdd);
      toast.success('Inventory item added successfully');
      setShowAddInventoryModal(false);
      setNewInventoryItem({
        name: '',
        category: '',
        description: '',
        unit: '',
        quantity: 0,
        minStock: 10,
        maxStock: 100,
        supplier: '',
        cost: 0,
        location: '',
        batchNumber: '',
        manufacturer: '',
        barcode: '',
        expiryDate: ''
      });
      fetchInventory();
    } catch (error) {
      console.error('Error adding inventory item:', error);
      toast.error('Failed to add inventory item');
    }
  };

  const editInventoryItem = async (itemData) => {
    try {
      // Convert to lab inventory format
      const itemToUpdate = {
        itemName: itemData.name,
        category: itemData.category,
        description: itemData.description,
        unit: itemData.unit,
        currentStock: itemData.quantity,
        minimumStock: itemData.minStock,
        maximumStock: itemData.maxStock,
        supplier: itemData.supplier,
        catalogNumber: itemData.barcode,
        cost: itemData.cost,
        expiryDate: itemData.expiryDate,
        location: itemData.location,
        notes: itemData.notes
      };
      
      await apiClient.put(`/api/lab-inventory/${editingInventory._id}`, itemToUpdate);
      toast.success('Inventory item updated successfully');
      setShowEditInventoryModal(false);
      setEditingInventory(null);
      fetchInventory();
    } catch (error) {
      console.error('Error updating inventory item:', error);
      toast.error('Failed to update inventory item');
    }
  };

  const deleteInventoryItem = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this inventory item? This action cannot be undone.')) {
      try {
        const currentItem = inventory.find(item => item._id === itemId);
        if (!currentItem) {
          toast.error('Item not found');
          return;
        }
        
        // Use the appropriate endpoint based on item type
        const endpoint = currentItem.type === 'Lab' 
          ? `/api/lab-inventory/${currentItem._id}`
          : `/api/inventory/${currentItem.itemId || currentItem._id}`;
        
        await apiClient.delete(endpoint);
        toast.success('Inventory item deleted successfully');
        fetchInventory();
      } catch (error) {
        console.error('Error deleting inventory item:', error);
        toast.error('Failed to delete inventory item');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Failed': return 'bg-red-100 text-red-800';
      case 'Operational': return 'bg-green-100 text-green-800';
      case 'Maintenance': return 'bg-orange-100 text-orange-800';
      case 'Out of Service': return 'bg-red-100 text-red-800';
      case 'Available': return 'bg-green-100 text-green-800';
      case 'Low Stock': return 'bg-yellow-100 text-yellow-800';
      case 'Out of Stock': return 'bg-red-100 text-red-800';
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

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
            <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Lab Technician Dashboard</h1>
              <p className="text-sm text-gray-600">Manage lab orders, equipment, and inventory</p>
            </div>
          <div className="flex items-center">
              <span className="text-sm text-gray-600">
                Welcome, {user?.firstName} {user?.lastName}
              </span>
            </div>
          </div>
        </div>



      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-4 sm:space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Clock className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Completed Orders</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.completedOrders}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Microscope className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Operational Equipment</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.operationalEquipment}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.lowStockItems}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Lab Orders */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900">Recent Lab Orders</h3>
                  </div>
                  <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full align-middle">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tests</th>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {labOrders.slice(0, 5).map((order) => (
                            <tr key={order._id} className="hover:bg-gray-50">
                              <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <User className="h-4 w-4 text-gray-400 mr-2" />
                                  <span className="text-sm font-medium text-gray-900">
                                    {order.patient?.firstName} {order.patient?.lastName}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {order.tests?.length || 0} tests
                              </td>
                              <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(order.priority)}`}>
                                  {order.priority}
                                </span>
                              </td>
                              <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)}`}>
                                  {order.orderStatus}
                                </span>
                              </td>
                              <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(order.requestedDate).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Equipment Status */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Equipment Status</h3>
                  </div>
                  <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full align-middle">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equipment</th>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {equipment.slice(0, 5).map((item) => (
                            <tr key={item._id} className="hover:bg-gray-50">
                              <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <Microscope className="h-4 w-4 text-gray-400 mr-2" />
                                  <span className="text-sm font-medium text-gray-900">{item.name}</span>
                                </div>
                              </td>
                              <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {item.equipmentType}
                              </td>
                              <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                                  {item.status}
                                </span>
                              </td>
                              <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {item.location}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Lab Orders Tab */}
            {activeTab === 'lab-orders' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-white rounded-lg shadow">
                  <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                      <h3 className="text-lg font-medium text-gray-900">Lab Orders Management</h3>
                      <div className="flex items-center space-x-3">
                      <button
                          onClick={() => fetchLabOrders()}
                          className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100"
                          title="Refresh"
                      >
                          <RefreshCw className="h-4 w-4" />
                      </button>
                        <div className="flex items-center space-x-2">
                          <select
                            onChange={(e) => fetchLabOrders(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          >
                            <option value="">All Status</option>
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Failed">Failed</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tests</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Technician</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {labOrders.map((order) => (
                          <tr key={order._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <User className="h-4 w-4 text-gray-400 mr-2" />
                                <span className="text-sm font-medium text-gray-900">
                                  {order.patient?.firstName && order.patient?.lastName 
                                    ? `${order.patient.firstName} ${order.patient.lastName}`
                                    : order.patient?._id || 'Unknown Patient'
                                  }
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {order.tests?.length || 0} tests
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(order.priority)}`}>
                                {order.priority}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)}`}>
                                {order.orderStatus}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className="text-green-600">
                                {order.labTechnician?.firstName} {order.labTechnician?.lastName}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(order.requestedDate).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => setSelectedOrder(order)}
                                  className="text-blue-600 hover:text-blue-900 p-1"
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>


                                {order.orderStatus === 'Pending' && (
                                  <button
                                    onClick={() => updateOrderStatus(order._id, 'In Progress')}
                                    className="text-green-600 hover:text-green-900 p-1"
                                    title="Start Processing"
                                  >
                                    <Play className="h-4 w-4" />
                                  </button>
                                )}
                                {order.orderStatus === 'In Progress' && (
                                  <button
                                    onClick={() => setSelectedOrder(order)}
                                    className="text-purple-600 hover:text-purple-900 p-1"
                                    title="Add Results"
                                  >
                                    <PlusCircle className="h-4 w-4" />
                                  </button>
                                )}
                                <select
                                  value={order.orderStatus}
                                  onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                                  className="text-xs border border-gray-300 rounded px-2 py-1"
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="In Progress">In Progress</option>
                                  <option value="Completed">Completed</option>
                                  <option value="Failed">Failed</option>
                                </select>
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
            )}

            {/* Equipment Tab */}
            {activeTab === 'equipment' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-white rounded-lg shadow">
                  <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                      <h3 className="text-lg font-medium text-gray-900">Equipment Management</h3>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => setShowAddEquipmentModal(true)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Equipment
                        </button>
                        <button
                          onClick={() => fetchEquipment()}
                          className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100"
                          title="Refresh"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                        <div className="flex items-center space-x-2">
                          <select
                            onChange={(e) => fetchEquipment(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          >
                            <option value="">All Status</option>
                            <option value="Operational">Operational</option>
                            <option value="Maintenance">Maintenance</option>
                            <option value="Out of Service">Out of Service</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equipment</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Maintenance</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {equipment.map((item) => (
                          <tr key={item._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Microscope className="h-4 w-4 text-gray-400 mr-2" />
                                <div>
                                <span className="text-sm font-medium text-gray-900">{item.name}</span>
                                  <p className="text-xs text-gray-500">{item.model}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.equipmentType}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.location}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.lastMaintenanceDate ? new Date(item.lastMaintenanceDate).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => setSelectedEquipment(item)}
                                  className="text-blue-600 hover:text-blue-900 p-1"
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                <select
                                  value={item.status}
                                  onChange={(e) => updateEquipmentStatus(item._id, e.target.value)}
                                  className="text-xs border border-gray-300 rounded px-2 py-1"
                                >
                                  <option value="Operational">Operational</option>
                                  <option value="Maintenance">Maintenance</option>
                                  <option value="Out of Service">Out of Service</option>
                                </select>
                                <button
                                  onClick={() => setSelectedEquipment(item)}
                                  className="text-orange-600 hover:text-orange-900 p-1"
                                  title="Schedule Maintenance"
                                >
                                  <Settings className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {equipment.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No equipment found
              </div>
            )}
                  </div>
                </div>
              </div>
            )}

            {/* Inventory Tab */}
            {activeTab === 'inventory' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-white rounded-lg shadow">
                  <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                      <h3 className="text-lg font-medium text-gray-900">Lab Inventory Management</h3>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => setShowAddInventoryModal(true)}
                          className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 text-sm"
                        >
                        <Plus className="h-4 w-4" />
                        <span>Add Lab Item</span>
                        </button>
                        <button
                          onClick={() => fetchInventory()}
                          className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100"
                          title="Refresh"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                        <div className="flex items-center space-x-2">
                          <select
                            onChange={(e) => fetchInventory(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          >
                            <option value="">All Categories</option>
                            <option value="Reagents">Reagents</option>
                            <option value="Consumables">Consumables</option>
                            <option value="Test Kits">Test Kits</option>
                            <option value="Glassware">Glassware</option>
                            <option value="Safety Equipment">Safety Equipment</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min Stock</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {inventory.map((item) => (
                          <tr key={item._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Package className="h-4 w-4 text-gray-400 mr-2" />
                                <div>
                                  <span className="text-sm font-medium text-gray-900">{item.itemName || item.name}</span>
                                  <p className="text-xs text-gray-500">{item.catalogNumber || item.barcode} | {item.supplier || item.manufacturer}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                                item.type === 'Lab' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {item.type || 'General'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.category}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex items-center space-x-2">
                                <span>{item.currentStock || item.quantity} {item.unit}</span>
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() => updateInventoryStock(item._id, Math.max(0, (item.currentStock || item.quantity) - 1))}
                                    className="text-red-600 hover:text-red-900 p-1"
                                    title="Decrease Stock"
                                  >
                                    <MinusCircle className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => updateInventoryStock(item._id, (item.currentStock || item.quantity) + 1)}
                                    className="text-green-600 hover:text-green-900 p-1"
                                    title="Increase Stock"
                                  >
                                    <PlusCircle className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.minimumStock || item.minStock} {item.unit}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor((item.currentStock || item.quantity) <= (item.minimumStock || item.minStock) ? 'Low Stock' : 'Available')}`}>
                                {(item.currentStock || item.quantity) <= (item.minimumStock || item.minStock) ? 'Low Stock' : 'Available'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => setSelectedInventory(item)}
                                  className="text-blue-600 hover:text-blue-900 p-1"
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingInventory(item);
                                    setShowEditInventoryModal(true);
                                  }}
                                  className="text-green-600 hover:text-green-900 p-1"
                                  title="Edit Item"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => deleteInventoryItem(item._id)}
                                  className="text-red-600 hover:text-red-900 p-1"
                                  title="Delete Item"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                                {(item.currentStock || item.quantity) <= (item.minimumStock || item.minStock) && (
                                  <button
                                    onClick={() => requestRestock(item._id, (item.maximumStock || item.maxStock) - (item.currentStock || item.quantity))}
                                    className="text-orange-600 hover:text-orange-900 p-1"
                                    title="Request Restock"
                                  >
                                    <AlertOctagon className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {inventory.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No inventory items found
                      </div>
                    )}
                  </div>
                  
                  {/* Pagination */}
                  {totalItems > itemsPerPage && (
                    <div className="px-4 sm:px-6 py-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                          Showing {totalItems > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setCurrentPage(1);
                              fetchInventory('', 1);
                            }}
                            disabled={currentPage === 1}
                            className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                          >
                            First
                          </button>
                          <button
                            onClick={() => {
                              if (currentPage > 1) {
                                setCurrentPage(currentPage - 1);
                                fetchInventory('', currentPage - 1);
                              }
                            }}
                            disabled={currentPage === 1}
                            className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                          >
                            Previous
                          </button>
                          
                          {(() => {
                            const startPage = Math.max(1, currentPage - 2);
                            const endPage = Math.min(totalPages, startPage + 4);
                            const pages = [];
                            
                            for (let i = startPage; i <= endPage; i++) {
                              pages.push(
                                <button
                                  key={i}
                                  onClick={() => {
                                    setCurrentPage(i);
                                    fetchInventory('', i);
                                  }}
                                  className={`px-3 py-1 border rounded-lg text-sm ${
                                    currentPage === i
                                      ? 'bg-blue-600 text-white border-blue-600'
                                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  {i}
                                </button>
                              );
                            }
                            return pages;
                          })()}
                          
                          <button
                            onClick={() => {
                              if (currentPage < totalPages) {
                                setCurrentPage(currentPage + 1);
                                fetchInventory('', currentPage + 1);
                              }
                            }}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                          >
                            Next
                          </button>
                          <button
                            onClick={() => {
                              setCurrentPage(totalPages);
                              fetchInventory('', totalPages);
                            }}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                          >
                            Last
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div className="space-y-4 sm:space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <TestTube className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Orders This Month</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders + stats.completedOrders}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {stats.pendingOrders + stats.completedOrders > 0 
                            ? Math.round((stats.completedOrders / (stats.pendingOrders + stats.completedOrders)) * 100)
                            : 0}%
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Microscope className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Equipment Utilization</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {stats.operationalEquipment > 0 ? Math.round((stats.operationalEquipment / (stats.operationalEquipment + 2)) * 100) : 0}%
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Low Stock Alerts</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.lowStockItems}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts and Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900">Order Status Distribution</h3>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Pending</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-yellow-500 h-2 rounded-full" 
                                style={{ width: `${stats.pendingOrders > 0 ? (stats.pendingOrders / (stats.pendingOrders + stats.completedOrders)) * 100 : 0}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{stats.pendingOrders}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Completed</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full" 
                                style={{ width: `${stats.completedOrders > 0 ? (stats.completedOrders / (stats.pendingOrders + stats.completedOrders)) * 100 : 0}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{stats.completedOrders}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900">Equipment Status</h3>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Operational</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full" 
                                style={{ width: `${stats.operationalEquipment > 0 ? (stats.operationalEquipment / (stats.operationalEquipment + 2)) * 100 : 0}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{stats.operationalEquipment}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Maintenance</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-orange-500 h-2 rounded-full" 
                                style={{ width: `${2 > 0 ? (2 / (stats.operationalEquipment + 2)) * 100 : 0}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">2</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {labOrders.slice(0, 5).map((order, index) => (
                        <div key={order._id} className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <TestTube className="h-4 w-4 text-blue-600" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              Lab order for {order.patient?.firstName} {order.patient?.lastName}
                            </p>
                            <p className="text-sm text-gray-500">
                              Status: {order.orderStatus} • {new Date(order.requestedDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)}`}>
                              {order.orderStatus}
                            </span>
                          </div>
                        </div>
                      ))}
                      {labOrders.length === 0 && (
                        <p className="text-gray-500 text-center py-4">No recent activity</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Lab Technician Settings</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-6">
                      {/* Profile Settings */}
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 mb-4">Profile Settings</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                            <input
                              type="text"
                              defaultValue={user?.firstName || ''}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              disabled
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                            <input
                              type="text"
                              defaultValue={user?.lastName || ''}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              disabled
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <input
                              type="email"
                              defaultValue={user?.email || ''}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              disabled
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                            <input
                              type="text"
                              defaultValue={user?.role || ''}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                              disabled
                            />
                          </div>
                        </div>
                      </div>

                      {/* Notification Settings */}
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 mb-4">Notification Settings</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">New Lab Orders</p>
                              <p className="text-sm text-gray-500">Get notified when new lab orders are assigned</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" defaultChecked className="sr-only peer" />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">Low Stock Alerts</p>
                              <p className="text-sm text-gray-500">Get notified when inventory items are running low</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" defaultChecked className="sr-only peer" />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">Equipment Maintenance</p>
                              <p className="text-sm text-gray-500">Get notified about equipment maintenance schedules</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" defaultChecked className="sr-only peer" />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* System Information */}
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 mb-4">System Information</h4>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Last Login</p>
                              <p className="font-medium text-gray-900">{new Date().toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Session Duration</p>
                              <p className="font-medium text-gray-900">Active</p>
                            </div>
                            <div>
                              <p className="text-gray-600">System Version</p>
                              <p className="font-medium text-gray-900">v1.0.0</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Last Sync</p>
                              <p className="font-medium text-gray-900">{new Date().toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Equipment Details Modal */}
            {selectedEquipment && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">Equipment Details</h3>
                      <button
                        onClick={() => setSelectedEquipment(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="px-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Equipment Name</label>
                        <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{selectedEquipment.name}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                        <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{selectedEquipment.model}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Equipment Type</label>
                        <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{selectedEquipment.equipmentType}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedEquipment.status)}`}>
                          {selectedEquipment.status}
                        </span>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                        <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{selectedEquipment.location}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Serial Number</label>
                        <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{selectedEquipment.serialNumber || 'N/A'}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Last Maintenance</label>
                        <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                          {selectedEquipment.lastMaintenanceDate ? new Date(selectedEquipment.lastMaintenanceDate).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Next Maintenance</label>
                        <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                          {selectedEquipment.nextMaintenanceDate ? new Date(selectedEquipment.nextMaintenanceDate).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Manufacturer</label>
                        <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{selectedEquipment.manufacturer || 'N/A'}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Date</label>
                        <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                          {selectedEquipment.purchaseDate ? new Date(selectedEquipment.purchaseDate).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Warranty Expiry</label>
                        <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                          {selectedEquipment.warrantyExpiry ? new Date(selectedEquipment.warrantyExpiry).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Technician</label>
                        <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                          {selectedEquipment.assignedTechnician ? 
                            `${selectedEquipment.assignedTechnician.firstName} ${selectedEquipment.assignedTechnician.lastName}` : 
                            'N/A'
                          }
                        </p>
                      </div>
                    </div>
                    
                    {selectedEquipment.notes && (
                      <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                        <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{selectedEquipment.notes}</p>
                      </div>
                    )}
                    
                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        onClick={() => setSelectedEquipment(null)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Lab Order Details Modal */}
            {selectedOrder && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                  <div className="px-6 py-4 border-b border-gray-200">
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
                  
                  <div className="px-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Patient</label>
                        <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                          {selectedOrder.patient?.firstName} {selectedOrder.patient?.lastName}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Doctor</label>
                        <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                          {selectedOrder.doctor?.firstName} {selectedOrder.doctor?.lastName}
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
                    
                    <div className="mb-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Tests</h4>
                      <div className="space-y-3">
                        {selectedOrder.tests?.map((test, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Results</label>
                                <div className="space-y-2">
                                  {test.results.values?.map((result, resultIndex) => (
                                    <div key={resultIndex} className="flex justify-between text-sm">
                                      <span className="text-gray-600">{result.parameter}:</span>
                                      <span className={`font-medium ${result.isAbnormal ? 'text-red-600' : 'text-gray-900'}`}>
                                        {result.value} {result.unit}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                                {test.results.findings && (
                                  <div className="mt-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Findings</label>
                                    <p className="text-sm text-gray-900">{test.results.findings}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => setSelectedOrder(null)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Inventory Details Modal */}
            {selectedInventory && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">Inventory Item Details</h3>
                      <button
                        onClick={() => setSelectedInventory(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="px-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Item Name</label>
                        <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{selectedInventory.name}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                        <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{selectedInventory.category}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Current Stock</label>
                        <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{selectedInventory.quantity} {selectedInventory.unit}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Stock</label>
                        <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{selectedInventory.minStock} {selectedInventory.unit}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Stock</label>
                        <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{selectedInventory.maxStock} {selectedInventory.unit}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedInventory.quantity <= selectedInventory.minStock ? 'Low Stock' : 'Available')}`}>
                          {selectedInventory.quantity <= selectedInventory.minStock ? 'Low Stock' : 'Available'}
                        </span>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
                        <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{selectedInventory.supplier || 'N/A'}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Cost per Unit</label>
                        <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">${selectedInventory.cost || '0.00'}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                        <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{selectedInventory.location || 'N/A'}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Batch Number</label>
                        <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{selectedInventory.batchNumber || 'N/A'}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Manufacturer</label>
                        <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{selectedInventory.manufacturer || 'N/A'}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Barcode</label>
                        <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{selectedInventory.barcode || 'N/A'}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                        <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                          {selectedInventory.expiryDate ? new Date(selectedInventory.expiryDate).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        onClick={() => setSelectedInventory(null)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Inventory Modal */}
            {showEditInventoryModal && editingInventory && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">Edit Inventory Item</h3>
                      <button
                        onClick={() => {
                          setShowEditInventoryModal(false);
                          setEditingInventory(null);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>
                  </div>
                  
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    editInventoryItem(editingInventory);
                  }} className="px-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Item Name *</label>
                        <input
                          type="text"
                          required
                          value={editingInventory.name}
                          onChange={(e) => setEditingInventory({...editingInventory, name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter item name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                        <select
                          required
                          value={editingInventory.category}
                          onChange={(e) => setEditingInventory({...editingInventory, category: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select category</option>
                          <option value="Reagents">Reagents</option>
                          <option value="Consumables">Consumables</option>
                          <option value="Test Kits">Test Kits</option>
                          <option value="Glassware">Glassware</option>
                          <option value="Safety Equipment">Safety Equipment</option>
                          <option value="Media">Media</option>
                          <option value="Antibodies">Antibodies</option>
                          <option value="Enzymes">Enzymes</option>
                          <option value="Standards">Standards</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                          value={editingInventory.description || ''}
                          onChange={(e) => setEditingInventory({...editingInventory, description: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter description"
                          rows="2"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Unit *</label>
                        <select
                          required
                          value={editingInventory.unit}
                          onChange={(e) => setEditingInventory({...editingInventory, unit: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select unit</option>
                          <option value="ml">ml</option>
                          <option value="mg">mg</option>
                          <option value="g">g</option>
                          <option value="pieces">pieces</option>
                          <option value="boxes">boxes</option>
                          <option value="bottles">bottles</option>
                          <option value="tubes">tubes</option>
                          <option value="plates">plates</option>
                          <option value="kits">kits</option>
                          <option value="strips">strips</option>
                          <option value="pairs">pairs</option>
                          <option value="units">units</option>
                          <option value="vials">vials</option>
                          <option value="capsules">capsules</option>
                          <option value="tablets">tablets</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Current Quantity *</label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={editingInventory.quantity}
                          onChange={(e) => setEditingInventory({...editingInventory, quantity: parseInt(e.target.value) || 0})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Stock *</label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={editingInventory.minStock}
                          onChange={(e) => setEditingInventory({...editingInventory, minStock: parseInt(e.target.value) || 0})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="10"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Stock *</label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={editingInventory.maxStock}
                          onChange={(e) => setEditingInventory({...editingInventory, maxStock: parseInt(e.target.value) || 0})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="100"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
                        <input
                          type="text"
                          value={editingInventory.supplier || ''}
                          onChange={(e) => setEditingInventory({...editingInventory, supplier: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter supplier name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Cost per Unit</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editingInventory.cost || 0}
                          onChange={(e) => setEditingInventory({...editingInventory, cost: parseFloat(e.target.value) || 0})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0.00"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                        <input
                          type="text"
                          value={editingInventory.location || ''}
                          onChange={(e) => setEditingInventory({...editingInventory, location: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter storage location"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Batch Number</label>
                        <input
                          type="text"
                          value={editingInventory.batchNumber || ''}
                          onChange={(e) => setEditingInventory({...editingInventory, batchNumber: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter batch number"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Manufacturer</label>
                        <input
                          type="text"
                          value={editingInventory.manufacturer || ''}
                          onChange={(e) => setEditingInventory({...editingInventory, manufacturer: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter manufacturer name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                        <input
                          type="date"
                          value={editingInventory.expiryDate ? editingInventory.expiryDate.split('T')[0] : ''}
                          onChange={(e) => setEditingInventory({...editingInventory, expiryDate: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        type="button"
                        onClick={() => {
                          setShowEditInventoryModal(false);
                          setEditingInventory(null);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Update Item
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Add Inventory Modal */}
            {showAddInventoryModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">Add New Inventory Item</h3>
                      <button
                        onClick={() => setShowAddInventoryModal(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>
                  </div>
                  
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    addNewInventoryItem(newInventoryItem);
                  }} className="px-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Item Name *</label>
                        <input
                          type="text"
                          required
                          value={newInventoryItem.name || ''}
                          onChange={(e) => setNewInventoryItem({...newInventoryItem, name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter item name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                        <select
                          required
                          value={newInventoryItem.category}
                          onChange={(e) => setNewInventoryItem({...newInventoryItem, category: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select category</option>
                          <option value="Reagents">Reagents</option>
                          <option value="Consumables">Consumables</option>
                          <option value="Test Kits">Test Kits</option>
                          <option value="Glassware">Glassware</option>
                          <option value="Safety Equipment">Safety Equipment</option>
                          <option value="Media">Media</option>
                          <option value="Antibodies">Antibodies</option>
                          <option value="Enzymes">Enzymes</option>
                          <option value="Standards">Standards</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                          value={newInventoryItem.description}
                          onChange={(e) => setNewInventoryItem({...newInventoryItem, description: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter description"
                          rows="2"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Unit *</label>
                        <select
                          required
                          value={newInventoryItem.unit}
                          onChange={(e) => setNewInventoryItem({...newInventoryItem, unit: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select unit</option>
                          <option value="ml">ml</option>
                          <option value="mg">mg</option>
                          <option value="g">g</option>
                          <option value="pieces">pieces</option>
                          <option value="boxes">boxes</option>
                          <option value="bottles">bottles</option>
                          <option value="tubes">tubes</option>
                          <option value="plates">plates</option>
                          <option value="kits">kits</option>
                          <option value="strips">strips</option>
                          <option value="pairs">pairs</option>
                          <option value="units">units</option>
                          <option value="vials">vials</option>
                          <option value="capsules">capsules</option>
                          <option value="tablets">tablets</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Initial Quantity *</label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={newInventoryItem.quantity}
                          onChange={(e) => setNewInventoryItem({...newInventoryItem, quantity: parseInt(e.target.value) || 0})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Stock *</label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={newInventoryItem.minStock}
                          onChange={(e) => setNewInventoryItem({...newInventoryItem, minStock: parseInt(e.target.value) || 0})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="10"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Stock *</label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={newInventoryItem.maxStock}
                          onChange={(e) => setNewInventoryItem({...newInventoryItem, maxStock: parseInt(e.target.value) || 0})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="100"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
                        <input
                          type="text"
                          value={newInventoryItem.supplier}
                          onChange={(e) => setNewInventoryItem({...newInventoryItem, supplier: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter supplier name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Cost per Unit</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={newInventoryItem.cost}
                          onChange={(e) => setNewInventoryItem({...newInventoryItem, cost: parseFloat(e.target.value) || 0})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0.00"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                        <input
                          type="text"
                          value={newInventoryItem.location}
                          onChange={(e) => setNewInventoryItem({...newInventoryItem, location: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter storage location"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Batch Number</label>
                        <input
                          type="text"
                          value={newInventoryItem.batchNumber}
                          onChange={(e) => setNewInventoryItem({...newInventoryItem, batchNumber: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter batch number"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Manufacturer</label>
                        <input
                          type="text"
                          value={newInventoryItem.manufacturer}
                          onChange={(e) => setNewInventoryItem({...newInventoryItem, manufacturer: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter manufacturer name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                        <input
                          type="date"
                          value={newInventoryItem.expiryDate}
                          onChange={(e) => setNewInventoryItem({...newInventoryItem, expiryDate: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        type="button"
                        onClick={() => setShowAddInventoryModal(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Add Item
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Add Equipment Modal */}
            {showAddEquipmentModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Add New Equipment</h3>
                    <button
                      onClick={() => setShowAddEquipmentModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    addNewEquipment(newEquipment);
                  }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Equipment Name *</label>
                        <input
                          type="text"
                          required
                          value={newEquipment.name}
                          onChange={(e) => setNewEquipment({...newEquipment, name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter equipment name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Equipment Type *</label>
                        <select
                          required
                          value={newEquipment.equipmentType}
                          onChange={(e) => setNewEquipment({...newEquipment, equipmentType: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select equipment type</option>
                          <option value="Microscope">Microscope</option>
                          <option value="Centrifuge">Centrifuge</option>
                          <option value="Incubator">Incubator</option>
                          <option value="Autoclave">Autoclave</option>
                          <option value="Spectrophotometer">Spectrophotometer</option>
                          <option value="PCR Machine">PCR Machine</option>
                          <option value="Hematology Analyzer">Hematology Analyzer</option>
                          <option value="Chemistry Analyzer">Chemistry Analyzer</option>
                          <option value="Urine Analyzer">Urine Analyzer</option>
                          <option value="Blood Gas Analyzer">Blood Gas Analyzer</option>
                          <option value="ECG Machine">ECG Machine</option>
                          <option value="Ultrasound">Ultrasound</option>
                          <option value="X-Ray Machine">X-Ray Machine</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                        <input
                          type="text"
                          value={newEquipment.model}
                          onChange={(e) => setNewEquipment({...newEquipment, model: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter model number"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Serial Number</label>
                        <input
                          type="text"
                          value={newEquipment.serialNumber}
                          onChange={(e) => setNewEquipment({...newEquipment, serialNumber: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter serial number"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                        <input
                          type="text"
                          value={newEquipment.location}
                          onChange={(e) => setNewEquipment({...newEquipment, location: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter equipment location"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Manufacturer</label>
                        <input
                          type="text"
                          value={newEquipment.manufacturer}
                          onChange={(e) => setNewEquipment({...newEquipment, manufacturer: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter manufacturer name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
                        <input
                          type="text"
                          value={newEquipment.supplier}
                          onChange={(e) => setNewEquipment({...newEquipment, supplier: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter supplier name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Date</label>
                        <input
                          type="date"
                          value={newEquipment.purchaseDate}
                          onChange={(e) => setNewEquipment({...newEquipment, purchaseDate: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Warranty Expiry</label>
                        <input
                          type="date"
                          value={newEquipment.warrantyExpiry}
                          onChange={(e) => setNewEquipment({...newEquipment, warrantyExpiry: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Technician</label>
                        <select
                          value={newEquipment.assignedTechnician}
                          onChange={(e) => setNewEquipment({...newEquipment, assignedTechnician: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select assigned technician</option>
                          {technicians.map((technician) => (
                            <option key={technician._id} value={technician._id}>
                              {technician.firstName} {technician.lastName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        type="button"
                        onClick={() => setShowAddEquipmentModal(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Add Equipment
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Lab Order Details Modal */}
            {selectedOrder && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Lab Order Details - {selectedOrder.patient?.firstName} {selectedOrder.patient?.lastName}
                    </h3>
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  {/* Order Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Order Information</h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Patient:</span> {selectedOrder.patient?.firstName} {selectedOrder.patient?.lastName}</p>
                        <p><span className="font-medium">Doctor:</span> {selectedOrder.doctor?.firstName} {selectedOrder.doctor?.lastName}</p>
                        <p><span className="font-medium">Priority:</span> 
                          <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedOrder.priority)}`}>
                            {selectedOrder.priority}
                          </span>
                        </p>
                        <p><span className="font-medium">Status:</span> 
                          <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.orderStatus)}`}>
                            {selectedOrder.orderStatus}
                          </span>
                        </p>
                        <p><span className="font-medium">Requested Date:</span> {new Date(selectedOrder.requestedDate).toLocaleDateString()}</p>
                        {selectedOrder.dueDate && (
                          <p><span className="font-medium">Due Date:</span> {new Date(selectedOrder.dueDate).toLocaleDateString()}</p>
                        )}
                        {selectedOrder.instructions && (
                          <p><span className="font-medium">Instructions:</span> {selectedOrder.instructions}</p>
                        )}
                        {selectedOrder.notes && (
                          <p><span className="font-medium">Notes:</span> {selectedOrder.notes}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Assignment</h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Assigned to:</span> {selectedOrder.labTechnician?.firstName} {selectedOrder.labTechnician?.lastName}</p>
                      </div>
                    </div>
                  </div>

                  {/* Tests Section */}
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-4">Tests</h4>
                    <div className="space-y-4">
                      {selectedOrder.tests?.map((test, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h5 className="font-medium text-gray-900">{test.testName}</h5>
                              <p className="text-sm text-gray-600">{test.testType}</p>
                              <p className="text-sm text-gray-600">Priority: 
                                <span className={`ml-1 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(test.priority)}`}>
                                  {test.priority}
                                </span>
                              </p>
                            </div>
                            <div className="text-right">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(test.status)}`}>
                                {test.status}
                              </span>
                            </div>
                          </div>

                          {/* Test Results Form */}
                          {selectedOrder.orderStatus === 'In Progress' && (
                            <div className="border-t pt-3">
                              <h6 className="font-medium text-gray-900 mb-2">Test Results</h6>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                  <select
                                    value={test.status || 'Pending'}
                                    onChange={(e) => {
                                      const updatedTests = [...selectedOrder.tests];
                                      updatedTests[index] = { ...test, status: e.target.value };
                                      setSelectedOrder({ ...selectedOrder, tests: updatedTests });
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="Pending">Pending</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Failed">Failed</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                  <input
                                    type="text"
                                    value={test.notes || ''}
                                    onChange={(e) => {
                                      const updatedTests = [...selectedOrder.tests];
                                      updatedTests[index] = { ...test, notes: e.target.value };
                                      setSelectedOrder({ ...selectedOrder, tests: updatedTests });
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter test notes"
                                  />
                                </div>
                              </div>
                              
                              {/* Results Values */}
                              <div className="mt-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Results Values</label>
                                <textarea
                                  value={test.results?.findings || ''}
                                  onChange={(e) => {
                                    const updatedTests = [...selectedOrder.tests];
                                    const updatedResults = { ...test.results, findings: e.target.value };
                                    updatedTests[index] = { ...test, results: updatedResults };
                                    setSelectedOrder({ ...selectedOrder, tests: updatedTests });
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  rows="3"
                                  placeholder="Enter test results and findings"
                                />
                              </div>
                            </div>
                          )}

                          {/* Display existing results */}
                          {test.results && (test.results.findings || test.results.values?.length > 0) && (
                            <div className="border-t pt-3 mt-3">
                              <h6 className="font-medium text-gray-900 mb-2">Current Results</h6>
                              {test.results.findings && (
                                <p className="text-sm text-gray-700 mb-2">{test.results.findings}</p>
                              )}
                              {test.results.values?.map((value, vIndex) => (
                                <div key={vIndex} className="text-sm text-gray-600">
                                  <span className="font-medium">{value.parameter}:</span> {value.value} {value.unit}
                                  {value.isAbnormal && <span className="text-red-600 ml-2">(Abnormal)</span>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Close
                    </button>
                    {selectedOrder.orderStatus === 'In Progress' && (
                      <button
                        onClick={() => {
                          addTestResult(selectedOrder._id, selectedOrder.tests);
                          setSelectedOrder(null);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Save Results
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LabTechnicianDashboard;
