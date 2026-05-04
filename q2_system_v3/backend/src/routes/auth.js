// src/routes/auth.js
// POST /api/auth/register
// POST /api/auth/login
// GET  /api/auth/me   (protected)

const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const pool    = require('../config/database');
const { authenticate }                    = require('../middleware/auth');
const { validateLogin, validateRegister } = require('../middleware/validate');
const { log }                             = require('../middleware/audit');

const router = express.Router();

// ── Helper: generate JWT ──────────────────────────────────────────────────────
const signToken = (user) =>
  jwt.sign(
    { id: user.user_id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// ── REGISTER ──────────────────────────────────────────────────────────────────
router.post('/register', validateRegister, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check duplicate email
    const [existing] = await pool.execute(
      'SELECT user_id FROM users WHERE email = ?',
      [email]
    );
    if (existing.length) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    const hashed = await bcrypt.hash(password, 12);
    const [result] = await pool.execute(
      'INSERT INTO users (user_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, hashed, 'farmer']
    );

    await log('USER_REGISTER', result.insertId, req, { email });

    return res.status(201).json({
      success: true,
      message: 'Registration successful. Please log in.',
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ success: false, message: 'Registration failed. Try again.' });
  }
});

// ── LOGIN ─────────────────────────────────────────────────────────────────────
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.execute(
      'SELECT user_id, user_name, email, password_hash, role FROM users WHERE email = ?',
      [email]
    );

    if (!rows.length) {
      await log('LOGIN_FAIL', null, req, { email, reason: 'not found' });
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user  = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      await log('LOGIN_FAIL', user.user_id, req, { email, reason: 'wrong password' });
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = signToken(user);
    await log('LOGIN_SUCCESS', user.user_id, req);

    return res.json({
      success: true,
      token,
      user: {
        id:   user.user_id,
        name: user.user_name,
        email: user.email,
        role:  user.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Login failed. Try again.' });
  }
});

// ── ME (verify session) ───────────────────────────────────────────────────────
router.get('/me', authenticate, (req, res) => {
  const { id, name, email, role } = req.user;
  res.json({ success: true, user: { id, name, email, role } });
});

// ── CHANGE PASSWORD ───────────────────────────────────────────────────────────
router.put('/profile/password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both currentPassword and newPassword are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const [rows] = await pool.execute(
      'SELECT password_hash FROM users WHERE user_id = ?',
      [req.user.id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await pool.execute('UPDATE users SET password_hash = ? WHERE user_id = ?', [hashed, req.user.id]);
    await log('PASSWORD_CHANGE', req.user.id, req);

    return res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Password change error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update password.' });
  }
});

// ── UPDATE PROFILE NAME ───────────────────────────────────────────────────────
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Name must be at least 2 characters.' });
    }
    const trimmedName = name.trim().slice(0, 120);
    await pool.execute('UPDATE users SET user_name = ? WHERE user_id = ?', [trimmedName, req.user.id]);
    await log('PROFILE_UPDATE', req.user.id, req, { newName: trimmedName });

    return res.json({ success: true, message: 'Profile updated.', data: { name: trimmedName } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});

module.exports = router;
