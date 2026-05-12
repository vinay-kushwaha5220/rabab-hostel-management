import type { Response } from "express"
import prisma from "../config/prisma.js"
import type { AuthRequest } from "../middleware/authMiddleware.js"

// ==========================================
// CREATE BOOKING
// ==========================================
export const createBooking = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const {
      roomId,
      customerName,
      customerEmail,
      customerPhone,
      customerAadhaar,
      checkInDate,
      checkOutDate,
      numberOfGuests,
    } = req.body

    // Validate required fields
    if (!roomId || !customerName || !customerEmail || !customerPhone || !checkInDate || !checkOutDate || !numberOfGuests) {
      return res.status(400).json({
        message: "All fields are required",
      })
    }

    // Check if room exists and is available
    const room = await prisma.room.findUnique({
      where: { id: Number(roomId) },
    })

    if (!room) {
      return res.status(404).json({
        message: "Room not found",
      })
    }

    if (!room.isAvailable) {
      return res.status(400).json({
        message: "Room is not available",
      })
    }

    // Calculate total days and amount
    const checkIn = new Date(checkInDate)
    const checkOut = new Date(checkOutDate)
    const totalDays = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))

    if (totalDays <= 0) {
      return res.status(400).json({
        message: "Invalid dates",
      })
    }

    const totalAmount = room.price * totalDays

    // Generate unique booking ID
    const bookingCount = await prisma.booking.count()
    const bookingId = `RBS-${new Date().getFullYear()}-${String(bookingCount + 1).padStart(4, '0')}`

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        bookingId,
        userId: req.userId!,
        customerName,
        customerEmail,
        customerPhone,
        customerAadhaar: customerAadhaar || null,
        roomId: Number(roomId),
        checkInDate: new Date(checkInDate),
        checkOutDate: new Date(checkOutDate),
        numberOfGuests: Number(numberOfGuests),
        totalDays,
        totalAmount,
        status: "pending",
        paymentStatus: "pending",
      },
      include: {
        room: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Create notification for admin
    await prisma.notification.create({
      data: {
        bookingId: booking.id,
        title: "New Booking",
        message: `New booking ${bookingId} for room ${room.roomNumber}`,
        type: "booking",
      },
    })

    console.log(`✅ Booking created: ${bookingId}`)

    res.status(201).json({
      message: "Booking created successfully",
      booking,
    })
  } catch (error) {
    console.error("Create booking error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// ==========================================
// PROCESS PAYMENT
// ==========================================
export const processPayment = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { bookingId, paymentMethod } = req.body

    if (!bookingId || !paymentMethod) {
      return res.status(400).json({
        message: "Booking ID and payment method are required",
      })
    }

    // Find booking
    const booking = await prisma.booking.findUnique({
      where: { id: Number(bookingId) },
      include: { room: true },
    })

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      })
    }

    // Generate transaction ID
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: booking.totalAmount,
        paymentMethod,
        transactionId,
        paymentStatus: "success", // Simulated success
      },
    })

    // Update booking status
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: "confirmed",
        paymentStatus: "paid",
      },
    })

    // Mark room as unavailable
    await prisma.room.update({
      where: { id: booking.roomId },
      data: { isAvailable: false },
    })

    // Create payment notification
    await prisma.notification.create({
      data: {
        bookingId: booking.id,
        title: "Payment Received",
        message: `Payment of ₹${booking.totalAmount} received for booking ${booking.bookingId}`,
        type: "payment",
      },
    })

    console.log(`✅ Payment processed: ${transactionId}`)

    res.status(200).json({
      message: "Payment successful",
      payment,
      booking: {
        ...booking,
        status: "confirmed",
        paymentStatus: "paid",
      },
    })
  } catch (error) {
    console.error("Process payment error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// ==========================================
// GET USER BOOKINGS
// ==========================================
export const getUserBookings = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.userId! },
      include: {
        room: true,
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    })

    res.status(200).json(bookings)
  } catch (error) {
    console.error("Get user bookings error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// ==========================================
// GET ALL BOOKINGS (ADMIN)
// ==========================================
export const getAllBookings = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        room: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    })

    res.status(200).json(bookings)
  } catch (error) {
    console.error("Get all bookings error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// ==========================================
// GET SINGLE BOOKING
// ==========================================
export const getBookingById = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id } = req.params

    const booking = await prisma.booking.findUnique({
      where: { id: Number(id) },
      include: {
        room: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        payment: true,
      },
    })

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      })
    }

    res.status(200).json(booking)
  } catch (error) {
    console.error("Get booking error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// ==========================================
// CANCEL BOOKING (ADMIN)
// ==========================================
export const cancelBooking = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id } = req.params

    const booking = await prisma.booking.findUnique({
      where: { id: Number(id) },
      include: { room: true },
    })

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      })
    }

    // Update booking status
    await prisma.booking.update({
      where: { id: Number(id) },
      data: { status: "cancelled" },
    })

    // Mark room as available again
    await prisma.room.update({
      where: { id: booking.roomId },
      data: { isAvailable: true },
    })

    // Create cancellation notification
    await prisma.notification.create({
      data: {
        bookingId: booking.id,
        title: "Booking Cancelled",
        message: `Booking ${booking.bookingId} has been cancelled`,
        type: "cancellation",
      },
    })

    console.log(`✅ Booking cancelled: ${booking.bookingId}`)

    res.status(200).json({
      message: "Booking cancelled successfully",
    })
  } catch (error) {
    console.error("Cancel booking error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
