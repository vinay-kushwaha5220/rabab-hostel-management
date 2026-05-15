import { PrismaClient, RoomType, BookingStatus, PaymentStatus } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  try {
    console.log("🔍 Testing Dashboard Stats query...")
    
    const totalRooms = await prisma.room.count()
    console.log("   - Total Rooms:", totalRooms)

    const availableRooms = await prisma.room.count({
      where: { isAvailable: true },
    })
    console.log("   - Available Rooms:", availableRooms)

    const totalEarningsData = await prisma.payment.aggregate({
      where: { paymentStatus: 'SUCCESS' },
      _sum: { amount: true },
    })
    console.log("   - Total Earnings Data:", totalEarningsData)

    const recentBookings = await prisma.booking.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        room: {
          select: {
            roomNumber: true,
            title: true,
            roomType: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })
    console.log("   - Recent Bookings count:", recentBookings.length)

    console.log("✅ Query test passed!")
  } catch (error) {
    console.error("❌ Query test FAILED:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
