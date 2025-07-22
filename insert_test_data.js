// Direct database insertion script
const db = require('./backend/config/db');

async function insertTestData() {
  console.log('🧪 Inserting test live tracking data directly...');
  
  try {
    // Test tracking data for multiple buses
    const testBuses = [
      {
        bus_id: 17,
        route_id: 1,
        driver_id: 6,
        latitude: 6.9271,
        longitude: 79.8612,
        speed: 25.5,
        heading: 180,
        accuracy: 5.0,
        passenger_count: 15,
        occupancy_level: 'medium'
      },
      {
        bus_id: 23,
        route_id: 1,
        driver_id: 7,
        latitude: 6.9280,
        longitude: 79.8620,
        speed: 30.0,
        heading: 90,
        accuracy: 4.5,
        passenger_count: 8,
        occupancy_level: 'low'
      },
      {
        bus_id: 31,
        route_id: 1,
        driver_id: 8,
        latitude: 6.9300,
        longitude: 79.8650,
        speed: 22.0,
        heading: 45,
        accuracy: 6.0,
        passenger_count: 25,
        occupancy_level: 'high'
      }
    ];

    const insertedData = [];
    
    for (const busData of testBuses) {
      try {
        // First, mark any existing live positions as not live
        await db.query(
          'UPDATE bus_live_tracking SET is_live = FALSE WHERE bus_id = $1 AND is_live = TRUE',
          [busData.bus_id]
        );

        // Insert new live position
        const result = await db.query(`
          INSERT INTO bus_live_tracking (
            bus_id, route_id, driver_id, latitude, longitude, 
            speed, heading, accuracy, passenger_count, occupancy_level,
            tracking_status, is_live
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active', true)
          RETURNING tracking_id
        `, [
          busData.bus_id,
          busData.route_id,
          busData.driver_id,
          busData.latitude,
          busData.longitude,
          busData.speed,
          busData.heading,
          busData.accuracy,
          busData.passenger_count,
          busData.occupancy_level
        ]);
        
        const tracking_id = result.rows[0].tracking_id;
        insertedData.push({
          ...busData,
          tracking_id: tracking_id
        });
        console.log(`✅ Inserted Bus ${busData.bus_id}: tracking_id ${tracking_id}`);
      } catch (error) {
        console.error(`❌ Failed to insert Bus ${busData.bus_id}:`, error.message);
      }
    }

    console.log(`\n🎉 Successfully inserted ${insertedData.length} tracking records!`);
    
    // Verify insertion
    console.log('\n📊 Verifying data...');
    const verification = await db.query(
      'SELECT bus_id, latitude, longitude, speed, recorded_at FROM bus_live_tracking WHERE is_live = true ORDER BY bus_id'
    );
    
    console.log('Live tracking data in database:');
    verification.rows.forEach(row => {
      console.log(`Bus ${row.bus_id}: ${row.latitude}, ${row.longitude} @ ${row.speed}km/h (${row.recorded_at})`);
    });
    
    return insertedData;
  } catch (error) {
    console.error('❌ Data insertion failed:', error);
    throw error;
  } finally {
    await db.end();
  }
}

// Run the insertion
insertTestData().catch(console.error);
