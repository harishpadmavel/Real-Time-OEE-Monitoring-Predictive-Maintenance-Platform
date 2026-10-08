const express = require("express");
const router = express.Router();
const {
  getMachines,
  getMachineById,
  createMachine,
  updateMachineStatus,
} = require("../controllers/machineController");
const { protect, allowRoles, requireAssignedMachine } = require("../middleware/auth");

router.get("/", protect, getMachines);
router.get("/:id", protect, requireAssignedMachine, getMachineById);
router.post("/", protect, allowRoles("ADMIN", "MANAGER"), createMachine);
router.patch("/:id/status", protect, requireAssignedMachine, updateMachineStatus);

module.exports = router;
