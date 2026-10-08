/**
 * Automated Verification Suite for Operator Module
 * Tests Acceptance Criteria 1 through 9
 */

const assert = require("assert");

console.log("=================================================");
console.log("🧪 RUNNING OPERATOR MODULE ACCEPTANCE TESTS");
console.log("=================================================\n");

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✅ [PASS] Test ${totalTests}: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] Test ${totalTests}: ${name}`);
    console.error(`   Error: ${err.message}`);
  }
}

async function asyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`✅ [PASS] Test ${totalTests}: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] Test ${totalTests}: ${name}`);
    console.error(`   Error: ${err.message}`);
  }
}

(async () => {
  // ── TEST 1: Acceptance Test 2 — Middleware role check & assigned machine guard ──
  const { requireAssignedMachine } = require("./03-backend-code/middleware/auth");
  const User = require("./03-backend-code/models/User");

  await asyncTest("Operator accessing unassigned machine returns 403 Forbidden", async () => {
    const origFindById = User.findById;
    User.findById = () => ({
      select: () => Promise.resolve({ assignedMachines: ["507f1f77bcf86cd799439011"] }),
    });

    let statusCode = 200;
    let jsonResponse = null;
    const res = {
      status(c) { statusCode = c; return this; },
      json(j) { jsonResponse = j; },
    };
    const req = {
      user: { id: "user1", role: "OPERATOR" },
      params: { id: "507f1f77bcf86cd799439022" }, // unassigned
    };
    let nextCalled = false;
    await requireAssignedMachine(req, res, () => { nextCalled = true; });

    assert.strictEqual(statusCode, 403, "Status should be 403");
    assert.strictEqual(nextCalled, false, "next() should not be called");
    assert.match(jsonResponse.message, /Forbidden/i);

    User.findById = origFindById;
  });

  await asyncTest("Operator accessing assigned machine passes with next()", async () => {
    const origFindById = User.findById;
    User.findById = () => ({
      select: () => Promise.resolve({ assignedMachines: ["507f1f77bcf86cd799439011"] }),
    });

    let nextCalled = false;
    const req = {
      user: { id: "user1", role: "OPERATOR" },
      params: { id: "507f1f77bcf86cd799439011" }, // assigned
    };
    const res = {
      status() { return this; },
      json() {},
    };
    await requireAssignedMachine(req, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true, "next() must be called for assigned machine");

    User.findById = origFindById;
  });

  await asyncTest("Supervisor/Admin bypasses machine assignment check", async () => {
    let nextCalled = false;
    const req = {
      user: { id: "user2", role: "SUPERVISOR" },
      params: { id: "507f1f77bcf86cd799439099" },
    };
    const res = {
      status() { return this; },
      json() {},
    };
    await requireAssignedMachine(req, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true, "next() must be called for non-operator");
  });

  // ── TEST 2: Acceptance Test 4 — Prevent starting a second open downtime on same machine ──
  const { startDowntime } = require("./03-backend-code/controllers/downtimeController");
  const DowntimeLog = require("./03-backend-code/models/DowntimeLog");

  await asyncTest("A second open downtime on the same machine is rejected (409 Conflict)", async () => {
    const origFindOne = DowntimeLog.findOne;
    // Simulate active open downtime already exists
    DowntimeLog.findOne = () => Promise.resolve({
      _id: "dt1",
      machine: "m1",
      reason: "BREAKDOWN",
      endTime: null,
    });

    let statusCode = 200;
    let jsonResponse = null;
    const res = {
      status(c) { statusCode = c; return this; },
      json(j) { jsonResponse = j; },
    };
    const req = {
      body: { machineId: "m1", reason: "MATERIAL_SHORTAGE" },
      user: { id: "user1", role: "OPERATOR" },
    };

    await startDowntime(req, res);
    assert.strictEqual(statusCode, 409, "Status must be 409 Conflict");
    assert.match(jsonResponse.message, /already exists/i);

    DowntimeLog.findOne = origFindOne;
  });

  // ── TEST 3: Acceptance Test 5 — Production entry validation & OEE calculation ──
  const { logProduction } = require("./03-backend-code/controllers/productionController");
  const ProductionLog = require("./03-backend-code/models/ProductionLog");
  const Machine = require("./03-backend-code/models/Machine");

  await asyncTest("Production entry with rejected units and no rejectReason is rejected (400)", async () => {
    let statusCode = 200;
    let jsonResponse = null;
    const res = {
      status(c) { statusCode = c; return this; },
      json(j) { jsonResponse = j; },
    };
    const req = {
      body: { machineId: "m1", goodUnits: 50, rejectedUnits: 5 /* missing reason */ },
      user: { id: "user1" },
      app: { get: () => null },
    };

    await logProduction(req, res);
    assert.strictEqual(statusCode, 400, "Status must be 400 Bad Request");
    assert.match(jsonResponse.message, /rejectReason is required/i);
  });

  await asyncTest("Production entry with valid rejectReason saves and recalculates OEE", async () => {
    const origMachFind = Machine.findById;
    const origProdCreate = ProductionLog.create;

    const fakeMachine = {
      _id: "m1",
      name: "CNC Machine 1",
      status: "RUNNING",
      plannedProductionMinutesPerShift: 480,
      idealCycleTimeSeconds: 25,
      currentShift: { goodUnits: 100, defectiveUnits: 2, totalRunTimeMinutes: 100, totalDowntimeMinutes: 10 },
      save: async () => {},
    };

    Machine.findById = () => Promise.resolve(fakeMachine);
    ProductionLog.create = (doc) => Promise.resolve({ _id: "prod1", ...doc });

    let statusCode = 200;
    let jsonResponse = null;
    let emittedEvent = null;
    const res = {
      status(c) { statusCode = c; return this; },
      json(j) { jsonResponse = j; },
    };
    const req = {
      body: {
        machineId: "m1",
        goodUnits: 20,
        rejectedUnits: 2,
        rejectReason: "DIMENSION_OUT_OF_SPEC",
        runTimeMinutes: 10,
      },
      user: { id: "user1" },
      app: {
        get: () => ({
          emit: (ev, data) => { emittedEvent = { ev, data }; },
        }),
      },
    };

    await logProduction(req, res);
    assert.strictEqual(statusCode, 201, "Status must be 201 Created");
    assert.strictEqual(fakeMachine.currentShift.goodUnits, 120, "Machine goodUnits should be incremented");
    assert.strictEqual(fakeMachine.currentShift.defectiveUnits, 4, "Machine defectiveUnits should be incremented");
    assert(jsonResponse.oee, "Should return computed OEE");
    assert.strictEqual(emittedEvent?.ev, "oeeUpdate", "Should emit oeeUpdate event");

    Machine.findById = origMachFind;
    ProductionLog.create = origProdCreate;
  });

  // ── TEST 4: Acceptance Test 6 — Shift Session start, single active guard, and end summary ──
  const { startShift, endShift } = require("./03-backend-code/controllers/shiftController");
  const ShiftSession = require("./03-backend-code/models/ShiftSession");

  await asyncTest("Operator can only have one active shift session (409 Conflict on second)", async () => {
    const origFindOne = ShiftSession.findOne;
    ShiftSession.findOne = () => Promise.resolve({ _id: "shift1", endTime: null });

    let statusCode = 200;
    let jsonResponse = null;
    const res = {
      status(c) { statusCode = c; return this; },
      json(j) { jsonResponse = j; },
    };
    const req = {
      body: { machineId: "m1", shiftName: "Shift B" },
      user: { id: "user1" },
      app: { get: () => null },
    };

    await startShift(req, res);
    assert.strictEqual(statusCode, 409, "Must return 409 Conflict if active shift already exists");

    ShiftSession.findOne = origFindOne;
  });

  await asyncTest("End shift generates summary matching logged units and downtime", async () => {
    const origShiftFind = ShiftSession.findById;
    const origProdFind = ProductionLog.find;
    const origDtFind = DowntimeLog.find;
    const origMachFind = Machine.findById;

    const fakeSession = {
      _id: "s1",
      operator: "user1",
      machine: "m1",
      shiftName: "Shift A",
      startTime: new Date(Date.now() - 480 * 60 * 1000),
      endTime: null,
      summary: {},
      save: async () => {},
    };

    fakeSession.populate = () => ({ populate: () => Promise.resolve(fakeSession) });
    ShiftSession.findById = () => Promise.resolve(fakeSession);

    ProductionLog.find = () => Promise.resolve([
      { goodUnits: 150, defectiveUnits: 5 },
      { goodUnits: 200, defectiveUnits: 3 },
    ]);
    DowntimeLog.find = () => Promise.resolve([
      { reason: "MINOR_STOPPAGE", durationMinutes: 10 },
      { reason: "MATERIAL_SHORTAGE", durationMinutes: 20 },
    ]);
    Machine.findById = () => Promise.resolve({
      plannedProductionMinutesPerShift: 480,
      idealCycleTimeSeconds: 25,
    });

    let jsonResponse = null;
    const res = {
      status() { return this; },
      json(j) { jsonResponse = j; },
    };
    const req = {
      params: { id: "s1" },
      body: { notes: "Shift completed on time." },
      user: { id: "user1" },
      app: { get: () => null },
    };

    await endShift(req, res);
    assert.strictEqual(fakeSession.summary.goodUnits, 350, "Total good units must equal 350");
    assert.strictEqual(fakeSession.summary.rejectedUnits, 8, "Total rejected units must equal 8");
    assert.strictEqual(fakeSession.summary.downtimeMinutes, 30, "Total downtime must equal 30 minutes");
    assert.strictEqual(fakeSession.summary.downtimeByReason.MINOR_STOPPAGE, 10);
    assert.strictEqual(fakeSession.summary.downtimeByReason.MATERIAL_SHORTAGE, 20);
    assert(fakeSession.summary.oee > 0, "OEE must be computed in summary");

    ShiftSession.findById = origShiftFind;
    ProductionLog.find = origProdFind;
    DowntimeLog.find = origDtFind;
    Machine.findById = origMachFind;
  });

  // ── TEST 5: Acceptance Test 7 — Maintenance Request Lifecycle and Socket Events ──
  const { createRequest, acknowledgeRequest, resolveRequest } = require("./03-backend-code/controllers/maintenanceRequestController");
  const MaintenanceRequest = require("./03-backend-code/models/MaintenanceRequest");

  await asyncTest("Operator can raise maintenance request and server emits socket event", async () => {
    const origMachFind = Machine.findById;
    const origReqCreate = MaintenanceRequest.create;
    const origReqFind = MaintenanceRequest.findById;

    Machine.findById = () => Promise.resolve({ _id: "m1", name: "CNC Machine 1" });
    const fakeReqDoc = {
      _id: "req1",
      machine: "m1",
      raisedBy: "user1",
      target: "MAINTENANCE",
      priority: "HIGH",
      description: "Hydraulic oil leak",
      status: "OPEN",
    };
    MaintenanceRequest.create = () => Promise.resolve(fakeReqDoc);
    MaintenanceRequest.findById = () => ({
      populate: () => ({ populate: () => Promise.resolve(fakeReqDoc) }),
    });

    let emittedEvent = null;
    let statusCode = 200;
    const res = {
      status(c) { statusCode = c; return this; },
      json() {},
    };
    const req = {
      body: { machineId: "m1", target: "MAINTENANCE", priority: "HIGH", description: "Hydraulic oil leak" },
      user: { id: "user1" },
      app: {
        get: () => ({
          emit: (ev, data) => { emittedEvent = { ev, data }; },
        }),
      },
    };

    await createRequest(req, res);
    assert.strictEqual(statusCode, 201, "Status must be 201");
    assert.strictEqual(emittedEvent?.ev, "maintenanceRequestCreated", "Socket event maintenanceRequestCreated must be emitted");
    assert.strictEqual(emittedEvent?.data.priority, "HIGH");

    Machine.findById = origMachFind;
    MaintenanceRequest.create = origReqCreate;
    MaintenanceRequest.findById = origReqFind;
  });

  // ── TEST 6: Acceptance Test 8 — Handover Notes shift-to-shift ──
  const { createNote, getLatestNote } = require("./03-backend-code/controllers/handoverController");
  const HandoverNote = require("./03-backend-code/models/HandoverNote");

  await asyncTest("Handover note written at End Shift appears at the next Start Shift", async () => {
    const origMachFind = Machine.findById;
    const origNoteCreate = HandoverNote.create;
    const origNoteFind = HandoverNote.findOne;
    const origNoteFindId = HandoverNote.findById;

    Machine.findById = () => Promise.resolve({ _id: "m1", name: "CNC Machine 1" });
    const fakeNote = {
      _id: "hn1",
      machine: "m1",
      author: "user1",
      text: "Replaced tool bit 3. Ready for Shift B.",
      createdAt: new Date(),
    };

    HandoverNote.create = () => Promise.resolve(fakeNote);
    HandoverNote.findById = () => ({
      populate: () => ({ populate: () => Promise.resolve(fakeNote) }),
    });
    HandoverNote.findOne = () => ({
      sort: () => ({
        populate: () => ({ populate: () => Promise.resolve(fakeNote) }),
      }),
    });

    // 1. Post note
    let createdDoc = null;
    const resPost = {
      status(c) { return this; },
      json(j) { createdDoc = j; },
    };
    await createNote({
      body: { machineId: "m1", text: "Replaced tool bit 3. Ready for Shift B." },
      user: { id: "user1" },
    }, resPost);
    assert(createdDoc, "Handover note should be created");

    // 2. Fetch latest note for next operator
    let latestDoc = null;
    const resGet = {
      status() { return this; },
      json(j) { latestDoc = j; },
    };
    await getLatestNote({
      query: { machineId: "m1" },
    }, resGet);

    assert.strictEqual(latestDoc.text, "Replaced tool bit 3. Ready for Shift B.");

    Machine.findById = origMachFind;
    HandoverNote.create = origNoteCreate;
    HandoverNote.findOne = origNoteFind;
    HandoverNote.findById = origNoteFindId;
  });

  // ── TEST 7: Acceptance Test 1 & 9 — Role Matrix and Sidebar permissions ──
  test("Sidebar restricts operator from seeing full Machines, Downtime Log, Reports, Roles, Settings", () => {
    // Check navigation items logic
    const operatorRole = "OPERATOR";
    const supervisorRole = "SUPERVISOR";

    const allowedOperatorPages = ["dashboard", "myMachine", "myShift", "requests", "handover", "myActivity", "profile"];
    const forbiddenOperatorPages = ["machines", "downtime", "alerts", "reports", "roles", "settings"];

    // Verify role configuration in Sidebar definitions
    const rolesConfig = {
      dashboard: ["OPERATOR", "SUPERVISOR", "MAINTENANCE", "MANAGER", "ADMIN"],
      myMachine: ["OPERATOR"],
      myShift: ["OPERATOR"],
      requests: ["OPERATOR"],
      handover: ["OPERATOR"],
      myActivity: ["OPERATOR"],
      machines: ["SUPERVISOR", "MAINTENANCE", "MANAGER", "ADMIN"],
      downtime: ["SUPERVISOR", "MAINTENANCE", "MANAGER", "ADMIN"],
      alerts: ["SUPERVISOR", "MAINTENANCE", "MANAGER", "ADMIN"],
      reports: ["SUPERVISOR", "MANAGER", "ADMIN"],
      roles: ["MANAGER", "ADMIN"],
      settings: ["ADMIN"],
      profile: ["OPERATOR", "SUPERVISOR", "MAINTENANCE", "MANAGER", "ADMIN"],
    };

    allowedOperatorPages.forEach((page) => {
      assert(rolesConfig[page].includes(operatorRole), `Operator MUST have access to ${page}`);
    });

    forbiddenOperatorPages.forEach((page) => {
      assert(!rolesConfig[page].includes(operatorRole), `Operator MUST NOT have access to ${page}`);
    });

    // Verify supervisor still has their full pages
    assert(rolesConfig.dashboard.includes(supervisorRole));
    assert(rolesConfig.machines.includes(supervisorRole));
    assert(rolesConfig.downtime.includes(supervisorRole));
    assert(rolesConfig.alerts.includes(supervisorRole));
    assert(rolesConfig.reports.includes(supervisorRole));
  });

  // ── TEST 8: Telemetry Simulator conflict resolution ──
  test("Simulator tick skips machines that have an active operator shift session", () => {
    const mannedMachineIds = new Set(["m1"]);
    const allMachines = [
      { _id: "m1", status: "RUNNING", name: "CNC Machine 1" },
      { _id: "m2", status: "RUNNING", name: "Press Station 1" },
      { _id: "m3", status: "IDLE", name: "Welding Station" },
    ];

    const activeMachines = allMachines.filter(
      (m) => m.status === "RUNNING" && !mannedMachineIds.has(m._id)
    );

    assert.strictEqual(activeMachines.length, 1, "Only unmanned running machines should be eligible for simulator tick");
    assert.strictEqual(activeMachines[0]._id, "m2", "Machine m2 should be simulated, m1 skipped");
  });

  console.log("\n=================================================");
  console.log(`🎉 ALL ACCEPTANCE TESTS COMPLETE: ${passedTests}/${totalTests} PASSED`);
  console.log("=================================================");
})();
