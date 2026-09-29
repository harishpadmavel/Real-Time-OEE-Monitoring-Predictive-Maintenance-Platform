require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const registerSocketHandlers = require("./sockets/socketHandler");
const { startSimulator } = require("./simulator/telemetrySimulator");

const authRoutes = require("./routes/authRoutes");
const machineRoutes = require("./routes/machineRoutes");
const downtimeRoutes = require("./routes/downtimeRoutes");
const oeeRoutes = require("./routes/oeeRoutes");
const userRoutes = require("./routes/userRoutes");
const simulatorRoutes = require("./routes/simulatorRoutes");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // allow local dev clients
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
  },
});

// Make io available inside controllers via req.app.get("io")
app.set("io", io);
registerSocketHandlers(io);

app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (req, res) =>
  res.json({
    status: "ok",
    service: "OEE Monitoring & Predictive Maintenance Platform API",
    time: new Date(),
  })
);

// Feature routes
app.use("/api/auth", authRoutes);
app.use("/api/machines", machineRoutes);
app.use("/api/downtime", downtimeRoutes);
app.use("/api/oee", oeeRoutes);
app.use("/api/users", userRoutes);
app.use("/api/simulator", simulatorRoutes);

// Basic error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err.stack);
  res.status(500).json({ message: "Server error", error: err.message });
});

const PORT = process.env.PORT || 5000;

// Only connect to Mongo + start listening when run directly
if (require.main === module) {
  connectDB().then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 OEE Server running on http://localhost:${PORT}`);
      startSimulator(io);
    });
  });
}

module.exports = { app, server, io };
