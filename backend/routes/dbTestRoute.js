const express = require('express');
const router = express.Router();
const db = require('../models/db');

router.get('/dbtest', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({ status: '✅ Connected', time: result.rows[0].now });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: '❌ Connection failed', error: error.message });
  }
});

module.exports = router;
