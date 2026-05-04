// src/engine/simulationEngine.js
// ─────────────────────────────────────────────────────────────────────────────
// Simulation logic implemented exactly as specified in the System Design Doc
// Extended: supports multiple fertilizer types (combo) with blended factor
// ─────────────────────────────────────────────────────────────────────────────

// Section 7.1 – Growth Stage Model
function getGrowthStage(days) {
  if (days <= 7)  return 'Germination';
  if (days <= 30) return 'Vegetative';
  if (days <= 60) return 'Flowering';
  return 'Maturity';
}

// Section 7.2 – Rainfall Impact Model
function getRainfallImpact(rainfall) {
  if (rainfall < 20)  return { category: 'Poor',   factor: 0.5 };
  if (rainfall <= 50) return { category: 'Normal',  factor: 0.8 };
  return                     { category: 'Good',    factor: 1.0 };
}

// Section 7.3 – Soil Impact Model  (sandy: 0.4 as per document)
function getSoilImpact(soil) {
  const types = {
    sandy: { category: 'Poor',     factor: 0.4 },
    clay:  { category: 'Moderate', factor: 0.7 },
    loam:  { category: 'Good',     factor: 1.0 },
  };
  return types[soil.toLowerCase()] || { category: 'Unknown', factor: 1.0 };
}

// Fertilizer factor lookup (single type)
const FERTILIZER_MAP = {
  'no fertilizer': { impact: 'Poor',     factor: 0.3  },
  'none':          { impact: 'Poor',     factor: 0.3  },
  'organic':       { impact: 'Moderate', factor: 0.8  },
  'npk':           { impact: 'High',     factor: 1.0  },
  'urea':          { impact: 'High',     factor: 0.95 },
};

// Section 7.4 – Fertilizer Impact Model
// Supports a single fertilizer name OR an array for combos.
// Combo logic: average of constituent factors, capped at 1.05
// with a small synergy bonus for NPK+Urea (common effective combo).
function getFertilizerImpact(typeOrTypes) {
  const types = Array.isArray(typeOrTypes) ? typeOrTypes : [typeOrTypes];

  if (types.length === 1) {
    const t = types[0].toLowerCase().trim();
    return FERTILIZER_MAP[t] || { impact: 'Normal', factor: 1.0 };
  }

  // Multiple fertilizers
  const resolved = types.map(t => FERTILIZER_MAP[t.toLowerCase().trim()] || { impact: 'Normal', factor: 1.0 });

  // Filter out "No Fertilizer" if combined with real fertilizers
  const real = resolved.filter(r => r.factor > 0.3);
  const pool  = real.length > 0 ? real : resolved;

  const avgFactor = pool.reduce((s, r) => s + r.factor, 0) / pool.length;

  // Synergy bonus: NPK + Urea together is a well-known effective pair
  const names = types.map(t => t.toLowerCase().trim());
  const hasSynergy = names.includes('npk') && names.includes('urea');
  const synergy    = hasSynergy ? 0.03 : 0;

  const finalFactor = Math.min(1.05, avgFactor + synergy);

  // Impact label based on blended factor
  let impact = 'Moderate';
  if (finalFactor >= 0.98) impact = 'High';
  else if (finalFactor >= 0.85) impact = 'Good';
  else if (finalFactor < 0.5)   impact = 'Poor';

  return { impact, factor: parseFloat(finalFactor.toFixed(4)) };
}

// Section 7.5 – Maize Variety Impact Model
function getVarietyImpact(variety) {
  const map = {
    hybrid: { impact: 'High Yield',     factor: 1.1 },
    local:  { impact: 'Standard Yield', factor: 0.9 },
  };
  return map[variety.toLowerCase()] || { impact: 'Normal', factor: 1.0 };
}

// Section 7.6 – Yield Estimation Model
function estimateYield({ rainfallFactor, soilFactor, fertilizerFactor, varietyFactor, stage, landSize }) {
  const baseYield = 100;

  const stageWeights = {
    Germination: 0.3,
    Vegetative:  0.6,
    Flowering:   0.9,
    Maturity:    1.0,
  };

  const stageWeight = stageWeights[stage] || 1.0;

  const yieldPerUnit =
    baseYield *
    rainfallFactor *
    soilFactor *
    fertilizerFactor *
    varietyFactor *
    stageWeight;

  return yieldPerUnit * parseFloat(landSize);
}

// Section 7.7 – Main Simulation Function
// fertilizerType can be a string or an array of strings (combo)
function runSimulation(data) {
  const { plantingDate, rainfall, soilType, fertilizerType, maizeVariety, landSize } = data;

  // Calculate days since planting; clamp to 0 if future date
  let days = (Date.now() - new Date(plantingDate).getTime()) / (1000 * 60 * 60 * 24);
  if (days < 0) days = 0;
  const daysSincePlant = Math.floor(days);

  const stage          = getGrowthStage(daysSincePlant);
  const rainfallData   = getRainfallImpact(parseFloat(rainfall));
  const soilData       = getSoilImpact(soilType);
  const fertilizerData = getFertilizerImpact(fertilizerType);  // supports array
  const varietyData    = getVarietyImpact(maizeVariety);

  const yieldValue = estimateYield({
    rainfallFactor:   rainfallData.factor,
    soilFactor:       soilData.factor,
    fertilizerFactor: fertilizerData.factor,
    varietyFactor:    varietyData.factor,
    stage,
    landSize,
  });

  return {
    growthStage:      stage,
    daysSincePlant,
    rainfallCategory: rainfallData.category,
    soilCategory:     soilData.category,
    fertilizerImpact: fertilizerData.impact,
    varietyImpact:    varietyData.impact,
    predictedYield:   parseFloat(yieldValue.toFixed(2)),
  };
}

module.exports = { runSimulation };
