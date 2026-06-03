import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContextV2"

interface ProtectedRouteProps {
  children: React.ReactNode
  adminOnly?: boolean
}

const ProtectedRoute = ({ children, adminOnly = false }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading } = useAuth()
  const location = useLocation()

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If not authenticated
  if (!isAuthenticated) {
    // If the path starts with /booking or /payment, redirect to login page with return URL
    if (location.pathname.startsWith("/booking") || location.pathname.startsWith("/payment")) {
      return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />
    }
    // Otherwise (e.g. accessing dashboard), redirect to home page (/)
    return <Navigate to="/" replace />
  }

  // If admin-only route and user is not admin, redirect to dashboard
  if (adminOnly && user?.role !== "ADMIN") {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default ProtectedRoute