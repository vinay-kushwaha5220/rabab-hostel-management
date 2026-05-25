import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../services/apiV2"
import type { BookingType } from "../../types/booking"

// Normalize monthly renter status for display
const normalizeMonthlyRenterStatus = (status?: string): string => {
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
    case 'CHECKED_OUT': return 'CHECKED OUT'
    default: return status.replace(/_/g, ' ')
  }
}

const getMonthlyStatusStyle = (status?: string): string => {
  if (!status) return 'bg-emerald-100 text-emerald-800 border border-emerald-200'
  switch (status) {
    case 'ACTIVE': return 'bg-emerald-100 text-emerald-800 border border-emerald-200'
    case 'DUE_SOON': return 'bg-amber-100 text-amber-800 border border-amber-200'
    case 'EXPIRES_TODAY': return 'bg-orange-100 text-orange-800 border border-orange-200'
    case 'RENEWAL_PENDING':
    case 'PENDING_ADMIN_APPROVAL':
    case 'STAY_CONTINUED':
    case 'PENDING_PAYMENT': return 'bg-amber-100 text-amber-800 border border-amber-200'
    case 'CONTINUE_REQUESTED': return 'bg-blue-100 text-blue-800 border border-blue-200'
    case 'OVERDUE': return 'bg-red-100 text-red-800 border border-red-200'
    case 'CHECKOUT_PENDING':
    case 'CHECKOUT_REQUESTED': return 'bg-slate-100 text-slate-700 border border-slate-200'
    case 'CHECKED_OUT': return 'bg-slate-100 text-slate-500 border border-slate-200'
    default: return 'bg-slate-100 text-slate-700 border border-slate-200'
  }
}

const getDailyPaymentStyle = (status?: string): string => {
  switch (status) {
    case 'SUCCESS': return 'bg-emerald-100 text-emerald-800 border border-emerald-200'
    case 'VERIFICATION_PENDING': return 'bg-blue-100 text-blue-800 border border-blue-200'
    case 'PENDING': return 'bg-amber-100 text-amber-800 border border-amber-200'
    case 'FAILED': return 'bg-red-100 text-red-800 border border-red-200'
    default: return 'bg-slate-100 text-slate-700 border border-slate-200'
  }
}

const RentersManagement = () => {
  const navigate = useNavigate()
  const [renters, setRenters] = useState<BookingType[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetchRenters()
  }, [])

  const fetchRenters = async () => {
    try {
      const response = await api.get("/bookings")
      // Show all CONFIRMED bookings + PENDING (awaiting admin approval)
      const activeRenters = response.data.filter(
        (booking: BookingType) =>
          booking.status === "CONFIRMED" ||
          (booking.status === "PENDING" && booking.bookingType === "DAILY")
      )
      setRenters(activeRenters)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Determine the effective status label for a renter
  const getEffectiveStatus = (renter: BookingType): string => {
    if (renter.bookingType === 'MONTHLY' && renter.monthlyRenter?.status) {
      return normalizeMonthlyRenterStatus(renter.monthlyRenter.status)
    }
    if (renter.bookingType === 'DAILY') {
      if (renter.paymentStatus === 'VERIFICATION_PENDING' || renter.paymentStatus === 'PENDING') return 'PAYMENT PENDING'
      if (renter.paymentStatus === 'SUCCESS') return 'CONFIRMED'
    }
    return renter.status || 'ACTIVE'
  }

  const getEffectiveStatusStyle = (renter: BookingType): string => {
    if (renter.bookingType === 'MONTHLY') {
      return getMonthlyStatusStyle(renter.monthlyRenter?.status)
    }
    return getDailyPaymentStyle(renter.paymentStatus)
  }

  // For monthly renters: pending amount from monthlyRenter.pendingAmount
  // For daily renters: 0 if paid, totalAmount if pending
  const getPendingDue = (renter: BookingType): number => {
    if (renter.bookingType === 'MONTHLY') {
      return renter.monthlyRenter?.pendingAmount || 0
    }
    return renter.paymentStatus === 'SUCCESS' ? 0 : renter.totalAmount
  }

  const filteredRenters = renters.filter(renter => {
    if (filter === "daily" && renter.bookingType !== "DAILY") return false
    if (filter === "monthly" && renter.bookingType !== "MONTHLY") return false
    if (filter === "needs-action") {
      const rawStatus = renter.monthlyRenter?.status || ''
      const hasPendingPayment = renter.paymentStatus === 'PENDING' || renter.paymentStatus === 'VERIFICATION_PENDING'
      const monthlyNeedsAction = ['DUE_SOON', 'EXPIRES_TODAY', 'OVERDUE', 'RENEWAL_PENDING', 'PENDING_ADMIN_APPROVAL', 'STAY_CONTINUED', 'PENDING_PAYMENT', 'CONTINUE_REQUESTED'].includes(rawStatus)
      return (renter.bookingType === 'MONTHLY' && monthlyNeedsAction) || (renter.bookingType === 'DAILY' && hasPendingPayment)
    }
    if (search) {
      const q = search.toLowerCase()
      return (
        renter.customerName.toLowerCase().includes(q) ||
        renter.customerPhone.includes(search) ||
        renter.customerEmail.toLowerCase().includes(q) ||
        (renter.room?.roomNumber || '').toLowerCase().includes(q)
      )
    }
    return true
  })

  const totalMonthly = renters.filter(r => r.bookingType === 'MONTHLY').length
  const totalDaily = renters.filter(r => r.bookingType === 'DAILY').length
  const needsAction = renters.filter(r => {
    const rawStatus = r.monthlyRenter?.status || ''
    return ['DUE_SOON', 'EXPIRES_TODAY', 'OVERDUE', 'RENEWAL_PENDING', 'PENDING_ADMIN_APPROVAL', 'STAY_CONTINUED', 'PENDING_PAYMENT', 'CONTINUE_REQUESTED'].includes(rawStatus)
      || r.paymentStatus === 'VERIFICATION_PENDING'
  }).length

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Loading Renters...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">

          {/* Page Header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="text-blue-600 hover:underline mb-1.5 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-xl font-black text-gray-900 tracking-tight">Renters & Tenants</h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">All active residents & their current status</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-black text-gray-900">{filteredRenters.length} / {renters.length}</p>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Showing</p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="text-2xl font-black text-slate-800">{renters.length}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Total Renters</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="text-2xl font-black text-blue-600">{totalDaily}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Daily Stays</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="text-2xl font-black text-purple-600">{totalMonthly}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Monthly Renters</div>
            </div>
            <div className={`p-4 rounded-2xl border shadow-sm ${needsAction > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100'}`}>
              <div className={`text-2xl font-black ${needsAction > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{needsAction}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Needs Action</div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="bg-white p-3 rounded-xl border border-gray-100 mb-4 shadow-sm space-y-2">
            <div className="flex flex-col md:flex-row gap-2">
              <div className="relative flex-1">
                <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, phone, email, or room..."
                  className="w-full pl-9 pr-4 py-2 text-xs font-bold bg-gray-50/50 border border-transparent rounded-lg focus:bg-white focus:border-blue-100 transition-all outline-none placeholder:text-gray-300"
                />
              </div>
              <div className="flex gap-1 flex-wrap">
                {[
                  { id: 'all', label: `All (${renters.length})` },
                  { id: 'monthly', label: `Monthly (${totalMonthly})` },
                  { id: 'daily', label: `Daily (${totalDaily})` },
                  { id: 'needs-action', label: `⚠️ Needs Action (${needsAction})` },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                      filter === f.id
                        ? 'bg-slate-900 text-white shadow-md'
                        : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Renters Table */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/50 border-b border-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Room</th>
                    <th className="px-4 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Renter</th>
                    <th className="px-4 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Contact</th>
                    <th className="px-4 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                    <th className="px-4 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Check-in</th>
                    <th className="px-4 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Cycle End</th>
                    <th className="px-4 py-3 text-center text-[9px] font-black text-gray-400 uppercase tracking-widest">Stay Status</th>
                    <th className="px-4 py-3 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">Pending Due</th>
                    <th className="px-4 py-3 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
                  {filteredRenters.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center">
                        <p className="text-gray-300 font-black text-[10px] uppercase tracking-widest">No active renters found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredRenters.map((renter) => {
                      const pendingDue = getPendingDue(renter)
                      const effectiveStatus = getEffectiveStatus(renter)
                      const effectiveStatusStyle = getEffectiveStatusStyle(renter)
                      const cycleEnd = renter.monthlyRenter?.currentCycleEnd || renter.checkOutDate
                      const isMonthly = renter.bookingType === 'MONTHLY'

                      return (
                        <tr key={renter.id} className="hover:bg-blue-50/20 transition-all group">
                          <td className="px-4 py-3">
                            <span className="text-sm font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                              {renter.room?.roomNumber || 'N/A'}
                            </span>
                            {renter.room && (
                              <div className="text-[9px] text-gray-400 font-semibold mt-0.5 max-w-[80px] truncate">{renter.room.title}</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-xs text-gray-900 leading-tight">{renter.customerName}</div>
                            <div className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">{renter.customerEmail}</div>
                          </td>
                          <td className="px-4 py-3 text-xs font-bold text-gray-600">
                            {renter.customerPhone}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                              isMonthly
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}>
                              {renter.bookingType}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs font-bold text-gray-700">
                            {new Date(renter.checkInDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                          </td>
                          <td className="px-4 py-3 text-xs font-bold text-gray-700">
                            {cycleEnd
                              ? new Date(cycleEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
                              : 'N/A'
                            }
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${effectiveStatusStyle}`}>
                              {effectiveStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`text-xs font-black ${pendingDue > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                              {pendingDue > 0 ? `₹${pendingDue.toLocaleString()}` : '₹0 Cleared'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1.5 justify-end">
                              <button
                                onClick={() => navigate(`/booking-confirmation/${renter.id}`)}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-all"
                              >
                                View
                              </button>
                              {isMonthly && (
                                <button
                                  onClick={() => navigate('/admin/monthly-billing')}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider shadow-sm transition-all active:scale-95"
                                >
                                  Billing
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer count */}
          <div className="mt-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest text-right">
            Showing {filteredRenters.length} of {renters.length} active renters
          </div>

        </div>
      </div>
    </div>
  )
}

export default RentersManagement
