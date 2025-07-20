const axios = require('axios');

const API_BASE = 'http://10.98.151.57:5000/api';

async function testCompleteFlow() {
  console.log('🧪 Testing Complete Lost & Found Flow...\n');

  try {
    // Test 1: Health Check
    console.log('1. 🏥 Testing health endpoint...');
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log('✅ Health check:', healthResponse.data.message);

    // Test 2: Get reports (should work without auth)
    console.log('\n2. 📋 Testing get reports...');
    const reportsResponse = await axios.get(`${API_BASE}/lost-found/reports`);
    console.log('✅ Reports fetched:', reportsResponse.data.data.reports.length, 'reports');

    // Test 3: Test specific category
    console.log('\n3. 🔍 Testing category filter...');
    const categoryResponse = await axios.get(`${API_BASE}/lost-found/reports?item_category=phone`);
    console.log('✅ Phone reports:', categoryResponse.data.data.reports.length, 'reports');

    // Test 4: Test direct database insert (simulating successful API call)
    console.log('\n4. 🗄️  Testing direct database operations...');
    const testInsert = await axios.post(`${API_BASE}/lost-found/test-insert`, {
      passenger_id: 14,
      report_type: 'lost',
      item_category: 'testitem',
      item_description: 'Flow Test Item - ' + Date.now(),
      incident_date: '2025-07-20',
      incident_time: '12:00:00',
      contact_phone: '0776544566'
    });

    console.log('Database test response:', testInsert.data);

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

testCompleteFlow();
