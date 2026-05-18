const { PrismaClient } = require('@prisma/client')

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
  
  const all = await prisma.room.findMany()
  const bookable = all.filter(r => r.isAvailable && r.currentOccupancy < r.capacity)
  
  console.log(`Total Rooms now: ${all.length}`)
  console.log(`Available Rooms now: ${bookable.length}`)
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
