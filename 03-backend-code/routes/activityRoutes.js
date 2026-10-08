const express = require("express");
const router = express.Router();
const { getMyActivity } = require("../controllers/activityController");
const { protect } = require("../middleware/auth");

router.get("/my", protect, getMyActivity);

module.exports = router;
