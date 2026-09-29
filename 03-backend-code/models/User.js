const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // stored hashed, never plain text
    role: {
      type: String,
      enum: ["OPERATOR", "SUPERVISOR", "MAINTENANCE", "MANAGER", "ADMIN"],
      default: "OPERATOR",
    },
    assignedLineId: { type: String }, // which line this operator/supervisor is tied to
  },
  { timestamps: true }
);

// Hash the password automatically before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Helper to check a login attempt's password against the stored hash
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("User", userSchema);
