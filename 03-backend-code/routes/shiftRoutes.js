const express = require("express");
const router = express.Router();
const {
  startShift,
  endShift,
  getActiveShift,
  getMyShifts,
} = require("../controllers/shiftController");
const { protect, requireAssignedMachine } = require("../middleware/auth");

router.post("/start", protect, requireAssignedMachine, startShift);
router.patch("/:id/end", protect, endShift);
router.get("/active", protect, getActiveShift);
router.get("/my", protect, getMyShifts);

module.exports = router;
