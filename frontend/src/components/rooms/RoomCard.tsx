import React from 'react'
import { useNavigate } from 'react-router-dom'
import type { RoomType } from '../../types/room'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Button from '../ui/Button'

interface RoomCardProps {
  room: RoomType
}

const RoomCard: React.FC<RoomCardProps> = ({ room }) => {
  const navigate = useNavigate()
  
  const handleViewDetails = () => {
    navigate(`/rooms/${room.id}`)
  }
  
  const handleBookNow = () => {
    navigate(`/booking/${room.id}`)
  }
  
  return (
    <Card hover className="group flex flex-col h-full">
      {/* Room Image */}
      <div className="relative h-80 overflow-hidden flex-shrink-0">
        <img
          src={room.images && room.images.length > 0 ? room.images[0] : 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800'}
          alt={room.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        
        {/* Availability Badge */}
        <div className="absolute top-4 right-4">
          <Badge variant={room.isAvailable ? 'success' : 'danger'}>
            {room.isAvailable ? 'Available' : 'Booked'}
          </Badge>
        </div>
        
        {/* Room Type & Booking Type Badges */}
        <div className="absolute bottom-4 left-4 flex gap-2">
          <Badge variant={room.roomType === 'AC' ? 'info' : 'secondary'}>
            {room.roomType}
          </Badge>
          <Badge variant="primary">
            {room.bookingType}
          </Badge>
        </div>
      </div>
      
      {/* Room Details */}
      <div className="p-6 flex flex-col flex-grow">
        {/* Title & Room Number */}
        <div className="mb-4">
          <h3 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
            {room.title}
          </h3>
          <p className="text-base text-gray-500">Room {room.roomNumber} • Floor {room.floor}</p>
        </div>
        
        {/* Description */}
        <p className="text-gray-600 text-base mb-4 line-clamp-2 flex-grow">
          {room.description}
        </p>
        
        {/* Amenities Preview */}
        {room.amenities && room.amenities.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {room.amenities.slice(0, 3).map((amenity, index) => (
              <span 
                key={index}
                className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full"
              >
                {amenity}
              </span>
            ))}
            {room.amenities.length > 3 && (
              <span className="text-sm text-gray-500 px-3 py-1">
                +{room.amenities.length - 3} more
              </span>
            )}
          </div>
        )}
        
        {/* Capacity */}
        <div className="flex items-center text-base text-gray-600 mb-5">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Capacity: {room.capacity} {room.capacity === 1 ? 'person' : 'people'}
        </div>
        
        {/* Price & Actions */}
        <div className="flex flex-col gap-4 pt-5 border-t border-gray-200 mt-auto">
          <div>
            <p className="text-4xl font-bold text-blue-600">
              ₹{room.price.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">per {room.bookingType.toLowerCase()}</p>
          </div>
          
          <div className="flex gap-3 w-full">
            <Button 
              variant="outline" 
              size="md"
              onClick={handleViewDetails}
              className="flex-1"
            >
              View Details
            </Button>
            {room.isAvailable && (
              <Button 
                size="md"
                onClick={handleBookNow}
                className="flex-1"
              >
                Book Now
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

export default RoomCard
