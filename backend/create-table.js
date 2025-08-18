const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost', 
  database: process.env.DB_NAME || 'bushublk',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function createDriverFoundItemsTable() {
  try {
    console.log('🔄 Creating driver_found_items table...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'database', 'create_driver_found_items_table.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL
    await pool.query(sql);
    
    console.log('✅ driver_found_items table created successfully!');
    
    // Verify the table was created
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'driver_found_items'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Table columns:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
  } catch (error) {
    console.error('❌ Error creating table:', error.message);
  } finally {
    await pool.end();
  }
}

// Run the script
createDriverFoundItemsTable();
