# API Endpoints Testing Guide

## Backend Running: ✅ http://localhost:5000
## Frontend Running: ✅ http://localhost:5174

---

## 1. MONTHLY BILLING ENDPOINTS

### Create Monthly Bill (Admin Only)
```bash
curl -X POST http://localhost:5000/api/monthly-bills \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": 1,
    "month": "2026-05",
    "rentAmount": 5000,
    "electricityAmount": 500,
    "extraCharges": 200,
    "dueDate": "2026-05-31"
  }'
```

### Get Renter Dashboard
```bash
curl -X GET http://localhost:5000/api/monthly-bills/renter/dashboard \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

### Get All Bills (Admin Only)
```bash
curl -X GET "http://localhost:5000/api/monthly-bills/admin/all?status=pending&month=2026-05" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Update Bill (Admin Only)
```bash
curl -X PUT http://localhost:5000/api/monthly-bills/1 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rentAmount": 5500,
    "electricityAmount": 600,
    "dueDate": "2026-06-05"
  }'
```

### Delete Bill (Admin Only)
```bash
curl -X DELETE http://localhost:5000/api/monthly-bills/1 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 2. MESSAGING ENDPOINTS

### Send Message
```bash
curl -X POST http://localhost:5000/api/messages/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": 1,
    "receiverId": 1,
    "content": "Hello, I have a question about my bill"
  }'
```

### Get Conversation
```bash
curl -X GET http://localhost:5000/api/messages/conversation/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Unread Count
```bash
curl -X GET http://localhost:5000/api/messages/unread/count \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get All Conversations (Admin Only)
```bash
curl -X GET http://localhost:5000/api/messages/admin/conversations \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 3. PAYMENT ENDPOINTS

### Process Monthly Payment
```bash
curl -X POST http://localhost:5000/api/monthly-payments/process \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "billId": 1,
    "paymentMethod": "credit_card"
  }'
```

### Get Payment History
```bash
curl -X GET http://localhost:5000/api/monthly-payments/history \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

### Get All Payments (Admin Only)
```bash
curl -X GET "http://localhost:5000/api/monthly-payments/admin/all?status=completed&month=2026-05" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Get Payment Stats (Admin Only)
```bash
curl -X GET http://localhost:5000/api/monthly-payments/admin/stats \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## FRONTEND ROUTES

### Public Routes
- Home: http://localhost:5174/
- Rooms: http://localhost:5174/rooms
- Room Details: http://localhost:5174/rooms/1
- Contact: http://localhost:5174/contact

### Authentication Routes
- Login: http://localhost:5174/login
- Register: http://localhost:5174/register

### Protected Routes (User)
- Dashboard: http://localhost:5174/dashboard
- Monthly Dashboard: http://localhost:5174/renter-monthly-dashboard
- Booking: http://localhost:5174/booking/1
- Payment: http://localhost:5174/payment/1
- Booking Confirmation: http://localhost:5174/booking-confirmation/1

### Protected Routes (Admin)
- Admin Dashboard: http://localhost:5174/admin/dashboard
- Monthly Billing: http://localhost:5174/admin/monthly-billing
- Renter Chat: http://localhost:5174/admin/renter-chat
- Payment Tracking: http://localhost:5174/admin/payment-tracking
- Rooms Management: http://localhost:5174/admin/rooms
- Bookings Management: http://localhost:5174/admin/bookings
- Renters Management: http://localhost:5174/admin/renters
- Payments Management: http://localhost:5174/admin/payments
- Electricity Bills: http://localhost:5174/admin/electricity
- Notifications: http://localhost:5174/admin/notifications

---

## TESTING WORKFLOW

### 1. Create Test User (Renter)
- Go to http://localhost:5174/register
- Create account with email and password
- Login with credentials

### 2. Create Test Admin
- Use existing admin account or create one via backend

### 3. Test Renter Flow
- Login as renter
- Go to Monthly Dashboard: http://localhost:5174/renter-monthly-dashboard
- View room details, bills, and messages
- Send message to admin
- Process payment

### 4. Test Admin Flow
- Login as admin
- Go to Monthly Billing: http://localhost:5174/admin/monthly-billing
- Create new bill for a booking
- Go to Renter Chat: http://localhost:5174/admin/renter-chat
- View conversations and send messages
- Go to Payment Tracking: http://localhost:5174/admin/payment-tracking
- View payment statistics and history

---

## NOTES

- Replace `YOUR_ADMIN_TOKEN` and `YOUR_USER_TOKEN` with actual JWT tokens from login
- All protected endpoints require valid JWT token in Authorization header
- Admin endpoints require user role to be "admin"
- User endpoints require user role to be "user"
- All dates should be in ISO format (YYYY-MM-DD or YYYY-MM)
