// ===============================================
// COMPREHENSIVE LIVE TRACKING TEST WITH AUTHENTICATION
// ===============================================

const http = require('http');

const API_BASE = 'http://localhost:5000/api';

// Test credentials (using driver 6 from previous tests)
const driverCredentials = {
  email: 'driver.john@bus.com', // This might need to be adjusted
  password: 'driver123'
};

let authToken = null;

// Helper function to make HTTP requests
function makeRequest(path, method = 'GET', postData = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (postData) {
      const data = JSON.stringify(postData);
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }

    console.log(`\n🔄 ${method} ${path}`);
    if (postData && !path.includes('/login')) console.log('Request body:', postData);

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

// Authenticate driver and get token
async function authenticateDriver() {
  console.log('🔐 Authenticating Driver...');
  
  const response = await makeRequest('/driver/login', 'POST', driverCredentials);
  
  if (response.status === 200 && response.data.token) {
    authToken = response.data.token;
    console.log('✅ Authentication successful!');
    return true;
  } else {
    console.log('❌ Authentication failed, trying without auth for public endpoints');
    return false;
  }
}

// Test live tracking with authentication
async function testLiveTrackingWithAuth() {
  console.log('\n🚀 Testing Live Bus Tracking API with Authentication');
  console.log('=======================================================');
  
  try {
    // 1. Try to authenticate
    const authenticated = await authenticateDriver();
    
    // Headers for authenticated requests
    const authHeaders = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
    
    // Test data for live tracking
    const testData = {
      busId: 17,
      routeId: 1,
      driverId: 6, 
      latitude: 6.9271, // Colombo coordinates
      longitude: 79.8612,
      speed: 25.5,
      heading: 180,
      accuracy: 5.0,
      passengerCount: 15,
      occupancyLevel: 'medium'
    };

    if (authenticated) {
      // Test with authentication
      console.log('\n1️⃣ Testing: Update Bus Position (Authenticated)');
      await makeRequest('/live-tracking/position', 'POST', testData, authHeaders);
      
      // Simulate some movement
      console.log('\n2️⃣ Testing: Simulate Movement');
      const movements = [
        { ...testData, latitude: 6.9280, longitude: 79.8620, speed: 30.0 },
        { ...testData, latitude: 6.9290, longitude: 79.8630, speed: 28.5 }
      ];
      
      for (let i = 0; i < movements.length; i++) {
        console.log(`\n   📍 Movement ${i + 1}:`);
        await makeRequest('/live-tracking/position', 'POST', movements[i], authHeaders);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } else {
      // Test without authentication (should fail for protected endpoints)
      console.log('\n1️⃣ Testing: Update Bus Position (No Auth - Should Fail)');
      await makeRequest('/live-tracking/position', 'POST', testData);
    }
    
    // Test public endpoints (no auth required)
    console.log('\n3️⃣ Testing: Public Endpoints');
    
    console.log('\n   🔍 Get Bus Current Position');
    await makeRequest('/live-tracking/bus/17');
    
    console.log('\n   🔍 Get Buses on Route');
    await makeRequest('/live-tracking/route/138');
    
    console.log('\n   🔍 Get All Active Buses');
    await makeRequest('/live-tracking/buses/active');
    
    console.log('\n   🔍 Get Nearby Buses (Fixed Query)');
    await makeRequest('/live-tracking/buses/nearby?latitude=6.9271&longitude=79.8612&radius=5');
    
    // Test direct database insertion (if auth failed, let's insert manually)
    if (!authenticated) {
      console.log('\n4️⃣ Testing: Manual Database Insert (Simulated)');
      console.log('Since authentication failed, we would normally insert test data directly into the database');
      console.log('For now, testing that the query endpoints work properly with empty data');
    }
    
    console.log('\n🎉 Live Tracking API Tests Complete!');
    console.log('=========================================');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Alternative: Insert test data directly via SQL (if we had access)
function showDirectSQLInsert() {
  console.log('\n📝 Direct SQL Insert Command (for manual execution):');
  console.log('====================================================');
  console.log(`
INSERT INTO bus_live_tracking (
  bus_id, route_id, driver_id, latitude, longitude, 
  speed, heading, accuracy, passenger_count, occupancy_level,
  tracking_status, is_live
) VALUES (
  17, 1, 6, 6.9271, 79.8612, 
  25.5, 180, 5.0, 15, 'medium',
  'active', true
);
  `);
}

// Run the comprehensive test
testLiveTrackingWithAuth().then(() => {
  showDirectSQLInsert();
}).catch(console.error);
