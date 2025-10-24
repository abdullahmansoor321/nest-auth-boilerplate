# Test Authentication Endpoints

## Prerequisites
Ensure the app is running and database is seeded with sample users.

## Test Login with Seeded User

### Using PowerShell (Invoke-RestMethod)
```powershell
# Login with Admin user (from seed)
$response = Invoke-RestMethod -Method Post -Uri http://localhost:3000/auth/login -Body (ConvertTo-Json @{
  email = "admin@example.com"
  password = "password123"
}) -ContentType 'application/json'

$response
# Should return: { access_token: "eyJhbGciOiJIUzI1..." }

# Store token for protected routes
$token = $response.access_token
Write-Host "Token: $token"
```

### Using cURL
```bash
# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
```

### Using Swagger UI
1. Navigate to http://localhost:3000/api
2. Expand `POST /auth/login`
3. Click "Try it out"
4. Enter credentials:
   ```json
   {
     "email": "admin@example.com",
     "password": "password123"
   }
   ```
5. Click "Execute"
6. Copy the `access_token` from the response

## Test with Invalid Credentials

```powershell
# Should return 401 Unauthorized
Invoke-RestMethod -Method Post -Uri http://localhost:3000/auth/login -Body (ConvertTo-Json @{
  email = "admin@example.com"
  password = "wrongpassword"
}) -ContentType 'application/json'
```

## Available Test Users (from seed)
- **Admin User**: admin@example.com / password123
- **Jane Doe**: jane.doe@example.com / password123

---

## Test Protected Endpoint (JWT Authentication)

### Step 1: Login and Get Token

```powershell
# Login and store token
$response = Invoke-RestMethod -Method Post -Uri http://localhost:3000/auth/login -Body (ConvertTo-Json @{
  email = "admin@example.com"
  password = "password123"
}) -ContentType 'application/json'

$token = $response.data.access_token
Write-Host "Token: $token"
```

### Step 2: Access Protected Profile Endpoint

#### Using PowerShell with Bearer Token
```powershell
# Access protected profile endpoint
$headers = @{
  Authorization = "Bearer $token"
}

$profile = Invoke-RestMethod -Method Get -Uri http://localhost:3000/users/me -Headers $headers
$profile
# Should return: { statusCode: 200, message: "Success", data: { userId: "...", email: "admin@example.com" } }
```

#### Using cURL
```bash
# Replace YOUR_TOKEN_HERE with actual token
curl -X GET http://localhost:3000/users/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Step 3: Test Without Token (Should Fail)

```powershell
# Should return 401 Unauthorized
try {
  Invoke-RestMethod -Method Get -Uri http://localhost:3000/users/me
} catch {
  Write-Host "Expected error: Unauthorized"
  $_.Exception.Response.StatusCode
}
```

### Using Swagger UI for Protected Endpoints

1. Navigate to http://localhost:3000/api
2. First, login via `POST /auth/login` and copy the `access_token`
3. Click the **"Authorize"** button at the top right
4. Enter: `Bearer YOUR_TOKEN_HERE` (paste your token after "Bearer ")
5. Click "Authorize" and then "Close"
6. Now you can test `GET /users/me` - it will automatically include the token
7. Click "Try it out" and "Execute"
8. Should return your user profile: `{ userId: "...", email: "..." }`

### Complete PowerShell Test Flow

```powershell
# Complete test flow
Write-Host "=== Testing Authentication Flow ===" -ForegroundColor Green

# Step 1: Login
Write-Host "`n1. Logging in..." -ForegroundColor Yellow
$loginResponse = Invoke-RestMethod -Method Post -Uri http://localhost:3000/auth/login -Body (ConvertTo-Json @{
  email = "admin@example.com"
  password = "password123"
}) -ContentType 'application/json'

$token = $loginResponse.data.access_token
Write-Host "✓ Login successful! Token received." -ForegroundColor Green

# Step 2: Access protected route
Write-Host "`n2. Accessing protected profile endpoint..." -ForegroundColor Yellow
$headers = @{ Authorization = "Bearer $token" }
$profile = Invoke-RestMethod -Method Get -Uri http://localhost:3000/users/me -Headers $headers

Write-Host "✓ Profile retrieved successfully!" -ForegroundColor Green
Write-Host "User ID: $($profile.data.userId)" -ForegroundColor Cyan
Write-Host "Email: $($profile.data.email)" -ForegroundColor Cyan

# Step 3: Test unauthorized access
Write-Host "`n3. Testing unauthorized access (without token)..." -ForegroundColor Yellow
try {
  Invoke-RestMethod -Method Get -Uri http://localhost:3000/users/me
  Write-Host "✗ Expected error but got success!" -ForegroundColor Red
} catch {
  Write-Host "✓ Correctly rejected unauthorized request" -ForegroundColor Green
}

Write-Host "`n=== All tests completed! ===" -ForegroundColor Green
```
