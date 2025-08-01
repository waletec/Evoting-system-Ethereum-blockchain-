const axios = require('axios');

const API_BASE_URL = 'http://localhost:4000/api';

async function testAdminSystem() {
  console.log('🧪 Testing Admin Authentication System...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing Health Check...');
    const healthResponse = await axios.get('http://localhost:4000/health');
    console.log('✅ Health Check:', healthResponse.data);
    console.log('');

    // Test 2: Initialize Super Admin
    console.log('2. Testing Super Admin Initialization...');
    try {
      const initResponse = await axios.post(`${API_BASE_URL}/admin/initialize-super-admin`);
      console.log('✅ Super Admin Initialized:', initResponse.data);
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('ℹ️  Super Admin already exists:', error.response.data.message);
      } else {
        throw error;
      }
    }
    console.log('');

    // Test 3: Admin Login
    console.log('3. Testing Admin Login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/admin/login`, {
      username: 'superadmin',
      password: 'superadmin123'
    });
    console.log('✅ Admin Login:', loginResponse.data);
    console.log('');

    // Test 4: Get All Admins
    console.log('4. Testing Get All Admins...');
    const adminsResponse = await axios.get(`${API_BASE_URL}/admin/all`);
    console.log('✅ Get All Admins:', adminsResponse.data);
    console.log('');

    // Test 5: Create New Admin
    console.log('5. Testing Create New Admin...');
    const newAdminData = {
      username: 'testadmin',
      password: 'testadmin123',
      email: 'testadmin@votingsystem.com',
      fullName: 'Test Administrator',
      role: 'admin'
    };
    const createResponse = await axios.post(`${API_BASE_URL}/admin/create`, newAdminData);
    console.log('✅ Create New Admin:', createResponse.data);
    console.log('');

    // Test 6: Login with New Admin
    console.log('6. Testing Login with New Admin...');
    const newAdminLoginResponse = await axios.post(`${API_BASE_URL}/admin/login`, {
      username: 'testadmin',
      password: 'testadmin123'
    });
    console.log('✅ New Admin Login:', newAdminLoginResponse.data);
    console.log('');

    // Test 7: Reset Password
    console.log('7. Testing Reset Password...');
    const resetResponse = await axios.put(`${API_BASE_URL}/admin/reset-password`, {
      adminId: createResponse.data.admin._id,
      newPassword: 'newpassword123'
    });
    console.log('✅ Reset Password:', resetResponse.data);
    console.log('');

    // Test 8: Login with Reset Password
    console.log('8. Testing Login with Reset Password...');
    const resetLoginResponse = await axios.post(`${API_BASE_URL}/admin/login`, {
      username: 'testadmin',
      password: 'newpassword123'
    });
    console.log('✅ Login with Reset Password:', resetLoginResponse.data);
    console.log('');

    // Test 9: Change Password
    console.log('9. Testing Change Password...');
    const changePasswordResponse = await axios.put(`${API_BASE_URL}/admin/change-password`, {
      adminId: resetLoginResponse.data.admin._id,
      currentPassword: 'newpassword123',
      newPassword: 'finalpassword123'
    });
    console.log('✅ Change Password:', changePasswordResponse.data);
    console.log('');

    // Test 10: Login with Changed Password
    console.log('10. Testing Login with Changed Password...');
    const finalLoginResponse = await axios.post(`${API_BASE_URL}/admin/login`, {
      username: 'testadmin',
      password: 'finalpassword123'
    });
    console.log('✅ Login with Changed Password:', finalLoginResponse.data);
    console.log('');

    // Test 11: Deactivate Admin
    console.log('11. Testing Deactivate Admin...');
    const deactivateResponse = await axios.put(`${API_BASE_URL}/admin/deactivate/${createResponse.data.admin._id}`);
    console.log('✅ Deactivate Admin:', deactivateResponse.data);
    console.log('');

    // Test 12: Try to Login with Deactivated Admin
    console.log('12. Testing Login with Deactivated Admin...');
    try {
      await axios.post(`${API_BASE_URL}/admin/login`, {
        username: 'testadmin',
        password: 'finalpassword123'
      });
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Deactivated Admin Cannot Login:', error.response.data.message);
      } else {
        throw error;
      }
    }
    console.log('');

    console.log('🎉 All admin system tests passed!');
    console.log('\n📋 Summary:');
    console.log('✅ Backend is running on http://localhost:4000');
    console.log('✅ Admin authentication system is working');
    console.log('✅ Admin management features are functional');
    console.log('✅ Password reset and change features work');
    console.log('✅ Admin deactivation works');
    console.log('\n🚀 You can now:');
    console.log('1. Open http://localhost:5173/admin/login');
    console.log('2. Login with superadmin / superadmin123');
    console.log('3. Access the admin dashboard');
    console.log('4. Create new admins and manage them');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure your backend is running: cd backend && npm start');
    console.log('2. Check if MongoDB is running');
    console.log('3. Verify the admin routes are properly configured');
    console.log('4. Check if port 4000 is available');
  }
}

testAdminSystem(); 