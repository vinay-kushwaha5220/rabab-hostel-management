# 🚀 Authentication System - Quick Start Guide

## Step 1: Start Backend

```bash
cd backend
npm run dev
```

✅ Backend running on `http://localhost:5000`

---

## Step 2: Start Frontend

```bash
cd frontend
npm run dev
```

✅ Frontend running on `http://localhost:5173`

---

## Step 3: Test New Authentication System

### Option A: Register New User

1. Go to: `http://localhost:5173/register-v2`
2. Fill the form:
   - **Name**: Your Name
   - **Email**: your@email.com
   - **Phone**: 1234567890 (optional)
   - **Role**: User or Admin
   - **Password**: password123
   - **Confirm Password**: password123
3. Click "Register"
4. ✅ Account created! Redirected to login

### Option B: Login with Existing Admin

1. Go to: `http://localhost:5173/login-v2`
2. Enter credentials:
   - **Email**: `admin@gmail.com`
   - **Password**: `admin123`
3. Click "Login"
4. ✅ Logged in! Redirected to admin dashboard

---

## 🎯 What's Different in V2?

### Old System (`/login`)
- ❌ Single token (no refresh)
- ❌ Token expires, user logged out
- ❌ Manual token management

### New System (`/login-v2`) ✨
- ✅ **Access Token** (15 min) + **Refresh Token** (7 days)
- ✅ **Automatic token refresh** when expired
- ✅ **HTTP-only cookies** for security
- ✅ **Seamless experience** - user never logged out
- ✅ **Multi-device session management**
- ✅ **Logout from all devices** option

---

## 🔄 Test Auto Token Refresh

### Method 1: Wait 15 Minutes
1. Login to the system
2. Wait 15 minutes
3. Make any API request (navigate to any page)
4. ✅ Token automatically refreshes in background
5. ✅ Request succeeds without interruption

### Method 2: Modify Token Expiry (For Testing)

**Backend**: `backend/src/utils/jwt.ts`
```typescript
// Change from 15 minutes to 1 minute for testing
const ACCESS_TOKEN_EXPIRY = "1m" // Was "15m"
```

1. Restart backend
2. Login
3. Wait 1 minute
4. Navigate to any page
5. ✅ Watch console: "✅ Token refreshed automatically"
6. ✅ Page loads successfully

---

## 🔐 Test Security Features

### Test 1: HTTP-Only Cookie
1. Login to system
2. Open browser DevTools → Application → Cookies
3. ✅ See `refreshToken` cookie
4. ✅ HttpOnly flag is checked
5. ✅ Cannot access via JavaScript

### Test 2: Token Expiry
1. Login to system
2. Copy access token from localStorage
3. Wait for token to expire (15 min or 1 min if modified)
4. Try to use expired token
5. ✅ Automatically refreshes
6. ✅ New token generated

### Test 3: Logout
1. Login to system
2. Click "Logout"
3. ✅ Refresh token deleted from database
4. ✅ Cookie cleared
5. ✅ localStorage cleared
6. ✅ Redirected to login

### Test 4: Logout All Devices
1. Login from 2 different browsers
2. In one browser, click "Logout All Devices"
3. ✅ All refresh tokens deleted
4. ✅ Both browsers logged out
5. ✅ Must login again on both

---

## 📊 Monitor Authentication

### Backend Console
Watch for these logs:
```
✅ User registered: test@example.com (user)
✅ User logged in: admin@gmail.com (admin)
✅ Access token refreshed for user: admin@gmail.com
✅ User logged out
✅ User logged out from all devices: 1
```

### Frontend Console
Watch for these logs:
```
✅ Access token refreshed successfully
```

### Database
Check refresh tokens:
```bash
cd backend
npx prisma studio
```
- Open `RefreshToken` table
- See all active sessions
- See device info and IP addresses

---

## 🎨 UI Features

### Login Page (`/login-v2`)
- ✅ Email and password fields
- ✅ Loading state during login
- ✅ Error messages
- ✅ Link to register
- ✅ Demo credentials shown
- ✅ Gradient background

### Register Page (`/register-v2`)
- ✅ Full name, email, phone, password
- ✅ Role selection (User/Admin)
- ✅ Password confirmation
- ✅ Validation messages
- ✅ Loading state
- ✅ Link to login

---

## 🔧 API Endpoints

### Public Endpoints
```
POST /api/v2/auth/register    - Register new user
POST /api/v2/auth/login       - Login user
POST /api/v2/auth/refresh     - Refresh access token
POST /api/v2/auth/logout      - Logout user
```

### Protected Endpoints (Require Access Token)
```
GET  /api/v2/auth/me          - Get current user
POST /api/v2/auth/logout-all  - Logout from all devices
GET  /api/v2/auth/sessions    - Get active sessions
```

---

## 🧪 Test with Postman/Thunder Client

### 1. Register
```http
POST http://localhost:5000/api/v2/auth/register
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123",
  "role": "user"
}
```

### 2. Login
```http
POST http://localhost:5000/api/v2/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 2,
    "name": "Test User",
    "email": "test@example.com",
    "role": "user"
  }
}
```

**Note**: Refresh token automatically set in cookie!

### 3. Get Current User
```http
GET http://localhost:5000/api/v2/auth/me
Authorization: Bearer <paste_access_token_here>
```

### 4. Refresh Token
```http
POST http://localhost:5000/api/v2/auth/refresh
Cookie: refreshToken=<automatically_sent>
```

### 5. Logout
```http
POST http://localhost:5000/api/v2/auth/logout
Cookie: refreshToken=<automatically_sent>
```

---

## 🎯 Role-Based Access

### Admin User
- Email: `admin@gmail.com`
- Password: `admin123`
- Access: `/admin/*` routes
- Can manage everything

### Regular User
- Register new user with role "user"
- Access: `/dashboard` route
- Can book rooms, view own bookings

---

## 🔍 Troubleshooting

### Issue: "Refresh token not found"
**Solution**: Make sure cookies are enabled and `withCredentials: true` is set

### Issue: "CORS error"
**Solution**: Backend CORS is configured for `http://localhost:5173`

### Issue: "Token expired" error persists
**Solution**: 
1. Clear localStorage
2. Clear cookies
3. Logout and login again

### Issue: Auto refresh not working
**Solution**:
1. Check browser console for errors
2. Verify refresh token exists in cookies
3. Check backend logs

---

## 📝 Quick Comparison

| Feature | Old System | New System (V2) |
|---------|-----------|-----------------|
| Access Token | ✅ Yes | ✅ Yes (15 min) |
| Refresh Token | ❌ No | ✅ Yes (7 days) |
| Auto Refresh | ❌ No | ✅ Yes |
| HTTP-Only Cookie | ❌ No | ✅ Yes |
| Multi-Device | ❌ No | ✅ Yes |
| Logout All | ❌ No | ✅ Yes |
| Session Tracking | ❌ No | ✅ Yes |
| Security | ⚠️ Basic | ✅ Production-Ready |

---

## ✅ Checklist

Before going to production:

- [ ] Change JWT secrets in `.env`
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS
- [ ] Update CORS origin to production URL
- [ ] Test all authentication flows
- [ ] Test token refresh
- [ ] Test logout from all devices
- [ ] Monitor active sessions
- [ ] Set up token cleanup job (delete expired tokens)

---

## 🎉 You're All Set!

The new authentication system is ready to use. Enjoy the seamless, secure experience! 🚀🔐

**Key Benefits:**
- ✅ Users stay logged in for 7 days
- ✅ Automatic token refresh (no interruption)
- ✅ Secure HTTP-only cookies
- ✅ Multi-device session management
- ✅ Production-ready security
