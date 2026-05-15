import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../services/apiV2"
import type { BookingType } from "../../types/booking"
import Card from "../../components/ui/Card"
import Badge from "../../components/ui/Badge"
import Button from "../../components/ui/Button"
import LoadingSpinner from "../../components/ui/LoadingSpinner"
import EmptyState from "../../components/ui/EmptyState"

const ManageBookings = () => {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState<BookingType[]>([])
  const [filteredBookings, setFilteredBookings] = useState<BookingType[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchBookings()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [filter, searchTerm, bookings])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const response = await api.get("/bookings")
      setBookings(response.data)
      setFilteredBookings(response.data)
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...bookings]

    // Filter by status
    if (filter !== "all") {
      filtered = filtered.filter(booking => booking.status === filter)
    }

    // Search by booking ID or customer name
    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.bookingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredBookings(filtered)
  }

  const handleCancelBooking = async (bookingId: number) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return
    }

    try {
      await api.put(`/bookings/${bookingId}/cancel`)
      alert('Booking cancelled successfully')
      fetchBookings()
    } catch (error: any) {
      console.error('Error cancelling booking:', error)
      alert(error.response?.data?.message || 'Failed to cancel booking')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Loading bookings..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button variant="outline" onClick={() => navigate('/admin/dashboard')} className="mb-4">
            ← Back to Dashboard
          </Button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Manage Bookings</h1>
          <p className="text-gray-600">View and manage all customer bookings</p>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by booking ID, name, or email..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Bookings</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredBookings.length} of {bookings.length} bookings
          </div>
        </Card>

        {/* Bookings Table */}
        {filteredBookings.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
            title="No Bookings Found"
            message="No bookings match your search criteria"
          />
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Booking ID</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Customer Details</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Room</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Dates</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Amount</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Payment</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-sm font-bold text-blue-600">
                            {booking.bookingId}
                          </span>
                          <Badge variant={booking.bookingType === 'MONTHLY' ? 'primary' : 'info'} size="sm" className="w-fit">
                            {booking.bookingType}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-semibold text-gray-900">{booking.customerName}</p>
                          <p className="text-sm text-gray-600">{booking.customerEmail}</p>
                          <p className="text-sm text-gray-600">{booking.customerPhone}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {booking.room && (
                          <div>
                            <p className="font-semibold text-gray-900">{booking.room.title}</p>
                            <p className="text-sm text-gray-600">Room {booking.room.roomNumber}</p>
                            <div className="flex gap-1 mt-1">
                              <Badge variant="info" size="sm">{booking.room.roomType}</Badge>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm">
                          <p className="text-gray-900">
                            <span className="font-semibold">In:</span>{' '}
                            {new Date(booking.checkInDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short'
                            })}
                          </p>
                          <p className="text-gray-900">
                            <span className="font-semibold">Out:</span>{' '}
                            {new Date(booking.checkOutDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short'
                            })}
                          </p>
                          <p className="text-gray-600">{booking.totalDays} days</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-bold text-gray-900">
                          ₹{booking.totalAmount.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-600">{booking.numberOfGuests} guests</p>
                      </td>
                      <td className="py-4 px-6">
                        <Badge
                          variant={
                            booking.status === 'confirmed' ? 'success' :
                            booking.status === 'pending' ? 'warning' :
                            booking.status === 'cancelled' ? 'danger' : 'secondary'
                          }
                        >
                          {booking.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-6">
                        <Badge
                          variant={
                            booking.paymentStatus === 'paid' ? 'success' :
                            booking.paymentStatus === 'pending' ? 'warning' : 'danger'
                          }
                        >
                          {booking.paymentStatus}
                        </Badge>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/booking-confirmation/${booking.id}`)}
                          >
                            View
                          </Button>
                          {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleCancelBooking(booking.id)}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

export default ManageBookings
