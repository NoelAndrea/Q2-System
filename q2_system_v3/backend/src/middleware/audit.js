// src/middleware/audit.js
// Writes security-relevant events to audit_logs table

const pool = require('../config/database');

/**
 * log(action, userId, req, details?)
 * Call this helper from any route controller.
 */
const log = async (action, userId, req, details = null) => {
  try {
    const ip = req.ip || req.connection?.remoteAddress || null;
    const ua = req.headers['user-agent']?.substring(0, 500) || null;
    await pool.execute(
      'INSERT INTO audit_logs (user_id, action, ip_address, user_agent, details) VALUES (?, ?, ?, ?, ?)',
      [userId || null, action, ip, ua, details ? JSON.stringify(details) : null]
    );
  } catch (err) {
    // Never crash the request over a logging failure
    console.error('Audit log error:', err.message);
  }
};

module.exports = { log };
