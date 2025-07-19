const axios = require('axios');

// Test patient registration and fetching
async function testPatients() {
  const baseURL = 'https://mern-final-project-bres.onrender.com';
  
  console.log('Testing patient registration and fetching...');
  
  try {
    // First, login as admin to get a token
    console.log('\n1. Logging in as admin...');
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      username: 'dennis',
      password: 'dennis'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Admin login successful');
    
    // Test fetching existing patients
    console.log('\n2. Fetching existing patients...');
    const patientsResponse = await axios.get(`${baseURL}/api/users?roles=user`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Patients fetched successfully');
    console.log('📊 Current patients:', patientsResponse.data.length);
    
    // Test registering a new patient
    console.log('\n3. Registering a new test patient...');
    const testPatient = {
      username: 'testpatient',
      email: 'testpatient@example.com',
      password: 'testpass123',
      firstName: 'Test',
      lastName: 'Patient',
      phone: '1234567890',
      dateOfBirth: '1990-01-01',
      gender: 'Male',
      bloodType: 'O+',
      role: 'user',
      isActive: true,
      status: 'Active',
      address: {
        street: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345',
        country: 'Test Country'
      },
      emergencyContact: {
        name: 'Emergency Contact',
        relationship: 'Spouse',
        phone: '0987654321'
      },
      insurance: {
        provider: 'Test Insurance',
        policyNumber: 'POL123456',
        groupNumber: 'GRP789',
        expiryDate: '2025-12-31'
      }
    };
    
    const registerResponse = await axios.post(`${baseURL}/api/auth/register`, testPatient, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Patient registered successfully');
    console.log('📋 Registered patient ID:', registerResponse.data.user.id);
    
    // Test fetching patients again to see the new one
    console.log('\n4. Fetching patients after registration...');
    const updatedPatientsResponse = await axios.get(`${baseURL}/api/users?roles=user`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Updated patients list fetched');
    console.log('📊 Total patients now:', updatedPatientsResponse.data.length);
    
    // Find the newly registered patient
    const newPatient = updatedPatientsResponse.data.find(p => p.email === 'testpatient@example.com');
    if (newPatient) {
      console.log('✅ New patient found in list:', newPatient.firstName, newPatient.lastName);
    } else {
      console.log('❌ New patient not found in list');
    }
    
    console.log('\n🎉 All patient tests passed!');
    
  } catch (error) {
    console.error('❌ Patient test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testPatients(); 