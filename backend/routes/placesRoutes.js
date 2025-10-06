const express = require('express');
const router = express.Router();
const axios = require('axios');

// Google Places API Key - Store in .env file for security
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || 'AIzaSyAeXR9ct7HrHMCQXSWLrWQl5OlRYjNhbxo';

/**
 * @route   GET /api/places/autocomplete
 * @desc    Get place autocomplete suggestions for Sri Lanka
 * @access  Public
 * @query   input - The search text
 */
router.get('/autocomplete', async (req, res) => {
  try {
    const { input } = req.query;

    // Validate input
    if (!input || input.trim().length === 0) {
      return res.status(400).json({
        status: 'INVALID_REQUEST',
        error_message: 'Input parameter is required',
        predictions: []
      });
    }

    // Call Google Places API from server-side
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/autocomplete/json',
      {
        params: {
          input: input.trim(),
          components: 'country:LK', // Restrict to Sri Lanka
          language: 'en',
          key: GOOGLE_PLACES_API_KEY
        },
        timeout: 5000 // 5 second timeout
      }
    );

    // Return the Google API response to the mobile app
    return res.json(response.data);

  } catch (error) {
    console.error('Google Places API Error:', error.message);
    
    // Handle axios errors
    if (error.response) {
      // Google API returned an error
      return res.status(error.response.status).json({
        status: 'ERROR',
        error_message: error.response.data?.error_message || 'Google Places API error',
        predictions: []
      });
    }
    
    // Network or other errors
    return res.status(500).json({
      status: 'ERROR',
      error_message: 'Failed to fetch place suggestions',
      predictions: []
    });
  }
});

/**
 * @route   GET /api/places/details
 * @desc    Get place details by place_id
 * @access  Public
 * @query   place_id - The Google Place ID
 */
router.get('/details', async (req, res) => {
  try {
    const { place_id } = req.query;

    if (!place_id) {
      return res.status(400).json({
        status: 'INVALID_REQUEST',
        error_message: 'place_id parameter is required'
      });
    }

    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/details/json',
      {
        params: {
          place_id,
          fields: 'name,formatted_address,geometry,place_id',
          key: GOOGLE_PLACES_API_KEY
        },
        timeout: 5000
      }
    );

    return res.json(response.data);

  } catch (error) {
    console.error('Google Places Details API Error:', error.message);
    
    if (error.response) {
      return res.status(error.response.status).json({
        status: 'ERROR',
        error_message: error.response.data?.error_message || 'Google Places API error'
      });
    }
    
    return res.status(500).json({
      status: 'ERROR',
      error_message: 'Failed to fetch place details'
    });
  }
});

module.exports = router;
