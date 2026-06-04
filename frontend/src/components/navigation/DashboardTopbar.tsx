import { useEffect, useState, useRef } from "react"
import { useAuth } from "../../context/AuthContextV2"
import { Link, useNavigate } from "react-router-dom"
import {
  Bell,
  Menu,
  LogOut,
  User
} from "lucide-react"
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
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const notificationsDropdownRef = useRef<HTMLDivElement>(null)
  const userDropdownRef = useRef<HTMLDivElement>(null)

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
    // Poll every 10 seconds for real-time project updates
    const interval = setInterval(fetchNotifications, 10000)
    return () => clearInterval(interval)
  }, [user])

  // Handle outside clicks to close the dropdowns
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (notificationsDropdownRef.current && !notificationsDropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false)
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
    <div className="bg-white border-b border-gray-100 px-4 sm:px-6 h-14 flex items-center justify-between sticky top-0 z-40">

      {/* LEFT: Menu Toggle (Mobile) */}
      <div className="flex items-center gap-2">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 rounded-lg hover:bg-gray-50 transition-colors mr-1"
          aria-label="Toggle navigation drawer"
        >
          <Menu className="w-5 h-5 text-gray-650" />
        </button>

        {/* Mobile Brand Logo */}
      <Link
  to="/"
  className="lg:hidden flex items-center gap-2 hover:opacity-90 transition-all cursor-pointer"
>
  <img
    src="/avatar.jpg"
    alt="Rabab Complex Stay"
    className="w-10 h-10 rounded-full object-cover border border-amber-400 shadow-md"
  />

  <span className="text-lg font-bold text-slate-800 tracking-tight">
    Rabab Complex Stay
  </span>
</Link>
      </div>

      {/* RIGHT: Notifications & Clickable User Menu */}
      <div className="flex items-center gap-4">

        {/* Real-time Notifications Bell Dropdown */}
        <div className="relative" ref={notificationsDropdownRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-slate-500 hover:bg-gray-50 transition-all active:scale-95 cursor-pointer relative"
            aria-label="Open notifications overlay panel"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2.5 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              
              {/* Header Panel */}
              <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Recent Activity</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Scrollable Container */}
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-50 custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-1.5">
                    <span className="text-xl">🔔</span>
                    <p className="text-[10px] font-bold uppercase tracking-wider">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map(item => (
                    <div
                      key={item.id}
                      onClick={() => handleMarkAsRead(item.id)}
                      className={`p-3 text-left transition-all hover:bg-slate-50 cursor-pointer flex gap-2.5 items-start ${!item.isRead ? "bg-blue-50/10 font-bold" : ""
                        }`}
                    >
                      <span className="text-xs mt-0.5 flex-shrink-0">
                        {item.title.toLowerCase().includes("payment") ? "💳" : item.title.toLowerCase().includes("booking") ? "🏨" : "📢"}
                      </span>
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <p className="text-xs text-slate-700 truncate leading-snug">{item.title}</p>
                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed">{item.message}</p>
                        <p className="text-[9px] text-slate-350 font-bold uppercase mt-1 tracking-wider">{formatTime(item.createdAt)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* CLICKABLE USER PROFILE CARD & POPUP */}
        <div className="relative" ref={userDropdownRef}>
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-gray-50 transition-all duration-150 text-left active:scale-98 cursor-pointer focus:outline-none"
            aria-label="Open user settings popup"
          >
            {/* User Info labels (desktop only) */}
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-slate-800 leading-tight truncate max-w-[120px]">{user?.name}</p>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider leading-none mt-1">{user?.role || "USER"}</p>
            </div>

            {/* User Avatar Icon */}
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm shadow-blue-100 flex-shrink-0">
              <User className="w-5 h-5 text-white stroke-[2.5]" />
            </div>
          </button>

          {/* User Pop-up Dropdown Menu - SIMPLIFIED TO LITERALLY ONLY LOGOUT */}
          {showUserDropdown && (
            <div className="absolute right-0 mt-2.5 w-40 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-1.5">
                <button
                  onClick={() => {
                    setShowUserDropdown(false)
                    handleLogout()
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-600 hover:text-rose-750 hover:bg-rose-50 rounded-xl transition-all duration-150 cursor-pointer text-left text-xs font-semibold"
                >
                  <LogOut size={14} className="text-rose-450" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default DashboardTopbar
