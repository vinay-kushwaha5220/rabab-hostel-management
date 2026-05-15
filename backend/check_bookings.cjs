const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllBookings() {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        user: true,
        room: true,
        monthlyBills: true
      }
    });
    console.log(JSON.stringify(bookings, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllBookings();
