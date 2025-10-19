const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
  // Optimized connection pool settings
  max: 20, // maximum number of clients in the pool
  min: 5,  // minimum number of clients in the pool (increased from 4)
  idleTimeoutMillis: 60000, // 60 seconds (increased from 30s to reduce reconnections)
  connectionTimeoutMillis: 15000, // 15 seconds - increased to handle peak loads
  maxUses: 7500, 
  allowExitOnIdle: false, // Keep pool alive
  statement_timeout: 10000, // 10 seconds - kill queries that run too long
  query_timeout: 10000, // 10 seconds - timeout for query execution
});

// Track connection statistics
let connectionCount = 0;
let lastLogTime = Date.now();

// Add connection error handling
pool.on('error', (err, client) => {
  console.error('❌ Unexpected error on idle client:', err.message);
});

// Log connections but reduce verbosity
pool.on('connect', (client) => {
  connectionCount++;
  const now = Date.now();
  
  // Only log every 10 connections OR every 30 seconds
  if (connectionCount % 10 === 0 || (now - lastLogTime) > 30000) {
    console.log(`📊 Database connections created: ${connectionCount} (Pool: ${pool.totalCount}/${pool.idleCount} total/idle)`);
    lastLogTime = now;
  }
  
  // Set timezone for this connection
  client.query("SET TIME ZONE 'Asia/Colombo';").catch((err) => {
    console.error('❌ Failed to set database time zone:', err.message);
  });
});

// Log when connections are removed
pool.on('remove', (client) => {
  console.log(`🔌 Connection removed from pool (Pool: ${pool.totalCount}/${pool.idleCount} total/idle)`);
});

// Test initial connection and log pool info
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Failed to connect to database:', err.message);
  } else {
    console.log('✅ Database pool initialized successfully');
    console.log(`📊 Pool configuration: ${pool.options.min}-${pool.options.max} connections, ${pool.options.idleTimeoutMillis}ms idle timeout`);
  }
});

// Optional: Log pool stats every 5 minutes in development
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    console.log(`📊 Pool stats: ${pool.totalCount} total, ${pool.idleCount} idle, ${pool.waitingCount} waiting`);
  }, 300000); // 5 minutes
}

module.exports = pool;
