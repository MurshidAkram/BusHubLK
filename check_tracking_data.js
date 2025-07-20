// Database verification script to check if data is being inserted
const db = require('./backend/config/db');

async function checkLiveTrackingData() {
  console.log('🔍 Checking bus_live_tracking table data...');
  console.log('================================================');
  
  try {
    // Check if table exists
    const tableExists = await db.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'bus_live_tracking'
      );
    `);
    
    console.log('✅ Table exists:', tableExists.rows[0].exists);
    
    if (!tableExists.rows[0].exists) {
      console.log('❌ Table does not exist! Please run the schema creation first.');
      return;
    }

    // Check total record count
    const totalCount = await db.query('SELECT COUNT(*) as count FROM bus_live_tracking');
    console.log(`📊 Total records in table: ${totalCount.rows[0].count}`);

    // Check live records count
    const liveCount = await db.query('SELECT COUNT(*) as count FROM bus_live_tracking WHERE is_live = true');
    console.log(`🔴 Live records: ${liveCount.rows[0].count}`);

    // Get all records with details
    const allRecords = await db.query(`
      SELECT 
        tracking_id,
        bus_id,
        route_id,
        driver_id,
        latitude,
        longitude,
        speed,
        heading,
        is_live,
        tracking_status,
        recorded_at,
        server_received_at
      FROM bus_live_tracking 
      ORDER BY recorded_at DESC 
      LIMIT 10
    `);

    if (allRecords.rows.length === 0) {
      console.log('❌ No records found in the table');
      console.log('\n🔧 Possible issues:');
      console.log('1. Data insertion is failing');
      console.log('2. Table was not created properly');
      console.log('3. API endpoint is not reaching the database');
    } else {
      console.log('\n📋 Recent tracking records:');
      console.log('=====================================');
      allRecords.rows.forEach((record, index) => {
        console.log(`${index + 1}. Bus ${record.bus_id} (Route ${record.route_id})`);
        console.log(`   Driver: ${record.driver_id}`);
        console.log(`   Location: ${record.latitude}, ${record.longitude}`);
        console.log(`   Speed: ${record.speed} km/h, Heading: ${record.heading}°`);
        console.log(`   Live: ${record.is_live}, Status: ${record.tracking_status}`);
        console.log(`   Recorded: ${record.recorded_at}`);
        console.log(`   Server received: ${record.server_received_at}`);
        console.log('   ---');
      });
    }

    // Check for recent insertions (last hour)
    const recentRecords = await db.query(`
      SELECT COUNT(*) as count 
      FROM bus_live_tracking 
      WHERE recorded_at >= NOW() - INTERVAL '1 hour'
    `);
    console.log(`\n⏰ Records inserted in last hour: ${recentRecords.rows[0].count}`);

    // Check table structure
    console.log('\n🏗️ Table structure verification:');
    const columns = await db.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'bus_live_tracking' 
      ORDER BY ordinal_position
    `);
    
    console.log('Columns:');
    columns.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(required)'}`);
    });

  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    console.error('Full error:', error);
  } finally {
    try {
      await db.end();
    } catch (closeError) {
      console.error('Error closing database connection:', closeError);
    }
  }
}

// Run the check
checkLiveTrackingData().catch(console.error);
