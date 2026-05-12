// Test script to verify GET /api/rooms endpoint

const API_URL = 'http://localhost:5000/api';

async function testGetRooms() {
  try {
    console.log('Testing GET /api/rooms endpoint...\n');
    
    const response = await fetch(`${API_URL}/rooms`);
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('\nResponse Data:');
    console.log(JSON.stringify(data, null, 2));
    console.log(`\n✅ Total rooms: ${data.length}`);
    
    if (data.length > 0) {
      console.log('\n📋 Room Summary:');
      data.forEach((room, index) => {
        console.log(`${index + 1}. ${room.title} (Room ${room.roomNumber}) - ₹${room.price}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testGetRooms();
