import React, { lazy, Suspense } from "react"
import ReactDOM from "react-dom/client"
import { RouterProvider, createBrowserRouter } from "react-router-dom"
import { GoogleOAuthProvider } from "@react-oauth/google"
import "./index.css"
import { AuthProvider } from "./context/AuthContextV2"
import RootLayout from "./layouts/RootLayout"
import PublicLayout from "./layouts/PublicLayout"
import DashboardLayout from "./layouts/DashboardLayout"
import ProtectedRoute from "./routes/ProtectedRoute"

// ── Lazy-load all pages for automatic code-splitting ──────────────────────────
// This breaks the single 996KB bundle into small per-page chunks that are only
// loaded when actually visited — dramatically improving initial load time.
const HomePage               = lazy(() => import("./pages/HomePage"))
const RoomsPage              = lazy(() => import("./pages/RoomsPage"))
const RoomDetailsPage        = lazy(() => import("./pages/RoomDetailsPage"))
const ContactPage            = lazy(() => import("./pages/ContactPage"))
const LoginPageV2            = lazy(() => import("./pages/LoginPageV2"))
const ForgotPasswordPage     = lazy(() => import("./pages/ForgotPasswordPage"))
const RegisterPageV2         = lazy(() => import("./pages/RegisterPageV2"))
const DashboardPage          = lazy(() => import("./pages/DashboardPage"))
const BookingPage            = lazy(() => import("./pages/BookingPage"))
const PaymentPage            = lazy(() => import("./pages/PaymentPage"))
const BookingConfirmationPage = lazy(() => import("./pages/BookingConfirmationPage"))
const RenterMonthlyDashboard  = lazy(() => import("./pages/RenterMonthlyDashboard"))
const MyBookingsPage         = lazy(() => import("./pages/MyBookingsPage"))
const PaymentHistoryPage     = lazy(() => import("./pages/PaymentHistoryPage"))
const NotificationsPage      = lazy(() => import("./pages/NotificationsPage"))
const SettingsPage           = lazy(() => import("./pages/SettingsPage"))

// Admin pages (heaviest — deferred until admin navigates there)
const AdminDashboardPractical  = lazy(() => import("./pages/admin/AdminDashboardPractical"))
const AdminNotificationsPage   = lazy(() => import("./pages/admin/NotificationsPage"))
const RoomsManagement         = lazy(() => import("./pages/admin/RoomsManagement"))
const BookingsManagement      = lazy(() => import("./pages/admin/BookingsManagement"))
const RentersManagement       = lazy(() => import("./pages/admin/RentersManagement"))
const PaymentsManagement      = lazy(() => import("./pages/admin/PaymentsManagement"))
const ElectricityBills        = lazy(() => import("./pages/admin/ElectricityBills"))
const MonthlyBillingManagement = lazy(() => import("./pages/admin/MonthlyBillingManagement"))
const RenterChatManagement    = lazy(() => import("./pages/admin/RenterChatManagement"))
const PaymentTracking         = lazy(() => import("./pages/admin/PaymentTracking"))

// Minimal inline spinner — shown while a lazy chunk is loading
const PageLoader = () => (
  <div className="flex items-center justify-center h-full min-h-[50vh]">
    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
  </div>
)

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
          { path: "/",             element: <Suspense fallback={<PageLoader />}><HomePage /></Suspense> },
          { path: "/rooms",        element: <Suspense fallback={<PageLoader />}><RoomsPage /></Suspense> },
          { path: "/rooms/:id",    element: <Suspense fallback={<PageLoader />}><RoomDetailsPage /></Suspense> },
          { path: "/contact",      element: <Suspense fallback={<PageLoader />}><ContactPage /></Suspense> },
          { path: "/login",        element: <Suspense fallback={<PageLoader />}><LoginPageV2 /></Suspense> },
          { path: "/register",     element: <Suspense fallback={<PageLoader />}><RegisterPageV2 /></Suspense> },
          { path: "/forgot-password", element: <Suspense fallback={<PageLoader />}><ForgotPasswordPage /></Suspense> },
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
          { path: "/dashboard",                   element: <Suspense fallback={<PageLoader />}><DashboardPage /></Suspense> },
          { path: "/my-bookings",                 element: <Suspense fallback={<PageLoader />}><MyBookingsPage /></Suspense> },
          { path: "/renter-monthly-dashboard",    element: <Suspense fallback={<PageLoader />}><RenterMonthlyDashboard /></Suspense> },
          { path: "/booking/:roomId",             element: <Suspense fallback={<PageLoader />}><BookingPage /></Suspense> },
          { path: "/payment/:bookingId",          element: <Suspense fallback={<PageLoader />}><PaymentPage /></Suspense> },
          { path: "/booking-confirmation/:bookingId", element: <Suspense fallback={<PageLoader />}><BookingConfirmationPage /></Suspense> },
          { path: "/payment-history",             element: <Suspense fallback={<PageLoader />}><PaymentHistoryPage /></Suspense> },
          { path: "/notifications",               element: <Suspense fallback={<PageLoader />}><NotificationsPage /></Suspense> },
          { path: "/settings",                    element: <Suspense fallback={<PageLoader />}><SettingsPage /></Suspense> },

          // Admin Routes
          { path: "/admin/dashboard",      element: <ProtectedRoute adminOnly><Suspense fallback={<PageLoader />}><AdminDashboardPractical /></Suspense></ProtectedRoute> },
          { path: "/admin/rooms",          element: <ProtectedRoute adminOnly><Suspense fallback={<PageLoader />}><RoomsManagement /></Suspense></ProtectedRoute> },
          { path: "/admin/bookings",       element: <ProtectedRoute adminOnly><Suspense fallback={<PageLoader />}><BookingsManagement /></Suspense></ProtectedRoute> },
          { path: "/admin/renters",        element: <ProtectedRoute adminOnly><Suspense fallback={<PageLoader />}><RentersManagement /></Suspense></ProtectedRoute> },
          { path: "/admin/payments",       element: <ProtectedRoute adminOnly><Suspense fallback={<PageLoader />}><PaymentsManagement /></Suspense></ProtectedRoute> },
          { path: "/admin/electricity",    element: <ProtectedRoute adminOnly><Suspense fallback={<PageLoader />}><ElectricityBills /></Suspense></ProtectedRoute> },
          { path: "/admin/notifications",  element: <ProtectedRoute adminOnly><Suspense fallback={<PageLoader />}><AdminNotificationsPage /></Suspense></ProtectedRoute> },
          { path: "/admin/monthly-billing",element: <ProtectedRoute adminOnly><Suspense fallback={<PageLoader />}><MonthlyBillingManagement /></Suspense></ProtectedRoute> },
          { path: "/admin/renter-chat",    element: <ProtectedRoute adminOnly><Suspense fallback={<PageLoader />}><RenterChatManagement /></Suspense></ProtectedRoute> },
          { path: "/admin/payment-tracking",element: <ProtectedRoute adminOnly><Suspense fallback={<PageLoader />}><PaymentTracking /></Suspense></ProtectedRoute> },
        ]
      }
    ]
  }
])

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!GOOGLE_CLIENT_ID) {
  console.error("VITE_GOOGLE_CLIENT_ID is missing in .env file. Google Login will not work.");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID || "missing-client-id"}>
      <RouterProvider router={router} />
    </GoogleOAuthProvider>
  </React.StrictMode>
)