import React from 'react'
import { useNavigate } from 'react-router-dom'
import type { RoomType } from '../../types/room'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import ImageSlider from '../ui/ImageSlider'

interface RoomCardProps {
  room: RoomType
}

const RoomCard: React.FC<RoomCardProps> = ({ room }) => {
  const navigate = useNavigate()
  
  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigate(`/rooms/${room.id}`)
  }
  
  const handleBookNow = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigate(`/booking/${room.id}`)
  }

  const isFull = room.currentOccupancy >= room.capacity
  const isAvailable = room.isAvailable && !isFull
  
  return (
    <Card 
      onClick={() => navigate(`/rooms/${room.id}`)}
      className="group relative overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg bg-white rounded-xl flex flex-col h-full cursor-pointer transition-all duration-300"
    >
      {/* Room Image Section */}
      <div className="relative h-[180px] overflow-hidden flex-shrink-0">
        <ImageSlider images={room.images} alt={room.title} />
        
        {/* Quick Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
          <div className="px-2 py-0.5 bg-black/60 backdrop-blur-md rounded text-[9px] font-black text-white uppercase tracking-wider shadow-sm">
            #{room.roomNumber}
          </div>
          <Badge variant={room.roomType === 'AC' ? 'info' : 'secondary'} size="sm" className="border-none shadow-md">
            {room.roomType === 'AC' ? 'AC' : 'Non AC'}
          </Badge>
        </div>

        <div className="absolute top-3 right-3 z-10">
          <Badge variant={isAvailable ? 'success' : 'danger'} size="sm" className="shadow-md">
            {isAvailable ? 'Available' : isFull ? 'Full' : 'Maintenance'}
          </Badge>
        </div>

        {/* Pricing Overlay */}
        <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-col gap-1">
          <div className="px-2 py-1 bg-white/95 backdrop-blur-md rounded-lg shadow-md inline-flex items-baseline gap-1 self-start">
            <span className="text-[8px] font-bold text-gray-500 uppercase">Day:</span>
            <span className="text-xs font-black text-gray-900">₹{(room.dailyPrice || room.price).toLocaleString()}</span>
          </div>
          <div className="px-2 py-1 bg-blue-600 rounded-lg shadow-md inline-flex items-baseline gap-1 self-start">
            <span className="text-[8px] font-bold text-white/80 uppercase">Month:</span>
            <span className="text-sm font-black text-white">₹{(room.monthlyPrice || room.price).toLocaleString()}</span>
          </div>
        </div>
      </div>
      
      {/* Room Content */}
      <div className="p-4 flex flex-col flex-grow">
        <div className="mb-2">
          <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors tracking-tight line-clamp-1">
            {room.title}
          </h3>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
            {room.capacity} Sharing • Floor {room.floor}
          </p>
        </div>
        
        {/* Simplified Amenities */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {room.amenities.slice(0, 3).map((amenity, idx) => (
            <span key={idx} className="text-[8px] font-bold uppercase tracking-wider bg-gray-50 px-1.5 py-0.5 rounded text-gray-500 border border-gray-100">
              {amenity}
            </span>
          ))}
        </div>
        
        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-2">
          <Button 
            variant="outline"
            size="sm"
            className="flex-1 text-[9px] uppercase tracking-wider"
            onClick={handleViewDetails}
          >
            Details
          </Button>
          <Button 
            size="sm"
            className="flex-1 text-[9px] uppercase tracking-wider"
            onClick={handleBookNow}
            disabled={isFull}
          >
            {isFull ? 'Full' : 'Book'}
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default RoomCard
