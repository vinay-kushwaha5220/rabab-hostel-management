import React from 'react'
import Button from '../ui/Button'

interface RoomFiltersProps {
  filters: {
    roomType: string
    bookingType: string
    minPrice: number
    maxPrice: number
    availableOnly: boolean
  }
  onFilterChange: (filters: any) => void
  onClearFilters: () => void
}

const RoomFilters: React.FC<RoomFiltersProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
}) => {
  const handleChange = (key: string, value: any) => {
    onFilterChange({ ...filters, [key]: value })
  }
  
  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Filter Rooms</h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={onClearFilters}
        >
          Clear Filters
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Room Type Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Room Type
          </label>
          <select
            value={filters.roomType}
            onChange={(e) => handleChange('roomType', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="">All Types</option>
            <option value="AC">AC</option>
            <option value="Non-AC">Non-AC</option>
          </select>
        </div>
        
        {/* Booking Type Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Booking Type
          </label>
          <select
            value={filters.bookingType}
            onChange={(e) => handleChange('bookingType', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="">All Types</option>
            <option value="Daily">Daily</option>
            <option value="Monthly">Monthly</option>
          </select>
        </div>
        
        {/* Min Price Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Min Price (₹)
          </label>
          <input
            type="number"
            value={filters.minPrice}
            onChange={(e) => handleChange('minPrice', Number(e.target.value))}
            placeholder="0"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
        
        {/* Max Price Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Max Price (₹)
          </label>
          <input
            type="number"
            value={filters.maxPrice}
            onChange={(e) => handleChange('maxPrice', Number(e.target.value))}
            placeholder="10000"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>
      
      {/* Available Only Checkbox */}
      <div className="mt-6">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={filters.availableOnly}
            onChange={(e) => handleChange('availableOnly', e.target.checked)}
            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          />
          <span className="ml-3 text-gray-700 font-medium">
            Show available rooms only
          </span>
        </label>
      </div>
    </div>
  )
}

export default RoomFilters
