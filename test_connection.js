// Simple HTTP test
const http = require('http');

function testConnection(host, port, path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      port: port,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    console.log(`Testing: http://${host}:${port}${path}`);
    
    const req = http.request(options, (res) => {
      console.log(`Status: ${res.statusCode}`);
      console.log(`Headers:`, res.headers);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('Response:', data);
        resolve({ status: res.statusCode, data });
      });
    });

    req.on('error', (error) => {
      console.error('Connection error:', error.message);
      reject(error);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      console.error('Request timeout');
      reject(new Error('Timeout'));
    });

    req.end();
  });
}

async function runTests() {
  console.log('🚀 Testing HTTP Connection...');
  
  try {
    // Test 1: Basic connection to server
    await testConnection('172.20.10.4', 5000, '/api/live-tracking/buses/active');
    
    // Test 2: Try localhost
    console.log('\n--- Testing localhost ---');
    await testConnection('localhost', 5000, '/api/live-tracking/buses/active');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

runTests();
