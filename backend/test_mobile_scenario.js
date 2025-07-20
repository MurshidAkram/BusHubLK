const axios = require('axios');
const FormData = require('form-data');

async function testMobileAppScenario() {
  try {
    console.log('Testing mobile app scenario - FormData without photo...');
    
    const form = new FormData();
    form.append('passenger_id', '14');
    form.append('report_type', 'lost');
    form.append('item_category', 'phone');
    form.append('item_description', 'Bdkakaan Mobile Test');
    form.append('route_number', '138');
    form.append('region_id', ''); // Empty string like mobile app might send
    form.append('incident_date', '2025-07-15');
    form.append('incident_time', '04:00:00');
    form.append('contact_email', 'abiku@gmail.com');
    form.append('contact_phone', '0776544566');
    form.append('reward_offered', '0');
    // Note: No photo field added

    const response = await axios.post('http://localhost:5000/api/lost-found/reports', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': 'Bearer fake_mobile_token_12345'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    
  } catch (error) {
    console.error('Mobile scenario test error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

async function testWithEmptyValues() {
  try {
    console.log('\\nTesting with various empty/null values...');
    
    const response = await axios.post('http://localhost:5000/api/lost-found/reports', {
      passenger_id: 14,
      report_type: 'lost',
      item_category: 'phone',
      item_description: 'Empty values test',
      route_number: '138',
      region_id: '', // Empty string
      incident_date: '2025-07-15',
      incident_time: '04:00:00',
      contact_email: 'empty@gmail.com',
      contact_phone: '0776544566',
      reward_offered: '', // Empty string
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake_token'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    
  } catch (error) {
    console.error('Empty values test error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

async function runMobileTests() {
  await testMobileAppScenario();
  await testWithEmptyValues();
}

runMobileTests();
