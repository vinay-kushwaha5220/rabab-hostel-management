import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContextV2"
import api from "../services/apiV2"
import { billingService } from "../services/billingService"
import type { MonthlyBill } from "../types/billing"
import type { BookingType } from "../types/booking"
import Badge from "../components/ui/Badge"

// Normalize monthly renter status to a clean display label
const normalizeMonthlyStatus = (status?: string): string => {
  if (!status) return 'ACTIVE'
  switch (status) {
    case 'RENEWAL_PENDING':
    case 'PENDING_ADMIN_APPROVAL':
    case 'STAY_CONTINUED':
    case 'PENDING_PAYMENT': return 'PAYMENT PENDING'
    case 'CONTINUE_REQUESTED': return 'RENEWAL REQUESTED'
    case 'CHECKOUT_PENDING':
    case 'CHECKOUT_REQUESTED': return 'CHECKOUT REQUESTED'
    case 'DUE_SOON': return 'DUE SOON'
    case 'EXPIRES_TODAY': return 'EXPIRES TODAY'
    case 'OVERDUE': return 'OVERDUE'
    case 'CHECKED_OUT': return 'CHECKED OUT'
    default: return status.replace(/_/g, ' ')
  }
}

const getMonthlyStatusBadgeVariant = (status?: string): 'success' | 'warning' | 'danger' | 'secondary' | 'info' | 'primary' => {
  if (!status) return 'success'
  switch (status) {
    case 'ACTIVE': return 'success'
    case 'DUE_SOON': return 'warning'
    case 'EXPIRES_TODAY': return 'warning'
    case 'RENEWAL_PENDING':
    case 'PENDING_ADMIN_APPROVAL':
    case 'STAY_CONTINUED':
    case 'PENDING_PAYMENT':
    case 'CONTINUE_REQUESTED': return 'warning'
    case 'OVERDUE': return 'danger'
    case 'CHECKOUT_PENDING':
    case 'CHECKOUT_REQUESTED': return 'secondary'
    case 'CHECKED_OUT': return 'secondary'
    default: return 'info'
  }
}

const getMonthlyStatusNeedsAction = (status?: string): boolean => {
  if (!status) return false
  return ['DUE_SOON', 'EXPIRES_TODAY', 'RENEWAL_PENDING', 'PENDING_ADMIN_APPROVAL', 'STAY_CONTINUED', 'PENDING_PAYMENT', 'OVERDUE'].includes(status)
}

const UserDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [bookings, setBookings] = useState<BookingType[]>([])
  const [loading, setLoading] = useState(true)
  const [billingData, setBillingData] = useState<any>(null)
  const [allBills, setAllBills] = useState<MonthlyBill[]>([])

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
          <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-widest">Loading Portal</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-50">
      
      {/* ─── Compact Dark Hero Header ─── */}
      <div className="relative px-4 pt-5 pb-28 sm:pb-24 overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[200px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 max-w-xl mx-auto">
          {/* Greeting */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] text-blue-400 font-bold uppercase tracking-[0.2em] mb-0.5">Rabab Stay</p>
              <h1 className="text-lg font-extrabold text-white tracking-tight">
                Hey, {user?.name.split(' ')[0]} 👋
              </h1>
            </div>
            <div className="flex items-center gap-1.5 bg-white/5 backdrop-blur-sm border border-white/10 px-2.5 py-1 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[8px] font-bold text-emerald-300 uppercase tracking-wider">Active</span>
            </div>
          </div>

          {/* ─── Mini Stat Chips ─── */}
          <div className="flex gap-2 mt-4 overflow-x-auto scrollbar-none pb-1">
            <div className="flex-shrink-0 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2 min-w-0">
              <p className="text-[7px] font-bold text-slate-400 uppercase tracking-wider">Stays</p>
              <p className="text-sm font-extrabold text-white mt-0.5">{activeBookings.length}</p>
            </div>
            <div className="flex-shrink-0 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2 min-w-0">
              <p className="text-[7px] font-bold text-slate-400 uppercase tracking-wider">Invoices</p>
              <p className="text-sm font-extrabold text-white mt-0.5">{allBills.length}</p>
            </div>
            <div className="flex-shrink-0 bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 backdrop-blur-md border border-emerald-400/20 rounded-xl px-3 py-2 flex-1 min-w-[100px]">
              <p className="text-[7px] font-bold text-emerald-400 uppercase tracking-wider">Paid</p>
              <p className="text-sm font-extrabold text-emerald-300 mt-0.5">₹{totalPaid.toLocaleString()}</p>
            </div>
            <div className="flex-shrink-0 bg-gradient-to-r from-purple-500/10 to-purple-500/5 backdrop-blur-md border border-purple-400/20 rounded-xl px-3 py-2 flex-1 min-w-[100px]">
              <p className="text-[7px] font-bold text-purple-400 uppercase tracking-wider">Total</p>
              <p className="text-sm font-extrabold text-purple-300 mt-0.5">₹{totalSpent.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main Content (overlaps hero) ─── */}
      <div className="relative -mt-20 sm:-mt-16 z-20 px-3 sm:px-4 pb-8 max-w-xl mx-auto space-y-3">

        {/* ─── Current Invoice Card (Glassmorphism) ─── */}
        {bill && (
          <div className={`rounded-2xl p-4 border backdrop-blur-lg shadow-lg ${
            bill.status === 'OVERDUE' 
              ? 'bg-rose-950/80 border-rose-500/30 shadow-rose-900/20' 
              : bill.isPaid 
                ? 'bg-white border-slate-100 shadow-slate-200/50' 
                : 'bg-white border-slate-100 shadow-slate-200/50'
          }`}>
            {/* Invoice Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                  bill.status === 'OVERDUE' 
                    ? 'bg-rose-500/20 text-rose-400' 
                    : bill.isPaid 
                      ? 'bg-emerald-50 text-emerald-600' 
                      : 'bg-blue-50 text-blue-600'
                }`}>
                  {bill.isPaid ? '✓' : bill.status === 'OVERDUE' ? '⚠' : '📄'}
                </div>
                <div>
                  <h3 className={`text-[11px] font-extrabold uppercase tracking-wider ${
                    bill.status === 'OVERDUE' ? 'text-rose-200' : 'text-slate-800'
                  }`}>{bill.month}</h3>
                  <p className={`text-[8px] font-semibold uppercase tracking-wider ${
                    bill.status === 'OVERDUE' ? 'text-rose-400 animate-pulse' : 'text-slate-400'
                  }`}>
                    {bill.status === 'OVERDUE' ? 'Overdue Payment' : 'Monthly Invoice'}
                  </p>
                </div>
              </div>
              <Badge
                variant={
                  bill.status === 'OVERDUE' ? 'danger' 
                    : bill.isPaid ? 'success' 
                    : bill.status === 'PENDING' ? 'warning' 
                    : 'info'
                }
                size="sm"
                className="font-bold text-[7px] uppercase tracking-wider"
              >
                {bill.isPaid ? 'PAID' : bill.status?.replace('_', ' ')}
              </Badge>
            </div>

            {/* Compact Breakdown */}
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: 'Rent', value: bill.rentAmount, color: 'slate' },
                { label: 'Electric', value: bill.electricityAmount, color: 'slate' },
                { label: 'Extras', value: bill.extraCharges, color: 'slate' },
                { label: 'Total', value: bill.totalDue, color: bill.status === 'OVERDUE' ? 'rose' : 'blue' },
              ].map((item) => (
                <div key={item.label} className={`rounded-lg p-2 text-center ${
                  bill.status === 'OVERDUE' 
                    ? item.color === 'rose' ? 'bg-rose-500/20' : 'bg-white/5' 
                    : item.color === 'blue' ? 'bg-blue-50' : 'bg-slate-50'
                }`}>
                  <p className={`text-[7px] font-bold uppercase tracking-wider ${
                    bill.status === 'OVERDUE' ? 'text-rose-300/60' : `text-${item.color}-400`
                  }`}>{item.label}</p>
                  <p className={`text-[11px] font-extrabold mt-0.5 ${
                    bill.status === 'OVERDUE' 
                      ? item.color === 'rose' ? 'text-rose-300' : 'text-white/80'
                      : item.color === 'blue' ? 'text-blue-600' : 'text-slate-700'
                  }`}>₹{item.value?.toLocaleString()}</p>
                </div>
              ))}
            </div>

            {/* Due / Payment Action */}
            {bill.remainingAmount > 0 && (
              <button 
                onClick={() => navigate("/renter-monthly-dashboard?tab=bills")}
                className={`mt-3 w-full flex items-center justify-between p-2.5 rounded-xl border border-dashed transition-all active:scale-[0.98] ${
                  bill.status === 'OVERDUE' 
                    ? 'border-rose-400/40 bg-rose-500/10 hover:bg-rose-500/20' 
                    : 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50'
                }`}
              >
                <span className={`text-[9px] font-bold uppercase tracking-wider ${
                  bill.status === 'OVERDUE' ? 'text-rose-300' : 'text-emerald-600'
                }`}>
                  Due: ₹{bill.remainingAmount.toLocaleString()}
                </span>
                <span className={`text-[8px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${
                  bill.status === 'OVERDUE' ? 'text-rose-300' : 'text-emerald-700'
                }`}>
                  Pay Now →
                </span>
              </button>
            )}
          </div>
        )}

        {/* ─── Quick Actions Grid ─── */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: '🏠', label: 'Rooms', action: () => navigate("/rooms") },
            { icon: '📊', label: 'Bills', action: () => navigate("/renter-monthly-dashboard?tab=dashboard") },
            { icon: '💬', label: 'Chat', action: () => navigate("/renter-monthly-dashboard?tab=messages") },
            { icon: '⚙️', label: 'Settings', action: () => navigate("/settings") },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className="bg-white border border-slate-100 rounded-xl p-3 flex flex-col items-center gap-1.5 shadow-sm hover:shadow-md active:scale-95 transition-all duration-200 group"
            >
              <span className="text-lg group-hover:scale-110 transition-transform">{item.icon}</span>
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-slate-700">{item.label}</span>
            </button>
          ))}
        </div>

        {/* ─── Active Stay Card ─── */}
        {activeBookings.length > 0 && (
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-0.5">Active Stay</p>
            {activeBookings.map((booking) => {
              const bookingTotal = booking.bookingType === 'MONTHLY' && allBills.length > 0 
                ? allBills.reduce((sum, b) => sum + (b.totalDue || 0), 0) 
                : booking.totalAmount

              return (
                <div 
                  key={booking.id} 
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300"
                >
                  {/* Top color accent */}
                  <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500" />
                  
                  <div className="p-3.5">
                    {/* Room Info Row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                          {booking.bookingType === 'MONTHLY' && booking.monthlyRenter ? (
                            <Badge
                              variant={getMonthlyStatusBadgeVariant(booking.monthlyRenter.status)}
                              size="sm"
                              className="text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5"
                            >
                              {normalizeMonthlyStatus(booking.monthlyRenter.status)}
                            </Badge>
                          ) : (
                            <Badge
                              variant={booking.status === 'CONFIRMED' ? 'success' : 'warning'}
                              size="sm"
                              className="text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5"
                            >
                              {booking.status === 'PENDING' ? 'PENDING VERIFICATION' : booking.status}
                            </Badge>
                          )}
                          <Badge variant={booking.bookingType === 'MONTHLY' ? 'primary' : 'info'} size="sm" className="text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5">
                            {booking.bookingType}
                          </Badge>
                        </div>

                        {/* Status Action Banner for monthly renters needing attention */}
                        {booking.bookingType === 'MONTHLY' && booking.monthlyRenter && getMonthlyStatusNeedsAction(booking.monthlyRenter.status) && (
                          <div className="mt-1.5 flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1">
                            <span className="text-amber-500 text-xs flex-shrink-0">⚠️</span>
                            <p className="text-[8px] font-bold text-amber-700 uppercase tracking-wider">
                              {booking.monthlyRenter.status === 'OVERDUE'
                                ? 'Stay overdue — action required'
                                : booking.monthlyRenter.status === 'DUE_SOON' || booking.monthlyRenter.status === 'EXPIRES_TODAY'
                                  ? 'Stay expiring — renew to continue'
                                  : 'Renewal pending admin approval'}
                            </p>
                          </div>
                        )}

                        {/* Status banner for CONTINUE_REQUESTED */}
                        {booking.bookingType === 'MONTHLY' && booking.monthlyRenter?.status === 'CONTINUE_REQUESTED' && (
                          <div className="mt-1.5 flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-lg px-2 py-1">
                            <span className="text-blue-500 text-xs flex-shrink-0">🕐</span>
                            <p className="text-[8px] font-bold text-blue-700 uppercase tracking-wider">
                              Waiting for admin to approve renewal
                            </p>
                          </div>
                        )}
                        <h3 className="text-sm font-extrabold text-slate-800 tracking-tight truncate">
                          {booking.room?.title || "Room"}
                        </h3>
                        <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                          Room {booking.room?.roomNumber} · {booking.bookingId}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[7px] font-bold text-slate-400 uppercase tracking-wider">Total</p>
                        <p className="text-base font-extrabold text-emerald-600 tracking-tight">₹{bookingTotal.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Compact Date Row */}
                    <div className="flex items-center gap-2 mt-3 bg-slate-50/80 rounded-xl p-2">
                      <div className="flex-1 text-center border-r border-slate-200/60">
                        <p className="text-[7px] font-bold text-slate-400 uppercase tracking-wider">Check-in</p>
                        <p className="text-[10px] font-bold text-slate-700 mt-0.5">
                          {new Date(booking.checkInDate).toLocaleDateString("en-US", { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-slate-300">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </div>
                      <div className="flex-1 text-center border-r border-slate-200/60">
                        <p className="text-[7px] font-bold text-slate-400 uppercase tracking-wider">Check-out</p>
                        <p className="text-[10px] font-bold text-slate-700 mt-0.5">
                          {new Date(booking.checkOutDate).toLocaleDateString("en-US", { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <div className="flex-1 text-center">
                        <p className="text-[7px] font-bold text-slate-400 uppercase tracking-wider">Days</p>
                        <p className="text-[10px] font-bold text-slate-700 mt-0.5">{booking.totalDays}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-3">
                      {booking.bookingType === 'MONTHLY' ? (
                        <button
                          onClick={() => navigate("/renter-monthly-dashboard?tab=dashboard")}
                          className={`flex-1 text-[9px] font-bold uppercase tracking-wider py-2 rounded-xl active:scale-[0.97] transition-all shadow-sm ${
                            booking.monthlyRenter && getMonthlyStatusNeedsAction(booking.monthlyRenter.status)
                              ? 'bg-amber-600 text-white hover:bg-amber-700'
                              : booking.monthlyRenter?.status === 'CONTINUE_REQUESTED'
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-slate-900 text-white hover:bg-slate-800'
                          }`}
                        >
                          {booking.monthlyRenter && getMonthlyStatusNeedsAction(booking.monthlyRenter.status)
                            ? '⚠️ View Stay Status'
                            : booking.monthlyRenter?.status === 'CONTINUE_REQUESTED'
                              ? '🕐 Track Renewal'
                              : 'View Monthly Hub'}
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(`/booking-confirmation/${booking.id}`)}
                          className="flex-1 bg-slate-900 text-white text-[9px] font-bold uppercase tracking-wider py-2 rounded-xl hover:bg-slate-800 active:scale-[0.97] transition-all shadow-sm"
                        >
                          View Details
                        </button>
                      )}
                      <button
                        onClick={() => navigate("/renter-monthly-dashboard?tab=messages")}
                        className="flex-1 bg-slate-50 text-slate-700 text-[9px] font-bold uppercase tracking-wider py-2 rounded-xl border border-slate-200 hover:bg-slate-100 active:scale-[0.97] transition-all"
                      >
                        💬 Support
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ─── Monthly Bills History (Compact Timeline) ─── */}
        {allBills.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2 px-0.5">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Payment History</p>
              <button 
                onClick={() => navigate("/renter-monthly-dashboard?tab=history")}
                className="text-[8px] font-bold text-blue-600 uppercase tracking-wider hover:underline"
              >
                See All →
              </button>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
              {allBills.slice(0, 4).map((b) => (
                <div key={b.id} className="flex items-center gap-3 p-3 hover:bg-slate-50/50 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    b.isPaid 
                      ? 'bg-emerald-50 text-emerald-600' 
                      : b.status === 'OVERDUE' 
                        ? 'bg-rose-50 text-rose-600' 
                        : 'bg-amber-50 text-amber-600'
                  }`}>
                    {b.isPaid ? '✓' : b.status === 'OVERDUE' ? '!' : '⏳'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-slate-800 truncate">{b.month}</p>
                    <p className="text-[8px] text-slate-400 font-semibold">
                      Rent ₹{b.rentAmount.toLocaleString()} + ₹{b.electricityAmount.toLocaleString()} elec
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-[11px] font-extrabold ${b.isPaid ? 'text-emerald-600' : 'text-slate-800'}`}>
                      ₹{b.totalDue.toLocaleString()}
                    </p>
                    <p className={`text-[7px] font-bold uppercase tracking-wider ${
                      b.isPaid ? 'text-emerald-500' : b.status === 'OVERDUE' ? 'text-rose-500' : 'text-amber-500'
                    }`}>
                      {b.isPaid ? 'Paid' : b.status?.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Past Bookings ─── */}
        {pastBookings.length > 0 && (
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-0.5">Past Stays</p>
            <div className="space-y-2">
              {pastBookings.map((booking) => (
                <button
                  key={booking.id}
                  onClick={() => navigate(`/booking-confirmation/${booking.id}`)}
                  className="w-full bg-white/80 rounded-xl border border-slate-100 p-3 flex items-center gap-3 hover:bg-white active:scale-[0.98] transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-xs flex-shrink-0">
                    🏨
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-slate-700 truncate">{booking.room?.title || "Room"}</p>
                    <p className="text-[8px] text-slate-400 font-semibold">
                      {new Date(booking.checkInDate).toLocaleDateString("en-US", { month: 'short', day: 'numeric' })} — {new Date(booking.checkOutDate).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] font-bold text-slate-600">₹{booking.totalAmount.toLocaleString()}</p>
                    <Badge variant={booking.status === "COMPLETED" ? "secondary" : "danger"} size="sm" className="text-[6px] font-bold uppercase tracking-wider px-1 py-0">
                      {booking.status}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── Empty State ─── */}
        {bookings.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
            <div className="text-4xl mb-3">🏨</div>
            <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">No Bookings Yet</h3>
            <p className="text-[10px] text-slate-400 font-medium mt-1 mb-5">Start by exploring our available rooms</p>
            <button
              onClick={() => navigate("/rooms")}
              className="bg-slate-900 text-white px-5 py-2 rounded-xl hover:bg-slate-800 active:scale-95 transition-all font-bold text-[9px] uppercase tracking-wider shadow-md"
            >
              Explore Rooms
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

export default UserDashboard
