const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'vinay@gmail.com' },
      include: {
        bookings: {
          include: {
            room: true,
            monthlyBills: true
          }
        }
      }
    });
    console.log(JSON.stringify(user, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
