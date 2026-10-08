const ShiftSession = require("../models/ShiftSession");
const DowntimeLog = require("../models/DowntimeLog");
const ProductionLog = require("../models/ProductionLog");
const Machine = require("../models/Machine");
const { calculateOEE } = require("../utils/calculateOEE");

// POST /api/shifts/start
async function startShift(req, res) {
  try {
    const { machineId, shiftName = "Shift A", targetUnits = 0 } = req.body;
    if (!machineId) return res.status(400).json({ message: "machineId is required" });

    // Only one active shift per operator
    const existing = await ShiftSession.findOne({ operator: req.user.id, endTime: null });
    if (existing) {
      return res.status(409).json({ message: "You already have an active shift. End it before starting a new one." });
    }

    const machine = await Machine.findById(machineId);
    if (!machine) return res.status(404).json({ message: "Machine not found" });

    const session = await ShiftSession.create({
      operator: req.user.id,
      machine: machineId,
      shiftName,
      targetUnits,
      startTime: new Date(),
    });

    const populated = await ShiftSession.findById(session._id)
      .populate("operator", "name email role")
      .populate("machine", "name type lineId");

    const io = req.app.get("io");
    if (io) io.emit("shiftStarted", populated);

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Failed to start shift", error: err.message });
  }
}

// PATCH /api/shifts/:id/end
async function endShift(req, res) {
  try {
    const { notes } = req.body;
    const session = await ShiftSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: "Shift not found" });
    if (session.operator.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not your shift" });
    }
    if (session.endTime) return res.status(409).json({ message: "Shift already ended" });

    session.endTime = new Date();
    if (notes) session.notes = notes;

    // Compute summary from production logs and downtime logs during this shift
    const [prodLogs, downtimeLogs] = await Promise.all([
      ProductionLog.find({ machine: session.machine, shiftSession: session._id }),
      DowntimeLog.find({ machine: session.machine, startTime: { $gte: session.startTime }, endTime: { $exists: true } }),
    ]);

    const goodUnits = prodLogs.reduce((s, l) => s + (l.goodUnits || 0), 0);
    const rejectedUnits = prodLogs.reduce((s, l) => s + (l.defectiveUnits || 0), 0);
    const totalDowntimeMinutes = downtimeLogs.reduce((s, l) => s + (l.durationMinutes || 0), 0);

    const downtimeByReason = {};
    downtimeLogs.forEach((l) => {
      downtimeByReason[l.reason] = (downtimeByReason[l.reason] || 0) + (l.durationMinutes || 0);
    });

    const machine = await Machine.findById(session.machine);
    const oeeCalc = calculateOEE({
      plannedProductionMinutes: machine?.plannedProductionMinutesPerShift || 480,
      downtimeMinutes: totalDowntimeMinutes,
      idealCycleTimeSeconds: machine?.idealCycleTimeSeconds || 30,
      goodUnits,
      defectiveUnits: rejectedUnits,
    });

    session.summary = {
      goodUnits,
      rejectedUnits,
      downtimeMinutes: totalDowntimeMinutes,
      downtimeByReason,
      ...oeeCalc,
    };

    await session.save();

    const populated = await ShiftSession.findById(session._id)
      .populate("operator", "name email role")
      .populate("machine", "name type lineId");

    const io = req.app.get("io");
    if (io) io.emit("shiftEnded", populated);

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: "Failed to end shift", error: err.message });
  }
}

// GET /api/shifts/active  — current operator's active shift
async function getActiveShift(req, res) {
  try {
    const session = await ShiftSession.findOne({ operator: req.user.id, endTime: null })
      .populate("machine", "name type lineId status currentShift idealCycleTimeSeconds plannedProductionMinutesPerShift");
    res.json(session || null);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch active shift", error: err.message });
  }
}

// GET /api/shifts/my  — current operator's shift history (last 30)
async function getMyShifts(req, res) {
  try {
    const sessions = await ShiftSession.find({ operator: req.user.id })
      .sort({ startTime: -1 })
      .limit(30)
      .populate("machine", "name type lineId");
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch shift history", error: err.message });
  }
}

module.exports = { startShift, endShift, getActiveShift, getMyShifts };
