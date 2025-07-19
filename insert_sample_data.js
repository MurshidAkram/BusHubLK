const mysql = require('mysql2/promise');

async function insertSampleData() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'bushublk'
    });
    
    console.log('Connected to database');
    
    // Insert sample data directly
    const insertQuery = `
      INSERT INTO lost_found_reports (
        passenger_id, report_type, item_category, item_description, 
        incident_location, incident_date, incident_time, route_number, 
        bus_registration, contact_phone, contact_email, status, 
        created_at, updated_at
      ) VALUES ?
    `;
    
    const sampleData = [
      // Lost items for passenger 14
      [14, 'lost', 'wallet', 'Brown leather wallet containing driver\'s license, credit cards, and some cash. Has a small tear on the back corner.', 'Main Bus Station - Platform 3', '2024-01-15', '14:30:00', '254', 'NC-1234', '0771234567', 'john.doe@email.com', 'active', new Date(), new Date()],
      [14, 'lost', 'phone', 'Samsung Galaxy S21 in black color with a blue protective case. Screen has a small crack on the top right corner.', 'Colombo Fort Bus Stand', '2024-01-14', '09:15:00', '138', 'NC-5678', '0771234567', 'john.doe@email.com', 'active', new Date(), new Date()],
      [14, 'lost', 'bag', 'Small black backpack containing laptop, charger, and some documents. Brand: Samsonite.', 'Kandy Bus Terminal', '2024-01-13', '16:45:00', '101', 'NC-9012', '0771234567', 'john.doe@email.com', 'active', new Date(), new Date()],
      
      // Found items for passenger 14
      [14, 'found', 'keys', 'Set of house keys with a red keychain that says "Home Sweet Home". About 4-5 keys on the ring.', 'Negombo Bus Station - Waiting Area', '2024-01-16', '11:20:00', '112', 'NC-3456', '0771234567', 'john.doe@email.com', 'active', new Date(), new Date()],
      [14, 'found', 'clothing', 'Blue denim jacket, size Medium. Has a small logo on the chest pocket. Left in seat 15.', 'Pettah Bus Terminal', '2024-01-12', '18:30:00', '120', 'NC-7890', '0771234567', 'john.doe@email.com', 'active', new Date(), new Date()],
      
      // Additional variety
      [15, 'lost', 'electronics', 'White Apple AirPods in charging case. Case has a small dent on one side.', 'Galle Bus Station', '2024-01-11', '13:45:00', '032', 'NC-2468', '0779876543', 'sarah.smith@email.com', 'active', new Date(), new Date()],
      [16, 'found', 'documents', 'National Identity Card belonging to someone with initials R.P. Found under seat 8.', 'Matara Bus Terminal', '2024-01-10', '07:30:00', '032', 'NC-1357', '0778765432', 'mike.wilson@email.com', 'active', new Date(), new Date()],
      [17, 'lost', 'jewelry', 'Gold chain necklace with a small heart pendant. Very sentimental value.', 'Anuradhapura Bus Station', '2024-01-09', '15:20:00', '057', 'NC-9753', '0776543210', 'priya.fernando@email.com', 'active', new Date(), new Date()]
    ];
    
    await connection.query(insertQuery, [sampleData]);
    console.log('Sample data inserted successfully!');
    
    // Verify the data
    const [rows] = await connection.execute('SELECT * FROM lost_found_reports ORDER BY created_at DESC LIMIT 8');
    console.log('Latest reports:');
    rows.forEach(row => {
      console.log(`- ${row.report_type.toUpperCase()}: ${row.item_category} (ID: ${row.report_id}, Passenger: ${row.passenger_id})`);
    });
    
    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

insertSampleData();
