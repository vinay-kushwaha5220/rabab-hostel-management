import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const sampleRooms = [
  {
    roomNumber: "101",
    title: "Deluxe AC Room",
    description: "Beautiful AC room with modern facilities, attached bathroom, and WiFi",
    price: 1500,
    roomType: "AC",
    bookingType: "Daily",
    floor: 1,
    capacity: 2
  },
  {
    roomNumber: "102",
    title: "Standard Non-AC Room",
    description: "Comfortable non-AC room with basic amenities and shared bathroom",
    price: 800,
    roomType: "Non-AC",
    bookingType: "Daily",
    floor: 1,
    capacity: 2
  },
  {
    roomNumber: "201",
    title: "Premium AC Suite",
    description: "Spacious AC suite with balcony, premium bedding, and mini fridge",
    price: 2500,
    roomType: "AC",
    bookingType: "Monthly",
    floor: 2,
    capacity: 3
  },
  {
    roomNumber: "202",
    title: "Economy Shared Room",
    description: "Budget-friendly shared room with bunk beds and lockers",
    price: 500,
    roomType: "Non-AC",
    bookingType: "Daily",
    floor: 2,
    capacity: 4
  },
  {
    roomNumber: "301",
    title: "Executive AC Room",
    description: "Executive room with work desk, AC, and high-speed internet",
    price: 2000,
    roomType: "AC",
    bookingType: "Monthly",
    floor: 3,
    capacity: 2
  },
  {
    roomNumber: "302",
    title: "Family Room",
    description: "Large family room with multiple beds and attached kitchen",
    price: 3000,
    roomType: "AC",
    bookingType: "Monthly",
    floor: 3,
    capacity: 5
  }
];

async function seedRooms() {
  try {
    console.log('🌱 Seeding rooms...\n');

    for (const room of sampleRooms) {
      // Check if room already exists
      const existing = await prisma.room.findUnique({
        where: { roomNumber: room.roomNumber }
      });

      if (existing) {
        console.log(`⏭️  Room ${room.roomNumber} already exists, skipping...`);
        continue;
      }

      const created = await prisma.room.create({
        data: room
      });

      console.log(`✅ Created room ${created.roomNumber}: ${created.title}`);
    }

    console.log('\n🎉 Seeding completed!');
    
    // Show all rooms
    const allRooms = await prisma.room.findMany();
    console.log(`\n📊 Total rooms in database: ${allRooms.length}`);

  } catch (error) {
    console.error('❌ Error seeding rooms:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedRooms();
