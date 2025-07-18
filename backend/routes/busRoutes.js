const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Get all buses
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT bus_id, registration_number, depot_id, status, purchase_date, is_active
       FROM buses 
       WHERE is_active = true
       ORDER BY registration_number`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching buses:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch buses',
      details: error.message 
    });
  }
});

// Get bus by ID
router.get('/:busId', async (req, res) => {
  try {
    const { busId } = req.params;
    const result = await pool.query(
      `SELECT bus_id, registration_number, depot_id, status, purchase_date, is_active
       FROM buses 
       WHERE bus_id = $1 AND is_active = true`,
      [busId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Bus not found' 
      });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching bus:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch bus',
      details: error.message 
    });
  }
});

// Get buses by depot
router.get('/depot/:depotId', async (req, res) => {
  try {
    const { depotId } = req.params;
    const result = await pool.query(
      `SELECT bus_id, registration_number, depot_id, status, purchase_date, is_active
       FROM buses 
       WHERE depot_id = $1 AND is_active = true
       ORDER BY registration_number`,
      [depotId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching buses by depot:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch buses by depot',
      details: error.message 
    });
  }
});

module.exports = router;
