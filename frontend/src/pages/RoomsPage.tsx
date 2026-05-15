import { useEffect, useState, useMemo } from "react"
import api from "../services/apiV2"
import type { RoomType } from "../types/room"
import RoomCard from "../components/rooms/RoomCard"
import FilterBar from "../components/rooms/FilterBar"
import FilterSidebar from "../components/rooms/FilterSidebar"
import LoadingSpinner from "../components/ui/LoadingSpinner"
import EmptyState from "../components/ui/EmptyState"

const RoomsPage = () => {
  const [rooms, setRooms] = useState<RoomType[]>([])
  const [loading, setLoading] = useState(true)
  const [isFiltersOpen, setIsFiltersOpen] = useState(true)
  
  const [filters, setFilters] = useState({
    roomType: "",
    bookingType: "",
  })
  const [sortBy, setSortBy] = useState("newest")

  useEffect(() => {
    fetchRooms()
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsFiltersOpen(false)
      } else {
        setIsFiltersOpen(true)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
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

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const resetFilters = () => {
    setFilters({
      roomType: "",
      bookingType: "",
    })
  }

  const filteredRooms = useMemo(() => {
    let result = [...rooms]

    if (filters.roomType) {
      result = result.filter(r => r.roomType === filters.roomType)
    }
    if (filters.bookingType) {
      if (filters.bookingType === 'MONTHLY') {
        result = result.filter(r => r.bookingType === 'MONTHLY' || r.monthlyPrice > 0)
      } else if (filters.bookingType === 'DAILY') {
        result = result.filter(r => r.bookingType === 'DAILY' || r.dailyPrice > 0)
      }
    }

    switch (sortBy) {
      case 'price_low':
        result.sort((a, b) => (a.monthlyPrice || a.price) - (b.monthlyPrice || b.price))
        break
      case 'price_high':
        result.sort((a, b) => (b.monthlyPrice || b.price) - (a.monthlyPrice || a.price))
        break
      case 'luxury_first':
        result.sort((a, b) => {
          const aLux = a.title.toLowerCase().includes('luxury') ? 1 : 0
          const bLux = b.title.toLowerCase().includes('luxury') ? 1 : 0
          return bLux - aLux
        })
        break
      case 'available_first':
        result.sort((a, b) => {
          const aAvail = a.currentOccupancy < a.capacity ? 1 : 0
          const bAvail = b.currentOccupancy < b.capacity ? 1 : 0
          return bAvail - aAvail
        })
        break
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }

    return result
  }, [rooms, filters, sortBy])

  const availableRoomsCount = useMemo(() => {
    return filteredRooms.filter(r => r.isAvailable && r.currentOccupancy < r.capacity).length
  }, [filteredRooms])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <LoadingSpinner size="xl" text="Loading rooms..." />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white">
      {/* Top Bar - Clean & Minimal */}
      <FilterBar 
        onSortChange={setSortBy}
        resultsCount={availableRoomsCount}
        onToggleFilters={() => setIsFiltersOpen(!isFiltersOpen)}
        isFiltersOpen={isFiltersOpen}
        sortBy={sortBy}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar - Fixed 250px */}
        <div className={`hidden lg:block transition-all duration-300 bg-white shrink-0 z-30 ${isFiltersOpen ? 'w-[250px]' : 'w-0 overflow-hidden'}`}>
          <FilterSidebar 
            filters={filters} 
            onFilterChange={handleFilterChange} 
            onReset={resetFilters} 
          />
        </div>

        {/* Mobile Filter Drawer */}
        {isFiltersOpen && (
          <FilterSidebar 
            filters={filters} 
            onFilterChange={handleFilterChange} 
            onReset={resetFilters} 
            isMobile={true}
            onClose={() => setIsFiltersOpen(false)}
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30">
          <div className="max-w-[1600px] mx-auto p-4 sm:p-5">
            {filteredRooms.length === 0 ? (
              <EmptyState
                title="No rooms found"
                message="Adjust your filters to see more options."
                actionLabel="Clear Filters"
                onAction={resetFilters}
              />
            ) : (
              <div className={`grid grid-cols-1 md:grid-cols-2 ${isFiltersOpen ? 'min-[1300px]:grid-cols-3' : 'lg:grid-cols-3 xl:grid-cols-4'} gap-4 transition-all duration-500`}>
                {filteredRooms.map((room) => (
                  <div key={room.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <RoomCard room={room} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default RoomsPage
