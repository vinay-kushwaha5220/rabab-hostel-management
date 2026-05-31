import { useEffect, useState, useRef } from "react"
import { messagingService } from "../../services/billingService"
import type { Message } from "../../types/billing"
import LoadingSpinner from "../../components/ui/LoadingSpinner"
import { 
  Search, 
  MessageSquare, 
  RefreshCw, 
  CheckCheck,
  AlertCircle,
  Sparkles,
  SendHorizontal
} from "lucide-react"

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
  const [searchTerm, setSearchTerm] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const prevMessageCountRef = useRef<number>(0)
  const prevBookingIdRef = useRef<number | null>(null)
  // Track previously seen unread counts per conversation
  const prevUnreadMapRef = useRef<Record<number, number>>({})
  const isFirstLoadRef = useRef(true)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Robust scrolling logic - trigger only when new messages are added or active conversation changes
  useEffect(() => {
    if (!selectedConversation) return

    const currentMessageCount = selectedConversation.messages.length
    const currentBookingId = selectedConversation.bookingId

    if (
      currentBookingId !== prevBookingIdRef.current || 
      currentMessageCount > prevMessageCountRef.current
    ) {
      scrollToBottom()
    }

    prevMessageCountRef.current = currentMessageCount
    prevBookingIdRef.current = currentBookingId
  }, [selectedConversation?.messages.length, selectedConversation?.bookingId])

  const getRelativeTime = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "Now"
    
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getInitials = (name: string) => {
    if (!name) return "?"
    return name
      .trim()
      .split(/\s+/)
      .map(n => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
  }

  useEffect(() => {
    fetchConversations()
    
    // Periodic refresh — 12s is sufficient; DashboardLayout already detects new messages at 8s
    const interval = setInterval(() => {
      refreshConversationsSilently()
    }, 12000)
    return () => clearInterval(interval)
  }, [selectedConversation?.bookingId])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const data = await messagingService.getAllConversations()
      setConversations(data)
      
      // On first load, initialize the unread map without showing toasts
      if (isFirstLoadRef.current) {
        const initialMap: Record<number, number> = {}
        data.forEach((c: Conversation) => {
          initialMap[c.bookingId] = c.unreadCount
        })
        prevUnreadMapRef.current = initialMap
        isFirstLoadRef.current = false
      }
      
      setError("")
    } catch (err) {
      setError("Failed to fetch conversations")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const refreshConversationsSilently = async () => {
    try {
      const data = await messagingService.getAllConversations()
      
      // Update the unread map reference
      const newMap: Record<number, number> = {}
      data.forEach((c: Conversation) => {
        newMap[c.bookingId] = c.unreadCount
      })
      prevUnreadMapRef.current = newMap
      if (isFirstLoadRef.current) isFirstLoadRef.current = false

      setConversations(data)
      
      // Also refresh active conversation details if one is selected
      if (selectedConversation) {
        const activeConv = data.find((c: Conversation) => c.bookingId === selectedConversation.bookingId)
        if (activeConv) {
          const messages = await messagingService.getConversation(selectedConversation.bookingId)
          setSelectedConversation(prev => {
            if (!prev) return null
            return {
              ...activeConv,
              messages
            }
          })
        }
      }
    } catch (err) {
      console.error("Silent sync failed", err)
    }
  }

  const handleSelectConversation = async (conversation: Conversation) => {
    try {
      const messages = await messagingService.getConversation(conversation.bookingId)
      setSelectedConversation({
        ...conversation,
        messages,
      })
      
      // Clear active unread count locally for responsive feel
      setConversations(prev => 
        prev.map(c => 
          c.bookingId === conversation.bookingId 
            ? { ...c, unreadCount: 0 } 
            : c
        )
      )
      
      // Update the reference map so no toast fires for this booking
      prevUnreadMapRef.current = {
        ...prevUnreadMapRef.current,
        [conversation.bookingId]: 0,
      }
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
        content: messageContent.trim(),
      })
      setMessageContent("")
      
      // Instantly load new messages
      const messages = await messagingService.getConversation(selectedConversation.bookingId)
      setSelectedConversation(prev => {
        if (!prev) return null
        return {
          ...prev,
          messages
        }
      })
      
      // Sync list
      const data = await messagingService.getAllConversations()
      setConversations(data)
      
      // Force scroll on manual send
      setTimeout(scrollToBottom, 50)
    } catch (err) {
      setError("Failed to send message")
      console.error(err)
    } finally {
      setSendingMessage(false)
    }
  }

  // Total unread count for the header badge
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)

  // Filter conversations based on search term
  const filteredConversations = conversations.filter(c => 
    c.renterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.bookingCode && c.bookingCode.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh-8rem)] min-h-[600px] max-h-[780px]">
        
        {/* Page Title Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 shrink-0">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Renter Support Hub
              <Sparkles className="w-5 h-5 text-blue-600 fill-blue-100" />
              {totalUnread > 0 && (
                <span className="ml-1 px-2.5 py-0.5 bg-rose-500 text-white text-xs font-black rounded-full shadow-sm shadow-rose-100 animate-pulse">
                  {totalUnread} new
                </span>
              )}
            </h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              Manage live support queries, resolve hostel bookings, and chat with residents in real time.
            </p>
          </div>
          
          <button 
            onClick={fetchConversations}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-600 hover:text-blue-600 bg-white border border-slate-200 rounded-xl hover:border-blue-200 hover:bg-blue-50/40 transition-all shadow-sm shrink-0 self-start md:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Sync Dashboard
          </button>
        </div>

        {/* Global Notifications Panel (floating/dismissable) */}
        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200/80 rounded-xl text-rose-700 text-xs font-medium flex items-center justify-between shadow-sm shrink-0 animate-fade-in">
            <span className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </span>
            <button onClick={() => setError("")} className="hover:text-rose-900 font-bold px-1.5">&times;</button>
          </div>
        )}

        {/* Main Messenger UI Box */}
        <div className="flex-1 flex bg-white border border-slate-200/85 rounded-2xl shadow-xl overflow-hidden min-h-0">
          
          {/* LEFT SIDEBAR: Conversational List */}
          <div className="w-80 border-r border-slate-150 flex flex-col bg-slate-50/30 shrink-0">
            
            {/* Search and Metadata Header */}
            <div className="p-4 border-b border-slate-100 bg-white">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Active Chats
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold text-blue-600 bg-blue-50 rounded-full">
                  {conversations.length} Active
                </span>
              </div>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search renter name or booking..."
                  className="pl-10 pr-4 py-2 w-full bg-slate-50 border border-slate-200 text-slate-700 placeholder-slate-400 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all font-medium"
                />
              </div>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <LoadingSpinner size="md" />
                  <span className="text-xs font-semibold text-slate-400">Loading inbox...</span>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                  <MessageSquare className="w-8 h-8 text-slate-300 stroke-1 mb-2" />
                  <p className="text-sm font-semibold text-slate-500">No conversations</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-[180px]">
                    {searchTerm ? "No matches found for your search term." : "No resident has opened a ticket yet."}
                  </p>
                </div>
              ) : (
                filteredConversations.map((conversation) => {
                  const isActive = selectedConversation?.bookingId === conversation.bookingId
                  const hasUnread = conversation.unreadCount > 0
                  return (
                    <button
                      key={conversation.bookingId}
                      onClick={() => handleSelectConversation(conversation)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border text-left group relative ${
                        isActive
                          ? "bg-blue-50/70 border-blue-100 shadow-sm"
                          : hasUnread
                          ? "border-rose-100 bg-rose-50/30 hover:bg-rose-50/60"
                          : "border-transparent hover:bg-slate-100/60"
                      }`}
                    >
                      {/* Avatar initials with dynamic gradients */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm tracking-wide shrink-0 shadow-sm select-none transition-transform group-hover:scale-105 ${
                        isActive 
                          ? "bg-gradient-to-br from-blue-600 to-indigo-650 text-white" 
                          : hasUnread
                          ? "bg-gradient-to-br from-rose-500 to-pink-600 text-white"
                          : "bg-gradient-to-br from-slate-200 to-slate-300 text-slate-700"
                      }`}>
                        {getInitials(conversation.renterName)}
                      </div>

                      {/* Info Panel */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className={`font-semibold text-sm truncate leading-tight ${
                            isActive ? "text-blue-950" : hasUnread ? "text-slate-900 font-bold" : "text-slate-800"
                          }`}>
                            {conversation.renterName}
                          </h3>
                          <span className="text-[10px] font-medium text-slate-400 shrink-0 ml-1.5">
                            {getRelativeTime(conversation.latestMessageTime)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[10px] font-mono font-bold px-1 py-0.5 rounded leading-none shrink-0 ${
                            isActive ? "bg-blue-100/80 text-blue-750" : "bg-slate-200/50 text-slate-500"
                          }`}>
                            #{conversation.bookingCode || conversation.bookingId}
                          </span>
                          <span className={`text-[11px] font-medium truncate flex-1 ${hasUnread ? "text-slate-700 font-semibold" : "text-slate-400"}`}>
                            {conversation.latestMessage || "No messages yet"}
                          </span>
                        </div>
                      </div>

                      {/* Unread badge */}
                      {hasUnread && !isActive && (
                        <div className="bg-rose-500 text-white text-[10px] font-bold h-5 min-w-[20px] rounded-full px-1.5 flex items-center justify-center shrink-0 shadow-md shadow-rose-100">
                          {conversation.unreadCount}
                        </div>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* RIGHT SIDEBAR: Chat Area */}
          <div className="flex-1 flex flex-col bg-white min-w-0">
            {selectedConversation ? (
              <div className="flex-grow flex flex-col min-h-0 h-full">
                
                {/* Active Chat Header */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-sm tracking-wider flex items-center justify-center shadow-sm shrink-0">
                      {getInitials(selectedConversation.renterName)}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base font-bold text-slate-800 leading-tight flex items-center gap-2">
                        {selectedConversation.renterName}
                        <span className="flex h-2.5 w-2.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                      </h2>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                          #{selectedConversation.bookingCode || selectedConversation.bookingId}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                          Warden Direct Line
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectConversation(selectedConversation)}
                    title="Refresh current chat"
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-100"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {/* Live Message List */}
                <div className="flex-grow overflow-y-auto p-6 bg-[#efeae2] relative custom-scrollbar scroll-smooth min-h-0">
                  {selectedConversation.messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <MessageSquare className="w-10 h-10 text-slate-350 stroke-1 mb-2" />
                      <p className="text-sm font-semibold text-slate-500">Inbox is empty</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                        Send a message below to start your conversation with {selectedConversation.renterName}.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 pr-3.5 pl-1">
                      {selectedConversation.messages.map((message) => {
                        const isAdmin = String(message.senderId) !== String(selectedConversation.renterId)
                        return (
                          <div
                            key={message.id}
                            className={`flex w-full ${isAdmin ? "justify-end mr-1.5" : "justify-start"} mb-1`}
                          >
                            {/* Renter avatar for non-admin messages */}
                            {!isAdmin && (
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 text-white font-bold text-[9px] flex items-center justify-center shrink-0 mr-1.5 mt-auto shadow-sm">
                                {getInitials(selectedConversation.renterName)}
                              </div>
                            )}
                            <div className={`max-w-[72%] px-3 py-1.5 pb-5 rounded-xl shadow-sm text-xs font-medium leading-relaxed relative ${
                              isAdmin
                                ? "bg-[#dcf8c6] text-slate-850 rounded-tr-none"
                                : "bg-white text-slate-800 border border-slate-200/40 rounded-tl-none"
                            }`}>
                              <p className="break-words whitespace-pre-wrap pr-10 text-[12px] font-medium leading-normal">{message.content}</p>

                              {/* Bottom-right inline timestamp + read receipts */}
                              <div className="absolute bottom-0.5 right-1.5 flex items-center gap-1 select-none">
                                <span className="text-[8px] text-slate-450 font-bold tracking-normal font-mono">
                                  {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {isAdmin && (
                                  <span className="flex items-center">
                                    {message.isRead ? (
                                      <CheckCheck size={11} className="text-[#53bdeb] stroke-[2.5]" />
                                    ) : (
                                      <CheckCheck size={11} className="text-[#8696a0] stroke-[2.5]" />
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input action dock */}
                <div className="p-3 border-t border-slate-100 bg-[#f0f0f0] shrink-0">
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      placeholder={`Type your reply to ${selectedConversation.renterName}...`}
                      className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-full text-xs font-semibold outline-none focus:border-slate-350 text-slate-800 placeholder:text-slate-400 shadow-sm"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={sendingMessage || !messageContent.trim()}
                      className="w-9 h-9 rounded-full bg-[#00a884] hover:bg-[#008f72] text-white flex items-center justify-center disabled:opacity-50 active:scale-95 transition-all shadow-sm shrink-0 cursor-pointer"
                    >
                      {sendingMessage ? (
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <SendHorizontal className="w-4.5 h-4.5 text-white" />
                      )}
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              // Empty State Splash
              <div className="flex-grow flex flex-col items-center justify-center p-8 text-center bg-slate-50/15">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4 ring-8 ring-blue-50/50">
                  <MessageSquare className="w-7 h-7 text-blue-600 fill-blue-50 stroke-2" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Renter Support Console</h3>
                <p className="text-sm text-slate-400 max-w-sm font-medium">
                  Select an active renter conversation from the sidebar list to review historical queries, address complaints, and message in real-time.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

export default RenterChatManagement
