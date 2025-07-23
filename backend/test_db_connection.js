// Simple database test to check if live tracking table exists
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...');
    console.log('Connecting to:', process.env.DB_HOST);
    
    // Test basic connection
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    
    // Check if bus_live_tracking table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'bus_live_tracking'
      );
    `);
    
    console.log('📊 bus_live_tracking table exists:', tableExists.rows[0].exists);
    
    // Check other required tables
    const tables = ['buses', 'routes', 'dailyassignment'];
    for (let table of tables) {
      const exists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [table]);
      console.log(`📊 ${table} table exists:`, exists.rows[0].exists);
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await pool.end();
  }
}

testDatabase();
