import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../services/api"
import type { BookingType } from "../../types/booking"

const PaymentsManagement = () => {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState<BookingType[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      const response = await api.get("/bookings")
      setBookings(response.data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTotalPaid = () => {
    return bookings
      .filter(b => b.paymentStatus === "paid")
      .reduce((sum, b) => sum + b.totalAmount, 0)
  }

  const getTotalPending = () => {
    return bookings
      .filter(b => b.paymentStatus === "pending")
      .reduce((sum, b) => sum + b.totalAmount, 0)
  }

  const filteredBookings = bookings.filter(booking => {
    // Filter by payment status
    if (filter === "paid" && booking.paymentStatus !== "paid") return false
    if (filter === "pending" && booking.paymentStatus !== "pending") return false
    if (filter === "failed" && booking.paymentStatus !== "failed") return false
    
    // Search
    if (search) {
      const searchLower = search.toLowerCase()
      return (
        booking.bookingId.toLowerCase().includes(searchLower) ||
        booking.customerName.toLowerCase().includes(searchLower) ||
        booking.customerPhone.includes(search) ||
        booking.payment?.transactionId?.toLowerCase().includes(searchLower)
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
          <h1 className="text-3xl font-bold text-gray-900">Payments Management</h1>
          <p className="text-gray-600">Track all payments and pending dues</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{bookings.length}</div>
            <div className="text-sm text-gray-600">Total Transactions</div>
          </div>
          <div className="bg-white p-4 rounded border border-gray-200">
            <div className="text-2xl font-bold text-green-600">
              ₹{getTotalPaid().toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Paid</div>
          </div>
          <div className="bg-white p-4 rounded border border-gray-200">
            <div className="text-2xl font-bold text-red-600">
              ₹{getTotalPending().toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Pending</div>
          </div>
          <div className="bg-white p-4 rounded border border-gray-200">
            <div className="text-2xl font-bold text-yellow-600">
              {bookings.filter(b => b.paymentStatus === "pending").length}
            </div>
            <div className="text-sm text-gray-600">Pending Count</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by booking ID, name, phone, or transaction ID..."
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
              onClick={() => setFilter("paid")}
              className={`px-4 py-2 rounded text-sm font-semibold ${
                filter === "paid" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Paid ({bookings.filter(b => b.paymentStatus === "paid").length})
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`px-4 py-2 rounded text-sm font-semibold ${
                filter === "pending" ? "bg-yellow-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Pending ({bookings.filter(b => b.paymentStatus === "pending").length})
            </button>
            <button
              onClick={() => setFilter("failed")}
              className={`px-4 py-2 rounded text-sm font-semibold ${
                filter === "failed" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Failed ({bookings.filter(b => b.paymentStatus === "failed").length})
            </button>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Booking ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Room</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Payment Method</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Transaction ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                      No payments found
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((booking) => (
                    <tr key={booking.id} className={`hover:bg-gray-50 ${
                      booking.paymentStatus === "pending" ? "bg-yellow-50" : ""
                    }`}>
                      <td className="px-4 py-3 text-sm font-mono font-bold text-blue-600">
                        {booking.bookingId}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-semibold text-gray-900">{booking.customerName}</div>
                        <div className="text-gray-600 text-xs">{booking.customerPhone}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {booking.room && (
                          <>
                            <div className="font-semibold text-gray-900">Room {booking.room.roomNumber}</div>
                            <div className="text-gray-600 text-xs">{booking.room.title}</div>
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900">
                        ₹{booking.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {booking.payment?.paymentMethod || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-600">
                        {booking.payment?.transactionId || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                          booking.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          booking.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {booking.paymentStatus.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(booking.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/booking-confirmation/${booking.id}`)}
                            className="text-blue-600 hover:underline text-xs"
                          >
                            View
                          </button>
                          {booking.paymentStatus === "pending" && (
                            <button
                              onClick={() => alert('Mark as paid feature coming soon')}
                              className="text-green-600 hover:underline text-xs"
                            >
                              Mark Paid
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600">Showing Transactions</div>
              <div className="text-lg font-bold text-gray-900">{filteredBookings.length} of {bookings.length}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Amount (Filtered)</div>
              <div className="text-lg font-bold text-gray-900">
                ₹{filteredBookings.reduce((sum, b) => sum + b.totalAmount, 0).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Pending Amount (Filtered)</div>
              <div className="text-lg font-bold text-red-600">
                ₹{filteredBookings.filter(b => b.paymentStatus === "pending").reduce((sum, b) => sum + b.totalAmount, 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentsManagement
