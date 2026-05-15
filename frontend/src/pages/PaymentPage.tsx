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
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success'>('idle')
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
      setPaymentStatus('processing')
      
      // Simulate payment processing delay for demo realism
      await new Promise(resolve => setTimeout(resolve, 2500))
      
      // Process payment in backend
      const response = await api.post("/bookings/payment", {
        bookingId: Number(bookingId),
        paymentMethod,
      })
      
      console.log('Payment processed:', response.data)
      
      // Show success state
      setPaymentStatus('success')
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Navigate to confirmation page
      navigate(`/booking-confirmation/${bookingId}`)
    } catch (error: any) {
      setPaymentStatus('idle')
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
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 relative">
      {/* Payment Processing Overlay */}
      {(paymentStatus === 'processing' || paymentStatus === 'success') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-75 backdrop-blur-sm">
          <Card className="p-10 text-center max-w-sm w-full shadow-2xl transform scale-110">
            {paymentStatus === 'processing' ? (
              <div className="space-y-6">
                <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <h3 className="text-2xl font-bold text-gray-900">Processing Payment...</h3>
                <p className="text-gray-600">Please do not refresh the page or close your browser.</p>
              </div>
            ) : (
              <div className="space-y-6 animate-bounce">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-green-600">Demo Payment Successful!</h3>
                <p className="text-gray-900 font-medium">Confirming your booking...</p>
              </div>
            )}
          </Card>
        </div>
      )}

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
                  onClick={() => setPaymentMethod('CARD')}
                  className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                    paymentMethod === 'CARD'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                      paymentMethod === 'CARD' ? 'border-blue-600' : 'border-gray-300'
                    }`}>
                      {paymentMethod === 'CARD' && (
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
                  onClick={() => setPaymentMethod('UPI')}
                  className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                    paymentMethod === 'UPI'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                      paymentMethod === 'UPI' ? 'border-blue-600' : 'border-gray-300'
                    }`}>
                      {paymentMethod === 'UPI' && (
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
                  onClick={() => setPaymentMethod('ONLINE')}
                  className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                    paymentMethod === 'ONLINE'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                      paymentMethod === 'ONLINE' ? 'border-blue-600' : 'border-gray-300'
                    }`}>
                      {paymentMethod === 'ONLINE' && (
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
                  onClick={() => setPaymentMethod('CASH')}
                  className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                    paymentMethod === 'CASH'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                      paymentMethod === 'CASH' ? 'border-blue-600' : 'border-gray-300'
                    }`}>
                      {paymentMethod === 'CASH' && (
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
                  <div className="mb-4 rounded-lg overflow-hidden border border-gray-200 shadow-inner bg-gray-100">
                    {(() => {
                      let imageUrl = 'https://images.unsplash.com/photo-1555854817-5b2738f751a1?w=800'; // Default Modern Hostel
                      
                      try {
                        if (booking.room.images) {
                          const images = typeof booking.room.images === 'string' 
                            ? JSON.parse(booking.room.images) 
                            : booking.room.images;
                          
                          if (Array.isArray(images) && images.length > 0) {
                            imageUrl = images[0];
                          }
                        }
                      } catch (e) {
                        console.warn("Failed to parse room images:", e);
                      }

                      // Room specific fallbacks for demo realism
                      if (imageUrl.includes('unsplash') || !imageUrl) {
                        if (booking.room.title.toLowerCase().includes('ac')) {
                          imageUrl = 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800'; // Luxury AC Room
                        } else if (booking.room.title.toLowerCase().includes('suite')) {
                          imageUrl = 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800'; // Suite
                        }
                      }

                      return (
                        <img
                          src={imageUrl}
                          alt={booking.room.title}
                          className="w-full h-44 object-cover transition-transform duration-500 hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555854817-5b2738f751a1?w=800';
                          }}
                        />
                      );
                    })()}
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
