const mongoose = require("mongoose");

/**
 * One row per downtime event. This is what powers the
 * "downtime reasons" breakdown chart on the dashboard.
 */
const downtimeLogSchema = new mongoose.Schema(
  {
    machine: { type: mongoose.Schema.Types.ObjectId, ref: "Machine", required: true },
    reason: {
      type: String,
      enum: [
        "BREAKDOWN",
        "MATERIAL_SHORTAGE",
        "CHANGEOVER_SETUP",
        "MINOR_STOPPAGE",
        "QUALITY_ISSUE",
        "OPERATOR_UNAVAILABLE",
        "OTHER",
      ],
      required: true,
    },
    notes: { type: String },              // optional free-text from the operator
    startTime: { type: Date, required: true },
    endTime: { type: Date },              // null while the downtime is still ongoing
    durationMinutes: { type: Number },    // computed once endTime is set
    loggedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DowntimeLog", downtimeLogSchema);
