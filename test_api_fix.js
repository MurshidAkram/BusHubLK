// Test the API with proper field names
const http = require('http');

function makeRequest(path, method = 'GET', postData = null) {
  return new Promise((resolve, reject) => {
    const url = new URL('http://localhost:5000/api' + path);
    
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

async function testAPIFieldNames() {
  console.log('🧪 Testing API Field Names Fix');
  console.log('==============================');

  // Test 1: Wrong field names (camelCase) - should fail
  console.log('\n❌ Test 1: Using camelCase field names (should fail)');
  const wrongData = {
    busId: 17,
    routeId: 1,
    driverId: 6,
    latitude: 6.9271,
    longitude: 79.8612,
    speed: 25.5,
    heading: 90
  };

  try {
    const wrongResponse = await makeRequest('/live-tracking/position', 'POST', wrongData);
    console.log(`Status: ${wrongResponse.status}`);
    console.log('Response:', wrongResponse.data);
  } catch (error) {
    console.log('Error:', error.message);
  }

  // Test 2: Correct field names (snake_case) - should succeed (but 401 due to auth)
  console.log('\n✅ Test 2: Using snake_case field names (should show better error)');
  const correctData = {
    bus_id: 17,
    route_id: 1,
    driver_id: 6,
    latitude: 6.9271,
    longitude: 79.8612,
    speed: 25.5,
    heading: 90
  };

  try {
    const correctResponse = await makeRequest('/live-tracking/position', 'POST', correctData);
    console.log(`Status: ${correctResponse.status}`);
    console.log('Response:', correctResponse.data);
  } catch (error) {
    console.log('Error:', error.message);
  }

  // Test 3: Check current active buses
  console.log('\n📊 Test 3: Check current active buses');
  try {
    const activeBuses = await makeRequest('/live-tracking/buses/active');
    console.log(`Status: ${activeBuses.status}`);
    if (activeBuses.status === 200) {
      console.log(`Active buses count: ${activeBuses.data.count}`);
    } else {
      console.log('Response:', activeBuses.data);
    }
  } catch (error) {
    console.log('Error:', error.message);
  }
}

testAPIFieldNames();
