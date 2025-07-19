const axios = require('axios');

async function testDepartmentOverview() {
  const baseURL = 'https://mern-final-project-bres.onrender.com';
  
  console.log('🏥 Department Management System - Comprehensive Test');
  console.log('=' .repeat(60));
  
  try {
    // 1. Login as admin
    console.log('\n1️⃣ Testing Admin Login...');
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      username: 'dennis',
      password: 'dennis'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Admin login successful');
    
    // 2. Test GET departments
    console.log('\n2️⃣ Testing GET Departments...');
    try {
      const departmentsResponse = await axios.get(`${baseURL}/api/departments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ GET departments works');
      console.log(`📊 Total departments: ${departmentsResponse.data.length}`);
      
      // Show department details
      if (departmentsResponse.data.length > 0) {
        console.log('\n📋 Current departments:');
        departmentsResponse.data.forEach((dept, index) => {
          console.log(`   ${index + 1}. ${dept.name} - ${dept.status} - Staff: ${dept.staffCount || 0}`);
        });
      }
    } catch (error) {
      console.log('❌ GET departments failed:', error.response?.status);
    }
    
    // 3. Test POST (Create department)
    console.log('\n3️⃣ Testing Department Creation...');
    try {
      const newDepartment = {
        name: `Test Department ${Date.now()}`,
        description: 'A test department for comprehensive testing',
        location: 'Test Building, Floor 1',
        phone: '123-456-7890',
        email: 'test@hospital.com',
        headOfDepartment: 'Dr. Test Head',
        capacity: 50,
        status: 'active'
      };
      
      const createResponse = await axios.post(`${baseURL}/api/departments`, newDepartment, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ Department creation works');
      console.log(`📋 Created: ${createResponse.data.name} (ID: ${createResponse.data._id})`);
      
      // 4. Test PUT (Update department)
      console.log('\n4️⃣ Testing Department Update...');
      try {
        const updateData = {
          ...newDepartment,
          description: 'Updated description for testing',
          capacity: 75
        };
        delete updateData._id; // Remove _id from update data
        
        const updateResponse = await axios.put(`${baseURL}/api/departments/${createResponse.data._id}`, updateData, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('✅ Department update works');
        console.log(`📋 Updated: ${updateResponse.data.name} - Capacity: ${updateResponse.data.capacity}`);
      } catch (updateError) {
        console.log('❌ Department update failed:', updateError.response?.status);
      }
      
      // 5. Test DELETE (Attempt deletion)
      console.log('\n5️⃣ Testing Department Deletion...');
      try {
        const deleteResponse = await axios.delete(`${baseURL}/api/departments/${createResponse.data._id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('✅ Department deletion works');
        console.log('📋 Deletion response:', deleteResponse.data);
      } catch (deleteError) {
        console.log('❌ Department deletion failed:', deleteError.response?.status);
        console.log('📋 Error details:', deleteError.response?.data);
        
        // Test disable as alternative
        console.log('\n5️⃣ Testing Department Disable (Alternative)...');
        try {
          const disableResponse = await axios.put(`${baseURL}/api/departments/${createResponse.data._id}`, {
            name: createResponse.data.name,
            description: createResponse.data.description,
            location: createResponse.data.location,
            phone: createResponse.data.phone,
            email: createResponse.data.email,
            headOfDepartment: createResponse.data.headOfDepartment,
            capacity: createResponse.data.capacity,
            status: 'inactive'
          }, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          console.log('✅ Department disable works');
          console.log('📋 Disable response:', disableResponse.data);
        } catch (disableError) {
          console.log('❌ Department disable failed:', disableError.response?.status);
        }
      }
      
    } catch (createError) {
      console.log('❌ Department creation failed:', createError.response?.status);
    }
    
    // 6. Test staff assignment
    console.log('\n6️⃣ Testing Staff Assignment...');
    try {
      // Get departments first
      const deptResponse = await axios.get(`${baseURL}/api/departments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (deptResponse.data.length > 0) {
        const testDept = deptResponse.data[0];
        console.log(`📋 Testing staff assignment for: ${testDept.name}`);
        
        // Get staff list
        const staffResponse = await axios.get(`${baseURL}/api/users?roles=doctor,nurse`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (staffResponse.data && staffResponse.data.length > 0) {
          console.log(`📋 Found ${staffResponse.data.length} staff members`);
          console.log('✅ Staff fetching works');
        } else {
          console.log('⚠️ No staff members found for assignment');
        }
      }
    } catch (staffError) {
      console.log('❌ Staff assignment test failed:', staffError.response?.status);
    }
    
    // 7. Final status
    console.log('\n7️⃣ Final Department Count...');
    try {
      const finalResponse = await axios.get(`${baseURL}/api/departments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log(`📊 Final department count: ${finalResponse.data.length}`);
    } catch (error) {
      console.log('❌ Final count failed:', error.response?.status);
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('🏁 Department Management Test Complete');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testDepartmentOverview(); 