const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

async function initializeSuperAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check if super admin already exists
    const existingSuperAdmin = await Admin.findOne({ role: 'super_admin' });
    if (existingSuperAdmin) {
      console.log('⚠️  Super admin already exists');
      console.log(`Username: ${existingSuperAdmin.username}`);
      console.log(`Email: ${existingSuperAdmin.email}`);
      console.log(`Full Name: ${existingSuperAdmin.fullName}`);
      process.exit(0);
    }

    // Create default super admin
    const superAdmin = new Admin({
      username: 'superadmin',
      password: 'superadmin123',
      email: 'superadmin@votingsystem.com',
      fullName: 'Super Administrator',
      role: 'super_admin'
    });

    await superAdmin.save();

    console.log('🎉 Super admin initialized successfully!');
    console.log('📋 Default credentials:');
    console.log(`   Username: ${superAdmin.username}`);
    console.log(`   Password: ${superAdmin.password}`);
    console.log(`   Email: ${superAdmin.email}`);
    console.log(`   Full Name: ${superAdmin.fullName}`);
    console.log(`   Role: ${superAdmin.role}`);
    console.log('\n🔐 Please change the password after first login!');

  } catch (error) {
    console.error('❌ Error initializing super admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the initialization
initializeSuperAdmin(); 