import { useEffect, useState, useRef } from "react"
import { useSearchParams } from "react-router-dom"
import { billingService, messagingService, paymentService } from "../services/billingService"
import type { RenterDashboardData } from "../types/billing"
import LoadingSpinner from "../components/ui/LoadingSpinner"
import Card from "../components/ui/Card"
import Button from "../components/ui/Button"
import Badge from "../components/ui/Badge"

type TabType = 'dashboard' | 'history' | 'messages' | 'notifications' | 'bills'

const RenterMonthlyDashboard = () => {
  const [searchParams] = useSearchParams()
  const tabParam = searchParams.get('tab') as TabType || 'dashboard'
  
  const [data, setData] = useState<RenterDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>(tabParam)

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
    if (tabParam) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner size="xl" text="Loading dashboard..." />
      </div>
    )
  }

  // Allow the component to render even if there is no active booking,
  // so users can still see their Bill History.

  const { activeBooking = null, monthlyBill = null, messages = [], notifications = [] } = data || {}

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="p-4 sm:p-6 max-w-5xl mx-auto">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {activeBooking ? (
              <div className="space-y-6">
                <div className="mb-2">
                  <h1 className="text-xl font-black text-gray-900 tracking-tight">Summary</h1>
                  <p className="text-xs text-gray-400 font-medium">Monthly billing overview for {activeBooking.customerName.split(' ')[0]}</p>
                </div>

                {activeBooking.paymentStatus === 'PENDING' && (
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-3">
                    <svg className="w-5 h-5 text-orange-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <div>
                      <h3 className="text-sm font-bold text-orange-800">Waiting for admin verification</h3>
                      <p className="text-xs text-orange-700 mt-1">Your monthly rent booking has been recorded. The admin will verify your payment and confirm the booking shortly.</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4 border-none shadow-sm bg-white">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Unit Details</h3>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                      <div><p className="text-[10px] text-gray-400 font-bold uppercase">Room No.</p><p className="text-lg font-black text-blue-600">{activeBooking.room.roomNumber}</p></div>
                      <div><p className="text-[10px] text-gray-400 font-bold uppercase">Lvl</p><p className="text-lg font-black text-blue-600">Floor {activeBooking.room.floor}</p></div>
                      <div><p className="text-[10px] text-gray-400 font-bold uppercase">Class</p><Badge variant="info" size="sm">{activeBooking.room.roomType}</Badge></div>
                      <div><p className="text-[10px] text-gray-400 font-bold uppercase">Check-in</p><p className="text-xs font-bold text-gray-700">{new Date(activeBooking.checkInDate).toLocaleDateString()}</p></div>
                    </div>
                  </Card>
                  <Card className="p-4 border-none shadow-sm bg-white">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Financial Overview</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-medium">Monthly Rent</span>
                        <span className="font-bold text-gray-900">₹{activeBooking.monthlyRenter?.rentAmount?.toLocaleString() || monthlyBill?.rentAmount?.toLocaleString() || '0'}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-medium">Security Deposit</span>
                        <span className="font-bold text-gray-900">₹{activeBooking.monthlyRenter?.securityAmount?.toLocaleString() || '0'}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-medium">Next Due Date</span>
                        <span className="font-bold text-gray-900">{activeBooking.monthlyRenter?.nextDueDate ? new Date(activeBooking.monthlyRenter.nextDueDate).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-medium">Payment Status</span>
                        <Badge 
                          variant={activeBooking.paymentStatus === 'SUCCESS' ? 'success' : activeBooking.paymentStatus === 'PENDING' ? 'warning' : 'danger'} 
                          size="sm"
                        >
                          {activeBooking.paymentStatus}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                        <span className="text-xs text-gray-500 font-medium">Pending Dues</span>
                        <span className="text-xl font-black text-blue-600">₹{monthlyBill?.remainingAmount?.toLocaleString() || '0'}</span>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            ) : (
              <Card className="p-8 text-center max-w-md mx-auto shadow-sm border border-gray-100 bg-white mt-10">
                <h2 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">No Active Booking</h2>
                <p className="text-gray-500 text-sm">You don't have any active monthly bookings to show a summary for.</p>
              </Card>
            )}
          </div>
        )}

        {/* Current Bill Tab */}
        {activeTab === 'bills' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="mb-4">
              <h1 className="text-xl font-black text-gray-900 tracking-tight">Active Invoice</h1>
              <p className="text-xs text-gray-400 font-medium">Review and settle your current monthly dues</p>
            </div>
            {monthlyBill ? (
              <div className="space-y-4">
                <Card className="overflow-hidden border-none shadow-sm">
                  <div className="bg-slate-900 p-6 text-white">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-xl font-black tracking-tight">Monthly Statement</h2>
                        <p className="opacity-50 text-[10px] font-bold uppercase tracking-widest mt-1">
                          {new Date(monthlyBill.month + "-01").toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                      <Badge variant={monthlyBill.isPaid ? 'success' : (monthlyBill.status === 'VERIFICATION_PENDING' ? 'info' : 'warning')} size="sm">
                        {monthlyBill.isPaid ? "Paid" : (monthlyBill.status === 'VERIFICATION_PENDING' ? "Verifying" : "Pending")}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-6 bg-white grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                      <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-widest"><span>Line Item</span><span>Amount</span></div>
                      <div className="flex justify-between text-xs font-medium"><span>Unit Rent</span><span className="font-bold">₹{monthlyBill.rentAmount.toLocaleString()}</span></div>
                      <div className="flex justify-between text-xs font-medium"><span>Electricity Usage</span><span className="font-bold">₹{monthlyBill.electricityAmount.toLocaleString()}</span></div>
                      {monthlyBill.extraCharges > 0 && <div className="flex justify-between text-xs font-medium"><span>Maintenance</span><span className="font-bold">₹{monthlyBill.extraCharges.toLocaleString()}</span></div>}
                      <div className="flex justify-between text-xs text-red-400 pt-2 border-t border-gray-100"><span>Previous Carryover</span><span className="font-bold">₹{monthlyBill.previousDue.toLocaleString()}</span></div>
                      <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                        <span className="text-xs font-bold">Total Statement</span><span className="text-lg font-black text-blue-600">₹{monthlyBill.totalDue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs text-green-500"><span>Paid (Current)</span><span className="font-bold">₹{monthlyBill.paidAmount.toLocaleString()}</span></div>
                      <div className="flex justify-between text-xs text-red-600 font-bold pt-2 border-t border-gray-100"><span>Final Dues</span><span>₹{monthlyBill.remainingAmount.toLocaleString()}</span></div>
                    </div>
                    {!monthlyBill.isPaid && (
                      <div className="space-y-4">
                        <p className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">Settle Invoice</p>
                        <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                          <p className="text-[10px] text-blue-600 font-bold uppercase mb-0.5">Note</p>
                          <p className="text-[11px] text-blue-700 leading-relaxed">Please make payment via UPI or Cash, then select the method below to notify admin for verification.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {['UPI', 'CASH'].map(m => (
                            <button key={m} onClick={() => setPaymentMethod(m)} className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${paymentMethod === m ? 'border-blue-600 bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}>
                              <span className="text-base">{m === 'UPI' ? '⚡' : '🏠'}</span>
                              <span className="text-[10px] font-black uppercase">{m}</span>
                            </button>
                          ))}
                        </div>
                        <Button onClick={handlePayment} size="sm" className="w-full py-2.5 text-[10px] font-black uppercase tracking-widest shadow-sm" disabled={!paymentMethod || processingPayment}>Alert Admin for Verification</Button>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            ) : (
              <Card className="p-20 text-center border-none shadow-sm bg-white"><p className="text-gray-400 font-black text-xs uppercase tracking-widest">No active statements found.</p></Card>
            )}
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="h-[calc(100vh-140px)] flex flex-col animate-in fade-in duration-500">
            <div className="mb-4">
              <h1 className="text-xl font-black text-gray-900 tracking-tight">Support</h1>
              <p className="text-xs text-gray-400 font-medium">Direct communication with property management</p>
            </div>
            {!activeBooking ? (
              <Card className="p-8 text-center max-w-md mx-auto shadow-sm border border-gray-100 bg-white mt-10">
                <h2 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">No Active Booking</h2>
                <p className="text-gray-500 text-sm">Messaging is only available for active monthly bookings.</p>
              </Card>
            ) : (
              <Card className="flex-1 flex flex-col overflow-hidden border-none shadow-sm p-0 bg-white">
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                  {messages.length === 0 ? (<p className="text-center text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-10">No message history.</p>) : (
                    messages.map((msg: any) => (
                      <div key={msg.id} className={`flex ${msg.senderId === activeBooking.userId ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${msg.senderId === activeBooking.userId ? "bg-blue-600 text-white rounded-tr-none" : "bg-white text-gray-800 rounded-tl-none border border-gray-100"}`}>
                          <p className="text-[11px] leading-relaxed font-medium">{msg.content}</p>
                          <div className="flex items-center justify-end gap-1 mt-1 opacity-50">
                            <span className="text-[9px] font-bold">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div className="p-3 bg-white border-t flex gap-2">
                  <input value={messageContent} onChange={(e) => setMessageContent(e.target.value)} placeholder="Type your message..." className="flex-1 bg-slate-50 px-4 py-2 text-xs rounded-xl outline-none focus:ring-1 focus:ring-blue-600 font-medium" onKeyPress={e => e.key === 'Enter' && handleSendMessage()} />
                  <button onClick={handleSendMessage} disabled={!messageContent.trim() || sendingMessage} className="bg-blue-600 text-white p-2 rounded-xl shadow-md active:scale-95 transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg></button>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Bill History Tab */}
        {activeTab === 'history' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="mb-4">
              <h1 className="text-xl font-black text-gray-900 tracking-tight">Ledger</h1>
              <p className="text-xs text-gray-400 font-medium">Historical records of your monthly payments</p>
            </div>
            <div className="grid gap-3">
              {loadingHistory ? (<div className="p-10 text-center"><LoadingSpinner text="Fetching..." /></div>) : (
                allBills.map(bill => (
                  <Card key={bill.id} className="p-3 px-4 flex items-center justify-between hover:bg-white transition-colors shadow-sm border-none bg-white/50">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black ${bill.isPaid ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>{new Date(bill.month + "-01").toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</div>
                      <div>
                        <p className="text-xs font-black text-gray-900">{new Date(bill.month + "-01").toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{bill.paidDate ? `Settled ${new Date(bill.paidDate).toLocaleDateString()}` : 'Payment Pending'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-blue-600">₹{bill.totalAmount.toLocaleString()}</p>
                      <Badge variant={bill.isPaid ? 'success' : 'warning'} size="sm" className="text-[8px] px-1.5 font-black uppercase">{bill.isPaid ? 'Settled' : 'Unpaid'}</Badge>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="mb-4">
              <h1 className="text-xl font-black text-gray-900 tracking-tight">Alerts</h1>
              <p className="text-xs text-gray-400 font-medium">Important updates regarding your stay and billing</p>
            </div>
            <div className="space-y-3">
              {notifications.length === 0 ? (<p className="text-gray-300 text-center py-20 text-[10px] font-bold uppercase tracking-widest">Inbox Clean</p>) : (
                notifications.map(n => (
                  <Card key={n.id} className="p-4 border-l-4 border-blue-600 bg-white shadow-sm border-none">
                    <p className="text-xs font-black text-gray-900 tracking-tight">{n.title}</p>
                    <p className="text-[11px] text-gray-500 mt-1 leading-relaxed font-medium">{n.message}</p>
                    <p className="text-[9px] text-gray-400 font-bold mt-3 uppercase tracking-wider">{new Date(n.createdAt).toLocaleDateString()}</p>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Payment Processing Overlay */}
      {(paymentStatus === 'processing' || paymentStatus === 'success') && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-md">
          <Card className="p-10 text-center max-w-sm w-full shadow-2xl border-none bg-white">
            {paymentStatus === 'processing' ? (
              <div className="space-y-6">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Verifying Statement...</h3>
              </div>
            ) : (
              <div className="space-y-4 animate-in zoom-in duration-300">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-200">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-2xl font-black text-green-600 tracking-tight">Success!</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Payment alerted to Admin</p>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}

export default RenterMonthlyDashboard
