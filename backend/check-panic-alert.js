require('dotenv').config();
const pool = require('./config/db');

async function checkPanicAlert() {
  try {
    // Check table structure
    const columnsResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'emergency_reports' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Emergency Reports Table Structure:');
    console.table(columnsResult.rows);
    
    // Check most recent panic alert
    const recentResult = await pool.query(`
      SELECT id, driver_id, incident_type, created_at, description
      FROM emergency_reports 
      WHERE incident_type = 'Panic Alert'
      ORDER BY id DESC 
      LIMIT 3
    `);
    
    console.log('\n🚨 Recent Panic Alerts:');
    console.table(recentResult.rows);
    
    if (recentResult.rows.length > 0) {
      console.log('\n✅ Panic alerts are being saved correctly!');
      console.log('📱 Check your backend server console for SMS notification logs');
      console.log('   Look for messages like:');
      console.log('   - 🚨 Panic mode detected - preparing to send SMS notification...');
      console.log('   - 📱 Sending SMS to Police HQ: 0779365318');
      console.log('   - ✅ Panic alert SMS sent successfully...');
    } else {
      console.log('\n⚠️ No panic alerts found in database');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkPanicAlert();
