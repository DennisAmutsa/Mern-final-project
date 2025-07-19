const mongoose = require('mongoose');
require('dotenv').config({ path: '../config.env' });

async function testMongoDelete() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Import the Department model
    const Department = require('./backend/models/Department');

    // Find all departments
    console.log('\n📊 Fetching all departments...');
    const departments = await Department.find({});
    console.log('Total departments:', departments.length);

    // List departments
    departments.forEach((dept, index) => {
      console.log(`${index + 1}. ${dept.name} (ID: ${dept._id}) - Staff: ${dept.staffCount}`);
    });

    // Find a test department to delete
    const testDepartment = departments.find(d => d.name.startsWith('Test Department'));
    
    if (!testDepartment) {
      console.log('❌ No test department found');
      return;
    }

    console.log('\n🔍 Found test department:', testDepartment.name, 'ID:', testDepartment._id);

    // Try to delete using findByIdAndDelete
    console.log('\n🗑️ Attempting to delete department...');
    try {
      const result = await Department.findByIdAndDelete(testDepartment._id);
      if (result) {
        console.log('✅ Department deleted successfully:', result.name);
      } else {
        console.log('❌ Department not found or already deleted');
      }
    } catch (deleteError) {
      console.log('❌ Error deleting department:', deleteError.message);
    }

    // Verify deletion by checking remaining departments
    console.log('\n📊 Checking remaining departments...');
    const remainingDepartments = await Department.find({});
    console.log('Remaining departments:', remainingDepartments.length);
    remainingDepartments.forEach((dept, index) => {
      console.log(`${index + 1}. ${dept.name} (ID: ${dept._id})`);
    });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testMongoDelete(); 