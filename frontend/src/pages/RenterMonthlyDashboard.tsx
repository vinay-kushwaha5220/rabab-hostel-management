import { useEffect, useState, useRef, useMemo } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContextV2"
import { billingService, paymentService, messagingService } from "../services/billingService"
import type { MonthlyBill, Message } from "../types/billing"
import Badge from "../components/ui/Badge"
import Card from "../components/ui/Card"
import Button from "../components/ui/Button"
import LoadingSpinner from "../components/ui/LoadingSpinner"

type TabType = 'dashboard' | 'bills' | 'history' | 'messages' | 'notifications'

const RenterMonthlyDashboard = () => {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  
  // URL Tab parsing — memoized so it doesn't change reference on every render
  const activeTab = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return (params.get('tab') || 'dashboard') as TabType
  }, [location.search])

  // Data states
  const [loading, setLoading] = useState(true)
  const [activeBooking, setActiveBooking] = useState<any>(null)
  const [monthlyBill, setMonthlyBill] = useState<MonthlyBill | null>(null)
  const [billsHistory, setBillsHistory] = useState<MonthlyBill[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  
  // Interactive Payment states
  const [payMethod, setPayMethod] = useState<'UPI' | 'CASH' | 'RAZORPAY'>('RAZORPAY')
  const [utrNumber, setUtrNumber] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')
  const [payingLoading, setPayingLoading] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState('')

  // Support Chat states
  const [chatMessage, setChatMessage] = useState("")
  const [sendingChat, setSendingChat] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  // Guard: track whether billing history has already been fetched to prevent repeated calls
  const hasFetchedHistory = useRef(false)
  // Guard: prevent concurrent duplicate dashboard fetches
  const isFetchingDashboard = useRef(false)

  // Feedback states
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    fetchDashboardData()
  }, [])

  useEffect(() => {
    if (activeBooking?.id && activeTab === 'messages') {
      fetchConversation()
      
      // Auto-poll messages every 4 seconds to simulate real-time chat
      const interval = setInterval(fetchConversation, 4000)
      return () => clearInterval(interval)
    }
  }, [activeBooking?.id, activeTab])

  useEffect(() => {
    // Only fetch history once when tab is first opened — guard prevents repeat fetches
    if (activeTab === 'history' && !hasFetchedHistory.current) {
      hasFetchedHistory.current = true
      fetchHistory()
    }
  }, [activeTab])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchDashboardData = async () => {
    // Prevent concurrent duplicate fetches
    if (isFetchingDashboard.current) return
    isFetchingDashboard.current = true
    try {
      setLoading(true)
      const data = await billingService.getRenterDashboard()
      
      setActiveBooking(data.activeBooking)
      setMonthlyBill(data.monthlyBill)
      setNotifications(data.notifications || [])
      
      // If we have messages in dashboard payload, pre-load them
      // IMPORTANT: Use spread [...] to avoid mutating the original array with .reverse()
      if (data.messages && Array.isArray(data.messages)) {
        setMessages([...data.messages].reverse())
      }
      
      setError("")
    } catch (err: any) {
      console.error("Failed to load dashboard data:", err)
      setError("Unable to sync active staying and cycle details.")
    } finally {
      setLoading(false)
      isFetchingDashboard.current = false
    }
  }

  const fetchHistory = async () => {
    try {
      const data = await billingService.getRenterBills()
      setBillsHistory(data)
    } catch (err) {
      console.error("Failed to fetch billing history:", err)
    }
  }

  const fetchConversation = async () => {
    if (!activeBooking) return
    try {
      const chatLogs = await messagingService.getConversation(activeBooking.id)
      setMessages(chatLogs)
    } catch (err) {
      console.error("Failed to fetch chat logs:", err)
    }
  }

  const handleSendSupportMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatMessage.trim() || !activeBooking) return

    try {
      setSendingChat(true)
      const textToSend = chatMessage.trim()
      setChatMessage("")
      
      await messagingService.sendMessage({
        bookingId: activeBooking.id,
        receiverId: 1, // Will be auto-resolved to admin on backend safely
        content: textToSend
      })

      await fetchConversation()
    } catch (err) {
      console.error("Failed to send support message:", err)
      setError("Failed to deliver message. Please retry.")
    } finally {
      setSendingChat(false)
    }
  }

  const handleRequestContinueStay = async () => {
    try {
      setLoading(true)
      setError("")
      setSuccess("")
      const res = await billingService.requestContinueStay()
      setSuccess(res.message || "Stay renewal request submitted. Waiting for admin approval.")
      await fetchDashboardData()
    } catch (err: any) {
      console.error("Failed to request continue stay:", err)
      setError(err.response?.data?.message || "Failed to submit stay continuation request.")
    } finally {
      setLoading(false)
    }
  }

  const handleRequestCheckout = async () => {
    try {
      setLoading(true)
      setError("")
      setSuccess("")
      const res = await billingService.requestCheckoutNew()
      setSuccess(res.message || "Checkout request submitted. Awaiting admin approval.")
      await fetchDashboardData()
    } catch (err: any) {
      console.error("Failed to request checkout:", err)
      setError(err.response?.data?.message || "Failed to submit checkout request.")
    } finally {
      setLoading(false)
    }
  }

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true)
        return
      }
      const script = document.createElement("script")
      script.src = "https://checkout.razorpay.com/v1/checkout.js"
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handleProcessPayment = async () => {
    if (!monthlyBill) return

    // RAZORPAY SECURE PAYMENT FLOW
    if (payMethod === 'RAZORPAY') {
      try {
        setPayingLoading(true)
        setPaymentSuccess("")
        setError("")

        // 1. Load Razorpay script
        const isScriptLoaded = await loadRazorpayScript()
        if (!isScriptLoaded) {
          setError("Failed to load online payment gateway. Please check your internet connection.")
          setPayingLoading(false)
          return
        }

        // 2. Create online payment order on backend
        const orderData = await paymentService.createRazorpayOrder({
          billId: monthlyBill.id
        })

        const { orderId, amount, currency, keyId } = orderData

        // 3. Launch Checkout Gateway modal
        const options = {
          key: keyId,
          amount: amount,
          currency: currency,
          name: "Rabab Stay",
          description: `Rent Invoice Settle — ${monthlyBill.month}`,
          image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=200",
          order_id: orderId,
          handler: async function (response: any) {
            try {
              setPayingLoading(true)
              setError("")
              setPaymentSuccess("")

              // 4. Secure verification request on backend
              await paymentService.verifyRazorpayPayment({
                billId: monthlyBill.id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })

              setPaymentSuccess(`🎉 Online payment of ₹${(amount / 100).toLocaleString()} successfully processed and verified! Your stay is now active.`)
              
              // Re-fetch dashboard data
              await fetchDashboardData()
              await fetchHistory()
            } catch (err: any) {
              setError(err.response?.data?.message || "Failed to verify transaction signature securely.")
            } finally {
              setPayingLoading(false)
            }
          },
          prefill: {
            name: activeBooking.customerName || user?.name || "",
            email: activeBooking.customerEmail || user?.email || "",
            contact: activeBooking.customerPhone || user?.phone || "",
          },
          notes: {
            billId: String(monthlyBill.id)
          },
          theme: {
            color: "#1e293b" // Premium slate matching the portal dashboard theme
          },
          modal: {
            ondismiss: function () {
              setPayingLoading(false)
            }
          }
        }

        const rzp = new (window as any).Razorpay(options)
        rzp.open()
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to initialize online transaction.")
        setPayingLoading(false)
      }
      return
    }

    // ORIGINAL CASH/UPI FLOW
    try {
      setPayingLoading(true)
      setPaymentSuccess("")
      setError("")

      await paymentService.processMonthlyPayment({
        billId: monthlyBill.id,
        paymentMethod: payMethod === 'UPI' ? 'upi' : 'cash'
      })

      if (payMethod === 'UPI') {
        setPaymentSuccess("⏳ UPI payment notification submitted! Please wait for the admin to verify references and approve your stay continuation.")
      } else {
        setPaymentSuccess("⏳ Cash payment notification submitted! Please handover ₹" + monthlyBill.remainingAmount.toLocaleString() + " to the administration for verification & approval.")
      }

      setUtrNumber("")
      setPaymentNotes("")
      
      // Re-fetch dashboard data
      await fetchDashboardData()
      await fetchHistory()
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to notify payment.")
    } finally {
      setPayingLoading(false)
    }
  }

  const formatDate = (dateStr: any) => {
    if (!dateStr) return "N/A"
    return new Date(dateStr).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
  }

  const getRenterBadgeVariant = (status?: string) => {
    switch (status) {
      case "ACTIVE": return "success"
      case "DUE_SOON": return "warning"
      case "EXPIRES_TODAY": return "warning"
      case "PENDING_PAYMENT": return "warning"
      case "OVERDUE": return "danger"
      case "EXPIRED": return "danger"
      case "CONTINUE_REQUESTED": return "warning"
      case "CHECKOUT_REQUESTED": return "secondary"
      case "CHECKED_OUT": return "secondary"
      default: return "primary"
    }
  }

  const switchTab = (tab: TabType) => {
    navigate(`/renter-monthly-dashboard?tab=${tab}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Syncing staying cycles & statements..." />
      </div>
    )
  }

  // Handle scenario where guest has no active contract or has already checked out
  if (!activeBooking) {
    return (
      <div className="min-h-screen bg-slate-50/50 p-6 flex items-center justify-center">
        <Card className="max-w-md w-full p-8 text-center bg-white shadow-xl border border-slate-100 rounded-3xl">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border-l-4 border-rose-600 rounded-xl text-left text-xs font-semibold text-rose-700">
              ⚠️ {error}
            </div>
          )}
          <span className="text-5xl">🏨</span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mt-5">No Active Monthly Stay Found</h2>
          <p className="text-xs text-slate-500 font-medium leading-relaxed mt-2.5 max-w-sm mx-auto">
            You do not currently hold an active, checked-in monthly hostel contract. Book a hostel room or coordinate with our administrative managers.
          </p>
          <div className="mt-8 flex gap-3 justify-center">
            <Button onClick={() => navigate("/rooms")} size="sm" className="font-bold tracking-widest text-[9px] uppercase">
              Explore Rooms
            </Button>
            <Button onClick={() => navigate("/dashboard")} variant="outline" size="sm" className="font-bold tracking-widest text-[9px] uppercase">
              Back to Overview
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const renterProfile = activeBooking.monthlyRenter
  
  // Calculate dynamic stay status based on strictly start and end dates (Bug #3)
  const getDynamicStayStatus = () => {
    let status = renterProfile?.status || activeBooking.stayStatus || "ACTIVE"
    if (renterProfile?.currentCycleEnd) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const cycleEnd = new Date(renterProfile.currentCycleEnd)
      cycleEnd.setHours(0, 0, 0, 0)
      
      // Check if latest monthly bill is unpaid
      const hasUnpaid = monthlyBill && !monthlyBill.isPaid
      
      if (cycleEnd < today && hasUnpaid) {
        return "EXPIRED"
      } else if (!hasUnpaid && status !== "CHECKED_OUT") {
        return "ACTIVE"
      }
    }
    return status
  }
  
  const stayStatus = getDynamicStayStatus()

  // Pre-calculations for dashboard overview tab (Total, Current, and Old pays with Time Safe Expiration countdown)
  
  // Current month paid amount
  const currentMonthPaid = monthlyBill?.paidAmount || 0
  const currentMonthLabel = monthlyBill?.month || 'Current Month'

  // Last month paid amount (most recent paid bill that is NOT the current bill)
  const oldPaidBills = billsHistory.filter(b => b.isPaid && b.id !== monthlyBill?.id)
  const lastMonthBill = oldPaidBills.length > 0 ? oldPaidBills[0] : null
  const lastMonthPaid = lastMonthBill?.paidAmount || 0
  const lastMonthLabel = lastMonthBill?.month || 'Last Month'

  // Combined total of last month + current month
  const recentTwoMonthsTotal = lastMonthPaid + currentMonthPaid

  const calculateDaysLeft = () => {
    if (!renterProfile?.currentCycleEnd) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const end = new Date(renterProfile.currentCycleEnd)
    end.setHours(0, 0, 0, 0)
    const diffTime = end.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }
  const daysLeft = calculateDaysLeft()

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">

        {/* Hero Top Title Banner */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-blue-400 hover:text-blue-300 font-semibold uppercase tracking-wider text-[9px] mb-2 block"
            >
              ← Back to Portal Overview
            </button>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2 text-white">
              <span>🏠</span> Resident Monthly Cycle Hub
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1">
              Unit {activeBooking.room?.roomNumber || "N/A"} — {activeBooking.room?.title}
            </p>
          </div>
          <div className="flex items-center gap-2 relative z-10 self-start md:self-center">
            <Badge variant={getRenterBadgeVariant(stayStatus)} size="md" className="font-bold text-[9px] tracking-wider uppercase px-3 py-1">
              Stay Status: {stayStatus.replace('_', ' ')}
            </Badge>
          </div>
          {/* Subtle design element */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-blue-600/10 to-transparent pointer-events-none" />
        </div>

        {/* Global Dues Notifications */}
        {error && (
          <div className="mb-4 p-4 bg-rose-50 border-l-4 border-rose-600 rounded-xl text-xs font-semibold text-rose-700">
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-emerald-50 border-l-4 border-emerald-600 rounded-xl text-xs font-semibold text-emerald-800">
            ✅ {success}
          </div>
        )}

        {/* Tab Selection */}
        <div className="bg-slate-100 p-1.5 rounded-2xl mb-6 shadow-inner flex gap-1.5 overflow-x-auto scrollbar-hide scrollbar-none snap-x snap-mandatory sticky top-0 z-30 backdrop-blur-md bg-opacity-80">
          {[
            { id: 'dashboard', label: 'Summary', icon: '📊' },
            { id: 'bills', label: 'Current Statement', icon: '🧾' },
            { id: 'history', label: 'Ledger History', icon: '⏳' },
            { id: 'messages', label: 'Support Messenger', icon: '💬' },
            { id: 'notifications', label: 'Notifications', icon: '🔔' },
          ].map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => switchTab(item.id as TabType)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 snap-center whitespace-nowrap ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md scale-[1.02] transform shadow-blue-100/50' 
                    : 'text-slate-500 hover:bg-white hover:text-slate-800'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
                {item.id === 'notifications' && notifications.length > 0 && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Main Full-Width Content Container */}
        <div className="w-full">
            
            {/* PANEL 1: Summary Overview Tab */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                
                {/* PROFESSIONAL STAY RENEWAL & CHECKOUT ACTION CENTER */}
                {['DUE_SOON', 'EXPIRES_TODAY', 'PAYMENT_PENDING', 'OVERDUE', 'EXPIRED', 'CONTINUE_REQUESTED', 'CHECKOUT_REQUESTED'].includes(stayStatus) && (
                  <Card className="p-6 border-l-4 border-l-blue-600 bg-white shadow-sm rounded-2xl animate-in slide-in-from-top-4 duration-300">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <span className="text-3xl flex-shrink-0">
                          {stayStatus === 'CONTINUE_REQUESTED' ? '📋' : stayStatus === 'CHECKOUT_REQUESTED' ? '🚪' : '⚠️'}
                        </span>
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                            {stayStatus === 'CONTINUE_REQUESTED' && 'Continue Stay Request Pending'}
                            {stayStatus === 'CHECKOUT_REQUESTED' && 'Checkout Request Pending'}
                            {['PAYMENT_PENDING', 'OVERDUE', 'EXPIRED'].includes(stayStatus) && 'Your Monthly Stay Has Expired'}
                            {['DUE_SOON', 'EXPIRES_TODAY'].includes(stayStatus) && 'Stay Cycle Expiring Soon'}
                          </h3>
                          <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1 max-w-xl">
                            {stayStatus === 'CONTINUE_REQUESTED' && 'Your request to continue your stay is awaiting administrative approval. A new statement will be generated once approved.'}
                            {stayStatus === 'CHECKOUT_REQUESTED' && 'Your request to checkout is awaiting administrative approval. Please coordinate with the hostel manager for inspection.'}
                            {['PAYMENT_PENDING', 'OVERDUE', 'EXPIRED'].includes(stayStatus) && 'Your monthly hostel stay has officially expired. Please decide below if you want to request stay continuation or submit a checkout request.'}
                            {['DUE_SOON', 'EXPIRES_TODAY'].includes(stayStatus) && 'Your current monthly hostel stay cycle is nearing its end. You can request stay continuation or checkout early.'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Dynamic Action Buttons or Badges based on status */}
                      <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                        {['DUE_SOON', 'EXPIRES_TODAY', 'PAYMENT_PENDING', 'OVERDUE', 'EXPIRED'].includes(stayStatus) && (
                          <>
                            <Button
                              onClick={handleRequestContinueStay}
                              size="sm"
                              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[9px] uppercase tracking-widest px-4 py-2"
                            >
                              Continue Stay
                            </Button>
                            <Button
                              onClick={handleRequestCheckout}
                              variant="outline"
                              size="sm"
                              className="border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-[9px] uppercase tracking-widest px-4 py-2"
                            >
                              Request Checkout
                            </Button>
                          </>
                        )}

                        {stayStatus === 'CONTINUE_REQUESTED' && (
                          <Badge variant="warning" size="md" className="font-extrabold text-[9px] uppercase tracking-wider py-1 px-3">
                            Waiting for Admin Approval
                          </Badge>
                        )}

                        {stayStatus === 'CHECKOUT_REQUESTED' && (
                          <Badge variant="secondary" size="md" className="font-extrabold text-[9px] uppercase tracking-wider py-1 px-3">
                            Waiting for Admin Approval
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                )}
                
                {/* Dynamic Premium Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Card 1: Expiry Countdown (\"Time Safe Expiry\") */}
                  <Card className="p-5 shadow-sm border border-slate-100 bg-white rounded-2xl flex flex-col justify-between hover:shadow-md transition-all duration-300 relative overflow-hidden group">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Stay Expiry Countdown</span>
                        {monthlyBill?.month && (
                          <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                            {monthlyBill.month}
                          </span>
                        )}
                      </div>
                      
                      {daysLeft !== null ? (
                        <div className="mt-3 flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-full flex flex-col items-center justify-center border-4 ${
                            daysLeft > 10 
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                              : daysLeft >= 0 
                                ? 'border-amber-500 bg-amber-50 text-amber-700' 
                                : 'border-rose-500 bg-rose-50 text-rose-700'
                          }`}>
                            <span className="text-sm font-extrabold leading-none">{Math.abs(daysLeft)}</span>
                            <span className="text-[7px] font-bold uppercase">{daysLeft >= 0 ? 'Days' : 'Over'}</span>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-800 tracking-tight">
                              {daysLeft > 10 
                                ? 'Time Safe & Active' 
                                : daysLeft >= 0 
                                  ? 'Renewal Due Soon' 
                                  : 'Stay Has Expired'}
                            </h4>
                            <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">
                              {daysLeft >= 0 ? 'Days Left in current cycle' : 'Days overdue stay'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                          No cycle dates configured
                        </div>
                      )}
                      
                      <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                        <div className="text-xs text-slate-500 flex justify-between font-semibold">
                          <span>Cycle Start:</span>
                          <span className="text-slate-700 font-bold">{formatDate(renterProfile?.currentCycleStart)}</span>
                        </div>
                        <div className="text-xs text-slate-500 flex justify-between font-semibold">
                          <span>Cycle Ends:</span>
                          <span className="text-slate-700 font-bold">{formatDate(renterProfile?.currentCycleEnd)}</span>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Card 2: Current Cycle Statement ("Currently Payment") */}
                  <Card className="p-5 shadow-sm border border-slate-100 bg-white rounded-2xl flex flex-col justify-between hover:shadow-md transition-all duration-300 relative overflow-hidden group">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Current Statement ({monthlyBill?.month || 'N/A'})</span>
                        {monthlyBill && (
                          <Badge
                            variant={
                              monthlyBill.status === 'OVERDUE' 
                                ? 'danger' 
                                : monthlyBill.status === 'PENDING' 
                                  ? 'warning' 
                                  : monthlyBill.isPaid 
                                    ? 'success' 
                                    : 'info'
                            }
                            size="sm"
                            className="font-bold text-[8px] uppercase tracking-wider"
                          >
                            {monthlyBill.status.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="mt-2.5">
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Grand Total Invoice</p>
                        <p className="text-2xl font-extrabold text-slate-800 tracking-tight mt-0.5">
                          ₹{(monthlyBill?.totalDue || 0).toLocaleString()}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between font-semibold">
                        <span>Already Paid:</span>
                        <span className="text-emerald-600 font-bold">₹{(monthlyBill?.paidAmount || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </Card>

                  {/* Card 3: Last Month + Current Month Total */}
                  <Card className="p-5 shadow-sm border border-slate-100 bg-white rounded-2xl flex flex-col justify-between hover:shadow-md transition-all duration-300 relative overflow-hidden group">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Payments (Recent)</span>
                      
                      <div className="mt-3 flex items-center gap-3.5">
                        <div className="w-12 h-12 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-xl shadow-inner">
                          💰
                        </div>
                        <div>
                          <p className="text-2xl font-extrabold text-blue-600 tracking-tight">
                            ₹{recentTwoMonthsTotal.toLocaleString()}
                          </p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                            Last Month + Current Month
                          </p>
                        </div>
                      </div>

                      {/* Breakdown rows */}
                      <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-500">{lastMonthLabel} (Last)</span>
                          <span className="text-slate-700">₹{lastMonthPaid.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-500">{currentMonthLabel} (Current)</span>
                          <span className="text-slate-700">₹{currentMonthPaid.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold pt-2 border-t border-dashed border-slate-200">
                          <span className="text-slate-700 uppercase">Combined Total</span>
                          <span className="text-blue-600 font-extrabold">₹{recentTwoMonthsTotal.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </Card>

                </div>

                {/* Main Content Side-By-Side: Current Pay vs Old Pay Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Left Side: Current Statement breakdown ("Current Pay") */}
                  <Card className="p-5 shadow-sm border border-slate-100 bg-white rounded-2xl">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 pb-2 border-b border-slate-50">
                      ⚡ Current Payment Period Breakdown
                    </h4>
                    
                    {monthlyBill ? (
                      <div className="space-y-4">
                        <div className="space-y-2.5 text-xs">
                          <div className="flex justify-between font-semibold py-1">
                            <span className="text-slate-500">Base Room Rent Amount</span>
                            <span className="text-slate-700">₹{monthlyBill.rentAmount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between font-semibold py-1">
                            <span className="text-slate-500">Room Electricity Bill</span>
                            <span className="text-slate-700">₹{monthlyBill.electricityAmount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between font-semibold py-1">
                            <span className="text-slate-500">Hostel Maintenance & Clean Fee</span>
                            <span className="text-slate-700">₹{monthlyBill.extraCharges.toLocaleString()}</span>
                          </div>
                          {monthlyBill.previousDue > 0 && (
                            <div className="flex justify-between font-bold py-1 text-rose-600">
                              <span>Previous Carryover Dues</span>
                              <span>₹{monthlyBill.previousDue.toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-bold py-2.5 border-t border-slate-100 pt-2.5 text-xs text-slate-800 uppercase">
                            <span>Total Dues Settle</span>
                            <span className="text-blue-600 font-extrabold">₹{monthlyBill.totalDue.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Progress Bar of Payments */}
                        <div>
                          <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400 mb-1">
                            <span>Payment Progress</span>
                            <span>{Math.round(((monthlyBill.paidAmount || 0) / (monthlyBill.totalDue || 1)) * 100)}% Settled</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                            <div 
                              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                              style={{ width: `${Math.min(100, Math.round(((monthlyBill.paidAmount || 0) / (monthlyBill.totalDue || 1)) * 100))}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[9px] font-semibold uppercase text-slate-400 mt-1">
                            <span className="text-emerald-600">Paid: ₹{monthlyBill.paidAmount.toLocaleString()}</span>
                            <span className="text-rose-600">Remaining: ₹{monthlyBill.remainingAmount.toLocaleString()}</span>
                          </div>
                        </div>

                        {monthlyBill.remainingAmount > 0 ? (
                          <div className="flex justify-between items-center bg-emerald-50/40 p-3 rounded-xl border border-emerald-100/50 mt-4">
                            <div>
                              <p className="text-[8px] font-bold text-emerald-600 uppercase tracking-wider">Due Amount Settle</p>
                              <p className="text-sm font-extrabold text-emerald-700">₹{monthlyBill.remainingAmount.toLocaleString()}</p>
                            </div>
                            <button
                              onClick={() => switchTab('bills')}
                              className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold text-[9px] uppercase tracking-wider px-4 py-2 rounded-lg shadow-sm hover:shadow hover:shadow-green-500/10 active:scale-95 transition-all"
                            >
                              Pay Now
                            </button>
                          </div>
                        ) : (
                          <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 text-center font-bold text-[10px] uppercase text-emerald-800 tracking-wider">
                            🎉 Fully Cleared Cycle Statement
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-slate-400 text-xs font-semibold uppercase tracking-wider">
                        No statement prepared for this cycle
                      </div>
                    )}
                  </Card>

                  {/* Right Side: Ledger history summary ("Old Pay") */}
                  <Card className="p-5 shadow-sm border border-slate-100 bg-white rounded-2xl">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-50">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        📑 Ledger History (Old Payments)
                      </h4>
                      <button 
                        onClick={() => switchTab('history')}
                        className="text-[9px] font-bold text-blue-600 uppercase hover:underline tracking-wider"
                      >
                        Full Ledger →
                      </button>
                    </div>
                    
                    {oldPaidBills.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-wider">
                        No previous settled ledger invoices found
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {oldPaidBills.slice(0, 3).map((bill) => (
                          <div 
                            key={bill.id}
                            className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 flex justify-between items-center hover:bg-slate-50 transition-colors"
                          >
                            <div>
                              <p className="text-xs font-bold text-slate-800">{bill.month}</p>
                              <p className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">
                                Base Rent: ₹{bill.rentAmount.toLocaleString()} | Electricity: ₹{bill.electricityAmount.toLocaleString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-bold text-emerald-600">₹{bill.paidAmount.toLocaleString()}</p>
                              <span className="inline-flex items-center gap-0.5 text-[8px] font-bold uppercase text-emerald-700 bg-emerald-50 px-1 rounded mt-0.5">
                                ✓ Verified
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>

                </div>

              </div>
            )}
 
            {/* PANEL 2: Current Invoice & Payment Gateway tab */}
            {activeTab === 'bills' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {monthlyBill ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    
                    {/* Itemized Invoice details */}
                    <Card className="p-6 shadow-sm border border-slate-100 bg-white rounded-2xl relative overflow-hidden">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Rabab Stay Rental Invoice</h3>
                          <p className="text-[9px] text-slate-400 font-semibold uppercase mt-1">Invoice ID: #{monthlyBill.id} — Period: {monthlyBill.month}</p>
                        </div>
                        <Badge
                          variant={
                            monthlyBill.status === 'OVERDUE' 
                              ? 'danger' 
                              : monthlyBill.status === 'PENDING' 
                                ? 'warning' 
                                : monthlyBill.isPaid 
                                  ? 'success' 
                                  : 'info'
                          }
                          size="md"
                          className="font-bold text-[9px] uppercase tracking-wider px-2 py-0.5"
                        >
                          {monthlyBill.status.replace('_', ' ')}
                        </Badge>
                      </div>
 
                      <div className="divide-y divide-slate-100 text-xs">
                        <div className="py-3 flex justify-between">
                          <span className="text-slate-500 font-medium">1. Monthly base rent fee</span>
                          <span className="font-bold text-slate-700">₹{monthlyBill.rentAmount.toLocaleString()}</span>
                        </div>
                        <div className="py-3 flex justify-between">
                          <span className="text-slate-500 font-medium">2. Room electricity statement</span>
                          <span className="font-bold text-slate-700">₹{monthlyBill.electricityAmount.toLocaleString()}</span>
                        </div>
                        <div className="py-3 flex justify-between">
                          <span className="text-slate-500 font-medium">3. Hostel maintenance fee</span>
                          <span className="font-bold text-slate-700">₹{monthlyBill.extraCharges.toLocaleString()}</span>
                        </div>
                        {monthlyBill.previousDue > 0 && (
                          <div className="py-3 flex justify-between text-rose-600 font-semibold">
                            <span>4. Carryover dues from previous statements</span>
                            <span className="font-bold text-rose-700">₹{monthlyBill.previousDue.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="py-4 flex justify-between text-xs font-bold border-t border-slate-100 pt-3">
                          <span className="text-slate-800 uppercase">Grand Invoice Total</span>
                          <span className="text-blue-600 font-bold">₹{monthlyBill.totalDue.toLocaleString()}</span>
                        </div>
                        {monthlyBill.paidAmount > 0 && (
                          <div className="py-3 flex justify-between text-xs font-semibold text-emerald-600">
                            <span>Amount Settle Payment</span>
                            <span>- ₹{monthlyBill.paidAmount.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="py-4 flex justify-between text-xs font-bold border-t border-slate-100 bg-slate-50/50 px-3 rounded-xl mt-2">
                          <span className="text-slate-800 uppercase">Remaining Outstanding Dues</span>
                          <span className="text-rose-600 font-bold">₹{monthlyBill.remainingAmount.toLocaleString()}</span>
                        </div>
                      </div>
 
                      <div className="mt-4 text-[9px] font-semibold text-slate-400 uppercase tracking-wide text-right">
                        Due Date: {formatDate(monthlyBill.dueDate)}
                      </div>
                    </Card>
 
                    {/* Verification / Settle Portal */}
                    {monthlyBill.remainingAmount > 0 ? (
                      <Card className="p-6 shadow-sm border border-blue-100 bg-white rounded-2xl">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Settle Rent Invoice Dues</h3>
                        
                        {paymentSuccess && (
                          <div className="mb-4 p-4 bg-emerald-50 border-l-4 border-emerald-600 rounded-2xl text-xs font-semibold text-emerald-800">
                            {paymentSuccess}
                          </div>
                        )}

                        {/* Stay Renewal Option Selection Center (Business Rule 10: renewal options) */}
                        <div className="mb-5 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Choose Stay Renewal Option:</p>
                          <div className="grid grid-cols-2 gap-3.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSuccess("Option A Selected: Please complete the payment below to continue your stay.")
                                setError("")
                              }}
                              className="p-3.5 bg-white border border-blue-500 rounded-xl text-left shadow-sm flex flex-col justify-between hover:border-blue-600 transition-all active:scale-[0.98] cursor-pointer"
                            >
                              <div>
                                <span className="text-lg">🏠</span>
                                <p className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest mt-1">Option A</p>
                                <p className="text-xs font-black text-slate-900 mt-0.5">Pay & Continue</p>
                              </div>
                              <p className="text-[9px] text-slate-500 mt-2 font-medium leading-tight">Pay dues to automatically renew stay cycle.</p>
                            </button>

                            <button
                              type="button"
                              onClick={async () => {
                                const confirmCheckout = window.confirm("Are you absolutely sure you want to request CHECKOUT? This will notify administration to inspect your room and release booking, preventing future cycles.")
                                if (confirmCheckout) {
                                  const reason = window.prompt("Please enter the reason for checking out:") || "Not specified"
                                  const dateStr = window.prompt("Please enter the expected checkout date (YYYY-MM-DD):") || new Date().toISOString().split('T')[0]
                                  
                                  try {
                                    setLoading(true)
                                    setError("")
                                    setSuccess("")
                                    const res = await billingService.requestCheckoutNew({
                                      reason,
                                      expectedCheckoutDate: dateStr
                                    })
                                    setSuccess(res.message || "Checkout request submitted. Awaiting admin approval.")
                                    await fetchDashboardData()
                                  } catch (err: any) {
                                    console.error("Failed to request checkout:", err)
                                    setError(err.response?.data?.message || "Failed to submit checkout request.")
                                  } finally {
                                    setLoading(false)
                                  }
                                }
                              }}
                              className="p-3.5 bg-white border border-slate-200 hover:border-rose-400 rounded-xl text-left shadow-sm flex flex-col justify-between transition-all active:scale-[0.98] cursor-pointer"
                            >
                              <div>
                                <span className="text-lg">🚪</span>
                                <p className="text-[10px] font-extrabold text-rose-500 uppercase tracking-widest mt-1">Option B</p>
                                <p className="text-xs font-black text-slate-900 mt-0.5">Request Checkout</p>
                              </div>
                              <p className="text-[9px] text-slate-500 mt-2 font-medium leading-tight">Coordination for move-out & stop next cycles.</p>
                            </button>
                          </div>
                        </div>
 
                        <div className="space-y-4">
                          <div>
                            <label className="block text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Select Payment Mode</label>
                            <select
                              value={payMethod}
                              onChange={(e) => setPayMethod(e.target.value as any)}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 font-semibold text-xs outline-none cursor-pointer"
                            >
                              <option value="RAZORPAY">Secure Online Payment (Card / UPI / Netbanking)</option>
                              <option value="UPI">UPI Reference Check (Scan QR & Hand-verify)</option>
                              <option value="CASH">Offline Cash Handover</option>
                            </select>
                          </div>
 
                          {payMethod === 'RAZORPAY' ? (
                            <div className="p-5 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 rounded-2xl border border-slate-800 flex flex-col items-center gap-4 text-white relative overflow-hidden shadow-lg shadow-slate-950/20 group animate-in fade-in duration-300">
                              <div className="flex flex-col items-center gap-2 relative z-10 text-center">
                                <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center text-xl shadow-inner mb-1.5 animate-pulse">
                                  💳
                                </div>
                                <p className="font-extrabold text-sm tracking-tight text-white">Secure Online Payment Gateway</p>
                                <p className="text-[10px] text-slate-400 font-semibold leading-relaxed max-w-xs mx-auto">
                                  Pay instantly using Credit Card, Debit Card, Netbanking, or direct UPI. All transactions are secure and automatically validated.
                                </p>
                              </div>
                              <div className="w-full border-t border-slate-800/80 pt-3 flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest relative z-10">
                                <span>Gateway Provider:</span>
                                <span className="text-blue-400 font-extrabold">Razorpay Secure</span>
                              </div>
                              <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-blue-500/5 to-transparent pointer-events-none" />
                            </div>
                          ) : payMethod === 'UPI' ? (
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50 flex flex-col items-center gap-4">
                              {/* Dynamic QR Code from free QR API */}
                              <div className="flex flex-col items-center gap-2">
                                <div className="w-32 h-32 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-center relative overflow-hidden flex-shrink-0">
                                  <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`upi://pay?pa=6386227501@axl&pn=${encodeURIComponent("Rabab Stay")}&am=${monthlyBill.remainingAmount}&cu=INR&tn=${encodeURIComponent(`Rent ${monthlyBill.month || ''}`)}`)}`}
                                    alt="Scan to Pay Dues"
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                                <span className="text-[8px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full animate-pulse">
                                  Auto-fills ₹{monthlyBill.remainingAmount.toLocaleString()}
                                </span>
                              </div>
                              <div className="space-y-2 text-xs w-full text-center">
                                <p className="font-semibold text-slate-800">Scan & Pay Online</p>
                                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                                    Scan QR code or pay directly to UPI Address: <span className="font-semibold text-blue-600 bg-blue-50/50 px-1 py-0.5 rounded">6386227501@axl</span> using any UPI app.
                                  </p>
                                
                                <div className="pt-2 text-left">
                                  <label className="block text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1 ml-0.5">UPI Ref Number / UTR (Optional)</label>
                                  <input
                                    type="text"
                                    value={utrNumber}
                                    onChange={(e) => setUtrNumber(e.target.value)}
                                    placeholder="Enter 12-digit UTR number"
                                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 font-semibold text-[11px] outline-none"
                                  />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50 space-y-3">
                              <p className="text-xs font-bold text-slate-800">💸 Cash Handover Settlement</p>
                              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                                Settle the invoice in cash directly with the building coordinator at the front office. Submit a verification request below after handed over.
                              </p>
                              <div>
                                <label className="block text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1 ml-0.5">Handover Notes</label>
                                <input
                                  type="text"
                                  value={paymentNotes}
                                  onChange={(e) => setPaymentNotes(e.target.value)}
                                  placeholder="Specify notes (e.g. handed over to Amit)"
                                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 font-semibold text-[11px] outline-none"
                                />
                              </div>
                            </div>
                          )}
 
                          <Button
                            onClick={handleProcessPayment}
                            variant="success"
                            disabled={payingLoading}
                            className="w-full uppercase font-bold tracking-wider text-[9px] h-10 mt-2 shadow-md shadow-green-100 flex items-center justify-center gap-1.5"
                          >
                            {payingLoading ? (
                              <>
                                <span className="animate-spin text-white">🔄</span>
                                <span>{payMethod === 'RAZORPAY' ? 'Initializing Gateway...' : 'Verifying Payment Notification...'}</span>
                              </>
                            ) : (
                              <span>{payMethod === 'RAZORPAY' ? 'Pay Online with Razorpay' : 'Notify Payment Complete'}</span>
                            )}
                          </Button>
                        </div>
                      </Card>
                    ) : (
                      <Card className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl shadow-sm text-center">
                        <span className="text-3xl">🎉</span>
                        <h4 className="text-sm font-bold text-emerald-900 uppercase tracking-wider mt-3">Invoice Settled</h4>
                        <p className="text-xs text-emerald-700 font-medium mt-1 leading-relaxed">
                          This monthly statement has been settled successfully. Thank you!
                        </p>
                      </Card>
                    )}
                  </div>
                ) : (
                  <Card className="p-16 text-center border-none shadow-sm bg-white rounded-2xl">
                    <span className="text-4xl">🧾</span>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mt-4">No Statement Generated</h3>
                    <p className="text-xs text-slate-400 font-semibold mt-1">There is no active rent statement prepared for this month cycle.</p>
                  </Card>
                )}
              </div>
            )}
 
            {/* PANEL 3: Bills History Timeline tab */}
            {activeTab === 'history' && (
              <Card className="p-6 shadow-sm border border-slate-100 bg-white rounded-2xl animate-in fade-in duration-200">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Invoice Ledger & History</h3>
                {billsHistory.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    No past rent statement ledger records found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="text-[8px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                          <th className="pb-3">Month</th>
                          <th className="pb-3 text-right">Rent</th>
                          <th className="pb-3 text-right">Electricity</th>
                          <th className="pb-3 text-right">Other</th>
                          <th className="pb-3 text-right">Total</th>
                          <th className="pb-3 text-center">Settle Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                        {billsHistory.map((bill) => (
                          <tr key={bill.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3.5 font-bold text-slate-800">{bill.month}</td>
                            <td className="py-3.5 text-right">₹{bill.rentAmount.toLocaleString()}</td>
                            <td className="py-3.5 text-right">₹{bill.electricityAmount.toLocaleString()}</td>
                            <td className="py-3.5 text-right">₹{bill.extraCharges.toLocaleString()}</td>
                            <td className="py-3.5 text-right text-blue-600 font-bold">₹{bill.totalDue.toLocaleString()}</td>
                            <td className="py-3.5 text-center">
                              <Badge variant={bill.isPaid ? "success" : "danger"} size="sm" className="text-[8px] px-1.5 font-bold uppercase">
                                {bill.status.replace('_', ' ')}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            )}
 
            {/* PANEL 4: Direct Support Chat tab */}
            {activeTab === 'messages' && (
              <Card className="p-0 shadow-sm border border-slate-100 bg-white rounded-2xl flex flex-col h-[520px] overflow-hidden animate-in fade-in duration-200">
                {/* Chat header */}
                <div className="bg-blue-600 text-white p-4 flex items-center justify-between shadow-sm">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Hostel Support Desk</h4>
                    <p className="text-[9px] text-blue-300 font-semibold mt-0.5">Online Support Desk</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-[8px] font-semibold uppercase tracking-wider text-slate-400">Live Connection</span>
                  </div>
                </div>
 
                {/* Message logs list */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
                  {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center flex-col text-slate-400 text-center px-6">
                      <span className="text-3xl mb-2">💬</span>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Support Chat Empty</p>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase mt-1">Submit a question or query above to coordinate directly with administration.</p>
                    </div>
                  ) : (
                    messages.map((msg: any) => {
                      const isAdmin = msg.sender?.role === "ADMIN" || msg.senderId !== user?.id
                      return (
                        <div key={msg.id} className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}>
                          <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm ${
                            isAdmin 
                              ? 'bg-white border border-slate-100 text-slate-800 rounded-tl-none' 
                              : 'bg-blue-600 text-white rounded-tr-none'
                          }`}>
                            <p className="text-[8px] font-bold uppercase opacity-60 tracking-wider mb-1">
                              {isAdmin ? "Admin Manager" : user?.name}
                            </p>
                            <p>{msg.content}</p>
                          </div>
                          <span className="text-[8px] text-slate-400 font-semibold uppercase mt-1 px-1">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      )
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>
 
                {/* Chat message input form */}
                <form onSubmit={handleSendSupportMessage} className="p-3 border-t border-slate-100 bg-white flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Type support question here..."
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400"
                  />
                  <Button
                    type="submit"
                    disabled={sendingChat || !chatMessage.trim()}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider"
                  >
                    Send
                  </Button>
                </form>
              </Card>
            )}
 
            {/* PANEL 5: Notifications & Alerts tab */}
            {activeTab === 'notifications' && (
              <Card className="p-6 shadow-sm border border-slate-100 bg-white rounded-2xl animate-in fade-in duration-200">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Residency Notifications & Alerts</h3>
                    <p className="text-[9px] text-slate-400 font-semibold uppercase mt-1">Official system announcements & updates</p>
                  </div>
                  <Badge variant="primary" size="md" className="font-bold text-[9px] uppercase tracking-wider">
                    {notifications.length} Total
                  </Badge>
                </div>
 
                {notifications.length === 0 ? (
                  <div className="py-16 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                    <span className="text-4xl">🔔</span>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest mt-4">Inbox is Clean</h4>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase mt-1">You have no new notifications or stay cycle alerts.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notifications.map((notif: any) => {
                      const isHigh = notif.priority === 'HIGH';
                      const isBill = notif.type === 'BILL';
                      const isPayment = notif.type === 'PAYMENT';
                      
                      let accentColor = 'border-l-slate-400';
                      let icon = '🔔';
                      if (isHigh) {
                        accentColor = 'border-l-rose-500 bg-rose-50/20';
                        icon = '🚨';
                      } else if (isBill) {
                        accentColor = 'border-l-amber-500 bg-amber-50/10';
                        icon = '🧾';
                      } else if (isPayment) {
                        accentColor = 'border-l-emerald-500 bg-emerald-50/10';
                        icon = '💸';
                      }
 
                      return (
                        <div 
                          key={notif.id} 
                          className={`p-4 border border-slate-100 border-l-4 ${accentColor} rounded-2xl flex gap-3.5 items-start hover:shadow-md transition-all duration-300`}
                        >
                          <div className="text-xl p-2 bg-white shadow-sm border border-slate-50 rounded-xl flex-shrink-0">
                            {icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2 flex-wrap">
                              <h4 className="text-xs font-bold text-slate-800 tracking-tight uppercase">
                                {notif.title}
                              </h4>
                              <span className="text-[8px] text-slate-400 font-semibold uppercase whitespace-nowrap">
                                {formatDate(notif.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 font-medium leading-relaxed mt-1">
                              {notif.message}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>
            )}
          </div>

      </div>
    </div>
  )
}

export default RenterMonthlyDashboard
