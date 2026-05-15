import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import api from "../services/apiV2"
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Loading confirmation..." />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Booking Not Found</h2>
          <p className="text-gray-600 mb-6">We couldn't find the booking details you're looking for.</p>
          <Button onClick={() => navigate('/rooms')} className="bg-blue-600 hover:bg-blue-700">
            Back to Rooms
          </Button>
        </div>
      </div>
    )
  }

  const taxAmount = Math.round(booking.totalAmount * 0.12)
  const finalAmount = booking.totalAmount + taxAmount

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-28 h-28 bg-gradient-to-br from-green-400 to-green-600 rounded-full mb-8 shadow-lg">
            <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 mb-3 tracking-tight">
            Booking Confirmed
          </h1>
          <p className="text-xl text-gray-600 font-light">
            Your reservation has been successfully confirmed. A confirmation email has been sent to your inbox.
          </p>
        </div>

        {/* Booking Reference Card */}
        <Card className="p-8 mb-8 shadow-xl border-0">
          <div className="flex items-center justify-between mb-8 pb-8 border-b-2 border-gray-100">
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Booking Reference</p>
              <p className="text-4xl font-bold text-blue-600 font-mono tracking-wider">
                {booking.bookingId}
              </p>
            </div>
            <div className="text-right">
              <Badge variant="success" size="lg">
                ✓ Confirmed
              </Badge>
            </div>
          </div>

          {/* Room & Guest Information Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-10">
            {/* Room Information */}
            {booking.room && (
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-6">Room Information</h3>
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-100">
                        <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 font-medium">Room Name</p>
                      <p className="text-lg font-semibold text-gray-900">{booking.room.title}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-100">
                        <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 font-medium">Room Details</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="info" size="sm">{booking.room.roomNumber}</Badge>
                        <Badge variant="secondary" size="sm">Floor {booking.room.floor}</Badge>
                        <Badge variant="primary" size="sm">{booking.room.roomType}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-100">
                        <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 font-medium">Booking Type</p>
                      <p className="text-lg font-semibold text-gray-900">{booking.room.bookingType}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Guest Information */}
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-6">Guest Information</h3>
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-green-100">
                      <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 font-medium">Guest Name</p>
                    <p className="text-lg font-semibold text-gray-900">{booking.customerName}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-green-100">
                      <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 font-medium">Email Address</p>
                    <p className="text-base font-medium text-gray-900 break-all">{booking.customerEmail}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-green-100">
                      <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 font-medium">Phone Number</p>
                    <p className="text-base font-medium text-gray-900">{booking.customerPhone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-green-100">
                      <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zM6 20a6 6 0 0112 0v2H6v-2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 font-medium">Number of Guests</p>
                    <p className="text-lg font-semibold text-gray-900">{booking.numberOfGuests} {booking.numberOfGuests === 1 ? 'Guest' : 'Guests'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stay Duration */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 mb-10 border border-blue-100">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-6">Stay Duration</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <p className="text-sm text-gray-600 font-medium mb-2">Check-in Date</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Date(booking.checkInDate).toLocaleDateString('en-IN', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </p>
                <p className="text-xs text-gray-600 mt-2">After 12:00 PM</p>
              </div>
              
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-gray-600 font-medium mb-2">Duration</p>
                  <p className="text-3xl font-bold text-blue-600">{booking.totalDays}</p>
                  <p className="text-xs text-gray-600 mt-2">{booking.totalDays === 1 ? 'Night' : 'Nights'}</p>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600 font-medium mb-2">Check-out Date</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Date(booking.checkOutDate).toLocaleDateString('en-IN', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </p>
                <p className="text-xs text-gray-600 mt-2">Before 11:00 AM</p>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="border-t-2 border-gray-100 pt-10">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-6">Payment Summary</h3>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">Room charges ({booking.totalDays} {booking.totalDays === 1 ? 'day' : 'days'})</span>
                <span className="text-lg font-semibold text-gray-900">₹{booking.totalAmount.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">Taxes & fees (12%)</span>
                <span className="text-lg font-semibold text-gray-900">₹{taxAmount.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t-2 border-gray-100">
                <span className="text-lg font-bold text-gray-900">Total Amount Paid</span>
                <span className="text-3xl font-bold text-green-600">
                  ₹{finalAmount.toLocaleString()}
                </span>
              </div>
            </div>
            
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 flex items-center gap-3">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-green-900">Payment Confirmed</p>
                <p className="text-sm text-green-800">Your payment has been successfully processed</p>
              </div>
            </div>
            
            {booking.payment && Array.isArray(booking.payment) && booking.payment.length > 0 && booking.payment[0].transactionId && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Transaction ID</p>
                <p className="font-mono font-semibold text-gray-900 break-all">{booking.payment[0].transactionId}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Important Information */}
        <Card className="p-8 mb-8 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 shadow-lg">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-amber-200">
                <svg className="h-7 w-7 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Important Information</h3>
              <p className="text-sm text-gray-700 mt-1">Please review these details before your check-in</p>
            </div>
          </div>
          
          <ul className="space-y-3 text-gray-800">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-amber-200 text-amber-700 text-sm font-bold">1</span>
              <span className="text-base font-medium">Carry a valid government-issued ID proof for check-in</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-amber-200 text-amber-700 text-sm font-bold">2</span>
              <span className="text-base font-medium">Check-in: 12:00 PM | Check-out: 11:00 AM</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-amber-200 text-amber-700 text-sm font-bold">3</span>
              <span className="text-base font-medium">For any queries, contact us at +91-XXXXXXXXXX or email support@rabab.com</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-amber-200 text-amber-700 text-sm font-bold">4</span>
              <span className="text-base font-medium">Free cancellation up to 24 hours before check-in</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-amber-200 text-amber-700 text-sm font-bold">5</span>
              <span className="text-base font-medium">A confirmation email has been sent to your registered email address</span>
            </li>
          </ul>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all"
            size="lg"
          >
            <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            View My Bookings
          </Button>
          
          <Button
            onClick={() => navigate('/')}
            className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all"
            size="lg"
          >
            <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Back to Home
          </Button>
        </div>

        {/* Confirmation Email Note */}
        <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-gray-700">
            A detailed confirmation email has been sent to <span className="font-bold text-blue-600">{booking.customerEmail}</span>
          </p>
          <p className="text-sm text-gray-600 mt-2">Check your spam folder if you don't see it in your inbox</p>
        </div>
      </div>
    </div>
  )
}

export default BookingConfirmationPage
