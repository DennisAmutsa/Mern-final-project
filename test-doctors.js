const axios = require('axios');

// Test doctor fetching
async function testDoctors() {
  const baseURL = 'https://mern-final-project-bres.onrender.com';
  
  console.log('Testing doctor fetching...');
  
  try {
    // First, login as admin to get a token
    console.log('\n1. Logging in as admin...');
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      username: 'dennis',
      password: 'dennis'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Admin login successful');
    
    // Test fetching doctors
    console.log('\n2. Fetching doctors...');
    const doctorsResponse = await axios.get(`${baseURL}/api/doctors`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Doctors fetched successfully');
    console.log('📊 Total doctors:', doctorsResponse.data.length);
    
    // Display doctor details
    if (doctorsResponse.data.length > 0) {
      console.log('\n📋 Doctor details:');
      doctorsResponse.data.forEach((doctor, index) => {
        console.log(`${index + 1}. Dr. ${doctor.firstName} ${doctor.lastName} - ${doctor.department || 'No department'}`);
      });
    } else {
      console.log('❌ No doctors found');
    }
    
    // Test fetching doctors without auth (should still work)
    console.log('\n3. Fetching doctors without auth...');
    const doctorsNoAuthResponse = await axios.get(`${baseURL}/api/doctors`);
    console.log('✅ Doctors fetched without auth');
    console.log('📊 Total doctors (no auth):', doctorsNoAuthResponse.data.length);
    
    console.log('\n🎉 All doctor tests passed!');
    
  } catch (error) {
    console.error('❌ Doctor test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testDoctors(); 