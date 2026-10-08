const DowntimeLog = require("../models/DowntimeLog");
const Machine = require("../models/Machine");

// GET /api/downtime - list downtime logs with machine details
async function getDowntimeLogs(req, res) {
  try {
    const { machineId, limit = 50 } = req.query;
    const match = {};
    if (machineId) match.machine = machineId;

    const logs = await DowntimeLog.find(match)
      .populate("machine", "name type lineId")
      .populate("loggedBy", "name email role")
      .sort({ startTime: -1 })
      .limit(Number(limit));

    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch downtime logs", error: err.message });
  }
}

// POST /api/downtime - operator logs a new downtime event (machine just stopped)
async function startDowntime(req, res) {
  const { machineId, reason, notes } = req.body;
  if (!machineId) return res.status(400).json({ message: "machineId is required" });
  if (!reason) return res.status(400).json({ message: "reason is required" });

  // Prevent starting a second open downtime on the same machine
  const openDowntime = await DowntimeLog.findOne({ machine: machineId, endTime: null });
  if (openDowntime) {
    return res.status(409).json({
      message: "An open downtime event already exists on this machine. Resolve it before starting another.",
      openDowntime,
    });
  }

  const log = await DowntimeLog.create({
    machine: machineId,
    reason,
    notes,
    startTime: new Date(),
    loggedBy: req.user ? req.user.id : undefined,
  });

  await Machine.findByIdAndUpdate(machineId, { status: "DOWN" });

  const populatedLog = await DowntimeLog.findById(log._id)
    .populate("machine", "name type lineId")
    .populate("loggedBy", "name email role");

  const io = req.app.get("io");
  if (io) {
    io.emit("downtimeStarted", populatedLog || log);
    io.emit("machineStatusUpdate", { _id: machineId, status: "DOWN" });
  }

  res.status(201).json(populatedLog || log);
}

// PATCH /api/downtime/:id/resolve - machine is back up, close out the downtime log
async function resolveDowntime(req, res) {
  const log = await DowntimeLog.findById(req.params.id);
  if (!log) return res.status(404).json({ message: "Downtime log not found" });

  // Check operator assignment if user is an operator
  if (req.user && req.user.role === "OPERATOR") {
    const User = require("../models/User");
    const dbUser = await User.findById(req.user.id).select("assignedMachines");
    const assigned = (dbUser?.assignedMachines || []).map((m) => m.toString());
    if (!assigned.includes(log.machine.toString())) {
      return res.status(403).json({ message: "Forbidden: machine not in your assigned list" });
    }
  }

  log.endTime = new Date();
  log.durationMinutes = Math.max(1, Math.round((log.endTime - log.startTime) / 60000));
  await log.save();

  await Machine.findByIdAndUpdate(log.machine, { status: "RUNNING" });

  const populatedLog = await DowntimeLog.findById(log._id)
    .populate("machine", "name type lineId")
    .populate("loggedBy", "name email role");

  const io = req.app.get("io");
  if (io) {
    io.emit("downtimeResolved", populatedLog || log);
    io.emit("machineStatusUpdate", { _id: log.machine, status: "RUNNING" });
  }

  res.json(populatedLog || log);
}

// GET /api/downtime/reasons-summary?machineId=&from=&to=
// Powers the "downtime reasons" breakdown chart
async function getReasonsSummary(req, res) {
  const { machineId, from, to } = req.query;
  const match = {};
  if (machineId) match.machine = machineId;
  if (from || to) {
    match.startTime = {};
    if (from) match.startTime.$gte = new Date(from);
    if (to) match.startTime.$lte = new Date(to);
  }

  const summary = await DowntimeLog.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$reason",
        totalMinutes: { $sum: "$durationMinutes" },
        count: { $sum: 1 },
      },
    },
    { $sort: { totalMinutes: -1 } },
  ]);

  res.json(summary);
}

module.exports = { getDowntimeLogs, startDowntime, resolveDowntime, getReasonsSummary };

