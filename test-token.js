const axios = require('axios');

// Test token authentication
async function testTokenAuth() {
  const baseURL = 'https://mern-final-project-bres.onrender.com';
  
  console.log('Testing token authentication...');
  
  try {
    // First, try to login to get a token
    console.log('\n1. Attempting to login...');
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      username: 'dennis',
      password: 'dennis'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, token received');
    
    // Test billing endpoint with token
    console.log('\n2. Testing billing endpoint with token...');
    const billingResponse = await axios.get(`${baseURL}/api/billing`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Billing endpoint working with token');
    console.log('📊 Bills found:', billingResponse.data.length);
    
    // Test budget endpoint with token
    console.log('\n3. Testing budget endpoint with token...');
    const budgetResponse = await axios.get(`${baseURL}/api/budget`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Budget endpoint working with token');
    console.log('📊 Budgets found:', budgetResponse.data.length);
    
    // Test financial reports endpoint with token
    console.log('\n4. Testing financial reports endpoint with token...');
    const reportsResponse = await axios.get(`${baseURL}/api/financial-reports`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Financial reports endpoint working with token');
    console.log('📊 Reports found:', reportsResponse.data.length);
    
    console.log('\n🎉 All authentication tests passed!');
    
  } catch (error) {
    console.error('❌ Authentication test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testTokenAuth(); 