const axios = require('axios');

async function testDeleteOther() {
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
    
    // Get all departments
    console.log('\n2. Fetching departments...');
    const departmentsResponse = await axios.get(`${baseURL}/api/departments`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('📊 Total departments:', departmentsResponse.data.length);
    
    // List all departments
    console.log('\n📋 All departments:');
    departmentsResponse.data.forEach((dept, index) => {
      console.log(`${index + 1}. ${dept.name} (ID: ${dept._id}) - Staff: ${dept.staffCount}`);
    });
    
    // Try to delete the "JJ" department (which should have no staff)
    const jjDepartment = departmentsResponse.data.find(d => d.name === 'JJ');
    
    if (!jjDepartment) {
      console.log('❌ JJ department not found');
      return;
    }
    
    console.log('\n3. Attempting to delete JJ department...');
    console.log('🔍 JJ department:', jjDepartment.name, 'ID:', jjDepartment._id, 'Staff:', jjDepartment.staffCount);
    
    try {
      const deleteResponse = await axios.delete(`${baseURL}/api/departments/${jjDepartment._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ JJ department deleted successfully');
      console.log('Response:', deleteResponse.data);
    } catch (deleteError) {
      console.log('❌ Delete failed with status:', deleteError.response?.status);
      console.log('❌ Delete error message:', deleteError.response?.data);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testDeleteOther(); 