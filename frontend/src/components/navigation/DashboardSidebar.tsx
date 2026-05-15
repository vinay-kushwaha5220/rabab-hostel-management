import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { useAuth } from "../../context/AuthContextV2"

interface DashboardSidebarProps {
  open: boolean
  onClose: () => void
}

const DashboardSidebar = ({ open, onClose }: DashboardSidebarProps) => {
  const { user } = useAuth()
  const location = useLocation()
  const [billsOpen, setBillsOpen] = useState(location.pathname.includes('renter-monthly-dashboard'))

  useEffect(() => {
    onClose()
  }, [location])

  const isActive = (path: string, search?: string) => {
    if (search) {
      return location.pathname === path && location.search.includes(search)
    }
    return location.pathname === path && !location.search
  }

  const renterMenuItems = [
    { icon: "📊", label: "Overview", path: "/dashboard" },
    { icon: "🏨", label: "My Bookings", path: "/my-bookings" },
    { 
      icon: "💰", 
      label: "Monthly Bills", 
      path: "/renter-monthly-dashboard",
      isSubmenu: true,
      subItems: [
        { label: "Summary", path: "/renter-monthly-dashboard", search: "tab=dashboard" },
        { label: "Current Bill", path: "/renter-monthly-dashboard", search: "tab=bills" },
        { label: "Bill History", path: "/renter-monthly-dashboard", search: "tab=history" },
        { label: "Messages", path: "/renter-monthly-dashboard", search: "tab=messages" },
        { label: "Notifications", path: "/renter-monthly-dashboard", search: "tab=notifications" },
      ]
    },
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
        className={`fixed lg:static inset-y-0 left-0 w-52 bg-white border-r border-gray-100 transform transition-transform duration-300 ease-in-out z-40 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } flex flex-col`}
      >
        {/* Logo */}
        <div className="h-12 flex items-center gap-2.5 px-4 border-b border-gray-50">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-black text-sm">R</span>
          </div>
          <span className="font-black text-sm text-gray-900 tracking-tight">Rabab Stay</span>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {menuItems.map((item: any) => (
            <div key={item.label}>
              {item.isSubmenu ? (
                <div>
                  <button
                    onClick={() => setBillsOpen(!billsOpen)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all duration-200 ${
                      location.pathname.includes(item.path)
                        ? "text-blue-600 bg-blue-50/50"
                        : "text-gray-400 hover:bg-slate-50 hover:text-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm opacity-80">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    <svg
                      className={`w-3 h-3 transition-transform duration-200 ${billsOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Submenu Items */}
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${billsOpen ? 'max-h-60 mt-1' : 'max-h-0'}`}>
                    {item.subItems.map((sub: any) => (
                      <Link
                        key={sub.label}
                        to={`${sub.path}?${sub.search}`}
                        className={`flex items-center gap-2.5 pl-9 pr-3 py-1.5 rounded-lg font-bold text-[10px] transition-all duration-200 ${
                          isActive(sub.path, sub.search)
                            ? "text-blue-600 bg-blue-50 font-black"
                            : "text-gray-400 hover:text-gray-600 hover:bg-slate-50/50"
                        }`}
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link
                  to={item.path}
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all duration-200 ${
                    isActive(item.path)
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-100"
                      : "text-gray-400 hover:bg-slate-50 hover:text-gray-700"
                  }`}
                >
                  <span className="text-sm opacity-80">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              )}
            </div>
          ))}
        </nav>
      </aside>
    </>
  )
}

export default DashboardSidebar
