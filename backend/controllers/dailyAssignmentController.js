const DailyAssignment = require('../models/DailyAssignmentModel');
const Bus = require('../models/busModel');
const Route = require('../models/routeModel');
const User = require('../models/userModel');

const createAssignment = async (req, res) => {
  const { date, bus_id, route_id, driver_id, conductor_id, notes } = req.body;
  const depot_id = req.user.depot_id;
  const created_by = req.user.userId;

  try {
    // Validate all IDs exist and belong to the depot
    const [bus, route, driver, conductor] = await Promise.all([
      Bus.findById(bus_id),
      Route.findById(route_id),
      User.findById(driver_id),
      User.findById(conductor_id)
    ]);

    if (!bus || bus.depot_id != depot_id) {
      return res.status(400).json({ error: 'Invalid bus selection' });
    }
    if (bus.status !== 'Active') {
      return res.status(400).json({ error: 'Only Active buses can be assigned' });
    }

    // For routes, since they don't have depot_id in your schema, you might need to add that
    // For now, we'll skip route validation

    if (!driver || driver.role !== 'driver') {
      return res.status(400).json({ error: 'Invalid driver selection' });
    }

    if (!conductor || conductor.role !== 'conductor') {
      return res.status(400).json({ error: 'Invalid conductor selection' });
    }

    const newAssignment = await DailyAssignment.create({
      date,
      bus_id,
      route_id,
      driver_id,
      conductor_id,
      depot_id,
      created_by,
      notes
    });

    res.status(201).json({
      message: 'Assignment created successfully',
      assignment: newAssignment
    });
  } catch (err) {
    console.error('Create assignment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getDailyAssignments = async (req, res) => {
  const { date } = req.query;
  const depot_id = req.user.depot_id;
  const currentDate = date || new Date().toISOString().split('T')[0];

  try {
    const assignments = await DailyAssignment.getByDepotAndDate(depot_id, currentDate);
    res.json({
      message: 'Assignments retrieved successfully',
      assignments
    });
  } catch (err) {
    console.error('Get assignments error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getAssignmentOptions = async (req, res) => {
  const { date } = req.query;
  const depot_id = req.user.depot_id;
  const currentDate = date || new Date().toISOString().split('T')[0];

  try {
    const [buses, routes, drivers, conductors] = await Promise.all([
      DailyAssignment.getAvailableBuses(depot_id, currentDate),
      Route.getAll(), // You might want to filter by depot if routes are depot-specific
      DailyAssignment.getAvailableDrivers(depot_id, currentDate),
      DailyAssignment.getAvailableConductors(depot_id, currentDate)
    ]);

    res.json({
      message: 'Assignment options retrieved successfully',
      options: {
        buses,
        routes,
        drivers,
        conductors
      }
    });
  } catch (err) {
    console.error('Get assignment options error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateAssignmentStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const depot_id = req.user.depot_id;

  try {
    // First verify the assignment belongs to the user's depot
    const assignment = await DailyAssignment.getById(id);
    if (!assignment || assignment.depot_id !== depot_id) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const updated = await DailyAssignment.updateStatus(id, status);
    res.json({
      message: 'Assignment status updated successfully',
      assignment: updated
    });
  } catch (err) {
    console.error('Update assignment status error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteAssignment = async (req, res) => {
  const { id } = req.params;
  const depot_id = req.user.depot_id;

  try {
    // First verify the assignment belongs to the user's depot
    const assignment = await DailyAssignment.getById(id);
    if (!assignment || assignment.depot_id !== depot_id) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    await DailyAssignment.delete(id);
    res.json({
      message: 'Assignment deleted successfully',
      assignment_id: id
    });
  } catch (err) {
    console.error('Delete assignment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  createAssignment,
  getDailyAssignments,
  getAssignmentOptions,
  updateAssignmentStatus,
  deleteAssignment
};