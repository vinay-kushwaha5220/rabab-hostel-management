import { PrismaClient, BookingStatus, StayStatus, MonthlyRenterStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('=== RUNNING ROOM OCCUPANCY SYNC AND STALE DATA CLEANUP ===')

  // 1. Sync MonthlyRenter statuses based on their booking status
  console.log('\n--- Syncing MonthlyRenter Statuses ---')
  const monthlyRenters = await prisma.monthlyRenter.findMany({
    include: {
      booking: true,
      user: true
    }
  })

  let updatedRenters = 0
  for (const mr of monthlyRenters) {
    const isBookingInactive = 
      mr.booking.status === BookingStatus.COMPLETED ||
      mr.booking.status === BookingStatus.CANCELLED ||
      mr.booking.stayStatus === StayStatus.CHECKED_OUT

    if (isBookingInactive && mr.status === MonthlyRenterStatus.ACTIVE) {
      console.log(`⚠️ MonthlyRenter ID ${mr.id} (User: "${mr.user.name}") has status ACTIVE, but booking ${mr.booking.bookingId} is ${mr.booking.status} / stayStatus is ${mr.booking.stayStatus}.`)
      
      // Update status to CHECKED_OUT
      await prisma.monthlyRenter.update({
        where: { id: mr.id },
        data: {
          status: MonthlyRenterStatus.CHECKED_OUT,
          stayStatus: StayStatus.CHECKED_OUT
        }
      })
      console.log(`   -> Updated MonthlyRenter status to CHECKED_OUT`)
      updatedRenters++
    }
  }
  console.log(`Completed: Sync'd ${updatedRenters} MonthlyRenter records to CHECKED_OUT.`)

  // 2. Remove stale test occupant records for "Renter Test" or similar if they are no longer active
  console.log('\n--- Removing Stale Test Occupant Records ---')
  // Find bookings of users named "Renter Test" or "renter" that are no longer active
  // Let's delete completed/cancelled bookings or monthly renters for test users if requested.
  const testUsers = await prisma.user.findMany({
    where: {
      name: {
        in: ['Renter Test', 'renter', 'renter2']
      }
    }
  })

  let deletedTestBookings = 0
  let deletedTestRenters = 0

  for (const u of testUsers) {
    console.log(`Analyzing test user "${u.name}" (ID: ${u.id})...`)
    
    // Stale monthly renters
    const staleRenters = await prisma.monthlyRenter.findMany({
      where: {
        userId: u.id,
        status: MonthlyRenterStatus.CHECKED_OUT
      }
    })
    for (const sr of staleRenters) {
      console.log(`   -> Deleting stale MonthlyRenter ID ${sr.id} for test user "${u.name}"`)
      await prisma.monthlyRenter.delete({ where: { id: sr.id } })
      deletedTestRenters++
    }

    // Stale bookings
    const staleBookings = await prisma.booking.findMany({
      where: {
        userId: u.id,
        status: {
          in: [BookingStatus.COMPLETED, BookingStatus.CANCELLED]
        }
      }
    })
    for (const sb of staleBookings) {
      console.log(`   -> Deleting stale Booking [${sb.bookingId}] ID ${sb.id} for test user "${u.name}"`)
      
      // Delete any associated payments, messages, etc. first to avoid foreign key violations
      await prisma.payment.deleteMany({ where: { bookingId: sb.id } })
      await prisma.monthlyBill.deleteMany({ where: { bookingId: sb.id } })
      await prisma.message.deleteMany({ where: { bookingId: sb.id } })
      await prisma.notification.deleteMany({ where: { bookingId: sb.id } })
      
      await prisma.booking.delete({ where: { id: sb.id } })
      deletedTestBookings++
    }
  }
  console.log(`Deleted ${deletedTestRenters} stale test MonthlyRenters and ${deletedTestBookings} stale test Bookings.`)

  // 3. Audit and Sync Room Occupancies
  console.log('\n--- Syncing Room Occupancy Counts ---')
  const rooms = await prisma.room.findMany({
    include: {
      bookings: {
        where: {
          status: BookingStatus.CONFIRMED,
          stayStatus: {
            in: [StayStatus.BOOKED, StayStatus.CHECKED_IN, StayStatus.STAYING]
          },
          isDeleted: false
        }
      }
    }
  })

  let syncedRoomsCount = 0
  for (const room of rooms) {
    const actualOccupancy = room.bookings.length
    if (room.currentOccupancy !== actualOccupancy) {
      console.log(`⚠️ Room #${room.roomNumber} has mismatch! DB Occupancy: ${room.currentOccupancy}, Actual Occupancy: ${actualOccupancy}`)
      
      await prisma.room.update({
        where: { id: room.id },
        data: {
          currentOccupancy: actualOccupancy
        }
      })
      console.log(`   -> Updated Room #${room.roomNumber} occupancy to ${actualOccupancy}`)
      syncedRoomsCount++
    } else {
      console.log(`✅ Room #${room.roomNumber} occupancy is correct: ${room.currentOccupancy}`)
    }
  }
  console.log(`Synced occupancy for ${syncedRoomsCount} rooms.`)

  console.log('\n=== OCCUPANCY SYNC AND STALE DATA CLEANUP COMPLETED ===')
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
