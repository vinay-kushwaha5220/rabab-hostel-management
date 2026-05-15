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
  const [showForm, setShowForm] = useState(false)
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
    fetchAvailableBookings()
  }, [statusFilter, monthFilter])

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
      const data = await billingService.getAllBills(statusFilter || undefined, monthFilter || undefined)
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

  const handleVerify = async (id: number) => {
    if (!window.confirm("Verify that you have received the cash payment for this bill?")) return

    try {
      setLoading(true)
      await api.put(`/monthly-bills/${id}/verify`)
      setSuccess("Payment verified successfully!")
      fetchBills()
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Monthly Billing Management</h1>
              <p className="text-gray-600 font-light">Manage and track all monthly bills and payments</p>
            </div>
            <Button
              onClick={() => setShowForm(!showForm)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all"
            >
              <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {showForm ? "Cancel" : "Add New Bill"}
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Bills</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalBills}</p>
              </div>
              <div className="bg-blue-200 p-3 rounded-full">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Paid Bills</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{paidBills}</p>
              </div>
              <div className="bg-green-200 p-3 rounded-full">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-orange-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Pending Bills</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{pendingBills}</p>
              </div>
              <div className="bg-orange-200 p-3 rounded-full">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100 border-l-4 border-indigo-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-indigo-700 font-bold uppercase tracking-wider">Cash Verification</p>
                <p className="text-3xl font-black text-gray-900 mt-2">
                  {bills.filter(b => !b.isPaid).length}
                </p>
              </div>
              <div className="bg-indigo-200 p-3 rounded-2xl shadow-inner">
                <svg className="w-8 h-8 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">₹{totalRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-purple-200 p-3 rounded-full">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-red-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Pending Amount</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">₹{pendingAmount.toLocaleString()}</p>
              </div>
              <div className="bg-red-200 p-3 rounded-full">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 0v2m0-6v-2m0 0V7a2 2 0 012-2h2.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2h-2.586a1 1 0 01-.707-.293l-5.414-5.414a1 1 0 01-.293-.707V9z" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start gap-3">
            <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold text-red-800">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg flex items-start gap-3">
            <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold text-green-800">Success</p>
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          </div>
        )}

        {/* Form Section */}
        {showForm && (
          <Card className="mb-10 p-8 shadow-xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              {editingBill ? "Edit Monthly Bill" : "Create New Monthly Bill"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Select Renter <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={formData.bookingId}
                    onChange={(e) => setFormData({ ...formData, bookingId: e.target.value })}
                    disabled={!!editingBill}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                  >
                    <option value="">{loadingBookings ? "Loading..." : "-- Select a Monthly Renter --"}</option>
                    {!loadingBookings && availableBookings.length === 0 ? (
                      <option value="" disabled>No active monthly renters found</option>
                    ) : (
                      availableBookings.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.bookingId} - {b.customerName} (Room {b.room?.roomNumber || 'N/A'})
                        </option>
                      ))
                    )}
                  </select>
                  {loadingBookings && <p className="text-xs text-blue-600 mt-1 animate-pulse">Fetching active monthly renters...</p>}
                  {!loadingBookings && availableBookings.length === 0 && (
                    <p className="text-xs text-orange-600 mt-1">Note: Only confirmed 'Monthly' bookings will appear here.</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Month <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="month"
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    disabled={!!editingBill}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Rent Amount (₹) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.rentAmount}
                    onChange={(e) => setFormData({ ...formData, rentAmount: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Electricity Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.electricityAmount}
                    onChange={(e) => setFormData({ ...formData, electricityAmount: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Extra Charges (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.extraCharges}
                    onChange={(e) => setFormData({ ...formData, extraCharges: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Due Date <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>

                {editingBill && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                    <input
                      type="checkbox"
                      id="isPaid"
                      checked={formData.isPaid}
                      onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                      className="w-6 h-6 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="isPaid" className="text-lg font-bold text-gray-900 cursor-pointer">
                      Mark as Paid
                    </label>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <svg className="w-5 h-5 mr-2 inline animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      {editingBill ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      {editingBill ? "Update Bill" : "Create Bill"}
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold px-8 py-3 rounded-lg transition-all"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Filters Section */}
        <Card className="mb-10 p-8 shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Filters & Search</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Payment Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="">All Bills</option>
                <option value="paid">Paid Only</option>
                <option value="pending">Pending Only</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Month</label>
              <input
                type="month"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
        </Card>

        {/* Bills Table */}
        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" text="Loading bills..." />
          </div>
        ) : filteredBills.length === 0 ? (
          <Card className="p-16 text-center shadow-lg">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-600 text-lg font-medium">No bills found</p>
            <p className="text-gray-500 text-sm mt-2">Create a new bill to get started</p>
          </Card>
        ) : (
          <Card className="overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-100 to-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Renter</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Month</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">Rent</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">Electricity</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">Extra</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">Total</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Due Date</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-900">Status</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredBills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-blue-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-gray-900">
                          {bill.booking?.customerName || "Unknown"}
                        </div>
                        <div className="text-xs text-gray-600">
                          Room {bill.booking?.room?.roomNumber || "N/A"} (#{bill.booking?.bookingId || bill.bookingId})
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {new Date(bill.month + "-01").toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                        })}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">₹{bill.rentAmount.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">₹{bill.electricityAmount.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">₹{bill.extraCharges.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-right font-bold text-blue-600">₹{bill.totalAmount.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{new Date(bill.dueDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant={bill.isPaid ? "success" : "warning"} size="sm">
                          {bill.isPaid ? "✓ Paid" : "⏳ Pending"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-3 justify-end">
                          {!bill.isPaid && (
                            <button
                              onClick={() => handleVerify(bill.id)}
                              className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-all active:scale-95"
                              title="Verify Cash Payment"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                              Verify
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(bill)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Bill"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(bill.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Bill"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
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
      </div>
    </div>
  )
}

export default MonthlyBillingManagement
