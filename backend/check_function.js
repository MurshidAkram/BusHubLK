const db = require('./config/db');

async function checkFunction() {
  try {
    const result = await db.query(
      `SELECT pg_get_functiondef(oid) as def 
       FROM pg_proc 
       WHERE proname = 'update_bus_position'`
    );
    
    if (result.rows.length > 0) {
      console.log('Function definition:');
      console.log(result.rows[0].def);
    } else {
      console.log('Function not found');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit();
  }
}

checkFunction();
