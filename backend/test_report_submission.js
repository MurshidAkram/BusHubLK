const axios = require('axios');

const API_BASE = 'http://10.98.151.57:5000/api';

async function testReportSubmission() {
  console.log('🧪 Testing Report Submission API...\n');

  try {
    // First, login to get a token
    console.log('1. 🔐 Testing login...');
    const loginResponse = await axios.post(`${API_BASE}/passengers/login`, {
      email: 'abiku@gmail.com',
      password: 'pass123'
    });

    if (!loginResponse.data.success) {
      console.error('❌ Login failed:', loginResponse.data.message);
      return;
    }

    const token = loginResponse.data.token;
    const userId = loginResponse.data.user.id;
    console.log('✅ Login successful, user ID:', userId);

    // Test report submission
    console.log('\n2. 📝 Testing report submission...');
    const reportData = {
      passenger_id: userId,
      report_type: 'lost',
      item_category: 'test',
      item_description: 'API Test Item - ' + Date.now(),
      route_number: '138',
      region_id: null,
      incident_date: '2025-07-20',
      incident_time: '10:00:00',
      contact_email: 'abiku@gmail.com',
      contact_phone: '0776544566',
      reward_offered: 0
    };

    const reportResponse = await axios.post(`${API_BASE}/lost-found/reports`, reportData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (reportResponse.data.success) {
      console.log('✅ Report submission successful!');
      console.log('📋 Report ID:', reportResponse.data.data.report_id);
      console.log('🔗 Report Reference:', reportResponse.data.data.report_reference);

      // Verify the report exists
      console.log('\n3. 🔍 Verifying report exists...');
      const verifyResponse = await axios.get(`${API_BASE}/lost-found/reports?item_category=test`);
      
      if (verifyResponse.data.success && verifyResponse.data.data.reports.length > 0) {
        console.log('✅ Report verification successful!');
        console.log('📊 Found', verifyResponse.data.data.reports.length, 'test reports');
        
        const report = verifyResponse.data.data.reports.find(r => r.report_id === reportResponse.data.data.report_id);
        if (report) {
          console.log('✅ Specific report found:', report.item_description);
        } else {
          console.log('⚠️  Report submitted but not found in category filter');
        }
      } else {
        console.log('❌ Report verification failed - report not found');
      }

    } else {
      console.log('❌ Report submission failed:', reportResponse.data.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testReportSubmission();
