import { useEffect, useState, useRef } from "react"
import { messagingService } from "../../services/billingService"
import type { Message } from "../../types/billing"
import LoadingSpinner from "../../components/ui/LoadingSpinner"
import Card from "../../components/ui/Card"
import Button from "../../components/ui/Button"

interface Conversation {
  bookingId: number
  bookingCode?: string
  renterName: string
  renterId: number
  latestMessage: string
  latestMessageTime: string
  unreadCount: number
  messages: Message[]
}

const RenterChatManagement = () => {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messageContent, setMessageContent] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [selectedConversation?.messages])

  const formatDate = (dateString: string) => {
    if (!dateString) return "No date"
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "Recently"
    return date.toLocaleString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      month: 'short',
      day: 'numeric'
    })
  }

  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const data = await messagingService.getAllConversations()
      setConversations(data)
      setError("")
    } catch (err) {
      setError("Failed to fetch conversations")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectConversation = async (conversation: Conversation) => {
    try {
      const messages = await messagingService.getConversation(conversation.bookingId)
      setSelectedConversation({
        ...conversation,
        messages,
      })
    } catch (err) {
      setError("Failed to load conversation")
      console.error(err)
    }
  }

  const handleSendMessage = async () => {
    if (!messageContent.trim() || !selectedConversation) return

    try {
      setSendingMessage(true)
      await messagingService.sendMessage({
        bookingId: selectedConversation.bookingId,
        receiverId: selectedConversation.renterId,
        content: messageContent,
      })
      setMessageContent("")
      setSuccess("Message sent successfully")
      await handleSelectConversation(selectedConversation)
      await fetchConversations()
      // Auto-scroll after sending
      setTimeout(scrollToBottom, 100)
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError("Failed to send message")
      console.error(err)
    } finally {
      setSendingMessage(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Renter Chat Management</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Conversations</h2>
              {loading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="md" text="Loading..." />
                </div>
              ) : conversations.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No conversations yet</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {conversations.map((conversation) => (
                    <button
                      key={conversation.bookingId}
                      onClick={() => handleSelectConversation(conversation)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                        selectedConversation?.bookingId === conversation.bookingId
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">{conversation.renterName}</h3>
                        {conversation.unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">{conversation.latestMessage || "No messages"}</p>
                      <p className="text-xs text-gray-500 mt-1 font-medium">
                        {formatDate(conversation.latestMessageTime)}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <Card className="p-6 flex flex-col h-full">
                <div className="mb-6 pb-4 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedConversation.renterName}
                  </h2>
                  <p className="text-sm text-gray-600 font-mono">#{selectedConversation.bookingCode || selectedConversation.bookingId}</p>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto min-h-[400px] max-h-[600px] mb-6 space-y-4 pr-2 custom-scrollbar scroll-smooth">
                  {selectedConversation.messages.length === 0 ? (
                    <p className="text-center text-gray-600 py-8">No messages yet</p>
                  ) : (
                    selectedConversation.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.senderId !== selectedConversation.renterId ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-sm ${
                            message.senderId !== selectedConversation.renterId
                              ? "bg-blue-600 text-white rounded-tr-none"
                              : "bg-white text-gray-900 border border-gray-200 rounded-tl-none"
                          }`}
                        >
                          <p className="text-sm leading-relaxed font-medium">{message.content}</p>
                          <div className="flex items-center justify-end gap-1 mt-1.5 opacity-70">
                            <p className={`text-[10px] font-bold uppercase tracking-wider ${
                              message.senderId !== selectedConversation.renterId ? "text-blue-100" : "text-gray-400"
                            }`}>
                              {formatDate(message.createdAt)}
                            </p>
                            {message.senderId !== selectedConversation.renterId && (
                              <span className="flex items-center">
                                {message.isRead ? (
                                  <svg className="w-3.5 h-3.5 text-blue-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                    <polyline points="15 6 9 12 12 15" className="translate-x-3 -translate-y-3" />
                                  </svg>
                                ) : (
                                  <svg className="w-3.5 h-3.5 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={sendingMessage || !messageContent.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {sendingMessage ? "Sending..." : "Send"}
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="p-8 text-center">
                <p className="text-gray-600 text-lg">Select a conversation to start chatting</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RenterChatManagement
