import { PrismaClient } from "@prisma/client"
import bcryptjs from "bcryptjs"

const prisma = new PrismaClient()

async function seedRenterData() {
  try {
    console.log("🌱 Seeding renter data...")

    // 1. Create a test renter user
    const hashedPassword = await bcryptjs.hash("password123", 10)
    const renter = await prisma.user.upsert({
      where: { email: "renter@test.com" },
      update: {},
      create: {
        name: "Test Renter",
        email: "renter@test.com",
        password: hashedPassword,
        phone: "9876543210",
        role: "user",
        isActive: true,
      },
    })

    console.log("✅ Renter user created:", renter.email)

    // 2. Get or create a room
    const room = await prisma.room.findFirst({
      where: { isAvailable: true },
    })

    if (!room) {
      console.log("❌ No available rooms found. Please create a room first.")
      process.exit(1)
    }

    console.log("✅ Room found:", room.roomNumber)

    // 3. Create an active booking
    const bookingId = `RBS-${Date.now()}`
    const booking = await prisma.booking.create({
      data: {
        bookingId: bookingId,
        userId: renter.id,
        roomId: room.id,
        customerName: renter.name,
        customerEmail: renter.email,
        customerPhone: renter.phone || "9876543210",
        checkInDate: new Date(new Date().setDate(new Date().getDate() - 10)), // 10 days ago
        checkOutDate: new Date(new Date().setDate(new Date().getDate() + 20)), // 20 days from now
        numberOfGuests: 1,
        totalDays: 30,
        totalAmount: 15000,
        status: "confirmed",
        paymentStatus: "pending",
      },
      include: {
        room: true,
        user: true,
      },
    })

    console.log("✅ Booking created:", booking.bookingId)

    // 4. Create a monthly bill
    const currentMonth = new Date().toLocaleString("default", { month: "long", year: "numeric" })
    try {
      const bill = await prisma.monthlyBill.create({
        data: {
          bookingId: booking.id,
          month: currentMonth,
          rentAmount: 10000,
          electricityAmount: 500,
          extraCharges: 0,
          totalAmount: 10500,
          dueDate: new Date(new Date().setDate(new Date().getDate() + 5)), // 5 days from now
          isPaid: false,
        },
      })
      console.log("✅ Monthly bill created:", bill.id)
    } catch (billError) {
      console.log("⚠️  Monthly bill creation skipped:", billError.message)
    }

    // 5. Create sample messages
    const admin = await prisma.user.findFirst({
      where: { role: "admin" },
    })

    if (admin) {
      try {
        await prisma.message.create({
          data: {
            bookingId: booking.id,
            senderId: renter.id,
            receiverId: admin.id,
            content: "Hi, I have a question about the room facilities.",
          },
        })

        await prisma.message.create({
          data: {
            bookingId: booking.id,
            senderId: admin.id,
            receiverId: renter.id,
            content: "Hello! We have WiFi, AC, and hot water available 24/7.",
          },
        })

        console.log("✅ Sample messages created")
      } catch (msgError) {
        console.log("⚠️  Message creation skipped:", msgError.message)
      }
    }

    // 6. Create sample notifications
    try {
      await prisma.notification.create({
        data: {
          bookingId: booking.id,
          title: "Welcome to Rabab Stay",
          message: "Welcome! Your booking is confirmed. Check-in is on " + new Date(booking.checkInDate).toLocaleDateString(),
          type: "booking",
        },
      })

      await prisma.notification.create({
        data: {
          bookingId: booking.id,
          title: "Monthly Bill Generated",
          message: `Your monthly bill for ${currentMonth} is ready. Total due: ₹10500`,
          type: "billing",
        },
      })

      console.log("✅ Sample notifications created")
    } catch (notifError) {
      console.log("⚠️  Notification creation skipped:", notifError.message)
    }

    console.log("\n✅ Renter data seeded successfully!")
    console.log("\n📝 Test Credentials:")
    console.log("   Email: renter@test.com")
    console.log("   Password: password123")
    console.log("\n🔗 Access the dashboard at: http://localhost:5174/renter-monthly-dashboard")

    process.exit(0)
  } catch (error) {
    console.error("❌ Error seeding data:", error)
    process.exit(1)
  }
}

seedRenterData()
