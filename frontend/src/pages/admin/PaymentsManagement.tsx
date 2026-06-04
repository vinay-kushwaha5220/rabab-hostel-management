import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../services/apiV2"

type CycleFilterType = 'all' | 'current' | 'past'
type StatusFilterType = 'all' | 'success' | 'pending' | 'failed'

const PaymentsManagement = () => {
  const navigate = useNavigate()
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("all")
  const [cycleFilter, setCycleFilter] = useState<CycleFilterType>("all")
  const [search, setSearch] = useState("")
  const [error, setError] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const response = await api.get("/monthly-payments/admin/all")
      setPayments(response.data || [])
      setError("")
    } catch (err: any) {
      console.error('Error fetching payments:', err)
      setError("Failed to fetch payment transactions. Please make sure the backend is active.")
    } finally {
      setLoading(false)
    }
  }

  const isPaymentHistorical = (payment: any): boolean => {
    const renter = payment.booking?.monthlyRenter
    if (!renter) return false // Daily stays don't have monthly cycles, so consider them active/current
    if (!renter.currentCycleStart) return false

    // Compare via monthly bill due date if available
    const bill = payment.monthlyBill
    if (bill) {
      const billDueDate = new Date(bill.dueDate)
      const cycleStart = new Date(renter.currentCycleStart)
      
      billDueDate.setHours(0, 0, 0, 0)
      cycleStart.setHours(0, 0, 0, 0)
      
      return billDueDate.getTime() < cycleStart.getTime()
    }

    // Fallback: compare payment transaction date
    const paymentDate = new Date(payment.createdAt)
    const cycleStart = new Date(renter.currentCycleStart)
    
    paymentDate.setHours(0, 0, 0, 0)
    cycleStart.setHours(0, 0, 0, 0)
    
    return paymentDate.getTime() < cycleStart.getTime()
  }

  const getTotalPaid = (items: any[]) => {
    return items
      .filter(p => p.paymentStatus === "SUCCESS")
      .reduce((sum, p) => sum + (p.amount || 0), 0)
  }

  const getTotalPending = (items: any[]) => {
    return items
      .filter(p => p.paymentStatus === "PENDING" || p.paymentStatus === "VERIFICATION_PENDING")
      .reduce((sum, p) => sum + (p.amount || 0), 0)
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
      case "PENDING":
        return "bg-amber-50 text-amber-700 border border-amber-200/60"
      case "VERIFICATION_PENDING":
        return "bg-blue-50 text-blue-700 border border-blue-200/60"
      case "FAILED":
      case "REFUNDED":
        return "bg-rose-50 text-rose-700 border border-rose-200/60"
      default:
        return "bg-slate-50 text-slate-600 border border-slate-200"
    }
  }

  const getStatusLabel = (status: string) => {
    if (status === "VERIFICATION_PENDING") return "PENDING VERIFICATION"
    return status
  }

  // Comprehensive filter pipeline
  const filteredPayments = payments.filter(payment => {
    // 1. Status Filter
    if (statusFilter === "success" && payment.paymentStatus !== "SUCCESS") return false
    if (statusFilter === "pending" && payment.paymentStatus !== "PENDING" && payment.paymentStatus !== "VERIFICATION_PENDING") return false
    if (statusFilter === "failed" && payment.paymentStatus !== "FAILED" && payment.paymentStatus !== "REFUNDED") return false
    
    // 2. Cycle Filter (Current vs Past)
    const isHistorical = isPaymentHistorical(payment)
    if (cycleFilter === "current" && isHistorical) return false
    if (cycleFilter === "past" && !isHistorical) return false

    // 3. Text Search (Booking ID, Renter Name, Phone No, Transaction ID)
    if (search) {
      const searchLower = search.toLowerCase()
      const bookingId = payment.booking?.bookingId || ""
      const customerName = payment.booking?.customerName || ""
      const customerPhone = payment.booking?.customerPhone || ""
      const txId = payment.transactionId || ""
      const roomNum = payment.booking?.room?.roomNumber || ""
      
      const matchBooking = bookingId.toLowerCase().includes(searchLower)
      const matchName = customerName.toLowerCase().includes(searchLower)
      const matchPhone = customerPhone.includes(search)
      const matchTx = txId.toLowerCase().includes(searchLower)
      const matchRoom = roomNum.toLowerCase().includes(searchLower)
      
      return matchBooking || matchName || matchPhone || matchTx || matchRoom
    }
    
    return true
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredPayments.length / ITEMS_PER_PAGE)
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, cycleFilter, search])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Loading transactions ledger...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/40 py-4 px-2 sm:px-4 lg:px-6">
      <div className="max-w-7xl mx-auto space-y-4">
        
        {/* Header Block */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="group text-[10px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1 hover:text-blue-700 transition-colors"
            >
              <span className="group-hover:-translate-x-0.5 transition-transform">←</span> Back to Dashboard
            </button>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">
              Payments Ledger Management
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Track and audit all booking deposits, monthly stay cycles, cash receipts, and online transactions
            </p>
          </div>
        </div>

        {/* Global Error Notice */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-xs font-semibold text-rose-700 flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {/* Card 1: Total Volume */}
          <div className="p-3 bg-white border border-slate-150 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group">
            <div className="flex justify-between items-start">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Volume</span>
              <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs group-hover:scale-110 transition-transform">📈</span>
            </div>
            <div className="mt-4">
              <div className="text-lg font-black text-slate-900">{payments.length}</div>
              <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Records in Ledger</div>
            </div>
          </div>

          {/* Card 2: Total Paid */}
          <div className="p-3 bg-white border border-slate-150 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group">
            <div className="flex justify-between items-start">
              <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Total Collected</span>
              <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs group-hover:scale-110 transition-transform">💰</span>
            </div>
            <div className="mt-4">
              <div className="text-lg font-black text-emerald-600">₹{getTotalPaid(payments).toLocaleString()}</div>
              <div className="text-[9px] font-semibold text-emerald-500 uppercase tracking-wider mt-0.5">Fully Verified</div>
            </div>
          </div>

          {/* Card 3: Total Pending */}
          <div className="p-3 bg-white border border-slate-150 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group">
            <div className="flex justify-between items-start">
              <span className="text-[9px] font-bold text-amber-600 uppercase tracking-wider">Pending Dues</span>
              <span className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-xs group-hover:scale-110 transition-transform">⏳</span>
            </div>
            <div className="mt-4">
              <div className="text-lg font-black text-amber-600">₹{getTotalPending(payments).toLocaleString()}</div>
              <div className="text-[9px] font-semibold text-amber-500 uppercase tracking-wider mt-0.5">Pending verification</div>
            </div>
          </div>

          {/* Card 4: Action Count */}
          <div className="p-3 bg-white border border-slate-150 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group">
            <div className="flex justify-between items-start">
              <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider">Awaiting Verification</span>
              <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs group-hover:scale-110 transition-transform">⚙️</span>
            </div>
            <div className="mt-4">
              <div className="text-lg font-black text-blue-600">
                {payments.filter(p => p.paymentStatus === "VERIFICATION_PENDING").length}
              </div>
              <div className="text-[9px] font-semibold text-blue-500 uppercase tracking-wider mt-0.5">Online UTRs Awaiting Audit</div>
            </div>
          </div>
        </div>

        {/* Filters and Search Toolbar */}
        <div className="bg-white border border-slate-100 rounded-2xl p-3 shadow-sm space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Search Input Box */}
            <div className="md:col-span-2 space-y-1">
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">Search Directory</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none text-xs">🔍</span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by Renter Name, Phone No, Booking ID, Room No, Transaction ID..."
                  className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50/70 border border-slate-200/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-slate-700 placeholder:text-slate-350 transition-all"
                />
              </div>
            </div>

            {/* Cycle Filters Toggle */}
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">Stays Cycle Filter</label>
              <select
                value={cycleFilter}
                onChange={(e) => setCycleFilter(e.target.value as CycleFilterType)}
                className="w-full px-3 py-2.5 text-xs bg-slate-50/70 border border-slate-200/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-slate-700 transition-all"
              >
                <option value="all">All Stays (Current & Historical)</option>
                <option value="current">Current Stay Cycle Payments Only</option>
                <option value="past">Past Stay Cycles (Historical) Only</option>
              </select>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Status Quick Tabs */}
          <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-none">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all duration-200 whitespace-nowrap active:scale-95 border ${
                statusFilter === "all"
                  ? "bg-slate-900 text-white border-slate-950 shadow-sm shadow-slate-950/15"
                  : "bg-white hover:bg-slate-50 text-slate-500 border-slate-200/60"
              }`}
            >
              All Transactions ({payments.length})
            </button>
            <button
              onClick={() => setStatusFilter("success")}
              className={`px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all duration-200 whitespace-nowrap active:scale-95 border ${
                statusFilter === "success"
                  ? "bg-emerald-600 text-white border-emerald-700 shadow-sm shadow-emerald-600/15"
                  : "bg-white hover:bg-slate-50 text-slate-500 border-slate-200/60"
              }`}
            >
              Success ({payments.filter(p => p.paymentStatus === "SUCCESS").length})
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={`px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all duration-200 whitespace-nowrap active:scale-95 border ${
                statusFilter === "pending"
                  ? "bg-amber-500 text-white border-amber-600 shadow-sm shadow-amber-500/15"
                  : "bg-white hover:bg-slate-50 text-slate-500 border-slate-200/60"
              }`}
            >
              Pending / Verification ({payments.filter(p => p.paymentStatus === "PENDING" || p.paymentStatus === "VERIFICATION_PENDING").length})
            </button>
            <button
              onClick={() => setStatusFilter("failed")}
              className={`px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all duration-200 whitespace-nowrap active:scale-95 border ${
                statusFilter === "failed"
                  ? "bg-rose-600 text-white border-rose-700 shadow-sm shadow-rose-600/15"
                  : "bg-white hover:bg-slate-50 text-slate-500 border-slate-200/60"
              }`}
            >
              Failed / Refunded ({payments.filter(p => p.paymentStatus === "FAILED" || p.paymentStatus === "REFUNDED").length})
            </button>
          </div>
        </div>

        {/* Ledger Records Table Container */}
        <div className="bg-white border border-slate-150 rounded-3xl overflow-hidden shadow-[0_4px_24px_-8px_rgba(0,0,0,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[8px] font-bold uppercase tracking-widest border-b border-slate-800">
                  <th className="py-4 px-4 font-extrabold">Booking ID</th>
                  <th className="py-4 px-4 font-extrabold">Customer / Phone</th>
                  <th className="py-4 px-4 font-extrabold">Room</th>
                  <th className="py-4 px-4 font-extrabold">Amount</th>
                  <th className="py-4 px-4 font-extrabold">Payment Method</th>
                  <th className="py-4 px-4 font-extrabold">Transaction ID</th>
                  <th className="py-4 px-4 font-extrabold">Cycle Scope</th>
                  <th className="py-4 px-4 font-extrabold">Status</th>
                  <th className="py-4 px-4 font-extrabold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {paginatedPayments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 uppercase font-bold tracking-widest text-[9px]">
                      📁 No matching transactions found in database ledger
                    </td>
                  </tr>
                ) : (
                  paginatedPayments.map((payment) => {
                    const isHistorical = isPaymentHistorical(payment)
                    return (
                      <tr key={payment.id} className="hover:bg-slate-50/50 transition-colors">
                        {/* Booking ID */}
                        <td className="py-4 px-4 font-bold text-slate-900 font-mono">
                          {payment.booking?.bookingId || "N/A"}
                        </td>

                        {/* Customer */}
                        <td className="py-4 px-4">
                          <div className="font-bold text-slate-800">{payment.booking?.customerName || "Unknown"}</div>
                          <div className="text-slate-400 text-[8px] font-semibold mt-0.5">{payment.booking?.customerPhone || "N/A"}</div>
                        </td>

                        {/* Room */}
                        <td className="py-4 px-4 font-semibold text-slate-800">
                          {payment.booking?.room ? `Room ${payment.booking.room.roomNumber}` : "N/A"}
                          <span className="block text-[8px] font-semibold text-slate-400 mt-0.5">{payment.booking?.room?.roomType || "NON_AC"}</span>
                        </td>

                        {/* Amount */}
                        <td className="py-4 px-4 font-black text-slate-900">
                          ₹{(payment.amount || 0).toLocaleString()}
                        </td>

                        {/* Payment Method */}
                        <td className="py-4 px-4 font-bold text-slate-500 uppercase tracking-wider text-[9px]">
                          {payment.paymentMethod || "UPI"}
                        </td>

                        {/* Transaction ID */}
                        <td className="py-4 px-4 font-semibold text-slate-500 font-mono text-[10px]">
                          {payment.transactionId || "N/A"}
                        </td>

                        {/* Cycle Scope Indicator */}
                        <td className="py-4 px-4 font-bold text-[9px]">
                          {isHistorical ? (
                            <span className="text-slate-400 font-semibold bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">Past Stay</span>
                          ) : (
                            <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">Current Stay</span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="py-4 px-4">
                          <span className={`px-2.5 py-0.5 rounded-lg text-[8px] font-extrabold uppercase tracking-wider ${getStatusBadgeClass(payment.paymentStatus)}`}>
                            {getStatusLabel(payment.paymentStatus)}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="py-4 px-4 font-medium text-slate-500">
                          {new Date(payment.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="text-xs font-semibold text-slate-500">
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredPayments.length)} of {filteredPayments.length} entries
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg border text-xs font-bold flex items-center justify-center transition-colors ${
                      currentPage === page
                        ? "bg-slate-900 border-slate-900 text-white"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PaymentsManagement
