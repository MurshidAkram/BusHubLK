const DailyAssignment = require('../models/DailyAssignmentModel');

// Get all assignments for a depot
const getAssignmentsByDepot = async (req, res) => {
  const { depot_id } = req.params;
  try {
    const assignments = await DailyAssignment.getAllByDepot(depot_id);
    res.json(assignments);
  } catch (err) {
    console.error('Get assignments error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Create new assignment
const createAssignment = async (req, res) => {
  const { depot_id, bus_id, route_id, driver_id, conductor_id } = req.body;
  if (!depot_id || !bus_id || !route_id || !driver_id || !conductor_id) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  try {
    const assignment = await DailyAssignment.create({ depot_id, bus_id, route_id, driver_id, conductor_id });
    res.status(201).json(assignment);
  } catch (err) {
    console.error('Create assignment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update assignment
const updateAssignment = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    const existing = await DailyAssignment.findById(id);
    if (!existing) return res.status(404).json({ error: 'Assignment not found' });

    const updated = await DailyAssignment.update(id, updates);
    res.json(updated);
  } catch (err) {
    console.error('Update assignment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete assignment
const deleteAssignment = async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await DailyAssignment.findById(id);
    if (!existing) return res.status(404).json({ error: 'Assignment not found' });

    await DailyAssignment.delete(id);
    res.json({ message: 'Assignment deleted', assignment_id: id });
  } catch (err) {
    console.error('Delete assignment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get assignment by driver ID
const getAssignmentByDriver = async (req, res) => {
  const { driver_id } = req.params;
  try {
    const assignment = await DailyAssignment.getByDriverId(driver_id);
    if (!assignment) {
      return res.status(404).json({ error: 'No active assignment found for this driver' });
    }
    res.json(assignment);
  } catch (err) {
    console.error('Get assignment by driver error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get multiple assignments for a driver (upcoming schedules)
const getUpcomingAssignmentsByDriver = async (req, res) => {
  const { driver_id } = req.params;
  const { days = 7 } = req.query; // Default to 7 days
  try {
    const assignments = await DailyAssignment.getUpcomingByDriverId(driver_id, days);
    res.json(assignments);
  } catch (err) {
    console.error('Get upcoming assignments by driver error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all assignments for a route
const getAssignmentsByRoute = async (req, res) => {
  const { route_id } = req.params;
  try {
    const assignments = await DailyAssignment.getAllByRoute(route_id);
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Fetch template slots for a route
const getTemplatesByRoute = async (req, res) => {
  const { route_id } = req.params;
  try {
    const templates = await DailyAssignment.getTemplatesByRoute(route_id);
    res.json({ templates });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Assign a slot
const assignSlot = async (req, res) => {
  const { assignment_id } = req.params;
  const { bus_id, driver_id, conductor_id } = req.body;
  try {
    const updated = await DailyAssignment.assignSlot(assignment_id, { bus_id, driver_id, conductor_id });
    res.json({ assignment: updated });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Soft-delete a slot
const softDeleteSlot = async (req, res) => {
  const { assignment_id } = req.params;
  try {
    const updated = await DailyAssignment.softDeleteSlot(assignment_id);
    res.json({ assignment: updated });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getAssignmentsByDepot,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignmentByDriver,
  getUpcomingAssignmentsByDriver,
  getAssignmentsByRoute,
  getTemplatesByRoute,
  assignSlot,
  softDeleteSlot,
};
