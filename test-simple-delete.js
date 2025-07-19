const axios = require('axios');

async function testSimpleDelete() {
  const baseURL = 'https://mern-final-project-bres.onrender.com';
  
  try {
    // Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      username: 'dennis',
      password: 'dennis'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Admin login successful');
    
    // Test the health endpoint first
    console.log('\n2. Testing health endpoint...');
    try {
      const healthResponse = await axios.get(`${baseURL}/api/health`);
      console.log('✅ Health check passed:', healthResponse.data);
    } catch (healthError) {
      console.log('❌ Health check failed:', healthError.message);
    }
    
    // Test the test endpoint
    console.log('\n3. Testing test endpoint...');
    try {
      const testResponse = await axios.get(`${baseURL}/api/test`);
      console.log('✅ Test endpoint passed:', testResponse.data);
    } catch (testError) {
      console.log('❌ Test endpoint failed:', testError.message);
    }
    
    // Get all departments
    console.log('\n4. Fetching departments...');
    const departmentsResponse = await axios.get(`${baseURL}/api/departments`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('📊 Total departments:', departmentsResponse.data.length);
    
    // Find a test department to delete
    const testDepartment = departmentsResponse.data.find(d => d.name.startsWith('Test Department'));
    
    if (!testDepartment) {
      console.log('❌ No test department found to delete');
      return;
    }
    
    console.log('🔍 Found test department:', testDepartment.name, 'ID:', testDepartment._id);
    
    // Try a simple GET request to the department
    console.log('\n5. Testing GET request to specific department...');
    try {
      const getDeptResponse = await axios.get(`${baseURL}/api/departments/${testDepartment._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ GET department successful:', getDeptResponse.data.name);
    } catch (getError) {
      console.log('❌ GET department failed:', getError.response?.status, getError.response?.data);
    }
    
    // Try to delete the department
    console.log('\n6. Attempting to delete department...');
    try {
      const deleteResponse = await axios.delete(`${baseURL}/api/departments/${testDepartment._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ Department deleted successfully');
      console.log('Response:', deleteResponse.data);
    } catch (deleteError) {
      console.log('❌ Delete failed with status:', deleteError.response?.status);
      console.log('❌ Delete error message:', deleteError.response?.data);
      console.log('❌ Delete error details:', deleteError.message);
      
      // Try to get more details about the error
      if (deleteError.response) {
        console.log('❌ Response headers:', deleteError.response.headers);
        console.log('❌ Response status text:', deleteError.response.statusText);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testSimpleDelete(); 