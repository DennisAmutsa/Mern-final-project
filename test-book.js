const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function loginAndBook() {
  try {
    // 1. Log in as sam
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'sam',
      password: 'sam1234'
    });
    const token = loginRes.data.token;
    console.log('Logged in, token:', token);

    // 2. Get doctors
    const doctorsRes = await axios.get(`${BASE_URL}/doctors`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const doctor = doctorsRes.data[0]; // pick the first doctor
    if (!doctor) {
      console.error('No doctors found.');
      return;
    }
    console.log('Using doctor:', doctor);

    // 3. Book appointment
    const appointmentRes = await axios.post(`${BASE_URL}/appointments`, {
      doctor: doctor._id,
      appointmentDate: '2025-07-15',
      appointmentTime: '09:00',
      type: 'Regular',
      notes: 'Test booking from script',
      userEmail: 'sam@gmail.com'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Appointment booked:', appointmentRes.data);
  } catch (err) {
    if (err.response) {
      console.error('Error:', err.response.data);
    } else {
      console.error('Error:', err.message);
    }
  }
}

loginAndBook(); 