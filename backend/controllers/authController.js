const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');

const loginUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Fetch user from DB using model
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is deactivated. Please contact administrator.' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login
    await User.updateLastLogin(user.user_id);

    // Create JWT
    const token = jwt.sign(
      {
        userId: user.user_id,
        role: user.role_name,
        email: user.email,
        username: user.username
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        role: user.role_name,
        is_active: user.is_active,
        last_login: user.last_login
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password, first_name, last_name, phone, role_name, role_data } = req.body;

  try {
    // Check if user already exists
    const existingUserByEmail = await User.findByEmail(email);
    if (existingUserByEmail) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const existingUserByUsername = await User.findByUsername(username);
    if (existingUserByUsername) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Get role ID
    const role = await User.findRoleByName(role_name);
    if (!role) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Create user
    const newUser = await User.create({
      username,
      email,
      password,
      first_name,
      last_name,
      phone,
      role_id: role.role_id
    });

    // Create role-specific entry
    if (role_name !== 'passenger') {
      await User.createRoleSpecificEntry(newUser.user_id, role_name, role_data || {});
    } else {
      // For passengers, create entry without additional data
      await User.createRoleSpecificEntry(newUser.user_id, role_name);
    }

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser.user_id,
        username: newUser.username,
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        phone: newUser.phone,
        role: role_name,
        is_active: newUser.is_active
      }
    });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const changePassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { currentPassword, newPassword } = req.body;
  const userId = req.user.userId;

  try {
    // Get current user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Update password
    await User.changePassword(userId, newPassword);

    res.json({ message: 'Password changed successfully' });

  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getProfile = async (req, res) => {
  const userId = req.user.userId;

  try {
    const user = await User.findById(userId);
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
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const userId = req.user.userId;
  const { username, email, first_name, last_name, phone } = req.body;

  try {
    // Check if username or email already exists (excluding current user)
    if (username) {
      const existingUser = await User.findByUsername(username);
      if (existingUser && existingUser.user_id !== userId) {
        return res.status(400).json({ error: 'Username already taken' });
      }
    }

    if (email) {
      const existingUser = await User.findByEmail(email);
      if (existingUser && existingUser.user_id !== userId) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    // Update user
    const updatedUser = await User.updateUser(userId, {
      username,
      email,
      first_name,
      last_name,
      phone
    });

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.user_id,
        username: updatedUser.username,
        email: updatedUser.email,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        phone: updatedUser.phone,
        is_active: updatedUser.is_active
      }
    });

  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  loginUser,
  registerUser,
  changePassword,
  getProfile,
  updateProfile
};