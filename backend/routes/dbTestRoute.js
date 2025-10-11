const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/dbtest', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({ status: '✅ Connected', time: result.rows[0].now });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: '❌ Connection failed', error: error.message });
  }
});

// Add database info endpoint
router.get('/db-info', async (req, res) => {
  try {
    const queries = [
      'SELECT current_database() as database_name',
      'SELECT current_user as current_user',
      'SELECT version() as version',
      'SELECT COUNT(*) as total_reports FROM lost_found_reports',
      'SELECT MAX(report_id) as max_report_id FROM lost_found_reports',
      'SELECT COUNT(*) as recent_reports FROM lost_found_reports WHERE created_at > NOW() - INTERVAL \'1 hour\'',
      'SELECT current_setting(\'server_version\') as server_version',
      'SELECT pg_current_wal_lsn() as wal_lsn'
    ];
    
    const results = {};
    for (const query of queries) {
      const result = await db.query(query);
      const key = query.split(' ')[1].replace('()', '').replace(' as', '');
      results[key] = result.rows[0];
    }
    
    res.json({ 
      status: '✅ Database Info', 
      info: results 
    });
  } catch (error) {
    console.error('Database info error:', error);
    res.status(500).json({ status: '❌ Info failed', error: error.message });
  }
});

// Add connection test with INSERT/SELECT cycle
router.post('/test-insert-cycle', async (req, res) => {
  try {
    const testId = Date.now();
    const testDescription = `Test insert cycle ${testId}`;
    
    console.log('🧪 Starting INSERT/SELECT test cycle...');
    
    // Step 1: Insert test record
    const insertResult = await db.query(`
      INSERT INTO lost_found_reports (
        passenger_id, report_type, item_category, item_description,
        incident_date, incident_time, contact_phone, report_reference
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING report_id, report_reference
    `, [25, 'lost', 'test', testDescription, '2025-01-20', '12:00:00', '1234567890', `test-${testId}`]);
    
    const insertedId = insertResult.rows[0].report_id;
    console.log('✅ Insert successful, ID:', insertedId);
    
    // Step 2: Immediately verify with same connection pool
    const immediateVerify = await db.query(`
      SELECT report_id, item_description FROM lost_found_reports 
      WHERE report_id = $1
    `, [insertedId]);
    
    console.log('🔍 Immediate verify result:', immediateVerify.rows.length);
    
    // Step 3: Wait and verify with fresh connection
    await new Promise(resolve => setTimeout(resolve, 100));
    const freshClient = await db.connect();
    
    let delayedVerify;
    try {
      delayedVerify = await freshClient.query(`
        SELECT report_id, item_description FROM lost_found_reports 
        WHERE report_id = $1
      `, [insertedId]);
      console.log('🔍 Fresh connection verify result:', delayedVerify.rows.length);
    } finally {
      freshClient.release();
    }
    
    // Step 4: Clean up test record
    await db.query(`DELETE FROM lost_found_reports WHERE report_id = $1`, [insertedId]);
    console.log('🧹 Test record cleaned up');
    
    res.json({
      status: '✅ Insert/Select Test Complete',
      results: {
        inserted_id: insertedId,
        immediate_verify: immediateVerify.rows.length > 0,
        delayed_verify: delayedVerify.rows.length > 0,
        consistency_issue: immediateVerify.rows.length !== delayedVerify.rows.length
      }
    });
    
  } catch (error) {
    console.error('🚨 Test cycle failed:', error);
    res.status(500).json({ 
      status: '❌ Test failed', 
      error: error.message,
      code: error.code 
    });
  }
});

module.exports = router;
