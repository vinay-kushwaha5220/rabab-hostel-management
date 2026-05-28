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
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'awaiting_verification'>('idle')
  const [paymentMethod, setPaymentMethod] = useState<string>("")

  // New Modals/States
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showUPIModal, setShowUPIModal] = useState(false)
  const [showComingSoonModal, setShowComingSoonModal] = useState(false)
  const [utrNumber, setUtrNumber] = useState("")
  const [utrError, setUtrError] = useState("")

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

  const getButtonLabel = () => {
    if (paymentMethod === "UPI") return "Pay with UPI"
    if (paymentMethod === "CARD") return "Pay with Card"
    if (paymentMethod === "ONLINE") return "Continue to Bank"
    if (paymentMethod === "CASH") return "Confirm Booking"
    return "Select a Payment Method"
  }

  const getMethodLabel = (method: string) => {
    if (method === "UPI") return "UPI Instant"
    if (method === "CARD") return "Card Payment"
    if (method === "ONLINE") return "Net Banking"
    if (method === "CASH") return "Pay at Property"
    return method
  }

  const handlePayClick = () => {
    if (!paymentMethod) {
      alert("Please select a payment method")
      return
    }
    setShowConfirmModal(true)
  }

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true)
        return
      }
      const script = document.createElement("script")
      script.src = "https://checkout.razorpay.com/v1/checkout.js"
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const processOnlinePayment = async () => {
    if (!booking) {
      alert("Booking details not loaded yet. Please wait.")
      return
    }
    try {
      setProcessing(true)
      setPaymentStatus('processing')

      // 1. Load Razorpay script
      const isScriptLoaded = await loadRazorpayScript()
      if (!isScriptLoaded) {
        alert("Failed to load secure payment gateway. Please check your network connection.")
        setPaymentStatus('idle')
        setProcessing(false)
        return
      }

      // 2. Create order on backend
      const orderRes = await api.post("/bookings/razorpay/create-order", {
        bookingId: Number(bookingId)
      })

      const { orderId, amount, currency, keyId } = orderRes.data

      // 3. Configure Razorpay options
      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: "Rabab Stay",
        description: `Booking Settle — ${booking.bookingId}`,
        image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=200",
        order_id: orderId,
        handler: async function (response: any) {
          try {
            setProcessing(true)
            setPaymentStatus('processing')

            // 4. Verify payment on backend
            await api.post("/bookings/razorpay/verify", {
              bookingId: Number(bookingId),
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })

            setPaymentStatus('success')
            await new Promise(resolve => setTimeout(resolve, 1500))
            navigate(`/booking-confirmation/${bookingId}`)
          } catch (err: any) {
            console.error("Payment verification failure:", err)
            alert(err.response?.data?.message || "Failed to verify transaction signature securely.")
            setPaymentStatus('idle')
          } finally {
            setProcessing(false)
          }
        },
        prefill: {
          name: booking.customerName || "",
          email: booking.customerEmail || "",
          contact: booking.customerPhone || "",
        },
        notes: {
          bookingId: String(bookingId)
        },
        theme: {
          color: "#1e293b"
        },
        modal: {
          ondismiss: function () {
            setPaymentStatus('idle')
            setProcessing(false)
          }
        }
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.open()
    } catch (err: any) {
      console.error("Initialize online transaction failed:", err)
      alert(err.response?.data?.message || "Failed to initialize online transaction.")
      setPaymentStatus('idle')
      setProcessing(false)
    }
  }

  const handleConfirmAction = async () => {
    setShowConfirmModal(false)
    if (paymentMethod === "CARD" || paymentMethod === "ONLINE" || paymentMethod === "UPI") {
      await processOnlinePayment()
    } else if (paymentMethod === "CASH") {
      await processCashPayment()
    }
  }

  const processCashPayment = async () => {
    try {
      setProcessing(true)
      setPaymentStatus('processing')
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      await api.post("/bookings/payment", {
        bookingId: Number(bookingId),
        paymentMethod: 'CASH',
      })
      
      setPaymentStatus('success')
      await new Promise(resolve => setTimeout(resolve, 1500))
      navigate(`/booking-confirmation/${bookingId}`)
    } catch (error: any) {
      setPaymentStatus('idle')
      console.error('Error processing CASH payment:', error)
      alert(error.response?.data?.message || 'Payment failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const submitUPIPayment = async () => {
    if (!utrNumber) {
      setUtrError("UTR reference number is required")
      return
    }
    if (!/^\d{12}$/.test(utrNumber)) {
      setUtrError("UTR must be exactly a 12-digit number")
      return
    }
    setUtrError("")

    try {
      setProcessing(true)
      await api.post("/bookings/payment", {
        bookingId: Number(bookingId),
        paymentMethod: 'UPI',
        transactionId: utrNumber,
      })
      setShowUPIModal(false)
      setPaymentStatus('awaiting_verification')
    } catch (error: any) {
      console.error('Error submitting UPI payment:', error)
      setUtrError(error.response?.data?.message || 'Failed to submit payment. Please verify your UTR.')
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
  
  const baseAmount = isMonthly ? booking.totalAmount - SECURITY_DEPOSIT : booking.totalAmount
  const securityDeposit = isMonthly ? SECURITY_DEPOSIT : 0
  const finalAmount = booking.totalAmount

  // Dynamic QR Code link
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    `upi://pay?pa=6386227501@axl&pn=Rabab Hostel&am=${finalAmount}&cu=INR`
  )}`

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8 relative">
      {/* Standard Processing/Success Overlay */}
      {(paymentStatus === 'processing' || paymentStatus === 'success') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
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
                <h3 className="text-xl font-bold text-green-600 tracking-tight">Booking Saved!</h3>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Redirecting to details</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Awaiting Admin Verification Overlay */}
      {paymentStatus === 'awaiting_verification' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <Card className="p-8 text-center max-w-md w-full shadow-2xl border-none bg-white rounded-2xl animate-in zoom-in duration-200">
            <div className="space-y-6">
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500 animate-pulse border border-amber-100">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Awaiting Admin Verification</h3>
                <p className="text-[10px] text-blue-600 font-extrabold uppercase tracking-widest font-mono">Reservation: {booking.bookingId}</p>
              </div>
              <p className="text-sm font-semibold text-gray-500 max-w-sm mx-auto leading-relaxed">
                Your payment of <span className="font-extrabold text-slate-800">₹{finalAmount.toLocaleString()}</span> via UPI (UTR: <span className="font-mono font-bold text-blue-600">{utrNumber}</span>) has been recorded successfully.
              </p>
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-left text-xs font-semibold text-slate-600 space-y-2">
                <div className="flex justify-between items-center"><span className="text-gray-400">Payment status:</span> <Badge variant="warning" size="sm" className="font-black text-[9px]">PAYMENT_PENDING</Badge></div>
                <div className="flex justify-between items-center"><span className="text-gray-400">Verification status:</span> <span className="font-extrabold text-amber-600 text-[10px] uppercase">Awaiting Approval</span></div>
              </div>
              <div className="pt-2">
                <Button onClick={() => navigate('/dashboard')} className="w-full text-xs font-black uppercase tracking-widest py-3">
                  Go to My Dashboard
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <Card className="p-6 max-w-sm w-full shadow-2xl border-none bg-white rounded-2xl animate-in zoom-in duration-200">
            <h3 className="text-lg font-black text-gray-900 tracking-tight mb-2">Confirm Payment</h3>
            <p className="text-sm text-gray-500 font-semibold leading-relaxed mb-6">
              You are paying <span className="font-extrabold text-slate-800">₹{finalAmount.toLocaleString()}</span> via <span className="font-extrabold text-blue-600">{getMethodLabel(paymentMethod)}</span>.
            </p>
            <div className="flex gap-3">
              <Button onClick={handleConfirmAction} variant="primary" className="flex-1 text-xs font-black uppercase tracking-widest py-2.5">
                Confirm
              </Button>
              <Button onClick={() => setShowConfirmModal(false)} variant="outline" className="flex-1 text-xs font-black uppercase tracking-widest py-2.5 border-gray-200">
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Coming Soon Modal */}
      {showComingSoonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <Card className="p-6 max-w-sm w-full shadow-2xl border-none bg-white rounded-2xl animate-in zoom-in duration-200 text-center">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-lg font-black text-gray-900 tracking-tight mb-2">Coming Soon</h3>
            <p className="text-sm font-semibold text-gray-400 mb-6 uppercase tracking-wider">Please use UPI payment to complete your booking</p>
            <Button onClick={() => setShowComingSoonModal(false)} className="w-full text-xs font-black uppercase tracking-widest py-2.5">
              Choose UPI
            </Button>
          </Card>
        </div>
      )}

      {/* UPI Payment Modal */}
      {showUPIModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="my-8 max-w-sm w-full">
            <Card className="p-6 shadow-2xl border-none bg-white rounded-2xl animate-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4 border-b border-gray-50 pb-2">
                <div>
                  <h3 className="text-base font-black text-gray-900 tracking-tight">UPI Secure Payment</h3>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Scan or copy details to pay</p>
                </div>
                <button onClick={() => setShowUPIModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* QR Code Container */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center justify-center">
                  <img 
                    src={qrCodeUrl} 
                    alt="UPI Payment QR Code" 
                    className="w-48 h-48 object-contain rounded-lg border bg-white p-2 shadow-inner"
                  />
                  <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mt-2">Scan with GPay, PhonePe or Paytm</p>
                </div>

                {/* Amount & UPI Details */}
                <div className="bg-blue-50/50 border border-blue-50/80 p-4 rounded-xl text-center space-y-1">
                  <p className="text-[9px] text-blue-500 font-black uppercase tracking-widest">Amount to Pay</p>
                  <p className="text-2xl font-black text-blue-700 tracking-tight">₹{finalAmount.toLocaleString()}</p>
                  <div className="pt-2 flex items-center justify-center gap-1.5 text-[10px] font-bold text-gray-600">
                    <span className="text-gray-400 font-medium">UPI ID:</span>
                    <span className="font-mono bg-white px-2 py-0.5 border rounded border-gray-200">6386227501@axl</span>
                  </div>
                </div>

                {/* UTR Input Field */}
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">Enter 12-Digit Transaction UTR</label>
                  <input
                    type="text"
                    maxLength={20}
                    value={utrNumber}
                    onChange={(e) => {
                      setUtrNumber(e.target.value.replace(/\D/g, ""))
                      setUtrError("")
                    }}
                    placeholder="e.g. 348596041285"
                    className="w-full px-3 py-2.5 text-sm font-extrabold font-mono border rounded-lg focus:ring-1 focus:ring-blue-500 outline-none bg-slate-50 focus:bg-white transition-all text-center tracking-widest placeholder:tracking-normal placeholder:font-sans placeholder:font-medium"
                  />
                  {utrError && <p className="text-[10px] font-extrabold text-red-500">{utrError}</p>}
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <Button 
                    onClick={submitUPIPayment} 
                    variant="primary" 
                    className="w-full text-xs font-black uppercase tracking-widest py-3 shadow-md"
                    isLoading={processing}
                  >
                    I Have Completed Payment
                  </Button>
                </div>
              </div>
            </Card>
          </div>
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
                  onClick={handlePayClick} 
                  variant="primary"
                  size="lg"
                  className="w-full text-sm font-bold uppercase tracking-widest shadow-md" 
                  disabled={!paymentMethod || processing}
                >
                  {getButtonLabel()}
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
