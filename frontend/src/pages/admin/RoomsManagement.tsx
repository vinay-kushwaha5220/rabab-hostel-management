import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../services/apiV2"
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
    if (filter === "non-ac") return room.roomType === "NON_AC"
    return true
  })

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 flex justify-between items-center">
          <div>
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="text-blue-600 hover:underline mb-1 text-[10px] font-bold uppercase tracking-widest"
            >
              ← Back
            </button>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Units Management</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Global inventory control</p>
          </div>
          <button
            onClick={() => alert('Add Room feature coming soon')}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-sm"
          >
            + New Unit
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-2 rounded-xl border border-gray-100 mb-4 shadow-sm">
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                filter === "all" ? "bg-slate-900 text-white" : "bg-gray-50 text-gray-400 hover:bg-gray-100"
              }`}
            >
              All ({rooms.length})
            </button>
            <button
              onClick={() => setFilter("available")}
              className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                filter === "available" ? "bg-green-600 text-white" : "bg-gray-50 text-gray-400 hover:bg-gray-100"
              }`}
            >
              Live ({rooms.filter(r => r.isAvailable).length})
            </button>
            <button
              onClick={() => setFilter("booked")}
              className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                filter === "booked" ? "bg-red-600 text-white" : "bg-gray-50 text-gray-400 hover:bg-gray-100"
              }`}
            >
              Full ({rooms.filter(r => !r.isAvailable).length})
            </button>
            <button
              onClick={() => setFilter("ac")}
              className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                filter === "ac" ? "bg-blue-600 text-white" : "bg-gray-50 text-gray-400 hover:bg-gray-100"
              }`}
            >
              AC ({rooms.filter(r => r.roomType === "AC").length})
            </button>
            <button
              onClick={() => setFilter("non-ac")}
              className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                filter === "non-ac" ? "bg-gray-600 text-white" : "bg-gray-50 text-gray-400 hover:bg-gray-100"
              }`}
            >
              Non-AC ({rooms.filter(r => r.roomType === "NON_AC").length})
            </button>
          </div>
        </div>

        {/* Rooms Table */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest"># Unit</th>
                  <th className="px-3 py-2 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Descriptor</th>
                  <th className="px-3 py-2 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Class</th>
                  <th className="px-3 py-2 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Base Rate</th>
                  <th className="px-3 py-2 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Live Status</th>
                  <th className="px-3 py-2 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
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
                        {room.roomType === "NON_AC" ? "Non-AC" : room.roomType}
                      </span>
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
