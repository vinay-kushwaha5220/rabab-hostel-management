import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../services/apiV2"
import type { BookingType } from "../../types/booking"

const BookingsManagement = () => {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState<BookingType[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")

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
      alert('Booking cancelled')
      fetchBookings()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to cancel')
    }
  }

  const confirmBooking = async (bookingId: number) => {
    if (!confirm('Mark this booking as paid and confirmed?')) return
    try {
      await api.put(`/bookings/${bookingId}/confirm`)
      alert('Booking confirmed successfully')
      fetchBookings()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to confirm')
    }
  }

  const filteredBookings = bookings.filter(booking => {
    // Filter by status
    if (filter !== "all" && booking.status !== filter) return false
    
    // Search
    if (search) {
      const searchLower = search.toLowerCase()
      return (
        booking.bookingId.toLowerCase().includes(searchLower) ||
        booking.customerName.toLowerCase().includes(searchLower) ||
        booking.customerPhone.includes(search)
      )
    }
    
    return true
  })

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="text-blue-600 hover:underline mb-2 text-sm"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Bookings Management</h1>
          <p className="text-gray-600">View and manage all bookings</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by booking ID, name, or phone..."
              className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded text-sm font-semibold ${
                filter === "all" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All ({bookings.length})
            </button>
            <button
              onClick={() => setFilter("PENDING")}
              className={`px-4 py-2 rounded text-sm font-semibold ${
                filter === "PENDING" ? "bg-yellow-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Pending ({bookings.filter(b => b.status === "PENDING").length})
            </button>
            <button
              onClick={() => setFilter("CONFIRMED")}
              className={`px-4 py-2 rounded text-sm font-semibold ${
                filter === "CONFIRMED" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Confirmed ({bookings.filter(b => b.status === "CONFIRMED").length})
            </button>
            <button
              onClick={() => setFilter("CANCELLED")}
              className={`px-4 py-2 rounded text-sm font-semibold ${
                filter === "CANCELLED" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Cancelled ({bookings.filter(b => b.status === "CANCELLED").length})
            </button>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Booking ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Room</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Check-in</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Check-out</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Days</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Payment</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                      No bookings found
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono font-bold text-blue-600">
                        {booking.bookingId}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-semibold text-gray-900">{booking.customerName}</div>
                        <div className="text-gray-600 text-xs">{booking.customerEmail}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {booking.customerPhone}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {booking.room && (
                          <>
                            <div className="font-semibold text-gray-900">{booking.room.title}</div>
                            <div className="text-gray-600 text-xs">Room {booking.room.roomNumber}</div>
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(booking.checkInDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(booking.checkOutDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {booking.totalDays}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                        ₹{booking.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                          booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          booking.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {booking.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          booking.paymentStatus === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                          booking.paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {booking.paymentStatus.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/booking-confirmation/${booking.id}`)}
                            className="text-blue-600 hover:underline text-xs font-semibold"
                          >
                            View
                          </button>
                          {booking.status === 'PENDING' && (
                            <button
                              onClick={() => confirmBooking(booking.id)}
                              className="text-green-600 hover:underline text-xs font-semibold"
                            >
                              Confirm
                            </button>
                          )}
                          {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
                            <button
                              onClick={() => cancelBooking(booking.id)}
                              className="text-red-600 hover:underline text-xs font-semibold"
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
        </div>

        {/* Summary */}
        <div className="mt-6 bg-white p-4 rounded border border-gray-200">
          <div className="text-sm text-gray-600">
            Showing {filteredBookings.length} of {bookings.length} bookings
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookingsManagement
