const mongoose = require("mongoose");

/**
 * A time-bucketed snapshot of production output for a machine.
 * In a real deployment this would be written automatically by
 * a PLC/IoT gateway every few minutes; for the student demo it
 * can also be inserted manually or by a simulator script.
 *
 * Fields added for operator module (all optional, backward compatible):
 *  - rejectReason: why units were rejected (required when defectiveUnits > 0 and logged manually)
 *  - loggedBy: the operator who submitted this entry
 *  - source: "SIMULATOR" | "MANUAL" (defaults to SIMULATOR for existing behaviour)
 *  - shiftSession: ties the entry to an active shift
 */
const productionLogSchema = new mongoose.Schema(
  {
    machine: { type: mongoose.Schema.Types.ObjectId, ref: "Machine", required: true },
    timestamp: { type: Date, default: Date.now },
    goodUnits: { type: Number, required: true, default: 0 },
    defectiveUnits: { type: Number, required: true, default: 0 },
    runTimeMinutes: { type: Number, required: true, default: 0 }, // machine actually running in this window

    // Operator module additions ─────────────────────────────────
    rejectReason: {
      type: String,
      enum: [
        "DIMENSION_OUT_OF_SPEC",
        "SURFACE_DEFECT",
        "WELD_DEFECT",
        "PAINT_DEFECT",
        "OTHER",
      ],
    },
    loggedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    source: { type: String, enum: ["SIMULATOR", "MANUAL"], default: "SIMULATOR" },
    shiftSession: { type: mongoose.Schema.Types.ObjectId, ref: "ShiftSession" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProductionLog", productionLogSchema);
