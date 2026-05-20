import prisma from "../src/config/prisma.js";
import bcrypt from "bcryptjs";

async function main() {
  const email = "vinay@gmail.com";
  console.log(`Resetting password for user: ${email}...`);

  const hashedPassword = await bcrypt.hash("password123", 10);

  const user = await prisma.user.update({
    where: { email },
    data: {
      password: hashedPassword,
    },
  });

  console.log(`✅ Password successfully updated for ${user.name} (${email}) to "password123"!`);
}

main()
  .catch((err) => {
    console.error("❌ Reset password failed:", err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
