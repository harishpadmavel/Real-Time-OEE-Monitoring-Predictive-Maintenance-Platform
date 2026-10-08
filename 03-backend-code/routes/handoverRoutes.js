const express = require("express");
const router = express.Router();
const {
  createNote,
  getLatestNote,
  getNoteHistory,
} = require("../controllers/handoverController");
const { protect, requireAssignedMachine } = require("../middleware/auth");

router.post("/", protect, requireAssignedMachine, createNote);
router.get("/latest", protect, requireAssignedMachine, getLatestNote);
router.get("/history", protect, requireAssignedMachine, getNoteHistory);

module.exports = router;
