// Quick SMS Test Script
// Run this to verify notify.lk SMS is working
// Usage: node test-panic-sms.js

require('dotenv').config();
const notifySmsService = require('./services/notifySmsService');

async function testPanicSMS() {
  console.log('🧪 Testing Panic Alert SMS System...\n');

  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log('  NOTIFY_USER_ID:', process.env.NOTIFY_USER_ID ? '✅ SET' : '❌ NOT SET');
  console.log('  NOTIFY_API_KEY:', process.env.NOTIFY_API_KEY ? '✅ SET' : '❌ NOT SET');
  console.log('  NOTIFY_SENDER_ID:', process.env.NOTIFY_SENDER_ID ? '✅ SET' : '❌ NOT SET');
  console.log('  NOTIFY_API_ENDPOINT:', process.env.NOTIFY_API_ENDPOINT || 'https://app.notify.lk/api/v1/send');
  console.log('');

  if (!process.env.NOTIFY_USER_ID || !process.env.NOTIFY_API_KEY || !process.env.NOTIFY_SENDER_ID) {
    console.error('❌ Missing notify.lk credentials in .env file');
    console.log('\nRequired environment variables:');
    console.log('  NOTIFY_USER_ID=your_user_id');
    console.log('  NOTIFY_API_KEY=your_api_key');
    console.log('  NOTIFY_SENDER_ID=your_sender_id');
    process.exit(1);
  }

  // Test SMS message
  const testMessage = `🚨 TEST PANIC ALERT - Driver Emergency

Driver: Test Driver
Bus: TEST-1234
Route: 120

Location: https://www.google.com/maps?q=6.9271,79.8612

Description: This is a test of the panic alert system

Time: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Colombo' })}

⚠️ THIS IS A TEST - NO ACTION REQUIRED`;

  const policeNumber = '0779365318'; // Police HQ number

  console.log('📱 Sending test SMS to:', policeNumber);
  console.log('📝 Message preview:');
  console.log('-------------------');
  console.log(testMessage);
  console.log('-------------------\n');

  try {
    const result = await notifySmsService.sendSms({
      message: testMessage,
      phoneNumbers: [policeNumber]
    });

    console.log('✅ SMS sent successfully!');
    console.log('📊 Result:', JSON.stringify(result, null, 2));

    if (result.delivered > 0) {
      console.log('\n🎉 SUCCESS! The panic alert SMS system is working.');
      console.log(`   ${result.delivered} message(s) delivered out of ${result.requested} requested.`);
    } else {
      console.log('\n⚠️ WARNING: SMS was accepted but delivery count is 0.');
      console.log('   Check your notify.lk account balance and sender ID approval.');
    }

  } catch (error) {
    console.error('❌ SMS failed!');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    console.error('Full error:', error);
    process.exit(1);
  }
}

testPanicSMS();
