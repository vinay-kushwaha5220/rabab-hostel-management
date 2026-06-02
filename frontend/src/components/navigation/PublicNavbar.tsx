import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContextV2"

const PublicNavbar = () => {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-12">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">R</span>
            </div>
            <span className="font-black text-base text-gray-900 hidden sm:inline tracking-tight">Rabab Complex Stay</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-gray-500 hover:text-blue-600 font-bold text-[11px] uppercase tracking-widest transition-colors">
              Home
            </Link>
            <Link to="/rooms" className="text-gray-500 hover:text-blue-600 font-bold text-[11px] uppercase tracking-widest transition-colors">
              Rooms
            </Link>
            <Link to="/contact" className="text-gray-500 hover:text-blue-600 font-bold text-[11px] uppercase tracking-widest transition-colors">
              Contact
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {!isAuthenticated ? (
              <>
                <button
                  onClick={() => navigate("/login")}
                  className="px-4 py-1.5 text-blue-600 font-bold text-[11px] uppercase tracking-widest hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate("/register")}
                  className="px-4 py-1.5 bg-blue-600 text-white font-bold text-[11px] uppercase tracking-widest rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Join Now
                </button>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate(user?.role === "ADMIN" ? "/admin/dashboard" : "/dashboard")}
                  className="px-4 py-1.5 bg-blue-600 text-white font-bold text-[11px] uppercase tracking-widest rounded-lg hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
                >
                  Dashboard
                </button>
                <div className="flex flex-col items-end mr-2">
                  <span className="text-sm font-bold text-gray-900">{user?.name}</span>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{user?.role}</span>
                </div>
                <button
                  onClick={logout}
                  className="px-4 py-1.5 border-2 border-red-100 text-red-650 font-bold text-[11px] uppercase tracking-widest hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link
              to="/"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/rooms"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              onClick={() => setMobileMenuOpen(false)}
            >
              Rooms
            </Link>
            <Link
              to="/contact"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>
            <div className="pt-2 border-t space-y-2">
              {!isAuthenticated ? (
                <>
                  <button
                    onClick={() => {
                      navigate("/login")
                      setMobileMenuOpen(false)
                    }}
                    className="w-full px-4 py-2 text-blue-600 font-semibold hover:bg-blue-50 rounded-lg transition-colors text-left"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      navigate("/register")
                      setMobileMenuOpen(false)
                    }}
                    className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Register
                  </button>
                </>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      navigate(user?.role === "ADMIN" ? "/admin/dashboard" : "/dashboard")
                      setMobileMenuOpen(false)
                    }}
                    className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-center cursor-pointer"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => {
                      logout()
                      setMobileMenuOpen(false)
                    }}
                    className="w-full px-4 py-2 text-red-650 font-semibold hover:bg-red-50 rounded-lg transition-colors text-left border border-slate-100 cursor-pointer"
                  >
                    Logout ({user?.name})
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default PublicNavbar
