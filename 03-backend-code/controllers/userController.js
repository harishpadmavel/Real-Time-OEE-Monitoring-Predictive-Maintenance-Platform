const User = require("../models/User");

// GET /api/users - list all users (for Admin / Manager / user list)
async function getUsers(req, res) {
  try {
    const users = await User.find({}, "-password").populate("assignedMachines", "name type lineId").sort({ name: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users", error: err.message });
  }
}

// GET /api/auth/me - get current authenticated user profile
async function getMe(req, res) {
  try {
    const user = await User.findById(req.user.id).select("-password").populate("assignedMachines");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch profile", error: err.message });
  }
}

// POST /api/users/assign-machine
async function assignMachine(req, res) {
  try {
    const { machineId, machineIds, userId, all } = req.body;
    const targetUserId = (req.user.role === 'ADMIN' || req.user.role === 'SUPERVISOR') && userId ? userId : req.user.id;
    const Machine = require("../models/Machine");

    let ids = [];
    if (all) {
      const allM = await Machine.find({}, "_id");
      ids = allM.map(m => m._id);
    } else if (machineIds && Array.isArray(machineIds)) {
      ids = machineIds;
    } else if (machineId) {
      ids = [machineId];
    } else {
      const allM = await Machine.find({}, "_id");
      ids = allM.map(m => m._id);
    }

    const user = await User.findByIdAndUpdate(
      targetUserId,
      { $addToSet: { assignedMachines: { $each: ids } } },
      { new: true }
    ).populate("assignedMachines");

    res.json({ message: "Machines assigned successfully", user });
  } catch (err) {
    res.status(500).json({ message: "Failed to assign machine", error: err.message });
  }
}

// POST /api/users - Admin creates a new user account (Gmail addresses only)
async function createUser(req, res) {
  try {
    const { name, email, password, role, assignedLineId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    // Enforce Gmail-only addresses
    const trimEmail = email.trim().toLowerCase();
    if (!trimEmail.endsWith("@gmail.com")) {
      return res.status(400).json({ message: "Only Gmail addresses (@gmail.com) are accepted." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const existing = await User.findOne({ email: trimEmail });
    if (existing) {
      return res.status(400).json({ message: "A user with this email already exists." });
    }

    const user = await User.create({
      name: name.trim(),
      email: trimEmail,
      password,
      role: role || "OPERATOR",
      assignedLineId: assignedLineId || "",
    });

    res.status(201).json({
      message: "User created successfully.",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        assignedLineId: user.assignedLineId,
        assignedMachines: [],
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to create user", error: err.message });
  }
}

// DELETE /api/users/:id - Admin removes a user
async function deleteUser(req, res) {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: "You cannot delete your own account." });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ message: "User deleted successfully.", userId: req.params.id });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete user", error: err.message });
  }
}

// PUT /api/users/profile or /api/users/me - Update profile of current authenticated user
async function updateProfile(req, res) {
  try {
    const { name, email, assignedLineId, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    // Validate and update name
    if (name && name.trim()) {
      user.name = name.trim();
    }

    // Validate and update email
    if (email && email.trim().toLowerCase() !== user.email.toLowerCase()) {
      const trimEmail = email.trim().toLowerCase();
      const existing = await User.findOne({ email: trimEmail, _id: { $ne: user._id } });
      if (existing) {
        return res.status(400).json({ message: "Email is already in use by another account." });
      }
      user.email = trimEmail;
    }

    // Update assigned line
    if (assignedLineId !== undefined) {
      user.assignedLineId = assignedLineId.trim();
    }

    // Handle password change if requested
    if (newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters." });
      }
      if (!currentPassword) {
        return res.status(400).json({ message: "Current password is required to change password." });
      }
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: "Current password does not match." });
      }
      user.password = newPassword; // Will be hashed by pre-save hook
    }

    await user.save();
    await user.populate("assignedMachines");

    const jwt = require("jsonwebtoken");
    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET || "dev_secret_change_me",
      { expiresIn: "8h" }
    );

    res.json({
      message: "Profile updated successfully.",
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        assignedLineId: user.assignedLineId,
        assignedMachines: user.assignedMachines || [],
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to update profile", error: err.message });
  }
}

module.exports = { getUsers, getMe, assignMachine, createUser, deleteUser, updateProfile };
