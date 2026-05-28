import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../services/apiV2"
import { billingService } from "../services/billingService"
import type { MonthlyBill } from "../types/billing"
import type { BookingType } from "../types/booking"
import Badge from "../components/ui/Badge"

const UserDashboard = () => {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState<BookingType[]>([])
  const [loading, setLoading] = useState(true)
  const [billingData, setBillingData] = useState<any>(null)
  const [allBills, setAllBills] = useState<MonthlyBill[]>([])

  // Dynamic Stay Cycle Interactive Overlays States
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const [showCheckoutForm, setShowCheckoutForm] = useState(false)
  const [checkoutReason, setCheckoutReason] = useState("")
  const [checkoutDate, setCheckoutDate] = useState("")
  const [actionLoading, setActionLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  useEffect(() => {
    fetchMyBookings()
    fetchBillingData()
    fetchAllBills()
  }, [])

  const fetchBillingData = async () => {
    try {
      const response = await api.get("/monthly-bills/renter/dashboard")
      setBillingData(response.data)
    } catch (err) {
      console.error("Failed to fetch billing data:", err)
    }
  }

  const fetchAllBills = async () => {
    try {
      const data = await billingService.getRenterBills()
      setAllBills(data)
    } catch (err) {
      console.error("Failed to fetch all bills:", err)
    }
  }

  const fetchMyBookings = async () => {
    try {
      const response = await api.get("/bookings/my-bookings")
      setBookings(response.data)
    } catch (error) {
      console.error("Error fetching bookings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRequestContinueStay = async () => {
    try {
      setActionLoading(true)
      setError("")
      setSuccess("")
      const res = await billingService.requestContinueStay()
      setSuccess(res.message || "Stay renewal request submitted. Waiting for admin approval.")
      await fetchMyBookings()
      await fetchBillingData()
      await fetchAllBills()
    } catch (err: any) {
      console.error("Failed to request continue stay:", err)
      setError(err.response?.data?.message || "Failed to submit stay continuation request.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleRequestCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setActionLoading(true)
      setError("")
      setSuccess("")
      const res = await billingService.requestCheckoutNew({
        reason: checkoutReason,
        expectedCheckoutDate: checkoutDate
      })
      setSuccess(res.message || "Checkout request submitted. Awaiting admin approval.")
      setShowCheckoutForm(false)
      await fetchMyBookings()
      await fetchBillingData()
      await fetchAllBills()
    } catch (err: any) {
      console.error("Failed to request checkout:", err)
      setError(err.response?.data?.message || "Failed to submit checkout request.")
    } finally {
      setActionLoading(false)
    }
  }

  const activeBookings = bookings.filter(b => {
    if (b.bookingType === 'MONTHLY' && b.monthlyRenter) {
      return b.monthlyRenter.status !== 'CHECKED_OUT'
    }
    return b.status === 'CONFIRMED' || b.status === 'PENDING'
  })
  
  const pastBookings = bookings.filter(b => {
    if (b.bookingType === 'MONTHLY' && b.monthlyRenter) {
      return b.monthlyRenter.status === 'CHECKED_OUT'
    }
    return b.status === 'COMPLETED' || b.status === 'CANCELLED'
  })

  const totalSpent = allBills.length > 0 ? allBills.reduce((sum, b) => sum + (b.totalDue || 0), 0) : bookings.reduce((sum, b) => sum + b.totalAmount, 0)
  const totalPaid = allBills.reduce((sum, b) => sum + (b.paidAmount || 0), 0)
  const bill = billingData?.monthlyBill

  // Stay Status Evaluation Logic
  let dashboardState: 'NO_STAY' | 'ACTIVE' | 'BOOKING_PENDING_PAYMENT' | 'BOOKING_PENDING_VERIFICATION' | 'RENEWAL_PENDING_PAYMENT' | 'RENEWAL_PENDING_VERIFICATION' | 'OVERDUE' | 'CHECKOUT_REQUESTED' | 'CHECKOUT_CONFIRMED' = 'NO_STAY'
  const activeBooking = activeBookings[0]

  if (!activeBooking) {
    if (pastBookings.length > 0) {
      dashboardState = 'CHECKOUT_CONFIRMED'
    } else {
      dashboardState = 'NO_STAY'
    }
  } else {
    // If the booking itself is PENDING (not confirmed by admin yet)
    if (activeBooking.status === 'PENDING') {
      if (activeBooking.paymentStatus === 'VERIFICATION_PENDING') {
        dashboardState = 'BOOKING_PENDING_VERIFICATION'
      } else {
        dashboardState = 'BOOKING_PENDING_PAYMENT'
      }
    } else {
      // Booking is CONFIRMED, now check monthly renter or daily active status
      if (activeBooking.bookingType === 'MONTHLY' && activeBooking.monthlyRenter) {
        const mrStatus = activeBooking.monthlyRenter.status
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const cycleEnd = activeBooking.monthlyRenter.currentCycleEnd ? new Date(activeBooking.monthlyRenter.currentCycleEnd) : null
        if (cycleEnd) cycleEnd.setHours(0, 0, 0, 0)
        
        const hasUnpaid = bill && !bill.isPaid
        const dynamicExpired = cycleEnd && cycleEnd < today && hasUnpaid

        if ((mrStatus as string) === 'CHECKOUT_REQUESTED') {
          dashboardState = 'CHECKOUT_REQUESTED'
        } else if (mrStatus === 'CHECKED_OUT') {
          dashboardState = 'CHECKOUT_CONFIRMED'
        } else if (bill && !bill.isPaid && (bill.status === 'VERIFICATION_PENDING' || mrStatus === 'CONTINUE_REQUESTED' || mrStatus === 'PENDING_ADMIN_APPROVAL')) {
          dashboardState = 'RENEWAL_PENDING_VERIFICATION'
        } else if (dynamicExpired || (bill && !bill.isPaid && bill.status === 'OVERDUE')) {
          dashboardState = 'OVERDUE'
        } else if (bill && !bill.isPaid && (bill.status === 'PENDING' || bill.status === 'PARTIAL' || mrStatus === 'PENDING_PAYMENT' || mrStatus === 'DUE_SOON' || mrStatus === 'EXPIRES_TODAY')) {
          dashboardState = 'RENEWAL_PENDING_PAYMENT'
        } else {
          dashboardState = 'ACTIVE'
        }
      } else {
        // Daily stays confirmed
        dashboardState = 'ACTIVE'
      }
    }
  }

  // Trigger transition verification flag and success confetti modal
  // ONLY show the "Payment Verified" modal when transitioning from verification status to ACTIVE
  // (i.e. renter submitted payment, admin verified it). Do NOT show on fresh first-booking login.
  useEffect(() => {
    if (activeBooking && activeBooking.bookingType === 'MONTHLY') {
      const verifyKey = 'stay_verifying_' + activeBooking.id
      if (dashboardState === 'BOOKING_PENDING_VERIFICATION' || dashboardState === 'RENEWAL_PENDING_VERIFICATION') {
        // Renter has a bill in VERIFICATION_PENDING — mark that we're in verifying state
        localStorage.setItem(verifyKey, 'true')
      } else if (dashboardState === 'ACTIVE') {
        if (localStorage.getItem(verifyKey) === 'true') {
          // Transitioned from verification to ACTIVE — show success modal
          setShowSuccessModal(true)
        }
        // If there is no bill at all (brand-new booking just approved) — clear any stale flag silently
        // This prevents the modal from incorrectly firing on first-login after initial booking approval
        if (!bill) {
          localStorage.removeItem(verifyKey)
        }
      }
    }
  }, [activeBooking, dashboardState, bill])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest animate-pulse">Syncing Renter Profile...</p>
        </div>
      </div>
    )
  }

  const getIsExpired = () => {
    if (!activeBooking || activeBooking.bookingType !== 'MONTHLY' || !activeBooking.monthlyRenter?.currentCycleEnd) {
      return false
    }
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const cycleEnd = new Date(activeBooking.monthlyRenter.currentCycleEnd)
    cycleEnd.setHours(0, 0, 0, 0)

    const hasUnpaid = bill && !bill.isPaid
    return cycleEnd < today && hasUnpaid
  }
  const isExpired = getIsExpired()

  // Grace Days Calculation Helper
  const calculateGraceDaysLeft = () => {
    if (!bill?.dueDate) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(bill.dueDate)
    due.setHours(0, 0, 0, 0)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }
  const graceDaysLeft = calculateGraceDaysLeft()

  const getDaysLeftText = () => {
    if (graceDaysLeft === null) return ''
    if (graceDaysLeft > 0) {
      return `Pay within ${graceDaysLeft} days to avoid late penalty fee.`
    } else if (graceDaysLeft === 0) {
      return 'Due today! Settle now to avoid late fee penalty.'
    } else {
      return `Overdue by ${Math.abs(graceDaysLeft)} days.`
    }
  }

  // Formatting date helper
  const formatDate = (dateVal?: string | Date) => {
    if (!dateVal) return 'N/A'
    return new Date(dateVal).toLocaleDateString("en-US", { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased relative overflow-hidden">
      
      {/* Background Accent Glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-tr from-blue-600/10 to-indigo-600/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 animate-pulse duration-[8000ms]" />
      <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-purple-600/5 to-pink-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Responsive Grid Container */}
      <div className="max-w-6xl mx-auto w-full px-4 py-8 sm:px-6 lg:px-8 relative z-10 flex-1 flex flex-col gap-6">
        
        {/* ─── SECTION 1: DOMINATING HERO STATUS CARD ─── */}
        {dashboardState === 'ACTIVE' && activeBooking && (
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-950/80 via-slate-900/90 to-emerald-950/80 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-950/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-emerald-500/5 to-transparent pointer-events-none" />
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-500/20 flex items-center gap-1 shadow-inner shadow-emerald-500/5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  Checked In & Active
                </span>
                <span className="bg-slate-800 text-slate-300 text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {activeBooking.bookingType} CONTRACT
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">
                Your stay is active 🟢
              </h1>
              <p className="text-sm text-slate-300 font-medium">
                Cycle: <span className="text-white font-bold">{formatDate(activeBooking.monthlyRenter?.currentCycleStart || activeBooking.checkInDate)}</span> &rarr; <span className="text-white font-bold">{formatDate(activeBooking.monthlyRenter?.currentCycleEnd || activeBooking.checkOutDate)}</span>
              </p>
              <p className="text-xs text-emerald-400/90 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                ✨ You are fully paid for the current stay cycle. Enjoy your stay!
              </p>
            </div>
            <div className="flex items-center gap-3.5 self-stretch md:self-center">
              <button
                onClick={() => navigate("/renter-monthly-dashboard?tab=dashboard")}
                className="flex-1 md:flex-initial bg-white hover:bg-slate-100 text-slate-950 font-black text-[11px] uppercase tracking-wider px-6 py-3.5 rounded-2xl shadow-lg active:scale-95 duration-200 transition-all cursor-pointer text-center"
              >
                View Monthly Bill
              </button>
            </div>
          </div>
        )}

        {dashboardState === 'BOOKING_PENDING_PAYMENT' && activeBooking && (
          <div className="relative overflow-hidden bg-gradient-to-br from-amber-950/80 via-slate-900/90 to-amber-950/80 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-amber-950/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-amber-500/5 to-transparent pointer-events-none" />
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <span className="bg-amber-500/10 text-amber-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-amber-500/20 flex items-center gap-1 shadow-inner shadow-amber-500/5">
                  ⚠️ Action Required
                </span>
                <span className="bg-slate-800 text-slate-300 text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  BOOKING PENDING PAYMENT
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">
                Room Reserved — Awaiting Payment 🟠
              </h1>
              <div className="flex items-baseline gap-2.5">
                <span className="text-4xl font-black text-amber-400">₹{activeBooking.totalAmount.toLocaleString()}</span>
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Security Deposit & Rental Fee</span>
              </div>
              <p className="text-xs text-amber-400/90 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                ✨ Pay now to secure your stay and activate your room access!
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto self-stretch md:self-center">
              <button
                onClick={() => navigate(`/payment/${activeBooking.id}`)}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] uppercase tracking-wider px-7 py-4 rounded-2xl shadow-xl shadow-amber-500/10 active:scale-95 duration-200 transition-all cursor-pointer text-center"
              >
                Complete Payment
              </button>
            </div>
          </div>
        )}

        {dashboardState === 'BOOKING_PENDING_VERIFICATION' && activeBooking && (
          <div className="relative overflow-hidden bg-gradient-to-br from-amber-950/80 via-slate-900/95 to-amber-950/80 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-amber-950/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-amber-500/5 to-transparent pointer-events-none" />
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <span className="bg-amber-500/10 text-amber-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-amber-500/20 flex items-center gap-1 shadow-inner shadow-amber-500/5 animate-pulse">
                  ⏳ Awaiting Approval
                </span>
                <span className="bg-amber-500/10 text-amber-400 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border border-amber-500/20">
                  BOOKING PENDING VERIFICATION
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none flex items-center gap-2">
                Payment Verification Pending ⏳
              </h1>
              <p className="text-sm text-slate-300 font-medium leading-relaxed">
                Your initial booking payment is undergoing administrator verification.<br/>
                <span className="text-slate-400 text-xs font-semibold">Once verified, your contract will be finalized and stay activated.</span>
              </p>
            </div>
            <div className="flex items-center gap-3.5 self-stretch md:self-center">
              <button
                onClick={() => navigate(`/booking-confirmation/${activeBooking.id}`)}
                className="flex-1 md:flex-initial bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] uppercase tracking-wider px-6 py-3.5 rounded-2xl shadow-lg shadow-amber-500/10 active:scale-95 duration-200 transition-all cursor-pointer text-center animate-pulse"
              >
                Track Booking Details
              </button>
            </div>
          </div>
        )}

        {dashboardState === 'RENEWAL_PENDING_PAYMENT' && activeBooking && bill && (
          <div className="relative overflow-hidden bg-gradient-to-br from-amber-950/80 via-slate-900/90 to-amber-950/80 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-amber-950/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-amber-500/5 to-transparent pointer-events-none" />
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <span className="bg-amber-500/10 text-amber-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-amber-500/20 flex items-center gap-1 shadow-inner shadow-amber-500/5">
                  ⚠️ Action Required
                </span>
                <span className="bg-slate-800 text-slate-300 text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  RENEWAL PAYMENT PENDING
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">
                Renewal Stay Payment Required 🟠
              </h1>
              <div className="flex items-baseline gap-2.5">
                <span className="text-4xl font-black text-amber-400">₹{bill.remainingAmount.toLocaleString()}</span>
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Due by {formatDate(bill.dueDate)}</span>
              </div>
              <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                ⏰ {getDaysLeftText()}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto self-stretch md:self-center">
              <button
                onClick={() => navigate("/renter-monthly-dashboard?tab=bills")}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] uppercase tracking-wider px-7 py-4 rounded-2xl shadow-xl shadow-amber-500/10 active:scale-95 duration-200 transition-all cursor-pointer text-center"
              >
                Pay Now
              </button>
              <button
                onClick={() => navigate("/renter-monthly-dashboard?tab=dashboard")}
                className="flex-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 hover:text-white font-extrabold text-[11px] uppercase tracking-wider px-5 py-4 rounded-2xl active:scale-95 duration-200 transition-all cursor-pointer text-center"
              >
                Request Checkout
              </button>
            </div>
          </div>
        )}

        {dashboardState === 'RENEWAL_PENDING_VERIFICATION' && activeBooking && (
          <div className="relative overflow-hidden bg-gradient-to-br from-amber-950/80 via-slate-900/95 to-amber-950/80 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-amber-950/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-amber-500/5 to-transparent pointer-events-none" />
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <span className="bg-amber-500/10 text-amber-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-amber-500/20 flex items-center gap-1 shadow-inner shadow-amber-500/5 animate-pulse">
                  ⏳ Awaiting Approval
                </span>
                <span className="bg-amber-500/10 text-amber-400 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border border-amber-500/20">
                  RENEWAL PENDING VERIFICATION
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none flex items-center gap-2">
                Renewal Under Verification ⏳
              </h1>
              <p className="text-sm text-slate-300 font-medium leading-relaxed">
                We have received your renewal stay payment submission. Our administration is currently reviewing it. <br/>
                <span className="text-slate-400 text-xs font-semibold">Usually verified within a few minutes.</span>
              </p>
            </div>
            <div className="flex items-center gap-3.5 self-stretch md:self-center">
              <button
                onClick={() => navigate("/renter-monthly-dashboard?tab=dashboard")}
                className="flex-1 md:flex-initial bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] uppercase tracking-wider px-6 py-3.5 rounded-2xl shadow-lg shadow-amber-500/10 active:scale-95 duration-200 transition-all cursor-pointer text-center animate-pulse"
              >
                Track Stay Renewal
              </button>
            </div>
          </div>
        )}

        {dashboardState === 'OVERDUE' && activeBooking && bill && (
          <div className="relative overflow-hidden bg-gradient-to-br from-rose-950/80 via-slate-900/90 to-rose-950/80 border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-rose-950/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-rose-500/5 to-transparent pointer-events-none" />
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <span className="bg-rose-500/15 text-rose-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-rose-500/20 flex items-center gap-1 shadow-inner shadow-rose-500/5 animate-pulse">
                  🚨 Penalty Active
                </span>
                <span className="bg-slate-800 text-slate-300 text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  PAYMENT OVERDUE
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">
                Payment Overdue 🔴
              </h1>
              <div className="flex items-baseline gap-2.5 flex-wrap">
                <span className="text-4xl font-black text-rose-400">₹{bill.remainingAmount.toLocaleString()}</span>
                <span className="text-xs text-rose-400/95 font-bold uppercase tracking-wider bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-lg">
                  Incl. ₹{bill.latePenalty} late fee
                </span>
              </div>
              <p className="text-xs text-rose-400/90 font-bold uppercase tracking-widest leading-none">
                ⚠️ ₹10/day penalty is active. Settle immediately to keep stay active.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto self-stretch md:self-center">
              <button
                onClick={() => navigate("/renter-monthly-dashboard?tab=bills")}
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-black text-[11px] uppercase tracking-wider px-7 py-4 rounded-2xl shadow-xl shadow-rose-500/10 active:scale-95 duration-200 transition-all cursor-pointer text-center animate-bounce"
              >
                Pay Now
              </button>
              <button
                onClick={() => navigate("/renter-monthly-dashboard?tab=dashboard")}
                className="flex-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 hover:text-white font-extrabold text-[11px] uppercase tracking-wider px-5 py-4 rounded-2xl active:scale-95 duration-200 transition-all cursor-pointer text-center"
              >
                Request Checkout
              </button>
            </div>
          </div>
        )}

        {dashboardState === 'CHECKOUT_REQUESTED' && activeBooking && (
          <div className="relative overflow-hidden bg-gradient-to-br from-rose-950/80 via-slate-900/90 to-rose-950/80 border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-rose-950/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-rose-500/5 to-transparent pointer-events-none" />
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <span className="bg-rose-500/10 text-rose-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-rose-500/20 flex items-center gap-1 shadow-inner shadow-rose-500/5">
                  🏢 Under Admin Review
                </span>
                <span className="bg-slate-800 text-slate-300 text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  CHECKOUT PENDING
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">
                Checkout Request Submitted 🔴
              </h1>
              <p className="text-sm text-slate-300 font-medium leading-relaxed">
                Your checkout request is undergoing final review by our administrative team.<br/>
                <span className="text-slate-400 text-xs font-semibold">We will process your final security deposit settlement shortly.</span>
              </p>
            </div>
            <div className="flex items-center gap-3.5 self-stretch md:self-center">
              <button
                onClick={() => navigate("/renter-monthly-dashboard?tab=dashboard")}
                className="flex-1 md:flex-initial bg-rose-500 hover:bg-rose-600 text-white font-black text-[11px] uppercase tracking-wider px-6 py-3.5 rounded-2xl shadow-lg active:scale-95 duration-200 transition-all cursor-pointer text-center"
              >
                Track Request
              </button>
            </div>
          </div>
        )}

        {dashboardState === 'CHECKOUT_CONFIRMED' && (
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-blue-600/5 to-transparent pointer-events-none" />
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <span className="bg-slate-800 text-slate-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-slate-750 flex items-center gap-1 shadow-inner">
                  ✓ Stay Completed
                </span>
                <span className="bg-slate-950 text-slate-500 text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider border border-slate-850">
                  INACTIVE CONTRACT
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-100 tracking-tight leading-none">
                Checkout Approved 🔘
              </h1>
              <p className="text-sm text-slate-400 font-medium">
                Your stay has concluded and account ledger is fully settled. Thank you for staying with us!
              </p>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                Checked out date: {pastBookings.length > 0 ? formatDate(pastBookings[0].checkOutDate) : 'N/A'}
              </p>
            </div>
            <div className="flex items-center gap-3.5 self-stretch md:self-center">
              <button
                onClick={() => navigate("/rooms")}
                className="flex-1 md:flex-initial bg-white hover:bg-slate-100 text-slate-950 font-black text-[11px] uppercase tracking-wider px-6 py-3.5 rounded-2xl shadow-lg active:scale-95 duration-200 transition-all cursor-pointer text-center"
              >
                Rebook a Room
              </button>
            </div>
          </div>
        )}

        {dashboardState === 'NO_STAY' && (
          <div className="relative overflow-hidden bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-blue-600/5 to-transparent pointer-events-none" />
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-slate-200">
                  🏨 Welcome to Rabab Stay
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none">
                No Active Stay Found
              </h1>
              <p className="text-sm text-slate-600 font-medium">
                You don't have any active stay bookings on our property. Browse our rooms to get started today!
              </p>
            </div>
            <div className="flex items-center gap-3.5 self-stretch md:self-center">
              <button
                onClick={() => navigate("/rooms")}
                className="flex-1 md:flex-initial bg-slate-900 hover:bg-slate-800 text-white font-black text-[11px] uppercase tracking-wider px-6 py-3.5 rounded-2xl shadow-lg active:scale-95 duration-200 transition-all cursor-pointer text-center"
              >
                Explore Rooms
              </button>
            </div>
          </div>
        )}

        {/* ─── DUAL COLUMN CONTENT: STAY DETAILS VS ACTIONS & LEDGERS ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* LEFT COLUMN: Section 2 Stay Details Card (Occupies 2 cols on Desktop) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* SECTION 2: CURRENT STAY DETAILS */}
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5 px-1">
                🏡 Section 2: Current Stay Details
              </p>
              {activeBooking ? (
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-md relative overflow-hidden group">
                  <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-500/5 to-transparent pointer-events-none" />
                  
                  {/* Grid layout inside Stay Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    
                    <div className="space-y-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Allocated Room Number</p>
                      <p className="text-base font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                        <span>🏢</span> Room {activeBooking.room?.roomNumber || "N/A"}
                      </p>
                      <p className="text-[10px] text-slate-500 font-semibold">
                        {activeBooking.room?.title || "Standard Accommodation"}
                      </p>
                    </div>

                    <div className="space-y-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Accommodation Type</p>
                      <p className="text-base font-bold text-slate-800 mt-0.5 flex items-center gap-1.5">
                        <span>🏷️</span> {activeBooking.room?.roomType || "Standard AC"} stay
                      </p>
                      <p className="text-[10px] text-slate-500 font-semibold uppercase">
                        Capacity: {activeBooking.room?.capacity || 1} Resident
                      </p>
                    </div>

                    <div className="space-y-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Stay Commencement Date</p>
                      <p className="text-base font-bold text-slate-800 mt-0.5 flex items-center gap-1.5">
                        <span>📅</span> {formatDate(activeBooking.checkInDate)}
                      </p>
                      <p className="text-[10px] text-slate-500 font-semibold">
                        Contract Code: {activeBooking.bookingId}
                      </p>
                    </div>

                    {activeBooking.bookingType === 'MONTHLY' && activeBooking.monthlyRenter ? (
                      <div className="space-y-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Stay Cycle Dates</p>
                        <p className="text-base font-bold text-slate-800 mt-0.5 flex items-center gap-1.5">
                          <span>🔄</span> {formatDate(activeBooking.monthlyRenter.currentCycleStart)}
                        </p>
                        <p className="text-[10px] text-slate-500 font-semibold">
                          Expires: {formatDate(activeBooking.monthlyRenter.currentCycleEnd)}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Stay Checkout Date</p>
                        <p className="text-base font-bold text-slate-800 mt-0.5 flex items-center gap-1.5">
                          <span>📅</span> {formatDate(activeBooking.checkOutDate)}
                        </p>
                        <p className="text-[10px] text-slate-500 font-semibold">
                          Total Stay Length: {activeBooking.totalDays} days
                        </p>
                      </div>
                    )}

                    {activeBooking.bookingType === 'MONTHLY' && activeBooking.monthlyRenter && (
                      <div className="space-y-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 sm:col-span-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Next Invoice Due Date</p>
                        <p className="text-base font-bold text-amber-600 mt-0.5 flex items-center gap-1.5">
                          <span>🔔</span> {formatDate(activeBooking.monthlyRenter.dueDate)}
                        </p>
                        <p className="text-[10px] text-slate-500 font-semibold">
                          Autogeneration of invoice will happen on stay cycle end date.
                        </p>
                      </div>
                    )}

                  </div>

                </div>
              ) : (
                <div className="bg-white border border-slate-200/80 rounded-3xl p-8 text-center shadow-md relative overflow-hidden">
                  <span className="text-3xl">🛏️</span>
                  <h3 className="text-xs font-extrabold text-slate-600 uppercase tracking-widest mt-3">No Active Room Stay</h3>
                  <p className="text-[10px] text-slate-500 font-semibold mt-1">Settle a room booking from our room directory to see stays allocation details.</p>
                </div>
              )}
            </div>

            {/* SECTION 4: SMALL ANALYTICS CARDS */}
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5 px-1">
                📊 Section 4: Secondary Stays Analytics
              </p>
              <div className="grid grid-cols-3 gap-4">
                
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-md flex flex-col justify-between group hover:border-slate-300 duration-200 transition-all">
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Stay Count</span>
                    <span className="text-sm">🛏️</span>
                  </div>
                  <p className="text-xl font-black text-slate-800 mt-2 leading-none">{bookings.length}</p>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-md flex flex-col justify-between group hover:border-slate-300 duration-200 transition-all">
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Total Paid</span>
                    <span className="text-sm">💰</span>
                  </div>
                  <p className="text-xl font-black text-emerald-600 mt-2 leading-none">₹{totalPaid.toLocaleString()}</p>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-md flex flex-col justify-between group hover:border-slate-300 duration-200 transition-all">
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Valuation</span>
                    <span className="text-sm">💎</span>
                  </div>
                  <p className="text-xl font-black text-purple-600 mt-2 leading-none">₹{totalSpent.toLocaleString()}</p>
                </div>

              </div>
            </div>

          </div>
          
          {/* RIGHT COLUMN: Section 3 Quick Actions & History List (Occupies 1 col on Desktop) */}
          <div className="space-y-6">
            
            {/* SECTION 3: QUICK ACTIONS */}
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5 px-1">
                ⚡ Section 3: Quick Stay Actions
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: '🧾', label: 'View Bills', action: () => navigate("/renter-monthly-dashboard?tab=dashboard") },
                  { icon: '🔄', label: 'Stay Renewals', action: () => navigate("/renter-monthly-dashboard?tab=bills") },
                  { icon: '💬', label: 'Support Chat', action: () => navigate("/renter-monthly-dashboard?tab=messages") },
                  { icon: '⚙️', label: 'Settings', action: () => navigate("/settings") },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="bg-white border border-slate-200/80 hover:border-blue-500/50 hover:bg-blue-50/20 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-95 duration-200 transition-all group cursor-pointer text-center"
                  >
                    <span className="text-xl group-hover:scale-110 transition-transform duration-200">{item.icon}</span>
                    <span className="text-[9px] font-extrabold text-slate-500 group-hover:text-blue-600 uppercase tracking-widest leading-none mt-0.5">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Invoices Ledger mini overview history */}
            {allBills.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2 px-1">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Invoices History</p>
                  <button
                    onClick={() => navigate("/renter-monthly-dashboard?tab=history")}
                    className="text-[8px] font-extrabold text-blue-400 uppercase tracking-wider hover:underline"
                  >
                    All Invoices →
                  </button>
                </div>
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden divide-y divide-slate-200 shadow-md">
                  {allBills.slice(0, 3).map((b) => (
                    <div key={b.id} className="flex items-center gap-3 p-3.5 hover:bg-slate-50 transition-colors">
                      <div className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-inner ${
                        b.isPaid 
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
                          : b.status === 'OVERDUE' 
                            ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20' 
                            : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                      }`}>
                        {b.isPaid ? '✓' : b.status === 'OVERDUE' ? '!' : '⏳'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-slate-800 truncate">{b.month}</p>
                        <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider mt-0.5 truncate">
                          Rent: ₹{b.rentAmount} | Elec: ₹{b.electricityAmount}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-[11px] font-black ${b.isPaid ? 'text-emerald-600' : 'text-slate-800'}`}>
                          ₹{b.totalDue.toLocaleString()}
                        </p>
                        <p className={`text-[7px] font-extrabold uppercase tracking-widest mt-0.5 ${
                          b.isPaid ? 'text-emerald-600' : b.status === 'OVERDUE' ? 'text-rose-600' : 'text-amber-600'
                        }`}>
                          {b.isPaid ? 'Settled' : b.status?.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inactive stays logs panel */}
            {pastBookings.length > 0 && (
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Archived Stays</p>
                <div className="space-y-2">
                  {pastBookings.slice(0, 2).map((booking) => (
                    <button
                      key={booking.id}
                      onClick={() => navigate(`/booking-confirmation/${booking.id}`)}
                      className="w-full bg-slate-900/50 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 rounded-2xl p-4.5 flex items-center gap-3.5 active:scale-[0.98] duration-200 transition-all text-left shadow-lg group cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-850 group-hover:border-slate-750 flex items-center justify-center text-slate-400 text-lg flex-shrink-0 animate-none">
                        🏢
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-200 group-hover:text-white truncate">{booking.room?.title || "Shared Room"}</p>
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                          {new Date(booking.checkInDate).toLocaleDateString("en-US", { month: 'short', day: 'numeric' })} — {new Date(booking.checkOutDate).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[10px] font-black text-slate-300">₹{booking.totalAmount.toLocaleString()}</p>
                        <Badge variant={booking.status === "COMPLETED" ? "secondary" : "danger"} size="sm" className="text-[6px] font-extrabold uppercase tracking-wider px-1.5 py-0 mt-0.5">
                          {booking.status}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
      
      {/* Sticky Premium Dashboard Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 backdrop-blur-md py-6 text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-auto">
        <span>© {new Date().getFullYear()} Rabab Stay Hostel Management Inc. All Rights Reserved.</span>
      </footer>

      {/* ─── INTERACTIVE MODAL OVERLAYS ─── */}
      
      {/* 1. Backdrop-Blur Non-Closable Stay Expiry Modal Popup */}
      {isExpired && activeBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="relative overflow-hidden w-full max-w-md bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 text-center">
            {/* Ambient background glow */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="space-y-2">
              <span className="text-4xl inline-block animate-bounce duration-1000">🚨</span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-2 leading-tight">
                Your Room Rent Has Expired
              </h2>
              <p className="text-[10px] text-rose-400/90 font-bold uppercase tracking-widest">
                Room {activeBooking.room?.roomNumber || "N/A"} stay cycle complete
              </p>
            </div>

            {error && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl text-[10px] font-bold text-left leading-relaxed">
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-[10px] font-bold text-left leading-relaxed">
                ✓ {success}
              </div>
            )}

            {!showCheckoutForm ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  Your monthly stay contract has officially expired. Please select whether you wish to request a stay renewal or submit checkout details.
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    disabled={actionLoading}
                    onClick={handleRequestContinueStay}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-slate-950 font-black text-[11px] uppercase tracking-wider h-11 rounded-2xl active:scale-98 transition-all duration-200 cursor-pointer shadow-lg shadow-emerald-500/10 flex items-center justify-center"
                  >
                    {actionLoading ? "Submitting Request..." : "🏠 Continue Stay"}
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => setShowCheckoutForm(true)}
                    className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 font-extrabold text-[11px] uppercase tracking-wider h-11 rounded-2xl active:scale-98 transition-all duration-200 cursor-pointer flex items-center justify-center"
                  >
                    🚪 Checkout
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRequestCheckout} className="space-y-4 text-left">
                <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest border-b border-slate-850 pb-1.5 flex justify-between items-center">
                  <span>Specify Checkout Details</span>
                  <button
                    type="button"
                    onClick={() => setShowCheckoutForm(false)}
                    className="text-[9px] font-extrabold text-blue-400 hover:underline uppercase"
                  >
                    &larr; Back
                  </button>
                </h3>
                
                <div className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                      Expected Checkout Date
                    </label>
                    <input
                      type="date"
                      required
                      value={checkoutDate}
                      onChange={(e) => setCheckoutDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-semibold text-white outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                      Reason for Checking Out
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={checkoutReason}
                      onChange={(e) => setCheckoutReason(e.target.value)}
                      placeholder="Specify reason (e.g., job shift, course completion)"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-semibold text-white outline-none focus:border-blue-500 transition-colors resize-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-rose-500/50 text-white font-black text-[11px] uppercase tracking-wider h-11 rounded-2xl active:scale-98 transition-all duration-200 cursor-pointer mt-2 shadow-lg shadow-rose-500/10 flex items-center justify-center"
                >
                  {actionLoading ? "Submitting Checkout..." : "Confirm Room Checkout"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 2. Celebrate Payment Verified Confetti Success Modal */}
      {showSuccessModal && activeBooking && (() => {
        const mr = activeBooking.monthlyRenter
        const cycleStart = mr?.currentCycleStart || activeBooking.checkInDate
        const cycleEnd = mr?.currentCycleEnd || activeBooking.checkOutDate
        // Is this a first booking confirmation or a monthly renewal?
        const isFirstBooking = !bill || bill.isPaid
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="relative overflow-hidden w-full max-w-md bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 text-center">
              {/* Ambient background glow */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="space-y-2">
                <span className="text-4xl inline-block animate-bounce duration-1000">🎉</span>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-2 leading-tight">
                  Payment Verified
                </h2>
                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                  {isFirstBooking ? 'Booking Confirmed! Welcome!' : 'Stay Renewed Successfully!'}
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800 text-left space-y-2.5 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-500">Stay From:</span>
                    <span className="text-slate-200 font-bold">{formatDate(cycleStart)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-500">Stay Until:</span>
                    <span className="text-slate-200 font-bold">{formatDate(cycleEnd)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-500">Room Allocated:</span>
                    <span className="text-slate-200 font-bold">Room {activeBooking.room?.roomNumber}</span>
                  </div>
                  {mr?.rentAmount && (
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-500">Monthly Rent:</span>
                      <span className="text-emerald-400 font-black">₹{mr.rentAmount.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                  {isFirstBooking
                    ? 'Your booking payment has been verified by the administrator. Your stay is now active — enjoy your time at Rabab Stay!'
                    : 'Your monthly payment has been verified by the administrator and your stay contract has been renewed for the next cycle. Enjoy your stay!'}
                </p>

                <button
                  onClick={() => {
                    localStorage.removeItem('stay_verifying_' + activeBooking.id)
                    setShowSuccessModal(false)
                  }}
                  className="w-full bg-white hover:bg-slate-100 text-slate-950 font-black text-[11px] uppercase tracking-wider h-11 rounded-2xl active:scale-98 transition-all duration-200 cursor-pointer shadow-lg shadow-white/5 flex items-center justify-center"
                >
                  Awesome, thanks!
                </button>
              </div>
            </div>
          </div>
        )
      })()}

    </div>
  )
}

export default UserDashboard
