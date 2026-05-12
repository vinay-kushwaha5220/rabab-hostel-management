import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import api from "../services/api"
import type { BookingType } from "../types/booking"
import LoadingSpinner from "../components/ui/LoadingSpinner"
import Button from "../components/ui/Button"
import Card from "../components/ui/Card"
import Badge from "../components/ui/Badge"

const BookingConfirmationPage = () => {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState<BookingType | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBookingDetails()
  }, [bookingId])

  const fetchBookingDetails = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/bookings/${bookingId}`)
      setBooking(response.data)
    } catch (error) {
      console.error('Error fetching booking details:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Loading confirmation..." />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Booking Not Found</h2>
          <Button onClick={() => navigate('/rooms')}>Back to Rooms</Button>
        </div>
      </div>
    )
  }

  const taxAmount = Math.round(booking.totalAmount * 0.12)
  const finalAmount = booking.totalAmount + taxAmount

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6 animate-bounce">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Booking Confirmed! 🎉
          </h1>
          <p className="text-xl text-gray-600">
            Your reservation has been successfully confirmed
          </p>
        </div>

        {/* Booking Details Card */}
        <Card className="p-8 mb-6">
          {/* Booking ID - Prominent */}
          <div className="text-center mb-8 pb-6 border-b border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Booking ID</p>
            <p className="text-3xl font-bold text-blue-600 tracking-wide">
              {booking.bookingId}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Please save this ID for future reference
            </p>
          </div>

          {/* Room & Guest Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Room Details */}
            {booking.room && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Room Details</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <div>
                      <p className="font-semibold text-gray-900">{booking.room.title}</p>
                      <p className="text-sm text-gray-600">Room {booking.room.roomNumber} • Floor {booking.room.floor}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                    <div className="flex gap-2">
                      <Badge variant={booking.room.roomType === 'AC' ? 'info' : 'secondary'} size="sm">
                        {booking.room.roomType}
                      </Badge>
                      <Badge variant="primary" size="sm">
                        {booking.room.bookingType}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Guest Details */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Guest Details</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-900">{booking.customerName}</p>
                    <p className="text-sm text-gray-600">Primary Guest</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-700">{booking.customerEmail}</p>
                </div>
                
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <p className="text-gray-700">{booking.customerPhone}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Check-in/Check-out Details */}
          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Check-in</p>
                <p className="text-xl font-bold text-gray-900">
                  {new Date(booking.checkInDate).toLocaleDateString('en-IN', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </p>
                <p className="text-sm text-gray-600 mt-1">After 12:00 PM</p>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Duration</p>
                <p className="text-xl font-bold text-gray-900">
                  {booking.totalDays} {booking.totalDays === 1 ? 'Night' : 'Nights'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {booking.numberOfGuests} {booking.numberOfGuests === 1 ? 'Guest' : 'Guests'}
                </p>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Check-out</p>
                <p className="text-xl font-bold text-gray-900">
                  {new Date(booking.checkOutDate).toLocaleDateString('en-IN', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </p>
                <p className="text-sm text-gray-600 mt-1">Before 11:00 AM</p>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-gray-700">
                <span>Room charges ({booking.totalDays} {booking.totalDays === 1 ? 'day' : 'days'})</span>
                <span className="font-semibold">₹{booking.totalAmount.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between text-gray-700">
                <span>Taxes & fees (12%)</span>
                <span className="font-semibold">₹{taxAmount.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                <span className="text-lg font-bold text-gray-900">Total Paid</span>
                <span className="text-2xl font-bold text-green-600">
                  ₹{finalAmount.toLocaleString()}
                </span>
              </div>
              
              <div className="flex items-center justify-between bg-green-50 rounded-lg p-3 mt-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold text-green-800">Payment Status</span>
                </div>
                <Badge variant="success">Paid</Badge>
              </div>
              
              {booking.payment && booking.payment.transactionId && (
                <div className="text-sm text-gray-600 mt-2">
                  Transaction ID: <span className="font-mono font-semibold">{booking.payment.transactionId}</span>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Important Information */}
        <Card className="p-6 mb-6 bg-yellow-50 border border-yellow-200">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
            <svg className="w-6 h-6 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Important Information
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <span className="text-yellow-600 mr-2">•</span>
              <span>Please carry a valid ID proof for check-in</span>
            </li>
            <li className="flex items-start">
              <span className="text-yellow-600 mr-2">•</span>
              <span>Check-in time: 12:00 PM | Check-out time: 11:00 AM</span>
            </li>
            <li className="flex items-start">
              <span className="text-yellow-600 mr-2">•</span>
              <span>For any queries, contact us at +91-XXXXXXXXXX</span>
            </li>
            <li className="flex items-start">
              <span className="text-yellow-600 mr-2">•</span>
              <span>Cancellation policy: Free cancellation up to 24 hours before check-in</span>
            </li>
          </ul>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={() => navigate('/my-bookings')}
            className="flex-1"
            size="lg"
          >
            View My Bookings
          </Button>
          
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="flex-1"
            size="lg"
          >
            Back to Home
          </Button>
        </div>

        {/* Confirmation Email Note */}
        <p className="text-center text-sm text-gray-600 mt-6">
          A confirmation email has been sent to <span className="font-semibold">{booking.customerEmail}</span>
        </p>
      </div>
    </div>
  )
}

export default BookingConfirmationPage
