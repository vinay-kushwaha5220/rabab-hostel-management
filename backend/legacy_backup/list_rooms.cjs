const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function main() {
  const rooms = await prisma.room.findMany({ orderBy: { roomNumber: 'asc' } })
  rooms.forEach(r => console.log(`${r.roomNumber}: ${r.title}`))
}
main().finally(() => prisma.$disconnect())
