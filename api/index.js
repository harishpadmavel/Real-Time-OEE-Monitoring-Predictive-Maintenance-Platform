const connectDB = require("../03-backend-code/config/db");
const { app } = require("../03-backend-code/server");

module.exports = async (req, res) => {
  try {
    if (process.env.MONGO_URI) {
      await connectDB();
    } else {
      console.warn("⚠️ MONGO_URI is not set in Vercel environment variables.");
    }
  } catch (dbErr) {
    console.error("Database connection error in serverless handler:", dbErr.message);
  }

  return app(req, res);
};
