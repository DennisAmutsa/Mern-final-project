const mongoose = require('mongoose');
const User = require('./backend/models/User');
const Patient = require('./backend/models/Patient');

async function migrate() {
  await mongoose.connect('mongodb://localhost:27017/hospital-management'); // Update if needed

  const users = await User.find({ role: 'user' });
  for (const user of users) {
    const exists = await Patient.findOne({ email: user.email });
    if (!exists) {
      await Patient.create({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        contactInfo: { email: user.email, phone: user.contactInfo?.phone || '' },
        status: 'Active',
        department: user.department || 'General Medicine',
        assignedDoctor: null
      });
      console.log(`Created patient for user: ${user.email}`);
    }
  }
  console.log('Migration complete.');
  process.exit();
}

migrate(); 