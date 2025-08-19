const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  maintenanceMode: {
    enabled: {
      type: Boolean,
      default: false
    },
    activatedAt: {
      type: Date
    },
    activatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: {
      type: String,
      default: 'System is currently under maintenance. Please try again later.'
    },
    estimatedDuration: {
      type: String,
      default: '2 hours'
    }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure only one system settings document exists
systemSettingsSchema.statics.getInstance = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = new this();
    await settings.save();
  }
  return settings;
};

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
