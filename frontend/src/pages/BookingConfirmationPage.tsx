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

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner size="xl" text="Finalizing details..." />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <Card className="text-center p-12 border-none shadow-2xl max-w-sm">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
          </div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight mb-2">Record Not Found</h2>
          <p className="text-xs text-gray-400 font-medium mb-6 uppercase tracking-widest">The booking ID is invalid or expired</p>
          <Button onClick={() => navigate('/rooms')} className="w-full uppercase text-[10px] font-black tracking-widest">Return to Units</Button>
        </Card>
      </div>
    )
  }

  const isMonthly = booking.bookingType === "MONTHLY"
  const securityDeposit = isMonthly ? (booking.securityAmount || 0) : 0
  const rentAmount = isMonthly ? (booking.totalAmount - securityDeposit) : booking.totalAmount
  const finalAmount = booking.totalAmount
  const isConfirmed = booking.status === "CONFIRMED" || booking.status === "COMPLETED"

  return (
    <div className="min-h-screen bg-slate-50/50 py-10 px-4">
      <div className="max-w-2xl mx-auto print:max-w-none print:p-0">
        {/* Success Header */}
        <div className="text-center mb-8 print:hidden">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-500 rounded-full mb-4 shadow-lg shadow-green-100">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Reservation Secured</h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Digital receipt & entry pass</p>
        </div>

        {/* Digital Receipt Card */}
        <Card className="p-0 border-none shadow-2xl shadow-slate-200/50 overflow-hidden bg-white print:shadow-none print:border">
          <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-50 mb-1">Pass No.</p>
                  <p className="text-2xl font-black font-mono tracking-tighter">{booking.bookingId}</p>
                </div>
                <div className="text-right">
                  {isConfirmed ? (
                    <Badge variant="success" size="sm" className="bg-green-500/20 text-green-400 border-none font-black text-[9px] px-2 uppercase">Verified Confirmed</Badge>
                  ) : (
                    <Badge variant="warning" size="sm" className="bg-amber-500/20 text-amber-400 border-none font-black text-[9px] px-2 uppercase animate-pulse">Awaiting Verification</Badge>
                  )}
                  <p className="text-[9px] font-bold opacity-50 uppercase tracking-widest mt-2">{new Date(booking.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
            {/* Abstract Background Detail */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          </div>

          <div className="p-8 space-y-8">
            {/* Core Details Grid */}
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Guest Primary</p>
                  <p className="text-sm font-black text-slate-900">{booking.customerName}</p>
                  <p className="text-[11px] text-slate-500 font-medium truncate">{booking.customerEmail}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Allocated Unit</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-blue-600">#{booking.room?.roomNumber}</span>
                    <Badge variant="info" size="sm" className="text-[8px] font-black px-1.5">{booking.room?.roomType}</Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Check-in</p>
                  <p className="text-sm font-black text-slate-900">{new Date(booking.checkInDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mt-0.5">12:00 PM onwards</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Check-out</p>
                  <p className="text-sm font-black text-slate-900">{new Date(booking.checkOutDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mt-0.5">Before 11:00 AM</p>
                </div>
              </div>
            </div>

            {/* Price Breakdown Section */}
            <div className="bg-slate-50 rounded-2xl p-6">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">Financial Statement</p>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-600">
                  <span>Stay Duration ({booking.totalDays} Days)</span>
                  <span>₹{rentAmount.toLocaleString()}</span>
                </div>
                {isMonthly && (
                  <div className="flex justify-between items-center text-[11px] font-bold text-blue-600">
                    <div className="flex flex-col">
                      <span>Refundable Deposit</span>
                      <span className="text-[9px] font-bold uppercase mt-0.5">
                        Status: {booking.depositStatus === "PAID" ? (
                          <span className="text-green-600 font-extrabold">Successfully Deposited</span>
                        ) : (
                          <span className="text-amber-600 font-extrabold">Pending</span>
                        )}
                      </span>
                    </div>
                    <span>₹{securityDeposit.toLocaleString()}</span>
                  </div>
                )}
                <div className="pt-4 border-t border-slate-200 flex justify-between items-end">
                  <div>
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">Total Valuation</p>
                    <p className="text-2xl font-black text-slate-900 leading-none tracking-tighter">₹{finalAmount.toLocaleString()}</p>
                  </div>
                  {isConfirmed ? (
                    <Badge variant="success" size="md" className="bg-green-100 text-green-700 border-none font-black text-[9px] py-1.5 px-3 uppercase tracking-wider">Payment Received</Badge>
                  ) : (
                    <Badge variant="warning" size="md" className="bg-amber-100 text-amber-700 border-none font-black text-[9px] py-1.5 px-3 uppercase tracking-wider">Payment Verification Pending</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Important Info Footer */}
            <div className="pt-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                <p className="text-[10px] text-slate-900 font-black uppercase tracking-widest">Entry Requirements</p>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                {[
                  "Mandatory Govt. ID presentation",
                  "Digital pass valid for 1 entry",
                  "Standard check-in/out apply",
                  "24h support: 1800-RABAB-STAY"
                ].map((item, i) => (
                  <li key={i} className="text-[11px] font-medium text-slate-500 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Footer / QR Style Bar */}
          <div className="bg-slate-50 p-4 text-center border-t border-slate-100 border-dashed">
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.3em]">Thank you for choosing Rabab Complex Stay</p>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 print:hidden">
          <Button onClick={() => navigate('/dashboard')} className="flex-1 uppercase text-[10px] font-black tracking-widest h-11">Go to Dashboard</Button>
          <Button onClick={handlePrint} variant="outline" className="flex-1 uppercase text-[10px] font-black tracking-widest h-11 border-slate-200">Print Receipt</Button>
        </div>
      </div>
    </div>
  )
}

export default BookingConfirmationPage
