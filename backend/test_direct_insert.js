const db = require('./config/db');

async function testDirectInsert() {
  console.log('🧪 Testing Direct Database Insert...\n');

  let client;
  try {
    // Test direct database insert
    console.log('1. 🔗 Getting database connection...');
    client = await db.connect();
    await client.query('BEGIN');
    console.log('✅ Transaction started');

    const testData = {
      passenger_id: 14,
      report_type: 'lost',
      item_category: 'database_test',
      item_description: 'Direct DB Test - ' + Date.now(),
      route_number: '999',
      region_id: null,
      incident_date: '2025-07-20',
      incident_time: '10:30:00',
      contact_email: 'test@test.com',
      contact_phone: '0771234567',
      reward_offered: 0,
      report_reference: 'direct-test-' + Date.now()
    };

    console.log('2. 📝 Inserting test report...');
    const insertQuery = `
      INSERT INTO lost_found_reports (
        passenger_id, report_type, item_category, item_description,
        route_number, region_id, incident_date, incident_time,
        contact_email, contact_phone, reward_offered, item_photo_url, report_reference
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING report_id, report_reference
    `;

    const values = [
      testData.passenger_id,
      testData.report_type,
      testData.item_category,
      testData.item_description,
      testData.route_number,
      testData.region_id,
      testData.incident_date,
      testData.incident_time,
      testData.contact_email,
      testData.contact_phone,
      testData.reward_offered,
      null, // photo
      testData.report_reference
    ];

    console.log('📊 Insert values:', values);

    const result = await client.query(insertQuery, values);
    const newReport = result.rows[0];
    console.log('✅ Insert successful, report_id:', newReport.report_id);

    // Verify the insert
    console.log('3. 🔍 Verifying insert...');
    const verifyResult = await client.query(
      'SELECT report_id, item_category, item_description FROM lost_found_reports WHERE report_id = $1',
      [newReport.report_id]
    );

    if (verifyResult.rows.length > 0) {
      console.log('✅ Verification successful:', verifyResult.rows[0]);
    } else {
      console.log('❌ Verification failed - record not found');
    }

    // Commit transaction
    await client.query('COMMIT');
    console.log('✅ Transaction committed');

    // Final check outside transaction
    console.log('4. 🔍 Final verification (separate connection)...');
    const finalCheck = await db.query(
      'SELECT report_id, item_category, item_description FROM lost_found_reports WHERE item_category = $1',
      ['database_test']
    );

    if (finalCheck.rows.length > 0) {
      console.log('✅ Final verification successful!');
      console.log('📊 Found', finalCheck.rows.length, 'database_test reports');
      finalCheck.rows.forEach(r => 
        console.log(`   - ID: ${r.report_id}, Description: ${r.item_description}`)
      );
    } else {
      console.log('❌ Final verification failed - no records found');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
    
    if (client) {
      try {
        await client.query('ROLLBACK');
        console.log('🔄 Transaction rolled back');
      } catch (rollbackError) {
        console.error('❌ Rollback failed:', rollbackError.message);
      }
    }
  } finally {
    if (client) {
      client.release();
      console.log('🔌 Database connection released');
    }
  }

  process.exit();
}

testDirectInsert();
