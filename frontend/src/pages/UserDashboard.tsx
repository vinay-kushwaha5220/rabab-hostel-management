import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContextV2"
import api from "../services/apiV2"
import type { BookingType } from "../types/booking"

const UserDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [bookings, setBookings] = useState<BookingType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMyBookings()
  }, [])

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

  const activeBookings = bookings.filter(b => b.status === "CONFIRMED" || b.status === "PENDING")
  const pastBookings = bookings.filter(b => b.status === "COMPLETED" || b.status === "CANCELLED")

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.name}!</h1>
          <p className="text-blue-100">Manage your bookings and account</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Active Bookings</p>
                <p className="text-3xl font-bold text-gray-900">{activeBookings.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Bookings</p>
                <p className="text-3xl font-bold text-gray-900">{bookings.length}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Spent</p>
                <p className="text-3xl font-bold text-gray-900">
                  ₹{bookings.reduce((sum, b) => sum + b.totalAmount, 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => navigate("/rooms")}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-full group-hover:bg-blue-200 transition-colors">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Browse Rooms</h3>
                <p className="text-sm text-gray-600">Find your perfect stay</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate("/contact")}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-full group-hover:bg-green-200 transition-colors">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Contact Admin</h3>
                <p className="text-sm text-gray-600">Get help & support</p>
              </div>
            </div>
          </button>
        </div>

        {/* Active Bookings */}
        {activeBookings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Active Bookings</h2>
            <div className="space-y-4">
              {activeBookings.map((booking) => (
                <div key={booking.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                          {booking.status.toUpperCase()}
                        </span>
                        <span className="text-gray-600 text-sm">Booking ID: {booking.bookingId}</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {booking.room?.title || "Room"}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Room Number</p>
                          <p className="font-semibold text-gray-900">{booking.room?.roomNumber}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Check-in</p>
                          <p className="font-semibold text-gray-900">
                            {new Date(booking.checkInDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Check-out</p>
                          <p className="font-semibold text-gray-900">
                            {new Date(booking.checkOutDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Total Amount</p>
                          <p className="font-semibold text-gray-900">₹{booking.totalAmount.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => navigate(`/booking-confirmation/${booking.id}`)}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => navigate("/contact")}
                        className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Contact Admin
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Past Bookings */}
        {pastBookings.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Past Bookings</h2>
            <div className="space-y-4">
              {pastBookings.map((booking) => (
                <div key={booking.id} className="bg-white rounded-xl shadow-md p-6 opacity-75">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${booking.status === "COMPLETED"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-red-100 text-red-800"
                          }`}>
                          {booking.status.toUpperCase()}
                        </span>
                        <span className="text-gray-600 text-sm">Booking ID: {booking.bookingId}</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {booking.room?.title || "Room"}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Room Number</p>
                          <p className="font-semibold text-gray-900">{booking.room?.roomNumber}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Check-in</p>
                          <p className="font-semibold text-gray-900">
                            {new Date(booking.checkInDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Check-out</p>
                          <p className="font-semibold text-gray-900">
                            {new Date(booking.checkOutDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Total Amount</p>
                          <p className="font-semibold text-gray-900">₹{booking.totalAmount.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/booking-confirmation/${booking.id}`)}
                      className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Bookings */}
        {bookings.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Bookings Yet</h3>
            <p className="text-gray-600 mb-6">Start your journey by booking your first room!</p>
            <button
              onClick={() => navigate("/rooms")}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Browse Available Rooms
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserDashboard
