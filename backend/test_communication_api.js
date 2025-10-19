onst axios = require('axios');

async function testCommunicationAPI() {
  try {
    console.log('\n=== Testing Communication API ===\n');
    
    // First, login as CEO to get token
    console.log('1. Logging in as CEO...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'sahas@gmail.com',  // CEO email
      password: 'sahasviyath'     // Try username as password
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    console.log(`Token: ${token.substring(0, 50)}...`);
    console.log(`User: ${loginResponse.data.username} (${loginResponse.data.role})`);
    
    // Test fetching channels
    console.log('\n2. Fetching channels...');
    const channelsResponse = await axios.get('http://localhost:5000/api/communication/channels', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`✅ Channels API Response:`);
    console.log(`Success: ${channelsResponse.data.success}`);
    console.log(`Channels found: ${channelsResponse.data.channels.length}`);
    console.log('\nChannels data:');
    console.log(JSON.stringify(channelsResponse.data.channels, null, 2));
    
    console.log('\n=== Test Complete ===\n');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testCommunicationAPI();
