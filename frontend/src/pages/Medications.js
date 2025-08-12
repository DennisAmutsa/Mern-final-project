import React, { useState, useEffect } from 'react';
import { 
  Syringe, 
  Clock, 
  User, 
  AlertTriangle, 
  CheckCircle, 
  Plus,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';
import apiClient from '../config/axios';
import toast from 'react-hot-toast';

const Medications = () => {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestData, setRequestData] = useState({
    patientId: '',
    medicationName: '',
    dosage: '',
    frequency: '',
    reason: '',
    urgency: 'Normal',
    notes: ''
  });
  const [patients, setPatients] = useState([]);


  useEffect(() => {
    fetchMedications();
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await apiClient.get('/api/users?roles=user');
      setPatients(response.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const fetchMedications = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/users?roles=user');
      const allPatients = response.data;
      
      console.log('Fetched patients:', allPatients);
      
      // Extract medications from all patients
      const allMedications = [];
      allPatients.forEach(patient => {
        console.log(`Patient ${patient.firstName} ${patient.lastName}:`, patient.currentMedications);
        
                 if (patient.currentMedications && Array.isArray(patient.currentMedications) && patient.currentMedications.length > 0) {
           patient.currentMedications.forEach(med => {
             // Only include medications that have at least a medication name
             if (med && typeof med === 'object' && med.name) {
               allMedications.push({
                 ...med,
                 medication: med.name, // Map 'name' to 'medication' for consistency
                 patientId: patient._id,
                 patientName: `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Unknown Patient',
                 patientRoom: patient.room || 'N/A'
               });
             }
           });
         }
      });
      
      console.log('Extracted medications:', allMedications);
      setMedications(allMedications);
    } catch (error) {
      toast.error('Failed to fetch medications');
      console.error('Error fetching medications:', error);
         } finally {
       setLoading(false);
     }
   };

   const handleRequestMedication = async () => {
     if (!requestData.patientId || !requestData.medicationName || !requestData.dosage || !requestData.reason) {
       toast.error('Please fill in all required fields');
       return;
     }

     try {
       // For now, we'll just show a success message since we don't have a medication request endpoint
       // In a real system, this would send a request to doctors/admins
       toast.success('Medication request submitted successfully! A doctor will review your request.');
       
       // Reset form
       setRequestData({
         patientId: '',
         medicationName: '',
         dosage: '',
         frequency: '',
         reason: '',
         urgency: 'Normal',
         notes: ''
       });
       setShowRequestModal(false);
       
       // In a real implementation, you would send this to a medication request endpoint
       console.log('Medication Request:', {
         ...requestData,
         requestedBy: 'Nurse', // This would come from the logged-in user
         requestedAt: new Date().toISOString(),
         status: 'Pending'
       });
       
     } catch (error) {
       toast.error('Failed to submit medication request');
       console.error('Error submitting medication request:', error);
     }
   };







  const filteredMedications = medications.filter(med => {
    // Add null checks and data validation
    if (!med || typeof med !== 'object') return false;
    
    const medicationName = med.medication || '';
    const patientName = med.patientName || '';
    const status = med.status || '';
    
    const matchesSearch = medicationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Completed': return 'bg-blue-100 text-blue-800';
      case 'Discontinued': return 'bg-red-100 text-red-800';
      case 'On Hold': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (medication) => {
    // Simple logic to determine priority based on medication type and frequency
    if (medication.frequency === 'Every 4 hours' || medication.frequency === 'Every 6 hours') {
      return 'bg-red-100 text-red-800';
    } else if (medication.frequency === 'Every 8 hours' || medication.frequency === 'Twice daily') {
      return 'bg-yellow-100 text-yellow-800';
    } else {
      return 'bg-green-100 text-green-800';
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
                 <h1 className="text-2xl font-bold text-gray-900">Medications Management</h1>
       <p className="text-gray-600">Monitor and administer patient medications</p>
        </div>
        <div className="flex items-center space-x-2">
                     <button
             onClick={fetchMedications}
             className="flex items-center space-x-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
           >
             <RefreshCw className="h-4 w-4" />
             <span>Refresh</span>
           </button>
                       <button
              onClick={() => {
                toast.info('Sample medications can only be added by doctors. Please contact a doctor to add medications for testing.');
              }}
              className="flex items-center space-x-2 px-4 py-2 text-gray-400 border border-gray-200 rounded-lg cursor-not-allowed"
              disabled
              title="Only doctors can add medications"
            >
              <Plus className="h-4 w-4" />
              <span>Add Sample Data</span>
            </button>
                     <button
             onClick={() => setShowRequestModal(true)}
             className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
             title="Request medication from a doctor"
           >
             <Plus className="h-4 w-4" />
             <span>Request Medication</span>
           </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Syringe className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Medications</p>
              <p className="text-2xl font-bold text-gray-900">{medications.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {medications.filter(m => m.status === 'Active').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">On Hold</p>
              <p className="text-2xl font-bold text-gray-900">
                {medications.filter(m => m.status === 'On Hold').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Discontinued</p>
              <p className="text-2xl font-bold text-gray-900">
                {medications.filter(m => m.status === 'Discontinued').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search medications or patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
              <option value="Discontinued">Discontinued</option>
            </select>
          </div>
        </div>
      </div>

      {/* Medications List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Medication Administration</h3>
        </div>
        <div className="p-6">
          {filteredMedications.length > 0 ? (
            <div className="space-y-4">
              {filteredMedications.map((medication, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                                             <div className="flex items-center space-x-2 mb-2">
                         <h4 className="font-medium text-gray-900">{medication.medication || 'Unknown Medication'}</h4>
                         <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(medication.status)}`}>
                           {medication.status || 'Unknown'}
                         </span>
                         <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(medication)}`}>
                           {medication.frequency || 'As needed'}
                         </span>
                       </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                                                 <div className="flex items-center space-x-1">
                           <User className="h-4 w-4" />
                           <span>{medication.patientName || 'Unknown Patient'}</span>
                           <span className="text-gray-400">•</span>
                           <span>Room {medication.patientRoom || 'N/A'}</span>
                         </div>
                         <div className="flex items-center space-x-1">
                           <Syringe className="h-4 w-4" />
                           <span>{medication.dosage || 'N/A'}</span>
                         </div>
                         <div className="flex items-center space-x-1">
                           <Clock className="h-4 w-4" />
                           <span>{medication.frequency || 'As needed'}</span>
                         </div>
                      </div>
                                             {medication.notes && (
                         <p className="text-sm text-gray-600 mt-2">
                           <span className="font-medium">Notes:</span> {medication.notes}
                         </p>
                       )}
                    </div>
                                         <div className="flex items-center space-x-2">
                       <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(medication.status)}`}>
                         {medication.status || 'Active'}
                       </span>
                     </div>
                  </div>
                                     <div className="flex items-center justify-between text-xs text-gray-500">
                     <div>
                       <span>Prescribed: {medication.prescribedDate ? new Date(medication.prescribedDate).toLocaleDateString() : 'Unknown'}</span>
                       {medication.endDate && (
                         <span className="ml-4">End: {new Date(medication.endDate).toLocaleDateString()}</span>
                       )}
                     </div>
                     <div>
                       <span>By: {medication.prescribedBy || 'Unknown'}</span>
                     </div>
                   </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Syringe className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Medications Found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'No medications have been prescribed yet'
                }
              </p>
                             <p className="text-sm text-gray-500">
                 Contact a doctor to prescribe medications for patients
               </p>
            </div>
          )}
        </div>
      </div>

             {/* Nursing Responsibilities Notice */}
       <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
         <div className="flex items-start">
           <div className="flex-shrink-0">
             <AlertTriangle className="h-5 w-5 text-blue-600" />
           </div>
           <div className="ml-3">
             <h3 className="text-sm font-medium text-blue-800">Nursing Responsibilities</h3>
             <div className="mt-2 text-sm text-blue-700">
               <p>As a nurse, you can:</p>
               <ul className="list-disc list-inside mt-1 space-y-1">
                 <li>Monitor and administer prescribed medications</li>
                 <li>Document medication administration</li>
                 <li>Report adverse reactions to doctors</li>
                 <li>Update medication status (Active, On Hold, Completed, Discontinued)</li>
               </ul>
               <p className="mt-2 font-medium">Note: Only doctors can prescribe new medications.</p>
             </div>
           </div>
                  </div>
       </div>

       {/* Medication Request Modal */}
       {showRequestModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-lg font-medium text-gray-900">Request Medication</h3>
               <button
                 onClick={() => setShowRequestModal(false)}
                 className="text-gray-400 hover:text-gray-600"
               >
                 <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
             </div>
             
             <div className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">Patient *</label>
                 <select 
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   value={requestData.patientId}
                   onChange={(e) => setRequestData({...requestData, patientId: e.target.value})}
                 >
                   <option value="">Select a patient</option>
                   {patients.map(patient => (
                     <option key={patient._id} value={patient._id}>
                       {patient.firstName} {patient.lastName} - Room {patient.room || 'N/A'}
                     </option>
                   ))}
                 </select>
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">Medication Name *</label>
                 <input
                   type="text"
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   placeholder="e.g., Amoxicillin, Ibuprofen"
                   value={requestData.medicationName}
                   onChange={(e) => setRequestData({...requestData, medicationName: e.target.value})}
                 />
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">Dosage *</label>
                 <input
                   type="text"
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   placeholder="e.g., 500mg, 10ml"
                   value={requestData.dosage}
                   onChange={(e) => setRequestData({...requestData, dosage: e.target.value})}
                 />
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                 <select
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   value={requestData.frequency}
                   onChange={(e) => setRequestData({...requestData, frequency: e.target.value})}
                 >
                   <option value="">Select frequency</option>
                   <option value="Once daily">Once daily</option>
                   <option value="Twice daily">Twice daily</option>
                   <option value="Three times daily">Three times daily</option>
                   <option value="Every 4 hours">Every 4 hours</option>
                   <option value="Every 6 hours">Every 6 hours</option>
                   <option value="Every 8 hours">Every 8 hours</option>
                   <option value="As needed">As needed</option>
                 </select>
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Request *</label>
                 <textarea
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   rows="3"
                   placeholder="Explain why this medication is needed..."
                   value={requestData.reason}
                   onChange={(e) => setRequestData({...requestData, reason: e.target.value})}
                 />
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">Urgency</label>
                 <select
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   value={requestData.urgency}
                   onChange={(e) => setRequestData({...requestData, urgency: e.target.value})}
                 >
                   <option value="Normal">Normal</option>
                   <option value="Urgent">Urgent</option>
                   <option value="Emergency">Emergency</option>
                 </select>
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
                 <textarea
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   rows="2"
                   placeholder="Any additional information..."
                   value={requestData.notes}
                   onChange={(e) => setRequestData({...requestData, notes: e.target.value})}
                 />
               </div>
             </div>

             <div className="flex items-center justify-end space-x-3 mt-6">
               <button
                 onClick={() => setShowRequestModal(false)}
                 className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
               >
                 Cancel
               </button>
               <button
                 onClick={handleRequestMedication}
                 className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
               >
                 Submit Request
               </button>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 };

export default Medications;
