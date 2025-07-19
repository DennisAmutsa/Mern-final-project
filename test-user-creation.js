const axios = require('axios');

// Test user creation
async function testUserCreation() {
  const baseURL = 'https://mern-final-project-bres.onrender.com';
  
  console.log('Testing user creation...');
  
  try {
    // First, login as admin to get a token
    console.log('\n1. Logging in as admin...');
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      username: 'dennis',
      password: 'dennis'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Admin login successful');
    
    // Test creating a new user
    console.log('\n2. Creating a new test user...');
    const testUser = {
      username: 'testuser',
      email: 'testuser@example.com',
      password: 'testpass123',
      firstName: 'Test',
      lastName: 'User',
      role: 'receptionist',
      department: 'Administration',
      employeeId: 'EMP123'
    };
    
    const createResponse = await axios.post(`${baseURL}/api/auth/register`, testUser, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ User created successfully');
    console.log('📋 Created user ID:', createResponse.data.user.id);
    
    // Test fetching users to see the new one
    console.log('\n3. Fetching users list...');
    const usersResponse = await axios.get(`${baseURL}/api/users`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Users list fetched');
    console.log('📊 Total users:', usersResponse.data.length);
    
    // Find the newly created user
    const newUser = usersResponse.data.find(u => u.email === 'testuser@example.com');
    if (newUser) {
      console.log('✅ New user found in list:', newUser.firstName, newUser.lastName, 'Role:', newUser.role);
    } else {
      console.log('❌ New user not found in list');
    }
    
    console.log('\n🎉 All user creation tests passed!');
    
  } catch (error) {
    console.error('❌ User creation test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testUserCreation(); 