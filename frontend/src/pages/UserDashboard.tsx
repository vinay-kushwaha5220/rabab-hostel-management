import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContextV2"
import api from "../services/apiV2"
import type { BookingType } from "../types/booking"
import Button from "../components/ui/Button"
import Badge from "../components/ui/Badge"

const UserDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [bookings, setBookings] = useState<BookingType[]>([])
  const [loading, setLoading] = useState(true)
  const [billingData, setBillingData] = useState<any>(null)

  useEffect(() => {
    fetchMyBookings()
    fetchBillingData()
  }, [])

  const fetchBillingData = async () => {
    try {
      const response = await api.get("/monthly-bills/renter/dashboard")
      setBillingData(response.data)
    } catch (err) {
      console.error("Failed to fetch billing data:", err)
    }
  }

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
      <div className="bg-slate-900 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black tracking-tight">Welcome, {user?.name.split(' ')[0]}</h1>
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-0.5">Member Portal</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Verified Account</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 border-l-4 border-l-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Active Bookings</p>
                <p className="text-2xl font-black text-gray-900">{activeBookings.length}</p>
              </div>
              <div className="bg-blue-50 p-2 rounded-lg">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 border-l-4 border-l-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Total Bookings</p>
                <p className="text-2xl font-black text-gray-900">{bookings.length}</p>
              </div>
              <div className="bg-green-50 p-2 rounded-lg">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 border-l-4 border-l-purple-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Total Spent</p>
                <p className="text-2xl font-black text-gray-900">
                  ₹{bookings.reduce((sum, b) => sum + b.totalAmount, 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-purple-50 p-2 rounded-lg">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Rent & Billing Alerts */}
        {billingData?.monthlyBill && (
          <div className="mb-6">
            <div className={`rounded-xl p-4 border-2 ${billingData.monthlyBill.status === 'OVERDUE' ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100 shadow-sm'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${billingData.monthlyBill.status === 'OVERDUE' ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Monthly Rent: {billingData.monthlyBill.month}</h3>
                    <p className={`text-[10px] font-bold ${billingData.monthlyBill.status === 'OVERDUE' ? 'text-red-500 animate-pulse' : 'text-gray-400'}`}>
                      {billingData.monthlyBill.status === 'OVERDUE' ? '⚠️ PAYMENT OVERDUE' : 'Billing Period Active'}
                    </p>
                  </div>
                </div>
                <Badge variant={billingData.monthlyBill.status === 'OVERDUE' ? 'danger' : 'warning'} size="sm">
                  {billingData.monthlyBill.status.replace('_', ' ')}
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-50/50 p-2.5 rounded-lg">
                  <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Base Rent</p>
                  <p className="text-sm font-black text-gray-900">₹{billingData.monthlyBill.rentAmount.toLocaleString()}</p>
                </div>
                <div className="bg-slate-50/50 p-2.5 rounded-lg">
                  <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Electricity</p>
                  <p className="text-sm font-black text-gray-900">₹{billingData.monthlyBill.electricityAmount.toLocaleString()}</p>
                </div>
                <div className="bg-slate-50/50 p-2.5 rounded-lg">
                  <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Extras</p>
                  <p className="text-sm font-black text-gray-900">₹{billingData.monthlyBill.extraCharges.toLocaleString()}</p>
                </div>
                <div className="bg-blue-600/5 p-2.5 rounded-lg border border-blue-600/10">
                  <p className="text-[8px] font-bold text-blue-600 uppercase tracking-widest mb-0.5">Total Due</p>
                  <p className="text-sm font-black text-blue-700">₹{billingData.monthlyBill.remainingAmount.toLocaleString()}</p>
                </div>
              </div>
              
              {billingData.monthlyBill.remainingAmount > 0 && (
                <div className="mt-4 flex items-center justify-between p-2 bg-blue-50/30 rounded-lg border border-dashed border-blue-200">
                  <p className="text-[9px] font-bold text-blue-600 uppercase">Due by: {new Date(billingData.monthlyBill.dueDate).toLocaleDateString()}</p>
                  <button onClick={() => navigate("/contact")} className="text-[9px] font-black text-blue-700 uppercase hover:underline">Verify Payment</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => navigate("/rooms")}
            className="bg-white rounded-lg border border-gray-50 p-3 shadow-sm hover:shadow-md transition-all text-left group"
          >
            <div className="flex items-center gap-2.5">
              <div className="bg-blue-50 p-1.5 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-[11px] uppercase tracking-tight">Find Unit</h3>
                <p className="text-[9px] text-gray-400 font-medium">Browse rooms</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate("/contact")}
            className="bg-white rounded-lg border border-gray-50 p-3 shadow-sm hover:shadow-md transition-all text-left group"
          >
            <div className="flex items-center gap-2.5">
              <div className="bg-green-50 p-1.5 rounded-lg group-hover:bg-green-600 group-hover:text-white transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-[11px] uppercase tracking-tight">Support</h3>
                <p className="text-[9px] text-gray-400 font-medium">Get assistance</p>
              </div>
            </div>
          </button>
        </div>

        {/* Active Bookings */}
        {activeBookings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-black text-gray-900 mb-3 uppercase tracking-widest">Active Stay</h2>
            <div className="space-y-3">
              {activeBookings.map((booking) => (
                <div key={booking.id} className="bg-white rounded-xl border border-gray-50 p-4 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center flex-wrap gap-1.5 mb-2">
                        <Badge variant="success" size="sm" className="text-[9px]">
                          {booking.status}
                        </Badge>
                        <Badge variant={booking.bookingType === 'MONTHLY' ? 'primary' : 'info'} size="sm" className="text-[9px]">
                          {booking.bookingType}
                        </Badge>
                        <span className="text-gray-300 text-[9px] font-bold uppercase tracking-widest ml-auto">{booking.bookingId}</span>
                      </div>
                      <h3 className="text-base font-black text-slate-800 mb-4">
                        {booking.room?.title || "Unit Allocation"}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div>
                          <p className="text-gray-400 font-bold uppercase text-[9px]">Room No.</p>
                          <p className="font-bold text-gray-900">{booking.room?.roomNumber}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 font-bold uppercase text-[9px]">Check-in</p>
                          <p className="font-bold text-gray-900">
                            {new Date(booking.checkInDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 font-bold uppercase text-[9px]">Check-out</p>
                          <p className="font-bold text-gray-900">
                            {new Date(booking.checkOutDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 font-bold uppercase text-[9px]">Total</p>
                          <p className="font-bold text-green-600">₹{booking.totalAmount.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-row md:flex-col gap-2">
                      <Button
                        onClick={() => navigate(`/booking-confirmation/${booking.id}`)}
                        size="sm"
                        className="flex-1"
                      >
                        Details
                      </Button>
                      <Button
                        onClick={() => navigate("/contact")}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        Help
                      </Button>
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
            <h2 className="text-lg font-bold text-gray-900 mb-3 tracking-tight">Past Bookings</h2>
            <div className="space-y-3">
              {pastBookings.map((booking) => (
                <div key={booking.id} className="bg-white rounded-xl border border-gray-100 p-4 opacity-75 shadow-sm hover:opacity-100 transition-all">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center flex-wrap gap-2 mb-2">
                        <Badge variant={booking.status === "COMPLETED" ? "secondary" : "danger"} size="sm">
                          {booking.status}
                        </Badge>
                        <Badge variant={booking.bookingType === 'MONTHLY' ? 'primary' : 'info'} size="sm">
                          {booking.bookingType}
                        </Badge>
                        <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">ID: {booking.bookingId}</span>
                      </div>
                      <h3 className="text-base font-bold text-gray-900 mb-3">
                        {booking.room?.title || "Room"}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div>
                          <p className="text-gray-400 font-bold uppercase text-[9px]">Room No.</p>
                          <p className="font-bold text-gray-900">{booking.room?.roomNumber}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 font-bold uppercase text-[9px]">Check-in</p>
                          <p className="font-bold text-gray-900">
                            {new Date(booking.checkInDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 font-bold uppercase text-[9px]">Check-out</p>
                          <p className="font-bold text-gray-900">
                            {new Date(booking.checkOutDate).toLocaleDateString()}
                          </p>
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
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Bookings */}
        {bookings.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-1">No Bookings Found</h3>
            <p className="text-xs text-gray-400 mb-6 font-medium">Ready to start your journey? Browse our luxury rooms today.</p>
            <button
              onClick={() => navigate("/rooms")}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-all font-black text-xs uppercase tracking-widest shadow-md shadow-blue-100"
            >
              Explore Units
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserDashboard
