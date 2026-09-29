const express = require("express");
const router = express.Router();
const {
  getDowntimeLogs,
  startDowntime,
  resolveDowntime,
  getReasonsSummary,
} = require("../controllers/downtimeController");
const { protect } = require("../middleware/auth");

router.get("/", protect, getDowntimeLogs);
router.post("/", protect, startDowntime);
router.patch("/:id/resolve", protect, resolveDowntime);
router.get("/reasons-summary", protect, getReasonsSummary);

module.exports = router;

