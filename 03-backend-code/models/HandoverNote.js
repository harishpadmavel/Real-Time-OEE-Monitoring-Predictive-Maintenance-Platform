const mongoose = require("mongoose");

/**
 * A free-text note left by an operator at end of shift for the next operator.
 * Shown at the next operator's Start Shift screen.
 */
const handoverNoteSchema = new mongoose.Schema(
  {
    machine: { type: mongoose.Schema.Types.ObjectId, ref: "Machine", required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    shiftSession: { type: mongoose.Schema.Types.ObjectId, ref: "ShiftSession" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HandoverNote", handoverNoteSchema);
