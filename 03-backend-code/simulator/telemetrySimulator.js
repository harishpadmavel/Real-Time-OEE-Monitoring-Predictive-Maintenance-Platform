const Machine = require("../models/Machine");
const DowntimeLog = require("../models/DowntimeLog");
const { calculateOEE, classifyOEE } = require("../utils/calculateOEE");

let isRunning = true;
let timer = null;
let ioInstance = null;

function setIo(io) {
  ioInstance = io;
}

async function tick() {
  if (!isRunning) return;

  try {
    const machines = await Machine.find();
    if (!machines || machines.length === 0) return;

    // Pick 1-2 random machines to update production counts
    const activeMachines = machines.filter((m) => m.status === "RUNNING");
    if (activeMachines.length > 0) {
      const targetMachine = activeMachines[Math.floor(Math.random() * activeMachines.length)];
      
      const newGood = Math.floor(Math.random() * 3) + 1;
      const newDefective = Math.random() < 0.08 ? 1 : 0;

      targetMachine.currentShift.goodUnits += newGood;
      targetMachine.currentShift.defectiveUnits += newDefective;
      targetMachine.lastHeartbeat = new Date();
      await targetMachine.save();

      const oeeCalc = calculateOEE({
        plannedProductionMinutes: targetMachine.plannedProductionMinutesPerShift,
        downtimeMinutes: targetMachine.currentShift.totalDowntimeMinutes,
        idealCycleTimeSeconds: targetMachine.idealCycleTimeSeconds,
        goodUnits: targetMachine.currentShift.goodUnits,
        defectiveUnits: targetMachine.currentShift.defectiveUnits,
      });

      if (ioInstance) {
        ioInstance.emit("oeeUpdate", {
          machineId: targetMachine._id,
          machineName: targetMachine.name,
          status: targetMachine.status,
          currentShift: targetMachine.currentShift,
          ...oeeCalc,
          classification: classifyOEE(oeeCalc.oee),
        });
      }
    }

    // Periodically compute line-wide overall OEE
    if (ioInstance) {
      const allResults = machines.map((m) => {
        return calculateOEE({
          plannedProductionMinutes: m.plannedProductionMinutesPerShift,
          downtimeMinutes: m.currentShift.totalDowntimeMinutes,
          idealCycleTimeSeconds: m.idealCycleTimeSeconds,
          goodUnits: m.currentShift.goodUnits,
          defectiveUnits: m.currentShift.defectiveUnits,
        }).oee;
      });
      const avgOee = Math.round(allResults.reduce((a, b) => a + b, 0) / (allResults.length || 1));
      ioInstance.emit("lineOeeUpdate", {
        lineId: "LINE-A",
        oee: avgOee,
        timestamp: new Date(),
      });
    }
  } catch (err) {
    console.error("Telemetry simulator tick error:", err.message);
  }
}

function startSimulator(io) {
  if (io) setIo(io);
  if (timer) clearInterval(timer);
  isRunning = true;
  timer = setInterval(tick, 3000);
  console.log("⚡ Telemetry Simulator started (3s interval)");
}

function stopSimulator() {
  isRunning = false;
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  console.log("⏹ Telemetry Simulator stopped");
}

function toggleSimulator() {
  if (isRunning) {
    stopSimulator();
  } else {
    startSimulator();
  }
  return isRunning;
}

function getSimulatorStatus() {
  return { isRunning, intervalSeconds: 3 };
}

module.exports = {
  setIo,
  startSimulator,
  stopSimulator,
  toggleSimulator,
  getSimulatorStatus,
};
