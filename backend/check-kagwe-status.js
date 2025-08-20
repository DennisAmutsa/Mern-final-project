const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config({ path: require('path').join(__dirname, '../config.env') });

async function checkKagweStatus() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find user kagwe
    const user = await User.findOne({ 
      $or: [
        { email: 'kagwe@gmail.com' },
        { username: 'kagwee' },
        { firstName: 'kagwe' },
        { lastName: 'kagwe' }
      ]
    });

    if (!user) {
      console.log('❌ User kagwe not found');
      return;
    }

    console.log('\n📋 User Details:');
    console.log(`Name: ${user.firstName} ${user.lastName}`);
    console.log(`Email: ${user.email}`);
    console.log(`Username: ${user.username}`);
    console.log(`Role: ${user.role}`);
    console.log(`Active: ${user.isActive}`);
    console.log(`Account Locked: ${user.accountLocked}`);
    console.log(`Login Attempts: ${user.loginAttempts}`);
    console.log(`Created: ${user.createdAt}`);
    console.log(`Updated: ${user.updatedAt}`);

    if (!user.isActive) {
      console.log('\n🔧 Unsuspending user...');
      user.isActive = true;
      await user.save();
      console.log('✅ User unsuspended successfully');
    }

    if (user.accountLocked) {
      console.log('\n🔓 Unlocking account...');
      user.accountLocked = false;
      user.loginAttempts = 0;
      user.lockUntil = null;
      await user.save();
      console.log('✅ Account unlocked successfully');
    }

    console.log('\n🎉 User kagwe is now active and unlocked!');
    console.log('🔑 Login credentials:');
    console.log('   Email: kagwe@gmail.com');
    console.log('   Password: kagwekagwe');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

checkKagweStatus();
