import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { API_BASE_URL } from '../config/api';
import apiClient from '../config/axios';

export default function BillingOverview() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ patient: '', services: [{ name: '', cost: 0 }], amount: 0, dueDate: '', notes: '' });
  const [patients, setPatients] = useState([]);
  const [editBill, setEditBill] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPatient, setFilterPatient] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [viewBill, setViewBill] = useState(null);
  const { user } = useAuth();

  const canEdit = user && (user.role === 'admin' || user.role === 'finance');

  useEffect(() => {
    fetchBills();
    apiClient.get('/api/users?roles=user,patient')
      .then(res => {
        setPatients(Array.isArray(res.data) ? res.data : []);
      })
      .catch((error) => {
        console.error('Error fetching patients:', error);
        setPatients([]);
      });
  }, []);

  const fetchBills = () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    apiClient.get('/api/billing')
      .then(res => {
        setBills(Array.isArray(res.data) ? res.data : []);
      })
      .catch((error) => {
        console.error('Error fetching bills:', error);
        setBills([]);
      })
      .finally(() => setLoading(false));
  };

  const handleAddBill = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      await apiClient.post('/api/billing', form);
      setShowAddModal(false);
      setForm({ patient: '', services: [{ name: '', cost: 0 }], amount: 0, dueDate: '', notes: '' });
      fetchBills();
      toast.success('Bill added!');
    } catch (error) {
      console.error('Error adding bill:', error);
      toast.error('Failed to add bill');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this bill?')) return;
    try {
      const token = localStorage.getItem('token');
      await apiClient.delete(`/api/billing/${id}`);
      fetchBills();
      toast.success('Bill deleted');
    } catch (error) {
      console.error('Error deleting bill:', error);
      toast.error('Failed to delete bill');
    }
  };

  const statusOptions = ["unpaid", "paid", "overdue", "cancelled"];

  const handleStatusChange = async (billId, newStatus) => {
    if (!window.confirm(`Are you sure you want to change the status to "${newStatus}"?`)) return;
    const token = localStorage.getItem('token');
    try {
      await apiClient.put(`/api/billing/${billId}`, { status: newStatus });
      fetchBills();
    } catch (error) {
      console.error('Error updating bill status:', error);
      toast.error('Failed to update bill status');
    }
  };

  // Filtered bills
  const filteredBills = bills.filter(bill => {
    const matchesSearch = !search || (bill.patient?.firstName + ' ' + bill.patient?.lastName).toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !filterStatus || bill.status === filterStatus;
    const matchesPatient = !filterPatient || bill.patient?._id === filterPatient;
    const matchesDate = !filterDate || (bill.dueDate && new Date(bill.dueDate).toISOString().slice(0,10) === filterDate);
    return matchesSearch && matchesStatus && matchesPatient && matchesDate;
  });

  const handleDownloadPDF = async () => {
    const input = document.getElementById('bill-details-pdf');
    if (!input) return;
    const canvas = await html2canvas(input);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 40;
    const imgHeight = canvas.height * imgWidth / canvas.width;
    pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight);
    pdf.save('bill-details.pdf');
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Billing Overview</h1>
          <p className="text-gray-600">Manage and review all patient bills</p>
        </div>
        {canEdit && (
          <button onClick={() => setShowAddModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add Bill</span>
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        <input type="text" placeholder="Search by patient name..." value={search} onChange={e => setSearch(e.target.value)} className="border px-2 py-1 rounded" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border px-2 py-1 rounded">
          <option value="">All Statuses</option>
          <option value="unpaid">Unpaid</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select value={filterPatient} onChange={e => setFilterPatient(e.target.value)} className="border px-2 py-1 rounded">
          <option value="">All Patients</option>
          {patients.map(p => <option key={p._id} value={p._id}>{p.firstName} {p.lastName}</option>)}
        </select>
        <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="border px-2 py-1 rounded" />
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead>
              <tr>
                <th className="px-4 py-2">Patient</th>
                <th className="px-4 py-2">Services</th>
                <th className="px-4 py-2">Amount</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Due Date</th>
                <th className="px-4 py-2">Created By</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-gray-500 py-8">No bills found.</td></tr>
              ) : filteredBills.map(bill => (
                <tr key={bill._id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{bill.patient?.firstName} {bill.patient?.lastName}</td>
                  <td className="px-4 py-2">
                    <ul className="list-disc ml-4">
                      {bill.services.map((s, i) => <li key={i}>{s.name} (Ksh{s.cost})</li>)}
                    </ul>
                  </td>
                  <td className="px-4 py-2">Ksh{bill.amount}</td>
                  <td className="px-4 py-2">
                    {user?.role === 'admin' ? (
                      <select
                        value={bill.status}
                        onChange={e => handleStatusChange(bill._id, e.target.value)}
                        className={`border rounded px-2 py-1 text-xs
                          ${bill.status === 'paid' ? 'bg-green-100 text-green-800' :
                            bill.status === 'overdue' ? 'bg-yellow-100 text-yellow-800' :
                            bill.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'}
                        `}
                      >
                        {statusOptions.map(opt => (
                          <option key={opt} value={opt} className={
                            opt === 'paid' ? 'text-green-800' :
                            opt === 'overdue' ? 'text-yellow-800' :
                            opt === 'cancelled' ? 'text-red-800' :
                            'text-gray-800'
                          }>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium
                        ${bill.status === 'paid' ? 'bg-green-100 text-green-800' :
                          bill.status === 'overdue' ? 'bg-yellow-100 text-yellow-800' :
                          bill.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'}
                      `}>
                        {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">{bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-2">{bill.createdBy?.firstName} {bill.createdBy?.lastName}</td>
                  <td className="px-4 py-2 space-x-2">
                    <button className="text-blue-600 hover:underline" onClick={() => setViewBill(bill)}><Eye className="inline h-4 w-4" /></button>
                    {canEdit && <button className="text-green-600 hover:underline" onClick={() => setEditBill(bill)}><Edit className="inline h-4 w-4" /></button>}
                    {canEdit && <button className="text-red-600 hover:underline" onClick={() => handleDelete(bill._id)}><Trash2 className="inline h-4 w-4" /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Add Bill Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setShowAddModal(false)}>✕</button>
            <h2 className="text-lg font-bold mb-4">Add New Bill</h2>
            <form onSubmit={handleAddBill} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Patient</label>
                <select required value={form.patient} onChange={e => setForm(f => ({ ...f, patient: e.target.value }))} className="w-full border px-3 py-2 rounded">
                  <option value="">Select patient</option>
                  {patients.map(p => <option key={p._id} value={p._id}>{p.firstName} {p.lastName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Services</label>
                {form.services.map((s, i) => (
                  <div key={i} className="flex space-x-2 mb-2">
                    <input required type="text" placeholder="Service name" value={s.name} onChange={e => setForm(f => { const sv = [...f.services]; sv[i].name = e.target.value; return { ...f, services: sv }; })} className="border px-2 py-1 rounded w-1/2" />
                    <input required type="number" placeholder="Cost" value={s.cost} onChange={e => setForm(f => { const sv = [...f.services]; sv[i].cost = parseFloat(e.target.value) || 0; return { ...f, services: sv }; })} className="border px-2 py-1 rounded w-1/3" />
                    {form.services.length > 1 && <button type="button" className="text-red-500" onClick={() => setForm(f => ({ ...f, services: f.services.filter((_, idx) => idx !== i) }))}>Remove</button>}
                  </div>
                ))}
                <button type="button" className="text-blue-600 mt-1" onClick={() => setForm(f => ({ ...f, services: [...f.services, { name: '', cost: 0 }] }))}>+ Add Service</button>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Total Amount</label>
                <input required type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} className="w-full border px-3 py-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Due Date</label>
                <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} className="w-full border px-3 py-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full border px-3 py-2 rounded" />
              </div>
              <div className="flex justify-end">
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Add Bill</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Bill Modal */}
      {editBill && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setEditBill(null)}>✕</button>
            <h2 className="text-lg font-bold mb-4">Edit Bill</h2>
            <form onSubmit={async e => {
              e.preventDefault();
              try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE_URL}/api/billing/${editBill._id}`, {
                  method: 'PUT',
                  headers: { 
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                  },
                  body: JSON.stringify(editBill)
                });
                if (res.ok) {
                  setEditBill(null);
                  fetchBills();
                  toast.success('Bill updated!');
                } else {
                  const errorData = await res.json().catch(() => ({}));
                  toast.error(errorData.error || 'Failed to update bill');
                }
              } catch (error) {
                console.error('Error updating bill:', error);
                toast.error('Failed to update bill');
              }
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Patient</label>
                <select required value={typeof editBill.patient === 'object' ? editBill.patient._id : editBill.patient} onChange={e => setEditBill(f => ({ ...f, patient: e.target.value }))} className="w-full border px-3 py-2 rounded">
                  <option value="">Select patient</option>
                  {patients.map(p => <option key={p._id} value={p._id}>{p.firstName} {p.lastName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Services</label>
                {editBill.services.map((s, i) => (
                  <div key={i} className="flex space-x-2 mb-2">
                    <input required type="text" placeholder="Service name" value={s.name} onChange={e => setEditBill(b => { const sv = [...b.services]; sv[i].name = e.target.value; return { ...b, services: sv }; })} className="border px-2 py-1 rounded w-1/2" />
                    <input required type="number" placeholder="Cost" value={s.cost} onChange={e => setEditBill(b => { const sv = [...b.services]; sv[i].cost = parseFloat(e.target.value) || 0; return { ...b, services: sv }; })} className="border px-2 py-1 rounded w-1/3" />
                    {editBill.services.length > 1 && <button type="button" className="text-red-500" onClick={() => setEditBill(b => ({ ...b, services: b.services.filter((_, idx) => idx !== i) }))}>Remove</button>}
                  </div>
                ))}
                <button type="button" className="text-blue-600 mt-1" onClick={() => setEditBill(b => ({ ...b, services: [...b.services, { name: '', cost: 0 }] }))}>+ Add Service</button>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Total Amount</label>
                <input required type="number" value={editBill.amount} onChange={e => setEditBill(b => ({ ...b, amount: parseFloat(e.target.value) || 0 }))} className="w-full border px-3 py-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Due Date</label>
                <input type="date" value={editBill.dueDate ? editBill.dueDate.slice(0,10) : ''} onChange={e => setEditBill(b => ({ ...b, dueDate: e.target.value }))} className="w-full border px-3 py-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select value={editBill.status} onChange={e => setEditBill(b => ({ ...b, status: e.target.value }))} className="w-full border px-3 py-2 rounded">
                  <option value="unpaid">Unpaid</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea value={editBill.notes} onChange={e => setEditBill(b => ({ ...b, notes: e.target.value }))} className="w-full border px-3 py-2 rounded" />
              </div>
              <div className="flex justify-end">
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Update Bill</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* View Bill Modal */}
      {viewBill && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setViewBill(null)}>✕</button>
            <button className="absolute top-2 left-2 text-gray-400 hover:text-gray-700" onClick={handleDownloadPDF} title="Download PDF">📄</button>
            <h2 className="text-lg font-bold mb-4">Bill Details</h2>
            <div className="space-y-2" id="bill-details-pdf">
              <div><strong>Patient:</strong> {viewBill.patient?.firstName} {viewBill.patient?.lastName}</div>
              <div><strong>Services:</strong>
                <ul className="list-disc ml-4">
                  {viewBill.services.map((s, i) => <li key={i}>{s.name} (Ksh{s.cost})</li>)}
                </ul>
              </div>
              <div><strong>Amount:</strong> Ksh{viewBill.amount}</div>
              <div><strong>Status:</strong> {viewBill.status}</div>
              <div><strong>Due Date:</strong> {viewBill.dueDate ? new Date(viewBill.dueDate).toLocaleDateString() : '-'}</div>
              <div><strong>Created By:</strong> {viewBill.createdBy?.firstName} {viewBill.createdBy?.lastName}</div>
              <div><strong>Notes:</strong> {viewBill.notes}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 