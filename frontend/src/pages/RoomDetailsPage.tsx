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
  const { isAuthenticated, user } = useAuth()
  const isAdmin = user?.role === "ADMIN"
  const [room, setRoom] = useState<RoomType | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)

  useEffect(() => {
    fetchRoomDetails()
    window.scrollTo(0, 0)
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
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <LoadingSpinner size="xl" text="Preparing your perfect room..." />
      </div>
    )
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl max-w-md">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Room Not Found</h2>
          <p className="text-gray-500 mb-6 font-medium">The room you are looking for might have been removed or is no longer available.</p>
          <Button onClick={() => navigate('/rooms')} className="w-full">Explore Other Rooms</Button>
        </div>
      </div>
    )
  }

  const images = room.images && room.images.length > 0 
    ? room.images 
    : ['https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800']

  const urgencyThreshold = 1
  const isUrgent = room.isAvailable && (room.capacity - room.currentOccupancy <= urgencyThreshold)
  const isOccupied = !room.isAvailable || room.currentOccupancy > 0

  return (
    <div className="min-h-screen bg-gray-50/30 pb-24 lg:pb-12">
      {/* Back Button Overlay (Desktop) */}
      <div className="hidden lg:block fixed top-24 left-8 z-10">
        <button 
          onClick={() => navigate('/rooms')}
          className="p-3 bg-white hover:bg-gray-50 rounded-full shadow-lg text-gray-700 transition-all hover:scale-110 active:scale-95"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-0 sm:px-4 lg:px-6 lg:py-6">
        {/* Breadcrumb / Back (Mobile) */}
        <div className="lg:hidden px-4 py-3 flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
          <button onClick={() => navigate('/rooms')} className="text-blue-600">Rooms</button>
          <span>/</span>
          <span>Room {room.roomNumber}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Gallery Section */}
            <div className="bg-white lg:rounded-2xl overflow-hidden shadow-md">
              <div className="relative aspect-video sm:aspect-[16/9] lg:aspect-[16/6]">
                <img
                  src={images[selectedImage]}
                  alt={room.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded-lg text-white text-[10px] font-bold">
                  {selectedImage + 1} / {images.length}
                </div>
              </div>
              
              {images.length > 1 && (
                <div className="p-3 flex gap-2 overflow-x-auto scrollbar-hide border-t border-gray-100">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === index 
                          ? 'border-blue-600 ring-2 ring-blue-50' 
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={image} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Room Info */}
            <Card className="p-4 sm:p-5 border-none shadow-sm bg-white rounded-xl">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge variant={!isOccupied ? 'success' : 'danger'} size="sm" className="text-[9px]">
                      {!isOccupied ? 'Live' : 'Booked'}
                    </Badge>
                    {isUrgent && !isOccupied && (
                      <Badge variant="warning" size="sm" className="animate-pulse text-[9px]">
                        Last few Room
                      </Badge>
                    )}
                  </div>
                  <h1 className="text-xl font-black text-gray-900 mb-0.5 tracking-tight">
                    {room.title}
                  </h1>
                  <div className="flex items-center gap-1.5 text-gray-400 font-bold uppercase tracking-widest text-[9px]">
                    <span>Room No {room.roomNumber}</span>
                    <span className="w-0.5 h-0.5 rounded-full bg-gray-200"></span>
                    <span>Level {room.floor === 0 ? "Ground" : room.floor}</span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Unit Profile</h3>
                <p className="text-xs text-gray-500 leading-relaxed font-medium">
                  {room.description}
                </p>
              </div>

              {/* Specific Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-gray-50">
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Capacity</p>
                  <p className="text-sm font-black text-gray-900">{room.capacity} Head</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Occupancy</p>
                  <p className="text-sm font-black text-blue-600">{room.currentOccupancy}/{room.capacity}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Booking</p>
                  <p className="text-sm font-black text-gray-900">Flex</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Floor</p>
                  <p className="text-sm font-black text-gray-900">{room.floor === 0 ? 'Ground' : room.floor === 1 ? '1st' : room.floor === 2 ? '2nd' : room.floor === 3 ? '3rd' : room.floor === 4 ? '4th' : `${room.floor}th`}</p>
                </div>
              </div>

              {/* Amenities Section */}
              <div className="mt-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Essentials</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-4">
                  {(() => {
                    let amenitiesArray: string[] = []
                    const rawAmenities = room.amenities as any
                    if (Array.isArray(rawAmenities)) {
                      amenitiesArray = rawAmenities
                    } else if (typeof rawAmenities === 'string' && rawAmenities) {
                      try {
                        const parsed = JSON.parse(rawAmenities)
                        if (Array.isArray(parsed)) {
                          amenitiesArray = parsed
                        } else {
                          amenitiesArray = rawAmenities.split(',').map((s: string) => s.trim()).filter(Boolean)
                        }
                      } catch {
                        amenitiesArray = rawAmenities.split(',').map((s: string) => s.trim()).filter(Boolean)
                      }
                    }
                    return amenitiesArray.map((amenity, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-slate-50 text-blue-600 flex items-center justify-center">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <span className="font-bold text-[10px] text-gray-500 uppercase tracking-wider">{amenity}</span>
                      </div>
                    ))
                  })()}
                </div>
              </div>
            </Card>
          </div>

          {/* Booking Sidebar (Desktop) */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              <Card className="p-4 border-none shadow-md bg-white rounded-xl relative border border-gray-100">
                <div className="relative">
                  <div className="space-y-2 mb-4 pb-4 border-b border-gray-50">
                    <div>
                      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Monthly Rent</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-blue-600">₹{(room.monthlyPrice || room.price).toLocaleString()}</span>
                        <span className="text-gray-400 font-bold uppercase text-[8px]">/ mo</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Daily Rent</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold text-gray-900">₹{(room.dailyPrice || room.price).toLocaleString()}</span>
                        <span className="text-gray-400 font-bold uppercase text-[8px]">/ day</span>
                      </div>
                    </div>
                  </div>

                  {isUrgent && !isOccupied && (
                    <div className="mb-4 p-2 bg-orange-50 rounded-lg border border-orange-100 flex items-center gap-2">
                      <div className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center shrink-0">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      </div>
                      <p className="text-[10px] font-bold text-orange-800">Only {room.capacity - room.currentOccupancy} units left</p>
                    </div>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="p-2 bg-slate-50 rounded-lg flex justify-between items-center">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Check-in</p>
                      <p className="text-[10px] font-bold text-gray-700">12:00 PM onwards</p>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg flex justify-between items-center">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Deposit</p>
                      <p className="text-[10px] font-bold text-gray-700">1 Mo Rent (M)</p>
                    </div>
                  </div>

                  {!isOccupied && (
                    <Button 
                      className="w-full py-2.5 text-xs font-black uppercase tracking-widest rounded-lg shadow-sm animate-in fade-in zoom-in-95 duration-200"
                      onClick={handleBookNow}
                      disabled={isAdmin}
                    >
                      {isAdmin 
                        ? "Admin Accounts Cannot Book" 
                        : (isAuthenticated ? "Book Room" : "Log in to Book Room")
                      }
                    </Button>
                  )}
                </div>
              </Card>

              <p className="text-[10px] text-center text-gray-400 font-bold mt-4 uppercase tracking-tighter">
                Best choice for professional stays
              </p>

              {/* Help Card */}
              <Card className="p-6 border-none shadow-xl bg-gradient-to-br from-gray-900 to-blue-900 rounded-3xl text-white">
                <h4 className="font-black mb-2">Need help?</h4>
                <p className="text-sm text-white/70 mb-4 font-medium">Have questions about this room or the facilities?</p>
                <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-all flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  Contact Support
                </button>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Mobile Footer CTA */}
      {!isOccupied && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t p-4 flex items-center justify-between shadow-[0_-8px_30px_rgb(0,0,0,0.08)]">
          <div className="flex flex-col">
            <p className="text-xl font-black text-blue-700">₹{(room.monthlyPrice || room.price).toLocaleString()}<span className="text-[10px] text-gray-400 ml-1">/mo</span></p>
            <p className="text-xs font-bold text-gray-400">₹{(room.dailyPrice || room.price).toLocaleString()}/day</p>
          </div>
          <Button 
            className="px-8 font-black uppercase tracking-widest shadow-lg shadow-blue-100 rounded-xl"
            onClick={handleBookNow}
            disabled={isAdmin}
          >
            {isAdmin ? "Admin Restricted" : "Book Room"}
          </Button>
        </div>
      )}
    </div>
  )
}

export default RoomDetailsPage
