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
  const [showTimeline, setShowTimeline] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null)
  const [timelineData, setTimelineData] = useState<any[]>([])
  const [loadingTimeline, setLoadingTimeline] = useState(false)

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

  const fetchRoomTimeline = async (room: RoomType) => {
    try {
      setLoadingTimeline(true)
      setSelectedRoom(room)
      setShowTimeline(true)
      const response = await api.get(`/monthly-bills/admin/room-history/${room.id}`)
      setTimelineData(response.data)
    } catch (error) {
      console.error('Error fetching room timeline:', error)
    } finally {
      setLoadingTimeline(false)
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
                      onClick={() => fetchRoomTimeline(room)}
                      className="flex-1"
                    >
                      Timeline
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/rooms/${room.id}`)}
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
        {/* Room Timeline Modal */}
        {showTimeline && selectedRoom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
            <Card className="w-full max-w-2xl p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-black text-gray-900">Room {selectedRoom.roomNumber} History</h3>
                  <p className="text-gray-500 font-medium">Complete billing and payment timeline</p>
                </div>
                <button onClick={() => setShowTimeline(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l18 18" /></svg>
                </button>
              </div>

              {loadingTimeline ? (
                <div className="py-12 flex justify-center"><LoadingSpinner text="Fetching timeline..." /></div>
              ) : timelineData.length === 0 ? (
                <div className="py-12 text-center text-gray-500 font-medium">No billing history found for this room.</div>
              ) : (
                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                  {timelineData.map((bill, index) => (
                    <div key={bill.id} className="relative pl-8 pb-6 border-l-2 border-gray-100 last:border-0 last:pb-0">
                      <div className={`absolute left-[-9px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm ${bill.isPaid ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="text-lg font-black text-gray-900">{bill.month}</p>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                              Renter: {bill.booking?.customerName || 'N/A'}
                            </p>
                          </div>
                          <Badge variant={bill.status === "PAID_CASH" || bill.status === "PAID_ONLINE" ? "success" : bill.status === "PARTIAL" ? "warning" : "error"}>
                            {bill.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div><p className="text-[10px] text-gray-400 font-bold uppercase">Total Due</p><p className="font-bold text-gray-900">₹{bill.totalDue.toLocaleString()}</p></div>
                          <div><p className="text-[10px] text-gray-400 font-bold uppercase">Paid</p><p className="font-bold text-green-600">₹{bill.paidAmount.toLocaleString()}</p></div>
                          <div><p className="text-[10px] text-gray-400 font-bold uppercase">Remaining</p><p className="font-bold text-red-600">₹{bill.remainingAmount.toLocaleString()}</p></div>
                          <div><p className="text-[10px] text-gray-400 font-bold uppercase">Due Date</p><p className="font-bold text-gray-700">{new Date(bill.dueDate).toLocaleDateString()}</p></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-8 flex justify-end">
                <Button onClick={() => setShowTimeline(false)} className="px-8 font-bold">Close</Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default ManageRooms
