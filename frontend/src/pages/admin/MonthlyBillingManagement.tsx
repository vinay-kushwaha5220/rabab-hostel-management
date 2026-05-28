import { useEffect, useState } from "react"
import { billingService } from "../../services/billingService"
import api from "../../services/apiV2"
import type { MonthlyBill } from "../../types/billing"
import type { StayRenewalRequestType } from "../../types/booking"
import LoadingSpinner from "../../components/ui/LoadingSpinner"
import Card from "../../components/ui/Card"
import Button from "../../components/ui/Button"
import Badge from "../../components/ui/Badge"

type TabFilterType = 'ALL' | 'ACTIVE' | 'DUE SOON' | 'OVERDUE' | 'PAYMENT PENDING' | 'VERIFY PAYMENT' | 'CHECKOUT REQUEST'

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
  const [renewalRequests, setRenewalRequests] = useState<StayRenewalRequestType[]>([])
  const [checkoutRequests, setCheckoutRequests] = useState<StayRenewalRequestType[]>([])
  const [showRenewalModal, setShowRenewalModal] = useState(false)
  const [selectedRenewalRequest, setSelectedRenewalRequest] = useState<StayRenewalRequestType | null>(null)
  const [approvalElectricity, setApprovalElectricity] = useState("0")
  const [approvalOtherCharges, setApprovalOtherCharges] = useState("0")
  const [approvalNotes, setApprovalNotes] = useState("")

  const [showSendInvoiceModal, setShowSendInvoiceModal] = useState(false)
  const [selectedDraftBill, setSelectedDraftBill] = useState<any | null>(null)
  const [draftElectricity, setDraftElectricity] = useState("0")
  const [draftExtraCharges, setDraftExtraCharges] = useState("0")
  
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const getApiErrorMessage = (err: unknown, fallback: string) => {
    return (err as any)?.response?.data?.message || fallback
  }

  useEffect(() => {
    fetchBills()
    fetchStats()
    fetchRenewalRequests()
  }, [monthFilter, yearFilter, roomFilter])

  useEffect(() => {
    if (renewalRequests.length > 0 || checkoutRequests.length > 0) {
      console.log(`ℹ️ Pending requests loaded: continue=${renewalRequests.length}, checkout=${checkoutRequests.length}`)
    }
  }, [renewalRequests, checkoutRequests])

  const fetchRenewalRequests = async () => {
    try {
      // Fetch CONTINUE_STAY requests
      const continueData = await billingService.getPendingRenewalRequests({ requestType: "CONTINUE_STAY", status: "PENDING" })
      setRenewalRequests(continueData)

      // Fetch CHECKOUT requests separately
      const checkoutData = await billingService.getPendingRenewalRequests({ requestType: "CHECKOUT", status: "PENDING" })
      setCheckoutRequests(checkoutData)
    } catch (err) {
      console.error("Failed to fetch renewal requests:", err)
    }
  }

  const resetRenewalForm = () => {
    setSelectedRenewalRequest(null)
    setApprovalElectricity("0")
    setApprovalOtherCharges("0")
    setApprovalNotes("")
  }

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

  const isBillHistorical = (bill: any): boolean => {
    const renter = bill.booking?.monthlyRenter
    if (!renter) return false
    if (!renter.currentCycleStart) return false
    
    const billDueDate = new Date(bill.dueDate)
    const cycleStart = new Date(renter.currentCycleStart)
    
    billDueDate.setHours(0, 0, 0, 0)
    cycleStart.setHours(0, 0, 0, 0)
    
    return billDueDate.getTime() < cycleStart.getTime()
  }

  const formatBillCycle = (bill: any) => {
    const monthStr = bill.month || ""
    if (monthStr.startsWith("Cycle: ")) {
      const parts = monthStr.replace("Cycle: ", "").split(" to ")
      if (parts.length === 2) {
        return `${formatDate(parts[0])} → ${formatDate(parts[1])}`
      }
    }
    
    const renter = bill.booking?.monthlyRenter
    if (renter?.currentCycleStart && renter?.currentCycleEnd) {
      return `${formatDate(renter.currentCycleStart)} → ${formatDate(renter.currentCycleEnd)}`
    }
    
    return monthStr || "N/A"
  }

  const normalizeMonthlyRenterStatus = (status?: string): string | undefined => {
    if (!status) return undefined
    switch (status) {
      case "CHECKOUT_PENDING":
      case "CHECKOUT_REQUESTED":
        return "CHECKOUT_REQUESTED"
      case "CONTINUE_REQUESTED":
        return "CONTINUE_REQUESTED"
      case "RENEWAL_PENDING":
      case "PENDING_ADMIN_APPROVAL":
      case "STAY_CONTINUED":
      case "PENDING_PAYMENT":
        return "PAYMENT_PENDING"
      default:
        return status
    }
  }

  const getRentStatus = (bill: any) => {
    if (bill.status === "DRAFT") return "DRAFT"
    const renter = bill.booking?.monthlyRenter
    const normalizedStatus = normalizeMonthlyRenterStatus(renter?.status)

    // 1. Check for Pending Verification (Blue) — payment submitted, awaiting admin
    if (bill.status === "VERIFICATION_PENDING") {
      return "PENDING_VERIFICATION"
    }

    // 2. Checked Out (Gray) — take priority over billing states
    if (renter?.status === "CHECKED_OUT" || renter?.stayStatus === "CHECKED_OUT") {
      return "CHECKED_OUT"
    }

    // 3. Bill is fully paid — check renter-level status for request states
    if (bill.isPaid) {
      // Renter may have submitted a continue/checkout request after paying
      if (normalizedStatus === "CHECKOUT_REQUESTED") return "CHECKOUT_REQUESTED"
      if (normalizedStatus === "CONTINUE_REQUESTED") return "CONTINUE_REQUESTED"
      // Bill is paid — return PAID
      return "PAID"
    }

    // 4. Bill is UNPAID — check renter request states
    if (normalizedStatus === "CHECKOUT_REQUESTED") return "CHECKOUT_REQUESTED"
    if (normalizedStatus === "CONTINUE_REQUESTED") return "CONTINUE_REQUESTED"
    if (normalizedStatus === "PAYMENT_PENDING") return "PAYMENT_PENDING"

    // 5. Check for Overdue (Red)
    if (renter?.status === "OVERDUE" || bill.status === "OVERDUE") {
      return "OVERDUE"
    }

    // 6. Calculate Days Remaining on the STAY CYCLE (not bill due date) for unpaid bills
    const cycleEndVal = renter?.currentCycleEnd || renter?.dueDate || bill.dueDate
    if (!cycleEndVal) return "ACTIVE"
    const { days } = getStayDaysLeft(cycleEndVal)

    if (days < 0) return "OVERDUE"
    if (days === 0) return "EXPIRES TODAY"
    if (days >= 1 && days <= 9) return "DUE SOON"

    return "ACTIVE"
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "DRAFT": return "secondary"
      case "ACTIVE": return "success" // Green
      case "DUE SOON": return "warning" // Yellow
      case "EXPIRES TODAY": return "danger" // Red
      case "OVERDUE": return "danger" // Red
      case "PAYMENT_PENDING": return "warning" // Orange
      case "CONTINUE_REQUESTED": return "warning" // Amber — awaiting admin decision
      case "PENDING_VERIFICATION": return "info" // Blue
      case "CHECKOUT_REQUESTED": return "secondary" // Gray
      case "CHECKED_OUT": return "secondary" // Gray
      case "PAID": return "success" // Green
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
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to verify payment"))
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
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to collect rent cash."))
    } finally {
      setActionLoading(null)
    }
  }

  const handleOpenSendInvoiceModal = (bill: any) => {
    setSelectedDraftBill(bill)
    setDraftElectricity("0")
    setDraftExtraCharges("0")
    setShowSendInvoiceModal(true)
  }

  const handleConfirmSendInvoice = async () => {
    if (!selectedDraftBill) return
    try {
      setActionLoading(`send-${selectedDraftBill.id}`)
      setError("")
      setSuccess("")
      
      await api.post(`/monthly-bills/admin/send-invoice/${selectedDraftBill.id}`, {
        electricityAmount: parseFloat(draftElectricity) || 0,
        extraCharges: parseFloat(draftExtraCharges) || 0
      })
      
      setSuccess(`Monthly bill for ${selectedDraftBill.booking?.customerName || "renter"} sent successfully!`)
      setShowSendInvoiceModal(false)
      setSelectedDraftBill(null)
      await fetchBills()
      await fetchStats()
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to send monthly invoice."))
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
      await fetchRenewalRequests()
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to complete checkout."))
    } finally {
      setActionLoading(null)
    }
  }

  // const openRenewalApproval = (request: StayRenewalRequestType) => {
  //   setSelectedRenewalRequest(request)
  //   setApprovalElectricity(String(request.monthlyRenter?.lastElectricityAmount ?? request.booking?.monthlyRenter?.lastElectricityAmount ?? 0))
  //   setApprovalOtherCharges("0")
  //   setApprovalNotes("")
  //   setShowRenewalModal(true)
  // }

  const calculateRenewalTotal = () => {
    if (!selectedRenewalRequest) return 0
    const rent = selectedRenewalRequest.monthlyRenter?.rentAmount ?? selectedRenewalRequest.booking?.monthlyRenter?.rentAmount ?? 0
    const pendingDue = (selectedRenewalRequest.booking as any)?.monthlyBills?.[0]?.remainingAmount ?? 0
    const electricity = parseFloat(approvalElectricity || "0") || 0
    const other = parseFloat(approvalOtherCharges || "0") || 0
    return rent + pendingDue + electricity + other
  }

  const handleApproveRenewal = async () => {
    if (!selectedRenewalRequest) return

    try {
      setActionLoading(`approve-renewal-${selectedRenewalRequest.id}`)
      setError("")
      setSuccess("")

      await billingService.approveContinueStay(selectedRenewalRequest.id, {
        electricityAmount: parseFloat(approvalElectricity) || 0,
        otherCharges: parseFloat(approvalOtherCharges) || 0,
        notes: approvalNotes
      })

      setSuccess(`Continue stay approved for ${selectedRenewalRequest.booking?.customerName || selectedRenewalRequest.monthlyRenter?.user?.name || "renter"}.`)
      setShowRenewalModal(false)
      resetRenewalForm()
      await fetchBills()
      await fetchStats()
      await fetchRenewalRequests()
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to approve renewal request."))
    } finally {
      setActionLoading(null)
    }
  }

  // const handleRejectRenewal = async (request: StayRenewalRequestType) => {
  //   const reason = window.prompt(`Reject continue stay request for ${request.booking?.customerName || request.monthlyRenter?.user?.name || "renter"}. Please enter a reason:`)
  //   if (reason === null) return

  //   try {
  //     setActionLoading(`reject-renewal-${request.id}`)
  //     setError("")
  //     setSuccess("")
  //     
  //     await billingService.rejectContinueStay(request.id, { reason })
  //     
  //     setSuccess(`Continue stay request rejected for ${request.booking?.customerName || request.monthlyRenter?.user?.name || "renter"}.`)
  //     await fetchBills()
  //     await fetchStats()
  //     await fetchRenewalRequests()
  //   } catch (err) {
  //     setError(getApiErrorMessage(err, "Failed to reject renewal request."))
  //   } finally {
  //     setActionLoading(null)
  //   }
  // }

  const handleSendReminder = async (bookingId: number, renterName: string) => {
    try {
      setActionLoading(`reminder-${bookingId}`)
      setError("")
      setSuccess("")
      
      await api.post(`/monthly-bills/admin/send-reminder/${bookingId}`)
      
      setSuccess(`Dues payment reminder successfully sent to ${renterName}!`)
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to send reminder notification."))
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectCheckout = async (bookingId: number, renterName: string) => {
    if (!window.confirm(`Are you sure you want to REJECT the checkout request from ${renterName}?`)) return
    try {
      setActionLoading(`reject-checkout-${bookingId}`)
      setError("")
      setSuccess("")

      await billingService.rejectCheckout(bookingId)

      setSuccess(`Checkout request for ${renterName} rejected and reverted to active stay.`)
      await fetchBills()
      await fetchStats()
      await fetchRenewalRequests()
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to reject checkout request."))
    } finally {
      setActionLoading(null)
    }
  }

  // const handleGenerateBulk = async () => {
  //   if (!monthFilter || !yearFilter) {
  //     alert("Please select both a Month and a Year in the filters first.")
  //     return
  //   }

  //   if (!window.confirm(`Generate monthly bills for ALL active monthly renters for ${monthFilter} ${yearFilter}?`)) return

  //   try {
  //     setLoading(true)
  //     const response = await api.post("/monthly-bills/admin/generate-bulk", {
  //       month: monthFilter,
  //       year: yearFilter
  //     })
  //     alert(response.data.message)
  //     await fetchBills()
  //     await fetchStats()
  //   } catch (err) {
  //     setError(getApiErrorMessage(err, "Failed to generate bulk bills"))
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  // const handleTriggerReminders = async () => {
  //   if (!window.confirm("Are you sure you want to trigger the automatic Stay Cycle Day 5 reminders? This will send direct in-app chat messages, system notifications, and emails to ALL renters with unpaid invoices.")) return

  //   try {
  //     setLoading(true)
  //     setError("")
  //     setSuccess("")
  //     const response = await api.post("/monthly-bills/admin/trigger-reminders")
  //     setSuccess(response.data.message || "Stay cycle reminders triggered successfully!")
  //     await fetchBills()
  //     await fetchStats()
  //   } catch (err) {
  //     setError(getApiErrorMessage(err, "Failed to trigger billing reminders."))
  //   } finally {
  //     setLoading(false)
  //   }
  // }

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
    
    if (activeTab === 'ACTIVE') {
      // Show currently active unpaid stay cycles or currently active paid stay cycles
      if (rentStatus !== 'ACTIVE' && rentStatus !== 'PAID' && rentStatus !== 'DUE SOON' && rentStatus !== 'EXPIRES TODAY') {
        return false
      }
      // Filter out historical cycles to avoid duplicates in active view
      if (isBillHistorical(bill)) {
        return false
      }
    }
    
    if (activeTab === 'DUE SOON' && rentStatus !== 'DUE SOON' && rentStatus !== 'EXPIRES TODAY') return false
    if (activeTab === 'OVERDUE' && rentStatus !== 'OVERDUE') return false
    if (activeTab === 'PAYMENT PENDING' && rentStatus !== 'PAYMENT_PENDING' && rentStatus !== 'CONTINUE_REQUESTED') return false
    if (activeTab === 'VERIFY PAYMENT' && rentStatus !== 'PENDING_VERIFICATION') return false
    if (activeTab === 'CHECKOUT REQUEST' && rentStatus !== 'CHECKOUT_REQUESTED') return false

    return true
  })

  // Format Dates
  const formatDate = (dateStr: any) => {
    if (!dateStr) return "N/A"
    return new Date(dateStr).toLocaleDateString("en-US", { day: "numeric", month: "short" })
  }

  return (
    <div className="min-h-screen bg-slate-50/40 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Title Section */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg font-bold shadow-inner">
                💼
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  Admin Monthly Rent Control Panel
                </h1>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Professional monthly cycles, invoice audits, checkout controls & status synchronization
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Premium Analytics Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Card 1: Expected */}
          <div className="p-4 bg-white border border-slate-200/50 rounded-2xl shadow-[0_2px_8px_-4px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_25px_-6px_rgba(59,130,246,0.12)] hover:border-blue-200/60 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group">
            <div className="flex justify-between items-start">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Expected Rent</span>
              <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs group-hover:scale-110 transition-transform duration-300">🏦</span>
            </div>
            <span className="text-base font-bold text-slate-900 mt-3">₹{stats?.totalExpected?.toLocaleString() || "0"}</span>
          </div>
          
          {/* Card 2: Collected */}
          <div className="p-4 bg-white border border-slate-200/50 rounded-2xl shadow-[0_2px_8px_-4px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_25px_-6px_rgba(16,185,129,0.12)] hover:border-emerald-200/60 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group">
            <div className="flex justify-between items-start">
              <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Collected Rent</span>
              <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs group-hover:scale-110 transition-transform duration-300">💵</span>
            </div>
            <span className="text-base font-bold text-emerald-600 mt-3">₹{stats?.totalReceived?.toLocaleString() || "0"}</span>
          </div>

          {/* Card 3: Pending Dues */}
          <div className="p-4 bg-white border border-slate-200/50 rounded-2xl shadow-[0_2px_8px_-4px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_25px_-6px_rgba(244,63,94,0.12)] hover:border-rose-200/60 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group">
            <div className="flex justify-between items-start">
              <span className="text-[9px] font-bold text-rose-600 uppercase tracking-wider">Pending Dues</span>
              <span className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-xs group-hover:scale-110 transition-transform duration-300">⏳</span>
            </div>
            <span className="text-base font-bold text-rose-600 mt-3">₹{stats?.remainingDues?.toLocaleString() || "0"}</span>
          </div>

          {/* Card 4: Overdue Renters */}
          <div className="p-4 bg-white border border-slate-200/50 rounded-2xl shadow-[0_2px_8px_-4px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_25px_-6px_rgba(239,68,68,0.12)] hover:border-red-200/60 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group">
            <div className="flex justify-between items-start">
              <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider">Overdue Renters</span>
              <span className="w-6 h-6 rounded-lg bg-red-50 text-red-600 flex items-center justify-center text-xs group-hover:scale-110 transition-transform duration-300">⚠️</span>
            </div>
            <span className="text-base font-bold text-red-600 mt-3">{stats?.totalOverdueRenters || "0"} Active</span>
          </div>

          {/* Card 5: Expiring 7 Days */}
          <div className="p-4 bg-white border border-slate-200/50 rounded-2xl shadow-[0_2px_8px_-4px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_25px_-6px_rgba(245,158,11,0.12)] hover:border-amber-200/60 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group">
            <div className="flex justify-between items-start">
              <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider">Expiring 7 Days</span>
              <span className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-xs group-hover:scale-110 transition-transform duration-300">📅</span>
            </div>
            <span className="text-base font-bold text-amber-600 mt-3">{stats?.totalExpiringThisWeek || "0"} Renters</span>
          </div>

          {/* Card 6: Occupancy Rate */}
          <div className="p-4 bg-white border border-slate-200/50 rounded-2xl shadow-[0_2px_8px_-4px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_25px_-6px_rgba(71,85,105,0.12)] hover:border-slate-350 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group">
            <div className="flex justify-between items-start">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Occupancy Rate</span>
              <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center text-xs group-hover:scale-110 transition-transform duration-300">🔑</span>
            </div>
            <span className="text-base font-bold text-slate-800 mt-3">{stats?.occupancyPercentage || "0"}% Room Occupied</span>
          </div>
        </div>


        {/* Global Dues Notifications Banner */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-xs font-semibold text-rose-700 flex items-center gap-2 animate-in slide-in-from-top-4 duration-300">
            <span>⚠️</span> {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in slide-in-from-top-4 duration-300">
            <span>✅</span> {success}
          </div>
        )}

        {/* Comprehensive Filters Toolbar */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)]">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">Month</label>
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50/70 border border-slate-200/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-slate-700 transition-all duration-200"
              >
                <option value="">All Months</option>
                {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">Year</label>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50/70 border border-slate-200/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-slate-700 transition-all duration-200"
              >
                <option value="">All Years</option>
                {[2024, 2025, 2026, 2027].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">Floor</label>
              <select
                value={floorFilter}
                onChange={(e) => setFloorFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50/70 border border-slate-200/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-slate-700 transition-all duration-200"
              >
                <option value="">All Floors</option>
                <option value="1">1st Floor</option>
                <option value="2">2nd Floor</option>
                <option value="3">3rd Floor</option>
                <option value="4">4th Floor</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">Room Type</label>
              <select
                value={roomTypeFilter}
                onChange={(e) => setRoomTypeFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50/70 border border-slate-200/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-slate-700 transition-all duration-200"
              >
                <option value="">All Types</option>
                <option value="AC">AC Room</option>
                <option value="NON_AC">Non AC Room</option>
              </select>
            </div>

            <div className="col-span-2 md:col-span-1 space-y-1">
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">Search Room</label>
              <input
                type="text"
                value={roomFilter}
                onChange={(e) => setRoomFilter(e.target.value)}
                placeholder="Ex: 220"
                className="w-full px-3 py-2 text-xs bg-slate-50/70 border border-slate-200/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-slate-700 transition-all duration-200 placeholder:text-slate-300"
              />
            </div>
          </div>
        </div>

        {/* Tab Filters Tabs Selector Selector */}
        <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-none">
          {(['ALL', 'ACTIVE', 'DUE SOON', 'OVERDUE', 'PAYMENT PENDING', 'VERIFY PAYMENT', 'CHECKOUT REQUEST'] as TabFilterType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all duration-200 whitespace-nowrap active:scale-95 ${
                activeTab === tab
                  ? tab === 'PAYMENT PENDING' ? 'bg-amber-500 text-white shadow-md shadow-amber-500/10'
                  : tab === 'CHECKOUT REQUEST' ? 'bg-slate-700 text-white shadow-md shadow-slate-700/10'
                  : 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                  : 'bg-white hover:bg-slate-50 text-slate-500 border border-slate-200/50 shadow-sm'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Renter Records Table Grid */}
        {loading ? (
          <div className="flex justify-center py-24 bg-white border border-slate-100 rounded-3xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)]">
            <LoadingSpinner size="lg" text="Syncing & Loading monthly stay cycles..." />
          </div>
        ) : filteredBills.length === 0 ? (
          <div className="p-20 text-center bg-white border border-slate-100 rounded-3xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center space-y-3">
            <span className="text-3xl">📁</span>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No matching billing statements found.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-150 rounded-3xl overflow-hidden shadow-[0_4px_24px_-8px_rgba(0,0,0,0.04)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-[8px] font-bold uppercase tracking-widest border-b border-slate-800">
                    <th className="py-4 px-4 font-extrabold">Room</th>
                    <th className="py-4 px-4 font-extrabold">Renter</th>
                    <th className="py-4 px-4 font-extrabold">Current Cycle</th>
                    <th className="py-4 px-4 font-extrabold">Due Date</th>
                    <th className="py-4 px-4 font-extrabold">Remaining / Overdue</th>
                    <th className="py-4 px-4 text-right font-extrabold">Rent</th>
                    <th className="py-4 px-4 text-right font-extrabold">Paid</th>
                    <th className="py-4 px-4 text-right font-extrabold">Pending</th>
                    <th className="py-4 px-4 font-extrabold">Method</th>
                    <th className="py-4 px-4 font-extrabold">Rent Status</th>
                    <th className="py-4 px-4 text-right font-extrabold">Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredBills.map((bill: any) => {
                    const renter = bill.booking?.monthlyRenter
                    const rentStatus = getRentStatus(bill)
                    const { days: stayDays, text: daysLeftText } = getStayDaysLeft(renter?.dueDate || bill.dueDate)
                    const roomTypeLabel = ((bill.booking?.room as any)?.roomType === "AC" || (bill.booking?.room as any)?.roomType === "NON_AC") ? (bill.booking?.room as any)?.roomType : "N/A"
                    
                    return (
                      <tr key={bill.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                        {/* Room Column */}
                        <td className="py-4 px-4 font-bold text-slate-900">
                          {bill.booking?.room?.roomNumber || "N/A"}
                          <span className="block text-[8px] font-semibold text-slate-400 mt-0.5">{roomTypeLabel}</span>
                        </td>

                        {/* Renter Column */}
                        <td className="py-4 px-4 font-semibold text-slate-800">
                          {bill.booking?.customerName || "Unknown"}
                          <span className="block text-[8px] font-semibold text-slate-400 mt-0.5">{bill.booking?.customerPhone || "N/A"}</span>
                        </td>

                        {/* Cycle Column */}
                        <td className="py-4 px-4 text-slate-500 font-medium">
                          {formatBillCycle(bill)}
                        </td>

                        {/* Due Date Column */}
                        <td className="py-4 px-4 font-semibold text-slate-850">
                          {formatDate(bill.dueDate)}
                        </td>

                        {/* Days remaining / overdue Days */}
                        <td className="py-4 px-4 font-bold">
                          {bill.isPaid ? (
                            isBillHistorical(bill) ? (
                              <span className="text-slate-400 font-medium">Settled (Past)</span>
                            ) : (
                              <span className="text-emerald-600 font-medium">Settled (Current)</span>
                            )
                          ) : (
                            <span className={
                              stayDays < 0 || rentStatus === "OVERDUE" || rentStatus === "EXPIRES TODAY" ? "text-rose-600" : 
                              (stayDays >= 1 && stayDays <= 9) || rentStatus === "DUE SOON" || rentStatus === "PAYMENT_PENDING" ? "text-amber-600" : "text-emerald-600"
                            }>
                              {daysLeftText}
                            </span>
                          )}
                        </td>

                        {/* Rent Column */}
                        <td className="py-4 px-4 text-right font-medium text-slate-500">
                          ₹{(renter?.rentAmount || bill.rentAmount).toLocaleString()}
                        </td>

                        {/* Paid Amount Column */}
                        <td className="py-4 px-4 text-right font-bold text-emerald-600">
                          ₹{bill.paidAmount.toLocaleString()}
                        </td>

                        {/* Pending Amount Column */}
                        <td className="py-4 px-4 text-right font-bold text-rose-600">
                          ₹{bill.remainingAmount.toLocaleString()}
                        </td>

                        {/* Payment Method Column */}
                        <td className="py-4 px-4 font-bold text-slate-400 uppercase tracking-widest text-[8px]">
                          {bill.payments?.[0]?.paymentMethod || bill.paymentMethod || "UPI"}
                        </td>

                        {/* Rent Status Badge */}
                        <td className="py-4 px-4">
                          <Badge variant={getStatusBadgeVariant(rentStatus)} size="sm" className="text-[8px] font-extrabold uppercase tracking-wider rounded-lg px-2 py-0.5">
                            {rentStatus.replace(/_/g, " ")}
                          </Badge>
                        </td>

                        {/* Admin Action Buttons */}
                        <td className="py-4 px-4 text-right">
                          <div className="flex gap-1.5 justify-end">
                            
                            {/* Verify button */}
                            {rentStatus === "PENDING_VERIFICATION" && (
                              <button
                                onClick={() => handleVerifyClick(bill)}
                                disabled={actionLoading === `verify-${bill.id}`}
                                className="bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 px-2.5 py-1 rounded-xl text-[8px] font-extrabold uppercase tracking-wider transition-all duration-200 shadow-sm active:scale-95"
                              >
                                {actionLoading === `verify-${bill.id}` ? "Verifying..." : "Verify Payment"}
                              </button>
                            )}

                            {/* Send Draft Invoice button */}
                            {rentStatus === "DRAFT" && (
                              <button
                                onClick={() => handleOpenSendInvoiceModal(bill)}
                                disabled={actionLoading === `send-${bill.id}`}
                                className="bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 px-2.5 py-1 rounded-xl text-[8px] font-extrabold uppercase tracking-wider transition-all duration-200 shadow-sm active:scale-95"
                              >
                                {actionLoading === `send-${bill.id}` ? "Sending..." : "✉️ Send Invoice"}
                              </button>
                            )}
 

                            {/* Collect Cash Rent button */}
                            {bill.remainingAmount > 0 && rentStatus !== "PENDING_VERIFICATION" && rentStatus !== "DRAFT" && (
                              <button
                                onClick={() => handleCollectCashRent(bill)}
                                disabled={actionLoading === `collect-${bill.id}`}
                                className="bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 px-2.5 py-1 rounded-xl text-[8px] font-extrabold uppercase tracking-wider transition-all duration-200 shadow-sm active:scale-95"
                              >
                                💵 Cash
                              </button>
                            )}

                            {/* Send Reminder button */}
                            {(rentStatus === "OVERDUE" || rentStatus === "DUE SOON") && (
                              <button
                                onClick={() => handleSendReminder(bill.bookingId, bill.booking?.customerName)}
                                disabled={actionLoading === `reminder-${bill.bookingId}`}
                                className="bg-amber-50 text-amber-700 border border-amber-100 hover:bg-amber-100 px-2.5 py-1 rounded-xl text-[8px] font-extrabold uppercase tracking-wider transition-all duration-200 shadow-sm active:scale-95"
                              >
                                ✉️ Remind
                              </button>
                            )}

                            {/* Approve Checkout */}
                            {rentStatus === "CHECKOUT_REQUESTED" && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleCheckoutRenter(bill.bookingId, false)}
                                  disabled={actionLoading === `checkout-${bill.bookingId}`}
                                  className="bg-slate-900 text-white hover:bg-slate-800 px-2.5 py-1 rounded-xl text-[8px] font-extrabold uppercase tracking-wider transition-all duration-200 shadow-sm active:scale-95"
                                >
                                  Approve Checkout
                                </button>
                                <button
                                  onClick={() => handleRejectCheckout(bill.bookingId, bill.booking?.customerName)}
                                  disabled={actionLoading === `reject-${bill.bookingId}`}
                                  className="bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 px-2.5 py-1 rounded-xl text-[8px] font-extrabold uppercase tracking-wider transition-all duration-200 shadow-sm active:scale-95"
                                >
                                  Reject
                                </button>
                              </div>
                            )}

                            {/* Force Checkout */}
                            {rentStatus === "OVERDUE" && (
                              <button
                                onClick={() => handleCheckoutRenter(bill.bookingId, true)}
                                disabled={actionLoading === `checkout-${bill.bookingId}`}
                                className="bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 px-2.5 py-1 rounded-xl text-[8px] font-extrabold uppercase tracking-wider transition-all duration-200 shadow-sm active:scale-95"
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
          </div>
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

        {showRenewalModal && selectedRenewalRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden bg-white border border-slate-100">
              <div className="flex items-start justify-between mb-1">
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Generate Monthly Bill</h3>
                <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 px-2 py-1 rounded-full">Continue Stay</span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                {selectedRenewalRequest.booking?.customerName || selectedRenewalRequest.monthlyRenter?.user?.name} — Room {selectedRenewalRequest.booking?.room?.roomNumber}
              </p>

              {/* Lifecycle flow */}
              <div className="mb-4 mt-2 flex items-center gap-1 text-[8px] font-bold text-slate-500 flex-wrap">
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">Approve</span>
                <span>→</span>
                <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full">Payment Pending</span>
                <span>→</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">Renter Pays</span>
                <span>→</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">Active</span>
              </div>

              <div className="space-y-3">

                {/* New Cycle Banner */}
                {selectedRenewalRequest.nextCycleStart && selectedRenewalRequest.nextCycleEnd && (
                  <div className="rounded-xl bg-blue-50 border border-blue-100 px-3 py-2">
                    <p className="text-[9px] text-blue-500 uppercase tracking-widest font-black mb-0.5">New Stay Cycle</p>
                    <p className="text-xs font-bold text-blue-800">
                      {new Date(selectedRenewalRequest.nextCycleStart).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      {" → "}
                      {new Date(selectedRenewalRequest.nextCycleEnd).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                )}

                {/* Editable Charges */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">⚡ Electricity Bill (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={approvalElectricity}
                      onChange={(e) => setApprovalElectricity(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-400 font-black text-xs"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">🔧 Maintenance / Other (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={approvalOtherCharges}
                      onChange={(e) => setApprovalOtherCharges(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-400 font-black text-xs"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Itemized Invoice Preview */}
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="bg-slate-900 px-3 py-2">
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Invoice Breakdown</p>
                  </div>
                  <div className="divide-y divide-slate-100">
                    <div className="flex items-center justify-between px-3 py-2.5 bg-white">
                      <span className="text-[10px] font-bold text-slate-600">🏠 Monthly Rent</span>
                      <span className="text-xs font-extrabold text-slate-900">₹{(selectedRenewalRequest?.monthlyRenter?.rentAmount ?? selectedRenewalRequest?.booking?.monthlyRenter?.rentAmount ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2.5 bg-white">
                      <span className="text-[10px] font-bold text-slate-600">⚡ Electricity Bill</span>
                      <span className="text-xs font-extrabold text-slate-900">₹{(parseFloat(approvalElectricity) || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2.5 bg-white">
                      <span className="text-[10px] font-bold text-slate-600">🔧 Maintenance / Other</span>
                      <span className="text-xs font-extrabold text-slate-900">₹{(parseFloat(approvalOtherCharges) || 0).toLocaleString()}</span>
                    </div>
                    {((selectedRenewalRequest?.booking as any)?.monthlyBills?.[0]?.remainingAmount ?? 0) > 0 && (
                      <div className="flex items-center justify-between px-3 py-2.5 bg-rose-50">
                        <span className="text-[10px] font-bold text-rose-600">⚠️ Previous Due</span>
                        <span className="text-xs font-extrabold text-rose-600">₹{((selectedRenewalRequest?.booking as any)?.monthlyBills?.[0]?.remainingAmount ?? 0).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between px-3 py-3 bg-emerald-50">
                      <div>
                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Total Due</span>
                        <p className="text-[8px] text-emerald-500 mt-0.5">Renter → PAYMENT PENDING after this</p>
                      </div>
                      <span className="text-lg font-extrabold text-emerald-700">₹{calculateRenewalTotal().toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Notes (Optional)</label>
                  <textarea
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    rows={2}
                    placeholder="e.g. Electricity read on 24th..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-400 font-semibold text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 mt-5">
                <Button
                  onClick={handleApproveRenewal}
                  size="sm"
                  disabled={actionLoading === `approve-renewal-${selectedRenewalRequest.id}`}
                  className="flex-1 font-bold tracking-widest text-[9px] uppercase py-2.5 bg-emerald-600 hover:bg-emerald-700"
                >
                  {actionLoading === `approve-renewal-${selectedRenewalRequest.id}` ? "Generating..." : "✓ Generate & Send Bill"}
                </Button>
                <Button
                  onClick={() => {
                    setShowRenewalModal(false)
                    resetRenewalForm()
                  }}
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

        {showSendInvoiceModal && selectedDraftBill && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden bg-white border border-slate-100">
              <div className="flex items-start justify-between mb-1">
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Send Monthly Invoice</h3>
                <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">Draft Invoice</span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                {selectedDraftBill.booking?.customerName} — Room {selectedDraftBill.booking?.room?.roomNumber}
              </p>

              {/* Lifecycle flow */}
              <div className="mb-4 mt-2 flex items-center gap-1 text-[8px] font-bold text-slate-500 flex-wrap">
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">Draft</span>
                <span>→</span>
                <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full">Send (5-day Grace)</span>
                <span>→</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">Renter Pays</span>
                <span>→</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">Settled</span>
              </div>

              <div className="space-y-3">
                {/* Billing Month Banner */}
                <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-3 py-2">
                  <p className="text-[9px] text-indigo-500 uppercase tracking-widest font-black mb-0.5">Billing Month</p>
                  <p className="text-xs font-bold text-indigo-800">
                    {selectedDraftBill.month} stay cycle
                  </p>
                </div>

                {/* Editable Charges */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">⚡ Electricity Bill (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={draftElectricity}
                      onChange={(e) => setDraftElectricity(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-400 font-black text-xs"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">🔧 Extra / Other Charges (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={draftExtraCharges}
                      onChange={(e) => setDraftExtraCharges(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-400 font-black text-xs"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Itemized Invoice Preview */}
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="bg-slate-900 px-3 py-2">
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Invoice Breakdown</p>
                  </div>
                  <div className="divide-y divide-slate-100">
                    <div className="flex items-center justify-between px-3 py-2.5 bg-white">
                      <span className="text-[10px] font-bold text-slate-600">🏠 Flat Monthly Rent</span>
                      <span className="text-xs font-extrabold text-slate-900">₹{selectedDraftBill.rentAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2.5 bg-white">
                      <span className="text-[10px] font-bold text-slate-600">⚡ Electricity Bill</span>
                      <span className="text-xs font-extrabold text-slate-900">₹{(parseFloat(draftElectricity) || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2.5 bg-white">
                      <span className="text-[10px] font-bold text-slate-600">🔧 Extra Charges</span>
                      <span className="text-xs font-extrabold text-slate-900">₹{(parseFloat(draftExtraCharges) || 0).toLocaleString()}</span>
                    </div>
                    {selectedDraftBill.previousDue > 0 && (
                      <div className="flex items-center justify-between px-3 py-2.5 bg-rose-50">
                        <span className="text-[10px] font-bold text-rose-600">⚠️ Previous Outstanding Dues</span>
                        <span className="text-xs font-extrabold text-rose-600">₹{selectedDraftBill.previousDue.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between px-3 py-3 bg-emerald-50">
                      <div>
                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Total Due Amount</span>
                        <p className="text-[8px] text-emerald-500 mt-0.5">Renter gets 5-day grace to pay this</p>
                      </div>
                      <span className="text-lg font-extrabold text-emerald-700">
                        ₹{(
                          selectedDraftBill.rentAmount +
                          (parseFloat(draftElectricity) || 0) +
                          (parseFloat(draftExtraCharges) || 0) +
                          selectedDraftBill.previousDue
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5 mt-5">
                <Button
                  onClick={handleConfirmSendInvoice}
                  size="sm"
                  disabled={actionLoading === `send-${selectedDraftBill.id}`}
                  className="flex-1 font-bold tracking-widest text-[9px] uppercase py-2.5 bg-indigo-600 hover:bg-indigo-700"
                >
                  {actionLoading === `send-${selectedDraftBill.id}` ? "Sending..." : "✉️ Send Invoice"}
                </Button>
                <Button
                  onClick={() => {
                    setShowSendInvoiceModal(false)
                    setSelectedDraftBill(null)
                  }}
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
