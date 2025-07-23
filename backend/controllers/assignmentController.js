const Assignment = require('../models/assignmentModel');
const { validationResult } = require('express-validator');

// ...
const createAssignment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // MODIFIED: Destructure all fields from the request body
  const { 
    depot_id, 
    bus_id, 
    route_id, 
    driver_id, 
    conductor_id,
    assignment_date,
    shift_start_time,
    shift_end_time,
    status
  } = req.body;

  try {
    // MODIFIED: Pass all fields to the model
    const assignment = await Assignment.create({
      depot_id,
      bus_id,
      route_id,
      driver_id,
      conductor_id,
      assignment_date,
      shift_start_time,
      shift_end_time,
      status
    });
    
    res.status(201).json({
      message: 'Assignment created successfully',
      assignment
    });
  } catch (err) {
    console.error('Create assignment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
// ...

const getAssignmentsByDepot = async (req, res) => {
  const { depot_id } = req.params;

  try {
    const assignments = await Assignment.getByDepot(depot_id);
    res.json({
      message: 'Assignments retrieved successfully',
      assignments
    });
  } catch (err) {
    console.error('Get assignments error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateAssignment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { bus_id, route_id, driver_id, conductor_id } = req.body;

  try {
    const assignment = await Assignment.update(id, {
      bus_id,
      route_id,
      driver_id,
      conductor_id
    });
    
    res.json({
      message: 'Assignment updated successfully',
      assignment
    });
  } catch (err) {
    console.error('Update assignment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteAssignment = async (req, res) => {
  const { id } = req.params;

  try {
    await Assignment.delete(id);
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
  getAssignmentsByDepot,
  updateAssignment,
  deleteAssignment
};