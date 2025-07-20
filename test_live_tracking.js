// ===============================================
// LIVE TRACKING API TEST SCRIPT
// ===============================================

const API_BASE_URL = 'http://172.20.10.4:5000/api';

// Test data for live tracking
const testData = {
  busId: 17,
  routeId: 1,
  driverId: 6, // User ID 6 from our previous tests
  latitude: 6.9271, // Colombo coordinates
  longitude: 79.8612,
  speed: 25.5,
  heading: 180,
  accuracy: 5.0,
  passengerCount: 15,
  occupancyLevel: 'medium'
};

// Helper function to make API calls
async function apiCall(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    console.log(`\n🔄 ${method} ${endpoint}`);
    console.log('Request body:', body);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    console.log(`✅ Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    return { status: response.status, data };
  } catch (error) {
    console.error(`❌ Error calling ${endpoint}:`, error.message);
    return { error: error.message };
  }
}

// Test script
async function testLiveTracking() {
  console.log('🚀 Testing Live Bus Tracking API');
  console.log('=====================================');
  
  try {
    // 1. Test updating bus position (Driver endpoint)
    console.log('\n1️⃣ Testing: Update Bus Position');
    await apiCall('/live-tracking/position', 'POST', testData);
    
    // 2. Test getting current bus position
    console.log('\n2️⃣ Testing: Get Bus Current Position');
    await apiCall(`/live-tracking/bus/${testData.busId}`);
    
    // 3. Test getting buses on route
    console.log('\n3️⃣ Testing: Get Buses on Route');
    await apiCall(`/live-tracking/route/138`); // Route 138
    
    // 4. Test getting all active buses
    console.log('\n4️⃣ Testing: Get All Active Buses');
    await apiCall('/live-tracking/buses/active');
    
    // 5. Test getting nearby buses
    console.log('\n5️⃣ Testing: Get Nearby Buses');
    await apiCall(`/live-tracking/buses/nearby?latitude=${testData.latitude}&longitude=${testData.longitude}&radius=5`);
    
    // 6. Add a few more test positions to simulate movement
    console.log('\n6️⃣ Testing: Simulate Bus Movement');
    
    const movements = [
      { ...testData, latitude: 6.9280, longitude: 79.8620, speed: 30.0, heading: 90 },
      { ...testData, latitude: 6.9290, longitude: 79.8630, speed: 28.5, heading: 45 },
      { ...testData, latitude: 6.9300, longitude: 79.8640, speed: 32.0, heading: 0 }
    ];
    
    for (let i = 0; i < movements.length; i++) {
      console.log(`\n   📍 Movement ${i + 1}:`);
      await apiCall('/live-tracking/position', 'POST', movements[i]);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    }
    
    // 7. Test driver-specific endpoints
    console.log('\n7️⃣ Testing: Driver Tracking Status');
    await apiCall(`/live-tracking/driver/${testData.driverId}/status`);
    
    // 8. Test tracking history
    console.log('\n8️⃣ Testing: Get Tracking History');
    await apiCall(`/live-tracking/bus/${testData.busId}/history?hours=1`);
    
    console.log('\n🎉 Live Tracking API Tests Complete!');
    console.log('=====================================');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testLiveTracking().catch(console.error);
