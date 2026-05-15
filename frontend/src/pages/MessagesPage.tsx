import { useState } from "react"
import Card from "../components/ui/Card"
import Badge from "../components/ui/Badge"

interface Message {
  id: number
  sender: string
  subject: string
  preview: string
  timestamp: string
  read: boolean
}

const MessagesPage = () => {
  const [messages] = useState<Message[]>([
    {
      id: 1,
      sender: "Admin Support",
      subject: "Your booking confirmation",
      preview: "Your booking for Room 101 has been confirmed...",
      timestamp: "2 hours ago",
      read: false,
    },
    {
      id: 2,
      sender: "Billing Team",
      subject: "Monthly bill ready for payment",
      preview: "Your monthly bill for May 2026 is ready...",
      timestamp: "1 day ago",
      read: true,
    },
  ])

  const unreadCount = messages.filter(m => !m.read).length

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
            <p className="text-gray-600 mt-2">Stay updated with important notifications</p>
          </div>
          {unreadCount > 0 && (
            <Badge variant="warning">{unreadCount} Unread</Badge>
          )}
        </div>
      </div>

      {/* Messages List */}
      <div className="space-y-4">
        {messages.map((message) => (
          <Card
            key={message.id}
            className={`p-4 cursor-pointer transition-all hover:shadow-md ${
              !message.read ? "bg-blue-50 border-l-4 border-blue-600" : ""
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                {message.sender.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className={`font-semibold ${!message.read ? "text-gray-900" : "text-gray-700"}`}>
                    {message.sender}
                  </h3>
                  <span className="text-xs text-gray-500 flex-shrink-0">{message.timestamp}</span>
                </div>
                <p className={`text-sm font-medium mt-1 ${!message.read ? "text-gray-900" : "text-gray-700"}`}>
                  {message.subject}
                </p>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{message.preview}</p>
              </div>
              {!message.read && (
                <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {messages.length === 0 && (
        <Card className="p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-600 text-lg font-medium">No messages</p>
          <p className="text-gray-500 text-sm mt-2">You're all caught up!</p>
        </Card>
      )}
    </div>
  )
}

export default MessagesPage
