const mongoose = require("mongoose");

let isConnected = false;

async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }
  const uri = process.env.MONGO_URI || process.env.MONGO_URL || "mongodb://127.0.0.1:27017/oee_platform";
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    const safeUri = uri.includes("@") ? uri.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@") : uri;
    console.log("MongoDB connected:", safeUri);
    return conn;
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    if (require.main === module) {
      process.exit(1);
    }
    throw err;
  }
}

module.exports = connectDB;
