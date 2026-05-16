import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../services/apiV2"
import type { BookingType } from "../../types/booking"

const RentersManagement = () => {
  const navigate = useNavigate()
  const [renters, setRenters] = useState<BookingType[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetchRenters()
  }, [])

  const fetchRenters = async () => {
    try {
      // Get all confirmed bookings (active renters)
      const response = await api.get("/bookings")
      // Filter only confirmed bookings (active renters)
      const activeRenters = response.data.filter(
        (booking: BookingType) => booking.status === "CONFIRMED"
      )
      setRenters(activeRenters)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateDueAmount = (booking: BookingType) => {
    // For now, assuming full amount is paid on booking
    // In real scenario, you'd track advance and remaining separately
    return booking.paymentStatus === "SUCCESS" ? 0 : booking.totalAmount
  }

  const filteredRenters = renters.filter(renter => {
    // Filter by booking type
    if (filter === "daily" && renter.room?.bookingType !== "DAILY") return false
    if (filter === "monthly" && renter.room?.bookingType !== "MONTHLY") return false
    if (filter === "pending-payment" && renter.paymentStatus === "SUCCESS") return false
    
    // Search
    if (search) {
      const searchLower = search.toLowerCase()
      return (
        renter.customerName.toLowerCase().includes(searchLower) ||
        renter.customerPhone.includes(search) ||
        renter.customerEmail.toLowerCase().includes(searchLower) ||
        renter.room?.roomNumber.toLowerCase().includes(searchLower)
      )
    }
    
    return true
  })

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="text-blue-600 hover:underline mb-2 text-sm"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Renters / Tenants Management</h1>
          <p className="text-gray-600">Manage all active renters and their details</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{renters.length}</div>
            <div className="text-sm text-gray-600">Total Renters</div>
          </div>
          <div className="bg-white p-4 rounded border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">
              {renters.filter(r => r.room?.bookingType === "DAILY").length}
            </div>
            <div className="text-sm text-gray-600">Daily Renters</div>
          </div>
          <div className="bg-white p-4 rounded border border-gray-200">
            <div className="text-2xl font-bold text-purple-600">
              {renters.filter(r => r.room?.bookingType === "MONTHLY").length}
            </div>
            <div className="text-sm text-gray-600">Monthly Renters</div>
          </div>
          <div className="bg-white p-4 rounded border border-gray-200">
            <div className="text-2xl font-bold text-red-600">
              {renters.filter(r => r.paymentStatus !== "SUCCESS").length}
            </div>
            <div className="text-sm text-gray-600">Pending Payments</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, email, or room number..."
              className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded text-sm font-semibold ${
                filter === "all" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All ({renters.length})
            </button>
            <button
              onClick={() => setFilter("daily")}
              className={`px-4 py-2 rounded text-sm font-semibold ${
                filter === "daily" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Daily ({renters.filter(r => r.room?.bookingType === "DAILY").length})
            </button>
            <button
              onClick={() => setFilter("monthly")}
              className={`px-4 py-2 rounded text-sm font-semibold ${
                filter === "monthly" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Monthly ({renters.filter(r => r.room?.bookingType === "MONTHLY").length})
            </button>
            <button
              onClick={() => setFilter("pending-payment")}
              className={`px-4 py-2 rounded text-sm font-semibold ${
                filter === "pending-payment" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Pending Payment ({renters.filter(r => r.paymentStatus !== "SUCCESS").length})
            </button>
          </div>
        </div>

        {/* Renters Table */}
        <div className="bg-white rounded border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Renter Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Aadhaar</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Room</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Check-in</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Check-out</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Rent</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Payment</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Due</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRenters.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                      No active renters found
                    </td>
                  </tr>
                ) : (
                  filteredRenters.map((renter) => (
                    <tr key={renter.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        <div className="font-semibold text-gray-900">{renter.customerName}</div>
                        <div className="text-gray-600 text-xs">{renter.customerEmail}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {renter.customerPhone}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                        {renter.customerAadhaar || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {renter.room && (
                          <>
                            <div className="font-semibold text-gray-900">Room {renter.room.roomNumber}</div>
                            <div className="text-gray-600 text-xs">{renter.room.title}</div>
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          renter.room?.bookingType === "DAILY" 
                            ? "bg-blue-100 text-blue-800" 
                            : "bg-purple-100 text-purple-800"
                        }`}>
                          {renter.room?.bookingType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(renter.checkInDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(renter.checkOutDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                        ₹{renter.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          renter.paymentStatus === 'SUCCESS' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {renter.paymentStatus.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`font-semibold ${
                          calculateDueAmount(renter) > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          ₹{calculateDueAmount(renter).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/booking-confirmation/${renter.id}`)}
                            className="text-blue-600 hover:underline text-xs"
                          >
                            View
                          </button>
                          <button
                            onClick={() => alert('Send message feature coming soon')}
                            className="text-green-600 hover:underline text-xs"
                          >
                            Message
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
            Showing {filteredRenters.length} of {renters.length} active renters
          </div>
        </div>
      </div>
    </div>
  )
}

export default RentersManagement
