// src/routes/simulations.js
// Uses the normalized digital_twin schema
//
// POST   /api/simulate        – run simulation & save to DB
// GET    /api/simulate/my     – user's own simulation history
// GET    /api/simulate/:id    – single simulation result
// DELETE /api/simulate/:id    – delete own simulation result

const express = require('express');
const pool    = require('../config/database');
const { runSimulation }      = require('../engine/simulationEngine');
const { authenticate }       = require('../middleware/auth');
const { validateSimulation } = require('../middleware/validate');
const { log }                = require('../middleware/audit');

const router = express.Router();
router.use(authenticate);

// ── Helper: resolve FK IDs from reference tables ──────────────────────────────
async function resolveIds({ soilType, maizeVariety, fertilizerTypes }) {
  const [[soil]] = await pool.execute(
    'SELECT soil_id FROM soil_type WHERE LOWER(name) = LOWER(?)',
    [soilType]
  );
  if (!soil) throw new Error(`Unknown soil type: ${soilType}`);

  const [[variety]] = await pool.execute(
    'SELECT variety_id FROM crop_variety WHERE LOWER(name) = LOWER(?)',
    [maizeVariety]
  );
  if (!variety) throw new Error(`Unknown maize variety: ${maizeVariety}`);

  const primaryFert = fertilizerTypes[0];
  const [[fertilizer]] = await pool.execute(
    'SELECT fertilizer_id FROM fertilizer WHERE LOWER(name) = LOWER(?)',
    [primaryFert]
  );
  if (!fertilizer) throw new Error(`Unknown fertilizer type: ${primaryFert}`);

  return { soilId: soil.soil_id, varietyId: variety.variety_id, fertilizerId: fertilizer.fertilizer_id };
}

// ── POST /api/simulate ────────────────────────────────────────────────────────
router.post('/', validateSimulation, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { plantingDate, rainfall, soilType, maizeVariety, fertilizerType, landSize } = req.body;

    const fertilizerTypes = Array.isArray(fertilizerType) ? fertilizerType : [fertilizerType];
    const fertilizerNamesStr = fertilizerTypes.join(', ');

    const { soilId, varietyId, fertilizerId } = await resolveIds({ soilType, maizeVariety, fertilizerTypes });
    const CROP_ID = 1;

    const result = runSimulation({
      plantingDate, rainfall, soilType, maizeVariety,
      fertilizerType: fertilizerTypes,
      landSize
    });

    // Resolve field for this user (for FK, optional)
    const [fields] = await conn.execute(
      `SELECT f.field_id FROM field f
       JOIN farm fm ON fm.farm_id = f.farm_id
       WHERE fm.user_id = ? LIMIT 1`,
      [req.user.id]
    );
    const fieldId = fields.length ? fields[0].field_id : null;

    // Also update farm.farm_size if farm exists
    if (fieldId) {
      await conn.execute(
        `UPDATE farm fm
         JOIN field f ON f.farm_id = fm.farm_id
         SET fm.farm_size = ?
         WHERE f.field_id = ?`,
        [parseFloat(landSize), fieldId]
      );
    }

    // 1. Insert into planting
    const [plantRow] = await conn.execute(
      `INSERT INTO planting (field_id, crop_id, variety_id, fertilizer_id, planting_date)
       VALUES (?, ?, ?, ?, ?)`,
      [fieldId, CROP_ID, varietyId, fertilizerId, plantingDate]
    );
    const plantingId = plantRow.insertId;

    // 2. Insert into simulation_run
    const [runRow] = await conn.execute(
      `INSERT INTO simulation_run (user_id, run_name) VALUES (?, ?)`,
      [req.user.id, `Run ${new Date().toISOString()}`]
    );
    const runId = runRow.insertId;

    // 3. Insert into simulation_result — land_size stored directly here
    const [resRow] = await conn.execute(
      `INSERT INTO simulation_result
         (run_id, planting_id, user_id, growth_stage, rainfall_mm, rainfall_category,
          soil_category, fertilizer_impact, fertilizer_names, variety_impact,
          maize_variety_name, land_size, predicted_yield)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        runId,
        plantingId,
        req.user.id,
        result.growthStage,
        parseFloat(rainfall),
        result.rainfallCategory,
        result.soilCategory,
        result.fertilizerImpact,
        fertilizerNamesStr,
        result.varietyImpact,
        maizeVariety,
        parseFloat(landSize),
        result.predictedYield,
      ]
    );
    const resultId = resRow.insertId;

    await conn.commit();
    await log('SIMULATION_RUN', req.user.id, req, { resultId });

    return res.status(201).json({
      success: true,
      message: 'Simulation complete and saved',
      data: {
        id: resultId,
        ...result,
        inputs: {
          plantingDate, rainfall,
          soilType, maizeVariety,
          fertilizerType: fertilizerNamesStr,
          landSize
        },
      },
    });
  } catch (err) {
    await conn.rollback();
    console.error('Simulation error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Simulation failed. Please try again.' });
  } finally {
    conn.release();
  }
});

// ── GET /api/simulate/my ──────────────────────────────────────────────────────
router.get('/my', async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page  || '1'));
    const limit  = Math.min(50, Math.max(1, parseInt(req.query.limit || '10')));
    const offset = (page - 1) * limit;

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
         sr.land_size,
         sr.simulation_date     AS created_at,
         p.planting_date,
         st.name                AS soil_type,
         srun.run_name
       FROM simulation_result sr
       JOIN simulation_run  srun ON srun.run_id      = sr.run_id
       JOIN planting        p    ON p.planting_id    = sr.planting_id
       LEFT JOIN field      f2   ON f2.field_id      = p.field_id
       LEFT JOIN soil_type  st   ON st.soil_id       = f2.soil_id
       WHERE sr.user_id = ?
       ORDER BY sr.simulation_date DESC
       LIMIT ? OFFSET ?`,
      [req.user.id, limit, offset]
    );

    const [[{ total }]] = await pool.execute(
      'SELECT COUNT(*) AS total FROM simulation_result WHERE user_id = ?',
      [req.user.id]
    );

    return res.json({
      success: true,
      data: rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('Fetch history error:', err);
    return res.status(500).json({ success: false, message: 'Could not retrieve simulation history.' });
  }
});

// ── GET /api/simulate/:id ─────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
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
         sr.land_size,
         sr.simulation_date     AS created_at,
         p.planting_date,
         st.name                AS soil_type
       FROM simulation_result sr
       JOIN planting        p    ON p.planting_id    = sr.planting_id
       LEFT JOIN field      f2   ON f2.field_id      = p.field_id
       LEFT JOIN soil_type  st   ON st.soil_id       = f2.soil_id
       WHERE sr.result_id = ? AND sr.user_id = ?`,
      [req.params.id, req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Simulation not found.' });
    }
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not retrieve simulation.' });
  }
});

// ── DELETE /api/simulate/:id ──────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [existing] = await conn.execute(
      'SELECT result_id, run_id, planting_id FROM simulation_result WHERE result_id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!existing.length) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Simulation not found.' });
    }

    const { run_id, planting_id } = existing[0];

    await conn.execute('DELETE FROM simulation_result WHERE result_id = ?', [req.params.id]);
    await conn.execute('DELETE FROM simulation_run WHERE run_id = ?', [run_id]);
    await conn.execute('DELETE FROM planting WHERE planting_id = ?', [planting_id]);

    await conn.commit();
    await log('SIMULATION_DELETE', req.user.id, req, { resultId: req.params.id });

    return res.json({ success: true, message: 'Simulation deleted.' });
  } catch (err) {
    await conn.rollback();
    return res.status(500).json({ success: false, message: 'Could not delete simulation.' });
  } finally {
    conn.release();
  }
});

module.exports = router;
