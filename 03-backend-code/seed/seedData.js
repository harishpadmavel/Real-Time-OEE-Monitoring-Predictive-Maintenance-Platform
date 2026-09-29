require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Machine = require("../models/Machine");
const User = require("../models/User");
const DowntimeLog = require("../models/DowntimeLog");
const ProductionLog = require("../models/ProductionLog");

const machines = [
  {
    name: "CNC Machine 1",
    type: "CNC",
    lineId: "LINE-A",
    idealCycleTimeSeconds: 25,
    plannedProductionMinutesPerShift: 480,
    status: "RUNNING",
    currentShift: {
      goodUnits: 680,
      defectiveUnits: 12,
      totalRunTimeMinutes: 410,
      totalDowntimeMinutes: 28,
    },
  },
  {
    name: "Stamping Press 1",
    type: "Press",
    lineId: "LINE-A",
    idealCycleTimeSeconds: 15,
    plannedProductionMinutesPerShift: 480,
    status: "RUNNING",
    currentShift: {
      goodUnits: 1120,
      defectiveUnits: 34,
      totalRunTimeMinutes: 388,
      totalDowntimeMinutes: 52,
    },
  },
  {
    name: "Welding Station 1",
    type: "Welding",
    lineId: "LINE-A",
    idealCycleTimeSeconds: 40,
    plannedProductionMinutesPerShift: 480,
    status: "IDLE",
    currentShift: {
      goodUnits: 385,
      defectiveUnits: 18,
      totalRunTimeMinutes: 320,
      totalDowntimeMinutes: 110,
    },
  },
  {
    name: "Assembly Line 1",
    type: "Assembly",
    lineId: "LINE-A",
    idealCycleTimeSeconds: 60,
    plannedProductionMinutesPerShift: 480,
    status: "RUNNING",
    currentShift: {
      goodUnits: 295,
      defectiveUnits: 6,
      totalRunTimeMinutes: 412,
      totalDowntimeMinutes: 42,
    },
  },
  {
    name: "Painting Unit 1",
    type: "Painting",
    lineId: "LINE-A",
    idealCycleTimeSeconds: 90,
    plannedProductionMinutesPerShift: 480,
    status: "RUNNING",
    currentShift: {
      goodUnits: 188,
      defectiveUnits: 9,
      totalRunTimeMinutes: 395,
      totalDowntimeMinutes: 65,
    },
  },
];

const users = [
  { name: "Admin User", email: "admin@oee.local", password: "admin123", role: "ADMIN" },
  { name: "Line Supervisor", email: "supervisor@oee.local", password: "super123", role: "SUPERVISOR", assignedLineId: "LINE-A" },
  { name: "Shop Operator", email: "operator@oee.local", password: "oper123", role: "OPERATOR", assignedLineId: "LINE-A" },
  { name: "Maintenance Tech", email: "maintenance@oee.local", password: "maint123", role: "MAINTENANCE" },
  { name: "Plant Manager", email: "manager@oee.local", password: "manager123", role: "MANAGER" },
];

async function seed() {
  await connectDB();

  await Machine.deleteMany({});
  await User.deleteMany({});
  await DowntimeLog.deleteMany({});
  await ProductionLog.deleteMany({});

  const createdMachines = await Machine.insertMany(machines);
  console.log(`Inserted ${createdMachines.length} machines.`);

  const createdUsers = [];
  for (const u of users) {
    const created = await User.create(u);
    createdUsers.push(created);
  }
  console.log(`Inserted ${createdUsers.length} demo users.`);

  // Sample Downtime Logs across recent shifts
  const now = Date.now();
  const sampleDowntimes = [
    {
      machine: createdMachines[0]._id, // CNC
      reason: "MINOR_STOPPAGE",
      notes: "Chip clearance and tool check",
      startTime: new Date(now - 45 * 60 * 1000),
      endTime: new Date(now - 38 * 60 * 1000),
      durationMinutes: 7,
      loggedBy: createdUsers[2]._id,
    },
    {
      machine: createdMachines[1]._id, // Press
      reason: "CHANGEOVER_SETUP",
      notes: "Die set exchange for side panel batch B",
      startTime: new Date(now - 120 * 60 * 1000),
      endTime: new Date(now - 88 * 60 * 1000),
      durationMinutes: 32,
      loggedBy: createdUsers[2]._id,
    },
    {
      machine: createdMachines[2]._id, // Welding
      reason: "BREAKDOWN",
      notes: "Electrode wear and overheating sensor trip",
      startTime: new Date(now - 210 * 60 * 1000),
      endTime: new Date(now - 165 * 60 * 1000),
      durationMinutes: 45,
      loggedBy: createdUsers[3]._id,
    },
    {
      machine: createdMachines[2]._id, // Welding - 2nd breakdown (triggers predictive alert)
      reason: "BREAKDOWN",
      notes: "Wire feed motor jam",
      startTime: new Date(now - 35 * 60 * 1000),
      endTime: new Date(now - 15 * 60 * 1000),
      durationMinutes: 20,
      loggedBy: createdUsers[3]._id,
    },
    {
      machine: createdMachines[3]._id, // Assembly
      reason: "MATERIAL_SHORTAGE",
      notes: "Fastener bin replenishment delay from warehouse",
      startTime: new Date(now - 310 * 60 * 1000),
      endTime: new Date(now - 286 * 60 * 1000),
      durationMinutes: 24,
      loggedBy: createdUsers[2]._id,
    },
    {
      machine: createdMachines[4]._id, // Paint
      reason: "QUALITY_ISSUE",
      notes: "Viscosity test recalibration and spray nozzle cleaning",
      startTime: new Date(now - 180 * 60 * 1000),
      endTime: new Date(now - 152 * 60 * 1000),
      durationMinutes: 28,
      loggedBy: createdUsers[1]._id,
    },
  ];
  await DowntimeLog.insertMany(sampleDowntimes);
  console.log(`Inserted ${sampleDowntimes.length} sample downtime logs.`);

  // Seed 7 days of production history for trend chart
  const days = 7;
  const historyLogs = [];
  const baseOEEs = [82, 74, 58, 77, 69]; // CNC, Press, Weld, Assembly, Paint

  for (let i = days - 1; i >= 0; i--) {
    const dayDate = new Date(now - i * 24 * 60 * 60 * 1000);
    dayDate.setHours(14, 0, 0, 0); // End of Shift A

    createdMachines.forEach((m, idx) => {
      const targetOee = baseOEEs[idx] + (Math.sin(i * 1.5 + idx) * 6);
      const totalUnits = Math.round((480 * 60 / m.idealCycleTimeSeconds) * (targetOee / 100));
      const defectiveUnits = Math.round(totalUnits * 0.025);
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
  console.log(`Inserted ${historyLogs.length} historical production logs (7-day trend).`);

  await mongoose.disconnect();
  console.log("Seeding complete successfully.");
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
