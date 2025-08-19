const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../config.env') });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const SystemSettings = require('./models/SystemSettings');

async function disableMaintenance() {
  try {
    console.log('🔧 Attempting to disable maintenance mode...');
    
    const settings = await SystemSettings.getInstance();
    console.log('📊 Current maintenance status:', settings.maintenanceMode.enabled);
    
    if (settings.maintenanceMode.enabled) {
      settings.maintenanceMode.enabled = false;
      settings.maintenanceMode.activatedAt = null;
      settings.maintenanceMode.activatedBy = null;
      settings.maintenanceMode.message = '';
      settings.maintenanceMode.estimatedDuration = '';
      settings.lastUpdated = new Date();
      
      await settings.save();
      console.log('✅ Maintenance mode disabled successfully!');
    } else {
      console.log('ℹ️ Maintenance mode is already disabled.');
    }
    
    console.log('🎉 You should now be able to login normally.');
  } catch (error) {
    console.error('❌ Error disabling maintenance mode:', error);
  } finally {
    mongoose.connection.close();
  }
}

disableMaintenance();
