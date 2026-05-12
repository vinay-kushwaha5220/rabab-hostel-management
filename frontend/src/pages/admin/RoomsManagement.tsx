import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../services/api"
import type { RoomType } from "../../types/room"

const RoomsManagement = () => {
  const navigate = useNavigate()
  const [rooms, setRooms] = useState<RoomType[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    fetchRooms()
  }, [])

  const fetchRooms = async () => {
    try {
      const response = await api.get("/rooms")
      setRooms(response.data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleAvailability = async (roomId: number, currentStatus: boolean) => {
    try {
      await api.put(`/rooms/${roomId}`, { isAvailable: !currentStatus })
      alert('Room status updated')
      fetchRooms()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update')
    }
  }

  const deleteRoom = async (roomId: number) => {
    if (!confirm('Delete this room?')) return
    try {
      await api.delete(`/rooms/${roomId}`)
      alert('Room deleted')
      fetchRooms()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete')
    }
  }

  const filteredRooms = rooms.filter(room => {
    if (filter === "available") return room.isAvailable
    if (filter === "booked") return !room.isAvailable
    if (filter === "ac") return room.roomType === "AC"
    if (filter === "non-ac") return room.roomType === "Non-AC"
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
            <h1 className="text-3xl font-bold text-gray-900">Rooms Management</h1>
            <p className="text-gray-600">Manage all 25 hostel rooms</p>
          </div>
          <button
            onClick={() => alert('Add Room feature coming soon')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Add Room
          </button>
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
              All ({rooms.length})
            </button>
            <button
              onClick={() => setFilter("available")}
              className={`px-4 py-2 rounded text-sm font-semibold ${
                filter === "available" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Available ({rooms.filter(r => r.isAvailable).length})
            </button>
            <button
              onClick={() => setFilter("booked")}
              className={`px-4 py-2 rounded text-sm font-semibold ${
                filter === "booked" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Booked ({rooms.filter(r => !r.isAvailable).length})
            </button>
            <button
              onClick={() => setFilter("ac")}
              className={`px-4 py-2 rounded text-sm font-semibold ${
                filter === "ac" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              AC ({rooms.filter(r => r.roomType === "AC").length})
            </button>
            <button
              onClick={() => setFilter("non-ac")}
              className={`px-4 py-2 rounded text-sm font-semibold ${
                filter === "non-ac" ? "bg-gray-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Non-AC ({rooms.filter(r => r.roomType === "Non-AC").length})
            </button>
          </div>
        </div>

        {/* Rooms Table */}
        <div className="bg-white rounded border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Room No</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Booking</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Floor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Capacity</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRooms.map((room) => (
                  <tr key={room.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-bold text-gray-900">
                      {room.roomNumber}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {room.title}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        room.roomType === "AC" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                      }`}>
                        {room.roomType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-purple-100 text-purple-800">
                        {room.bookingType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {room.floor}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {room.capacity}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      ₹{room.price.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        room.isAvailable ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {room.isAvailable ? "AVAILABLE" : "BOOKED"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/rooms/${room.id}`)}
                          className="text-blue-600 hover:underline text-xs"
                        >
                          View
                        </button>
                        <button
                          onClick={() => toggleAvailability(room.id, room.isAvailable)}
                          className="text-yellow-600 hover:underline text-xs"
                        >
                          Toggle
                        </button>
                        <button
                          onClick={() => deleteRoom(room.id)}
                          className="text-red-600 hover:underline text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 bg-white p-4 rounded border border-gray-200">
          <div className="text-sm text-gray-600">
            Showing {filteredRooms.length} of {rooms.length} rooms
          </div>
        </div>
      </div>
    </div>
  )
}

export default RoomsManagement
