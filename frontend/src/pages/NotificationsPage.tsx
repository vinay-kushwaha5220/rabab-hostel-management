import { useState } from "react"
import Card from "../components/ui/Card"
import Badge from "../components/ui/Badge"

interface Notification {
  id: number
  type: "booking" | "payment" | "system" | "message"
  title: string
  description: string
  timestamp: string
  read: boolean
  icon: string
}

const NotificationsPage = () => {
  const [notifications] = useState<Notification[]>([
    {
      id: 1,
      type: "booking",
      title: "Booking Confirmed",
      description: "Your booking for Room 101 from May 15-20 has been confirmed",
      timestamp: "2 hours ago",
      read: false,
      icon: "🏨",
    },
    {
      id: 2,
      type: "payment",
      title: "Payment Received",
      description: "We received your payment of ₹5,000 for May 2026",
      timestamp: "1 day ago",
      read: false,
      icon: "💳",
    },
    {
      id: 3,
      type: "system",
      title: "System Maintenance",
      description: "Scheduled maintenance on May 20, 2026 from 2-4 AM",
      timestamp: "3 days ago",
      read: true,
      icon: "🔧",
    },
    {
      id: 4,
      type: "message",
      title: "New Message",
      description: "Admin sent you a message regarding your booking",
      timestamp: "5 days ago",
      read: true,
      icon: "💬",
    },
  ])

  const unreadCount = notifications.filter(n => !n.read).length

  const getTypeColor = (type: string) => {
    switch (type) {
      case "booking":
        return "bg-blue-100 text-blue-800"
      case "payment":
        return "bg-green-100 text-green-800"
      case "system":
        return "bg-yellow-100 text-yellow-800"
      case "message":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600 mt-2">Stay informed about your account activity</p>
          </div>
          {unreadCount > 0 && (
            <Badge variant="warning">{unreadCount} Unread</Badge>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.map((notification) => (
          <Card
            key={notification.id}
            className={`p-4 transition-all ${
              !notification.read ? "bg-blue-50 border-l-4 border-blue-600" : ""
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0 ${getTypeColor(notification.type)}`}>
                {notification.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className={`font-semibold ${!notification.read ? "text-gray-900" : "text-gray-700"}`}>
                    {notification.title}
                  </h3>
                  <span className="text-xs text-gray-500 flex-shrink-0">{notification.timestamp}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{notification.description}</p>
              </div>
              {!notification.read && (
                <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {notifications.length === 0 && (
        <Card className="p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <p className="text-gray-600 text-lg font-medium">No notifications</p>
          <p className="text-gray-500 text-sm mt-2">You're all caught up!</p>
        </Card>
      )}
    </div>
  )
}

export default NotificationsPage
