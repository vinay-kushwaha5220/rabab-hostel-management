import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Starting database migration...')

  try {
    // Step 1: Migrate room images from JSON to RoomImage table
    console.log('📸 Migrating room images...')
    const rooms = await prisma.$queryRaw<any[]>`SELECT id, images FROM Room WHERE images IS NOT NULL`
    
    for (const room of rooms) {
      if (room.images) {
        try {
          const imageArray = JSON.parse(room.images)
          if (Array.isArray(imageArray)) {
            for (let i = 0; i < imageArray.length; i++) {
              await prisma.$executeRaw`
                INSERT INTO RoomImage (roomId, imageUrl, order, createdAt)
                VALUES (${room.id}, ${imageArray[i]}, ${i}, datetime('now'))
              `
            }
            console.log(`  ✓ Migrated ${imageArray.length} images for room ${room.id}`)
          }
        } catch (error) {
          console.log(`  ⚠ Could not parse images for room ${room.id}`)
        }
      }
    }

    // Step 2: Update Notification table - add userId from booking
    console.log('🔔 Updating notifications with userId...')
    await prisma.$executeRaw`
      UPDATE Notification 
      SET userId = (
        SELECT userId FROM Booking WHERE Booking.id = Notification.bookingId
      )
      WHERE userId IS NULL AND bookingId IS NOT NULL
    `

    // Step 3: Mask Aadhaar data in existing bookings
    console.log('🔒 Masking Aadhaar data...')
    const bookings = await prisma.$queryRaw<any[]>`
      SELECT id, customerAadhaar FROM Booking WHERE customerAadhaar IS NOT NULL
    `
    
    for (const booking of bookings) {
      if (booking.customerAadhaar && booking.customerAadhaar.length >= 4) {
        const masked = 'XXXX-XXXX-' + booking.customerAadhaar.slice(-4)
        await prisma.$executeRaw`
          UPDATE Booking 
          SET customerAadhaarMasked = ${masked}
          WHERE id = ${booking.id}
        `
      }
    }
    console.log(`  ✓ Masked ${bookings.length} Aadhaar records`)

    // Step 4: Convert MonthlyBill isPaid to status
    console.log('💰 Converting bill status...')
    await prisma.$executeRaw`
      UPDATE MonthlyBill 
      SET status = CASE 
        WHEN isPaid = 1 THEN 'PAID_ONLINE'
        ELSE 'PENDING'
      END
      WHERE status = 'PENDING'
    `

    console.log('✅ Database migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
