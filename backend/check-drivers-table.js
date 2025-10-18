const pool = require('./config/db');

console.log('Checking drivers table structure...\n');

pool.query(`
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name = 'drivers' 
  ORDER BY ordinal_position
`, (err, res) => {
  if (err) {
    console.error('Error:', err.message);
  } else {
    console.log('Drivers table columns:');
    res.rows.forEach(r => {
      console.log(`  - ${r.column_name} (${r.data_type})`);
    });
    console.log('');
    
    // Check if first_name exists
    const hasFirstName = res.rows.some(r => r.column_name === 'first_name');
    const hasLastName = res.rows.some(r => r.column_name === 'last_name');
    
    if (!hasFirstName || !hasLastName) {
      console.log('❌ Missing columns!');
      if (!hasFirstName) console.log('   - first_name column NOT FOUND');
      if (!hasLastName) console.log('   - last_name column NOT FOUND');
      console.log('');
      console.log('💡 You need to update the SQL query in emergencyController.js');
      console.log('   to use the actual column names from the drivers table.');
    } else {
      console.log('✅ first_name and last_name columns exist');
    }
  }
  pool.end();
});
