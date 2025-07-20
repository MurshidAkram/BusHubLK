// Real-time API test to verify tracking data insertion
const http = require('http');

const API_BASE = 'http://localhost:5000/api';

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

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (postData) {
      req.write(JSON.stringify(postData));
    }
    
    req.end();
  });
}

// Simulate rapid tracking data insertion (every 3 seconds)
async function simulateRealTimeTracking() {
  console.log('🚀 Simulating Real-Time Bus Tracking (Every 3 seconds)');
  console.log('======================================================');
  
  let counter = 1;
  const startTime = Date.now();
  
  // Base location (Colombo)
  let currentLat = 6.9271;
  let currentLng = 79.8612;
  let currentSpeed = 25;
  let currentHeading = 90;
  
  const interval = setInterval(async () => {
    try {
      // Simulate bus movement
      currentLat += 0.0001; // Move slightly north
      currentLng += 0.0001; // Move slightly east
      currentSpeed = 20 + Math.random() * 20; // Speed between 20-40 km/h
      currentHeading = (currentHeading + Math.random() * 20 - 10) % 360; // Slight heading change
      
      const trackingData = {
        busId: 17,
        routeId: 1,
        driverId: 6,
        latitude: currentLat,
        longitude: currentLng,
        speed: currentSpeed,
        heading: currentHeading,
        accuracy: 5.0,
        passengerCount: Math.floor(Math.random() * 40),
        occupancyLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
      };
      
      console.log(`\n📍 Update #${counter} - ${new Date().toLocaleTimeString()}`);
      console.log(`Bus 17: ${currentLat.toFixed(6)}, ${currentLng.toFixed(6)}`);
      console.log(`Speed: ${currentSpeed.toFixed(1)} km/h, Heading: ${currentHeading.toFixed(0)}°`);
      
      // This will fail due to authentication, but shows the request structure
      const response = await makeRequest('/live-tracking/position', 'POST', trackingData);
      console.log(`Response: ${response.status}`);
      
      counter++;
      
      // Run for 1 minute (20 updates)
      if (counter > 20) {
        clearInterval(interval);
        const duration = (Date.now() - startTime) / 1000;
        console.log(`\n🎉 Simulation complete! Ran for ${duration.toFixed(1)} seconds`);
        console.log(`📊 Average update interval: ${(duration / (counter-1)).toFixed(1)} seconds`);
        
        // Check current active buses
        console.log('\n🔍 Checking active buses...');
        const activeBuses = await makeRequest('/live-tracking/buses/active');
        console.log('Active buses:', activeBuses.data);
      }
      
    } catch (error) {
      console.error('Update failed:', error.message);
    }
  }, 3000); // Every 3 seconds
  
  console.log('⏱️  Starting tracking simulation...');
  console.log('Press Ctrl+C to stop');
}

// Also create a function to check current data
async function checkCurrentData() {
  console.log('\n🔍 Current Tracking Data Status');
  console.log('===============================');
  
  try {
    // Check active buses
    const activeBuses = await makeRequest('/live-tracking/buses/active');
    console.log(`📊 Active buses: ${activeBuses.data?.count || 0}`);
    
    if (activeBuses.data?.data?.length > 0) {
      console.log('\nActive buses details:');
      activeBuses.data.data.forEach((bus, index) => {
        console.log(`${index + 1}. Bus ${bus.bus_id}: ${bus.latitude}, ${bus.longitude}`);
        console.log(`   Speed: ${bus.speed} km/h, Last update: ${bus.last_update}`);
      });
    }
    
    // Check specific bus
    const bus17 = await makeRequest('/live-tracking/bus/17');
    console.log(`\n🚌 Bus 17 status: ${bus17.status === 200 ? 'ACTIVE' : 'NOT FOUND'}`);
    if (bus17.status === 200) {
      console.log(`Location: ${bus17.data.data.latitude}, ${bus17.data.data.longitude}`);
      console.log(`Last update: ${bus17.data.data.last_update}`);
    }
    
    // Check route data
    const route138 = await makeRequest('/live-tracking/route/138');
    console.log(`\n🛣️  Route 138 buses: ${route138.data?.data?.active_buses_count || 0}`);
    
  } catch (error) {
    console.error('Check failed:', error.message);
  }
}

// Run the appropriate test based on command line argument
const args = process.argv.slice(2);
if (args[0] === 'simulate') {
  simulateRealTimeTracking();
} else {
  checkCurrentData();
}

console.log('\n💡 Usage:');
console.log('node verify_tracking_data.js          # Check current data');
console.log('node verify_tracking_data.js simulate # Run real-time simulation');
