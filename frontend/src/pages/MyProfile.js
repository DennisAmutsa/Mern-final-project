import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Heart, 
  Shield, 
  Save, 
  X, 
  Edit3,
  Calendar,
  MapPin,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../config/axios';
import toast from 'react-hot-toast';

const MyProfile = () => {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.contactInfo?.phone || '',
    bloodType: user?.bloodType || 'A+',
    emergencyContactName: user?.emergencyContact?.name || '',
    emergencyContactRelationship: user?.emergencyContact?.relationship || '',
    emergencyContactPhone: user?.emergencyContact?.phone || '',
    insuranceProvider: user?.insurance?.provider || '',
    insurancePolicyNumber: user?.insurance?.policyNumber || '',
    insuranceGroupNumber: user?.insurance?.groupNumber || '',
    insuranceExpiryDate: user?.insurance?.expiryDate ? new Date(user.insurance.expiryDate).toISOString().split('T')[0] : '',
  });

  const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.contactInfo?.phone || '',
        bloodType: user.bloodType || 'A+',
        emergencyContactName: user.emergencyContact?.name || '',
        emergencyContactRelationship: user.emergencyContact?.relationship || '',
        emergencyContactPhone: user.emergencyContact?.phone || '',
        insuranceProvider: user.insurance?.provider || '',
        insurancePolicyNumber: user.insurance?.policyNumber || '',
        insuranceGroupNumber: user.insurance?.groupNumber || '',
        insuranceExpiryDate: user.insurance?.expiryDate ? new Date(user.insurance.expiryDate).toISOString().split('T')[0] : '',
      });
    }
  }, [user]);

  const handleSave = async () => {
    // Validate required fields
    if (!profileData.firstName || !profileData.lastName || !profileData.email) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.put('/api/auth/profile', {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
        contactInfo: { phone: profileData.phone },
        bloodType: profileData.bloodType,
        emergencyContact: {
          name: profileData.emergencyContactName,
          relationship: profileData.emergencyContactRelationship,
          phone: profileData.emergencyContactPhone
        },
        insurance: {
          provider: profileData.insuranceProvider,
          policyNumber: profileData.insurancePolicyNumber,
          groupNumber: profileData.insuranceGroupNumber,
          expiryDate: profileData.insuranceExpiryDate ? new Date(profileData.insuranceExpiryDate) : null
        }
      });

      toast.success('Profile updated successfully!');
      setEditing(false);
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setProfileData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.contactInfo?.phone || '',
      bloodType: user?.bloodType || 'A+',
      emergencyContactName: user?.emergencyContact?.name || '',
      emergencyContactRelationship: user?.emergencyContact?.relationship || '',
      emergencyContactPhone: user?.emergencyContact?.phone || '',
      insuranceProvider: user?.insurance?.provider || '',
      insurancePolicyNumber: user?.insurance?.policyNumber || '',
      insuranceGroupNumber: user?.insurance?.groupNumber || '',
      insuranceExpiryDate: user?.insurance?.expiryDate ? new Date(user.insurance.expiryDate).toISOString().split('T')[0] : '',
    });
    setEditing(false);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <div>Please log in to view your profile.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600">Manage your personal information and health details</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <User className="h-4 w-4" />
          <span>Personal Portal</span>
          <span>•</span>
          <span>{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* SDG 3 Banner */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
        <div className="flex items-center space-x-3">
          <Heart className="h-8 w-8" />
          <div>
            <h2 className="text-xl font-bold"> Good Health and Well-being</h2>
            <p className="text-green-100">Your health information helps us provide better care</p>
          </div>
        </div>
      </div>

      {/* Profile Information Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Edit3 className="h-4 w-4" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {editing ? (
            <form className="space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Health Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Health Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Blood Type
                    </label>
                    <select
                      value={profileData.bloodType}
                      onChange={(e) => setProfileData({ ...profileData, bloodType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {BLOOD_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Emergency Contact</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Name
                        </label>
                        <input
                          type="text"
                          value={profileData.emergencyContactName}
                          onChange={(e) => setProfileData({ ...profileData, emergencyContactName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Relationship
                        </label>
                        <input
                          type="text"
                          value={profileData.emergencyContactRelationship}
                          onChange={(e) => setProfileData({ ...profileData, emergencyContactRelationship: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={profileData.emergencyContactPhone}
                          onChange={(e) => setProfileData({ ...profileData, emergencyContactPhone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Insurance Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Insurance Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Insurance Provider
                    </label>
                    <input
                      type="text"
                      value={profileData.insuranceProvider}
                      onChange={(e) => setProfileData({ ...profileData, insuranceProvider: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Policy Number
                    </label>
                    <input
                      type="text"
                      value={profileData.insurancePolicyNumber}
                      onChange={(e) => setProfileData({ ...profileData, insurancePolicyNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Group Number
                    </label>
                    <input
                      type="text"
                      value={profileData.insuranceGroupNumber}
                      onChange={(e) => setProfileData({ ...profileData, insuranceGroupNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      value={profileData.insuranceExpiryDate}
                      onChange={(e) => setProfileData({ ...profileData, insuranceExpiryDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Basic Information Display */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Full Name</p>
                      <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="text-sm font-medium text-gray-900">{user?.contactInfo?.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Member Since</p>
                      <p className="text-sm font-medium text-gray-900">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Health Information Display */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Health Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3">
                    <Heart className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Blood Type</p>
                      <p className="text-sm font-medium text-gray-900">{user?.bloodType || 'Not specified'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Account Status</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user?.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user?.status || 'Active'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Emergency Contact Display */}
                {user?.emergencyContact?.name && (
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Emergency Contact</h5>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Name</p>
                          <p className="text-sm font-medium text-gray-900">{user.emergencyContact.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Relationship</p>
                          <p className="text-sm font-medium text-gray-900">{user.emergencyContact.relationship}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="text-sm font-medium text-gray-900">{user.emergencyContact.phone}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Insurance Information Display */}
              {user?.insurance?.provider && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Insurance Information</h4>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Provider</p>
                        <p className="text-sm font-medium text-gray-900">{user.insurance.provider}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Policy Number</p>
                        <p className="text-sm font-medium text-gray-900">{user.insurance.policyNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Group Number</p>
                        <p className="text-sm font-medium text-gray-900">{user.insurance.groupNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Expiry Date</p>
                        <p className="text-sm font-medium text-gray-900">
                          {user.insurance.expiryDate ? new Date(user.insurance.expiryDate).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Emergency Information */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-6 w-6 text-red-600" />
          <div>
            <h3 className="text-lg font-medium text-red-900">Emergency Information</h3>
            <p className="text-red-700">In case of emergency, contact your healthcare provider immediately</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <Phone className="h-4 w-4 text-red-600" />
            <a
              href={`tel:${user?.emergencyContact?.phone || '0740968090'}`}
              className="text-sm text-red-700 underline hover:text-red-900"
            >
              Emergency: {user?.emergencyContact?.phone || '0740968090'}
            </a>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-700">
              Nearest Hospital: {user?.department || 'General Hospital'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-700">
              Insurance: {user?.insurance?.provider ? `${user.insurance.provider} (Active)` : 'Not specified'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfile; 