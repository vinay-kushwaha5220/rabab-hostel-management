import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../services/apiV2"
import type { RoomType } from "../../types/room"
import Card from "../../components/ui/Card"
import Badge from "../../components/ui/Badge"
import Button from "../../components/ui/Button"
import LoadingSpinner from "../../components/ui/LoadingSpinner"
import EmptyState from "../../components/ui/EmptyState"

const ManageRooms = () => {
  const navigate = useNavigate()
  const [rooms, setRooms] = useState<RoomType[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")

  useEffect(() => {
    fetchRooms()
  }, [])

  const fetchRooms = async () => {
    try {
      setLoading(true)
      const response = await api.get("/rooms")
      setRooms(response.data)
    } catch (error) {
      console.error('Error fetching rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRoom = async (roomId: number) => {
    if (!confirm('Are you sure you want to delete this room?')) {
      return
    }

    try {
      await api.delete(`/rooms/${roomId}`)
      alert('Room deleted successfully')
      fetchRooms()
    } catch (error: any) {
      console.error('Error deleting room:', error)
      alert(error.response?.data?.message || 'Failed to delete room')
    }
  }

  const handleToggleAvailability = async (roomId: number, currentStatus: boolean) => {
    try {
      await api.put(`/rooms/${roomId}`, {
        isAvailable: !currentStatus
      })
      alert(`Room ${!currentStatus ? 'marked as available' : 'marked as unavailable'}`)
      fetchRooms()
    } catch (error: any) {
      console.error('Error updating room:', error)
      alert(error.response?.data?.message || 'Failed to update room')
    }
  }

  const filteredRooms = rooms.filter(room => {
    if (filter === "all") return true
    if (filter === "available") return room.isAvailable
    if (filter === "booked") return !room.isAvailable
    if (filter === "ac") return room.roomType === "AC"
    if (filter === "non-ac") return room.roomType === "Non-AC"
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Loading rooms..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button variant="outline" onClick={() => navigate('/admin/dashboard')} className="mb-4">
            ← Back to Dashboard
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Manage Rooms</h1>
              <p className="text-gray-600">Add, edit, or delete rooms</p>
            </div>
            <Button onClick={() => alert('Add Room feature coming soon!')}>
              + Add New Room
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Rooms ({rooms.length})
            </button>
            <button
              onClick={() => setFilter("available")}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filter === "available"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Available ({rooms.filter(r => r.isAvailable).length})
            </button>
            <button
              onClick={() => setFilter("booked")}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filter === "booked"
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Booked ({rooms.filter(r => !r.isAvailable).length})
            </button>
            <button
              onClick={() => setFilter("ac")}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filter === "ac"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              AC ({rooms.filter(r => r.roomType === "AC").length})
            </button>
            <button
              onClick={() => setFilter("non-ac")}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filter === "non-ac"
                  ? "bg-gray-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Non-AC ({rooms.filter(r => r.roomType === "Non-AC").length})
            </button>
          </div>
        </Card>

        {/* Rooms Grid */}
        {filteredRooms.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            }
            title="No Rooms Found"
            message="No rooms match your filter criteria"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map((room) => (
              <Card key={room.id} className="overflow-hidden">
                {/* Room Image */}
                <div className="relative h-48">
                  <img
                    src={room.images && room.images.length > 0 ? room.images[0] : 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800'}
                    alt={room.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <Badge variant={room.isAvailable ? 'success' : 'danger'}>
                      {room.isAvailable ? 'Available' : 'Booked'}
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 left-3 flex gap-2">
                    <Badge variant={room.roomType === 'AC' ? 'info' : 'secondary'}>
                      {room.roomType}
                    </Badge>
                    <Badge variant="primary">
                      {room.bookingType}
                    </Badge>
                  </div>
                </div>

                {/* Room Details */}
                <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {room.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Room {room.roomNumber} • Floor {room.floor}
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-gray-600">
                      Capacity: {room.capacity} guests
                    </div>
                    <div className="text-xl font-bold text-blue-600">
                      ₹{room.price.toLocaleString()}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/rooms/${room.id}`)}
                      className="flex-1"
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant={room.isAvailable ? 'secondary' : 'success'}
                      onClick={() => handleToggleAvailability(room.id, room.isAvailable)}
                      className="flex-1"
                    >
                      {room.isAvailable ? 'Mark Booked' : 'Mark Available'}
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDeleteRoom(room.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ManageRooms
