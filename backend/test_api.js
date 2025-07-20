const axios = require('axios');

async function testAPI() {
  try {
    console.log('Testing API endpoint...');
    
    const response = await axios.post('http://localhost:5000/api/lost-found/reports', {
      passenger_id: 14,
      report_type: 'lost',
      item_category: 'phone',
      item_description: 'API Test phone',
      route_number: '138',
      region_id: null,
      incident_date: '2025-07-15',
      incident_time: '04:00:00',
      contact_email: 'apitest@gmail.com',
      contact_phone: '0776544566',
      reward_offered: 0
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    
  } catch (error) {
    console.error('API test error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testAPI();
