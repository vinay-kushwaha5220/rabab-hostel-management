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
  const [showRenewModal, setShowRenewModal] = useState(false)
  const [renewalPaymentMethod, setRenewalPaymentMethod] = useState("UPI")
  const [submittingRenewal, setSubmittingRenewal] = useState(false)
  const [renewalSuccess, setRenewalSuccess] = useState<string | null>(null)
  const [renewalError, setRenewalError] = useState<string | null>(null)
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

  const handleRequestRenewal = async () => {
    try {
      setSubmittingRenewal(true)
      setRenewalError(null)
      setRenewalSuccess(null)
      
      const response = await billingService.renewStay({
        paymentMethod: renewalPaymentMethod
      })
      
      setRenewalSuccess(response.message || "Stay renewal request submitted successfully!")
      
      setTimeout(async () => {
        await fetchDashboardData()
        await fetchBillHistory()
        setShowRenewModal(false)
        setRenewalSuccess(null)
      }, 1500)
    } catch (error: any) {
      console.error("❌ Error requesting stay renewal:", error)
      setRenewalError(error.response?.data?.message || "Failed to submit stay renewal request. Please try again.")
    } finally {
      setSubmittingRenewal(false)
    }
  }

  const [submittingCheckout, setSubmittingCheckout] = useState(false)

  const handleRequestCheckout = async () => {
    if (!window.confirm("Are you sure you want to checkout?\nYour stay access will end after admin approval.")) return
    try {
      setSubmittingCheckout(true)
      setRenewalError(null)
      setRenewalSuccess(null)
      
      const response = await billingService.requestCheckout()
      setRenewalSuccess(response.message || "Checkout request successfully submitted!")
      
      setTimeout(async () => {
        await fetchDashboardData()
        await fetchBillHistory()
        setRenewalSuccess(null)
      }, 2000)
    } catch (error: any) {
      console.error("❌ Error requesting checkout:", error)
      setRenewalError(error.response?.data?.message || "Failed to submit checkout request.")
      setTimeout(() => setRenewalError(null), 4000)
    } finally {
      setSubmittingCheckout(false)
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

  const monthlyRenter = activeBooking?.monthlyRenter
  const dueDateVal = monthlyRenter?.dueDate

  const formatDate = (dateInput: any) => {
    if (!dateInput) return "N/A"
    const date = new Date(dateInput)
    return date.toLocaleDateString("en-US", { day: "numeric", month: "short" })
  }

  const getValidityDetails = () => {
    if (!dueDateVal) {
      return {
        message: "No active validity found",
        cardColor: "bg-slate-50 border-slate-200 text-slate-700",
        indicatorColor: "bg-slate-300",
        badgeLabel: "Unknown",
        badgeVariant: "default" as any,
        diffDays: 0,
        isOverdue: false
      }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(dueDateVal)
    due.setHours(0, 0, 0, 0)

    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      const overdueDays = Math.abs(diffDays)
      return {
        message: `Overdue by ${overdueDays} days`,
        cardColor: "bg-rose-50/80 border border-rose-200/60 text-rose-900 shadow-sm shadow-rose-50/50",
        indicatorColor: "bg-rose-500 animate-pulse",
        badgeLabel: "OVERDUE",
        badgeVariant: "danger" as any,
        diffDays: overdueDays,
        isOverdue: true
      }
    } else if (diffDays === 0) {
      return {
        message: "Rent expires today",
        cardColor: "bg-amber-50/80 border border-amber-200/60 text-amber-900 shadow-sm shadow-amber-50/50",
        indicatorColor: "bg-amber-500 animate-pulse",
        badgeLabel: "EXPIRES TODAY",
        badgeVariant: "warning" as any,
        diffDays: 0,
        isOverdue: false
      }
    } else if (diffDays <= 4) {
      return {
        message: `Rent expires in ${diffDays} days`,
        cardColor: "bg-amber-50/70 border border-amber-200/50 text-amber-900 shadow-sm shadow-amber-50/50",
        indicatorColor: "bg-amber-500",
        badgeLabel: "DUE SOON",
        badgeVariant: "warning" as any,
        diffDays,
        isOverdue: false
      }
    } else if (diffDays <= 9) {
      return {
        message: `Rent expires in ${diffDays} days`,
        cardColor: "bg-yellow-50/60 border border-yellow-200/50 text-yellow-800 shadow-sm shadow-yellow-50/50",
        indicatorColor: "bg-yellow-500",
        badgeLabel: "DUE SOON",
        badgeVariant: "warning" as any,
        diffDays,
        isOverdue: false
      }
    } else {
      return {
        message: `${diffDays} Days Left`,
        cardColor: "bg-emerald-50/80 border border-emerald-200/60 text-emerald-900 shadow-sm shadow-emerald-50/50",
        indicatorColor: "bg-emerald-500",
        badgeLabel: "ACTIVE",
        badgeVariant: "success" as any,
        diffDays,
        isOverdue: false
      }
    }
  }

  const validity = getValidityDetails()

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

                {/* Dashboard Global Alerts (e.g. checkout submission feedback) */}
                {renewalSuccess && (
                  <div className="p-3 bg-emerald-50 border-l-4 border-emerald-600 rounded-xl text-xs font-bold text-emerald-800 animate-in fade-in duration-200">
                    ✅ {renewalSuccess}
                  </div>
                )}
                {renewalError && (
                  <div className="p-3 bg-rose-50 border-l-4 border-rose-600 rounded-xl text-xs font-bold text-rose-800 animate-in fade-in duration-200">
                    ⚠️ {renewalError}
                  </div>
                )}

                {/* Smart Reminder System (Step 7.5) */}
                {(() => {
                  if (!dueDateVal) return null
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  const due = new Date(dueDateVal)
                  due.setHours(0, 0, 0, 0)
                  const diffTime = due.getTime() - today.getTime()
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

                  if (diffDays < 0) {
                    return (
                      <div className="p-3 sm:p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 shadow-sm">
                        <span className="text-xl">🚨</span>
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider">Overdue Alert</h4>
                          <p className="text-[10px] sm:text-xs font-semibold text-rose-700 mt-0.5">Overdue by {Math.abs(diffDays)} days. Please renew stay or settle rent dues immediately.</p>
                        </div>
                      </div>
                    )
                  } else if (diffDays === 0) {
                    return (
                      <div className="p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800 shadow-sm animate-pulse">
                        <span className="text-xl">⚠️</span>
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider">Expiry Alert</h4>
                          <p className="text-[10px] sm:text-xs font-semibold text-amber-700 mt-0.5">Rent expires today! Settle dues to avoid stay suspension.</p>
                        </div>
                      </div>
                    )
                  } else if (diffDays === 2) {
                    return (
                      <div className="p-3 sm:p-4 bg-orange-50 border border-orange-200 rounded-2xl flex items-center gap-3 text-orange-850 shadow-sm">
                        <span className="text-xl">🛎️</span>
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider">Renewal Warning</h4>
                          <p className="text-[10px] sm:text-xs font-semibold text-orange-700 mt-0.5">Please renew your stay. Dues are expected in 2 days.</p>
                        </div>
                      </div>
                    )
                  } else if (diffDays === 7) {
                    return (
                      <div className="p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-2xl flex items-center gap-3 text-yellow-800 shadow-sm">
                        <span className="text-xl">🔔</span>
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider">Stay Validity Notice</h4>
                          <p className="text-[10px] sm:text-xs font-semibold text-yellow-750 mt-0.5">Your rent expires in 7 days.</p>
                        </div>
                      </div>
                    )
                  }
                  return null
                })()}

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
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-4">
            <div className="mb-2">
              <h1 className="text-xl font-black text-gray-900 tracking-tight">Rent Validity & Statements</h1>
              <p className="text-xs text-gray-400 font-medium">Manage your stay validity and billing invoices</p>
            </div>

            {/* Premium Mobile Recharge Validity Card */}
            {activeBooking && (
              <Card className={`p-4 rounded-2xl border ${validity.cardColor} relative overflow-hidden transition-all duration-300 hover:shadow-sm`}>
                <div className="absolute top-0 right-0 w-24 h-24 bg-current opacity-[0.02] rounded-bl-full pointer-events-none" />
                
                {/* Header */}
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">⚡</span>
                    <div>
                      <h3 className="text-[10px] font-extrabold uppercase tracking-widest opacity-80">Stay Validity</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${validity.indicatorColor} opacity-75`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${validity.indicatorColor}`}></span>
                    </span>
                    <Badge variant={validity.badgeVariant} size="sm" className="font-black text-[8px] uppercase tracking-wider px-2 py-0.5">
                      {validity.badgeLabel}
                    </Badge>
                  </div>
                </div>

                {/* Main Countdown displays */}
                <div className="my-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-y border-black/[0.04] py-3">
                  <div>
                    <span className="text-[9px] font-bold uppercase opacity-60 tracking-wider">Plan Status</span>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-0.5 flex items-baseline gap-1">
                      {validity.message}
                    </h2>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:text-right font-bold">
                    <div>
                      <span className="block opacity-65 text-[8px] font-bold uppercase tracking-wider">Room Number</span>
                      <span className="text-blue-600 font-extrabold text-sm">{activeBooking.room?.roomNumber || "N/A"}</span>
                    </div>
                    <div>
                      <span className="block opacity-65 text-[8px] font-bold uppercase tracking-wider">Monthly Rent</span>
                      <span className="text-gray-900 font-extrabold text-sm">₹{(monthlyRenter?.rentAmount || activeBooking.room?.monthlyPrice || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Sub details details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px] font-semibold opacity-90">
                  <div>
                    <span className="block text-[8px] font-bold uppercase tracking-widest opacity-60 mb-0.5">Current Stay Cycle</span>
                    <span className="text-gray-900 font-extrabold">
                      {formatDate(monthlyRenter?.currentCycleStart)} → {formatDate(monthlyRenter?.currentCycleEnd)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[8px] font-bold uppercase tracking-widest opacity-60 mb-0.5">Due Date</span>
                    <span className="text-gray-950 font-extrabold">
                      {monthlyRenter?.dueDate ? new Date(monthlyRenter.dueDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[8px] font-bold uppercase tracking-widest opacity-60 mb-0.5">Pending Amount</span>
                    <span className={`font-extrabold ${monthlyRenter?.pendingAmount > 0 ? "text-rose-600" : "text-gray-900"}`}>
                      ₹{(monthlyRenter?.pendingAmount || 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[8px] font-bold uppercase tracking-widest opacity-60 mb-0.5">Payment Status</span>
                    <span className="text-emerald-600 font-extrabold uppercase">
                      {monthlyRenter?.paymentStatus || "PAID"}
                    </span>
                  </div>
                </div>

                {/* Recharge action buttons */}
                <div className="mt-4 pt-3 border-t border-black/[0.04] flex flex-col sm:flex-row gap-2">
                  <button 
                    onClick={() => {
                      setRenewalError(null)
                      setRenewalSuccess(null)
                      setShowRenewModal(true)
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[9px] tracking-widest uppercase py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-blue-100 hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <span>⚡</span>
                    <span>Renew Stay (Extend Plan)</span>
                  </button>
                  <button 
                    onClick={handleRequestCheckout}
                    disabled={monthlyRenter?.status === "CHECKOUT_PENDING" || monthlyRenter?.status === "CHECKED_OUT" || submittingCheckout}
                    className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-extrabold text-[9px] tracking-widest uppercase py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>🏠</span>
                    <span>
                      {monthlyRenter?.status === "CHECKOUT_PENDING" ? "Checkout Request Pending" : (monthlyRenter?.status === "CHECKED_OUT" ? "Checked Out" : "Request Checkout")}
                    </span>
                  </button>
                </div>
              </Card>
            )}

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

      {/* Stay Renewal Modal (Business Rule 2, 6, 7) */}
      {showRenewModal && activeBooking && monthlyRenter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-100 shadow-2xl p-6 relative overflow-hidden animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setShowRenewModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl">⚡</div>
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight">Stay Renewal & Extension</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">PREPAID HOSTEL PLAN</p>
              </div>
            </div>

            {renewalSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2 py-6">
                <div className="text-emerald-500 text-3xl">✅</div>
                <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-widest">Request Submitted</h3>
                <p className="text-[11px] text-emerald-700 font-semibold">{renewalSuccess}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {renewalError && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-[11px] font-semibold text-rose-700 leading-relaxed">
                    ⚠️ {renewalError}
                  </div>
                )}

                {/* Anti-Cheating Cycle Preview (Business Rule 7) */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                  <div>
                    <span className="block text-[8px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">CURRENT STAY CYCLE</span>
                    <span className="text-[11px] font-extrabold text-slate-800">
                      {formatDate(monthlyRenter.currentCycleStart)} → {formatDate(monthlyRenter.currentCycleEnd)}
                    </span>
                  </div>
                  
                  <div className="pt-2 border-t border-slate-200/60">
                    <span className="block text-[8px] font-bold uppercase tracking-widest text-blue-500 mb-0.5">NEXT STAY CYCLE PREVIEW</span>
                    <span className="text-[11px] font-black text-blue-600">
                      {(() => {
                        const prevEnd = monthlyRenter.currentCycleEnd || monthlyRenter.joinDate
                        const nextStart = new Date(prevEnd)
                        nextStart.setDate(nextStart.getDate() + 1)
                        const nextEnd = new Date(nextStart)
                        nextEnd.setMonth(nextEnd.getMonth() + 1)
                        nextEnd.setDate(nextEnd.getDate() - 1)
                        return `${formatDate(nextStart.toISOString())} → ${formatDate(nextEnd.toISOString())}`
                      })()}
                    </span>
                    <p className="text-[9px] text-blue-500 font-semibold mt-0.5">🔒 Dates strictly continuing from previous cycle. No free days allowed.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                    <span className="block text-[8px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">MONTHLY RENT</span>
                    <span className="text-lg font-black text-slate-900">₹{monthlyRenter.rentAmount.toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                    <span className="block text-[8px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">SECURITY DEPOSIT</span>
                    <span className="text-xs font-black text-slate-500">₹{monthlyRenter.securityAmount.toLocaleString()} (Held)</span>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-2">
                  <span className="block text-[8px] font-bold uppercase tracking-widest text-slate-400">SELECT PAYMENT METHOD</span>
                  <div className="grid grid-cols-2 gap-2">
                    {['UPI', 'CASH'].map(m => (
                      <button 
                        key={m} 
                        type="button"
                        onClick={() => setRenewalPaymentMethod(m)} 
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${renewalPaymentMethod === m ? 'border-blue-600 bg-blue-50 text-blue-900' : 'border-slate-100 hover:border-slate-200 text-slate-500 bg-white'}`}
                      >
                        <span className="text-base">{m === 'UPI' ? '⚡' : '🏠'}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest">{m}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit buttons */}
                {monthlyRenter.paymentStatus === "PENDING_VERIFICATION" ? (
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-[10px] font-semibold text-amber-700 text-center">
                    ⏳ Stay renewal request is already pending admin verification.
                  </div>
                ) : (
                  <Button 
                    onClick={handleRequestRenewal} 
                    className="w-full py-3 text-[10px] font-black uppercase tracking-widest"
                    disabled={submittingRenewal}
                  >
                    {submittingRenewal ? "Submitting Request..." : `Pay ₹${monthlyRenter.rentAmount.toLocaleString()} & Renew Stay`}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default RenterMonthlyDashboard
