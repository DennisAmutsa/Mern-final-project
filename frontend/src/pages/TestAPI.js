import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import apiClient from '../config/axios';

export default function TestAPI() {
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    setTestResults([]);
    
    const results = [];
    
    // Test 1: Check API_BASE_URL
    results.push({
      test: 'API_BASE_URL Configuration',
      status: API_BASE_URL ? 'PASS' : 'FAIL',
      details: `API_BASE_URL: ${API_BASE_URL || 'undefined'}`
    });
    
    // Test 2: Check token
    const token = localStorage.getItem('token');
    results.push({
      test: 'Authentication Token',
      status: token ? 'PASS' : 'FAIL',
      details: `Token available: ${!!token}`
    });
    
    // Test 3: Test health endpoint
    try {
      const healthResponse = await apiClient.get('/api/health');
      results.push({
        test: 'Health Endpoint',
        status: 'PASS',
        details: `Status: ${healthResponse.status}, Database: ${healthResponse.data.database}`
      });
    } catch (error) {
      results.push({
        test: 'Health Endpoint',
        status: 'FAIL',
        details: `Error: ${error.message}`
      });
    }
    
    // Test 4: Test billing endpoint
    try {
      const billingResponse = await apiClient.get('/api/billing');
      results.push({
        test: 'Billing Endpoint',
        status: 'PASS',
        details: `Bills found: ${billingResponse.data.length}`
      });
    } catch (error) {
      results.push({
        test: 'Billing Endpoint',
        status: 'FAIL',
        details: `Error: ${error.message}, Status: ${error.response?.status}`
      });
    }
    
    // Test 5: Test budget endpoint
    try {
      const budgetResponse = await apiClient.get('/api/budget');
      results.push({
        test: 'Budget Endpoint',
        status: 'PASS',
        details: `Budgets found: ${budgetResponse.data.length}`
      });
    } catch (error) {
      results.push({
        test: 'Budget Endpoint',
        status: 'FAIL',
        details: `Error: ${error.message}, Status: ${error.response?.status}`
      });
    }
    
    // Test 6: Test financial reports endpoint
    try {
      const reportsResponse = await apiClient.get('/api/financial-reports');
      results.push({
        test: 'Financial Reports Endpoint',
        status: 'PASS',
        details: `Reports found: ${reportsResponse.data.length}`
      });
    } catch (error) {
      results.push({
        test: 'Financial Reports Endpoint',
        status: 'FAIL',
        details: `Error: ${error.message}, Status: ${error.response?.status}`
      });
    }
    
    setTestResults(results);
    setLoading(false);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API Configuration Test</h1>
      
      <button 
        onClick={runTests}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Running Tests...' : 'Run API Tests'}
      </button>
      
      {testResults.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Test Results:</h2>
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div key={index} className={`p-3 rounded border ${
                result.status === 'PASS' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{result.test}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    result.status === 'PASS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {result.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-1">{result.details}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 