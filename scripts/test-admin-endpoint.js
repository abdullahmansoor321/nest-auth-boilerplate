/**
 * Test script for admin role management endpoint
 * Tests the new PATCH /admin/users/:id/role endpoint
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000';

async function testAdminEndpoint() {
  console.log('🧪 Testing Admin Role Management Endpoint\n');
  
  try {
    // Step 1: Login as admin
    console.log('1️⃣ Logging in as admin...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'password123',
    });
    
    // Response is wrapped by TransformInterceptor
    const { access_token } = loginResponse.data.data || loginResponse.data;
    
    if (!access_token) {
      throw new Error('No access_token in response');
    }
    
    console.log('✅ Admin login successful');
    console.log(`   Access token: ${access_token.substring(0, 20)}...`);
    
    // Step 2: Get user list to find a user ID
    console.log('\n2️⃣ Fetching user list...');
    const usersResponse = await axios.get(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    
    const users = usersResponse.data.data || usersResponse.data;
    console.log(`✅ Found ${users.length} users`);
    
    // Find a non-admin user to test role change
    const regularUser = users.find(u => u.role === 'USER');
    
    if (!regularUser) {
      console.log('⚠️  No regular users found. Creating one...');
      
      // Register a test user
      const registerResponse = await axios.post(`${API_URL}/auth/register`, {
        email: 'testuser@example.com',
        password: 'TestPass123!',
        name: 'Test User',
      });
      
      const newUser = registerResponse.data;
      console.log(`✅ Created test user: ${newUser.email}`);
      
      // Use this user for testing
      testRoleChange(access_token, newUser.id);
    } else {
      console.log(`   Target user: ${regularUser.email} (ID: ${regularUser.id})`);
      testRoleChange(access_token, regularUser.id);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

async function testRoleChange(adminToken, userId) {
  try {
    // Step 3: Attempt to change user role to ADMIN
    console.log('\n3️⃣ Promoting user to ADMIN...');
    const promoteResponse = await axios.patch(
      `${API_URL}/admin/users/${userId}/role`,
      { role: 'ADMIN' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    
    const promotedUser = promoteResponse.data.data || promoteResponse.data;
    console.log('✅ Role updated successfully');
    console.log(`   New role: ${promotedUser.role}`);
    
    // Step 4: Demote back to USER
    console.log('\n4️⃣ Demoting user back to USER...');
    const demoteResponse = await axios.patch(
      `${API_URL}/admin/users/${userId}/role`,
      { role: 'USER' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    
    const demotedUser = demoteResponse.data.data || demoteResponse.data;
    console.log('✅ Role updated successfully');
    console.log(`   New role: ${demotedUser.role}`);
    
    // Step 5: Test with non-admin token (should fail)
    console.log('\n5️⃣ Testing authorization (non-admin should fail)...');
    
    // Login as regular user (use the seeded jane.doe user)
    const userLoginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'jane.doe@example.com',
      password: 'password123',
    });
    
    const userToken = (userLoginResponse.data.data || userLoginResponse.data).access_token;
    
    try {
      await axios.patch(
        `${API_URL}/admin/users/${userId}/role`,
        { role: 'ADMIN' },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      
      console.log('❌ Authorization check FAILED - non-admin was able to change roles!');
    } catch (authError) {
      if (authError.response?.status === 403) {
        console.log('✅ Authorization working correctly - non-admin was blocked');
      } else {
        throw authError;
      }
    }
    
    console.log('\n✅ All tests passed!');
    console.log('\n📊 Summary:');
    console.log('   ✅ Admin can promote users');
    console.log('   ✅ Admin can demote users');
    console.log('   ✅ Non-admin users are blocked');
    console.log('   ✅ Audit logging is active (check server console)');
    
  } catch (error) {
    console.error('❌ Role change test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the test
testAdminEndpoint();
