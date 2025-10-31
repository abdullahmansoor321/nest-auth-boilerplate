# Swagger Documentation Updates

## Overview
The Swagger/OpenAPI documentation has been comprehensively updated to reflect the recent authorization refactoring and new admin role management features.

## Access Swagger UI
Once the server is running, access the interactive API documentation at:
```
http://localhost:3000/api
```

## Key Updates

### 1. **Enhanced API Description**
The main Swagger page now includes:
- **Authentication Flow**: Login → JWT → Refresh cycle
- **JWT Payload Structure**: Documents that the token includes `{ sub, email, role }`
- **Role-Based Access Control**: Explains USER vs ADMIN roles
- **Security Features**: Lists all security measures (Helmet, CORS, etc.)
- **Admin Operations**: Notes about audit logging

### 2. **New Admin Tag**
Added dedicated `admin` tag for admin-only endpoints:
- Clearly separates admin operations from user operations
- All endpoints under this tag require ADMIN role

### 3. **Updated Authentication Endpoints**

#### **POST /auth/login**
- ✅ Documents that JWT payload includes user role
- ✅ Shows complete response structure with TransformInterceptor wrapping
- ✅ Explains token expiration (15 min for access, 7 days for refresh)
- ✅ Includes error responses (401 for invalid credentials)

#### **POST /auth/refresh**
- ✅ Documents that new access token includes updated role from database
- ✅ Explains token rotation (old refresh token invalidated)
- ✅ Shows complete request/response schemas

### 4. **New Admin Endpoints**

#### **PATCH /admin/users/:id/role**
Complete documentation including:
- ✅ Operation summary and detailed description
- ✅ Security features explained:
  - Token invalidation on role change
  - Self-demotion prevention
  - Last admin protection
  - Audit logging
- ✅ Behavior notes:
  - Any admin can be demoted (if another exists)
  - No specific "protected" user accounts
  - System-level protection, not user-level
- ✅ Parameter documentation (user ID)
- ✅ Request body schema (role: USER | ADMIN)
- ✅ Success response (200) with sessionsInvalidated flag
- ✅ Error responses:
  - 400: Bad Request (self-demotion or last admin)
  - 401: Unauthorized (invalid/missing token)
  - 403: Forbidden (non-admin user)
  - 404: User not found
- ✅ Detailed error message examples for each 400 scenario

### 5. **Enhanced User Endpoints**

#### **GET /users** (Admin only)
- ✅ Clearly marked as admin-only
- ✅ Documents complete user object schema
- ✅ Notes that passwords are excluded
- ✅ Shows proper error responses (401, 403)

#### **GET /users/me**
- ✅ Documents authenticated user profile retrieval
- ✅ Shows complete response structure
- ✅ Includes proper error responses

## JWT Payload Documentation

The Swagger docs now clearly show the JWT structure:

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
- Role is embedded in the token (no database lookup needed for authorization)
- If user role changes, all sessions are invalidated immediately
- User must re-login to get updated token with new role
- Old tokens become unusable after role change (refresh tokens deleted)

## Security Validations Documented

The Swagger documentation now includes detailed information about admin endpoint security:

### **Self-Demotion Prevention**
- Admins cannot demote themselves
- Error: `"Cannot demote yourself. Ask another administrator to change your role."`
- Purpose: Prevents accidental lockout

### **Last Admin Protection**
- System must always have at least one admin
- Error: `"Cannot demote the last administrator. Promote another user to ADMIN first."`
- Purpose: Ensures administrative access is never lost

### **Token Invalidation**
- All user sessions terminated on role change
- Response includes `sessionsInvalidated: true`
- User receives message about forced re-login
- Purpose: Prevents stale JWT with old role

### **Flexible Admin Management**
- Any admin can be demoted (as long as another exists)
- No hard-coded "protected" users
- System-level protection, not user-level
- Purpose: Operational flexibility without security compromise

## Testing with Swagger UI

### 1. **Login**
1. Expand `POST /auth/login`
2. Click "Try it out"
3. Use credentials:
   ```json
   {
     "email": "admin@example.com",
     "password": "password123"
   }
   ```
4. Copy the `access_token` from the response

### 2. **Authorize**
1. Click the "Authorize" button at the top
2. Paste the access token
3. Click "Authorize"

### 3. **Test Admin Endpoints**
1. First, get list of users: `GET /users`
2. Copy a user ID from the response
3. Expand `PATCH /admin/users/:id/role`
4. Click "Try it out"
5. Enter the user ID
6. Set role to "ADMIN" or "USER"
7. Execute
8. Observe the response:
   - `sessionsInvalidated: true`
   - Message about forced re-login

### 4. **Test Security Validations**

**Test Self-Demotion Prevention:**
1. Get your own user ID from `GET /users/me`
2. Try to demote yourself: `PATCH /admin/users/{your-id}/role` with `role: "USER"`
3. Should receive 400 Bad Request

**Test Last Admin Protection:**
1. Ensure only one admin exists
2. Try to demote that admin
3. Should receive 400 Bad Request

**Test Token Invalidation:**
1. Promote a user to ADMIN
2. Try using their old access token (if you saved it)
3. Should fail after role change (refresh token deleted)

### 4. **Verify Authorization**
1. Logout (click "Authorize" → "Logout")
2. Login as regular user (jane.doe@example.com / password123)
3. Authorize with new token
4. Try accessing `PATCH /admin/users/:id/role`
5. Should receive 403 Forbidden (user lacks ADMIN role)

## Response Structure

All responses follow the TransformInterceptor format:

**Success:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": { /* actual response data */ }
}
```

**Error:**
```json
{
  "statusCode": 4xx | 5xx,
  "message": "Error message",
  "error": "Error type",
  "path": "/request/path",
  "timestamp": "ISO timestamp"
}
```

## Tags Organization

| Tag | Description | Authentication Required |
|-----|-------------|------------------------|
| `auth` | Login, register, refresh, logout | No (except logout) |
| `users` | User profiles and listing | Yes |
| `admin` | Role management | Yes (ADMIN only) |

## Security Schema

The Swagger UI includes Bearer Authentication:
- **Type**: HTTP Bearer
- **Scheme**: bearer
- **Format**: JWT
- **Header**: Authorization
- **Value**: `Bearer <token>`

## Audit Trail Note

The documentation now mentions that all admin actions (role changes) are logged with:
- Admin user ID
- Target user ID
- New role value
- Timestamp

Check server console logs for entries like:
```
[AdminController] ADMIN ACTION: Role Change. Admin User ID: xxx, Target User ID: yyy, New Role: ADMIN
```

## Next Steps

1. **Start the server**: `npm run start:dev`
2. **Open Swagger UI**: http://localhost:3000/api
3. **Test the endpoints** using the interactive documentation
4. **Review the enhanced descriptions** for implementation details

## Additional Resources

- **JWT Debugger**: https://jwt.io (paste your token to decode payload)
- **OpenAPI Spec**: The complete spec is available at http://localhost:3000/api-json
- **Postman Collection**: Export from Swagger UI (top-right menu)

---

**Last Updated**: October 31, 2025
**Version**: 1.0 (post-authorization refactoring)
