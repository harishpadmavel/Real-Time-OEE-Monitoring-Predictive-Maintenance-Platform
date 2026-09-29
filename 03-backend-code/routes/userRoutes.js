const express = require("express");
const router = express.Router();
const { getUsers, getMe } = require("../controllers/userController");
const { protect } = require("../middleware/auth");

router.get("/", protect, getUsers);
router.get("/me", protect, getMe);

module.exports = router;
