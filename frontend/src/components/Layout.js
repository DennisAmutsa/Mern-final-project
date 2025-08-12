import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  Calendar, 
  AlertTriangle, 
  Package, 
  BarChart3,
  Menu,
  X,
  Heart,
  LogOut,
  User,
  Shield,
  DollarSign,
  PieChart,
  TrendingUp,
  FileText,
  ChevronDown,
  ChevronRight,
  Settings,
  Building,
  Database,
  Activity,
  Clipboard,
  Clock
} from 'lucide-react';

const adminGroups = [
  {
    name: 'User Management',
    icon: Shield,
    key: 'user',
    items: [
      { name: 'Add New User', href: '/admin-dashboard/users/add', icon: User },
      { name: 'Manage Roles', href: '/admin-dashboard/users/roles', icon: Users },
      { name: 'Account Status', href: '/admin-dashboard/users/status', icon: UserCheck },
    ]
  },
  {
    name: 'Department Management',
    icon: Building,
    key: 'department',
    items: [
      { name: 'Add Department', href: '/admin-dashboard/departments/add', icon: Building },
      { name: 'Staff Assignment', href: '/admin-dashboard/departments/staff', icon: UserCheck },
      { name: 'Department Stats', href: '/admin-dashboard/departments/stats', icon: BarChart3 },
    ]
  },
  {
    name: 'System Administration',
    icon: Settings,
    key: 'system',
    items: [
      { name: 'System Settings', href: '/admin-dashboard/settings', icon: Settings },
      { name: 'Audit Logs', href: '/admin-dashboard/audit', icon: FileText },
      { name: 'Backup & Restore', href: '/admin-dashboard/backup', icon: Database },
      { name: 'Test API', href: '/admin-dashboard/test-api', icon: Activity },
    ]
  },
  {
    name: 'Financial Management',
    icon: DollarSign,
    key: 'finance',
    items: [
      { name: 'Billing Overview', href: '/admin-dashboard/billing', icon: DollarSign },
      { name: 'Budget Reports', href: '/admin-dashboard/budget-reports', icon: PieChart },
      { name: 'Financial Reports', href: '/admin-dashboard/financial-reports', icon: FileText },
    ]
  }
];



const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expanded, setExpanded] = useState({});
  const { user, logout, getDashboardPath } = useAuth();
  const location = useLocation();

  const toggleGroup = (key) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getNavigation = () => {
    const baseNavigation = [
      { name: 'Dashboard', href: getDashboardPath(user?.role), icon: LayoutDashboard },
    ];

    switch (user?.role) {
      case 'admin':
        return [
          ...baseNavigation,
          { name: 'Patients', href: '/admin-dashboard/patients', icon: Users },
          { name: 'Doctors', href: '/admin-dashboard/doctors', icon: UserCheck },
          { name: 'Doctor Schedules', href: '/admin-dashboard/doctor-schedules', icon: Calendar },
          { name: 'Appointments', href: '/admin-dashboard/appointments', icon: Calendar },
          { name: 'Emergency', href: '/admin-dashboard/emergency', icon: AlertTriangle },
          { name: 'Inventory', href: '/admin-dashboard/inventory', icon: Package },
          { name: 'Statistics & Analytics', href: '/admin-dashboard/stats', icon: BarChart3 },
        ];
      case 'doctor':
        return [
          ...baseNavigation,
          { name: 'Patients', href: '/doctor-dashboard/patients', icon: Users },
          { name: 'Appointments', href: '/doctor-dashboard/appointments', icon: Calendar },
          { name: 'Emergency', href: '/doctor-dashboard/emergency', icon: AlertTriangle },
          { name: 'Medical Records', href: '/doctor-dashboard/medical-records', icon: FileText },
          { name: 'Prescriptions', href: '/doctor-dashboard/prescriptions', icon: Heart },
          { name: 'Medical Reports', href: '/doctor-dashboard/stats', icon: BarChart3 },
        ];
      case 'nurse':
        return [
          ...baseNavigation,
          { name: 'Patients', href: '/nurse-dashboard/patients', icon: Users },
          { name: 'Appointments', href: '/nurse-dashboard/appointments', icon: Calendar },
          { name: 'Emergency', href: '/nurse-dashboard/emergency', icon: AlertTriangle },
          { name: 'Vitals', href: '/nurse-dashboard/vitals', icon: Activity },
          { name: 'Care Tasks', href: '/nurse-dashboard/care-tasks', icon: Clipboard },
          { name: 'Patient Notes', href: '/nurse-dashboard/patient-notes', icon: FileText },
          { name: 'Medications', href: '/nurse-dashboard/medications', icon: Package },
          { name: 'Lab Results', href: '/nurse-dashboard/lab-results', icon: FileText },
          { name: 'Shift Handover', href: '/nurse-dashboard/shift-handover', icon: Clock },
          { name: 'Reports', href: '/nurse-dashboard/reports', icon: BarChart3 },
        ];
      case 'receptionist':
        return [
          ...baseNavigation,
          { name: 'Patients', href: '/receptionist-dashboard/patients', icon: Users },
          { name: 'Appointments', href: '/receptionist-dashboard/appointments', icon: Calendar },
          { name: 'Doctors', href: '/receptionist-dashboard/doctors', icon: UserCheck },
          { name: 'Emergency', href: '/receptionist-dashboard/emergency', icon: AlertTriangle },
        ];
      case 'user':
      case 'patient':
      case 'staff':
        return [
          ...baseNavigation,
          { name: 'Appointments', href: '/user-dashboard/appointments', icon: Calendar },
          { name: 'My Profile', href: '/user-dashboard/profile', icon: User },
        ];
      default:
        return baseNavigation;
    }
  };

  const navigation = getNavigation();

  // Helper to check if a sub-item is active
  const isPathActive = (href) => location.pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-red-500" />
              <span className="text-xl font-bold text-gray-900">Hospital MS</span>
            </div>
            <button onClick={() => setSidebarOpen(false)}>
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-red-100 text-red-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </NavLink>
            ))}
            {/* Admin collapsible groups */}
            {user?.role === 'admin' && adminGroups.map((group) => (
              <div key={group.key}>
                <button
                  className="flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-colors text-gray-600 hover:bg-gray-50 hover:text-gray-900 focus:outline-none"
                  onClick={() => toggleGroup(group.key)}
                  type="button"
                >
                  <group.icon className="mr-3 h-5 w-5" />
                  <span className="flex-1 text-left">{group.name}</span>
                  {expanded[group.key] ? <ChevronDown className="h-4 w-4 ml-auto" /> : <ChevronRight className="h-4 w-4 ml-auto" />}
                </button>
                {expanded[group.key] && (
                  <div className="ml-7 mt-1 space-y-1">
                    {group.items.map((sub) => (
                      <NavLink
                        key={sub.name}
                        to={sub.href}
                        className={({ isActive }) =>
                          `flex items-center px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                            isActive || isPathActive(sub.href)
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                          }`
                        }
                        onClick={() => setSidebarOpen(false)}
                      >
                        <sub.icon className="mr-2 h-4 w-4" />
                        {sub.name}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4">
            <div className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-red-500" />
              <span className="text-xl font-bold text-gray-900">Hospital MS</span>
            </div>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-red-100 text-red-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </NavLink>
            ))}
            {/* Admin collapsible groups */}
            {user?.role === 'admin' && adminGroups.map((group) => (
              <div key={group.key}>
                <button
                  className="flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-colors text-gray-600 hover:bg-gray-50 hover:text-gray-900 focus:outline-none"
                  onClick={() => toggleGroup(group.key)}
                  type="button"
                >
                  <group.icon className="mr-3 h-5 w-5" />
                  <span className="flex-1 text-left">{group.name}</span>
                  {expanded[group.key] ? <ChevronDown className="h-4 w-4 ml-auto" /> : <ChevronRight className="h-4 w-4 ml-auto" />}
                </button>
                {expanded[group.key] && (
                  <div className="ml-7 mt-1 space-y-1">
                    {group.items.map((sub) => (
                      <NavLink
                        key={sub.name}
                        to={sub.href}
                        className={({ isActive }) =>
                          `flex items-center px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                            isActive || isPathActive(sub.href)
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                          }`
                        }
                      >
                        <sub.icon className="mr-2 h-4 w-4" />
                        {sub.name}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
               Good Health & Well-being
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="text-sm text-gray-500">
                Hospital Management System
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {user?.role}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>

    </div>
  );
};

export default Layout; 