const DailyAssignment = require('../models/DailyAssignmentModel');
const db = require('../config/db');

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
    const result = await db.query(
      `SELECT da.assignment_id, da.bus_id, b.registration_number AS bus_registration, b.class AS bus_type,
              da.driver_id, CONCAT(udriver.first_name, ' ', udriver.last_name) AS driver_name,
              da.conductor_id, CONCAT(uconductor.first_name, ' ', uconductor.last_name) AS conductor_name,
              da.status, da.shift_start_time, da.shift_end_time, da.assignment_date
       FROM dailyassignment da
       LEFT JOIN buses b ON da.bus_id = b.bus_id
       LEFT JOIN users udriver ON da.driver_id = udriver.user_id
       LEFT JOIN users uconductor ON da.conductor_id = uconductor.user_id
       WHERE da.route_id = $1 AND da.is_active = TRUE`,
      [route_id]
    );
    res.json({ assignments: result.rows });
  } catch (err) {
    console.error('getAssignmentsByRoute error:', err);
    res.status(500).json({ error: 'Failed to fetch assignments' });
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
  console.log('assignSlot controller called', req.params, req.body);
  const { assignment_id } = req.params;
  const { bus_id, driver_id, conductor_id } = req.body;
  try {
    await DailyAssignment.assignSlot(assignment_id, { bus_id, driver_id, conductor_id });
    // then fetches the updated assignment with a SQL query
    const db = require('../config/db');
    const result = await db.query(
      `SELECT da.assignment_id, da.bus_id, b.registration_number AS bus_registration, b.class AS bus_type,
              da.driver_id, CONCAT(udriver.first_name, ' ', udriver.last_name) AS driver_name,
              da.conductor_id, CONCAT(uconductor.first_name, ' ', uconductor.last_name) AS conductor_name,
              da.status, da.shift_start_time, da.shift_end_time, da.assignment_date
       FROM dailyassignment da
       JOIN buses b ON da.bus_id = b.bus_id
       JOIN users udriver ON da.driver_id = udriver.user_id
       LEFT JOIN users uconductor ON da.conductor_id = uconductor.user_id
       WHERE da.assignment_id = $1`,
      [assignment_id]
    );
    res.json({ assignment: result.rows[0] });
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

// Create a new template slot for a route
const createTemplateSlot = async (req, res) => {
  const { depot_id, route_id, shift_start_time, shift_end_time } = req.body;

  // Add validation
  if (!depot_id || !route_id || !shift_start_time || !shift_end_time) {
    return res.status(400).json({
      error: 'Missing required fields: depot_id, route_id, shift_start_time, shift_end_time'
    });
  }

  try {
    const result = await DailyAssignment.createTemplateSlot({ depot_id, route_id, shift_start_time, shift_end_time });
    res.status(201).json({ assignment: result });
  } catch (err) {
    console.error('createTemplateSlot error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Update a template slot
const updateTemplateSlot = async (req, res) => {
  const { assignment_id } = req.params;
  const { shift_start_time, shift_end_time } = req.body;
  if (!shift_start_time || !shift_end_time) {
    return res.status(400).json({ error: 'Both start and end time are required' });
  }
  try {
    const updated = await DailyAssignment.updateTemplateSlot(assignment_id, shift_start_time, shift_end_time);
    res.json({ assignment: updated });
  } catch (err) {
    console.error('updateTemplateSlot error:', err); // <--- Add this for debugging
    res.status(500).json({ error: 'Server error' });
  }
};

// Assign a slot from template (copy template for a real day)
const assignSlotFromTemplate = async (req, res) => {
  const { assignment_id } = req.params;
  const { depot_id, bus_id, driver_id, conductor_id, assignment_date } = req.body;
  if (!depot_id || !bus_id || !driver_id || !conductor_id || !assignment_date) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  try {
    const assignment = await DailyAssignment.assignSlotFromTemplate(
      assignment_id,
      { depot_id, bus_id, driver_id, conductor_id, assignment_date }
    );
    // Fetch the full assignment with joins
    const db = require('../config/db');
    const result = await db.query(
      `SELECT da.assignment_id, da.bus_id, b.registration_number AS bus_registration, b.class AS bus_type,
              da.driver_id, CONCAT(udriver.first_name, ' ', udriver.last_name) AS driver_name,
              da.conductor_id, CONCAT(uconductor.first_name, ' ', uconductor.last_name) AS conductor_name,
              da.status, da.shift_start_time, da.shift_end_time, da.assignment_date
       FROM dailyassignment da
       JOIN buses b ON da.bus_id = b.bus_id
       JOIN users udriver ON da.driver_id = udriver.user_id
       LEFT JOIN users uconductor ON da.conductor_id = uconductor.user_id
       WHERE da.assignment_id = $1`,
      [assignment.assignment_id]
    );
    res.status(201).json({ assignment: result.rows[0] });
  } catch (err) {
    console.error('assignSlotFromTemplate error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Get available drivers for a depot on a specific date
const getAvailableDrivers = async (req, res) => {
  const { depot_id, date } = req.query;
  try {
    const result = await db.query(
      `SELECT u.user_id AS id, u.first_name, u.last_name
       FROM users u
       JOIN drivers d ON u.user_id = d.driver_id
       WHERE d.depot_id = $1
         AND u.is_active = TRUE
         AND u.user_id NOT IN (
           SELECT driver_id FROM dailyassignment
           WHERE assignment_date = $2 AND is_active = TRUE
         )`,
      [depot_id, date]
    );
    res.json({ drivers: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch available drivers' });
  }
};

// Get available conductors for a depot on a specific date
const getAvailableConductors = async (req, res) => {
  const { depot_id, date } = req.query;
  try {
    const result = await db.query(
      `SELECT u.user_id AS id, u.first_name, u.last_name
       FROM users u
       JOIN conductors c ON u.user_id = c.conductor_id
       WHERE c.depot_id = $1
         AND u.is_active = TRUE
         AND u.user_id NOT IN (
           SELECT conductor_id FROM dailyassignment
           WHERE assignment_date = $2 AND is_active = TRUE
         )`,
      [depot_id, date]
    );
    res.json({ conductors: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch available conductors' });
  }
};

// Get available buses for a depot on a specific date
const getAvailableBuses = async (req, res) => {
  const { depot_id, date } = req.query;
  try {
    const result = await db.query(
      `SELECT b.bus_id, b.registration_number, b.class AS bus_type
       FROM buses b
       WHERE b.depot_id = $1
         AND b.is_active = TRUE
         AND b.status = 'Active'
         AND b.bus_id NOT IN (
           SELECT bus_id FROM dailyassignment
           WHERE assignment_date = $2 AND is_active = TRUE
         )`,
      [depot_id, date]
    );
    res.json({ buses: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch available buses' });
  }
};

// Get daily schedule for a route
const getDailyScheduleForRoute = async (req, res) => {
  const { route_id } = req.params;
  const { date } = req.query;
  try {
    // 1. Get all template slots for this route
    const templatesRes = await db.query(
      `SELECT assignment_id, shift_start_time, shift_end_time
       FROM dailyassignment
       WHERE route_id = $1 AND status = 'template' AND is_active = TRUE
       ORDER BY shift_start_time ASC`,
      [route_id]
    );
    const templates = templatesRes.rows;

    // 2. Get all assignments for this route and date
    const assignmentsRes = await db.query(
      `SELECT da.assignment_id, da.bus_id, b.registration_number AS bus_registration, b.class AS bus_type,
              da.driver_id, CONCAT(udriver.first_name, ' ', udriver.last_name) AS driver_name,
              da.conductor_id, CONCAT(uconductor.first_name, ' ', uconductor.last_name) AS conductor_name,
              da.status, da.shift_start_time, da.shift_end_time, da.assignment_date
       FROM dailyassignment da
       LEFT JOIN buses b ON da.bus_id = b.bus_id
       LEFT JOIN users udriver ON da.driver_id = udriver.user_id
       LEFT JOIN users uconductor ON da.conductor_id = uconductor.user_id
       WHERE da.route_id = $1 AND da.assignment_date = $2 AND da.is_active = TRUE
       ORDER BY da.shift_start_time ASC`,
      [route_id, date]
    );
    const assignments = assignmentsRes.rows;

    // 3. Merge: for each template slot, if assignment exists for that time, use assignment; else, use template
    const schedule = templates.map(tpl => {
      const found = assignments.find(
        a => a.shift_start_time === tpl.shift_start_time && a.shift_end_time === tpl.shift_end_time
      );
      if (found) {
        return { ...tpl, assignment: found };
      } else {
        return { ...tpl, assignment: null };
      }
    });

    res.json({ schedule });
  } catch (err) {
    console.error('getDailyScheduleForRoute error:', err);
    res.status(500).json({ error: 'Failed to fetch daily schedule' });
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
  createTemplateSlot,
  updateTemplateSlot,
  assignSlotFromTemplate,
  getAvailableDrivers,
  getAvailableConductors,
  getAvailableBuses,
  getDailyScheduleForRoute,
};
