const axios = require('axios');

async function testRouteConflict() {
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
    
    // Test different HTTP methods on the departments endpoint
    console.log('\n2. Testing different HTTP methods...');
    
    // Test GET (should work)
    console.log('\n📋 Testing GET /api/departments...');
    try {
      const getResponse = await axios.get(`${baseURL}/api/departments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ GET works - Departments count:', getResponse.data.length);
    } catch (error) {
      console.log('❌ GET failed:', error.response?.status);
    }
    
    // Test POST (should work)
    console.log('\n📝 Testing POST /api/departments...');
    try {
      const postData = {
        name: `Test Delete ${Date.now()}`,
        description: 'Test department for deletion',
        location: 'Test Building',
        phone: '123-456-7890',
        email: 'test@hospital.com',
        headOfDepartment: 'Dr. Test',
        capacity: 10,
        status: 'active'
      };
      const postResponse = await axios.post(`${baseURL}/api/departments`, postData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ POST works - Created department:', postResponse.data.name);
      
      // Try to delete this newly created department
      console.log('\n🗑️ Testing DELETE on newly created department...');
      try {
        const deleteResponse = await axios.delete(`${baseURL}/api/departments/${postResponse.data._id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('✅ DELETE works - Response:', deleteResponse.data);
      } catch (deleteError) {
        console.log('❌ DELETE failed:', deleteError.response?.status, deleteError.response?.data);
      }
      
    } catch (error) {
      console.log('❌ POST failed:', error.response?.status);
    }
    
    // Test PUT (should work)
    console.log('\n✏️ Testing PUT /api/departments...');
    try {
      const departmentsResponse = await axios.get(`${baseURL}/api/departments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (departmentsResponse.data.length > 0) {
        const firstDept = departmentsResponse.data[0];
        const putData = { ...firstDept, description: 'Updated description' };
        delete putData._id; // Remove _id from update data
        
        const putResponse = await axios.put(`${baseURL}/api/departments/${firstDept._id}`, putData, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('✅ PUT works - Updated department:', putResponse.data.name);
      }
    } catch (error) {
      console.log('❌ PUT failed:', error.response?.status);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testRouteConflict(); 