const db = require('../config/db');

/**
 * Enhanced database connection with retry logic
 */
async function getConnection(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempting database connection (attempt ${i + 1}/${retries})`);
      const client = await db.connect();
      console.log('✅ Database connection successful');
      return client;
    } catch (error) {
      console.error(`❌ Database connection failed (attempt ${i + 1}/${retries}):`, error.message);
      
      if (i === retries - 1) {
        throw error;
      }
      
      // Wait before retry
      const delay = Math.min(1000 * Math.pow(2, i), 5000); // Exponential backoff, max 5s
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Execute query with connection retry
 */
async function executeQuery(query, params = [], retries = 2) {
  let client;
  
  for (let i = 0; i < retries; i++) {
    try {
      client = await getConnection();
      const result = await client.query(query, params);
      return result;
    } catch (error) {
      console.error(`Query execution failed (attempt ${i + 1}/${retries}):`, error.message);
      
      if (i === retries - 1) {
        throw error;
      }
    } finally {
      if (client) {
        client.release();
        client = null;
      }
    }
  }
}

/**
 * Execute transaction with retry logic
 */
async function executeTransaction(transactionFn, retries = 2) {
  let client;
  
  for (let i = 0; i < retries; i++) {
    try {
      client = await getConnection();
      await client.query('BEGIN');
      
      const result = await transactionFn(client);
      
      await client.query('COMMIT');
      console.log('✅ Transaction committed successfully');
      
      return result;
    } catch (error) {
      console.error(`Transaction failed (attempt ${i + 1}/${retries}):`, error.message);
      
      try {
        if (client) {
          await client.query('ROLLBACK');
          console.log('🔄 Transaction rolled back');
        }
      } catch (rollbackError) {
        console.error('❌ Rollback failed:', rollbackError.message);
      }
      
      if (i === retries - 1) {
        throw error;
      }
    } finally {
      if (client) {
        client.release();
        client = null;
      }
    }
  }
}

module.exports = {
  getConnection,
  executeQuery,
  executeTransaction
};
