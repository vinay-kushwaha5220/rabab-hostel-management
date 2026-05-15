import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log("🚀 Starting data normalization (Uppercase Enums)...")

  // 1. Normalize User roles
  console.log("Normailizing User roles...")
  const users = await prisma.user.findMany()
  for (const user of users) {
    const upperRole = user.role.toString().toUpperCase() as any
    if (user.role.toString() !== upperRole) {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: upperRole }
      })
    }
  }

  // 2. Normalize Booking statuses
  console.log("Normailizing Booking statuses...")
  const bookings = await prisma.booking.findMany()
  for (const b of bookings) {
    const updates: any = {}
    if (b.status && b.status.toString() !== b.status.toString().toUpperCase()) {
      updates.status = b.status.toString().toUpperCase()
    }
    if (b.paymentStatus && b.paymentStatus.toString() !== b.paymentStatus.toString().toUpperCase()) {
      updates.paymentStatus = b.paymentStatus.toString().toUpperCase()
    }
    if (b.stayStatus && b.stayStatus.toString() !== b.stayStatus.toString().toUpperCase()) {
      updates.stayStatus = b.stayStatus.toString().toUpperCase()
    }

    if (Object.keys(updates).length > 0) {
      await prisma.booking.update({
        where: { id: b.id },
        data: updates
      })
    }
  }

  // 3. Normalize Payment statuses
  console.log("Normailizing Payment statuses...")
  const payments = await prisma.payment.findMany()
  for (const p of payments) {
    const updates: any = {}
    if (p.paymentStatus && p.paymentStatus.toString() !== p.paymentStatus.toString().toUpperCase()) {
      updates.paymentStatus = p.paymentStatus.toString().toUpperCase()
    }
    if (p.paymentMethod && p.paymentMethod.toString() !== p.paymentMethod.toString().toUpperCase()) {
      updates.paymentMethod = p.paymentMethod.toString().toUpperCase()
    }
    if (p.verificationStatus && p.verificationStatus.toString() !== p.verificationStatus.toString().toUpperCase()) {
      updates.verificationStatus = p.verificationStatus.toString().toUpperCase()
    }

    if (Object.keys(updates).length > 0) {
      await prisma.payment.update({
        where: { id: p.id },
        data: updates
      })
    }
  }

  // 4. Normalize Room types
  console.log("Normailizing Room types...")
  const rooms = await prisma.room.findMany()
  for (const r of rooms) {
    const updates: any = {}
    if (r.roomType && r.roomType.toString() !== r.roomType.toString().toUpperCase()) {
      updates.roomType = r.roomType.toString().toUpperCase()
    }
    if (r.bookingType && r.bookingType.toString() !== r.bookingType.toString().toUpperCase()) {
      updates.bookingType = r.bookingType.toString().toUpperCase()
    }

    if (Object.keys(updates).length > 0) {
      await prisma.room.update({
        where: { id: r.id },
        data: updates
      })
    }
  }

  // 5. Normalize MonthlyBill statuses
  console.log("Normailizing MonthlyBill statuses...")
  const bills = await prisma.monthlyBill.findMany()
  for (const bill of bills) {
    const updates: any = {}
    if (bill.status && bill.status.toString() !== bill.status.toString().toUpperCase()) {
      updates.status = bill.status.toString().toUpperCase()
    }
    if (bill.verificationStatus && bill.verificationStatus.toString() !== bill.verificationStatus.toString().toUpperCase()) {
      updates.verificationStatus = bill.verificationStatus.toString().toUpperCase()
    }

    if (Object.keys(updates).length > 0) {
      await prisma.monthlyBill.update({
        where: { id: bill.id },
        data: updates
      })
    }
  }

  // 6. Normalize Notification types
  console.log("Normailizing Notification types...")
  const notifications = await prisma.notification.findMany()
  for (const n of notifications) {
    const updates: any = {}
    if (n.type && n.type.toString() !== n.type.toString().toUpperCase()) {
      updates.type = n.type.toString().toUpperCase()
    }
    if (n.priority && n.priority.toString() !== n.priority.toString().toUpperCase()) {
      updates.priority = n.priority.toString().toUpperCase()
    }

    if (Object.keys(updates).length > 0) {
      await prisma.notification.update({
        where: { id: n.id },
        data: updates
      })
    }
  }

  console.log("✅ Data normalization complete!")
}

main()
  .catch(e => {
    console.error("❌ Error during normalization:", e)
    process.exit(1)
  })
  .finally(async () => await prisma.$disconnect())
