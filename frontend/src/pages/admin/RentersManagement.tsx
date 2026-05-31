import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../services/apiV2"
import type { BookingType } from "../../types/booking"
import type { RoomType } from "../../types/room"

// Normalize monthly renter status for display
const normalizeMonthlyRenterStatus = (status?: string): string => {
  if (!status) return 'ACTIVE'
  switch (status) {
    case 'RENEWAL_PENDING':
    case 'PENDING_ADMIN_APPROVAL':
    case 'STAY_CONTINUED':
    case 'PENDING_PAYMENT': return 'PAYMENT PENDING'
    case 'CONTINUE_REQUESTED': return 'RENEWAL REQUESTED'
    case 'CHECKOUT_PENDING':
    case 'CHECKOUT_REQUESTED': return 'CHECKOUT REQUESTED'
    case 'DUE_SOON': return 'DUE SOON'
    case 'EXPIRES_TODAY': return 'EXPIRES TODAY'
    case 'CHECKED_OUT': return 'CHECKED OUT'
    default: return status.replace(/_/g, ' ')
  }
}

const getMonthlyStatusStyle = (status?: string): string => {
  if (!status) return 'bg-emerald-100 text-emerald-800 border border-emerald-200'
  switch (status) {
    case 'ACTIVE': return 'bg-emerald-100 text-emerald-800 border border-emerald-200'
    case 'DUE_SOON': return 'bg-amber-100 text-amber-800 border border-amber-200'
    case 'EXPIRES_TODAY': return 'bg-orange-100 text-orange-800 border border-orange-200'
    case 'RENEWAL_PENDING':
    case 'PENDING_ADMIN_APPROVAL':
    case 'STAY_CONTINUED':
    case 'PENDING_PAYMENT': return 'bg-amber-100 text-amber-800 border border-amber-200'
    case 'CONTINUE_REQUESTED': return 'bg-blue-100 text-blue-800 border border-blue-200'
    case 'OVERDUE': return 'bg-red-100 text-red-800 border border-red-200'
    case 'CHECKOUT_PENDING':
    case 'CHECKOUT_REQUESTED': return 'bg-slate-100 text-slate-700 border border-slate-200'
    case 'CHECKED_OUT': return 'bg-slate-100 text-slate-500 border border-slate-200'
    default: return 'bg-slate-100 text-slate-700 border border-slate-200'
  }
}

const getDailyPaymentStyle = (status?: string): string => {
  switch (status) {
    case 'SUCCESS': return 'bg-emerald-100 text-emerald-800 border border-emerald-200'
    case 'VERIFICATION_PENDING': return 'bg-blue-100 text-blue-800 border border-blue-200'
    case 'PENDING': return 'bg-amber-100 text-amber-800 border border-amber-200'
    case 'FAILED': return 'bg-red-100 text-red-800 border border-red-200'
    default: return 'bg-slate-100 text-slate-700 border border-slate-200'
  }
}

const RentersManagement = () => {
  const navigate = useNavigate()
  const [renters, setRenters] = useState<BookingType[]>([])
  const [rooms, setRooms] = useState<RoomType[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filtering & Search
  const [filter, setFilter] = useState("active") // "active", "monthly", "daily", "needs-action", "checked-out", "all"
  const [search, setSearch] = useState("")

  // Drawer / Single Resident Detail States
  const [selectedRenter, setSelectedRenter] = useState<BookingType | null>(null)
  const [selectedRenterBills, setSelectedRenterBills] = useState<any[]>([])
  const [drawerLoading, setDrawerLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<"details" | "payments" | "billing">("details")

  // Add Renter Multi-step Modal States
  const [showAddModal, setShowAddModal] = useState(false)
  const [addStep, setAddStep] = useState<1 | 2 | 3>(1)
  const [newRenter, setNewRenter] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAadhaar: "",
    roomId: "",
    bookingType: "DAILY" as "DAILY" | "MONTHLY",
    checkInDate: new Date().toISOString().split("T")[0],
    checkOutDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0], // default +1 day for daily
    numberOfGuests: 1,
  })

  // Add Payment Sub-Modal States
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI" | "ONLINE">("CASH")
  const [paymentTxnId, setPaymentTxnId] = useState("")
  const [paymentStatus, setPaymentStatus] = useState<"SUCCESS" | "PENDING">("SUCCESS")

  // Add Monthly Bill Sub-Modal States
  const [showAddBillModal, setShowAddBillModal] = useState(false)
  const [billRent, setBillRent] = useState("")
  const [billElectricity, setBillElectricity] = useState("0")
  const [billMaintenance, setBillMaintenance] = useState("0")
  const [billDueDate, setBillDueDate] = useState("")
  const [billNotes, setBillNotes] = useState("")

  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchRenters()
    fetchRooms()
  }, [])

  const fetchRenters = async () => {
    try {
      const response = await api.get("/bookings")
      setRenters(response.data)
    } catch (error) {
      console.error('Error fetching renters:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRooms = async () => {
    try {
      const response = await api.get("/rooms")
      setRooms(response.data)
    } catch (error) {
      console.error('Error fetching rooms:', error)
    }
  }

  // Fetch monthly billing history for a specific booking
  const fetchRenterBills = async (bookingId: number) => {
    try {
      const response = await api.get(`/billing/admin/all?bookingId=${bookingId}`)
      setSelectedRenterBills(response.data)
    } catch (error) {
      console.error('Error fetching monthly bills:', error)
    }
  }

  // Refresh single renter details in drawer
  const refreshSingleRenter = async (bookingId: number) => {
    setDrawerLoading(true)
    try {
      const res = await api.get(`/bookings/${bookingId}`)
      setSelectedRenter(res.data)
      if (res.data.bookingType === 'MONTHLY') {
        await fetchRenterBills(bookingId)
      }
    } catch (error) {
      console.error("Error refreshing single renter details:", error)
    } finally {
      setDrawerLoading(false)
    }
  }

  // Quick Stay Actions
  const handleConfirmPayment = async (bookingId: number) => {
    if (!confirm('Verify payment and confirm this booking stay?')) return
    try {
      setActionLoading('confirm')
      await api.put(`/bookings/${bookingId}/confirm`)
      alert('Payment verified and stay confirmed successfully!')
      fetchRenters()
      refreshSingleRenter(bookingId)
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to verify payment')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCheckIn = async (bookingId: number) => {
    try {
      setActionLoading('checkin')
      await api.put(`/bookings/${bookingId}/check-in`)
      alert('Resident checked in successfully!')
      fetchRenters()
      refreshSingleRenter(bookingId)
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to check in')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCheckOut = async (bookingId: number) => {
    if (!confirm('ACTION REQUIRED: Are you sure the resident has officially left the room? This will release the unit for new bookings.')) return
    try {
      setActionLoading('checkout')
      await api.put(`/bookings/${bookingId}/check-out`)
      alert('Resident checked out successfully!')
      fetchRenters()
      refreshSingleRenter(bookingId)
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to check out')
    } finally {
      setActionLoading(null)
    }
  }

  const handleUndoCheckOut = async (bookingId: number) => {
    if (!confirm('RESTORE STAY: Accidental checkout? This will make the guest active again and increment room occupancy.')) return
    try {
      setActionLoading('undocheckout')
      await api.put(`/bookings/${bookingId}/undo-checkout`)
      alert('Stay restored successfully!')
      fetchRenters()
      refreshSingleRenter(bookingId)
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to restore stay')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancelStay = async (bookingId: number) => {
    if (!confirm('Cancel this stay booking?')) return
    try {
      setActionLoading('cancel')
      await api.put(`/bookings/${bookingId}/cancel`)
      alert('Booking cancelled successfully.')
      fetchRenters()
      refreshSingleRenter(bookingId)
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to cancel')
    } finally {
      setActionLoading(null)
    }
  }

  // COMPLETE REMOVE STAY
  const handleDeleteStay = async (bookingId: number) => {
    if (!confirm('🚨 CRITICAL WARNING:\n\nAre you absolutely sure you want to delete this resident stay?\n\nThis will completely purge the booking, its transaction payment history, and all monthly billing cycle invoices from the hostel database. This action is irreversible.')) return
    if (!confirm('FINAL CONFIRMATION:\n\nDo you want to permanently delete this renter and release the room?')) return
    try {
      setActionLoading('delete')
      const response = await api.delete(`/bookings/${bookingId}`)
      alert(response.data.message || 'Stay completely removed from the database.')
      setSelectedRenter(null)
      fetchRenters()
      fetchRooms()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete resident stay')
    } finally {
      setActionLoading(null)
    }
  }

  // Payment Actions
  const handleAddPaymentSubmit = async () => {
    if (!selectedRenter) return
    const amount = parseFloat(paymentAmount)
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid positive payment amount")
      return
    }

    try {
      setActionLoading('add-payment')
      await api.post(`/bookings/${selectedRenter.id}/payment`, {
        amount,
        paymentMethod,
        transactionId: paymentTxnId || undefined,
        paymentStatus
      })
      alert("Payment recorded successfully!")
      setShowAddPaymentModal(false)
      setPaymentAmount("")
      setPaymentTxnId("")
      refreshSingleRenter(selectedRenter.id)
      fetchRenters()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to record payment')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeletePayment = async (paymentId: number) => {
    if (!selectedRenter) return
    if (!confirm("Are you sure you want to delete this payment log record? This will adjust transaction balances.")) return
    try {
      setActionLoading('delete-payment')
      await api.delete(`/bookings/payment/${paymentId}`)
      alert("Payment record deleted successfully.")
      refreshSingleRenter(selectedRenter.id)
      fetchRenters()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete payment log')
    } finally {
      setActionLoading(null)
    }
  }

  // Billing Actions
  const handleAddBillSubmit = async () => {
    if (!selectedRenter) return
    const rent = parseFloat(billRent)
    const elec = parseFloat(billElectricity) || 0
    const maint = parseFloat(billMaintenance) || 0

    if (isNaN(rent) || rent <= 0) {
      alert("Please enter a valid monthly rent amount")
      return
    }

    try {
      setActionLoading('add-bill')
      await api.post(`/billing`, {
        bookingId: selectedRenter.id,
        rentAmount: rent,
        electricityAmount: elec,
        extraCharges: maint,
        dueDate: billDueDate || undefined,
        notes: billNotes || undefined
      })
      alert("Monthly rent invoice generated successfully!")
      setShowAddBillModal(false)
      setBillRent("")
      setBillElectricity("0")
      setBillMaintenance("0")
      setBillDueDate("")
      setBillNotes("")
      refreshSingleRenter(selectedRenter.id)
      fetchRenters()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to generate invoice')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteBill = async (billId: number) => {
    if (!selectedRenter) return
    if (!confirm("Are you sure you want to delete this monthly bill invoice? Remaining balances will adjust.")) return
    try {
      setActionLoading('delete-bill')
      await api.delete(`/billing/${billId}`)
      alert("Monthly bill invoice deleted successfully.")
      refreshSingleRenter(selectedRenter.id)
      fetchRenters()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete monthly bill')
    } finally {
      setActionLoading(null)
    }
  }

  // Booking Creator Submit
  const handleAddRenterSubmit = async () => {
    if (!newRenter.customerName || !newRenter.customerEmail || !newRenter.customerPhone || !newRenter.roomId) {
      alert("Please enter Name, Email, Phone, and choose an Accommodation Room.")
      return
    }

    try {
      setActionLoading('add-renter')
      const response = await api.post("/bookings", {
        roomId: parseInt(newRenter.roomId),
        customerName: newRenter.customerName,
        customerEmail: newRenter.customerEmail,
        customerPhone: newRenter.customerPhone,
        customerAadhaar: newRenter.customerAadhaar || undefined,
        bookingType: newRenter.bookingType,
        checkInDate: newRenter.checkInDate,
        checkOutDate: newRenter.checkOutDate,
        numberOfGuests: parseInt(String(newRenter.numberOfGuests)),
      })

      alert(response.data.message || "Renter booked successfully!")
      setShowAddModal(false)
      setAddStep(1)
      setNewRenter({
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        customerAadhaar: "",
        roomId: "",
        bookingType: "DAILY",
        checkInDate: new Date().toISOString().split("T")[0],
        checkOutDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        numberOfGuests: 1,
      })
      fetchRenters()
      fetchRooms()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to register renter stay')
    } finally {
      setActionLoading(null)
    }
  }

  // Determine stay status style
  const getStayStatusStyle = (status?: string): string => {
    switch (status) {
      case 'CHECKED_IN': return 'bg-emerald-100 text-emerald-800 border border-emerald-200'
      case 'STAYING': return 'bg-emerald-100 text-emerald-800 border border-emerald-200'
      case 'CHECKED_OUT': return 'bg-slate-100 text-slate-600 border border-slate-200'
      case 'BOOKED': return 'bg-blue-100 text-blue-800 border border-blue-200'
      case 'CANCELLED': return 'bg-red-100 text-red-800 border border-red-200'
      case 'COMPLETED': return 'bg-slate-100 text-slate-500 border border-slate-200'
      default: return 'bg-slate-100 text-slate-600 border border-slate-200'
    }
  }

  // Determine the effective status label for a renter
  const getEffectiveStatus = (renter: BookingType): string => {
    if (renter.bookingType === 'MONTHLY' && renter.monthlyRenter?.status) {
      return normalizeMonthlyRenterStatus(renter.monthlyRenter.status)
    }
    if (renter.bookingType === 'DAILY') {
      if (renter.paymentStatus === 'VERIFICATION_PENDING' || renter.paymentStatus === 'PENDING') return 'PAYMENT PENDING'
      if (renter.paymentStatus === 'SUCCESS') return 'CONFIRMED'
    }
    return renter.status || 'ACTIVE'
  }

  const getEffectiveStatusStyle = (renter: BookingType): string => {
    if (renter.bookingType === 'MONTHLY') {
      return getMonthlyStatusStyle(renter.monthlyRenter?.status)
    }
    return getDailyPaymentStyle(renter.paymentStatus)
  }

  // Balance due
  const getPendingDue = (renter: BookingType): number => {
    if (renter.bookingType === 'MONTHLY') {
      return renter.monthlyRenter?.pendingAmount || 0
    }
    return renter.paymentStatus === 'SUCCESS' ? 0 : renter.totalAmount
  }

  // Filter renters list
  const filteredRenters = renters.filter(renter => {
    // Search
    if (search) {
      const q = search.toLowerCase()
      const matchesSearch = (
        renter.customerName.toLowerCase().includes(q) ||
        renter.customerPhone.includes(search) ||
        renter.customerEmail.toLowerCase().includes(q) ||
        (renter.room?.roomNumber || '').toLowerCase().includes(q) ||
        renter.bookingId.toLowerCase().includes(q)
      )
      if (!matchesSearch) return false
    }

    // Filter type
    const isActive = renter.status === "CONFIRMED" || 
                     renter.stayStatus === "CHECKED_IN" || 
                     renter.stayStatus === "STAYING" ||
                     (renter.status === "PENDING" && renter.paymentStatus === "VERIFICATION_PENDING")

    if (filter === "active" && !isActive) return false
    if (filter === "monthly" && renter.bookingType !== "MONTHLY") return false
    if (filter === "daily" && renter.bookingType !== "DAILY") return false
    if (filter === "checked-out" && renter.stayStatus !== "CHECKED_OUT" && renter.status !== "CANCELLED" && renter.status !== "COMPLETED") return false
    if (filter === "needs-action") {
      const rawStatus = renter.monthlyRenter?.status || ''
      const hasPendingPayment = renter.paymentStatus === 'PENDING' || renter.paymentStatus === 'VERIFICATION_PENDING'
      const monthlyNeedsAction = ['DUE_SOON', 'EXPIRES_TODAY', 'OVERDUE', 'RENEWAL_PENDING', 'PENDING_ADMIN_APPROVAL', 'STAY_CONTINUED', 'PENDING_PAYMENT', 'CONTINUE_REQUESTED'].includes(rawStatus)
      const needsAction = (renter.bookingType === 'MONTHLY' && monthlyNeedsAction) || (renter.bookingType === 'DAILY' && hasPendingPayment)
      if (!needsAction) return false
    }

    return true
  })

  // Summary Metrics calculations
  const totalMonthly = renters.filter(r => r.bookingType === 'MONTHLY' && r.status !== 'CANCELLED' && r.stayStatus !== 'CHECKED_OUT').length
  const totalDaily = renters.filter(r => r.bookingType === 'DAILY' && r.status !== 'CANCELLED' && r.stayStatus !== 'CHECKED_OUT').length
  const needsActionCount = renters.filter(r => {
    const rawStatus = r.monthlyRenter?.status || ''
    return ['DUE_SOON', 'EXPIRES_TODAY', 'OVERDUE', 'RENEWAL_PENDING', 'PENDING_ADMIN_APPROVAL', 'STAY_CONTINUED', 'PENDING_PAYMENT', 'CONTINUE_REQUESTED'].includes(rawStatus)
      || r.paymentStatus === 'VERIFICATION_PENDING'
  }).length
  const pendingCollectionSum = renters.reduce((sum, r) => sum + getPendingDue(r), 0)

  // Drawer click detail fetch
  const handleOpenDrawer = (renter: BookingType) => {
    setSelectedRenter(renter)
    setActiveTab("details")
    refreshSingleRenter(renter.id)
  }

  // Handle step date change defaults
  const handleCheckInDateChange = (val: string) => {
    const checkin = new Date(val)
    const checkout = new Date(checkin)
    if (newRenter.bookingType === 'MONTHLY') {
      checkout.setDate(checkout.getDate() + 30)
    } else {
      checkout.setDate(checkout.getDate() + 1)
    }
    setNewRenter({
      ...newRenter,
      checkInDate: val,
      checkOutDate: checkout.toISOString().split("T")[0]
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest animate-pulse">Synchronizing Resident Database...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 relative overflow-x-hidden">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">

        {/* Page Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="text-blue-600 hover:text-blue-700 mb-1.5 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 transition-all"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Resident Directory
              <span className="bg-blue-100 text-blue-800 text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest">Global Panel</span>
            </h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Global Check-in ledger, transaction logs, & invoicing management</p>
          </div>
          <div>
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/10 hover:shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
              Check-In New Resident
            </button>
          </div>
        </div>

        {/* Interactive Analytics metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md hover:border-slate-200">
            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Active Residents</div>
            <div className="text-2xl font-black text-slate-800 mt-1">{totalMonthly + totalDaily}</div>
            <div className="text-[9px] text-slate-400 font-semibold mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block animate-ping"></span>
              {totalMonthly} Monthly · {totalDaily} Daily
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md hover:border-slate-200">
            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Action Required</div>
            <div className={`text-2xl font-black mt-1 ${needsActionCount > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
              {needsActionCount}
            </div>
            <div className="text-[9px] text-slate-400 font-semibold mt-1 uppercase">
              {needsActionCount > 0 ? '⚠️ Pending billing or stay approvals' : '✅ Ledger is fully updated'}
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md hover:border-slate-200">
            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Total Outstanding</div>
            <div className="text-2xl font-black text-red-500 mt-1">₹{pendingCollectionSum.toLocaleString()}</div>
            <div className="text-[9px] text-slate-400 font-semibold mt-1 uppercase">Pending hostel collections</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md hover:border-slate-200">
            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Room Capacity</div>
            <div className="text-2xl font-black text-slate-700 mt-1">
              {rooms.reduce((sum, r) => sum + r.currentOccupancy, 0)} / {rooms.reduce((sum, r) => sum + r.capacity, 0)}
            </div>
            <div className="text-[9px] text-slate-400 font-semibold mt-1 uppercase">Occupancy across units</div>
          </div>
        </div>

        {/* Search, Filter, & Tabs */}
        <div className="bg-white p-3 rounded-2xl border border-slate-100 mb-5 shadow-sm space-y-2.5">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search residents by full name, reservation ID, phone, email or room unit..."
                className="w-full pl-10 pr-4 py-2.5 text-xs font-bold bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-slate-200 focus:ring-1 focus:ring-blue-100 transition-all outline-none placeholder:text-slate-300 text-slate-700"
              />
            </div>
            <div className="flex gap-1 overflow-x-auto pb-1 lg:pb-0">
              {[
                { id: 'active', label: `Active Stays` },
                { id: 'monthly', label: `Monthly Stays` },
                { id: 'daily', label: `Daily Stays` },
                { id: 'needs-action', label: `⚠️ Action Due (${needsActionCount})` },
                { id: 'checked-out', label: `Historical Stays` },
                { id: 'all', label: `All (${renters.length})` },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                    filter === f.id
                      ? 'bg-slate-900 text-white shadow-md shadow-slate-300'
                      : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Directory Ledger Grid */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-slate-50/70 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3.5 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Room</th>
                  <th className="px-4 py-3.5 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Resident ID</th>
                  <th className="px-4 py-3.5 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Name & Profile</th>
                  <th className="px-4 py-3.5 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Stay Period</th>
                  <th className="px-4 py-3.5 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                  <th className="px-4 py-3.5 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">Stay Status</th>
                  <th className="px-4 py-3.5 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">Payment Status</th>
                  <th className="px-4 py-3.5 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Pending Due</th>
                  <th className="px-4 py-3.5 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredRenters.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-16 text-center">
                      <svg className="w-8 h-8 mx-auto text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                      <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">No resident stay matching these parameters</p>
                    </td>
                  </tr>
                ) : (
                  filteredRenters.map((renter) => {
                    const pendingDue = getPendingDue(renter)
                    const effectiveStatus = getEffectiveStatus(renter)
                    const effectiveStatusStyle = getEffectiveStatusStyle(renter)
                    const cycleEnd = renter.monthlyRenter?.currentCycleEnd || renter.checkOutDate
                    const isMonthly = renter.bookingType === 'MONTHLY'

                    return (
                      <tr key={renter.id} className="hover:bg-slate-50/60 transition-all group">
                        <td className="px-4 py-3.5">
                          <span className="text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-xl">
                            {renter.room?.roomNumber || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-[10px] font-black text-slate-500 font-mono tracking-tighter opacity-80">
                            {renter.bookingId}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-extrabold text-xs text-slate-800 leading-tight">{renter.customerName}</div>
                          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">{renter.customerEmail} · {renter.customerPhone}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1 text-[10px] font-extrabold text-slate-700">
                            <span>{new Date(renter.checkInDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}</span>
                            <span className="text-slate-300 font-black">→</span>
                            <span>{cycleEnd ? new Date(cycleEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }) : 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                            isMonthly
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}>
                            {renter.bookingType}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${getStayStatusStyle(renter.stayStatus)}`}>
                            {(renter.stayStatus || 'BOOKED').replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${effectiveStatusStyle}`}>
                            {effectiveStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span className={`text-xs font-black ${pendingDue > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                            {pendingDue > 0 ? `₹${pendingDue.toLocaleString()}` : '₹0 Cleared'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex gap-1.5 justify-end">
                            <button
                              onClick={() => handleOpenDrawer(renter)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                            >
                              Manage & Logs
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest text-right">
          Displaying {filteredRenters.length} of {renters.length} checked-in ledger logs
        </div>

      </div>

      {/* ============================================================== */}
      {/* RESIDENT DETAIL OVERLAY DRAWER                                 */}
      {/* ============================================================== */}
      {selectedRenter && (
        <div className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white h-screen shadow-2xl overflow-y-auto relative animate-in slide-in-from-right duration-300 flex flex-col">
            
            {/* Drawer Header */}
            <div className="p-6 bg-slate-900 text-white flex justify-between items-start sticky top-0 z-10 shadow-lg">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[10px] font-black text-blue-400 tracking-wider uppercase font-mono">{selectedRenter.bookingId}</span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                    selectedRenter.bookingType === 'MONTHLY' ? 'bg-purple-900 text-purple-200' : 'bg-blue-900 text-blue-200'
                  }`}>
                    {selectedRenter.bookingType} Stay
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${getStayStatusStyle(selectedRenter.stayStatus)}`}>
                    {(selectedRenter.stayStatus || 'BOOKED').replace(/_/g, ' ')}
                  </span>
                </div>
                <h2 className="text-xl font-black tracking-tight">{selectedRenter.customerName}</h2>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">Accommodated in <span className="text-white font-extrabold bg-blue-600 px-1.5 py-0.5 rounded">Room {selectedRenter.room?.roomNumber}</span> — {selectedRenter.room?.title}</p>
              </div>
              <button
                onClick={() => setSelectedRenter(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all"
              >
                ✕
              </button>
            </div>

            {/* Tab selection */}
            <div className="flex border-b border-slate-100 bg-slate-50 sticky top-[96px] z-10">
              {[
                { id: "details", label: "Stay Controls" },
                { id: "payments", label: `Payment History (${selectedRenter.payment?.length || 0})` },
                ...(selectedRenter.bookingType === 'MONTHLY' ? [{ id: "billing", label: `Monthly Invoices (${selectedRenterBills.length})` }] : []),
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`flex-1 py-3 text-center text-[10px] font-black uppercase tracking-wider border-b-2 transition-all ${
                    activeTab === t.id
                      ? 'border-blue-600 text-blue-600 bg-white font-black'
                      : 'border-transparent text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Drawer Body container */}
            <div className="p-6 flex-1">
              
              {drawerLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="w-8 h-8 rounded-full border-3 border-blue-600 border-t-transparent animate-spin" />
                  <p className="text-slate-400 text-[10px] uppercase tracking-widest font-black">Syncing details...</p>
                </div>
              ) : (
                <>
                  {/* TAB 1: DETAILS & STAY CONTROLS */}
                  {activeTab === "details" && (
                    <div className="space-y-6">
                      
                      {/* Resident Info Card */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <h4 className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-3">Resident Information</h4>
                        <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-700">
                          <div>
                            <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Email Address</span>
                            <span>{selectedRenter.customerEmail}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Contact Phone</span>
                            <span>{selectedRenter.customerPhone}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Stay Period</span>
                            <span>{new Date(selectedRenter.checkInDate).toLocaleDateString()} to {new Date(selectedRenter.checkOutDate).toLocaleDateString()}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Duration Days</span>
                            <span>{selectedRenter.totalDays} Days Staid</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Aadhaar (ID)</span>
                            <span>{selectedRenter.customerAadhaar || 'Not uploaded'}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Outstanding Dues</span>
                            <span className={getPendingDue(selectedRenter) > 0 ? 'text-red-500 font-black' : 'text-emerald-500 font-black'}>
                              ₹{getPendingDue(selectedRenter).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Stay Actions Section */}
                      <div className="bg-white p-4 rounded-2xl border border-slate-100">
                        <h4 className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-3.5">Stay Lifecycle Controls</h4>
                        
                        <div className="flex flex-col gap-2.5">
                          {/* Payment Pending check */}
                          {(selectedRenter.status === 'PENDING' && selectedRenter.paymentStatus === 'PENDING') && (
                            <button
                              onClick={() => handleConfirmPayment(selectedRenter.id)}
                              disabled={actionLoading !== null}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black tracking-widest text-[10px] uppercase py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                            >
                              {actionLoading === 'confirm' ? "Verifying..." : "Verify Payment & Confirm Stay"}
                            </button>
                          )}

                          {/* Check In Action */}
                          {(selectedRenter.status === 'CONFIRMED' && selectedRenter.stayStatus !== 'CHECKED_IN' && selectedRenter.stayStatus !== 'STAYING' && selectedRenter.stayStatus !== 'CHECKED_OUT') && (
                            <button
                              onClick={() => handleCheckIn(selectedRenter.id)}
                              disabled={actionLoading !== null}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black tracking-widest text-[10px] uppercase py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                            >
                              {actionLoading === 'checkin' ? "Checking In..." : "Check In Guest"}
                            </button>
                          )}

                          {/* Check Out Action */}
                          {(selectedRenter.stayStatus === 'CHECKED_IN' || selectedRenter.stayStatus === 'STAYING') && (
                            <button
                              onClick={() => handleCheckOut(selectedRenter.id)}
                              disabled={actionLoading !== null}
                              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black tracking-widest text-[10px] uppercase py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                            >
                              {actionLoading === 'checkout' ? "Checking Out..." : "End Stay / Check Out Guest"}
                            </button>
                          )}

                          {/* Restore stay checkout */}
                          {selectedRenter.stayStatus === 'CHECKED_OUT' && (
                            <button
                              onClick={() => handleUndoCheckOut(selectedRenter.id)}
                              disabled={actionLoading !== null}
                              className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-black tracking-widest text-[10px] uppercase py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                            >
                              {actionLoading === 'undocheckout' ? "Restoring..." : "Restore Stay (Undo checkout)"}
                            </button>
                          )}

                          {/* Cancel stay */}
                          {(selectedRenter.status !== 'CANCELLED' && selectedRenter.status !== 'COMPLETED' && selectedRenter.stayStatus !== 'CHECKED_OUT') && (
                            <button
                              onClick={() => handleCancelStay(selectedRenter.id)}
                              disabled={actionLoading !== null}
                              className="w-full bg-white hover:bg-red-50 text-red-500 border border-red-100 font-black tracking-widest text-[10px] uppercase py-3 rounded-xl transition-all flex items-center justify-center gap-1.5"
                            >
                              {actionLoading === 'cancel' ? "Cancelling..." : "Cancel Reservation Stays"}
                            </button>
                          )}

                          <div className="border-t border-slate-100 my-2.5"></div>

                          {/* DELETE DANGER ACTION */}
                          <button
                            onClick={() => handleDeleteStay(selectedRenter.id)}
                            disabled={actionLoading !== null}
                            className="w-full bg-red-100 hover:bg-red-200 text-red-700 border border-red-200 font-black tracking-widest text-[10px] uppercase py-3 rounded-xl transition-all flex items-center justify-center gap-1.5"
                          >
                            {actionLoading === 'delete' ? "Deleting stay..." : "🗑️ Delete Resident Stay Completely"}
                          </button>
                          <p className="text-[9px] text-slate-400 font-medium text-center uppercase tracking-wide">Purges resident, bookings, invoices & ledger logs permanently</p>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* TAB 2: TRANSACTION LOGS / PAYMENTS */}
                  {activeTab === "payments" && (
                    <div className="space-y-4">
                      
                      {/* Log Action Bar */}
                      <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Transaction Cash Ledger</span>
                        <button
                          onClick={() => setShowAddPaymentModal(true)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-black text-[9px] uppercase tracking-wider px-3.5 py-1.5 rounded-lg transition-all"
                        >
                          + Log A Payment
                        </button>
                      </div>

                      {/* Payments table list */}
                      <div className="space-y-2.5">
                        {(() => {
                          const paymentArray = selectedRenter.payment || []
                          if (paymentArray.length === 0) {
                            return (
                              <div className="text-center py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                <p className="text-slate-400 font-black text-[9px] uppercase tracking-widest">No payment records logged</p>
                              </div>
                            )
                          }

                          return paymentArray.map((p: any) => (
                            <div key={p.id} className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-xs flex justify-between items-center hover:border-slate-200 transition-all">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-slate-800">₹{p.amount.toLocaleString()}</span>
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                    p.paymentMethod === 'UPI' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {p.paymentMethod}
                                  </span>
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                    p.paymentStatus === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {p.paymentStatus}
                                  </span>
                                </div>
                                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">
                                  Txn ID: <span className="font-mono text-slate-600">{p.transactionId || 'N/A'}</span> · {new Date(p.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                              <div>
                                <button
                                  onClick={() => handleDeletePayment(p.id)}
                                  className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1.5 rounded-lg text-xs transition-all active:scale-95"
                                  title="Delete payment log"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          ))
                        })()}
                      </div>

                    </div>
                  )}

                  {/* TAB 3: MONTHLY INVOICING (Monthly stay only) */}
                  {activeTab === "billing" && (
                    <div className="space-y-4">
                      
                      {/* billing header bar */}
                      <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Monthly Rent Cycles Invoicing</span>
                        <button
                          onClick={() => {
                            setBillRent(String(selectedRenter.monthlyRenter?.rentAmount || selectedRenter.room?.monthlyPrice || 0))
                            setBillDueDate(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
                            setShowAddBillModal(true)
                          }}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-black text-[9px] uppercase tracking-wider px-3.5 py-1.5 rounded-lg transition-all"
                        >
                          + Issue Monthly Invoice
                        </button>
                      </div>

                      {/* Invoices display list */}
                      <div className="space-y-2.5">
                        {selectedRenterBills.length === 0 ? (
                          <div className="text-center py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                            <p className="text-slate-400 font-black text-[9px] uppercase tracking-widest">No monthly cycles invoiced yet</p>
                          </div>
                        ) : (
                          selectedRenterBills.map((b) => (
                            <div key={b.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs hover:border-slate-200 transition-all space-y-2.5">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="text-xs font-black text-slate-800">{b.month}</div>
                                  <div className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Due: {new Date(b.dueDate).toLocaleDateString()}</div>
                                </div>
                                <div className="flex gap-2 items-center">
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                    b.isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {b.status.replace(/_/g, ' ')}
                                  </span>
                                  <button
                                    onClick={() => handleDeleteBill(b.id)}
                                    className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1.5 rounded-lg text-xs transition-all active:scale-95"
                                    title="Delete monthly bill invoice"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-50 text-[10px] font-bold text-slate-600">
                                <div>
                                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Rent</span>
                                  <span>₹{b.rentAmount}</span>
                                </div>
                                <div>
                                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Electric</span>
                                  <span>₹{b.electricityAmount}</span>
                                </div>
                                <div>
                                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Maint.</span>
                                  <span>₹{b.extraCharges}</span>
                                </div>
                                <div>
                                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider text-right">Remaining</span>
                                  <span className="block text-right text-slate-900 font-black">₹{b.remainingAmount}</span>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                    </div>
                  )}

                </>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ADD RENTER MULTI-STEP CREATION MODAL                           */}
      {/* ============================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="mb-4">
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Check-In Resident Booking</h3>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Register resident stays directly onto the hostel ledger</p>
            </div>

            {/* Step Progress Indicators */}
            <div className="flex items-center gap-1.5 mb-6">
              {[
                { step: 1, label: "Profile" },
                { step: 2, label: "Stay Unit" },
                { step: 3, label: "Review" }
              ].map(s => (
                <div key={s.step} className="flex-1 flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black tracking-wider ${
                    addStep === s.step
                      ? 'bg-blue-600 text-white font-black'
                      : addStep > s.step ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {s.step}
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-wider ${
                    addStep === s.step ? 'text-blue-600' : 'text-slate-400'
                  }`}>
                    {s.label}
                  </span>
                  {s.step < 3 && <div className="flex-1 h-0.5 bg-slate-100 rounded-full" />}
                </div>
              ))}
            </div>

            {/* Step Form Body container */}
            <div className="flex-1 overflow-y-auto pr-1">
              
              {/* STEP 1: RESIDENT PROFILE */}
              {addStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Resident Full Name</label>
                    <input
                      type="text"
                      value={newRenter.customerName}
                      onChange={(e) => setNewRenter({ ...newRenter, customerName: e.target.value })}
                      placeholder="Enter guest's full name"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-slate-200 font-extrabold text-xs outline-none text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                    <input
                      type="email"
                      value={newRenter.customerEmail}
                      onChange={(e) => setNewRenter({ ...newRenter, customerEmail: e.target.value })}
                      placeholder="e.g. resident@domain.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-slate-200 font-extrabold text-xs outline-none text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Phone Number</label>
                    <input
                      type="text"
                      value={newRenter.customerPhone}
                      onChange={(e) => setNewRenter({ ...newRenter, customerPhone: e.target.value })}
                      placeholder="Enter 10-digit mobile number"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-slate-200 font-extrabold text-xs outline-none text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Aadhaar Card Number (Optional)</label>
                    <input
                      type="text"
                      value={newRenter.customerAadhaar}
                      onChange={(e) => setNewRenter({ ...newRenter, customerAadhaar: e.target.value })}
                      placeholder="Enter 12-digit Aadhaar UID"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-slate-200 font-extrabold text-xs outline-none text-slate-700"
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: ROOM & STAYS SELECTION */}
              {addStep === 2 && (
                <div className="space-y-4">
                  {/* Booking stay type selection */}
                  <div>
                    <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Stay Duration Category</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'DAILY', label: 'Daily Stays' },
                        { id: 'MONTHLY', label: 'Monthly Renters' }
                      ].map(t => (
                        <button
                          key={t.id}
                          onClick={() => {
                            const checkin = new Date(newRenter.checkInDate)
                            const checkout = new Date(checkin)
                            if (t.id === 'MONTHLY') {
                              checkout.setDate(checkout.getDate() + 30)
                            } else {
                              checkout.setDate(checkout.getDate() + 1)
                            }
                            setNewRenter({
                              ...newRenter,
                              bookingType: t.id as any,
                              checkOutDate: checkout.toISOString().split("T")[0]
                            })
                          }}
                          className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider border-2 transition-all ${
                            newRenter.bookingType === t.id
                              ? 'border-blue-600 text-blue-600 bg-blue-50/40 font-black'
                              : 'border-slate-100 hover:border-slate-200 text-slate-400'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Room select */}
                  <div>
                    <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Assign Hostel Room Unit</label>
                    <select
                      value={newRenter.roomId}
                      onChange={(e) => setNewRenter({ ...newRenter, roomId: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-extrabold text-xs outline-none cursor-pointer text-slate-700"
                    >
                      <option value="">-- Choose Accommodation Room --</option>
                      {rooms
                        .filter(r => r.isAvailable && r.currentOccupancy < r.capacity)
                        .map(r => (
                          <option key={r.id} value={r.id}>
                            Room {r.roomNumber} - {r.title} ({r.roomType}) | Rent: ₹{newRenter.bookingType === 'MONTHLY' ? (r.monthlyPrice || r.price*30) : (r.dailyPrice || r.price)}/{newRenter.bookingType === 'MONTHLY'?'mo':'day'}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Stay Dates */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Check-in Date</label>
                      <input
                        type="date"
                        value={newRenter.checkInDate}
                        onChange={(e) => handleCheckInDateChange(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-100 rounded-xl font-extrabold text-xs outline-none text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Check-out Date</label>
                      <input
                        type="date"
                        value={newRenter.checkOutDate}
                        onChange={(e) => setNewRenter({ ...newRenter, checkOutDate: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-100 rounded-xl font-extrabold text-xs outline-none text-slate-700"
                      />
                    </div>
                  </div>

                  {/* Guest count */}
                  <div>
                    <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Staying Guest Count</label>
                    <input
                      type="number"
                      min={1}
                      max={4}
                      value={newRenter.numberOfGuests}
                      onChange={(e) => setNewRenter({ ...newRenter, numberOfGuests: parseInt(e.target.value) || 1 })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-slate-200 font-extrabold text-xs outline-none text-slate-700"
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: SUMMARY REVIEW */}
              {addStep === 3 && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3.5">
                    <h4 className="text-[10px] text-slate-400 font-black uppercase tracking-widest border-b border-slate-200/60 pb-1.5">Check-In Staying Receipt</h4>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs font-bold text-slate-700">
                      <div>
                        <span className="text-[8px] text-slate-400 font-bold block uppercase tracking-wider">Renter Resident</span>
                        <span>{newRenter.customerName}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 font-bold block uppercase tracking-wider">Aadhaar ID</span>
                        <span>{newRenter.customerAadhaar || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 font-bold block uppercase tracking-wider">Email Address</span>
                        <span>{newRenter.customerEmail}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 font-bold block uppercase tracking-wider">Contact Phone</span>
                        <span>{newRenter.customerPhone}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 font-bold block uppercase tracking-wider">Assigned Room Unit</span>
                        <span>Room {rooms.find(r => r.id === parseInt(newRenter.roomId))?.roomNumber || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 font-bold block uppercase tracking-wider">Guests Count</span>
                        <span>{newRenter.numberOfGuests} Resident</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 font-bold block uppercase tracking-wider">Stay Range</span>
                        <span>{newRenter.checkInDate} to {newRenter.checkOutDate}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 font-bold block uppercase tracking-wider">Stay Type</span>
                        <span className="text-blue-600 font-black">{newRenter.bookingType} STAY</span>
                      </div>
                    </div>
                  </div>

                  {/* Auto account registration message */}
                  <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-3.5 flex items-start gap-2.5">
                    <span className="text-blue-600 font-bold text-sm">👤</span>
                    <div>
                      <p className="text-[10px] font-black text-blue-800 uppercase tracking-wide">Dynamic Guest Registration</p>
                      <p className="text-[9px] text-blue-600/90 font-medium leading-relaxed mt-0.5">The system will dynamically search for a matching user. If this email does not exist, a new resident account will be auto-generated with password <span className="font-extrabold underline">User@12345</span>.</p>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Actions Footer */}
            <div className="flex gap-2.5 mt-6 border-t border-slate-100 pt-4">
              {addStep > 1 && (
                <button
                  onClick={() => setAddStep((addStep - 1) as any)}
                  className="bg-white hover:bg-slate-50 text-slate-500 border border-slate-200 font-bold tracking-widest text-[9px] uppercase py-3 px-4 rounded-xl transition-all"
                >
                  Back
                </button>
              )}
              {addStep < 3 ? (
                <button
                  onClick={() => setAddStep((addStep + 1) as any)}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold tracking-widest text-[9px] uppercase py-3 rounded-xl transition-all shadow-sm"
                >
                  Next Step →
                </button>
              ) : (
                <button
                  onClick={handleAddRenterSubmit}
                  disabled={actionLoading === 'add-renter'}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold tracking-widest text-[9px] uppercase py-3 rounded-xl transition-all shadow-md active:scale-95"
                >
                  {actionLoading === 'add-renter' ? "Checking In..." : "Confirm & Book Stay"}
                </button>
              )}
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setAddStep(1)
                }}
                className="bg-white hover:bg-slate-50 text-slate-400 font-bold tracking-widest text-[9px] uppercase py-3 px-4 rounded-xl transition-all"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ADD PAYMENT SUB-MODAL                                          */}
      {/* ============================================================== */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden bg-white">
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Log Transaction Payment</h3>
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-5">Record CASH or UPI collections directly onto the stay booking</p>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Payment Amount (₹)</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter collected amount"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-slate-200 font-extrabold text-xs outline-none text-slate-700"
                />
              </div>

              <div>
                <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e: any) => setPaymentMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-extrabold text-xs outline-none cursor-pointer text-slate-700"
                >
                  <option value="CASH">CASH Payment</option>
                  <option value="UPI">UPI Reference Code</option>
                  <option value="ONLINE">ONLINE Portal Transfer</option>
                </select>
              </div>

              {paymentMethod === 'UPI' && (
                <div>
                  <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">12-Digit UPI Transaction UTR</label>
                  <input
                    type="text"
                    value={paymentTxnId}
                    onChange={(e) => setPaymentTxnId(e.target.value)}
                    placeholder="Enter UPI reference UTR number"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-slate-200 font-extrabold text-xs outline-none text-slate-700"
                  />
                </div>
              )}

              <div>
                <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Transaction Status</label>
                <select
                  value={paymentStatus}
                  onChange={(e: any) => setPaymentStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-extrabold text-xs outline-none cursor-pointer text-slate-700"
                >
                  <option value="SUCCESS">Completed (Success)</option>
                  <option value="PENDING">Verification Pending</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-5 pt-3 border-t border-slate-100">
              <button
                onClick={handleAddPaymentSubmit}
                disabled={actionLoading === 'add-payment'}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold tracking-widest text-[9px] uppercase py-2.5 rounded-xl transition-all shadow-md active:scale-95"
              >
                {actionLoading === 'add-payment' ? "Saving..." : "Record Payment"}
              </button>
              <button
                onClick={() => setShowAddPaymentModal(false)}
                className="bg-white hover:bg-slate-50 text-slate-500 border border-slate-200 font-bold tracking-widest text-[9px] uppercase py-2.5 px-4 rounded-xl transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* GENERATE MONTHLY BILL SUB-MODAL                                */}
      {/* ============================================================== */}
      {showAddBillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden bg-white">
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Issue Rent & Bill Invoice</h3>
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-5">Generate monthly invoice containing rent and extra charges</p>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Monthly Room Rent Amount (₹)</label>
                <input
                  type="number"
                  value={billRent}
                  onChange={(e) => setBillRent(e.target.value)}
                  placeholder="Enter monthly room rent"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-slate-200 font-extrabold text-xs outline-none text-slate-700"
                />
              </div>

              <div>
                <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Electricity Bill Charges (₹)</label>
                <input
                  type="number"
                  value={billElectricity}
                  onChange={(e) => setBillElectricity(e.target.value)}
                  placeholder="Enter electric utility bill"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-slate-200 font-extrabold text-xs outline-none text-slate-700"
                />
              </div>

              <div>
                <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Maintenance / Extra Charges (₹)</label>
                <input
                  type="number"
                  value={billMaintenance}
                  onChange={(e) => setBillMaintenance(e.target.value)}
                  placeholder="Enter extra maintenance cost"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-slate-200 font-extrabold text-xs outline-none text-slate-700"
                />
              </div>

              <div>
                <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Invoice Payment Due Date</label>
                <input
                  type="date"
                  value={billDueDate}
                  onChange={(e) => setBillDueDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-100 rounded-xl font-extrabold text-xs outline-none text-slate-700"
                />
              </div>

              <div>
                <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Notes / Instructions (Optional)</label>
                <input
                  type="text"
                  value={billNotes}
                  onChange={(e) => setBillNotes(e.target.value)}
                  placeholder="e.g. Includes AC extra usages"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-slate-200 font-extrabold text-xs outline-none text-slate-700"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-5 pt-3 border-t border-slate-100">
              <button
                onClick={handleAddBillSubmit}
                disabled={actionLoading === 'add-bill'}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold tracking-widest text-[9px] uppercase py-2.5 rounded-xl transition-all shadow-md active:scale-95"
              >
                {actionLoading === 'add-bill' ? "Generating..." : "Generate Invoice"}
              </button>
              <button
                onClick={() => setShowAddBillModal(false)}
                className="bg-white hover:bg-slate-50 text-slate-500 border border-slate-200 font-bold tracking-widest text-[9px] uppercase py-2.5 px-4 rounded-xl transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default RentersManagement
