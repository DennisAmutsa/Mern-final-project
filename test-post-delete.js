const axios = require('axios');

async function testPostDelete() {
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
    
    // Create a new department to test deletion
    console.log('\n2. Creating a test department...');
    const postData = {
      name: `Test Post Delete ${Date.now()}`,
      description: 'Test department for POST deletion',
      location: 'Test Building',
      phone: '123-456-7890',
      email: 'test@hospital.com',
      headOfDepartment: 'Dr. Test',
      capacity: 10,
      status: 'active'
    };
    
    const createResponse = await axios.post(`${baseURL}/api/departments`, postData, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Created department:', createResponse.data.name, 'ID:', createResponse.data._id);
    
    // Test the new POST delete route
    console.log('\n3. Testing POST delete route...');
    try {
      const deleteResponse = await axios.post(`${baseURL}/api/departments/${createResponse.data._id}/delete`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ POST delete successful!');
      console.log('Response:', deleteResponse.data);
    } catch (deleteError) {
      console.log('❌ POST delete failed:', deleteError.response?.status);
      console.log('Error message:', deleteError.response?.data);
    }
    
    // Verify the department is no longer in the active list
    console.log('\n4. Verifying deletion...');
    const departmentsResponse = await axios.get(`${baseURL}/api/departments`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const deletedDepartment = departmentsResponse.data.find(d => d._id === createResponse.data._id);
    if (!deletedDepartment) {
      console.log('✅ Department successfully removed from active list');
    } else {
      console.log('❌ Department still appears in active list');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testPostDelete(); 