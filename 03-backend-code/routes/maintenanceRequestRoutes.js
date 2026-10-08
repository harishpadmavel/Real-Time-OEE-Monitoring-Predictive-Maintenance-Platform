const express = require("express");
const router = express.Router();
const {
  createRequest,
  getRequests,
  acknowledgeRequest,
  resolveRequest,
} = require("../controllers/maintenanceRequestController");
const { protect, allowRoles, requireAssignedMachine } = require("../middleware/auth");

router.post("/", protect, requireAssignedMachine, createRequest);
router.get("/", protect, getRequests);
router.patch("/:id/acknowledge", protect, allowRoles("MAINTENANCE", "SUPERVISOR", "ADMIN", "MANAGER"), acknowledgeRequest);
router.patch("/:id/resolve", protect, allowRoles("MAINTENANCE", "SUPERVISOR", "ADMIN", "MANAGER"), resolveRequest);

module.exports = router;
