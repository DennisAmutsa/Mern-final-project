import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Calendar,
  User,
  FileText,
  Tag,
  Clock,
  Eye,
  Edit,
  Trash2,
  X
} from 'lucide-react';
import apiClient from '../config/axios';
import toast from 'react-hot-toast';

const PatientNotes = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showAddNote, setShowAddNote] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    fetchNotes();
    fetchPatients();
  }, []);

  const fetchNotes = async () => {
    try {
      const response = await apiClient.get('/api/patient-notes');
      setNotes(response.data);
    } catch (error) {
      toast.error('Failed to fetch patient notes');
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await apiClient.get('/api/stats/nurse-dashboard');
      setPatients(response.data.patients || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim() || !selectedPatient) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      await apiClient.post('/api/patient-notes', {
        patientId: selectedPatient._id,
        note: noteText,
        type: 'nursing_note'
      });
      toast.success('Note added successfully');
      setNoteText('');
      setSelectedPatient(null);
      setShowAddNote(false);
      fetchNotes(); // Refresh the list
    } catch (error) {
      toast.error('Failed to add note');
      console.error('Error adding note:', error);
    }
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = 
      note.patient?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.patient?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.note?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.createdBy?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.createdBy?.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || note.type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const getNoteTypeColor = (type) => {
    switch (type) {
      case 'nursing_note':
        return 'bg-blue-100 text-blue-800';
      case 'doctor_note':
        return 'bg-green-100 text-green-800';
      case 'shift_handover':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getNoteTypeLabel = (type) => {
    return type.replace('_', ' ').toUpperCase();
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
          <h1 className="text-2xl font-bold text-gray-900">Patient Notes</h1>
          <p className="text-gray-600">Manage and view all patient notes</p>
        </div>
        <button
          onClick={() => setShowAddNote(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Note</span>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search notes by patient name, content, or nurse..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="nursing_note">Nursing Notes</option>
            <option value="doctor_note">Doctor Notes</option>
            <option value="shift_handover">Shift Handover</option>
          </select>
        </div>
      </div>

      {/* Notes List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            All Notes ({filteredNotes.length})
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredNotes.length > 0 ? (
            filteredNotes.map((note, index) => (
              <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {note.patient?.firstName} {note.patient?.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Created by: {note.createdBy?.firstName} {note.createdBy?.lastName}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getNoteTypeColor(note.type)}`}>
                      {getNoteTypeLabel(note.type)}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(note.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="text-sm text-gray-700 mb-3">
                  {note.note}
                </div>
                
                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {note.tags.map((tag, tagIndex) => (
                      <span key={tagIndex} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(note.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="text-blue-600 hover:text-blue-800">
                      <Eye className="h-3 w-3" />
                    </button>
                    <button className="text-gray-600 hover:text-gray-800">
                      <Edit className="h-3 w-3" />
                    </button>
                    <button className="text-red-600 hover:text-red-800">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No notes found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || filterType !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by adding a new patient note.'
                }
              </p>
              {!searchTerm && filterType === 'all' && (
                <div className="mt-6">
                  <button
                    onClick={() => setShowAddNote(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Note
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Note Modal */}
      {showAddNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add Patient Note</h3>
              <button 
                onClick={() => setShowAddNote(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Patient</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={selectedPatient?._id || ''}
                  onChange={(e) => {
                    const patient = patients.find(p => p._id === e.target.value);
                    setSelectedPatient(patient);
                  }}
                >
                  <option value="">Select a patient</option>
                  {patients.map(patient => (
                    <option key={patient._id} value={patient._id}>
                      {patient.firstName} {patient.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Note</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="4"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Enter nursing note..."
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAddNote(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddNote}
                  className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Add Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientNotes;
