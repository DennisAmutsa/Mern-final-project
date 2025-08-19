const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../config.env') });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const SystemSettings = require('./models/SystemSettings');

async function enableMaintenance() {
  try {
    console.log('🔧 Attempting to enable maintenance mode...');
    
    const settings = await SystemSettings.getInstance();
    console.log('📊 Current maintenance status:', settings.maintenanceMode.enabled);
    
    if (!settings.maintenanceMode.enabled) {
      settings.maintenanceMode.enabled = true;
      settings.maintenanceMode.activatedAt = new Date();
      settings.maintenanceMode.activatedBy = null; // Will be set when IT user enables it
      settings.maintenanceMode.message = 'System is currently under maintenance. Please try again later.';
      settings.maintenanceMode.estimatedDuration = '2 hours';
      settings.lastUpdated = new Date();
      
      await settings.save();
      console.log('✅ Maintenance mode enabled successfully!');
      console.log('🔒 Only IT users can now login to the system.');
    } else {
      console.log('ℹ️ Maintenance mode is already enabled.');
    }
  } catch (error) {
    console.error('❌ Error enabling maintenance mode:', error);
  } finally {
    mongoose.connection.close();
  }
}

enableMaintenance();
