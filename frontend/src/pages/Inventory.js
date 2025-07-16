import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const statusColors = {
  'Available': 'bg-green-100 text-green-700',
  'Low Stock': 'bg-yellow-100 text-yellow-700',
  'Out of Stock': 'bg-red-100 text-red-700',
};

const Inventory = () => {
  const { user } = useAuth();
  const isAdmin = user && typeof user === 'object' && user.role === 'admin';
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    quantity: '',
    category: '',
    unit: '',
    supplier: '',
    expiryDate: '',
    cost: '',
    location: '',
    batchNumber: '',
    manufacturer: ''
  });
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalValue: 0,
    categoryStats: {}
  });
  const socketRef = useRef(null);

  const fetchInventory = () => {
    setLoading(true);
    fetch('/api/inventory')
      .then(res => res.json())
      .then(data => {
        // Ensure inventory data is an array and clean any problematic fields
        const safeInventory = Array.isArray(data) ? data.map(item => ({
          ...item,
          name: String(item.name || ''),
          barcode: String(item.barcode || ''),
          batchNumber: String(item.batchNumber || ''),
          manufacturer: String(item.manufacturer || ''),
          quantity: Number(item.quantity) || 0,
          category: String(item.category || ''),
          unit: String(item.unit || ''),
          supplier: String(item.supplier || ''),
          location: String(item.location || ''),
          status: String(item.status || ''),
          cost: item.cost ? Number(item.cost) : null,
          expiryDate: item.expiryDate || null
        })) : [];
        setInventory(safeInventory);
      })
      .catch(() => setInventory([]))
      .finally(() => setLoading(false));
  };

  const fetchStats = () => {
    fetch('/api/inventory/stats/overview')
      .then(res => res.json())
      .then(data => {
        // Ensure all stats are properly formatted
        const safeStats = {
          totalItems: typeof data.totalItems === 'number' ? data.totalItems : 0,
          lowStockCount: typeof data.lowStockCount === 'number' ? data.lowStockCount : 0,
          outOfStockCount: typeof data.outOfStockCount === 'number' ? data.outOfStockCount : 0,
          totalValue: typeof data.totalValue === 'number'
            ? data.totalValue
            : (typeof data.totalValue === 'string' ? parseFloat(data.totalValue) : 0),
          categoryStats: typeof data.categoryStats === 'object' && data.categoryStats !== null ? data.categoryStats : {}
        };
        setStats(safeStats);
      })
      .catch(() => setStats({ totalItems: 0, lowStockCount: 0, outOfStockCount: 0, totalValue: 0, categoryStats: {} }));
  };

  useEffect(() => {
    fetchInventory();
    fetchStats();
    let socket;
    try {
      import('socket.io-client').then(({ default: io }) => {
        socket = io('http://localhost:5000');
        socketRef.current = socket;
        socket.on('inventory-updated', () => {
          fetchInventory();
          fetchStats();
        });
      }).catch(err => {
        console.warn('Socket.io not available:', err);
      });
    } catch (err) {
      console.warn('Socket.io import failed:', err);
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    setShowForm(false);
    fetchInventory();
    fetchStats();
    setForm({
      name: '',
      quantity: '',
      category: '',
      unit: '',
      supplier: '',
      expiryDate: '',
      cost: '',
      location: '',
      batchNumber: '',
      manufacturer: ''
    });
  };

  // Filter inventory by search
  const filteredInventory = inventory.filter(item => {
    const q = search.toLowerCase();
    return (
      item.name?.toLowerCase().includes(q) ||
      item.barcode?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q) ||
      item.supplier?.toLowerCase().includes(q) ||
      item.status?.toLowerCase().includes(q) ||
      item.batchNumber?.toLowerCase().includes(q) ||
      item.manufacturer?.toLowerCase().includes(q)
    );
  });

  // Prepare data for the bar chart
  const categoryLabels = Object.keys(stats.categoryStats || {});
  const categoryCounts = Object.values(stats.categoryStats || {});

  // Sanitize chart data
  const safeLabels = categoryLabels.filter(l => typeof l === 'string' || typeof l === 'number');
  const safeData = categoryCounts.map(v => Number(v)).filter(v => !isNaN(v));
  const safeChartData = {
    labels: safeLabels,
    datasets: [
      {
        label: 'Items per Category',
        data: safeData,
        backgroundColor: 'rgba(37, 99, 235, 0.6)',
        borderColor: 'rgba(37, 99, 235, 1)',
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 } },
    },
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;

  try {
    return (
      <div className="min-h-screen bg-gray-50 pb-10">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-extrabold text-gray-800 mb-2">Inventory</h1>
          <p className="text-gray-500 mb-6">Manage and track all hospital inventory items here.</p>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-blue-100 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-700">{stats.totalItems || 0}</div>
              <div className="text-sm text-blue-700">Total Items</div>
            </div>
            <div className="bg-yellow-100 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-700">{stats.lowStockCount || 0}</div>
              <div className="text-sm text-yellow-700">Low Stock</div>
            </div>
            <div className="bg-red-100 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-700">{stats.outOfStockCount || 0}</div>
              <div className="text-sm text-red-700">Out of Stock</div>
            </div>
            <div className="bg-green-100 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-700">Ksh {parseFloat(stats.totalValue) || 0}</div>
              <div className="text-sm text-green-700">Total Value</div>
            </div>
          </div>
          {/* Removed chart section here */}
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
              {isAdmin === true && (
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold shadow transition text-base"
                >
                  + Add Inventory Item
                </button>
              )}
              <div className="relative w-full md:w-80">
                <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search inventory..."
                  className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 w-full focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50"
                />
              </div>
            </div>
            <hr className="mb-4 border-gray-200" />
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg shadow text-sm border border-gray-200">
                <thead className="bg-gray-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 font-bold text-left border-b text-base">Name</th>
                    <th className="px-4 py-3 font-bold text-left border-b text-base">Barcode</th>
                    <th className="px-4 py-3 font-bold text-left border-b text-base">Batch</th>
                    <th className="px-4 py-3 font-bold text-left border-b text-base">Manufacturer</th>
                    <th className="px-4 py-3 font-bold text-right border-b text-base">Quantity</th>
                    <th className="px-4 py-3 font-bold text-left border-b text-base">Category</th>
                    <th className="px-4 py-3 font-bold text-left border-b text-base">Unit</th>
                    <th className="px-4 py-3 font-bold text-left border-b text-base">Supplier</th>
                    <th className="px-4 py-3 font-bold text-left border-b text-base">Expiry Date</th>
                    <th className="px-4 py-3 font-bold text-right border-b text-base">Cost</th>
                    <th className="px-4 py-3 font-bold text-left border-b text-base">Location</th>
                    <th className="px-4 py-3 font-bold text-left border-b text-base">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.length === 0 ? (
                    <tr>
                      <td colSpan="12" className="text-center text-gray-500 py-8">No inventory items found.</td>
                    </tr>
                  ) : (
                    filteredInventory.map((item, idx) => (
                      <tr
                        key={item.itemId || item._id}
                        className={
                          (idx % 2 === 0 ? 'bg-white' : 'bg-gray-50') +
                          ' hover:bg-blue-50 transition-colors border-b last:border-b-0'
                        }
                      >
                        <td className="px-4 py-3 align-top whitespace-pre-line font-semibold text-gray-900 text-base">{item.name || '-'}</td>
                        <td className="px-4 py-3 align-top text-gray-700 font-mono text-sm">{item.barcode || '-'}</td>
                        <td className="px-4 py-3 align-top text-gray-700">{item.batchNumber || '-'}</td>
                        <td className="px-4 py-3 align-top text-gray-700">{item.manufacturer || '-'}</td>
                        <td className="px-4 py-3 align-top text-right text-gray-700 font-bold">{item.quantity || 0}</td>
                        <td className="px-4 py-3 align-top text-gray-700">{item.category || '-'}</td>
                        <td className="px-4 py-3 align-top text-gray-700">{item.unit || '-'}</td>
                        <td className="px-4 py-3 align-top text-gray-700">{item.supplier || '-'}</td>
                        <td className="px-4 py-3 align-top text-gray-700">{item.expiryDate ? (new Date(item.expiryDate).toLocaleDateString()): '-'}</td>
                        <td className="px-4 py-3 align-top text-right text-gray-700">{item.cost ? `Ksh ${Number(item.cost).toFixed(2)}` : '-'}</td>
                        <td className="px-4 py-3 align-top text-gray-700">{item.location || '-'}</td>
                        <td className="px-4 py-3 align-top">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusColors[item.status] || 'bg-gray-200 text-gray-700'}`}> 
                            {item.status || 'Unknown'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {showForm && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-30">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-lg relative animate-fadeIn">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
                aria-label="Close"
              >
                ✕
              </button>
              <h2 className="text-xl font-bold mb-4 text-gray-700">Add Inventory Item</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-200" placeholder="e.g. Paracetamol 500mg" />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Quantity</label>
                    <input type="number" required value={form.quantity || ''} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-200" placeholder="e.g. 100" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Unit</label>
                    <input type="text" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-200" placeholder="e.g. Tablets" />
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <input type="text" required value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-200" placeholder="e.g. Medications" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Supplier</label>
                    <input type="text" value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-200" placeholder="e.g. PharmaCare Ltd" />
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Batch Number *</label>
                    <input type="text" required value={form.batchNumber} onChange={e => setForm(f => ({ ...f, batchNumber: e.target.value }))} className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-200" placeholder="e.g. BATCH001" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Manufacturer *</label>
                    <input type="text" required value={form.manufacturer} onChange={e => setForm(f => ({ ...f, manufacturer: e.target.value }))} className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-200" placeholder="e.g. Generic Pharma" />
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Expiry Date</label>
                    <input type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-200" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Cost</label>
                    <input type="number" step="0.01" value={form.cost || ''} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-200" placeholder="e.g. 2.50" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-200" placeholder="e.g. Pharmacy Storage A" />
                </div>
                <div className="flex space-x-2 mt-4">
                  <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-semibold shadow transition">Save</button>
                  <button type="button" onClick={() => setShowForm(false)} className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded font-semibold shadow transition">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Error rendering Inventory component:', error);
    return <div className="flex justify-center items-center h-64">Error loading inventory</div>;
  }
};

export default Inventory; 