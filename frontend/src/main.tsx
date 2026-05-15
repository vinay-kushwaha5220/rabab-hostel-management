import React from "react"
import ReactDOM from "react-dom/client"
import { RouterProvider, createBrowserRouter } from "react-router-dom"
import "./index.css"
import { AuthProvider } from "./context/AuthContextV2"
import RootLayout from "./layouts/RootLayout"
import PublicLayout from "./layouts/PublicLayout"
import DashboardLayout from "./layouts/DashboardLayout"
import ProtectedRoute from "./routes/ProtectedRoute"
import HomePage from "./pages/HomePage"
import RoomsPage from "./pages/RoomsPage"
import RoomDetailsPage from "./pages/RoomDetailsPage"
import ContactPage from "./pages/ContactPage"
import LoginPageV2 from "./pages/LoginPageV2"
import RegisterPageV2 from "./pages/RegisterPageV2"
import DashboardPage from "./pages/DashboardPage"
import BookingPage from "./pages/BookingPage"
import PaymentPage from "./pages/PaymentPage"
import BookingConfirmationPage from "./pages/BookingConfirmationPage"
import RenterMonthlyDashboard from "./pages/RenterMonthlyDashboard"
import MyBookingsPage from "./pages/MyBookingsPage"
import PaymentHistoryPage from "./pages/PaymentHistoryPage"
import NotificationsPage from "./pages/NotificationsPage"
import MessagesPage from "./pages/MessagesPage"
import SettingsPage from "./pages/SettingsPage"
import AnalyticsPage from "./pages/AnalyticsPage"
import AdminDashboardPractical from "./pages/admin/AdminDashboardPractical"
import RoomsManagement from "./pages/admin/RoomsManagement"
import BookingsManagement from "./pages/admin/BookingsManagement"
import RentersManagement from "./pages/admin/RentersManagement"
import PaymentsManagement from "./pages/admin/PaymentsManagement"
import ElectricityBills from "./pages/admin/ElectricityBills"
import MonthlyBillingManagement from "./pages/admin/MonthlyBillingManagement"
import RenterChatManagement from "./pages/admin/RenterChatManagement"
import PaymentTracking from "./pages/admin/PaymentTracking"

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AuthProvider>
        <RootLayout />
      </AuthProvider>
    ),
    children: [
      // PUBLIC ROUTES
      {
        path: "/",
        element: <PublicLayout />,
        children: [
          { path: "/", element: <HomePage /> },
          { path: "/rooms", element: <RoomsPage /> },
          { path: "/rooms/:id", element: <RoomDetailsPage /> },
          { path: "/contact", element: <ContactPage /> },
          { path: "/login", element: <LoginPageV2 /> },
          { path: "/register", element: <RegisterPageV2 /> },
        ]
      },

      // DASHBOARD ROUTES
      {
        path: "/",
        element: (
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        ),
        children: [
          // Renter Routes
          { path: "/dashboard", element: <DashboardPage /> },
          { path: "/my-bookings", element: <MyBookingsPage /> },
          { path: "/renter-monthly-dashboard", element: <RenterMonthlyDashboard /> },
          { path: "/booking/:roomId", element: <BookingPage /> },
          { path: "/payment/:bookingId", element: <PaymentPage /> },
          { path: "/booking-confirmation/:bookingId", element: <BookingConfirmationPage /> },
          { path: "/messages", element: <MessagesPage /> },
          { path: "/payment-history", element: <PaymentHistoryPage /> },
          { path: "/notifications", element: <NotificationsPage /> },
          { path: "/settings", element: <SettingsPage /> },

          // Admin Routes
          { path: "/admin/dashboard", element: <ProtectedRoute adminOnly><AdminDashboardPractical /></ProtectedRoute> },
          { path: "/admin/rooms", element: <ProtectedRoute adminOnly><RoomsManagement /></ProtectedRoute> },
          { path: "/admin/bookings", element: <ProtectedRoute adminOnly><BookingsManagement /></ProtectedRoute> },
          { path: "/admin/renters", element: <ProtectedRoute adminOnly><RentersManagement /></ProtectedRoute> },
          { path: "/admin/payments", element: <ProtectedRoute adminOnly><PaymentsManagement /></ProtectedRoute> },
          { path: "/admin/electricity", element: <ProtectedRoute adminOnly><ElectricityBills /></ProtectedRoute> },
          { path: "/admin/notifications", element: <ProtectedRoute adminOnly><NotificationsPage /></ProtectedRoute> },
          { path: "/admin/monthly-billing", element: <ProtectedRoute adminOnly><MonthlyBillingManagement /></ProtectedRoute> },
          { path: "/admin/renter-chat", element: <ProtectedRoute adminOnly><RenterChatManagement /></ProtectedRoute> },
          { path: "/admin/payment-tracking", element: <ProtectedRoute adminOnly><PaymentTracking /></ProtectedRoute> },
          { path: "/admin/analytics", element: <ProtectedRoute adminOnly><AnalyticsPage /></ProtectedRoute> },
        ]
      }
    ]
  }
])

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)