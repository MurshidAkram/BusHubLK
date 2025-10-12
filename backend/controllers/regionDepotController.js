const RegionDepot = require('../models/regionDepotModel');
const pool = require('../config/db');

// Get all regions
const getAllRegions = async (req, res) => {
  try {
    const regions = await RegionDepot.getAllRegions();
    res.json({
      message: 'Regions retrieved successfully',
      regions
    });
  } catch (err) {
    console.error('Get all regions error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get region by ID
const getRegionById = async (req, res) => {
  const { id } = req.params;

  try {
    const region = await RegionDepot.getRegionById(id);
    if (!region) {
      return res.status(404).json({ error: 'Region not found' });
    }

    res.json({
      message: 'Region retrieved successfully',
      region
    });
  } catch (err) {
    console.error('Get region by ID error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Create new region
const createRegion = async (req, res) => {
  const { region_name } = req.body;

  try {
    const newRegion = await RegionDepot.createRegion(region_name);
    res.status(201).json({
      message: 'Region created successfully',
      region: newRegion
    });
  } catch (err) {
    console.error('Create region error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all depots
const getAllDepots = async (req, res) => {
  try {
    const depots = await RegionDepot.getAllDepots();
    res.json({
      message: 'Depots retrieved successfully',
      depots
    });
  } catch (err) {
    console.error('Get all depots error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get depot by ID
const getDepotById = async (req, res) => {
  const { id } = req.params;

  try {
    const depot = await RegionDepot.getDepotById(id);
    if (!depot) {
      return res.status(404).json({ error: 'Depot not found' });
    }

    res.json({
      message: 'Depot retrieved successfully',
      depot
    });
  } catch (err) {
    console.error('Get depot by ID error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get depots by region
const getDepotsByRegion = async (req, res) => {
  const { region_id } = req.params;

  try {
    const depots = await RegionDepot.getDepotsByRegion(region_id);
    res.json({
      message: 'Depots retrieved successfully',
      depots
    });
  } catch (err) {
    console.error('Get depots by region error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Create new depot
const createDepot = async (req, res) => {
  const { depot_name, region_id, address, contact_phone, latitude, longitude } = req.body;

  try {
    const newDepot = await RegionDepot.createDepot({
      depot_name,
      region_id,
      address,
      contact_phone,
      latitude,
      longitude
    });

    res.status(201).json({
      message: 'Depot created successfully',
      depot: newDepot
    });
  } catch (err) {
    console.error('Create depot error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update depot
const updateDepot = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const updatedDepot = await RegionDepot.updateDepot(id, updates);
    res.json({
      message: 'Depot updated successfully',
      depot: updatedDepot
    });
  } catch (err) {
    console.error('Update depot error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete depot
const deleteDepot = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedDepot = await RegionDepot.deleteDepot(id);
    res.json({
      message: 'Depot deleted successfully',
      depot: deletedDepot
    });
  } catch (err) {
    console.error('Delete depot error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get depot service monitor data with bus status counts and last inspection dates
const getDepotServiceMonitor = async (req, res) => {
  try {
    const { region_id } = req.params;
    const user = req.user; // From JWT middleware

    let depots;

    // If user is regional_tech, only get depots from their region
    if (user.role === 'regional_tech') {
      // Get depots for this regional technical officer
      const userDepots = await RegionDepot.getDepotsByRegionForUser(user.userId);
      depots = userDepots;
    } else if (region_id) {
      // If region_id is provided, get depots for that region
      depots = await RegionDepot.getDepotsByRegion(region_id);
    } else {
      // Otherwise get all depots (for admin users)
      depots = await RegionDepot.getAllDepots();
    }

    // For each depot, get bus status counts and last inspection date
    const depotServiceData = await Promise.all(
      depots.map(async (depot) => {
        try {
          // Get bus status counts for this depot
          const busStatusResults = await RegionDepot.getBusStatusCounts(depot.depot_id);

          // Get last completed inspection date for this depot
          const lastInspectionResult = await RegionDepot.getLastInspectionDate(depot.depot_id);

          // Get detailed bus information for this depot
          const buses = await RegionDepot.getBusDetailsByDepot(depot.depot_id);

          return {
            depot: depot.depot_name,
            depot_id: depot.depot_id,
            region_name: depot.region_name,
            active: parseInt(busStatusResults.active) || 0,
            in_service: parseInt(busStatusResults.in_service) || 0,
            out_of_service: parseInt(busStatusResults.out_of_service) || 0,
            under_maintenance: parseInt(busStatusResults.under_maintenance) || 0,
            lastInspection: lastInspectionResult?.last_inspection_date || 'Never',
            buses
          };
        } catch (error) {
          console.error(`Error getting service data for depot ${depot.depot_id}:`, error);
          return {
            depot: depot.depot_name,
            depot_id: depot.depot_id,
            region_name: depot.region_name,
            active: 0,
            in_service: 0,
            out_of_service: 0,
            under_maintenance: 0,
            lastInspection: 'Error',
            buses: []
          };
        }
      })
    );

    res.json({
      message: 'Depot service monitor data retrieved successfully',
      depots: depotServiceData
    });
  } catch (err) {
    console.error('Get depot service monitor error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getAllRegions,
  getRegionById,
  createRegion,
  getAllDepots,
  getDepotById,
  getDepotsByRegion,
  createDepot,
  updateDepot,
  deleteDepot,
  getDepotServiceMonitor
};