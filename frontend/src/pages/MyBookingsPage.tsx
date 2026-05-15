import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../services/apiV2"
import type { BookingType } from "../types/booking"
import LoadingSpinner from "../components/ui/LoadingSpinner"
import Card from "../components/ui/Card"
import Badge from "../components/ui/Badge"
import Button from "../components/ui/Button"

const MyBookingsPage = () => {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState<BookingType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMyBookings()
  }, [])

  const fetchMyBookings = async () => {
    try {
      setLoading(true)
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
        <LoadingSpinner size="lg" text="Loading bookings..." />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">My Bookings</h1>
        <p className="text-xs text-gray-400 font-medium mt-1">Manage your room reservations</p>
      </div>

      {/* Active Bookings */}
      {activeBookings.length > 0 && (
        <div className="mb-8">
          <h2 className="text-base font-bold text-gray-900 mb-3 tracking-tight">Active Bookings</h2>
          <div className="space-y-3">
            {activeBookings.map((booking) => (
              <Card key={booking.id} className="p-4 border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={booking.status === "CONFIRMED" ? "success" : "warning"} size="sm">
                        {booking.status}
                      </Badge>
                      <Badge variant={booking.bookingType === "MONTHLY" ? "primary" : "info"} size="sm">
                        {booking.bookingType}
                      </Badge>
                      <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">ID: {booking.bookingId}</span>
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-3">
                      {booking.room?.title || "Room"}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <p className="text-gray-400 font-bold uppercase text-[9px]">Check-in</p>
                        <p className="font-bold text-gray-700">{new Date(booking.checkInDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 font-bold uppercase text-[9px]">Check-out</p>
                        <p className="font-bold text-gray-700">{new Date(booking.checkOutDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 font-bold uppercase text-[9px]">Duration</p>
                        <p className="font-bold text-gray-700">{booking.totalDays} {booking.bookingType === 'MONTHLY' ? 'Days' : 'Nights'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 font-bold uppercase text-[9px]">Total</p>
                        <p className="font-bold text-gray-900">₹{booking.totalAmount.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate(`/booking-confirmation/${booking.id}`)}
                    size="sm"
                    className="md:w-auto"
                  >
                    View Details
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Past Bookings */}
      {pastBookings.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-gray-900 mb-3 tracking-tight">Past Bookings</h2>
          <div className="space-y-3">
            {pastBookings.map((booking) => (
              <Card key={booking.id} className="p-4 opacity-75 hover:opacity-100 transition-all border-gray-100 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={booking.status === "COMPLETED" ? "secondary" : "danger"} size="sm">
                        {booking.status}
                      </Badge>
                      <Badge variant={booking.bookingType === "MONTHLY" ? "primary" : "info"} size="sm">
                        {booking.bookingType}
                      </Badge>
                      <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">ID: {booking.bookingId}</span>
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-3">
                      {booking.room?.title || "Room"}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <p className="text-gray-400 font-bold uppercase text-[9px]">Check-in</p>
                        <p className="font-bold text-gray-700">{new Date(booking.checkInDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 font-bold uppercase text-[9px]">Check-out</p>
                        <p className="font-bold text-gray-700">{new Date(booking.checkOutDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 font-bold uppercase text-[9px]">Duration</p>
                        <p className="font-bold text-gray-700">{booking.totalDays} Nights</p>
                      </div>
                      <div>
                        <p className="text-gray-400 font-bold uppercase text-[9px]">Total</p>
                        <p className="font-bold text-gray-900">₹{booking.totalAmount.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate(`/booking-confirmation/${booking.id}`)}
                    variant="outline"
                    size="sm"
                  >
                    Details
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No Bookings */}
      {bookings.length === 0 && (
        <Card className="p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-gray-600 text-lg font-medium">No bookings yet</p>
          <p className="text-gray-500 text-sm mt-2">Start by browsing available rooms</p>
          <button
            onClick={() => navigate("/rooms")}
            className="mt-6 bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Browse Rooms
          </button>
        </Card>
      )}
    </div>
  )
}

export default MyBookingsPage
