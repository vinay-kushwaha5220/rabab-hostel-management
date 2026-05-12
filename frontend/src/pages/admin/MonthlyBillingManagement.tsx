import { useEffect, useState } from "react"
import { billingService } from "../../services/billingService"
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
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    fetchBills()
  }, [statusFilter, monthFilter])

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
      })
      setEditingBill(null)
      setShowForm(false)
      await fetchBills()
    } catch (err) {
      setError("Failed to save bill")
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (bill: MonthlyBill) => {
    setEditingBill(bill)
    setFormData({
      bookingId: bill.bookingId.toString(),
      month: bill.month,
      rentAmount: bill.rentAmount.toString(),
      electricityAmount: bill.electricityAmount.toString(),
      extraCharges: bill.extraCharges.toString(),
      dueDate: bill.dueDate,
    })
    setShowForm(true)
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
    })
  }

  const filteredBills = bills.filter((bill) => {
    if (statusFilter && bill.isPaid !== (statusFilter === "paid")) return false
    if (monthFilter && bill.month !== monthFilter) return false
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Monthly Billing Management</h1>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {showForm ? "Cancel" : "Add New Bill"}
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        {showForm && (
          <Card className="mb-8 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingBill ? "Edit Bill" : "Create New Bill"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Booking ID *
                  </label>
                  <input
                    type="number"
                    value={formData.bookingId}
                    onChange={(e) => setFormData({ ...formData, bookingId: e.target.value })}
                    disabled={!!editingBill}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    placeholder="Enter booking ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Month *
                  </label>
                  <input
                    type="month"
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    disabled={!!editingBill}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rent Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.rentAmount}
                    onChange={(e) => setFormData({ ...formData, rentAmount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Electricity Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.electricityAmount}
                    onChange={(e) => setFormData({ ...formData, electricityAmount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Extra Charges (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.extraCharges}
                    onChange={(e) => setFormData({ ...formData, extraCharges: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {submitting ? "Saving..." : editingBill ? "Update Bill" : "Create Bill"}
                </Button>
                <Button
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-900"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        <Card className="mb-8 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
              <input
                type="month"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </Card>

        {loading ? (
          <div className="flex justify-center">
            <LoadingSpinner size="lg" text="Loading bills..." />
          </div>
        ) : filteredBills.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-600 text-lg">No bills found</p>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Booking ID
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Month
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Rent
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Electricity
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Extra
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredBills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{bill.bookingId}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(bill.month + "-01").toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                        })}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">₹{bill.rentAmount.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        ₹{bill.electricityAmount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">₹{bill.extraCharges.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        ₹{bill.totalAmount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(bill.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Badge variant={bill.isPaid ? "success" : "warning"}>
                          {bill.isPaid ? "Paid" : "Pending"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        <button
                          onClick={() => handleEdit(bill)}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(bill.id)}
                          className="text-red-600 hover:text-red-900 font-medium"
                        >
                          Delete
                        </button>
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
