const Machine = require("../models/Machine");

// GET /api/machines - list all machines with live status (for the dashboard grid)
async function getMachines(req, res) {
  const machines = await Machine.find().sort({ lineId: 1, name: 1 });
  res.json(machines);
}

// GET /api/machines/:id
async function getMachineById(req, res) {
  const machine = await Machine.findById(req.params.id);
  if (!machine) return res.status(404).json({ message: "Machine not found" });
  res.json(machine);
}

// POST /api/machines - Admin/Manager adds a new machine to the system
async function createMachine(req, res) {
  const machine = await Machine.create(req.body);
  res.status(201).json(machine);
}

// PATCH /api/machines/:id/status - operator/system updates machine status live
async function updateMachineStatus(req, res) {
  const { status } = req.body;
  const machine = await Machine.findByIdAndUpdate(
    req.params.id,
    { status, lastHeartbeat: new Date() },
    { new: true }
  );
  if (!machine) return res.status(404).json({ message: "Machine not found" });

  // Push the update to every connected dashboard instantly
  const io = req.app.get("io");
  io.emit("machineStatusUpdate", machine);

  res.json(machine);
}

module.exports = { getMachines, getMachineById, createMachine, updateMachineStatus };
