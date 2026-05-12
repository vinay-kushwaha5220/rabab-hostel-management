import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContextV2"
import api from "../services/apiV2"
import type { RoomType } from "../types/room"
import LoadingSpinner from "../components/ui/LoadingSpinner"
import Button from "../components/ui/Button"
import Badge from "../components/ui/Badge"
import Card from "../components/ui/Card"

const RoomDetailsPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [room, setRoom] = useState<RoomType | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)

  useEffect(() => {
    fetchRoomDetails()
  }, [id])

  const fetchRoomDetails = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/rooms/${id}`)
      setRoom(response.data)
    } catch (error) {
      console.error('Error fetching room details:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBookNow = () => {
    if (isAuthenticated) {
      navigate(`/booking/${id}`)
    } else {
      navigate(`/login?redirect=${encodeURIComponent(`/booking/${id}`)}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Loading room details..." />
      </div>
    )
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Room Not Found</h2>
          <Button onClick={() => navigate('/rooms')}>Back to Rooms</Button>
        </div>
      </div>
    )
  }

  const images = room.images && room.images.length > 0 
    ? room.images 
    : ['https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800']

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Button 
          onClick={() => navigate('/rooms')}
          className="mb-6"
        >
          ← Back to Rooms
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <div className="relative h-96 overflow-hidden">
                <img
                  src={images[selectedImage]}
                  alt={room.title}
                  className="w-full h-full object-cover"
                />
                
                <div className="absolute top-4 right-4 flex gap-2">
                  <Badge variant={room.isAvailable ? 'success' : 'danger'}>
                    {room.isAvailable ? 'Available' : 'Booked'}
                  </Badge>
                </div>
              </div>
              
              {images.length > 1 && (
                <div className="p-4 flex gap-3 overflow-x-auto">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === index 
                          ? 'border-blue-600 scale-105' 
                          : 'border-gray-200 hover:border-blue-400'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${room.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {room.title}
                  </h1>
                  <p className="text-gray-600">
                    Room {room.roomNumber} • Floor {room.floor}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant={room.roomType === 'AC' ? 'info' : 'secondary'}>
                    {room.roomType}
                  </Badge>
                  <Badge variant="primary">
                    {room.bookingType}
                  </Badge>
                </div>
              </div>

              <p className="text-gray-700 leading-relaxed mb-6">
                {room.description}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center text-gray-700">
                  <svg className="w-6 h-6 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Capacity: {room.capacity} {room.capacity === 1 ? 'person' : 'people'}</span>
                </div>
                
                <div className="flex items-center text-gray-700">
                  <svg className="w-6 h-6 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>Floor: {room.floor}</span>
                </div>
              </div>
            </Card>

            {room.amenities && room.amenities.length > 0 && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Amenities
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {room.amenities.map((amenity, index) => (
                    <div 
                      key={index}
                      className="flex items-center text-gray-700"
                    >
                      <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-6">
              <div className="mb-6">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold text-blue-600">
                    ₹{room.price.toLocaleString()}
                  </span>
                  <span className="text-gray-600">
                    / {room.bookingType.toLowerCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {room.bookingType === 'Daily' ? 'Per day' : 'Per month'}
                </p>
              </div>

              {room.isAvailable ? (
                <>
                  <Button 
                    className="w-full mb-4"
                    onClick={handleBookNow}
                  >
                    {isAuthenticated ? "Book Now" : "Login to Book"}
                  </Button>
                  <p className="text-sm text-center text-gray-600">
                    {isAuthenticated ? "You won't be charged yet" : "Quick login to continue"}
                  </p>
                </>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <p className="text-red-800 font-semibold">
                    This room is currently unavailable
                  </p>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Quick Info
                </h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Room Number:</span>
                    <span className="font-semibold text-gray-900">{room.roomNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Floor:</span>
                    <span className="font-semibold text-gray-900">{room.floor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="font-semibold text-gray-900">{room.roomType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Booking:</span>
                    <span className="font-semibold text-gray-900">{room.bookingType}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RoomDetailsPage
