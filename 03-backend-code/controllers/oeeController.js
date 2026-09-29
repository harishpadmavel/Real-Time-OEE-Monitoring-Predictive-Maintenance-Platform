const Machine = require("../models/Machine");
const DowntimeLog = require("../models/DowntimeLog");
const ProductionLog = require("../models/ProductionLog");
const { calculateOEE, classifyOEE } = require("../utils/calculateOEE");

// GET /api/oee/:machineId - live OEE score for one machine, current shift
async function getMachineOEE(req, res) {
  const machine = await Machine.findById(req.params.machineId);
  if (!machine) return res.status(404).json({ message: "Machine not found" });

  const { goodUnits, defectiveUnits, totalDowntimeMinutes } = machine.currentShift;

  const result = calculateOEE({
    plannedProductionMinutes: machine.plannedProductionMinutesPerShift,
    downtimeMinutes: totalDowntimeMinutes,
    idealCycleTimeSeconds: machine.idealCycleTimeSeconds,
    goodUnits,
    defectiveUnits,
  });

  res.json({
    machineId: machine._id,
    machineName: machine.name,
    type: machine.type,
    lineId: machine.lineId,
    status: machine.status,
    currentShift: machine.currentShift,
    ...result,
    classification: classifyOEE(result.oee),
  });
}

// GET /api/oee - OEE for every machine (dashboard summary view)
async function getAllMachinesOEE(req, res) {
  const machines = await Machine.find().sort({ lineId: 1, name: 1 });
  const results = machines.map((machine) => {
    const { goodUnits, defectiveUnits, totalDowntimeMinutes } = machine.currentShift;
    const result = calculateOEE({
      plannedProductionMinutes: machine.plannedProductionMinutesPerShift,
      downtimeMinutes: totalDowntimeMinutes,
      idealCycleTimeSeconds: machine.idealCycleTimeSeconds,
      goodUnits,
      defectiveUnits,
    });
    return {
      machineId: machine._id,
      machineName: machine.name,
      type: machine.type,
      lineId: machine.lineId,
      status: machine.status,
      idealCycleTimeSeconds: machine.idealCycleTimeSeconds,
      currentShift: machine.currentShift,
      ...result,
      classification: classifyOEE(result.oee),
    };
  });
  res.json(results);
}

// GET /api/oee/:machineId/predictive-alert
async function getPredictiveAlert(req, res) {
  const { machineId } = req.params;
  const machine = await Machine.findById(machineId);
  if (!machine) return res.status(404).json({ message: "Machine not found" });

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const midpoint = new Date(Date.now() - 3.5 * 24 * 60 * 60 * 1000);

  const logs = await DowntimeLog.find({
    machine: machineId,
    reason: "BREAKDOWN",
    startTime: { $gte: sevenDaysAgo },
  });

  const firstHalf = logs.filter((l) => l.startTime < midpoint).length;
  const secondHalf = logs.filter((l) => l.startTime >= midpoint).length;

  const trendingUp = secondHalf > firstHalf;
  const atRisk = trendingUp && secondHalf >= 2;

  res.json({
    machineId,
    machineName: machine.name,
    type: machine.type,
    breakdownsLast7Days: logs.length,
    breakdownsFirstHalf: firstHalf,
    breakdownsSecondHalf: secondHalf,
    atRisk,
    severity: atRisk ? "HIGH" : secondHalf >= 1 ? "MEDIUM" : "LOW",
    message: atRisk
      ? "Breakdown frequency is increasing (2+ recent events) — recommend scheduling preventive maintenance."
      : "Breakdown frequency within normal operating thresholds.",
    recommendation: atRisk
      ? (machine.type === "Welding"
          ? "Check wire feed mechanism, clean nozzle spatter, and inspect cooling circuit flow."
          : machine.type === "Press"
          ? "Verify hydraulic pack pressure, cylinder seals, and die alignment lubrication."
          : "Perform vibration spectrum analysis and inspect spindle bearings.")
      : "Routine inspection at end of shift.",
  });
}

// GET /api/oee/predictive-alerts - All machines evaluated for predictive maintenance
async function getAllPredictiveAlerts(req, res) {
  try {
    const machines = await Machine.find().sort({ lineId: 1, name: 1 });
    const alerts = [];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const midpoint = new Date(Date.now() - 3.5 * 24 * 60 * 60 * 1000);

    for (const m of machines) {
      const logs = await DowntimeLog.find({
        machine: m._id,
        reason: "BREAKDOWN",
        startTime: { $gte: sevenDaysAgo },
      });

      const firstHalf = logs.filter((l) => l.startTime < midpoint).length;
      const secondHalf = logs.filter((l) => l.startTime >= midpoint).length;
      const trendingUp = secondHalf > firstHalf;
      const atRisk = trendingUp && secondHalf >= 2;

      alerts.push({
        machineId: m._id,
        machineName: m.name,
        type: m.type,
        lineId: m.lineId,
        breakdownsLast7Days: logs.length,
        breakdownsFirstHalf: firstHalf,
        breakdownsSecondHalf: secondHalf,
        atRisk,
        severity: atRisk ? "HIGH" : secondHalf >= 1 ? "MEDIUM" : "NORMAL",
        message: atRisk
          ? "Breakdown frequency is trending upward in the last 72 hours — recommend immediate inspection."
          : secondHalf >= 1
          ? "Isolated breakdown recorded recently. Monitor for recurring anomalies."
          : "Normal operating condition. No abnormal breakdown trend detected.",
        recommendation: m.type === "Welding"
          ? "Inspect wire feeder drive rolls and cooling circuit temperature."
          : m.type === "Press"
          ? "Check hydraulic pressure seals and ram lubrication level."
          : "Inspect spindle vibration harmonics and lubrication flow rate.",
      });
    }

    res.json(alerts);
  } catch (err) {
    res.status(500).json({ message: "Failed to evaluate predictive alerts", error: err.message });
  }
}

// GET /api/oee/trends/7day - 7-day OEE trend data for reports
async function getOeeTrends(req, res) {
  try {
    const machines = await Machine.find().sort({ lineId: 1, name: 1 });
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const logs = await ProductionLog.find({ timestamp: { $gte: sevenDaysAgo } }).sort({ timestamp: 1 });

    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Format response grouped by machine
    const trends = machines.map((machine) => {
      const machineLogs = logs.filter(
        (l) => l.machine.toString() === machine._id.toString()
      );

      const series = machineLogs.map((l) => {
        const d = new Date(l.timestamp);
        const day = dayLabels[d.getDay()];
        const calc = calculateOEE({
          plannedProductionMinutes: 480,
          downtimeMinutes: Math.max(0, 480 - (l.runTimeMinutes || 400)),
          idealCycleTimeSeconds: machine.idealCycleTimeSeconds,
          goodUnits: l.goodUnits,
          defectiveUnits: l.defectiveUnits,
        });

        return {
          date: l.timestamp,
          day,
          oee: calc.oee,
          availability: calc.availability,
          performance: calc.performance,
          quality: calc.quality,
          goodUnits: l.goodUnits,
          defectiveUnits: l.defectiveUnits,
        };
      });

      return {
        machineId: machine._id,
        machineName: machine.name,
        type: machine.type,
        lineId: machine.lineId,
        series,
      };
    });

    res.json(trends);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch OEE trends", error: err.message });
  }
}

module.exports = {
  getMachineOEE,
  getAllMachinesOEE,
  getPredictiveAlert,
  getAllPredictiveAlerts,
  getOeeTrends,
};
