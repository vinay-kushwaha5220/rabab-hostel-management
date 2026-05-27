import { useEffect, useState, useRef } from "react"
import { useAuth } from "../../context/AuthContextV2"
import { useNavigate } from "react-router-dom"
import api from "../../services/apiV2"

interface DashboardTopbarProps {
  onMenuClick: () => void
}

interface NotificationItem {
  id: number
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

const DashboardTopbar = ({ onMenuClick }: DashboardTopbarProps) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    await logout()
    navigate("/")
  }

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user || user.role !== "ADMIN") return
    try {
      const response = await api.get("/dashboard/notifications")
      setNotifications(response.data || [])
    } catch (err) {
      console.error("Failed to fetch topbar notifications:", err)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Poll every 10 seconds for real-time project information updates
    const interval = setInterval(fetchNotifications, 10000)
    return () => clearInterval(interval)
  }, [user])

  // Handle outside clicks to close the dropdown
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener("mousedown", handleOutsideClick)
    return () => document.removeEventListener("mousedown", handleOutsideClick)
  }, [])

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.put(`/dashboard/notifications/${id}/read`)
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      )
    } catch (err) {
      console.error("Failed to mark notification as read:", err)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await api.put("/dashboard/notifications/read-all")
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    } catch (err) {
      console.error("Failed to mark all as read:", err)
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  return (
    <div className="bg-white border-b border-gray-100 px-4 sm:px-6 h-12 flex items-center sticky top-0 z-40">
      {/* Left: Menu Button (Mobile) */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors mr-2"
      >
        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Center: Logo (Mobile) */}
      <div className="lg:hidden flex items-center gap-2">
        <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-base">R</span>
        </div>
      </div>

      {/* Right: User Menu & Real-time Notifications */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Real-time Notifications Bell Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-all duration-200 relative group active:scale-95 cursor-pointer"
            aria-label="View real-time notifications"
          >
            <svg className="w-5 h-5 text-gray-700 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] bg-rose-500 rounded-full text-[8px] font-black text-white flex items-center justify-center px-0.5 shadow-sm shadow-rose-200 border border-white animate-in zoom-in-50 duration-300">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-250">
              {/* Panel Header */}
              <div className="p-3.5 bg-slate-900 text-white flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider">Alert Center</h4>
                  <p className="text-[9px] text-slate-400 font-semibold tracking-wide mt-0.5 uppercase">Real-Time Hostel Events</p>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[9px] font-black uppercase bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded-md text-blue-400 hover:text-blue-300 transition-all cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Panel Body */}
              <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-50">
                {notifications.length === 0 ? (
                  <div className="py-12 px-4 text-center">
                    <span className="text-2xl">🔔</span>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider mt-2.5">No recent notifications</p>
                    <p className="text-[9px] text-slate-400 mt-1">Updates on bookings and payments appear here.</p>
                  </div>
                ) : (
                  notifications.slice(0, 8).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleMarkAsRead(item.id)}
                      className={`p-3 text-left transition-all hover:bg-slate-50 cursor-pointer flex gap-2.5 items-start ${
                        !item.isRead ? "bg-blue-50/20 font-bold" : ""
                      }`}
                    >
                      <span className="text-xs mt-0.5 flex-shrink-0">
                        {item.title.toLowerCase().includes("payment") ? "💳" : item.title.toLowerCase().includes("booking") ? "🏨" : "📢"}
                      </span>
                      <div className="flex-1 space-y-0.5">
                        <div className="flex justify-between items-start gap-1">
                          <h5 className={`text-[10px] uppercase tracking-wide font-extrabold ${!item.isRead ? "text-blue-600" : "text-slate-700"}`}>
                            {item.title}
                          </h5>
                          <span className="text-[8px] font-semibold text-slate-400 flex-shrink-0 mt-0.5">
                            {formatTime(item.createdAt)}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                          {item.message}
                        </p>
                      </div>
                      {!item.isRead && (
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Panel Footer */}
              {user && user.role === "ADMIN" && (
                <div className="p-2.5 bg-slate-50 text-center border-t border-slate-100">
                  <button
                    onClick={() => {
                      setShowNotifications(false)
                      navigate("/admin/notifications")
                    }}
                    className="text-[9px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest cursor-pointer"
                  >
                    View All Activity Log →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Avatar & Dropdown */}
        <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-bold text-gray-900 leading-tight">{user?.name}</p>
            <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider leading-none mt-0.5">{user?.role}</p>
          </div>
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm">
            {user?.name?.charAt(0).toUpperCase()}
          </div>

          {/* Dropdown Menu */}
          <div className="relative group">
            <button className="p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Content */}
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <button
                onClick={() => navigate("/settings")}
                className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 first:rounded-t-lg transition-colors cursor-pointer text-xs font-bold"
              >
                Settings
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 last:rounded-b-lg border-t border-gray-200 transition-colors cursor-pointer text-xs font-bold"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardTopbar
