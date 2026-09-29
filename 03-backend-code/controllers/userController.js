const User = require("../models/User");

// GET /api/users - list all users (for Admin / Manager / user list)
async function getUsers(req, res) {
  try {
    const users = await User.find({}, "-password").sort({ name: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users", error: err.message });
  }
}

// GET /api/auth/me - get current authenticated user profile
async function getMe(req, res) {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch profile", error: err.message });
  }
}

module.exports = { getUsers, getMe };
