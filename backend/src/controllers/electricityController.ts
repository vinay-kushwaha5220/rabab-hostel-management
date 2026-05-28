import type { Response } from "express"
import prisma from "../config/prisma.js"
import type { AuthRequest } from "../middleware/authMiddleware.js"

// ==========================================
// GET ALL ELECTRICITY BILLS
// ==========================================
export const getAllElectricityBills = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const bills = await prisma.electricityBill.findMany({
      include: {
        room: {
          select: {
            roomNumber: true,
            title: true,
            roomType: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    res.status(200).json(bills)
  } catch (error) {
    console.error("Get electricity bills error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// ==========================================
// GET ELECTRICITY BILLS BY ROOM
// ==========================================
export const getElectricityBillsByRoom = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { roomId } = req.params

    const bills = await prisma.electricityBill.findMany({
      where: { roomId: Number(roomId) },
      include: {
        room: {
          select: {
            roomNumber: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    res.status(200).json(bills)
  } catch (error) {
    console.error("Get room electricity bills error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// ==========================================
// CREATE ELECTRICITY BILL
// ==========================================
export const createElectricityBill = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { roomId, month, units, amount, dueDate, bookingId, notes } = req.body

    if (!roomId || !month || !units || !amount || !dueDate) {
      return res.status(400).json({
        message: "Room ID, month, units, amount, and due date are required",
      })
    }

    // Check if room exists
    const room = await prisma.room.findUnique({
      where: { id: Number(roomId) },
    })

    if (!room) {
      return res.status(404).json({
        message: "Room not found",
      })
    }

    // Check if bill already exists for this room and month
    const existingBill = await prisma.electricityBill.findFirst({
      where: {
        roomId: Number(roomId),
        month,
      },
    })

    if (existingBill) {
      // Gracefully update the existing bill instead of throwing a 400 error
      const updatedBill = await prisma.electricityBill.update({
        where: { id: existingBill.id },
        data: {
          units: Number(units),
          amount: Number(amount),
          dueDate: new Date(dueDate),
          bookingId: bookingId ? Number(bookingId) : null,
          notes: notes || null,
        },
        include: {
          room: true,
        },
      })

      if (bookingId) {
        const booking = await prisma.booking.findUnique({
          where: { id: Number(bookingId) },
        })

        if (booking) {
          await prisma.notification.create({
            data: {
              bookingId: Number(bookingId),
              title: "Electricity Bill Updated",
              message: `Electricity bill of ₹${amount} for ${month} has been updated for Room ${room.roomNumber}`,
              type: "BILL",
            },
          })
        }
      }

      console.log(`✅ Electricity bill updated for Room ${room.roomNumber}`)

      return res.status(200).json({
        message: "Electricity bill updated successfully",
        bill: updatedBill,
      })
    }

    // Create electricity bill
    const bill = await prisma.electricityBill.create({
      data: {
        roomId: Number(roomId),
        month,
        units: Number(units),
        amount: Number(amount),
        dueDate: new Date(dueDate),
        bookingId: bookingId ? Number(bookingId) : null,
        notes: notes || null,
      },
      include: {
        room: true,
      },
    })

    // If room is occupied, create notification for the renter
    if (bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: Number(bookingId) },
      })

      if (booking) {
        await prisma.notification.create({
          data: {
            bookingId: Number(bookingId),
            title: "Electricity Bill Added",
            message: `Electricity bill of ₹${amount} for ${month} has been added to Room ${room.roomNumber}`,
            type: "BILL",
          },
        })
      }
    }

    console.log(`✅ Electricity bill created for Room ${room.roomNumber}`)

    res.status(201).json({
      message: "Electricity bill created successfully",
      bill,
    })
  } catch (error) {
    console.error("Create electricity bill error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// ==========================================
// UPDATE ELECTRICITY BILL
// ==========================================
export const updateElectricityBill = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id } = req.params
    const { units, amount, dueDate, isPaid, notes } = req.body

    const bill = await prisma.electricityBill.findUnique({
      where: { id: Number(id) },
    })

    if (!bill) {
      return res.status(404).json({
        message: "Bill not found",
      })
    }

    const updatedBill = await prisma.electricityBill.update({
      where: { id: Number(id) },
      data: {
        ...(units !== undefined && { units: Number(units) }),
        ...(amount !== undefined && { amount: Number(amount) }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(isPaid !== undefined && { isPaid }),
        ...(isPaid && { paidDate: new Date() }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        room: true,
      },
    })

    res.status(200).json({
      message: "Electricity bill updated successfully",
      bill: updatedBill,
    })
  } catch (error) {
    console.error("Update electricity bill error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// ==========================================
// DELETE ELECTRICITY BILL
// ==========================================
export const deleteElectricityBill = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id } = req.params

    const bill = await prisma.electricityBill.findUnique({
      where: { id: Number(id) },
    })

    if (!bill) {
      return res.status(404).json({
        message: "Bill not found",
      })
    }

    await prisma.electricityBill.delete({
      where: { id: Number(id) },
    })

    res.status(200).json({
      message: "Electricity bill deleted successfully",
    })
  } catch (error) {
    console.error("Delete electricity bill error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// ==========================================
// GET PENDING BILLS SUMMARY
// ==========================================
export const getPendingBillsSummary = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const pendingBills = await prisma.electricityBill.findMany({
      where: { isPaid: false },
      include: {
        room: {
          select: {
            roomNumber: true,
            title: true,
          },
        },
      },
    })

    const totalPending = pendingBills.reduce((sum, bill) => sum + bill.amount, 0)

    res.status(200).json({
      count: pendingBills.length,
      totalAmount: totalPending,
      bills: pendingBills,
    })
  } catch (error) {
    console.error("Get pending bills summary error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
