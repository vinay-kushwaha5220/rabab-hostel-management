import { useEffect, useState } from "react"
import { billingService } from "../../services/billingService"
import api from "../../services/apiV2"
import type { MonthlyBill } from "../../types/billing"
import LoadingSpinner from "../../components/ui/LoadingSpinner"
import Card from "../../components/ui/Card"
import Button from "../../components/ui/Button"
import Badge from "../../components/ui/Badge"

type TabFilterType = 'ALL' | 'ACTIVE' | 'DUE SOON' | 'OVERDUE' | 'VERIFY PAYMENT' | 'CHECKOUT REQUEST'

const MonthlyBillingManagement = () => {
  const [bills, setBills] = useState<MonthlyBill[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabFilterType>('ALL')
  const [floorFilter, setFloorFilter] = useState<string>("")
  const [roomTypeFilter, setRoomTypeFilter] = useState<string>("")
  const [monthFilter, setMonthFilter] = useState<string>("")
  const [yearFilter, setYearFilter] = useState<string>("")
  const [roomFilter, setRoomFilter] = useState<string>("")
  
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [selectedBill, setSelectedBill] = useState<MonthlyBill | null>(null)
  const [verifyAmount, setVerifyAmount] = useState("")
  const [verifyMethod, setVerifyMethod] = useState("CASH")
  const [stats, setStats] = useState<any>(null)
  
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchBills()
    fetchStats()
  }, [monthFilter, yearFilter, roomFilter])

  const fetchStats = async () => {
    try {
      const data = await billingService.getBillingStats(monthFilter || undefined, yearFilter || undefined)
      setStats(data)
    } catch (err) {
      console.error("Failed to fetch billing stats:", err)
    }
  }

  const fetchBills = async () => {
    try {
      setLoading(true)
      const data = await billingService.getAllBills({
        month: monthFilter || undefined,
        year: yearFilter || undefined,
        roomNumber: roomFilter || undefined
      })
      setBills(data)
      setError("")
    } catch (err) {
      setError("Failed to fetch monthly bills.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // ==========================================
  // HELPERS FOR DATES & STATUSES
  // ==========================================
  const getStayDaysLeft = (dueDateStr: string | Date | undefined) => {
    if (!dueDateStr) return { days: 0, text: "N/A" }
    const due = new Date(dueDateStr)
    due.setHours(0, 0, 0, 0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return { 
      days: diffDays, 
      text: diffDays < 0 ? `Overdue by ${Math.abs(diffDays)} days` : (diffDays === 0 ? "Expires Today" : `${diffDays} days left`) 
    }
  }

  const getRentStatus = (bill: any) => {
    const renter = bill.booking?.monthlyRenter
    
    // 1. Check for Pending Verification (Blue)
    if (bill.status === "VERIFICATION_PENDING" || (bill.verificationStatus === "PENDING" && !bill.isPaid)) {
      return "PENDING_VERIFICATION"
    }

    // 2. Check for Checkout Pending (Gray)
    if (renter?.status === "CHECKOUT_PENDING") {
      return "CHECKOUT_PENDING"
    }

    // 3. Check for Checked Out (Gray)
    if (renter?.status === "CHECKED_OUT" || renter?.stayStatus === "CHECKED_OUT") {
      return "CHECKED_OUT"
    }

    // 4. Check for Overdue (Red)
    if (renter?.status === "OVERDUE" || bill.status === "OVERDUE") {
      return "OVERDUE"
    }

    // 5. Calculate Days Remaining
    const dueDateVal = renter?.dueDate || bill.dueDate
    if (!dueDateVal) return "ACTIVE"
    const { days } = getStayDaysLeft(dueDateVal)

    if (days < 0) return "OVERDUE"
    if (days === 0) return "EXPIRES TODAY"
    if (days >= 1 && days <= 9) return "DUE SOON"

    return "ACTIVE"
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "ACTIVE": return "success" // Green
      case "DUE SOON": return "warning" // Yellow
      case "EXPIRES TODAY": return "warning" // Orange (warning maps to orange/yellow)
      case "OVERDUE": return "danger" // Red
      case "PENDING_VERIFICATION": return "info" // Blue
      case "CHECKOUT_PENDING": return "secondary" // Gray
      case "CHECKED_OUT": return "secondary" // Gray
      default: return "secondary"
    }
  }

  // ==========================================
  // ADMIN ACTIONS
  // ==========================================
  const handleVerifyClick = (bill: MonthlyBill) => {
    setSelectedBill(bill)
    setVerifyAmount(bill.remainingAmount.toString())
    setVerifyMethod("UPI")
    setShowVerifyModal(true)
  }

  const handleVerifySubmit = async () => {
    if (!selectedBill) return
    try {
      setActionLoading(`verify-${selectedBill.id}`)
      setError("")
      setSuccess("")
      
      await api.put(`/monthly-bills/${selectedBill.id}/verify`, {
        amount: parseFloat(verifyAmount),
        paymentMethod: verifyMethod
      })
      
      setSuccess(`Payment for ${selectedBill.booking?.customerName || "renter"} verified successfully!`)
      setShowVerifyModal(false)
      setSelectedBill(null)
      await fetchBills()
      await fetchStats()
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to verify payment")
    } finally {
      setActionLoading(null)
    }
  }

  const handleCollectCashRent = async (bill: MonthlyBill) => {
    if (!window.confirm(`Record immediate offline CASH rent collection of ₹${bill.remainingAmount.toLocaleString()} from ${bill.booking?.customerName}?`)) return
    try {
      setActionLoading(`collect-${bill.id}`)
      setError("")
      setSuccess("")
      
      await api.put(`/monthly-bills/${bill.id}/verify`, {
        amount: bill.remainingAmount,
        paymentMethod: "CASH"
      })
      
      setSuccess(`Cash collection recorded and verified successfully for ${bill.booking?.customerName}!`)
      await fetchBills()
      await fetchStats()
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to collect rent cash.")
    } finally {
      setActionLoading(null)
    }
  }

  const handleCheckoutRenter = async (bookingId: number, isForce: boolean) => {
    const actionText = isForce ? "FORCE CHECKOUT & EVICT" : "APPROVE CHECKOUT for"
    if (!window.confirm(`Are you absolutely sure you want to ${actionText} this renter? The room occupancy will be released immediately.`)) return
    try {
      setActionLoading(`checkout-${bookingId}`)
      setError("")
      setSuccess("")

      await api.put(`/bookings/${bookingId}/check-out`)
      
      setSuccess(`Checkout successfully completed! Renter stays checked out and room occupancy released.`)
      await fetchBills()
      await fetchStats()
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to complete checkout.")
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectCheckout = async (bookingId: number, renterName: string) => {
    if (!window.confirm(`Are you sure you want to REJECT the checkout request from ${renterName}?`)) return
    try {
      setActionLoading(`reject-${bookingId}`)
      setError("")
      setSuccess("")
      
      await billingService.rejectCheckout(bookingId)
      
      setSuccess(`Checkout request for ${renterName} rejected and reverted to active stay.`)
      await fetchBills()
      await fetchStats()
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reject checkout request.")
    } finally {
      setActionLoading(null)
    }
  }

  const handleSendReminder = async (bookingId: number, renterName: string) => {
    try {
      setActionLoading(`reminder-${bookingId}`)
      setError("")
      setSuccess("")
      
      await api.post(`/monthly-bills/admin/send-reminder/${bookingId}`)
      
      setSuccess(`Dues payment reminder successfully sent to ${renterName}!`)
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send reminder notification.")
    } finally {
      setActionLoading(null)
    }
  }

  const handleGenerateBulk = async () => {
    if (!monthFilter || !yearFilter) {
      alert("Please select both a Month and a Year in the filters first.")
      return
    }

    if (!window.confirm(`Generate monthly bills for ALL active monthly renters for ${monthFilter} ${yearFilter}?`)) return

    try {
      setLoading(true)
      const response = await api.post("/monthly-bills/admin/generate-bulk", {
        month: monthFilter,
        year: yearFilter
      })
      alert(response.data.message)
      await fetchBills()
      await fetchStats()
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to generate bulk bills")
    } finally {
      setLoading(false)
    }
  }

  // ==========================================
  // FILTERS AND SEARCH
  // ==========================================
  const filteredBills = bills.filter((bill) => {
    // Floor filter (starts with digit)
    if (floorFilter) {
      const roomNum = bill.booking?.room?.roomNumber || ""
      if (!roomNum.startsWith(floorFilter)) return false
    }

    // Room Type filter
    if (roomTypeFilter) {
      // roomType might not be available in the API response, so safely default to empty string
      const type = (bill.booking?.room as any)?.roomType || ""
      if (type && type !== roomTypeFilter) return false
    }

    // Tab quick statuses
    const rentStatus = getRentStatus(bill)
    if (activeTab === 'ACTIVE' && rentStatus !== 'ACTIVE') return false
    if (activeTab === 'DUE SOON' && rentStatus !== 'DUE SOON' && rentStatus !== 'EXPIRES TODAY') return false
    if (activeTab === 'OVERDUE' && rentStatus !== 'OVERDUE') return false
    if (activeTab === 'VERIFY PAYMENT' && rentStatus !== 'PENDING_VERIFICATION') return false
    if (activeTab === 'CHECKOUT REQUEST' && rentStatus !== 'CHECKOUT_PENDING') return false

    return true
  })

  // Format Dates
  const formatDate = (dateStr: any) => {
    if (!dateStr) return "N/A"
    return new Date(dateStr).toLocaleDateString("en-US", { day: "numeric", month: "short" })
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-6 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Title Section */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>💼</span> Admin Monthly Rent Control Panel
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Professional monthly cycles, invoice audits, checkout controls & status synchronization</p>
          </div>
          <div>
            <Button
              onClick={handleGenerateBulk}
              variant="outline"
              size="sm"
              className="shadow-sm border-blue-200 text-blue-600 hover:bg-blue-50 flex items-center gap-1.5 font-bold text-[10px] tracking-wider uppercase"
              disabled={!monthFilter || !yearFilter}
              title={!monthFilter || !yearFilter ? "Select Month & Year in filters to generate statements" : ""}
            >
              <span>⚙️</span> Bulk Generate Bills
            </Button>
          </div>
        </div>

        {/* Professional Analytics Cards (Business Rule 4) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <Card className="p-3 bg-white border-l-4 border-blue-500 shadow-sm flex flex-col justify-between">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Expected Rent</span>
            <span className="text-sm font-black text-slate-900 mt-1">₹{stats?.totalExpected?.toLocaleString() || "0"}</span>
          </Card>
          
          <Card className="p-3 bg-white border-l-4 border-emerald-500 shadow-sm flex flex-col justify-between">
            <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Collected Rent</span>
            <span className="text-sm font-black text-emerald-600 mt-1">₹{stats?.totalReceived?.toLocaleString() || "0"}</span>
          </Card>

          <Card className="p-3 bg-white border-l-4 border-rose-500 shadow-sm flex flex-col justify-between">
            <span className="text-[8px] font-black text-rose-600 uppercase tracking-widest">Pending Dues</span>
            <span className="text-sm font-black text-rose-600 mt-1">₹{stats?.remainingDues?.toLocaleString() || "0"}</span>
          </Card>

          <Card className="p-3 bg-white border-l-4 border-red-500 shadow-sm flex flex-col justify-between">
            <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">Overdue Renters</span>
            <span className="text-sm font-black text-red-600 mt-1">{stats?.totalOverdueRenters || "0"} Active</span>
          </Card>

          <Card className="p-3 bg-white border-l-4 border-amber-500 shadow-sm flex flex-col justify-between">
            <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">Expiring 7 Days</span>
            <span className="text-sm font-black text-amber-600 mt-1">{stats?.totalExpiringThisWeek || "0"} Renters</span>
          </Card>

          <Card className="p-3 bg-white border-l-4 border-slate-700 shadow-sm flex flex-col justify-between">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Occupancy Rate</span>
            <span className="text-sm font-black text-slate-800 mt-1">{stats?.occupancyPercentage || "0"}% Room Occupied</span>
          </Card>
        </div>

        {/* Global Dues Notifications banner */}
        {error && (
          <div className="mb-4 p-3 bg-rose-50 border-l-4 border-rose-600 rounded-xl text-xs font-semibold text-rose-700">
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-emerald-50 border-l-4 border-emerald-600 rounded-xl text-xs font-semibold text-emerald-800">
            ✅ {success}
          </div>
        )}

        {/* Comprehensive Filters Toolbar */}
        <Card className="mb-5 p-4 shadow-sm bg-white border border-slate-100/80">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Month</label>
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-100 rounded-lg focus:ring-1 focus:ring-blue-500 font-bold"
              >
                <option value="">All Months</option>
                {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Year</label>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-100 rounded-lg focus:ring-1 focus:ring-blue-500 font-bold"
              >
                <option value="">All Years</option>
                {[2024, 2025, 2026, 2027].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Floor</label>
              <select
                value={floorFilter}
                onChange={(e) => setFloorFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-100 rounded-lg focus:ring-1 focus:ring-blue-500 font-bold"
              >
                <option value="">All Floors</option>
                <option value="1">1st Floor</option>
                <option value="2">2nd Floor</option>
                <option value="3">3rd Floor</option>
                <option value="4">4th Floor</option>
              </select>
            </div>

            <div>
              <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Room Type</label>
              <select
                value={roomTypeFilter}
                onChange={(e) => setRoomTypeFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-100 rounded-lg focus:ring-1 focus:ring-blue-500 font-bold"
              >
                <option value="">All Types</option>
                <option value="AC">AC Room</option>
                <option value="NON_AC">Non AC Room</option>
              </select>
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Search Room</label>
              <input
                type="text"
                value={roomFilter}
                onChange={(e) => setRoomFilter(e.target.value)}
                placeholder="Ex: 220"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-100 rounded-lg focus:ring-1 focus:ring-blue-500 font-bold"
              />
            </div>
          </div>
        </Card>

        {/* Tab Filters Tabs Selector */}
        <div className="flex overflow-x-auto gap-1.5 pb-2 mb-4 scrollbar-thin">
          {(['ALL', 'ACTIVE', 'DUE SOON', 'OVERDUE', 'VERIFY PAYMENT', 'CHECKOUT REQUEST'] as TabFilterType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === tab ? 'bg-slate-900 text-white shadow-sm' : 'bg-white hover:bg-slate-50 text-slate-500 border border-slate-100'}`}
            >
              {tab.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Renter Records Table Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" text="Syncing & Loading monthly stay cycles..." />
          </div>
        ) : filteredBills.length === 0 ? (
          <Card className="p-20 text-center border-none shadow-sm bg-white">
            <span className="text-4xl">📁</span>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-4">No matching billing statements found.</p>
          </Card>
        ) : (
          <Card className="overflow-hidden border-none shadow-sm bg-white p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest">
                    <th className="py-4 px-4">Room</th>
                    <th className="py-4 px-4">Renter</th>
                    <th className="py-4 px-4">Current Cycle</th>
                    <th className="py-4 px-4">Due Date</th>
                    <th className="py-4 px-4">Remaining / Overdue</th>
                    <th className="py-4 px-4 text-right">Rent</th>
                    <th className="py-4 px-4 text-right">Paid</th>
                    <th className="py-4 px-4 text-right">Pending</th>
                    <th className="py-4 px-4">Method</th>
                    <th className="py-4 px-4">Rent Status</th>
                    <th className="py-4 px-4 text-right">Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredBills.map((bill: any) => {
                    const renter = bill.booking?.monthlyRenter
                    const rentStatus = getRentStatus(bill)
                    const { text: daysLeftText } = getStayDaysLeft(renter?.dueDate || bill.dueDate)
                    const roomTypeLabel = ((bill.booking?.room as any)?.roomType === "AC" || (bill.booking?.room as any)?.roomType === "NON_AC") ? (bill.booking?.room as any)?.roomType : "N/A"
                    
                    return (
                      <tr key={bill.id} className="hover:bg-slate-50/50 transition-colors">
                        {/* Room Column */}
                        <td className="py-3 px-4 font-black text-slate-900">
                          {bill.booking?.room?.roomNumber || "N/A"}
                          <span className="block text-[8px] font-bold text-slate-400 mt-0.5">{roomTypeLabel}</span>
                        </td>

                        {/* Renter Column */}
                        <td className="py-3 px-4 font-bold text-slate-800">
                          {bill.booking?.customerName || "Unknown"}
                          <span className="block text-[8px] font-bold text-slate-400 mt-0.5">{bill.booking?.customerPhone || "N/A"}</span>
                        </td>

                        {/* Cycle Column */}
                        <td className="py-3 px-4 text-slate-600 font-semibold">
                          {formatDate(renter?.currentCycleStart)} → {formatDate(renter?.currentCycleEnd)}
                        </td>

                        {/* Due Date Column */}
                        <td className="py-3 px-4 font-bold text-slate-800">
                          {formatDate(renter?.dueDate || bill.dueDate)}
                        </td>

                        {/* Days remaining / overdue Days */}
                        <td className="py-3 px-4 font-bold">
                          <span className={
                            rentStatus === "OVERDUE" ? "text-rose-600" : 
                            (rentStatus === "EXPIRES TODAY" || rentStatus === "DUE SOON" ? "text-amber-600" : "text-emerald-600")
                          }>
                            {daysLeftText}
                          </span>
                        </td>

                        {/* Rent Column */}
                        <td className="py-3 px-4 text-right font-semibold text-slate-600">
                          ₹{(renter?.rentAmount || bill.rentAmount).toLocaleString()}
                        </td>

                        {/* Paid Amount Column */}
                        <td className="py-3 px-4 text-right font-black text-emerald-600">
                          ₹{bill.paidAmount.toLocaleString()}
                        </td>

                        {/* Pending Amount Column */}
                        <td className="py-3 px-4 text-right font-black text-rose-600">
                          ₹{bill.remainingAmount.toLocaleString()}
                        </td>

                        {/* Payment Method Column */}
                        <td className="py-3 px-4 font-bold text-slate-500 uppercase tracking-widest text-[9px]">
                          {bill.payments?.[0]?.paymentMethod || bill.paymentMethod || "UPI"}
                        </td>

                        {/* Rent Status Badge */}
                        <td className="py-3 px-4">
                          <Badge variant={getStatusBadgeVariant(rentStatus)} size="sm" className="text-[8px] font-black uppercase tracking-wider">
                            {rentStatus.replace("_", " ")}
                          </Badge>
                        </td>

                        {/* Admin Action Buttons (Business Rule 5 & Actions) */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex gap-1.5 justify-end">
                            
                            {/* Verify button (for verify payment filter/status) */}
                            {rentStatus === "PENDING_VERIFICATION" && (
                              <button
                                onClick={() => handleVerifyClick(bill)}
                                disabled={actionLoading === `verify-${bill.id}`}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm"
                              >
                                {actionLoading === `verify-${bill.id}` ? "Verifying..." : "Verify Payment"}
                              </button>
                            )}

                            {/* Collect Cash Rent button */}
                            {bill.remainingAmount > 0 && rentStatus !== "PENDING_VERIFICATION" && (
                              <button
                                onClick={() => handleCollectCashRent(bill)}
                                disabled={actionLoading === `collect-${bill.id}`}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm"
                              >
                                💵 Cash
                              </button>
                            )}

                            {/* Send Reminder button */}
                            {(rentStatus === "OVERDUE" || rentStatus === "DUE SOON") && (
                              <button
                                onClick={() => handleSendReminder(bill.bookingId, bill.booking?.customerName)}
                                disabled={actionLoading === `reminder-${bill.bookingId}`}
                                className="bg-amber-500 hover:bg-amber-600 text-white px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm"
                              >
                                ✉️ Remind
                              </button>
                            )}

                            {/* Approve Checkout (If pending request) */}
                            {rentStatus === "CHECKOUT_PENDING" && (
                              <>
                                <button
                                  onClick={() => handleCheckoutRenter(bill.bookingId, false)}
                                  disabled={actionLoading === `checkout-${bill.bookingId}`}
                                  className="bg-slate-700 hover:bg-slate-800 text-white px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm"
                                >
                                  Approve Checkout
                                </button>
                                <button
                                  onClick={() => handleRejectCheckout(bill.bookingId, bill.booking?.customerName)}
                                  disabled={actionLoading === `reject-${bill.bookingId}`}
                                  className="border border-rose-300 hover:bg-rose-50 text-rose-600 px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm ml-1.5"
                                >
                                  Reject Checkout
                                </button>
                              </>
                            )}

                            {/* Force Checkout (If Overdue Renter) */}
                            {rentStatus === "OVERDUE" && (
                              <button
                                onClick={() => handleCheckoutRenter(bill.bookingId, true)}
                                disabled={actionLoading === `checkout-${bill.bookingId}`}
                                className="bg-rose-600 hover:bg-rose-700 text-white px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm"
                              >
                                Force Evict
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Sleek Verify Payment Modal */}
        {showVerifyModal && selectedBill && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden bg-white border border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Settle Statement Dues</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6">
                Recording for {selectedBill.booking?.customerName} (Room {selectedBill.booking?.room?.roomNumber})
              </p>
              
              <div className="space-y-4">
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex justify-between items-center">
                  <span className="text-[8px] font-bold text-rose-500 uppercase tracking-widest">Statement Balance</span>
                  <span className="text-sm font-black text-rose-600">₹{selectedBill.remainingAmount.toLocaleString()}</span>
                </div>
                
                <div>
                  <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Payment Amount (₹)</label>
                  <input
                    type="number"
                    value={verifyAmount}
                    onChange={(e) => setVerifyAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg focus:ring-1 focus:ring-blue-500 font-black text-xs"
                  />
                </div>
                
                <div>
                  <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Verified Method</label>
                  <select
                    value={verifyMethod}
                    onChange={(e) => setVerifyMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg focus:ring-1 focus:ring-blue-500 font-bold text-xs"
                  >
                    <option value="UPI">UPI / Online Verification</option>
                    <option value="CASH">Offline Cash Settlement</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-2.5 mt-6">
                <Button
                  onClick={handleVerifySubmit}
                  size="sm"
                  disabled={actionLoading === `verify-${selectedBill.id}`}
                  className="flex-1 font-bold tracking-widest text-[9px] uppercase py-2.5"
                >
                  {actionLoading === `verify-${selectedBill.id}` ? "Processing..." : "Verify & Settle"}
                </Button>
                <Button
                  onClick={() => setShowVerifyModal(false)}
                  variant="outline"
                  size="sm"
                  className="font-bold tracking-widest text-[9px] uppercase py-2.5"
                >
                  Cancel
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default MonthlyBillingManagement
