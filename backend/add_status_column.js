const db = require('./config/db');
const fs = require('fs');
const path = require('path');

async function addStatusColumn() {
  try {
    console.log('📋 Adding status column to alerts table...');
    
    const sqlPath = path.join(__dirname, 'sql', 'add_status_to_emergency_alerts.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim().startsWith('--') || statement.trim().startsWith('SELECT')) {
        continue; // Skip comments and SELECT statements
      }
      try {
        await db.query(statement);
        console.log('✅ Executed:', statement.substring(0, 50) + '...');
      } catch (err) {
        if (err.message.includes('already exists') || err.message.includes('duplicate')) {
          console.log('⚠️  Already exists:', statement.substring(0, 50) + '...');
        } else {
          throw err;
        }
      }
    }
    
    console.log('\n✅ Status column added successfully!');
    console.log('\n📊 Verifying table structure...');
    
    const result = await db.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'alerts'
      AND column_name = 'status';
    `);
    
    if (result.rows.length > 0) {
      console.log('\n✅ Status column verified:');
      console.log(result.rows[0]);
    } else {
      console.log('\n❌ Status column not found!');
    }
    
    // Check current alerts
    const alertsResult = await db.query(`
      SELECT COUNT(*) as total, 
             SUM(CASE WHEN status = 'active' OR status IS NULL THEN 1 ELSE 0 END) as active,
             SUM(CASE WHEN status = 'deleted' THEN 1 ELSE 0 END) as deleted
      FROM alerts;
    `);
    
    console.log('\n📊 Current alerts status:');
    console.log(`  Total alerts: ${alertsResult.rows[0].total}`);
    console.log(`  Active: ${alertsResult.rows[0].active}`);
    console.log(`  Deleted: ${alertsResult.rows[0].deleted}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding status column:', error.message);
    process.exit(1);
  }
}

addStatusColumn();
