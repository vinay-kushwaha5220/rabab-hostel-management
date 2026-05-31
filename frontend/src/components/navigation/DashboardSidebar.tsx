import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { useAuth } from "../../context/AuthContextV2"
import {
  LayoutDashboard,
  Calendar,
  CreditCard,
  MessageSquare,
  Settings,
  Building,
  FileText,
  Bell
} from "lucide-react"
import api from "../../services/apiV2"

interface DashboardSidebarProps {
  open: boolean
  onClose: () => void
}

const DashboardSidebar = ({ open, onClose }: DashboardSidebarProps) => {
  const { user } = useAuth()
  const location = useLocation()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    onClose()
  }, [location])

  const fetchUnreadCount = async () => {
    if (!user || user.role !== "ADMIN") return
    try {
      // Fetch unread notifications count for Admin bell badge only
      const response = await api.get("/dashboard/notifications")
      const unreads = (response.data || []).filter((n: any) => !(n.isRead ?? n.read)).length
      setUnreadCount(unreads)
    } catch (err) {
      console.error("Failed to fetch sidebar unread count:", err)
    }
  }

  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 15000) // Poll every 15 seconds
    return () => clearInterval(interval)
  }, [user])

  const isActive = (path: string, search?: string) => {
    const [pathName, queryStr] = path.split('?');
    if (queryStr) {
      return location.pathname === pathName && location.search.includes(queryStr);
    }
    if (search) {
      return location.pathname === pathName && location.search.includes(search);
    }
    return location.pathname === pathName && !location.search;
  }

  const renterMenuItems = [
    { icon: LayoutDashboard, label: "Overview", path: "/dashboard" },
    { icon: Calendar, label: "My Bookings", path: "/my-bookings" },
    { icon: CreditCard, label: "Monthly Bills", path: "/renter-monthly-dashboard?tab=dashboard" },
    { icon: MessageSquare, label: "Contact Support", path: "/renter-monthly-dashboard?tab=messages" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ]

  const adminMenuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
    { icon: Building, label: "Room Management", path: "/admin/rooms" },
    { icon: Calendar, label: "Booking Management", path: "/admin/bookings" },
    { icon: FileText, label: "Monthly Billing", path: "/admin/monthly-billing" },
    { icon: CreditCard, label: "Payments", path: "/admin/payments" },
    { icon: MessageSquare, label: "Messages", path: "/admin/renter-chat" },
    { icon: Bell, label: "Notifications", path: "/admin/notifications" },
    // { icon: BarChart3, label: "Analytics", path: "/admin/analytics" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ]

  const menuItems = user?.role === "ADMIN" ? adminMenuItems : renterMenuItems

  return (
    <>
      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm lg:hidden z-30"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 w-52 bg-white border-r border-slate-100 transform transition-transform duration-300 ease-in-out z-40 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } flex flex-col`}
      >
        {/* Logo */}
        <div className="h-14 flex items-center gap-2.5 px-5 border-b border-slate-100">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm shadow-blue-100">
            <span className="text-white font-extrabold text-sm">R</span>
          </div>
          <span className="font-bold text-sm text-slate-800 tracking-tight">Rabab Stay</span>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
          {menuItems.map((item: any) => {
            const IconComponent = item.icon
            const active = isActive(item.path)

            return (
              <div key={item.label}>
                <Link
                  to={item.path}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 group ${
                    active
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-100 font-semibold"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-850"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <IconComponent
                      size={16}
                      className={`transition-colors duration-200 ${
                        active
                          ? "text-white"
                          : "text-slate-400 group-hover:text-slate-650"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.label === "Notifications" && unreadCount > 0 && (
                    <span className="flex h-5 min-w-[20px] relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-5 min-w-[20px] px-1.5 bg-rose-500 text-[9px] font-black text-white items-center justify-center shadow-sm leading-none">
                        {unreadCount}
                      </span>
                    </span>
                  )}
                </Link>
              </div>
            )
          })}
        </nav>
      </aside>
    </>
  )
}

export default DashboardSidebar
