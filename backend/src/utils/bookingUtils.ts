import prisma from "../config/prisma.js"
import { BookingStatus, StayStatus, MonthlyRenterStatus } from "@prisma/client"

/**
 * Utility function to synchronize room occupancies and auto-checkout overdue stays.
 * This runs before checking availability on booking creation, and whenever rooms/bookings are queried or modified.
 */
export const syncRoomOccupancies = async () => {
  try {
    const now = new Date()

    // 1. Auto-checkout overdue DAILY bookings
    const overdueBookings = await prisma.booking.findMany({
      where: {
        status: BookingStatus.CONFIRMED,
        bookingType: "DAILY",
        stayStatus: { in: [StayStatus.BOOKED, StayStatus.CHECKED_IN, StayStatus.STAYING] },
        checkOutDate: { lt: now },
        isDeleted: false
      }
    })

    if (overdueBookings.length > 0) {
      console.log(`🧹 syncRoomOccupancies: Found ${overdueBookings.length} overdue DAILY stays to auto-checkout.`)
      for (const b of overdueBookings) {
        await prisma.booking.update({
          where: { id: b.id },
          data: {
            status: BookingStatus.COMPLETED,
            stayStatus: StayStatus.CHECKED_OUT
          }
        })
      }
    }

    // 2. Sync MonthlyRenter statuses whose associated bookings are completed/cancelled
    const activeRentersWithInactiveBookings = await prisma.monthlyRenter.findMany({
      where: {
        status: { not: MonthlyRenterStatus.CHECKED_OUT },
        booking: {
          status: { in: [BookingStatus.COMPLETED, BookingStatus.CANCELLED] }
        }
      }
    })

    if (activeRentersWithInactiveBookings.length > 0) {
      console.log(`🧹 syncRoomOccupancies: Found ${activeRentersWithInactiveBookings.length} monthly renters with inactive bookings to check out.`)
      for (const mr of activeRentersWithInactiveBookings) {
        await prisma.monthlyRenter.update({
          where: { id: mr.id },
          data: {
            status: MonthlyRenterStatus.CHECKED_OUT,
            stayStatus: StayStatus.CHECKED_OUT
          }
        })
      }
    }

    // 3. Re-calculate and update currentOccupancy for all active rooms
    const rooms = await prisma.room.findMany({
      where: { isDeleted: false },
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

    for (const room of rooms) {
      const actualOccupancy = room.bookings.length
      if (room.currentOccupancy !== actualOccupancy) {
        await prisma.room.update({
          where: { id: room.id },
          data: {
            currentOccupancy: actualOccupancy
          }
        })
        console.log(`🔄 syncRoomOccupancies: Updated Room #${room.roomNumber} occupancy to ${actualOccupancy}`)
      }
    }
  } catch (error) {
    console.error("❌ Error in syncRoomOccupancies helper:", error)
  }
}
