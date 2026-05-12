import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../services/api"
import type { NotificationType } from "../../types/dashboard"

const NotificationsPage = () => {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<NotificationType[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await api.get("/dashboard/notifications")
      setNotifications(response.data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: number) => {
    try {
      await api.put(`/dashboard/notifications/${notificationId}/read`)
      fetchNotifications()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to mark as read')
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.put("/dashboard/notifications/read-all")
      alert('All notifications marked as read')
      fetchNotifications()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to mark all as read')
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "booking":
        return "📅"
      case "payment":
        return "💰"
      case "cancellation":
        return "❌"
      case "electricity":
        return "⚡"
      default:
        return "🔔"
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    if (filter === "unread") return !notification.isRead
    if (filter === "read") return notification.isRead
    if (filter === "booking") return notification.type === "booking"
    if (filter === "payment") return notification.type === "payment"
    if (filter === "cancellation") return notification.type === "cancellation"
    return true
  })

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="text-blue-600 hover:underline mb-2 text-sm"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600">View all system notifications</p>
          </div>
          {notifications.filter(n => !n.isRead).length > 0 && (
            <button
              onClick={markAllAsRead}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Mark All as Read
            </button>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{notifications.length}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="bg-white p-4 rounded border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">
              {notifications.filter(n => !n.isRead).length}
            </div>
            <div className="text-sm text-gray-600">Unread</div>
          </div>
          <div className="bg-white p-4 rounded border border-gray-200">
            <div className="text-2xl font-bold text-green-600">
              {notifications.filter(n => n.type === "booking").length}
            </div>
            <div className="text-sm text-gray-600">Bookings</div>
          </div>
          <div className="bg-white p-4 rounded border border-gray-200">
            <div className="text-2xl font-bold text-purple-600">
              {notifications.filter(n => n.type === "payment").length}
            </div>
            <div className="text-sm text-gray-600">Payments</div>
          </div>
          <div className="bg-white p-4 rounded border border-gray-200">
            <div className="text-2xl font-bold text-yellow-600">
              {notifications.filter(n => n.type === "cancellation").length}
            </div>
            <div className="text-sm text-gray-600">Cancellations</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded border border-gray-200 mb-6">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded text-sm font-semibold ${
                filter === "all" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-4 py-2 rounded text-sm font-semibold ${
                filter === "unread" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Unread ({notifications.filter(n => !n.isRead).length})
            </button>
            <button
              onClick={() => setFilter("read")}
              className={`px-4 py-2 rounded text-sm font-semibold ${
                filter === "read" ? "bg-gray-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Read ({notifications.filter(n => n.isRead).length})
            </button>
            <button
              onClick={() => setFilter("booking")}
              className={`px-4 py-2 rounded text-sm font-semibold ${
                filter === "booking" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Bookings ({notifications.filter(n => n.type === "booking").length})
            </button>
            <button
              onClick={() => setFilter("payment")}
              className={`px-4 py-2 rounded text-sm font-semibold ${
                filter === "payment" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Payments ({notifications.filter(n => n.type === "payment").length})
            </button>
            <button
              onClick={() => setFilter("cancellation")}
              className={`px-4 py-2 rounded text-sm font-semibold ${
                filter === "cancellation" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Cancellations ({notifications.filter(n => n.type === "cancellation").length})
            </button>
            <button
              onClick={() => setFilter("cancellation")}
              className={`px-4 py-2 rounded text-sm font-semibold ${
                filter === "cancellation" ? "bg-yellow-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Cancellations ({notifications.filter(n => n.type === "cancellation").length})
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white p-8 rounded border border-gray-200 text-center text-gray-500">
              No notifications found
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white p-4 rounded border ${
                  notification.isRead ? "border-gray-200" : "border-blue-300 bg-blue-50"
                } hover:shadow transition-shadow`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900">{notification.title}</h3>
                        {!notification.isRead && (
                          <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded font-semibold">
                            NEW
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          notification.type === "booking" ? "bg-green-100 text-green-800" :
                          notification.type === "payment" ? "bg-purple-100 text-purple-800" :
                          notification.type === "cancellation" ? "bg-red-100 text-red-800" :
                          notification.type === "electricity" ? "bg-yellow-100 text-yellow-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {notification.type.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2">{notification.message}</p>
                      {notification.booking && (
                        <div className="text-sm text-gray-600">
                          <span className="font-semibold">Booking ID:</span> {notification.booking.bookingId} | 
                          <span className="font-semibold"> Room:</span> {notification.booking.room.roomNumber} - {notification.booking.room.title}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-2">
                        {new Date(notification.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {!notification.isRead && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Mark Read
                      </button>
                    )}
                    {notification.booking && (
                      <button
                        onClick={() => navigate(`/booking-confirmation/${notification.bookingId}`)}
                        className="text-green-600 hover:underline text-sm"
                      >
                        View Booking
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary */}
        <div className="mt-6 bg-white p-4 rounded border border-gray-200">
          <div className="text-sm text-gray-600">
            Showing {filteredNotifications.length} of {notifications.length} notifications
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotificationsPage
