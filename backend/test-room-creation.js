// Test script to create a room
// First login as admin, then create room

const API_URL = 'http://localhost:5000/api';

async function testRoomCreation() {
  try {
    // Step 1: Login as admin
    console.log('Step 1: Logging in as admin...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@gmail.com',
        password: 'admin123'
      })
    });

    const loginData = await loginResponse.json();
    
    if (!loginResponse.ok) {
      console.error('Login failed:', loginData);
      return;
    }

    console.log('✅ Login successful!');
    console.log('Token:', loginData.token);
    console.log('User:', loginData.user);

    // Step 2: Create room with admin token
    console.log('\nStep 2: Creating room...');
    const roomResponse = await fetch(`${API_URL}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.token}`
      },
      body: JSON.stringify({
        roomNumber: "101",
        title: "Deluxe AC Room",
        description: "Beautiful AC room with modern facilities",
        price: 1500,
        roomType: "AC",
        bookingType: "Daily",
        floor: 1,
        capacity: 2
      })
    });

    const roomData = await roomResponse.json();
    
    if (!roomResponse.ok) {
      console.error('❌ Room creation failed:', roomData);
      return;
    }

    console.log('✅ Room created successfully!');
    console.log('Room:', roomData);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testRoomCreation();
