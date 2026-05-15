import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    // Check User table
    const users = await prisma.$queryRaw`SELECT id, role FROM User`
    console.log('Current Users in DB:', users)

    // Fix UserRole casing
    await prisma.$executeRaw`UPDATE User SET role = 'USER' WHERE role = 'user'`
    await prisma.$executeRaw`UPDATE User SET role = 'ADMIN' WHERE role = 'admin'`
    console.log('✅ User roles updated to uppercase')

    // Fix other enums if necessary (e.g. BookingStatus, RoomType, etc.)
    // For RoomType: AC, NON_AC
    await prisma.$executeRaw`UPDATE Room SET roomType = 'AC' WHERE roomType = 'ac'`
    await prisma.$executeRaw`UPDATE Room SET roomType = 'NON_AC' WHERE roomType = 'non-ac' OR roomType = 'Non-AC' OR roomType = 'non_ac'`
    console.log('✅ Room types updated')

    // For BookingType: DAILY, MONTHLY
    await prisma.$executeRaw`UPDATE Room SET bookingType = 'DAILY' WHERE bookingType = 'daily' OR bookingType = 'Daily'`
    await prisma.$executeRaw`UPDATE Room SET bookingType = 'MONTHLY' WHERE bookingType = 'monthly' OR bookingType = 'Monthly'`
    console.log('✅ Room booking types updated')
    
    // For Booking status
    await prisma.$executeRaw`UPDATE Booking SET status = 'PENDING' WHERE status = 'pending'`
    await prisma.$executeRaw`UPDATE Booking SET status = 'CONFIRMED' WHERE status = 'confirmed'`
    await prisma.$executeRaw`UPDATE Booking SET status = 'CANCELLED' WHERE status = 'cancelled'`
    await prisma.$executeRaw`UPDATE Booking SET status = 'COMPLETED' WHERE status = 'completed'`
    console.log('✅ Booking statuses updated')

    // For Payment status
    await prisma.$executeRaw`UPDATE Payment SET paymentStatus = 'PENDING' WHERE paymentStatus = 'pending'`
    await prisma.$executeRaw`UPDATE Payment SET paymentStatus = 'SUCCESS' WHERE paymentStatus = 'success' OR paymentStatus = 'paid'`
    await prisma.$executeRaw`UPDATE Payment SET paymentStatus = 'FAILED' WHERE paymentStatus = 'failed'`
    console.log('✅ Payment statuses updated')

  } catch (error: any) {
    console.error('❌ Data fix failed:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
