const mongoose = require("mongoose");

/**
 * A maintenance or supervisor call raised by an operator.
 * MAINTENANCE / SUPERVISOR users can acknowledge and resolve.
 */
const maintenanceRequestSchema = new mongoose.Schema(
  {
    machine: { type: mongoose.Schema.Types.ObjectId, ref: "Machine", required: true },
    raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    target: {
      type: String,
      enum: ["MAINTENANCE", "SUPERVISOR"],
      required: true,
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "MEDIUM",
    },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ["OPEN", "ACKNOWLEDGED", "RESOLVED"],
      default: "OPEN",
    },
    acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    acknowledgedAt: { type: Date },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolvedAt: { type: Date },
    shiftSession: { type: mongoose.Schema.Types.ObjectId, ref: "ShiftSession" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MaintenanceRequest", maintenanceRequestSchema);
