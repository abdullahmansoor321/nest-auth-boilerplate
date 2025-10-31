# Swagger API Documentation - Quick Reference

## 🌐 Access Point
```
http://localhost:3000/api
```

## 📋 Updated Documentation (October 31, 2024)

### What's New

The Swagger documentation has been updated to reflect the **refactored admin protection system**:

#### ✅ Enhanced Admin Endpoint Documentation

**PATCH /admin/users/:id/role** now includes:

1. **Detailed Operation Description**
   - Security features explained in detail
   - Token invalidation behavior
   - Self-demotion prevention
   - Last admin protection
   - Audit logging

2. **Security Validation Details**
   - **Self-Demotion**: Cannot demote yourself
   - **Last Admin**: System always keeps at least one admin
   - **Token Invalidation**: All sessions terminated on role change
   - **Flexible Protection**: Any admin can be demoted (if another exists)

3. **Enhanced Error Documentation**
   - 400 Bad Request with two specific scenarios:
     - Self-demotion attempt
     - Last admin demotion attempt
   - Clear examples of error messages
   - Solutions provided for each error case

4. **Updated Success Response**
   - Includes `sessionsInvalidated: true` flag
   - User-facing message about forced re-login
   - Complete response schema

#### ✅ Main API Description Updates

**Added sections for:**
- Admin operation security features
- Role management security validations
- Token invalidation on role changes
- Flexible admin protection philosophy

#### ✅ Documentation Improvements

**SWAGGER_UPDATES.md** now includes:
- Security validations section
- Testing guide for each validation
- Token invalidation explanation
- Flexible admin management notes

## 🔑 Key Security Features Documented

### 1. Token Invalidation
```
When role changes:
✅ All refresh tokens deleted
✅ User must re-login
✅ New JWT issued with updated role
✅ Old JWT becomes unusable
```

### 2. Self-Demotion Prevention
```
Error: "Cannot demote yourself. Ask another administrator to change your role."
Purpose: Prevents accidental lockout
Solution: Another admin must change your role
```

### 3. Last Admin Protection
```
Error: "Cannot demote the last administrator. Promote another user to ADMIN first."
Purpose: Ensures system always has admin access
Solution: Promote another user first
```

### 4. Flexible Admin Management
```
✅ Any admin can be demoted (if another exists)
✅ No hard-coded "protected" users
✅ System-level protection, not user-level
✅ Operational flexibility
```

## 📖 Using the Updated Swagger UI

### Step 1: Login as Admin
```http
POST /auth/login
{
  "email": "admin@example.com",
  "password": "password123"
}
```

Copy the `access_token` from response.

### Step 2: Authorize
1. Click "Authorize" button (top right)
2. Paste token in the value field
3. Click "Authorize"
4. Click "Close"

### Step 3: Test Role Management

**Get Users:**
```http
GET /users
```
Copy a user ID from the response.

**Promote to Admin:**
```http
PATCH /admin/users/{userId}/role
{
  "role": "ADMIN"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "id": "...",
    "email": "user@example.com",
    "name": "User Name",
    "role": "ADMIN",
    "sessionsInvalidated": true,
    "message": "Role updated. User must re-login to apply changes. All active sessions have been terminated."
  }
}
```

### Step 4: Test Security Validations

**Test Self-Demotion Prevention:**
```http
# Get your own user ID
GET /users/me

# Try to demote yourself (should fail)
PATCH /admin/users/{your-id}/role
{
  "role": "USER"
}

# Expected Error:
{
  "statusCode": 400,
  "message": "Cannot demote yourself. Ask another administrator to change your role.",
  "error": "Bad Request"
}
```

**Test Last Admin Protection:**
```http
# Ensure only one admin exists
# Try to demote that admin (should fail)
PATCH /admin/users/{last-admin-id}/role
{
  "role": "USER"
}

# Expected Error:
{
  "statusCode": 400,
  "message": "Cannot demote the last administrator. Promote another user to ADMIN first.",
  "error": "Bad Request"
}
```

**Test Authorization:**
```http
# Logout (click Authorize → Logout)
# Login as regular user
POST /auth/login
{
  "email": "jane.doe@example.com",
  "password": "password123"
}

# Authorize with new token
# Try admin endpoint (should fail)
PATCH /admin/users/{any-id}/role

# Expected Error:
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

## 📊 Response Format

All API responses follow this structure:

**Success:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": { /* actual data */ }
}
```

**Error:**
```json
{
  "statusCode": 400 | 401 | 403 | 404 | 500,
  "message": "Error description",
  "error": "Error type",
  "path": "/api/path",
  "timestamp": "2024-10-31T12:00:00.000Z"
}
```

## 🏷️ API Tags

| Tag | Endpoints | Auth Required | Role Required |
|-----|-----------|---------------|---------------|
| **auth** | Login, Register, Refresh, Logout | No (except logout) | - |
| **users** | Get profile, List users | Yes | ADMIN (for list) |
| **admin** | Role management | Yes | ADMIN |

## 🔐 JWT Payload Structure

The documentation now clearly shows the JWT includes:

```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "USER" | "ADMIN",
  "iat": 1234567890,
  "exp": 1234568790
}
```

**Key Points:**
- Role in payload = no DB query for authorization
- Role change = all sessions invalidated
- User must re-login for new JWT

## 📝 Audit Logs

All role changes are logged with:
```
[AdminController] ADMIN ACTION: Role Change. 
Admin User ID: xxx, Target User ID: yyy, New Role: ADMIN. 
All sessions invalidated.
```

Check server console for these entries.

## 🚀 Quick Start

1. **Start server:**
   ```bash
   npm run start:dev
   ```

2. **Open Swagger:**
   ```
   http://localhost:3000/api
   ```

3. **Test workflow:**
   - Login → Authorize → Test endpoints → Verify security

## 📚 Additional Resources

- **JWT Decoder**: https://jwt.io
- **OpenAPI JSON**: http://localhost:3000/api-json
- **Full Documentation**: See `SWAGGER_UPDATES.md`

---

**Last Updated**: October 31, 2024  
**Version**: 1.0 (Post-refactoring)  
**Status**: ✅ Production-ready
