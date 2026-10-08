const mongoose = require("mongoose");

/**
 * Tracks one operator shift from start to end.
 * Only one active session (endTime = null) is allowed per operator.
 */
const shiftSessionSchema = new mongoose.Schema(
  {
    operator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    machine: { type: mongoose.Schema.Types.ObjectId, ref: "Machine", required: true },
    shiftName: { type: String, default: "Shift A" },
    startTime: { type: Date, required: true, default: Date.now },
    endTime: { type: Date },       // null while shift is active
    targetUnits: { type: Number, default: 0 },
    notes: { type: String },       // operator notes at end of shift

    // Snapshot computed at shift end (for summary / reporting)
    summary: {
      goodUnits: { type: Number, default: 0 },
      rejectedUnits: { type: Number, default: 0 },
      downtimeMinutes: { type: Number, default: 0 },
      oee: { type: Number, default: 0 },
      availability: { type: Number, default: 0 },
      performance: { type: Number, default: 0 },
      quality: { type: Number, default: 0 },
      downtimeByReason: { type: Map, of: Number },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ShiftSession", shiftSessionSchema);
