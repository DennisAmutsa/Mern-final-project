import React from 'react';
import { Wrench, Clock, AlertTriangle, RefreshCw } from 'lucide-react';

const MaintenancePage = ({ maintenanceInfo }) => {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-orange-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-full">
              <Wrench className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            System Under Maintenance
          </h1>
          <p className="text-orange-100 text-sm">
            We're currently performing system maintenance
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-8">
          {/* Status Indicator */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center space-x-2 bg-orange-100 text-orange-800 px-4 py-2 rounded-full">
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Maintenance Active</span>
            </div>
          </div>

          {/* Message */}
          <div className="text-center mb-6">
            <p className="text-gray-700 leading-relaxed">
              {maintenanceInfo?.message || 'System is currently under maintenance. Please try again later.'}
            </p>
          </div>

          {/* Details */}
          <div className="space-y-4 mb-8">
            {maintenanceInfo?.estimatedDuration && (
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Estimated Duration: {maintenanceInfo.estimatedDuration}</span>
              </div>
            )}
            
            {maintenanceInfo?.activatedAt && (
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                <AlertTriangle className="h-4 w-4" />
                <span>Started: {new Date(maintenanceInfo.activatedAt).toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleRefresh}
              className="w-full flex items-center justify-center space-x-2 bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Check Again</span>
            </button>
            
            <div className="text-center">
              <p className="text-xs text-gray-500">
                For urgent matters, contact IT support
              </p>
              <p className="text-xs text-gray-500 font-medium">
                epicedgecreative@gmail.com
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 text-center">
          <p className="text-xs text-gray-500">
            Hospital Management System • Maintenance Mode
          </p>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;
