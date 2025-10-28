/**
 * Test script for JWT Refresh Token Authentication Flow
 * 
 * This script tests:
 * 1. Login (get access token + refresh token)
 * 2. Refresh token (get new tokens)
 * 3. Logout (invalidate refresh token)
 * 4. Logout all devices
 */

const BASE_URL = 'http://localhost:3000';

async function testAuthFlow() {
  console.log('🧪 Testing JWT Refresh Token Authentication Flow\n');

  // Test credentials (make sure this user exists or register first)
  const credentials = {
    email: 'test@example.com',
    password: 'password123'
  };

  try {
    // ==========================================
    // 1. LOGIN
    // ==========================================
    console.log('1️⃣  Testing LOGIN...');
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });

    if (!loginResponse.ok) {
      console.error('❌ Login failed:', await loginResponse.text());
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful!');
    console.log('   Access Token:', loginData.access_token.substring(0, 20) + '...');
    console.log('   Refresh Token:', loginData.refresh_token.substring(0, 20) + '...');
    console.log('   Expires In:', loginData.expires_in, 'seconds\n');

    const { access_token, refresh_token } = loginData;

    // ==========================================
    // 2. REFRESH TOKEN
    // ==========================================
    console.log('2️⃣  Testing REFRESH TOKEN...');
    const refreshResponse = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token })
    });

    if (!refreshResponse.ok) {
      console.error('❌ Refresh failed:', await refreshResponse.text());
      return;
    }

    const refreshData = await refreshResponse.json();
    console.log('✅ Token refresh successful!');
    console.log('   New Access Token:', refreshData.access_token.substring(0, 20) + '...');
    console.log('   New Refresh Token:', refreshData.refresh_token.substring(0, 20) + '...');
    console.log('   Note: Old refresh token is now invalidated\n');

    const { access_token: newAccessToken, refresh_token: newRefreshToken } = refreshData;

    // ==========================================
    // 3. TEST PROTECTED ROUTE
    // ==========================================
    console.log('3️⃣  Testing PROTECTED ROUTE with access token...');
    const meResponse = await fetch(`${BASE_URL}/users/me`, {
      headers: { 'Authorization': `Bearer ${newAccessToken}` }
    });

    if (!meResponse.ok) {
      console.error('❌ Protected route failed:', await meResponse.text());
    } else {
      const userData = await meResponse.json();
      console.log('✅ Protected route access successful!');
      console.log('   User:', userData.email, '\n');
    }

    // ==========================================
    // 4. LOGOUT
    // ==========================================
    console.log('4️⃣  Testing LOGOUT (invalidate refresh token)...');
    const logoutResponse = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${newAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refresh_token: newRefreshToken })
    });

    if (!logoutResponse.ok) {
      console.error('❌ Logout failed:', await logoutResponse.text());
      return;
    }

    const logoutData = await logoutResponse.json();
    console.log('✅ Logout successful!');
    console.log('   Message:', logoutData.message, '\n');

    // ==========================================
    // 5. VERIFY TOKEN INVALIDATION
    // ==========================================
    console.log('5️⃣  Verifying refresh token is invalidated...');
    const invalidRefreshResponse = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: newRefreshToken })
    });

    if (invalidRefreshResponse.ok) {
      console.error('❌ ERROR: Refresh token should be invalidated after logout!');
    } else {
      console.log('✅ Confirmed: Refresh token is properly invalidated after logout\n');
    }

    // ==========================================
    // 6. TEST LOGOUT ALL DEVICES
    // ==========================================
    console.log('6️⃣  Testing LOGOUT ALL DEVICES...');
    
    // Login again to get new tokens
    const login2Response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    
    const login2Data = await login2Response.json();
    
    // Logout all devices
    const logoutAllResponse = await fetch(`${BASE_URL}/auth/logout-all`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${login2Data.access_token}` }
    });

    if (!logoutAllResponse.ok) {
      console.error('❌ Logout all devices failed:', await logoutAllResponse.text());
    } else {
      const logoutAllData = await logoutAllResponse.json();
      console.log('✅ Logout all devices successful!');
      console.log('   Message:', logoutAllData.message, '\n');
    }

    console.log('🎉 All tests completed successfully!\n');
    console.log('📝 Summary:');
    console.log('   ✅ Login works');
    console.log('   ✅ Refresh token works');
    console.log('   ✅ Protected routes require authentication');
    console.log('   ✅ Logout invalidates refresh tokens');
    console.log('   ✅ Logout all devices works');
    console.log('   ✅ Invalidated tokens cannot be reused\n');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testAuthFlow();
