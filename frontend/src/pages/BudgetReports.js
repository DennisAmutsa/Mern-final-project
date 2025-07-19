import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { API_BASE_URL } from '../config/api';
import apiClient from '../config/axios';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A020F0', '#FF6384', '#36A2EB', '#FFCE56'];

export default function BudgetReports() {
  const [budgets, setBudgets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editBudget, setEditBudget] = useState(null);
  const [form, setForm] = useState({ department: '', year: '', allocated: '', spent: '', status: 'pending', notes: '' });
  const { user } = useAuth();
  const [filterYear, setFilterYear] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const canEdit = user && (user.role === 'admin' || user.role === 'finance');

  useEffect(() => {
    fetchBudgets();
    apiClient.get('/api/departments')
      .then(res => {
        setDepartments(Array.isArray(res.data) ? res.data : []);
      })
      .catch((error) => {
        console.error('Error fetching departments:', error);
        setDepartments([]);
      });
  }, []);

  const fetchBudgets = () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    // Debug logging
    console.log('Fetching budgets from:', apiClient.defaults.baseURL + '/api/budget');
    console.log('Token available:', !!token);
    
    apiClient.get('/api/budget')
      .then(res => {
        console.log('Budgets API Response:', res.data);
        setBudgets(Array.isArray(res.data) ? res.data : []);
      })
      .catch((error) => {
        console.error('Error fetching budgets:', error);
        console.error('Error details:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          data: error.response?.data
        });
        setBudgets([]);
      })
      .finally(() => setLoading(false));
  };

  const handleAddBudget = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      await apiClient.post('/api/budget', form);
      setShowAddModal(false);
      setForm({ department: '', year: '', allocated: '', spent: '', status: 'pending', notes: '' });
      fetchBudgets();
      toast.success('Budget added!');
    } catch (error) {
      console.error('Error adding budget:', error);
      toast.error('Failed to add budget');
    }
  };

  const handleEditBudget = (budget) => {
    setEditBudget(budget);
    setShowEditModal(true);
  };

  const handleUpdateBudget = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      await apiClient.put(`/api/budget/${editBudget._id}`, editBudget);
      setShowEditModal(false);
      setEditBudget(null);
      fetchBudgets();
      toast.success('Budget updated!');
    } catch (error) {
      console.error('Error updating budget:', error);
      toast.error('Failed to update budget');
    }
  };

  const handleDeleteBudget = async (id) => {
    if (!window.confirm('Delete this budget entry?')) return;
    const token = localStorage.getItem('token');
    try {
      await apiClient.delete(`/api/budget/${id}`);
      fetchBudgets();
      toast.success('Budget deleted');
    } catch (error) {
      console.error('Error deleting budget:', error);
      toast.error('Failed to delete budget');
    }
  };

  // Filtering
  const filteredBudgets = budgets.filter(b => {
    const matchesYear = !filterYear || String(b.year) === filterYear;
    const matchesDept = !filterDepartment || (b.department?._id || b.department) === filterDepartment;
    const matchesStatus = !filterStatus || b.status === filterStatus;
    return matchesYear && matchesDept && matchesStatus;
  });

  // Summary cards
  const totalAllocated = filteredBudgets.reduce((sum, b) => sum + (Number(b.allocated) || 0), 0);
  const totalSpent = filteredBudgets.reduce((sum, b) => sum + (Number(b.spent) || 0), 0);
  const netBalance = totalAllocated - totalSpent;

  // Pie chart data: Spent by department
  const pieData = departments.map(dep => {
    const spent = filteredBudgets.filter(b => (b.department?._id || b.department) === dep._id).reduce((sum, b) => sum + (Number(b.spent) || 0), 0);
    return { name: dep.name, value: spent };
  }).filter(d => d.value > 0);

  // Bar chart data: Allocated vs Spent per year
  const years = Array.from(new Set(filteredBudgets.map(b => b.year))).sort();
  const barData = years.map(year => {
    const yearBudgets = filteredBudgets.filter(b => b.year === year);
    return {
      year,
      Allocated: yearBudgets.reduce((sum, b) => sum + (Number(b.allocated) || 0), 0),
      Spent: yearBudgets.reduce((sum, b) => sum + (Number(b.spent) || 0), 0)
    };
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
      <h1 className="text-2xl font-bold mb-2">Budget Reports</h1>
          <p className="text-gray-600">Manage and review all budget entries</p>
        </div>
        {canEdit && (
          <button onClick={() => setShowAddModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">+ Add Budget</button>
        )}
      </div>
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="border px-2 py-1 rounded">
          <option value="">All Years</option>
          {Array.from(new Set(budgets.map(b => b.year))).sort().map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={filterDepartment} onChange={e => setFilterDepartment(e.target.value)} className="border px-2 py-1 rounded">
          <option value="">All Departments</option>
          {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border px-2 py-1 rounded">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="closed">Closed</option>
        </select>
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded shadow p-4 text-center">
          <div className="text-gray-500">Total Allocated</div>
          <div className="text-2xl font-bold text-blue-700">Ksh{totalAllocated.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded shadow p-4 text-center">
          <div className="text-gray-500">Total Spent</div>
          <div className="text-2xl font-bold text-red-700">Ksh{totalSpent.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded shadow p-4 text-center">
          <div className="text-gray-500">Net Balance</div>
          <div className="text-2xl font-bold text-green-700">Ksh{netBalance.toLocaleString()}</div>
        </div>
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded shadow p-4">
          <h3 className="text-lg font-bold mb-2">Spent by Department</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {pieData.map((entry, idx) => <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded shadow p-4">
          <h3 className="text-lg font-bold mb-2">Allocated vs Spent per Year</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Allocated" fill="#0088FE" />
              <Bar dataKey="Spent" fill="#FF8042" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead>
              <tr>
                <th className="px-4 py-2">Department</th>
                <th className="px-4 py-2">Year</th>
                <th className="px-4 py-2">Allocated</th>
                <th className="px-4 py-2">Spent</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Notes</th>
                <th className="px-4 py-2">Created By</th>
                {canEdit && <th className="px-4 py-2">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredBudgets.length === 0 ? (
                <tr><td colSpan={canEdit ? 8 : 7} className="text-center text-gray-500 py-8">No budget entries found.</td></tr>
              ) : filteredBudgets.map(budget => (
                <tr key={budget._id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{budget.department?.name}</td>
                  <td className="px-4 py-2">{budget.year}</td>
                  <td className="px-4 py-2">Ksh{Number(budget.allocated).toLocaleString()}</td>
                  <td className="px-4 py-2">Ksh{Number(budget.spent).toLocaleString()}</td>
                  <td className="px-4 py-2">{budget.status}</td>
                  <td className="px-4 py-2">{budget.notes}</td>
                  <td className="px-4 py-2">{budget.createdBy?.firstName} {budget.createdBy?.lastName}</td>
                  {canEdit && (
                    <td className="px-4 py-2 space-x-2">
                      <button className="text-green-600 hover:underline" onClick={() => handleEditBudget(budget)}>Edit</button>
                      <button className="text-red-600 hover:underline" onClick={() => handleDeleteBudget(budget._id)}>Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Add Budget Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setShowAddModal(false)}>✕</button>
            <h2 className="text-lg font-bold mb-4">Add New Budget</h2>
            <form onSubmit={handleAddBudget} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Department</label>
                <select required value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} className="w-full border px-3 py-2 rounded">
                  <option value="">Select department</option>
                  {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Year</label>
                <input required type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} className="w-full border px-3 py-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Allocated Amount (Ksh)</label>
                <input required type="number" value={form.allocated} onChange={e => setForm(f => ({ ...f, allocated: e.target.value }))} className="w-full border px-3 py-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Spent Amount (Ksh)</label>
                <input required type="number" value={form.spent} onChange={e => setForm(f => ({ ...f, spent: e.target.value }))} className="w-full border px-3 py-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select required value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full border px-3 py-2 rounded">
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full border px-3 py-2 rounded" />
              </div>
              <div className="flex justify-end">
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Add Budget</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Budget Modal */}
      {showEditModal && editBudget && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => { setShowEditModal(false); setEditBudget(null); }}>✕</button>
            <h2 className="text-lg font-bold mb-4">Edit Budget</h2>
            <form onSubmit={handleUpdateBudget} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Department</label>
                <select required value={editBudget.department?._id || editBudget.department} onChange={e => setEditBudget(b => ({ ...b, department: e.target.value }))} className="w-full border px-3 py-2 rounded">
                  <option value="">Select department</option>
                  {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Year</label>
                <input required type="number" value={editBudget.year} onChange={e => setEditBudget(b => ({ ...b, year: e.target.value }))} className="w-full border px-3 py-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Allocated Amount (Ksh)</label>
                <input required type="number" value={editBudget.allocated} onChange={e => setEditBudget(b => ({ ...b, allocated: e.target.value }))} className="w-full border px-3 py-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Spent Amount (Ksh)</label>
                <input required type="number" value={editBudget.spent} onChange={e => setEditBudget(b => ({ ...b, spent: e.target.value }))} className="w-full border px-3 py-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select required value={editBudget.status} onChange={e => setEditBudget(b => ({ ...b, status: e.target.value }))} className="w-full border px-3 py-2 rounded">
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea value={editBudget.notes} onChange={e => setEditBudget(b => ({ ...b, notes: e.target.value }))} className="w-full border px-3 py-2 rounded" />
              </div>
              <div className="flex justify-end">
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Update Budget</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 