const express = require("express");
const router = express.Router();
const { getUsers, getMe, assignMachine, createUser, deleteUser, updateProfile } = require("../controllers/userController");
const { protect, allowRoles } = require("../middleware/auth");

router.get("/", protect, getUsers);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.put("/me", protect, updateProfile);
router.post("/assign-machine", protect, assignMachine);
router.post("/", protect, allowRoles("ADMIN"), createUser);
router.delete("/:id", protect, allowRoles("ADMIN"), deleteUser);

module.exports = router;
