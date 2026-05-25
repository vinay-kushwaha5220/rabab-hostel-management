import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../services/apiV2"
import { billingService } from "../services/billingService"
import type { BookingType } from "../types/booking"
import type { MonthlyBill } from "../types/billing"
import LoadingSpinner from "../components/ui/LoadingSpinner"
import Card from "../components/ui/Card"
import Badge from "../components/ui/Badge"
import Button from "../components/ui/Button"

const normalizeMonthlyRenterStatus = (status?: string): string | undefined => {
  if (!status) return undefined
  switch (status) {
    case "CHECKOUT_PENDING":
    case "CHECKOUT_REQUESTED":
      return "CHECKOUT_REQUESTED"
    case "RENEWAL_PENDING":
    case "PENDING_ADMIN_APPROVAL":
    case "CONTINUE_REQUESTED":
    case "STAY_CONTINUED":
    case "PENDING_PAYMENT":
      return "PAYMENT_PENDING"
    default:
      return status
  }
}

const MyBookingsPage = () => {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState<BookingType[]>([])
  const [loading, setLoading] = useState(true)
  const [monthlyBills, setMonthlyBills] = useState<MonthlyBill[]>([])

  // Stay Extension State Variables
  const [selectedBookingForExtension, setSelectedBookingForExtension] = useState<BookingType | null>(null)
  const [showExtensionModal, setShowExtensionModal] = useState(false)
  const [newCheckOutDate, setNewCheckOutDate] = useState("")
  const [extensionDetails, setExtensionDetails] = useState<{
    available: boolean
    extraDays: number
    pricePerDay: number
    extensionAmount: number
    message?: string
  } | null>(null)
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [transactionId, setTransactionId] = useState("")
  const [submittingExtension, setSubmittingExtension] = useState(false)
  const [extensionError, setExtensionError] = useState("")
  const [extensionSuccess, setExtensionSuccess] = useState("")

  const isPastCheckoutTime = (booking: BookingType): boolean => {
    if (booking.bookingType !== "DAILY") return false
    if (booking.status !== "CONFIRMED") return false
    if (booking.stayStatus === "CHECKED_OUT") return false

    const checkOutDate = new Date(booking.checkOutDate)
    const checkoutTime = new Date(checkOutDate)
    checkoutTime.setHours(11, 0, 0, 0)

    const now = new Date()
    return now.getTime() >= checkoutTime.getTime()
  }

  const getMinExtensionDate = (booking: BookingType): string => {
    const currentCheckOut = new Date(booking.checkOutDate)
    const minDate = new Date(currentCheckOut)
    minDate.setDate(minDate.getDate() + 1)
    return minDate.toISOString().split("T")[0]
  }

  const handleOpenExtensionModal = (booking: BookingType) => {
    setSelectedBookingForExtension(booking)
    setShowExtensionModal(true)
    setNewCheckOutDate("")
    setExtensionDetails(null)
    setTransactionId("")
    setExtensionError("")
    setExtensionSuccess("")
  }

  const handleCheckAvailability = async (bookingId: number, dateStr: string) => {
    try {
      setCheckingAvailability(true)
      setExtensionError("")
      const response = await api.post(`/bookings/${bookingId}/extend-check`, {
        newCheckOutDate: dateStr
      })
      setExtensionDetails(response.data)
    } catch (error: any) {
      console.error("Check extension availability error:", error)
      setExtensionError(error.response?.data?.message || "Failed to check date availability.")
      setExtensionDetails(null)
    } finally {
      setCheckingAvailability(false)
    }
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setNewCheckOutDate(val)
    if (selectedBookingForExtension && val) {
      handleCheckAvailability(selectedBookingForExtension.id, val)
    }
  }

  const handleConfirmExtension = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBookingForExtension || !newCheckOutDate) return

    if (!transactionId.trim()) {
      setExtensionError("Transaction Reference is required to verify your payment.")
      return
    }

    try {
      setSubmittingExtension(true)
      setExtensionError("")
      await api.post(`/bookings/${selectedBookingForExtension.id}/extend`, {
        newCheckOutDate,
        transactionId,
        paymentMethod: "UPI"
      })
      
      setExtensionSuccess("Stay extended successfully! Refreshing bookings...")
      setTimeout(() => {
        setShowExtensionModal(false)
        setSelectedBookingForExtension(null)
        setNewCheckOutDate("")
        setExtensionDetails(null)
        setTransactionId("")
        setExtensionSuccess("")
        fetchMyBookings()
      }, 2000)
    } catch (error: any) {
      console.error("Extend stay failed:", error)
      setExtensionError(error.response?.data?.message || "Failed to process stay extension.")
    } finally {
      setSubmittingExtension(false)
    }
  }

  useEffect(() => {
    fetchMyBookings()
    fetchMonthlyBills()
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

  const fetchMonthlyBills = async () => {
    try {
      const data = await billingService.getRenterBills()
      setMonthlyBills(data)
    } catch (err) {
      console.error("Error fetching monthly bills:", err)
    }
  }

  const activeBookings = bookings.filter(b => {
    if (b.bookingType === "MONTHLY" && b.monthlyRenter) {
      const status = normalizeMonthlyRenterStatus(b.monthlyRenter.status)
      return status !== "CHECKED_OUT"
    }
    return b.status === "CONFIRMED" || b.status === "PENDING"
  })
  
  const pastBookings = bookings.filter(b => {
    if (b.bookingType === "MONTHLY" && b.monthlyRenter) {
      const status = normalizeMonthlyRenterStatus(b.monthlyRenter.status)
      return status === "CHECKED_OUT"
    }
    return b.status === "COMPLETED" || b.status === "CANCELLED"
  })

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
            {activeBookings.map((booking) => {
              // For monthly bookings, calculate total from monthly bills
              const bookingBills = booking.bookingType === "MONTHLY" ? monthlyBills : []
              const totalFromBills = bookingBills.reduce((sum, b) => sum + (b.paidAmount || 0), 0)
              const totalDueFromBills = bookingBills.reduce((sum, b) => sum + (b.totalDue || 0), 0)
              const displayTotal = booking.bookingType === "MONTHLY" && bookingBills.length > 0 
                ? totalDueFromBills 
                : booking.totalAmount

              return (
              <Card key={booking.id} className="p-4 border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {/* Show monthlyRenter status for monthly bookings, booking status for daily */}
                      {booking.bookingType === "MONTHLY" && booking.monthlyRenter ? (
                        <>
                          {(() => {
                            const status = normalizeMonthlyRenterStatus(booking.monthlyRenter.status) || booking.monthlyRenter.status
                            const badgeVariant =
                              status === "ACTIVE" ? "success" :
                              status === "DUE_SOON" ? "warning" :
                              status === "EXPIRES_TODAY" ? "warning" :
                              status === "PAYMENT_PENDING" ? "warning" :
                              status === "OVERDUE" ? "danger" :
                              status === "CHECKOUT_REQUESTED" ? "secondary" :
                              status === "CHECKED_OUT" ? "secondary" :
                              "secondary"

                            return (
                              <Badge variant={badgeVariant} size="sm">
                                {status.replace(/_/g, " ")}
                              </Badge>
                            )
                          })()}
                        </>
                      ) : (
                        <>
                          {isPastCheckoutTime(booking) && booking.status === "CONFIRMED" ? (
                            <Badge variant="secondary" size="sm">
                              COMPLETED
                            </Badge>
                          ) : (
                            <Badge variant={booking.status === "CONFIRMED" ? "success" : "warning"} size="sm">
                              {booking.status === "PENDING" ? "PENDING ADMIN VERIFICATION" : booking.status}
                            </Badge>
                          )}
                        </>
                      )}
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
                        <p className="font-bold text-emerald-600 text-sm">₹{displayTotal.toLocaleString()}</p>
                      </div>
                    </div>

                    {isPastCheckoutTime(booking) && booking.status === "CONFIRMED" && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3">
                        <span className="text-base">📅</span>
                        <div>
                          <p className="text-xs font-bold text-blue-800">Your stay completed at 11:00 AM today</p>
                          <p className="text-[10px] text-blue-600 font-semibold mt-0.5">Please check out or extend your stay by clicking "Continue Staying" below.</p>
                        </div>
                      </div>
                    )}

                    {booking.status === "PENDING" && booking.bookingType === "DAILY" && (
                      <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-3">
                        <span className="text-base">⏳</span>
                        <div>
                          <p className="text-xs font-bold text-amber-800">Extension Request Under Review</p>
                          <p className="text-[10px] text-amber-600 font-semibold mt-0.5">Your extension payment is awaiting administrator verification. Your stay is preserved.</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    {booking.bookingType === "DAILY" && booking.status === "CONFIRMED" && (
                      <Button
                        onClick={() => handleOpenExtensionModal(booking)}
                        variant="success"
                        size="sm"
                        className="flex-1 md:flex-none uppercase text-[10px] font-black tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        Continue Staying 📢
                      </Button>
                    )}
                    <Button
                      onClick={() => navigate(`/booking-confirmation/${booking.id}`)}
                      size="sm"
                      className="flex-1 md:flex-none"
                    >
                      View Details
                    </Button>
                  </div>
                </div>

                {/* Month-by-Month Payment Breakdown for monthly bookings */}
                {booking.bookingType === "MONTHLY" && bookingBills.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">📋 Monthly Payment Breakdown</h4>
                    <div className="space-y-2">
                      {bookingBills.map((bill) => (
                        <div 
                          key={bill.id} 
                          className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border ${
                            bill.isPaid 
                              ? 'bg-emerald-50/50 border-emerald-100' 
                              : bill.status === 'OVERDUE' 
                                ? 'bg-rose-50/50 border-rose-100' 
                                : 'bg-amber-50/50 border-amber-100'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                              bill.isPaid 
                                ? 'bg-emerald-100 text-emerald-700' 
                                : bill.status === 'OVERDUE' 
                                  ? 'bg-rose-100 text-rose-700' 
                                  : 'bg-amber-100 text-amber-700'
                            }`}>
                              {bill.isPaid ? '✓' : bill.status === 'OVERDUE' ? '!' : '⏳'}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-800">{bill.month}</p>
                              <p className="text-[9px] text-gray-400 font-semibold">
                                Rent: ₹{bill.rentAmount.toLocaleString()} | Electricity: ₹{bill.electricityAmount.toLocaleString()} | Extras: ₹{bill.extraCharges.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 mt-2 sm:mt-0">
                            <div className="text-right">
                              <p className={`text-xs font-bold ${bill.isPaid ? 'text-emerald-600' : 'text-gray-800'}`}>
                                ₹{bill.totalDue.toLocaleString()}
                              </p>
                              {bill.paidAmount > 0 && !bill.isPaid && (
                                <p className="text-[9px] text-emerald-500 font-semibold">Paid: ₹{bill.paidAmount.toLocaleString()}</p>
                              )}
                            </div>
                            <Badge 
                              variant={
                                bill.isPaid ? 'success' : 
                                bill.status === 'OVERDUE' ? 'danger' : 
                                bill.status === 'PENDING' ? 'warning' : 'info'
                              } 
                              size="sm"
                              className="text-[8px] font-bold uppercase tracking-wider"
                            >
                              {bill.isPaid ? 'PAID' : bill.status?.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Total Summary Row */}
                    <div className="mt-3 p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Total All Months ({bookingBills.length} Invoices)</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-extrabold tracking-tight">₹{totalDueFromBills.toLocaleString()}</p>
                        <p className="text-[9px] text-emerald-400 font-bold">Paid: ₹{totalFromBills.toLocaleString()} | Due: ₹{(totalDueFromBills - totalFromBills).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
              )
            })}
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

      {/* Stay Extension Modal */}
      {showExtensionModal && selectedBookingForExtension && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh] transition-all">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 to-blue-900 p-5 text-white relative">
              <h3 className="text-base font-extrabold tracking-tight">Extend Your Stay 🏨</h3>
              <p className="text-[10px] text-slate-300 font-medium uppercase tracking-widest mt-1">
                Room #{selectedBookingForExtension.room?.roomNumber} - {selectedBookingForExtension.room?.title}
              </p>
              <button 
                onClick={() => setShowExtensionModal(false)}
                className="absolute top-5 right-5 text-white/70 hover:text-white transition-colors text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleConfirmExtension} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {extensionError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl font-bold flex items-center gap-2">
                  <span>❌</span>
                  <span>{extensionError}</span>
                </div>
              )}

              {extensionSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl font-bold flex items-center gap-2">
                  <span>✅</span>
                  <span>{extensionSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-gray-400 font-bold uppercase text-[9px] tracking-wider">Current Checkout Date</label>
                <p className="font-bold text-gray-700 text-sm mt-0.5">
                  {new Date(selectedBookingForExtension.checkOutDate).toLocaleDateString(undefined, {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                  })} (Standard 11:00 AM)
                </p>
              </div>

              <div>
                <label htmlFor="newCheckoutDateInput" className="block text-gray-400 font-bold uppercase text-[9px] tracking-wider">Select New Checkout Date</label>
                <input 
                  id="newCheckoutDateInput"
                  type="date"
                  min={getMinExtensionDate(selectedBookingForExtension)}
                  value={newCheckOutDate}
                  onChange={handleDateChange}
                  required
                  className="w-full mt-1.5 p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-800 bg-gray-50/50"
                />
              </div>

              {checkingAvailability && (
                <div className="flex items-center gap-2 text-blue-600 font-bold py-1">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Checking room availability...</span>
                </div>
              )}

              {extensionDetails && (
                <div className="space-y-4">
                  {extensionDetails.available ? (
                    <>
                      {/* Pricing Statement Card */}
                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 space-y-2">
                        <p className="text-[10px] text-emerald-800 font-extrabold uppercase tracking-wider flex items-center gap-1">
                          <span>✓</span> Date Available
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-gray-600">
                          <div>
                            <span className="block text-[8px] text-gray-400 uppercase">Extra Nights</span>
                            <span className="text-gray-800">{extensionDetails.extraDays} Nights</span>
                          </div>
                          <div>
                            <span className="block text-[8px] text-gray-400 uppercase">Daily Rate</span>
                            <span className="text-gray-800">₹{extensionDetails.pricePerDay.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="pt-2 border-t border-emerald-200/50 flex justify-between items-center">
                          <span className="text-[9px] text-gray-400 uppercase font-bold">Total Extension Fee</span>
                          <span className="text-sm font-extrabold text-emerald-600">₹{extensionDetails.extensionAmount.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Premium UPI QR Code Card */}
                      <div className="border border-gray-100 rounded-2xl p-4 bg-slate-50 flex flex-col items-center">
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-3">Scan to Pay securely</p>
                        <div className="bg-white p-2 rounded-xl shadow-md border border-slate-200">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                              `upi://pay?pa=6386227501@axl&pn=${encodeURIComponent("Rabab Stay")}&am=${extensionDetails.extensionAmount}&cu=INR&tn=${encodeURIComponent(`Extension ${selectedBookingForExtension.bookingId}`)}`
                            )}`}
                            alt="UPI QR Code"
                            className="w-28 h-28"
                          />
                        </div>
                        <p className="text-[9px] text-gray-500 font-semibold mt-3 text-center">
                          Scan with BHIM, GPay, PhonePe or Paytm.<br/>
                          UPI ID: <span className="font-bold text-blue-600">6386227501@axl</span>
                        </p>
                      </div>

                      {/* Transaction reference form */}
                      <div className="space-y-1.5">
                        <label htmlFor="txnIdInput" className="block text-gray-400 font-bold uppercase text-[9px] tracking-wider">Payment Transaction ID / Reference No.</label>
                        <input 
                          id="txnIdInput"
                          type="text"
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          placeholder="Enter UPI Transaction Reference ID"
                          required
                          className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-800 bg-white"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-bold flex items-start gap-2">
                      <span>⚠️</span>
                      <div>
                        <p className="text-xs">Date Unavailable</p>
                        <p className="text-[10px] text-rose-500 font-semibold mt-0.5">{extensionDetails.message || "This room has another confirmed reservation during these dates."}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button 
                  type="submit" 
                  variant="success" 
                  disabled={submittingExtension || !extensionDetails?.available || !transactionId} 
                  isLoading={submittingExtension}
                  className="flex-1 text-xs py-2 uppercase tracking-wider"
                >
                  Pay & Extend Stay
                </Button>
                <Button 
                  type="button" 
                  onClick={() => setShowExtensionModal(false)} 
                  variant="outline" 
                  className="flex-1 text-xs py-2 uppercase tracking-wider"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyBookingsPage
