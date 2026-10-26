require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Machine = require("../models/Machine");
const User = require("../models/User");
const DowntimeLog = require("../models/DowntimeLog");
const ProductionLog = require("../models/ProductionLog");
const ShiftSession = require("../models/ShiftSession");
const MaintenanceRequest = require("../models/MaintenanceRequest");
const HandoverNote = require("../models/HandoverNote");

// ─── 16 Sample Machines across 4 production lines ────────────────────────────
const machines = [
  // ── LINE-A: Automotive Body Shop ─────────────────────────────────────────
  {
    name: "CNC Machining Center A1",
    type: "CNC",
    lineId: "LINE-A",
    idealCycleTimeSeconds: 25,
    plannedProductionMinutesPerShift: 480,
    status: "RUNNING",
    currentShift: { goodUnits: 680, defectiveUnits: 12, totalRunTimeMinutes: 410, totalDowntimeMinutes: 28 },
  },
  {
    name: "Stamping Press A2",
    type: "Press",
    lineId: "LINE-A",
    idealCycleTimeSeconds: 15,
    plannedProductionMinutesPerShift: 480,
    status: "RUNNING",
    currentShift: { goodUnits: 1120, defectiveUnits: 34, totalRunTimeMinutes: 388, totalDowntimeMinutes: 52 },
  },
  {
    name: "Robotic Welding Cell A3",
    type: "Welding",
    lineId: "LINE-A",
    idealCycleTimeSeconds: 40,
    plannedProductionMinutesPerShift: 480,
    status: "DOWN",
    currentShift: { goodUnits: 385, defectiveUnits: 18, totalRunTimeMinutes: 320, totalDowntimeMinutes: 110 },
  },
  {
    name: "Assembly Station A4",
    type: "Assembly",
    lineId: "LINE-A",
    idealCycleTimeSeconds: 60,
    plannedProductionMinutesPerShift: 480,
    status: "RUNNING",
    currentShift: { goodUnits: 295, defectiveUnits: 6, totalRunTimeMinutes: 412, totalDowntimeMinutes: 42 },
  },

  // ── LINE-B: Precision Parts Manufacturing ────────────────────────────────
  {
    name: "Lathe Machine B1",
    type: "Lathe",
    lineId: "LINE-B",
    idealCycleTimeSeconds: 35,
    plannedProductionMinutesPerShift: 480,
    status: "RUNNING",
    currentShift: { goodUnits: 510, defectiveUnits: 9, totalRunTimeMinutes: 445, totalDowntimeMinutes: 20 },
  },
  {
    name: "Milling Center B2",
    type: "Milling",
    lineId: "LINE-B",
    idealCycleTimeSeconds: 45,
    plannedProductionMinutesPerShift: 480,
    status: "MAINTENANCE",
    currentShift: { goodUnits: 210, defectiveUnits: 5, totalRunTimeMinutes: 200, totalDowntimeMinutes: 120 },
  },
  {
    name: "Grinding Machine B3",
    type: "CNC",
    lineId: "LINE-B",
    idealCycleTimeSeconds: 20,
    plannedProductionMinutesPerShift: 480,
    status: "RUNNING",
    currentShift: { goodUnits: 840, defectiveUnits: 22, totalRunTimeMinutes: 430, totalDowntimeMinutes: 18 },
  },
  {
    name: "Quality Inspection B4",
    type: "Assembly",
    lineId: "LINE-B",
    idealCycleTimeSeconds: 30,
    plannedProductionMinutesPerShift: 480,
    status: "IDLE",
    currentShift: { goodUnits: 620, defectiveUnits: 14, totalRunTimeMinutes: 350, totalDowntimeMinutes: 60 },
  },

  // ── LINE-C: Paint & Finishing ─────────────────────────────────────────────
  {
    name: "E-Coat Paint System C1",
    type: "Painting",
    lineId: "LINE-C",
    idealCycleTimeSeconds: 90,
    plannedProductionMinutesPerShift: 480,
    status: "RUNNING",
    currentShift: { goodUnits: 188, defectiveUnits: 9, totalRunTimeMinutes: 395, totalDowntimeMinutes: 65 },
  },
  {
    name: "Powder Coating Unit C2",
    type: "Painting",
    lineId: "LINE-C",
    idealCycleTimeSeconds: 75,
    plannedProductionMinutesPerShift: 480,
    status: "RUNNING",
    currentShift: { goodUnits: 240, defectiveUnits: 7, totalRunTimeMinutes: 420, totalDowntimeMinutes: 35 },
  },
  {
    name: "Robotic Paint Arm C3",
    type: "Robot",
    lineId: "LINE-C",
    idealCycleTimeSeconds: 55,
    plannedProductionMinutesPerShift: 480,
    status: "RUNNING",
    currentShift: { goodUnits: 480, defectiveUnits: 11, totalRunTimeMinutes: 460, totalDowntimeMinutes: 10 },
  },
  {
    name: "Curing Oven C4",
    type: "Other",
    lineId: "LINE-C",
    idealCycleTimeSeconds: 120,
    plannedProductionMinutesPerShift: 480,
    status: "IDLE",
    currentShift: { goodUnits: 140, defectiveUnits: 4, totalRunTimeMinutes: 290, totalDowntimeMinutes: 90 },
  },

  // ── LINE-D: Final Assembly & Conveyor ─────────────────────────────────────
  {
    name: "Conveyor Assembly D1",
    type: "Conveyor",
    lineId: "LINE-D",
    idealCycleTimeSeconds: 50,
    plannedProductionMinutesPerShift: 480,
    status: "RUNNING",
    currentShift: { goodUnits: 550, defectiveUnits: 15, totalRunTimeMinutes: 440, totalDowntimeMinutes: 22 },
  },
  {
    name: "Torque Robot D2",
    type: "Robot",
    lineId: "LINE-D",
    idealCycleTimeSeconds: 22,
    plannedProductionMinutesPerShift: 480,
    status: "RUNNING",
    currentShift: { goodUnits: 960, defectiveUnits: 28, totalRunTimeMinutes: 455, totalDowntimeMinutes: 12 },
  },
  {
    name: "Final QC Station D3",
    type: "Assembly",
    lineId: "LINE-D",
    idealCycleTimeSeconds: 70,
    plannedProductionMinutesPerShift: 480,
    status: "DOWN",
    currentShift: { goodUnits: 320, defectiveUnits: 20, totalRunTimeMinutes: 360, totalDowntimeMinutes: 95 },
  },
  {
    name: "Packaging Robot D4",
    type: "Robot",
    lineId: "LINE-D",
    idealCycleTimeSeconds: 18,
    plannedProductionMinutesPerShift: 480,
    status: "RUNNING",
    currentShift: { goodUnits: 1100, defectiveUnits: 18, totalRunTimeMinutes: 465, totalDowntimeMinutes: 8 },
  },
];

async function seed() {
  await connectDB();

  // Clear all existing data
  await Machine.deleteMany({});
  await User.deleteMany({});
  await DowntimeLog.deleteMany({});
  await ProductionLog.deleteMany({});
  await ShiftSession.deleteMany({});
  await MaintenanceRequest.deleteMany({});
  await HandoverNote.deleteMany({});

  const createdMachines = await Machine.insertMany(machines);
  console.log(`✅ Inserted ${createdMachines.length} machines across 4 lines.`);

  // All machine IDs — used to grant full access to the demo operator
  const allMachineIds = createdMachines.map((m) => m._id);

  // ─── Users ──────────────────────────────────────────────────────────────────
  const users = [
    {
      name: "Admin User",
      email: "admin@oee.local",
      password: "admin123",
      role: "ADMIN",
    },
    {
      name: "Plant Manager",
      email: "manager@oee.local",
      password: "manager123",
      role: "MANAGER",
    },
    {
      name: "Line Supervisor A",
      email: "supervisor@oee.local",
      password: "super123",
      role: "SUPERVISOR",
      assignedLineId: "LINE-A",
    },
    {
      name: "Line Supervisor B",
      email: "supervisorb@oee.local",
      password: "super123",
      role: "SUPERVISOR",
      assignedLineId: "LINE-B",
    },
    {
      name: "Maintenance Tech",
      email: "maintenance@oee.local",
      password: "maint123",
      role: "MAINTENANCE",
    },
    {
      // Demo operator with access to ALL 16 machines for a full walkthrough
      name: "Shop Operator (All Access)",
      email: "operator@oee.local",
      password: "oper123",
      role: "OPERATOR",
      assignedLineId: "LINE-A",
      assignedMachines: allMachineIds,
    },
    {
      name: "Operator Line B",
      email: "operator2@oee.local",
      password: "oper123",
      role: "OPERATOR",
      assignedLineId: "LINE-B",
      assignedMachines: createdMachines.slice(4, 8).map((m) => m._id),
    },
    {
      name: "Operator Line C",
      email: "operator3@oee.local",
      password: "oper123",
      role: "OPERATOR",
      assignedLineId: "LINE-C",
      assignedMachines: createdMachines.slice(8, 12).map((m) => m._id),
    },
    {
      name: "Operator Line D",
      email: "operator4@oee.local",
      password: "oper123",
      role: "OPERATOR",
      assignedLineId: "LINE-D",
      assignedMachines: createdMachines.slice(12, 16).map((m) => m._id),
    },
  ];

  const createdUsers = [];
  for (const u of users) {
    const created = await User.create(u);
    createdUsers.push(created);
  }
  console.log(`✅ Inserted ${createdUsers.length} demo users.`);

  // Destructure for readability
  const [adminUser, manager, supervisorA, supervisorB, maintenanceTech, operatorAll, operatorB, operatorC, operatorD] = createdUsers;

  // ─── Sample Downtime Logs ────────────────────────────────────────────────────
  const now = Date.now();
  const sampleDowntimes = [
    {
      machine: createdMachines[0]._id, // CNC A1
      reason: "MINOR_STOPPAGE",
      notes: "Chip clearance and tool check",
      startTime: new Date(now - 45 * 60 * 1000),
      endTime: new Date(now - 38 * 60 * 1000),
      durationMinutes: 7,
      loggedBy: operatorAll._id,
    },
    {
      machine: createdMachines[1]._id, // Stamping Press A2
      reason: "CHANGEOVER_SETUP",
      notes: "Die set exchange for side panel batch B",
      startTime: new Date(now - 120 * 60 * 1000),
      endTime: new Date(now - 88 * 60 * 1000),
      durationMinutes: 32,
      loggedBy: operatorAll._id,
    },
    {
      // Active downtime — no endTime means the machine is still down
      machine: createdMachines[2]._id, // Welding A3 (currently DOWN)
      reason: "BREAKDOWN",
      notes: "Electrode wear and overheating sensor trip — awaiting maintenance",
      startTime: new Date(now - 35 * 60 * 1000),
      loggedBy: supervisorA._id,
    },
    {
      // Active maintenance downtime
      machine: createdMachines[5]._id, // Milling B2 (MAINTENANCE)
      reason: "OTHER",
      notes: "Scheduled lubrication and spindle calibration",
      startTime: new Date(now - 90 * 60 * 1000),
      loggedBy: maintenanceTech._id,
    },
    {
      machine: createdMachines[8]._id, // Paint C1
      reason: "QUALITY_ISSUE",
      notes: "Viscosity test recalibration and spray nozzle cleaning",
      startTime: new Date(now - 180 * 60 * 1000),
      endTime: new Date(now - 152 * 60 * 1000),
      durationMinutes: 28,
      loggedBy: operatorC._id,
    },
    {
      // Active downtime
      machine: createdMachines[14]._id, // Final QC D3 (DOWN)
      reason: "BREAKDOWN",
      notes: "Vision system camera failure — replacement part ordered",
      startTime: new Date(now - 60 * 60 * 1000),
      loggedBy: operatorD._id,
    },
    {
      machine: createdMachines[3]._id, // Assembly A4
      reason: "MATERIAL_SHORTAGE",
      notes: "Fastener bin replenishment delay from warehouse",
      startTime: new Date(now - 310 * 60 * 1000),
      endTime: new Date(now - 286 * 60 * 1000),
      durationMinutes: 24,
      loggedBy: operatorAll._id,
    },
    {
      machine: createdMachines[4]._id, // Lathe B1
      reason: "MINOR_STOPPAGE",
      notes: "Coolant top-up and chip conveyor jam clearance",
      startTime: new Date(now - 200 * 60 * 1000),
      endTime: new Date(now - 193 * 60 * 1000),
      durationMinutes: 7,
      loggedBy: operatorB._id,
    },
    {
      machine: createdMachines[12]._id, // Conveyor D1
      reason: "CHANGEOVER_SETUP",
      notes: "Product changeover — new fixture plates installed",
      startTime: new Date(now - 250 * 60 * 1000),
      endTime: new Date(now - 228 * 60 * 1000),
      durationMinutes: 22,
      loggedBy: operatorD._id,
    },
    {
      machine: createdMachines[2]._id, // Welding A3 — earlier breakdown (predictive trigger)
      reason: "BREAKDOWN",
      notes: "Wire feed motor jam",
      startTime: new Date(now - 210 * 60 * 1000),
      endTime: new Date(now - 165 * 60 * 1000),
      durationMinutes: 45,
      loggedBy: supervisorA._id,
    },
  ];

  await DowntimeLog.insertMany(sampleDowntimes);
  console.log(`✅ Inserted ${sampleDowntimes.length} sample downtime logs.`);

  // ─── 7-Day Historical Production Logs ────────────────────────────────────────
  const days = 7;
  const historyLogs = [];
  // Realistic base OEE targets per machine (16 machines)
  const baseOEEs = [82, 74, 58, 77, 88, 65, 90, 71, 69, 85, 92, 62, 80, 94, 55, 88];

  for (let i = days - 1; i >= 0; i--) {
    const dayDate = new Date(now - i * 24 * 60 * 60 * 1000);
    dayDate.setHours(14, 0, 0, 0); // End of Shift A

    createdMachines.forEach((m, idx) => {
      const targetOee = Math.min(98, Math.max(40, baseOEEs[idx] + Math.sin(i * 1.5 + idx) * 7));
      const totalUnits = Math.round((480 * 60) / m.idealCycleTimeSeconds * (targetOee / 100));
      const defectiveUnits = Math.round(totalUnits * 0.022);
      const goodUnits = totalUnits - defectiveUnits;

      historyLogs.push({
        machine: m._id,
        timestamp: dayDate,
        goodUnits,
        defectiveUnits,
        runTimeMinutes: Math.round(480 * (targetOee / 100) * 1.05),
      });
    });
  }

  await ProductionLog.insertMany(historyLogs);
  console.log(`✅ Inserted ${historyLogs.length} historical production logs (7-day trend for all 16 machines).`);

  // ─── Sample Maintenance Requests ─────────────────────────────────────────────
  const maintenanceRequests = [
    {
      machine: createdMachines[2]._id, // Welding A3 (DOWN)
      raisedBy: supervisorA._id,
      target: "MAINTENANCE",
      priority: "HIGH",
      description: "Electrode assembly worn out — full replacement required. Machine has tripped twice this shift.",
      status: "OPEN",
    },
    {
      machine: createdMachines[5]._id, // Milling B2 (MAINTENANCE)
      raisedBy: operatorB._id,
      target: "MAINTENANCE",
      priority: "MEDIUM",
      description: "Scheduled preventive maintenance: spindle bearing inspection & lubrication.",
      status: "ACKNOWLEDGED",
      acknowledgedBy: maintenanceTech._id,
      acknowledgedAt: new Date(now - 85 * 60 * 1000),
    },
    {
      machine: createdMachines[14]._id, // QC D3 (DOWN)
      raisedBy: operatorD._id,
      target: "MAINTENANCE",
      priority: "HIGH",
      description: "Vision system camera malfunctioning — parts not being inspected correctly. Urgent fix needed.",
      status: "OPEN",
    },
    {
      machine: createdMachines[0]._id, // CNC A1
      raisedBy: operatorAll._id,
      target: "SUPERVISOR",
      priority: "LOW",
      description: "Coolant filter needs replacement — due in next 48 hours per maintenance schedule.",
      status: "OPEN",
    },
  ];

  await MaintenanceRequest.insertMany(maintenanceRequests);
  console.log(`✅ Inserted ${maintenanceRequests.length} maintenance requests.`);

  // ─── Sample Handover Notes ────────────────────────────────────────────────────
  const handoverNotes = [
    {
      machine: createdMachines[0]._id,
      author: operatorAll._id,
      text: "CNC A1 running well. Tool #3 at 85% wear — replace before end of next shift. All good units passed QC.",
    },
    {
      machine: createdMachines[2]._id,
      author: supervisorA._id,
      text: "Welding A3 is DOWN — maintenance called. Do not start production until confirmed safe. Log any restart in system.",
    },
  ];

  await HandoverNote.insertMany(handoverNotes);
  console.log(`✅ Inserted ${handoverNotes.length} handover notes.`);

  await mongoose.disconnect();
  console.log("\n🎉 Demo seeding complete! 16 machines | 9 users | full access granted.\n");
  console.log("─── Login Credentials ──────────────────────────────────────────");
  console.log("  admin@oee.local       / admin123   (ADMIN)");
  console.log("  manager@oee.local     / manager123 (MANAGER)");
  console.log("  supervisor@oee.local  / super123   (SUPERVISOR — LINE-A)");
  console.log("  supervisorb@oee.local / super123   (SUPERVISOR — LINE-B)");
  console.log("  maintenance@oee.local / maint123   (MAINTENANCE)");
  console.log("  operator@oee.local    / oper123    (OPERATOR — ALL 16 machines)");
  console.log("  operator2@oee.local   / oper123    (OPERATOR — LINE-B)");
  console.log("  operator3@oee.local   / oper123    (OPERATOR — LINE-C)");
  console.log("  operator4@oee.local   / oper123    (OPERATOR — LINE-D)");
  console.log("────────────────────────────────────────────────────────────────");
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
