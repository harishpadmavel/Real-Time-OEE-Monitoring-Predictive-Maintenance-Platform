const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verifies the JWT sent in the Authorization header and attaches the user to req.user
function protect(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token provided" });
  }
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret_change_me");
    req.user = decoded; // { id, role, name, ... }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Not authorized, invalid token" });
  }
}

// Usage: allowRoles("ADMIN", "MANAGER") - restricts a route to specific roles
function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: insufficient role" });
    }
    next();
  };
}

/**
 * For OPERATOR requests: verifies the machineId (from req.params.id or
 * req.body.machineId) is in the operator's assignedMachines list.
 * Non-operator roles pass through without restriction.
 */
async function requireAssignedMachine(req, res, next) {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authorized" });
    if (req.user.role !== "OPERATOR") return next(); // supervisors/managers bypass

    const machineId = req.params.id || req.body.machineId || req.params.machineId;
    if (!machineId) return res.status(400).json({ message: "machineId required" });

    const dbUser = await User.findById(req.user.id).select("assignedMachines");
    if (!dbUser) return res.status(401).json({ message: "User not found" });

    const assigned = (dbUser.assignedMachines || []).map((m) => m.toString());
    if (!assigned.includes(machineId.toString())) {
      return res.status(403).json({ message: "Forbidden: machine not in your assigned list" });
    }
    next();
  } catch (err) {
    res.status(500).json({ message: "Authorization error", error: err.message });
  }
}

module.exports = { protect, allowRoles, requireAssignedMachine };

