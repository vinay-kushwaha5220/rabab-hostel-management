# 🏗️ Rabab Stay - System Architecture

---

## 📐 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│                    (React + TypeScript)                          │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Browser (http://localhost:5174)                         │   │
│  │                                                           │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │  React Components                                   │ │   │
│  │  │  - HomePage, RoomsPage, BookingPage, etc.          │ │   │
│  │  │  - Admin Pages (Dashboard, Rooms, Bookings, etc.)  │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  │                          ↓                                │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │  AuthContextV2 (JWT Authentication)                │ │   │
│  │  │  - User state management                           │ │   │
│  │  │  - Token management                                │ │   │
│  │  │  - Login/Logout/Register                           │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  │                          ↓                                │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │  Axios API Client (apiV2.ts)                        │ │   │
│  │  │  - Request interceptor (add auth token)            │ │   │
│  │  │  - Response interceptor (auto token refresh)       │ │   │
│  │  │  - Error handling                                  │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↓ HTTP                                  │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                           │
│                    (Express.js Server)                           │
│                  (http://localhost:5000)                         │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  CORS Middleware                                         │   │
│  │  - Allow requests from http://localhost:5174            │   │
│  │  - Allow credentials (cookies)                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↓                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Route Handlers                                          │   │
│  │  - /api/v2/auth/* (Authentication)                      │   │
│  │  - /api/rooms/* (Room Management)                       │   │
│  │  - /api/bookings/* (Booking Management)                 │   │
│  │  - /api/dashboard/* (Dashboard)                         │   │
│  │  - /api/electricity/* (Electricity Bills)               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↓                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Middleware Stack                                        │   │
│  │  - authMiddlewareV2 (JWT verification)                  │   │
│  │  - adminMiddleware (Admin role check)                   │   │
│  │  - Error handling middleware                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↓                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Controllers                                             │   │
│  │  - authControllerV2 (Auth logic)                        │   │
│  │  - roomController (Room logic)                          │   │
│  │  - bookingController (Booking logic)                    │   │
│  │  - dashboardController (Dashboard logic)                │   │
│  │  - electricityController (Electricity logic)            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↓                                       │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                    DATA ACCESS LAYER                             │
│                   (Prisma ORM)                                   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Prisma Client                                           │   │
│  │  - Query builder                                         │   │
│  │  - Type-safe database access                            │   │
│  │  - Automatic migrations                                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↓                                       │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER                                │
│                   (SQLite)                                       │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  dev.db (SQLite Database)                               │   │
│  │                                                           │   │
│  │  Tables:                                                 │   │
│  │  - User (Customers & Admins)                            │   │
│  │  - RefreshToken (JWT Refresh Tokens)                    │   │
│  │  - Room (Hostel Rooms)                                  │   │
│  │  - Booking (Room Bookings)                              │   │
│  │  - Payment (Payment Records)                            │   │
│  │  - Notification (System Notifications)                  │   │
│  │  - ElectricityBill (Monthly Bills)                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER LOGIN FLOW                               │
└─────────────────────────────────────────────────────────────────┘

1. User enters credentials
   ↓
2. Frontend sends POST /api/v2/auth/login
   ↓
3. Backend validates credentials
   ├─ Check email exists
   ├─ Verify password (bcryptjs)
   └─ If invalid → Return 401 error
   ↓
4. Generate tokens
   ├─ Access Token (15 min expiry)
   │  └─ Stored in: localStorage
   │  └─ Used in: Authorization header
   │
   └─ Refresh Token (7 days expiry)
      └─ Stored in: HTTP-only cookie
      └─ Used in: /api/v2/auth/refresh endpoint
   ↓
5. Return tokens to frontend
   ├─ accessToken → localStorage
   └─ refreshToken → HTTP-only cookie (automatic)
   ↓
6. Redirect based on role
   ├─ Admin → /admin/dashboard
   └─ User → /dashboard
   ↓
7. User is logged in ✅

┌─────────────────────────────────────────────────────────────────┐
│                  TOKEN REFRESH FLOW                              │
└─────────────────────────────────────────────────────────────────┘

1. User makes API request
   ↓
2. Axios adds access token to header
   └─ Authorization: Bearer <accessToken>
   ↓
3. Backend validates token
   ├─ If valid → Process request ✅
   └─ If expired → Return 401 error
   ↓
4. Frontend Axios interceptor catches 401
   ↓
5. Check if already refreshing
   ├─ If yes → Queue request
   └─ If no → Proceed to refresh
   ↓
6. Send POST /api/v2/auth/refresh
   ├─ Includes refresh token (in cookie)
   └─ Backend validates refresh token
   ↓
7. Backend generates new access token
   ↓
8. Return new access token
   ↓
9. Update localStorage with new token
   ↓
10. Retry original request with new token
    ↓
11. Request succeeds ✅

┌─────────────────────────────────────────────────────────────────┐
│                    LOGOUT FLOW                                   │
└─────────────────────────────────────────────────────────────────┘

1. User clicks logout
   ↓
2. Frontend sends POST /api/v2/auth/logout
   ├─ Includes access token
   └─ Includes refresh token (in cookie)
   ↓
3. Backend invalidates tokens
   ├─ Delete refresh token from database
   └─ Clear cookie
   ↓
4. Frontend clears localStorage
   ├─ Remove accessToken
   └─ Remove user data
   ↓
5. Redirect to /login
   ↓
6. User is logged out ✅
```

---

## 📊 Database Schema Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE RELATIONSHIPS                        │
└─────────────────────────────────────────────────────────────────┘

User (1) ──────────────────────────────── (Many) RefreshToken
  │                                              (JWT tokens)
  │
  ├─ (1) ──────────────────────────────── (Many) Booking
  │                                              (Room bookings)
  │                                                    │
  │                                                    ├─ (1) ──── (1) Payment
  │                                                    │           (Payment record)
  │                                                    │
  │                                                    └─ (Many) Notification
  │                                                              (Alerts)
  │
  └─ role: "admin" or "user"

Room (1) ──────────────────────────────── (Many) Booking
  │                                              (Room bookings)
  │
  └─ (1) ──────────────────────────────── (Many) ElectricityBill
                                                 (Monthly bills)

Booking (1) ──────────────────────────── (1) Payment
  │
  └─ (1) ──────────────────────────────── (Many) Notification
```

---

## 🔄 Request/Response Cycle

```
┌─────────────────────────────────────────────────────────────────┐
│                  TYPICAL API REQUEST FLOW                        │
└─────────────────────────────────────────────────────────────────┘

FRONTEND                          BACKEND                    DATABASE
   │                                 │                           │
   ├─ 1. User Action                 │                           │
   │  (Click button)                 │                           │
   │                                 │                           │
   ├─ 2. Prepare Request             │                           │
   │  (Add auth token)               │                           │
   │                                 │                           │
   ├─ 3. Send HTTP Request ────────→ │                           │
   │  (POST /api/rooms)              │                           │
   │                                 ├─ 4. Parse Request         │
   │                                 │                           │
   │                                 ├─ 5. Verify Auth           │
   │                                 │  (Check JWT token)        │
   │                                 │                           │
   │                                 ├─ 6. Check Authorization   │
   │                                 │  (Admin only?)            │
   │                                 │                           │
   │                                 ├─ 7. Validate Input        │
   │                                 │                           │
   │                                 ├─ 8. Query Database ──────→│
   │                                 │  (Prisma query)           │
   │                                 │                           │
   │                                 │←─ 9. Return Data ─────────┤
   │                                 │  (Room data)              │
   │                                 │                           │
   │                                 ├─ 10. Format Response      │
   │                                 │                           │
   │←─ 11. Send Response ────────────┤                           │
   │  (JSON data)                    │                           │
   │                                 │                           │
   ├─ 12. Parse Response             │                           │
   │                                 │                           │
   ├─ 13. Update UI                  │                           │
   │  (Display data)                 │                           │
   │                                 │                           │
   └─ 14. User sees result ✅        │                           │
```

---

## 🎯 Component Hierarchy

```
App
├── AuthProvider (Context)
│   └── MainLayout
│       ├── Navbar
│       │   ├── Logo
│       │   ├── Navigation Links
│       │   └── User Profile
│       │
│       ├── Routes
│       │   ├── HomePage
│       │   │   ├── HeroSection
│       │   │   ├── FeaturesSection
│       │   │   ├── FeaturedRooms
│       │   │   ├── FacilitiesSection
│       │   │   ├── TestimonialsSection
│       │   │   └── CTASection
│       │   │
│       │   ├── RoomsPage
│       │   │   ├── RoomFilters
│       │   │   └── RoomCard (Grid)
│       │   │
│       │   ├── RoomDetailsPage
│       │   │   ├── ImageGallery
│       │   │   ├── RoomInfo
│       │   │   ├── Amenities
│       │   │   └── BookingButton
│       │   │
│       │   ├── BookingPage
│       │   │   ├── BookingForm
│       │   │   └── BookingSummary
│       │   │
│       │   ├── PaymentPage
│       │   │   ├── PaymentMethods
│       │   │   └── BookingSummary
│       │   │
│       │   ├── BookingConfirmationPage
│       │   │   ├── ConfirmationMessage
│       │   │   ├── BookingDetails
│       │   │   └── NextSteps
│       │   │
│       │   ├── DashboardPage (User)
│       │   │   ├── Statistics
│       │   │   ├── ActiveBookings
│       │   │   ├── PastBookings
│       │   │   └── QuickActions
│       │   │
│       │   ├── AdminDashboardPractical
│       │   │   ├── StatisticsCards
│       │   │   ├── QuickNavigation
│       │   │   └── RecentBookings
│       │   │
│       │   ├── RoomsManagement
│       │   │   ├── RoomTable
│       │   │   ├── CreateRoomForm
│       │   │   └── EditRoomForm
│       │   │
│       │   ├── BookingsManagement
│       │   │   ├── BookingTable
│       │   │   ├── SearchBar
│       │   │   └── StatusFilter
│       │   │
│       │   ├── RentersManagement
│       │   │   ├── RenterTable
│       │   │   └── RenterDetails
│       │   │
│       │   ├── PaymentsManagement
│       │   │   ├── PaymentTable
│       │   │   └── Analytics
│       │   │
│       │   ├── ElectricityBills
│       │   │   ├── BillTable
│       │   │   └── CreateBillForm
│       │   │
│       │   ├── NotificationsPage
│       │   │   └── NotificationList
│       │   │
│       │   ├── LoginPageV2
│       │   │   └── LoginForm
│       │   │
│       │   ├── RegisterPageV2
│       │   │   └── RegisterForm
│       │   │
│       │   └── ContactPage
│       │       └── ContactForm
│       │
│       └── FooterEnhanced
│           ├── LogoSection
│           ├── QuickLinks
│           ├── Services
│           └── Contact
│
└── UI Components (Reusable)
    ├── Button
    ├── Card
    ├── Badge
    ├── Input
    ├── LoadingSpinner
    └── EmptyState
```

---

## 🔌 API Endpoint Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                    API ENDPOINT TREE                             │
└─────────────────────────────────────────────────────────────────┘

/api
├── /v2/auth
│   ├── POST   /register          (Public)
│   ├── POST   /login             (Public)
│   ├── POST   /refresh           (Public - uses cookie)
│   ├── POST   /logout            (Protected)
│   ├── POST   /logout-all        (Protected)
│   └── GET    /me                (Protected)
│
├── /rooms
│   ├── GET    /                  (Public)
│   ├── GET    /:id               (Public)
│   ├── POST   /                  (Protected - Admin)
│   ├── PUT    /:id               (Protected - Admin)
│   └── DELETE /:id               (Protected - Admin)
│
├── /bookings
│   ├── GET    /                  (Protected - Admin)
│   ├── GET    /:id               (Protected)
│   ├── POST   /                  (Protected)
│   ├── PUT    /:id               (Protected)
│   ├── DELETE /:id               (Protected)
│   └── POST   /payment           (Protected)
│
├── /dashboard
│   ├── GET    /stats             (Protected - Admin)
│   └── GET    /bookings          (Protected - Admin)
│
└── /electricity
    ├── GET    /                  (Protected - Admin)
    ├── GET    /:id               (Protected - Admin)
    ├── POST   /                  (Protected - Admin)
    ├── PUT    /:id               (Protected - Admin)
    └── DELETE /:id               (Protected - Admin)
```

---

## 🔒 Security Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY ARCHITECTURE                         │
└─────────────────────────────────────────────────────────────────┘

Layer 1: CORS
├─ Allow only http://localhost:5174
├─ Allow credentials (cookies)
└─ Prevent cross-origin attacks

Layer 2: HTTPS (Production)
├─ Encrypt data in transit
└─ Prevent man-in-the-middle attacks

Layer 3: Authentication
├─ JWT tokens with expiration
├─ Refresh tokens in HTTP-only cookies
├─ Password hashing with bcryptjs
└─ Token verification on every request

Layer 4: Authorization
├─ Role-based access control
├─ Admin-only endpoints
├─ User-specific data access
└─ Middleware validation

Layer 5: Input Validation
├─ Validate request data
├─ Sanitize inputs
├─ Type checking with TypeScript
└─ Prisma query builder (SQL injection prevention)

Layer 6: Error Handling
├─ Generic error messages
├─ No sensitive data in errors
├─ Proper HTTP status codes
└─ Logging for debugging

Layer 7: Rate Limiting (Future)
├─ Limit requests per IP
├─ Prevent brute force attacks
└─ Protect API endpoints

Layer 8: Data Protection
├─ Encrypt sensitive data
├─ Secure password storage
├─ Audit logging
└─ Data backup and recovery
```

---

## 📈 Data Flow Examples

### Example 1: User Booking a Room

```
1. User clicks "Book Now" on room card
   ↓
2. Frontend navigates to /booking/:roomId
   ↓
3. BookingPage component loads
   ├─ Fetch room details from /api/rooms/:id
   └─ Display booking form
   ↓
4. User fills form and clicks "Continue"
   ↓
5. Frontend sends POST /api/bookings
   ├─ Include: roomId, dates, guests, customer info
   └─ Include: Authorization header with JWT token
   ↓
6. Backend receives request
   ├─ Verify JWT token
   ├─ Check user is authenticated
   ├─ Validate booking data
   ├─ Check room availability
   └─ Create booking in database
   ↓
7. Backend returns booking ID
   ↓
8. Frontend redirects to /payment/:bookingId
   ↓
9. PaymentPage loads
   ├─ Fetch booking details
   └─ Display payment options
   ↓
10. User selects payment method and clicks "Pay"
    ↓
11. Frontend sends POST /api/bookings/payment
    ├─ Include: bookingId, paymentMethod
    └─ Include: Authorization header
    ↓
12. Backend processes payment
    ├─ Update booking status to "confirmed"
    ├─ Create payment record
    └─ Send confirmation
    ↓
13. Frontend redirects to /booking-confirmation/:bookingId
    ↓
14. User sees confirmation page ✅
```

### Example 2: Admin Managing Rooms

```
1. Admin logs in
   ↓
2. Redirected to /admin/dashboard
   ↓
3. Admin clicks "Manage Rooms"
   ↓
4. RoomsManagement page loads
   ├─ Fetch all rooms from /api/rooms
   └─ Display room table
   ↓
5. Admin clicks "Create Room"
   ↓
6. Modal opens with form
   ↓
7. Admin fills form and clicks "Create"
   ↓
8. Frontend sends POST /api/rooms
   ├─ Include: room data
   ├─ Include: Authorization header with JWT token
   └─ Include: Admin role verification
   ↓
9. Backend receives request
   ├─ Verify JWT token
   ├─ Check user is admin
   ├─ Validate room data
   └─ Create room in database
   ↓
10. Backend returns new room
    ↓
11. Frontend updates room table
    ↓
12. Admin sees new room in list ✅
```

---

## 🚀 Deployment Architecture (Future)

```
┌─────────────────────────────────────────────────────────────────┐
│                  PRODUCTION DEPLOYMENT                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    CDN / STATIC HOSTING                          │
│              (Vercel, Netlify, AWS S3 + CloudFront)             │
│                                                                   │
│  - Frontend build (React)                                        │
│  - Static assets (images, CSS, JS)                              │
│  - Global distribution                                           │
│  - Caching                                                       │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                    API GATEWAY / LOAD BALANCER                   │
│              (AWS API Gateway, Nginx, HAProxy)                  │
│                                                                   │
│  - Route requests                                                │
│  - Load balancing                                                │
│  - Rate limiting                                                 │
│  - SSL/TLS termination                                           │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION SERVERS                           │
│              (AWS EC2, Heroku, Railway, Render)                 │
│                                                                   │
│  - Node.js + Express                                             │
│  - Multiple instances                                            │
│  - Auto-scaling                                                  │
│  - Health checks                                                 │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER                                │
│              (AWS RDS, PostgreSQL, MongoDB)                     │
│                                                                   │
│  - Production database                                           │
│  - Automated backups                                             │
│  - Replication                                                   │
│  - Monitoring                                                    │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                    MONITORING & LOGGING                          │
│              (DataDog, New Relic, CloudWatch)                   │
│                                                                   │
│  - Application monitoring                                        │
│  - Error tracking                                                │
│  - Performance metrics                                           │
│  - Log aggregation                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Performance Considerations

```
Frontend Optimization:
├─ Code splitting (React Router)
├─ Lazy loading components
├─ Image optimization
├─ CSS minification
├─ JavaScript minification
└─ Caching strategies

Backend Optimization:
├─ Database indexing
├─ Query optimization
├─ Connection pooling
├─ Caching (Redis)
├─ Compression (gzip)
└─ Rate limiting

Database Optimization:
├─ Proper indexing
├─ Query optimization
├─ Connection pooling
├─ Backup strategies
└─ Monitoring
```

---

**Last Updated**: May 12, 2026
