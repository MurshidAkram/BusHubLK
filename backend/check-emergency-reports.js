#!/usr/bin/env node
/**
 * Quick test to verify emergency reports are being saved
 * Run this after restarting backend server
 */

const pool = require('./config/db');

console.log('🔍 Checking emergency report database status...\n');

// Get current max ID
pool.query('SELECT MAX(id) as max_id, COUNT(*) as total FROM emergency_reports', (err, res) => {
  if (err) {
    console.error('❌ Error querying database:', err);
    pool.end();
    return;
  }

  const stats = res.rows[0];
  console.log('📊 Database Statistics:');
  console.log(`   Max Report ID: ${stats.max_id || 'None'}`);
  console.log(`   Total Reports: ${stats.total}`);
  console.log('');

  // Get recent reports
  pool.query(
    'SELECT id, incident_type, status, created_at FROM emergency_reports ORDER BY id DESC LIMIT 5',
    (err2, res2) => {
      if (err2) {
        console.error('❌ Error getting recent reports:', err2);
        pool.end();
        return;
      }

      console.log('📋 Recent Reports:');
      if (res2.rows.length === 0) {
        console.log('   No reports found');
      } else {
        res2.rows.forEach((report, index) => {
          const date = new Date(report.created_at).toLocaleString();
          console.log(`   ${index + 1}. ID: ${report.id} | ${report.incident_type} | ${report.status} | ${date}`);
        });
      }
      console.log('');

      // Check if any reports are missing (gaps in IDs)
      if (res2.rows.length >= 2) {
        const ids = res2.rows.map(r => r.id).sort((a, b) => a - b);
        const gaps = [];
        for (let i = 1; i < ids.length; i++) {
          const diff = ids[i] - ids[i-1];
          if (diff > 1) {
            for (let missing = ids[i-1] + 1; missing < ids[i]; missing++) {
              gaps.push(missing);
            }
          }
        }

        if (gaps.length > 0) {
          console.log('⚠️  Missing Report IDs (rolled back transactions):');
          console.log(`   ${gaps.join(', ')}`);
          console.log('   These reports were created but never committed!\n');
        }
      }

      // Instructions
      console.log('✅ To test the fix:');
      console.log('   1. Press Panic Button in driver app');
      console.log('   2. Watch backend console for: "🔌 Database client released - transaction committed"');
      console.log('   3. Note the Report ID from the alert');
      console.log(`   4. Run: node -e "const pool = require('./config/db'); pool.query('SELECT * FROM emergency_reports WHERE id = [REPORT_ID]', (e,r) => { console.log(r.rows[0] ? '✅ Found!' : '❌ Not found'); pool.end(); })"`);
      console.log('');

      pool.end();
    }
  );
});
