import { useEffect, useState, useRef, useMemo } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ArrowLeft, 
  LayoutDashboard, 
  FileText, 
  History, 
  MessageSquare, 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  Send, 
  LogOut, 
  Building, 
  Sparkles, 
  ChevronRight, 
  AlertCircle,
  FileCheck,
  Zap,
  CheckCheck
} from "lucide-react"
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
  const [payMethod, setPayMethod] = useState<'UPI' | 'CASH'>('UPI')
  const [utrNumber, setUtrNumber] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')
  const [payingLoading, setPayingLoading] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState('')

  // Custom Stay Checkout Modal States
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [checkoutReason, setCheckoutReason] = useState("")
  const [checkoutDate, setCheckoutDate] = useState(new Date().toISOString().split('T')[0])

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
      
      // Auto-poll messages every 10 seconds (reduced from 4s to save API calls)
      const interval = setInterval(fetchConversation, 10000)
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

  // Trigger auto-scroll ONLY when a new message is actually added (length changes),
  // preventing scroll hijacking during silent polling intervals!
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom()
    }
  }, [messages.length])

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchDashboardData = async () => {
    if (isFetchingDashboard.current) return
    isFetchingDashboard.current = true
    try {
      setLoading(true)
      const data = await billingService.getRenterDashboard()
      
      setActiveBooking(data.activeBooking)
      setMonthlyBill(data.monthlyBill)
      setNotifications(data.notifications || [])
      
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
        receiverId: 1, 
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

  const handleSubmitCheckoutModal = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setPayingLoading(true)
      setError("")
      setSuccess("")
      const res = await billingService.requestCheckoutNew({
        reason: checkoutReason,
        expectedCheckoutDate: checkoutDate
      })
      setSuccess(res.message || "Checkout request submitted successfully. Awaiting administrative approval.")
      setShowCheckoutModal(false)
      await fetchDashboardData()
      await fetchHistory()
    } catch (err: any) {
      console.error("Failed to request checkout:", err)
      setError(err.response?.data?.message || "Failed to submit checkout request.")
    } finally {
      setPayingLoading(false)
    }
  }

  const handleProcessPayment = async () => {
    if (!monthlyBill) return

    if (payMethod === 'UPI') {
      if (!utrNumber.trim()) {
        setError("UTR reference number is required for UPI payments")
        return
      }
      if (!/^\d{12}$/.test(utrNumber.trim())) {
        setError("UTR reference number must be exactly a 12-digit number")
        return
      }
    }

    try {
      setPayingLoading(true)
      setPaymentSuccess("")
      setError("")

      await paymentService.processMonthlyPayment({
        billId: monthlyBill.id,
        paymentMethod: payMethod === 'UPI' ? 'UPI' : 'CASH',
        transactionId: payMethod === 'UPI' ? utrNumber.trim() : undefined,
        notes: payMethod === 'CASH' ? paymentNotes.trim() : undefined
      })

      if (payMethod === 'UPI') {
        setPaymentSuccess("UPI payment notification submitted! Please wait for the admin to verify references and approve your stay continuation.")
      } else {
        setPaymentSuccess("Cash payment notification submitted! Please handover ₹" + monthlyBill.remainingAmount.toLocaleString() + " to the administration for verification & approval.")
      }

      setUtrNumber("")
      setPaymentNotes("")
      
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

  if (!activeBooking) {
    return (
      <div className="min-h-screen bg-slate-50/50 p-6 flex items-center justify-center">
        <Card className="max-w-md w-full p-8 text-center bg-white shadow-lg border border-slate-100 rounded-2xl">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl text-left text-xs font-semibold text-rose-700">
              ⚠️ {error}
            </div>
          )}
          <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Building size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">No Active Monthly Stay Found</h2>
          <p className="text-xs text-slate-500 font-medium leading-relaxed mt-2 max-w-sm mx-auto">
            You do not currently hold an active, checked-in monthly hostel contract. Book a hostel room or coordinate with our administrative managers.
          </p>
          <div className="mt-6 flex gap-3 justify-center">
            <Button onClick={() => navigate("/rooms")} size="sm" className="font-bold tracking-wider text-[10px] uppercase">
              Explore Rooms
            </Button>
            <Button onClick={() => navigate("/dashboard")} variant="outline" size="sm" className="font-bold tracking-wider text-[10px] uppercase">
              Back to Overview
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const renterProfile = activeBooking.monthlyRenter
  
  const getDynamicStayStatus = () => {
    let status = renterProfile?.status || activeBooking.stayStatus || "ACTIVE"
    if (renterProfile?.currentCycleEnd) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const cycleEnd = new Date(renterProfile.currentCycleEnd)
      cycleEnd.setHours(0, 0, 0, 0)
      
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
  
  // Pre-calculations for dashboard overview tab
  const currentMonthPaid = monthlyBill?.paidAmount || 0
  const currentMonthLabel = monthlyBill?.month || 'Current Month'

  const oldPaidBills = billsHistory.filter(b => b.isPaid && b.id !== monthlyBill?.id)
  const lastMonthBill = oldPaidBills.length > 0 ? oldPaidBills[0] : null
  const lastMonthPaid = lastMonthBill?.paidAmount || 0
  const lastMonthLabel = lastMonthBill?.month || 'Last Month'

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

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Summary', icon: LayoutDashboard },
    { id: 'bills', label: 'Current Statement', icon: FileText },
    { id: 'history', label: 'Ledger History', icon: History },
    { id: 'messages', label: 'Support Messenger', icon: MessageSquare },
    { id: 'notifications', label: 'Alerts', icon: Bell },
  ]

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 relative overflow-hidden pb-12">
      
      {/* Background Accent Glows */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-blue-600/5 to-indigo-600/5 rounded-full blur-3xl pointer-events-none -translate-y-1/3" />

      <div className="max-w-7xl mx-auto relative z-10">

        {/* Hero Top Title Banner */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-md relative overflow-hidden">
          <div className="relative z-10 space-y-1">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-blue-400 hover:text-blue-300 font-bold uppercase tracking-wider text-[9px] mb-1.5 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft size={11} />
              Back to Overview
            </button>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Resident Monthly Hub
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              Room {activeBooking.room?.roomNumber || "N/A"} &bull; {activeBooking.room?.title || "Standard stay"}
            </p>
          </div>
          <div className="flex items-center gap-2 relative z-10 self-start md:self-center">
            <Badge variant={getRenterBadgeVariant(stayStatus)} size="md" className="font-bold text-[9px] tracking-wider uppercase px-3 py-1">
              Stay Status: {stayStatus.replace('_', ' ')}
            </Badge>
          </div>
          {/* Subtle gradient graphic */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-blue-600/10 to-transparent pointer-events-none" />
        </div>

        {/* Feedback banners */}
        {error && (
          <div className="mb-4 p-4 bg-rose-50 border border-rose-100 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
            <AlertTriangle size={14} className="text-rose-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="bg-slate-100/80 backdrop-blur-md p-1 rounded-xl mb-6 shadow-inner flex gap-1 overflow-x-auto scrollbar-hide sticky top-0 z-35 border border-slate-200/50">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            const TabIcon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 snap-center whitespace-nowrap ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-sm font-extrabold' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
                }`}
              >
                <TabIcon size={14} className={isActive ? 'text-white' : 'text-slate-400'} />
                <span>{tab.label}</span>
                {tab.id === 'notifications' && notifications.length > 0 && (
                  <span className="relative flex h-1.5 w-1.5 ml-0.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Tab content containers */}
        <div className="w-full">
            
            {/* PANEL 1: Summary Overview Tab */}
            {activeTab === 'dashboard' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                
                {/* STAY RENEWAL & CHECKOUT ACTION CENTER */}
                {['DUE_SOON', 'EXPIRES_TODAY', 'PAYMENT_PENDING', 'OVERDUE', 'EXPIRED', 'CONTINUE_REQUESTED', 'CHECKOUT_REQUESTED'].includes(stayStatus) && (
                  <Card className="p-5 border-l-4 border-l-blue-600 bg-white shadow-sm rounded-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg flex-shrink-0 mt-0.5">
                          {stayStatus === 'CONTINUE_REQUESTED' ? <FileCheck size={18} /> : stayStatus === 'CHECKOUT_REQUESTED' ? <LogOut size={18} /> : <AlertTriangle size={18} />}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-800 tracking-tight">
                            {stayStatus === 'CONTINUE_REQUESTED' && 'Continue Stay Request Under Review'}
                            {stayStatus === 'CHECKOUT_REQUESTED' && 'Checkout Request Under Review'}
                            {['PAYMENT_PENDING', 'OVERDUE', 'EXPIRED'].includes(stayStatus) && 'Your Monthly Stay Has Expired'}
                            {['DUE_SOON', 'EXPIRES_TODAY'].includes(stayStatus) && 'Stay Cycle Nearing End'}
                          </h3>
                          <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-0.5 max-w-xl">
                            {stayStatus === 'CONTINUE_REQUESTED' && 'Your request to continue residency is currently pending manager approval. A statement cycle will renew once verified.'}
                            {stayStatus === 'CHECKOUT_REQUESTED' && 'Your move-out checkout request is being evaluated. Please coordinate with the management for room inspection and final balance settlements.'}
                            {['PAYMENT_PENDING', 'OVERDUE', 'EXPIRED'].includes(stayStatus) && 'Your monthly residency has completed. Please indicate whether you want to submit stay continuation or request final checkout.'}
                            {['DUE_SOON', 'EXPIRES_TODAY'].includes(stayStatus) && 'Your current residential stay cycle is expiring soon. You can request stay extension or submit an early checkout notice.'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                        {['DUE_SOON', 'EXPIRES_TODAY', 'PAYMENT_PENDING', 'OVERDUE', 'EXPIRED'].includes(stayStatus) && (
                          <>
                            <button
                              onClick={handleRequestContinueStay}
                              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[9px] uppercase tracking-wider px-4 py-2.5 rounded-lg shadow-sm transition-all"
                            >
                              Continue Stay
                            </button>
                            <button
                              onClick={() => {
                                setCheckoutDate(new Date().toISOString().split('T')[0])
                                setCheckoutReason("")
                                setShowCheckoutModal(true)
                              }}
                              className="border border-slate-350 hover:bg-slate-50 text-slate-700 font-bold text-[9px] uppercase tracking-wider px-4 py-2.5 rounded-lg transition-all"
                            >
                              Request Checkout
                            </button>
                          </>
                        )}

                        {stayStatus === 'CONTINUE_REQUESTED' && (
                          <Badge variant="warning" size="md" className="font-extrabold text-[9px] uppercase tracking-wider py-1 px-3">
                            Awaiting Admin Approval
                          </Badge>
                        )}

                        {stayStatus === 'CHECKOUT_REQUESTED' && (
                          <Badge variant="secondary" size="md" className="font-extrabold text-[9px] uppercase tracking-wider py-1 px-3">
                            Awaiting Admin Approval
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                )}
                
                {/* Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Card 1: Expiry Countdown */}
                  <Card className="p-5 shadow-sm border border-slate-100 bg-white rounded-2xl flex flex-col justify-between hover:border-slate-200 transition-all duration-200 relative overflow-hidden group">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Stay cycle countdown</span>
                        {monthlyBill?.month && (
                          <span className="text-[8px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider border border-blue-100/50">
                            {monthlyBill.month}
                          </span>
                        )}
                      </div>
                      
                      {daysLeft !== null ? (
                        <div className="flex items-center gap-4 py-1">
                          <div className={`w-14 h-14 rounded-full flex flex-col items-center justify-center border-4 flex-shrink-0 ${
                            daysLeft > 10 
                              ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700' 
                              : daysLeft >= 0 
                                ? 'border-amber-500 bg-amber-50/50 text-amber-700' 
                                : 'border-rose-500 bg-rose-50/50 text-rose-700'
                          }`}>
                            <span className="text-sm font-extrabold leading-none">{Math.abs(daysLeft)}</span>
                            <span className="text-[6px] font-bold uppercase tracking-wider mt-0.5">{daysLeft >= 0 ? 'Days' : 'Over'}</span>
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-800 tracking-tight leading-snug">
                              {daysLeft > 10 
                                ? 'Time Safe & Active' 
                                : daysLeft >= 0 
                                  ? 'Renewal Due Soon' 
                                  : 'Stay Has Expired'}
                            </h4>
                            <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                              {daysLeft >= 0 ? 'Days Remaining in current cycle' : 'Days outstanding stay'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wide py-2">
                          No cycle dates configured
                        </div>
                      )}
                      
                      <div className="pt-3 border-t border-slate-100 space-y-1.5">
                        <div className="text-xs text-slate-500 flex justify-between font-semibold">
                          <span className="text-slate-400 font-medium">Cycle Start:</span>
                          <span className="text-slate-700 font-bold">{formatDate(renterProfile?.currentCycleStart)}</span>
                        </div>
                        <div className="text-xs text-slate-500 flex justify-between font-semibold">
                          <span className="text-slate-400 font-medium">Cycle Ends:</span>
                          <span className="text-slate-700 font-bold">{formatDate(renterProfile?.currentCycleEnd)}</span>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Card 2: Current Statement Summary */}
                  <Card className="p-5 shadow-sm border border-slate-100 bg-white rounded-2xl flex flex-col justify-between hover:border-slate-200 transition-all duration-200 relative overflow-hidden group">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Current Period ({monthlyBill?.month || 'N/A'})</span>
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
                            className="font-bold text-[8px] uppercase tracking-wider px-2 py-0.5"
                          >
                            {monthlyBill.status.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="py-1">
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Statement total dues</p>
                        <p className="text-2xl font-black text-slate-800 tracking-tight mt-0.5">
                          ₹{(monthlyBill?.totalDue || 0).toLocaleString()}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between font-semibold">
                        <span className="text-slate-400 font-medium">Amount Settled:</span>
                        <span className="text-emerald-600 font-bold">₹{(monthlyBill?.paidAmount || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </Card>

                  {/* Card 3: Combined Total */}
                  <Card className="p-5 shadow-sm border border-slate-100 bg-white rounded-2xl flex flex-col justify-between hover:border-slate-200 transition-all duration-200 relative overflow-hidden group">
                    <div className="space-y-3">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Paid (Recent Cycles)</span>
                      
                      <div className="flex items-center gap-3">
                        <div className="">
                          {/* <DollarSign size={18} /> */}
                        </div>
                        <div>
                          <p className="text-xl font-black text-blue-600 tracking-tight">
                            ₹{recentTwoMonthsTotal.toLocaleString()}
                          </p>
                          <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                            Combined payments ledger
                          </p>
                        </div>
                      </div>

                      {/* Breakdown rows */}
                      <div className="pt-2.5 border-t border-slate-100 space-y-2">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-400 font-medium">{lastMonthLabel} (Prior)</span>
                          <span className="text-slate-700 font-bold">₹{lastMonthPaid.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-400 font-medium">{currentMonthLabel} (Current)</span>
                          <span className="text-slate-700 font-bold">₹{currentMonthPaid.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </Card>

                </div>

                {/* Side-by-Side: Current Pay vs Old Pay Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Left Side: Current Statement breakdown */}
                  <Card className="p-5 shadow-sm border border-slate-100 bg-white rounded-2xl">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 pb-2 border-b border-slate-50 flex items-center gap-1.5">
                      <FileCheck size={14} className="text-slate-400" /> Current Statement Breakdown
                    </h4>
                    
                    {monthlyBill ? (
                      <div className="space-y-4">
                        <div className="space-y-2.5 text-xs">
                          <div className="flex justify-between font-semibold py-0.5">
                            <span className="text-slate-500 font-medium">1. Base Monthly Room Rent</span>
                            <span className="text-slate-700 font-bold">₹{monthlyBill.rentAmount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between font-semibold py-0.5">
                            <span className="text-slate-500 font-medium">2. Room Electricity Usage</span>
                            <span className="text-slate-700 font-bold">₹{monthlyBill.electricityAmount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between font-semibold py-0.5">
                            <span className="text-slate-500 font-medium">3. Shared Maintenance Charges</span>
                            <span className="text-slate-700 font-bold">₹{monthlyBill.extraCharges.toLocaleString()}</span>
                          </div>
                          {monthlyBill.previousDue > 0 && (
                            <div className="flex justify-between font-bold py-0.5 text-rose-600">
                              <span>4. Previous Outstanding Carryover</span>
                              <span className="font-extrabold">₹{monthlyBill.previousDue.toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-bold py-2 border-t border-slate-100 pt-2 text-xs text-slate-850 uppercase">
                            <span>Total Dues prepared</span>
                            <span className="text-blue-600 font-black">₹{monthlyBill.totalDue.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] font-bold uppercase text-slate-400">
                            <span>Outstanding Settlement Progress</span>
                            <span>{Math.round(((monthlyBill.paidAmount || 0) / (monthlyBill.totalDue || 1)) * 100)}% paid</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                            <div 
                              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                              style={{ width: `${Math.min(100, Math.round(((monthlyBill.paidAmount || 0) / (monthlyBill.totalDue || 1)) * 100))}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[8px] font-bold uppercase text-slate-400 mt-0.5">
                            <span className="text-emerald-600">Paid: ₹{monthlyBill.paidAmount.toLocaleString()}</span>
                            <span className="text-rose-500">Remaining: ₹{monthlyBill.remainingAmount.toLocaleString()}</span>
                          </div>
                        </div>

                        {monthlyBill.remainingAmount > 0 ? (
                          <div className="flex justify-between items-center bg-blue-50/30 p-3 rounded-xl border border-blue-100/50 mt-4">
                            <div>
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Unsettled Balance</p>
                              <p className="text-sm font-extrabold text-blue-700">₹{monthlyBill.remainingAmount.toLocaleString()}</p>
                            </div>
                            <button
                              onClick={() => switchTab('bills')}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[9px] uppercase tracking-wider px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center gap-1"
                            >
                              Settle Dues
                              <ChevronRight size={12} />
                            </button>
                          </div>
                        ) : (
                          <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 text-center font-bold text-[9px] uppercase text-emerald-800 tracking-wider">
                            🎉 Cleared Cycle Statement Statement Fully Settled
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-slate-400 text-xs font-semibold uppercase tracking-wider">
                        No active statements generated
                      </div>
                    )}
                  </Card>

                  {/* Right Side: Ledger history summary */}
                  <Card className="p-5 shadow-sm border border-slate-100 bg-white rounded-2xl">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-50">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <History size={14} className="text-slate-400" /> Recent Statements Ledger
                      </h4>
                      <button 
                        onClick={() => switchTab('history')}
                        className="text-[9px] font-bold text-blue-600 uppercase hover:underline tracking-wider transition-colors"
                      >
                        Full Ledger &rarr;
                      </button>
                    </div>
                    
                    {oldPaidBills.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-wider">
                        No previous settled ledger invoices found
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {oldPaidBills.slice(0, 3).map((bill) => (
                          <div 
                            key={bill.id}
                            className="p-3 bg-slate-50/60 rounded-xl border border-slate-100 flex justify-between items-center hover:bg-slate-50 transition-colors"
                          >
                            <div>
                              <p className="text-xs font-bold text-slate-800">{bill.month}</p>
                              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                Rent: ₹{bill.rentAmount} | Elec: ₹{bill.electricityAmount}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-bold text-emerald-600">₹{bill.paidAmount.toLocaleString()}</p>
                              <span className="inline-flex items-center gap-0.5 text-[7px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100/50 mt-0.5">
                                Verified
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>

                </div>

              </motion.div>
            )}
 
            {/* PANEL 2: Current Invoice & Payment Gateway tab */}
            {activeTab === 'bills' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {monthlyBill ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    
                    {/* Itemized Invoice details */}
                    <Card className="p-6 shadow-sm border border-slate-100 bg-white rounded-2xl relative overflow-hidden">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Hostel Rental Invoice</h3>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">Invoice ID: #{monthlyBill.id} &bull; Period: {monthlyBill.month}</p>
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
                          className="font-bold text-[9px] uppercase tracking-wider px-2.5 py-0.5"
                        >
                          {monthlyBill.status.replace('_', ' ')}
                        </Badge>
                      </div>
 
                      <div className="divide-y divide-slate-100 text-xs">
                        <div className="py-3 flex justify-between font-semibold">
                          <span className="text-slate-500 font-medium">1. Base Monthly Hostel Rent</span>
                          <span className="font-bold text-slate-700">₹{monthlyBill.rentAmount.toLocaleString()}</span>
                        </div>
                        <div className="py-3 flex justify-between font-semibold">
                          <span className="text-slate-500 font-medium">2. Room Electricity Charges</span>
                          <span className="font-bold text-slate-700">₹{monthlyBill.electricityAmount.toLocaleString()}</span>
                        </div>
                        <div className="py-3 flex justify-between font-semibold">
                          <span className="text-slate-500 font-medium">3. Hostel Maintenance & Shared Utilities</span>
                          <span className="font-bold text-slate-700">₹{monthlyBill.extraCharges.toLocaleString()}</span>
                        </div>
                        {monthlyBill.previousDue > 0 && (
                          <div className="py-3 flex justify-between text-rose-600 font-bold">
                            <span>4. Carryover Outstanding Dues</span>
                            <span className="font-extrabold">₹{monthlyBill.previousDue.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="py-3.5 flex justify-between text-xs font-bold border-t border-slate-100 pt-3">
                          <span className="text-slate-850 uppercase">Grand Invoice Total</span>
                          <span className="text-slate-900 font-black">₹{monthlyBill.totalDue.toLocaleString()}</span>
                        </div>
                        {monthlyBill.paidAmount > 0 && (
                          <div className="py-3 flex justify-between text-xs font-bold text-emerald-600">
                            <span>Dues Settled Payments</span>
                            <span>- ₹{monthlyBill.paidAmount.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="py-3.5 flex justify-between text-xs font-bold border-t border-slate-100 bg-slate-50/50 px-3 rounded-xl mt-2">
                          <span className="text-slate-800 uppercase">Outstanding Outstanding Balance</span>
                          <span className="text-rose-600 font-black">₹{monthlyBill.remainingAmount.toLocaleString()}</span>
                        </div>
                      </div>
 
                      <div className="mt-4 text-[9px] font-bold text-slate-400 uppercase tracking-wider text-right">
                        Statement Due Date: {formatDate(monthlyBill.dueDate)}
                      </div>
                    </Card>
 
                    {/* Settle Portal */}
                    {monthlyBill.remainingAmount > 0 ? (
                      <Card className="p-6 shadow-sm border border-slate-100 bg-white rounded-2xl">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Settle Rent Statement</h3>
                        
                        {paymentSuccess && (
                          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-semibold text-emerald-800">
                            {paymentSuccess}
                          </div>
                        )}

                        {/* Stay Renewal Choices */}
                        <div className="mb-5 p-4 rounded-xl border border-slate-200/60 bg-slate-50/40">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Select Residency Action</p>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setSuccess("Stay renewal option confirmed. Complete payment below to extend cycle.")
                                setError("")
                              }}
                              className="p-3 bg-white border border-blue-500 rounded-xl text-left shadow-sm flex flex-col justify-between hover:border-blue-600 transition-all active:scale-98 cursor-pointer"
                            >
                              <div>
                                <Zap size={14} className="text-blue-500" />
                                <p className="text-[8px] font-bold text-blue-600 uppercase tracking-wider mt-1">Option A</p>
                                <p className="text-[11px] font-bold text-slate-800 mt-0.5">Pay & Continue</p>
                              </div>
                              <p className="text-[8px] text-slate-400 mt-2 font-medium leading-tight">Pay statements to automatically renew stay contract.</p>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setCheckoutDate(new Date().toISOString().split('T')[0])
                                setCheckoutReason("")
                                setShowCheckoutModal(true)
                              }}
                              className="p-3 bg-white border border-slate-200 hover:border-rose-455 rounded-xl text-left shadow-sm flex flex-col justify-between transition-all active:scale-98 cursor-pointer hover:border-rose-300"
                            >
                              <div>
                                <LogOut size={14} className="text-rose-500" />
                                <p className="text-[8px] font-bold text-rose-500 uppercase tracking-wider mt-1">Option B</p>
                                <p className="text-[11px] font-bold text-slate-800 mt-0.5">Request Checkout</p>
                              </div>
                              <p className="text-[8px] text-slate-400 mt-2 font-medium leading-tight">Terminate cycles and schedule room inspection.</p>
                            </button>
                          </div>
                        </div>
 
                        <div className="space-y-4">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-0.5">Payment Method</label>
                            <select
                              value={payMethod}
                              onChange={(e) => setPayMethod(e.target.value as any)}
                              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-600 font-semibold text-xs outline-none cursor-pointer text-slate-800"
                            >
                              <option value="UPI">UPI QR Reference (Hand-verified scan)</option>
                              <option value="CASH">Offline Cash Settlement</option>
                            </select>
                          </div>
                          {payMethod === 'UPI' ? (
                            <motion.div 
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center gap-3"
                            >
                              <div className="flex flex-col items-center gap-1.5">
                                <div className="w-28 h-28 bg-white p-1 rounded-lg border border-slate-200 shadow-inner flex items-center justify-center relative overflow-hidden">
                                  <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`upi://pay?pa=6386227501@axl&pn=${encodeURIComponent("Rabab Stay")}&am=${monthlyBill.remainingAmount}&cu=INR&tn=${encodeURIComponent(`Rent ${monthlyBill.month || ''}`)}`)}`}
                                    alt="Scan to Pay Dues"
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                                <span className="text-[8px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full animate-pulse border border-blue-100/50 mt-1">
                                  Pay ₹{monthlyBill.remainingAmount.toLocaleString()}
                                </span>
                              </div>
                              <div className="space-y-3 text-xs w-full text-center">
                                <p className="font-bold text-slate-800">Scan & Complete Payment</p>
                                <p className="text-[9px] text-slate-400 font-semibold leading-relaxed">
                                  Complete UPI scan or pay to address: <span className="font-bold text-blue-600 bg-blue-50 px-1 py-0.5 rounded">6386227501@axl</span>.
                                </p>
                                
                                <div className="pt-1 text-left space-y-1">
                                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-0.5">UPI Ref Number / UTR</label>
                                  <input
                                    type="text"
                                    value={utrNumber}
                                    onChange={(e) => setUtrNumber(e.target.value)}
                                    placeholder="Enter 12-digit transaction UTR"
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-600 font-semibold text-[11px] outline-none text-slate-800"
                                  />
                                </div>
                              </div>
                            </motion.div>
                          ) : (
                            <motion.div 
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2"
                            >
                              <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">Offline Cash Settlement</p>
                              <p className="text-[9px] text-slate-400 font-semibold leading-relaxed">
                                Settle cycle dues directly at the hostel information office. Hand over the outstanding balances to the building warden.
                              </p>
                              <div className="space-y-1 pt-1">
                                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-0.5">Handover Notes</label>
                                <input
                                  type="text"
                                  value={paymentNotes}
                                  onChange={(e) => setPaymentNotes(e.target.value)}
                                  placeholder="E.g., handed over to warden"
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-600 font-semibold text-[11px] outline-none text-slate-800"
                                />
                              </div>
                            </motion.div>
                          )}
  
                          <button
                            onClick={handleProcessPayment}
                            disabled={payingLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-bold tracking-wider text-[10px] uppercase h-10 mt-2 rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all"
                          >
                            {payingLoading ? (
                              <>
                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Processing...</span>
                              </>
                            ) : (
                               <span>Notify Payment Complete</span>
                            )}
                          </button>
                        </div>
                      </Card>
                    ) : (
                      <Card className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl shadow-sm text-center flex flex-col items-center">
                        <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2">
                          <CheckCircle2 size={20} />
                        </div>
                        <h4 className="text-sm font-bold text-emerald-950 uppercase tracking-wider">Statement Fully Settled</h4>
                        <p className="text-[10px] text-emerald-700 font-medium mt-0.5 max-w-xs">
                          Outstanding rental amounts for this statement cycle have been fully paid.
                        </p>
                      </Card>
                    )}
                  </div>
                ) : (
                  <Card className="p-16 text-center border border-slate-200 shadow-sm bg-white rounded-2xl">
                    <FileText className="mx-auto text-slate-350" size={32} />
                    <h3 className="text-sm font-bold text-slate-850 uppercase tracking-widest mt-4">No Statement Prepared</h3>
                    <p className="text-xs text-slate-400 font-semibold mt-1">There is no active rent statement prepared for this month cycle.</p>
                  </Card>
                )}
              </motion.div>
            )}
 
            {/* PANEL 3: Bills History Timeline tab */}
            {activeTab === 'history' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="p-6 shadow-sm border border-slate-100 bg-white rounded-2xl">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Invoice Ledger History</h3>
                  {billsHistory.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs font-semibold uppercase tracking-wider">
                      No past rent statement ledger records found.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-150">
                            <th className="pb-3 font-bold">Month</th>
                            <th className="pb-3 text-right font-bold">Rent</th>
                            <th className="pb-3 text-right font-bold">Electricity</th>
                            <th className="pb-3 text-right font-bold">Other</th>
                            <th className="pb-3 text-right font-bold">Total</th>
                            <th className="pb-3 text-center font-bold">Settle Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                          {billsHistory.map((bill) => (
                            <tr key={bill.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-3.5 font-bold text-slate-800">{bill.month}</td>
                              <td className="py-3.5 text-right font-bold">₹{bill.rentAmount.toLocaleString()}</td>
                              <td className="py-3.5 text-right font-bold">₹{bill.electricityAmount.toLocaleString()}</td>
                              <td className="py-3.5 text-right font-bold">₹{bill.extraCharges.toLocaleString()}</td>
                              <td className="py-3.5 text-right text-blue-650 font-extrabold">₹{bill.totalDue.toLocaleString()}</td>
                              <td className="py-3.5 text-center">
                                <Badge variant={bill.isPaid ? "success" : "danger"} size="sm" className="text-[7px] px-2 font-bold uppercase tracking-wider">
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
              </motion.div>
            )}
 
            {/* PANEL 4: Support Chat tab */}
            {activeTab === 'messages' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="p-0 shadow-xl border border-slate-200/80 bg-white rounded-2xl flex flex-col h-[520px] overflow-hidden">
                  {/* Chat header */}
                  <div className="bg-[#075e54] text-white p-3.5 px-4 flex items-center justify-between shadow-md z-10 shrink-0 select-none">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-teal-600/70 border border-teal-500/20 text-white font-bold flex items-center justify-center text-xs shadow-sm relative font-sans">
                        WS
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#075e54] rounded-full animate-pulse"></span>
                      </div>
                      <div>
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-white">
                          Hostel Support Desk
                        </h4>
                        <p className="text-[9px] text-teal-150/90 font-medium">Online Direct Resident Chat</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-teal-800/40 border border-teal-700/50 px-3 py-1 rounded-full text-[8.5px] font-extrabold uppercase tracking-wider text-teal-100">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                      <span>Connected</span>
                    </div>
                  </div>
   
                  {/* Message logs list */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#efeae2] relative custom-scrollbar">
                    {messages.length === 0 ? (
                      <div className="h-full flex items-center justify-center flex-col text-slate-400 text-center px-6 space-y-2">
                        <MessageSquare size={28} className="text-slate-350" />
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Support Chat Empty</p>
                        <p className="text-[9px] text-slate-500 font-semibold uppercase max-w-xs leading-relaxed">
                          Ask accommodation concerns or cycle discrepancies. The managers will reply directly here.
                        </p>
                      </div>
                    ) : (
                      messages.map((msg: any) => {
                        // Loose/String inequality check to prevent UUID vs Integer mismatch bugs
                        const isWarden = msg.sender?.role === "ADMIN" || String(msg.senderId) !== String(user?.id)
                        return (
                          <div key={msg.id} className={`flex w-full ${isWarden ? 'justify-start' : 'justify-end'} mb-1`}>
                            {/* Premium WhatsApp Speech Bubble */}
                            <div className={`max-w-[72%] px-3 py-1.5 pb-5 rounded-xl shadow-sm text-xs font-medium leading-relaxed relative ${
                              isWarden 
                                ? 'bg-white text-slate-800 rounded-tl-none border border-slate-200/40' 
                                : 'bg-[#dcf8c6] text-slate-850 rounded-tr-none'
                            }`}>
                              {isWarden && (
                                <p className="text-[8px] font-bold text-teal-700 uppercase tracking-wider mb-0.5">Warden Support</p>
                              )}
                              <p className="break-words whitespace-pre-wrap pr-10 text-[12px] font-medium leading-normal">{msg.content}</p>
                              
                              {/* Bottom-right inline timestamp + read receipts */}
                              <div className="absolute bottom-0.5 right-1.5 flex items-center gap-1 select-none">
                                <span className="text-[8px] text-slate-400 font-bold tracking-normal font-mono">
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className="flex items-center">
                                  {msg.isRead ? (
                                    <CheckCheck size={11} className="text-[#53bdeb] stroke-[2.5]" />
                                  ) : (
                                    <CheckCheck size={11} className="text-[#8696a0] stroke-[2.5]" />
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                    <div ref={chatEndRef} />
                  </div>
   
                  {/* Chat input */}
                  <form onSubmit={handleSendSupportMessage} className="p-3 border-t border-slate-100 bg-[#f0f0f0] flex items-center gap-2">
                    <input
                      type="text"
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      placeholder="Type a support concern..."
                      className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-full text-xs font-semibold outline-none focus:border-slate-350 text-slate-800 placeholder:text-slate-400 shadow-sm"
                    />
                    <button
                      type="submit"
                      disabled={sendingChat || !chatMessage.trim()}
                      className="w-9 h-9 rounded-full bg-[#00a884] hover:bg-[#008f72] text-white flex items-center justify-center disabled:opacity-50 active:scale-95 transition-all shadow-sm shrink-0 cursor-pointer"
                    >
                      <Send size={13} className="ml-0.5 text-white" />
                    </button>
                  </form>
                </Card>
              </motion.div>
            )}
 
            {/* PANEL 5: Notifications & Alerts tab */}
            {activeTab === 'notifications' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="p-6 shadow-sm border border-slate-100 bg-white rounded-2xl">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Bell size={14} className="text-slate-400" /> residency notifications
                      </h3>
                      <p className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">Stay alerts & residency notices</p>
                    </div>
                    <Badge variant="primary" size="md" className="font-bold text-[8px] uppercase tracking-wider">
                      {notifications.length} Statements
                    </Badge>
                  </div>
   
                  {notifications.length === 0 ? (
                    <div className="py-16 text-center border-2 border-dashed border-slate-100 rounded-2xl space-y-2">
                      <Bell className="mx-auto text-slate-300" size={32} />
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Timeline Inbox Clean</h4>
                      <p className="text-[9px] text-slate-400 font-semibold uppercase">You have no pending warnings or cycle updates.</p>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {notifications.map((notif: any) => {
                        const isHigh = notif.priority === 'HIGH'
                        const isBill = notif.type === 'BILL'
                        const isPayment = notif.type === 'PAYMENT'
                        
                        let accentColor = 'border-l-slate-400'
                        let icon = <Bell size={14} className="text-slate-500" />
                        if (isHigh) {
                          accentColor = 'border-l-rose-500 bg-rose-50/20'
                          icon = <AlertCircle size={14} className="text-rose-500" />
                        } else if (isBill) {
                          accentColor = 'border-l-amber-500 bg-amber-50/10'
                          icon = <FileText size={14} className="text-amber-500" />
                        } else if (isPayment) {
                          accentColor = 'border-l-emerald-500 bg-emerald-50/10'
                          icon = <Sparkles size={14} className="text-emerald-500 animate-pulse" />
                        }
   
                        return (
                          <div 
                            key={notif.id} 
                            className={`p-4 border border-slate-100 border-l-4 ${accentColor} rounded-xl flex gap-3.5 items-start hover:shadow-sm transition-all duration-200`}
                          >
                            <div className="p-2 bg-white shadow-sm border border-slate-50 rounded-lg flex-shrink-0">
                              {icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-2 flex-wrap">
                                <h4 className="text-xs font-bold text-slate-800 tracking-tight uppercase">
                                  {notif.title}
                                </h4>
                                <span className="text-[8px] text-slate-400 font-bold uppercase whitespace-nowrap mt-0.5">
                                  {formatDate(notif.createdAt)}
                                </span>
                              </div>
                              <p className="text-xs text-slate-550 font-medium mt-1 leading-relaxed">
                                {notif.message}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </Card>
              </motion.div>
            )}
          </div>

      </div>

      {/* Premium Custom Checkout Request Modal Overlay */}
      <AnimatePresence>
        {showCheckoutModal && activeBooking && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="relative overflow-hidden w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col gap-5 text-center"
            >
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="space-y-2 flex flex-col items-center">
                <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-500 rounded-xl flex items-center justify-center mb-1">
                  <LogOut size={24} className="animate-pulse" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">
                  Request Room Checkout
                </h2>
                <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest">
                  Room {activeBooking.room?.roomNumber || "N/A"} Residency Notice
                </p>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Are you absolutely sure you want to request checkout? This will notify administration to inspect your room and release your booking, stopping future billing statements.
              </p>

              <form onSubmit={handleSubmitCheckoutModal} className="space-y-4 text-left">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-0.5">
                      Expected Checkout Date
                    </label>
                    <input
                      type="date"
                      required
                      value={checkoutDate}
                      onChange={(e) => setCheckoutDate(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-600 transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-0.5">
                      Reason for Checking Out
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={checkoutReason}
                      onChange={(e) => setCheckoutReason(e.target.value)}
                      placeholder="Specify reason (e.g., course completion)"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-600 transition-colors resize-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    type="submit"
                    disabled={payingLoading}
                    className="flex-1 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-500/50 text-white font-bold text-xs h-11 rounded-xl active:scale-98 transition-all duration-200 cursor-pointer shadow-sm flex items-center justify-center"
                  >
                    {payingLoading ? "Submitting..." : "Confirm Checkout"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCheckoutModal(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs h-11 rounded-xl active:scale-98 transition-all duration-200 cursor-pointer flex items-center justify-center"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default RenterMonthlyDashboard
