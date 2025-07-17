import React, { useState, useEffect } from 'react';
import { UserCheck } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewDoctor, setViewDoctor] = useState(null);
  const [editDoctor, setEditDoctor] = useState(null);
  const [deleteDoctor, setDeleteDoctor] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/doctors`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDoctors(data);
        } else if (Array.isArray(data.doctors)) {
          setDoctors(data.doctors);
        } else {
          setDoctors([]);
        }
      })
      .catch(() => setDoctors([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.isArray(doctors) && doctors.length === 0 ? (
        <div className="col-span-full text-center text-gray-500 py-8">No doctors found.</div>
      ) : (
        Array.isArray(doctors) && doctors.map((doctor) => (
          <div key={doctor._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 card-hover flex flex-col justify-between">
            <div className="flex items-center space-x-4 mb-2">
              <UserCheck className="h-8 w-8 text-blue-600" />
              <div>
                <div className="font-bold text-lg">{doctor.firstName} {doctor.lastName}</div>
                <div className="text-gray-500 text-sm">{doctor.email}</div>
                <div className="text-gray-400 text-xs">Department: {doctor.department || '-'}</div>
                {doctor.specialization && <div className="text-gray-400 text-xs">Specialization: {doctor.specialization}</div>}
                {doctor.experience !== undefined && <div className="text-gray-400 text-xs">Experience: {doctor.experience} yrs</div>}
                {doctor.licenseNumber && <div className="text-gray-400 text-xs">License: {doctor.licenseNumber}</div>}
                {doctor.contactInfo?.phone && <div className="text-gray-400 text-xs">Phone: {doctor.contactInfo.phone}</div>}
                {doctor.status && <div className={`text-xs font-semibold ${doctor.status === 'Active' ? 'text-green-600' : 'text-yellow-600'}`}>Status: {doctor.status}</div>}
                {doctor.joinDate && <div className="text-gray-400 text-xs">Joined: {new Date(doctor.joinDate).toLocaleDateString()}</div>}
                {doctor.maxPatientsPerDay && <div className="text-gray-400 text-xs">Max Patients/Day: {doctor.maxPatientsPerDay}</div>}
              </div>
            </div>
            <div className="flex space-x-2 mt-4">
              <button onClick={() => setViewDoctor(doctor)} className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs">View</button>
              <button onClick={() => setEditDoctor(doctor)} className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-xs">Edit</button>
              <button onClick={() => setDeleteDoctor(doctor)} className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs">Delete</button>
            </div>
          </div>
        ))
      )}
      {/* View Modal */}
      {viewDoctor && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Doctor Details</h3>
            <div className="space-y-2">
              <div><span className="font-medium">Name:</span> {viewDoctor.firstName} {viewDoctor.lastName}</div>
              <div><span className="font-medium">Email:</span> {viewDoctor.email}</div>
              <div><span className="font-medium">Department:</span> {viewDoctor.department || '-'}</div>
              {viewDoctor.specialization && <div><span className="font-medium">Specialization:</span> {viewDoctor.specialization}</div>}
              {viewDoctor.experience !== undefined && <div><span className="font-medium">Experience:</span> {viewDoctor.experience} yrs</div>}
              {viewDoctor.licenseNumber && <div><span className="font-medium">License:</span> {viewDoctor.licenseNumber}</div>}
              {viewDoctor.contactInfo?.phone && <div><span className="font-medium">Phone:</span> {viewDoctor.contactInfo.phone}</div>}
              {viewDoctor.status && <div><span className="font-medium">Status:</span> {viewDoctor.status}</div>}
              {viewDoctor.joinDate && <div><span className="font-medium">Joined:</span> {new Date(viewDoctor.joinDate).toLocaleDateString()}</div>}
              {viewDoctor.maxPatientsPerDay && <div><span className="font-medium">Max Patients/Day:</span> {viewDoctor.maxPatientsPerDay}</div>}
              {viewDoctor.salary && <div><span className="font-medium">Salary:</span> Ksh {Number(viewDoctor.salary).toLocaleString()}</div>}
              {viewDoctor.languages && viewDoctor.languages.length > 0 && <div><span className="font-medium">Languages:</span> {viewDoctor.languages.join(', ')}</div>}
              {viewDoctor.certifications && viewDoctor.certifications.length > 0 && <div><span className="font-medium">Certifications:</span> {viewDoctor.certifications.join(', ')}</div>}
              {viewDoctor.education && viewDoctor.education.length > 0 && (
                <div><span className="font-medium">Education:</span>
                  <ul className="list-disc ml-6">
                    {viewDoctor.education.map((ed, i) => (
                      <li key={i}>{ed.degree} - {ed.institution} ({ed.year})</li>
                    ))}
                  </ul>
                </div>
              )}
              {viewDoctor.emergencyContact && (
                <div><span className="font-medium">Emergency Contact:</span> {viewDoctor.emergencyContact.name} ({viewDoctor.emergencyContact.relationship}) - {viewDoctor.emergencyContact.phone}</div>
              )}
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button type="button" onClick={() => setViewDoctor(null)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">Close</button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Modal */}
      {editDoctor && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Edit Doctor</h3>
            <form
              onSubmit={async e => {
                e.preventDefault();
                setSaving(true);
                try {
                  const payload = {
                    firstName: editDoctor.firstName,
                    lastName: editDoctor.lastName,
                    email: editDoctor.email,
                    phone: editDoctor.contactInfo?.phone
                  };
                  const token = localStorage.getItem('token');
                  const response = await fetch(`${API_BASE_URL}/api/doctors/${editDoctor._id}`, {
                    method: 'PUT',
                    headers: { 
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                  });
                  
                  if (!response.ok) {
                    throw new Error('Failed to update doctor');
                  }
                  setEditDoctor(null);
                  setSaving(false);
                  // Refresh doctors
                  const res = await fetch(`${API_BASE_URL}/api/doctors`);
                  const data = await res.json();
                  setDoctors(Array.isArray(data) ? data : (Array.isArray(data.doctors) ? data.doctors : []));
                } catch (err) {
                  setSaving(false);
                  alert('Failed to update doctor.');
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-gray-700">First Name</label>
                <input type="text" className="w-full border rounded px-3 py-2" value={editDoctor.firstName} onChange={e => setEditDoctor({ ...editDoctor, firstName: e.target.value })} required />
              </div>
              <div>
                <label className="block text-gray-700">Last Name</label>
                <input type="text" className="w-full border rounded px-3 py-2" value={editDoctor.lastName} onChange={e => setEditDoctor({ ...editDoctor, lastName: e.target.value })} required />
              </div>
              <div>
                <label className="block text-gray-700">Email</label>
                <input type="email" className="w-full border rounded px-3 py-2" value={editDoctor.email} onChange={e => setEditDoctor({ ...editDoctor, email: e.target.value })} required />
              </div>
              <div>
                <label className="block text-gray-700">Phone</label>
                <input type="text" className="w-full border rounded px-3 py-2" value={editDoctor.contactInfo?.phone || ''} onChange={e => setEditDoctor({ ...editDoctor, contactInfo: { ...editDoctor.contactInfo, phone: e.target.value } })} />
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button type="button" onClick={() => setEditDoctor(null)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Modal */}
      {deleteDoctor && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Delete Doctor</h3>
            <p>Are you sure you want to delete <span className="font-semibold">{deleteDoctor.firstName} {deleteDoctor.lastName}</span>?</p>
            <div className="flex justify-end space-x-2 mt-4">
              <button type="button" onClick={() => setDeleteDoctor(null)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">Cancel</button>
              <button
                type="button"
                onClick={async () => {
                  setSaving(true);
                  try {
                    const token = localStorage.getItem('token');
                    const response = await fetch(`${API_BASE_URL}/api/doctors/${deleteDoctor._id}`, { 
                      method: 'DELETE',
                      headers: {
                        'Authorization': `Bearer ${token}`
                      }
                    });
                    
                    if (!response.ok) {
                      throw new Error('Failed to delete doctor');
                    }
                    
                    setDeleteDoctor(null);
                    setSaving(false);
                    // Refresh doctors
                    const res = await fetch(`${API_BASE_URL}/api/doctors`);
                    const data = await res.json();
                    setDoctors(Array.isArray(data) ? data : (Array.isArray(data.doctors) ? data.doctors : []));
                  } catch (err) {
                    setSaving(false);
                    alert('Failed to delete doctor: ' + err.message);
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                disabled={saving}
              >{saving ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Doctors; 