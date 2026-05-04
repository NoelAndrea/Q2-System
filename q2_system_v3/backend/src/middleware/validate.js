// src/middleware/validate.js
// Input validation using express-validator

const { body, validationResult } = require('express-validator');

// Return 422 with structured errors if validation fails
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ── Auth ──────────────────────────────────────────────────────────────────────
const validateLogin = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().isLength({ min: 3 }).withMessage('Password required (min 3 chars)'),
  handleValidation,
];

const validateRegister = [
  body('name').trim().isLength({ min: 2, max: 120 }).withMessage('Name must be 2–120 characters').escape(),
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidation,
];

// ── Simulation ────────────────────────────────────────────────────────────────
const SOIL_TYPES       = ['sandy', 'clay', 'loam'];
const MAIZE_VARIETIES  = ['hybrid', 'local'];
const FERTILIZER_TYPES = ['organic', 'npk', 'urea', 'no fertilizer'];

const validateSimulation = [
  body('plantingDate')
    .isDate({ format: 'YYYY-MM-DD' })
    .withMessage('Valid planting date (YYYY-MM-DD) required'),

  body('rainfall')
    .isFloat({ min: 0, max: 3000 })
    .withMessage('Rainfall must be a number between 0 and 3000 mm'),

  body('soilType')
    .toLowerCase()
    .isIn(SOIL_TYPES)
    .withMessage(`Soil type must be one of: ${SOIL_TYPES.join(', ')}`),

  body('maizeVariety')
    .toLowerCase()
    .isIn(MAIZE_VARIETIES)
    .withMessage(`Maize variety must be one of: ${MAIZE_VARIETIES.join(', ')}`),

  // fertilizerType can be a single string or an array; validate each element
  body('fertilizerType')
    .custom((value) => {
      const values = Array.isArray(value) ? value : [value];
      if (values.length === 0) throw new Error('At least one fertilizer type required');
      for (const v of values) {
        if (!FERTILIZER_TYPES.includes(v.toLowerCase().trim())) {
          throw new Error(`Invalid fertilizer type: "${v}". Must be one of: ${FERTILIZER_TYPES.join(', ')}`);
        }
      }
      return true;
    }),

  body('landSize')
    .isFloat({ min: 0.01, max: 10000 })
    .withMessage('Land size must be between 0.01 and 10,000 hectares'),

  handleValidation,
];

// ── Admin user management ─────────────────────────────────────────────────────
const validateAddUser = [
  body('name').trim().isLength({ min: 2, max: 120 }).withMessage('Name required').escape(),
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 characters'),
  body('role').isIn(['farmer', 'admin']).withMessage('Role must be farmer or admin'),
  handleValidation,
];

module.exports = { validateLogin, validateRegister, validateSimulation, validateAddUser };
