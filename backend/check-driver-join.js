const pool = require('./config/db');

// First, let's see how driver data is actually structured
pool.query(`
  SELECT 
    d.driver_id,
    u.first_name,
    u.last_name,
    u.email
  FROM drivers d
  LEFT JOIN users u ON d.driver_id = u.user_id
  WHERE d.driver_id = 10
  LIMIT 1
`, (err, res) => {
  if (err) {
    console.error('Error:', err.message);
    pool.end();
    return;
  }
  
  if (res.rows.length > 0) {
    console.log('✅ Found driver data structure:');
    console.log(JSON.stringify(res.rows[0], null, 2));
    console.log('');
    console.log('💡 Update emergency controller to use:');
    console.log('   SELECT u.first_name, u.last_name');
    console.log('   FROM drivers d');
    console.log('   JOIN users u ON d.driver_id = u.user_id');
    console.log('   WHERE d.driver_id = $1');
  } else {
    console.log('❌ No driver found with ID 10');
  }
  
  pool.end();
});
