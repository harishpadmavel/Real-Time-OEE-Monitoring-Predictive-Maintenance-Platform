const express = require("express");
const router = express.Router();
const {
  logProduction,
  getProductionLogs,
} = require("../controllers/productionController");
const { protect, requireAssignedMachine } = require("../middleware/auth");

router.post("/", protect, requireAssignedMachine, logProduction);
router.get("/", protect, getProductionLogs);

module.exports = router;
