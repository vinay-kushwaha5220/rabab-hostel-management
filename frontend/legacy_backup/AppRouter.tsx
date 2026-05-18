import { createBrowserRouter } from "react-router-dom"
import RootLayout from "../layouts/RootLayout"
import MainLayout from "../layouts/MainLayout"
import DashboardLayout from "../layouts/DashboardLayout"
import ProtectedRoute from "./ProtectedRoute"
import HomePage from "../pages/HomePage"
import RoomsPage from "../pages/RoomsPage"
import RoomDetailsPage from "../pages/RoomDetailsPage"
import ContactPage from "../pages/ContactPage"
import LoginPageV2 from "../pages/LoginPageV2"
import RegisterPageV2 from "../pages/RegisterPageV2"
import DashboardPage from "../pages/DashboardPage"
import BookingPage from "../pages/BookingPage"
import PaymentPage from "../pages/PaymentPage"
import BookingConfirmationPage from "../pages/BookingConfirmationPage"
import RenterMonthlyDashboard from "../pages/RenterMonthlyDashboard"
import AdminDashboardPractical from "../pages/admin/AdminDashboardPractical"
import RoomsManagement from "../pages/admin/RoomsManagement"
import BookingsManagement from "../pages/admin/BookingsManagement"
import RentersManagement from "../pages/admin/RentersManagement"
import PaymentsManagement from "../pages/admin/PaymentsManagement"
import ElectricityBills from "../pages/admin/ElectricityBills"
import NotificationsPage from "../pages/admin/NotificationsPage"
import MonthlyBillingManagement from "../pages/admin/MonthlyBillingManagement"
import RenterChatManagement from "../pages/admin/RenterChatManagement"
import PaymentTracking from "../pages/admin/PaymentTracking"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        // Public Layout with Footer
        path: "/",
        element: <MainLayout />,
        children: [
          { path: "/", element: <HomePage /> },
          { path: "/rooms", element: <RoomsPage /> },
          { path: "/rooms/:id", element: <RoomDetailsPage /> },
          { path: "/contact", element: <ContactPage /> },
          { path: "/login", element: <LoginPageV2 /> },
          { path: "/register", element: <RegisterPageV2 /> },
        ]
      },
      {
        // Dashboard Layout WITHOUT Footer
        path: "/",
        element: <DashboardLayout />,
        children: [
          {
            path: "/dashboard",
            element: (
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            )
          },
          {
            path: "/booking/:roomId",
            element: (
              <ProtectedRoute>
                <BookingPage />
              </ProtectedRoute>
            )
          },
          {
            path: "/payment/:bookingId",
            element: (
              <ProtectedRoute>
                <PaymentPage />
              </ProtectedRoute>
            )
          },
          {
            path: "/booking-confirmation/:bookingId",
            element: (
              <ProtectedRoute>
                <BookingConfirmationPage />
              </ProtectedRoute>
            )
          },
          {
            path: "/renter-monthly-dashboard",
            element: (
              <ProtectedRoute>
                <RenterMonthlyDashboard />
              </ProtectedRoute>
            )
          },
          {
            path: "/admin/dashboard",
            element: (
              <ProtectedRoute adminOnly>
                <AdminDashboardPractical />
              </ProtectedRoute>
            )
          },
          {
            path: "/admin/rooms",
            element: (
              <ProtectedRoute adminOnly>
                <RoomsManagement />
              </ProtectedRoute>
            )
          },
          {
            path: "/admin/bookings",
            element: (
              <ProtectedRoute adminOnly>
                <BookingsManagement />
              </ProtectedRoute>
            )
          },
          {
            path: "/admin/renters",
            element: (
              <ProtectedRoute adminOnly>
                <RentersManagement />
              </ProtectedRoute>
            )
          },
          {
            path: "/admin/payments",
            element: (
              <ProtectedRoute adminOnly>
                <PaymentsManagement />
              </ProtectedRoute>
            )
          },
          {
            path: "/admin/electricity",
            element: (
              <ProtectedRoute adminOnly>
                <ElectricityBills />
              </ProtectedRoute>
            )
          },
          {
            path: "/admin/notifications",
            element: (
              <ProtectedRoute adminOnly>
                <NotificationsPage />
              </ProtectedRoute>
            )
          },
          {
            path: "/admin/monthly-billing",
            element: (
              <ProtectedRoute adminOnly>
                <MonthlyBillingManagement />
              </ProtectedRoute>
            )
          },
          {
            path: "/admin/renter-chat",
            element: (
              <ProtectedRoute adminOnly>
                <RenterChatManagement />
              </ProtectedRoute>
            )
          },
          {
            path: "/admin/payment-tracking",
            element: (
              <ProtectedRoute adminOnly>
                <PaymentTracking />
              </ProtectedRoute>
            )
          }
        ]
      }
    ]
  }
])
