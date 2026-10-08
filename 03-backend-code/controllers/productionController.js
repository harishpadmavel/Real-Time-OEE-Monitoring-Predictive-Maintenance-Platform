const ProductionLog = require("../models/ProductionLog");
const Machine = require("../models/Machine");
const ShiftSession = require("../models/ShiftSession");
const { calculateOEE, classifyOEE } = require("../utils/calculateOEE");

/**
 * POST /api/production
 * Operator manually logs production units for their assigned machine.
 *
 * Simulator conflict resolution:
 *   The telemetry simulator increments machine.currentShift counters automatically
 *   for RUNNING machines. Manual entries from an operator are ADDITIVE — they
 *   represent actual counted units for a discrete interval (the operator enters
 *   real floor counts, not simulated estimates). To avoid double-counting:
 *     1. Manual entries are saved as source: "MANUAL" in ProductionLog.
 *     2. Machine.currentShift counters are ALSO updated so the live OEE gauge
 *        on the dashboard reflects the real count.
 *     3. The simulator skips machines where a ShiftSession is active (handled
 *        in telemetrySimulator.js), so there is no overlap.
 */
async function logProduction(req, res) {
  try {
    const { machineId, goodUnits, rejectedUnits = 0, rejectReason, shiftSessionId, runTimeMinutes = 5 } = req.body;

    if (!machineId) return res.status(400).json({ message: "machineId is required" });
    if (goodUnits == null || goodUnits < 0) return res.status(400).json({ message: "goodUnits must be >= 0" });
    if (rejectedUnits > 0 && !rejectReason) {
      return res.status(400).json({ message: "rejectReason is required when rejectedUnits > 0" });
    }

    const machine = await Machine.findById(machineId);
    if (!machine) return res.status(404).json({ message: "Machine not found" });

    // Create the production log entry
    const log = await ProductionLog.create({
      machine: machineId,
      goodUnits,
      defectiveUnits: rejectedUnits,
      runTimeMinutes,
      rejectReason: rejectedUnits > 0 ? rejectReason : undefined,
      loggedBy: req.user.id,
      source: "MANUAL",
      shiftSession: shiftSessionId || undefined,
    });

    // Update machine shift counters so live OEE refreshes
    machine.currentShift.goodUnits += goodUnits;
    machine.currentShift.defectiveUnits += rejectedUnits;
    machine.currentShift.totalRunTimeMinutes += runTimeMinutes;
    await machine.save();

    // Recalculate OEE and broadcast
    const oeeCalc = calculateOEE({
      plannedProductionMinutes: machine.plannedProductionMinutesPerShift,
      downtimeMinutes: machine.currentShift.totalDowntimeMinutes,
      idealCycleTimeSeconds: machine.idealCycleTimeSeconds,
      goodUnits: machine.currentShift.goodUnits,
      defectiveUnits: machine.currentShift.defectiveUnits,
    });

    const io = req.app.get("io");
    if (io) {
      io.emit("oeeUpdate", {
        machineId: machine._id,
        machineName: machine.name,
        status: machine.status,
        currentShift: machine.currentShift,
        ...oeeCalc,
        classification: classifyOEE(oeeCalc.oee),
      });
    }

    res.status(201).json({ log, oee: oeeCalc });
  } catch (err) {
    res.status(500).json({ message: "Failed to log production", error: err.message });
  }
}

// GET /api/production?machineId=&shiftSessionId=&limit=
async function getProductionLogs(req, res) {
  try {
    const { machineId, shiftSessionId, limit = 50 } = req.query;
    const match = {};
    if (machineId) match.machine = machineId;
    if (shiftSessionId) match.shiftSession = shiftSessionId;

    const logs = await ProductionLog.find(match)
      .populate("machine", "name type")
      .populate("loggedBy", "name role")
      .sort({ timestamp: -1 })
      .limit(Number(limit));
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch production logs", error: err.message });
  }
}

module.exports = { logProduction, getProductionLogs };
