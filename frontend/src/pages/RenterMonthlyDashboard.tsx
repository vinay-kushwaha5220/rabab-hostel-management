import { useEffect, useState, useRef } from "react"
import { billingService, messagingService, paymentService } from "../services/billingService"
import type { RenterDashboardData } from "../types/billing"
import LoadingSpinner from "../components/ui/LoadingSpinner"
import Card from "../components/ui/Card"
import Button from "../components/ui/Button"
import Badge from "../components/ui/Badge"

type TabType = 'dashboard' | 'history' | 'messages' | 'notifications' | 'bills'

const RenterMonthlyDashboard = () => {
  const [data, setData] = useState<RenterDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const [messageContent, setMessageContent] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success'>('idle')
  const [paymentMethod, setPaymentMethod] = useState("")
  const [allBills, setAllBills] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    if (activeTab === 'messages' && data?.messages && data.messages.length > 0) {
      setTimeout(scrollToBottom, 100)
    }
  }, [data?.messages, activeTab])

  useEffect(() => {
    fetchDashboardData()
    fetchBillHistory()
  }, [])

  const fetchBillHistory = async () => {
    try {
      setLoadingHistory(true)
      const bills = await billingService.getRenterBills()
      setAllBills(bills)
    } catch (error) {
      console.error("❌ Error fetching bill history:", error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const dashboardData = await billingService.getRenterDashboard()
      // Sort messages oldest to newest for display
      const sortedMessages = [...(dashboardData.messages || [])].reverse()
      setData({ ...dashboardData, messages: sortedMessages })
    } catch (error: any) {
      console.error("❌ Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!messageContent.trim() || !data?.activeBooking) return
    try {
      setSendingMessage(true)
      const adminId = 1
      await messagingService.sendMessage({
        bookingId: data.activeBooking.id,
        receiverId: adminId,
        content: messageContent,
      })
      setMessageContent("")
      await fetchDashboardData()
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setSendingMessage(false)
    }
  }

  const handlePayment = async () => {
    if (!paymentMethod || !data?.monthlyBill) return
    try {
      setProcessingPayment(true)
      setPaymentStatus('processing')
      await paymentService.processMonthlyPayment({
        billId: data.monthlyBill.id,
        paymentMethod,
      })
      setPaymentStatus('success')
      await new Promise(resolve => setTimeout(resolve, 1500))
      setPaymentMethod("")
      setPaymentStatus('idle')
      await fetchDashboardData()
      await fetchBillHistory()
    } catch (error) {
      console.error("Error processing payment:", error)
      setPaymentStatus('idle')
    } finally {
      setProcessingPayment(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Loading dashboard..." />
      </div>
    )
  }

  if (!data?.activeBooking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md shadow-xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Active Booking</h2>
          <p className="text-gray-600">You don't have any active monthly bookings.</p>
        </Card>
      </div>
    )
  }

  const { activeBooking, monthlyBill, messages, notifications } = data

  const menuItems = [
    {
      id: 'dashboard', name: 'Dashboard', icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
      )
    },
    {
      id: 'bills', name: 'Current Bill', icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
      )
    },
    {
      id: 'messages', name: 'Messages', icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
      )
    },
    {
      id: 'history', name: 'Bill History', icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      )
    },
    {
      id: 'notifications', name: 'Notifications', icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
      )
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 fixed h-full z-20">
        <div className="p-6">
          <h2 className="text-2xl font-black text-blue-700">Rabab Stay</h2>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Renter Dashboard</p>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as TabType)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === item.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-[1.02]'
                  : 'text-gray-500 hover:bg-gray-100'
                }`}
            >
              {item.icon}
              {item.name}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <div className="bg-blue-50 p-4 rounded-2xl">
            <p className="text-xs text-blue-600 font-bold mb-1">Room {activeBooking.room.roomNumber}</p>
            <p className="text-sm font-black text-blue-900">{activeBooking.customerName}</p>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <div className={`lg:hidden fixed inset-0 z-[60] transition-opacity duration-300 ${isSidebarOpen ? 'bg-black/50 opacity-100' : 'bg-transparent opacity-0 pointer-events-none'}`} onClick={() => setIsSidebarOpen(false)}>
        <aside className={`fixed top-0 left-0 bottom-0 w-72 bg-white transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} onClick={e => e.stopPropagation()}>
          <div className="p-6 flex justify-between items-center border-b">
            <h2 className="text-xl font-black text-blue-700">Rabab Stay</h2>
            <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-gray-500"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l18 18" /></svg></button>
          </div>
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id as TabType); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${activeTab === item.id ? 'bg-blue-600 text-white' : 'text-gray-500'
                  }`}
              >
                {item.icon}
                {item.name}
              </button>
            ))}
          </nav>
        </aside>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64 min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b p-4 flex justify-between items-center sticky top-0 z-40">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-gray-100 rounded-lg text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <span className="font-black text-blue-700">Rabab Stay</span>
          <div className="w-10"></div>
        </header>

        <div className="p-4 sm:p-8 max-w-5xl mx-auto">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h1 className="text-3xl font-black text-gray-900">Welcome Back!</h1>
                  <p className="text-gray-500 font-medium">Here's what's happening with your stay.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 border-none shadow-xl bg-gradient-to-br from-white to-blue-50">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Room Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-xs text-gray-400 font-bold uppercase">Room</p><p className="text-xl font-black text-blue-800">{activeBooking.room.roomNumber}</p></div>
                    <div><p className="text-xs text-gray-400 font-bold uppercase">Floor</p><p className="text-xl font-black text-blue-800">{activeBooking.room.floor}</p></div>
                    <div><p className="text-xs text-gray-400 font-bold uppercase">Type</p><Badge variant="info">{activeBooking.room.roomType}</Badge></div>
                    <div><p className="text-xs text-gray-400 font-bold uppercase">Check-in</p><p className="text-sm font-bold text-gray-700">{new Date(activeBooking.checkInDate).toLocaleDateString()}</p></div>
                  </div>
                </Card>
                <Card className="p-6 border-none shadow-xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white">
                  <h3 className="text-lg font-bold opacity-80 mb-4">Account Summary</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Total Unpaid</span>
                      <span className="text-3xl font-black">₹{monthlyBill?.isPaid ? '0' : monthlyBill?.totalAmount.toLocaleString() || '0'}</span>
                    </div>
                    <div className="pt-4 border-t border-white/20">
                      <Button onClick={() => setActiveTab('bills')} className="w-full bg-white text-blue-700 hover:bg-blue-50 font-black">View Current Bill</Button>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Current Bill Tab */}
          {activeTab === 'bills' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {monthlyBill ? (
                <div className="space-y-6">
                  <Card className="overflow-hidden border-none shadow-2xl">
                    <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-8 text-white">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h2 className="text-3xl font-black">Monthly Bill</h2>
                          <p className="opacity-80 text-lg">{new Date(monthlyBill.month + "-01").toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                        </div>
                        <Badge variant={monthlyBill.isPaid ? 'success' : (monthlyBill.status === 'VERIFICATION_PENDING' ? 'info' : 'warning')}>
                          {monthlyBill.isPaid ? "Paid" : (monthlyBill.status === 'VERIFICATION_PENDING' ? "Verifying..." : "Pending")}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-[10px] font-black uppercase tracking-widest mt-4">
                        <div className="flex items-center gap-2 text-green-300">
                          <div className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]"></div>
                          Bill Generated
                        </div>

                        <div className="w-8 h-px bg-white/20"></div>

                        <div className={`flex items-center gap-2 ${monthlyBill.isPaid ? 'text-green-300' : 'text-orange-300'}`}>
                          <div className={`w-2.5 h-2.5 rounded-full ${monthlyBill.isPaid
                              ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]'
                              : 'bg-orange-400 animate-pulse shadow-[0_0_8px_rgba(251,146,60,0.6)]'
                            }`}></div>
                          {monthlyBill.isPaid ? "Payment Received" : "Payment Pending"}
                        </div>

                        <div className="w-8 h-px bg-white/20"></div>

                        <div className={`flex items-center gap-2 ${monthlyBill.isPaid ? 'text-green-300' : 'text-white/30'}`}>
                          <div className={`w-2.5 h-2.5 rounded-full ${monthlyBill.isPaid
                              ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]'
                              : 'bg-white/20'
                            }`}></div>
                          Verified
                        </div>
                      </div>
                    </div>
                    <div className="p-6 sm:p-8 bg-white grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="bg-gray-50 p-6 rounded-3xl space-y-4">
                        <div className="flex justify-between"><span>Base Rent</span><span className="font-black">₹{monthlyBill.rentAmount.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>Electricity</span><span className="font-black">₹{monthlyBill.electricityAmount.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>Others</span><span className="font-black">₹{monthlyBill.extraCharges.toLocaleString()}</span></div>
                        <div className="pt-4 border-t-2 border-dashed border-gray-200 flex justify-between items-center text-xl font-black">
                          <span>Total</span><span className="text-3xl text-blue-700 font-mono">₹{monthlyBill.totalAmount.toLocaleString()}</span>
                        </div>
                      </div>
                      {!monthlyBill.isPaid && (
                        <div className="space-y-4">
                          <p className="font-black text-gray-900">Choose Method</p>
                          <div className="space-y-2">
                            {['UPI', 'CARD', 'CASH'].map(m => (
                              <button key={m} onClick={() => setPaymentMethod(m)} className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${paymentMethod === m ? 'border-blue-600 bg-blue-50 shadow-md scale-[1.02]' : 'border-gray-100 hover:border-blue-200'}`}>
                                <span className="capitalize font-bold">{m === 'UPI' ? '⚡ UPI / GPay' : m === 'CARD' ? '💳 Card' : '🏠 Cash at Office'}</span>
                                {paymentMethod === m && <div className="w-3 h-3 bg-blue-600 rounded-full"></div>}
                              </button>
                            ))}
                          </div>
                          <Button onClick={handlePayment} className="w-full py-5 text-xl bg-blue-600 font-black rounded-2xl" disabled={!paymentMethod || processingPayment}>Pay Now</Button>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              ) : (
                <Card className="p-20 text-center shadow-xl"><p className="text-gray-400 font-black">No current bills found.</p></Card>
              )}
            </div>
          )}

          {/* Messages Tab */}
          {activeTab === 'messages' && (
            <div className="h-[calc(100vh-160px)] flex flex-col animate-in fade-in duration-500">
              <Card className="flex-1 flex flex-col overflow-hidden border-none shadow-2xl p-0">
                <div className="p-6 bg-white border-b flex items-center justify-between">
                  <h2 className="text-2xl font-black text-gray-900">Chat with Admin</h2>
                  <Badge variant="info">Online</Badge>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {messages.length === 0 ? (<p className="text-center text-gray-400 mt-20">No messages yet.</p>) : (
                    messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.senderId === activeBooking.userId ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] p-4 rounded-3xl shadow-sm ${msg.senderId === activeBooking.userId ? "bg-blue-600 text-white rounded-tr-none" : "bg-white text-gray-800 rounded-tl-none border"}`}>
                          <p className="text-sm font-black mb-1 opacity-70">{msg.senderId === activeBooking.userId ? "You" : "Admin"}</p>
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                          <div className="flex items-center justify-end gap-1 mt-2 opacity-50">
                            <span className="text-[10px] font-bold">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {msg.senderId === activeBooking.userId && (
                              <svg className={`w-3 h-3 ${msg.isRead ? 'text-blue-200' : 'text-gray-300'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" />{msg.isRead && <polyline points="15 6 9 12 12 15" className="translate-x-3 -translate-y-3" />}</svg>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div className="p-4 bg-white border-t flex gap-2">
                  <input value={messageContent} onChange={(e) => setMessageContent(e.target.value)} placeholder="Send a message..." className="flex-1 bg-gray-100 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600" onKeyPress={e => e.key === 'Enter' && handleSendMessage()} />
                  <button onClick={handleSendMessage} disabled={!messageContent.trim() || sendingMessage} className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg></button>
                </div>
              </Card>
            </div>
          )}

          {/* Bill History Tab */}
          {activeTab === 'history' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-black mb-6">Payment History</h2>
              <div className="grid gap-4">
                {loadingHistory ? (<div className="p-10 text-center"><LoadingSpinner text="Fetching History..." /></div>) : (
                  allBills.map(bill => (
                    <Card key={bill.id} className="p-5 flex items-center justify-between hover:scale-[1.01] transition-transform">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${bill.isPaid ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>{new Date(bill.month + "-01").toLocaleDateString('en-US', { month: 'short' })}</div>
                        <div><p className="font-black text-gray-900">{new Date(bill.month + "-01").toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p><p className="text-xs text-gray-400 font-bold">Paid on {bill.paidDate ? new Date(bill.paidDate).toLocaleDateString() : 'Pending'}</p></div>
                      </div>
                      <div className="text-right"><p className="text-lg font-black text-blue-700">₹{bill.totalAmount.toLocaleString()}</p><Badge variant={bill.isPaid ? 'success' : 'warning'}>{bill.isPaid ? 'Cleared' : 'Pending'}</Badge></div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-black mb-6 text-gray-900">Recent Notifications</h2>
              <div className="space-y-4">
                {notifications.length === 0 ? (<p className="text-gray-400 text-center py-20 font-black">No alerts yet.</p>) : (
                  notifications.map(n => (
                    <Card key={n.id} className="p-6 border-l-4 border-blue-600 bg-white">
                      <p className="text-sm font-black text-gray-900">{n.title}</p>
                      <p className="text-sm text-gray-500 mt-1">{n.message}</p>
                      <p className="text-[10px] text-gray-400 font-bold mt-4 uppercase">{new Date(n.createdAt).toLocaleString()}</p>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Payment Processing Overlay */}
      {(paymentStatus === 'processing' || paymentStatus === 'success') && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/80 backdrop-blur-md">
          <Card className="p-10 text-center max-w-sm w-full shadow-2xl border-none">
            {paymentStatus === 'processing' ? (
              <div className="space-y-6">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <h3 className="text-xl font-black text-gray-900">Verifying Payment...</h3>
              </div>
            ) : (
              <div className="space-y-4 animate-in zoom-in duration-300">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-200">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-2xl font-black text-green-600">Success!</h3>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}

export default RenterMonthlyDashboard
