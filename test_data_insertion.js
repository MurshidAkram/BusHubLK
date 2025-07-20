// Test inserting data directly using the new test endpoint
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

    console.log(`\n🔄 ${method} ${path}`);

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

async function testDataInsertion() {
  console.log('🧪 Testing Direct Data Insertion');
  console.log('==================================');
  
  try {
    // Try to insert test data
    console.log('\n1️⃣ Inserting test tracking data');
    await makeRequest('/live-tracking/test-data', 'POST', {});
    
    // Check if data was inserted
    console.log('\n2️⃣ Checking active buses after insertion');
    await makeRequest('/live-tracking/buses/active');
    
    console.log('\n3️⃣ Testing nearby buses query (should work now)');
    await makeRequest('/live-tracking/buses/nearby?latitude=6.9271&longitude=79.8612&radius=10');
    
    console.log('\n4️⃣ Testing specific bus position');
    await makeRequest('/live-tracking/bus/17');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testDataInsertion();
