const mongoose = require('mongoose');
const User = require('./models/User');
const SystemSettings = require('./models/SystemSettings');
require('dotenv').config({ path: require('path').join(__dirname, '../config.env') });

async function unsuspendKagweeAndUnlock() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find and unsuspend user kagwee
    const user = await User.findOne({ 
      $or: [
        { email: 'kagwe@gmail.com' },
        { username: 'kagwee' },
        { firstName: 'kagwe' },
        { lastName: 'kagwe' }
      ]
    });

    if (!user) {
      console.log('❌ User kagwee not found');
      console.log('🔍 Searching for users with similar names...');
      
      const similarUsers = await User.find({
        $or: [
          { email: { $regex: 'kagwe', $options: 'i' } },
          { username: { $regex: 'kagwe', $options: 'i' } },
          { firstName: { $regex: 'kagwe', $options: 'i' } },
          { lastName: { $regex: 'kagwe', $options: 'i' } }
        ]
      });

      if (similarUsers.length > 0) {
        console.log('📋 Found similar users:');
        similarUsers.forEach(u => {
          console.log(`- ${u.firstName} ${u.lastName} (${u.email}) - Role: ${u.role} - Active: ${u.isActive}`);
        });
      }
      return;
    }

    console.log(`📋 Found user: ${user.firstName} ${user.lastName} (${user.email})`);
    console.log(`📋 Current status: Active: ${user.isActive}, Role: ${user.role}, Account Locked: ${user.accountLocked}`);

    // Unsuspend the user
    if (!user.isActive) {
      user.isActive = true;
      console.log('✅ User unsuspended');
    } else {
      console.log('ℹ️ User was already active');
    }

    // Unlock the account if it's locked
    if (user.accountLocked) {
      user.accountLocked = false;
      user.loginAttempts = 0;
      user.lockUntil = null;
      console.log('✅ Account unlocked');
    } else {
      console.log('ℹ️ Account was not locked');
    }

    // Save the user
    await user.save();
    console.log('✅ User updated successfully');

    // Check and disable system lock
    const systemSettings = await SystemSettings.findOne();
    if (systemSettings && systemSettings.systemLock && systemSettings.systemLock.enabled) {
      systemSettings.systemLock.enabled = false;
      systemSettings.systemLock.deactivatedAt = new Date();
      systemSettings.systemLock.deactivatedBy = user._id;
      await systemSettings.save();
      console.log('✅ System lock disabled');
    } else {
      console.log('ℹ️ System lock was not enabled');
    }

    // Check and disable maintenance mode
    if (systemSettings && systemSettings.maintenanceMode && systemSettings.maintenanceMode.enabled) {
      systemSettings.maintenanceMode.enabled = false;
      systemSettings.maintenanceMode.deactivatedAt = new Date();
      systemSettings.maintenanceMode.deactivatedBy = user._id;
      await systemSettings.save();
      console.log('✅ Maintenance mode disabled');
    } else {
      console.log('ℹ️ Maintenance mode was not enabled');
    }

    console.log('\n🎉 SUCCESS!');
    console.log('✅ User kagwee has been unsuspended and unlocked');
    console.log('✅ System lock has been disabled');
    console.log('✅ Maintenance mode has been disabled');
    console.log('\n🔑 You can now login with:');
    console.log('   Email: kagwe@gmail.com');
    console.log('   Password: kagwekagwe');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

unsuspendKagweeAndUnlock();
