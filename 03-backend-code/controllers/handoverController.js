const HandoverNote = require("../models/HandoverNote");
const Machine = require("../models/Machine");

// POST /api/handover
async function createNote(req, res) {
  try {
    const { machineId, text, shiftSessionId } = req.body;
    if (!machineId) return res.status(400).json({ message: "machineId is required" });
    if (!text || !text.trim()) return res.status(400).json({ message: "Note text is required" });

    const machine = await Machine.findById(machineId);
    if (!machine) return res.status(404).json({ message: "Machine not found" });

    const note = await HandoverNote.create({
      machine: machineId,
      author: req.user.id,
      text: text.trim(),
      shiftSession: shiftSessionId || undefined,
    });

    const populated = await HandoverNote.findById(note._id)
      .populate("author", "name email role")
      .populate("machine", "name");

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Failed to create handover note", error: err.message });
  }
}

// GET /api/handover/latest?machineId=...
async function getLatestNote(req, res) {
  try {
    const { machineId } = req.query;
    if (!machineId) return res.status(400).json({ message: "machineId query param is required" });

    const note = await HandoverNote.findOne({ machine: machineId })
      .sort({ createdAt: -1 })
      .populate("author", "name email role")
      .populate("machine", "name");

    res.json(note || null);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch latest handover note", error: err.message });
  }
}

// GET /api/handover/history?machineId=...
async function getNoteHistory(req, res) {
  try {
    const { machineId, limit = 20 } = req.query;
    if (!machineId) return res.status(400).json({ message: "machineId query param is required" });

    const notes = await HandoverNote.find({ machine: machineId })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate("author", "name email role");

    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch handover history", error: err.message });
  }
}

module.exports = { createNote, getLatestNote, getNoteHistory };
