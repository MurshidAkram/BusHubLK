// controllers/BusOccupancyController.js
const BusOccupancy = require('../models/BusOccupancyUpdate');

const createBusOccupancy = async (req, res) => {
  try {
    const { busId, occupancyLevel, latitude, longitude, updatedAt, confidence } = req.body;

    if (!busId || !occupancyLevel) {
      return res.status(400).json({ message: 'Bus ID and occupancy level are required.' });
    }

    const newOccupancy = await BusOccupancy.create({
      busId,
      occupancyLevel,
      latitude,
      longitude,
      updatedAt: updatedAt || new Date().toISOString(),
      confidence
    });

    res.status(201).json(newOccupancy);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const getAllBusOccupancies = async (req, res) => {
  try {
    const occupancies = await BusOccupancy.getAllOccupancies();
    if (!occupancies.length) {
      return res.status(200).json([]); // Return empty array if no records
    }
    res.status(200).json(occupancies);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const getBusOccupancy = async (req, res) => {
  try {
    const { busId } = req.params;
    const occupancies = await BusOccupancy.findByBusId(busId);
    
    if (!occupancies.length) {
      return res.status(404).json({ message: 'No occupancy records found for this bus.' });
    }

    res.status(200).json(occupancies);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const updateBusOccupancy = async (req, res) => {
  try {
    const { busId, occupancyId } = req.params;
    const updates = req.body;

    if (!updates.occupancyLevel) {
      return res.status(400).json({ message: 'Occupancy level is required for update.' });
    }

    const updatedOccupancy = await BusOccupancy.findOneAndUpdate(
      occupancyId, busId, // Match model signature
      { ...updates, updatedAt: new Date().toISOString() }
    );

    if (!updatedOccupancy) {
      return res.status(404).json({ message: 'Occupancy record not found or does not belong to this bus.' });
    }

    res.status(200).json(updatedOccupancy);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const deleteBusOccupancy = async (req, res) => {
  try {
    const { busId, occupancyId } = req.params;

    const deletedOccupancy = await BusOccupancy.findOneAndDelete(occupancyId, busId);

    if (!deletedOccupancy) {
      return res.status(404).json({ message: 'Occupancy record not found or does not belong to this bus.' });
    }

    res.status(200).json({ success: true, message: 'Occupancy record deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  createBusOccupancy,
  getAllBusOccupancies,
  getBusOccupancy,
  updateBusOccupancy,
  deleteBusOccupancy,
};