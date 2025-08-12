import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Homepage from './pages/Homepage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import NurseDashboard from './pages/NurseDashboard';
import ReceptionistDashboard from './pages/ReceptionistDashboard';
import UserDashboard from './pages/UserDashboard';
import PatientAppointments from './pages/PatientAppointments';
import DepartmentManagement from './pages/DepartmentManagement';
import SystemSettings from './pages/SystemSettings';
import AuditLogs from './pages/AuditLogs';
import Patients from './pages/Patients';
import Doctors from './pages/Doctors';
import Appointments from './pages/Appointments';
import Emergency from './pages/Emergency';
import Inventory from './pages/Inventory';
import Stats from './pages/Stats';
import Users from './pages/Users';
import BillingOverview from './pages/BillingOverview';
import BudgetReports from './pages/BudgetReports';
import FinancialReports from './pages/FinancialReports';
import MedicalRecords from './pages/MedicalRecords';
import Prescriptions from './pages/Prescriptions';
import BackupRestore from './pages/BackupRestore';
import MyProfile from './pages/MyProfile';
import DoctorSchedule from './pages/DoctorSchedule';
import DoctorScheduleManagement from './pages/DoctorScheduleManagement';
import TestAPI from './pages/TestAPI';
import PatientNotes from './pages/PatientNotes';
import Medications from './pages/Medications';
import CareTasks from './pages/CareTasks';
import NurseReports from './pages/NurseReports';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Role-based Route Component
const RoleBasedRoute = ({ allowedRoles, children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Public Route Component (redirects to dashboard if already authenticated)
const PublicRoute = ({ children, allowAuthenticated = false }) => {
  const { isAuthenticated, loading, user, getDashboardPath } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isAuthenticated && !allowAuthenticated) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return children;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={
        <PublicRoute allowAuthenticated={true}>
          <Homepage />
        </PublicRoute>
      } />
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      } />

      {/* User Dashboard Route - for regular users */}
      <Route path="/user-dashboard" element={
        <ProtectedRoute>
          <RoleBasedRoute allowedRoles={['user', 'patient', 'staff']}>
            <Layout />
          </RoleBasedRoute>
        </ProtectedRoute>
      }>
        <Route index element={<UserDashboard />} />
        <Route path="appointments" element={<PatientAppointments />} />
        <Route path="profile" element={<MyProfile />} />
        <Route path="medical-records" element={<MedicalRecords />} />
        <Route path="prescriptions" element={<Prescriptions />} />
      </Route>

      {/* Role-based Dashboard Routes */}
      <Route path="/admin-dashboard" element={
        <ProtectedRoute>
          <RoleBasedRoute allowedRoles={['admin']}>
            <Layout />
          </RoleBasedRoute>
        </ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="patients" element={<Patients />} />
        <Route path="doctors" element={<Doctors />} />
        <Route path="doctor-schedules" element={<DoctorScheduleManagement />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="emergency" element={<Emergency />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="stats" element={<Stats />} />
        <Route path="users" element={<Users />} />
        <Route path="users/add" element={<Users />} />
        <Route path="users/roles" element={<Users />} />
        <Route path="users/status" element={<Users />} />
        <Route path="departments" element={<DepartmentManagement />} />
        <Route path="departments/add" element={<DepartmentManagement />} />
        <Route path="departments/staff" element={<DepartmentManagement />} />
        <Route path="departments/stats" element={<DepartmentManagement />} />
        <Route path="settings" element={<SystemSettings />} />
        <Route path="audit" element={<AuditLogs />} />
        <Route path="backup" element={<BackupRestore />} />
        <Route path="billing" element={<BillingOverview />} />
        <Route path="budget-reports" element={<BudgetReports />} />
        <Route path="financial-reports" element={<FinancialReports />} />
        <Route path="test-api" element={<TestAPI />} />
        <Route path="care-tasks" element={<CareTasks />} />
      </Route>

      <Route path="/doctor-dashboard" element={
        <ProtectedRoute>
          <RoleBasedRoute allowedRoles={['doctor']}>
            <Layout />
          </RoleBasedRoute>
        </ProtectedRoute>
      }>
        <Route index element={<DoctorDashboard />} />
        <Route path="patients" element={<Patients />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="emergency" element={<Emergency />} />
        <Route path="stats" element={<Stats />} />
        <Route path="medical-records" element={<MedicalRecords />} />
        <Route path="prescriptions" element={<Prescriptions />} />
        <Route path="care-tasks" element={<CareTasks />} />
      </Route>

      <Route path="/nurse-dashboard" element={
        <ProtectedRoute>
          <RoleBasedRoute allowedRoles={['nurse']}>
            <Layout />
          </RoleBasedRoute>
        </ProtectedRoute>
      }>
        <Route index element={<NurseDashboard />} />
        <Route path="patients" element={<Patients />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="emergency" element={<Emergency />} />
        <Route path="vitals" element={<NurseDashboard />} />
        <Route path="care-tasks" element={<CareTasks />} />
        <Route path="patient-notes" element={<PatientNotes />} />
        <Route path="medications" element={<Medications />} />
        <Route path="lab-results" element={<NurseDashboard />} />
        <Route path="shift-handover" element={<NurseDashboard />} />
        <Route path="reports" element={<NurseReports />} />
      </Route>

      <Route path="/receptionist-dashboard" element={
        <ProtectedRoute>
          <RoleBasedRoute allowedRoles={['receptionist']}>
            <Layout />
          </RoleBasedRoute>
        </ProtectedRoute>
      }>
        <Route index element={<ReceptionistDashboard />} />
        <Route path="patients" element={<Patients />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="doctors" element={<Doctors />} />
        <Route path="doctor-schedule" element={<DoctorSchedule />} />
        <Route path="emergency" element={<Emergency />} />
      </Route>

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <AppRoutes />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </div>
    </AuthProvider>
  );
}

export default App; 