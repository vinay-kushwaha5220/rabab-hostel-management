import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../services/apiV2"
import type { BookingType } from "../../types/booking"
import Badge from "../../components/ui/Badge"
import Card from "../../components/ui/Card"
import LoadingSpinner from "../../components/ui/LoadingSpinner"

const BookingsManagement = () => {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState<BookingType[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")
  
  const currentYear = new Date().getFullYear()
  const [selectedMonth, setSelectedMonth] = useState<string>("all")
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString())

  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ]

  const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString())

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      const response = await api.get("/bookings")
      setBookings(response.data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const cancelBooking = async (bookingId: number) => {
    if (!confirm('Cancel this booking?')) return
    try {
      await api.put(`/bookings/${bookingId}/cancel`)
      fetchBookings()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to cancel')
    }
  }

  const confirmBooking = async (bookingId: number) => {
    if (!confirm('Mark this booking as paid and confirmed?')) return
    try {
      await api.put(`/bookings/${bookingId}/confirm`)
      fetchBookings()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to confirm')
    }
  }

  const checkInBooking = async (bookingId: number) => {
    try {
      await api.put(`/bookings/${bookingId}/check-in`)
      fetchBookings()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to check in')
    }
  }

  const checkOutBooking = async (bookingId: number) => {
    if (!confirm('ACTION REQUIRED: Are you sure the renter has officially left the room? This will release the unit for new bookings.')) return
    try {
      await api.put(`/bookings/${bookingId}/check-out`)
      fetchBookings()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to check out')
    }
  }

  const undoCheckOutBooking = async (bookingId: number) => {
    if (!confirm('RESTORE STAY: Accidental checkout? This will make the guest active again and increment room occupancy.')) return
    try {
      await api.put(`/bookings/${bookingId}/undo-checkout`)
      fetchBookings()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to restore stay')
    }
  }

  const handleRenewStay = async (bookingId: number) => {
    if (!confirm('RENEW STAY: Extend this guest stay by another 30 days?')) return
    try {
      await api.put(`/bookings/${bookingId}/renew-stay`)
      alert('Stay extended successfully for 30 days!')
      fetchBookings()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to renew stay')
    }
  }

  const refundBooking = async (bookingId: number) => {
    if (!confirm('Process refund for this cancelled booking?')) return
    try {
      await api.put(`/bookings/${bookingId}/refund`)
      fetchBookings()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to refund')
    }
  }

  const filteredBookings = bookings.filter(booking => {
    // Status filter
    if (filter !== "all" && booking.status !== filter) return false
    
    // Month & Year filter
    const checkInDate = new Date(booking.checkInDate)
    const bookingMonth = (checkInDate.getMonth() + 1).toString().padStart(2, '0')
    const bookingYear = checkInDate.getFullYear().toString()

    if (selectedMonth !== "all" && bookingMonth !== selectedMonth) return false
    if (selectedYear !== "all" && bookingYear !== selectedYear) return false

    // Search
    if (search) {
      const searchLower = search.toLowerCase()
      return (
        booking.bookingId.toLowerCase().includes(searchLower) ||
        booking.customerName.toLowerCase().includes(searchLower) ||
        booking.customerPhone.includes(search) ||
        booking.room?.roomNumber.toLowerCase().includes(searchLower)
      )
    }
    
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Loading bookings..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-end">
          <div>
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="text-blue-600 hover:underline mb-1 text-[10px] font-bold uppercase tracking-widest"
            >
              ← Back
            </button>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Booking Management</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Global reservation control</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-black text-gray-900">{filteredBookings.length} / {bookings.length}</p>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Showing Logs</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-2 rounded-xl border border-gray-100 mb-4 shadow-sm space-y-2">
          <div className="flex flex-col md:flex-row gap-2">
            <div className="relative flex-1">
              <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by ID, Name, Phone or Unit..."
                className="w-full pl-9 pr-4 py-2 text-xs font-bold bg-gray-50/50 border border-transparent rounded-lg focus:bg-white focus:border-blue-100 transition-all outline-none placeholder:text-gray-300"
              />
            </div>
            <div className="flex gap-1">
              {['all', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                    filter === f 
                      ? "bg-slate-900 text-white shadow-md shadow-slate-200" 
                      : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-gray-50">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Period:</span>
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-50 border-none text-[10px] font-black uppercase tracking-widest rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 cursor-pointer"
              >
                <option value="all">All Months</option>
                {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-slate-50 border-none text-[10px] font-black uppercase tracking-widest rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 cursor-pointer"
              >
                <option value="all">All Years</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Bookings Table */}
        <Card className="overflow-hidden border-none shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/50 border-b border-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest"># Unit</th>
                  <th className="px-4 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Reservation ID</th>
                  <th className="px-4 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Client</th>
                  <th className="px-4 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Contact</th>
                  <th className="px-4 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Stay Period</th>
                  <th className="px-4 py-3 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">Valuation</th>
                  <th className="px-4 py-3 text-center text-[9px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-4 py-3 text-center text-[9px] font-black text-gray-400 uppercase tracking-widest">Payment</th>
                  <th className="px-4 py-3 text-center text-[9px] font-black text-gray-400 uppercase tracking-widest">Stay</th>
                  <th className="px-4 py-3 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center">
                      <p className="text-gray-300 font-black text-[10px] uppercase tracking-widest">No records for this period</p>
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-blue-50/30 transition-all group">
                      <td className="px-4 py-3">
                        <span className="text-sm font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                          {booking.room?.roomNumber || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-black text-gray-900 font-mono tracking-tighter opacity-80">
                          {booking.bookingId}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-xs text-gray-900 leading-tight">{booking.customerName}</div>
                        <div className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">{booking.customerEmail}</div>
                      </td>
                      <td className="px-4 py-3 text-xs font-bold text-gray-600">
                        {booking.customerPhone}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-700">
                          <span>{new Date(booking.checkInDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          <span className="text-gray-300 font-black">→</span>
                          <span>{new Date(booking.checkOutDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                        <div className="text-[9px] text-gray-400 font-bold uppercase">{booking.totalDays} Days</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="text-xs font-black text-gray-900">₹{booking.totalAmount.toLocaleString()}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge 
                          variant={booking.status === 'CONFIRMED' ? 'success' : (booking.status === 'PENDING' ? 'warning' : 'error')}
                          size="sm"
                          className="text-[8px] px-1.5 font-black"
                        >
                          {booking.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge 
                          variant={booking.paymentStatus === 'SUCCESS' ? 'success' : (booking.paymentStatus === 'PENDING' ? 'warning' : 'error')}
                          size="sm"
                          className="text-[8px] px-1.5 font-black"
                        >
                          {booking.paymentStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge 
                          variant={booking.stayStatus === 'CHECKED_OUT' ? 'info' : (booking.stayStatus === 'CHECKED_IN' ? 'success' : 'warning')}
                          size="sm"
                          className="text-[8px] px-1.5 font-black"
                        >
                          {booking.stayStatus || 'BOOKED'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5 justify-end">
                          <button
                            onClick={() => navigate(`/booking-confirmation/${booking.id}`)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-all"
                          >
                            View
                          </button>
                          {booking.status === 'CONFIRMED' && booking.stayStatus !== 'CHECKED_IN' && booking.stayStatus !== 'CHECKED_OUT' && (
                            <button
                              onClick={() => checkInBooking(booking.id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider shadow-sm transition-all active:scale-95"
                            >
                              Check In
                            </button>
                          )}
                          {booking.stayStatus === 'CHECKED_IN' && (
                            <button
                              onClick={() => checkOutBooking(booking.id)}
                              className="bg-orange-600 hover:bg-orange-700 text-white px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider shadow-sm transition-all active:scale-95"
                            >
                              Check Out
                            </button>
                          )}
                          {booking.status === 'CANCELLED' && booking.paymentStatus === 'SUCCESS' && (
                            <button
                              onClick={() => refundBooking(booking.id)}
                              className="bg-purple-600 hover:bg-purple-700 text-white px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider shadow-sm transition-all active:scale-95"
                            >
                              Refund
                            </button>
                          )}
                          {booking.stayStatus === 'CHECKED_OUT' && (
                            <button
                              onClick={() => undoCheckOutBooking(booking.id)}
                              className="bg-white hover:bg-slate-50 text-slate-400 border border-slate-100 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest transition-all"
                              title="Available for 24h after checkout"
                            >
                              Restore Stay
                            </button>
                          )}
                          {booking.status === 'CONFIRMED' && booking.stayStatus === 'CHECKED_IN' && booking.room?.bookingType === 'MONTHLY' && (
                            <button
                              onClick={() => handleRenewStay(booking.id)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest transition-all"
                              title="Extend stay by 30 days"
                            >
                              Renew Stay
                            </button>
                          )}
                          {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && booking.stayStatus !== 'CHECKED_OUT' && (
                            <button
                              onClick={() => cancelBooking(booking.id)}
                              className="bg-white hover:bg-red-50 text-red-400 border border-red-50 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-all"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default BookingsManagement
