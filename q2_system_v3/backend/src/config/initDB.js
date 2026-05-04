// src/config/initDB.js
// Creates all tables matching setup.sql (digital_twin database)
// and seeds reference data + demo users

const pool   = require('./database');
const bcrypt = require('bcryptjs');

async function initDB() {
  const conn = await pool.getConnection();
  try {

    // ── users ──────────────────────────────────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS users (
        user_id       INT AUTO_INCREMENT PRIMARY KEY,
        user_name     VARCHAR(100) NOT NULL,
        email         VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role          VARCHAR(20)  DEFAULT 'farmer',
        is_active     TINYINT(1)   DEFAULT 1,
        created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Add is_active column if it doesn't exist (for existing DBs)
    await conn.execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active TINYINT(1) DEFAULT 1`).catch(() => {});

    // ── crop ───────────────────────────────────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS crop (
        crop_id              INT AUTO_INCREMENT PRIMARY KEY,
        crop_name            VARCHAR(50) NOT NULL,
        growth_duration_days INT,
        base_yield           DECIMAL(10,2)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── soil_type ──────────────────────────────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS soil_type (
        soil_id  INT AUTO_INCREMENT PRIMARY KEY,
        name     VARCHAR(50),
        category VARCHAR(50),
        factor   DECIMAL(5,2)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── crop_variety ───────────────────────────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS crop_variety (
        variety_id INT AUTO_INCREMENT PRIMARY KEY,
        crop_id    INT,
        name       VARCHAR(50),
        factor     DECIMAL(5,2),
        FOREIGN KEY (crop_id) REFERENCES crop(crop_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── fertilizer ─────────────────────────────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS fertilizer (
        fertilizer_id INT AUTO_INCREMENT PRIMARY KEY,
        name          VARCHAR(50),
        impact        VARCHAR(50),
        factor        DECIMAL(5,2)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── farm ───────────────────────────────────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS farm (
        farm_id    INT AUTO_INCREMENT PRIMARY KEY,
        user_id    INT         NOT NULL,
        farm_name  VARCHAR(100),
        location   VARCHAR(150),
        created_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
        farm_size  DECIMAL(10,2) DEFAULT 0.00,
        FOREIGN KEY (user_id) REFERENCES users(user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.execute(`ALTER TABLE farm ADD COLUMN IF NOT EXISTS farm_size DECIMAL(10,2) DEFAULT 0.00`).catch(() => {});

    // ── field ──────────────────────────────────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS field (
        field_id   INT AUTO_INCREMENT PRIMARY KEY,
        farm_id    INT NOT NULL,
        field_name VARCHAR(100),
        field_size DECIMAL(10,2),
        soil_id    INT,
        FOREIGN KEY (farm_id) REFERENCES farm(farm_id),
        FOREIGN KEY (soil_id) REFERENCES soil_type(soil_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── planting ───────────────────────────────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS planting (
        planting_id   INT AUTO_INCREMENT PRIMARY KEY,
        field_id      INT,
        crop_id       INT,
        variety_id    INT,
        fertilizer_id INT,
        planting_date DATE,
        FOREIGN KEY (field_id)      REFERENCES field(field_id),
        FOREIGN KEY (crop_id)       REFERENCES crop(crop_id),
        FOREIGN KEY (variety_id)    REFERENCES crop_variety(variety_id),
        FOREIGN KEY (fertilizer_id) REFERENCES fertilizer(fertilizer_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── simulation_run ─────────────────────────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS simulation_run (
        run_id      INT AUTO_INCREMENT PRIMARY KEY,
        user_id     INT,
        scenario_id INT,
        run_name    VARCHAR(100),
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── simulation_result ──────────────────────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS simulation_result (
        result_id          INT AUTO_INCREMENT PRIMARY KEY,
        run_id             INT,
        planting_id        INT,
        user_id            INT,
        growth_stage       VARCHAR(50),
        rainfall_mm        DECIMAL(10,2) DEFAULT NULL,
        rainfall_category  VARCHAR(50),
        soil_category      VARCHAR(50),
        fertilizer_impact  VARCHAR(50),
        fertilizer_names   VARCHAR(255) DEFAULT NULL,
        variety_impact     VARCHAR(50),
        maize_variety_name VARCHAR(100) DEFAULT NULL,
        land_size          DECIMAL(10,2) DEFAULT NULL,
        predicted_yield    DECIMAL(10,2),
        simulation_date    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (run_id)      REFERENCES simulation_run(run_id),
        FOREIGN KEY (planting_id) REFERENCES planting(planting_id),
        FOREIGN KEY (user_id)     REFERENCES users(user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Add new columns to simulation_result if they don't exist (for existing DBs)
    await conn.execute(`ALTER TABLE simulation_result ADD COLUMN IF NOT EXISTS rainfall_mm DECIMAL(10,2) DEFAULT NULL`).catch(() => {});
    await conn.execute(`ALTER TABLE simulation_result ADD COLUMN IF NOT EXISTS fertilizer_names VARCHAR(255) DEFAULT NULL`).catch(() => {});
    await conn.execute(`ALTER TABLE simulation_result ADD COLUMN IF NOT EXISTS maize_variety_name VARCHAR(100) DEFAULT NULL`).catch(() => {});
    await conn.execute(`ALTER TABLE simulation_result ADD COLUMN IF NOT EXISTS land_size DECIMAL(10,2) DEFAULT NULL`).catch(() => {});

    // ── audit_logs (security / event logging) ──────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        user_id    INT          NULL,
        action     VARCHAR(100) NOT NULL,
        ip_address VARCHAR(45)  NULL,
        user_agent TEXT         NULL,
        details    JSON         NULL,
        created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
        INDEX idx_action     (action),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── Seed reference data (only if empty) ────────────────────────────────
    const [[{ cropCnt }]] = await conn.execute('SELECT COUNT(*) AS cropCnt FROM crop');
    if (cropCnt === 0) {
      await conn.execute(`
        INSERT INTO crop (crop_id, crop_name, growth_duration_days, base_yield) VALUES
        (1, 'Maize', 120, 100.00)
      `);

      await conn.execute(`
        INSERT INTO soil_type (soil_id, name, category, factor) VALUES
        (1, 'Sandy', 'Poor',     0.40),
        (2, 'Clay',  'Moderate', 0.70),
        (3, 'Loam',  'Good',     1.00)
      `);

      await conn.execute(`
        INSERT INTO crop_variety (variety_id, crop_id, name, factor) VALUES
        (1, 1, 'Hybrid', 1.10),
        (2, 1, 'Local',  0.90)
      `);

      await conn.execute(`
        INSERT INTO fertilizer (fertilizer_id, name, impact, factor) VALUES
        (1, 'Organic',        'Moderate', 0.80),
        (2, 'NPK',            'High',     1.00),
        (3, 'Urea',           'High',     0.95),
        (4, 'No Fertilizer',  'Poor',     0.30)
      `);

      console.log('🌱  Seeded reference data (crop, soil_type, crop_variety, fertilizer)');
    }

    // ── Seed demo users (only if table is empty) ───────────────────────────
    const [[{ userCnt }]] = await conn.execute('SELECT COUNT(*) AS userCnt FROM users');
    if (userCnt === 0) {
      const farmerHash = await bcrypt.hash('farmer123', 12);
      const adminHash  = await bcrypt.hash('admin123',  12);

      await conn.execute(`
        INSERT INTO users (user_id, user_name, email, password_hash, role, is_active) VALUES
        (1, 'John Farmer',  'farmer@demo.com', ?, 'farmer', 1),
        (2, 'System Admin', 'admin@demo.com',  ?, 'admin',  1)
      `, [farmerHash, adminHash]);

      // Seed default farm + field for the demo farmer
      await conn.execute(`
        INSERT INTO farm (farm_id, user_id, farm_name, location, farm_size) VALUES
        (1, 1, 'Demo Farm', 'Demo Location', 8.00)
      `);
      await conn.execute(`
        INSERT INTO field (field_id, farm_id, field_name, field_size, soil_id) VALUES
        (1, 1, 'Default Field', 8.00, 3)
      `);

      console.log('🌱  Seeded demo users:');
      console.log('    farmer@demo.com / farmer123  (farmer)');
      console.log('    admin@demo.com  / admin123   (admin)');
    }

    console.log('✅  All database tables ready (digital_twin)');
  } finally {
    conn.release();
  }
}

module.exports = initDB;
