// Manual data insertion using SQL through the stored function
console.log('🧪 Manual Live Tracking Data Insertion');
console.log('=====================================');

console.log(`
Since we can't access the database directly due to SSL restrictions,
here are the SQL commands to insert test data manually:

-- First, ensure you're connected to the busapp database

-- Insert test data for Bus 17 (Driver 6, Route 1)
SELECT update_bus_position(
    17,           -- bus_id
    1,            -- route_id  
    6,            -- driver_id
    6.9271,       -- latitude
    79.8612,      -- longitude
    25.5,         -- speed
    180,          -- heading
    5.0,          -- accuracy
    15,           -- passenger_count
    'medium'      -- occupancy_level
);

-- Insert test data for Bus 23 (Driver 7, Route 1)  
SELECT update_bus_position(
    23,           -- bus_id
    1,            -- route_id
    7,            -- driver_id
    6.9280,       -- latitude
    79.8620,      -- longitude
    30.0,         -- speed
    90,           -- heading
    4.5,          -- accuracy
    8,            -- passenger_count
    'low'         -- occupancy_level
);

-- Insert test data for Bus 31 (Driver 8, Route 1)
SELECT update_bus_position(
    31,           -- bus_id
    1,            -- route_id
    8,            -- driver_id
    6.9300,       -- latitude
    79.8650,      -- longitude
    22.0,         -- speed
    45,           -- heading
    6.0,          -- accuracy
    25,           -- passenger_count
    'high'        -- occupancy_level
);

-- Verify the data was inserted
SELECT 
    bus_id,
    latitude,
    longitude, 
    speed,
    recorded_at
FROM bus_live_tracking 
WHERE is_live = true 
ORDER BY bus_id;

-- Check the current positions view
SELECT * FROM bus_current_positions;
`);

console.log('\n📝 INSTRUCTIONS:');
console.log('1. Connect to your PostgreSQL database using pgAdmin or psql');
console.log('2. Execute the SQL commands above to insert test data');
console.log('3. Run the API tests again to see live data');
console.log('\n✅ Once data is inserted, the live tracking system will show real data!');

// Let's also provide a curl test command for after data insertion
console.log('\n🧪 After inserting data, test with these commands:');
console.log('=================================================');
console.log('curl http://localhost:5000/api/live-tracking/buses/active');
console.log('curl http://localhost:5000/api/live-tracking/bus/17'); 
console.log('curl http://localhost:5000/api/live-tracking/route/138');
console.log('curl "http://localhost:5000/api/live-tracking/buses/nearby?latitude=6.9271&longitude=79.8612&radius=10"');

module.exports = {
  message: 'Use the SQL commands above to insert test data manually'
};
