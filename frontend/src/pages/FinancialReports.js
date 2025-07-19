import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { API_BASE_URL } from '../config/api';
import axios from 'axios'; // Added axios import
const PIE_COLORS = ['#0088FE', '#FF8042'];

export default function FinancialReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewReport, setViewReport] = useState(null);
  const [form, setForm] = useState({ type: '', period: '', totals: {}, notes: '' });
  const [editReport, setEditReport] = useState(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('');
  const [totals, setTotals] = useState([
    { key: 'revenue', value: '' },
    { key: 'expenses', value: '' }
  ]);
  const { user } = useAuth();
  const canEdit = user && (user.role === 'admin' || user.role === 'finance');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    // Test API connection first
    console.log('Testing Financial Reports API connection...');
    console.log('Current API_BASE_URL:', API_BASE_URL);
    
    axios.get('/api/financial-reports', {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })
      .then(res => {
        console.log('Financial Reports API Response:', res.data);
        setReports(Array.isArray(res.data) ? res.data : []);
      })
      .catch((error) => {
        console.error('Error fetching reports:', error);
        console.error('Error details:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url
        });
        setReports([]);
      })
      .finally(() => setLoading(false));
  };

  const handleAddReport = async (e) => {
    e.preventDefault();
    
    // Validate required totals
    const revenue = getRequiredTotal('revenue').value;
    const expenses = getRequiredTotal('expenses').value;
    if (revenue === '' || expenses === '') {
      toast.error('Revenue and Expenses are required');
      return;
    }
    
    const token = localStorage.getItem('token');
    const totalsObj = {};
    totals.forEach(t => { if (t.key && t.value !== '') totalsObj[t.key] = Number(t.value); });
    try {
      await axios.post('/api/financial-reports', { ...form, totals: totalsObj }, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      setShowAddModal(false);
      setForm({ type: '', period: '', totals: {}, notes: '' });
      setTotals([{ key: 'revenue', value: '' }, { key: 'expenses', value: '' }]); // Reset totals form
      fetchReports();
      toast.success('Report added!');
    } catch (error) {
      console.error('Error adding report:', error);
      toast.error('Failed to add report');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this report?')) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`/api/financial-reports/${id}`, { 
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      fetchReports();
      toast.success('Report deleted');
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Failed to delete report');
    }
  };

  // Filtered reports
  const filteredReports = reports.filter(report => {
    const matchesSearch = !search || (report.period + ' ' + report.type).toLowerCase().includes(search.toLowerCase());
    const matchesType = !filterType || report.type === filterType;
    const matchesPeriod = !filterPeriod || report.period === filterPeriod;
    return matchesSearch && matchesType && matchesPeriod;
  });

  // Calculate summary values
  const totalRevenue = reports.reduce((sum, r) => sum + (r.totals?.revenue ? Number(r.totals.revenue) : 0), 0);
  const totalExpenses = reports.reduce((sum, r) => sum + (r.totals?.expenses ? Number(r.totals.expenses) : 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  // Prepare bar chart data
  const barData = reports.map(r => ({
    period: r.period,
    Revenue: r.totals?.revenue ? Number(r.totals.revenue) : 0,
    Expenses: r.totals?.expenses ? Number(r.totals.expenses) : 0
  }));

  // Pie chart data for total revenue vs expenses
  const pieTotals = [
    { name: 'Revenue', value: totalRevenue },
    { name: 'Expenses', value: totalExpenses }
  ];
  // Line chart data for trend
  const lineData = reports.map(r => ({
    period: r.period,
    Revenue: r.totals?.revenue ? Number(r.totals.revenue) : 0,
    Expenses: r.totals?.expenses ? Number(r.totals.expenses) : 0
  }));

  const getRequiredTotal = (key) => totals.find(t => t.key === key) || { key, value: '' };
  const getOtherTotals = () => totals.filter(t => t.key !== 'revenue' && t.key !== 'expenses');
  const handleTotalChange = (idx, field, val) => {
    setTotals(totals => totals.map((t, i) => i === idx ? { ...t, [field]: val } : t));
  };
  const handleAddTotal = () => {
    setTotals([...totals, { key: '', value: '' }]);
  };
  const handleRemoveTotal = (idx) => {
    setTotals(totals => totals.filter((_, i) => i !== idx));
  };
  const revenueValue = Number(getRequiredTotal('revenue').value) || 0;
  const expensesValue = Number(getRequiredTotal('expenses').value) || 0;
  const liveProfit = revenueValue - expensesValue;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Financial Reports</h1>
          <p className="text-gray-600">View, add, and manage financial reports and analytics</p>
        </div>
        {canEdit && (
          <button onClick={() => setShowAddModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add Report</span>
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        <input type="text" placeholder="Search by period or type..." value={search} onChange={e => setSearch(e.target.value)} className="border px-2 py-1 rounded" />
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="border px-2 py-1 rounded">
          <option value="">All Types</option>
          <option value="annual">Annual</option>
          <option value="quarterly">Quarterly</option>
          <option value="monthly">Monthly</option>
          <option value="custom">Custom</option>
        </select>
        <input type="text" placeholder="Period (e.g. 2024 Q1)" value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)} className="border px-2 py-1 rounded" />
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded shadow p-4 text-center">
              <div className="text-gray-500">Total Revenue</div>
              <div className="text-2xl font-bold text-blue-700">Ksh{totalRevenue.toLocaleString()}</div>
            </div>
            <div className="bg-white rounded shadow p-4 text-center">
              <div className="text-gray-500">Total Expenses</div>
              <div className="text-2xl font-bold text-red-700">Ksh{totalExpenses.toLocaleString()}</div>
            </div>
            <div className="bg-white rounded shadow p-4 text-center">
              <div className="text-gray-500">Net Profit/Loss</div>
              <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>Ksh{netProfit.toLocaleString()}</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded shadow p-4">
              <h3 className="text-lg font-bold mb-2">Revenue vs Expenses (Pie)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieTotals} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {pieTotals.map((entry, idx) => <Cell key={`cell-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded shadow p-4">
              <h3 className="text-lg font-bold mb-2">Revenue & Expenses Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Revenue" stroke="#0088FE" strokeWidth={2} />
                  <Line type="monotone" dataKey="Expenses" stroke="#FF8042" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead>
              <tr>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Period</th>
                <th className="px-4 py-2">Totals</th>
                <th className="px-4 py-2">Notes</th>
                <th className="px-4 py-2">Created By</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-gray-500 py-8">No reports found.</td></tr>
              ) : filteredReports.map(report => (
                <tr key={report._id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 capitalize">{report.type}</td>
                  <td className="px-4 py-2">{report.period}</td>
                  <td className="px-4 py-2">
                    {report.totals && typeof report.totals === 'object' && Object.keys(report.totals).length > 0 ? (
                      <ul className="list-disc ml-4">
                        {Object.entries(report.totals).map(([k, v]) => (
                          <li key={k}><span className="font-medium">{k}:</span> {v}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-2">{report.notes}</td>
                  <td className="px-4 py-2">{report.createdBy?.firstName} {report.createdBy?.lastName}</td>
                  <td className="px-4 py-2 space-x-2">
                    <button 
                      className="text-blue-600 hover:underline" 
                      onClick={() => {
                        setViewReport(report);
                        setShowViewModal(true);
                      }}
                    >
                      <Eye className="inline h-4 w-4" />
                    </button>
                    {canEdit && <button className="text-red-600 hover:underline" onClick={() => handleDelete(report._id)}><Trash2 className="inline h-4 w-4" /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Add Report Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setShowAddModal(false)}>✕</button>
            <h2 className="text-lg font-bold mb-4">Add Financial Report</h2>
            <form onSubmit={handleAddReport} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select required value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full border px-3 py-2 rounded">
                  <option value="">Select type</option>
                  <option value="annual">Annual</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Period</label>
                <input required type="text" placeholder="e.g. 2024 Q1" value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))} className="w-full border px-3 py-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Totals</label>
                {/* Revenue row (required) */}
                <div className="flex gap-2 mb-2">
                  <input type="text" value="revenue" disabled className="border px-2 py-1 rounded w-1/2 bg-gray-100" />
                  <input type="number" required placeholder="Value" value={getRequiredTotal('revenue').value} onChange={e => handleTotalChange(totals.findIndex(t => t.key === 'revenue'), 'value', e.target.value)} className="border px-2 py-1 rounded w-1/3" />
                </div>
                {/* Expenses row (required) */}
                <div className="flex gap-2 mb-2">
                  <input type="text" value="expenses" disabled className="border px-2 py-1 rounded w-1/2 bg-gray-100" />
                  <input type="number" required placeholder="Value" value={getRequiredTotal('expenses').value} onChange={e => handleTotalChange(totals.findIndex(t => t.key === 'expenses'), 'value', e.target.value)} className="border px-2 py-1 rounded w-1/3" />
                </div>
                {/* Other totals (add/remove) */}
                {getOtherTotals().map((item, idx) => {
                  const realIdx = totals.findIndex((t, i) => t.key !== 'revenue' && t.key !== 'expenses' && i >= 2 && i === idx + 2);
                  return (
                    <div key={idx} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Key (e.g. profit)"
                        value={item.key}
                        onChange={e => handleTotalChange(realIdx, 'key', e.target.value)}
                        className="border px-2 py-1 rounded w-1/2"
                      />
                      <input
                        type="number"
                        placeholder="Value"
                        value={item.value}
                        onChange={e => handleTotalChange(realIdx, 'value', e.target.value)}
                        className="border px-2 py-1 rounded w-1/3"
                      />
                      <button type="button" className="text-red-500" onClick={() => handleRemoveTotal(realIdx)}>Remove</button>
                    </div>
                  );
                })}
                <button type="button" className="text-blue-600 mt-1" onClick={handleAddTotal}>+ Add Total</button>
                <div className="mt-2 text-green-700 font-semibold">Profit: Ksh{liveProfit.toLocaleString()}</div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full border px-3 py-2 rounded" />
              </div>
              <div className="flex justify-end">
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Add Report</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* View Report Modal */}
      {showViewModal && viewReport && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
            <button 
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" 
              onClick={() => setShowViewModal(false)}
            >
              ✕
            </button>
            <h2 className="text-lg font-bold mb-4">Financial Report Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Type</label>
                <p className="text-lg capitalize">{viewReport.type}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Period</label>
                <p className="text-lg">{viewReport.period}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Totals</label>
                {viewReport.totals && typeof viewReport.totals === 'object' && Object.keys(viewReport.totals).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(viewReport.totals).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="font-medium capitalize">{key}:</span>
                        <span className="text-lg">Ksh{Number(value).toLocaleString()}</span>
                      </div>
                    ))}
                    {viewReport.totals.revenue && viewReport.totals.expenses && (
                      <div className="flex justify-between items-center p-2 bg-green-50 rounded border border-green-200">
                        <span className="font-medium text-green-800">Profit:</span>
                        <span className={`text-lg font-bold ${(Number(viewReport.totals.revenue) - Number(viewReport.totals.expenses)) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          Ksh{(Number(viewReport.totals.revenue) - Number(viewReport.totals.expenses)).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-400">No totals available</p>
                )}
              </div>
              {viewReport.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-600">Notes</label>
                  <p className="text-lg">{viewReport.notes}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-600">Created By</label>
                <p className="text-lg">{viewReport.createdBy?.firstName} {viewReport.createdBy?.lastName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Created At</label>
                <p className="text-lg">{new Date(viewReport.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 