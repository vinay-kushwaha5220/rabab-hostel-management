import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../services/apiV2"

// Enriched type for our notification including expanded relations
type EnrichedNotification = {
  id: number
  bookingId: number | null
  title: string
  message: string
  type: "booking" | "payment" | "cancellation" | "electricity" | "message" | "bill" | "system"
  isRead: boolean
  createdAt: string
  booking?: {
    id: number
    bookingId: string
    customerName: string
    customerEmail: string
    customerPhone: string
    customerAadhaar: string | null
    customerAadhaarMasked: string | null
    bookingType: "DAILY" | "MONTHLY"
    checkInDate: string
    checkOutDate: string
    totalDays: number
    totalAmount: number
    status: string
    paymentStatus: string
    stayStatus: string
    room: {
      id: number
      roomNumber: string
      title: string
      roomType: "AC" | "NON_AC"
      floor: number
      capacity: number
      monthlyPrice: number
      dailyPrice: number
    }
    user?: {
      id: number
      name: string
      email: string
      phone: string
    }
    payments?: Array<{
      id: number
      amount: number
      paymentMethod: "CASH" | "UPI" | "CARD" | "BANK_TRANSFER" | "ONLINE"
      transactionId: string | null
      paymentStatus: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED" | "VERIFICATION_PENDING"
      createdAt: string
      verificationStatus: string | null
      verificationNotes: string | null
    }>
    monthlyRenter?: {
      id: number
      joinDate: string
      currentCycleStart: string | null
      currentCycleEnd: string | null
      nextDueDate: string
      stayStatus: string
      rentAmount: number
      securityAmount: number
      status: string
      paymentStatus: string | null
      overdueDays: number
      pendingAmount: number
    }
    monthlyBills?: Array<{
      id: number
      month: string
      rentAmount: number
      electricityAmount: number
      extraCharges: number
      paidAmount: number
      remainingAmount: number
      totalDue: number
      isPaid: boolean
      status: string
      dueDate: string
    }>
  } | null
}

const NotificationsPage = () => {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<EnrichedNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedNotif, setSelectedNotif] = useState<EnrichedNotification | null>(null)
  const [approving, setApproving] = useState(false)
  const [markingId, setMarkingId] = useState<number | null>(null)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await api.get("/dashboard/notifications")
      // Cast the notifications from the server to our EnrichedNotification type
      setNotifications(response.data || [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: number) => {
    try {
      setMarkingId(notificationId)
      await api.put(`/dashboard/notifications/${notificationId}/read`)
      
      // Update local state smoothly
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      )
      
      if (selectedNotif && selectedNotif.id === notificationId) {
        setSelectedNotif(prev => prev ? { ...prev, isRead: true } : null)
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to mark as read')
    } finally {
      setMarkingId(null)
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.put("/dashboard/notifications/read-all")
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      if (selectedNotif) {
        setSelectedNotif(prev => prev ? { ...prev, isRead: true } : null)
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to mark all as read')
    }
  }

  const handleVerifyPayment = async (billId: number, amount: number, method: string) => {
    if (!window.confirm(`Are you sure you want to verify this payment of ₹${amount} and extend the stay cycle?`)) return
    try {
      setApproving(true)
      await api.put(`/monthly-bills/${billId}/verify`, {
        amount,
        paymentMethod: method,
        transactionId: `VERIFIED-${Date.now()}`
      })
      alert("Payment verified successfully & renter stay cycle updated! 🎉")
      
      // Refresh list to pull fresh database status
      await fetchNotifications()
      
      // Close drawer dynamically to prompt clean update
      setSelectedNotif(null)
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to verify payment")
    } finally {
      setApproving(false)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "booking":
        return "📅"
      case "payment":
        return "💳"
      case "cancellation":
        return "❌"
      case "electricity":
        return "⚡"
      case "message":
        return "💬"
      case "bill":
        return "⚠️"
      default:
        return "🔔"
    }
  }

  const getNotificationBadgeColor = (type: string) => {
    switch (type) {
      case "booking":
        return "bg-emerald-100 text-emerald-800 border-emerald-200"
      case "payment":
        return "bg-indigo-100 text-indigo-800 border-indigo-200"
      case "cancellation":
        return "bg-rose-100 text-rose-800 border-rose-200"
      case "electricity":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "message":
        return "bg-sky-100 text-sky-800 border-sky-200"
      case "bill":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-slate-100 text-slate-800 border-slate-200"
    }
  }

  const getRenterStatusBadgeColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 border-green-200"
      case "DUE_SOON":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "EXPIRES_TODAY":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "OVERDUE":
        return "bg-red-100 text-red-800 border-red-200 animate-pulse"
      case "PENDING_VERIFICATION":
      case "RENEWAL_PENDING":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-slate-100 text-slate-800 border-slate-200"
    }
  }

  // Filter & Search Logic
  const filteredNotifications = notifications.filter(notif => {
    // 1. Filter Tab
    if (filter === "unread" && notif.isRead) return false
    if (filter === "read" && !notif.isRead) return false
    if (filter === "booking" && notif.type !== "booking") return false
    if (filter === "payment" && notif.type !== "payment") return false
    if (filter === "message" && notif.type !== "message") return false
    if (filter === "bill" && notif.type !== "bill") return false

    // 2. Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const renterName = notif.booking?.customerName?.toLowerCase() || ""
      const roomNum = notif.booking?.room?.roomNumber?.toLowerCase() || ""
      const bookingCode = notif.booking?.bookingId?.toLowerCase() || ""
      const title = notif.title.toLowerCase()
      const message = notif.message.toLowerCase()

      return (
        renterName.includes(query) ||
        roomNum.includes(query) ||
        bookingCode.includes(query) ||
        title.includes(query) ||
        message.includes(query)
      )
    }

    return true
  })

  // Group Stats count
  const unreadCount = notifications.filter(n => !n.isRead).length
  const bookingCount = notifications.filter(n => n.type === "booking").length
  const paymentCount = notifications.filter(n => n.type === "payment").length
  const messageCount = notifications.filter(n => n.type === "message").length
  const billCount = notifications.filter(n => n.type === "bill").length

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
          <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest">Loading Alerts...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 relative">
      <div className="max-w-7xl mx-auto">
        {/* Header Block */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 mb-2 flex items-center gap-1.5 transition-colors uppercase tracking-wider"
            >
              <span>←</span> Back to Dashboard
            </button>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none">Notifications Hub</h1>
            <p className="text-slate-500 text-xs mt-2 font-medium">Real-time status updates and activity logs for staying renters</p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-800 active:scale-98 transition-all shadow-sm"
            >
              Mark All as Read
            </button>
          )}
        </div>

        {/* Counter Stats Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm hover:shadow transition-shadow">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Alerts</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{notifications.length}</p>
          </div>
          <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm hover:shadow transition-shadow">
            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Unread Alerts</p>
            <p className="text-2xl font-black text-blue-600 mt-1">{unreadCount}</p>
          </div>
          <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm hover:shadow transition-shadow">
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Bookings</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{bookingCount}</p>
          </div>
          <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm hover:shadow transition-shadow">
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Payments</p>
            <p className="text-2xl font-black text-indigo-600 mt-1">{paymentCount}</p>
          </div>
          <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm hover:shadow transition-shadow">
            <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">Rent Stays Due</p>
            <p className="text-2xl font-black text-orange-600 mt-1">{billCount}</p>
          </div>
        </div>

        {/* Search and Filters Segment */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Filters Tab Strip */}
          <div className="flex gap-1.5 flex-wrap overflow-x-auto w-full md:w-auto">
            {[
              { id: "all", label: `All (${notifications.length})`, color: "bg-slate-900 text-white" },
              { id: "unread", label: `Unread (${unreadCount})`, color: "bg-blue-600 text-white" },
              { id: "booking", label: `Bookings (${bookingCount})`, color: "bg-emerald-600 text-white" },
              { id: "payment", label: `Payments (${paymentCount})`, color: "bg-indigo-600 text-white" },
              { id: "message", label: `Messages (${messageCount})`, color: "bg-sky-600 text-white" },
              { id: "bill", label: `Stay Due (${billCount})`, color: "bg-orange-600 text-white" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                  filter === tab.id 
                    ? tab.color 
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Quick Search */}
          <div className="relative w-full md:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search renter, room, bookings..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-50/50"
            />
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
          </div>
        </div>

        {/* Alerts Dynamic Container */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white py-16 rounded-2xl border border-slate-100 text-center shadow-sm">
              <span className="text-4xl">✨</span>
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest mt-2">Logs are Empty</h3>
              <p className="text-[10px] text-slate-400 mt-1 font-semibold">No notifications fit the active filter or search criteria.</p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => setSelectedNotif(notif)}
                className={`bg-white p-4.5 rounded-2xl border transition-all hover:shadow-md cursor-pointer flex items-center justify-between gap-4 group ${
                  notif.isRead ? "border-slate-100" : "border-blue-200 bg-blue-50/20"
                }`}
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  {/* Decorative Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 shadow-sm ${
                    notif.isRead ? "bg-slate-100 text-slate-500" : "bg-blue-600 text-white animate-pulse"
                  }`}>
                    {getNotificationIcon(notif.type)}
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className={`text-xs font-black text-slate-800 leading-tight group-hover:text-blue-600 transition-colors`}>
                        {notif.title}
                      </h3>
                      {!notif.isRead && (
                        <span className="px-1.5 py-0.5 bg-blue-600 text-white text-[8px] font-black rounded uppercase tracking-wider">
                          New
                        </span>
                      )}
                      <span className={`px-2 py-0.5 border rounded text-[8px] font-black uppercase tracking-wider ${getNotificationBadgeColor(notif.type)}`}>
                        {notif.type}
                      </span>
                    </div>
                    
                    <p className="text-[11px] text-slate-600 font-medium leading-relaxed truncate md:whitespace-normal md:line-clamp-2">
                      {notif.message}
                    </p>

                    {/* Booking/Room subtitle tags */}
                    {notif.booking && (
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span>Renter: <strong className="text-slate-600">{notif.booking.customerName}</strong></span>
                        <span className="text-slate-200">•</span>
                        <span>Room: <strong className="text-slate-600">{notif.booking.room.roomNumber}</strong></span>
                        <span className="text-slate-200">•</span>
                        <span>ID: <strong className="text-slate-600">{notif.booking.bookingId}</strong></span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right actions strip */}
                <div className="flex items-center gap-3 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <div className="hidden sm:block text-right">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                      {new Date(notif.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>
                  
                  {/* Mark Read quick link */}
                  {!notif.isRead && (
                    <button
                      onClick={() => markAsRead(notif.id)}
                      disabled={markingId === notif.id}
                      className="text-[9px] font-bold uppercase tracking-wider text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg active:scale-95 transition-all"
                    >
                      {markingId === notif.id ? "..." : "Mark Read"}
                    </button>
                  )}
                  
                  {/* Expansion chevron indicator */}
                  <span className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all text-xs font-bold">
                    →
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ─── PREMIUM SLIDE-OUT DETAIL PANEL DRAWER ─── */}
      {selectedNotif && (
        <>
          {/* Backdrop Blur Overlay */}
          <div
            onClick={() => setSelectedNotif(null)}
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40 transition-opacity"
          />

          {/* Sliding Renter Profile Panel */}
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-[480px] bg-white shadow-2xl flex flex-col transform transition-transform duration-300 translate-x-0 overflow-hidden">
            {/* Header Block */}
            <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Renter initials profile circle */}
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-base font-black shadow-inner">
                  {selectedNotif.booking?.customerName?.charAt(0).toUpperCase() || "R"}
                </div>
                <div>
                  <h2 className="text-sm font-black tracking-tight leading-none truncate max-w-[220px]">
                    {selectedNotif.booking?.customerName || "System Notification"}
                  </h2>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    {selectedNotif.booking?.bookingId ? `Booking ${selectedNotif.booking.bookingId}` : "System Log"}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedNotif(null)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all flex items-center justify-center font-bold text-white text-sm"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Contents */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Notification Details Banner */}
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className={`px-2 py-0.5 border rounded text-[7.5px] font-black uppercase tracking-wider ${getNotificationBadgeColor(selectedNotif.type)}`}>
                    {selectedNotif.type}
                  </span>
                  {!selectedNotif.isRead && (
                    <span className="px-1.5 py-0.5 bg-blue-600 text-white text-[7.5px] font-black rounded uppercase tracking-wider">
                      New Alert
                    </span>
                  )}
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider font-mono ml-auto">
                    {new Date(selectedNotif.createdAt).toLocaleString()}
                  </span>
                </div>
                <h4 className="text-xs font-black text-slate-800">C/o {selectedNotif.title}</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed font-medium mt-1">{selectedNotif.message}</p>
              </div>

              {/* Renter Details Section */}
              {selectedNotif.booking ? (
                <>
                  {/* Renter Information Card */}
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">1. Renter Contact Information</h3>
                    <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-2.5 shadow-sm">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-400">Email Address:</span>
                        <span className="font-bold text-slate-800 break-all">{selectedNotif.booking.customerEmail}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-400">Phone Number:</span>
                        <span className="font-bold text-slate-800">{selectedNotif.booking.customerPhone}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-400">Aadhaar Card:</span>
                        <span className="font-bold text-slate-800 font-mono">
                          {selectedNotif.booking.customerAadhaar || selectedNotif.booking.customerAadhaarMasked || "Not Provided"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Room & Stay Cycle Card */}
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">2. Room & Stay Details</h3>
                    <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-2.5 shadow-sm">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-400">Assigned Unit:</span>
                        <span className="font-bold text-blue-600">Room {selectedNotif.booking.room?.roomNumber}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-400">Room Category:</span>
                        <span className="font-bold text-slate-800">{selectedNotif.booking.room?.title} ({selectedNotif.booking.room?.roomType})</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-400">Stay Type:</span>
                        <span className="font-bold text-slate-800">{selectedNotif.booking.bookingType} RENTAL</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-400">Stay Timeline:</span>
                        <span className="font-bold text-slate-800">
                          {new Date(selectedNotif.booking.checkInDate).toLocaleDateString()} - {new Date(selectedNotif.booking.checkOutDate).toLocaleDateString()} ({selectedNotif.booking.totalDays} Days)
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-400">Current Stay Status:</span>
                        <span className="font-bold text-slate-800">{selectedNotif.booking.stayStatus}</span>
                      </div>
                    </div>
                  </div>

                  {/* Monthly Active Staying Cycle details */}
                  {selectedNotif.booking.monthlyRenter && (
                    <div className="space-y-3">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">3. Monthly Rent Cycle tracking</h3>
                      <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-2.5 shadow-sm">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-400">Rent Ledger Status:</span>
                          <span className={`px-2 py-0.5 border rounded text-[9px] font-black uppercase tracking-wider ${getRenterStatusBadgeColor(selectedNotif.booking.monthlyRenter.status)}`}>
                            {selectedNotif.booking.monthlyRenter.status}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-400">Cycle Join Date:</span>
                          <span className="font-bold text-slate-800">
                            {new Date(selectedNotif.booking.monthlyRenter.joinDate).toLocaleDateString()}
                          </span>
                        </div>
                        {selectedNotif.booking.monthlyRenter.currentCycleStart && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-400">Current Billing Cycle:</span>
                            <span className="font-bold text-slate-800">
                              {new Date(selectedNotif.booking.monthlyRenter.currentCycleStart).toLocaleDateString()} - {new Date(selectedNotif.booking.monthlyRenter.currentCycleEnd || "").toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-400">Payment Due Date:</span>
                          <span className="font-bold text-slate-800 text-rose-600 font-mono">
                            {new Date(selectedNotif.booking.monthlyRenter.nextDueDate).toLocaleDateString()}
                          </span>
                        </div>
                        {selectedNotif.booking.monthlyRenter.overdueDays > 0 && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-red-500">Overdue Stacking Days:</span>
                            <span className="font-bold text-red-600 font-mono">{selectedNotif.booking.monthlyRenter.overdueDays} Days Delayed</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Financial Ledger Outstanding dues */}
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">4. Billing & Outstanding Dues</h3>
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4.5 space-y-3">
                      
                      {selectedNotif.booking.bookingType === "MONTHLY" && selectedNotif.booking.monthlyBills && selectedNotif.booking.monthlyBills.length > 0 ? (
                        <>
                          <div className="border-b border-slate-200 pb-2 mb-2">
                            <div className="flex justify-between text-xs font-bold text-slate-800">
                              <span>Month / Bill Period:</span>
                              <span className="text-blue-600">{selectedNotif.booking.monthlyBills[0].month}</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                              <span>Bill Status:</span>
                              <span className={selectedNotif.booking.monthlyBills[0].isPaid ? "text-green-600" : "text-rose-600 animate-pulse"}>
                                {selectedNotif.booking.monthlyBills[0].status}
                              </span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-500">Monthly Rent Fee:</span>
                            <span className="font-bold text-slate-850">₹{selectedNotif.booking.monthlyBills[0].rentAmount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-500">Electricity Charge:</span>
                            <span className="font-bold text-slate-850">₹{selectedNotif.booking.monthlyBills[0].electricityAmount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-500">Extras / Penalties:</span>
                            <span className="font-bold text-slate-850">₹{selectedNotif.booking.monthlyBills[0].extraCharges.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs border-t border-slate-200/50 pt-2 font-bold text-slate-800">
                            <span>Total Stay Dues:</span>
                            <span>₹{selectedNotif.booking.monthlyBills[0].totalDue.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs text-green-600 font-bold">
                            <span>Total Verified Paid:</span>
                            <span>- ₹{selectedNotif.booking.monthlyBills[0].paidAmount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm border-t border-slate-200 pt-2 font-extrabold">
                            <span className="text-slate-800">Remaining Pending Dues:</span>
                            <span className={selectedNotif.booking.monthlyBills[0].remainingAmount > 0 ? "text-rose-600" : "text-green-600 font-mono"}>
                              ₹{selectedNotif.booking.monthlyBills[0].remainingAmount.toLocaleString()}
                            </span>
                          </div>
                        </>
                      ) : (
                        // Daily stay calculation fallback
                        <>
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-500">Total Booking Price:</span>
                            <span className="font-bold text-slate-800">₹{selectedNotif.booking.totalAmount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-500">Advance Paid Status:</span>
                            <span className={`font-bold uppercase ${selectedNotif.booking.paymentStatus === 'SUCCESS' ? 'text-green-600' : 'text-rose-600'}`}>
                              {selectedNotif.booking.paymentStatus}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm border-t border-slate-200 pt-2 font-extrabold text-slate-800">
                            <span>Outstanding Balance:</span>
                            <span className={selectedNotif.booking.paymentStatus === 'SUCCESS' ? 'text-green-600 font-mono' : 'text-rose-600'}>
                              ₹{(selectedNotif.booking.paymentStatus === 'SUCCESS' ? 0 : selectedNotif.booking.totalAmount).toLocaleString()}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Payment Transaction Log */}
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">5. Recent Transaction History</h3>
                    <div className="space-y-2">
                      {!selectedNotif.booking.payments || selectedNotif.booking.payments.length === 0 ? (
                        <p className="text-[10px] text-slate-400 font-semibold italic">No payments logged yet.</p>
                      ) : (
                        selectedNotif.booking.payments.map((p) => (
                          <div key={p.id} className="border border-slate-100 rounded-2xl p-3 bg-white space-y-1.5 text-xs shadow-sm">
                            <div className="flex justify-between items-center font-bold">
                              <span className="text-slate-800">₹{p.amount.toLocaleString()} ({p.paymentMethod})</span>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                p.paymentStatus === "SUCCESS" ? "bg-green-100 text-green-800" :
                                p.paymentStatus === "VERIFICATION_PENDING" || p.paymentStatus === "PENDING" ? "bg-amber-100 text-amber-800 animate-pulse" :
                                "bg-rose-100 text-rose-800"
                              }`}>
                                {p.paymentStatus}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              Txn ID: {p.transactionId || "N/A"}
                            </div>
                            <div className="text-[9px] text-slate-400 font-bold uppercase">
                              Submitted: {new Date(p.createdAt).toLocaleString()}
                            </div>
                            
                            {/* Verification section */}
                            {p.verificationStatus && (
                              <div className="text-[10px] border-t border-slate-50 pt-1.5 mt-1.5 flex justify-between text-slate-500">
                                <span>Verification:</span>
                                <strong className={p.verificationStatus === "VERIFIED" ? "text-green-600" : "text-rose-600"}>
                                  {p.verificationStatus}
                                </strong>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* QUICK REAL-TIME ADMINISTRATIVE ACTION: payment verify/approvals */}
                  {selectedNotif.booking.monthlyBills && selectedNotif.booking.monthlyBills.some(b => b.status === "VERIFICATION_PENDING") && (
                    <div className="space-y-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4.5">
                      <h4 className="text-[10px] font-black text-indigo-800 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                        <span className="text-xs">⚡</span> ACTION REQUIRED: Approve Pending Payment
                      </h4>
                      <p className="text-[10px] text-indigo-700/80 font-semibold leading-relaxed mt-1">
                        The renter has submitted a payment receipt. Click below to verify and auto-extend their staying cycle immediately.
                      </p>
                      
                      {selectedNotif.booking.monthlyBills
                        .filter(b => b.status === "VERIFICATION_PENDING")
                        .map(b => (
                          <div key={b.id} className="flex gap-2 mt-3.5">
                            <button
                              onClick={() => handleVerifyPayment(b.id, b.totalDue, "UPI")}
                              disabled={approving}
                              className="flex-1 bg-indigo-600 text-white font-black text-[9px] uppercase tracking-wider py-2.5 rounded-xl hover:bg-indigo-700 active:scale-95 transition-all text-center shadow-sm disabled:opacity-50"
                            >
                              {approving ? "Approving..." : "Verify UPI / Online"}
                            </button>
                            <button
                              onClick={() => handleVerifyPayment(b.id, b.totalDue, "CASH")}
                              disabled={approving}
                              className="flex-1 bg-slate-900 text-white font-black text-[9px] uppercase tracking-wider py-2.5 rounded-xl hover:bg-slate-800 active:scale-95 transition-all text-center shadow-sm disabled:opacity-50"
                            >
                              {approving ? "Approving..." : "Confirm Cash"}
                            </button>
                          </div>
                        ))
                      }
                    </div>
                  )}
                </>
              ) : (
                <p className="text-[11px] text-slate-400 italic">This is a system notification without associated renter booking records.</p>
              )}
            </div>

            {/* Bottom Actions Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
              {/* Mark Read */}
              {!selectedNotif.isRead && (
                <button
                  onClick={() => markAsRead(selectedNotif.id)}
                  disabled={markingId === selectedNotif.id}
                  className="flex-1 text-center py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-98 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-sm"
                >
                  {markingId === selectedNotif.id ? "Marking..." : "Mark Read"}
                </button>
              )}
              
              {/* Direct Messages Navigation */}
              {selectedNotif.booking && (
                <button
                  onClick={() => {
                    navigate("/admin/renter-chat")
                    setSelectedNotif(null)
                  }}
                  className="flex-1 text-center py-2.5 bg-blue-600 hover:bg-blue-700 text-white active:scale-98 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-sm shadow-blue-100"
                >
                  💬 Message Renter
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default NotificationsPage
