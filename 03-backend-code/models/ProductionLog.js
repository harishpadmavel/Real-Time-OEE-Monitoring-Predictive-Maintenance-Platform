const mongoose = require("mongoose");

/**
 * A time-bucketed snapshot of production output for a machine.
 * In a real deployment this would be written automatically by
 * a PLC/IoT gateway every few minutes; for the student demo it
 * can also be inserted manually or by a simulator script.
 */
const productionLogSchema = new mongoose.Schema(
  {
    machine: { type: mongoose.Schema.Types.ObjectId, ref: "Machine", required: true },
    timestamp: { type: Date, default: Date.now },
    goodUnits: { type: Number, required: true, default: 0 },
    defectiveUnits: { type: Number, required: true, default: 0 },
    runTimeMinutes: { type: Number, required: true, default: 0 }, // machine actually running in this window
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProductionLog", productionLogSchema);
