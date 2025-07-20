const axios = require('axios');

async function testAPIWithAuth() {
  try {
    console.log('Testing API endpoint with Authorization header...');
    
    // Test with a fake/invalid token (like the mobile app might send)
    const response = await axios.post('http://localhost:5000/api/lost-found/reports', {
      passenger_id: 14,
      report_type: 'lost',
      item_category: 'phone',
      item_description: 'Auth Test phone',
      route_number: '138',
      region_id: null,
      incident_date: '2025-07-15',
      incident_time: '04:00:00',
      contact_email: 'authtest@gmail.com',
      contact_phone: '0776544566',
      reward_offered: 0
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake_invalid_token_12345'
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

async function testAPIWithFormData() {
  try {
    console.log('\\nTesting API endpoint with FormData (like mobile app with photo)...');
    
    const FormData = require('form-data');
    const form = new FormData();
    form.append('passenger_id', '14');
    form.append('report_type', 'lost');
    form.append('item_category', 'phone');
    form.append('item_description', 'FormData Test phone');
    form.append('route_number', '138');
    form.append('region_id', '');
    form.append('incident_date', '2025-07-15');
    form.append('incident_time', '04:00:00');
    form.append('contact_email', 'formtest@gmail.com');
    form.append('contact_phone', '0776544566');
    form.append('reward_offered', '0');

    const response = await axios.post('http://localhost:5000/api/lost-found/reports', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': 'Bearer fake_invalid_token_12345'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    
  } catch (error) {
    console.error('API FormData test error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

async function runTests() {
  await testAPIWithAuth();
  await testAPIWithFormData();
}

runTests();
