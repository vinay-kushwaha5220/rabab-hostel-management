import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log("🚀 Starting RAW SQL data normalization (Uppercase Enums)...")

  // Update User roles
  await prisma.$executeRawUnsafe(`UPDATE "User" SET role = UPPER(role)`)

  // Update Booking statuses with mappings
  await prisma.$executeRawUnsafe(`UPDATE "Booking" SET status = 'CONFIRMED' WHERE UPPER(status) = 'PAID'`)
  await prisma.$executeRawUnsafe(`UPDATE "Booking" SET status = UPPER(status)`)
  
  await prisma.$executeRawUnsafe(`UPDATE "Booking" SET paymentStatus = 'SUCCESS' WHERE UPPER(paymentStatus) = 'PAID'`)
  await prisma.$executeRawUnsafe(`UPDATE "Booking" SET paymentStatus = UPPER(paymentStatus)`)
  
  await prisma.$executeRawUnsafe(`UPDATE "Booking" SET stayStatus = UPPER(stayStatus)`)
  
  // Update Payment statuses with mappings
  await prisma.$executeRawUnsafe(`UPDATE "Payment" SET paymentStatus = 'SUCCESS' WHERE UPPER(paymentStatus) = 'PAID'`)
  await prisma.$executeRawUnsafe(`UPDATE "Payment" SET paymentStatus = UPPER(paymentStatus)`)
  
  await prisma.$executeRawUnsafe(`UPDATE "Payment" SET paymentMethod = UPPER(paymentMethod)`)
  await prisma.$executeRawUnsafe(`UPDATE "Payment" SET verificationStatus = UPPER(verificationStatus)`)
  
  // Update Room types
  await prisma.$executeRawUnsafe(`UPDATE "Room" SET roomType = UPPER(roomType)`)
  await prisma.$executeRawUnsafe(`UPDATE "Room" SET bookingType = UPPER(bookingType)`)
  
  // Update MonthlyBill statuses
  await prisma.$executeRawUnsafe(`UPDATE "MonthlyBill" SET status = UPPER(status)`)
  await prisma.$executeRawUnsafe(`UPDATE "MonthlyBill" SET verificationStatus = UPPER(verificationStatus)`)
  
  // Update Notification types
  await prisma.$executeRawUnsafe(`UPDATE "Notification" SET type = UPPER(type)`)
  await prisma.$executeRawUnsafe(`UPDATE "Notification" SET priority = UPPER(priority)`)

  // Update Message types
  await prisma.$executeRawUnsafe(`UPDATE "Message" SET messageType = UPPER(messageType)`)

  // Update MaintenanceRequest statuses
  await prisma.$executeRawUnsafe(`UPDATE "MaintenanceRequest" SET status = UPPER(status)`)

  console.log("✅ RAW SQL Data normalization complete!")
}

main()
  .catch(e => {
    console.error("❌ Error during normalization:", e)
    process.exit(1)
  })
  .finally(async () => await prisma.$disconnect())
