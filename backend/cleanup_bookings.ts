import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log("🚀 Clearing all PENDING and CONFIRMED bookings for Room 13 to allow re-testing...")

  const result = await prisma.booking.deleteMany({
    where: {
      roomId: 13,
      status: { in: ['PENDING', 'CONFIRMED'] }
    }
  })

  console.log(`✅ Deleted ${result.count} blocking bookings for Room 13.`)
}

main()
  .catch(e => {
    console.error("❌ Error during cleanup:", e)
    process.exit(1)
  })
  .finally(async () => await prisma.$disconnect())
