import { PrismaClient, BookingStatus, StayStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('=== AUDITING DATABASE FOR TEST & STALE RECORDS ===')
  
  // 1. Fetch all rooms
  const rooms = await prisma.room.findMany({
    include: {
      bookings: {
        where: {
          isDeleted: false
        },
        include: {
          user: true
        }
      },
      monthlyRenters: {
        include: {
          user: true
        }
      }
    }
  })

  console.log(`\nFound ${rooms.length} Rooms in database:`)
  for (const room of rooms) {
    console.log(`\nRoom #${room.roomNumber} - "${room.title}":`)
    console.log(`  - Capacity: ${room.capacity}, Current Occupancy: ${room.currentOccupancy}`)
    console.log(`  - Is Available: ${room.isAvailable}`)
    
    console.log(`  - Bookings (${room.bookings.length}):`)
    for (const b of room.bookings) {
      console.log(`    * Booking [${b.bookingId}] ID:${b.id}: Customer: "${b.customerName}" (User: "${b.user?.name || 'N/A'}")`)
      console.log(`      Status: ${b.status}, Payment: ${b.paymentStatus}, Stay: ${b.stayStatus}`)
      console.log(`      Dates: ${b.checkInDate.toISOString().split('T')[0]} to ${b.checkOutDate.toISOString().split('T')[0]}`)
    }

    console.log(`  - Monthly Renters (${room.monthlyRenters.length}):`)
    for (const mr of room.monthlyRenters) {
      console.log(`    * MonthlyRenter ID:${mr.id}: User: "${mr.user?.name || 'N/A'}"`)
      console.log(`      Status: ${mr.status}, Stay: ${mr.stayStatus}, Booking ID: ${mr.bookingId}`)
      console.log(`      Cycle: ${mr.currentCycleStart?.toISOString().split('T')[0] || 'N/A'} to ${mr.currentCycleEnd?.toISOString().split('T')[0] || 'N/A'}`)
      console.log(`      Due Date: ${mr.dueDate?.toISOString().split('T')[0] || 'N/A'}, Overdue: ${mr.overdueDays} days`)
      console.log(`      Financials: Rent: ₹${mr.rentAmount}, Paid: ₹${mr.paidAmount}, Pending: ₹${mr.pendingAmount}, Payment Status: ${mr.paymentStatus}`)
    }
  }

  // 2. Fetch all users
  const users = await prisma.user.findMany()
  console.log(`\nFound ${users.length} Users in database:`)
  for (const u of users) {
    console.log(`  - User ID:${u.id}: Name: "${u.name}", Email: "${u.email}", Role: ${u.role}`)
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
