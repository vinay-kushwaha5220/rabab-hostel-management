import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContextV2"
import Logo from "./Logo"

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
  }

  const handleDashboard = () => {
    if (user?.role === "admin") {
      navigate("/admin/dashboard")
    } else {
      navigate("/dashboard")
    }
  }

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
          <Logo size="md" />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-8 items-center font-medium">
          <Link to="/" className="text-gray-700 hover:text-blue-600 transition-colors">
            Home
          </Link>
          <Link to="/rooms" className="text-gray-700 hover:text-blue-600 transition-colors">
            Rooms
          </Link>
          <Link to="/contact" className="text-gray-700 hover:text-blue-600 transition-colors">
            Contact
          </Link>

          {isAuthenticated ? (
            <>
              <button
                onClick={handleDashboard}
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                {user?.role === "admin" ? "Dashboard" : "My Bookings"}
              </button>
              {user?.role !== "admin" && (
                <Link
                  to="/renter-monthly-dashboard"
                  className="text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Monthly Dashboard
                </Link>
              )}
              {user?.role === "admin" && (
                <div className="relative group">
                  <button className="text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-1">
                    Admin Tools
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </button>
                  <div className="absolute left-0 mt-0 w-48 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <Link
                      to="/admin/monthly-billing"
                      className="block px-4 py-2 text-gray-700 hover:bg-blue-50 first:rounded-t-lg"
                    >
                      Monthly Billing
                    </Link>
                    <Link
                      to="/admin/renter-chat"
                      className="block px-4 py-2 text-gray-700 hover:bg-blue-50"
                    >
                      Renter Chat
                    </Link>
                    <Link
                      to="/admin/payment-tracking"
                      className="block px-4 py-2 text-gray-700 hover:bg-blue-50 last:rounded-b-lg"
                    >
                      Payment Tracking
                    </Link>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-600">{user?.role === "admin" ? "Admin" : "Guest"}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center text-white font-bold">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm font-semibold"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <Link
                to="/login"
                className="text-gray-700 hover:text-blue-600 transition-colors font-semibold"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-700 hover:text-red-600 text-sm font-semibold"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar