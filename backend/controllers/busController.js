const Bus = require('../models/busModel');
const RegionDepot = require('../models/regionDepotModel');
const { validationResult } = require('express-validator');

// Get all buses
const getAllBuses = async (req, res) => {
  try {
    const buses = await Bus.getAll();
    res.json({
      message: 'Buses retrieved successfully',
      buses
    });
  } catch (err) {
    console.error('Get all buses error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get bus by ID
const getBusById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const bus = await Bus.findById(id);
    if (!bus) {
      return res.status(404).json({ error: 'Bus not found' });
    }
    
    res.json({
      message: 'Bus retrieved successfully',
      bus
    });
  } catch (err) {
    console.error('Get bus by ID error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get buses by depot
const getBusesByDepot = async (req, res) => {
  const { depot_id } = req.params;
  
  try {
    const buses = await Bus.getByDepot(depot_id);
    res.json({
      message: 'Buses retrieved successfully',
      buses
    });
  } catch (err) {
    console.error('Get buses by depot error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get buses by region
const getBusesByRegion = async (req, res) => {
  const { region_id } = req.params;
  
  try {
    const buses = await Bus.getByRegion(region_id);
    res.json({
      message: 'Buses retrieved successfully',
      buses
    });
  } catch (err) {
    console.error('Get buses by region error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get buses by status
const getBusesByStatus = async (req, res) => {
  const { status } = req.params;
  
  try {
    const buses = await Bus.getByStatus(status);
    res.json({
      message: 'Buses retrieved successfully',
      buses
    });
  } catch (err) {
    console.error('Get buses by status error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get buses by class
const getBusesByClass = async (req, res) => {
  const { class: busClass } = req.params;
  
  try {
    const buses = await Bus.getByClass(busClass);
    res.json({
      message: 'Buses retrieved successfully',
      buses
    });
  } catch (err) {
    console.error('Get buses by class error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Search buses
const searchBuses = async (req, res) => {
  const { query } = req.query;
  
  try {
    const buses = await Bus.search(query);
    res.json({
      message: 'Buses retrieved successfully',
      buses
    });
  } catch (err) {
    console.error('Search buses error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Create new bus
const createBus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    registration_number,
    depot_id,
    class: busClass,
    manufacturer,
    model,
    year,
    mileage,
    status,
    purchase_date
  } = req.body;

  try {
    // Check if registration number already exists
    const existingBus = await Bus.findByRegistration(registration_number);
    if (existingBus) {
      return res.status(400).json({ error: 'Bus with this registration number already exists' });
    }

    // In createBus controller
const newBus = await Bus.create({
  registration_number,
  depot_id,
  class: busClass,
  manufacturer,
  model: model || null,  // Handle optional fields
  year,
  mileage: mileage || 0,
  status: status || 'Active',
  purchase_date: purchase_date || null
});

    res.status(201).json({
      message: 'Bus created successfully',
      bus: newBus
    });
  } catch (err) {
    console.error('Create bus error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update bus
const updateBus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const updates = req.body;

  try {
    // Check if bus exists
    const existingBus = await Bus.findById(id);
    if (!existingBus) {
      return res.status(404).json({ error: 'Bus not found' });
    }

    // Check if updating registration number and it's already taken
    if (updates.registration_number && updates.registration_number !== existingBus.registration_number) {
      const busWithReg = await Bus.findByRegistration(updates.registration_number);
      if (busWithReg && busWithReg.bus_id !== parseInt(id)) {
        return res.status(400).json({ error: 'Registration number already in use' });
      }
    }

    const updatedBus = await Bus.update(id, updates);
    
    res.json({
      message: 'Bus updated successfully',
      bus: updatedBus
    });
  } catch (err) {
    console.error('Update bus error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete bus
const deleteBus = async (req, res) => {
  const { id } = req.params;

  try {
    const bus = await Bus.findById(id);
    if (!bus) {
      return res.status(404).json({ error: 'Bus not found' });
    }

    await Bus.delete(id);
    
    res.json({
      message: 'Bus deleted successfully',
      bus_id: id
    });
  } catch (err) {
    console.error('Delete bus error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getAllBuses,
  getBusById,
  getBusesByDepot,
  getBusesByRegion,
  getBusesByStatus,
  getBusesByClass,
  searchBuses,
  createBus,
  updateBus,
  deleteBus
};