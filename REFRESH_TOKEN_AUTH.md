# JWT Refresh Token Authentication Flow

This implementation provides a secure authentication system using **access tokens** and **refresh tokens**.

## 🔐 How It Works

### Token Types

1. **Access Token** (Short-lived: 15 minutes)
   - Used for authenticating API requests
   - Sent in the `Authorization: Bearer <token>` header
   - Expires quickly for security

2. **Refresh Token** (Long-lived: 7 days)
   - Stored securely in the database
   - Used to obtain new access tokens
   - Can be invalidated (logout)

---

## 📡 API Endpoints

### 1. Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6...",
  "expires_in": 900
}
```

---

### 2. Refresh Token
When your access token expires, use the refresh token to get a new one:

```http
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6..."
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "new_refresh_token_here...",
  "expires_in": 900
}
```

> **Note:** The old refresh token is invalidated and a new one is issued (token rotation).

---

### 3. Logout (Single Device)
Invalidates the current refresh token:

```http
POST /auth/logout
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "refresh_token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6..."
}
```

**Response:**
```json
{
  "message": "Logout successful"
}
```

---

### 4. Logout All Devices
Invalidates ALL refresh tokens for the user:

```http
POST /auth/logout-all
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "message": "Logged out from all devices"
}
```

---

## 🔄 Client-Side Flow

### Initial Login
```javascript
// 1. Login
const response = await fetch('/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const { access_token, refresh_token } = await response.json();

// Store tokens securely
localStorage.setItem('access_token', access_token);
localStorage.setItem('refresh_token', refresh_token);
```

### Making Authenticated Requests
```javascript
// 2. Use access token for API requests
const response = await fetch('/api/protected-route', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
  }
});

// If you get 401 Unauthorized, refresh the token
if (response.status === 401) {
  await refreshAccessToken();
  // Retry the request
}
```

### Refresh Access Token
```javascript
async function refreshAccessToken() {
  const response = await fetch('/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      refresh_token: localStorage.getItem('refresh_token')
    })
  });

  if (response.ok) {
    const { access_token, refresh_token } = await response.json();
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
  } else {
    // Refresh token expired or invalid - redirect to login
    window.location.href = '/login';
  }
}
```

### Logout
```javascript
async function logout() {
  await fetch('/auth/logout', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      refresh_token: localStorage.getItem('refresh_token')
    })
  });

  // Clear tokens from storage
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  
  // Redirect to login
  window.location.href = '/login';
}
```

---

## 🛡️ Security Features

1. **Short-lived Access Tokens** (15 minutes)
   - Minimizes damage if token is stolen
   - Must be refreshed regularly

2. **Refresh Token Rotation**
   - New refresh token issued on each refresh
   - Old refresh token is invalidated
   - Prevents replay attacks

3. **Database-Backed Refresh Tokens**
   - Tokens stored in database with expiration
   - Can be revoked at any time (logout)
   - Automatic cleanup of expired tokens

4. **Multi-Device Logout**
   - Users can logout from all devices
   - Invalidates all refresh tokens for that user

---

## 🗄️ Database Schema

```prisma
model RefreshToken {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  token     String   @unique
  userId    String   @db.ObjectId
  expiresAt DateTime
  createdAt DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
}
```

---

## 🧹 Maintenance

### Cleanup Expired Tokens
You can run a cron job to clean up expired refresh tokens:

```typescript
// In a scheduled task or cron job
await refreshTokenService.cleanupExpiredTokens();
```

---

## 🔍 Testing

### Test Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
```

### Test Refresh
```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"YOUR_REFRESH_TOKEN"}'
```

### Test Logout
```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"YOUR_REFRESH_TOKEN"}'
```

---

## ⚠️ Important Notes

1. **Client Responsibility**: The client must handle token storage and refresh logic
2. **HTTPS Required**: Always use HTTPS in production to protect tokens in transit
3. **Secure Storage**: 
   - For web: Use `httpOnly` cookies (preferred) or localStorage
   - For mobile: Use secure keychain/keystore
4. **Token Expiration**: Access tokens expire after 15 minutes, refresh tokens after 7 days
5. **Automatic Cleanup**: Implement a cron job to remove expired refresh tokens from the database

---

## 🚀 Production Recommendations

1. **Use HTTP-Only Cookies** for refresh tokens instead of localStorage
2. **Implement CSRF Protection** when using cookies
3. **Add Rate Limiting** on refresh and login endpoints
4. **Monitor Suspicious Activity** (multiple refresh attempts, etc.)
5. **Implement Token Fingerprinting** for additional security
6. **Set up Automated Token Cleanup** via cron job

---

## 📚 References

- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OAuth 2.0 Refresh Tokens](https://oauth.net/2/grant-types/refresh-token/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
