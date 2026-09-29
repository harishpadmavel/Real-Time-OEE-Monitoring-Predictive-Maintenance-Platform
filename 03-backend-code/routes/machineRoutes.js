const express = require("express");
const router = express.Router();
const {
  getMachines,
  getMachineById,
  createMachine,
  updateMachineStatus,
} = require("../controllers/machineController");
const { protect, allowRoles } = require("../middleware/auth");

router.get("/", protect, getMachines);
router.get("/:id", protect, getMachineById);
router.post("/", protect, allowRoles("ADMIN", "MANAGER"), createMachine);
router.patch("/:id/status", protect, updateMachineStatus);

module.exports = router;
