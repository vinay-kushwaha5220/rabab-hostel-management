import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const allRooms = await prisma.room.findMany()
  const availableRooms = allRooms.filter(r => r.isAvailable && r.currentOccupancy < r.capacity)
  
  console.log(`Total Rooms: ${allRooms.length}`)
  console.log(`Available Rooms: ${availableRooms.length}`)
  console.log('--- Room Breakdown ---')
  allRooms.forEach(r => {
    console.log(`Room ${r.roomNumber}: ${r.isAvailable ? 'Enabled' : 'Disabled'}, Occupancy: ${r.currentOccupancy}/${r.capacity}`)
  })
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
