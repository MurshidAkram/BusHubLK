const axios = require('axios');

async function testDuplicateSubmission() {
  try {
    console.log('Testing duplicate submission prevention...');
    
    const requestData = {
      passenger_id: 14,
      report_type: 'lost',
      item_category: 'phone',
      item_description: 'Duplicate Test Phone',
      route_number: '138',
      region_id: null,
      incident_date: '2025-07-15',
      incident_time: '04:00:00',
      contact_email: 'duplicate@gmail.com',
      contact_phone: '0776544566',
      reward_offered: 0
    };

    // Send first request
    console.log('Sending first request...');
    const response1 = await axios.post('http://localhost:5000/api/lost-found/reports', requestData, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('First request - Status:', response1.status);
    console.log('First request - Data:', response1.data);

    // Send second request immediately (simulating double-tap)
    console.log('\\nSending second request (duplicate)...');
    const response2 = await axios.post('http://localhost:5000/api/lost-found/reports', requestData, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('Second request - Status:', response2.status);
    console.log('Second request - Data:', response2.data);
    
  } catch (error) {
    console.error('Duplicate test error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testDuplicateSubmission();
