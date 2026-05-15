import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../services/apiV2"
import type { ElectricityBillType } from "../../types/electricity"
import type { RoomType } from "../../types/room"

const ElectricityBills = () => {
  const navigate = useNavigate()
  const [bills, setBills] = useState<ElectricityBillType[]>([])
  const [rooms, setRooms] = useState<RoomType[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [showAddForm, setShowAddForm] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    roomId: "",
    month: "",
    units: "",
    amount: "",
    dueDate: "",
    notes: ""
  })

  useEffect(() => {
    fetchBills()
    fetchRooms()
  }, [])

  const fetchBills = async () => {
    try {
      const response = await api.get("/electricity")
      setBills(response.data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRooms = async () => {
    try {
      const response = await api.get("/rooms")
      setRooms(response.data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.roomId || !formData.month || !formData.units || !formData.amount || !formData.dueDate) {
      alert('Please fill all required fields')
      return
    }

    try {
      await api.post("/electricity", {
        roomId: Number(formData.roomId),
        month: formData.month,
        units: Number(formData.units),
        amount: Number(formData.amount),
        dueDate: formData.dueDate,
        notes: formData.notes || null
      })
      
      alert('Electricity bill added successfully')
      setShowAddForm(false)
      setFormData({
        roomId: "",
        month: "",
        units: "",
        amount: "",
        dueDate: "",
        notes: ""
      })
      fetchBills()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to add bill')
    }
  }

  const markAsPaid = async (billId: number) => {
    try {
      await api.put(`/electricity/${billId}`, { isPaid: true })
      alert('Bill marked as paid')
      fetchBills()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update')
    }
  }

  const deleteBill = async (billId: number) => {
    if (!confirm('Delete this bill?')) return
    
    try {
      await api.delete(`/electricity/${billId}`)
      alert('Bill deleted')
      fetchBills()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete')
    }
  }

  const getTotalPending = () => {
    return bills.filter(b => !b.isPaid).reduce((sum, b) => sum + b.amount, 0)
  }

  const getTotalPaid = () => {
    return bills.filter(b => b.isPaid).reduce((sum, b) => sum + b.amount, 0)
  }

  const filteredBills = bills.filter(bill => {
    if (filter === "paid") return bill.isPaid
    if (filter === "unpaid") return !bill.isPaid
    return true
  })

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="text-blue-600 hover:underline mb-2 text-sm"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Electricity Bills Management</h1>
            <p className="text-gray-600">Track monthly electricity bills for all rooms</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {showAddForm ? "Cancel" : "+ Add Bill"}
          </button>
        </div>

        {/* Add Bill Form */}
        {showAddForm && (
          <div className="bg-white p-6 rounded border border-gray-200 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Electricity Bill</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Room <span className="text-red-600">*</span>
                </label>
                <select
                  value={formData.roomId}
                  onChange={(e) => setFormData({...formData, roomId: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Room</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.id}>
                      Room {room.roomNumber} - {room.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Month (YYYY-MM) <span className="text-red-600">*</span>
                </label>
                <input
                  type="month"
                  value={formData.month}
                  onChange={(e) => setFormData({...formData, month: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Units (kWh) <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.units}
                  onChange={(e) => setFormData({...formData, units: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Amount (₹) <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Due Date <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notes
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional notes"
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-semibold"
                >
                  Add Bill
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{bills.length}</div>
            <div className="text-sm text-gray-600">Total Bills</div>
          </div>
          <div className="bg-white p-4 rounded border border-gray-200">
            <div className="text-2xl font-bold text-red-600">
              {bills.filter(b => !b.isPaid).length}
            </div>
            <div className="text-sm text-gray-600">Unpaid Bills</div>
          </div>
          <div className="bg-white p-4 rounded border border-gray-200">
            <div className="text-2xl font-bold text-red-600">
              ₹{getTotalPending().toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Pending Amount</div>
          </div>
          <div className="bg-white p-4 rounded border border-gray-200">
            <div className="text-2xl font-bold text-green-600">
              ₹{getTotalPaid().toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Paid</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded border border-gray-200 mb-6">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded text-sm font-semibold ${
                filter === "all" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All ({bills.length})
            </button>
            <button
              onClick={() => setFilter("unpaid")}
              className={`px-4 py-2 rounded text-sm font-semibold ${
                filter === "unpaid" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Unpaid ({bills.filter(b => !b.isPaid).length})
            </button>
            <button
              onClick={() => setFilter("paid")}
              className={`px-4 py-2 rounded text-sm font-semibold ${
                filter === "paid" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Paid ({bills.filter(b => b.isPaid).length})
            </button>
          </div>
        </div>

        {/* Bills Table */}
        <div className="bg-white rounded border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Room</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Month</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Units (kWh)</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Due Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Paid Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Notes</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBills.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                      No electricity bills found
                    </td>
                  </tr>
                ) : (
                  filteredBills.map((bill) => (
                    <tr key={bill.id} className={`hover:bg-gray-50 ${
                      !bill.isPaid ? "bg-red-50" : ""
                    }`}>
                      <td className="px-4 py-3 text-sm">
                        {bill.room && (
                          <>
                            <div className="font-semibold text-gray-900">Room {bill.room.roomNumber}</div>
                            <div className="text-gray-600 text-xs">{bill.room.title}</div>
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                        {bill.month}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {bill.units}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900">
                        ₹{bill.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(bill.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          bill.isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {bill.isPaid ? "PAID" : "UNPAID"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {bill.paidDate ? new Date(bill.paidDate).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {bill.notes || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          {!bill.isPaid && (
                            <button
                              onClick={() => markAsPaid(bill.id)}
                              className="text-green-600 hover:underline text-xs"
                            >
                              Mark Paid
                            </button>
                          )}
                          <button
                            onClick={() => deleteBill(bill.id)}
                            className="text-red-600 hover:underline text-xs"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 bg-white p-4 rounded border border-gray-200">
          <div className="text-sm text-gray-600">
            Showing {filteredBills.length} of {bills.length} bills
          </div>
        </div>
      </div>
    </div>
  )
}

export default ElectricityBills
