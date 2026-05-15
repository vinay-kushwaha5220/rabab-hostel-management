export type RoomType = {
  id: number
  roomNumber: string
  title: string
  description: string
  price: number
  dailyPrice: number
  monthlyPrice: number
  roomType: "AC" | "NON_AC"
  bookingType: "DAILY" | "MONTHLY"
  floor: number
  capacity: number
  currentOccupancy: number
  isAvailable: boolean
  images: string[]
  amenities: string[]
  createdAt: string
  updatedAt: string
}
