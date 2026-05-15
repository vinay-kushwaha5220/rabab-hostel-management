import { useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { useAuth } from "../../context/AuthContextV2"

interface DashboardSidebarProps {
  open: boolean
  onClose: () => void
}

const DashboardSidebar = ({ open, onClose }: DashboardSidebarProps) => {
  const { user } = useAuth()
  const location = useLocation()

  useEffect(() => {
    onClose()
  }, [location])

  const isActive = (path: string) => location.pathname === path

  const renterMenuItems = [
    { icon: "📊", label: "Dashboard", path: "/dashboard" },
    { icon: "🏨", label: "My Bookings", path: "/my-bookings" },
    { icon: "💰", label: "Monthly Bills", path: "/renter-monthly-dashboard" },
    { icon: "💬", label: "Messages", path: "/messages" },
    { icon: "📜", label: "Payment History", path: "/payment-history" },
    { icon: "🔔", label: "Notifications", path: "/notifications" },
    { icon: "📞", label: "Contact Support", path: "/contact" },
    { icon: "⚙️", label: "Settings", path: "/settings" },
  ]

  const adminMenuItems = [
    { icon: "📊", label: "Dashboard", path: "/admin/dashboard" },
    { icon: "🏨", label: "Room Management", path: "/admin/rooms" },
    { icon: "📅", label: "Booking Management", path: "/admin/bookings" },
    { icon: "💰", label: "Monthly Billing", path: "/admin/monthly-billing" },
    { icon: "💳", label: "Payments", path: "/admin/payments" },
    { icon: "💬", label: "Messages", path: "/admin/renter-chat" },
    { icon: "🔔", label: "Notifications", path: "/admin/notifications" },
    { icon: "📈", label: "Analytics", path: "/admin/analytics" },
    { icon: "⚙️", label: "Settings", path: "/settings" },
  ]

  const menuItems = user?.role === "ADMIN" ? adminMenuItems : renterMenuItems

  return (
    <>
      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-30"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out z-40 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } flex flex-col`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-gray-200">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">R</span>
          </div>
          <span className="font-bold text-lg text-gray-900">Rabab Stay</span>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                isActive(item.path)
                  ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>


      </aside>
    </>
  )
}

export default DashboardSidebar
