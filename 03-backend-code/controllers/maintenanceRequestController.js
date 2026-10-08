const MaintenanceRequest = require("../models/MaintenanceRequest");
const Machine = require("../models/Machine");

// POST /api/maintenance-requests
async function createRequest(req, res) {
  try {
    const { machineId, target, priority = "MEDIUM", description, shiftSessionId } = req.body;

    if (!machineId) return res.status(400).json({ message: "machineId is required" });
    if (!target || !["MAINTENANCE", "SUPERVISOR"].includes(target)) {
      return res.status(400).json({ message: "target must be MAINTENANCE or SUPERVISOR" });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ message: "description is required" });
    }

    const machine = await Machine.findById(machineId);
    if (!machine) return res.status(404).json({ message: "Machine not found" });

    const request = await MaintenanceRequest.create({
      machine: machineId,
      raisedBy: req.user.id,
      target,
      priority,
      description: description.trim(),
      shiftSession: shiftSessionId || undefined,
      status: "OPEN",
    });

    const populated = await MaintenanceRequest.findById(request._id)
      .populate("machine", "name type lineId status")
      .populate("raisedBy", "name email role");

    const io = req.app.get("io");
    if (io) {
      io.emit("maintenanceRequestCreated", populated);
    }

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Failed to create request", error: err.message });
  }
}

// GET /api/maintenance-requests
async function getRequests(req, res) {
  try {
    const { machineId, status, target } = req.query;
    const filter = {};

    if (machineId) filter.machine = machineId;
    if (status) filter.status = status;
    if (target) filter.target = target;

    // If operator, they can filter or see requests for their assigned machines or raised by them
    if (req.user.role === "OPERATOR" && !machineId) {
      filter.$or = [
        { raisedBy: req.user.id },
      ];
    }

    const requests = await MaintenanceRequest.find(filter)
      .populate("machine", "name type lineId status")
      .populate("raisedBy", "name email role")
      .populate("acknowledgedBy", "name email role")
      .populate("resolvedBy", "name email role")
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch requests", error: err.message });
  }
}

// PATCH /api/maintenance-requests/:id/acknowledge
async function acknowledgeRequest(req, res) {
  try {
    const request = await MaintenanceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    request.status = "ACKNOWLEDGED";
    request.acknowledgedBy = req.user.id;
    request.acknowledgedAt = new Date();
    await request.save();

    const populated = await MaintenanceRequest.findById(request._id)
      .populate("machine", "name type lineId status")
      .populate("raisedBy", "name email role")
      .populate("acknowledgedBy", "name email role")
      .populate("resolvedBy", "name email role");

    const io = req.app.get("io");
    if (io) {
      io.emit("maintenanceRequestUpdated", populated);
    }

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: "Failed to acknowledge request", error: err.message });
  }
}

// PATCH /api/maintenance-requests/:id/resolve
async function resolveRequest(req, res) {
  try {
    const request = await MaintenanceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    request.status = "RESOLVED";
    request.resolvedBy = req.user.id;
    request.resolvedAt = new Date();
    await request.save();

    const populated = await MaintenanceRequest.findById(request._id)
      .populate("machine", "name type lineId status")
      .populate("raisedBy", "name email role")
      .populate("acknowledgedBy", "name email role")
      .populate("resolvedBy", "name email role");

    const io = req.app.get("io");
    if (io) {
      io.emit("maintenanceRequestUpdated", populated);
    }

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: "Failed to resolve request", error: err.message });
  }
}

module.exports = { createRequest, getRequests, acknowledgeRequest, resolveRequest };
