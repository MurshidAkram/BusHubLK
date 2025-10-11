const { validationResult } = require('express-validator');
const User = require('../models/userModel');

// Get all users (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.getAll();
    res.json({
      message: 'Users retrieved successfully',
      users: users.map(user => ({
        id: user.user_id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        role: user.role_name,
        is_active: user.is_active,
        last_login: user.last_login,
        created_at: user.created_at
      }))
    });
  } catch (err) {
    console.error('Get all users error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        role: user.role_name,
        is_active: user.is_active,
        last_login: user.last_login,
        created_at: user.created_at
      }
    });
  } catch (err) {
    console.error('Get user by ID error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get users by role
const getUsersByRole = async (req, res) => {
  const { role } = req.params;
  
  try {
    const users = await User.getUsersByRole(role);
    res.json({
      message: `Users with role ${role} retrieved successfully`,
      users: users.map(user => ({
        id: user.user_id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        role: user.role_name,
        is_active: user.is_active,
        last_login: user.last_login,
        created_at: user.created_at
      }))
    });
  } catch (err) {
    console.error('Get users by role error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get users by depot
const getUsersByDepot = async (req, res) => {
  const { depot_id } = req.params;
  
  try {
    const users = await User.getUsersByDepot(depot_id);
    res.json({
      message: `Users in depot ${depot_id} retrieved successfully`,
      users: users.map(user => ({
        id: user.user_id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        role: user.role_name,
        is_active: user.is_active,
        last_login: user.last_login,
        created_at: user.created_at
      }))
    });
  } catch (err) {
    console.error('Get users by depot error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get users by region
const getUsersByRegion = async (req, res) => {
  const { region_id } = req.params;
  
  try {
    const users = await User.getUsersByRegion(region_id);
    res.json({
      message: `Users in region ${region_id} retrieved successfully`,
      users: users.map(user => ({
        id: user.user_id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        role: user.role_name,
        is_active: user.is_active,
        last_login: user.last_login,
        created_at: user.created_at
      }))
    });
  } catch (err) {
    console.error('Get users by region error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update user (Admin only)
// In userController.js, update the updateUser function:
const updateUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { first_name, last_name, phone, role_name, role_data } = req.body;

  try {
    // Check if user exists
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get the new role
    const newRole = await User.findRoleByName(role_name || existingUser.role_name);
    if (!newRole) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Update user basic info
    const updatedUser = await User.updateUser(id, {
      first_name,
      last_name,
      phone,
      role_id: newRole.role_id
    });

    // If role changed, update role-specific data
    if (role_name && role_name !== existingUser.role_name) {
      // First, delete old role-specific entry
      // (You'll need to implement this in your User model)
      await User.deleteRoleSpecificEntry(existingUser.user_id, existingUser.role_name);
      
      // Then create new role-specific entry
      if (role_name !== 'passenger' && role_name !== 'admin') {
        await User.createRoleSpecificEntry(id, role_name, role_data || {});
      }
    } else if (role_data && 
      ['regional_tech', 'regional_operations', 'depot_manager', 
       'depot_operations', 'depot_engineer', 'driver', 'conductor'].includes(existingUser.role_name)) {
      // Update role-specific data if role didn't change
      await User.updateRoleSpecificEntry(id, existingUser.role_name, role_data);
    }

    res.json({
      message: 'User updated successfully',
      user: {
        id: updatedUser.user_id,
        username: updatedUser.username,
        email: updatedUser.email,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        phone: updatedUser.phone,
        role: role_name || existingUser.role_name,
        is_active: updatedUser.is_active,
        updated_at: updatedUser.updated_at
      }
    });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Activate user (Admin only)
const activateUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.is_active) {
      return res.status(400).json({ error: 'User is already active' });
    }

    const activatedUser = await User.activateUser(id);
    
    res.json({
      message: 'User activated successfully',
      user: {
        id: activatedUser.user_id,
        is_active: activatedUser.is_active
      }
    });
  } catch (err) {
    console.error('Activate user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Deactivate user (Admin only)
const deactivateUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.is_active) {
      return res.status(400).json({ error: 'User is already inactive' });
    }

    const deactivatedUser = await User.deactivateUser(id);
    
    res.json({
      message: 'User deactivated successfully',
      user: {
        id: deactivatedUser.user_id,
        is_active: deactivatedUser.is_active
      }
    });
  } catch (err) {
    console.error('Deactivate user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete user (Admin only)
const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await User.deleteUser(id);
    
    res.json({
      message: 'User deleted successfully',
      deleted_user_id: id
    });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all roles
const getAllRoles = async (req, res) => {
  try {
    const roles = await User.getAllRoles();
    res.json({
      message: 'Roles retrieved successfully',
      roles
    });
  } catch (err) {
    console.error('Get all roles error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Reset user password (Admin only)
const resetUserPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { newPassword } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await User.changePassword(id, newPassword);
    
    res.json({
      message: 'Password reset successfully',
      user_id: id
    });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  getUsersByRole,
  getUsersByDepot,
  getUsersByRegion,
  updateUser,
  activateUser,
  deactivateUser,
  deleteUser,
  getAllRoles,
  resetUserPassword
};