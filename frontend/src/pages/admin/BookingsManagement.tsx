import { useEffect, useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Eye, Check, LogIn, LogOut, CreditCard, RefreshCw, CalendarPlus, XCircle, ChevronLeft, ChevronRight, MoreVertical, AlertTriangle, Info } from "lucide-react"
import api from "../../services/apiV2"
import type { BookingType } from "../../types/booking"
import Badge from "../../components/ui/Badge"
import Card from "../../components/ui/Card"
import LoadingSpinner from "../../components/ui/LoadingSpinner"

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'secondary'

const normalizeMonthlyRenterStatus = (status?: string): string | undefined => {
  if (!status) return undefined
  switch (status) {
    case 'CHECKOUT_PENDING':
    case 'CHECKOUT_REQUESTED':
      return 'CHECKOUT_REQUESTED'
    case 'RENEWAL_PENDING':
    case 'PENDING_ADMIN_APPROVAL':
    case 'STAY_CONTINUED':
    case 'PENDING_PAYMENT':
      return 'PAYMENT_PENDING'
    default:
      return status
  }
}

const getBookingStatusLabel = (booking: BookingType): string => {
  if (booking.bookingType === 'MONTHLY' && booking.monthlyRenter?.status) {
    return normalizeMonthlyRenterStatus(booking.monthlyRenter.status) || booking.monthlyRenter.status
  }
  return booking.status || 'UNKNOWN'
}

const getStatusVariant = (status: string | undefined): BadgeVariant => {
  switch (status) {
    case 'CONFIRMED': return 'success'
    case 'PENDING': return 'warning'
    case 'CANCELLED': return 'danger'
    case 'COMPLETED': return 'primary'
    case 'ACTIVE': return 'success'
    case 'DUE_SOON': return 'warning'
    case 'EXPIRES_TODAY': return 'warning'
    case 'PAYMENT_PENDING': return 'warning'
    case 'OVERDUE': return 'danger'
    case 'CHECKOUT_REQUESTED': return 'secondary'
    case 'CHECKED_OUT': return 'secondary'
    default: return 'secondary'
  }
}

const getPaymentStatusVariant = (status: string | undefined): BadgeVariant => {
  switch (status) {
    case 'SUCCESS': return 'success'
    case 'PENDING': return 'warning'
    case 'VERIFICATION_PENDING': return 'warning'
    case 'FAILED': return 'danger'
    case 'OVERDUE': return 'warning'
    case 'REFUNDED': return 'info'
    default: return 'secondary'
  }
}

const getStayStatusVariant = (status: string | undefined): BadgeVariant => {
  switch (status) {
    case 'CHECKED_IN': return 'success'
    case 'CHECKED_OUT': return 'secondary'
    case 'NO_SHOW': return 'danger'
    case 'BOOKED': return 'warning'
    case 'EXPIRED': return 'danger'
    case 'EXPIRING_SOON': return 'warning'
    default: return 'warning'
  }
}

const getDateBasedStayStatus = (checkOutDate: string, currentStayStatus?: string): string => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const checkout = new Date(checkOutDate)
  checkout.setHours(0, 0, 0, 0)
  
  const daysRemaining = Math.floor((checkout.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  // If already checked out, don't override with date-based status
  if (currentStayStatus === 'CHECKED_OUT') {
    return currentStayStatus
  }
  
  // If checkout date has passed and not checked out yet, show EXPIRED
  if (daysRemaining < 0) {
    return 'EXPIRED'
  }
  
  // If 1-2 days remaining, show EXPIRING SOON
  if (daysRemaining <= 2 && daysRemaining >= 0) {
    return 'EXPIRING_SOON'
  }
  
  return currentStayStatus || 'BOOKED'
}

const BookingsManagement = () => {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState<BookingType[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  // Dropdown State
  const [activeDropdownId, setActiveDropdownId] = useState<number | string | null>(null)
  
  const currentYear = new Date().getFullYear()
  const [selectedMonth, setSelectedMonth] = useState<string>("all")
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString())

  // Stay Renewal Modal states
  const [showRenewModal, setShowRenewModal] = useState(false)
  const [selectedBookingForRenewal, setSelectedBookingForRenewal] = useState<BookingType | null>(null)
  const [renewalElectricity, setRenewalElectricity] = useState("0")
  const [renewalUnits, setRenewalUnits] = useState("")
  const [renewalRate, setRenewalRate] = useState("10")
  const [renewalMonth, setRenewalMonth] = useState("")
  const [renewalDueDate, setRenewalDueDate] = useState("")
  const [renewalMaintenance, setRenewalMaintenance] = useState("0")
  const [renewalNotes, setRenewalNotes] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Custom Confirm/Alert Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'success' | 'warning' | 'info';
    isAlert: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    isAlert: false,
    onConfirm: () => {},
  })

  const showAlert = (title: string, message: string, type: 'danger' | 'success' | 'warning' | 'info' = 'info') => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      type,
      isAlert: true,
      onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
    })
  }

  const showConfirm = (title: string, message: string, type: 'danger' | 'success' | 'warning' | 'info', onConfirm: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      type,
      isAlert: false,
      onConfirm: () => {
        onConfirm()
        setConfirmModal(prev => ({ ...prev, isOpen: false }))
      }
    })
  }

  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ]

  const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString())

  useEffect(() => {
    fetchBookings()
  }, [])

  // Reset pagination to first page when search filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filter, search, selectedMonth, selectedYear])

  // Close dropdown on outside click
  useEffect(() => {
    const closeAllDropdowns = () => setActiveDropdownId(null)
    window.addEventListener('click', closeAllDropdowns)
    return () => window.removeEventListener('click', closeAllDropdowns)
  }, [])

  const fetchBookings = async () => {
    try {
      const response = await api.get("/bookings")
      setBookings(response.data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const cancelBooking = async (bookingId: number) => {
    showConfirm('Cancel Booking', 'Are you sure you want to cancel this booking?', 'danger', async () => {
      try {
        await api.put(`/bookings/${bookingId}/cancel`)
        fetchBookings()
      } catch (error: any) {
        showAlert('Error', error.response?.data?.message || 'Failed to cancel', 'danger')
      }
    })
  }

  const confirmBookingPayment = async (bookingId: number) => {
    showConfirm('Verify Payment', 'Verify payment and confirm this booking?', 'success', async () => {
      try {
        await api.put(`/bookings/${bookingId}/confirm`)
        showAlert('Success', 'Payment verified and booking confirmed successfully!', 'success')
        fetchBookings()
      } catch (error: any) {
        showAlert('Error', error.response?.data?.message || 'Failed to verify payment', 'danger')
      }
    })
  }


  const checkInBooking = async (bookingId: number) => {
    try {
      await api.put(`/bookings/${bookingId}/check-in`)
      fetchBookings()
    } catch (error: any) {
      showAlert('Error', error.response?.data?.message || 'Failed to check in', 'danger')
    }
  }

  const checkOutBooking = async (bookingId: number) => {
    showConfirm('Confirm Checkout', 'ACTION REQUIRED: Are you sure the renter has officially left the room? This will release the unit for new bookings.', 'warning', async () => {
      try {
        await api.put(`/bookings/${bookingId}/check-out`)
        fetchBookings()
      } catch (error: any) {
        showAlert('Error', error.response?.data?.message || 'Failed to check out', 'danger')
      }
    })
  }

  const undoCheckOutBooking = async (bookingId: number) => {
    showConfirm('Restore Stay', 'RESTORE STAY: Accidental checkout? This will make the guest active again and increment room occupancy.', 'warning', async () => {
      try {
        await api.put(`/bookings/${bookingId}/undo-checkout`)
        fetchBookings()
      } catch (error: any) {
        showAlert('Error', error.response?.data?.message || 'Failed to restore stay', 'danger')
      }
    })
  }

  const openRenewalModal = (booking: BookingType) => {
    const renterStatus = booking.monthlyRenter?.status
    if (renterStatus === 'PENDING_PAYMENT' || renterStatus === 'OVERDUE') {
      showAlert('Cannot renew stay', "There is a pending payment or unpaid rent invoice for this resident. Please settle all outstanding dues first.", 'warning')
      return
    }
    if (renterStatus === 'PENDING_ADMIN_APPROVAL' || renterStatus === 'RENEWAL_PENDING') {
      showAlert('Cannot renew stay', "There is an active stay renewal request pending admin approval. Please approve or reject that request instead.", 'warning')
      return
    }

    setSelectedBookingForRenewal(booking)
    setRenewalElectricity("")
    setRenewalUnits("")
    setRenewalRate("10")
    setRenewalMaintenance("0")
    setRenewalNotes("")
    
    // Set default month to current month YYYY-MM
    const currentMonth = new Date().toISOString().substring(0, 7)
    setRenewalMonth(currentMonth)
    
    // Set default due date to 5 days from now YYYY-MM-DD
    const fiveDaysFromNow = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10)
    setRenewalDueDate(fiveDaysFromNow)
    
    setShowRenewModal(true)
  }

  const handleRenewUnitsChange = (val: string) => {
    const units = parseFloat(val) || 0
    const rate = parseFloat(renewalRate) || 0
    const calculatedAmount = (units * rate).toFixed(2)
    setRenewalUnits(val)
    setRenewalElectricity(calculatedAmount)
  }

  const handleRenewRateChange = (val: string) => {
    const units = parseFloat(renewalUnits) || 0
    const rate = parseFloat(val) || 0
    const calculatedAmount = (units * rate).toFixed(2)
    setRenewalRate(val)
    setRenewalElectricity(calculatedAmount)
  }

  const handleRenewStaySubmit = async () => {
    if (!selectedBookingForRenewal) return
    try {
      setActionLoading(`renew-${selectedBookingForRenewal.id}`)
      
      // 1. Create the electricity bill so it shows up in `/admin/electricity`
      await api.post("/electricity", {
        roomId: Number(selectedBookingForRenewal.roomId),
        month: renewalMonth,
        units: Number(renewalUnits),
        amount: Number(renewalElectricity),
        dueDate: renewalDueDate,
        bookingId: Number(selectedBookingForRenewal.id),
        notes: renewalNotes || null
      })

      // 2. Renew the stay cycle
      await api.put(`/bookings/${selectedBookingForRenewal.id}/renew-stay`, {
        electricityAmount: parseFloat(renewalElectricity) || 0,
        maintenanceCharge: parseFloat(renewalMaintenance) || 0,
        notes: renewalNotes
      })

      alert('Stay extended, monthly rent invoice generated, and electricity bill registered successfully!')
      setShowRenewModal(false)
      setSelectedBookingForRenewal(null)
      fetchBookings()
    } catch (error: any) {
      console.error('Error during stay renewal:', error)
      alert(error.response?.data?.message || 'Failed to renew stay and register electricity bill')
    } finally {
      setActionLoading(null)
    }
  }

  const refundBooking = async (bookingId: number) => {
    if (!confirm('Process refund for this cancelled booking?')) return
    try {
      await api.put(`/bookings/${bookingId}/refund`)
      fetchBookings()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to refund')
    }
  }

  const filteredBookings = bookings.filter(booking => {
    // Status filter
    if (filter !== "all" && booking.status !== filter) return false
    
    // Month & Year filter
    const checkInDate = new Date(booking.checkInDate)
    const bookingMonth = (checkInDate.getMonth() + 1).toString().padStart(2, '0')
    const bookingYear = checkInDate.getFullYear().toString()

    if (selectedMonth !== "all" && bookingMonth !== selectedMonth) return false
    if (selectedYear !== "all" && bookingYear !== selectedYear) return false

    // Search
    if (search) {
      const searchLower = search.toLowerCase()
      return (
        booking.bookingId.toLowerCase().includes(searchLower) ||
        booking.customerName.toLowerCase().includes(searchLower) ||
        booking.customerPhone.includes(search) ||
        booking.room?.roomNumber.toLowerCase().includes(searchLower)
      )
    }
    
    return true
  })

  // Calculate total pages
  const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE)

  // Paginated bookings slice
  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredBookings.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredBookings, currentPage])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Loading bookings..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Main Content */}
      <div className="p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-6 flex justify-between items-end">
            <div>
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="text-blue-600 hover:underline mb-1 text-[10px] font-bold uppercase tracking-widest"
              >
                ← Back
              </button>
              <h1 className="text-xl font-black text-gray-900 tracking-tight">Booking Management</h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Global reservation control</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-black text-gray-900">{filteredBookings.length} / {bookings.length}</p>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Showing Logs</p>
            </div>
          </div>

        {/* Search and Filters */}
        <div className="bg-white p-2 rounded-xl border border-gray-100 mb-4 shadow-sm space-y-2">
          <div className="flex flex-col md:flex-row gap-2">
            <div className="relative flex-1">
              <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by ID, Name, Phone or Unit..."
                className="w-full pl-9 pr-4 py-2 text-xs font-bold bg-gray-50/50 border border-transparent rounded-lg focus:bg-white focus:border-blue-100 transition-all outline-none placeholder:text-gray-300"
              />
            </div>
            <div className="flex gap-1">
              {['all', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                    filter === f 
                      ? "bg-slate-900 text-white shadow-md shadow-slate-200" 
                      : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-gray-50">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Period:</span>
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-50 border-none text-[10px] font-black uppercase tracking-widest rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 cursor-pointer"
              >
                <option value="all">All Months</option>
                {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-slate-50 border-none text-[10px] font-black uppercase tracking-widest rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 cursor-pointer"
              >
                <option value="all">All Years</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Bookings Table */}
        <Card className="overflow-hidden border-none shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200/80 z-10">
                <tr className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-5 font-bold"># Unit</th>
                  <th className="py-3.5 px-5 font-bold">Reservation ID</th>
                  <th className="py-3.5 px-5 font-bold">Client</th>
                  <th className="py-3.5 px-5 font-bold">Contact</th>
                  <th className="py-3.5 px-5 font-bold">Stay Period</th>
                  <th className="py-3.5 px-5 text-right font-bold">Valuation</th>
                  <th className="py-3.5 px-5 text-center font-bold">Status</th>
                  <th className="py-3.5 px-5 text-center font-bold">Payment</th>
                  <th className="py-3.5 px-5 text-center font-bold">Stay</th>
                  <th className="py-3.5 px-5 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 bg-white text-xs text-slate-700">
                {paginatedBookings.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-5 py-12 text-center">
                      <p className="text-gray-300 font-black text-[10px] uppercase tracking-widest">No records for this period</p>
                    </td>
                  </tr>
                ) : (
                  paginatedBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-blue-50/30 transition-all group">
                      <td className="py-3.5 px-5">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg w-fit">
                            {booking.room?.roomNumber || 'N/A'}
                          </span>
                          <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded w-fit border ${
                            booking.bookingType === 'MONTHLY' 
                              ? 'bg-purple-50 text-purple-600 border-purple-100' 
                              : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                          }`}>
                            {booking.bookingType}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="text-[11px] font-black text-gray-900 font-mono tracking-tighter opacity-80">
                          {booking.bookingId}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-xs text-gray-900 leading-tight">{booking.customerName}</div>
                        <div className="text-[9px] text-gray-450 font-bold uppercase tracking-tight mt-0.5">{booking.customerEmail}</div>
                      </td>
                      <td className="py-3.5 px-5 font-bold text-gray-650">
                        {booking.customerPhone}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-700">
                          <span>{new Date(booking.checkInDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}</span>
                          <span className="text-gray-300 font-black">→</span>
                          <span>{new Date(booking.checkOutDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}</span>
                        </div>
                        {booking.bookingType === 'MONTHLY' && booking.monthlyRenter?.currentCycleStart ? (
                          <div className="mt-1.5 text-[9px] text-emerald-650 bg-emerald-50 px-1.5 py-0.5 rounded font-black border border-emerald-100 uppercase tracking-tight flex items-center gap-1 w-fit">
                            <span>🔄 Pay Cycle:</span>
                            <span>{new Date(booking.monthlyRenter.currentCycleStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}</span>
                            <span>→</span>
                            <span>{new Date(booking.monthlyRenter.currentCycleEnd!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}</span>
                          </div>
                        ) : (
                          <div className="text-[9px] text-gray-450 font-bold uppercase mt-1 w-fit">{booking.totalDays} Days</div>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="text-xs font-black text-slate-900">₹{booking.totalAmount.toLocaleString()}</div>
                        {booking.bookingType === 'MONTHLY' && booking.monthlyRenter && (
                          <div className="text-[9px] text-slate-400 font-bold mt-1.5 leading-normal uppercase tracking-tight text-right">
                            <div>Rent: ₹{booking.monthlyRenter.rentAmount.toLocaleString()}/mo</div>
                            <div>Deposit: ₹{booking.monthlyRenter.securityAmount.toLocaleString()}</div>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <Badge 
                          variant={getStatusVariant(getBookingStatusLabel(booking))}
                          size="sm"
                          className="text-[8px] px-1.5 font-black"
                        >
                          {getBookingStatusLabel(booking).replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <Badge 
                          variant={getPaymentStatusVariant(booking.paymentStatus)}
                          size="sm"
                          className="text-[8px] px-1.5 font-black"
                        >
                          {booking.paymentStatus}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        {(() => {
                          const dateBasedStatus = getDateBasedStayStatus(booking.checkOutDate, booking.stayStatus)
                          return (
                            <Badge 
                              variant={getStayStatusVariant(dateBasedStatus)}
                              size="sm"
                              className="text-[8px] px-1.5 font-black"
                            >
                              {dateBasedStatus.replace(/_/g, ' ')}
                            </Badge>
                          )
                        })()}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="relative inline-block text-left">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdownId(activeDropdownId === booking.id ? null : booking.id);
                            }}
                            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-all duration-150 active:scale-95 border border-transparent hover:border-slate-200/50 shadow-none cursor-pointer"
                            aria-label="Action Menu"
                          >
                            <MoreVertical size={16} className="stroke-[2.5]" />
                          </button>

                          {activeDropdownId === booking.id && (
                            <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-100 rounded-xl shadow-xl z-30 py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                              {/* View details */}
                              <button
                                onClick={() => navigate(`/booking-confirmation/${booking.id}`)}
                                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-650 hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer"
                              >
                                <Eye size={13} className="text-slate-500 stroke-[2.5]" />
                                <span>View Details</span>
                              </button>

                              {/* Verify Payment */}
                              {booking.status === 'PENDING' && booking.paymentStatus === 'PENDING' && (
                                <button
                                  onClick={() => confirmBookingPayment(booking.id)}
                                  className="w-full text-left px-3.5 py-2 text-xs font-bold text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center gap-2 cursor-pointer"
                                >
                                  <Check size={13} className="text-emerald-500 stroke-[2.5]" />
                                  <span>Verify Payment</span>
                                </button>
                              )}

                              {/* Check In guest */}
                              {booking.status === 'CONFIRMED' && booking.stayStatus !== 'CHECKED_IN' && booking.stayStatus !== 'CHECKED_OUT' && (
                                <button
                                  onClick={() => checkInBooking(booking.id)}
                                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50/50 transition-colors flex items-center gap-2 cursor-pointer"
                                >
                                  <LogIn size={13} className="text-blue-500 stroke-[2.5]" />
                                  <span>Check In</span>
                                </button>
                              )}

                              {/* Check Out guest */}
                              {booking.stayStatus === 'CHECKED_IN' && (
                                <button
                                  onClick={() => checkOutBooking(booking.id)}
                                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-orange-600 hover:bg-orange-50/50 transition-colors flex items-center gap-2 cursor-pointer"
                                >
                                  <LogOut size={13} className="text-orange-500 stroke-[2.5]" />
                                  <span>Check Out</span>
                                </button>
                              )}

                              {/* Refund payment */}
                              {booking.status === 'CANCELLED' && booking.paymentStatus === 'SUCCESS' && (
                                <button
                                  onClick={() => refundBooking(booking.id)}
                                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-purple-650 hover:bg-purple-50 transition-colors flex items-center gap-2 cursor-pointer"
                                >
                                  <CreditCard size={13} className="text-purple-500 stroke-[2.5]" />
                                  <span>Process Refund</span>
                                </button>
                              )}

                              {/* Restore Checkout Stays */}
                              {booking.stayStatus === 'CHECKED_OUT' && (
                                <button
                                  onClick={() => undoCheckOutBooking(booking.id)}
                                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-550 hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer"
                                >
                                  <RefreshCw size={13} className="text-slate-400 stroke-[2.5]" />
                                  <span>Restore Stay</span>
                                </button>
                              )}

                              {/* Renew monthly stays */}
                              {booking.status === 'CONFIRMED' && booking.stayStatus === 'CHECKED_IN' && booking.bookingType === 'MONTHLY' && (
                                <button
                                  onClick={() => openRenewalModal(booking)}
                                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50/50 transition-colors flex items-center gap-2 cursor-pointer"
                                >
                                  <CalendarPlus size={13} className="text-indigo-500 stroke-[2.5]" />
                                  <span>Renew Stay</span>
                                </button>
                              )}

                              {/* Cancel Stay reservation */}
                              {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && booking.stayStatus !== 'CHECKED_OUT' && (
                                <>
                                  <div className="border-t border-slate-100 my-1" />
                                  <button
                                    onClick={() => cancelBooking(booking.id)}
                                    className="w-full text-left px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50/50 transition-colors flex items-center gap-2 cursor-pointer"
                                  >
                                    <XCircle size={13} className="text-rose-500 stroke-[2.5]" />
                                    <span>Cancel Stay</span>
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Bottom pagination & summary */}
        <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
          {/* Summary stats */}
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Showing <span className="text-slate-700 font-extrabold">{filteredBookings.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}</span> to{" "}
            <span className="text-slate-700 font-extrabold">
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredBookings.length)}
            </span>{" "}
            of <span className="text-slate-700 font-extrabold">{filteredBookings.length}</span> bookings found
            {bookings.length !== filteredBookings.length && (
              <span className="normal-case font-medium text-slate-400"> (filtered from {bookings.length} total)</span>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              {/* Prev Button */}
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200/70 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:text-slate-300 transition-all duration-150"
                aria-label="Previous Page"
              >
                <ChevronLeft size={16} className="stroke-[2.5]" />
              </button>

              {/* Number Buttons */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-xs font-extrabold transition-all duration-150 ${
                    currentPage === page
                      ? "bg-slate-900 text-white shadow-sm scale-105"
                      : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/70"
                  }`}
                >
                  {page}
                </button>
              ))}

              {/* Next Button */}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200/70 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:text-slate-300 transition-all duration-150"
                aria-label="Next Page"
              >
                <ChevronRight size={16} className="stroke-[2.5]" />
              </button>
            </div>
          )}
        </div>

        {/* Stay Renewal Modal */}
        {showRenewModal && selectedBookingForRenewal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden bg-white border border-slate-100 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Renew Stay & Create Electricity Bill</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                    {selectedBookingForRenewal.customerName} — Room {selectedBookingForRenewal.room?.roomNumber || "N/A"}
                  </p>
                </div>
                <span className="text-xs bg-indigo-50 text-indigo-700 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Room {selectedBookingForRenewal.room?.roomNumber || "N/A"}
                </span>
              </div>

              <div className="space-y-4 mt-2">
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-blue-500 uppercase tracking-widest font-black">Base Monthly Rent</p>
                    <p className="text-sm font-extrabold text-blue-900 mt-0.5">
                      ₹{(selectedBookingForRenewal.monthlyRenter?.rentAmount || selectedBookingForRenewal.room?.monthlyPrice || (selectedBookingForRenewal.room?.price || 0) * 30 || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Stay Cycle</p>
                    <p className="text-xs font-bold text-slate-700 mt-0.5">30-Days Extension</p>
                  </div>
                </div>

                {/* Electricity details form */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-1 flex items-center gap-1">
                    <span>⚡</span> Electricity Billing
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-0.5">Units Used (kWh) *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={renewalUnits}
                        onChange={(e) => handleRenewUnitsChange(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 text-xs font-bold text-slate-800 bg-white outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-0.5">Rate per Unit (₹) *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={renewalRate}
                        onChange={(e) => handleRenewRateChange(e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 text-xs font-bold text-slate-800 bg-white outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-0.5">Electricity Cost (₹) *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={renewalElectricity}
                        onChange={(e) => setRenewalElectricity(e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 text-xs font-black text-rose-600 bg-white outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-0.5">Maintenance Charge (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={renewalMaintenance}
                        onChange={(e) => setRenewalMaintenance(e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 text-xs font-bold text-slate-800 bg-white outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Period & Grace Due Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-0.5">Billing Month *</label>
                    <input
                      type="month"
                      value={renewalMonth}
                      onChange={(e) => setRenewalMonth(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 text-xs font-semibold text-slate-800 bg-white outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-0.5">Due Date *</label>
                    <input
                      type="date"
                      value={renewalDueDate}
                      onChange={(e) => setRenewalDueDate(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 text-xs font-semibold text-slate-800 bg-white outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-0.5">Notes (Optional)</label>
                  <input
                    type="text"
                    value={renewalNotes}
                    onChange={(e) => setRenewalNotes(e.target.value)}
                    placeholder="Add renewal notes"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 text-xs font-medium text-slate-700 bg-white outline-none"
                  />
                </div>

                {/* Real-time statement preview */}
                {(() => {
                  const rentAmount = selectedBookingForRenewal.monthlyRenter?.rentAmount || selectedBookingForRenewal.room?.monthlyPrice || (selectedBookingForRenewal.room?.price || 0) * 30 || 0
                  const elecAmount = parseFloat(renewalElectricity) || 0
                  const maintAmount = parseFloat(renewalMaintenance) || 0
                  const grandTotal = rentAmount + elecAmount + maintAmount

                  return (
                    <div className="rounded-xl border border-gray-200 overflow-hidden shadow-inner">
                      <div className="bg-slate-900 px-3 py-2 flex items-center justify-between">
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Statement Estimations Preview</p>
                        <span className="text-[8px] bg-amber-500 text-white font-extrabold px-1.5 py-0.5 rounded uppercase">New Cycle</span>
                      </div>
                      <div className="divide-y divide-gray-100 text-xs">
                        <div className="flex items-center justify-between px-3.5 py-2 bg-white">
                          <span className="font-semibold text-gray-600">🏠 Room Monthly Rent</span>
                          <span className="font-bold text-gray-900">₹{rentAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between px-3.5 py-2 bg-white">
                          <span className="font-semibold text-gray-600">⚡ Electricity Charges</span>
                          <span className="font-bold text-gray-900">₹{elecAmount.toLocaleString()}</span>
                        </div>
                        {maintAmount > 0 && (
                          <div className="flex items-center justify-between px-3.5 py-2 bg-white">
                            <span className="font-semibold text-gray-600">🔧 Maintenance Fee</span>
                            <span className="font-bold text-gray-900">₹{maintAmount.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between px-3.5 py-2.5 bg-emerald-50">
                          <span className="font-black text-emerald-800 uppercase tracking-widest text-[10px]">Estimated Due Amount</span>
                          <span className="font-black text-emerald-800 text-base">₹{grandTotal.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>

              <div className="flex gap-2.5 mt-5 border-t border-gray-100 pt-3">
                <button
                  onClick={handleRenewStaySubmit}
                  disabled={actionLoading === `renew-${selectedBookingForRenewal.id}`}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold tracking-widest text-[9px] uppercase py-2.5 rounded-lg transition-all active:scale-95 shadow-sm"
                >
                  {actionLoading === `renew-${selectedBookingForRenewal.id}` ? "Sending..." : "Send Invoice & Renew"}
                </button>
                <button
                  onClick={() => setShowRenewModal(false)}
                  className="bg-white hover:bg-slate-50 text-slate-500 border border-slate-200 font-bold tracking-widest text-[9px] uppercase py-2.5 px-4 rounded-lg transition-all"
                >
                  Cancel
                </button>
              </div>
            </Card>
          </div>
        )}

        {/* Custom Confirmation / Alert Modal */}
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="max-w-sm w-full">
              <Card className="p-6 shadow-2xl border-none bg-white rounded-2xl animate-in zoom-in duration-200">
                <div className="flex flex-col items-center text-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                    confirmModal.type === 'danger' ? 'bg-red-50 text-red-600' :
                    confirmModal.type === 'success' ? 'bg-green-50 text-green-600' :
                    confirmModal.type === 'warning' ? 'bg-amber-50 text-amber-600' :
                    'bg-blue-50 text-blue-600'
                  }`}>
                    {confirmModal.type === 'danger' && <XCircle className="w-6 h-6" />}
                    {confirmModal.type === 'success' && <Check className="w-6 h-6" />}
                    {confirmModal.type === 'warning' && <AlertTriangle className="w-6 h-6" />}
                    {confirmModal.type === 'info' && <Info className="w-6 h-6" />}
                  </div>
                  
                  <h3 className="text-lg font-black text-gray-900 tracking-tight mb-1">{confirmModal.title}</h3>
                  <p className="text-sm font-medium text-gray-500 mb-6">{confirmModal.message}</p>
                  
                  <div className="flex gap-3 w-full">
                    {!confirmModal.isAlert && (
                      <button
                        onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold tracking-widest text-[10px] uppercase py-2.5 rounded-lg transition-all"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      onClick={confirmModal.onConfirm}
                      className={`flex-1 text-white font-bold tracking-widest text-[10px] uppercase py-2.5 rounded-lg transition-all shadow-sm ${
                        confirmModal.type === 'danger' ? 'bg-red-600 hover:bg-red-700' :
                        confirmModal.type === 'success' ? 'bg-green-600 hover:bg-green-700' :
                        confirmModal.type === 'warning' ? 'bg-amber-600 hover:bg-amber-700' :
                        'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {confirmModal.isAlert ? 'OK' : 'Confirm'}
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
  )
}

export default BookingsManagement

