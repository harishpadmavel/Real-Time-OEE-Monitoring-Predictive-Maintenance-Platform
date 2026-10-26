/**
 * POST /api/seed/demo  — Admin-only route that re-seeds all demo data
 * through the already-running server's Mongoose connection.
 * Useful when the seed script can't connect directly.
 */
const express = require("express");
const router = express.Router();
const { protect, allowRoles } = require("../middleware/auth");
const Machine = require("../models/Machine");
const User = require("../models/User");
const DowntimeLog = require("../models/DowntimeLog");
const ProductionLog = require("../models/ProductionLog");
const ShiftSession = require("../models/ShiftSession");
const MaintenanceRequest = require("../models/MaintenanceRequest");
const HandoverNote = require("../models/HandoverNote");

const machines = [
  // LINE-A: Automotive Body Shop
  { name: "CNC Machining Center A1", type: "CNC", lineId: "LINE-A", idealCycleTimeSeconds: 25, plannedProductionMinutesPerShift: 480, status: "RUNNING", currentShift: { goodUnits: 680, defectiveUnits: 12, totalRunTimeMinutes: 410, totalDowntimeMinutes: 28 } },
  { name: "Stamping Press A2", type: "Press", lineId: "LINE-A", idealCycleTimeSeconds: 15, plannedProductionMinutesPerShift: 480, status: "RUNNING", currentShift: { goodUnits: 1120, defectiveUnits: 34, totalRunTimeMinutes: 388, totalDowntimeMinutes: 52 } },
  { name: "Robotic Welding Cell A3", type: "Welding", lineId: "LINE-A", idealCycleTimeSeconds: 40, plannedProductionMinutesPerShift: 480, status: "DOWN", currentShift: { goodUnits: 385, defectiveUnits: 18, totalRunTimeMinutes: 320, totalDowntimeMinutes: 110 } },
  { name: "Assembly Station A4", type: "Assembly", lineId: "LINE-A", idealCycleTimeSeconds: 60, plannedProductionMinutesPerShift: 480, status: "RUNNING", currentShift: { goodUnits: 295, defectiveUnits: 6, totalRunTimeMinutes: 412, totalDowntimeMinutes: 42 } },
  // LINE-B: Precision Parts
  { name: "Lathe Machine B1", type: "Lathe", lineId: "LINE-B", idealCycleTimeSeconds: 35, plannedProductionMinutesPerShift: 480, status: "RUNNING", currentShift: { goodUnits: 510, defectiveUnits: 9, totalRunTimeMinutes: 445, totalDowntimeMinutes: 20 } },
  { name: "Milling Center B2", type: "Milling", lineId: "LINE-B", idealCycleTimeSeconds: 45, plannedProductionMinutesPerShift: 480, status: "MAINTENANCE", currentShift: { goodUnits: 210, defectiveUnits: 5, totalRunTimeMinutes: 200, totalDowntimeMinutes: 120 } },
  { name: "Grinding Machine B3", type: "CNC", lineId: "LINE-B", idealCycleTimeSeconds: 20, plannedProductionMinutesPerShift: 480, status: "RUNNING", currentShift: { goodUnits: 840, defectiveUnits: 22, totalRunTimeMinutes: 430, totalDowntimeMinutes: 18 } },
  { name: "Quality Inspection B4", type: "Assembly", lineId: "LINE-B", idealCycleTimeSeconds: 30, plannedProductionMinutesPerShift: 480, status: "IDLE", currentShift: { goodUnits: 620, defectiveUnits: 14, totalRunTimeMinutes: 350, totalDowntimeMinutes: 60 } },
  // LINE-C: Paint & Finishing
  { name: "E-Coat Paint System C1", type: "Painting", lineId: "LINE-C", idealCycleTimeSeconds: 90, plannedProductionMinutesPerShift: 480, status: "RUNNING", currentShift: { goodUnits: 188, defectiveUnits: 9, totalRunTimeMinutes: 395, totalDowntimeMinutes: 65 } },
  { name: "Powder Coating Unit C2", type: "Painting", lineId: "LINE-C", idealCycleTimeSeconds: 75, plannedProductionMinutesPerShift: 480, status: "RUNNING", currentShift: { goodUnits: 240, defectiveUnits: 7, totalRunTimeMinutes: 420, totalDowntimeMinutes: 35 } },
  { name: "Robotic Paint Arm C3", type: "Robot", lineId: "LINE-C", idealCycleTimeSeconds: 55, plannedProductionMinutesPerShift: 480, status: "RUNNING", currentShift: { goodUnits: 480, defectiveUnits: 11, totalRunTimeMinutes: 460, totalDowntimeMinutes: 10 } },
  { name: "Curing Oven C4", type: "Other", lineId: "LINE-C", idealCycleTimeSeconds: 120, plannedProductionMinutesPerShift: 480, status: "IDLE", currentShift: { goodUnits: 140, defectiveUnits: 4, totalRunTimeMinutes: 290, totalDowntimeMinutes: 90 } },
  // LINE-D: Final Assembly & Conveyor
  { name: "Conveyor Assembly D1", type: "Conveyor", lineId: "LINE-D", idealCycleTimeSeconds: 50, plannedProductionMinutesPerShift: 480, status: "RUNNING", currentShift: { goodUnits: 550, defectiveUnits: 15, totalRunTimeMinutes: 440, totalDowntimeMinutes: 22 } },
  { name: "Torque Robot D2", type: "Robot", lineId: "LINE-D", idealCycleTimeSeconds: 22, plannedProductionMinutesPerShift: 480, status: "RUNNING", currentShift: { goodUnits: 960, defectiveUnits: 28, totalRunTimeMinutes: 455, totalDowntimeMinutes: 12 } },
  { name: "Final QC Station D3", type: "Assembly", lineId: "LINE-D", idealCycleTimeSeconds: 70, plannedProductionMinutesPerShift: 480, status: "DOWN", currentShift: { goodUnits: 320, defectiveUnits: 20, totalRunTimeMinutes: 360, totalDowntimeMinutes: 95 } },
  { name: "Packaging Robot D4", type: "Robot", lineId: "LINE-D", idealCycleTimeSeconds: 18, plannedProductionMinutesPerShift: 480, status: "RUNNING", currentShift: { goodUnits: 1100, defectiveUnits: 18, totalRunTimeMinutes: 465, totalDowntimeMinutes: 8 } },
];

router.post("/demo", protect, allowRoles("ADMIN", "MANAGER"), async (req, res) => {
  try {
    // Wipe existing data
    await Machine.deleteMany({});
    await User.deleteMany({});
    await DowntimeLog.deleteMany({});
    await ProductionLog.deleteMany({});
    await ShiftSession.deleteMany({});
    await MaintenanceRequest.deleteMany({});
    await HandoverNote.deleteMany({});

    const createdMachines = await Machine.insertMany(machines);
    const allMachineIds = createdMachines.map((m) => m._id);

    const userDefs = [
      { name: "Admin User", email: "admin@oee.local", password: "admin123", role: "ADMIN" },
      { name: "Plant Manager", email: "manager@oee.local", password: "manager123", role: "MANAGER" },
      { name: "Line Supervisor A", email: "supervisor@oee.local", password: "super123", role: "SUPERVISOR", assignedLineId: "LINE-A" },
      { name: "Line Supervisor B", email: "supervisorb@oee.local", password: "super123", role: "SUPERVISOR", assignedLineId: "LINE-B" },
      { name: "Maintenance Tech", email: "maintenance@oee.local", password: "maint123", role: "MAINTENANCE" },
      { name: "Shop Operator (All Access)", email: "operator@oee.local", password: "oper123", role: "OPERATOR", assignedLineId: "LINE-A", assignedMachines: allMachineIds },
      { name: "Operator Line B", email: "operator2@oee.local", password: "oper123", role: "OPERATOR", assignedLineId: "LINE-B", assignedMachines: createdMachines.slice(4, 8).map((m) => m._id) },
      { name: "Operator Line C", email: "operator3@oee.local", password: "oper123", role: "OPERATOR", assignedLineId: "LINE-C", assignedMachines: createdMachines.slice(8, 12).map((m) => m._id) },
      { name: "Operator Line D", email: "operator4@oee.local", password: "oper123", role: "OPERATOR", assignedLineId: "LINE-D", assignedMachines: createdMachines.slice(12, 16).map((m) => m._id) },
    ];

    const createdUsers = [];
    for (const u of userDefs) {
      createdUsers.push(await User.create(u));
    }

    const [, , supervisorA, , maintenanceTech, operatorAll, operatorB, operatorC, operatorD] = createdUsers;
    const now = Date.now();

    // Downtime logs
    await DowntimeLog.insertMany([
      { machine: createdMachines[0]._id, reason: "MINOR_STOPPAGE", notes: "Chip clearance and tool check", startTime: new Date(now - 45 * 60000), endTime: new Date(now - 38 * 60000), durationMinutes: 7, loggedBy: operatorAll._id },
      { machine: createdMachines[1]._id, reason: "CHANGEOVER_SETUP", notes: "Die set exchange for side panel batch B", startTime: new Date(now - 120 * 60000), endTime: new Date(now - 88 * 60000), durationMinutes: 32, loggedBy: operatorAll._id },
      { machine: createdMachines[2]._id, reason: "BREAKDOWN", notes: "Electrode wear and overheating sensor trip — awaiting maintenance", startTime: new Date(now - 35 * 60000), loggedBy: supervisorA._id },
      { machine: createdMachines[5]._id, reason: "OTHER", notes: "Scheduled lubrication and spindle calibration", startTime: new Date(now - 90 * 60000), loggedBy: maintenanceTech._id },
      { machine: createdMachines[8]._id, reason: "QUALITY_ISSUE", notes: "Viscosity test recalibration and spray nozzle cleaning", startTime: new Date(now - 180 * 60000), endTime: new Date(now - 152 * 60000), durationMinutes: 28, loggedBy: operatorC._id },
      { machine: createdMachines[14]._id, reason: "BREAKDOWN", notes: "Vision system camera failure — replacement part ordered", startTime: new Date(now - 60 * 60000), loggedBy: operatorD._id },
      { machine: createdMachines[3]._id, reason: "MATERIAL_SHORTAGE", notes: "Fastener bin replenishment delay from warehouse", startTime: new Date(now - 310 * 60000), endTime: new Date(now - 286 * 60000), durationMinutes: 24, loggedBy: operatorAll._id },
      { machine: createdMachines[4]._id, reason: "MINOR_STOPPAGE", notes: "Coolant top-up and chip conveyor jam clearance", startTime: new Date(now - 200 * 60000), endTime: new Date(now - 193 * 60000), durationMinutes: 7, loggedBy: operatorB._id },
      { machine: createdMachines[12]._id, reason: "CHANGEOVER_SETUP", notes: "Product changeover — new fixture plates installed", startTime: new Date(now - 250 * 60000), endTime: new Date(now - 228 * 60000), durationMinutes: 22, loggedBy: operatorD._id },
      { machine: createdMachines[2]._id, reason: "BREAKDOWN", notes: "Wire feed motor jam", startTime: new Date(now - 210 * 60000), endTime: new Date(now - 165 * 60000), durationMinutes: 45, loggedBy: supervisorA._id },
    ]);

    // 7-day production history
    const baseOEEs = [82, 74, 58, 77, 88, 65, 90, 71, 69, 85, 92, 62, 80, 94, 55, 88];
    const historyLogs = [];
    for (let i = 6; i >= 0; i--) {
      const dayDate = new Date(now - i * 86400000);
      dayDate.setHours(14, 0, 0, 0);
      createdMachines.forEach((m, idx) => {
        const oee = Math.min(98, Math.max(40, baseOEEs[idx] + Math.sin(i * 1.5 + idx) * 7));
        const total = Math.round((480 * 60) / m.idealCycleTimeSeconds * (oee / 100));
        const def = Math.round(total * 0.022);
        historyLogs.push({ machine: m._id, timestamp: dayDate, goodUnits: total - def, defectiveUnits: def, runTimeMinutes: Math.round(480 * (oee / 100) * 1.05) });
      });
    }
    await ProductionLog.insertMany(historyLogs);

    // Maintenance requests
    await MaintenanceRequest.insertMany([
      { machine: createdMachines[2]._id, raisedBy: supervisorA._id, target: "MAINTENANCE", priority: "HIGH", description: "Electrode assembly worn out — full replacement required. Machine has tripped twice this shift.", status: "OPEN" },
      { machine: createdMachines[5]._id, raisedBy: operatorB._id, target: "MAINTENANCE", priority: "MEDIUM", description: "Scheduled preventive maintenance: spindle bearing inspection & lubrication.", status: "ACKNOWLEDGED", acknowledgedBy: maintenanceTech._id, acknowledgedAt: new Date(now - 85 * 60000) },
      { machine: createdMachines[14]._id, raisedBy: operatorD._id, target: "MAINTENANCE", priority: "HIGH", description: "Vision system camera malfunctioning — urgent fix needed.", status: "OPEN" },
      { machine: createdMachines[0]._id, raisedBy: operatorAll._id, target: "SUPERVISOR", priority: "LOW", description: "Coolant filter needs replacement — due in next 48 hours.", status: "OPEN" },
    ]);

    // Handover notes
    await HandoverNote.insertMany([
      { machine: createdMachines[0]._id, author: operatorAll._id, text: "CNC A1 running well. Tool #3 at 85% wear — replace before end of next shift." },
      { machine: createdMachines[2]._id, author: supervisorA._id, text: "Welding A3 is DOWN — maintenance called. Do not start production until confirmed safe." },
    ]);

    const io = req.app.get("io");
    if (io) io.emit("machineStatusUpdate", { reload: true });

    res.json({
      success: true,
      message: "Demo data seeded successfully!",
      summary: {
        machines: createdMachines.length,
        users: createdUsers.length,
        productionLogs: historyLogs.length,
        credentials: {
          admin: "admin@oee.local / admin123",
          manager: "manager@oee.local / manager123",
          supervisorA: "supervisor@oee.local / super123",
          supervisorB: "supervisorb@oee.local / super123",
          maintenance: "maintenance@oee.local / maint123",
          operatorAllMachines: "operator@oee.local / oper123",
          operatorLineB: "operator2@oee.local / oper123",
          operatorLineC: "operator3@oee.local / oper123",
          operatorLineD: "operator4@oee.local / oper123",
        },
      },
    });
  } catch (err) {
    console.error("Demo seed error:", err);
    res.status(500).json({ success: false, message: "Seeding failed", error: err.message });
  }
});

module.exports = router;
