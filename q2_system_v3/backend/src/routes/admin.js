// src/routes/admin.js
// Admin-only routes — all require authenticate + requireAdmin
//
// GET    /api/admin/users             – list all users
// POST   /api/admin/users             – create user
// PATCH  /api/admin/users/:id/toggle  – suspend/activate user
// DELETE /api/admin/users/:id         – delete user
// GET    /api/admin/simulations       – all simulations (paginated)
// GET    /api/admin/stats             – overview stats
// GET    /api/admin/logs              – audit logs

const express = require('express');
const bcrypt  = require('bcryptjs');
const pool    = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validateAddUser }            = require('../middleware/validate');
const { log }                        = require('../middleware/audit');

const router = express.Router();
router.use(authenticate, requireAdmin);

// ── GET /api/admin/stats ──────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [[{ totalUsers }]]  = await pool.execute('SELECT COUNT(*) AS totalUsers FROM users');
    const [[{ totalSims }]]   = await pool.execute('SELECT COUNT(*) AS totalSims FROM simulation_result');
    const [[{ avgYield }]]    = await pool.execute(
      'SELECT ROUND(AVG(predicted_yield), 2) AS avgYield FROM simulation_result'
    );
    const [[{ latestYield }]] = await pool.execute(
      'SELECT predicted_yield AS latestYield FROM simulation_result ORDER BY simulation_date DESC LIMIT 1'
    );

    // Top soil type from soil_type table via field joins
    const [topSoil] = await pool.execute(
      `SELECT st.name AS soil_type, COUNT(*) AS cnt
       FROM simulation_result sr
       JOIN planting   p  ON p.planting_id = sr.planting_id
       JOIN field      f  ON f.field_id    = p.field_id
       JOIN soil_type  st ON st.soil_id    = f.soil_id
       GROUP BY st.name
       ORDER BY cnt DESC
       LIMIT 1`
    );

    // Fallback: count by soil_category stored directly on result if no field joins found
    const topSoilType = topSoil[0]?.soil_type || (() => {
      // We'll query soil_category directly from simulation_result as backup
      return null;
    })();

    let finalTopSoil = topSoilType;
    if (!finalTopSoil) {
      const [byCat] = await pool.execute(
        `SELECT soil_category AS soil_type, COUNT(*) AS cnt
         FROM simulation_result
         WHERE soil_category IS NOT NULL AND soil_category != ''
         GROUP BY soil_category
         ORDER BY cnt DESC
         LIMIT 1`
      );
      finalTopSoil = byCat[0]?.soil_type || 'N/A';
    }

    return res.json({
      success: true,
      data: {
        totalUsers,
        totalSimulations: totalSims,
        averageYield:     avgYield    || 0,
        latestYield:      latestYield || 0,
        topSoilType:      finalTopSoil,
      },
    });
  } catch (err) {
    console.error('Stats error:', err);
    return res.status(500).json({ success: false, message: 'Could not fetch stats.' });
  }
});

// ── GET /api/admin/users ──────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT user_id AS id, user_name AS name, email, role,
              COALESCE(is_active, 1) AS is_active, created_at
       FROM users
       ORDER BY created_at DESC`
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not fetch users.' });
  }
});

// ── POST /api/admin/users ─────────────────────────────────────────────────────
router.post('/users', validateAddUser, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const [existing] = await pool.execute('SELECT user_id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(409).json({ success: false, message: 'Email already in use.' });
    }

    const hashed  = await bcrypt.hash(password, 12);
    const [result] = await pool.execute(
      'INSERT INTO users (user_name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, 1)',
      [name, email, hashed, role]
    );

    await log('ADMIN_ADD_USER', req.user.id, req, { newUserId: result.insertId, email });

    return res.status(201).json({
      success: true,
      message: 'User created.',
      data: { id: result.insertId, name, email, role, is_active: 1 },
    });
  } catch (err) {
    console.error('Add user error:', err);
    return res.status(500).json({ success: false, message: 'Could not create user.' });
  }
});

// ── PATCH /api/admin/users/:id/toggle ────────────────────────────────────────
router.patch('/users/:id/toggle', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (userId === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot suspend your own account.' });
    }

    const [rows] = await pool.execute(
      'SELECT user_id, is_active FROM users WHERE user_id = ?',
      [userId]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const newStatus = rows[0].is_active ? 0 : 1;
    await pool.execute('UPDATE users SET is_active = ? WHERE user_id = ?', [newStatus, userId]);

    const action = newStatus ? 'ADMIN_ACTIVATE_USER' : 'ADMIN_SUSPEND_USER';
    await log(action, req.user.id, req, { targetUserId: userId });

    return res.json({
      success: true,
      message: newStatus ? 'User activated.' : 'User suspended.',
      data: { id: userId, is_active: newStatus },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not update user status.' });
  }
});

// ── DELETE /api/admin/users/:id ───────────────────────────────────────────────
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (userId === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account.' });
    }

    const [rows] = await pool.execute('SELECT user_id FROM users WHERE user_id = ?', [userId]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    await pool.execute('DELETE FROM users WHERE user_id = ?', [userId]);
    await log('ADMIN_DELETE_USER', req.user.id, req, { deletedUserId: userId });

    return res.json({ success: true, message: 'User deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not delete user.' });
  }
});

// ── GET /api/admin/simulations ────────────────────────────────────────────────
router.get('/simulations', async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page  || '1'));
    const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit || '20')));
    const offset = (page - 1) * limit;
    // optional user_id filter for "my simulations" view from admin
    const userFilter = req.query.user_id ? parseInt(req.query.user_id) : null;

    const wherePart = userFilter ? 'WHERE sr.user_id = ?' : '';
    const params    = userFilter
      ? [userFilter, limit, offset]
      : [limit, offset];

    const [rows] = await pool.execute(
      `SELECT
         sr.result_id           AS id,
         sr.growth_stage,
         sr.rainfall_mm,
         sr.rainfall_category,
         sr.soil_category,
         sr.fertilizer_impact,
         sr.fertilizer_names    AS fertilizer_type,
         sr.variety_impact,
         sr.maize_variety_name  AS maize_variety,
         sr.predicted_yield,
         sr.simulation_date     AS created_at,
         p.planting_date,
         sr.land_size,
         st.name                AS soil_type,
         u.user_name            AS user_name,
         u.email                AS user_email
       FROM simulation_result sr
       JOIN users          u    ON u.user_id        = sr.user_id
       JOIN planting       p    ON p.planting_id    = sr.planting_id
       LEFT JOIN field     f2   ON f2.field_id      = p.field_id
       LEFT JOIN soil_type st   ON st.soil_id       = f2.soil_id
       ${wherePart}
       ORDER BY sr.simulation_date DESC
       LIMIT ? OFFSET ?`,
      params
    );

    const countParams = userFilter ? [userFilter] : [];
    const countWhere  = userFilter ? 'WHERE user_id = ?' : '';
    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM simulation_result ${countWhere}`,
      countParams
    );

    return res.json({
      success: true,
      data: rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not fetch simulations.' });
  }
});

// ── GET /api/admin/logs ───────────────────────────────────────────────────────
router.get('/logs', async (req, res) => {
  try {
    const limit = Math.min(200, parseInt(req.query.limit || '50'));
    const [rows] = await pool.execute(
      `SELECT l.*, u.user_name AS user_name, u.email AS user_email
       FROM audit_logs l
       LEFT JOIN users u ON u.user_id = l.user_id
       ORDER BY l.created_at DESC
       LIMIT ?`,
      [limit]
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not fetch logs.' });
  }
});

module.exports = router;
