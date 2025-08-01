const axios = require('axios');

const API_BASE_URL = 'http://localhost:4000/api';

async function testAdminFunctionality() {
  console.log('🧪 Testing Admin Management Functionality...\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Backend Health...');
    const healthResponse = await axios.get('http://localhost:4000/health');
    console.log('✅ Backend is healthy:', healthResponse.data);
    console.log('');

    // Test 2: Admin Login
    console.log('2️⃣ Testing Admin Login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/admin/login`, {
      username: 'superadmin',
      password: 'superadmin123'
    });
    console.log('✅ Login successful:', loginResponse.data.message);
    console.log('');

    // Test 3: Get All Admins
    console.log('3️⃣ Testing Get All Admins...');
    const getAllResponse = await axios.get(`${API_BASE_URL}/admin/all`);
    console.log('✅ Admins retrieved:', getAllResponse.data.admins.length, 'admins found');
    console.log('');

    // Test 4: Create New Admin
    console.log('4️⃣ Testing Create New Admin...');
    const newAdminData = {
      username: 'testadmin2',
      password: 'test123',
      email: 'test2@example.com',
      fullName: 'Test Admin 2',
      role: 'admin'
    };
    const createResponse = await axios.post(`${API_BASE_URL}/admin/create`, newAdminData);
    console.log('✅ Admin created:', createResponse.data.message);
    console.log('');

    // Test 5: Get Updated Admin List
    console.log('5️⃣ Testing Updated Admin List...');
    const updatedListResponse = await axios.get(`${API_BASE_URL}/admin/all`);
    console.log('✅ Updated list:', updatedListResponse.data.admins.length, 'admins found');
    console.log('');

    // Test 6: Reset Admin Password
    console.log('6️⃣ Testing Reset Admin Password...');
    const adminToReset = updatedListResponse.data.admins.find(admin => admin.username === 'testadmin2');
    if (adminToReset) {
      const resetResponse = await axios.put(`${API_BASE_URL}/admin/reset-password`, {
        adminId: adminToReset._id,
        newPassword: 'newpassword123'
      });
      console.log('✅ Password reset:', resetResponse.data.message);
    }
    console.log('');

    // Test 7: Update Admin
    console.log('7️⃣ Testing Update Admin...');
    if (adminToReset) {
      const updateData = {
        username: 'testadmin2',
        email: 'updated@example.com',
        fullName: 'Updated Test Admin',
        role: 'admin'
      };
      const updateResponse = await axios.put(`${API_BASE_URL}/admin/update/${adminToReset._id}`, updateData);
      console.log('✅ Admin updated:', updateResponse.data.message);
    }
    console.log('');

    // Test 8: Deactivate Admin
    console.log('8️⃣ Testing Deactivate Admin...');
    if (adminToReset) {
      const deactivateResponse = await axios.put(`${API_BASE_URL}/admin/deactivate/${adminToReset._id}`);
      console.log('✅ Admin deactivated:', deactivateResponse.data.message);
    }
    console.log('');

    // Test 9: Final Admin List
    console.log('9️⃣ Testing Final Admin List...');
    const finalListResponse = await axios.get(`${API_BASE_URL}/admin/all`);
    console.log('✅ Final list:', finalListResponse.data.admins.length, 'admins found');
    console.log('');

    console.log('🎉 All Admin Management Tests Passed!');
    console.log('');
    console.log('📋 Summary:');
    console.log('✅ Backend is running and healthy');
    console.log('✅ Admin login works');
    console.log('✅ Create admin works');
    console.log('✅ Get all admins works');
    console.log('✅ Reset password works');
    console.log('✅ Update admin works');
    console.log('✅ Deactivate admin works');
    console.log('');
    console.log('🚀 Frontend should now work with these backend endpoints!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('1. Make sure backend is running: npm run dev (in backend folder)');
    console.log('2. Make sure frontend is running: npm run dev (in voting-system folder)');
    console.log('3. Check MongoDB connection');
    console.log('4. Check console for any errors');
  }
}

testAdminFunctionality(); 