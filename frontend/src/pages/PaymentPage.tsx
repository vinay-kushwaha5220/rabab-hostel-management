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
    window.scrollTo(0, 0)
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
      await new Promise(resolve => setTimeout(resolve, 2500))
      await api.post("/bookings/payment", {
        bookingId: Number(bookingId),
        paymentMethod,
      })
      setPaymentStatus('success')
      await new Promise(resolve => setTimeout(resolve, 1500))
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
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <LoadingSpinner size="xl" text="Finalizing your booking invoice..." />
      </div>
    )
  }

  if (!booking) return null

  const isMonthly = booking.bookingType === 'MONTHLY'
  const SECURITY_DEPOSIT = 2500
  
  // For monthly bookings: totalAmount already includes deposit
  // For daily bookings: totalAmount is just the rent
  const baseAmount = isMonthly ? booking.totalAmount - SECURITY_DEPOSIT : booking.totalAmount
  const tax = Math.round(baseAmount * 0.12)
  const securityDeposit = isMonthly ? SECURITY_DEPOSIT : 0
  const finalAmount = booking.totalAmount + tax

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8 relative">
      {/* Premium Payment Overlay */}
      {(paymentStatus === 'processing' || paymentStatus === 'success') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm">
          <Card className="p-8 text-center max-w-xs w-full shadow-2xl border-none bg-white rounded-2xl animate-in zoom-in duration-200">
            {paymentStatus === 'processing' ? (
              <div className="space-y-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <h3 className="text-xl font-bold text-gray-900 tracking-tight">Processing Payment</h3>
                <p className="text-gray-400 font-medium text-xs">Please do not refresh the page...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-xl font-bold text-green-600 tracking-tight">Payment Verified!</h3>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Booking Confirmed</p>
              </div>
            )}
          </Card>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Payment Methods Section */}
          <div className="flex-grow space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
              <h1 className="text-2xl font-bold text-gray-900 mb-1 tracking-tight">Payment Method</h1>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px] mb-6">Secure & Encrypted Transactions</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'CARD', label: 'Card Payment', sub: 'Credit/Debit', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
                  { id: 'UPI', label: 'UPI Instant', sub: 'GPay, PhonePe, Paytm', icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z' },
                  { id: 'ONLINE', label: 'Net Banking', sub: 'All major banks', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
                  { id: 'CASH', label: 'Pay at Property', sub: 'At check-in', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' }
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`p-4 rounded-xl border transition-all text-left group ${
                      paymentMethod === method.id 
                        ? 'border-blue-600 bg-blue-50/50 shadow-sm' 
                        : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${paymentMethod === method.id ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-400 group-hover:text-blue-600'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={method.icon} /></svg>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${paymentMethod === method.id ? 'border-blue-600' : 'border-gray-200'}`}>
                        {paymentMethod === method.id && <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>}
                      </div>
                    </div>
                    <p className="font-bold text-gray-900 text-sm">{method.label}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight mt-0.5">{method.sub}</p>
                  </button>
                ))}
              </div>

              <div className="mt-8 pt-8 border-t border-gray-50">
                <Button 
                  onClick={handlePayment} 
                  size="lg"
                  className="w-full text-sm font-bold uppercase tracking-widest shadow-md" 
                  isLoading={processing}
                  disabled={!paymentMethod || processing}
                >
                  Pay ₹{finalAmount.toLocaleString()}
                </Button>
                <div className="flex items-center justify-center gap-2 mt-4 text-gray-400">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  <span className="text-[9px] font-bold uppercase tracking-widest">Secure 256-bit SSL Encryption</span>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Invoice Sidebar */}
          <div className="w-full lg:w-[360px]">
            <div className="sticky top-20 space-y-4">
              <Card className="p-6 border-none shadow-sm bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-50">
                  <h2 className="text-lg font-bold text-gray-900 tracking-tight">Invoice</h2>
                  <Badge variant="primary" size="sm">REVIEW</Badge>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Property</p>
                    <p className="font-bold text-gray-900 text-sm">{booking.room?.title}</p>
                    <p className="text-[10px] font-medium text-gray-500">Room {booking.room?.roomNumber} • Floor {booking.room?.floor}</p>
                  </div>
                  
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Booking ID</p>
                    <p className="font-bold text-blue-600 text-xs tracking-wider">{booking.bookingId}</p>
                  </div>
                </div>

                <div className="space-y-3 py-6 border-y border-gray-50">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-gray-500">Room Rent</span>
                    <span className="font-bold text-gray-900">₹{baseAmount.toLocaleString()}</span>
                  </div>
                  {isMonthly && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-gray-500">Security Deposit</span>
                      <span className="font-bold text-gray-900">₹{securityDeposit.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-gray-500">GST (12%)</span>
                    <span className="font-bold text-gray-900">₹{tax.toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Total Payable</p>
                      <p className="text-3xl font-black text-blue-700 tracking-tight">₹{finalAmount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-none shadow-xl bg-gray-900 rounded-3xl text-white">
                <div className="flex gap-4 items-center">
                  <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest mb-1 text-white/50">Next Step</p>
                    <p className="text-sm font-bold">Check-in details will be sent to <span className="text-blue-400">{booking.customerEmail}</span> after successful payment.</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentPage
