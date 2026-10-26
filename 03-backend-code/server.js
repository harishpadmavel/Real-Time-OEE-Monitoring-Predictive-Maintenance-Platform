require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const path = require("path");
const fs = require("fs");
const { Server } = require("socket.io");
const mongoose = require("mongoose");

const connectDB = require("./config/db");
const registerSocketHandlers = require("./sockets/socketHandler");
const { startSimulator } = require("./simulator/telemetrySimulator");

const authRoutes = require("./routes/authRoutes");
const machineRoutes = require("./routes/machineRoutes");
const downtimeRoutes = require("./routes/downtimeRoutes");
const oeeRoutes = require("./routes/oeeRoutes");
const userRoutes = require("./routes/userRoutes");
const simulatorRoutes = require("./routes/simulatorRoutes");
const shiftRoutes = require("./routes/shiftRoutes");
const productionRoutes = require("./routes/productionRoutes");
const maintenanceRequestRoutes = require("./routes/maintenanceRequestRoutes");
const handoverRoutes = require("./routes/handoverRoutes");
const activityRoutes = require("./routes/activityRoutes");
const seedRoutes = require("./routes/seedRoutes");

// Allowed Origins for Cross-Origin Resource Sharing (CORS)
const allowedOrigins = [
  "https://real-time-oee-monitoring-predictive.vercel.app",
  "https://real-time-oee-monitoring-predictive-maintenance-plat-9omuyq7zw.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://localhost:5000",
  "http://localhost:5001",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5000",
  "http://127.0.0.1:5001",
];

if (process.env.CLIENT_URL) {
  const envUrl = process.env.CLIENT_URL.trim().replace(/\/+$/, "");
  if (!allowedOrigins.includes(envUrl)) allowedOrigins.push(envUrl);
}
if (process.env.FRONTEND_URL) {
  const envUrl = process.env.FRONTEND_URL.trim().replace(/\/+$/, "");
  if (!allowedOrigins.includes(envUrl)) allowedOrigins.push(envUrl);
}

function isOriginAllowed(origin) {
  if (!origin) return true; // Allow non-browser clients (curl, mobile, server-to-server)
  const cleanOrigin = origin.trim().replace(/\/+$/, "");
  if (allowedOrigins.includes(cleanOrigin)) return true;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin)) return true;
  if (/^https:\/\/real-time-oee-monitoring-predictive.*\.vercel\.app$/.test(cleanOrigin)) return true;
  return false;
}

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  optionsSuccessStatus: 200,
};

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  },
});

// Make io available inside controllers via req.app.get("io")
app.set("io", io);
registerSocketHandlers(io);

// CORS middleware runs before all API routes and parsers
app.use(cors(corsOptions));

// Middleware-based OPTIONS preflight handler
// Fully compatible with Express 4 and Express 5 (avoids wildcard path-to-regexp syntax like app.options('*'))
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    // If not already ended by cors(), send 200 OK
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  res.json({
    status: "ok",
    database: isConnected ? "connected" : "disconnected",
    hasMongoUri: Boolean(process.env.MONGO_URI || process.env.MONGO_URL),
    service: "OEE Monitoring & Predictive Maintenance Platform API",
    time: new Date(),
  });
});

// Feature routes
app.use("/api/auth", authRoutes);
app.use("/api/machines", machineRoutes);
app.use("/api/downtime", downtimeRoutes);
app.use("/api/oee", oeeRoutes);
app.use("/api/users", userRoutes);
app.use("/api/simulator", simulatorRoutes);
app.use("/api/shifts", shiftRoutes);
app.use("/api/production", productionRoutes);
app.use("/api/maintenance-requests", maintenanceRequestRoutes);
app.use("/api/handover", handoverRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/seed", seedRoutes);

// Fallback 404 for unmatched /api routes (ensures CORS headers remain intact on 404s)
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ message: "API endpoint not found" });
  }
  next();
});

// Serve static frontend build if present (e.g. Render full-stack deployment)
const frontendDist = path.join(__dirname, "../frontend/dist");
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  // SPA catch-all: serve index.html for non-API routes
  app.use((req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/socket.io")) {
      return next();
    }
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

// Basic error handler: ensures CORS headers are attached even on 500 errors
app.use((err, req, res, next) => {
  const origin = req.headers.origin;
  if (origin && isOriginAllowed(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  console.error("Server error:", err.stack);
  res.status(500).json({ message: "Server error", error: err.message });
});

const PORT = process.env.PORT || 5000;

// Prevent uncaught promise rejections from killing the process
process.on("unhandledRejection", (reason) => {
  console.warn("⚠️ Unhandled Promise Rejection:", reason && reason.message ? reason.message : reason);
});

// Async database initializer with auto-seed and reconnection logic
async function initDatabase() {
  try {
    await connectDB();
    console.log("✅ Database connected successfully");

    // Check if initial seed is needed for a brand new MongoDB instance
    try {
      const User = require("./models/User");
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        console.log("🌱 Fresh database detected. Auto-seeding initial machines and users...");
        const Machine = require("./models/Machine");
        const defaultMachines = [
          { name: "CNC Machining Center A1", type: "CNC", lineId: "LINE-A", idealCycleTimeSeconds: 25, plannedProductionMinutesPerShift: 480, status: "RUNNING", currentShift: { goodUnits: 680, defectiveUnits: 12, totalRunTimeMinutes: 410, totalDowntimeMinutes: 28 } },
          { name: "Stamping Press A2", type: "Press", lineId: "LINE-A", idealCycleTimeSeconds: 15, plannedProductionMinutesPerShift: 480, status: "RUNNING", currentShift: { goodUnits: 1120, defectiveUnits: 34, totalRunTimeMinutes: 388, totalDowntimeMinutes: 52 } },
          { name: "Robotic Welding Cell A3", type: "Welding", lineId: "LINE-A", idealCycleTimeSeconds: 40, plannedProductionMinutesPerShift: 480, status: "DOWN", currentShift: { goodUnits: 385, defectiveUnits: 18, totalRunTimeMinutes: 320, totalDowntimeMinutes: 110 } },
          { name: "Assembly Station A4", type: "Assembly", lineId: "LINE-A", idealCycleTimeSeconds: 60, plannedProductionMinutesPerShift: 480, status: "RUNNING", currentShift: { goodUnits: 295, defectiveUnits: 6, totalRunTimeMinutes: 412, totalDowntimeMinutes: 42 } },
          { name: "Lathe Machine B1", type: "Lathe", lineId: "LINE-B", idealCycleTimeSeconds: 35, plannedProductionMinutesPerShift: 480, status: "RUNNING", currentShift: { goodUnits: 510, defectiveUnits: 9, totalRunTimeMinutes: 445, totalDowntimeMinutes: 20 } },
          { name: "Milling Center B2", type: "Milling", lineId: "LINE-B", idealCycleTimeSeconds: 45, plannedProductionMinutesPerShift: 480, status: "MAINTENANCE", currentShift: { goodUnits: 210, defectiveUnits: 5, totalRunTimeMinutes: 200, totalDowntimeMinutes: 120 } },
          { name: "Grinding Machine B3", type: "CNC", lineId: "LINE-B", idealCycleTimeSeconds: 20, plannedProductionMinutesPerShift: 480, status: "RUNNING", currentShift: { goodUnits: 840, defectiveUnits: 22, totalRunTimeMinutes: 430, totalDowntimeMinutes: 18 } },
          { name: "Quality Inspection B4", type: "Assembly", lineId: "LINE-B", idealCycleTimeSeconds: 30, plannedProductionMinutesPerShift: 480, status: "IDLE", currentShift: { goodUnits: 620, defectiveUnits: 14, totalRunTimeMinutes: 350, totalDowntimeMinutes: 60 } },
          { name: "E-Coat Paint System C1", type: "Painting", lineId: "LINE-C", idealCycleTimeSeconds: 90, plannedProductionMinutesPerShift: 480, status: "RUNNING", currentShift: { goodUnits: 188, defectiveUnits: 9, totalRunTimeMinutes: 395, totalDowntimeMinutes: 65 } },
          { name: "Powder Coating Unit C2", type: "Painting", lineId: "LINE-C", idealCycleTimeSeconds: 75, plannedProductionMinutesPerShift: 480, status: "RUNNING", currentShift: { goodUnits: 240, defectiveUnits: 7, totalRunTimeMinutes: 420, totalDowntimeMinutes: 35 } },
          { name: "Robotic Paint Arm C3", type: "Robot", lineId: "LINE-C", idealCycleTimeSeconds: 55, plannedProductionMinutesPerShift: 480, status: "RUNNING", currentShift: { goodUnits: 480, defectiveUnits: 11, totalRunTimeMinutes: 460, totalDowntimeMinutes: 10 } },
          { name: "Curing Oven C4", type: "Other", lineId: "LINE-C", idealCycleTimeSeconds: 120, plannedProductionMinutesPerShift: 480, status: "IDLE", currentShift: { goodUnits: 140, defectiveUnits: 4, totalRunTimeMinutes: 290, totalDowntimeMinutes: 90 } },
          { name: "Conveyor Assembly D1", type: "Conveyor", lineId: "LINE-D", idealCycleTimeSeconds: 50, plannedProductionMinutesPerShift: 480, status: "RUNNING", currentShift: { goodUnits: 550, defectiveUnits: 15, totalRunTimeMinutes: 440, totalDowntimeMinutes: 22 } },
          { name: "Torque Robot D2", type: "Robot", lineId: "LINE-D", idealCycleTimeSeconds: 22, plannedProductionMinutesPerShift: 480, status: "RUNNING", currentShift: { goodUnits: 960, defectiveUnits: 28, totalRunTimeMinutes: 455, totalDowntimeMinutes: 12 } },
          { name: "Final QC Station D3", type: "Assembly", lineId: "LINE-D", idealCycleTimeSeconds: 70, plannedProductionMinutesPerShift: 480, status: "DOWN", currentShift: { goodUnits: 320, defectiveUnits: 20, totalRunTimeMinutes: 360, totalDowntimeMinutes: 95 } },
          { name: "Packaging Robot D4", type: "Robot", lineId: "LINE-D", idealCycleTimeSeconds: 18, plannedProductionMinutesPerShift: 480, status: "RUNNING", currentShift: { goodUnits: 1100, defectiveUnits: 18, totalRunTimeMinutes: 465, totalDowntimeMinutes: 8 } },
        ];
        const created = await Machine.insertMany(defaultMachines);
        const allIds = created.map((m) => m._id);
        await User.create([
          { name: "Admin User", email: "admin@oee.local", password: "admin123", role: "ADMIN" },
          { name: "Plant Manager", email: "manager@oee.local", password: "manager123", role: "MANAGER" },
          { name: "Line Supervisor A", email: "supervisor@oee.local", password: "super123", role: "SUPERVISOR", assignedLineId: "LINE-A" },
          { name: "Line Supervisor B", email: "supervisorb@oee.local", password: "super123", role: "SUPERVISOR", assignedLineId: "LINE-B" },
          { name: "Maintenance Tech", email: "maintenance@oee.local", password: "maint123", role: "MAINTENANCE" },
          { name: "Shop Operator (All Access)", email: "operator@oee.local", password: "oper123", role: "OPERATOR", assignedLineId: "LINE-A", assignedMachines: allIds },
        ]);
        console.log("🌱 Auto-seeding completed with default demo accounts.");
      }
    } catch (seedErr) {
      console.warn("Auto-seed notice:", seedErr.message);
    }

    startSimulator(io);
  } catch (err) {
    console.error("⚠️ MongoDB connection error:", err.message);
    console.warn("⚠️ Server is running and frontend is active. To enable database persistence, please ensure MONGO_URI is set in your Render Environment Variables and Atlas Network Access includes 0.0.0.0/0.");
    // Retry connection after 15 seconds
    setTimeout(initDatabase, 15000);
  }
}

// Start HTTP server immediately so Render passes port detection and health checks
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`🚀 OEE Server running on http://localhost:${PORT}`);
    initDatabase();
  });
}

module.exports = { app, server, io };
