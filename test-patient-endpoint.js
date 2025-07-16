const axios = require('axios');

async function testPatientEndpoint() {
  try {
    const res = await axios.get('http://localhost:5000/api/appointments/patient?email=sam@gmail.com');
    console.log('Response:', res.data);
  } catch (err) {
    if (err.response) {
      console.error('Error response:', err.response.data);
    } else {
      console.error('Error:', err.message);
    }
  }
}

testPatientEndpoint(); 