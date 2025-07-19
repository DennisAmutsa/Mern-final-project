const axios = require('axios');

// Test the API connection
async function testAPI() {
  const baseURL = 'https://mern-final-project-bres.onrender.com';
  
  console.log('Testing API connection to:', baseURL);
  
  try {
    // Test health endpoint
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await axios.get(`${baseURL}/api/health`);
    console.log('✅ Health endpoint working:', healthResponse.data);
    
    // Test billing endpoint (without auth)
    console.log('\n2. Testing billing endpoint (should fail without auth)...');
    try {
      const billingResponse = await axios.get(`${baseURL}/api/billing`);
      console.log('❌ Billing endpoint should require auth but didn\'t');
    } catch (error) {
      console.log('✅ Billing endpoint correctly requires auth:', error.response?.status, error.response?.data?.error);
    }
    
    // Test budget endpoint (without auth)
    console.log('\n3. Testing budget endpoint (should fail without auth)...');
    try {
      const budgetResponse = await axios.get(`${baseURL}/api/budget`);
      console.log('❌ Budget endpoint should require auth but didn\'t');
    } catch (error) {
      console.log('✅ Budget endpoint correctly requires auth:', error.response?.status, error.response?.data?.error);
    }
    
    // Test financial reports endpoint (without auth)
    console.log('\n4. Testing financial reports endpoint (should fail without auth)...');
    try {
      const reportsResponse = await axios.get(`${baseURL}/api/financial-reports`);
      console.log('❌ Financial reports endpoint should require auth but didn\'t');
    } catch (error) {
      console.log('✅ Financial reports endpoint correctly requires auth:', error.response?.status, error.response?.data?.error);
    }
    
    console.log('\n🎉 API connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ API connection test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testAPI(); 