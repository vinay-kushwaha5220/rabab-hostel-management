import { useState, useEffect, useRef, useCallback } from "react"
import { Outlet, useNavigate, useLocation } from "react-router-dom"
import DashboardTopbar from "../components/navigation/DashboardTopbar"
import DashboardSidebar from "../components/navigation/DashboardSidebar"
import { useAuth } from "../context/AuthContextV2"
import { messagingService } from "../services/billingService"
import { X, MessageSquare } from "lucide-react"

interface MessageToast {
  id: string
  bookingId: number
  renterName: string
  message: string
  avatarInitials: string
  timestamp: Date
}

const getInitials = (name: string) => {
  if (!name) return "?"
  return name.trim().split(/\s+/).map(n => n[0]).slice(0, 2).join("").toUpperCase()
}

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [toasts, setToasts] = useState<MessageToast[]>([])
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const prevUnreadMapRef = useRef<Record<number, number>>({})
  const isFirstLoadRef = useRef(true)
  const isOnMessagesPage = location.pathname === "/admin/renter-chat"

  const dismissToast = useCallback((toastId: string) => {
    setToasts(prev => prev.filter(t => t.id !== toastId))
  }, [])

  const openConversation = useCallback((toast: MessageToast) => {
    dismissToast(toast.id)
    navigate("/admin/renter-chat")
  }, [navigate, dismissToast])

  // Auto-dismiss toasts after 6 seconds
  useEffect(() => {
    if (toasts.length === 0) return
    const timer = setTimeout(() => {
      setToasts(prev => prev.slice(1))
    }, 6000)
    return () => clearTimeout(timer)
  }, [toasts])

  // Poll for new renter messages — only for admin, only when NOT on the Messages page
  // (the Messages page has its own real-time polling)
  useEffect(() => {
    if (user?.role !== "ADMIN") return

    const poll = async () => {
      try {
        const data = await messagingService.getAllConversations()

        if (!isFirstLoadRef.current) {
          data.forEach((conv: any) => {
            const prevUnread = prevUnreadMapRef.current[conv.bookingId] ?? 0
            const currUnread = conv.unreadCount || 0

            if (currUnread > prevUnread) {
              // Only show toast if admin is NOT already on the Messages page
              if (!isOnMessagesPage) {
                const toast: MessageToast = {
                  id: `${conv.bookingId}-${Date.now()}`,
                  bookingId: conv.bookingId,
                  renterName: conv.renterName,
                  message: conv.latestMessage,
                  avatarInitials: getInitials(conv.renterName),
                  timestamp: new Date(),
                }
                setToasts(prev => [toast, ...prev].slice(0, 4))
              }
            }
          })
        }

        // Update reference map
        const newMap: Record<number, number> = {}
        data.forEach((c: any) => { newMap[c.bookingId] = c.unreadCount || 0 })
        prevUnreadMapRef.current = newMap

        if (isFirstLoadRef.current) isFirstLoadRef.current = false
      } catch {
        // Silently fail — don't break layout on network errors
      }
    }

    poll() // Initial load
    const interval = setInterval(poll, 8000) // Poll every 8 seconds
    return () => clearInterval(interval)
  }, [user?.role, isOnMessagesPage])

  // Reset toast state when navigating to messages page
  useEffect(() => {
    if (isOnMessagesPage) {
      setToasts([])
    }
  }, [isOnMessagesPage])

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <DashboardTopbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* ─── GLOBAL ADMIN MESSAGE NOTIFICATION TOASTS ─── */}
      {user?.role === "ADMIN" && (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 items-end pointer-events-none">
          {toasts.map((toast, index) => (
            <div
              key={toast.id}
              className="pointer-events-auto w-[320px] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex items-stretch"
              style={{
                animation: "slideInRight 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
                transform: `translateY(${index * -4}px)`,
              }}
            >
              {/* Green WhatsApp-style left bar */}
              <div className="w-1.5 bg-[#00a884] shrink-0" />

              {/* Clickable content */}
              <button
                onClick={() => openConversation(toast)}
                className="flex-1 flex items-center gap-3 px-3.5 py-3 text-left hover:bg-slate-50/80 transition-colors"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
                  {toast.avatarInitials}
                </div>

                {/* Message info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className="text-[11px] font-black text-slate-900 truncate">{toast.renterName}</p>
                    <span className="text-[9px] text-slate-400 font-bold shrink-0 font-mono">
                      {toast.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium truncate leading-tight">
                    {toast.message}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <MessageSquare size={9} className="text-[#00a884]" />
                    <p className="text-[9px] font-bold text-[#00a884] uppercase tracking-wider">
                      Open Messages ›
                    </p>
                  </div>
                </div>
              </button>

              {/* Dismiss */}
              <button
                onClick={() => dismissToast(toast.id)}
                className="w-8 flex items-center justify-center text-slate-300 hover:text-slate-500 hover:bg-slate-50 transition-colors shrink-0"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100%) scale(0.95); }
          to   { opacity: 1; transform: translateX(0)   scale(1); }
        }
      `}</style>
    </div>
  )
}

export default DashboardLayout
