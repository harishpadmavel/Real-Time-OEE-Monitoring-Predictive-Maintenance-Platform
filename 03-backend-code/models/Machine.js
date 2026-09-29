const mongoose = require("mongoose");

/**
 * Represents one physical machine on the shop floor
 * (e.g., CNC Machine, Stamping Press, Welding Station, Assembly Line, Painting Unit)
 */
const machineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },              // e.g. "CNC Machine 1"
    type: { type: String, required: true },               // e.g. "CNC", "Press", "Welding"
    lineId: { type: String, required: true },             // which production line it belongs to
    status: {
      type: String,
      enum: ["RUNNING", "IDLE", "DOWN", "MAINTENANCE"],
      default: "IDLE",
    },
    // Standard values used in OEE calculation
    idealCycleTimeSeconds: { type: Number, required: true }, // ideal time to make 1 unit
    plannedProductionMinutesPerShift: { type: Number, default: 480 }, // e.g. 8 hr shift

    // Rolling counters for the current shift (reset by a scheduled job in a real system)
    currentShift: {
      goodUnits: { type: Number, default: 0 },
      defectiveUnits: { type: Number, default: 0 },
      totalRunTimeMinutes: { type: Number, default: 0 },
      totalDowntimeMinutes: { type: Number, default: 0 },
    },

    lastHeartbeat: { type: Date, default: Date.now }, // last time this machine "checked in"
  },
  { timestamps: true }
);

module.exports = mongoose.model("Machine", machineSchema);
