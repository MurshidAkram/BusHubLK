const db = require('../config/db');

async function addResolvedDateColumn() {
  const client = await db.connect();
  
  try {
    console.log('🔧 Adding resolved_date column to lost_found_reports table...');
    
    // Check if column already exists
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'lost_found_reports' 
      AND column_name = 'resolved_date'
    `);
    
    if (checkColumn.rows.length > 0) {
      console.log('✅ Column resolved_date already exists');
      return;
    }
    
    // Add the column
    await client.query(`
      ALTER TABLE lost_found_reports 
      ADD COLUMN resolved_date TIMESTAMP DEFAULT NULL
    `);
    
    console.log('✅ Column resolved_date added successfully');
    
    // Add index for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_lost_found_reports_resolved_date 
      ON lost_found_reports(resolved_date)
    `);
    
    console.log('✅ Index created for resolved_date column');
    
    // Add comment
    await client.query(`
      COMMENT ON COLUMN lost_found_reports.resolved_date 
      IS 'Timestamp when the report was marked as resolved by the user'
    `);
    
    console.log('✅ Column comment added');
    
    // Verify the column was added
    const verifyColumn = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'lost_found_reports' 
      AND column_name = 'resolved_date'
    `);
    
    if (verifyColumn.rows.length > 0) {
      console.log('🎉 Migration completed successfully!');
      console.log('Column details:', verifyColumn.rows[0]);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  addResolvedDateColumn()
    .then(() => {
      console.log('🏁 Migration finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = addResolvedDateColumn;
