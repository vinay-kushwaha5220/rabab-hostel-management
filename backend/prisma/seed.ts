import { PrismaClient, RoomType, BookingType } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('Seeding 26 professional rooms...')
  
  const rooms = []

  // FLOOR 2 - 10 Luxury AC Rooms
  for (let i = 1; i <= 10; i++) {
    rooms.push({
      roomNumber: `20${i < 10 ? '0' + i : i}`,
      title: 'Luxury AC Room',
      description: 'Premium AC room with TV, Locker, and high-speed WiFi. Perfect for comfort and luxury.',
      price: 1500,
      dailyPrice: 1500,
      monthlyPrice: 9000,
      roomType: RoomType.AC,
      bookingType: BookingType.DAILY,
      floor: 2,
      capacity: 2,
      amenities: JSON.stringify(['AC', 'TV', 'Locker', 'WiFi', 'Attached Bathroom', 'Premium Interior']),
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800', 
        'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800'
      ]),
      isAvailable: true,
    })
  }

  // FLOOR 2 - 10 Standard AC Rooms
  for (let i = 11; i <= 20; i++) {
    rooms.push({
      roomNumber: `2${i}`,
      title: 'Standard AC Room',
      description: 'Comfortable AC room with Locker and WiFi. Essential amenities for a pleasant stay.',
      price: 1200,
      dailyPrice: 1200,
      monthlyPrice: 8000,
      roomType: RoomType.AC,
      bookingType: BookingType.DAILY,
      floor: 2,
      capacity: 2,
      amenities: JSON.stringify(['AC', 'Locker', 'WiFi', 'Attached Bathroom']),
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800', 
        'https://images.unsplash.com/photo-1582719478250-c89cae4df85b?w=800'
      ]),
      isAvailable: true,
    })
  }

  // FLOOR 1 - 6 Non AC Rooms
  for (let i = 1; i <= 6; i++) {
    rooms.push({
      roomNumber: `10${i}`,
      title: 'Non AC Room',
      description: 'Basic fan room with WiFi. Affordable and clean.',
      price: 800,
      dailyPrice: 800,
      monthlyPrice: 6000,
      roomType: RoomType.NON_AC,
      bookingType: BookingType.DAILY,
      floor: 1,
      capacity: 2,
      amenities: JSON.stringify(['Fan', 'WiFi', 'Basic Interior']),
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800'
      ]),
      isAvailable: true,
    })
  }

  for (const room of rooms) {
    await prisma.room.upsert({
      where: { roomNumber: room.roomNumber },
      update: room,
      create: room,
    })
  }

  console.log('Successfully seeded 26 rooms across Floor 1 and Floor 2.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
