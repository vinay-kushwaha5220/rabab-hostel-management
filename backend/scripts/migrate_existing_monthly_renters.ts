import prisma from "../src/config/prisma.js";
import { MonthlyRenterStatus } from "@prisma/client";

async function main() {
  console.log("🚀 STARTING: Database Migration for Existing Monthly Renters...");

  const renters = await prisma.monthlyRenter.findMany({
    include: {
      booking: true,
    },
  });

  console.log(`Found ${renters.length} MonthlyRenter records to update.`);

  for (const r of renters) {
    console.log(`Processing MonthlyRenter ID: ${r.id} for user ID: ${r.userId} (Room ${r.roomId})`);
    
    // Default cycle dates from booking or joinDate
    const currentCycleStart = r.currentCycleStart || r.joinDate;
    const currentCycleEnd = r.currentCycleEnd || r.nextDueDate;
    const dueDate = r.dueDate || r.nextDueDate;
    
    const updateData: any = {
      currentCycleStart,
      currentCycleEnd,
      dueDate,
      paidAmount: r.paidAmount || r.rentAmount,
      pendingAmount: r.pendingAmount || 0,
      overdueDays: r.overdueDays || 0,
      paymentStatus: r.paymentStatus || "SUCCESS",
    };

    // If status is ACTIVE and stayStatus is BOOKED/CHECKED_IN, keep it ACTIVE
    if (r.status === "ACTIVE" as any) {
      updateData.status = MonthlyRenterStatus.ACTIVE;
    }

    await prisma.monthlyRenter.update({
      where: { id: r.id },
      data: updateData,
    });

    console.log(`✅ Updated MonthlyRenter ID: ${r.id}`);
  }

  console.log("🎉 SUCCESS: Database migration completed successfully!");
}

main()
  .catch((err) => {
    console.error("❌ ERROR running migration:", err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
