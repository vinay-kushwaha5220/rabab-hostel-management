import prisma from "./config/prisma.js";
async function main() {
    const booking = await prisma.booking.findUnique({
        where: { id: 28 },
        include: { room: true, monthlyRenter: true }
    });
    console.log("=== DEBUG BOOKING 28 ===");
    console.log(JSON.stringify(booking, null, 2));
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=debug-booking.js.map