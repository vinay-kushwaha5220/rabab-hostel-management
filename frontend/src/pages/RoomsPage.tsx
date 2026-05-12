import { useEffect, useState } from "react"
import api from "../services/apiV2"
import type { RoomType } from "../types/room"
import RoomCard from "../components/rooms/RoomCard"
import RoomFilters from "../components/rooms/RoomFilters"
import LoadingSpinner from "../components/ui/LoadingSpinner"
import EmptyState from "../components/ui/EmptyState"

const RoomsPage = () => {
  const [rooms, setRooms] = useState<RoomType[]>([])
  const [filteredRooms, setFilteredRooms] = useState<RoomType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  
  const [filters, setFilters] = useState({
    roomType: "",
    bookingType: "",
    minPrice: 0,
    maxPrice: 10000,
    availableOnly: false,
  })

  useEffect(() => {
    fetchRooms()
  }, [])
  
  useEffect(() => {
    applyFilters()
  }, [filters, rooms])

  const fetchRooms = async () => {
    try {
      setLoading(true)
      console.log('Fetching rooms from API...')
      const response = await api.get("/rooms")
      console.log('API Response:', response.data)
      console.log('Total rooms fetched:', response.data.length)
      
      setRooms(response.data)
      setFilteredRooms(response.data)
    } catch (error) {
      console.error('Error fetching rooms:', error)
      setError("Failed to fetch rooms")
    } finally {
      setLoading(false)
    }
  }
  
  const applyFilters = () => {
    let filtered = [...rooms]
    
    // Filter by room type
    if (filters.roomType) {
      filtered = filtered.filter(room => room.roomType === filters.roomType)
    }
    
    // Filter by booking type
    if (filters.bookingType) {
      filtered = filtered.filter(room => room.bookingType === filters.bookingType)
    }
    
    // Filter by price range
    if (filters.minPrice > 0) {
      filtered = filtered.filter(room => room.price >= filters.minPrice)
    }
    if (filters.maxPrice < 10000) {
      filtered = filtered.filter(room => room.price <= filters.maxPrice)
    }
    
    // Filter by availability
    if (filters.availableOnly) {
      filtered = filtered.filter(room => room.isAvailable)
    }
    
    setFilteredRooms(filtered)
  }
  
  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
  }
  
  const handleClearFilters = () => {
    setFilters({
      roomType: "",
      bookingType: "",
      minPrice: 0,
      maxPrice: 10000,
      availableOnly: false,
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Loading rooms..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <EmptyState
          icon={
            <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title="Error Loading Rooms"
          message={error}
          actionLabel="Try Again"
          onAction={fetchRooms}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Our Rooms
          </h1>
          <p className="text-xl text-gray-600">
            Find your perfect stay at Rabab Stay
          </p>
        </div>

        {/* Filters */}
        <RoomFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />
        
        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing <span className="font-bold text-gray-900">{filteredRooms.length}</span> of <span className="font-bold text-gray-900">{rooms.length}</span> rooms
          </p>
        </div>

        {/* Rooms Grid */}
        {filteredRooms.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            }
            title="No Rooms Found"
            message="Try adjusting your filters to see more results"
            actionLabel="Clear Filters"
            onAction={handleClearFilters}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {filteredRooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default RoomsPage
