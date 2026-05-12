export type RoomType = {
  id: number
  roomNumber: string
  title: string
  description: string
  price: number
  roomType: "AC" | "Non-AC"
  bookingType: "Daily" | "Monthly"
  floor: number
  capacity: number
  isAvailable: boolean
  images: string[]
  amenities: string[]
  createdAt: string
  updatedAt: string
}
