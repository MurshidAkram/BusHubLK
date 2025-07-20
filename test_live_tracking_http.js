// ===============================================
// LIVE TRACKING API TEST SCRIPT (Using Node.js HTTP)
// ===============================================

const http = require('http');
const querystring = require('querystring');

const API_BASE = 'http://localhost:5000/api';

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

// Helper function to make HTTP requests
function makeRequest(path, method = 'GET', postData = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (postData) {
      const data = JSON.stringify(postData);
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }

    console.log(`\n🔄 ${method} ${path}`);
    if (postData) console.log('Request body:', postData);

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          console.log(`✅ Status: ${res.statusCode}`);
          console.log('Response:', JSON.stringify(jsonData, null, 2));
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          console.log(`✅ Status: ${res.statusCode}`);
          console.log('Response (raw):', data);
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ Error: ${error.message}`);
      reject(error);
    });

    if (postData) {
      req.write(JSON.stringify(postData));
    }
    
    req.end();
  });
}

// Test script
async function testLiveTracking() {
  console.log('🚀 Testing Live Bus Tracking API');
  console.log('=====================================');
  
  try {
    // 1. Test updating bus position (Driver endpoint)
    console.log('\n1️⃣ Testing: Update Bus Position');
    await makeRequest('/live-tracking/position', 'POST', testData);
    
    // 2. Test getting current bus position
    console.log('\n2️⃣ Testing: Get Bus Current Position');
    await makeRequest(`/live-tracking/bus/${testData.busId}`);
    
    // 3. Test getting buses on route 
    console.log('\n3️⃣ Testing: Get Buses on Route 138');
    await makeRequest('/live-tracking/route/138');
    
    // 4. Test getting all active buses
    console.log('\n4️⃣ Testing: Get All Active Buses');
    await makeRequest('/live-tracking/buses/active');
    
    // 5. Test getting nearby buses
    console.log('\n5️⃣ Testing: Get Nearby Buses');
    await makeRequest(`/live-tracking/buses/nearby?latitude=${testData.latitude}&longitude=${testData.longitude}&radius=5`);
    
    // 6. Add a few more test positions to simulate movement
    console.log('\n6️⃣ Testing: Simulate Bus Movement');
    
    const movements = [
      { ...testData, latitude: 6.9280, longitude: 79.8620, speed: 30.0, heading: 90 },
      { ...testData, latitude: 6.9290, longitude: 79.8630, speed: 28.5, heading: 45 },
      { ...testData, latitude: 6.9300, longitude: 79.8640, speed: 32.0, heading: 0 }
    ];
    
    for (let i = 0; i < movements.length; i++) {
      console.log(`\n   📍 Movement ${i + 1}:`);
      await makeRequest('/live-tracking/position', 'POST', movements[i]);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    }
    
    // 7. Test driver-specific endpoints
    console.log('\n7️⃣ Testing: Driver Tracking Status');
    await makeRequest(`/live-tracking/driver/${testData.driverId}/status`);
    
    // 8. Test tracking history
    console.log('\n8️⃣ Testing: Get Tracking History');
    await makeRequest(`/live-tracking/bus/${testData.busId}/history?hours=1`);
    
    // 9. Test getting all active buses again (should show our test data)
    console.log('\n9️⃣ Testing: Get All Active Buses (After Insertions)');
    await makeRequest('/live-tracking/buses/active');
    
    console.log('\n🎉 Live Tracking API Tests Complete!');
    console.log('=====================================');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testLiveTracking().catch(console.error);
