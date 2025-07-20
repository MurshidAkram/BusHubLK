const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration - update these with your actual credentials
const dbConfig = {
  user: process.env.DB_USER || 'your_username',
  password: process.env.DB_PASSWORD || 'your_password',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'your_database_name'
};

async function runMigration() {
  const pool = new Pool(dbConfig);
  
  try {
    console.log('🔗 Connecting to database...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create_lost_found_reports_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📝 Executing SQL migration...');
    
    // Execute the SQL
    await pool.query(sql);
    
    console.log('✅ Migration completed successfully!');
    console.log('📋 Created lost_found_reports table with:');
    console.log('   - Primary key: report_id');
    console.log('   - Foreign keys: passenger_id, region_id');
    console.log('   - Indexes for performance');
    console.log('   - Auto-update trigger for updated_at');
    console.log('   - find_potential_matches function');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('🔚 Database connection closed');
  }
}

// Run if this file is executed directly
if (require.main === module) {
  runMigration();
}

module.exports = runMigration;
