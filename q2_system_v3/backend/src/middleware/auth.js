// src/middleware/auth.js
// Verifies JWT token on every protected route

const jwt  = require('jsonwebtoken');
const pool = require('../config/database');

// Attach verified user to req.user
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided. Please log in.' });
    }

    const token   = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify user still exists in database
    const [rows] = await pool.execute(
      'SELECT user_id, user_name, email, role FROM users WHERE user_id = ?',
      [decoded.id]
    );

    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'User account not found.' });
    }

    const u    = rows[0];
    req.user   = {
      id:    u.user_id,
      name:  u.user_name,
      email: u.email,
      role:  u.role,
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

// Only allow admins through
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }
  next();
};

module.exports = { authenticate, requireAdmin };
