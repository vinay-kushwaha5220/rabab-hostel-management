# 🚀 Rabab Stay - Quick Start Guide

**Status**: ✅ Both servers are running and ready to use!

---

## 🎯 Quick Access

### Frontend
- **URL**: http://localhost:5174
- **Status**: ✅ Running

### Backend API
- **URL**: http://localhost:5000
- **Status**: ✅ Running

---

## 👤 Test Accounts

### Admin Account
```
Email:    admin@gmail.com
Password: admin123
Role:     Administrator
```

**After Login**: You'll be redirected to `/admin/dashboard`

### User Account
```
Email:    vinay@gmail.com
Password: 123456
Role:     Renter/Customer
```

**After Login**: You'll be redirected to `/dashboard` (User Dashboard)

---

## 🗺️ Navigation Map

### For Customers/Renters

1. **Homepage** (`/`)
   - Hero section with call-to-action
   - Featured rooms showcase
   - Facilities section
   - Testimonials
   - Contact section

2. **Browse Rooms** (`/rooms`)
   - View all available rooms
   - Filter by AC/Non-AC
   - Filter by Daily/Monthly
   - Filter by price range
   - Filter by availability

3. **Room Details** (`/rooms/:id`)
   - Full room information
   - Multiple images
   - Amenities list
   - Availability status
   - Book Now button

4. **Booking** (`/booking/:roomId`)
   - Fill booking form
   - Select check-in/check-out dates
   - Enter guest details
   - Review booking summary

5. **Payment** (`/payment/:bookingId`)
   - Select payment method
   - View booking summary
   - Complete payment
   - See payment confirmation

6. **Booking Confirmation** (`/booking-confirmation/:bookingId`)
   - Booking success message
   - Booking ID
   - Booking details
   - Next steps

7. **My Dashboard** (`/dashboard`)
   - Active bookings
   - Past bookings
   - Quick statistics
   - Quick actions

8. **Contact** (`/contact`)
   - Contact form
   - Admin contact information

---

### For Administrators

1. **Admin Dashboard** (`/admin/dashboard`)
   - Statistics cards
   - Quick navigation
   - Recent bookings
   - System overview

2. **Rooms Management** (`/admin/rooms`)
   - View all rooms
   - Create new room
   - Edit room details
   - Delete rooms
   - Search and filter

3. **Bookings Management** (`/admin/bookings`)
   - View all bookings
   - Search bookings
   - Filter by status
   - Update booking status
   - Cancel bookings

4. **Renters Management** (`/admin/renters`)
   - View all renters
   - Renter details
   - Booking history
   - Contact information

5. **Payments Management** (`/admin/payments`)
   - View all payments
   - Payment status tracking
   - Transaction history
   - Revenue analytics

6. **Electricity Bills** (`/admin/electricity`)
   - Create monthly bills
   - View bill history
   - Track payment status
   - Update bill details

7. **Notifications** (`/admin/notifications`)
   - System notifications
   - Booking alerts
   - Payment notifications
   - Mark as read

---

## 🔐 Authentication Flow

### Login Process
1. Click "Login" in navbar
2. Enter email and password
3. Click "Sign In"
4. System validates credentials
5. JWT tokens are generated
6. Access token stored in localStorage
7. Refresh token stored in HTTP-only cookie
8. Redirected based on role:
   - Admin → `/admin/dashboard`
   - User → `/dashboard`

### Logout Process
1. Click user profile in navbar
2. Click "Logout"
3. Tokens are cleared
4. Redirected to login page

### Auto Token Refresh
- Access token expires in 15 minutes
- When expired, system automatically refreshes
- Refresh token expires in 7 days
- If refresh token expires, user must log in again

---

## 🎨 Key Features to Test

### 1. Room Browsing
- [ ] Visit `/rooms`
- [ ] See all available rooms
- [ ] Use filters (AC/Non-AC, Daily/Monthly, Price)
- [ ] Click on a room to see details
- [ ] Verify room images and amenities

### 2. Booking Flow
- [ ] Login as user (vinay@gmail.com / 123456)
- [ ] Go to `/rooms`
- [ ] Click "Book Now" on a room
- [ ] Fill booking form
- [ ] Select dates and guests
- [ ] Review booking summary
- [ ] Proceed to payment

### 3. Payment
- [ ] Select payment method (Card, UPI, Net Banking, Cash)
- [ ] Click "Pay Now"
- [ ] See payment confirmation
- [ ] View booking confirmation page

### 4. User Dashboard
- [ ] Login as user
- [ ] Go to `/dashboard`
- [ ] See active bookings
- [ ] See past bookings
- [ ] View quick statistics
- [ ] Use quick action buttons

### 5. Admin Dashboard
- [ ] Login as admin (admin@gmail.com / admin123)
- [ ] View admin dashboard
- [ ] See statistics
- [ ] Navigate to different sections
- [ ] Test room management
- [ ] Test booking management
- [ ] Test renter management
- [ ] Test payment tracking
- [ ] Test electricity bills

### 6. Navbar & Profile
- [ ] Check navbar displays correctly
- [ ] See user name and role
- [ ] Click profile to see options
- [ ] Test logout functionality

---

## 🛠️ Troubleshooting

### Backend Not Running
```bash
cd backend
npm install
npm run dev
```

### Frontend Not Running
```bash
cd frontend
npm install
npm run dev
```

### Database Issues
```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

### Port Already in Use
- Backend: Change port in `backend/src/index.ts`
- Frontend: Vite will automatically use next available port

### CORS Errors
- Check backend CORS configuration in `backend/src/index.ts`
- Verify frontend URL matches CORS origin

### Login Issues
- Clear localStorage: `localStorage.clear()`
- Clear cookies: Check browser DevTools
- Verify credentials are correct
- Check backend is running

---

## 📊 API Testing

### Test Login
```bash
curl -X POST http://localhost:5000/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gmail.com","password":"admin123"}' \
  -c cookies.txt
```

### Test Get Rooms
```bash
curl http://localhost:5000/api/rooms
```

### Test Protected Route
```bash
curl -X GET http://localhost:5000/api/v2/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 📱 Responsive Design

The application is fully responsive:
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

Test on different screen sizes using browser DevTools.

---

## 🎯 Next Steps

1. **Explore the Application**
   - Test all user flows
   - Test all admin flows
   - Verify responsive design

2. **Review Code**
   - Check backend controllers
   - Review frontend components
   - Understand authentication flow

3. **Customize**
   - Update branding/logo
   - Modify colors and styling
   - Add your own rooms and data

4. **Deploy**
   - Set up production environment
   - Configure environment variables
   - Deploy to hosting platform

---

## 📞 Support

For issues or questions:
1. Check `PROJECT_COMPLETION_SUMMARY.md`
2. Review code comments
3. Check browser console for errors
4. Check backend logs

---

**Happy Testing! 🎉**

Last Updated: May 12, 2026
