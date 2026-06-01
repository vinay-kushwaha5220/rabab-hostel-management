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

  const isMaint = !room.isAvailable
  const isFull = room.currentOccupancy >= room.capacity
  const isOccupied = room.currentOccupancy > 0

  let statusLabel = 'Available'
  let badgeVariant = 'success'

  if (isMaint) {
    statusLabel = 'Maintenance'
    badgeVariant = 'danger'
  } else if (isFull) {
    statusLabel = 'Full'
    badgeVariant = 'danger'
  } else if (isOccupied) {
    statusLabel = 'Booked'
    badgeVariant = 'info'
  }

  const showStayingBadge = (statusLabel === 'Booked' || statusLabel === 'Full') && !!room.currentRenterName

  const canBook = room.isAvailable && !isFull && !isOccupied

  return (
    <Card
      onClick={() => navigate(`/rooms/${room.id}`)}
      className="group relative overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg bg-white rounded-xl flex flex-col h-full cursor-pointer transition-all duration-300"
    >
      {/* Room Image Section - Compact on Mobile */}
      <div className="relative h-[120px] sm:h-[180px] overflow-hidden flex-shrink-0">
        <ImageSlider images={room.images} alt={room.title} />

        {/* Quick Badges */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 flex flex-col gap-1">
          <div className="px-1.5 py-0.5 bg-black/60 backdrop-blur-md rounded text-[8px] sm:text-[9px] font-black text-white uppercase tracking-wider shadow-sm">
            #{room.roomNumber}
          </div>
          <Badge variant={(room.roomType === 'AC' ? 'info' : 'secondary') as 'info' | 'secondary'} size="sm" className="border-none shadow-md text-[8px] sm:text-[10px] px-1.5 py-0">
            {room.roomType === 'AC' ? 'AC' : 'Non AC'}
          </Badge>
        </div>

        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10">
          <Badge variant={badgeVariant as any} size="sm" className="shadow-md text-[8px] sm:text-[10px] px-1.5 py-0">
            {statusLabel}
          </Badge>
        </div>

      </div>

      {/* Room Content - Compact Padding on Mobile */}
      <div className="p-3 sm:p-4 flex flex-col flex-grow">
        <div className="mb-1.5 sm:mb-2">
          <h3 className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors tracking-tight line-clamp-1">
            {room.title}
          </h3>
          <p className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
            {room.capacity} Guests • {room.floor === 0 ? "Ground Floor" : `Floor ${room.floor}`}
          </p>
        </div>

        {/* Pricing Info Row - Moved down from the image overlay */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          <div className="px-2 py-0.5 bg-slate-100 rounded text-[9px] sm:text-[10px] font-medium text-slate-700 inline-flex items-baseline gap-1">
            <span className="text-[7px] sm:text-[8px] font-bold text-slate-400 uppercase">Day:</span>
            <span className="font-extrabold text-slate-800">₹{(room.dailyPrice || room.price).toLocaleString()}</span>
          </div>
          <div className="px-2 py-0.5 bg-blue-50 border border-blue-100/60 rounded text-[9px] sm:text-[10px] font-medium text-blue-700 inline-flex items-baseline gap-1">
            <span className="text-[7px] sm:text-[8px] font-bold text-blue-400 uppercase">Month:</span>
            <span className="font-black text-blue-800">₹{(room.monthlyPrice || room.price).toLocaleString()}</span>
          </div>
        </div>

        {/* Live Renter Status Badge - Prominent on AC / Booked Rooms */}
        {showStayingBadge && (
          <div className="mb-2 px-2 py-1 bg-amber-50/70 border border-amber-200/40 rounded-lg inline-flex items-center gap-1.5 text-[8px] sm:text-[9px] font-semibold text-amber-800 self-start animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>Staying: <strong className="font-extrabold text-amber-900">{room.currentRenterName}</strong></span>
          </div>
        )}

        {/* Simplified Amenities */}
        <div className="flex flex-wrap gap-1 mb-3 sm:mb-4">
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
            return amenitiesArray.slice(0, 3).map((amenity, idx) => (
              <span key={idx} className="text-[7px] sm:text-[8px] font-bold uppercase tracking-wider bg-gray-50 px-1.5 py-0.5 rounded text-gray-500 border border-gray-100">
                {amenity}
              </span>
            ))
          })()}
        </div>

        {/* Actions */}
        <div className="flex gap-1.5 sm:gap-2 mt-auto pt-1 sm:pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-[8px] sm:text-[9px] py-1 sm:py-1.5 uppercase tracking-wider font-bold"
            onClick={handleViewDetails}
          >
            Details
          </Button>
          {canBook && (
            <Button
              size="sm"
              className="flex-1 text-[8px] sm:text-[9px] py-1 sm:py-1.5 uppercase tracking-wider font-bold animate-in fade-in zoom-in-95 duration-200"
              onClick={handleBookNow}
            >
              Book
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

export default RoomCard
