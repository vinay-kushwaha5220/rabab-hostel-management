import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const deletedCount = await prisma.room.deleteMany({
    where: {
      roomNumber: {
        in: ['2002', '2003']
      }
    }
  })
  
  console.log(`Deleted ${deletedCount.count} extra rooms.`)
  
  const totalRooms = await prisma.room.count()
  const availableRooms = await prisma.room.count({
    where: {
      isAvailable: true,
      currentOccupancy: {
        lt: prisma.room.fields.capacity // Prisma doesn't support comparing two fields in count directly easily in SQLite
      }
    }
  })
  // Let's just fetch all and count in JS for accuracy with complex logic
  const all = await prisma.room.findMany()
  const bookable = all.filter(r => r.isAvailable && r.currentOccupancy < r.capacity)
  
  console.log(`Total Rooms now: ${all.length}`)
  console.log(`Available Rooms now: ${bookable.length}`)
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
