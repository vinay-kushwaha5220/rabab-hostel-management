import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../services/apiV2"
import type { DashboardStats } from "../../types/dashboard"

const AdminDashboardPractical = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get("/dashboard/stats")
      setStats(response.data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8">Loading...</div>

  if (!stats) return <div className="p-8">Failed to load data</div>

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Rabab Hostel Management System</p>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Total Rooms */}
          <div className="bg-white p-4 rounded border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{stats.rooms.total}</div>
            <div className="text-sm text-gray-600">Total Rooms</div>
          </div>

          {/* Available Rooms */}
          <div className="bg-white p-4 rounded border border-gray-200">
            <div className="text-2xl font-bold text-green-600">{stats.rooms.available}</div>
            <div className="text-sm text-gray-600">Available</div>
          </div>

          {/* Booked Rooms */}
          <div className="bg-white p-4 rounded border border-gray-200">
            <div className="text-2xl font-bold text-red-600">{stats.rooms.booked}</div>
            <div className="text-sm text-gray-600">Booked</div>
          </div>

          {/* AC Rooms */}
          <div className="bg-white p-4 rounded border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">{stats.rooms.ac}</div>
            <div className="text-sm text-gray-600">AC Rooms</div>
          </div>

          {/* Non-AC Rooms */}
          <div className="bg-white p-4 rounded border border-gray-200">
            <div className="text-2xl font-bold text-gray-600">{stats.rooms.nonAc}</div>
            <div className="text-sm text-gray-600">Non-AC Rooms</div>
          </div>

          {/* Pending Bookings */}
          <div className="bg-white p-4 rounded border border-gray-200">
            <div className="text-2xl font-bold text-yellow-600">{stats.bookings.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>

          {/* Confirmed Bookings */}
          <div className="bg-white p-4 rounded border border-gray-200">
            <div className="text-2xl font-bold text-green-600">{stats.bookings.confirmed}</div>
            <div className="text-sm text-gray-600">Confirmed</div>
          </div>

          {/* Total Earnings */}
          <div className="bg-white p-4 rounded border border-gray-200">
            <div className="text-2xl font-bold text-purple-600">₹{stats.earnings.total.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Earnings</div>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <button
            onClick={() => navigate('/admin/rooms')}
            className="bg-white p-4 rounded border border-gray-200 hover:border-blue-500 hover:shadow text-left"
          >
            <div className="font-bold text-gray-900">Rooms</div>
            <div className="text-sm text-gray-600">Manage all rooms</div>
          </button>

          <button
            onClick={() => navigate('/admin/bookings')}
            className="bg-white p-4 rounded border border-gray-200 hover:border-blue-500 hover:shadow text-left"
          >
            <div className="font-bold text-gray-900">Bookings</div>
            <div className="text-sm text-gray-600">View all bookings</div>
          </button>

          <button
            onClick={() => navigate('/admin/renters')}
            className="bg-white p-4 rounded border border-gray-200 hover:border-blue-500 hover:shadow text-left"
          >
            <div className="font-bold text-gray-900">Renters</div>
            <div className="text-sm text-gray-600">Manage tenants</div>
          </button>

          <button
            onClick={() => navigate('/admin/payments')}
            className="bg-white p-4 rounded border border-gray-200 hover:border-blue-500 hover:shadow text-left"
          >
            <div className="font-bold text-gray-900">Payments</div>
            <div className="text-sm text-gray-600">Track payments</div>
          </button>

          <button
            onClick={() => navigate('/admin/electricity')}
            className="bg-white p-4 rounded border border-gray-200 hover:border-blue-500 hover:shadow text-left"
          >
            <div className="font-bold text-gray-900">Electricity Bills</div>
            <div className="text-sm text-gray-600">Manage bills</div>
          </button>

          <button
            onClick={() => navigate('/admin/notifications')}
            className="bg-white p-4 rounded border border-gray-200 hover:border-blue-500 hover:shadow text-left"
          >
            <div className="font-bold text-gray-900">Notifications</div>
            <div className="text-sm text-gray-600">
              {stats.unreadNotifications > 0 && (
                <span className="text-red-600 font-bold">{stats.unreadNotifications} unread</span>
              )}
              {stats.unreadNotifications === 0 && "View all"}
            </div>
          </button>

          <button
            onClick={() => navigate('/admin/monthly-billing')}
            className="bg-white p-4 rounded border border-gray-200 hover:border-blue-500 hover:shadow text-left"
          >
            <div className="font-bold text-gray-900">Monthly Billing</div>
            <div className="text-sm text-gray-600">Create & manage bills</div>
          </button>
        </div>

        {/* Recent Bookings Table */}
        <div className="bg-white rounded border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Recent Bookings</h2>
            <button
              onClick={() => navigate('/admin/bookings')}
              className="text-sm text-blue-600 hover:underline"
            >
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Booking ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Room</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Check-in</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stats.recentBookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No bookings yet
                    </td>
                  </tr>
                ) : (
                  stats.recentBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono font-semibold text-blue-600">
                        {booking.bookingId}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-semibold text-gray-900">{booking.customerName}</div>
                        <div className="text-gray-600">{booking.customerPhone}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {booking.room && (
                          <>
                            <div className="font-semibold text-gray-900">{booking.room.title}</div>
                            <div className="text-gray-600">Room {booking.room.roomNumber}</div>
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(booking.checkInDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                        ₹{booking.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                          booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {booking.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboardPractical
