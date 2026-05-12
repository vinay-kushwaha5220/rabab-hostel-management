import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const completeRooms = [
  // Floor 1 - AC Rooms
  {
    roomNumber: "101",
    title: "Deluxe AC Room",
    description: "Spacious AC room with modern amenities, perfect for comfortable stay. Features include attached bathroom, work desk, and high-speed WiFi.",
    price: 1500,
    roomType: "AC",
    bookingType: "Daily",
    floor: 1,
    capacity: 2,
    isAvailable: true,
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800",
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800",
    ]),
    amenities: JSON.stringify([
      "Air Conditioning",
      "WiFi",
      "Attached Bathroom",
      "TV",
      "Work Desk",
      "Wardrobe",
    ]),
  },
  {
    roomNumber: "102",
    title: "Premium AC Suite",
    description: "Luxurious AC suite with balcony view, premium bedding, and mini fridge. Ideal for long stays with extra comfort.",
    price: 2500,
    roomType: "AC",
    bookingType: "Monthly",
    floor: 1,
    capacity: 2,
    isAvailable: true,
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800",
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
    ]),
    amenities: JSON.stringify([
      "Air Conditioning",
      "WiFi",
      "Balcony",
      "Mini Fridge",
      "Premium Bedding",
      "TV",
      "Attached Bathroom",
    ]),
  },
  {
    roomNumber: "103",
    title: "Executive AC Room",
    description: "Executive room designed for business travelers with work desk, high-speed internet, and premium amenities.",
    price: 2000,
    roomType: "AC",
    bookingType: "Daily",
    floor: 1,
    capacity: 2,
    isAvailable: true,
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800",
    ]),
    amenities: JSON.stringify([
      "Air Conditioning",
      "High-Speed WiFi",
      "Work Desk",
      "TV",
      "Attached Bathroom",
      "Coffee Maker",
    ]),
  },
  
  // Floor 1 - Non-AC Rooms
  {
    roomNumber: "104",
    title: "Standard Non-AC Room",
    description: "Comfortable non-AC room with basic amenities, perfect for budget-conscious travelers.",
    price: 800,
    roomType: "Non-AC",
    bookingType: "Daily",
    floor: 1,
    capacity: 2,
    isAvailable: true,
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800",
    ]),
    amenities: JSON.stringify([
      "WiFi",
      "Shared Bathroom",
      "Fan",
      "Wardrobe",
    ]),
  },
  {
    roomNumber: "105",
    title: "Economy Room",
    description: "Budget-friendly room with essential amenities for short stays.",
    price: 600,
    roomType: "Non-AC",
    bookingType: "Daily",
    floor: 1,
    capacity: 1,
    isAvailable: true,
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800",
    ]),
    amenities: JSON.stringify([
      "WiFi",
      "Shared Bathroom",
      "Fan",
    ]),
  },

  // Floor 2 - AC Rooms
  {
    roomNumber: "201",
    title: "Family AC Suite",
    description: "Large family suite with multiple beds, attached kitchen, and spacious living area. Perfect for families.",
    price: 3500,
    roomType: "AC",
    bookingType: "Monthly",
    floor: 2,
    capacity: 5,
    isAvailable: true,
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
    ]),
    amenities: JSON.stringify([
      "Air Conditioning",
      "WiFi",
      "Kitchen",
      "Multiple Beds",
      "TV",
      "Attached Bathroom",
      "Dining Area",
    ]),
  },
  {
    roomNumber: "202",
    title: "Deluxe AC Double",
    description: "Spacious double occupancy AC room with modern furnishings and premium comfort.",
    price: 1800,
    roomType: "AC",
    bookingType: "Daily",
    floor: 2,
    capacity: 2,
    isAvailable: true,
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1631049035182-249067d7618e?w=800",
    ]),
    amenities: JSON.stringify([
      "Air Conditioning",
      "WiFi",
      "TV",
      "Attached Bathroom",
      "Wardrobe",
    ]),
  },
  {
    roomNumber: "203",
    title: "Premium AC Triple",
    description: "Triple occupancy AC room ideal for small groups or families.",
    price: 2200,
    roomType: "AC",
    bookingType: "Daily",
    floor: 2,
    capacity: 3,
    isAvailable: true,
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=800",
    ]),
    amenities: JSON.stringify([
      "Air Conditioning",
      "WiFi",
      "TV",
      "Attached Bathroom",
      "Multiple Beds",
    ]),
  },

  // Floor 2 - Non-AC Rooms
  {
    roomNumber: "204",
    title: "Shared Dormitory",
    description: "Budget-friendly shared dormitory with bunk beds, lockers, and common area. Great for backpackers.",
    price: 400,
    roomType: "Non-AC",
    bookingType: "Daily",
    floor: 2,
    capacity: 6,
    isAvailable: true,
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800",
    ]),
    amenities: JSON.stringify([
      "WiFi",
      "Shared Bathroom",
      "Lockers",
      "Fan",
      "Common Area",
    ]),
  },
  {
    roomNumber: "205",
    title: "Standard Non-AC Double",
    description: "Comfortable double room with fan and basic amenities.",
    price: 900,
    roomType: "Non-AC",
    bookingType: "Daily",
    floor: 2,
    capacity: 2,
    isAvailable: true,
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
    ]),
    amenities: JSON.stringify([
      "WiFi",
      "Shared Bathroom",
      "Fan",
      "Wardrobe",
    ]),
  },
];

async function seedCompleteRooms() {
  try {
    console.log('🌱 Seeding complete room data...\n');

    // Clear existing rooms
    await prisma.room.deleteMany({});
    console.log('🗑️  Cleared existing rooms\n');

    // Create new rooms
    for (const room of completeRooms) {
      const created = await prisma.room.create({
        data: room
      });

      console.log(`✅ Created: ${created.roomNumber} - ${created.title} (${created.roomType}, ${created.bookingType})`);
    }

    console.log('\n🎉 Seeding completed!');
    
    // Show summary
    const totalRooms = await prisma.room.count();
    const acRooms = await prisma.room.count({ where: { roomType: 'AC' } });
    const nonAcRooms = await prisma.room.count({ where: { roomType: 'Non-AC' } });
    const dailyRooms = await prisma.room.count({ where: { bookingType: 'Daily' } });
    const monthlyRooms = await prisma.room.count({ where: { bookingType: 'Monthly' } });

    console.log('\n📊 Summary:');
    console.log(`Total Rooms: ${totalRooms}`);
    console.log(`AC Rooms: ${acRooms}`);
    console.log(`Non-AC Rooms: ${nonAcRooms}`);
    console.log(`Daily Booking: ${dailyRooms}`);
    console.log(`Monthly Booking: ${monthlyRooms}`);

  } catch (error) {
    console.error('❌ Error seeding rooms:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedCompleteRooms();
