const express = require("express");
const router = express.Router();
const {
  getSimulatorStatus,
  toggleSimulator,
} = require("../simulator/telemetrySimulator");
const Machine = require("../models/Machine");
const DowntimeLog = require("../models/DowntimeLog");

router.get("/status", (req, res) => {
  res.json(getSimulatorStatus());
});

router.post("/toggle", (req, res) => {
  const isRunning = toggleSimulator();
  const io = req.app.get("io");
  if (io) {
    io.emit("simulatorStateChange", { isRunning });
  }
  res.json({ isRunning });
});

// Helper for review presentations: trigger a test breakdown event on demand
router.post("/trigger-anomaly", async (req, res) => {
  try {
    const { machineId, reason = "BREAKDOWN", notes = "Simulated anomaly event" } = req.body;
    let target = null;
    if (machineId) {
      target = await Machine.findById(machineId);
    } else {
      target = await Machine.findOne({ status: "RUNNING" });
    }

    if (!target) return res.status(404).json({ message: "No running machine found to trigger anomaly" });

    target.status = "DOWN";
    target.currentShift.totalDowntimeMinutes += 15;
    await target.save();

    const log = await DowntimeLog.create({
      machine: target._id,
      reason,
      notes,
      startTime: new Date(),
    });

    const populatedLog = await DowntimeLog.findById(log._id).populate("machine", "name type lineId");

    const io = req.app.get("io");
    if (io) {
      io.emit("machineStatusUpdate", { _id: target._id, status: "DOWN", name: target.name });
      io.emit("downtimeStarted", populatedLog || log);
    }

    res.json({ message: "Anomaly triggered", machine: target, log: populatedLog });
  } catch (err) {
    res.status(500).json({ message: "Failed to trigger anomaly", error: err.message });
  }
});

module.exports = router;
