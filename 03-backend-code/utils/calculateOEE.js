/**
 * Calculates OEE (Overall Equipment Effectiveness) for a machine
 * over a given period, using the classic three-factor formula:
 *
 *   OEE = Availability x Performance x Quality
 *
 * @param {Object} input
 * @param {number} input.plannedProductionMinutes - total minutes the machine was scheduled to run
 * @param {number} input.downtimeMinutes           - total minutes lost to downtime in that period
 * @param {number} input.idealCycleTimeSeconds      - ideal time (seconds) to produce ONE unit
 * @param {number} input.goodUnits                  - number of good (non-defective) units produced
 * @param {number} input.defectiveUnits              - number of defective/rejected units produced
 * @returns {Object} availability, performance, quality, oee — all as percentages (0-100)
 */
function calculateOEE({
  plannedProductionMinutes,
  downtimeMinutes,
  idealCycleTimeSeconds,
  goodUnits,
  defectiveUnits,
}) {
  const totalUnits = goodUnits + defectiveUnits;

  // --- Availability = Run Time / Planned Production Time ---
  const runTimeMinutes = Math.max(plannedProductionMinutes - downtimeMinutes, 0);
  const availability =
    plannedProductionMinutes > 0 ? runTimeMinutes / plannedProductionMinutes : 0;

  // --- Performance = (Ideal Cycle Time x Total Units) / Run Time ---
  const idealTimeMinutes = (idealCycleTimeSeconds * totalUnits) / 60;
  const performance = runTimeMinutes > 0 ? idealTimeMinutes / runTimeMinutes : 0;

  // --- Quality = Good Units / Total Units ---
  const quality = totalUnits > 0 ? goodUnits / totalUnits : 0;

  // Clamp each factor to [0, 1] — real-world data glitches can otherwise push this over 100%
  const clamp = (n) => Math.min(Math.max(n, 0), 1);
  const A = clamp(availability);
  const P = clamp(performance);
  const Q = clamp(quality);

  const oee = A * P * Q;

  return {
    availability: +(A * 100).toFixed(2),
    performance: +(P * 100).toFixed(2),
    quality: +(Q * 100).toFixed(2),
    oee: +(oee * 100).toFixed(2),
  };
}

/**
 * Simple classifier so the frontend can color-code an OEE score,
 * based on the widely-used manufacturing benchmark bands.
 */
function classifyOEE(oeePercent) {
  if (oeePercent >= 85) return "WORLD_CLASS";
  if (oeePercent >= 60) return "ACCEPTABLE";
  if (oeePercent >= 40) return "LOW";
  return "CRITICAL";
}

module.exports = { calculateOEE, classifyOEE };
