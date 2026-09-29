const express = require("express");
const router = express.Router();
const {
  getMachineOEE,
  getAllMachinesOEE,
  getPredictiveAlert,
  getAllPredictiveAlerts,
  getOeeTrends,
} = require("../controllers/oeeController");
const { protect } = require("../middleware/auth");

router.get("/", protect, getAllMachinesOEE);
router.get("/predictive-alerts", protect, getAllPredictiveAlerts);
router.get("/trends/7day", protect, getOeeTrends);
router.get("/:machineId", protect, getMachineOEE);
router.get("/:machineId/predictive-alert", protect, getPredictiveAlert);

module.exports = router;
