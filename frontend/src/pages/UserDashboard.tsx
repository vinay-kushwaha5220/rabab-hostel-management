import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Home,
  Calendar,
  CreditCard,
  MessageSquare,
  Settings,
  Clock,
  Building,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  Activity,
  History,
  Info
} from "lucide-react"
import api from "../services/apiV2"
import { billingService } from "../services/billingService"
import type { MonthlyBill } from "../types/billing"
import type { BookingType } from "../types/booking"

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
    if (activeBooking.status === 'PENDING') {
      if (activeBooking.paymentStatus === 'VERIFICATION_PENDING') {
        dashboardState = 'BOOKING_PENDING_VERIFICATION'
      } else {
        dashboardState = 'BOOKING_PENDING_PAYMENT'
      }
    } else {
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
        dashboardState = 'ACTIVE'
      }
    }
  }

  // Success confetti modal logic
  useEffect(() => {
    if (activeBooking && activeBooking.bookingType === 'MONTHLY') {
      const verifyKey = 'stay_verifying_' + activeBooking.id
      if (dashboardState === 'BOOKING_PENDING_VERIFICATION' || dashboardState === 'RENEWAL_PENDING_VERIFICATION') {
        localStorage.setItem(verifyKey, 'true')
      } else if (dashboardState === 'ACTIVE') {
        if (localStorage.getItem(verifyKey) === 'true') {
          setShowSuccessModal(true)
        }
        if (!bill) {
          localStorage.removeItem(verifyKey)
        }
      }
    }
  }, [activeBooking, dashboardState, bill])

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50/50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <p className="text-slate-400 text-xs font-semibold tracking-wider animate-pulse uppercase">Syncing Renter Profile...</p>
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
      return `Pay within ${graceDaysLeft} days to avoid late penalty fees.`
    } else if (graceDaysLeft === 0) {
      return 'Due today! Please settle now to avoid late fee penalties.'
    } else {
      return `Overdue by ${Math.abs(graceDaysLeft)} days.`
    }
  }

  const formatDate = (dateVal?: string | Date) => {
    if (!dateVal) return 'N/A'
    return new Date(dateVal).toLocaleDateString("en-US", {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 flex flex-col font-sans antialiased relative overflow-hidden pb-12">

      {/* Background Accent Glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-tr from-blue-600/5 to-indigo-600/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-indigo-600/5 to-purple-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Responsive Grid Container */}
      <div className="max-w-7xl mx-auto w-full px-4 py-8 sm:px-6 lg:px-8 relative z-10 flex-1 flex flex-col gap-6">

        {/* Welcome Section */}


        {/* ─── HERO STATUS ALERT CARDS ─── */}
        <div className="w-full">
          {dashboardState === 'ACTIVE' && activeBooking && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="relative overflow-hidden bg-gradient-to-br from-emerald-900/90 to-slate-900/95 border border-emerald-500/20 rounded-2xl p-6 shadow-lg shadow-slate-900/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-emerald-500/20 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    Active Stay
                  </span>
                  <span className="bg-slate-800 text-slate-400 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    {activeBooking.bookingType} Contract
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight leading-snug">
                  Your hostel stay is active and paid
                </h2>
                <p className="text-xs text-slate-300 font-medium">
                  Current stay cycle: <span className="text-white font-semibold">{formatDate(activeBooking.monthlyRenter?.currentCycleStart || activeBooking.checkInDate)}</span> &rarr; <span className="text-white font-semibold">{formatDate(activeBooking.monthlyRenter?.currentCycleEnd || activeBooking.checkOutDate)}</span>
                </p>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <button
                  onClick={() => navigate("/renter-monthly-dashboard?tab=dashboard")}
                  className="w-full md:w-auto bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs px-5 py-3 rounded-xl transition-all duration-200 shadow-sm flex items-center justify-center gap-1.5"
                >
                  View Monthly Bill
                  <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          )}

          {dashboardState === 'BOOKING_PENDING_PAYMENT' && activeBooking && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="relative overflow-hidden bg-gradient-to-br from-amber-900/90 to-slate-900/95 border border-amber-500/20 rounded-2xl p-6 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="bg-amber-500/10 text-amber-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-amber-500/20 flex items-center gap-1">
                    <Clock size={12} className="animate-spin" />
                    Verification in Progress
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">
                  Booking Submitted — Awaiting Admin Approval
                </h2>
                <p className="text-sm text-slate-300 mt-1">
                   Your booking request and payment have been received. Admin verification is in progress.
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-amber-400">₹{activeBooking.totalAmount.toLocaleString()}</span>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Initial Deposit & Rent</span>
                </div>
              </div>
              <button
                onClick={() => navigate(`/payment/${activeBooking.id}`)}
                className="w-full md:w-auto bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-6 py-3 rounded-xl transition-all duration-200 shadow-lg shadow-amber-500/10 flex items-center justify-center gap-1.5"
              >
                Continue Payment
                <ArrowRight size={14} />
              </button>
            </motion.div>
          )}

          {dashboardState === 'BOOKING_PENDING_VERIFICATION' && activeBooking && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="relative overflow-hidden bg-gradient-to-br from-amber-900/90 to-slate-900/95 border border-amber-500/20 rounded-2xl p-6 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="bg-amber-500/10 text-amber-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-amber-500/20 flex items-center gap-1">
                    <Clock size={12} className="animate-pulse" />
                    Verification Pending
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">
                  Admin Approval Pending
                </h2>
                <p className="text-xs text-slate-300 font-medium max-w-xl">
                  Your booking payment has been submitted and is currently awaiting admin approval. We will activate your stay details immediately once confirmed.
                </p>
              </div>
              <button
                onClick={() => navigate(`/booking-confirmation/${activeBooking.id}`)}
                className="w-full md:w-auto bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all duration-200 border border-slate-750 flex items-center justify-center gap-1.5"
              >
                Track Booking Details
              </button>
            </motion.div>
          )}

          {dashboardState === 'RENEWAL_PENDING_PAYMENT' && activeBooking && bill && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="relative overflow-hidden bg-gradient-to-br from-amber-900/90 to-slate-900/95 border border-amber-500/20 rounded-2xl p-6 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="bg-amber-500/10 text-amber-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-amber-500/20">
                    Action Required
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">
                  Monthly Renewal Payment Pending
                </h2>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-amber-400">₹{bill.remainingAmount.toLocaleString()}</span>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Due by {formatDate(bill.dueDate)}</span>
                </div>
                <p className="text-[11px] text-amber-400/90 font-medium">
                  {getDaysLeftText()}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <button
                  onClick={() => navigate("/renter-monthly-dashboard?tab=bills")}
                  className="w-full md:w-auto bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-5 py-3 rounded-xl transition-all duration-200 shadow-sm flex items-center justify-center gap-1.5"
                >
                  Pay Now
                </button>
                <button
                  onClick={() => navigate("/renter-monthly-dashboard?tab=dashboard")}
                  className="w-full md:w-auto bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs px-5 py-3 rounded-xl transition-all duration-200 border border-slate-750 flex items-center justify-center"
                >
                  Request Checkout
                </button>
              </div>
            </motion.div>
          )}

          {dashboardState === 'RENEWAL_PENDING_VERIFICATION' && activeBooking && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="relative overflow-hidden bg-gradient-to-br from-amber-900/90 to-slate-900/95 border border-amber-500/20 rounded-2xl p-6 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="bg-amber-500/10 text-amber-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-amber-500/20">
                    Awaiting Approval
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">
                  Renewal Payment Under Review
                </h2>
                <p className="text-xs text-slate-300 font-medium max-w-xl">
                  We've received your monthly stay continuation submission and are verifying details. Your cycles will update shortly.
                </p>
              </div>
              <button
                onClick={() => navigate("/renter-monthly-dashboard?tab=dashboard")}
                className="w-full md:w-auto bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all duration-200 border border-slate-750 flex items-center justify-center"
              >
                Track Stay Renewal
              </button>
            </motion.div>
          )}

          {dashboardState === 'OVERDUE' && activeBooking && bill && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="relative overflow-hidden bg-gradient-to-br from-rose-950/90 to-slate-900/95 border border-rose-500/20 rounded-2xl p-6 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="bg-rose-500/10 text-rose-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-rose-500/20 flex items-center gap-1.5">
                    <ShieldAlert size={12} className="animate-bounce" />
                    Overdue Account
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">
                  Rental Payment is Overdue
                </h2>
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-3xl font-black text-rose-400">₹{bill.remainingAmount.toLocaleString()}</span>
                  <span className="text-[9px] text-rose-300 font-bold uppercase tracking-wider bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">
                    Includes ₹{bill.latePenalty} penalty
                  </span>
                </div>
                <p className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">
                  ⚠️ A late penalty charge is active. Settle outstanding amount immediately.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <button
                  onClick={() => navigate("/renter-monthly-dashboard?tab=bills")}
                  className="w-full md:w-auto bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all duration-200 shadow-lg shadow-rose-500/15 flex items-center justify-center"
                >
                  Pay Now
                </button>
                <button
                  onClick={() => navigate("/renter-monthly-dashboard?tab=dashboard")}
                  className="w-full md:w-auto bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs px-5 py-3 rounded-xl transition-all duration-200 border border-slate-750 flex items-center justify-center"
                >
                  Request Checkout
                </button>
              </div>
            </motion.div>
          )}

          {dashboardState === 'CHECKOUT_REQUESTED' && activeBooking && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-slate-700 flex items-center gap-1">
                    <Info size={12} />
                    Pending Checkout
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">
                  Checkout Request Under Review
                </h2>
                <p className="text-xs text-slate-400 font-medium max-w-xl">
                  Your checkout request has been registered and is being reviewed by the administration. A final walkthrough and deposit settlement will be conducted shortly.
                </p>
              </div>
              <button
                onClick={() => navigate("/renter-monthly-dashboard?tab=dashboard")}
                className="w-full md:w-auto bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all duration-200 border border-slate-700 flex items-center justify-center"
              >
                Track Request
              </button>
            </motion.div>
          )}

          {dashboardState === 'CHECKOUT_CONFIRMED' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="relative overflow-hidden bg-white border border-slate-255/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Completed Stay
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Checkout Approved & Settled
                </h2>
                <p className="text-xs text-slate-500 font-medium max-w-xl">
                  Your contract has successfully completed, and your account balances are fully settled. Thank you for staying with us!
                </p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Checked out date: {pastBookings.length > 0 ? formatDate(pastBookings[0].checkOutDate) : 'N/A'}
                </p>
              </div>
              <button
                onClick={() => navigate("/rooms")}
                className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all duration-200 shadow-sm flex items-center justify-center"
              >
                Book a New Room
              </button>
            </motion.div>
          )}

          {dashboardState === 'NO_STAY' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-blue-100">
                    Welcome to Rabab Complex Stay
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  No Active Stay Found
                </h2>
                <p className="text-xs text-slate-500 font-medium max-w-xl">
                  You don't currently have an active room allocation or confirmed contract. Explore our modern rooms to submit your stay booking today!
                </p>
              </div>
              <button
                onClick={() => navigate("/rooms")}
                className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all duration-200 shadow-md shadow-blue-100 flex items-center justify-center gap-1.5"
              >
                Browse Rooms
                <ArrowRight size={14} />
              </button>
            </motion.div>
          )}
        </div>

        {/* ─── DUAL COLUMN CONTENT: STAY DETAILS VS ACTIONS & LEDGERS ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* LEFT COLUMN: Accommodation details and secondary stats */}
          <div className="lg:col-span-2 space-y-6">

            {/* CURRENT STAY DETAILS */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Home size={14} className="text-slate-400" />
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Accommodation details
                </h3>
              </div>
              {activeBooking ? (
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
                  <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    <div className="space-y-1 bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Building size={11} className="text-slate-400" /> Room number
                      </p>
                      <p className="text-base font-bold text-slate-800 mt-0.5">
                        Room {activeBooking.room?.roomNumber || "N/A"}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {activeBooking.room?.title || "Standard Room"}
                      </p>
                    </div>

                    <div className="space-y-1 bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Info size={11} className="text-slate-400" /> Stay class
                      </p>
                      <p className="text-base font-bold text-slate-800 mt-0.5 uppercase">
                        {activeBooking.room?.roomType || "Standard"}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Capacity: {activeBooking.room?.capacity || 1} Resident
                      </p>
                    </div>

                    <div className="space-y-1 bg-emerald-50/65 p-4 rounded-xl border border-emerald-100/80">
                      <p className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                        <Calendar size={11} className="text-emerald-500" /> Commencement date
                      </p>
                      <p className="text-base font-bold text-slate-800 mt-0.5">
                        {formatDate(activeBooking.checkInDate)}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Contract ID: #{activeBooking.bookingId}
                      </p>
                    </div>

                    {activeBooking.bookingType === 'MONTHLY' && activeBooking.monthlyRenter ? (
                      <div className="space-y-1 bg-amber-50/65 p-4 rounded-xl border border-amber-200/70">
                        <p className="text-[9px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                          <Activity size={11} className="text-amber-550 animate-pulse" /> Cycle dates
                        </p>
                        <p className="text-base font-bold text-slate-800 mt-0.5">
                          {formatDate(activeBooking.monthlyRenter.currentCycleStart)}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          Expires: {formatDate(activeBooking.monthlyRenter.currentCycleEnd)}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1 bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Calendar size={11} className="text-slate-400" /> Expected checkout
                        </p>
                        <p className="text-base font-bold text-slate-800 mt-0.5">
                          {formatDate(activeBooking.checkOutDate)}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          Total Stay: {activeBooking.totalDays} Days
                        </p>
                      </div>
                    )}

                  </div>

                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
                  <Building className="mx-auto text-slate-300" size={32} />
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mt-3">No Active Allocation</h4>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">Book an accommodation from our catalog to activate stay records.</p>
                </div>
              )}
            </div>

            {/* SECONDARY STAY STATS */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Activity size={14} className="text-slate-400" />
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Residency Metrics
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-4">

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all duration-200">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Total stays</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-bold text-slate-800">{bookings.length}</span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase">bookings</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all duration-200">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Total paid</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-bold text-emerald-600">₹{totalPaid.toLocaleString()}</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all duration-200">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Stay Valuation</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-bold text-indigo-600">₹{totalSpent.toLocaleString()}</span>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Actions, timelines, and archived lists */}
          <div className="space-y-6">

            {/* QUICK ACTIONS */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: <CreditCard size={18} className="text-indigo-500" />, label: 'View bills', action: () => navigate("/renter-monthly-dashboard?tab=dashboard") },
                  { icon: <Calendar size={18} className="text-amber-500" />, label: 'Renewals', action: () => navigate("/renter-monthly-dashboard?tab=bills") },
                  { icon: <MessageSquare size={18} className="text-blue-500" />, label: 'Support Desk', action: () => navigate("/renter-monthly-dashboard?tab=messages") },
                  { icon: <Settings size={18} className="text-slate-500" />, label: 'Settings', action: () => navigate("/settings") },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 rounded-xl p-4 flex flex-col items-center justify-center gap-2.5 shadow-sm active:scale-98 transition-all duration-200 cursor-pointer text-center group"
                  >
                    <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-white group-hover:shadow-inner transition-all duration-300">
                      {item.icon}
                    </div>
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest leading-none mt-0.5">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* INVOICES HISTORIC LEDGER LIST */}
            {allBills.length > 0 && (
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Billing history</h3>
                  <button
                    onClick={() => navigate("/renter-monthly-dashboard?tab=history")}
                    className="text-[9px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider transition-colors"
                  >
                    All Statements &rarr;
                  </button>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 shadow-sm">
                  {allBills.slice(0, 3).map((b) => (
                    <div key={b.id} className="flex items-center gap-3 p-3.5 hover:bg-slate-50 transition-colors">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center border text-xs font-bold flex-shrink-0 ${b.isPaid
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        : b.status === 'OVERDUE'
                          ? 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse'
                          : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                        {b.isPaid ? '✓' : b.status === 'OVERDUE' ? '!' : '⏳'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-700 truncate">{b.month}</p>
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 truncate">
                          Rent: ₹{b.rentAmount} | Elec: ₹{b.electricityAmount}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-xs font-bold ${b.isPaid ? 'text-emerald-600' : 'text-slate-800'}`}>
                          ₹{b.totalDue.toLocaleString()}
                        </p>
                        <p className={`text-[7px] font-bold uppercase tracking-widest mt-0.5 ${b.isPaid ? 'text-emerald-500' : b.status === 'OVERDUE' ? 'text-rose-500' : 'text-amber-500'
                          }`}>
                          {b.isPaid ? 'Settled' : b.status?.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ARCHIVED PAST STAYS LOGS */}
            {pastBookings.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Archived Stays</h3>
                <div className="space-y-2">
                  {pastBookings.slice(0, 2).map((booking) => (
                    <button
                      key={booking.id}
                      onClick={() => navigate(`/booking-confirmation/${booking.id}`)}
                      className="w-full bg-white hover:bg-slate-50/50 border border-slate-200 rounded-xl p-3.5 flex items-center gap-3 active:scale-98 transition-all duration-200 text-left shadow-sm group cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0">
                        <History size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-700 truncate">{booking.room?.title || "Shared Room"}</p>
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                          {new Date(booking.checkInDate).toLocaleDateString("en-US", { month: 'short', day: 'numeric' })} — {new Date(booking.checkOutDate).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold text-slate-700">₹{booking.totalAmount.toLocaleString()}</p>
                        <span className="inline-block text-[7px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full mt-0.5">
                          {booking.status}
                        </span>
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
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-auto">
        <span>© {new Date().getFullYear()} Rabab Complex Stay. Premium Residential Living.</span>
      </footer>

      {/* ─── INTERACTIVE MODAL OVERLAYS ─── */}
      <AnimatePresence>

        {/* 1. Backdrop-Blur Non-Closable Stay Expiry Modal Popup */}
        {isExpired && activeBooking && (
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
              className="relative overflow-hidden w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 text-center"
            >
              {/* Ambient background glow */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />

              <div className="space-y-2 flex flex-col items-center">
                <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-500 rounded-xl flex items-center justify-center mb-1">
                  <ShieldAlert size={24} className="animate-pulse" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">
                  Your Room Rent Has Expired
                </h2>
                <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest">
                  Room {activeBooking.room?.roomNumber || "N/A"} stay cycle complete
                </p>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-[10px] font-bold text-left leading-relaxed">
                  ⚠️ {error}
                </div>
              )}
              {success && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl text-[10px] font-bold text-left leading-relaxed">
                  ✓ {success}
                </div>
              )}

              {!showCheckoutForm ? (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Your monthly stay contract has officially expired. Please select whether you wish to request a stay renewal or submit checkout details.
                  </p>
                  <div className="flex flex-col gap-3">
                    <button
                      disabled={actionLoading}
                      onClick={handleRequestContinueStay}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-bold text-xs h-11 rounded-xl active:scale-98 transition-all duration-200 cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                    >
                      {actionLoading ? "Submitting..." : "Renew Stay Cycle"}
                    </button>
                    <button
                      disabled={actionLoading}
                      onClick={() => setShowCheckoutForm(true)}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs h-11 rounded-xl active:scale-98 transition-all duration-200 cursor-pointer flex items-center justify-center"
                    >
                      Request Checkout
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleRequestCheckout} className="space-y-4 text-left">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2 flex justify-between items-center">
                    <span>Specify Checkout Details</span>
                    <button
                      type="button"
                      onClick={() => setShowCheckoutForm(false)}
                      className="text-[9px] font-extrabold text-blue-600 hover:underline uppercase"
                    >
                      &larr; Back
                    </button>
                  </h3>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-0.5">
                        Expected Checkout Date
                      </label>
                      <input
                        type="date"
                        required
                        value={checkoutDate}
                        onChange={(e) => setCheckoutDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-600 transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-0.5">
                        Reason for Checking Out
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={checkoutReason}
                        onChange={(e) => setCheckoutReason(e.target.value)}
                        placeholder="Specify reason (e.g., job shift, course completion)"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-600 transition-colors resize-none placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-rose-500/50 text-white font-bold text-xs h-11 rounded-xl active:scale-98 transition-all duration-200 cursor-pointer mt-2 shadow-sm flex items-center justify-center"
                  >
                    {actionLoading ? "Submitting..." : "Confirm Room Checkout"}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* 2. Celebrate Payment Verified Success Modal */}
        {showSuccessModal && activeBooking && (() => {
          const mr = activeBooking.monthlyRenter
          const cycleStart = mr?.currentCycleStart || activeBooking.checkInDate
          const cycleEnd = mr?.currentCycleEnd || activeBooking.checkOutDate
          const isFirstBooking = !bill || bill.isPaid
          return (
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
                className="relative overflow-hidden w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 text-center"
              >
                {/* Ambient background glow */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

                <div className="space-y-2 flex flex-col items-center">
                  <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 text-emerald-500 rounded-xl flex items-center justify-center mb-1">
                    <Sparkles size={24} className="animate-bounce" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-2 leading-tight">
                    Payment Verified
                  </h2>
                  <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">
                    {isFirstBooking ? 'Booking Confirmed! Welcome!' : 'Stay Renewed Successfully!'}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 text-left space-y-2.5 text-xs">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-400">Stay From:</span>
                      <span className="text-slate-700 font-bold">{formatDate(cycleStart)}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-400">Stay Until:</span>
                      <span className="text-slate-700 font-bold">{formatDate(cycleEnd)}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-400">Room Allocated:</span>
                      <span className="text-slate-700 font-bold">Room {activeBooking.room?.roomNumber}</span>
                    </div>
                    {mr?.rentAmount && (
                      <div className="flex justify-between font-semibold">
                        <span className="text-slate-400">Monthly Rent:</span>
                        <span className="text-emerald-600 font-black">₹{mr.rentAmount.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                    {isFirstBooking
                      ? 'Your booking payment has been verified by the administrator. Your stay is now active — enjoy your time at Rabab Complex Stay!'
                      : 'Your monthly payment has been verified by the administrator and your stay contract has been renewed for the next cycle. Enjoy your stay!'}
                  </p>

                  <button
                    onClick={() => {
                      localStorage.removeItem('stay_verifying_' + activeBooking.id)
                      setShowSuccessModal(false)
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-11 rounded-xl active:scale-98 transition-all duration-200 cursor-pointer shadow-sm flex items-center justify-center"
                  >
                    Awesome, thanks!
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )
        })()}

      </AnimatePresence>
    </div>
  )
}

export default UserDashboard
