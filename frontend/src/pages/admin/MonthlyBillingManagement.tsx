import { useEffect, useState } from "react"
import { billingService } from "../../services/billingService"
import api from "../../services/apiV2"
import type { MonthlyBill } from "../../types/billing"
import LoadingSpinner from "../../components/ui/LoadingSpinner"
import Card from "../../components/ui/Card"
import Button from "../../components/ui/Button"
import Badge from "../../components/ui/Badge"

const MonthlyBillingManagement = () => {
  const [bills, setBills] = useState<MonthlyBill[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [monthFilter, setMonthFilter] = useState<string>("")
  const [yearFilter, setYearFilter] = useState<string>("")
  const [roomFilter, setRoomFilter] = useState<string>("")
  const [showForm, setShowForm] = useState(false)
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [selectedBill, setSelectedBill] = useState<MonthlyBill | null>(null)
  const [verifyAmount, setVerifyAmount] = useState("")
  const [verifyMethod, setVerifyMethod] = useState("CASH")
  const [stats, setStats] = useState<any>(null)
  const [editingBill, setEditingBill] = useState<MonthlyBill | null>(null)
  const [formData, setFormData] = useState({
    bookingId: "",
    month: "",
    rentAmount: "",
    electricityAmount: "",
    extraCharges: "",
    dueDate: "",
    isPaid: false,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [availableBookings, setAvailableBookings] = useState<any[]>([])
  const [loadingBookings, setLoadingBookings] = useState(false)

  useEffect(() => {
    fetchBills()
    fetchStats()
    fetchAvailableBookings()
  }, [statusFilter, monthFilter, yearFilter, roomFilter])

  const fetchStats = async () => {
    try {
      const data = await billingService.getBillingStats(monthFilter || undefined, yearFilter || undefined)
      setStats(data)
    } catch (err) {
      console.error("Failed to fetch billing stats:", err)
    }
  }

  const fetchAvailableBookings = async () => {
    try {
      setLoadingBookings(true)
      console.log("📡 Fetching active monthly bookings...")
      const response = await api.get("/bookings/monthly-active")
      console.log("✅ Bookings received:", response.data)
      setAvailableBookings(response.data)
    } catch (err) {
      console.error("❌ Failed to fetch bookings for dropdown:", err)
    } finally {
      setLoadingBookings(false)
    }
  }

  const fetchBills = async () => {
    try {
      setLoading(true)
      const data = await billingService.getAllBills({
        status: statusFilter || undefined,
        month: monthFilter || undefined,
        year: yearFilter || undefined,
        roomNumber: roomFilter || undefined
      })
      setBills(data)
      setError("")
    } catch (err) {
      setError("Failed to fetch bills")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!formData.bookingId || !formData.month || !formData.rentAmount || !formData.dueDate) {
      setError("Please fill in all required fields")
      return
    }

    try {
      setSubmitting(true)
      if (editingBill) {
        await billingService.updateBill(editingBill.id, {
          rentAmount: parseFloat(formData.rentAmount),
          electricityAmount: formData.electricityAmount ? parseFloat(formData.electricityAmount) : 0,
          extraCharges: formData.extraCharges ? parseFloat(formData.extraCharges) : 0,
          dueDate: formData.dueDate,
        })
        setSuccess("Bill updated successfully")
      } else {
        await billingService.createBill({
          bookingId: parseInt(formData.bookingId),
          month: formData.month,
          rentAmount: parseFloat(formData.rentAmount),
          electricityAmount: formData.electricityAmount ? parseFloat(formData.electricityAmount) : 0,
          extraCharges: formData.extraCharges ? parseFloat(formData.extraCharges) : 0,
          dueDate: formData.dueDate,
        })
        setSuccess("Bill created successfully")
      }
      setFormData({
        bookingId: "",
        month: "",
        rentAmount: "",
        electricityAmount: "",
        extraCharges: "",
        dueDate: "",
        isPaid: false
      })
      setEditingBill(null)
      setShowForm(false)
      // Clear filters so the new bill is visible
      setStatusFilter("")
      setMonthFilter("")
      await fetchBills()
    } catch (err: any) {
      console.error("Monthly bill save error:", err)
      const errorMessage = err.response?.data?.message || "Failed to save bill"
      setError(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (bill: MonthlyBill) => {
    // Format the date properly for the HTML5 date input (yyyy-MM-dd)
    const formattedDate = bill.dueDate ? new Date(bill.dueDate).toISOString().split('T')[0] : ""
    
    setEditingBill(bill)
    setFormData({
      bookingId: bill.bookingId.toString(),
      month: bill.month,
      rentAmount: bill.rentAmount.toString(),
      electricityAmount: bill.electricityAmount.toString(),
      extraCharges: bill.extraCharges.toString(),
      dueDate: formattedDate,
      isPaid: bill.isPaid || false
    })
    setShowForm(true)
    // Smooth scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleVerifyClick = (bill: MonthlyBill) => {
    setSelectedBill(bill)
    setVerifyAmount(bill.remainingAmount.toString())
    setShowVerifyModal(true)
  }

  const handleVerifySubmit = async () => {
    if (!selectedBill) return
    
    try {
      setLoading(true)
      await api.put(`/monthly-bills/${selectedBill.id}/verify`, {
        amount: parseFloat(verifyAmount),
        paymentMethod: verifyMethod
      })
      setSuccess("Payment verified successfully!")
      setShowVerifyModal(false)
      setSelectedBill(null)
      fetchBills()
      fetchStats()
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to verify payment")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (billId: number) => {
    if (!window.confirm("Are you sure you want to delete this bill?")) return

    try {
      await billingService.deleteBill(billId)
      setSuccess("Bill deleted successfully")
      await fetchBills()
    } catch (err) {
      setError("Failed to delete bill")
      console.error(err)
    }
  }

  const handleGenerateBulk = async () => {
    if (!monthFilter || !yearFilter) {
      alert("Please select a Month and Year in the filters first.")
      return
    }

    if (!window.confirm(`Generate bills for ALL active monthly renters for ${monthFilter} ${yearFilter}?`)) return

    try {
      setLoading(true)
      const response = await api.post("/monthly-bills/admin/generate-bulk", {
        month: monthFilter,
        year: yearFilter
      })
      alert(response.data.message)
      fetchBills()
      fetchStats()
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to generate bulk bills")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingBill(null)
    setFormData({
      bookingId: "",
      month: "",
      rentAmount: "",
      electricityAmount: "",
      extraCharges: "",
      dueDate: "",
      isPaid: false,
    })
  }

  // Calculate statistics
  const totalBills = bills.length
  const paidBills = bills.filter(b => b.isPaid).length
  const pendingBills = bills.filter(b => !b.isPaid).length
  const totalRevenue = bills.reduce((sum, b) => sum + b.totalAmount, 0)
  const pendingAmount = bills.filter(b => !b.isPaid).reduce((sum, b) => sum + b.totalAmount, 0)

  const filteredBills = bills.filter((bill) => {
    if (statusFilter && bill.isPaid !== (statusFilter === "paid")) return false
    if (monthFilter && bill.month !== monthFilter) return false
    return true
  })

  return (
    <div className="min-h-screen bg-slate-50/50 py-6 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Monthly Billing</h1>
              <p className="text-xs text-gray-400 font-medium mt-0.5">Track and manage renter invoices & payments</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleGenerateBulk}
                variant="outline"
                size="sm"
                className="shadow-sm border-blue-200 text-blue-600 hover:bg-blue-50 flex items-center gap-1.5"
                disabled={!monthFilter || !yearFilter}
                title={!monthFilter || !yearFilter ? "Select month/year to enable bulk generation" : ""}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span>Bulk Generate</span>
              </Button>
              <Button
                onClick={() => setShowForm(!showForm)}
                size="sm"
                className="shadow-sm flex items-center gap-1.5"
              >
                {showForm ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l18 18" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                )}
                <span>{showForm ? "Close Form" : "New Bill"}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 bg-white border-l-2 border-blue-600 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Expected</p>
                <p className="text-lg font-black text-gray-900 mt-0.5">₹{stats?.totalExpected?.toLocaleString() || "0"}</p>
              </div>
              <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white border-l-2 border-green-600 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Received</p>
                <p className="text-lg font-black text-green-600 mt-0.5">₹{stats?.totalReceived?.toLocaleString() || "0"}</p>
              </div>
              <div className="bg-green-50 p-2 rounded-lg text-green-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white border-l-2 border-red-600 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Remaining</p>
                <p className="text-lg font-black text-red-600 mt-0.5">₹{stats?.remainingDues?.toLocaleString() || "0"}</p>
              </div>
              <div className="bg-red-50 p-2 rounded-lg text-red-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 0v2m0-6v-2m0 0V7a2 2 0 012-2h2.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2h-2.586a1 1 0 01-.707-.293l-5.414-5.414a1 1 0 01-.293-.707V9z" /></svg>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white border-l-2 border-indigo-600 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Paid / Pending</p>
                <p className="text-lg font-black text-gray-900 mt-0.5">
                  <span className="text-green-600">{stats?.totalPaidRenters || "0"}</span>
                  <span className="text-gray-300 mx-1.5 font-light">/</span>
                  <span className="text-orange-600">{stats?.totalPendingRenters || "0"}</span>
                </p>
              </div>
              <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
            </div>
          </Card>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-2 border-red-500 rounded flex items-start gap-2.5">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <div>
              <p className="text-[10px] font-bold text-red-800 uppercase tracking-widest">Error</p>
              <p className="text-red-700 text-xs mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border-l-2 border-green-500 rounded flex items-start gap-2.5">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <div>
              <p className="text-[10px] font-bold text-green-800 uppercase tracking-widest">Success</p>
              <p className="text-green-700 text-xs mt-0.5">{success}</p>
            </div>
          </div>
        )}

        {/* Form Section */}
        {showForm && (
          <Card className="mb-6 p-6 shadow-sm border border-gray-100">
            <h2 className="text-base font-bold text-gray-900 mb-6 tracking-tight">
              {editingBill ? "Edit Bill" : "Generate Bill"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                    Renter <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.bookingId}
                    onChange={(e) => setFormData({ ...formData, bookingId: e.target.value })}
                    disabled={!!editingBill}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 disabled:opacity-50 font-medium"
                  >
                    <option value="">{loadingBookings ? "Loading..." : "Select Renter"}</option>
                    {!loadingBookings && availableBookings.length === 0 ? (
                      <option value="" disabled>No active monthly renters</option>
                    ) : (
                      availableBookings.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.customerName} (Room {b.room?.roomNumber || 'N/A'})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                    Month <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="month"
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    disabled={!!editingBill}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 disabled:opacity-50 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                    Rent (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.rentAmount}
                    onChange={(e) => setFormData({ ...formData, rentAmount: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 font-medium"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                    Electricity (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.electricityAmount}
                    onChange={(e) => setFormData({ ...formData, electricityAmount: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 font-medium"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                    Extras (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.extraCharges}
                    onChange={(e) => setFormData({ ...formData, extraCharges: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 font-medium"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                    Due Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>

                {editingBill && (
                  <div className="flex items-center gap-2 p-2 px-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <input
                      type="checkbox"
                      id="isPaid"
                      checked={formData.isPaid}
                      onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="isPaid" className="text-xs font-bold text-gray-700 cursor-pointer">
                      Mark as Paid
                    </label>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  isLoading={submitting}
                >
                  {editingBill ? "Update Bill" : "Create Bill"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Filters Section */}
        <Card className="mb-6 p-4 shadow-sm bg-white border border-gray-100">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Month</label>
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-100 rounded focus:ring-1 focus:ring-blue-500 transition-all font-medium"
              >
                <option value="">All Months</option>
                {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Year</label>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-100 rounded focus:ring-1 focus:ring-blue-500 transition-all font-medium"
              >
                <option value="">All Years</option>
                {[2024, 2025, 2026, 2027].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Room</label>
              <input
                type="text"
                value={roomFilter}
                onChange={(e) => setRoomFilter(e.target.value)}
                placeholder="Ex: 101"
                className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-100 rounded focus:ring-1 focus:ring-blue-500 transition-all font-medium placeholder:text-gray-300"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-100 rounded focus:ring-1 focus:ring-blue-500 transition-all font-medium"
              >
                <option value="">All Status</option>
                <option value="PAID">Paid</option>
                <option value="PARTIAL">Partial</option>
                <option value="PENDING">Pending</option>
                <option value="OVERDUE">Overdue</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Bills Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="md" text="Fetching bills..." />
          </div>
        ) : filteredBills.length === 0 ? (
          <Card className="p-12 text-center shadow-sm border-gray-100">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <p className="text-gray-400 text-sm font-medium">No billing records found</p>
          </Card>
        ) : (
          <Card className="overflow-hidden shadow-sm border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-[9px] font-bold text-gray-400 uppercase tracking-widest">Renter</th>
                    <th className="px-4 py-3 text-left text-[9px] font-bold text-gray-400 uppercase tracking-widest">Month</th>
                    <th className="px-4 py-3 text-right text-[9px] font-bold text-gray-400 uppercase tracking-widest">Prev Due</th>
                    <th className="px-4 py-3 text-right text-[9px] font-bold text-gray-400 uppercase tracking-widest">Rent + Elec</th>
                    <th className="px-4 py-3 text-right text-[9px] font-bold text-gray-400 uppercase tracking-widest">Total Due</th>
                    <th className="px-4 py-3 text-right text-[9px] font-bold text-gray-400 uppercase tracking-widest">Paid</th>
                    <th className="px-4 py-3 text-right text-[9px] font-bold text-gray-400 uppercase tracking-widest">Remaining</th>
                    <th className="px-4 py-3 text-center text-[9px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-4 py-3 text-right text-[9px] font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="text-xs font-bold text-gray-900 leading-tight">
                          {bill.booking?.customerName || "Unknown"}
                        </div>
                        <div className="text-[10px] text-gray-400 font-medium mt-0.5">
                          Room {bill.booking?.room?.roomNumber || "N/A"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-gray-600">
                        {bill.month}
                      </td>
                      <td className="px-4 py-3 text-xs text-right font-medium text-red-400">
                        ₹{bill.previousDue?.toLocaleString() || "0"}
                      </td>
                      <td className="px-4 py-3 text-xs text-right font-medium text-gray-700">
                        ₹{bill.totalAmount?.toLocaleString() || "0"}
                      </td>
                      <td className="px-4 py-3 text-xs text-right font-bold text-gray-900">
                        ₹{bill.totalDue?.toLocaleString() || "0"}
                      </td>
                      <td className="px-4 py-3 text-xs text-right font-medium text-green-600">
                        ₹{bill.paidAmount?.toLocaleString() || "0"}
                      </td>
                      <td className="px-4 py-3 text-xs text-right font-bold text-red-600">
                        ₹{bill.remainingAmount?.toLocaleString() || "0"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge 
                          variant={
                            bill.status === "PAID_CASH" || bill.status === "PAID_ONLINE" ? "success" : 
                            bill.status === "PARTIAL" ? "warning" : "error"
                          } 
                          size="sm"
                          className="text-[9px] px-1.5"
                        >
                          {bill.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-end">
                          {bill.remainingAmount > 0 && (
                            <button
                              onClick={() => handleVerifyClick(bill)}
                              className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider shadow-sm transition-all active:scale-95"
                            >
                              Verify
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(bill)}
                            className="p-1.5 text-blue-400 hover:bg-blue-50 rounded transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button
                            onClick={() => handleDelete(bill.id)}
                            className="p-1.5 text-red-300 hover:bg-red-50 hover:text-red-500 rounded transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
        {/* Payment Verification Modal */}
        {showVerifyModal && selectedBill && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <Card className="w-full max-w-sm p-6 shadow-2xl animate-in zoom-in duration-200">
              <h3 className="text-lg font-bold text-gray-900 mb-1 tracking-tight">Record Payment</h3>
              <p className="text-xs text-gray-400 font-medium mb-6">
                Recording for {selectedBill.booking?.customerName}
              </p>
              
              <div className="space-y-4">
                <div className="p-3 bg-red-50/50 rounded-lg border border-red-100 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Due Amount</span>
                  <span className="text-base font-black text-red-600">₹{selectedBill.remainingAmount.toLocaleString()}</span>
                </div>
                
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Payment Amount (₹)</label>
                  <input
                    type="number"
                    value={verifyAmount}
                    onChange={(e) => setVerifyAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 font-bold text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Method</label>
                  <select
                    value={verifyMethod}
                    onChange={(e) => setVerifyMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 font-bold text-xs"
                  >
                    <option value="CASH">Cash</option>
                    <option value="ONLINE">Online (UPI/Bank)</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleVerifySubmit}
                  size="sm"
                  disabled={loading || !verifyAmount}
                  className="flex-1 font-bold"
                >
                  {loading ? "Processing..." : "Verify Payment"}
                </Button>
                <Button
                  onClick={() => setShowVerifyModal(false)}
                  variant="outline"
                  size="sm"
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
