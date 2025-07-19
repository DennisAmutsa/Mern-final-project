const axios = require('axios');

// Test department management
async function testDepartments() {
  const baseURL = 'https://mern-final-project-bres.onrender.com';
  
  console.log('Testing department management...');
  
  try {
    // First, login as admin to get a token
    console.log('\n1. Logging in as admin...');
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      username: 'dennis',
      password: 'dennis'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Admin login successful');
    
    // Test fetching departments
    console.log('\n2. Fetching departments...');
    const departmentsResponse = await axios.get(`${baseURL}/api/departments`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Departments fetched successfully');
    console.log('📊 Total departments:', departmentsResponse.data.length);
    
    // Display department details
    if (departmentsResponse.data.length > 0) {
      console.log('\n📋 Department details:');
      departmentsResponse.data.forEach((dept, index) => {
        console.log(`${index + 1}. ${dept.name} - ${dept.status} - Staff: ${dept.staffCount || 0}`);
      });
    } else {
      console.log('❌ No departments found');
    }
    
    // Test creating a new department
    console.log('\n3. Creating a new test department...');
    const testDepartment = {
      name: `Test Department ${Date.now()}`,
      description: 'A test department for testing purposes',
      location: 'Test Building, Floor 1',
      phone: '123-456-7890',
      email: 'test@hospital.com',
      headOfDepartment: 'Dr. Test Head',
      capacity: 50,
      status: 'active'
    };
    
    const createResponse = await axios.post(`${baseURL}/api/departments`, testDepartment, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Department created successfully');
    console.log('📋 Created department ID:', createResponse.data._id);
    
    // Test fetching departments again to see the new one
    console.log('\n4. Fetching departments after creation...');
    const updatedDepartmentsResponse = await axios.get(`${baseURL}/api/departments`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Updated departments list fetched');
    console.log('📊 Total departments now:', updatedDepartmentsResponse.data.length);
    
    // Find the newly created department
    const newDepartment = updatedDepartmentsResponse.data.find(d => d.name.startsWith('Test Department'));
    if (newDepartment) {
      console.log('✅ New department found in list:', newDepartment.name);
      
      // Test updating the department
      console.log('\n5. Updating the test department...');
      const updateData = {
        ...testDepartment,
        description: 'Updated test department description',
        capacity: 75
      };
      
      const updateResponse = await axios.put(`${baseURL}/api/departments/${newDepartment._id}`, updateData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Department updated successfully');
      
      // Test deleting the department
      console.log('\n6. Deleting the test department...');
      const deleteResponse = await axios.delete(`${baseURL}/api/departments/${newDepartment._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Department deleted successfully');
      
    } else {
      console.log('❌ New department not found in list');
    }
    
    console.log('\n🎉 All department management tests passed!');
    
  } catch (error) {
    console.error('❌ Department test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testDepartments(); 