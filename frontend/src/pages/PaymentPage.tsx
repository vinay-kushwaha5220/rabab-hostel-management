import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import api from "../services/apiV2"
import type { BookingType } from "../types/booking"
import LoadingSpinner from "../components/ui/LoadingSpinner"
import Button from "../components/ui/Button"
import Card from "../components/ui/Card"
import Badge from "../components/ui/Badge"

const PaymentPage = () => {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState<BookingType | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<string>("")

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

  const handlePayment = async () => {
    if (!paymentMethod) {
      alert('Please select a payment method')
      return
    }

    try {
      setProcessing(true)
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Process payment
      const response = await api.post("/bookings/payment", {
        bookingId: Number(bookingId),
        paymentMethod,
      })
      
      console.log('Payment processed:', response.data)
      
      // Navigate to confirmation page
      navigate(`/booking-confirmation/${bookingId}`)
    } catch (error: any) {
      console.error('Error processing payment:', error)
      alert(error.response?.data?.message || 'Payment failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Loading payment details..." />
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
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Payment Methods */}
          <div className="lg:col-span-2">
            <Card className="p-6 md:p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">
                Complete Payment
              </h1>
              
              {/* Payment Methods */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Select Payment Method
                </h2>
                
                {/* Card Payment */}
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                    paymentMethod === 'card'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                      paymentMethod === 'card' ? 'border-blue-600' : 'border-gray-300'
                    }`}>
                      {paymentMethod === 'card' && (
                        <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <svg className="w-6 h-6 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        <span className="font-semibold text-gray-900">Credit / Debit Card</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 ml-9">
                        Pay securely with your card
                      </p>
                    </div>
                  </div>
                </button>
                
                {/* UPI Payment */}
                <button
                  onClick={() => setPaymentMethod('upi')}
                  className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                    paymentMethod === 'upi'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                      paymentMethod === 'upi' ? 'border-blue-600' : 'border-gray-300'
                    }`}>
                      {paymentMethod === 'upi' && (
                        <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <svg className="w-6 h-6 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span className="font-semibold text-gray-900">UPI</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 ml-9">
                        Google Pay, PhonePe, Paytm & more
                      </p>
                    </div>
                  </div>
                </button>
                
                {/* Online Banking */}
                <button
                  onClick={() => setPaymentMethod('online')}
                  className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                    paymentMethod === 'online'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                      paymentMethod === 'online' ? 'border-blue-600' : 'border-gray-300'
                    }`}>
                      {paymentMethod === 'online' && (
                        <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <svg className="w-6 h-6 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span className="font-semibold text-gray-900">Net Banking</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 ml-9">
                        All major banks supported
                      </p>
                    </div>
                  </div>
                </button>
                
                {/* Pay at Hotel */}
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                    paymentMethod === 'cash'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                      paymentMethod === 'cash' ? 'border-blue-600' : 'border-gray-300'
                    }`}>
                      {paymentMethod === 'cash' && (
                        <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <svg className="w-6 h-6 mr-3 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="font-semibold text-gray-900">Pay at Hotel</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 ml-9">
                        Cash or card at check-in
                      </p>
                    </div>
                  </div>
                </button>
              </div>
              
              {/* Payment Button */}
              <div className="mt-8">
                <Button
                  onClick={handlePayment}
                  className="w-full"
                  size="lg"
                  isLoading={processing}
                  disabled={!paymentMethod || processing}
                >
                  {processing ? 'Processing Payment...' : `Pay ₹${finalAmount.toLocaleString()}`}
                </Button>
                
                <div className="mt-4 flex items-center justify-center text-sm text-gray-600">
                  <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Secure payment powered by Rabab Stay</span>
                </div>
              </div>
            </Card>
          </div>
          
          {/* Right Column - Booking Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Booking Summary
              </h2>
              
              {/* Room Image */}
              {booking.room && (
                <>
                  <div className="mb-4 rounded-lg overflow-hidden">
                    <img
                      src={booking.room.images && booking.room.images.length > 0 
                        ? booking.room.images[0] 
                        : 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800'}
                      alt={booking.room.title}
                      className="w-full h-40 object-cover"
                    />
                  </div>
                  
                  {/* Room Details */}
                  <div className="mb-4">
                    <h3 className="font-bold text-lg text-gray-900 mb-1">
                      {booking.room.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Room {booking.room.roomNumber} • Floor {booking.room.floor}
                    </p>
                    <div className="flex gap-2">
                      <Badge variant={booking.room.roomType === 'AC' ? 'info' : 'secondary'} size="sm">
                        {booking.room.roomType}
                      </Badge>
                      <Badge variant="primary" size="sm">
                        {booking.room.bookingType}
                      </Badge>
                    </div>
                  </div>
                </>
              )}
              
              {/* Booking Details */}
              <div className="border-t border-gray-200 pt-4 mb-4 space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Booking ID</p>
                  <p className="font-bold text-blue-600">{booking.bookingId}</p>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Guest Name:</span>
                  <span className="font-semibold text-gray-900">{booking.customerName}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Check-in:</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(booking.checkInDate).toLocaleDateString('en-IN', { 
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Check-out:</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(booking.checkOutDate).toLocaleDateString('en-IN', { 
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-semibold text-gray-900">
                    {booking.totalDays} {booking.totalDays === 1 ? 'day' : 'days'}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Guests:</span>
                  <span className="font-semibold text-gray-900">
                    {booking.numberOfGuests} {booking.numberOfGuests === 1 ? 'person' : 'people'}
                  </span>
                </div>
              </div>
              
              {/* Price Breakdown */}
              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Room charges</span>
                  <span className="font-semibold text-gray-900">
                    ₹{booking.totalAmount.toLocaleString()}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Taxes & fees (12%)</span>
                  <span className="font-semibold text-gray-900">
                    ₹{taxAmount.toLocaleString()}
                  </span>
                </div>
                
                <div className="border-t border-gray-200 pt-3 flex justify-between">
                  <span className="font-bold text-gray-900">Total Amount</span>
                  <span className="font-bold text-2xl text-blue-600">
                    ₹{finalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentPage
